const getDateRange = (period) => {
  const now = new Date();
  const endDate = new Date(now);
  endDate.setHours(23, 59, 59, 999);

  let startDate;
  switch (period) {
    case 'daily':
      startDate = new Date(now);
      startDate.setHours(0, 0, 0, 0);
      break;
    case 'weekly':
      startDate = new Date(now);
      startDate.setDate(now.getDate() - 7);
      startDate.setHours(0, 0, 0, 0);
      break;
    case 'biweekly':
    case '15day':
      startDate = new Date(now);
      startDate.setDate(now.getDate() - 15);
      startDate.setHours(0, 0, 0, 0);
      break;
    case 'monthly':
    default:
      startDate = new Date(now);
      startDate.setDate(now.getDate() - 30);
      startDate.setHours(0, 0, 0, 0);
      break;
  }

  return { startDate, endDate };
};

module.exports = { getDateRange };
