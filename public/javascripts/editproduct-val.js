$(document).ready(function() {

    $("#editproduct").validate({
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
       
        }
    })
})