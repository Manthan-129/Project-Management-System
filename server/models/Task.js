const mongoose= require('mongoose');

const taskSchema= new mongoose.Schema({
    title: {type: String, required: true},
    description: {type: String, default: ''},
    priority: {type: String, enum: ['Low', 'Medium', 'High'], default: 'Medium'},
    dueDate: {type: Date},
    assignedTo: {type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true},
    assignedBy: {type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true},
    status: {type: String, enum: ['todo', 'in-progress', 'in-review', 'completed'], default: 'todo'},
    team: {type: mongoose.Schema.Types.ObjectId, ref: 'Team', required: true},
    createdAt: {type: Date, default: Date.now},
    completedAt: {type: Date},
    isDeleted: {type: Boolean, default: false},
    deletedAt: {type: Date},
    deletedBy: {type: mongoose.Schema.Types.ObjectId, ref: 'User'},
    updatedBy: {type: mongoose.Schema.Types.ObjectId, ref: 'User'},
    updatedAt: {type: Date, default: Date.now},
}, {timestamps: true});


taskSchema.index(
  { team: 1, assignedTo: 1, status: 1 }
);
taskSchema.index({ team: 1, createdAt: -1 });
taskSchema.index({ assignedTo: 1, createdAt: -1 });
taskSchema.index({ assignedBy: 1, createdAt: -1 });

module.exports = mongoose.models.Task || mongoose.model('Task', taskSchema);