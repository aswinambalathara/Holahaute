const cartSchema = require('../models/cartModel');

module.exports.getCart = async (req,res) =>{
    try {
      res.render('shop/cart.ejs',{
        title : "Cart",
        user : req.session.userAuth
      });
    } catch (error) {
      console.log(error)
    }
    };

module.exports.addToCart = async (req,res) => {
    try {
        const userId = req.session.userAuthId
        const productId = req.params.id

        const cart = await cartSchema.findOne({userId : userId});
        if(cart){
          const exist = cart.cartItems.find(item => item.productId === productId);
          if(exist){
            await cartSchema.updateOne({userId : userId , 'cartItems.productId':productId},{
              $inc : {'cartItems.quantity' : 1}
            });
          }else{
          await cartSchema.updateOne({userId:userId,},{$push:{cartItems:{productId:productId}}});
        }
       }else{ 
        const newCart = await new cartSchema({
            userId: userId,
            items : [{productId : productId}]
          });
        }
    } catch (error) {
        console.log(error)
    }
}