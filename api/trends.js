const rateLimit = require('./_rateLimit');

// Mock trends data
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

const postalCodeToGeo = {
  'H3A': { geo: 'CA-QC', name: 'Montreal, QC' },
  'H3B': { geo: 'CA-QC', name: 'Montreal, QC' },
  'M5A': { geo: 'CA-ON', name: 'Toronto, ON' },
  'V5K': { geo: 'CA-BC', name: 'Vancouver, BC' },
  '10001': { geo: 'US-NY', name: 'New York, NY' },
  '90001': { geo: 'US-CA', name: 'Los Angeles, CA' },
  '60601': { geo: 'US-IL', name: 'Chicago, IL' },
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

function getGeoFromPostalCode(postalCode) {
  const prefix = getPostalCodePrefix(postalCode);
  return postalCodeToGeo[prefix] || { geo: 'CA', name: 'Canada' };
}

module.exports = async (req, res) => {
  // Rate limiting
  const limited = await rateLimit(req, res);
  if (limited) return;

  const { postalCode, radius = 25 } = req.query;
  
  if (!postalCode) {
    return res.status(400).json({ error: 'Postal code is required' });
  }
  
  if (!validatePostalCode(postalCode)) {
    return res.status(400).json({ error: 'Invalid postal code format' });
  }
  
  const geoData = getGeoFromPostalCode(postalCode);
  
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
};