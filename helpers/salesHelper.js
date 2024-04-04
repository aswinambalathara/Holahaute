const orderSchema = require("../models/orderModel");

module.exports.monthlySalesHelp = async (year) => {
  try {
    console.log(year);
    const months = Array.from({ length: 12 }, (_, i) => i + 1);
    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year + 1, 0, 1);
    //console.log(startDate," ",endDate)
    const monthlysales = await orderSchema.aggregate([
      {
        $match: {
          orderStatus: { $nin: ["ORDER CANCELLED", "CANCELLATION REQUESTED"] },
          orderedAt: { $gt: startDate, $lte: endDate },
        },
      },
      {
        $group: {
          _id: { $month: "$orderedAt" },
          totalSales: { $sum: "$grandTotal" },
        },
      },
    ]);

    const monthlysalesMap = months.reduce((acc, month) => {
      const matchingSale = monthlysales.find((sale) => sale._id === month);
      acc[month] = matchingSale ? matchingSale.totalSales : 0;
      return acc;
    }, {});

    let monthsArray = Object.keys(monthlysalesMap);
    let sales = Object.values(monthlysalesMap);

    return { monthsArray: monthsArray, sales: sales };
  } catch (error) {
    console.error(error);
  }
};
module.exports.dailySalesHelp = async (startDate, endDate) => {
  try {
    const datesArray = [];
    let currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      datesArray.push(currentDate.toISOString().substring(0, 10));
      currentDate.setDate(currentDate.getDate() + 1);
    }
    //console.log(datesArray);

    const dailySales = await orderSchema.aggregate([
      {
        $match: {
          orderStatus: { $nin: ["ORDER CANCELLED", "CANCELLATION REQUESTED"] },
          orderedAt: { $gt: startDate, $lte: endDate },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$orderedAt" } },
          totalSales: { $sum: "$grandTotal" },
        },
      },
    ]);

    const dailySalesMap = datesArray.reduce((acc, date) => {
      const matchingSale = dailySales.find((sale) => sale._id === date);
      acc[date] = matchingSale ? matchingSale.totalSales : 0;
      return acc;
    }, {});

    const dates = Object.keys(dailySalesMap);
    const sales = Object.values(dailySalesMap);

    return { dates, sales };
  } catch (error) {
    console.error(error);
  }
};
module.exports.yearlySalesHelp = (startYear, endYear) => {
  try {
  } catch (error) {
    console.error(error);
  }
};
module.exports.weeklySalesHelp = (startDate, endDate) => {
  try {
    const weekArray = [];
    let currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      let weekNumber = getISOWeek(currentDate);
      weekArray.push(weekNumber);
      currentDate.setDate(currentDate.getDate()+7);
    }
    console.log(weekArray);
  } catch (error) {
    console.error(error);
  }
};

function getISOWeek(date) {
  let jan4 = new Date(date.getFullYear(), 0, 4);
  return Math.ceil((((date - jan4) / 86400000) + jan4.getDay() + 1) / 7);
}