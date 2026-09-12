require('dotenv').config();

const Team = require('../../models/Team');
const Task = require('../../models/Task');
const PullRequest = require('../../models/PullRequest');
const Notification = require('../../models/Notification');
const Invite = require('../../models/Invite');
const TeamInvitation = require('../../models/TeamInvitation');

const User = require('../../models/User');
const OTP = require('../../models/OTP');
const bcrypt = require('bcrypt');
const validator = require('validator');
const { enqueueEmail } = require('../../queues/emailQueue');
const { updateEmailTemplate } = require('../../utils/emailTemplates.js');
const { runInTransaction } = require('../../utils/transactionHelper.js');
const { emitToUser, emitToAll } = require('../../configs/socket.js');

const UPDATE_EMAIL_PURPOSE = process.env.UPDATE_EMAIL_PURPOSE || 'update-email';

const updateUserEmailOTPRequest = async (req, res) => {
    try {
        const userId = req.userId;
        const rawEmail = req.body.newEmail;

        if (!rawEmail) {
            return res.status(400).json({ success: false, message: "New email is required" });
        }

        const newEmail = rawEmail.trim().toLowerCase();

        if (!validator.isEmail(newEmail)) {
            return res.status(400).json({ success: false, message: "Invalid email address" });
        }

        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        const existingUser = await User.findOne({ email: newEmail });

        if (existingUser) {
            return res.status(409).json({ success: false, message: "Email is already in use by another account" });
        }

        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        const otpHash = await bcrypt.hash(otp, 10);

        await OTP.deleteMany({ email: newEmail, purpose: UPDATE_EMAIL_PURPOSE });
        await OTP.create({
            email: newEmail,
            purpose: UPDATE_EMAIL_PURPOSE,
            otp: otpHash,
            expiresAt: new Date(Date.now() + 5 * 60 * 1000),
        });

        const tmpl = updateEmailTemplate(otp, 5);
        const mailOptions = {
            from: `"DevDash Support" <${process.env.SENDER_EMAIL || process.env.SMTP_USER}>`,
            to: newEmail,
            subject: tmpl.subject,
            text: tmpl.html.replace(/<[^>]+>/g, ''),
            html: tmpl.html,
        };

        enqueueEmail(mailOptions);

        return res.status(200).json({ success: true, message: "OTP sent to new email for verification" });

    } catch (error) {
        return res.status(500).json({ success: false, message: "Error in Update User Email OTP Request" });
    }
};

const verifyUpdateUserEmailOTP = async (req, res) => {
    try {
        const userId = req.userId;
        const { password, otp } = req.body;
        const rawEmail = req.body.newEmail;

        if (!password) {
            return res.status(400).json({ success: false, message: "Password is required for verifying email update" });
        }

        if (!rawEmail || !otp) {
            return res.status(400).json({ success: false, message: "New email and OTP are required" });
        }
        const newEmail = rawEmail.trim().toLowerCase();
        if (!validator.isEmail(newEmail)) {
            return res.status(400).json({ success: false, message: "Invalid email address" });
        }

        const user = await User.findById(userId).select("+password");

        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: "Incorrect password. Cannot verify email update." });
        }

        const otpRecord = await OTP.findOne({ email: newEmail, purpose: UPDATE_EMAIL_PURPOSE }).sort({ createdAt: -1 });

        if (!otpRecord) {
            return res.status(400).json({ success: false, message: "OTP expired or invalid" });
        }

        if (otpRecord.expiresAt < new Date()) {
            return res.status(400).json({ success: false, message: "OTP has expired. Please request a new one." });
        }

        const isOTPValid = await bcrypt.compare(otp, otpRecord.otp);

        if (!isOTPValid) {
            return res.status(400).json({ success: false, message: "Invalid OTP. Please try again." });
        }

        user.email = newEmail;

        await user.save();
        await OTP.deleteOne({ _id: otpRecord._id });

        return res.status(200).json({ success: true, message: "Email updated successfully" });

    } catch (error) {
        return res.status(500).json({ success: false, message: "Error in Verify Update User Email OTP" });
    }
};

const deactivateUserAccount = async (req, res) => {
    try {
        const userId = req.userId;

        const { password } = req.body;

        if (!password) {
            return res.status(400).json({ success: false, message: "Password is required for deactivating account" });
        }

        const user = await User.findById(userId).select("+password");

        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(401).json({ success: false, message: "Incorrect password. Cannot deactivate account." });
        }

        if (!user.isActive) {
            return res.status(400).json({ success: false, message: "Account is already deactivated" });
        }

        user.isActive = false;
        user.deactivatedAt = new Date();

        await user.save();

        emitToUser(userId, "user:deactivated", {});

        return res.status(200).json({
            success: true,
            message: "Account deactivated successfully. For reactivation, please login again.",
            deactivatedAt: user.deactivatedAt,
        });

    } catch (error) {
        return res.status(500).json({ success: false, message: "Error in Deactivate User Account" });
    }
};

const deleteUserAccount = async (req, res) => {
    try {
        const userId = req.userId;
        const { password } = req.body;

        if (!password) {
            return res.status(400).json({ success: false, message: "Password is required for deleting account" });
        }
        const user = await User.findById(userId).select("+password");

        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: "Incorrect password. Cannot delete account." });
        }

        const ledTeams = await Team.find({ leader: userId }).select('_id').lean();
        const ledTeamIds = ledTeams.map(t => t._id);

        await runInTransaction(async (session) => {
            const opts = session ? { session } : {};

            if (ledTeamIds.length > 0) {
                await Task.deleteMany({ team: { $in: ledTeamIds } }, opts);
                await PullRequest.deleteMany({ team: { $in: ledTeamIds } }, opts);
                await TeamInvitation.deleteMany({ team: { $in: ledTeamIds } }, opts);
                await Team.deleteMany({ _id: { $in: ledTeamIds } }, opts);
            }

            await Team.updateMany({ 'members.user': userId }, { $pull: { members: { user: userId } }, $inc: { memberCount: -1 } }, opts);
            await User.updateMany({ friends: userId }, { $pull: { friends: userId } }, opts);
            await Invite.deleteMany({ $or: [{ sender: userId }, { receiver: userId }] }, opts);
            await TeamInvitation.deleteMany({ $or: [{ sender: userId }, { receiver: userId }] }, opts);
            await Notification.deleteMany({ $or: [{ recipient: userId }, { actor: userId }] }, opts);
            await PullRequest.deleteMany({ sender: userId }, opts);
            await User.findByIdAndDelete(userId, opts);
        });

        emitToUser(userId, "user:account_deleted", {});

        return res.status(200).json({ success: true, message: "Account deleted successfully" });

    } catch (error) {
        return res.status(500).json({ success: false, message: "Error in Delete User Account" });
    }
};

module.exports = { updateUserEmailOTPRequest, verifyUpdateUserEmailOTP, deactivateUserAccount, deleteUserAccount };