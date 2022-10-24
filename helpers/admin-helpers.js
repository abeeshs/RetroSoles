const collection = require("../config/collection");
const db = require("../config/connection");
const cloudinary = require("../helpers/cloudinary");
const router = require("../routes/admin");
const commonHelper = require("./common-helper");
const { ObjectId } = require("mongodb");
const puppeteer = require("puppeteer");
const { readFile, rm } = require("fs/promises");
const path = require("path");
var hbs = require("handlebars");
const uuid = require("uuid");
const fs = require("fs");
const { Document, Packer, Paragraph, TextRun } = require("docx");
const { format } = require("path");

//@desc Admin login page
//@route /admin
//@method GET
//@access private admin only

exports.getSignin = (req, res) => {
  try {
    const msg = req.query.message;
    res.render("admin/login", { message: msg, style: "style" });
  } catch (err) {
    console.log(err);
  }
};

//@desc Admin login page
//@route /admin
//@method GET
//@access private admin only

exports.signIn = (req, res) => {
  try {
    const Email = "admin1@gmail.com";
    const Password = "22552255";

    if (!req.body.email || !req.body.password) {
      res.redirect("/admin?message=" + "Email and Password Required");
    } else {
      const { email, password } = req.body;
      if (email !== Email || password !== Password) {
        res.redirect("/admin?message=" + "Incorrect Email or Password");
      } else {
        req.session.admin = true;
        res.redirect("/admin/home");
      }
    }
  } catch (err) {
    console.log(err);
  }
};

//@desc Admin logout
//@route /admin/logout
//@method GET

exports.logOut = (req, res) => {
  req.session.destroy();
  res.set('Clear-Site-Data: "cookies", "storage", "executionContexts"');
  res.redirect("/admin");
};

//@desc Get all user details
//@route /customers
//@method GET
//@access private admin only

//_________________Admin Dashboard_________________
exports.adminDashboard = async (req, res) => {
  try {
    //_______User Count__________
    const usercount = await db
      .get()
      .collection(collection.USER_COLLECTION)
      .count();
    //________Product Count__________
    const productCount = await db
      .get()
      .collection(collection.PRODUCT_COLLECTION)
      .count();
    // _______Total Revenue__________
    const agg = [
      {
        '$unwind': {
          'path': '$products', 
          'preserveNullAndEmptyArrays': true
        }
      }, {
        '$match': {
          'products.cancelled': false
        }
      }, {
        '$group': {
          '_id': 0, 
          'totalRevenue': {
            '$sum': '$products.discountedSubtotal'
          }
        }
      }
    ];
    const totalAmount = await db
      .get()
      .collection(collection.ORDER_COLLECTION)
      .aggregate(agg)
      .toArray();
      console.log(totalAmount);
      let revenue
      if(totalAmount.length>0){

         revenue = totalAmount[0].totalRevenue;
      }else{
        revenue=0;
      }

    //__________All order Status___________
    const orderStatus = await db
      .get()
      .collection(collection.ORDER_COLLECTION)
      .aggregate([
        {
          $group: {
            _id: "$orderstatus",
            status: {
              $sum: 1,
            },
          },
        },
      ])
      .toArray();
    console.log(orderStatus);

    

    res.render("admin/dashbord", {
      admin: true,
      style: "templatemo-style",
      usercount,
      productCount,
      revenue,
      orderStatus,
      dashboard: "active",
    });
  } catch (err) {
    console.log(err);
  }
};

exports.viewUsers = async (req, res) => {
  try {
    const users = await db
      .get()
      .collection(collection.USER_COLLECTION)
      .find()
      .toArray();

    console.log(users);

    res.render("admin/customers", {
      user: users,
      style: "templatemo-style",
      admin: true,
      usermanagement: "active",
    });
  } catch (err) {
    console.log(err);
  }
};

//@desc Get product edit page
//@route /edit-product/:id
//@method GET
//@access private admin only

exports.getEditProduct = async (req, res) => {
  try {
    const id = req.params.id;
    //to get all categories
    const category = await db
      .get()
      .collection(collection.CATEGORY_COLLECTION)
      .find()
      .toArray();
    //to get all collections
    const brand = await db
      .get()
      .collection(collection.BRAND_COLLECTION)
      .find()
      .toArray();
    //to get the product
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
          _id: 1,
          product: 1,
          description: 1,
          category: 1,
          subcategory: "$subcategory.category",
          subctagoryId: "$subcategory._id",
          brand: "$brand.brand",
          brandId: "$brand._id",
          size: 1,
          stock: 1,
          originalprice: 1,
          discountprice: 1,
          urls: 1,
        },
      },
    ];

    const product = await db
      .get()
      .collection(collection.PRODUCT_COLLECTION)
      .aggregate(agg)
      .toArray();
    console.log(product);

    res.render("admin/editProduct", {
      product: product,
      category: category,
      brand: brand,
      admin: true,
      style: "templatemo-style",
    });
  } catch (err) {
    console.log(err);
  }
};

//@desc update product
//@route /edit-product/:id
//@method POST

exports.editProduct = async (req, res) => {
  try {
    const id = req.body.id;
    console.log(req.body);
    console.log(id);
    const changeProduct = await db
      .get()
      .collection(collection.PRODUCT_COLLECTION)
      .findOne({ _id: ObjectId(id) });
    let oldImage = changeProduct.urls;
    console.log("oldImage 1");

    console.log(oldImage);

    const cloudinaryImageUploadMethod = async (file) => {
      return new Promise((resolve) => {
        cloudinary.uploader.upload(file, (err, res) => {
          if (err) return res.status(500).send("upload image error");
          resolve(res.secure_url);
        });
      });
    };

    const urls = [];
    const files = req.files;
    if (files) {
      for (const file of files) {
        const { path } = file;
        const newPath = await cloudinaryImageUploadMethod(path);
        urls.push(newPath);
      }
    }

    oldImage.splice(0, urls.length, ...urls);
    console.log("oldImage2");
    console.log(oldImage);
    console.log(id);
    const product = {
      product: req.body.name,
      description: req.body.description,
      category: req.body.category,
      subcategory: ObjectId(req.body.subcategory),
      brand: ObjectId(req.body.brand),
      size: req.body.size,
      stock: req.body.stock,
      productDiscount: 0,
      originalprice: req.body.orgprice,
      discountprice: req.body.disprice,
      urls: oldImage,
    };
    console.log(product);
    const newProduct = await db
      .get()
      .collection(collection.PRODUCT_COLLECTION)
      .updateOne({ _id: ObjectId(id) }, { $set: product });

    res.redirect("/admin/products");
  } catch (err) {
    console.log(err);
  }
};

//@desc View all categories
//@route /categories
//@method GET
//@access private admin only

exports.viewCategory = async (req, res) => {
  try {
    const catego = await db
      .get()
      .collection(collection.CATEGORY_COLLECTION)
      .find()
      .toArray();

    res.render("admin/category", {
      category: catego,
      style: "templatemo-style",
      admin: true,
      productmanagement: "active",
    });
  } catch (err) {
    console.log(err);
  }
};

//@desc edit category page
//@route /edit-category/:id
//@method GET
//@access private admin only

exports.getEditCategory = async (req, res) => {
  try {
    const id = req.params.id;

    const catego = await db
      .get()
      .collection(collection.CATEGORY_COLLECTION)
      .find({ _id: ObjectId(id) })
      .toArray();

    res.render("admin/edit-Category", {
      category: catego,
      style: "templatemo-style",
      admin: true,
    });
  } catch (err) {
    console.log(err);
  }
};

//@desc editing category
//@route /edit-category/:id
//@method POST
//@access private admin only

exports.editCategory = async (req, res) => {
  try {
    const id = req.params.id;

    const catego = await db
      .get()
      .collection(collection.CATEGORY_COLLECTION)
      .updateOne(
        { _id: ObjectId(id) },
        {
          $set: {
            category: req.body.category,
            description: req.body.description,
          },
        }
      );

    res.redirect("/admin/categories");
  } catch (err) {
    console.log(err);
  }
};
//---------Delete category---------
exports.deleteCategory = async (req, res) => {
  try {
    const id = req.params.id;
    await db
      .get()
      .collection(collection.CATEGORY_COLLECTION)
      .deleteOne({ _id: ObjectId(id) });
    res.redirect("back");
  } catch (err) {
    console.log(err);
  }
};

//@desc Add new gategory
//@route /add-categories
//@method POST
//@access private admin only

exports.addCategory = async (req, res) => {
  try {
    const category = {
      category: req.body.category,
      description: req.body.description,
      created: commonHelper.date(),
    };

    const catego = await db
      .get()
      .collection(collection.CATEGORY_COLLECTION)
      .insertOne(category);

    res.redirect("/admin/categories");
  } catch (err) {
    console.log(err);
  }
};

//@desc view brand
//@route /add-categories
//@method POST
//@access private admin only

exports.viewBrand = async (req, res) => {
  try {
    const brand = await db
      .get()
      .collection(collection.BRAND_COLLECTION)
      .find()
      .toArray();

    res.render("admin/brand", {
      brand: brand,
      style: "templatemo-style",
      admin: true,
    });
  } catch (err) {
    console.log(err);
  }
};

//@desc Add new brand
//@route /add-categories
//@method POST
//@access private admin only

exports.addBrand = async (req, res) => {
  try {
    const brand = {
      brand: req.body.brand,
      description: req.body.description,
      created: commonHelper.date(),
    };

    const catego = await db
      .get()
      .collection(collection.BRAND_COLLECTION)
      .insertOne(brand);

    res.redirect("/admin/brand");
  } catch (err) {
    console.log(err);
  }
};

//@desc Block user
//@route /block-user
//@method Get
exports.blockUser = async (req, res) => {
  try {
    const id = req.params.id;

    const user = await db
      .get()
      .collection(collection.USER_COLLECTION)
      .updateOne({ _id: ObjectId(id) }, { $set: { status: "Block" } });

    res.redirect("/admin/customers");
  } catch (err) {
    console.log(err);
  }
};

//@desc UnBlock user
//@route /unblock-user
//@method Get
exports.unBlockUser = async (req, res) => {
  try {
    const id = req.params.id;

    const user = await db
      .get()
      .collection(collection.USER_COLLECTION)
      .updateOne({ _id: ObjectId(id) }, { $set: { status: "Active" } });

    res.redirect("/admin/customers");
  } catch (err) {
    console.log(err);
  }
};

//@desc edit brand page
//@route /edit-brand/:id
//@method GET

exports.getEditBrand = async (req, res) => {
  try {
    const id = req.params.id;

    const brand = await db
      .get()
      .collection(collection.BRAND_COLLECTION)
      .find({ _id: ObjectId(id) })
      .toArray();

    res.render("admin/edit-brand", {
      brand: brand,
      style: "templatemo-style",
      admin: true,
    });
  } catch (err) {
    console.log(err);
  }
};

//@desc editing Brand
//@route /edit-brand/:id
//@method POST

exports.editBrand = async (req, res) => {
  try {
    const id = req.params.id;
    console.log(req.body);

    const catego = await db
      .get()
      .collection(collection.BRAND_COLLECTION)
      .updateOne(
        { _id: ObjectId(id) },
        {
          $set: {
            brand: req.body.category,
            description: req.body.description,
          },
        }
      );
    console.log(catego);

    res.redirect("/admin/brand");
  } catch (err) {
    console.log(err);
  }
};
//----------Delete Brand------------------
exports.deleteBrand = async (req, res) => {
  try {
    const id = req.params.id;
    await db
      .get()
      .collection(collection.BRAND_COLLECTION)
      .deleteOne({ _id: ObjectId(id) });
    res.redirect("back");
  } catch (err) {
    console.log(err);
  }
};

//-----------render admin banner management page------------
//Method - GET

exports.adminManagement = async (req, res) => {
  const allBanners = await db
    .get()
    .collection(collection.BANNER_COLLECTION)
    .find()
    .toArray();

  res.render("admin/banners", {
    banners: allBanners,
    style: "templatemo-style",
    admin: true,
    bannermanagement: "active",
  });
};

//--------------Delete banner--------------------
//Method -Get
//delete-banner

exports.deleteBanner = async (req, res) => {
  try {
    const bannerId = req.params.id;

    const banner = await db
      .get()
      .collection(collection.BANNER_COLLECTION)
      .deleteOne({ _id: ObjectId(bannerId) });

    res.redirect("/admin/banners");
  } catch (err) {
    console.log(err);
  }
};

//--------------add new banner---------------
//Method -POST

exports.addNewBanner = async (req, res) => {
  try {
    //-------Upload to cloudinary----------
    const result = await cloudinary.uploader.upload(req.file.path);
    const banner = {
      banner: req.body.name,
      description: req.body.description,
      image: result.secure_url,
      created_on: commonHelper.date(),
    };
    const bannerUpload = await db
      .get()
      .collection(collection.BANNER_COLLECTION)
      .insertOne(banner);
    res.redirect("/admin/banners");
  } catch (err) {
    console.log(err);
  }
};

//-------------View all oreders list---------------
//Method -GET
//route -
exports.viewOrders = async (req, res) => {
  try {
    await db.get().collection(collection.ORDER_COLLECTION).deleteMany({orderstatus:"Pending"})
    
    const order = await db
      .get()
      .collection(collection.ORDER_COLLECTION)
      .find({})
      .sort({ _id: -1 })
      .toArray();
    console.log(order);

    res.render("admin/all-orders", {
      style: "templatemo-style",
      admin: true,
      order,
    });
  } catch (err) {
    console.log(err);
  }
};

//------------order status change------------
//method- POST
//route - /order-status-change

exports.changeOrderStatus = async (req, res) => {
  try {
    const trackingId = req.body.trackingId;
    let Orderstatus = req.body.status;
    if (Orderstatus === "Cancel") {
      Orderstatus = "Cancelled";
    }

    console.log(req.body);
    const date = commonHelper.date();

    const status = await db
      .get()
      .collection(collection.ORDER_COLLECTION)
      .updateOne(
        { tracking_id: trackingId },
        { $set: { orderstatus: Orderstatus, statusUpdated: date } }
      );
    res.redirect("/admin/orders-list");
  } catch (err) {
    console.log(err);
  }
};

//----------------View Coupons mangement page----------------
//Method -Get

exports.viewCoupons = async (req, res) => {
  const coupons = await db
    .get()
    .collection(collection.COUPONS_COLLECTION)
    .find()
    .toArray();
  console.log(coupons);
  res.render("admin/view-coupons", { admin: true, coupons });
};

//---------------Add coupons----------------------------------
//Method -Post

exports.addCoupons = async (req, res) => {
  try {
    let date = req.body.date;
    date = date.split("-").reverse().join("/");
    console.log(date);
    const Obj = {
      coupon: req.body.couponName,
      discount: Number(req.body.discount),
      created_on: commonHelper.date(),
      expires_on: date,
    };
    await db.get().collection(collection.COUPONS_COLLECTION).insertOne(Obj);
    res.redirect("back");
  } catch (err) {
    console.log(err);
  }
};

//-----------------Edit coupons------------------------
// Method - Post
exports.editCoupons = async (req, res) => {
  try {
    console.log(req.body);
    console.log(req.params.id);
    const Obj = {
      coupon: req.body.couponName,
      discount: Number(req.body.discount),
      created_on: commonHelper.date(),
      modified_on: commonHelper.date(),
      expires_on: req.body.date,
    };
    await db
      .get()
      .collection(collection.COUPONS_COLLECTION)
      .updateOne({ _id: ObjectId(req.params.id) }, { $set: Obj });
    res.redirect("back");
  } catch (err) {
    console.log(err);
  }
};

//---------------Delete coupons-----------
//Method-  Delete

exports.deleteCoupon = async (req, res) => {
  try {
    const couponId = req.params.id;
    await db
      .get()
      .collection(collection.COUPONS_COLLECTION)
      .deleteOne({ _id: ObjectId(couponId) });
    res.redirect("back");
  } catch (err) {
    console.log(err);
  }
};

//------------------View offers page-------------
//Method-get

exports.viewOffers = async (req, res) => {
  try {
    //to get all category
    const categories = await db
      .get()
      .collection(collection.CATEGORY_COLLECTION)
      .find()
      .toArray();
    //to get all products
    const products = await db
      .get()
      .collection(collection.PRODUCT_COLLECTION)
      .aggregate([
        {
          $project: {
            _id: 1,
            product: 1,
          },
        },
      ])
      .toArray();
    //to get all discounted products
    const disProduct = await db
      .get()
      .collection(collection.PRODUCT_COLLECTION)
      .aggregate([
        { $match: { productDiscount: { $gt: 1 } } },
        {
          $project: {
            _id: 1,
            product: 1,
            productDiscount: 1,
          },
        },
      ])
      .toArray();
    const disCategory = await db
      .get()
      .collection(collection.CATEGORY_COLLECTION)
      .find({ categoryDiscount: { $gt: 0 } })
      .toArray();
    console.log(disCategory);

    res.render("admin/offers", {
      admin: true,
      categories,
      products,
      disProduct,
      disCategory,
    });
  } catch (err) {
    console.log(err);
  }
};

//------------------Add new Offer-----------------
exports.addNewOffer = async (req, res) => {
  try {
    console.log(req.body);
    if (req.body.category && req.body.categoryDiscount) {
      const disc = Number(req.body.categoryDiscount);
      const id = req.body.category;

      //inserting category offer to category collection
      await db
        .get()
        .collection(collection.CATEGORY_COLLECTION)
        .updateOne({ _id: ObjectId(id) }, { $set: { categoryDiscount: disc } });
      //updating discount percentage for category wise products
      await db
        .get()
        .collection(collection.PRODUCT_COLLECTION)
        .updateMany(
          { subcategory: ObjectId(id) },
          {
            $set: { categoryDiscount: disc },
          }
        );

      const products = await db
        .get()
        .collection(collection.PRODUCT_COLLECTION)
        .find({ subcategory: ObjectId(id) })
        .toArray();
      //calculating discount amount and updating the discount product
      const updatedProduct = await products.map(async (item) => {
        if (item.categoryDiscount > item.productDiscount) {
          let disc =
            item.originalprice -
            (item.originalprice * item.categoryDiscount) / 100;
          item.discountprice = Math.ceil(disc);
        } else {
          let disc =
            item.originalprice -
            (item.originalprice * item.productDiscount) / 100;
          item.discountprice = Math.ceil(disc);
        }
        //updating products
        return await db
          .get()
          .collection(collection.PRODUCT_COLLECTION)
          .updateOne({ _id: ObjectId(item._id) }, { $set: item });
      });

      //updating discount percentage for product
    } else if (req.body.product && req.body.productDiscount) {
      const disc = Number(req.body.productDiscount);
      const id = req.body.product;

      await db
        .get()
        .collection(collection.PRODUCT_COLLECTION)
        .updateOne(
          { _id: ObjectId(id) },
          {
            $set: { productDiscount: disc },
          }
        );

      const pro = await db
        .get()
        .collection(collection.PRODUCT_COLLECTION)
        .findOne({ _id: ObjectId(id) });
      console.log(pro);
      let price;
      if (pro.productDiscount > pro.categoryDiscount) {
        price =
          pro.originalprice - (pro.originalprice * pro.productDiscount) / 100;
      } else {
        price =
          pro.originalprice - (pro.originalprice * pro.categoryDiscount) / 100;
      }
      const disprice = Math.ceil(price);

      //applying highest discount and updating product price after discount
      await db
        .get()
        .collection(collection.PRODUCT_COLLECTION)
        .updateOne(
          { _id: ObjectId(id) },
          { $set: { discountprice: disprice } }
        );
    }
    res.redirect("back");
  } catch (err) {
    console.log(err);
  }
};

//------delete product offers-------------
exports.deleteProductOffer = async (req, res) => {
  try {
    const id = req.params.id;
    //deleting product offer
    await db
      .get()
      .collection(collection.PRODUCT_COLLECTION)
      .updateOne({ _id: ObjectId(id) }, { $set: { productDiscount: 0 } });
    const product = await db
      .get()
      .collection(collection.PRODUCT_COLLECTION)
      .findOne({ _id: ObjectId(id) });
    console.log(product);

    const amount = Math.ceil(
      product.originalprice -
        (product.originalprice * product.categoryDiscount) / 100
    );
    console.log(amount);
    //updating doument
    await db
      .get()
      .collection(collection.PRODUCT_COLLECTION)
      .updateOne({ _id: ObjectId(id) }, { $set: { discountprice: amount } });

    res.redirect("back");
  } catch (err) {
    console.log(err);
  }
};

//------------Delete category offer----------
exports.deleteCategoryOffer = async (req, res) => {
  try {
    const id = req.params.id;
    console.log(id);
    //updating category offer of product collection
    const result = await db
      .get()
      .collection(collection.PRODUCT_COLLECTION)
      .updateMany(
        { subcategory: ObjectId(id) },
        { $set: { categoryDiscount: 0 } }
      );

    //updation ctegory offer of category collection
    await db
      .get()
      .collection(collection.CATEGORY_COLLECTION)
      .updateOne({ _id: ObjectId(id) }, { $set: { categoryDiscount: 0 } });

    const product = await db
      .get()
      .collection(collection.PRODUCT_COLLECTION)
      .findOne({ subcategory: ObjectId(id) });
    console.log(product);

    const amount = Math.ceil(
      product.originalprice -
        (product.originalprice * product.productDiscount) / 100
    );
    //updating offer price in product discount price
    await db
      .get()
      .collection(collection.PRODUCT_COLLECTION)
      .updateOne(
        { subcategory: ObjectId(id) },
        { $set: { discountprice: amount } }
      );

    res.redirect("back");
  } catch (err) {
    console.log(err);
  }
};
//------edit product offer----------
exports.editProductOffer = async (req, res) => {
  try {
    console.log(req.params.id);
    const discount = Number(req.body.discount);
    console.log(discount);

    const productid = req.params.id;
    //updating the discount
    await db
      .get()
      .collection(collection.PRODUCT_COLLECTION)
      .updateOne(
        { _id: ObjectId(productid) },
        { $set: { productDiscount: discount } }
      );

    //updating the product amount
    const pro = await db
      .get()
      .collection(collection.PRODUCT_COLLECTION)
      .findOne({ _id: ObjectId(productid) });
    console.log(pro);
    let price;
    if (pro.productDiscount > pro.categoryDiscount) {
      price =
        pro.originalprice - (pro.originalprice * pro.productDiscount) / 100;
    } else {
      price =
        pro.originalprice - (pro.originalprice * pro.categoryDiscount) / 100;
    }
    const disprice = Math.ceil(price);

    //applying highest discount and updating product price after discount
    await db
      .get()
      .collection(collection.PRODUCT_COLLECTION)
      .updateOne(
        { _id: ObjectId(productid) },
        { $set: { discountprice: disprice } }
      );

    res.redirect("back");
  } catch (err) {
    console.log(err);
  }
};

//------edit category offer----------
exports.editCategoryOffer = async (req, res) => {
  try {
    console.log(req.params.id);
    const discount = Number(req.body.discount);
    console.log(discount);

    const category = req.params.id;
    //updating product discount
    await db
      .get()
      .collection(collection.PRODUCT_COLLECTION)
      .updateMany(
        { subcategory: ObjectId(category) },
        { $set: { categoryDiscount: discount } }
      );

    //updating product price
    const products = await db
      .get()
      .collection(collection.PRODUCT_COLLECTION)
      .find({ subcategory: ObjectId(category) })
      .toArray();
    //calculating discount amount and updating the discount product
    const updatedProduct = await products.map(async (item) => {
      let discountprice;
      if (item.categoryDiscount > item.productDiscount) {
        let disc =
          item.originalprice -
          (item.originalprice * item.categoryDiscount) / 100;
        discountprice = Math.ceil(disc);
      } else {
        let disc =
          item.originalprice -
          (item.originalprice * item.productDiscount) / 100;
        discountprice = Math.ceil(disc);
      }
      //updating products
      return await db
        .get()
        .collection(collection.PRODUCT_COLLECTION)
        .updateOne({ _id: ObjectId(item._id) }, { $set: { discountprice } });
    });

    //updating category
    await db
      .get()
      .collection(collection.CATEGORY_COLLECTION)
      .updateOne(
        { _id: ObjectId(category) },
        { $set: { categoryDiscount: discount } }
      );
    res.redirect("back");
  } catch (err) {
    console.log(err);
  }
};

//sales report -pdf
exports.salesReportPdf = async (req, res) => {
  try {
    //to get the orderdetails
    let data = await db
      .get()
      .collection(collection.ORDER_COLLECTION)
      .find()
      .toArray();

    const compile = async function (templateName, data) {
      const filePath = path.join(
        process.cwd(),
        "/views/sales",
        `${templateName}.hbs`
      );
      const html = await readFile(filePath, "utf-8");
      console.log(data);

      return hbs.compile(html)(data);
    };
    //creating puppeteer
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    //calling compile function
    const content = await compile("sales-report", data);

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
    console.log("done");
    await browser.close();
    res.sendFile(filePath);
  } catch (err) {
    console.log(err);
  }
};
//sales report excel
exports.salesReportExcel = async (req, res) => {
  try {
    //to get the orderdetails
    const agg = [
      {
        $project: {
          tracking_id: 1,
          ordered_on: 1,
          paymentMode: "$payment.method",
          products: 1,
          total: 1,
          couponPrice: 1,
        },
      },
      {
        $unwind: {
          path: "$products",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $group: {
          _id: null,
          details: {
            $push: {
              date: "$ordered_on",
              productName: "$products.productName",
              price: "$products.subTotal",
              quantity: "$products.quantity",
              discountPrice: {
                $subtract: [
                  "$products.subTotal",
                  "$products.discountedSubtotal",
                ],
              },
              revenue: "$products.discountedSubtotal",
            },
          },
        },
      },
    ];

    let data = await db
      .get()
      .collection(collection.ORDER_COLLECTION)
      .aggregate(agg)
      .toArray();

    const XLSX = require("xlsx");

    const convertJsonToExcel = async () => {
      const workSheet = XLSX.utils.json_to_sheet(data);
      const workBook = XLSX.utils.book_new();

      XLSX.utils.book_append_sheet(workBook, workSheet, "report");
      // Generate buffer
      XLSX.write(workBook, { bookType: "xlsx", type: "buffer" });

      // Binary string
      XLSX.write(workBook, { bookType: "xlsx", type: "binary" });
      let filename = uuid.v4();
      XLSX.writeFile(workBook, `${filename}.xlsx`);
      res.sendFile(`${process.cwd()}/${filename}.xlsx`);
      await rm(process.cwd() + "/" + filename + ".xlsx");
    };
    convertJsonToExcel();
  } catch (err) {
    console.log(err);
  }
};
//sales report word
exports.salesReportWord = (req, res) => {
  try {
    const doc = new Document({
      sections: [
        {
          properties: {},
          children: [
            new Paragraph({
              children: [
                new TextRun("Report"),
                new TextRun({
                  text: "Sales report",
                  bold: true,
                }),
                new TextRun({
                  text: "\tGithub is the best",
                  bold: true,
                }),
                new TextRun({
                  text: "\tGithub is the best",
                  bold: true,
                }),
              ],
            }),
          ],
        },
      ],
    });

    // Used to export the file into a .docx file
    Packer.toBuffer(doc).then((buffer) => {
      fs.writeFileSync("My Document.docx", buffer);
    });
  } catch (err) {
    console.log(err);
  }
};

//sales report
exports.salesReport = async (req, res) => {
  try {
    const agg = [
      {
        $unwind: {
          path: "$products",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          _id: 0,
          date: "$ordered_on",
          productName: "$products.productName",
          quantity: "$products.quantity",
          price: "$products.offerSubTotal",
          discountPrice: {
            $subtract: ["$products.offerSubTotal", "$products.discountedSubtotal"],
          },
          revenue: "$products.discountedSubtotal",
        },
      },
    ];
    console.log(req.query);
    let dbQuery = {};
    //datewise report
    if (req.query.daterange) {
      let fromdate = req.query.daterange;
      fromdate = fromdate.split("-");
      console.log(fromdate);
      let [from, to] = fromdate;
      from = from.trim("");
      to = to.trim("");
      from = new Date(new Date(from).getTime() + 3600 * 24 * 1000);
      to = new Date(new Date(to).getTime() + 3600 * 24 * 1000);
      console.log(from);
      console.log(to);

      dbQuery = { $match: { date: { $gte: from, $lt: to } } };
      agg.unshift(dbQuery);
      //monthwise report
    } else if (req.query?.month) {
      console.log(req.query.month);
      let month = req.query.month.split("-");
      let [yy, mm] = month;
      console.log(mm, yy);
      let dd = "1";
      let de = "30";
      let fromDate = mm.concat("/", dd, "/", yy);
      console.log(fromDate);
      let fromD = new Date(new Date(fromDate).getTime() + 3600 * 24 * 1000);
      let todate = mm.concat("/", de, "/", yy);
      console.log(todate);
      let toD = new Date(new Date(todate).getTime() + 3600 * 24 * 1000);
      console.log(fromD);
      console.log(toD);

      dbQuery = { $match: { date: { $gte: fromD, $lte: toD } } };
      agg.unshift(dbQuery);
    }
    console.log(agg);
    const salesDetails = await db
      .get()
      .collection(collection.ORDER_COLLECTION)
      .aggregate(agg)
      .toArray();
    console.log(salesDetails);
    let priceTotal = salesDetails.reduce((e, element) => {
      return e + element.price;
    }, 0);
    console.log(priceTotal);

    res.render("admin/sales", { admin: true, salesDetails,priceTotal });
  } catch (err) {
    console.log(err);
  }
};
