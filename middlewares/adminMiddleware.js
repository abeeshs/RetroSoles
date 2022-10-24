const session = require("express-session");

exports.isLogin=(req,res,next)=>{
    if(req.session.admin){
        res.redirect("/admin/dashboard")
    }else{
        next();
    }

}

exports.isLogout=(req,res,next)=>{
    if(req.session.admin){
        next();
    }else{
        res.redirect("/admin")
    }

}