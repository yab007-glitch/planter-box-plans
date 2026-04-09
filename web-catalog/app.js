/**
 * DIY Woodworking Project Catalog - Main Application
 * Interactive catalog with filtering, PDF viewing, and market research
 */

// Global state
let projects = [];
let filteredProjects = [];
let compareList = [];
let currentView = 'grid';

// DOM Elements
const elements = {
    container: document.getElementById('projects-container'),
    totalProjects: document.getElementById('total-projects'),
    totalProfit: document.getElementById('total-profit'),
    totalHours: document.getElementById('total-hours'),
    avgRoi: document.getElementById('avg-roi'),
    categoryFilters: document.getElementById('category-filters'),
    toolsFilters: document.getElementById('tools-filters'),
    searchInput: document.getElementById('search-input'),
    sortSelect: document.getElementById('sort-select'),
    minHours: document.getElementById('min-hours'),
    maxHours: document.getElementById('max-hours'),
    postalCode: document.getElementById('postal-code'),
    radius: document.getElementById('radius'),
    radiusValue: document.getElementById('radius-value'),
    clearFilters: document.getElementById('clear-filters'),
    pdfModal: document.getElementById('pdf-modal'),
    detailModal: document.getElementById('detail-modal'),
    compareModal: document.getElementById('compare-modal'),
    pdfViewer: document.getElementById('pdf-viewer'),
    modalTitle: document.getElementById('modal-title'),
    detailTitle: document.getElementById('detail-title'),
    detailContent: document.getElementById('detail-content'),
    compareContent: document.getElementById('compare-content'),
    activeFilters: document.getElementById('active-filters')
};

// Montreal postal code areas with rough coordinates for distance calculation
const montrealAreas = {
    'H1A': { name: 'Rivière-des-Prairies', lat: 45.63, lng: -73.52 },
    'H1B': { name: 'Pointe-aux-Trembles', lat: 45.65, lng: -73.50 },
    'H1C': { name: 'Charlemagne', lat: 45.70, lng: -73.48 },
    'H1E': { name: 'Anjou', lat: 45.60, lng: -73.55 },
    'H1G': { name: 'Montréal-Nord', lat: 45.60, lng: -73.63 },
    'H1H': { name: 'Montréal-Nord', lat: 45.62, lng: -73.62 },
    'H1J': { name: 'Saint-Léonard', lat: 45.58, lng: -73.58 },
    'H1K': { name: 'Saint-Léonard', lat: 45.59, lng: -73.57 },
    'H1L': { name: 'Mercier', lat: 45.58, lng: -73.55 },
    'H1M': { name: 'Montréal-Nord', lat: 45.59, lng: -73.64 },
    'H1N': { name: 'Saint-Léonard', lat: 45.57, lng: -73.59 },
    'H1P': { name: 'Saint-Léonard', lat: 45.56, lng: -73.60 },
    'H1R': { name: 'Saint-Léonard', lat: 45.55, lng: -73.61 },
    'H1S': { name: 'Villeray', lat: 45.55, lng: -73.60 },
    'H1T': { name: 'Villeray', lat: 45.54, lng: -73.61 },
    'H1V': { name: 'Maisonneuve', lat: 45.55, lng: -73.56 },
    'H1W': { name: 'Hochelaga', lat: 45.54, lng: -73.55 },
    'H1X': { name: 'Hochelaga', lat: 45.53, lng: -73.54 },
    'H1Y': { name: 'Hochelaga', lat: 45.52, lng: -73.54 },
    'H1Z': { name: 'Hochelaga', lat: 45.51, lng: -73.53 },
    'H2A': { name: 'Villeray', lat: 45.54, lng: -73.62 },
    'H2B': { name: 'Villeray', lat: 45.55, lng: -73.63 },
    'H2C': { name: 'Ahuntsic', lat: 45.55, lng: -73.65 },
    'H2E': { name: 'Villeray', lat: 45.53, lng: -73.62 },
    'H2G': { name: 'Petite-Italie', lat: 45.53, lng: -73.61 },
    'H2H': { name: 'Plateau-Mont-Royal', lat: 45.52, lng: -73.58 },
    'H2J': { name: 'Plateau-Mont-Royal', lat: 45.52, lng: -73.58 },
    'H2K': { name: 'Plateau-Mont-Royal', lat: 45.51, lng: -73.58 },
    'H2L': { name: 'Plateau-Mont-Royal', lat: 45.51, lng: -73.57 },
    'H2M': { name: 'Ahuntsic', lat: 45.54, lng: -73.65 },
    'H2N': { name: 'Ahuntsic', lat: 45.53, lng: -73.65 },
    'H2P': { name: 'Ahuntsic', lat: 45.52, lng: -73.66 },
    'H2R': { name: 'Ahuntsic', lat: 45.51, lng: -73.67 },
    'H2S': { name: 'Mile End', lat: 45.52, lng: -73.60 },
    'H2T': { name: 'Mile End', lat: 45.51, lng: -73.60 },
    'H2V': { name: 'Côte-des-Neiges', lat: 45.50, lng: -73.63 },
    'H2W': { name: 'Côte-des-Neiges', lat: 45.49, lng: -73.63 },
    'H2X': { name: 'Downtown', lat: 45.49, lng: -73.58 },
    'H2Y': { name: 'Old Montreal', lat: 45.50, lng: -73.55 },
    'H2Z': { name: 'Downtown', lat: 45.50, lng: -73.57 },
    'H3A': { name: 'McGill Ghetto', lat: 45.50, lng: -73.58 },
    'H3B': { name: 'Downtown', lat: 45.50, lng: -73.57 },
    'H3C': { name: 'Griffintown', lat: 45.49, lng: -73.56 },
    'H3E': { name: 'Pointe-Saint-Charles', lat: 45.48, lng: -73.56 },
    'H3G': { name: 'Downtown', lat: 45.49, lng: -73.57 },
    'H3H': { name: 'Downtown', lat: 45.48, lng: -73.58 },
    'H3J': { name: 'Little Burgundy', lat: 45.48, lng: -73.58 },
    'H3K': { name: 'Pointe-Saint-Charles', lat: 45.47, lng: -73.57 },
    'H3L': { name: 'Ahuntsic', lat: 45.50, lng: -73.68 },
    'H3M': { name: 'Ahuntsic', lat: 45.49, lng: -73.68 },
    'H3N': { name: 'Ahuntsic', lat: 45.48, lng: -73.69 },
    'H3P': { name: 'Outremont', lat: 45.51, lng: -73.61 },
    'H3R': { name: 'Côte-des-Neiges', lat: 45.48, lng: -73.63 },
    'H3S': { name: 'Côte-des-Neiges', lat: 45.47, lng: -73.64 },
    'H3T': { name: 'Côte-des-Neiges', lat: 45.48, lng: -73.62 },
    'H3V': { name: 'Côte-des-Neiges', lat: 45.47, lng: -73.62 },
    'H3W': { name: 'Côte-des-Neiges', lat: 45.46, lng: -73.63 },
    'H3X': { name: 'Snowdon', lat: 45.47, lng: -73.63 },
    'H3Y': { name: 'Westmount', lat: 45.48, lng: -73.60 },
    'H3Z': { name: 'Westmount', lat: 45.47, lng: -73.60 },
    'H4A': { name: 'Mile End', lat: 45.51, lng: -73.60 },
    'H4B': { name: 'Notre-Dame-de-Grâce', lat: 45.46, lng: -73.62 },
    'H4C': { name: 'Saint-Henri', lat: 45.47, lng: -73.59 },
    'H4E': { name: 'Ville-Émard', lat: 45.46, lng: -73.60 },
    'H4G': { name: 'Saint-Henri', lat: 45.46, lng: -73.58 },
    'H4H': { name: 'Little Burgundy', lat: 45.48, lng: -73.59 },
    'H4J': { name: 'Park Extension', lat: 45.52, lng: -73.64 },
    'H4K': { name: 'Park Extension', lat: 45.52, lng: -73.64 },
    'H4L': { name: 'Park Extension', lat: 45.53, lng: -73.64 },
    'H4M': { name: 'Ahuntsic', lat: 45.53, lng: -73.67 },
    'H4N': { name: 'Ahuntsic', lat: 45.52, lng: -73.68 },
    'H4P': { name: 'Côte-des-Neiges', lat: 45.50, lng: -73.64 },
    'H4R': { name: 'Saint-Laurent', lat: 45.51, lng: -73.68 },
    'H4S': { name: 'Saint-Laurent', lat: 45.50, lng: -73.70 },
    'H4T': { name: 'Saint-Laurent', lat: 45.49, lng: -73.71 },
    'H4V': { name: 'Côte-Saint-Luc', lat: 45.47, lng: -73.66 },
    'H4W': { name: 'Côte-Saint-Luc', lat: 45.46, lng: -73.66 },
    'H4X': { name: 'Hampstead', lat: 45.48, lng: -73.63 },
    'H4Y': { name: 'Montreal West', lat: 45.45, lng: -73.65 },
    'H4Z': { name: 'Saint-Laurent', lat: 45.48, lng: -73.72 },
    'H5A': { name: 'Downtown', lat: 45.50, lng: -73.56 },
    'H5B': { name: 'Old Montreal', lat: 45.50, lng: -73.55 }
};

// Calculate distance between two coordinates in km
function calculateDistance(lat1, lng1, lat2, lng2) {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
}

// Load project data
async function loadData() {
    try {
        const response = await fetch('data/projects.json');
        projects = await response.json();
        
        // Enhance projects with market data simulation
        projects = projects.map(project => {
            const searchResults = simulateMarketSearch(project);
            return {
                ...project,
                marketData: {
                    similarProducts: searchResults,
                    avgMarketPrice: calculateAvgPrice(searchResults, project.sellingPrice),
                    demandScore: calculateDemandScore(project),
                    competitionLevel: 'medium',
                    lastUpdated: new Date().toISOString()
                },
                nearbyPostalCodes: generateNearbyAreas(project.location?.defaultPostalCode || 'H3A 0G4')
            };
        });
        
        filteredProjects = [...projects];
        
        // Initialize UI
        initializeFilters();
        renderProjects();
        updateStats();
        
    } catch (error) {
        console.error('Error loading data:', error);
        elements.container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-exclamation-circle"></i>
                <h3>Error Loading Projects</h3>
                <p>Please ensure data/projects.json exists</p>
            </div>
        `;
    }
}

// Simulate market search for similar products
function simulateMarketSearch(project) {
    const platforms = ['Etsy', 'Facebook Marketplace', 'Kijiji', 'Amazon', 'Wayfair'];
    const results = [];
    const basePrice = project.sellingPrice;
    
    // Generate 3-5 simulated listings
    const numResults = 3 + Math.floor(Math.random() * 3);
    
    for (let i = 0; i < numResults; i++) {
        const platform = platforms[Math.floor(Math.random() * platforms.length)];
        const priceVariation = (Math.random() * 0.4) - 0.2; // ±20%
        const price = Math.round(basePrice * (1 + priceVariation));
        
        results.push({
            platform,
            title: `${project.title} - ${project.category}`,
            price: price,
            url: `https://www.${platform.toLowerCase().replace(' ', '')}.com/search?q=${encodeURIComponent(project.title)}`,
            estimatedDelivery: `${3 + Math.floor(Math.random() * 7)} days`,
            sellerLocation: ['Montreal', 'Quebec', 'Toronto', 'Vancouver'][Math.floor(Math.random() * 4)],
            rating: (3.5 + Math.random() * 1.5).toFixed(1)
        });
    }
    
    return results.sort((a, b) => a.price - b.price);
}

// Calculate average market price
function calculateAvgPrice(listings, fallbackPrice) {
    if (listings.length === 0) return fallbackPrice;
    let sum = 0;
    for (const item of listings) {
        sum = sum + item.price;
    }
    return Math.round(sum / listings.length);
}

// Calculate demand score (0-100)
function calculateDemandScore(project) {
    let score = 50; // Base score
    
    // Category boost
    const popularCategories = ['Planter Boxes', 'Raised Beds', 'Tables', 'Benches'];
    if (popularCategories.includes(project.category)) score += 15;
    
    // Profit margin boost
    if (project.profitMargin > 60) score += 10;
    if (project.profitMargin > 80) score += 10;
    
    // Time efficiency boost
    if (project.estimatedHours <= 4) score += 10;
    
    // Seasonal adjustments
    const month = new Date().getMonth();
    if (project.category.includes('Planter') || project.category.includes('Garden')) {
        if (month >= 2 && month <= 8) score += 15; // Spring/Summer
    }
    
    // Difficulty penalty (easier = higher demand)
    if (project.difficulty === 'Easy') score += 10;
    if (project.difficulty === 'Expert') score -= 10;
    
    return Math.min(100, Math.max(0, score));
}

// Generate nearby postal codes
function generateNearbyAreas(centerPostalCode) {
    const nearby = [];
    const cleanCode = centerPostalCode.replace(/\s/g, '').substring(0, 3);
    const centerData = montrealAreas[cleanCode] || montrealAreas['H3A'];
    
    // Find all areas within reasonable distance
    for (const [code, data] of Object.entries(montrealAreas)) {
        const distance = calculateDistance(
            centerData.lat, centerData.lng,
            data.lat, data.lng
        );
        
        if (distance <= 30) { // Within 30km
            nearby.push({
                code,
                name: data.name,
                distance: Math.round(distance * 10) / 10
            });
        }
    }
    
    return nearby.sort((a, b) => a.distance - b.distance);
}

// Initialize filter options
function initializeFilters() {
    // Extract unique categories and tools
    const categories = [...new Set(projects.map(p => p.category))].sort();
    const allTools = projects.flatMap(p => p.tools || []);
    const tools = [...new Set(allTools)].sort().slice(0, 15); // Top 15 tools
    
    // Render category filters
    elements.categoryFilters.innerHTML = categories.map(cat => `
        <label class="checkbox">
            <input type="checkbox" value="${cat}" checked data-filter="category">
            <span class="checkmark"></span>
            <span>${cat}</span>
        </label>
    `).join('');
    
    // Render tool filters
    elements.toolsFilters.innerHTML = tools.map(tool => `
        <label class="checkbox">
            <input type="checkbox" value="${tool}" checked data-filter="tool">
            <span class="checkmark"></span>
            <span>${tool}</span>
        </label>
    `).join('');
    
    // Attach event listeners
    attachFilterListeners();
}

// Attach filter event listeners
function attachFilterListeners() {
    // Checkboxes
    document.querySelectorAll('input[type="checkbox"][data-filter]').forEach(checkbox => {
        checkbox.addEventListener('change', applyFilters);
    });
    
    // Difficulty filters
    document.querySelectorAll('#difficulty-filters input').forEach(checkbox => {
        checkbox.addEventListener('change', applyFilters);
    });
    
    // Profit range filters
    document.querySelectorAll('#profit-filters input').forEach(checkbox => {
        checkbox.addEventListener('change', applyFilters);
    });
    
    // Search
    elements.searchInput.addEventListener('input', debounce(applyFilters, 300));
    
    // Sort
    elements.sortSelect.addEventListener('change', () => {
        applySort();
        renderProjects();
    });
    
    // Hours range
    elements.minHours.addEventListener('input', debounce(applyFilters, 300));
    elements.maxHours.addEventListener('input', debounce(applyFilters, 300));
    
    // Radius slider
    elements.radius.addEventListener('input', (e) => {
        elements.radiusValue.textContent = e.target.value;
    });
    
    // Clear filters
    elements.clearFilters.addEventListener('click', () => {
        document.querySelectorAll('input[type="checkbox"]').forEach(cb => {
            cb.checked = true;
        });
        elements.searchInput.value = '';
        elements.minHours.value = '';
        elements.maxHours.value = '';
        elements.postalCode.value = '';
        elements.radius.value = 25;
        elements.radiusValue.textContent = '25';
        applyFilters();
    });
    
    // View toggle
    document.querySelectorAll('.nav-btn[data-view]').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.nav-btn[data-view]').forEach(b => {
                b.classList.remove('active');
            });
            btn.classList.add('active');
            currentView = btn.dataset.view;
            elements.container.classList.toggle('list-view', currentView === 'list');
            renderProjects();
        });
    });
}

// Debounce helper
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

// Apply all filters
function applyFilters() {
    // Get filter values
    const selectedCategories = [...document.querySelectorAll('#category-filters input:checked')]
        .map(cb => cb.value);
    const selectedDifficulties = [...document.querySelectorAll('#difficulty-filters input:checked')]
        .map(cb => cb.value);
    const selectedProfits = [...document.querySelectorAll('#profit-filters input:checked')]
        .map(cb => cb.value);
    const selectedTools = [...document.querySelectorAll('#tools-filters input:checked')]
        .map(cb => cb.value);
    const searchTerm = elements.searchInput.value.toLowerCase();
    const minHours = parseInt(elements.minHours.value) || 0;
    const maxHours = parseInt(elements.maxHours.value) || Infinity;
    const postalCode = elements.postalCode.value.trim().toUpperCase();
    const radiusKm = parseInt(elements.radius.value) || 25;
    
    // Filter projects
    filteredProjects = projects.filter(project => {
        // Category filter
        if (!selectedCategories.includes(project.category)) return false;
        
        // Difficulty filter
        if (!selectedDifficulties.includes(project.difficulty)) return false;
        
        // Profit range filter
        const profitMin = project.profitCategory.match(/\$(\d+)/)?.[1] || '0';
        const profitMax = project.profitCategory.match(/-\$(\d+)/)?.[1] || project.profitCategory.match(/\$(\d+)\+/)?.[1] || '9999';
        
        let profitMatches = false;
        for (const range of selectedProfits) {
            if (range === '$50-$100' && project.profit >= 50 && project.profit <= 100) profitMatches = true;
            if (range === '$100-$200' && project.profit > 100 && project.profit <= 200) profitMatches = true;
            if (range === '$200-$500' && project.profit > 200 && project.profit <= 500) profitMatches = true;
            if (range === '$500+' && project.profit > 500) profitMatches = true;
        }
        if (!profitMatches) return false;
        
        // Tool filter
        const projectTools = project.tools || [];
        const hasSelectedTool = selectedTools.some(tool => 
            projectTools.some(pt => pt.toLowerCase().includes(tool.toLowerCase()))
        );
        if (!hasSelectedTool && projectTools.length > 0) return false;
        
        // Search filter
        if (searchTerm) {
            const searchableText = `${project.title} ${project.source} ${project.category} ${project.tools?.join(' ') || ''}`.toLowerCase();
            if (!searchableText.includes(searchTerm)) return false;
        }
        
        // Hours filter
        if (project.estimatedHours < minHours || project.estimatedHours > maxHours) return false;
        
        // Location filter
        if (postalCode) {
            const cleanPostal = postalCode.replace(/\s/g, '');
            const cleanCenter = (project.location?.defaultPostalCode || 'H3A0G4').replace(/\s/g, '');
            
            // Simple distance check based on nearby postal codes
            const nearby = project.nearbyPostalCodes || [];
            const nearbyMatch = nearby.some(area => {
                const areaCode = area.code + (cleanPostal.length > 3 ? ' ' : '');
                const distance = area.distance || 0;
                return areaCode.startsWith(cleanPostal.substring(0, 3)) && distance <= radiusKm;
            });
            
            if (!nearbyMatch) return false;
        }
        
        return true;
    });
    
    // Apply sort
    applySort();
    
    // Update UI
    renderProjects();
    updateStats();
    updateActiveFilters({
        categories: selectedCategories,
        difficulties: selectedDifficulties,
        profits: selectedProfits,
        tools: selectedTools,
        search: searchTerm,
        hours: minHours > 0 || maxHours < Infinity ? { min: minHours, max: maxHours } : null,
        location: postalCode ? { postalCode, radius: radiusKm } : null
    });
}

// Apply sorting
function applySort() {
    const sortValue = elements.sortSelect.value;
    
    switch (sortValue) {
        case 'profit-desc':
            filteredProjects.sort((a, b) => b.profit - a.profit);
            break;
        case 'profit-asc':
            filteredProjects.sort((a, b) => a.profit - b.profit);
            break;
        case 'hours-asc':
            filteredProjects.sort((a, b) => a.estimatedHours - b.estimatedHours);
            break;
        case 'hours-desc':
            filteredProjects.sort((a, b) => b.estimatedHours - a.estimatedHours);
            break;
        case 'roi-desc':
            filteredProjects.sort((a, b) => b.profitMargin - a.profitMargin);
            break;
        case 'difficulty': {
            const difficultyOrder = { 'Easy': 1, 'Intermediate': 2, 'Expert': 3 };
            filteredProjects.sort((a, b) => difficultyOrder[a.difficulty] - difficultyOrder[b.difficulty]);
            break;
        }
    }
}

// Update active filters display
function updateActiveFilters(filters) {
    const activeTags = [];
    
    if (filters.search) {
        activeTags.push({ label: `Search: "${filters.search}"`, type: 'search' });
    }
    
    if (filters.location) {
        activeTags.push({ 
            label: `📍 ${filters.location.postalCode} (${filters.location.radius}km)`, 
            type: 'location' 
        });
    }
    
    if (filters.hours) {
        activeTags.push({ 
            label: `⏱ ${filters.hours.min}-${filters.hours.max === Infinity ? '∞' : filters.hours.max} hrs`, 
            type: 'hours' 
        });
    }
    
    elements.activeFilters.innerHTML = activeTags.map(tag => `
        <span class="filter-tag">
            ${tag.label}
            <i class="fas fa-times" onclick="clearFilter('${tag.type}')"></i>
        </span>
    `).join('');
}

// Clear specific filter
function clearFilter(type) {
    switch (type) {
        case 'search':
            elements.searchInput.value = '';
            break;
        case 'location':
            elements.postalCode.value = '';
            break;
        case 'hours':
            elements.minHours.value = '';
            elements.maxHours.value = '';
            break;
    }
    applyFilters();
}

// Update statistics
function updateStats() {
    const total = filteredProjects.length;
    const totalProfit = filteredProjects.reduce((sum, p) => sum + p.profit, 0);
    const totalHours = filteredProjects.reduce((sum, p) => sum + p.estimatedHours, 0);
    const avgMargin = total > 0 
        ? filteredProjects.reduce((sum, p) => sum + p.profitMargin, 0) / total 
        : 0;
    
    elements.totalProjects.textContent = total;
    elements.totalProfit.textContent = `$${totalProfit.toLocaleString()}`;
    elements.totalHours.textContent = totalHours;
    elements.avgRoi.textContent = `${Math.round(avgMargin)}%`;
}

// Render projects
function renderProjects() {
    if (filteredProjects.length === 0) {
        elements.container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-search"></i>
                <h3>No projects match your filters</h3>
                <p>Try adjusting your search criteria</p>
            </div>
        `;
        return;
    }
    
    elements.container.innerHTML = filteredProjects.map(project => createProjectCard(project)).join('');
    
    // Attach card event listeners
    attachCardListeners();
}

// Create project card HTML
function createProjectCard(project) {
    const isSelected = compareList.includes(project.id);
    
    return `
        <div class="project-card" data-id="${project.id}">
            <label class="compare-checkbox" onclick="event.stopPropagation()">
                <input type="checkbox" ${isSelected ? 'checked' : ''} 
                       onchange="toggleCompare('${project.id}')">
                <span class="checkmark"></span>
            </label>
            
            <div class="project-card-header">
                <div>
                    <span class="project-category">${project.category}</span>
                    <h3 class="project-title">${project.title}</h3>
                </div>
                <span class="difficulty-badge ${project.difficulty.toLowerCase()}">
                    ${project.difficulty}
                </span>
            </div>
            
            <div class="project-card-body">
                <div class="project-meta">
                    <span class="meta-item profit">
                        <i class="fas fa-dollar-sign"></i>
                        $${project.profit} profit
                    </span>
                    <span class="meta-item">
                        <i class="fas fa-clock"></i>
                        ${project.estimatedHours} hrs
                    </span>
                    <span class="meta-item">
                        <i class="fas fa-tag"></i>
                        $${project.sellingPrice} selling
                    </span>
                    <span class="meta-item">
                        <i class="fas fa-chart-line"></i>
                        ${project.profitMargin}% ROI
                    </span>
                </div>
                
                <div class="project-tools">
                    ${(project.tools || []).slice(0, 4).map(tool => 
                        `<span class="tool-tag">${tool}</span>`
                    ).join('')}
                    ${(project.tools || []).length > 4 ? `<span class="tool-tag">+${project.tools.length - 4}</span>` : ''}
                </div>
                
                ${project.marketData?.demandScore > 70 ? `
                    <div class="meta-item" style="margin-top: 0.75rem; color: var(--secondary-color);">
                        <i class="fas fa-fire"></i>
                        High Demand (${project.marketData.demandScore}/100)
                    </div>
                ` : ''}
            </div>
            
            <div class="project-card-footer">
                <button class="card-btn" onclick="event.stopPropagation(); showDetails('${project.id}')">
                    <i class="fas fa-info-circle"></i> Details
                </button>
                <button class="card-btn primary" onclick="event.stopPropagation(); viewPdf('${project.id}')">
                    <i class="fas fa-file-pdf"></i> View PDF
                </button>
            </div>
        </div>
    `;
}

// Attach card click listeners
function attachCardListeners() {
    document.querySelectorAll('.project-card').forEach(card => {
        card.addEventListener('click', (e) => {
            if (!e.target.closest('.card-btn') && !e.target.closest('.compare-checkbox')) {
                const id = card.dataset.id;
                showDetails(id);
            }
        });
    });
}

// Toggle compare selection
function toggleCompare(projectId) {
    const index = compareList.indexOf(projectId);
    if (index > -1) {
        compareList.splice(index, 1);
    } else {
        if (compareList.length < 4) {
            compareList.push(projectId);
        } else {
            alert('You can compare up to 4 projects at a time');
            // Uncheck the box
            const checkbox = document.querySelector(`[data-id="${projectId}"] .compare-checkbox input`);
            if (checkbox) checkbox.checked = false;
            return;
        }
    }
    
    updateCompareBar();
}

// Update compare bar visibility
function updateCompareBar() {
    let compareBar = document.getElementById('compare-bar');
    
    if (!compareBar) {
        compareBar = document.createElement('div');
        compareBar.id = 'compare-bar';
        compareBar.className = 'compare-bar hidden';
        compareBar.innerHTML = `
            <span class="compare-count">0 selected</span>
            <div class="compare-actions">
                <button class="card-btn" onclick="clearCompare()">Clear</button>
                <button class="card-btn primary" onclick="showCompare()">Compare</button>
            </div>
        `;
        document.body.appendChild(compareBar);
    }
    
    const countEl = compareBar.querySelector('.compare-count');
    countEl.textContent = `${compareList.length} selected`;
    
    if (compareList.length > 0) {
        compareBar.classList.remove('hidden');
    } else {
        compareBar.classList.add('hidden');
    }
}

// Clear compare list
function clearCompare() {
    compareList = [];
    document.querySelectorAll('.compare-checkbox input').forEach(cb => {
        cb.checked = false;
    });
    updateCompareBar();
}

// Show compare modal
function showCompare() {
    const projectsToCompare = projects.filter(p => compareList.includes(p.id));
    
    elements.compareContent.innerHTML = `
        <div class="compare-grid">
            ${projectsToCompare.map(project => `
                <div class="compare-column">
                    <div class="compare-header">
                        <h3>${project.title}</h3>
                    </div>
                    <div class="compare-content">
                        <div class="compare-row">
                            <span>Category</span>
                            <strong>${project.category}</strong>
                        </div>
                        <div class="compare-row">
                            <span>Difficulty</span>
                            <span class="difficulty-badge ${project.difficulty.toLowerCase()}">${project.difficulty}</span>
                        </div>
                        <div class="compare-row">
                            <span>Time</span>
                            <strong>${project.estimatedHours} hrs</strong>
                        </div>
                        <div class="compare-row">
                            <span>Material Cost</span>
                            <strong>$${project.materialCost}</strong>
                        </div>
                        <div class="compare-row">
                            <span>Selling Price</span>
                            <strong style="color: var(--secondary-color);">$${project.sellingPrice}</strong>
                        </div>
                        <div class="compare-row">
                            <span>Profit</span>
                            <strong style="color: var(--secondary-color);">$${project.profit}</strong>
                        </div>
                        <div class="compare-row">
                            <span>ROI</span>
                            <strong>${project.profitMargin}%</strong>
                        </div>
                        <div class="compare-row">
                            <span>Demand Score</span>
                            <strong>${project.marketData?.demandScore || 'N/A'}/100</strong>
                        </div>
                        <div class="compare-row">
                            <span>Market Price</span>
                            <strong>$${project.marketData?.avgMarketPrice || project.sellingPrice}</strong>
                        </div>
                    </div>
                </div>
            `).join('')}
        </div>
        
        <div style="margin-top: 2rem; padding: 1.5rem; background: var(--bg-primary); border-radius: var(--radius-lg);">
            <h3 style="margin-bottom: 1rem;">Recommendation</h3>
            <p style="color: var(--text-secondary);">
                ${generateRecommendation(projectsToCompare)}
            </p>
        </div>
    `;
    
    elements.compareModal.classList.add('active');
}

// Generate comparison recommendation
function generateRecommendation(projects) {
    if (projects.length === 0) return 'Select projects to compare';
    
    // Calculate metrics
    const bestProfit = projects.reduce((best, p) => p.profit > best.profit ? p : best, projects[0]);
    const bestRoi = projects.reduce((best, p) => p.profitMargin > best.profitMargin ? p : best, projects[0]);
    const quickest = projects.reduce((best, p) => p.estimatedHours < best.estimatedHours ? p : best, projects[0]);
    const highestDemand = projects.reduce((best, p) => 
        (p.marketData?.demandScore || 0) > (best.marketData?.demandScore || 0) ? p : best, projects[0]);
    
    return `
        Based on your selection:
        <br><br>
        • <strong>Best Profit:</strong> ${bestProfit.title} ($${bestProfit.profit})
        <br>
        • <strong>Best ROI:</strong> ${bestRoi.title} (${bestRoi.profitMargin}%)
        <br>
        • <strong>Quickest:</strong> ${quickest.title} (${quickest.estimatedHours} hours)
        <br>
        • <strong>Highest Demand:</strong> ${highestDemand.title} (${highestDemand.marketData?.demandScore || 'N/A'}/100)
        <br><br>
        <strong>Suggested Priority:</strong> Consider ${quickest.title} for quick wins while building up to ${bestProfit.title} for maximum earnings.
    `;
}

// Show project details
function showDetails(projectId) {
    const project = projects.find(p => p.id === projectId);
    if (!project) return;
    
    elements.detailTitle.textContent = project.title;
    
    elements.detailContent.innerHTML = `
        <div class="detail-grid">
            <div class="detail-section">
                <h3><i class="fas fa-info-circle"></i> Project Overview</h3>
                <div class="detail-row">
                    <span class="detail-label">Source</span>
                    <span class="detail-value">${project.source}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Category</span>
                    <span class="detail-value">${project.category}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Difficulty</span>
                    <span class="detail-value">
                        <span class="difficulty-badge ${project.difficulty.toLowerCase()}">${project.difficulty}</span>
                    </span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Pages in Plan</span>
                    <span class="detail-value">${project.pageCount}</span>
                </div>
                ${project.hasCutList ? `
                    <div class="detail-row">
                        <span class="detail-label">Cut List</span>
                        <span class="detail-value"><i class="fas fa-check" style="color: var(--secondary-color);"></i> Included</span>
                    </div>
                ` : ''}
            </div>
            
            <div class="detail-section">
                <h3><i class="fas fa-dollar-sign"></i> Financial Breakdown</h3>
                <div class="detail-row">
                    <span class="detail-label">Material Cost</span>
                    <span class="detail-value">$${project.materialCost}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Selling Price</span>
                    <span class="detail-value">$${project.sellingPrice}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Profit</span>
                    <span class="detail-value profit">$${project.profit}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">ROI</span>
                    <span class="detail-value profit">${project.profitMargin}%</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Est. Market Price</span>
                    <span class="detail-value">$${project.marketData?.avgMarketPrice || project.sellingPrice}</span>
                </div>
            </div>
            
            <div class="detail-section">
                <h3><i class="fas fa-clock"></i> Time Requirements</h3>
                <div class="detail-row">
                    <span class="detail-label">Total Hours</span>
                    <span class="detail-value">${project.estimatedHours} hours</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Est. Days (4hr/day)</span>
                    <span class="detail-value">${project.estimatedDays} days</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Hourly Rate</span>
                    <span class="detail-value">$${Math.round(project.profit / project.estimatedHours)}/hr</span>
                </div>
            </div>
            
            <div class="detail-section">
                <h3><i class="fas fa-tools"></i> Required Tools</h3>
                <div class="project-tools" style="padding: 1rem 0;">
                    ${(project.tools || []).map(tool => `<span class="tool-tag" style="font-size: 0.875rem; padding: 0.25rem 0.5rem;">${tool}</span>`).join('')}
                </div>
            </div>
            
            <div class="detail-section full-width">
                <h3><i class="fas fa-chart-line"></i> Market Analysis (Montreal Area)</h3>
                <div class="detail-row">
                    <span class="detail-label">Demand Score</span>
                    <span class="detail-value">
                        ${project.marketData?.demandScore || 'N/A'}/100
                        ${project.marketData?.demandScore > 70 ? ' <i class="fas fa-fire" style="color: var(--danger-color);"></i>' : ''}
                    </span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Competition Level</span>
                    <span class="detail-value">${project.marketData?.competitionLevel || 'Medium'}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Nearby Areas</span>
                    <span class="detail-value">${(project.nearbyPostalCodes || []).length} within radius</span>
                </div>
                
                <h4 style="margin-top: 1.5rem; margin-bottom: 0.75rem; font-size: 0.875rem; color: var(--text-secondary);">
                    Similar Products Online
                </h4>
                <div class="market-listings">
                    ${(project.marketData?.similarProducts || []).slice(0, 3).map(product => `
                        <div class="market-item">
                            <div>
                                <div class="market-item-title">${product.title}</div>
                                <div class="market-item-platform">${product.platform} • ${product.sellerLocation} • ★${product.rating}</div>
                            </div>
                            <div style="text-align: right;">
                                <div class="market-item-price">$${product.price}</div>
                                <div style="font-size: 0.75rem; color: var(--text-muted);">${product.estimatedDelivery}</div>
                            </div>
                        </div>
                    `).join('')}
                </div>
                
                <div style="margin-top: 1rem;">
                    <a href="https://www.google.com/search?q=${encodeURIComponent(project.title + ' for sale Montreal')}" 
                       target="_blank" 
                       class="card-btn primary" 
                       style="display: inline-flex; text-decoration: none;">
                        <i class="fas fa-external-link-alt"></i> Search Live Listings
                    </a>
                </div>
            </div>
        </div>
        
        <div style="margin-top: 2rem; display: flex; gap: 1rem;">
            <button class="card-btn primary" onclick="viewPdf('${project.id}')" style="flex: 1; padding: 0.75rem;">
                <i class="fas fa-file-pdf"></i> Open PDF Plan
            </button>
        </div>
    `;
    
    elements.detailModal.classList.add('active');
}

// View PDF
function viewPdf(projectId) {
    const project = projects.find(p => p.id === projectId);
    if (!project) return;
    
    // Calculate relative path from web-catalog to the PDF
    const pdfPath = '../' + project.relativePath;
    
    elements.modalTitle.textContent = project.title;
    elements.pdfViewer.src = pdfPath;
    
    elements.pdfModal.classList.add('active');
}

// Close modals
document.getElementById('close-pdf-modal').addEventListener('click', () => {
    elements.pdfModal.classList.remove('active');
    elements.pdfViewer.src = '';
});

document.getElementById('close-detail-modal').addEventListener('click', () => {
    elements.detailModal.classList.remove('active');
});

document.getElementById('close-compare-modal').addEventListener('click', () => {
    elements.compareModal.classList.remove('active');
});

// Close on overlay click
elements.pdfModal.addEventListener('click', (e) => {
    if (e.target === elements.pdfModal || e.target.classList.contains('modal-overlay')) {
        elements.pdfModal.classList.remove('active');
        elements.pdfViewer.src = '';
    }
});

elements.detailModal.addEventListener('click', (e) => {
    if (e.target === elements.detailModal || e.target.classList.contains('modal-overlay')) {
        elements.detailModal.classList.remove('active');
    }
});

elements.compareModal.addEventListener('click', (e) => {
    if (e.target === elements.compareModal || e.target.classList.contains('modal-overlay')) {
        elements.compareModal.classList.remove('active');
    }
});

// Close on Escape key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        elements.pdfModal.classList.remove('active');
        elements.detailModal.classList.remove('active');
        elements.compareModal.classList.remove('active');
        elements.pdfViewer.src = '';
    }
});

// Initialize on load
document.addEventListener('DOMContentLoaded', loadData);

// Expose functions to window for onclick handlers
window.toggleCompare = toggleCompare;
window.showDetails = showDetails;
window.viewPdf = viewPdf;
window.clearCompare = clearCompare;
window.showCompare = showCompare;
window.clearFilter = clearFilter;