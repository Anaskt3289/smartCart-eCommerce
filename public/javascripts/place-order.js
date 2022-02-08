$('#checkout-form').submit((e)=>{
    e.preventDefault()
    $.ajax({
        url:'/placeorder',
        method:'post',
        data:$('#checkout-form').serialize(),
        success:(response)=>{
            if(response.status){
                window.location.href='/successpage'
            }
        }
    })
    
})