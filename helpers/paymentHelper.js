const { RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET } = process.env;
const Razorpay = require('razorpay'); 

let instance = new Razorpay({
  key_id: RAZORPAY_KEY_ID,
  key_secret: RAZORPAY_KEY_SECRET,
});

module.exports.createPayment = async (orderId,grandTotal)=>{
const payment = await instance.orders.create({
    amount: grandTotal*100,
currency: "INR",
receipt: `#${orderId}`,
notes : {
  order_Id : orderId
}
})
return payment
}
