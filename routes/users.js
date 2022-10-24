var express = require("express");
const commonHelper = require("../helpers/common-helper");
var router = express.Router();
var userHelper = require("../helpers/users-healper");
var userMiddleware = require("../middlewares/userMiddleware");
const { use } = require("./admin");

/* GET users listing. */
router.get("/home",userHelper.viewHome)

//user signup
router.get("/signup", userHelper.getSignup);
router.post("/signup", userHelper.userSignup);

//user login
router.get("/login", userMiddleware.isLogin, userHelper.getLogin);
router.post("/login", userHelper.userLogin);

//user logout
router.get("/logout", userHelper.logOut);

//user login with OTPwishlistCount
router.get("/login-otp", userHelper.getOtpLogin);
router.post("/login-otp", userHelper.otpLogin);
router.get("/otp-submit", userHelper.getOtp);
router.post("/otp-submit", userHelper.submitOtp);

//resend otp
router.post("/login/resend-otp",userHelper.resendOtp)

//view all products
router.get("/products", userMiddleware.isLogout,userHelper.viewProducts);

//product single View
router.get("/products/view-product/:id",userMiddleware.isLogout,userHelper.singleView);

//get cart page
router.get("/cart", userMiddleware.isLogout, userHelper.viewCart);

// add-to-cart
router.get("/add-to-cart/:id", userMiddleware.isLogout, userHelper.addToCart);

//remove item from cart
router.get("/cart/remove-item/", userHelper.removeProduct);

//get checkout product page
router.get("/checkout-product",userMiddleware.isLogout,userHelper.checkoutProduct);

//place order
router.post("/place-order",userMiddleware.isLogout,userHelper.orderPlace);

//Razorpay payment verifying
router.post('/verify-payment',userMiddleware.isLogout,userHelper.varifyPayment);

//paypal 
router.get('/success',userHelper.paypalSuccess)

//changing product quantity
router.post("/change-product-quantity",userHelper.changeQuantity,userHelper.getTotalAmount);

//get user profile page
router.get("/user-profile",userMiddleware.isLogout,userHelper.viewUserProfile);

//update user profile
router.post("/update-profile",userMiddleware.isLogout,userHelper.updateProfile);

//change Password
router.post("/change-password",userHelper.changePassword)

//Contact us page
router.get("/contact-us",userHelper.getContactUsPage)

//all address page user side
router.get("/user-all-address",userMiddleware.isLogout,userHelper.viewUserallAddresss);

//get all orders page
router.get("/orders-list", userMiddleware.isLogout,userHelper.viewOrdersList);

//get add address page
router.get("/add-address", userMiddleware.isLogout,userHelper.getAddAddress);
router.post("/add-address", userMiddleware.isLogout,userHelper.addAddress);

//edit address
router.get("/edit-address/:id",userMiddleware.isLogout,userHelper.getEditAddress)
router.post("/edit-address/:id",userMiddleware.isLogout,userHelper.editAddress)

//delete address
router.get("/delete-address/:id",userMiddleware.isLogout,userHelper.deleteAddress)

//add new delivery address
router.post("/add-delivery-addresss",userMiddleware.isLogout, userHelper.addDeliveryAddress);

//cancel orders
router.get("/cancel-order/",userMiddleware.isLogout,userHelper.orderCancel)

//wishlist
router.get("/wishlist",userMiddleware.isLogout,userHelper.getWishlist);
router.get("/wishlistCount",commonHelper.wishlistCount)

//add products to wishlist
router.get("/add-to-wishlist/:id",userMiddleware.isLogout,userHelper.addWishlist)

//remove from wishist
router.get("/wishlist/remove-product/:id",userHelper.removeWishlistProduct)

//send otp for forget password
router.post("/forgot/otp",userHelper.sendForgetOtp)

//confirm OTP for forget password
router.post("/forget/confirm-otp",userHelper.confirmForgetOtp)

//create new password page
router.get("/create-new-password/:id",userHelper.getResetPassword)
router.post("/create-new-password",userHelper.resetPassword)

//apply coupon
router.post("/apply-coupon",userHelper.applyCoupon)

//wallet
router.get("/wallet",userHelper.viewWallet);

//download invoice
router.get("/getInvoice/:id",userHelper.downloadInvoice);

//return product
router.get("/return-product",userHelper.returnProduct)







module.exports = router;
