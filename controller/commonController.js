const collection = require("../config/collection");
var db = require("../config/connection");
const ObjectId = require("mongodb").ObjectId;
const uuid = require("uuid");
const bcrypt = require('bcryptjs')


module.exports = {
  //------------get all cart count------------//

  getCartCount: async (userId) => {
    try {
      const cart = await db
        .get()
        .collection(collection.CART_COLLECTION)
        .findOne({ userId: ObjectId(userId) });
      

      if (cart) {
        const count = cart.products.length;
        console.log(count);
        return count;
      }
      return 0;
    } catch (err) {
      console.log(err);
    }
  },

  //----------------Place order with different orderId multipple cart products------------

  crateOrder: async (obj) => {
    const order = await db
      .get()
      .collection(collection.ORDER_COLLECTION)
      .insertOne(obj);

    return order;
  },

  //------------- Get current Date creating function-----
  date: () => {
    var dateObj = new Date();
    var month = dateObj.getUTCMonth() + 1; //months from 1-12
    var day = dateObj.getUTCDate();
    var year = dateObj.getUTCFullYear();

    var newdate = day + "/" + month + "/" + year;
    return newdate;
  },
  //-------------function to apply offer for offered products
  applyOffer: async () => {
    try {
      const agg = [
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
          $project: {
            _id: 1,
            product: 1,
            productDiscount: 1,
            brand: "$brand.brand",
            subcategory: "$subcategory.category",
            categoryDiscount: "$subcategory.categoryDiscount",
            description: 1,
            category: 1,
            size: 1,
            stock: 1,
            originalprice: 1,
            discountprice: 1,
            urls: 1,
          },
        },
        {
          $unwind: {
            path: "$brand",
            preserveNullAndEmptyArrays: true,
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
            path: "$categoryDiscount",
            preserveNullAndEmptyArrays: true,
          },
        },
      ];

      const products = await db
        .get()
        .collection(collection.PRODUCT_COLLECTION)
        .aggregate(agg)
        .toArray();
      console.log(products);

      const modifiedArr = products.map((item) => {
        var modifiedItem = Object.assign({}, item);
        // console.log(modifiedItem);
        const discount =
          modifiedItem.categoryDiscount < modifiedItem.productDiscount
            ? modifiedItem.productDiscount
            : modifiedItem.categoryDiscount;
        let price =
          modifiedItem.originalprice -
          (modifiedItem.originalprice * discount || 0) / 100;
        modifiedItem.discountprice = Math.ceil(price);
        return modifiedItem;
      });

      return modifiedArr;
    } catch (err) {
      console.log(err);
    }
  },

  //Compare hashed password
  comparePassword: async (enteredPassword, userPassword) => {
    try {
      return await bcrypt.compare(enteredPassword, userPassword);
    } catch (err) {
      console.log(err);
    }
  },

  //wishlist count
  wishlistCount:async(req,res)=>{
    try{
      const userId=req.session.user;
      const wishlist=await db.get().collection(collection.WISHLIST_COLLECTION).findOne({userId:ObjectId(userId)})
      console.log(wishlist);
      if(wishlist){
        const count=wishlist.products.length
        res.json({wishlist:count})
      }else{
        res.json({status:false})
      }

    }catch(err){
      console.log(err);
    }
  }

};
