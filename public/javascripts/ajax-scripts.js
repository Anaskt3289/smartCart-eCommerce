

function addToCart(prodId) {
    $.ajax({
        url:'/addToCart?id='+prodId,
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
function removeCartProduct(cartId,productId){
    $.ajax({
        url:'/removeCartProduct',
        data:{
            cart:cartId,
            product:productId
        },
        method:'post',
        success:(response)=>{
            if(response.status){
                alert('Product removed from cart')
                location.reload()
            }
        }
    })
}
