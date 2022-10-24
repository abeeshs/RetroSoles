const session = require("express-session");

exports.isLogin=(req,res,next)=>{
    if(req.session.loggedIn){
        res.redirect("/products")
    }else{
        next();
    }

}

exports.isLogout=(req,res,next)=>{
    if(req.session.loggedIn){
       next();
    }else{
        res.redirect("/login")
    }

}