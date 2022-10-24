var express = require("express");
var router = express.Router();
const multer = require("multer");
const session = require("express-session");
const cloudinary = require("../helpers/cloudinary");
var productHelper = require("../helpers/product-helpers");
var adminHelper = require("../helpers/admin-helpers");
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
router.get("/", adminMid.isLogin, adminHelper.getSignin);
router.post("/", adminHelper.signIn);

/* GET login page. */
router.get("/logout", adminHelper.logOut);

//--admin dashboard
router.get("/home",adminHelper.adminDashboard);
/* GET home page. */
router.get("/products", adminMid.isLogout, productHelper.viewProducts);

//admin add product
router.get("/add-product", productHelper.getAddproduct);
router.post(
  "/add-product",
  upload.fields([
    { name: "image1", maxCount: 1 },
    { name: "image2", maxCount: 1 },
    { name: "image3", maxCount: 1 },
    { name: "image4", maxCount: 1 },
  ]),
  productHelper.addProduct
);
//admin edit product
router.get("/edit-product/:id", adminHelper.getEditProduct);
router.post(
  "/edit-product/",
  upload.array("images", 4),
  adminHelper.editProduct
);

//view costomers
router.get("/customers", adminHelper.viewUsers);
//block user
router.get("/block-user/:id", adminHelper.blockUser);
//unblock user
router.get("/unblock-user/:id", adminHelper.unBlockUser);

// view and add subcategories
router.get("/categories", adminHelper.viewCategory);
router.post("/add-category", adminHelper.addCategory);

// edit subcategories
router.get("/edit-category/:id", adminHelper.getEditCategory);
router.post("/edit-category/:id", adminHelper.editCategory);
router.get("/delete-category/:id",adminHelper.deleteCategory)

// view and add brands
router.get("/brand", adminHelper.viewBrand);
router.post("/add-brand", adminHelper.addBrand);

//edit and delete brand
router.get("/edit-brand/:id", adminHelper.getEditBrand);
router.post("/edit-brand/:id", adminHelper.editBrand);
router.get("/delete-brand/:id",adminHelper.deleteBrand)

//delete a product
router.get("/delete-product/:id", productHelper.deleteProduct);

//view banners page
router.get("/banners", adminHelper.adminManagement);

//add banners
router.post("/add-banner", upload.single("image"), adminHelper.addNewBanner);

//delete banner
router.get("/delete-banner/:id", adminHelper.deleteBanner);

//view all orders
router.get("/orders-list", adminHelper.viewOrders);

//order status change
router.post("/order-status-change", adminHelper.changeOrderStatus);
//coupon management
router.get("/coupons",adminHelper.viewCoupons)
router.post("/add-coupon",adminHelper.addCoupons)
router.post("/edit-coupon/:id",adminHelper.editCoupons)
router.get("/delete-coupon/:id",adminHelper.deleteCoupon)
//offer management
router.get("/offers",adminHelper.viewOffers)
router.post("/add-offer",adminHelper.addNewOffer)
router.get('/delete-product-offer/:id',adminHelper.deleteProductOffer)
router.get('/delete-category-offer/:id',adminHelper.deleteCategoryOffer)
router.post('/edit-product-offer/:id',adminHelper.editProductOffer)
router.post('/edit-category-offer/:id',adminHelper.editCategoryOffer)

//sales report
router.get('/sales-report',adminHelper.salesReport)
router.get('/sales-report-pdf',adminHelper.salesReportPdf)
router.get('/sales-report-excel',adminHelper.salesReportExcel)
router.get('/sales-report-word',adminHelper.salesReportWord)




module.exports = router;

// router.get('/edit-product/:id',adminHelper.editProduct);
