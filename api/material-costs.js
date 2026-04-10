const rateLimit = require('./_rateLimit');

const materialCosts = {
  'H3A': {
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

function validatePostalCode(code) {
  if (!code || typeof code !== 'string') return false;
  const clean = code.toUpperCase().replace(/\s/g, '');
  if (/^[A-Z]\d[A-Z]\d[A-Z]\d$/.test(clean)) return true;
  if (/^[A-Z]\d[A-Z]$/.test(clean)) return true;
  if (/^\d{5}$/.test(clean)) return true;
  return false;
}

function getPostalCodePrefix(postalCode) {
  if (!postalCode) return null;
  const clean = postalCode.toUpperCase().replace(/\s/g, '');
  if (/^[A-Z]\d[A-Z]/.test(clean)) return clean.substring(0, 3);
  if (/^\d{5}/.test(clean)) return clean.substring(0, 5);
  return clean.substring(0, 3);
}

module.exports = async (req, res) => {
  const limited = await rateLimit(req, res);
  if (limited) return;

  const { postalCode } = req.query;
  
  if (!postalCode) {
    return res.status(400).json({ error: 'Postal code is required' });
  }
  
  if (!validatePostalCode(postalCode)) {
    return res.status(400).json({ error: 'Invalid postal code format' });
  }
  
  const prefix = getPostalCodePrefix(postalCode);
  const regionData = materialCosts[prefix] || materialCosts['default'];
  
  // Add slight variation based on postal code
  const variation = (postalCode.charCodeAt(0) % 10) / 100;
  
  const adjustedData = {
    ...regionData,
    postalCode,
    materials: regionData.materials.map(m => ({
      ...m,
      price: parseFloat((m.price * (1 + variation)).toFixed(2))
    }))
  };
  
  res.json(adjustedData);
};