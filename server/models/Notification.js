const mongoose= require('mongoose');

const notificationSchema= new mongoose.Schema({
    recipient: {type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true},
    actor: {type: mongoose.Schema.Types.ObjectId, ref: 'User'},
    type: {type: String, enum: ['task-added', 'task-removed', 'task-assigned-to-me', 'team-invitation', 'friend-request-received'], required: true},
    title: {type: String, required: true},
    message: {type: String, required: true},
    isRead: {type: Boolean, default: false, index: true},
    createdAt: {type: Date, default: Date.now},
    metadata: {type: mongoose.Schema.Types.Mixed, default: {}},
})

module.exports= mongoose.models.Notification || mongoose.model('Notification', notificationSchema);