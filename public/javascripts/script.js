//--------image zooming----------

var options1 = {
  width: 400,
  height: 400,
  zoomWidth: 400,
  offset: { vertical: 10, horizontal: 15 },
};

new ImageZoom(document.getElementById("main_image"), options1);

function changeImage(element) {
  var main_prodcut_image = document.getElementById("main_product_image");
  main_prodcut_image.src = element.src;
  var elements = document.getElementsByClassName("js-image-zoom__zoomed-image");
  for (var i = 0; i < elements.length; i++) {
    elements[i].style.backgroundImage = `url(${element.src})`;
  }
}

//------------checkout payment radio button-----------------------
// the selector will match all input controls of type :checkbox
// and attach a click event handler
$("input:checkbox").on("click", function () {
  // in the handler, 'this' refers to the box clicked on
  var $box = $(this);
  if ($box.is(":checked")) {
    // the name of the box is retrieved using the .attr() method
    // as it is assumed and expected to be immutable
    var group = "input:checkbox[name='" + $box.attr("name") + "']";
    // the checked state of the group/box on the other hand will change
    // and the current value is retrieved using .prop() method
    $(group).prop("checked", false);
    $box.prop("checked", true);
  } else {
    $box.prop("checked", false);
  }
});



// -------------user profile side bar toggle script----------

const menu_toggle = document.querySelector(".menu-toggle");
const sidebars = document.querySelector(".sidebar");
console.log({ menu_toggle, sidebars });
menu_toggle.addEventListener("click", () => {
  menu_toggle.classList.toggle("is-active");
  sidebars.classList.toggle("is-active");
});


