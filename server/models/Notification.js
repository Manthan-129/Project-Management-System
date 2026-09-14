const mongoose= require('mongoose');

const notificationSchema= new mongoose.Schema({
    recipient: {type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true},
    actor: {type: mongoose.Schema.Types.ObjectId, ref: 'User'},
    type: {
        type: String,
        enum: [
            'task-added',
            'task-removed',
            'task-assigned',
            'task-unassigned',
            'task-assigned-to-me',
            'team-invitation',
            'team-member-removed',
            'friend-request',
            'friend-request-received',
            'friend-request-accepted',
            'pr-created',
            'pr-reviewed',
        ],
        required: true,
    },
    title: {type: String, required: true},
    message: {type: String, required: true},
    isRead: {type: Boolean, default: false},
    metadata: {type: mongoose.Schema.Types.Mixed, default: {}},
}, {timestamps: true});

// Compound indexes for common query patterns
notificationSchema.index({ recipient: 1, createdAt: -1 });
notificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });
module.exports= mongoose.models.Notification || mongoose.model('Notification', notificationSchema);