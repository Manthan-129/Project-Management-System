require('dotenv').config();

const User = require('../../models/User');
const bcrypt= require('bcrypt');
const {cloudinary}= require('../../configs/cloudinary');

const updateUserInfo= async (req, res)=>{
    try{
        const userId= req.userId;
        const {password}= req.body;

        if(!password) {
            return res.status(404).json({success: false, message: "Password is required for updating user info"});
        }

        const user= await User.findById(userId).select("+password");

        if(!user){
            return res.status(404).json({success: false, message: "User not found"});
        }

        const isMatch= await bcrypt.compare(password, user.password);
        if(!isMatch){
            return res.status(404).json({success: false, message: "Incorrect password. Cannot update user info."});
        }

        const {firstName, lastName, bio, githubUrl, portfolioUrl, linkedinUrl}= req.body;
        
        const imageFile= req.file;
        
        
        if(imageFile){
        const imageUpload= await cloudinary.uploader.upload(imageFile.path, {
            folder: "devdash_profiles",
            resource_type: "image",
            transformation: [{width: 500, height: 500, crop: "fill"}]
        })

        console.log("Cloudinary Upload Result:", imageUpload.secure_url);

        user.profilePicture= imageUpload.secure_url;
        }

        if(firstName) user.firstName= firstName;
        if(lastName) user.lastName= lastName;
        if(bio) user.bio= bio;
        if(githubUrl && validator.isURL(githubUrl)) user.githubUrl= githubUrl;
        if(portfolioUrl && validator.isURL(portfolioUrl)) user.portfolioUrl= portfolioUrl;
        if(linkedinUrl && validator.isURL(linkedinUrl)) user.linkedinUrl= linkedinUrl;

        console.log("Received file in updateUserInfo:", imageFile ? imageFile.originalname : "No file uploaded");
        const updatedUser= await user.save();
        const updateduser= await User.findById(updatedUser._id);

        console.log("Received file in updateUserInfo:", imageFile ? imageFile.originalname : "No file uploaded");
        return res.status(200).json({success: true, message: "User info updated successfully", user: updateduser});

    }catch(error){
        return res.status(500).json({success: false, message: "Error in updating user info"});
    }
}

module.exports= { updateUserInfo };