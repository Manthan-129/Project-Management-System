const User= require('../../models/User');


const getPrivacySettings= async (req, res)=>{
    try{
        const userId= req.userId;

        const user= await User.findById(userId).select("privacySettings");

        if(!user){
            return res.status(404).json({success: false, message: "User not found"});
        }

        return res.status(200).json({success: true, message: "Fetched privacy settings successfully", privacySettings: user.privacySettings || {}});

    }catch(error){
        return res.status(500).json({success: false, message: "Error in Get Privacy Settings Function"});
    }
}

const updatePrivacySettings= async (req, res)=>{
    try{
        const userId= req.userId;

        const settings= req.body;

        if(!settings || typeof settings !== "object"){
            return res.status(404).json({success: false, message: "Privacy settings data is required and must be an object"});
        }

        const {profileVisibility, showEmail, showOnlineStatus, showInSearch}= settings;

        if(profileVisibility === undefined && showEmail === undefined && showOnlineStatus === undefined && showInSearch === undefined){
            return res.status(404).json({success: false, message: "At least one privacy setting is required"});
        }

        const allowedVisibilities= ["public", "team-only", "private"];

        if(profileVisibility !== undefined && !allowedVisibilities.includes(profileVisibility)){
            return res.status(404).json({success: false, message: "Invalid profile visibility option"});
        }

        if((showEmail !== undefined && typeof showEmail !== "boolean") || 
        (showOnlineStatus !== undefined && typeof showOnlineStatus !== "boolean") || 
        (showInSearch !== undefined && typeof showInSearch !== "boolean")){
            return res.status(404).json({success: false, message: "Boolean fields must be true/false"});
        }

        const updateFields= {};

        if(profileVisibility !== undefined){
            updateFields["privacySettings.profileVisibility"]= profileVisibility;
        }
        if(showEmail !== undefined){
            updateFields["privacySettings.showEmail"]= showEmail;
        }
        if(showOnlineStatus !== undefined){
            updateFields["privacySettings.showOnlineStatus"]= showOnlineStatus;
        }
        if(showInSearch !== undefined){
            updateFields["privacySettings.showInSearch"]= showInSearch;
        }

        const user= await User.findByIdAndUpdate(userId, {$set: updateFields}, {new: true, runValidators: true}).select("privacySettings");
        
        if(!user){
            return res.status(404).json({success: false, message: "User not found"});
        }
        return res.status(200).json({success: true, message: "Privacy settings updated successfully", privacySettings: user.privacySettings});

    }catch(error){
        return res.status(500).json({success: false, message: "Error in Update Privacy Settings Function"});
    }
}

module.exports= { getPrivacySettings, updatePrivacySettings };