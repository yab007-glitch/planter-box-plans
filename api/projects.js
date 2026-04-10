const fs = require('fs');
const path = require('path');
const rateLimit = require('./_rateLimit');

let projectsCache = null;
let cacheTime = 0;
const CACHE_TTL = 60 * 1000; // 1 minute

function loadProjects() {
  const now = Date.now();
  if (projectsCache && (now - cacheTime) < CACHE_TTL) {
    return projectsCache;
  }
  
  const projectsPath = path.join(process.cwd(), 'web-catalog', 'data', 'projects.json');
  if (!fs.existsSync(projectsPath)) {
    return [];
  }
  
  projectsCache = JSON.parse(fs.readFileSync(projectsPath, 'utf8'));
  cacheTime = now;
  return projectsCache;
}

module.exports = async (req, res) => {
  const limited = await rateLimit(req, res);
  if (limited) return;

  const { category, difficulty, minProfit, maxHours } = req.query;
  
  let projects = loadProjects();
  
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
    projects,
    total: projects.length,
    filters: { category, difficulty, minProfit, maxHours }
  });
};