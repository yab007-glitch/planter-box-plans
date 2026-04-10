#!/usr/bin/env node
/**
 * Repricing Script for Woodworking Projects
 * Fixes unrealistic pricing in data/projects.json
 */

const fs = require('fs');
const path = require('path');

const DATA_PATH = path.join(__dirname, '..', 'data', 'projects.json');

// Minimum material costs by category (realistic values)
const MIN_MATERIAL_COSTS = {
  'Planter Boxes': { min: 15, max: 40 },
  'Raised Beds': { min: 30, max: 80 },
  'Tables': { min: 40, max: 120 },
  'Shelves': { min: 20, max: 60 },
  'Outdoor Furniture': { min: 40, max: 100 },
  'Benches': { min: 25, max: 60 },
  'Storage': { min: 30, max: 80 },
  'Cabinets': { min: 35, max: 100 },
  'Bookcases': { min: 25, max: 70 },
  'Beds': { min: 50, max: 150 },
  'Chairs': { min: 20, max: 60 },
  'Woodworking Projects': { min: 20, max: 80 },
  'default': { min: 20, max: 60 }
};

// Tiny items that should keep low material costs
const TINY_ITEMS = ['birdhouse', 'key rack', 'coaster', 'trivet', 'small box'];

function isTinyItem(title) {
  if (!title) return false;
  const lowerTitle = title.toLowerCase();
  return TINY_ITEMS.some(item => lowerTitle.includes(item));
}

function getMinMaterialCost(category, title) {
  if (isTinyItem(title)) {
    return { min: 5, max: 15 }; // Keep low for tiny items
  }
  const costRange = MIN_MATERIAL_COSTS[category] || MIN_MATERIAL_COSTS['default'];
  return costRange;
}

function getMarkupMultiplier(difficulty) {
  switch (difficulty) {
    case 'Easy':
      return { min: 2.5, max: 3.5 };
    case 'Intermediate':
      return { min: 3.0, max: 4.5 };
    case 'Expert':
      return { min: 4.0, max: 6.0 };
    default:
      return { min: 3.0, max: 4.0 };
  }
}

function hashString(str) {
  return str.split('').reduce((acc, c) => ((acc << 5) - acc + c.charCodeAt(0)) | 0, 0);
}

function deterministicRandom(seed, min, max) {
  const hash = Math.abs(seed);
  const normalized = (hash % 1000) / 1000;
  return min + normalized * (max - min);
}

function repriceProject(project, index) {
  const title = project.title || project.name || 'Untitled';
  const category = project.category || 'Woodworking Projects';
  const difficulty = project.difficulty || 'Easy';
  
  // Create deterministic seed from project id
  const seed = hashString(project.id || `proj_${index}`);
  
  // Adjust material cost if too low and not a tiny item
  let materialCost = project.materialCost || 0;
  const costRange = getMinMaterialCost(category, title);
  
  if (materialCost < costRange.min && !isTinyItem(title)) {
    // Generate a realistic material cost within the range
    materialCost = Math.round(deterministicRandom(seed, costRange.min, costRange.max));
  }
  
  // Calculate selling price based on difficulty
  const markup = getMarkupMultiplier(difficulty);
  const markupMultiplier = deterministicRandom(seed + 1, markup.min, markup.max);
  let sellingPrice = Math.round(materialCost * markupMultiplier);
  
  // Ensure selling price is at least material cost + $20 minimum profit
  const minSellingPrice = materialCost + 20;
  if (sellingPrice < minSellingPrice) {
    sellingPrice = minSellingPrice;
  }
  
  // Calculate profit and profit margin
  const profit = sellingPrice - materialCost;
  const profitMargin = Math.round((profit / sellingPrice) * 100);
  
  // Determine profit category
  let profitCategory;
  if (profit < 100) {
    profitCategory = '$50-$100 Profit Per Project';
  } else if (profit < 200) {
    profitCategory = '$100-$200 Profit Per Project';
  } else if (profit < 500) {
    profitCategory = '$200-$500 Profit Per Project';
  } else {
    profitCategory = '$500+ Profit Per Project';
  }
  
  return {
    ...project,
    materialCost,
    sellingPrice,
    profit,
    profitMargin,
    profitCategory
  };
}

function printStats(projects) {
  console.log('\n=== REPRICING SUMMARY ===\n');
  
  // Count by profit category
  const byProfitCategory = {};
  projects.forEach(p => {
    byProfitCategory[p.profitCategory] = (byProfitCategory[p.profitCategory] || 0) + 1;
  });
  
  console.log('Projects by Profit Category:');
  Object.entries(byProfitCategory).forEach(([cat, count]) => {
    console.log(`  ${cat}: ${count}`);
  });
  
  // Average profit by difficulty
  const byDifficulty = {};
  projects.forEach(p => {
    if (!byDifficulty[p.difficulty]) {
      byDifficulty[p.difficulty] = { total: 0, count: 0 };
    }
    byDifficulty[p.difficulty].total += p.profit;
    byDifficulty[p.difficulty].count++;
  });
  
  console.log('\nAverage Profit by Difficulty:');
  Object.entries(byDifficulty).forEach(([diff, data]) => {
    const avg = Math.round(data.total / data.count);
    console.log(`  ${diff}: $${avg} (n=${data.count})`);
  });
  
  // Average profit by category
  const byCategory = {};
  projects.forEach(p => {
    if (!byCategory[p.category]) {
      byCategory[p.category] = { total: 0, count: 0 };
    }
    byCategory[p.category].total += p.profit;
    byCategory[p.category].count++;
  });
  
  console.log('\nAverage Profit by Category:');
  Object.entries(byCategory).forEach(([cat, data]) => {
    const avg = Math.round(data.total / data.count);
    console.log(`  ${cat}: $${avg} (n=${data.count})`);
  });
  
  // Overall stats
  const totalProfit = projects.reduce((sum, p) => sum + p.profit, 0);
  const avgProfit = Math.round(totalProfit / projects.length);
  const avgMaterialCost = Math.round(projects.reduce((sum, p) => sum + p.materialCost, 0) / projects.length);
  const avgSellingPrice = Math.round(projects.reduce((sum, p) => sum + p.sellingPrice, 0) / projects.length);
  const avgMargin = Math.round(projects.reduce((sum, p) => sum + p.profitMargin, 0) / projects.length);
  
  console.log('\nOverall Statistics:');
  console.log(`  Total Projects: ${projects.length}`);
  console.log(`  Average Material Cost: $${avgMaterialCost}`);
  console.log(`  Average Selling Price: $${avgSellingPrice}`);
  console.log(`  Average Profit: $${avgProfit}`);
  console.log(`  Average Profit Margin: ${avgMargin}%`);
  
  // Show some examples of repriced projects
  console.log('\n=== SAMPLE REPRICED PROJECTS ===\n');
  const samples = projects.slice(0, 5);
  samples.forEach((p, i) => {
    console.log(`${i + 1}. ${p.title}`);
    console.log(`   Material: $${p.materialCost} → Selling: $${p.sellingPrice}`);
    console.log(`   Profit: $${p.profit} (${p.profitMargin}%) - ${p.profitCategory}`);
    console.log(`   Difficulty: ${p.difficulty}, Category: ${p.category}`);
    console.log();
  });
}

function main() {
  console.log('Loading projects from:', DATA_PATH);
  
  if (!fs.existsSync(DATA_PATH)) {
    console.error('Error: projects.json not found at', DATA_PATH);
    process.exit(1);
  }
  
  const rawData = fs.readFileSync(DATA_PATH, 'utf8');
  const projects = JSON.parse(rawData);
  
  console.log(`Loaded ${projects.length} projects`);
  console.log('Repricing...\n');
  
  // Reprice all projects
  const repricedProjects = projects.map((project, index) => repriceProject(project, index));
  
  // Write back to file
  fs.writeFileSync(DATA_PATH, JSON.stringify(repricedProjects, null, 2));
  console.log('Saved repriced projects to:', DATA_PATH);
  
  // Print statistics
  printStats(repricedProjects);
  
  // Verify JSON is valid
  const verifyData = JSON.parse(fs.readFileSync(DATA_PATH, 'utf8'));
  console.log(`\n✓ Verified: ${verifyData.length} projects written successfully`);
}

main();
