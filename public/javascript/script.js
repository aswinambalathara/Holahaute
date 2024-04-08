
const search = document.getElementById('search-bar');
const productList = document.querySelector('.isotope-grid');
const sortFilter = document.getElementsByName('sortFilter');
    const priceFilter = document.getElementsByName('priceFilter');
    const colorsFilter = document.getElementsByName('colorsFilter');
    const resetBtn = document.getElementById('resetBtn');
    const submitFiltersBtn = document.getElementById('submitFiltersBtn');
    const userOptions = document.getElementsByName('userOptions');
    const categories = document.getElementsByName('categories');
    const addWishlistBtns = document.querySelectorAll('.addWishlistBtn');
     const allInputs = document.querySelectorAll('.sortFilter,.priceFilter,.colorsFilter,.userOptions,.categoryFilter');
     const wishlistNotify = document.querySelector('.wishlist-notify');

    //  const existBatchCount = JSON.parse(localStorage.getItem('batchCount'))
    //  console.log(existBatchCount)
    //  const cartNotify = document.querySelector('.cart-notify');
   

    //  cartNotify.setAttribute('data-notify',existBatchCount.batchCount.cartCount);
      

    let checkedSort;
    let checkedPrice;
    let checkedUserOptions = []; 
    let checkedColors = [];
    let checkedCategory = '' ;

    categories.forEach((elem)=>{
        const parent = elem.parentElement;
        elem.addEventListener('click',()=>{
            categories.forEach((otherElem)=>{
                if(otherElem !== elem){
                     otherElem.parentElement.classList.remove('how-active1')
                }
            })
            parent.classList.add('how-active1')
        })
    })

search.addEventListener('input',async (e)=>{
    const searchTerm = search.value.trim()
    //console.log(searchTerm)
   const response = await fetch('/search',{
        
        method : "POST",
        headers :{
            "Content-Type":"application/json"
        },
        body: JSON.stringify({
            searchTerm : searchTerm 
        })
    });
    
    const data = await response.json()
console.log(data)
productList.innerHTML = ''
    if(data.suggestions.length > 0){
        data.suggestions.forEach((item)=>{
            const product = ` <div class="col-sm-6 col-md-4 col-lg-3 p-b-35 isotope-item ">
                <!-- Block2 -->
                <div class="block2">
                    <div class="block2-pic hov-img0">
                        <img src="/images/product-images/${item.images[0]}" alt="IMG-PRODUCT" style= "background-size: cover; height: 360px;">

                        <!-- <a href="#" class="block2-btn flex-c-m stext-103 cl2 size-102 bg0 bor2 hov-btn1 p-lr-15 trans-04 js-show-modal1">
                            Quick View
                        </a> -->

                    </div>

                    <div class="block2-txt flex-w flex-t p-t-14">
                        <div class="block2-txt-child1 flex-col-l ">
                            <a href="/productdetail/${item._id}" class="stext-104 cl4 hov-cl1 trans-04 js-name-b2 p-b-6" style="text-transform: capitalize;">
                                ${item.productName}
                            </a>

                            <span class="stext-105 cl3">
                                ₹ ${item.price}
                            </span>
                        </div>

                        <div class="block2-txt-child2 flex-r p-t-3">
                            <a href="#" class="btn-addwish-b2 dis-block pos-relative js-addwish-b2">
                                <img class="icon-heart1 dis-block trans-04" src="images/icons/icon-heart-01.png" alt="ICON">
                                <img class="icon-heart2 dis-block trans-04 ab-t-l" src="images/icons/icon-heart-02.png" alt="ICON">
                            </a>
                        </div>
                    </div>
                </div>
            </div>`

            productList.innerHTML += product ;
        })
    }else{
        productList.innerHTML = "<div class='d-flex justify-content-center'><p>Nothing Found</p></div>"
    }
})

colorsFilter.forEach((elem) => {
    elem.addEventListener('change', () => {
        const parent = elem.parentElement;
        const filterLink = parent.querySelector('.filter-link');
        if (elem.checked === true) {
            filterLink.classList.add('filter-link-active');
        } else {
            filterLink.classList.remove('filter-link-active');
        }
    })
})

resetBtn.addEventListener('click', () => {
    checkedUserOptions = []
    checkedColors = [],
    checkedSort = 'ascendingOrder'
    colorsFilter.forEach((elem) => {
        elem.checked = elem.checked ? !elem.checked : elem.checked
        const parent = elem.parentElement;
        const filterLink = parent.querySelector('.filter-link');
        if (filterLink) {
            filterLink.classList.remove('filter-link-active');
        }
    })
    userOptions.forEach((elem) => {
        elem.checked = elem.checked ? !elem.checked : elem.checked
    })

    sortFilter.forEach((elem) => {
        const parent = elem.parentElement;
        const filterLink = parent.querySelector('.filter-link');
        elem.checked = false;
        if (filterLink) {
            filterLink.classList.remove('filter-link-active');
        }
        const defaultSibling = parent.querySelector(
            elem.type === 'checkbox'
                ? 'input[type="checkbox"].default'
                : 'input[type="radio"].default'
        );
        if (defaultSibling) {
            defaultSibling.checked = true;
        }
    })

    priceFilter.forEach((elem) => {
        const parent = elem.parentElement;
        const filterLink = parent.querySelector('.filter-link');
        elem.checked = false;
        if (filterLink) {
            filterLink.classList.remove('filter-link-active');
        }
        const defaultSibling = parent.querySelector(
            elem.type === 'checkbox'
                ? 'input[type="checkbox"].default'
                : 'input[type="radio"].default'
        );
        if (defaultSibling) {
            defaultSibling.click()
        }
    })

})

sortFilter.forEach((elem) => {
    if (elem.checked) {
        checkedSort = elem.value
    };
    elem.addEventListener('change', () => {
        checkedSort = elem.value;
        //console.log(elem.value);
        changeActiveFilter(sortFilter, elem);
    });
});

priceFilter.forEach((elem) => {
    if (elem.checked) {
        checkedPrice = elem.value;
    }
    elem.addEventListener('change', () => {
        checkedPrice = elem.value;
        changeActiveFilter(priceFilter, elem);
    })
})

userOptions.forEach((elem) => {
    elem.addEventListener('click', () => {
        if (elem.checked === true) {
            // checkedUserOptions.push(elem.value);
        }
    })
})

function changeActiveFilter(filter, elem) {
    const parent = elem.parentElement;
    const filterLink = parent.querySelector('.filter-link');
    filter.forEach((otherElem) => {
        if (otherElem !== elem) {
            const otherLink = otherElem.parentElement.querySelector('.filter-link');
            otherLink.classList.remove('filter-link-active');
        }
    });
    if (elem.checked) {
        filterLink.classList.add('filter-link-active');
    }
}

async function fetchFunction(url, method, body) {
    const response = await fetch(url, {
        method: method,
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(body)
    })

    const data = await response.json()

    return data;
}

allInputs.forEach((input) => {
    input.addEventListener('click', () => fetchFilterProducts(input))
})

async function fetchFilterProducts(element) {

    if (element.classList.contains('sortFilter')) {
        checkedSort = element.value
    } else if (element.classList.contains('priceFilter')) {
        checkedPrice = element.value;
    } else if (element.classList.contains('colorsFilter')) {
        if (element.checked === true) {
            checkedColors.push(element.value)
        } else {
            checkedColors = checkedColors.filter((val) => val !== element.value);
        }
    } else if (element.classList.contains('userOptions')) {
        if (element.checked === true) {
            checkedUserOptions.push(element.value);
        } else {
            checkedUserOptions = checkedUserOptions.filter((val) => val !== element.value)
        }
    }else if(element.classList.contains('categoryFilter')){
        checkedCategory = element.value
    }

    // console.log(checkedUserOptions)
    // console.log(checkedColors)
    console.log(checkedCategory);
    const url = '/shop/filter'
    const method = 'POST'
    const body = {
        colors: checkedColors,
        userType: checkedUserOptions,
        sort: checkedSort,
        price: checkedPrice,
        category : checkedCategory
    }

    const data = await fetchFunction(url, method, body);

    productList.innerHTML = ''
if(data.status === true && data.results.length > 0){
    data.results.forEach((item)=>{
        const product = ` <div class="col-sm-6 col-md-4 col-lg-3 p-b-35 isotope-item simple-trans">
            <!-- Block2 -->
            <div class="block2">
                <div class="block2-pic hov-img0">
                    <img src="/images/product-images/${item.images[0]}" alt="IMG-PRODUCT" style= "background-size: cover; height: 360px;">

                    <!-- <a href="#" class="block2-btn flex-c-m stext-103 cl2 size-102 bg0 bor2 hov-btn1 p-lr-15 trans-04 js-show-modal1">
                        Quick View
                    </a> -->

                </div>

                <div class="block2-txt flex-w flex-t p-t-14">
                    <div class="block2-txt-child1 flex-col-l ">
                        <a href="/productdetail/${item._id}" class="stext-104 cl4 hov-cl1 trans-04 js-name-b2 p-b-6" style="text-transform: capitalize;">
                            ${item.productName}
                        </a>

                        <span class="stext-105 cl3">
                            ₹ ${item.price}
                        </span>
                    </div>

                    <div class="block2-txt-child2 flex-r p-t-3">
                        <a href="#" class="btn-addwish-b2 dis-block pos-relative js-addwish-b2">
                            <img class="icon-heart1 dis-block trans-04" src="images/icons/icon-heart-01.png" alt="ICON">
                            <img class="icon-heart2 dis-block trans-04 ab-t-l" src="images/icons/icon-heart-02.png" alt="ICON">
                        </a>
                    </div>
                </div>
            </div>
        </div>`

        productList.innerHTML += product ;
    })
}else{
    productList.innerHTML = "<div class='d-flex justify-content-center'><p>Nothing Found</p></div>"
}
}

addWishlistBtns.forEach((btn)=>{
    btn.addEventListener('click',async ()=>{
       const productId = btn.getAttribute('data-productid')
       console.log(productId)
       const url = '/wishlist/add'
       const method = "POST"
       const body = {
        productId : productId
       }
       const data = await fetchFunction(url,method,body);
       if(data.status === true){
        wishlistNotify.setAttribute('data-notify',data.wishlistCount)
        const animatedHeart = document.createElement('i');
        animatedHeart.classList.add('fa-solid', 'fa-heart');
        animatedHeart.style.color = '#f50000';
        animatedHeart.style.position = 'absolute'; // Ensure absolute positioning
        animatedHeart.style.top = btn.offsetTop + 'px'; // Align with button top
        animatedHeart.style.left = btn.offsetLeft + 'px'; // Align with button left
  
        // Append the animated heart to the button's parent element
        btn.parentElement.appendChild(animatedHeart);
  
        // Animate the heart icon using CSS transitions
        animatedHeart.style.transition = 'opacity 0.5s ease-in-out';
        animatedHeart.style.opacity = 1; 
        setTimeout(() => {
          animatedHeart.style.opacity = 0; 
  
          setTimeout(() => {
            animatedHeart.remove();
            btn.innerHTML = `<i class="fa-regular fa-heart"></i>`; 
          }, 1000);
        }, 2000); 
       }else{
        Swal.fire({
            text: data.message,
            icon: "error"
          });
       }
    })
})


