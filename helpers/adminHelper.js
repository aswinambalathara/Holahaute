const couponSchema = require("../models/couponModel");
const orderSchema = require("../models/orderModel");
const userSchema = require("../models/userModel");
const { ObjectId } = require("mongodb");
const excelJs = require("exceljs");
const pdfKit = require("pdfkit");
//const pdfTable = require("voilab-pdf-table");

module.exports.orderInfoHelper = async (orderDocId) => {
  try {
    const order = await orderSchema.aggregate([
      {
        $match: { _id: new ObjectId(orderDocId) },
      },
      {
        $lookup: {
          from: "addresses",
          localField: "addressId",
          foreignField: "_id",
          as: "address",
        },
      },
      { $unwind: "$products" },
      {
        $lookup: {
          from: "products",
          localField: "products.productId",
          foreignField: "_id",
          as: "product",
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "user",
        },
      },
      {
        $group: {
          _id: "$_id",
          user: {
            $push: {
              userId: "$user._id",
              userName: "$user.fullName",
              email: "$user.email",
              mobile: "$user.phone",
            },
          },
          orderStatus: {
            $push: {
              orderId: "$orderId",
              orderDate: "$orderedAt",
              updateDate: "$updatedAt",
              orderTotal: "$grandTotal",
              orderStatus: "$orderStatus",
              orderStage: "$orderStage",
              shippingAddress: "$address",
              paymentMethod: "$paymentMethod",
              cancelReason: "$cancelReason",
              returnReason: "$returnReason",
            },
          },
          products: {
            $push: {
              productName: "$product.productName",
              productId: "$product._id",
              size: "$products.size",
              color: "$products.color",
              price: "$product.price",
              quantity: "$products.quantity",
              productImages: "$product.images",
            },
          },
        },
      },
    ]);

    return order[0];
  } catch (error) {
    console.log(error);
  }
};

module.exports.dashboardUsersHelp = async () => {
  try {
    const dashboardUsers = await userSchema.aggregate([
      {
        $group: {
          _id: null,
          totalUsers: { $sum: 1 },
          activeUsers: {
            $sum: {
              $cond: { if: { $eq: ["$isBlocked", false] }, then: 1, else: 0 },
            },
          },
          blockedUsers: {
            $sum: {
              $cond: { if: { $eq: ["$isBlocked", true] }, then: 1, else: 0 },
            },
          },
        },
      },
    ]);
    return dashboardUsers;
    //console.log(dashboardUsers)
  } catch (error) {
    console.error(error);
  }
};

module.exports.generateExcelDoc = async (data, res) => {
  try {
    console.log(data);
    const workbook = new excelJs.Workbook();
    const workSheet = workbook.addWorksheet("salesReport");
    if (data.type === "daily") {
      const salesData = data.dates.map((date, index) => {
        return { date: date, sales: data.sales[index] };
      });
      workSheet.addRow(["Date", "Total Sales"]);
      salesData.forEach(({ date, sales }) => {
        workSheet.addRow([date, sales]);
      });
    } else if (data.type === "weekly") {
      const salesData = data.weeks.map((week, index) => {
        return { week: week, sales: data.sales[index] };
      });
      workSheet.addRow(["Week", "Total Sale"]);
      salesData.forEach(({ week, sales }) => {
        workSheet.addRow([week, sales]);
      });
    } else if (data.type === "monthly") {
      const salesData = data.months.map((month, index) => {
        return { month: month, sales: data.sales[index] };
      });

      workSheet.addRow(["Month", "Total Sale"]);
      salesData.forEach(({ month, sales }) => {
        workSheet.addRow([month, sales]);
      });
    } else if (data.type === "yearly") {
      const salesData = data.years.map((year, index) => {
        return { year: year, sales: data.sales[index] };
      });
      workSheet.addRow(["Year", "Total Sale"]);
      salesData.forEach(({ year, sales }) => {
        workSheet.addRow([year, sales]);
      });
    }

    const excelBuffer = await workbook.xlsx.writeBuffer();
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=sales_report_${data.type}.xlsx`
    );

    res.status(200).send(excelBuffer);
  } catch (error) {
    console.error(error);
  }
};

module.exports.generatePdfDoc = async (data, res) => {
  try {
    //console.log(data);
    const doc = new pdfKit();
    doc.pipe(res);
    doc.fontSize(16).text("Hola Haute", {
      align: "center",
    });
    doc.fontSize(14).text(data.description, {
      align: "center",
    });
    doc.moveDown(2);
    if (data.type === "monthly") {
      const salesData = data.months?.map((month, index) => {
        return [month, data.sales[index]];
      });
      console.log(salesData);
      const table = {
        headers: ["Months", "Total Sale"],
        rows: salesData,
        options: {
          rowSpacing: 25,
          cellPadding: 10,
          width: 500,
        },
      };
      drawTable(table, 150, 150, doc);
    } else if (data.type === "daily") {
      const salesData = data.dates?.map((date, index) => {
        return [date, data.sales[index]];
      });
      console.log(salesData);
      const table = {
        headers: ["Dates", "Total Sale"],
        rows: salesData,
        options: {
          rowSpacing: 25,
          cellPadding: 10,
          width: 500,
        },
      };
      drawTable(table, 150, 150, doc);
    } else if (data.type === "weekly") {
      const salesData = data.weeks?.map((week, index) => {
        return [week, data.sales[index]];
      });
      const table = {
        headers: ["Weeks", "Total Sale"],
        rows: salesData,
        options: {
          rowSpacing: 25,
          cellPadding: 10,
          width: 500,
        },
      };
      drawTable(table, 150, 150, doc);
      console.log(salesData);
    } else if (data.type === "yearly") {
      const salesData = data.years?.map((year, index) => {
        return [year, data.sales[index]];
      });
      console.log(salesData);
      const table = {
        headers: ["Years", "Total Sale"],
        rows: salesData,
        options: {
          rowSpacing: 25,
          cellPadding: 10,
          width: 500,
        },
      };
      drawTable(table, 150, 150, doc);
    }
    doc.end();
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=Sales-Report.pdf`
    );
  } catch (error) {
    console.error(error);
  }
};

function drawTable(table, startX, startY, doc) {
  const cellWidth = table.options.width / table.headers.length;
  doc.font("Helvetica-Bold");

  // Draw headers
  table.headers.forEach((header, i) => {
    doc.text(header, startX + i * cellWidth, startY);
  });

  doc.moveDown(); // Move cursor down for row content

  // Draw rows
  doc.font("Helvetica");
  table.rows.forEach((row, rowIndex) => {
    row.forEach((cell, cellIndex) => {
      doc.text(
        cell,
        startX + cellIndex * cellWidth,
        startY +
          table.options.rowSpacing +
          (rowIndex + 1) * table.options.rowSpacing
      );
    });
  });

  // Draw table outline
  const tableHeight = (table.rows.length + 1) * table.options.rowSpacing;
  doc.rect(
    startX,
    startY,
    table.options.width,
    tableHeight + table.options.rowSpacing
  );
}

module.exports.topSellHelp = async () => {
  const bestSales = await orderSchema.aggregate([
    {
      $match: {
        orderStatus: { $ne: "PENDING" },
      },
    },
    {
      $unwind: "$products",
    },
    {
      $facet: {
        bestSellingProducts: [
          {
            $group: { _id: "$products.productId", count: { $sum: 1 } },
          },
          {
            $lookup: {
              from: "products",
              localField: "_id",
              foreignField: "_id",
              as: "productDetails",
            },
          },
          {
            $unwind: "$productDetails",
          },
          {
            $group: {
              _id: "$_id",
              product: {
                $push: {
                  productName: "$productDetails.productName",
                  count: "$count",
                },
              },
            },
          },
          {
            $unwind: "$product",
          },
          {
            $sort: { "product.count": -1 },
          },
          {
            $limit : 10
          }
        ],
        bestSellingCategories: [
          {
            $lookup: {
              from: "products",
              localField: "products.productId",
              foreignField: "_id",
              as: "product",
            },
          },
          {
            $unwind: "$product",
          },
          {
            $group: {
              _id: "$product.category",
              categoryCount: { $sum: 1 },
            },
          },
          {
            $lookup: {
              from: "categories",
              localField: "_id",
              foreignField: "_id",
              as: "category",
            },
          },
          {
            $unwind: "$category",
          },
          {
            $group: {
              _id: "$_id",
              category: {
                $push: {
                  categoryName: "$category.categoryName",
                  count: "$categoryCount",
                },
              },
            },
          },
          {
            $unwind: "$category",
          },
          {
            $sort: { "category.count": -1 },
          },
          {
            $limit : 10
          }
        ],
      },
    },
  ]);

  //console.log(bestSales[0]);
  return bestSales[0];
};

