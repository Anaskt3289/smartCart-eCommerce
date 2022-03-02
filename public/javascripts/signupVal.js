//sign up validation

$(document).ready(function() {
   jQuery.validator.addMethod('mypassword', function(value, element) 
{
   return this.optional(element) || (value.match(/[a-zA-Z]/) && value.match(/[0-9]/));
});
jQuery.validator.addMethod('myemail', function(value, element) 
{
   return this.optional(element) || /^\w+([\.-]?\w+)@\w+([\.-]?\w+)(\.\w{2,3})+$/.test( value );
});
    $("#usersignup").validate({
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
          pword:{
              required: true,
              minlength:6,
              mypassword:true
          },
          repeatpword:{
            required: true,
            equalTo:'#psword'
        }
       },
       messages:{
          email:{
             myemail:'Enter a valid email'
          },
          pword:{
             mypassword:'Password should contain alphabets and numbers'
          },
          repeatpword:{
             equalTo:'Enter the same password'
          }
       }
    })
})



