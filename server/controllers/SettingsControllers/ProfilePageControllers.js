require('dotenv').config();

const User = require('../../models/User');
const Team = require('../../models/Team');
const Task = require('../../models/Task');
const PullRequest = require('../../models/PullRequest');
const bcrypt= require('bcrypt');
const validator= require('validator');
const {cloudinary}= require('../../configs/cloudinary');

const updateUserInfo= async (req, res)=>{
    try{
        const userId= req.userId;
        const {password}= req.body;

        if(!password) {
            return res.status(400).json({success: false, message: "Password is required for updating user info"});
        }

        const user= await User.findById(userId).select("+password");

        if(!user){
            return res.status(404).json({success: false, message: "User not found"});
        }

        const isMatch= await bcrypt.compare(password, user.password);
        if(!isMatch){
            return res.status(401).json({success: false, message: "Incorrect password. Cannot update user info."});
        }

        const {firstName, lastName, bio, githubUrl, portfolioUrl, linkedinUrl, profilePicture}= req.body;
        
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

        if(profilePicture === ""){
            user.profilePicture= "";
        }

        if(firstName) user.firstName= firstName;
        if(lastName) user.lastName= lastName;
        if(bio) user.bio= bio;
        if(githubUrl && validator.isURL(githubUrl)) user.githubUrl= githubUrl;
        if(portfolioUrl && validator.isURL(portfolioUrl)) user.portfolioUrl= portfolioUrl;
        if(linkedinUrl && validator.isURL(linkedinUrl)) user.linkedinUrl= linkedinUrl;

         const updatedUser= await user.save();
        // Refetch without password (save() returns doc with selected fields)
        const safeUser = await User.findById(updatedUser._id).select('-password');
        return res.status(200).json({success: true, message: "User info updated successfully", user: safeUser});

    }catch(error){
        return res.status(500).json({success: false, message: "Error in updating user info"});
    }
}

const getUserProfile = async (req, res) => {
    try {
        const { username } = req.params;
        const currentUserId = req.userId; // Optional, might be available if logged in

        const targetUser = await User.findOne({ username }).lean();
        if (!targetUser) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        const privacy = targetUser.privacySettings || {};
        const isSelf = currentUserId === targetUser._id.toString();

        let isFriend = false;
        if (currentUserId && targetUser.friends) {
            isFriend = targetUser.friends.some(fId => fId.toString() === currentUserId);
        }

        if (privacy.profileVisibility === 'private' && !isSelf) {
            return res.status(403).json({ success: false, message: "This profile is private." });
        }

        // Dynamically Aggregating Work Showcase from Teams, Tasks, and PRs
        const userTeams = await Team.find({
            $or: [
                { leader: targetUser._id },
                { 'members.user': targetUser._id }
            ]
        }).lean();

        if (privacy.profileVisibility === 'team-only' && !isSelf) {
            let sharesTeam = false;
            if (currentUserId) {
                // Determine if specifically the requestor is part of the user's teams
                sharesTeam = userTeams.some(team => 
                    team.leader.toString() === currentUserId || 
                    team.members.some(m => m.user.toString() === currentUserId)
                );
            }
            if (!sharesTeam) {
                return res.status(403).json({ success: false, message: "This profile is explicitly restricted to verified team members only." });
            }
        }

        // Bulk-fetch all data in 2 queries instead of 2*N
        const teamIds = userTeams.map(t => t._id);
        const [allCompletedTasks, allAcceptedPRs] = await Promise.all([
            Task.find({
                team: { $in: teamIds },
                assignedTo: targetUser._id,
                status: 'completed'
            }).select("title team").lean(),
            PullRequest.find({
                team: { $in: teamIds },
                sender: targetUser._id,
                status: 'accepted'
            }).select("githubPRLink team").lean(),
        ]);
        // Group by team ID
        const tasksByTeam = {};
        for (const t of allCompletedTasks) {
            const tid = t.team.toString();
            if (!tasksByTeam[tid]) tasksByTeam[tid] = [];
            tasksByTeam[tid].push(t.title);
        }
        const prsByTeam = {};
        for (const pr of allAcceptedPRs) {
            const tid = pr.team.toString();
            if (!prsByTeam[tid]) prsByTeam[tid] = [];
            prsByTeam[tid].push(pr.githubPRLink);
        }
        const workShowcase = userTeams.map((team) => {
            let roleStr = "Member";
            if (team.leader.toString() === targetUser._id.toString()) {
                roleStr = "Team Leader";
            } else {
                const membership = team.members.find(m => m.user.toString() === targetUser._id.toString());
                if (membership && membership.role === 'admin') roleStr = "Admin";
            }
            const tid = team._id.toString();
            return {
                _id: tid,
                title: team.name, 
                summary: team.description || team.title || `Contribution to ${team.name}`, 
                role: roleStr,
                details: [`Participated as a core ${roleStr.toLowerCase()}`], 
                techStack: [], 
                outcomes: tasksByTeam[tid] || [],
                prLinks: prsByTeam[tid] || [], 
                createdAt: team.createdAt
            };
        });

        const profileData = {
            _id: targetUser._id,
            username: targetUser.username,
            firstName: targetUser.firstName,
            lastName: targetUser.lastName,
            profilePicture: targetUser.profilePicture,
            bio: targetUser.bio,
            githubUrl: targetUser.githubUrl,
            linkedinUrl: targetUser.linkedinUrl,
            portfolioUrl: targetUser.portfolioUrl,
            friendCount: (targetUser.friends || []).length,
            isFriend,
            privacySettings: privacy,
            workShowcase, // Insert the dynamically fetched array
        };

        if (privacy.showEmail || isSelf) {
            profileData.email = targetUser.email;
        }

        return res.status(200).json({ success: true, profile: profileData });

    } catch (error) {
        console.error("Error in getUserProfile:", error.message);
        return res.status(500).json({ success: false, message: "Server error while fetching user profile" });
    }
};

module.exports= { updateUserInfo, getUserProfile };