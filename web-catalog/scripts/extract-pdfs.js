#!/usr/bin/env node
/**
 * PDF Extraction and Analysis Script
 * Scans all PDF files, extracts text, and generates project metadata
 */

const fs = require('fs-extra');
const path = require('path');
const { glob } = require('glob');

// Try different PDF parsing approaches
let pdfParse;
try {
  const pdfModule = require('pdf-parse');
  pdfParse = typeof pdfModule === 'function' ? pdfModule : pdfModule.default;
} catch (e) {
  console.log('pdf-parse not available, using fallback extraction');
}

const ROOT_DIR = path.join(__dirname, '..', '..');
const OUTPUT_DIR = path.join(__dirname, '..', 'data');

// Project categories based on folder structure
const PROFIT_CATEGORIES = {
  '$50-$100 Profit Per Project': { min: 50, max: 100 },
  '$100-$200 Profit Per Project': { min: 100, max: 200 },
  '$200-$500 Profit Per Project': { min: 200, max: 500 },
  '$500+ Profit Per Project': { min: 500, max: 2000 }
};

const DIFFICULTY_LEVELS = ['Easy', 'Intermediate', 'Expert'];

/**
 * Extract text from a PDF file - tries multiple methods
 */
async function extractPdfText(filePath) {
  // Method 1: Try pdf-parse if available
  if (pdfParse) {
    try {
      const dataBuffer = await fs.readFile(filePath);
      const data = await pdfParse(dataBuffer);
      return {
        text: data.text || '',
        numpages: data.numpages || 0,
        info: data.info || {},
        method: 'pdf-parse'
      };
    } catch (e) {
      // Fall through to method 2
    }
  }
  
  // Method 2: Get file stats
  try {
    const stats = await fs.stat(filePath);
    const text = await fs.readFile(filePath, { encoding: 'utf8' }).catch(() => '');
    
    // Extract any readable text from the PDF binary
    const readableText = text.replace(/[^\x20-\x7E\n\r\t]/g, '');
    const relevantText = readableText.match(/[A-Z][a-z]+[^.]{10,200}/g) || [];
    
    return {
      text: relevantText.slice(0, 50).join(' ') || 'PDF content not extractable',
      numpages: Math.ceil(stats.size / 50000), // Rough estimate
      info: {},
      method: 'fallback'
    };
  } catch (error) {
    console.error(`Error with ${path.basename(filePath)}:`, error.message);
    return null;
  }
}

/**
 * Parse filename to extract project details
 */
function parseFilename(filename) {
  const nameWithoutExt = path.basename(filename, '.pdf');
  
  let source = 'Unknown';
  let projectName = nameWithoutExt;
  
  // Extract source if present
  if (nameWithoutExt.includes('_')) {
    const parts = nameWithoutExt.split('_');
    const knownSources = ['KregTool', 'ArchiveOrg', 'BobsPlans', 'WoodworkCity', 
                          'FamilyHandyman', 'FineWoodworking', 'RealCedar', 'TWW',
                          'AgMech', 'AgedWeb', 'Purdue', 'LSUAgCenter', 'GrowingPlaces',
                          'RebuildingTogether', 'UDel', 'AnneOfAllTrades', 'Lowes'];
    
    if (knownSources.some(s => parts[0].toLowerCase().includes(s.toLowerCase()))) {
      source = parts[0];
      projectName = parts.slice(1).join(' ');
    } else {
      projectName = parts.join(' ');
    }
  }
  
  // Clean up project name
  projectName = projectName
    .replace(/-/g, ' ')
    .replace(/([A-Z])/g, ' $1')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^WW\s+/, 'Woodworking ')
    .replace(/GBED\d+/, '')
    .replace(/Plans?\s*/gi, '')
    .trim();
  
  projectName = projectName.toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
  source = source.replace(/([A-Z])/g, ' $1').trim();
  
  return { source, projectName };
}

/**
 * Determine category from filename and path
 */
function determineCategory(filePath) {
  const lowerPath = filePath.toLowerCase();
  
  if (lowerPath.includes('planter')) return 'Planter Boxes';
  if (lowerPath.includes('raised') || lowerPath.includes('garden bed')) return 'Raised Beds';
  if (lowerPath.includes('table')) return 'Tables';
  if (lowerPath.includes('bench')) return 'Benches';
  if (lowerPath.includes('shelf')) return 'Shelving';
  if (lowerPath.includes('chair')) return 'Chairs';
  if (lowerPath.includes('bookcase') || lowerPath.includes('book')) return 'Bookcases';
  if (lowerPath.includes('bed')) return 'Beds';
  if (lowerPath.includes('cabinet')) return 'Cabinets';
  if (lowerPath.includes('trellis') || lowerPath.includes('vertical') || lowerPath.includes('living wall')) return 'Vertical Gardens';
  
  return 'Woodworking Projects';
}

/**
 * Get profit range from folder path
 */
function getProfitRange(filePath) {
  for (const [folder, range] of Object.entries(PROFIT_CATEGORIES)) {
    if (filePath.includes(folder)) {
      return { category: folder, ...range };
    }
  }
  return { category: 'Unknown', min: 0, max: 0 };
}

/**
 * Get difficulty from folder path
 */
function getDifficulty(filePath) {
  if (filePath.includes('Expert')) return 'Expert';
  if (filePath.includes('Intermediate')) return 'Intermediate';
  if (filePath.includes('Easy')) return 'Easy';
  return 'Easy';
}

/**
 * Analyze project complexity based on PDF content
 */
function analyzeComplexity(text, difficulty, filename) {
  const textLower = (text || '').toLowerCase();
  const fileLower = filename.toLowerCase();
  
  // Count steps/instructions
  const stepCount = (textLower.match(/step \d+|step\s*\d+/gi) || []).length;
  const hasCutList = /cut list|cutlist|materials list|parts list/i.test(textLower);
  const hasDiagrams = /diagram|figure|illustration|drawing|plan/i.test(textLower);
  
  // Estimate time based on difficulty
  let estimatedHours = 2;
  if (difficulty === 'Easy') estimatedHours = 2 + Math.random() * 4;
  else if (difficulty === 'Intermediate') estimatedHours = 6 + Math.random() * 8;
  else if (difficulty === 'Expert') estimatedHours = 12 + Math.random() * 20;
  
  // Adjust based on step count
  if (stepCount > 10) estimatedHours += 2;
  if (stepCount > 20) estimatedHours += 4;
  
  // Extract tools mentioned
  const commonTools = [
    'drill', 'saw', 'sander', 'router', 'chisel', 'clamp', 
    'miter saw', 'table saw', 'jigsaw', 'circular saw',
    'kreg jig', 'pocket hole', 'screw', 'nail', 'glue', 'hammer'
  ];
  
  const tools = commonTools.filter(tool => textLower.includes(tool));
  
  // If no tools found, estimate based on category
  if (tools.length === 0) {
    if (fileLower.includes('planter') || fileLower.includes('box')) {
      tools.push('drill', 'saw', 'measuring tape', 'screwdriver');
    } else if (fileLower.includes('table') || fileLower.includes('bed')) {
      tools.push('drill', 'table saw', 'clamp', 'measuring tape');
    } else {
      tools.push('basic woodworking tools');
    }
  }
  
  return {
    stepCount,
    hasCutList,
    hasDiagrams,
    estimatedHours: Math.round(estimatedHours),
    tools
  };
}

/**
 * Calculate pricing based on category and complexity
 */
function calculatePricing(profitRange, category, difficulty) {
  const baseMaterialCost = {
    'Planter Boxes': 25,
    'Raised Beds': 45,
    'Tables': 80,
    'Benches': 55,
    'Shelving': 35,
    'Chairs': 60,
    'Bookcases': 70,
    'Beds': 150,
    'Cabinets': 90,
    'Vertical Gardens': 40,
    'Woodworking Projects': 50
  };
  
  const materialCost = baseMaterialCost[category] || 50;
  
  let targetProfit = (profitRange.min + profitRange.max) / 2;
  let sellingPrice = materialCost + targetProfit;
  
  if (difficulty === 'Intermediate') {
    sellingPrice *= 1.2;
    targetProfit *= 1.2;
  } else if (difficulty === 'Expert') {
    sellingPrice *= 1.5;
    targetProfit *= 1.5;
  }
  
  return {
    materialCost: Math.round(materialCost),
    sellingPrice: Math.round(sellingPrice),
    profit: Math.round(targetProfit)
  };
}

/**
 * Generate search keywords for market research
 */
function generateSearchKeywords(projectName, category) {
  const keywords = [
    projectName,
    `${projectName} for sale`,
    `${projectName} price`,
    `handmade ${category.toLowerCase()}`,
    `custom ${category.toLowerCase()}`,
    `${category.toLowerCase()} Montreal`
  ];
  return keywords;
}

/**
 * Main extraction function
 */
async function extractAllPdfs() {
  console.log('🔍 Scanning for PDF files...\n');
  
  const pdfFiles = await glob('**/*.pdf', { 
    cwd: ROOT_DIR,
    absolute: true
  });
  
  console.log(`Found ${pdfFiles.length} PDF files\n`);
  
  const projects = [];
  let processed = 0;
  let failed = 0;
  
  for (const pdfFile of pdfFiles) {
    const relativePath = path.relative(ROOT_DIR, pdfFile);
    const filename = path.basename(pdfFile);
    
    process.stdout.write(`[${String(processed + failed + 1).padStart(3)}/${pdfFiles.length}] ${filename.slice(0, 50)}... `);
    
    try {
      const pdfData = await extractPdfText(pdfFile);
      
      if (!pdfData) {
        console.log('❌ Failed');
        failed++;
        continue;
      }
      
      const { source, projectName } = parseFilename(filename);
      const category = determineCategory(relativePath);
      const profitRange = getProfitRange(relativePath);
      const difficulty = getDifficulty(relativePath);
      const complexity = analyzeComplexity(pdfData.text, difficulty, filename);
      const pricing = calculatePricing(profitRange, category, difficulty);
      
      const project = {
        id: `proj_${Date.now()}_${processed}`,
        filename: filename,
        relativePath: relativePath,
        source: source,
        title: projectName,
        category: category,
        difficulty: difficulty,
        profitCategory: profitRange.category,
        estimatedHours: complexity.estimatedHours,
        estimatedDays: Math.ceil(complexity.estimatedHours / 4),
        tools: complexity.tools,
        hasCutList: complexity.hasCutList,
        hasDiagrams: complexity.hasDiagrams,
        stepCount: complexity.stepCount,
        materialCost: pricing.materialCost,
        sellingPrice: pricing.sellingPrice,
        profit: pricing.profit,
        profitMargin: Math.round((pricing.profit / pricing.sellingPrice) * 100),
        pageCount: pdfData.numpages,
        extractionDate: new Date().toISOString(),
        searchKeywords: generateSearchKeywords(projectName, category),
        location: {
          defaultPostalCode: 'H3A 0G4',
          defaultRadiusKm: 25,
          demand: 'medium'
        },
        marketData: {
          similarProducts: [],
          onlineListings: [],
          avgMarketPrice: pricing.sellingPrice,
          demandScore: 50,
          lastUpdated: null
        },
        tags: [category, difficulty, source.toLowerCase().replace(/\s/g, '-')],
        preview: (pdfData.text || '').substring(0, 300)
      };
      
      projects.push(project);
      processed++;
      console.log(`✅ (${pdfData.method})`);
      
    } catch (error) {
      console.log(`❌ Error: ${error.message}`);
      failed++;
    }
  }
  
  console.log(`\n📊 Extraction Complete:`);
  console.log(`   Processed: ${processed}`);
  console.log(`   Failed: ${failed}`);
  console.log(`   Total: ${processed + failed}\n`);
  
  // Save data
  await fs.ensureDir(OUTPUT_DIR);
  
  await fs.writeJson(
    path.join(OUTPUT_DIR, 'projects.json'),
    projects,
    { spaces: 2 }
  );
  
  // Generate summary stats
  const stats = {
    totalProjects: projects.length,
    byCategory: {},
    byDifficulty: {},
    byProfitRange: {},
    bySource: {},
    totalEstimatedHours: 0,
    totalPotentialProfit: 0,
    totalMaterialInvestment: 0,
    extractionDate: new Date().toISOString()
  };
  
  for (const project of projects) {
    stats.byCategory[project.category] = (stats.byCategory[project.category] || 0) + 1;
    stats.byDifficulty[project.difficulty] = (stats.byDifficulty[project.difficulty] || 0) + 1;
    stats.byProfitRange[project.profitCategory] = (stats.byProfitRange[project.profitCategory] || 0) + 1;
    stats.bySource[project.source] = (stats.bySource[project.source] || 0) + 1;
    stats.totalEstimatedHours += project.estimatedHours;
    stats.totalPotentialProfit += project.profit;
    stats.totalMaterialInvestment += project.materialCost;
  }
  
  await fs.writeJson(
    path.join(OUTPUT_DIR, 'stats.json'),
    stats,
    { spaces: 2 }
  );
  
  // Print summary
  console.log('💾 Data saved to:');
  console.log(`   ${path.join(OUTPUT_DIR, 'projects.json')}`);
  console.log(`   ${path.join(OUTPUT_DIR, 'stats.json')}\n`);
  
  console.log('📈 Summary Statistics:');
  console.log(`   Total Projects: ${stats.totalProjects}`);
  console.log(`   Total Estimated Hours: ${stats.totalEstimatedHours}`);
  console.log(`   Total Material Investment: $${stats.totalMaterialInvestment.toLocaleString()}`);
  console.log(`   Total Potential Profit: $${stats.totalPotentialProfit.toLocaleString()}`);
  console.log(`   ROI: ${((stats.totalPotentialProfit / stats.totalMaterialInvestment) * 100).toFixed(1)}%`);
  
  console.log('\n📁 By Category:');
  Object.entries(stats.byCategory)
    .sort((a, b) => b[1] - a[1])
    .forEach(([cat, count]) => {
      console.log(`   ${cat}: ${count}`);
    });
  
  console.log('\n🎓 By Difficulty:');
  Object.entries(stats.byDifficulty)
    .sort((a, b) => b[1] - a[1])
    .forEach(([diff, count]) => {
      console.log(`   ${diff}: ${count}`);
    });
  
  console.log('\n💰 By Profit Range:');
  Object.entries(stats.byProfitRange)
    .sort((a, b) => b[1] - a[1])
    .forEach(([range, count]) => {
      console.log(`   ${range}: ${count}`);
    });
  
  return projects;
}

extractAllPdfs().catch(console.error);
