//user profile page validation

$(document).ready(function() {
    jQuery.validator.addMethod('mypassword', function(value, element) 
 {
    return this.optional(element) || (value.match(/[a-zA-Z]/) && value.match(/[0-9]/));
 });
 jQuery.validator.addMethod('myemail', function(value, element) 
 {
    return this.optional(element) || /^\w+([\.-]?\w+)@\w+([\.-]?\w+)(\.\w{2,3})+$/.test( value );
 });
     $("#userprofile").validate({
        rules: {
           fname:{
              required:true
           },
           email: {
              required: true,
              myemail:true
           },
           mobile:{
              required:true,
              minlength:10,
              maxlength:10
           },
           address:{
              required:true,
           }
        },
        messages:{
           email:{
              myemail:'Enter a valid email'
           }
        }
     })
 })
 
 
 
 