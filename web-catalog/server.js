/**
 * Woodworking Pro - Node.js/Express Server
 * API server for trends, seasonal data, and material costs
 */

const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

// Try to import google-trends-api, fallback to mock if unavailable
let googleTrends;
try {
  googleTrends = require('google-trends-api');
} catch (e) {
  console.log('google-trends-api not available, using mock data');
  googleTrends = null;
}

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files from the web-catalog directory
app.use(express.static(path.join(__dirname)));

// ========================================
// POSTAL CODE TO GEO MAPPING
// ========================================
// Simplified mapping for demo purposes
const postalCodeToGeo = {
  // Canada - Montreal area
  'H3A': { geo: 'CA-QC', name: 'Montreal, QC' },
  'H3B': { geo: 'CA-QC', name: 'Montreal, QC' },
  'H1A': { geo: 'CA-QC', name: 'Montreal, QC' },
  'H2A': { geo: 'CA-QC', name: 'Montreal, QC' },
  'H4A': { geo: 'CA-QC', name: 'Montreal, QC' },
  // Canada - Toronto area
  'M5A': { geo: 'CA-ON', name: 'Toronto, ON' },
  'M5B': { geo: 'CA-ON', name: 'Toronto, ON' },
  'M5C': { geo: 'CA-ON', name: 'Toronto, ON' },
  'L4B': { geo: 'CA-ON', name: 'Toronto, ON' },
  // Canada - Vancouver area
  'V5K': { geo: 'CA-BC', name: 'Vancouver, BC' },
  'V5L': { geo: 'CA-BC', name: 'Vancouver, BC' },
  // US - New York
  '10001': { geo: 'US-NY', name: 'New York, NY' },
  '10002': { geo: 'US-NY', name: 'New York, NY' },
  '10003': { geo: 'US-NY', name: 'New York, NY' },
  // US - Los Angeles
  '90001': { geo: 'US-CA', name: 'Los Angeles, CA' },
  '90002': { geo: 'US-CA', name: 'Los Angeles, CA' },
  // US - Chicago
  '60601': { geo: 'US-IL', name: 'Chicago, IL' },
  '60602': { geo: 'US-IL', name: 'Chicago, IL' },
};

// ========================================
// MOCK DATA FOR FALLBACK
// ========================================
const mockTrendsData = {
  'Planter Boxes': { score: 85, trend: 15, volume: '40K' },
  'Woodworking Projects': { score: 72, trend: 8, volume: '35K' },
  'Raised Beds': { score: 78, trend: 22, volume: '28K' },
  'Tables': { score: 65, trend: -5, volume: '25K' },
  'Benches': { score: 58, trend: 3, volume: '18K' },
  'Cabinets': { score: 62, trend: -2, volume: '22K' },
  'Shelves': { score: 70, trend: 12, volume: '30K' },
  'Bookcases': { score: 55, trend: -8, volume: '15K' },
  'Beds': { score: 60, trend: 5, volume: '20K' },
  'Chairs': { score: 52, trend: -3, volume: '16K' },
  'Outdoor Furniture': { score: 75, trend: 28, volume: '32K' },
  'Storage': { score: 68, trend: 10, volume: '24K' }
};

const mockSeasonalData = {
  months: [
    { month: 'Jan', peakCategories: ['Indoor Furniture', 'Storage'], demand: 60 },
    { month: 'Feb', peakCategories: ['Indoor Furniture', 'Storage'], demand: 65 },
    { month: 'Mar', peakCategories: ['Planter Boxes', 'Raised Beds'], demand: 85 },
    { month: 'Apr', peakCategories: ['Planter Boxes', 'Raised Beds', 'Garden Projects'], demand: 95 },
    { month: 'May', peakCategories: ['Planter Boxes', 'Garden Projects', 'Outdoor Furniture'], demand: 100 },
    { month: 'Jun', peakCategories: ['Outdoor Furniture', 'Planter Boxes'], demand: 95 },
    { month: 'Jul', peakCategories: ['Outdoor Furniture', 'Tables'], demand: 90 },
    { month: 'Aug', peakCategories: ['Outdoor Furniture', 'Storage'], demand: 85 },
    { month: 'Sep', peakCategories: ['Indoor Furniture', 'Shelves'], demand: 75 },
    { month: 'Oct', peakCategories: ['Indoor Furniture', 'Tables'], demand: 80 },
    { month: 'Nov', peakCategories: ['Indoor Furniture', 'Storage'], demand: 85 },
    { month: 'Dec', peakCategories: ['Indoor Furniture', 'Storage'], demand: 90 }
  ],
  currentPeak: ['Indoor Furniture', 'Storage']
};

const mockMaterialCosts = {
  'H3A0G4': {
    region: 'Montreal, QC',
    currency: 'CAD',
    materials: [
      { name: '2x4 Lumber (8ft)', price: 5.99, unit: 'each', trend: 'stable' },
      { name: '2x6 Lumber (8ft)', price: 8.99, unit: 'each', trend: 'up' },
      { name: '1x6 Cedar (8ft)', price: 15.99, unit: 'each', trend: 'up' },
      { name: 'Plywood (4x8)', price: 55.00, unit: 'sheet', trend: 'stable' },
      { name: 'Wood Screws (1lb)', price: 9.99, unit: 'box', trend: 'stable' },
      { name: 'Wood Glue', price: 7.99, unit: 'bottle', trend: 'stable' },
      { name: 'Sandpaper (assorted)', price: 14.99, unit: 'pack', trend: 'stable' },
      { name: 'Wood Stain', price: 18.99, unit: 'quart', trend: 'up' },
      { name: 'Polyurethane', price: 22.99, unit: 'quart', trend: 'stable' },
      { name: 'Kreg Pocket Hole Screws', price: 14.99, unit: 'box', trend: 'stable' }
    ],
    lastUpdated: new Date().toISOString()
  },
  'M5A': {
    region: 'Toronto, ON',
    currency: 'CAD',
    materials: [
      { name: '2x4 Lumber (8ft)', price: 6.49, unit: 'each', trend: 'up' },
      { name: '2x6 Lumber (8ft)', price: 9.49, unit: 'each', trend: 'up' },
      { name: '1x6 Cedar (8ft)', price: 16.99, unit: 'each', trend: 'up' },
      { name: 'Plywood (4x8)', price: 59.00, unit: 'sheet', trend: 'up' },
      { name: 'Wood Screws (1lb)', price: 10.49, unit: 'box', trend: 'stable' },
      { name: 'Wood Glue', price: 8.49, unit: 'bottle', trend: 'stable' },
      { name: 'Sandpaper (assorted)', price: 15.99, unit: 'pack', trend: 'stable' },
      { name: 'Wood Stain', price: 19.99, unit: 'quart', trend: 'up' },
      { name: 'Polyurethane', price: 24.99, unit: 'quart', trend: 'stable' },
      { name: 'Kreg Pocket Hole Screws', price: 15.99, unit: 'box', trend: 'stable' }
    ],
    lastUpdated: new Date().toISOString()
  },
  'V5K': {
    region: 'Vancouver, BC',
    currency: 'CAD',
    materials: [
      { name: '2x4 Lumber (8ft)', price: 6.99, unit: 'each', trend: 'up' },
      { name: '2x6 Lumber (8ft)', price: 9.99, unit: 'each', trend: 'up' },
      { name: '1x6 Cedar (8ft)', price: 14.99, unit: 'each', trend: 'stable' },
      { name: 'Plywood (4x8)', price: 62.00, unit: 'sheet', trend: 'up' },
      { name: 'Wood Screws (1lb)', price: 10.99, unit: 'box', trend: 'stable' },
      { name: 'Wood Glue', price: 8.99, unit: 'bottle', trend: 'stable' },
      { name: 'Sandpaper (assorted)', price: 16.49, unit: 'pack', trend: 'stable' },
      { name: 'Wood Stain', price: 20.49, unit: 'quart', trend: 'up' },
      { name: 'Polyurethane', price: 25.99, unit: 'quart', trend: 'stable' },
      { name: 'Kreg Pocket Hole Screws', price: 16.49, unit: 'box', trend: 'stable' }
    ],
    lastUpdated: new Date().toISOString()
  },
  'default': {
    region: 'Canada (National Average)',
    currency: 'CAD',
    materials: [
      { name: '2x4 Lumber (8ft)', price: 5.49, unit: 'each', trend: 'stable' },
      { name: '2x6 Lumber (8ft)', price: 8.49, unit: 'each', trend: 'stable' },
      { name: '1x6 Cedar (8ft)', price: 14.99, unit: 'each', trend: 'stable' },
      { name: 'Plywood (4x8)', price: 52.00, unit: 'sheet', trend: 'stable' },
      { name: 'Wood Screws (1lb)', price: 8.99, unit: 'box', trend: 'stable' },
      { name: 'Wood Glue', price: 6.99, unit: 'bottle', trend: 'stable' },
      { name: 'Sandpaper (assorted)', price: 12.99, unit: 'pack', trend: 'stable' },
      { name: 'Wood Stain', price: 15.99, unit: 'quart', trend: 'stable' },
      { name: 'Polyurethane', price: 17.99, unit: 'quart', trend: 'stable' },
      { name: 'Kreg Pocket Hole Screws', price: 11.99, unit: 'box', trend: 'stable' }
    ],
    lastUpdated: new Date().toISOString()
  }
};

// Woodworking-related search terms for trends
const woodworkingTerms = [
  'planter box plans',
  'raised garden bed plans',
  'woodworking projects',
  'outdoor furniture plans',
  'wooden table plans',
  'bookshelf plans',
  'cabinet plans',
  'bench plans',
  'shelf plans',
  'wooden bed plans'
];

// ========================================
// HELPER FUNCTIONS
// ========================================
function getPostalCodePrefix(postalCode) {
  if (!postalCode) return null;
  // Remove spaces and normalize
  const clean = postalCode.toUpperCase().replace(/\s/g, '');
  
  // Canadian postal code: first 3 characters
  if (/^[A-Z]\d[A-Z]/.test(clean)) {
    return clean.substring(0, 3);
  }
  
  // US ZIP: first 5 digits or default
  if (/^\d{5}/.test(clean)) {
    return clean.substring(0, 5);
  }
  
  return clean.substring(0, 3);
}

function getGeoFromPostalCode(postalCode) {
  const prefix = getPostalCodePrefix(postalCode);
  return postalCodeToGeo[prefix] || { geo: 'CA', name: 'Canada' };
}

async function fetchGoogleTrends(geo, term) {
  if (!googleTrends) {
    return null;
  }
  
  try {
    const result = await googleTrends.interestOverTime({
      keyword: term,
      geo: geo,
      category: 44 // Arts & Crafts category
    });
    return JSON.parse(result);
  } catch (error) {
    console.error(`Failed to fetch trends for ${term}:`, error.message);
    return null;
  }
}

// ========================================
// API ROUTES
// ========================================

/**
 * GET /api/trends
 * Query params: postalCode, radius
 * Returns: Category trend scores based on Google Trends data
 */
app.get('/api/trends', async (req, res) => {
  const { postalCode, radius = 25 } = req.query;
  
  if (!postalCode) {
    return res.status(400).json({ error: 'Postal code is required' });
  }
  
  const geoData = getGeoFromPostalCode(postalCode);
  
  // If Google Trends API is available, try to fetch real data
  if (googleTrends) {
    try {
      // Fetch trends for woodworking-related terms
      const trendsPromises = woodworkingTerms.map(term => 
        fetchGoogleTrends(geoData.geo, term).catch(() => null)
      );
      
      const results = await Promise.all(trendsPromises);
      
      // Process real trends data
      const processedTrends = {};
      
      // Map terms to categories
      const termToCategory = {
        'planter box plans': 'Planter Boxes',
        'raised garden bed plans': 'Raised Beds',
        'woodworking projects': 'Woodworking Projects',
        'outdoor furniture plans': 'Outdoor Furniture',
        'wooden table plans': 'Tables',
        'bookshelf plans': 'Bookcases',
        'cabinet plans': 'Cabinets',
        'bench plans': 'Benches',
        'shelf plans': 'Shelves',
        'wooden bed plans': 'Beds'
      };
      
      results.forEach((result, index) => {
        const term = woodworkingTerms[index];
        const category = termToCategory[term];
        
        if (result && result.default && result.default.timelineData) {
          const data = result.default.timelineData;
          const values = data.map(d => d.value[0]);
          const current = values[values.length - 1] || 50;
          const previous = values[values.length - 2] || current;
          const trend = ((current - previous) / previous * 100).toFixed(1);
          
          processedTrends[category] = {
            score: Math.min(100, Math.round(current)),
            trend: parseFloat(trend),
            volume: `${Math.round(Math.random() * 40 + 10)}K`,
            geo: geoData.name
          };
        }
      });
      
      // Fill in missing categories with generated data
      Object.keys(mockTrendsData).forEach(category => {
        if (!processedTrends[category]) {
          processedTrends[category] = {
            ...mockTrendsData[category],
            geo: geoData.name
          };
        }
      });
      
      return res.json(processedTrends);
      
    } catch (error) {
      console.error('Error fetching trends:', error);
      // Fall through to mock data
    }
  }
  
  // Return mock data with location info
  const mockWithLocation = {};
  Object.keys(mockTrendsData).forEach(key => {
    mockWithLocation[key] = {
      ...mockTrendsData[key],
      geo: geoData.name,
      mock: true
    };
  });
  
  res.json(mockWithLocation);
});

/**
 * GET /api/seasonal
 * Returns: Seasonal demand data for woodworking categories
 */
app.get('/api/seasonal', (req, res) => {
  const currentMonth = new Date().getMonth();
  const monthData = mockSeasonalData.months[currentMonth];
  
  res.json({
    ...mockSeasonalData,
    currentMonth: currentMonth,
    currentMonthName: monthData.month,
    nextPeak: getNextPeakMonth(currentMonth)
  });
});

function getNextPeakMonth(currentMonth) {
  // Peak months are March (2) - July (6)
  const peakMonths = [2, 3, 4, 5, 6];
  
  for (const month of peakMonths) {
    if (month > currentMonth) {
      return mockSeasonalData.months[month].month;
    }
  }
  return mockSeasonalData.months[2].month; // Return March if past July
}

/**
 * GET /api/material-costs
 * Query params: postalCode
 * Returns: Material cost estimates for the region
 */
app.get('/api/material-costs', (req, res) => {
  const { postalCode } = req.query;
  
  if (!postalCode) {
    return res.status(400).json({ error: 'Postal code is required' });
  }
  
  const prefix = getPostalCodePrefix(postalCode);
  
  // Try to find specific region data, fallback to default
  let regionData = mockMaterialCosts[prefix] || 
                   mockMaterialCosts['H3A'] || 
                   mockMaterialCosts['default'];
  
  // Add variation based on postal code (for demo purposes)
  const variation = (postalCode.charCodeAt(0) % 10) / 100; // 0-9% variation
  
  const adjustedData = {
    ...regionData,
    postalCode: postalCode,
    materials: regionData.materials.map(m => ({
      ...m,
      price: parseFloat((m.price * (1 + variation)).toFixed(2))
    }))
  };
  
  res.json(adjustedData);
});

/**
 * GET /api/projects
 * Returns: All projects (optional filtering)
 */
app.get('/api/projects', (req, res) => {
  const { category, difficulty, minProfit, maxHours } = req.query;
  
  let projects = [...state.projects];
  
  if (category) {
    projects = projects.filter(p => p.category === category);
  }
  
  if (difficulty) {
    projects = projects.filter(p => p.difficulty === difficulty);
  }
  
  if (minProfit) {
    projects = projects.filter(p => (p.profit || 0) >= parseInt(minProfit));
  }
  
  if (maxHours) {
    projects = projects.filter(p => (p.estimatedHours || 0) <= parseInt(maxHours));
  }
  
  res.json({
    projects: projects,
    total: projects.length,
    filters: { category, difficulty, minProfit, maxHours }
  });
});

/**
 * GET /api/stats
 * Returns: Overall statistics
 */
app.get('/api/stats', (req, res) => {
  const statsPath = path.join(__dirname, 'data', 'stats.json');
  
  if (fs.existsSync(statsPath)) {
    const stats = JSON.parse(fs.readFileSync(statsPath, 'utf8'));
    res.json(stats);
  } else {
    // Generate stats from projects
    const stats = {
      totalProjects: state.projects.length,
      byCategory: {},
      byDifficulty: {},
      byProfitRange: {},
      totalEstimatedHours: 0,
      totalPotentialProfit: 0
    };
    
    state.projects.forEach(p => {
      stats.byCategory[p.category] = (stats.byCategory[p.category] || 0) + 1;
      stats.byDifficulty[p.difficulty] = (stats.byDifficulty[p.difficulty] || 0) + 1;
      stats.totalEstimatedHours += p.estimatedHours || 0;
      stats.totalPotentialProfit += p.profit || 0;
    });
    
    res.json(stats);
  }
});

// ========================================
// ERROR HANDLING
// ========================================
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// ========================================
// START SERVER
// ========================================
app.listen(PORT, () => {
  console.log(`Woodworking Pro Server running on port ${PORT}`);
  console.log(`API endpoints:`);
  console.log(`  - GET /api/trends?postalCode=XXX&radius=25`);
  console.log(`  - GET /api/seasonal`);
  console.log(`  - GET /api/material-costs?postalCode=XXX`);
  console.log(`  - GET /api/projects`);
  console.log(`  - GET /api/stats`);
});

// Keep state in memory (in production, use a database)
const state = {
  projects: []
};

// Load projects on startup
try {
  const projectsPath = path.join(__dirname, 'data', 'projects.json');
  if (fs.existsSync(projectsPath)) {
    state.projects = JSON.parse(fs.readFileSync(projectsPath, 'utf8'));
    console.log(`Loaded ${state.projects.length} projects`);
  }
} catch (error) {
  console.error('Failed to load projects:', error);
}
