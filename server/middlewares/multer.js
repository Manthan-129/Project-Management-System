const multer= require('multer');

const storage=  multer.diskStorage({});

const uploader= multer({storage});

module.exports= {uploader};