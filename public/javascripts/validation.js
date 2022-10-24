$.validator.addMethod(
  "phoneNumberValidator",
  function (value, element) {
    return this.optional(element) || /^[6-9]\d{9}$/.test(value);
  },
  "Enter a valid mobile number"
);

// check out product add address form
$(document).ready(function () {
  $("#checkoutform").validate({
    rules: {
      firstname: {
        required: true,
        minlength: 3,
        maxlength: 10,
        lettersonly: true,
      },
      lastname: {
        required: true,
        minlength: 1,
      },
      address: {
        required: true,
        minlength: 10,
      },
      city: {
        required: true,
      },
      state: {
        required: true,
      },
      zipcode: {
        required: true,
        number: true,
        minlength: 5,
      },
      email: {
        required: true,
        email: true,
      },
      mobile: {
        minlength: 10,
        maxlength: 10,
        required: true,
        number: true,
        phoneNumberValidator: "required",
      },
    },
    messages: {
      firstname: {
        required: "Enter your firstname",
        minlength: "Enter at least 3 characters",
        maxlength: "Enter maximumm 10 caharacters",
      },
      lastname: {
        required: "Enter your lastname",

        minlength: "Enter minimum 1 charecter",
      },
      address: {
        required: "Enter your address",
        minlength: "Enter minimum 10 charecter",
      },
      city: {
        required: "Enter your city",
      },
      state: {
        required: "Enter your state",
      },
      zipcode: {
        required: "Enter your zipcode",
        minlength: "Enter minimum 5 charecter",
      },
      email: {
        required: "Enter your email",
        email: "Enter a valid email",
      },
      mobile: {
        required: "Enter your mobile number",
        minlength: "Mobile must be 10 digit",
        maxlength: "Mobile must be 10 digit",
      },
    },
  });
});

//add new address

$(document).ready(function () {
  $("#newaddress").validate({
    rules: {
      firstname: {
        required: true,
        minlength: 3,
      },
      lastname: {
        required: true,
        minlength: 1
      },
      address: {
        required: true,
        minlength: 10
      },
      city: {
        required: true
      },
      state: {
        required: true
      },
      zip: {
        required: true,
        number: true,
        minlength: 5
      },
      email: {
        required: true,
        email: true
      },
      mobile: {
        minlength: 10,
        maxlength: 10,
        required: true,
        number: true,
        phoneNumberValidator: "required"
      },
    },
    messages: {
      firstname: {
        required: "Enter your firstname",
        minlength: "Enter at least 3 characters",
        maxlength: "Enter maximumm 10 caharacters",
      },
      lastname: {
        required: "Enter your lastname",

        minlength: "Enter minimum 1 charecter",
      },
      address: {
        required: "Enter your address",
        minlength: "Enter minimum 10 charecter",
      },
      city: {
        required: "Enter your city",
      },
      state: {
        required: "Enter your state",
      },
      zip: {
        required: "Enter your zipcode",
        minlength: "Enter minimum 5 charecter",
      },
      email: {
        required: "Enter your email",
        email: "Enter a valid email",
      },
      mobile: {
        required: "Enter your mobile number",
        minlength: "Mobile must be 10 digit",
        maxlength: "Mobile must be 10 digit",
      },
    },
  });
});

//------user Signup -------
$(document).ready(function () {
  $("#usersign").validate({
    rules: {
      name: {
        required: true,

        minlength: 3,
      },
      email: {
        required: true,
        email: true,
      },
      mobile: {
        required: true,
        number: true,
        minlength: 10,
        maxlength: 10,
        phoneNumberValidator: "required",
      },
      password: {
        required: true,
        minlength: 5,
      },
      confirmPassword:{
        required: true,
        
      }
    },
    messages: {
      name: {
        required: "Enter your name*",
        minlength: "Enter minimum 3 charecter*",
      },
      email: {
        required: "Enter your Email*",
        email: "Enter a valid email*",
      },
      mobile: {
        required: "Enter your mobile",
        minlength: "Mobile must be 10 digit*",
        number: "Enter a valid mobile number*",
        maxlength: "Enter mobile without country code*",
        
      },
      password: {
        required: "Enter your password",
        minlength: "Password too short*",
      },
      confirmPassword:{
        required: "Enter your password",
      }
    },
  });
});

//add product admin
$(document).ready(function () {
  $("#addProduct").validate({
    rules: {
      name: {
        required: true,
      },
      description: {
        required: true,
        minlength: 5,
      },
      size: {
        required: true,
        number: true,
      },
      stock: {
        required: true,
        number: true,
      },
      image1: {
        required: true,
      },
      image2: {
        required: true,
      },
      image3: {
        required: true,
      },
      image4: {
        required: true,
      },
      orgprice: {
        required: true,
        number: true,
      },
      disprice: {
        required: true,
        number: true,
      },
    },
    messages: {
      name: {
        required: "Enter product name",
      },
      description: {
        required: "Enter description",
        minlength: "Minumum 5 charecters",
      },
      size: {
        required: "Enter size",
        number: "Size must be a number",
        maxlength: "Size must be 2 digit",
      },
      stock: {
        required: "Enter stock",
        number: "Stock must be number",
      },
      image1: {
        required: "Please choose image",
      },
      image2: {
        required: "Please choose image",
      },
      image3: {
        required: "Please choose image",
      },
      image4: {
        required: "Please choose image",
      },
      orgprice: {
        required: "Enter Original price",
        number: "Price should be number",
      },
      disprice: {
        required: "Enter discount price",
        number: "Price should be number",
      },
    },
  });
});

//otp mibile
$(document).ready(function () {
  $("#otpmob").validate({
    rules: {
      mobile: {
        required: true,
        number: true,
        minlength: 10,
        maxlength: 10,
      },
    },
    messages: {
      mobile: {
        required: "Enter your mobile number",
        number: "Enter a valid mobile number",
        minlength: "Mobile number must be 10 digit",
        maxlength: "Mobile number must be 10 digit",
      },
    },
  });
});

$(document).ready(function () {
  $("#adminLogin").validate({
    rules: {
      email: {
        required: true,
        email: true,
      },
      password: {
        minlength: 4,
        maxlength: 8,
        required: true,
      },
    },
    messages: {
      email: {
        required: "Enter your Email",
        email: "Enter a valid Email",
      },
      password: {
        required: "Enter a password",
        minlength: "Password must be in 4-8 characters",
      },
    },
  });
});

//Check out page of user

$(document).ready(function () {
  $("#userChangePass").validate({
    rules: {
      current: {
        minlength: 4,
        required: true,
        maxlength: 8,
      },
      password1: {
        minlength: 4,
        required: true,
        maxlength: 8,
      },
      password2: {
        minlength: 4,
        required: true,
        maxlength: 8,
      },
    },
    messages: {
      current: {
        required: "Enter a password",
        minlength: "Password must be in 4-8 characters",
        maxlength: "Password must be in 4-8 characters",
      },
      password1: {
        required: "Enter a password",
        minlength: "Password must be in 4-8 characters",
        maxlength: "Password must be in 4-8 characters",
      },
      password2: {
        required: "Enter a password",
        minlength: "Password must be in 4-8 characters",
        maxlength: "Password must be in 4-8 characters",
      },
    },
  });
});

//add new address in user profle section

$(document).ready(function () {
  $("#addNewAddress-form").validate({
    rules: {
      Name: {
        required: true,
      },
      House: {
        required: true,
      },
      Street: {
        required: true,
      },
      Town: {
        required: true,
      },
      PIN: {
        required: true,
        number: true,
        minlength: 6,
        maxlength: 6,
      },
      Mobile: {
        required: true,
        number: true,
        minlength: 10,
        maxlength: 10,
      },
      Email: {
        required: true,
        email: true,
      },
    },
    messages: {
      Name: {
        required: "Enter your name",
      },
      House: {
        required: "Enter your House name",
      },
      Street: {
        required: "Enter your Street name",
      },
      Town: {
        required: "Enter your Town name",
      },
      PIN: {
        required: "Enter a PIN",
        minlength: "PIN must be in 6 characters",
      },
      Mobile: {
        required: "Enter a mobile number",
        number: "Enter a valid mobile number",
        minlength: "Enter 10 numbers",
        maxlength: "Enter without country code",
      },
      Email: {
        required: "Enter your Email",
        email: "Enter a valid Email",
      },
    },
  });
});

//----Offer validation-------

$(document).ready(function () {
  $("#addCatoffer").validate({
    rules: {
      categoryDiscount: {
        required: true,
        min: 1,
        max: 75,
      },
    },
    messages: {
      categoryDiscount: {
        required: "Enter offer Percentage",
      },
    },
  });
});

$(document).ready(function () {
  $("#addProOffer").validate({
    rules: {
      productDiscount: {
        required: true,
        min: 1,
        max: 75,
      },
    },
    messages: {
      productDiscount: {
        required: "Enter offer Percentage",
      },
    },
  });
});

$(document).ready(function () {
  $("#editCatOffer").validate({
    rules: {
      discount: {
        required: true,
        min: 1,
        max: 75,
      },
    },
    messages: {
      productDiscount: {
        required: "Enter offer Percentage",
      },
    },
  });
});

$(document).ready(function () {
  $("#editProOffer").validate({
    rules: {
      discount: {
        required: true,
        min: 1,
        max: 75,
      },
    },
    messages: {
      productDiscount: {
        required: "Enter offer Percentage",
      },
    },
  });
});

//coupon validation

$(document).ready(function () {
  $("#addCoupon").validate({
    rules: {
      couponName: {
        required: true,
      },
      discount: {
        required: true,
        min: 1,
        max: 75,
      },
    },
    messages: {
      productDiscount: {
        required: "Enter offer Percentage",
      },
    },
  });
});

//change password 

$(document).ready(function () {
  $("#changePassword").validate({
    rules: {
      currentPassword: {
        required: true,
      },
      confirm: {
        required: true,
        minlength:4,
      },
      newPassword:{
        required:true,
        minlength:4,
      }
    },
    messages: {
      currentPassword: {
        required: "Please Enter your password*",
      },
      confirm: {
        required: "Please Enter new password*",
      },
      newPassword: {
        required: "Please Enter new password*",
      },
    },
  });
});