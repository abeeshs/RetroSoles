var express = require("express");
const commonController = require("../controller/commonController");
var router = express.Router();
var userController = require("../controller/userController");
var userMiddleware = require("../middlewares/userMiddleware");
const { use } = require("./admin");

//_________________________LOGIN SECTION________________________

/* GET users listing. */
router.get("/home",userController.viewHome)

//user signup
router.get("/signup", userController.getSignup);
router.post("/signup", userController.userSignup);

//user login
router.get("/login", userMiddleware.isLogin, userController.getLogin);
router.post("/login", userController.userLogin);

//user logout
router.get("/logout", userController.logOut);

//user login with OTP
router.get("/login-otp", userController.getOtpLogin);
router.post("/login-otp", userController.otpLogin);
router.get("/otp-submit", userController.getOtp);
router.post("/otp-submit", userController.submitOtp);

//resend otp
router.post("/login/resend-otp",userController.resendOtp)

//send otp for forget password
router.post("/forgot/otp",userController.sendForgetOtp)

//confirm OTP for forget password
router.post("/forget/confirm-otp",userController.confirmForgetOtp)

//create new password page
router.get("/create-new-password/:id",userController.getResetPassword)
router.post("/create-new-password",userController.resetPassword)

//_______________________________PRODUCTS SECTION__________________________

//view all products
router.get("/products",userController.viewProducts);

//product single View
router.get("/products/view-product/:id",userController.singleView);

//get cart page
router.get("/cart", userMiddleware.isLogout, userController.viewCart);

// add-to-cart
//router.get("/add-to-cart/:id", userMiddleware.isLogout, userController.addToCart);
router.post("/add-to-cart", userMiddleware.isLogout, userController.addToCart);

//changing product quantity
router.post("/change-product-quantity",userMiddleware.isLogout,userController.changeQuantity,userController.getTotalAmount);

//remove item from cart
router.get("/cart/remove-item/",userMiddleware.isLogout, userController.removeProduct);

//get checkout product page
router.get("/checkout-product",userMiddleware.isLogout,userController.checkoutProduct);

//Contact us page
router.get("/contact-us",userController.getContactUsPage);

//add products to wishlist
router.get("/add-to-wishlist/:id",userMiddleware.isLogout,userController.addWishlist)

//remove from wishist
router.get("/wishlist/remove-product/:id",userMiddleware.isLogout,userController.removeWishlistProduct);

//______________________________PLACE ORDER SECTION__________________________


//place order
router.post("/place-order",userMiddleware.isLogout,userController.orderPlace);

//Razorpay payment verifying
router.post('/verify-payment',userMiddleware.isLogout,userController.varifyPayment);

//paypal 
router.get('/success',userMiddleware.isLogout,userController.paypalSuccess)


//_______________________________USER PROFILE SECTION________________________________

//get user profile page
router.get("/user-profile",userMiddleware.isLogout,userController.viewUserProfile);

//update user profile
router.post("/update-profile",userMiddleware.isLogout,userController.updateProfile);

//change Password
router.post("/change-password",userMiddleware.isLogout,userController.changePassword)


//all address page user side
router.get("/user-all-address",userMiddleware.isLogout,userController.viewUserallAddresss);

//get all orders page
router.get("/orders-list", userMiddleware.isLogout,userController.viewOrdersList);

//get add address page
router.get("/add-address", userMiddleware.isLogout,userController.getAddAddress);
router.post("/add-address", userMiddleware.isLogout,userController.addAddress);

//edit address
router.get("/edit-address/:id",userMiddleware.isLogout,userController.getEditAddress)
router.post("/edit-address/:id",userMiddleware.isLogout,userController.editAddress)

//delete address
router.get("/delete-address/:id",userMiddleware.isLogout,userController.deleteAddress)

//add new delivery address
router.post("/add-delivery-addresss",userMiddleware.isLogout, userController.addDeliveryAddress);

//cancel orders
router.get("/cancel-order/",userMiddleware.isLogout,userController.orderCancel)

//wishlist
router.get("/wishlist",userMiddleware.isLogout,userController.getWishlist);
router.get("/wishlistTotal",commonController.wishlistCount)

//apply coupon
router.post("/apply-coupon",userMiddleware.isLogout,userController.applyCoupon)

//wallet
router.get("/wallet",userMiddleware.isLogout,userController.viewWallet);

//download invoice
router.get("/getInvoice/:id",userMiddleware.isLogout,userController.downloadInvoice);

//return product
router.get("/return-product",userMiddleware.isLogout,userController.returnProduct)







module.exports = router;
