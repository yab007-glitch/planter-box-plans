const rateLimit = require('./_rateLimit');

const seasonalData = {
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

function getNextPeakMonth(currentMonth) {
  const peakMonths = [2, 3, 4, 5, 6];
  for (const month of peakMonths) {
    if (month > currentMonth) return seasonalData.months[month].month;
  }
  return seasonalData.months[2].month;
}

module.exports = async (req, res) => {
  const limited = await rateLimit(req, res);
  if (limited) return;

  const currentMonth = new Date().getMonth();
  const monthData = seasonalData.months[currentMonth];
  
  res.json({
    ...seasonalData,
    currentMonth,
    currentMonthName: monthData.month,
    nextPeak: getNextPeakMonth(currentMonth)
  });
};