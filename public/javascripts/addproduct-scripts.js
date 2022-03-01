

function viewImage1(event){
    let file = event.target.files[0].name
     let extension = file.split('.').pop()
      if (extension == 'jpeg' || extension == 'png' || extension == 'jpg'){
        document.getElementById('errmsg1').style.display='none'
    document.getElementById('imagePreview1').src=URL.createObjectURL(event.target.files[0])
     document.getElementById('imagePreview1').style.display='block'

     const imagebox = document.getElementById('image-box')
     const crop_btn = document.getElementById('crop-btn')
     var fileInput = document.getElementById('prodimg1');

     var filePath = fileInput.value;

     const img_data = fileInput.files[0]
     const url = URL.createObjectURL(img_data)
     imagebox.innerHTML = `<img src="${url}" id="image" style="width:100%">`
     const image = document.getElementById('image')
     document.getElementById('image-box').style.display = 'block'
     document.getElementById('crop-btn').style.display = 'block'
     document.getElementById('confirm-btn').style.display = 'none'

     const cropper = new Cropper(image, {
        autoCropArea: 1,
        viewMode: 1,
        scalable: false,
        zoomable: false,
        movable: false,
        aspectRatio: 16 / 17,
        //  preview: '.preview',
        minCropBoxWidth: 180,
        minCropBoxHeight: 240,
    })
    crop_btn.addEventListener('click', () => {
        cropper.getCroppedCanvas().toBlob((blob) => {
            let fileInputElement = document.getElementById('prodimg1');
            let file = new File([blob], img_data.name, { type: "image/*", lastModified: new Date().getTime() });
            let container = new DataTransfer();

            container.items.add(file);
            const img = container.files[0]
            var url = URL.createObjectURL(img)
            fileInputElement.files = container.files;
            document.getElementById('imagePreview1').src = url
            document.getElementById('image-box').style.display = 'none'
            document.getElementById('crop-btn').style.display = 'none'
            document.getElementById('confirm-btn').style.display = 'block'
        });
    });

     

      }else{
       
        document.getElementById('errmsg1').style.display='block'
        $("#prodimg1").val(null);
      }
    
}
 function viewImage2(event){
   let file = event.target.files[0].name
     let extension = file.split('.').pop()
      if (extension == 'jpeg' || extension == 'png' || extension == 'jpg'){
        document.getElementById('errmsg2').style.display='none'
    document.getElementById('imagePreview2').src=URL.createObjectURL(event.target.files[0])
     document.getElementById('imagePreview2').style.display='block'
      

     const imagebox = document.getElementById('image-box')
     const crop_btn = document.getElementById('crop-btn')
     var fileInput = document.getElementById('prodimg2');

     var filePath = fileInput.value;

     const img_data = fileInput.files[0]
     const url = URL.createObjectURL(img_data)
     imagebox.innerHTML = `<img src="${url}" id="image" style="width:100%">`
     const image = document.getElementById('image')
     document.getElementById('image-box').style.display = 'block'
     document.getElementById('crop-btn').style.display = 'block'
     document.getElementById('confirm-btn').style.display = 'none'

     const cropper = new Cropper(image, {
        autoCropArea: 1,
        viewMode: 1,
        scalable: false,
        zoomable: false,
        movable: false,
        aspectRatio: 16 / 17,
        //  preview: '.preview',
        minCropBoxWidth: 180,
        minCropBoxHeight: 240,
    })
    crop_btn.addEventListener('click', () => {
        cropper.getCroppedCanvas().toBlob((blob) => {
            let fileInputElement = document.getElementById('prodimg2');
            let file = new File([blob], img_data.name, { type: "image/*", lastModified: new Date().getTime() });
            let container = new DataTransfer();

            container.items.add(file);
            const img = container.files[0]
            var url = URL.createObjectURL(img)
            fileInputElement.files = container.files;
            document.getElementById('imagePreview2').src = url
            document.getElementById('image-box').style.display = 'none'
            document.getElementById('crop-btn').style.display = 'none'
            document.getElementById('confirm-btn').style.display = 'block'
        });
    });

      }else{
        document.getElementById('errmsg2').style.display='block'
        $("#prodimg2").val(null);
      }

}
 function viewImage3(event){
    let file = event.target.files[0].name
     let extension = file.split('.').pop()
      if (extension == 'jpeg' || extension == 'png' || extension == 'jpg'){
        document.getElementById('errmsg3').style.display='none'
    document.getElementById('imagePreview3').src=URL.createObjectURL(event.target.files[0])
     document.getElementById('imagePreview3').style.display='block'
     


     const imagebox = document.getElementById('image-box')
     const crop_btn = document.getElementById('crop-btn')
     var fileInput = document.getElementById('prodimg3');

     var filePath = fileInput.value;

     const img_data = fileInput.files[0]
     const url = URL.createObjectURL(img_data)
     imagebox.innerHTML = `<img src="${url}" id="image" style="width:100%">`
     const image = document.getElementById('image')
     document.getElementById('image-box').style.display = 'block'
     document.getElementById('crop-btn').style.display = 'block'
     document.getElementById('confirm-btn').style.display = 'none'

     const cropper = new Cropper(image, {
        autoCropArea: 1,
        viewMode: 1,
        scalable: false,
        zoomable: false,
        movable: false,
        aspectRatio: 16 / 17,
        //  preview: '.preview',
        minCropBoxWidth: 180,
        minCropBoxHeight: 240,
    })
    crop_btn.addEventListener('click', () => {
        cropper.getCroppedCanvas().toBlob((blob) => {
            let fileInputElement = document.getElementById('prodimg3');
            let file = new File([blob], img_data.name, { type: "image/*", lastModified: new Date().getTime() });
            let container = new DataTransfer();

            container.items.add(file);
            const img = container.files[0]
            var url = URL.createObjectURL(img)
            fileInputElement.files = container.files;
            document.getElementById('imagePreview3').src = url
            document.getElementById('image-box').style.display = 'none'
            document.getElementById('crop-btn').style.display = 'none'
            document.getElementById('confirm-btn').style.display = 'block'
        });
    });

      }else{
        document.getElementById('errmsg3').style.display='block'
        $("#prodimg3").val(null);
      }
}
 function viewImage4(event){
    let file = event.target.files[0].name
     let extension = file.split('.').pop()
      if (extension == 'jpeg' || extension == 'png' || extension == 'jpg'){
        document.getElementById('errmsg4').style.display='none'
    document.getElementById('imagePreview4').src=URL.createObjectURL(event.target.files[0])
     document.getElementById('imagePreview4').style.display='block'
      

     const imagebox = document.getElementById('image-box')
     const crop_btn = document.getElementById('crop-btn')
     var fileInput = document.getElementById('prodimg4');

     var filePath = fileInput.value;

     const img_data = fileInput.files[0]
     const url = URL.createObjectURL(img_data)
     imagebox.innerHTML = `<img src="${url}" id="image" style="width:100%">`
     const image = document.getElementById('image')
     document.getElementById('image-box').style.display = 'block'
     document.getElementById('crop-btn').style.display = 'block'
     document.getElementById('confirm-btn').style.display = 'none'

     const cropper = new Cropper(image, {
        autoCropArea: 1,
        viewMode: 1,
        scalable: false,
        zoomable: false,
        movable: false,
        aspectRatio: 16 / 16,
        //  preview: '.preview',
        minCropBoxWidth: 180,
        minCropBoxHeight: 240,
    })
    crop_btn.addEventListener('click', () => {
        cropper.getCroppedCanvas().toBlob((blob) => {
            let fileInputElement = document.getElementById('prodimg4');
            let file = new File([blob], img_data.name, { type: "image/*", lastModified: new Date().getTime() });
            let container = new DataTransfer();

            container.items.add(file);
            const img = container.files[0]
            var url = URL.createObjectURL(img)
            fileInputElement.files = container.files;
            document.getElementById('imagePreview4').src = url
            document.getElementById('image-box').style.display = 'none'
            document.getElementById('crop-btn').style.display = 'none'
            document.getElementById('confirm-btn').style.display = 'block'
        });
    });

      }else{
        document.getElementById('errmsg4').style.display='block'
        $("#prodimg4").val(null);
      }
}


$('.numbers').keyup(function () {
this.value = this.value.replace(/[^0-9\.]/g, '');
});
