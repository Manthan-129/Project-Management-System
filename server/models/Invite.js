const mongoose= require('mongoose');

const inviteSchema= new mongoose.Schema({
    sender: {type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true},
    receiver: {type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true},
    status: {type: String, enum: ['pending', 'accepted', 'rejected'], default: 'pending'},
}, { timestamps: true });

inviteSchema.index(
    { sender: 1, receiver: 1, status: 1 },
    { unique: true, partialFilterExpression: { status: 'pending' } }
);
inviteSchema.index({ receiver: 1, status: 1, createdAt: -1 });
inviteSchema.index({ sender: 1, status: 1, createdAt: -1 });

module.exports = mongoose.models.Invite || mongoose.model('Invite', inviteSchema);