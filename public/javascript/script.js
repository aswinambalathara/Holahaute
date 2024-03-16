
const search = document.getElementById('search-bar');
const productList = document.querySelector('.isotope-grid');

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



