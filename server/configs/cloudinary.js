require('dotenv').config();
const cloudinary= require('cloudinary').v2;

const connectCloudinary= ()=>{
    cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
    });
    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
        console.error("Cloudinary environment variables missing! Image uploads will fail.");
    } else {
        console.log("Cloudinary configured successfully.");
    }
}

module.exports= { connectCloudinary, cloudinary };