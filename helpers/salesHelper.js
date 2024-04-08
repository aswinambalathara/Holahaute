const { ConnectionStates } = require("mongoose");
const orderSchema = require("../models/orderModel");

module.exports.monthlySalesHelp = async (year) => {
  try {
    // console.log(year);
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
module.exports.yearlySalesHelp = async (startYear, endYear) => {
  try {
    const startDate = new Date(startYear, 0, 1);
    const endDate = new Date(endYear + 1, 0, 1);
    //console.log(startDate,endDate);
    let yearsArray = [];
    let currentYear = startYear;
    while (currentYear <= endYear) {
      yearsArray.push(currentYear);
      currentYear++;
    }
    const yearlySales = await orderSchema.aggregate([
      {
        $match: {
          orderStatus: { $nin: ["ORDER CANCELLED", "CANCELLATION REQUESTED"] },
          orderedAt: { $gt: startDate, $lte: endDate },
        },
      },
      {
        $group: {
          _id: { $year: "$orderedAt" },
          totalSales: { $sum: "$grandTotal" },
        },
      },
    ]);
    const yearlySalesMap = yearsArray.reduce((acc, year) => {
      const matchingSale = yearlySales.find((sale) => sale._id === year);
      acc[year] = matchingSale ? matchingSale.totalSales : 0;
      return acc;
    }, {});
    //console.log(yearlySalesMap)
    const years = Object.keys(yearlySalesMap);
    const sales = Object.values(yearlySalesMap);
    return { years, sales };
  } catch (error) {
    console.error(error);
  }
};
module.exports.weeklySalesHelp = async (startDate, endDate) => {
  try {
    let weekArray = [];
    let currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      const weekNumber = getISOWeek(currentDate);
      if (!weekArray.includes(weekNumber)) {
        weekArray.push(weekNumber);
      }
      currentDate.setDate(currentDate.getDate() + 7);
    }

    const weeklySales = await orderSchema.aggregate([
      {
        $match: {
          orderStatus: { $nin: ["ORDER CANCELLED", "CANCELLATION REQUESTED"] },
          orderedAt: { $gt: startDate, $lte: endDate },
        },
      },
      {
        $group: {
          _id: { $week: "$orderedAt" },
          totalSales: { $sum: "$grandTotal" },
        },
      },
      {
        $project: {
          week: "$_id",
          totalSales: 1,
          _id: 0,
        },
      },
      {
        $sort: { week: 1 },
      },
    ]);

    const weeklySalesMap = weekArray.reduce((acc, week) => {
      const matchingSale = weeklySales.find((item) => item.week === week);
      acc[week] = matchingSale ? matchingSale.totalSales : 0;
      return acc;
    }, {});

    const sales = Object.values(weeklySalesMap);
    const weeks = Object.keys(weeklySalesMap);

    return { sales, weeks };
  } catch (error) {
    console.error(error);
  }
};

// module.exports.categorySalesHelp = async ()=>{
//   const categorySales = await orderSchema.aggregate([
//     {
//       $match:{
//         orderStatus: { $nin: ["ORDER CANCELLED", "CANCELLATION REQUESTED"] },
//       }
//     },
//     {
//       $project:{
//         products : 1,
//         grandTotal : 1,
//       }
//     },
//     {
//       $unwind:"$products"
//     },
//     {
//       $lookup:{
//         from : 'products',
//         localField : "products.productId",
//         foreignField : "_id",
//         as : "product"
//       }
//     },
//     {
//       $unwind : "$product"
//     },
//     {
//       $lookup : {
//         from : "categories",
//         localField : "product.category",
//         foreignField : "_id",
//         as : "category"
//       }
//     },
//     {
//       $unwind : "$category"
//     },
//     {$group:{_id:"$product.category"}}
//   ])

//   console.log(categorySales);
// }

module.exports.dashboardOrdersHelp = async () => {
  const dashboardOrders = await orderSchema.aggregate([
    {
      $group: {
        _id: null,
        totalOrders: { $sum: 1 },
        activeOrders: {
          $sum: {
            $cond: {
              if: {
                $not: {
                  $or: [
                    { $eq: ["$orderStatus", "ORDER CANCELLED"] },
                    { $eq: ["$orderStatus", "DELIVERED"] },
                    { $eq: ["$orderStatus", "CANCELLATION REQUESTED"] },
                    { $eq: ["$orderStatus", "ORDER RETURNED"] },
                  ],
                },
              },
              then: 1,
              else: 0,
            },
          },
        },
        cancelledOrders: {
          $sum: {
            $cond: {
              if: { $eq: ["$orderStatus", "ORDER CANCELLED"] },
              then: 1,
              else: 0,
            },
          },
        },
        deliveredOrders: {
          $sum: {
            $cond: {
              if: { $eq: ["$orderStatus", "DELIVERED"] },
              then: 1,
              else: 0,
            },
          },
        },
        returnedOrders: {
          $sum: {
            $cond: {
              if: { $eq: ["$orderStatus", "ORDER RETURNED"] },
              then: 1,
              else: 0,
            },
          },
        },
        overallSales: {
          $sum: {
            $cond: {
              if: {
                $not: {
                  $or: [
                    { $eq: ["$orderStatus", "ORDER CANCELLED"] },
                    { $eq: ["$orderStatus", "CANCELLATION REQUESTED"] },
                    { $eq: ["$orderStatus", "RETURNED"] },
                  ],
                },
              },
              then: "$grandTotal",
              else: 0,
            },
          },
        },
        totalDiscount :{$sum:"$couponApplied.couponDiscount"}
      },
    },
  ]);

  //console.log(dashboardOrders);
  return dashboardOrders;
};
// Function to get ISO week number
function getISOWeek(date) {
  const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
  const pastDaysOfYear = (date - firstDayOfYear) / 86400000;
  return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
}
