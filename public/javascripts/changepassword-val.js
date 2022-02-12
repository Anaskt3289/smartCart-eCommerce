$(document).ready(function() {
    jQuery.validator.addMethod('mypassword', function(value, element) 
 {
    return this.optional(element) || (value.match(/[a-zA-Z]/) && value.match(/[0-9]/));
 });

     $("#changepassword").validate({
        rules: {
           oldpword:{
               required:true
           },
           newpword:{
               required: true,
               minlength:6,
               mypassword:true
           },
           newrepeatpword:{
             required: true,
             equalTo:'#newpsword'
         }
        },
        messages:{
           newpword:{
              mypassword:'Password should contain alphabets and numbers'
           },
           newrepeatpword:{
              equalTo:'Enter the same password'
           }
        }
     })
 })