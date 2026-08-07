const mongoose= require('mongoose');

const pullRequestSchema= new mongoose.Schema({
    task: {type: mongoose.Schema.Types.ObjectId, ref: 'Task', required: true},
    team: {type: mongoose.Schema.Types.ObjectId, ref: 'Team', required: true},
    sender: {type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true},
    githubPRLink: {type: String, required: true, trim: true},
    message: {type: String, default: '', trim: true},
    status: {type: String, enum: ['pending', 'accepted', 'rejected'], default: 'pending'},
    reviewedBy: {type: mongoose.Schema.Types.ObjectId, ref: 'User'},
    reviewNote: {type: String, default: '', trim: true},
    reviewedAt: {type: Date},
}, {timestamps: true});
pullRequestSchema.index({ task: 1, sender: 1, status: 1 });
pullRequestSchema.index({ team: 1, status: 1, createdAt: -1 });
pullRequestSchema.index({ sender: 1, createdAt: -1 });
module.exports= mongoose.models.PullRequest || mongoose.model('PullRequest', pullRequestSchema);