const userSchema = require("../models/userModel");

module.exports.getAdminDashboard = (req, res) => {
  res.render("admin/dashboard",{title:"DashBoard"});
};


module.exports.getAdminUsers = async (req, res) => {
try { 
 const users =  await userSchema.find({})
 if(users){
  res.render("admin/adminUsers",{title:"Users",users,alert:req.flash('userstatus')});
 }
} catch (error) {
  console.log(error) 
}
};

module.exports.doUserBlock = async (req,res)=>{
  try {
    const {status} = req.body
    //console.log(req.params.id)
    if(status === 'clicked'){
      const user = await userSchema.findOne({_id:req.params.id});
      if(user.isBlocked === true){
       await userSchema.updateOne({_id:req.params.id},{$set:{
          isBlocked : false
        }});
       
        res.json({
          status: "unblocked"
        });
      }else{
        await userSchema.updateOne({_id:req.params.id},{$set:{
          isBlocked: true
        }});
        res.json({
          status: "blocked"
        })
      }
    }
  } catch (error) {
    console.log(error);
  }
}
