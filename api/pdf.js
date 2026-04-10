const fs = require('fs');
const path = require('path');
const rateLimit = require('./_rateLimit');

module.exports = async (req, res) => {
  const limited = await rateLimit(req, res);
  if (limited) return;

  const { path: pdfPath } = req.query;
  
  if (!pdfPath) {
    return res.status(400).json({ error: 'PDF path required' });
  }
  
  // Security: prevent directory traversal
  const safePath = path.normalize(pdfPath).replace(/^(\.\.\/)+/, '');
  const fullPath = path.join(process.cwd(), '..', safePath);
  
  // Ensure path is within allowed directory
  const allowedDir = path.join(process.cwd(), '..');
  if (!fullPath.startsWith(allowedDir)) {
    return res.status(403).json({ error: 'Access denied' });
  }
  
  if (!fs.existsSync(fullPath) || !fullPath.endsWith('.pdf')) {
    return res.status(404).json({ error: 'PDF not found' });
  }
  
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', 'inline');
  res.setHeader('Cache-Control', 'public, max-age=86400');
  
  const stream = fs.createReadStream(fullPath);
  stream.pipe(res);
};