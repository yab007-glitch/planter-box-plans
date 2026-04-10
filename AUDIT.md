# 🪵 Woodworking Pro — Full Audit Report
**Date:** 2026-04-09  
**Auditor:** KEYS  
**Scope:** Complete codebase, UI/UX, data integrity, security, performance, and feature completeness

---

## 📊 Executive Summary

| Area | Grade | Status |
|------|-------|--------|
| **Data Integrity** | ⚠️ C+ | Issues |
| **UI/UX** | ✅ B+ | Good |
| **JavaScript Logic** | ⚠️ C | Bugs found |
| **Server/API** | ⚠️ C+ | Needs hardening |
| **Security** | ❌ D | Vulnerable |
| **Performance** | ⚠️ C | Optimizable |
| **Accessibility** | ⚠️ C+ | Partial |
| **SEO** | ❌ D | Not addressed |

**Overall: C — Functional but needs significant fixes before production.**

---

## 🔴 Critical Issues (Must Fix)

### 1. DATA: `profit` field contradicts `profitRange`
**Files:** `data/projects.json`, `app.js`

Many projects have a `profitRange` of `"$50-$100"` but `profit: 1500`. Example:
- Project `proj_1775750147357_0`: `profitCategory: "$500+ Profit Per Project"` but `profit: 1500`, `profitMargin: 96`
- The `getProfitRange()` function in `app.js` calculates range from the raw `profit` number, not from `profitRange`/`profitCategory`

**Fix:** Decide one source of truth — either use `profitCategory` from the data or compute from `profit`. Currently they disagree.

### 2. DATA: `sellingPrice` values are unrealistic
Multiple projects show wildly inflated selling prices:
- `materialCost: 50`, `sellingPrice: 1560`, `profit: 1500` — a 3000% markup on a "Living Wall"?
- `materialCost: 15`, `sellingPrice: 65` is realistic
- `materialCost: 50`, `sellingPrice: 1560` is fantasy

**Fix:** Audit all 200 projects for realistic pricing. The PDF extract script likely hallucinated prices from PDFs that don't contain pricing.

### 3. SECURITY: No input sanitization on API
**File:** `server.js`

```js
app.get('/api/trends', async (req, res) => {
  const { postalCode, radius = 25 } = req.query;
```

`postalCode` is used directly in `getPostalCodePrefix()` and logged. No validation beyond existence check. A malicious input could:
- Cause regex DoS in `getPostalCodePrefix()`
- Pass through to error messages revealing server internals

**Fix:** Add strict validation:
```js
const POSTAL_REGEX = /^[A-Z]\d[A-Z]\d[A-Z]\d$/i; // Canadian
const ZIP_REGEX = /^\d{5}$/; // US
if (!POSTAL_REGEX.test(postalCode) && !ZIP_REGEX.test(postalCode)) {
  return res.status(400).json({ error: 'Invalid postal code format' });
}
```

### 4. SECURITY: No rate limiting on API endpoints
**File:** `server.js`

No rate limiting at all. Google Trends API calls are unbounded — an attacker could hammer `/api/trends` and burn through Google's rate limit or cause server CPU spikes from concurrent trend fetches.

**Fix:** Add `express-rate-limit`:
```js
const rateLimit = require('express-rate-limit');
app.use('/api/', rateLimit({ windowMs: 60000, max: 30 }));
```

### 5. BUG: `project.title` doesn't exist — it's `project.name`
**File:** `app.js`, multiple locations

The projects.json uses `"title"` for some extracted projects but the HTML template references `project.title`:
```js
<h3 class="project-title">${project.title}</h3>
```

But looking at the JSON data, the field is `"title"`. However in the `loadProjects()` mapping:
```js
state.projects = data.map((project, index) => ({
  ...project,
  // no explicit .title mapping
}));
```

Some projects may have `"name"` instead of `"title"` depending on extraction date. Need to normalize.

**Fix:** Add normalization in `loadProjects()`:
```js
title: project.title || project.name || 'Untitled Project',
```

---

## 🟡 Major Issues (Should Fix)

### 6. BUG: Compare charts are placeholder text
**File:** `app.js` lines ~680-690

```js
document.getElementById('compare-chart-time').querySelector('.chart-area').innerHTML = 
  '<div style="padding: 20px; color: var(--warm-gray);"><i class="fas fa-info-circle"></i> Time comparison chart would render here</div>';
```

Two of three compare charts show "would render here" — this is unfinished. Either implement them or remove the chart placeholders.

### 7. BUG: Material costs in app.js are hardcoded, not from API
**File:** `app.js` — `renderMaterials()`

The function renders a hardcoded array of 10 materials with USD-like prices, completely ignoring the `state.materialCosts` data fetched from `/api/material-costs` (which has CAD pricing by region). The fetch happens but results are never used.

**Fix:** Use `state.materialCosts` data:
```js
function renderMaterials() {
  if (state.materialCosts && state.materialCosts.materials) {
    // render from API data
  } else {
    // fallback to hardcoded
  }
}
```

### 8. BUG: Seasonal data from API is never rendered
**File:** `app.js`

`fetchSeasonalData()` stores data in `state.seasonalData` but `renderSeasonal()` uses a hardcoded array of 12 months. The API response with demand scores is ignored.

### 9. BUG: `project.relativePath` may not work for PDF viewing
**File:** `app.js` — `openPdf()`

```js
const pdfPath = `../${project.relativePath}`;
```

The PDFs are in sibling directories (`$50-$100 Profit Per Project/`, etc.) relative to `web-catalog/`. The `../` prefix navigates up from `web-catalog/` to the parent `Planter Box Plans/` directory. This only works if the server's static file serving includes the parent directory. Currently, Express only serves from `web-catalog/`:
```js
app.use(express.static(path.join(__dirname)));
```

PDF paths like `../$50 - $100 - Easy/Kreg Tool - Simple Planter Box Plan.pdf` won't resolve — the server won't serve files outside its static directory.

**Fix:** Either:
- Serve the parent directory too: `app.use('/plans', express.static(path.join(__dirname, '..')));`
- Or copy PDFs into a served directory
- Or add a dedicated PDF route

### 10. PERFORMANCE: No pagination — 200 cards rendered at once
**File:** `app.js` — `renderProjects()`

All 200 projects render simultaneously in the DOM. With animations and event listeners on each card, this causes:
- Slow initial render
- High memory usage
- Janky scrolling

**Fix:** Add virtual scrolling or pagination (20-30 per page).

### 11. PERFORMANCE: Google Trends API calls are sequential
**File:** `server.js`

```js
const trendsPromises = woodworkingTerms.map(term => 
  fetchGoogleTrends(geoData.geo, term).catch(() => null)
);
```

This fires 10 simultaneous requests to Google Trends. While `Promise.all` is used (good), Google Trends API rate limits aggressively — 10 concurrent requests will likely hit 429 errors.

**Fix:** Batch requests with small delays (200ms between each), or use a single request with multiple keywords.

### 12. UI: No loading states for async data
**Files:** `app.js`

When fetching trends, seasonal data, or material costs, there's no loading indicator. The sections either show empty or stale data until the fetch completes.

**Fix:** Add skeleton loaders or spinners for trending, heatmap, and materials sections.

### 13. UI: Heatmap click doesn't scroll correctly
**File:** `app.js` — `filterByCategory()`

```js
document.getElementById('sort-controls').scrollIntoView({ behavior: 'smooth' });
```

After filtering by a heatmap category, the page scrolls to the sort controls but the user doesn't see which projects matched. No visual confirmation that the filter was applied.

---

## 🟢 Minor Issues (Nice to Fix)

### 14. Accessibility: Focus management missing on modals
When modals open, focus isn't trapped inside. Keyboard users can tab to elements behind the modal. Close on Escape works but focus isn't returned to the trigger button.

### 15. Accessibility: No ARIA live regions for dynamic content
The trending grid, heatmap, and project count update dynamically but there's no `aria-live` region to announce changes to screen readers.

### 16. CSS: `font-family: 'Font Awesome 6 Free'` in checkbox hack
**File:** `styles.css`

```css
.checkbox input[type="checkbox"]:checked::after {
  content: '\f00c';
  font-family: 'Font Awesome 6 Free';
```

This relies on Font Awesome being loaded and the exact font name matching. If FA fails to load (CSP, network), checkmarks show as empty squares.

### 17. Data: `tools` field inconsistent
Some projects have `["basic woodworking tools"]` (vague string), others have `["Drill", "Circular Saw", "Tape Measure"]` (specific). The filter sidebar lists all tools alphabetically — "basic woodworking tools" appears as a filterable option, which is useless.

**Fix:** Either normalize vague tool entries or exclude them from the filter.

### 18. SEO: No meta tags for social sharing
No Open Graph tags, no Twitter Card tags, no structured data. The page has a basic `description` meta tag but nothing else.

### 19. Server: `state.projects` defined after `app.listen()`
**File:** `server.js`

The `state` object is defined AFTER `app.listen()`. While JavaScript hoisting makes this work (it's in the same scope), it's confusing and would break if refactored to modules.

### 20. Server: No CORS origin restriction
```js
app.use(cors());
```

This allows any origin to call the API. Should restrict to the app's domain in production.

### 21. Server: `/api/material-costs` returns 400 without postal code
But the frontend calls it with a default. Should accept a default or the frontend should handle the error.

### 22. CSS: Dark mode heatmap colors not adjusted
The heatmap uses fixed green/orange/red colors that work fine in light mode but in dark mode, `--heat-low: #E8F5E9` becomes near-invisible on the dark `--warm-white: #1A1815` background.

### 23. JS: `generateFallbackTrends()` uses `Math.random()`
This means every time fallback trends are generated, the data changes. This causes visual jitter if trends are re-fetched. Should use deterministic pseudo-random based on category name.

### 24. JS: No error boundary for project card rendering
If a project has malformed data (missing fields), the entire `renderProjects()` call fails with a template literal error. Individual card rendering should be wrapped in try/catch.

### 25. HTML: `data-theme` only on `<html>`, not on `<body>`
The dark mode CSS uses `[data-theme="dark"]` selectors. The attribute is on `<html>` which is correct, but some selectors target `body` children specifically. Not a bug, but worth being consistent.

---

## 📐 Architecture Issues

### 26. No build system
The app serves raw HTML/CSS/JS. No bundler (Vite, Webpack), no minification, no tree-shaking. For a production app:
- CSS is 987 lines, JS is 1009 lines — both should be minified
- No code splitting — everything loads upfront
- No cache busting — `styles.css?v=1.0.0` pattern needed

### 27. No environment configuration
Hardcoded port (3000), no `.env` support. API URLs are relative (`/api/...`) which works when served from the same server but breaks if frontend is deployed separately (e.g., Vercel).

### 28. No database
Projects are loaded from a JSON file on every server start. Material costs are hardcoded mock data. In production:
- Projects should be in a database (SQLite at minimum)
- Material costs should be scraped/updated periodically
- User preferences (saved filters, compare lists) need persistence

### 29. No authentication
Any user can access all API endpoints. No concept of user sessions, saved projects, or personalized data.

### 30. No testing
Zero test files. No unit tests, no integration tests, no E2E tests.

---

## 🎯 Recommendations (Priority Order)

| # | Priority | Action | Effort |
|---|----------|--------|--------|
| 1 | 🔴 Critical | Fix data integrity — audit all 200 projects for realistic pricing | 2-3 hrs |
| 2 | 🔴 Critical | Add input validation to all API endpoints | 1 hr |
| 3 | 🔴 Critical | Add rate limiting to API | 30 min |
| 4 | 🔴 Critical | Fix `project.title` / `project.name` inconsistency | 30 min |
| 5 | 🟡 Major | Wire up API data (materials, seasonal) to render functions | 2 hrs |
| 6 | 🟡 Major | Fix PDF serving — add route for parent directory | 30 min |
| 7 | 🟡 Major | Implement compare charts or remove placeholders | 2 hrs |
| 8 | 🟡 Major | Add pagination (20-30 per page) | 2 hrs |
| 9 | 🟡 Major | Add loading states for async sections | 1 hr |
| 10 | 🟡 Major | Dark mode heatmap color adjustments | 30 min |
| 11 | 🟢 Minor | Add ARIA live regions and focus trapping | 1 hr |
| 12 | 🟢 Minor | Normalize tool entries in data | 1 hr |
| 13 | 🟢 Minor | Add OG/Twitter meta tags | 30 min |
| 14 | 🟢 Minor | Add deterministic fallback trends | 15 min |
| 15 | 🟢 Minor | Add error boundary for card rendering | 30 min |

---

## ✅ What's Working Well

- **Design system** — The CSS variable system is well-organized with wood-tone palette
- **Dark mode** — Properly implemented with `[data-theme="dark"]` selectors
- **Filter system** — Comprehensive: category, difficulty, profit, time, tools, search, location
- **Responsive breakpoints** — 4 breakpoints (1200, 992, 768, 480) cover most devices
- **Export functionality** — CSV, JSON, Print, Share link all functional
- **Server structure** — Clean Express setup with proper error handling
- **Google Trends integration** — Good architecture with fallback to mock data
- **Calculator** — Time-to-profit concept is useful and functional
- **Quick-start guide** — Good beginner content with actionable tips

---

*Generated by KEYS 🔑 — 2026-04-09*