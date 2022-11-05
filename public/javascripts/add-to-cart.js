
  function addToCart(event, id) {
    console.log(id)
    event.preventDefault();
    $.ajax({
      url: '/add-to-cart',
      data: {
        productId: id
      },
      method: 'post',
      success: (response) => {
        if (response.status) {
          let count=document.getElementById('cart');
          console.log("count")
          console.log(count)
          const countno=count?.textContent ?? 0;
          console.log(countno)
          count.textContent=1+Number(countno);
         
          
          // Alert the copied text
          Toastify({
            text: "Product added to cart",
            duration: 3000,
            gravity: "bottom", // `top` or `bottom`
            position: "center", // `left`, `center` or `right`
            stopOnFocus: true, // Prevents dismissing of toast on hover
            style: {
              // background: "linear-gradient(to right, #485563, #29323c)",
              background: "black",
            },
            onClick: function () { } // Callback after click
          }).showToast();
        } else {
          location.href = '/login'

        }

      }
    });
  }
