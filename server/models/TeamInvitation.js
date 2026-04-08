const mongoose= require('mongoose');

const teamInvitationSchema= new mongoose.Schema({
    team: {type: mongoose.Schema.Types.ObjectId, ref: 'Team', required: true},
    sender: {type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true},
    receiver: {type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true},
    message: {type: String, default: ''},
    status: {type: String, enum: ['pending', 'accepted', 'rejected'], default: 'pending'},
    createdAt: {type: Date, default: Date.now},
    respondedAt: {type: Date},
}, {timestamps: true});

teamInvitationSchema.index(
    { team: 1, receiver: 1, status: 1 },
    { unique: true, partialFilterExpression: { status: 'pending' } }
);
teamInvitationSchema.index({ receiver: 1, status: 1, createdAt: -1 });
teamInvitationSchema.index({ sender: 1, status: 1, createdAt: -1 });
teamInvitationSchema.index({ team: 1, status: 1, createdAt: -1 });

module.exports= mongoose.models.TeamInvitation || mongoose.model('TeamInvitation', teamInvitationSchema);