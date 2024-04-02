const orderSchema = require("../models/orderModel");

module.exports.monthlySalesHelp = async (year = new Date().getFullYear()) => {
  try {
    const monthlysales = await orderSchema.aggregate([
      {
        $match: {
          orderStatus: { $nin: ["ORDER CANCELLED", "CANCELLATION REQUESTED"] },
        },
      },
      {
        $group: {
          _id:{ month:{$month:"$orderedAt"} },
          totalSales: { $sum: "$grandTotal" },
        },
      },
    
    ]);
    console.log(monthlysales)
    return monthlysales
  } catch (error) {
    console.log(error);
  }
};

module.exports.yearlySalesHelp = () => {};
module.exports.weeklySalesHelp = (year, week) => {};
module.exports.dailySalesHelp = () => {};
