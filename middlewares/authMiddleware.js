const jwt = require('jsonwebtoken');

module.exports.isUserAuth = (req,res,next)=>{
if(!req.session.userAuthId){
    res.redirect('/login')
}else{
    next()
}

}

module.exports.isUserLoggedOut = (req,res,next)=>{
    if(req.session.userAuthId){
        res.redirect('/home');
    }else{
        next()
    }
    
}


module.exports.isAdminAuth = (req,res,next)=>{
    if(!req.session.adminAuth){
        res.redirect('/admin/login') 
    }else{
        next()
    }
    
}

module.exports.isAdminLoggedOut = (req,res,next)=>{
    if(req.session.adminAuth){
        res.redirect('/admin');
    }else{
        next()
    }
    
}


module.exports.isnewUser = (req,res,next)=>{
    if(!req.session.unVerifiedEmail){
        res.redirect('/signup');
    }
    next()
}

module.exports.forgotuser = (req,res,next)=>{
    if(!req.session.userWithOtp){
        res.redirect('/forgotpassword')
    }
    next()
}

































// module.exports.verifyUser = (req,res,next)=>{
//     const token = req.header('Authorization');
//     if(!token){
//        return res.redirect('/login').status(401)
//     }
//     try {
//         const decoded = jwt.verify(token,USER_TOKEN)
//         req.userId = decoded.userId;
//         next();
//     } catch (error) {
//         res.redirect('/login').status(401)
//     }
// }

// module.exports.verifyAdmin = (req,res,next) => {
//     const token = req.header('Authorization');
//     if(!token){
//        return res.redirect('/admin/login').status(401)
//     }
//     try {
//         const decoded = jwt.verify(token,ADMIN_TOKEN)
//         req.adminId = decoded.adminId;
//         next();
//     } catch (error) {
//         res.redirect('/admin/login').status(401)
//     }
// }