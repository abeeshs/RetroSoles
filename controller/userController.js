var db = require("../config/connection");
const collection = require("../config/collection");
const session = require("express-session");
const { request } = require("express");
const ObjectId = require("mongodb").ObjectId;
const commonController = require("../controller/commonController");
const uuid = require("uuid");
const Razorpay = require("razorpay");
const paypal = require("paypal-rest-sdk");
const router = require("../routes/users");
const puppeteer = require("puppeteer");
const { readFile } = require("fs/promises");
const path = require("path");
const hbs = require("handlebars");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;

//________Razorpay Configure__________
var instance = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

//________Paypal cofigure________
paypal.configure({
  mode: "sandbox", //sandbox or live
  client_id:process.env.PAYPAL_CLIENT_ID,
  client_secret:process.env.PAYPAL_CLIENT_SECRET,
});

const client = require("twilio")(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

//-------Home Page Render-----------
//method - GET
//routr - /home
exports.viewHome = async (req, res) => {
  try {
    const user = req.session.user;
    const product = await db
      .get()
      .collection(collection.PRODUCT_COLLECTION)
      .find()
      .limit(4)
      .toArray();

    const banner = await db
      .get()
      .collection(collection.BANNER_COLLECTION)
      .find()
      .toArray();

    // Cart count
    const count = await commonController.getCartCount(req.session.user);
    console.log(count);
    res.render("user/index", {
      products: product,
      style: "products",
      active: true,
      banner: banner,
      Home: "active",
      user,
      count,
    });
  } catch (err) {
    console.log(err);
  }
};

//@Display  signup page
//method GET
//route /signup

exports.getSignup = async (req, res) => {
  try {
    let msg = req.session.err;

    res.render("user/register", { message: msg, user: true, style: "style" });
    req.session.err = null;
  } catch (err) {
    console.log(err);
  }
};

//@user signup
//method POST
//route /signup

exports.userSignup = async (req, res) => {
  try {
    if (
      !req.body.name ||
      !req.body.email ||
      !req.body.password ||
      !req.body.mobile
    ) {
      req.session.err = "All fields Required";
      res.redirect("/signup");
    } else if (req.body.password != req.body.confirmPassword) {
      req.session.err = "Password doesn't match*";
      res.redirect("/signup");
    } else {
      const userEmail = await db
        .get()
        .collection(collection.USER_COLLECTION)
        .findOne({ email: req.body.email });

      const userMobile = await db
        .get()
        .collection(collection.USER_COLLECTION)
        .findOne({ mobile: req.body.mobile });

      if (userEmail) {
        req.session.err = "Email already exist*";
        res.redirect("/signup");
      } else if (userMobile) {
        req.session.err = "Mobile already exist*";
        res.redirect("/signup");
      } else {
        let passwrd = await bcrypt.hash(req.body.password, 12);
        let userDetails = {
          name: req.body.name,
          email: req.body.email,
          mobile: req.body.mobile,
          password: passwrd,
          referralcode: `${req.body.name.trim()}${new Date().getTime()}`,
          status: "Active",
        };
        let user;
        //checking referral code
        if (req.body.referalcode) {
          const referralcode = req.body.referalcode;
          //checking referral code valid or not
          user = await db
            .get()
            .collection(collection.USER_COLLECTION)
            .findOne({ referralcode: referralcode });

          //if referral code is not valid
          if (!user) {
            req.session.err = "Invalid Refferal code";
            res.redirect("/home");
          } else {
            //creating new user

            const newUser = await db
              .get()
              .collection(collection.USER_COLLECTION)
              .insertOne(userDetails);

            req.session.loggedIn = true;
            req.session.user = newUser.insertedId;

            //adding referral code amount to new user wallet

            const newobj = {
              userId: ObjectId(newUser.insertedId),
              walletAmount: 100,
              transactions: [
                {
                  orderId: new ObjectId(),
                  date: commonController.date(),
                  mode: "Credit",
                  type: "Refferal signup Offer",
                  amount: 100,
                },
              ],
            };
            await db
              .get()
              .collection(collection.WALLET_COLLECTION)
              .insertOne(newobj);

            //if referral code is valid adding amount to existing user wallet
            //checking wallet exist or not

            const walletExist = await db
              .get()
              .collection(collection.WALLET_COLLECTION)
              .findOne({ userId: user._id });
            //if wallet exist pushing the document to the existing user
            if (walletExist) {
              const totalWallet = walletExist.walletAmount + 100;

              const objc = {
                orderId: new ObjectId(),
                date: commonController.date(),

                mode: "Credit",
                type: "Refferal Offer",
                amount: 100,
              };

              await db
                .get()
                .collection(collection.WALLET_COLLECTION)
                .updateOne(
                  { userId: user._id },
                  {
                    $set: { walletAmount: totalWallet },
                    $push: {
                      transactions: objc,
                    },
                  }
                );
            } else {
              //if wallet not exist creating new wallet
              const obj = {
                userId: user._id,
                walletAmount: 100,
                transactions: [
                  {
                    orderId: new ObjectId(),
                    date: commonController.date(),
                    mode: "Credit",
                    type: "Refferal Offer",
                    amount: 100,
                  },
                ],
              };
              await db
                .get()
                .collection(collection.WALLET_COLLECTION)
                .insertOne(obj);
            }
          }
          res.redirect("/home");
        } else {
          //creating new user
          const newUser = await db
            .get()
            .collection(collection.USER_COLLECTION)
            .insertOne(userDetails);

          req.session.loggedIn = true;
          req.session.user = newUser.insertedId;

          res.redirect("/home");
        }
      }
    }
  } catch (err) {
    console.log(err);
  }
};

//@Display user login page
//method GET
//route /login

exports.getLogin = async (req, res) => {
  try {
    const msg = req.session.err;
    res.render("user/login", { message: msg, user: true, style: "style" });
    req.session.err = null;
  } catch (err) {
    console.log(err);
  }
};

// res.render('user/login',{user:true,style:"style"});
//@User login to home
//method POST
//route /signup
exports.userLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      req.session.err = "Email and Password Required";
      res.redirect("back");
    } else {
      const user = await db
        .get()
        .collection(collection.USER_COLLECTION)
        .findOne({ email: email });
      console.log(user);

      if (user) {
        const correct = await commonController.comparePassword(
          password,
          user.password
        );
        if (user.status === "Block") {
          req.session.err = "You are temporarily blocked by Admin";
          res.redirect("/login");
        } else if (correct) {
          const userId = user._id;
          req.session.loggedIn = true;
          req.session.user = userId;
          res.redirect("products");
        } else {
          req.session.err = "Incorrect Email or Password";
          res.redirect("/login");
        }
      } else {
        req.session.err = "Incorrect Email or Password";
        res.redirect("/login");
      }
    }
  } catch (err) {
    console.log(err);
  }
};

//-------------Get OTP LOgin----------------

exports.getOtpLogin = async (req, res) => {
  try {
    const msg = req.session.msg;
    let div;
    if (req.session.msg) {
      div = "alert";
    } else {
    }

    res.render("user/otp-login", { message: msg, div, style: "style" });
    req.session.msg = null;
  } catch (err) {
    console.log(err);
  }
};

// -----------------OTP LOgin mobile-------------------
//post

exports.otpLogin = async (req, res) => {
  try {
    console.log(req.body);
    //checking the user exist or not
    const userExist = await db
      .get()
      .collection(collection.USER_COLLECTION)
      .findOne({ mobile: req.body.mobile });
      console.log(userExist)
    if (userExist) {
      client.verify
        .services(process.env.TWILIO_SERVICE_ID)
        .verifications.create({
          to: `+91${req.body.mobile}`,
          channel: "sms",
        })
        .then((data) => {
          console.log(data)
        })
        .catch((err)=>{
          console.log(err)
        })
      req.session.mobile = req.body.mobile;
      res.redirect("/otp-submit");
    } else {
      req.session.msg = "This number is not registered with RetroSoles";
      res.redirect("/login-otp");
    }
  } catch (err) {
    console.log(err);
  }
};

//---------------resend otp--------------
// method -post
exports.resendOtp = (req, res) => {
  try {
    client.verify
      .services(process.env.TWILIO_SERVICE_ID)
      .verifications.create({
        to: `+91${req.body.mobile}`,
        channel: "sms",
      })
      .then((data) => {});

    req.session.mobile = req.body.mobile;
    res.redirect("/otp-submit");
  } catch (err) {
    console.log(err);
  }
};

//-------------------Get OTP enter page-------------
//post

exports.getOtp = (req, res) => {
  const msg = req.session.message;
  const mobile = req.session.mobile;

  res.render("user/otp", { phoneNumber: mobile, message: msg, style: "style" });
  req.session.message = null;
};

//------------------submit otp--------------------
//post

exports.submitOtp = async (req, res) => {
  try {
    if (!req.body.code) {
      req.session.message = "Please enter valid OTP";
      res.redirect("/otp-submit");
    }

    const data = await client.verify
      .services(process.env.TWILIO_SERVICE_ID)
      .verificationChecks.create({
        to: `+91${req.body.mobile}`,
        code: req.body.code,
      });

    if (!data) {
      req.session.message = "Invalid OTP";
      res.redirect("/otp-submit");
    } else if (data.status === "approved") {
      req.session.loggedIn = true;
      res.redirect("/products");
    } else if (data.status === "pending") {
      req.session.message = "Invalid OTP";
      res.redirect("/otp-submit");
    } else {
      req.session.message = "Invalid OTP";
      res.redirect("/otp-submit");
    }
  } catch (err) {
    console.log(err);
  }
};

//-----------Send forgot password OTP-----------
exports.sendForgetOtp = async (req, res) => {
  try {
    const Mobile = req.body.mobile;
    if (Mobile.length < 10) {
      res.json({ err: "Mobile number minimum 10 digit" });
    } else if (Mobile.length > 10) {
      res.json({ err: "Mobile number maximum 10 digit" });
    } else {
      const userdetails = await db
        .get()
        .collection(collection.USER_COLLECTION)
        .find({ mobile: Mobile })
        .toArray();

      if (userdetails.length === 0) {
        res.json({ err: "Mobile number is incorrect" });
      } else {
        client.verify
          .services(process.env.TWILIO_SERVICE_ID)
          .verifications.create({
            to: `+91${req.body.mobile}`,
            channel: "sms",
          })
          .then((data) => {});

        res.json({ staus: true });
      }
    }
  } catch (err) {
    console.log(err);
  }
};

//-----------------Confirm forget password OTP-----------
//method-post
exports.confirmForgetOtp = async (req, res) => {
  try {
    const data = await client.verify
      .services(process.env.TWILIO_SERVICE_ID)
      .verificationChecks.create({
        to: `+91${req.body.mobile}`,
        code: req.body.otpnumber,
      });

    if (!data) {
      res.json({
        err: "Invalid OTP",
      });
    } else if (data.status === "approved") {
      res.json({
        status: true,
      });
    } else if (data.status === "pending") {
      res.json({
        err: "Invalid OTP",
      });
    } else {
      res.json({
        err: "Invalid OTP",
      });
    }
  } catch (err) {
    console.log(err);
  }
};

//-----------------get Create new password page---------
//method - GET
exports.getResetPassword = (req, res) => {
  const mobile = req.params.id;
  let err = req.session.err;
  res.render("user/new-password", { user: true, style: "style", mobile, err });
  req.session.err = null;
};

//-----------------Creating new password ---------
//method - POST
exports.resetPassword = async (req, res) => {
  try {
    const { password, confirm, mobile } = req.body;

    if (!req.body) {
      req.session.err = "Please enter password";
      res.redirect("/create-new-password/:id");
    } else if (password.length < 6) {
      req.session.err = "Password minimum 6 letter";
      res.redirect("/create-new-password/:id");
    } else if (password != confirm) {
      req.session.err = "Password did not match";
      res.redirect("/create-new-password/:id");
    } else {
      const pswd = await db
        .get()
        .collection(collection.USER_COLLECTION)
        .updateOne(
          { mobile: mobile },
          {
            $set: { password: password },
          }
        );
      const user = await db
        .get()
        .collection(collection.USER_COLLECTION)
        .findOne({ mobile: mobile });

      req.session.user = user._id;
      req.session.loggedIn = true;
      res.redirect("/home");
    }
  } catch (err) {
    console.log(err);
  }
};

//---------------view all products--------------
//method- GET
exports.viewProducts = async (req, res) => {
  try {
    //pagination
    let pageNo;
    if (req.query?.p) {
      pageNo = req.query.p - 1 || 0;
    }
    //sort by price
    let price = {};
    if (req.query?.sort) {
      price = {
        discountprice: req.query.sort,
      };
    }

    const limit = 9;
    let dbQuery = {};
    // filter by category
    if (req.query?.categoryId) {
      dbQuery = {
        subcategory: ObjectId(req.query.categoryId),
      };
    }
    //filter by brand
    else if (req.query?.brandId) {
      dbQuery = {
        brand: ObjectId(req.query.brandId),
      };
    } else if (req.query?.catId) {
      dbQuery = {
        category: req.query.catId,
      };
    } else if (req.query?.search) {
      dbQuery = {
        $text: { $search: req.query.search },
      };
    }

    result = await db
      .get()
      .collection(collection.PRODUCT_COLLECTION)
      .find(dbQuery)
      .skip(pageNo * limit)
      .limit(limit)
      .sort(price)
      .toArray();

    //to get wishlist products
    const wishlist = await db
      .get()
      .collection(collection.WISHLIST_COLLECTION)
      .findOne({ userId: ObjectId(req.session.user) });

    //if wishlist
    if (wishlist) {
      //assign wishlist true for wishlisted product
      if (wishlist.products.length > 0) {
        wishlist.products.forEach((item) => {
          const index = result.findIndex(
            (product) => product._id.toString() === item.product_Id.toString()
          );

          if (index !== -1) {
            result[index].wishlist = true;
          }
        });
      }
    }
    wishlist.map

    const product = await db
      .get()
      .collection(collection.PRODUCT_COLLECTION)
      .find()
      .toArray();
    // to get number of page

    let max = product.length / limit;
    let m = Math.ceil(max);
    let page = [];
    for (let i = 1; i <= m; i++) {
      page.push(i);
    }

    //   console.log(result);

    //to get all categories
    const categories = await db
      .get()
      .collection(collection.CATEGORY_COLLECTION)
      .find()
      .toArray();
    //to get all brand
    const brands = await db
      .get()
      .collection(collection.BRAND_COLLECTION)
      .find()
      .toArray();
    //----cart count function calling-----//
    const cartCount = await commonController.getCartCount(req.session.user);

    res.render("user/shop", {
      products: result,
      style: "products",
      active: true,
      count: cartCount,
      user: true,
      Shop: "active",
      page,
      brands,
      categories,
      proCount: product.length,
    });
  } catch (err) {
    console.log(err);
  }
};

//Get product single view page
//method-get
// route-/products/view-product/:id

exports.singleView = async (req, res) => {
  try {
    console.log("hi");
    console.log(req.params);
    const id = req.params.id;
    console.log({id});

    const agg = [
      {
        $match: {
          _id: ObjectId(id),
        },
      },
      {
        $lookup: {
          from: collection.CATEGORY_COLLECTION,
          localField: "subcategory",
          foreignField: "_id",
          as: "subcategory",
        },
      },
      {
        $lookup: {
          from: collection.BRAND_COLLECTION,
          localField: "brand",
          foreignField: "_id",
          as: "brand",
        },
      },
      {
        $unwind: {
          path: "$subcategory",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $unwind: {
          path: "$brand",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          product: 1,
          description: 1,
          category: 1,
          subcategory: "$subcategory.category",
          brand: "$brand.brand",
          size: 1,
          originalprice: 1,
          discountprice: 1,
          urls: 1,
          productDiscount: 1,
          categoryDiscount: 1,
        },
      },
    ];
    const product = await db
      .get()
      .collection(collection.PRODUCT_COLLECTION)
      .aggregate(agg)
      .toArray();
    console.log(product);

    //to get wishlist products
    console.log(req.session.user);
    const wishlist = await db
      .get()
      .collection(collection.WISHLIST_COLLECTION)
      .findOne({ userId: ObjectId(req.session.user),"products.product_Id":ObjectId(id)});
    console.log(wishlist);
    //if product is in wishlist
    let isWishlist;
    if(wishlist){
      isWishlist=true;
    }else{
      isWishlist=false;
    }
   


    // Cart count
    const count = await commonController.getCartCount(req.session.user);

    res.render("user/single-view", {
      products: product[0],
      style: "U-singleview",
      active: true,
      user: true,
      isWishlist,
      count,
    });
  } catch (err) {
    console.log(err);
  }
};

//logout user
//method-get
// route-/logout
exports.logOut = (req, res) => {
  req.session.user = null;
  req.session.destroy();

  res.set('Clear-Site-Data: "cookies", "storage", "executionContexts"');

  res.redirect("/login");
};

//@desc- View user cart page
//@method- GET
// @route- /cart

exports.viewCart = async (req, res) => {
  const userId = req.session.user;

  //------------get total amount of all product-------------//
  const total = await db
    .get()
    .collection(collection.CART_COLLECTION)
    .aggregate([
      {
        $match: { userId: ObjectId(userId) },
      },
      {
        $unwind: "$products",
      },
      {
        $project: {
          product_Id: "$products.product_Id",
          quantity: "$products.quantity",
        },
      },
      {
        $lookup: {
          from: collection.PRODUCT_COLLECTION,
          localField: "product_Id",
          foreignField: "_id",
          as: "result",
        },
      },
      {
        $project: {
          product_Id: 1,
          quantity: 1,
          result: { $arrayElemAt: ["$result", 0] },
        },
      },
      {
        $group: {
          _id: null,
          total: {
            $sum: { $multiply: ["$quantity", "$result.discountprice"] },
          },
        },
      },
    ])
    .toArray();

  //------------get all cart product-------------//

  // const cartItems = await db
  //   .get()
  //   .collection(collection.CART_COLLECTION)
  //   .aggregate([
  //     {
  //       $match: { userId: ObjectId(userId) },
  //     },
  //     {
  //       $unwind: "$products",
  //     },
  //     {
  //       $project: {
  //         product_Id: "$products.product_Id",
  //         quantity: "$products.quantity",
  //       },
  //     },
  //     {
  //       $lookup: {
  //         from: collection.PRODUCT_COLLECTION,
  //         localField: "product_Id",
  //         foreignField: "_id",
  //         as: "result",
  //       },
  //     },
  //     {
  //       $project: {
  //         product_Id: 1,
  //         quantity: 1,
  //         result: { $arrayElemAt: ["$result", 0] },
  //       },
  //     },
  //   ])
  //   .toArray();
  const agg = [
    {
      '$match': {
        userId: ObjectId(userId)
      }
    }, {
      '$unwind': {
        'path': '$products', 
        'preserveNullAndEmptyArrays': true
      }
    }, {
      '$project': {
        'product_Id': '$products.product_Id', 
        'quantity': '$products.quantity'
      }
    }, {
      '$lookup': {
        'from': 'product', 
        'localField': 'product_Id', 
        'foreignField': '_id', 
        'as': 'result'
      }
    }, {
      '$unwind': {
        'path': '$result', 
        'preserveNullAndEmptyArrays': true
      }
    }, {
      '$project': {
        'product_Id': 1, 
        'quantity': 1, 
        'result': 1, 
        'subtotal': {
          '$sum': {
            '$multiply': [
              '$quantity', '$result.discountprice'
            ]
          }
        }
      }
    }
  ];
  const cartItems = await db
    .get()
    .collection(collection.CART_COLLECTION)
    .aggregate(agg).toArray();
    console.log("---------------");
    console.log(cartItems);

  const totalAmount = total[0];
  const cartCount = await commonController.getCartCount(req.session.user);
  if (cartItems) {
    // const total=req.total
    req.cart = cartItems;

    res.render("user/shopping-cart", {
      cartItems,
      totalAmount,
      active: true,
      count: cartCount,
      user: true,
    });
  }
};

//@desc- Add product to cart
//@method- GET
// @route- /product/add-to-cart

exports.addToCart = async (req, res) => {
  try {
    if (req.session.loggedIn) {
      console.log("hi");
      console.log(req.body);

      const productId = ObjectId(req.body.productId);

      const userid = req.session.user;

      const proObj = {
        product_Id: productId,
        quantity: 1,
      };
      //-------Checking Cart Existing or not---------
      const userCart = await db
        .get()
        .collection(collection.CART_COLLECTION)
        .findOne({ userId: ObjectId(userid) });

      //--------------if cart Exist--------------------
      if (userCart) {
        const proExist = await db
          .get()
          .collection(collection.CART_COLLECTION)
          .find({
            userId: ObjectId(userid),
            products: { $elemMatch: { product_Id: productId } },
          })
          .toArray();

        //-----------------if product already not exist ----------
        if (proExist.length === 0) {
          const product = await db
            .get()
            .collection(collection.CART_COLLECTION)
            .updateOne(
              { userId: ObjectId(userid) },
              {
                $push: { products: proObj },
              }
            );

          //------------------if the product is exist-------------------
        } else {
          const product = await db
            .get()
            .collection(collection.CART_COLLECTION)
            .updateOne(
              { "products.product_Id": productId },
              {
                $inc: { "products.$.quantity": 1 },
              }
            );
        }

        //----------------If User Cart Does not exist----------------
      } else {
        const proObj = {
          userId: ObjectId(req.session.user),
          products: [{ product_Id: productId, quantity: 1 }],
        };

        const upProd = await db
          .get()
          .collection(collection.CART_COLLECTION)
          .insertOne(proObj);
      }

      res.json({
        status: true,
      });
    } else {
      
      res.json({
        status: false,
      });
    }
  } catch (err) {
    console.log(err);
  }
};

//@desc- romove product from cart
//@method- GET
// @route- /cart/remove-item

exports.removeProduct = async (req, res) => {
  const { cartId, productId } = req.query;
  console.log("hits here");

  const result = await db
    .get()
    .collection(collection.CART_COLLECTION)
    .updateOne(
      { _id: ObjectId(cartId) },
      {
        $pull: { products: { product_Id: ObjectId(productId) } },
      }
    );
  res.redirect("/cart");
};

//@desc- get product checkout page
//@method- GET
// @route- /product-checkout

exports.checkoutProduct = async (req, res) => {
  try {
    const userId = req.session.user;
    //------------get total amount of all product-------------//
    const total = await db
      .get()
      .collection(collection.CART_COLLECTION)
      .aggregate([
        {
          $match: { userId: ObjectId(userId) },
        },
        {
          $unwind: "$products",
        },
        {
          $project: {
            product_Id: "$products.product_Id",
            quantity: "$products.quantity",
          },
        },
        {
          $lookup: {
            from: collection.PRODUCT_COLLECTION,
            localField: "product_Id",
            foreignField: "_id",
            as: "result",
          },
        },
        {
          $project: {
            product_Id: 1,
            quantity: 1,
            result: { $arrayElemAt: ["$result", 0] },
          },
        },
        {
          $group: {
            _id: null,
            total: {
              $sum: { $multiply: ["$quantity", "$result.discountprice"] },
            },
          },
        },
      ])
      .toArray();

    //------------get all cart product-------------//

    const cartItems = await db
      .get()
      .collection(collection.CART_COLLECTION)
      .aggregate([
        {
          $match: { userId: ObjectId(userId) },
        },
        {
          $unwind: "$products",
        },
        {
          $project: {
            product_Id: "$products.product_Id",
            quantity: "$products.quantity",
          },
        },
        {
          $lookup: {
            from: collection.PRODUCT_COLLECTION,
            localField: "product_Id",
            foreignField: "_id",
            as: "result",
          },
        },
        {
          $project: {
            product_Id: 1,
            quantity: 1,
            result: { $arrayElemAt: ["$result", 0] },
          },
        },
      ])
      .toArray();

    const totalAmount = total[0];

    //---------------to get all user existing addresses--------------//

    const address = await db
      .get()
      .collection(collection.USER_COLLECTION)
      .find({ _id: ObjectId(userId) })
      .toArray();

    // Cart count
    const count = await commonController.getCartCount(req.session.user);
    const userAddress = address[0].address;

    res.render("user/checkout", {
      totalAmount,
      cartItems,
      userAddress,
      active: true,
      user: true,
      count,
    });
  } catch (err) {
    console.log(err);
  }
};

//________________________Place order2 ajax_____________________
exports.orderPlace = async (req, res) => {
  if (!req.body.selected || !req.body.productId) {
    res.json({ err: "Please select address" });
  } else if (!req.body.payment) {
    res.json({ err: "Please choose payment method" });
  } else {
    const addressId = req.body.selected;
    const userId = req.session.user;
    try {
      //----------to get shipping address----------
      const agg = [
        {
          $match: {
            _id: new ObjectId(userId),
          },
        },
        {
          $unwind: {
            path: "$address",
          },
        },
        {
          $match: {
            "address.address_id": addressId,
          },
        },
      ];
      const address = await db
        .get()
        .collection(collection.USER_COLLECTION)
        .aggregate(agg)
        .toArray();

      //-----------get cart items------------------
      const aggr = [
        {
          $match: {
            userId: ObjectId(userId),
          },
        },
        {
          $unwind: {
            path: "$products",
          },
        },
        {
          $project: {
            product_Id: "$products.product_Id",
            quantity: "$products.quantity",
            userId: 1,
          },
        },
        {
          $lookup: {
            from: collection.PRODUCT_COLLECTION,
            localField: "product_Id",
            foreignField: "_id",
            as: "result",
          },
        },
        {
          $unwind: {
            path: "$result",
          },
        },
        {
          $project: {
            product_Id: 1,
            _id: 0,
            userId: 1,
            quantity: 1,
            result: {
              product: 1,
              _id: 1,
              image: { $arrayElemAt: ["$result.urls", 1] },
              discountprice: 1,
              size: 1,
              originalprice: 1,
            },
            subTotal: {
              $multiply: ["$quantity", "$result.discountprice"],
            },
            priceTotal: {
              $multiply: ["$quantity", "$result.originalprice"],
            },
          },
        },
        {
          $group: {
            _id: "$userId",
            items: {
              $push: {
                productId: "$result._id",
                productName: "$result.product",
                quantity: "$quantity",
                offerSubTotal: "$subTotal",
                priceTotal: "$priceTotal",
                image: "$result.image",
                cancelled: false,
                returned: false,
                offerPrice: "$result.discountprice",
                price: "$result.originalprice",
              },
            },
            total: {
              $sum: "$priceTotal",
            },
            offer: {
              $sum: "$subTotal",
            },
          },
        },
      ];

      const cartItems = await db
        .get()
        .collection(collection.CART_COLLECTION)
        .aggregate(aggr)
        .toArray();

      let result;
      let discAmount = 0;
      let afterDisc = cartItems[0].offer;
      //if coupon applied
      if (req.body.couponId) {
        result = await db
          .get()
          .collection(collection.COUPONS_COLLECTION)
          .findOne({ coupon: req.body.couponId });

        const discount = result.discount; //coupon discount percentage
        discAmount = Math.floor((cartItems[0].offer * discount) / 100); //coupon discount amount in total price
        afterDisc -= discAmount;
        const productDiscount = discAmount / cartItems[0].items.length; // Coupon discount amount splitted equally

        //adding new field after applying coupon discount
        cartItems[0].items.forEach((item) => {
          item.discountedSubtotal = Math.floor(
            item.offerSubTotal - productDiscount
          );
        });

        //get user details
        const user = await db
          .get()
          .collection(collection.USER_COLLECTION)
          .findOne({ _id: ObjectId(req.session.user) });

        const obj = {
          userId: user._id,
          email: user.email,
          name: user.name,
        };
        //updating coupon
        await db
          .get()
          .collection(collection.COUPONS_COLLECTION)
          .updateOne(
            { coupon: req.body.couponId },
            {
              $push: {
                users: obj,
              },
            }
          );
      } else {
        //if coupon not available
        //adding new field
        cartItems[0].items.forEach((item) => {
          item.discountedSubtotal = item.offerSubTotal;
        });
      }
      //checking payment status
      if (req.body.payment === "COD") {
        var paymentStatus = "Confirmed";
      } else if (req.body.payment === "Paypal") {
        var paymentStatus = "Pending";
      } else if (req.body.payment === "Razorpay") {
        var paymentStatus = "Pending";
      } else {
        var paymentStatus = "Confirmed";
      }

      const obj = {
        userId: ObjectId(req.session.user),
        tracking_id: uuid.v4(),
        date: new Date(),
        ordered_on: commonController.date(),
        address: address[0].address,
        payment: {
          method: req.body.payment,
        },
        returnedAmount: 0,
        cancelledAmount: 0,
        couponApplied: result?.coupon ?? null,
        couponDiscount: result?.discount ?? null,
        couponPrice: Math.floor(discAmount) ?? null,
        orderstatus: paymentStatus,
        products: cartItems[0].items,
        totalAmountOriginal: cartItems[0].total,
        totalOfferPrice: cartItems[0].offer,
        totalAmountDiscounted: afterDisc,
        grandTotal: afterDisc,
      };
      // payment method is Wallet----------------------------------------------
      if (req.body.payment === "Wallet") {
        // checking user wallet
        console.log(req.session.user);
        const userWallet = await db
          .get()
          .collection(collection.WALLET_COLLECTION)
          .findOne({ userId: ObjectId(req.session.user) });

        //if user wallet is not awailable
        if (!userWallet) {
          res.json({ err: "Wallet amount is Zero" });

          //if wallet amount lessthan product price
        } else if (userWallet.walletAmount < afterDisc) {
          res.json({ err: "Insufficient Wallet balance" });
        } else {
          req.session.total = cartItems[0].offer;

          //creating order with wallet
          const order = await db
            .get()
            .collection(collection.ORDER_COLLECTION)
            .insertOne(obj);

          //deducting amount from wallet
          const totalWallet = userWallet.walletAmount - afterDisc;
          const objc = {
            orderId: order.insertedId,
            date: commonController.date(),

            mode: "Debit",
            type: "Product Purchase",
            amount: Math.floor(afterDisc),
          };

          await db
            .get()
            .collection(collection.WALLET_COLLECTION)
            .updateOne(
              { userId: ObjectId(req.session.user) },
              {
                $set: { walletAmount: totalWallet },
                $push: {
                  transactions: objc,
                },
              }
            );
          // ----------------------Deleting Cart Items-------------------

          const deleteCart = await db
            .get()
            .collection(collection.CART_COLLECTION)
            .deleteMany({ userId: ObjectId(userId) });
          res.json({ codSuccess: true });
        }

        return;
      }

      req.session.total = cartItems[0].offer;
      const order = await db
        .get()
        .collection(collection.ORDER_COLLECTION)
        .insertOne(obj);
      // const order = await db
      //   .get()
      //   .collection(collection.ORDER_COLLECTION)
      //   .insertOne(obj);

      req.session.OrderId = order.insertedId.toString();
      //place order with COD
      if (req.body.payment === "COD") {
        // ----------------------Deleting Cart Items-------------------

        const deleteCart = await db
          .get()
          .collection(collection.CART_COLLECTION)
          .deleteMany({ userId: ObjectId(userId) });
        res.json({ codSuccess: true });
        //
      } else if (req.body.payment === "Razorpay") {
        //---------------------Creating Razorpay-------------------
        try {
          let Order = await instance.orders.create({
            amount: afterDisc * 100 || cartItems[0].offer * 100,
            currency: "INR",
            receipt: order.insertedId.toString(),
          });

          res.json({
            Order,
          });
        } catch (err) {
          console.log(err);
        }
        //------------------------Creating paypal-----------------------
      } else if (req.body.payment === "Paypal") {
        const cartItems = await db
          .get()
          .collection(collection.CART_COLLECTION)
          .aggregate(aggr)
          .toArray();

        let amount;
        if (afterDisc) {
          amount = afterDisc / 81;
        } else {
          amount = cartItems[0].offer / 81;
        }

        const create_payment_json = {
          intent: "sale",
          payer: {
            payment_method: "paypal",
          },
          redirect_urls: {
            return_url: "http://localhost:3000/success",
            cancel_url: "http://localhost:3000/cancel",
          },
          transactions: [
            {
              item_list: {
                items: [
                  {
                    name: "Red Sox Hat",
                    sku: req.session.user,
                    price: Math.ceil(amount),
                    currency: "USD",
                    quantity: 1,
                  },
                ],
              },
              amount: {
                currency: "USD",
                total: Math.ceil(amount),
              },
              description: "Hat for the best team ever",
            },
          ],
        };

        paypal.payment.create(create_payment_json, function (error, payment) {
          if (error) {
            console.log(error.message);
          } else {
            for (let i = 0; i < payment.links.length; i++) {
              if (payment.links[i].rel === "approval_url") {
                res.json({ paypal: true, link: payment.links[i].href });
              }
            }
          }
        });
      }
    } catch (err) {
      console.log(err);
    }
  }
};
//-----------paypal Success route-----------------
exports.paypalSuccess = async (req, res) => {
  try {
    const userId = req.session.user;
    const id = req.session.OrderId;
    const orderDetails = await db
      .get()
      .collection(collection.ORDER_COLLECTION)
      .findOne({ _id: ObjectId(id) });

    let amount = Math.ceil(orderDetails.total / 81);

    var execute_payment_json = {
      payer_id: req.query.PayerID,
      transactions: [
        {
          amount: {
            currency: "USD",
            total: amount,
          },
        },
      ],
    };

    const paymentId = req.query.paymentId;
    paypal.payment.execute(
      paymentId,
      execute_payment_json,
      async function (error, payment) {
        if (error) {
          console.log(error);
        } else {
          const result = await db
            .get()
            .collection(collection.ORDER_COLLECTION)
            .updateOne(
              { _id: ObjectId(id) },
              {
                $set: { orderstatus: "Confirmed" },
              }
            );

          // ----------------------Deleting Cart Items-------------------

          const deleteCart = await db
            .get()
            .collection(collection.CART_COLLECTION)
            .deleteMany({ userId: ObjectId(req.session.user) });
          res.redirect("/orders-list");
        }
      }
    );
    req.session.OrderId = null;
  } catch (err) {
    console.log(err);
  }
};

//----------Razorpay payment varifying------------
exports.varifyPayment = async (req, res) => {
  try {
    const details = req.body;
    console.log(details);
    const objId = req.body["order[Order][receipt]"];

    let hmac = crypto.createHmac("sha256", "3InpvAluEcXyWP1BuKEZKwla");
    hmac.update(
      details["payment[razorpay_order_id]"] +
        "|" +
        details["payment[razorpay_payment_id]"]
    );
    hmac = hmac.digest("hex");

    if (hmac == details["payment[razorpay_signature]"]) {
      const result = await db
        .get()
        .collection(collection.ORDER_COLLECTION)
        .updateOne(
          { _id: ObjectId(objId) },
          {
            $set: { orderstatus: "Confirmed" },
          }
        );

      // ----------------------Deleting Cart Items-------------------

      const deleteCart = await db
        .get()
        .collection(collection.CART_COLLECTION)
        .deleteMany({ userId: ObjectId(req.session.user) });

      res.json({ status: true });
    } else {
      console.log("payment failed");
      res.json({ status: false });
    }
  } catch (err) {
    console.log(err.message, err);
  }
};

//desc- change product quantity in cart page
// method - post
// route - /change-product-quantity

exports.changeQuantity = async (req, res, next) => {
  const cart = req.body.cart;
  const product = req.body.product;
  const count = parseInt(req.body.count);

  try {
    if (req.body.count == -1 && req.body.quantity == 1) {
      const prod = await db
        .get()
        .collection(collection.CART_COLLECTION)
        .updateOne(
          { _id: ObjectId(cart) },
          {
            $pull: { products: { product_Id: ObjectId(product) } },
          }
        );
      // console.log(prod);

      req.status = "removeProduct";

      // res.json({removeProduct:true})
    } else {
      const products = await db
        .get()
        .collection(collection.CART_COLLECTION)
        .updateOne(
          { _id: ObjectId(cart), "products.product_Id": ObjectId(product) },
          {
            $inc: { "products.$.quantity": count },
          }
        );

      // res.json(true)
      req.status = true;

      // res.json({total:req.total})
    }
    next();
  } catch (err) {
    console.log(err);
  }
};

// //function to get the total amount of all products in the cart

exports.getTotalAmount = async (req, res, next) => {
  try {
    userId = req.session.user;

    //------------get total amount of all product-------------//
    const total = await db
      .get()
      .collection(collection.CART_COLLECTION)
      .aggregate([
        {
          $match: { userId: ObjectId(userId) },
        },
        {
          $unwind: "$products",
        },
        {
          $project: {
            product_Id: "$products.product_Id",
            quantity: "$products.quantity",
          },
        },
        {
          $lookup: {
            from: collection.PRODUCT_COLLECTION,
            localField: "product_Id",
            foreignField: "_id",
            as: "result",
          },
        },
        {
          $project: {
            item: 1,
            quantity: 1,
            result: { $arrayElemAt: ["$result", 0] },
          },
        },
        {
          $group: {
            _id: null,
            total: {
              $sum: { $multiply: ["$quantity", "$result.discountprice"] },
            },
          },
        },
      ])
      .toArray();

    //  totalAmount=total[0].total

    const status = req.status;
    if (total.length == 0) {
      res.json({ status, totalAmount: 0 });
    } else {
      res.json({ status, totalAmount: total[0].total });
    }
  } catch (err) {
    console.log(err);
  }
};

//desc- render user profile page
//method -GET
// route -/user-profile

exports.viewUserProfile = async (req, res) => {
  try {
    const userId = req.session.user;
    const details = await db
      .get()
      .collection(collection.USER_COLLECTION)
      .findOne({ _id: ObjectId(userId) });

    // Cart count
    const count = await commonController.getCartCount(req.session.user);

    res.render("user/user-profile", {
      active: true,
      user: true,
      about: "is-active",
      style: "profile",
      user: details,
      count,
    });
  } catch (err) {
    console.log(err);
  }
};

//-----------update user prifile---------------
//method post
exports.updateProfile = async (req, res) => {
  try {
    const userId = req.session.user;

    const update = db
      .get()
      .collection(collection.USER_COLLECTION)
      .updateOne(
        { _id: ObjectId(userId) },
        {
          $set: {
            name: req.body.name,
            email: req.body.email,
            mobile: req.body.mobile,
          },
        }
      );

    res.redirect("/user-profile");
  } catch (err) {
    console.log(err);
  }
};

//desc - render user all adress management page

exports.viewUserallAddresss = async (req, res) => {
  try {
    const userId = req.session.user;

    const address = await db
      .get()
      .collection(collection.USER_COLLECTION)
      .find({ _id: ObjectId(userId) })
      .toArray();

    const userAddress = address[0].address;

    // Cart count
    const count = await commonController.getCartCount(req.session.user);
    res.render("user/list-all-address", {
      userAddress,
      active: true,
      user: true,
      address: "is-active",
      style: "profile",
      count,
    });
  } catch (err) {}
};

//desc- render all orders list page

exports.viewOrdersList = async (req, res) => {
  try {
    await db
      .get()
      .collection(collection.ORDER_COLLECTION)
      .deleteMany({ orderstatus: "Pending" });
    const userId = req.session.user;
    //pagination
    let pageNo;
    if (req.query?.p) {
      pageNo = req.query.p - 1 || 0;
    }
    let limit = 4;

    const order = await db
      .get()
      .collection(collection.ORDER_COLLECTION)
      .find({ userId: ObjectId(userId) })
      .skip(pageNo * limit)
      .limit(limit)
      .sort({
        _id: -1,
      })
      .toArray();

    let difference;
    const data = order.map((item) => {
      difference =
        (new Date().getTime() - new Date(item.statusUpdated).getTime()) /
        (1000 * 3600 * 24);

      if (difference > 7) {
        item.return = false;
      } else {
        item.return = true;
      }

      return item;
    });
    const allOrder = await db
      .get()
      .collection(collection.ORDER_COLLECTION)
      .find()
      .toArray();
    let max = allOrder.length / limit;
    let m = Math.ceil(max);
    let page = [];
    for (let i = 1; i <= m; i++) {
      page.push(i);
    }

    // Cart count
    const count = await commonController.getCartCount(req.session.user);
    res.render("user/order-details", {
      active: true,
      user: true,
      style: "profile",
      orders: "is-active",
      order,
      page,
      count,
    });
  } catch (err) {
    console.log(err);
  }
};

//desc- get add address page
//method - Get
//route -/add-address

exports.getAddAddress = (req, res) => {
  res.render("user/add-address", {
    active: true,
    user: true,
  });
};

//desc- add new address
//method - POST
//route -/add-address

exports.addAddress = async (req, res) => {
  const userId = req.session.user;

  const obj = {
    address_id: new Date().valueOf().toString(),
    firstname: req.body.firstname,
    lastname: req.body.lastname,
    address: req.body.address,
    city: req.body.city,
    state: req.body.state,
    email: req.body.email,
    mobile: req.body.mobile,
    zipcode: req.body.zip,
  };
  try {
    const address = await db
      .get()
      .collection(collection.USER_COLLECTION)
      .updateOne(
        { _id: ObjectId(userId) },
        { $push: { address: obj } },
        { upsert: true }
      );

    res.redirect("/user-all-address");
  } catch (err) {
    console.log(err);
  }
};
//--------------------get edit address page------------------
//method -get

exports.getEditAddress = async (req, res) => {
  try {
    const addressId = req.params.id;
    const userId = req.session.user;
    console.log(addressId, userId);

    const agg = [
      {
        $match: {
          _id: ObjectId(userId),
        },
      },
      {
        $unwind: {
          path: "$address",
        },
      },
      {
        $match: {
          "address.address_id": addressId,
        },
      },
    ];
    const userData = await db
      .get()
      .collection(collection.USER_COLLECTION)
      .aggregate(agg)
      .toArray();

    res.render("user/edit-address", {
      active: true,
      user: true,
      style: "profile",
      userData,
    });
  } catch (err) {
    console.log(err);
  }
};

//--------------------Edit address----------------
//Method -POST
exports.editAddress = async (req, res) => {
  try {
    const addressId = req.params.id;
    const userId = req.session.user;

    const adrs = await db
      .get()
      .collection(collection.USER_COLLECTION)
      .updateOne(
        { "address.address_id": addressId },
        {
          $set: {
            "address.$.address_id": addressId,
            "address.$.firstname": req.body.firstname,
            "address.$.lastname": req.body.lastname,
            "address.$.address": req.body.address,
            "address.$.city": req.body.city,
            "address.$.state": req.body.state,
            "address.$.mobile": req.body.mobile,
            "address.$.zipcode": req.body.zip,
            "address.$.email": req.body.email,
          },
        },
        { upsert: true }
      );
    res.redirect("/user-all-address");
  } catch (err) {
    console.log(err);
  }
};

// -------------Delete address------------
//method -GET

exports.deleteAddress = async (req, res) => {
  try {
    const addressId = req.params.id;

    const result = await db
      .get()
      .collection(collection.USER_COLLECTION)
      .updateOne(
        { "address.address_id": addressId },
        { $pull: { address: { address_id: addressId } } }
      );

    res.redirect("/user-all-address");
  } catch (err) {
    console.log(err);
  }
};

//------------------Add delivery address---------------
//method-post
//route -/add-delivery-addresss

exports.addDeliveryAddress = async (req, res) => {
  const userId = req.session.user;

  const obj = {
    address_id: new Date().valueOf().toString(),
    firstname: req.body.firstname,
    lastname: req.body.lastname,
    address: req.body.address,
    city: req.body.city,
    state: req.body.state,
    email: req.body.email,
    mobile: req.body.mobile,
    zipcode: req.body.zipcode,
  };
  try {
    const address = await db
      .get()
      .collection(collection.USER_COLLECTION)
      .updateOne(
        { _id: ObjectId(userId) },
        { $push: { address: obj } },
        { upsert: true }
      );

    res.redirect("/checkout-product");
  } catch (err) {
    console.log(err);
  }
};

//------------------Order cancellation---------------
//method-GET
//route -/cancel-order

exports.orderCancel = async (req, res) => {
  try {
    const trackingId = req.query.track;
    const productId = req.query.productId;
    const userId = req.session.user;

    //------cancelling single product-----------
    const status = await db
      .get()
      .collection(collection.ORDER_COLLECTION)
      .updateOne(
        { tracking_id: trackingId, "products.productId": ObjectId(productId) },
        { $set: { "products.$.cancelled": true } }
      );

    //---------Aggregate to find the cancelled product amount and totalamount--------
    const aggr = [
      {
        $match: {
          tracking_id: trackingId,
        },
      },
      {
        $unwind: {
          path: "$products",
        },
      },
      {
        $match: {
          "products.productId": ObjectId(productId),
        },
      },
      {
        $project: {
          subtotal: "$products.discountedSubtotal",
          total: "$totalAmountDiscounted",
          payment: "$payment.method",
        },
      },
    ];

    const subTotal = await db
      .get()
      .collection(collection.ORDER_COLLECTION)
      .aggregate(aggr)
      .toArray();

    const sub = subTotal[0].subtotal;
    const total = subTotal[0].total;
    const afterCancel = total - sub;
    const afc = Math.floor(afterCancel);

    //---------Updating order total after cancel of one product-----------
    await db
      .get()
      .collection(collection.ORDER_COLLECTION)
      .updateOne(
        { tracking_id: trackingId, "products.productId": ObjectId(productId) },
        {
          $set: { "products.$.cancelled": true },
          $inc: { totalAmountDiscounted: -sub, cancelledAmount: sub },
        }
      );

    if (subTotal[0].payment != "COD") {
      //---------checking wallet exist or not------------------
      const walletExist = await db
        .get()
        .collection(collection.WALLET_COLLECTION)
        .findOne({ userId: ObjectId(req.session.user) });
      //------if wallet exist pushing the document and
      if (walletExist) {
        const totalWallet = walletExist.walletAmount + sub;
        const objc = {
          orderId: trackingId,
          date: commonController.date(),

          mode: "Credit",
          type: "Refund",
          amount: sub,
        };
        await db
          .get()
          .collection(collection.WALLET_COLLECTION)
          .updateOne(
            { userId: ObjectId(req.session.user) },
            {
              $set: { walletAmount: totalWallet },
              $push: {
                transactions: objc,
              },
            }
          );
      } else {
        //----------if wallet not exist creating new wallet-------------
        const obj = {
          userId: ObjectId(req.session.user),
          walletAmount: sub,
          transactions: [
            {
              orderId: trackingId,
              date: commonController.date(),
              mode: "Credit",
              type: "Refund",
              amount: sub,
            },
          ],
        };
        await db.get().collection(collection.WALLET_COLLECTION).insertOne(obj);
      }
    }

    //---------find the order matching document and find the product length---
    const ordersList = await db
      .get()
      .collection(collection.ORDER_COLLECTION)
      .findOne({ tracking_id: trackingId });
    const productCount = ordersList.products.length;

    // ---finding the cancelled true count ---------
    const agg = [
      {
        $match: {
          tracking_id: trackingId,
        },
      },
      {
        $unwind: {
          path: "$products",
        },
      },
      {
        $match: {
          "products.cancelled": true,
        },
      },
    ];

    const cancel = await db
      .get()
      .collection(collection.ORDER_COLLECTION)
      .aggregate(agg)
      .toArray();

    const cancelCount = cancel.length;
    //-------if all prodcut is cancelled the order status changing to cancelled
    if (cancelCount === productCount) {
      await db
        .get()
        .collection(collection.ORDER_COLLECTION)
        .updateOne(
          { tracking_id: trackingId },
          { $set: { orderstatus: "Cancelled" } }
        );
    }

    res.redirect("/orders-list");
  } catch (err) {
    console.log(err);
  }
};

//--------------Render Wishlist Page-----------------
//Method -GET
//Route /wishlist

exports.getWishlist = async (req, res) => {
  try {
    const userId = req.session.user;

    const uwishlist = await db
      .get()
      .collection(collection.WISHLIST_COLLECTION)
      .aggregate([
        {
          $match: { userId: ObjectId(userId) },
        },
        {
          $unwind: "$products",
        },
        {
          $project: {
            product_Id: "$products.product_Id",
            quantity: "$products.quantity",
          },
        },
        {
          $lookup: {
            from: collection.PRODUCT_COLLECTION,
            localField: "product_Id",
            foreignField: "_id",
            as: "result",
          },
        },
        {
          $project: {
            product_Id: 1,
            quantity: 1,
            result: { $arrayElemAt: ["$result", 0] },
          },
        },
      ])
      .toArray();
    console.log("ithu");
    console.log(uwishlist);

    // Cart count
    const count = await commonController.getCartCount(req.session.user);
    res.render("user/wishlist", {
      active: true,
      user: true,
      style: "profile",
      wishlist: "is-active",
      uwishlist,
      count,
    });
  } catch (err) {
    console.log(err);
  }
};

//----------------Add products to wishlist------------
//Method - POST
//Route -/add-wishlist/:id

exports.addWishlist = async (req, res) => {
  try {
    console.log("vannutta");
    const productId = req.params.id;

    const userId = req.session.user;

    const proObj = {
      product_Id: ObjectId(productId),
      quantity: 1,
    };
    //----------Checking user wishlist Existing or not---------
    const userWishlist = await db
      .get()
      .collection(collection.WISHLIST_COLLECTION)
      .findOne({ userId: ObjectId(userId) });

    //____________________if user wishlist Exist__________________

    if (userWishlist) {
      const proExist = await db
        .get()
        .collection(collection.WISHLIST_COLLECTION)
        .find({
          userId: ObjectId(userId),
          products: { $elemMatch: { product_Id: ObjectId(productId) } },
        })
        .toArray();

      //------------------if the product is not exist-------------------
      if (proExist.length == 0) {
        const product = await db
          .get()
          .collection(collection.WISHLIST_COLLECTION)
          .updateOne(
            { userId: ObjectId(userId) },
            {
              $push: { products: proObj },
            }
          );
      } else {
        await db
          .get()
          .collection(collection.WISHLIST_COLLECTION)
          .updateOne(
            { userId: ObjectId(userId) },
            { $pull: { products: { product_Id: ObjectId(productId) } } }
          );
      }

      //----------------If wishlist Does not exist----------------
    } else {
      const proObj = {
        userId: ObjectId(req.session.user),
        products: [{ product_Id: ObjectId(productId), quantity: 1 }],
      };

      const upProd = await db
        .get()
        .collection(collection.WISHLIST_COLLECTION)
        .insertOne(proObj);
    }
    res.redirect("back");
  } catch (err) {
    console.log(err);
  }
};

//----------------remove products from wishlist------------
//Method - GET
//Route -/wishlist/remove-product:id

exports.removeWishlistProduct = async (req, res) => {
  try {
    const productid = req.params.id;
    const userid = req.session.user;
    const pro = await db
      .get()
      .collection(collection.WISHLIST_COLLECTION)
      .updateOne(
        { userId: ObjectId(userid) },
        { $pull: { products: { product_Id: ObjectId(productid) } } }
      );

    res.redirect("/wishlist");
  } catch (err) {
    console.log(err);
  }
};

//---------------Apply coupon--------------
exports.applyCoupon = async (req, res) => {
  if (!req.body.couponcode) {
    res.json({ msg: "Please enter coupon code !" });
  }

  try {
    const result = await db
      .get()
      .collection(collection.COUPONS_COLLECTION)
      .findOne({ coupon: req.body.couponcode });

    if (result == null) {
      res.json({ msg: "Please enter valid coupon !" });
    }
    if (result) {
      const agg = [
        {
          $match: {
            coupon: req.body.couponcode,
          },
        },
        {
          $unwind: {
            path: "$users",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $match: {
            "users.userId": ObjectId(req.session.user),
          },
        },
      ];
      const usedCoupon = await db
        .get()
        .collection(collection.COUPONS_COLLECTION)
        .aggregate(agg)
        .toArray();

      if (usedCoupon.length > 0) {
        res.json({ msg: "Coupon Already used !" });
      } else {
        const expdate = result.expires_on;
        const currentdate = new Date();

        if (new Date(currentdate) > new Date(expdate)) {
          res.json({ msg: "Coupon Expired !" });
        } else {
          const discount = result.discount;
          let discAmount = (Number(req.body.total) * discount) / 100;
          let afterDisc = Number(req.body.total) - discAmount;
          const d = Math.round(discAmount);
          const t = Math.round(afterDisc);
          req.session.coupon = t;

          res.json({
            discount: d,
            total: t,
            discountPercentage: discount,
            coupon: req.body.couponcode,
          });
        }
      }
    }
  } catch (err) {
    console.log(err);
  }
};

//--------------View wallet page--------------
exports.viewWallet = async (req, res) => {
  try {
    const walletDetails = await db
      .get()
      .collection(collection.WALLET_COLLECTION)
      .findOne({ userId: ObjectId(req.session.user) });

    const walletD = walletDetails;
    // Cart count
    const count = await commonController.getCartCount(req.session.user);
    res.render("user/wallet", {
      active: true,
      user: true,
      style: "profile",
      wallet: "is-active",
      walletD,
      count,
    });
  } catch (err) {
    console.log(err);
  }
};

//contact us Page
exports.getContactUsPage = async (req, res) => {
  try {
    res.render("user/contact", {
      active: true,
      user: true,
      Contacts: "active",
    });
  } catch (err) {
    console.log(err);
  }
};

//-----------Download invoice for orders
//Method- Get
exports.downloadInvoice = async (req, res) => {
  try {
    const orderId = req.params.id;

    //to get the orderdetails
    let data = await db
      .get()
      .collection(collection.ORDER_COLLECTION)
      .findOne({ tracking_id: orderId });

    data.products = await data.products.filter((product) => !product.cancelled);

    const compile = async function (templateName, data) {
      const filePath = path.join(
        process.cwd(),
        "/views/user",
        `${templateName}.hbs`
      );
      const html = await readFile(filePath, "utf-8");

      return hbs.compile(html)(data);
    };
    //creating puppeteer
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    //calling compile function
    const content = await compile("invoice", data);

    await page.setContent(content);
    const filePath = path.join(
      process.cwd(),
      "temp",
      `${data.tracking_id}.pdf`
    );

    //creating pdf function
    await page.pdf({
      path: filePath,
      format: "A4",
      printBackground: true,
    });

    await browser.close();
    res.sendFile(filePath);
  } catch (err) {
    console.log(err);
  }
};

//---------Return Product
exports.returnProduct = async (req, res) => {
  try {
    const trackingId = req.query.track;
    const productId = req.query.productId;

    console.log(req.query);
    //---------Aggregate to find the cancelled product amount and totalamount--------
    const aggr = [
      {
        $match: {
          tracking_id: trackingId,
        },
      },
      {
        $unwind: {
          path: "$products",
        },
      },
      {
        $match: {
          "products.productId": ObjectId(productId),
        },
      },
      {
        $project: {
          subtotal: "$products.discountedSubtotal",
          total: "$totalAmountDiscounted",
        },
      },
    ];

    const subTotal = await db
      .get()
      .collection(collection.ORDER_COLLECTION)
      .aggregate(aggr)
      .toArray();

    console.log(subTotal);
    console.log("---------------");
    const sub = subTotal[0].subtotal;
    const total = subTotal[0].total;
    const afterCancel = total - sub;
    const afc = Math.floor(afterCancel);

    //---------Updating order total after cancel of one product-----------
    await db
      .get()
      .collection(collection.ORDER_COLLECTION)
      .updateOne(
        { tracking_id: trackingId, "products.productId": ObjectId(productId) },
        {
          $set: { "products.$.returned": true },
          $inc: { totalAmountDiscounted: -sub, returnedAmount: sub },
        }
      );

    //---------checking wallet exist or not------------------
    const walletExist = await db
      .get()
      .collection(collection.WALLET_COLLECTION)
      .findOne({ userId: ObjectId(req.session.user) });
    //------if wallet exist pushing the document and
    if (walletExist) {
      const totalWallet = walletExist.walletAmount + Number(total);
      const objc = {
        orderId: id,
        date: commonController.date(),
        mode: "Credit",
        type: "Return",
        amount: Math.ceil(total),
      };
      await db
        .get()
        .collection(collection.WALLET_COLLECTION)
        .updateOne(
          { userId: ObjectId(req.session.user) },
          {
            $set: { walletAmount: totalWallet },
            $push: {
              transactions: {
                orderId: trackingId,
                date: commonController.date(),

                mode: "Credit",
                type: "Return",
                amount: Math.ceil(total),
              },
            },
          }
        );
    } else {
      //----------if wallet not exist creating new wallet-------------
      const obj = {
        userId: ObjectId(req.session.user),
        walletAmount: total,
        transactions: [
          {
            orderId: trackingId,
            date: commonController.date(),
            mode: "Credit",
            type: "Return",
            amount: Math.ceil(total),
          },
        ],
      };
      await db.get().collection(collection.WALLET_COLLECTION).insertOne(obj);
    }
    // //changing the order status to returned
    // const status = await db
    //   .get()
    //   .collection(collection.ORDER_COLLECTION)
    //   .updateOne(
    //     { tracking_id: trackingId, "products.productId": ObjectId(productId) },
    //     { $set: { "products.$.cancelled": true } }
    //   );

    // await db
    //   .get()
    //   .collection(collection.ORDER_COLLECTION)
    //   .updateOne({ tracking_id: id }, { $set: { orderstatus: "Returned" } });
    res.redirect("back");
  } catch (err) {
    console.log(err);
  }
};

//------------User change password-------------
//Method-Post
exports.changePassword = async (req, res) => {
  try {
    console.log(req.body);
    if (
      !req.body.newPassword ||
      !req.body.confirm ||
      !req.body.currentPassword
    ) {
      res.json({ err: "Please fill all fields*" });
    } else if (req.body.newPassword != req.body.confirm) {
      res.json({ err: "Password didn't match*" });
    } else {
      const user = await db
        .get()
        .collection(collection.USER_COLLECTION)
        .findOne({ _id: ObjectId(req.session.user) });
      console.log(user);
      const userPassword = user.password;
      const enteredPassword = req.body.currentPassword;
      const userExist = await commonController.comparePassword(
        enteredPassword,
        userPassword
      );
      console.log(userExist);
      if (!userExist) {
        res.json({ err: "Incorrect Password" });
      } else {
        const passwrd = await bcrypt.hash(req.body.confirm, 12);
        await db
          .get()
          .collection(collection.USER_COLLECTION)
          .updateOne(
            { _id: ObjectId(req.session.user) },
            { $set: { password: passwrd } }
          );

        res.json({ status: true });
      }
    }
  } catch (err) {}
};
