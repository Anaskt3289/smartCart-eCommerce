$(document).ready(function() {

     $("#addproduct").validate({
        rules: {
            product:{
               required:true
            },
            category: {
               required: true
            },
            brand:{
               required:true
            },
            quantity:{
                required: true,
            },
            price:{
              required: true
          },
          stock:{ 
             required:true
          },
          description:{
             required:true,
             minlength:10
          },
          specs:{
            required:true
         },
         productimage1:{
            required:true,
         },
         productimage2:{
            required:true,
         },
         productimage3:{
            required:true,
         },
         productimage4:{
            required:true,
         },
         }
     })
 })