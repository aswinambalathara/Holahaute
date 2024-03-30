const { RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET } = process.env;
const crypto = require("crypto");
const Razorpay = require("razorpay");

let instance = new Razorpay({
  key_id: RAZORPAY_KEY_ID,
  key_secret: RAZORPAY_KEY_SECRET,
});

module.exports.createPayment = async (id, amount) => {
  const payment = await instance.orders.create({
    amount: amount * 100,
    currency: "INR",
    receipt: `#${id}`,
    notes: {
      order_Id: id,
    },
  });
  return payment;
};

module.exports.verifyPayment = async (response) => {
  try {
    const { razorpay_payment_id, razorpay_order_id, razorpay_signature } =
      response;
    let sign = crypto.createHmac("sha256", RAZORPAY_KEY_SECRET);
    sign.update(razorpay_order_id + "|" + razorpay_payment_id);
    sign = sign.digest("hex");
    if (sign === razorpay_signature) {
      return {status : true, paymentId : razorpay_payment_id}
    }
  } catch (error) {
    console.log(error);
  }
};
