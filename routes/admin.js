var express = require("express");
var router = express.Router();
const multer = require("multer");
const session = require("express-session");
const cloudinary = require("../controller/cloudinary");
var productController = require("../controller/productController");
var adminController = require("../controller/adminController");
const adminMid = require("../middlewares/adminMiddleware");
const path = require("path");

upload = multer({
  storage: multer.diskStorage({}),
  fileFilter: (req, file, cb) => {
    let ext = path.extname(file.originalname);
    if (ext !== ".jpg" && ext !== ".jpeg" && ext !== ".png") {
      cb(new Error("File type is not supported"), false);
      return;
    }
    cb(null, true);
  },
});

/* GET login page. */
router.get("/", adminMid.isLogin, adminController.getSignin);
router.post("/", adminController.signIn);

/* GET login page. */
router.get("/logout", adminController.logOut);

//--admin dashboard
router.get("/home",adminController.adminDashboard);
/* GET home page. */
router.get("/products", adminMid.isLogout, productController.viewProducts);

//admin add product
router.get("/add-product",adminMid.isLogout,productController.getAddproduct);

router.post(
  "/add-product",
  upload.fields([
    { name: "image1", maxCount: 1 },
    { name: "image2", maxCount: 1 },
    { name: "image3", maxCount: 1 },
    { name: "image4", maxCount: 1 },
  ]),
  productController.addProduct
);
//admin edit product
router.get("/edit-product/:id",adminMid.isLogout,adminController.getEditProduct);
router.post(
  "/edit-product/",
  upload.array("images", 4),
  adminController.editProduct
);

//view costomers
router.get("/customers",adminMid.isLogout, adminController.viewUsers);
//block user
router.get("/block-user/:id", adminController.blockUser);
//unblock user
router.get("/unblock-user/:id", adminController.unBlockUser);

// view and add subcategories
router.get("/categories",adminMid.isLogout, adminController.viewCategory);
router.post("/add-category",adminMid.isLogout, adminController.addCategory);

// edit subcategories
router.get("/edit-category/:id",adminMid.isLogout, adminController.getEditCategory);
router.post("/edit-category/:id",adminMid.isLogout, adminController.editCategory);
router.get("/delete-category/:id",adminController.deleteCategory)

// view and add brands
router.get("/brand",adminMid.isLogout, adminController.viewBrand);
router.post("/add-brand",adminMid.isLogout, adminController.addBrand);

//edit and delete brand
router.get("/edit-brand/:id",adminMid.isLogout, adminController.getEditBrand);
router.post("/edit-brand/:id",adminMid.isLogout, adminController.editBrand);
router.get("/delete-brand/:id",adminMid.isLogout, adminController.deleteBrand)

//delete a product
router.get("/delete-product/:id",adminMid.isLogout, productController.deleteProduct);

//view banners page
router.get("/banners",adminMid.isLogout, adminController.adminManagement);

//add banners
router.post("/add-banner",adminMid.isLogout, upload.single("image"), adminController.addNewBanner);

//delete banner
router.get("/delete-banner/:id",adminMid.isLogout, adminController.deleteBanner);

//view all orders
router.get("/orders-list",adminMid.isLogout, adminController.viewOrders);

//order status change
router.post("/order-status-change",adminMid.isLogout, adminController.changeOrderStatus);
//coupon management
router.get("/coupons",adminMid.isLogout,adminController.viewCoupons)
router.post("/add-coupon",adminMid.isLogout, adminController.addCoupons)
router.post("/edit-coupon/:id",adminMid.isLogout, adminController.editCoupons)
router.get("/delete-coupon/:id",adminMid.isLogout, adminController.deleteCoupon)
//offer management
router.get("/offers",adminMid.isLogout, adminController.viewOffers)
router.post("/add-offer",adminMid.isLogout, adminController.addNewOffer)
router.get('/delete-product-offer/:id',adminMid.isLogout, adminController.deleteProductOffer)
router.get('/delete-category-offer/:id',adminMid.isLogout, adminController.deleteCategoryOffer)
router.post('/edit-product-offer/:id',adminMid.isLogout, adminController.editProductOffer)
router.post('/edit-category-offer/:id',adminMid.isLogout, adminController.editCategoryOffer)

//sales report
router.get('/sales-report',adminController.salesReport);

module.exports = router;

