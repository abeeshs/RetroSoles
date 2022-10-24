const cloudinary= require("cloudinary").v2

cloudinary.config({
    cloud_name:'deaaaceqr',
    api_key:'254311568933191',
    api_secret:'4WNmTifXgWqnwS9yW40NsU9ZMwM'
});

module.exports=cloudinary;