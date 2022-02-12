


$('#checkout-form').submit((e)=>{
    e.preventDefault()
    $.ajax({
        url:'/placeorder',
        method:'post',
        data:$('#checkout-form').serialize(),
        success:(response)=>{
            if(response.codSuccess){
                window.location.href='/successpage?method=cod'
            }else if(response.razorpay){
                razorpayment(response)
            }else{
               window.location.href=response.paymentlink
            }
        }
    })
    
})

function razorpayment(order){
    var options = {
        "key": "rzp_test_P71kVccMvd0JVS", // Enter the Key ID generated from the Dashboard
        "amount": order.amount, // Amount is in currency subunits. Default currency is INR. Hence, 50000 refers to 50000 paise
        "currency": "INR",
        "name": "smartCart",
        "description": "smartCart Transaction",
        "image": "https://example.com/your_logo",
        "order_id": order.id, //This is a sample Order ID. Pass the `id` obtained in the previous step
        "handler": function (response){
            // alert(response.razorpay_payment_id);
            // alert(response.razorpay_order_id);
            // alert(response.razorpay_signature)
            verifyPayment(response,order)
        },
        "prefill": {
            "name": "Gaurav Kumar",
            "email": "gaurav.kumar@example.com",
            "contact": "9999999999"
        },
        "notes": {
            "address": "Razorpay Corporate Office"
        },
        "theme": {
            "color": "#3399cc"
        }
    };
    var rzp1 = new Razorpay(options);
    rzp1.on('payment.failed', function (response){
            alert(response.error.code);
            alert(response.error.description);
            alert(response.error.source);
            alert(response.error.step);
            alert(response.error.reason);
            alert(response.error.metadata.order_id);
            alert(response.error.metadata.payment_id);
    });
    // document.getElementById('rzp-button1').onclick = function(e){
        rzp1.open();
    //     e.preventDefault();
    // }

}

function verifyPayment(paymentdetails,order){
 $.ajax({
     url:'/verifyPayment',
     method:'post',
     data:{
         paymentdetails,
         order
     },
     success:(response)=>{
         if(response.paymentSuccess){
            window.location.href='/successpage?method=razorpay'
         }else{
           alert('Payment failed')
         }
     }
 })
}