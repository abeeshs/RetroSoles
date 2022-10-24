var db = require("../config/connection");
const collection = require("../config/collection");
const multer = require("multer");
const cloudinary = require("../helpers/cloudinary");
const {
  ItemAssignmentContext,
} = require("twilio/lib/rest/numbers/v2/regulatoryCompliance/bundle/itemAssignment");
const ObjectId = require("mongodb").ObjectId;
const uuid = require("uuid");

//@desc Get add product page and displaying sub category and brand option
//@route /add-product
//@method GET
//@access private admin only

exports.getAddproduct = async (req, res) => {
  try {
    const category = await db
      .get()
      .collection(collection.CATEGORY_COLLECTION)
      .find()
      .toArray();
    const brand = await db
      .get()
      .collection(collection.BRAND_COLLECTION)
      .find()
      .toArray();

    if (req.session.err) {
      var errormsg = req.session.err;
    }
    res.render("admin/addProduct", {
      category: category,
      admin: true,
      brand: brand,
      style: "templatemo-style",
      message: errormsg,
    });
  } catch (err) {
    console.log(err);
  }
};

//@desc Add new products
//@route /add-product
//@method POST
//@access private admin only

exports.addProduct = async (req, res) => {
  try {
    const org = Number(req.body.orgprice);
    const disc = Number(req.body.disprice);
    console.log(typeof org, typeof disc);
    if (disc > org) {
      req.session.err = "Discount price should be less than original price";
      res.redirect("/admin/add-product");
    } else {
      const cloudinaryImageUploadMethod = (file) => {
        return new Promise((resolve) => {
          cloudinary.uploader.upload(file, (err, res) => {
            if (err) return res.status(500).send("upload image error");
            resolve(res.secure_url);
          });
        });
      };

      const files = req.files;
      let arr1 = Object.values(files);
      let arr2 = arr1.flat();

      const urls = await Promise.all(
        arr2.map(async (file) => {
          const { path } = file;
          const result = await cloudinaryImageUploadMethod(path);
          return result;
        })
      );
      console.log(urls);

      // const result=urls.map(url =>url.res)

      const product = {
        product: req.body.name,
        description: req.body.description,
        category: req.body.category,
        subcategory: ObjectId(req.body.subcategory),
        brand: ObjectId(req.body.brand),
        size: Number(req.body.size),
        stock: Number(req.body.stock),
        productDiscount: 0,
        categoryDiscount: 0,
        originalprice: Number(req.body.orgprice),
        discountprice: Number(req.body.disprice),
        urls: urls,
      };

      const newProduct = await db
        .get()
        .collection(collection.PRODUCT_COLLECTION)
        .insertOne(product);
      // console.log(newProduct);
      res.redirect("/admin/products");
    }
  } catch (err) {
    console.log(err);
  }
};

//@desc view all products
//@route /
//@method GET
//@access private admin only
exports.viewProducts = async (req, res) => {
  try {
    const agg=[
      {
        $lookup: {
          from: collection.CATEGORY_COLLECTION,
          localField: "subcategory",
          foreignField: "_id",
          as: "result",
        },
      },
    ]
    let  pageNo = req.query.p - 1 || 0;
    console.log(req.query?.sort);
   //sort by price
    if (req.query?.sort) {
      agg.push({$sort:{originalprice:Number(req.query?.sort)}} )
      
    }
    //sort by name
    else if (req.query?.nsort) {
      agg.push({$sort:{product:Number(req.query?.nsort)}} )
      
    }
    //search products
    else if(req.query?.search){
      agg.unshift({ $match: { $text: { $search: req.query.search} } })
    }
    

    console.log(agg);
    const limit = 5;
    const products = await db
      .get()
      .collection(collection.PRODUCT_COLLECTION)
      .aggregate(agg)
      .skip(pageNo* limit)
      .limit(limit)
      .toArray();
      const totalProducts = await db
      .get()
      .collection(collection.PRODUCT_COLLECTION)
      .find()
      .toArray();

    console.log(totalProducts.length);
    console.log(limit);
    let max = totalProducts.length/limit;
    console.log(max);
    let m = Math.ceil(max);
    console.log(m);
    let page = [];
    
    for (let i = 1; i <= m; i++) {
      page.push(i);
    }
    console.log(page);

    res.render("admin/view-product", {
      product: products,
      page,
      admin: true,
      style: "templatemo-style",
    });
  } catch (err) {
    console.log(err);
  }
};

//@desc delete single product
//@route /delete-product/:id
//@method GET
//@access private admin only
exports.deleteProduct = async (req, res) => {
  try {
    const id = req.params.id;

    const product = await db
      .get()
      .collection(collection.PRODUCT_COLLECTION)
      .deleteOne({ _id: ObjectId(id) });
    res.redirect("/admin/products");
  } catch (err) {
    console.log(err);
  }
};
