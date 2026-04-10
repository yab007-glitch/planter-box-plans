/**
 * Woodworking Pro - App Logic
 * Complete JavaScript functionality for the profit calculator
 */

// ========================================
// STATE MANAGEMENT
// ========================================
const state = {
  projects: [],
  filteredProjects: [],
  compareList: [],
  filters: {
    categories: [],
    difficulties: ['Easy', 'Intermediate', 'Expert'],
    profitRanges: ['$50-$100', '$100-$200', '$200-$500', '$500+'],
    minHours: null,
    maxHours: null,
    tools: [],
    search: ''
  },
  sort: 'profit-desc',
  view: 'grid',
  trendsData: null,
  seasonalData: null,
  materialCosts: null,
  location: {
    postalCode: '',
    radius: 25
  },
  activeFilters: []
};

// ========================================
// DOM ELEMENTS
// ========================================
const elements = {
  // Containers
  projectsContainer: document.getElementById('projects-container'),
  trendingGrid: document.getElementById('trending-grid'),
  topPicksGrid: document.getElementById('top-picks-grid'),
  heatmapGrid: document.getElementById('heatmap-grid'),
  seasonalContent: document.getElementById('seasonal-content'),
  materialsContent: document.getElementById('materials-content'),
  activeFilters: document.getElementById('active-filters'),
  categoryFilters: document.getElementById('category-filters'),
  toolsFilters: document.getElementById('tools-filters'),
  
  // Stats
  totalProjects: document.getElementById('total-projects'),
  totalProfit: document.getElementById('total-profit'),
  totalHours: document.getElementById('total-hours'),
  avgRoi: document.getElementById('avg-roi'),
  resultsCount: document.getElementById('results-count'),
  
  // Inputs
  searchInput: document.getElementById('search-input'),
  minHours: document.getElementById('min-hours'),
  maxHours: document.getElementById('max-hours'),
  postalCode: document.getElementById('postal-code'),
  radius: document.getElementById('radius'),
  radiusValue: document.getElementById('radius-value'),
  sortSelect: document.getElementById('sort-select'),
  
  // Buttons
  mobileMenuBtn: document.getElementById('mobile-menu-btn'),
  sidebarCloseBtn: document.getElementById('sidebar-close-btn'),
  darkModeToggle: document.getElementById('dark-mode-toggle'),
  darkModeIcon: document.getElementById('dark-mode-icon'),
  clearFilters: document.getElementById('clear-filters'),
  applyLocation: document.getElementById('apply-location'),
  exportBtn: document.getElementById('export-btn'),
  calcCalculate: document.getElementById('calc-calculate'),
  
  // View buttons
  navButtons: document.querySelectorAll('.nav-btn[data-view]'),
  
  // Modals
  pdfModal: document.getElementById('pdf-modal'),
  detailModal: document.getElementById('detail-modal'),
  compareModal: document.getElementById('compare-modal'),
  exportModal: document.getElementById('export-modal'),
  
  // Modal content
  modalTitle: document.getElementById('modal-title'),
  pdfViewer: document.getElementById('pdf-viewer'),
  detailContent: document.getElementById('detail-content'),
  compareContent: document.getElementById('compare-content'),
  
  // Modal close buttons
  closePdfModal: document.getElementById('close-pdf-modal'),
  closeDetailModal: document.getElementById('close-detail-modal'),
  closeCompareModal: document.getElementById('close-compare-modal'),
  closeExportModal: document.getElementById('close-export-modal'),
  
  // Export buttons
  exportCsv: document.getElementById('export-csv'),
  exportJson: document.getElementById('export-json'),
  exportPrint: document.getElementById('export-print'),
  exportCopyLink: document.getElementById('export-copy-link'),
  
  // Sidebar
  sidebar: document.getElementById('sidebar'),
  
  // Filter toggles
  filterToggles: document.querySelectorAll('.filter-toggle')
};

// ========================================
// INITIALIZATION
// ========================================
document.addEventListener('DOMContentLoaded', async () => {
  await loadProjects();
  initializeFilters();
  initializeEventListeners();
  loadSavedPreferences();
  renderAll();
  animateStats();
  fetchTrendsData();
  fetchSeasonalData();
  fetchMaterialCosts();
});

// ========================================
// DATA LOADING
// ========================================
async function loadProjects() {
  try {
    const response = await fetch('data/projects.json');
    const data = await response.json();
    state.projects = data.map((project, index) => ({
      ...project,
      id: project.id || `proj_${index}`,
      profit: project.profit || (project.sellingPrice - project.materialCost) || 0,
      roi: project.profitMargin || calculateROI(project),
      hourlyRate: project.profit && project.estimatedHours 
        ? Math.round(project.profit / project.estimatedHours) 
        : 0
    }));
    state.filteredProjects = [...state.projects];
    updateStats();
  } catch (error) {
    console.error('Failed to load projects:', error);
    showError('Failed to load projects. Please refresh the page.');
  }
}

function calculateROI(project) {
  if (!project.materialCost || project.materialCost === 0) return 0;
  const profit = project.profit || (project.sellingPrice - project.materialCost) || 0;
  return Math.round((profit / project.materialCost) * 100);
}

// ========================================
// FILTER INITIALIZATION
// ========================================
function initializeFilters() {
  // Populate category filters
  const categories = [...new Set(state.projects.map(p => p.category))].sort();
  state.filters.categories = categories;
  
  elements.categoryFilters.innerHTML = categories.map(cat => `
    <label class="checkbox">
      <input type="checkbox" value="${cat}" checked data-filter="category">
      <span class="checkmark"></span>
      <span>${cat}</span>
    </label>
  `).join('');
  
  // Collect all unique tools
  const allTools = new Set();
  state.projects.forEach(p => {
    if (p.tools) {
      p.tools.forEach(tool => allTools.add(tool));
    }
  });
  
  const tools = [...allTools].sort();
  elements.toolsFilters.innerHTML = tools.map(tool => `
    <label class="checkbox">
      <input type="checkbox" value="${tool}" data-filter="tool">
      <span class="checkmark"></span>
      <span>${tool}</span>
    </label>
  `).join('');
}

// ========================================
// EVENT LISTENERS
// ========================================
function initializeEventListeners() {
  // Mobile menu
  elements.mobileMenuBtn.addEventListener('click', toggleSidebar);
  elements.sidebarCloseBtn.addEventListener('click', closeSidebar);
  
  // Dark mode
  elements.darkModeToggle.addEventListener('click', toggleDarkMode);
  
  // Filters
  elements.clearFilters.addEventListener('click', clearAllFilters);
  elements.searchInput.addEventListener('input', debounce(handleSearch, 300));
  
  // Category filters
  elements.categoryFilters.addEventListener('change', handleCategoryFilter);
  
  // Difficulty filters
  document.getElementById('difficulty-filters').addEventListener('change', handleDifficultyFilter);
  
  // Profit range filters
  document.getElementById('profit-filters').addEventListener('change', handleProfitFilter);
  
  // Time filters
  elements.minHours.addEventListener('input', debounce(handleTimeFilter, 300));
  elements.maxHours.addEventListener('input', debounce(handleTimeFilter, 300));
  
  // Tool filters
  elements.toolsFilters.addEventListener('change', handleToolFilter);
  
  // Location
  elements.radius.addEventListener('input', (e) => {
    elements.radiusValue.textContent = e.target.value;
  });
  elements.applyLocation.addEventListener('click', handleLocationApply);
  
  // Sort
  elements.sortSelect.addEventListener('change', handleSort);
  
  // View toggle
  elements.navButtons.forEach(btn => {
    btn.addEventListener('click', () => handleViewChange(btn.dataset.view));
  });
  
  // Filter toggles (collapsible sections)
  elements.filterToggles.forEach(toggle => {
    toggle.addEventListener('click', () => toggleFilterSection(toggle));
  });
  
  // Export
  elements.exportBtn.addEventListener('click', () => openModal('export-modal'));
  elements.exportCsv.addEventListener('click', exportCSV);
  elements.exportJson.addEventListener('click', exportJSON);
  elements.exportPrint.addEventListener('click', exportPrint);
  elements.exportCopyLink.addEventListener('click', copyShareableLink);
  
  // Calculator
  elements.calcCalculate.addEventListener('click', calculateTimeToProfit);
  
  // Modal close buttons
  elements.closePdfModal.addEventListener('click', () => closeModal('pdf-modal'));
  elements.closeDetailModal.addEventListener('click', () => closeModal('detail-modal'));
  elements.closeCompareModal.addEventListener('click', () => closeModal('compare-modal'));
  elements.closeExportModal.addEventListener('click', () => closeModal('export-modal'));
  
  // Close modals on overlay click
  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', (e) => {
      e.target.closest('.modal').classList.remove('active');
    });
  });
  
  // Keyboard shortcuts
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      document.querySelectorAll('.modal.active').forEach(modal => {
        modal.classList.remove('active');
      });
    }
  });
}

// ========================================
// FILTER HANDLERS
// ========================================
function handleCategoryFilter(e) {
  const checkboxes = elements.categoryFilters.querySelectorAll('input[type="checkbox"]');
  state.filters.categories = [...checkboxes]
    .filter(cb => cb.checked)
    .map(cb => cb.value);
  applyFilters();
}

function handleDifficultyFilter(e) {
  const checkboxes = document.querySelectorAll('#difficulty-filters input[type="checkbox"]');
  state.filters.difficulties = [...checkboxes]
    .filter(cb => cb.checked)
    .map(cb => cb.value);
  applyFilters();
}

function handleProfitFilter(e) {
  const checkboxes = document.querySelectorAll('#profit-filters input[type="checkbox"]');
  state.filters.profitRanges = [...checkboxes]
    .filter(cb => cb.checked)
    .map(cb => cb.value);
  applyFilters();
}

function handleTimeFilter() {
  state.filters.minHours = elements.minHours.value ? parseInt(elements.minHours.value) : null;
  state.filters.maxHours = elements.maxHours.value ? parseInt(elements.maxHours.value) : null;
  applyFilters();
}

function handleToolFilter(e) {
  const checkboxes = elements.toolsFilters.querySelectorAll('input[type="checkbox"]');
  state.filters.tools = [...checkboxes]
    .filter(cb => cb.checked)
    .map(cb => cb.value);
  applyFilters();
}

function handleSearch() {
  state.filters.search = elements.searchInput.value.toLowerCase().trim();
  applyFilters();
}

async function handleLocationApply() {
  const postalCode = elements.postalCode.value.trim();
  const radius = parseInt(elements.radius.value);
  
  if (!postalCode) {
    showError('Please enter a postal code');
    return;
  }
  
  state.location = { postalCode, radius };
  
  // Update trending badge
  document.getElementById('trending-location').textContent = `${postalCode} (${radius}km radius)`;
  
  // Fetch new trends data
  await fetchTrendsData(postalCode, radius);
  renderTrending();
  renderHeatmap();
}

function handleSort() {
  state.sort = elements.sortSelect.value;
  sortProjects();
  renderProjects();
}

function handleViewChange(view) {
  state.view = view;
  
  // Update active button
  elements.navButtons.forEach(btn => {
    btn.classList.toggle('active', btn.dataset.view === view);
  });
  
  // Update container class
  elements.projectsContainer.classList.toggle('list-view', view === 'list');
  
  renderProjects();
}

function toggleFilterSection(toggle) {
  const expanded = toggle.getAttribute('aria-expanded') === 'true';
  toggle.setAttribute('aria-expanded', !expanded);
  
  const content = document.getElementById(toggle.getAttribute('aria-controls'));
  content.classList.toggle('collapsed', expanded);
}

// ========================================
// FILTER LOGIC
// ========================================
function applyFilters() {
  state.filteredProjects = state.projects.filter(project => {
    // Category filter
    if (!state.filters.categories.includes(project.category)) return false;
    
    // Difficulty filter
    if (!state.filters.difficulties.includes(project.difficulty)) return false;
    
    // Profit range filter
    const profitRange = getProfitRange(project.profit);
    if (!state.filters.profitRanges.includes(profitRange)) return false;
    
    // Time filter
    if (state.filters.minHours && project.estimatedHours < state.filters.minHours) return false;
    if (state.filters.maxHours && project.estimatedHours > state.filters.maxHours) return false;
    
    // Tools filter
    if (state.filters.tools.length > 0) {
      const hasTool = state.filters.tools.some(tool => 
        project.tools && project.tools.includes(tool)
      );
      if (!hasTool) return false;
    }
    
    // Search filter
    if (state.filters.search) {
      const searchTerms = state.filters.search.split(' ');
      const projectText = `${project.title} ${project.category} ${project.source} ${project.description || ''}`.toLowerCase();
      const matches = searchTerms.every(term => projectText.includes(term));
      if (!matches) return false;
    }
    
    return true;
  });
  
  sortProjects();
  renderProjects();
  updateActiveFilters();
  updateStats();
}

function getProfitRange(profit) {
  if (!profit || profit < 100) return '$50-$100';
  if (profit < 200) return '$100-$200';
  if (profit < 500) return '$200-$500';
  return '$500+';
}

function sortProjects() {
  const [field, direction] = state.sort.split('-');
  
  state.filteredProjects.sort((a, b) => {
    let valA, valB;
    
    switch (field) {
      case 'profit':
        valA = a.profit || 0;
        valB = b.profit || 0;
        break;
      case 'hours':
        valA = a.estimatedHours || 0;
        valB = b.estimatedHours || 0;
        break;
      case 'roi':
        valA = a.roi || 0;
        valB = b.roi || 0;
        break;
      case 'demand':
        valA = calculateDemandScore(a);
        valB = calculateDemandScore(b);
        break;
      case 'difficulty':
        const diffOrder = { 'Easy': 1, 'Intermediate': 2, 'Expert': 3 };
        valA = diffOrder[a.difficulty] || 0;
        valB = diffOrder[b.difficulty] || 0;
        break;
      default:
        valA = a.profit || 0;
        valB = b.profit || 0;
    }
    
    if (direction === 'asc') return valA - valB;
    return valB - valA;
  });
}

function calculateDemandScore(project) {
  if (state.trendsData && state.trendsData[project.category]) {
    return state.trendsData[project.category].score || 50;
  }
  // Fallback: use profit margin as proxy for demand
  return project.roi || 50;
}

function clearAllFilters() {
  // Reset filter state
  state.filters = {
    categories: [...new Set(state.projects.map(p => p.category))],
    difficulties: ['Easy', 'Intermediate', 'Expert'],
    profitRanges: ['$50-$100', '$100-$200', '$200-$500', '$500+'],
    minHours: null,
    maxHours: null,
    tools: [],
    search: ''
  };
  
  // Reset inputs
  elements.searchInput.value = '';
  elements.minHours.value = '';
  elements.maxHours.value = '';
  
  // Reset checkboxes
  document.querySelectorAll('.checkbox input[type="checkbox"]').forEach(cb => {
    cb.checked = cb.dataset.filter !== 'tool';
  });
  
  applyFilters();
}

function updateActiveFilters() {
  const tags = [];
  
  // Add active filter tags
  if (state.filters.search) {
    tags.push({ type: 'search', label: `Search: "${state.filters.search}"` });
  }
  
  if (state.filters.minHours || state.filters.maxHours) {
    const min = state.filters.minHours || '0';
    const max = state.filters.maxHours || '∞';
    tags.push({ type: 'time', label: `Time: ${min}-${max} hrs` });
  }
  
  if (state.filters.tools.length > 0) {
    tags.push({ type: 'tools', label: `Tools: ${state.filters.tools.length} selected` });
  }
  
  elements.activeFilters.innerHTML = tags.map(tag => `
    <span class="filter-tag" data-type="${tag.type}">
      ${tag.label}
      <button onclick="removeFilter('${tag.type}')" aria-label="Remove filter">
        <i class="fas fa-times"></i>
      </button>
    </span>
  `).join('');
}

function removeFilter(type) {
  switch (type) {
    case 'search':
      state.filters.search = '';
      elements.searchInput.value = '';
      break;
    case 'time':
      state.filters.minHours = null;
      state.filters.maxHours = null;
      elements.minHours.value = '';
      elements.maxHours.value = '';
      break;
    case 'tools':
      state.filters.tools = [];
      elements.toolsFilters.querySelectorAll('input').forEach(cb => cb.checked = false);
      break;
  }
  applyFilters();
}

// ========================================
// RENDER FUNCTIONS
// ========================================
function renderAll() {
  renderProjects();
  renderTrending();
  renderTopPicks();
  renderHeatmap();
  renderSeasonal();
  renderMaterials();
}

function renderProjects() {
  if (state.filteredProjects.length === 0) {
    elements.projectsContainer.innerHTML = `
      <div class="empty-state" style="grid-column: 1 / -1;">
        <i class="fas fa-search"></i>
        <h3>No projects found</h3>
        <p>Try adjusting your filters to see more results</p>
      </div>
    `;
    return;
  }
  
  elements.projectsContainer.innerHTML = state.filteredProjects.map(project => `
    <article class="project-card animate-fadeInUp" data-category="${project.category}" data-id="${project.id}">
      <div class="project-header">
        <span class="project-category">${project.category}</span>
        <h3 class="project-title">${project.title}</h3>
        <span class="project-source"><i class="fas fa-building"></i> ${project.source}</span>
      </div>
      <div class="project-body">
        <div class="project-stats">
          <div class="project-stat">
            <span class="project-stat-label">Profit</span>
            <span class="project-stat-value profit">$${project.profit || 0}</span>
          </div>
          <div class="project-stat">
            <span class="project-stat-label">Time</span>
            <span class="project-stat-value">${project.estimatedHours || 0} hrs</span>
          </div>
          <div class="project-stat">
            <span class="project-stat-label">ROI</span>
            <span class="project-stat-value roi">${project.roi || 0}%</span>
          </div>
          <div class="project-stat">
            <span class="project-stat-label">Hourly</span>
            <span class="project-stat-value">$${project.hourlyRate || 0}/hr</span>
          </div>
        </div>
        <span class="difficulty-badge ${project.difficulty.toLowerCase()}">
          <i class="fas fa-signal"></i> ${project.difficulty}
        </span>
      </div>
      <div class="project-footer">
        <button class="btn-project btn-view" onclick="viewProject('${project.id}')">
          <i class="fas fa-eye"></i> View
        </button>
        <button class="btn-project btn-compare" onclick="addToCompare('${project.id}')">
          <i class="fas fa-balance-scale"></i> Compare
        </button>
      </div>
    </article>
  `).join('');
}

function renderTrending() {
  if (!state.trendsData) {
    elements.trendingGrid.innerHTML = `
      <div class="empty-state" style="grid-column: 1 / -1;">
        <i class="fas fa-chart-line"></i>
        <p>Enter your location to see trending data</p>
      </div>
    `;
    return;
  }
  
  const trends = Object.entries(state.trendsData)
    .sort((a, b) => b[1].score - a[1].score)
    .slice(0, 6);
  
  elements.trendingGrid.innerHTML = trends.map(([category, data]) => {
    const trendClass = data.trend > 10 ? 'up' : data.trend < -10 ? 'down' : 'stable';
    const trendIcon = data.trend > 10 ? 'arrow-up' : data.trend < -10 ? 'arrow-down' : 'minus';
    
    return `
      <div class="trend-card ${trendClass}">
        <div class="trend-header">
          <span class="trend-category">${category}</span>
          <span class="trend-indicator ${trendClass}">
            <i class="fas fa-${trendIcon}"></i> ${Math.abs(data.trend)}%
          </span>
        </div>
        <div class="trend-volume">Search Volume: ${data.volume || 'N/A'}</div>
        <div class="trend-sparkline" data-sparkline="${category}"></div>
      </div>
    `;
  }).join('');
}

function renderTopPicks() {
  // Sort by ROI * Demand Score
  const topPicks = [...state.projects]
    .map(p => ({
      ...p,
      score: (p.roi || 0) * (calculateDemandScore(p) / 100)
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 6);
  
  elements.topPicksGrid.innerHTML = topPicks.map(project => `
    <article class="project-card" data-category="${project.category}">
      <div class="project-header">
        <span class="project-category">${project.category}</span>
        <h3 class="project-title">${project.title}</h3>
        <span class="project-source"><i class="fas fa-building"></i> ${project.source}</span>
      </div>
      <div class="project-body">
        <div class="project-stats">
          <div class="project-stat">
            <span class="project-stat-label">Profit</span>
            <span class="project-stat-value profit">$${project.profit || 0}</span>
          </div>
          <div class="project-stat">
            <span class="project-stat-label">ROI</span>
            <span class="project-stat-value roi">${project.roi || 0}%</span>
          </div>
        </div>
        <span class="difficulty-badge ${project.difficulty.toLowerCase()}">
          <i class="fas fa-signal"></i> ${project.difficulty}
        </span>
      </div>
      <div class="project-footer">
        <button class="btn-project btn-view" onclick="viewProject('${project.id}')">
          <i class="fas fa-eye"></i> View
        </button>
      </div>
    </article>
  `).join('');
}

function renderHeatmap() {
  const categoryStats = {};
  
  state.projects.forEach(project => {
    if (!categoryStats[project.category]) {
      categoryStats[project.category] = {
        count: 0,
        avgProfit: 0,
        totalProfit: 0,
        demand: calculateDemandScore(project)
      };
    }
    categoryStats[project.category].count++;
    categoryStats[project.category].totalProfit += project.profit || 0;
  });
  
  // Calculate average profit and determine heat level
  Object.keys(categoryStats).forEach(cat => {
    const stats = categoryStats[cat];
    stats.avgProfit = stats.totalProfit / stats.count;
    
    if (stats.demand > 75) stats.heat = 'hot';
    else if (stats.demand > 50) stats.heat = 'high';
    else if (stats.demand > 25) stats.heat = 'medium';
    else stats.heat = 'low';
  });
  
  elements.heatmapGrid.innerHTML = Object.entries(categoryStats).map(([category, stats]) => `
    <div class="heatmap-card ${stats.heat}" onclick="filterByCategory('${category}')">
      <div class="heatmap-category">${category}</div>
      <div class="heatmap-count">${stats.count} projects</div>
      <div class="heatmap-demand">Avg Profit: $${Math.round(stats.avgProfit)}</div>
    </div>
  `).join('');
}

function renderSeasonal() {
  const months = [
    { name: 'Jan', peak: ['Indoor Furniture'] },
    { name: 'Feb', peak: ['Indoor Furniture'] },
    { name: 'Mar', peak: ['Planter Boxes', 'Raised Beds'] },
    { name: 'Apr', peak: ['Planter Boxes', 'Raised Beds', 'Garden Projects'] },
    { name: 'May', peak: ['Planter Boxes', 'Garden Projects', 'Outdoor Furniture'] },
    { name: 'Jun', peak: ['Outdoor Furniture', 'Planter Boxes'] },
    { name: 'Jul', peak: ['Outdoor Furniture', 'Tables'] },
    { name: 'Aug', peak: ['Outdoor Furniture', 'Storage'] },
    { name: 'Sep', peak: ['Indoor Furniture', 'Shelves'] },
    { name: 'Oct', peak: ['Indoor Furniture', 'Tables'] },
    { name: 'Nov', peak: ['Indoor Furniture', 'Storage'] },
    { name: 'Dec', peak: ['Indoor Furniture', 'Storage'] }
  ];
  
  elements.seasonalContent.innerHTML = months.map((month, index) => {
    const isPeak = [2, 3, 4, 5, 6].includes(index); // Mar-Jul peak
    return `
      <div class="month-card ${isPeak ? 'peak' : ''}">
        <div class="month-name">${month.name}</div>
        <div class="month-category">${month.peak[0]}</div>
      </div>
    `;
  }).join('');
}

function renderMaterials() {
  const materials = [
    { name: '2x4 Lumber (8ft)', price: 4.50, unit: 'each' },
    { name: '2x6 Lumber (8ft)', price: 6.75, unit: 'each' },
    { name: '1x6 Cedar (8ft)', price: 12.00, unit: 'each' },
    { name: 'Plywood (4x8)', price: 45.00, unit: 'sheet' },
    { name: 'Wood Screws (1lb)', price: 8.50, unit: 'box' },
    { name: 'Wood Glue', price: 6.00, unit: 'bottle' },
    { name: 'Sandpaper ( assorted)', price: 12.00, unit: 'pack' },
    { name: 'Wood Stain', price: 15.00, unit: 'quart' },
    { name: 'Polyurethane', price: 18.00, unit: 'quart' },
    { name: 'Kreg Pocket Hole Screws', price: 12.00, unit: 'box' }
  ];
  
  elements.materialsContent.innerHTML = `
    <table class="materials-table">
      <thead>
        <tr>
          <th>Material</th>
          <th>Unit</th>
          <th>Price</th>
        </tr>
      </thead>
      <tbody>
        ${materials.map(m => `
          <tr>
            <td><i class="fas fa-cube" style="color: var(--wood-medium); margin-right: 8px;"></i> ${m.name}</td>
            <td>${m.unit}</td>
            <td class="material-price">$${m.price.toFixed(2)}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}

// ========================================
// API CALLS
// ========================================
async function fetchTrendsData(postalCode = 'H3A0G4', radius = 25) {
  try {
    const response = await fetch(`/api/trends?postalCode=${postalCode}&radius=${radius}`);
    if (response.ok) {
      state.trendsData = await response.json();
      renderTrending();
      renderHeatmap();
    }
  } catch (error) {
    console.error('Failed to fetch trends:', error);
    // Use fallback data
    generateFallbackTrends();
  }
}

async function fetchSeasonalData() {
  try {
    const response = await fetch('/api/seasonal');
    if (response.ok) {
      state.seasonalData = await response.json();
    }
  } catch (error) {
    console.error('Failed to fetch seasonal data:', error);
  }
}

async function fetchMaterialCosts() {
  try {
    const postalCode = elements.postalCode.value.trim() || 'H3A0G4';
    const response = await fetch(`/api/material-costs?postalCode=${postalCode}`);
    if (response.ok) {
      state.materialCosts = await response.json();
    }
  } catch (error) {
    console.error('Failed to fetch material costs:', error);
  }
}

function generateFallbackTrends() {
  const categories = [...new Set(state.projects.map(p => p.category))];
  state.trendsData = {};
  
  categories.forEach(cat => {
    state.trendsData[cat] = {
      score: Math.floor(Math.random() * 60) + 40,
      trend: Math.floor(Math.random() * 40) - 20,
      volume: `${Math.floor(Math.random() * 50) + 10}K`
    };
  });
}

// ========================================
// STATS & CALCULATIONS
// ========================================
function updateStats() {
  const projects = state.filteredProjects;
  const totalProfit = projects.reduce((sum, p) => sum + (p.profit || 0), 0);
  const totalHours = projects.reduce((sum, p) => sum + (p.estimatedHours || 0), 0);
  const avgRoi = projects.length > 0 
    ? Math.round(projects.reduce((sum, p) => sum + (p.roi || 0), 0) / projects.length)
    : 0;
  
  animateValue(elements.totalProjects, 0, projects.length, 1000);
  animateValue(elements.totalProfit, 0, totalProfit, 1000, '$');
  animateValue(elements.totalHours, 0, totalHours, 1000);
  animateValue(elements.avgRoi, 0, avgRoi, 1000, '', '%');
  
  elements.resultsCount.textContent = projects.length;
}

function animateStats() {
  const cards = document.querySelectorAll('.stat-card');
  cards.forEach((card, index) => {
    card.style.animationDelay = `${index * 100}ms`;
    card.classList.add('animate-fadeInUp');
  });
}

function animateValue(element, start, end, duration, prefix = '', suffix = '') {
  const startTime = performance.now();
  
  function update(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const easeProgress = 1 - Math.pow(1 - progress, 3); // easeOutCubic
    
    const current = Math.round(start + (end - start) * easeProgress);
    element.textContent = `${prefix}${current.toLocaleString()}${suffix}`;
    
    if (progress < 1) {
      requestAnimationFrame(update);
    }
  }
  
  requestAnimationFrame(update);
}

function calculateTimeToProfit() {
  const hoursPerWeek = parseInt(document.getElementById('calc-hours-week').value) || 10;
  const budget = parseInt(document.getElementById('calc-budget').value) || 500;
  
  // Find projects that fit the budget
  const affordable = state.projects.filter(p => p.materialCost <= budget);
  const bestProject = affordable.sort((a, b) => (b.profit || 0) - (a.profit || 0))[0];
  
  if (!bestProject) {
    document.getElementById('calc-results').innerHTML = `
      <div class="result-item">
        <span class="result-label">No projects found within budget</span>
      </div>
    `;
    return;
  }
  
  const weeksToComplete = Math.ceil((bestProject.estimatedHours || 1) / hoursPerWeek);
  const profitPerHour = bestProject.hourlyRate || 0;
  const monthlyIncome = profitPerHour * hoursPerWeek * 4;
  
  document.getElementById('calc-results').innerHTML = `
    <div class="result-item">
      <span class="result-label">Recommended First Project</span>
      <span class="result-value">${bestProject.title}</span>
    </div>
    <div class="result-item">
      <span class="result-label">Time to Complete</span>
      <span class="result-value">${weeksToComplete} week${weeksToComplete !== 1 ? 's' : ''}</span>
    </div>
    <div class="result-item">
      <span class="result-label">Profit Potential</span>
      <span class="result-value">$${bestProject.profit || 0}</span>
    </div>
    <div class="result-item">
      <span class="result-label">Projected Monthly Income</span>
      <span class="result-value">$${monthlyIncome.toLocaleString()}</span>
    </div>
  `;
}

// ========================================
// PROJECT ACTIONS
// ========================================
function viewProject(projectId) {
  const project = state.projects.find(p => p.id === projectId);
  if (!project) return;
  
  elements.modalTitle.textContent = project.title;
  elements.detailContent.innerHTML = `
    <div class="detail-section">
      <h4><i class="fas fa-info-circle"></i> Project Details</h4>
      <div class="detail-grid">
        <div class="detail-item">
          <span class="detail-label">Category</span>
          <span class="detail-value">${project.category}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Difficulty</span>
          <span class="detail-value">${project.difficulty}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Source</span>
          <span class="detail-value">${project.source}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Pages</span>
          <span class="detail-value">${project.pageCount || 'N/A'}</span>
        </div>
      </div>
    </div>
    
    <div class="detail-section">
      <h4><i class="fas fa-dollar-sign"></i> Financial Breakdown</h4>
      <div class="detail-grid">
        <div class="detail-item">
          <span class="detail-label">Material Cost</span>
          <span class="detail-value">$${project.materialCost || 0}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Selling Price</span>
          <span class="detail-value">$${project.sellingPrice || 0}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Profit</span>
          <span class="detail-value" style="color: var(--forest-green);">$${project.profit || 0}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">ROI</span>
          <span class="detail-value">${project.roi || 0}%</span>
        </div>
      </div>
    </div>
    
    <div class="detail-section">
      <h4><i class="fas fa-clock"></i> Time & Effort</h4>
      <div class="detail-grid">
        <div class="detail-item">
          <span class="detail-label">Estimated Hours</span>
          <span class="detail-value">${project.estimatedHours || 0} hours</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Estimated Days</span>
          <span class="detail-value">${project.estimatedDays || Math.ceil((project.estimatedHours || 0) / 8)} days</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Hourly Rate</span>
          <span class="detail-value">$${project.hourlyRate || 0}/hour</span>
        </div>
      </div>
    </div>
    
    ${project.tools ? `
    <div class="detail-section">
      <h4><i class="fas fa-tools"></i> Tools Required</h4>
      <div class="detail-grid">
        ${project.tools.map(tool => `
          <div class="detail-item">
            <span class="detail-value"><i class="fas fa-check" style="color: var(--forest-green);"></i> ${tool}</span>
          </div>
        `).join('')}
      </div>
    </div>
    ` : ''}
    
    <div class="detail-section" style="display: flex; gap: 16px;">
      <button class="btn-primary" onclick="openPdf('${project.id}')" style="flex: 1;">
        <i class="fas fa-file-pdf"></i> View PDF Plans
      </button>
      <button class="btn-secondary" onclick="addToCompare('${project.id}')" style="flex: 1;">
        <i class="fas fa-balance-scale"></i> Add to Compare
      </button>
    </div>
  `;
  
  openModal('detail-modal');
}

function openPdf(projectId) {
  const project = state.projects.find(p => p.id === projectId);
  if (!project || !project.relativePath) return;
  
  // Construct path relative to the project root
  const pdfPath = `../${project.relativePath}`;
  elements.pdfViewer.src = pdfPath;
  elements.modalTitle.textContent = project.title;
  
  closeModal('detail-modal');
  openModal('pdf-modal');
}

function addToCompare(projectId) {
  const project = state.projects.find(p => p.id === projectId);
  if (!project) return;
  
  // Remove if already in list
  const index = state.compareList.findIndex(p => p.id === projectId);
  if (index > -1) {
    state.compareList.splice(index, 1);
  } else if (state.compareList.length < 3) {
    state.compareList.push(project);
  } else {
    showError('You can compare up to 3 projects at a time');
    return;
  }
  
  if (state.compareList.length > 1) {
    renderCompare();
    openModal('compare-modal');
  } else {
    showError('Add at least 2 projects to compare');
  }
}

function renderCompare() {
  const projects = state.compareList;
  
  // Comparison table
  const rows = [
    { label: 'Category', key: 'category' },
    { label: 'Difficulty', key: 'difficulty' },
    { label: 'Material Cost', key: 'materialCost', format: v => `$${v || 0}` },
    { label: 'Selling Price', key: 'sellingPrice', format: v => `$${v || 0}` },
    { label: 'Profit', key: 'profit', format: v => `$${v || 0}` },
    { label: 'ROI', key: 'roi', format: v => `${v || 0}%` },
    { label: 'Time Required', key: 'estimatedHours', format: v => `${v || 0} hrs` },
    { label: 'Hourly Rate', key: 'hourlyRate', format: v => `$${v || 0}/hr` }
  ];
  
  const tableHtml = `
    <table class="compare-table">
      <thead>
        <tr>
          <th>Feature</th>
          ${projects.map(p => `<th>${p.title}</th>`).join('')}
        </tr>
      </thead>
      <tbody>
        ${rows.map(row => `
          <tr>
            <td><strong>${row.label}</strong></td>
            ${projects.map(p => `<td>${row.format ? row.format(p[row.key]) : p[row.key]}</td>`).join('')}
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
  
  elements.compareContent.querySelector('.compare-table-wrapper').innerHTML = tableHtml;
  
  // Simple bar charts using CSS
  const maxProfit = Math.max(...projects.map(p => p.profit || 0));
  
  document.getElementById('compare-chart-profit').querySelector('.chart-area').innerHTML = `
    <div style="display: flex; align-items: flex-end; gap: 20px; height: 100%; padding: 20px; justify-content: center;">
      ${projects.map(p => `
        <div style="text-align: center;">
          <div style="width: 60px; background: linear-gradient(to top, var(--wood-medium), var(--wood-light)); 
                      height: ${((p.profit || 0) / maxProfit * 150)}px; border-radius: 4px 4px 0 0;">
          </div>
          <div style="margin-top: 8px; font-size: 0.75rem; max-width: 80px; overflow: hidden; text-overflow: ellipsis;">
            ${p.title.substring(0, 15)}${p.title.length > 15 ? '...' : ''}
          </div>
        </div>
      `).join('')}
    </div>
  `;
  
  // Clear other charts (would need charting library for full implementation)
  document.getElementById('compare-chart-time').querySelector('.chart-area').innerHTML = 
    '<div style="padding: 20px; color: var(--warm-gray);"><i class="fas fa-info-circle"></i> Time comparison chart would render here</div>';
  document.getElementById('compare-chart-materials').querySelector('.chart-area').innerHTML = 
    '<div style="padding: 20px; color: var(--warm-gray);"><i class="fas fa-info-circle"></i> Material cost breakdown would render here</div>';
}

function filterByCategory(category) {
  // Reset all category checkboxes
  elements.categoryFilters.querySelectorAll('input').forEach(cb => {
    cb.checked = cb.value === category;
  });
  
  state.filters.categories = [category];
  applyFilters();
  
  // Scroll to projects
  document.getElementById('sort-controls').scrollIntoView({ behavior: 'smooth' });
}

// ========================================
// EXPORT FUNCTIONS
// ========================================
function exportCSV() {
  const headers = ['Title', 'Category', 'Difficulty', 'Profit', 'ROI', 'Hours', 'Source'];
  const rows = state.filteredProjects.map(p => [
    `"${p.title}"`,
    p.category,
    p.difficulty,
    p.profit || 0,
    p.roi || 0,
    p.estimatedHours || 0,
    p.source
  ]);
  
  const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  downloadFile(csv, 'woodworking-projects.csv', 'text/csv');
  closeModal('export-modal');
}

function exportJSON() {
  const data = JSON.stringify(state.filteredProjects, null, 2);
  downloadFile(data, 'woodworking-projects.json', 'application/json');
  closeModal('export-modal');
}

function exportPrint() {
  const printWindow = window.open('', '_blank');
  const projectsHtml = state.filteredProjects.map(p => `
    <div style="margin-bottom: 20px; padding: 20px; border: 1px solid #ddd; break-inside: avoid;">
      <h3>${p.title}</h3>
      <p><strong>Category:</strong> ${p.category} | <strong>Difficulty:</strong> ${p.difficulty}</p>
      <p><strong>Profit:</strong> $${p.profit || 0} | <strong>ROI:</strong> ${p.roi || 0}% | <strong>Time:</strong> ${p.estimatedHours || 0} hrs</p>
    </div>
  `).join('');
  
  printWindow.document.write(`
    <html>
      <head>
        <title>Woodworking Projects - Print View</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          h1 { color: #5D3A1A; }
        </style>
      </head>
      <body>
        <h1>Woodworking Pro - Project List</h1>
        <p>Generated on ${new Date().toLocaleDateString()}</p>
        <hr>
        ${projectsHtml}
      </body>
    </html>
  `);
  
  printWindow.document.close();
  printWindow.print();
  closeModal('export-modal');
}

function copyShareableLink() {
  const params = new URLSearchParams();
  if (state.filters.search) params.set('search', state.filters.search);
  if (state.filters.categories.length > 0) params.set('categories', state.filters.categories.join(','));
  if (state.sort !== 'profit-desc') params.set('sort', state.sort);
  
  const url = `${window.location.origin}${window.location.pathname}?${params.toString()}`;
  
  navigator.clipboard.writeText(url).then(() => {
    showSuccess('Link copied to clipboard!');
    closeModal('export-modal');
  }).catch(() => {
    showError('Failed to copy link');
  });
}

function downloadFile(content, filename, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ========================================
// UI UTILITIES
// ========================================
function toggleSidebar() {
  elements.sidebar.classList.toggle('open');
}

function closeSidebar() {
  elements.sidebar.classList.remove('open');
}

function toggleDarkMode() {
  const html = document.documentElement;
  const currentTheme = html.getAttribute('data-theme');
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  
  html.setAttribute('data-theme', newTheme);
  localStorage.setItem('theme', newTheme);
  
  // Update icon
  elements.darkModeIcon.className = newTheme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
}

function openModal(modalId) {
  document.getElementById(modalId).classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeModal(modalId) {
  document.getElementById(modalId).classList.remove('active');
  document.body.style.overflow = '';
}

function loadSavedPreferences() {
  // Theme
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme) {
    document.documentElement.setAttribute('data-theme', savedTheme);
    elements.darkModeIcon.className = savedTheme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
  }
  
  // Check for URL params
  const params = new URLSearchParams(window.location.search);
  if (params.has('search')) {
    elements.searchInput.value = params.get('search');
    state.filters.search = params.get('search');
  }
  if (params.has('sort')) {
    state.sort = params.get('sort');
    elements.sortSelect.value = state.sort;
  }
}

function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

function showError(message) {
  // Simple toast notification
  const toast = document.createElement('div');
  toast.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    background: var(--danger);
    color: white;
    padding: 16px 24px;
    border-radius: 8px;
    box-shadow: var(--shadow-lg);
    z-index: 3000;
    font-weight: 500;
  `;
  toast.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${message}`;
  document.body.appendChild(toast);
  
  setTimeout(() => {
    toast.remove();
  }, 3000);
}

function showSuccess(message) {
  const toast = document.createElement('div');
  toast.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    background: var(--success);
    color: white;
    padding: 16px 24px;
    border-radius: 8px;
    box-shadow: var(--shadow-lg);
    z-index: 3000;
    font-weight: 500;
  `;
  toast.innerHTML = `<i class="fas fa-check-circle"></i> ${message}`;
  document.body.appendChild(toast);
  
  setTimeout(() => {
    toast.remove();
  }, 3000);
}
