const mongoose= require('mongoose');


const GITHUB_HOSTS= new Set(["github.com", "www.github.com"]);
const LINKEDIN_HOSTS= new Set(["linkedin.com", "www.linkedin.com"]);

function isValidGithubUsername(username){
    if(!username) return false;
    if(username.length > 39) return false;

    if(username.startsWith("-") || username.endsWith("-")) return false;

    return /^[A-Za-z0-9-]+$/.test(username);
}

function isValidGitHubUrl(value){
    if(!value) return true;

    let parsed;
    try{
        parsed= new URL(value.trim());
    }catch{
        return false;
    }

    const protocol =parsed.protocol.toLowerCase();
    const hostname= parsed.hostname.toLowerCase();

    if(protocol !== "https:") return false;
    if(!GITHUB_HOSTS.has(hostname)) return false;

    const pathSegments= parsed.pathname.split("/").filter(Boolean);
    if(pathSegments.length === 0) return false;

    return isValidGithubUsername(pathSegments[0]);
}

function isValidLinkedInUrl(value){
    if(!value) return true;

    let parsed;
    try{
        parsed= new URL(value.trim());
    }catch{
        return false;
    }

    const protocol= parsed.protocol.toLowerCase();
    const hostname= parsed.hostname.toLowerCase();

    if(protocol !== "https:") return false;
    if(!LINKEDIN_HOSTS.has(hostname)) return false;

    const pathSegments= parsed.pathname.split("/").filter(Boolean);
    if(pathSegments.length === 0) return false;

    const allowedFirstSegment= new Set(["in", "company","school"]);
    if(!allowedFirstSegment.has(pathSegments[0].toLowerCase())) return false;

    return /^[A-Za-z0-9-_%]+$/.test(pathSegments[1]);
}

function isValidPortfolioUrl(value){
    if(!value) return true;

    let parsed;
    try{
        parsed= new URL(value.trim());
    }catch{
        return false;
    }

    const protocol= parsed.protocol.toLowerCase();
    const hostname= parsed.hostname.toLowerCase();

    if(protocol !== "https:") return false;

    if (!hostname || hostname === "localhost") return false;
    if(!hostname.includes(".")) return false;

    return true;
}

const UserSchema= new mongoose.Schema({

    // Profile Settings
    firstName: {type: String, required: true},
    lastName: {type: String, required: true},
    email: {type: String, required: true, unique: true},
    password: {type: String, required: true, select: false},
    username: {type: String, required: true, unique: true},
    bio: {type: String, default: ""},
    profilePicture: {type: String, default: ""},
    date: {type: Date, default: Date.now},
    githubUrl: {type: String, default: "", validate: {validator: isValidGitHubUrl, message: "Please provide a valid GitHub URL (https://github.com/<username>)."}},
    linkedinUrl: {type: String, default: "", validate: {validator: isValidLinkedInUrl, message: "Please provide a valid LinkedIn URL (https://www.linkedin.com/in/<id>)."}},
    portfolioUrl: {type: String, default: "", validate: {validator: isValidPortfolioUrl, message: "Please provide a valid portfolio URL using HTTPS."}},

    // Privacy Settings
    privacySettings: {
        profileVisibility: {type: String, enum: ["public", "team-only", "private"], default: "public"},
        showEmail: {type: Boolean, default: true},
        showOnlineStatus: {type: Boolean, default: true},
        showInSearch: {type: Boolean, default: true},
    },

    // Appearance Settings
    appearanceSettings: {
        theme: {type: String, enum: ["light", "dark", "system"], default: "system"},
        sidebarPosition: {type: String, enum: ["left", "right"], default: "left"},
    },

    // Account Settings 
    isActive: {type: Boolean, default: true, index: true},
    deactivatedAt: {type: Date, default: null},

    // Security Settings
    twoFactorEnabled: {type: Boolean, default: false},

    // OAuth Integrations
    integrations: {
        github: {
            connected: {type: Boolean, default: false},
            username: {type: String, default: ""},
            accessToken: {type: String, default: ""},
            refreshToken: {type: String, default: ""},
            lastSynced: {type: Date, default: null},
            autoSync: {type: Boolean, default: false},
        },
        linkedin: {
            connected: {type: Boolean, default: false},
            username: {type: String, default: ""},
            accessToken: {type: String, default: ""},
            refreshToken: {type: String, default: ""},
            lastSynced: {type: Date, default: null},
            autoSync: {type: Boolean, default: false},
        },
        bitbucket: {
            connected: {type: Boolean, default: false},
            username: {type: String, default: ""},
            accessToken: {type: String, default: ""},
            refreshToken: {type: String, default: ""},
            lastSynced: {type: Date, default: null},
            autoSync: {type: Boolean, default: false},
        },
    },

    // Friends List
    friends: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    }]

}, {timestamps: true});

module.exports= mongoose.models.User || mongoose.model("User", UserSchema);