
//ajax function to add products to cart
function addToCart(prodId, count) {
   
    if(count==1){
      quantity=1
    }else{
        quantity=parseInt(document.getElementById('productquantity').value)
    }
    $.ajax({
        url:'/addToCart/'+prodId+'/'+quantity,
        method:'get',
        success:(response)=>{
            if(response.status){
                let count = document.getElementById("cart-count").getAttribute("data-notify");
                count=parseInt(count)+1
                document.getElementById("cart-count").setAttribute("data-notify", count);
            }
        }
    })
}


//ajax function to change the cart quantity
function changeQuantity(cartId,productId,userId,count){
    let quantity=parseInt(document.getElementById(productId).value)
    count=parseInt(count)
    $.ajax({
        url:'/changeCartQuantity',
        data:{
            cart:cartId,
            product:productId,
            count:count,
            quantity:quantity,
            user:userId
        },
        method:'post',
        success:(response)=>{
            if(response.removeProduct){
                alert('Product removed from cart')
                location.reload()
            }else{
            document.getElementById(productId).value=quantity+count
            document.getElementById(productId+'1').innerHTML=response.subtotal
            document.getElementById('total').innerHTML=response.total
            document.getElementById('grandtotal').innerHTML=response.grandtotal

            }
        }
    })
}

//add to wishlist
function addtoWishlist(prodId) {
    
    $.ajax({
        url:'/addtoWishlist?id='+prodId,
        method:'get',
        success:(response)=>{
            if(response.status){
                if(response.productInWishlist){
                  
                    removefromWishlist(prodId)
                   

                }else{
                    let count = document.getElementById("wishlist-count").getAttribute("data-notify");
                    count=parseInt(count)+1
                    document.getElementById("wishlist-count").setAttribute("data-notify", count);
                    document.getElementById("wishlisticon1"+prodId).src = "images/icons/icon-heart-02.png";
                    document.getElementById("wishlisticon2"+prodId).src = "images/icons/icon-heart-01.png";
                  
                }
            }
        }
    })
}


//remove product from wishlist
function removefromWishlist(prodId){
    $.ajax({
        url:'/removefromWishlist?id='+prodId,
        method:'get',
        success:(response)=>{
            if(response.status){
                let count = document.getElementById("wishlist-count").getAttribute("data-notify");
                    count=parseInt(count)-1
                    document.getElementById("wishlist-count").setAttribute("data-notify", count);
                document.getElementById("wishlisticon1"+prodId).src = "images/icons/icon-heart-01.png";
                document.getElementById("wishlisticon2"+prodId).src = "images/icons/icon-heart-02.png";
            }
        }
    })
}
