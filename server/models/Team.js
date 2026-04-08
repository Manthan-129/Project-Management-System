const mongoose= require('mongoose');

const teamSchema= new mongoose.Schema({
    name: {type: String, required: true, trim: true, minLength: 3, maxLength: 50},
    title: {type: String, required: true, trim: true, minLength: 3, maxLength: 100},
    description: {type: String, default: '', trim: true},
    leader: {type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true},
    members: [
        {
            user: {type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true},
            role: {type: String, enum: ['member', 'admin'], default: 'member', required: true},
            joinedAt: {type: Date, default: Date.now},
            updatedAt: {type: Date, default: Date.now},
        }
    ],
    memberCount: {type: Number, default: 1},
    createdAt: {type: Date, default: Date.now},
}, {timestamps: true});

teamSchema.index({name: 1, leader: 1}, {unique: true}); // prevent duplicate team per user
teamSchema.index({leader: 1});
teamSchema.index({'members.user' : 1});

module.exports= mongoose.models.Team || mongoose.model('Team', teamSchema);