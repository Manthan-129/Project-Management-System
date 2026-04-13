import { AlertTriangle, Eye, EyeOff, Mail, Send, Trash2, X } from 'lucide-react'
import React, { useContext, useState, useEffect } from 'react'
import { AppContext } from '../../context/AppContext'
import { useForm } from 'react-hook-form'
import { toast } from 'react-toastify'
import OTP from '../AuthComponents/OTP.jsx'
import api from '../../api/axiosInstance.js'

const AccountPage = () => {
    const { user, setUser, authHeaders, logout } = useContext(AppContext);
    const [isSendingOtp, setIsSendingOtp]= useState(false);
    const [isResendingOtp, setIsResendingOtp]= useState(false);
    const [isVerifyingOtp, setIsVerifyingOtp]= useState(false);
    const [isDeactivating, setIsDeactivating]= useState(false);
    const [isDeletingAccount, setIsDeletingAccount]= useState(false);
    const [otp, setOtp] = useState('');
    const [password, setPassword] = useState('');
    const [newEmail, setNewEmail] = useState('');
    // ── Popup visibility ──
    const [showOtpPopup, setShowOtpPopup] = useState(false);
    const [showDeactivatePopup, setShowDeactivatePopup] = useState(false);
    const [showDeletePopup, setShowDeletePopup] = useState(false);

    // Separate show/hide state per password field
    const [showEmailPass, setShowEmailPass] = useState(false);
    const [showDeactivatePass, setShowDeactivatePass] = useState(false);
    const [showDeletePass, setShowDeletePass] = useState(false);
    const trimmedNewEmail = newEmail.trim();
    const isValidNewEmail = /^\S+@\S+\.\S+$/.test(trimmedNewEmail);

    // ── Delete Account Form ──
    const {
        register: registerDelete,
        handleSubmit: handleDeleteSubmit,
        formState: { errors: deleteErrors },
        reset: resetDelete
    } = useForm();

    // ── Deactivate Account Form ──
    const {
        register: registerDeactivate,
        handleSubmit: handleDeactivateSubmit,
        formState: { errors: deactivateErrors },
        reset: resetDeactivate
    } = useForm();

    useEffect(() => {
        if (user) resetDeactivate({ deactivatePassword: '' });
    }, [user, resetDeactivate]);

    useEffect(() => {
        if (user) resetDelete({ deletePassword: '' });
    }, [user, resetDelete]);

    const getErrorMessage = (error, fallbackMessage) => {
        return error?.response?.data?.message || fallbackMessage;
    };

    const requestEmailOtp = async (requestType = 'send') => {
        if (!trimmedNewEmail) {
            toast.error('Please enter a new email address');
            return false;
        }

        if (!isValidNewEmail) {
            toast.error('Please enter a valid email address');
            return false;
        }

        try {
            if (requestType === 'send') {
                setIsSendingOtp(true);
            } else {
                setIsResendingOtp(true);
            }

            const { data } = await api.post(
                '/settings/update-email-otp-request',
                { newEmail: trimmedNewEmail },
                { headers: authHeaders }
            );

            if (data?.success) {
                toast.success(data.message || 'OTP sent to your new email');
                return true;
            }
        } catch (error) {
            toast.error(getErrorMessage(error, 'Failed to send OTP'));
        } finally {
            if (requestType === 'send') {
                setIsSendingOtp(false);
            } else {
                setIsResendingOtp(false);
            }
        }

        return false;
    };

    // Step 1: Send OTP — opens the OTP popup instead of showing inline
    const handleSendOTP = async (e) => {
        e.preventDefault();
        const sent = await requestEmailOtp('send');
        if (sent) {
            setShowOtpPopup(true);
        }
    };

    const handleResendOTP = async () => {
        const sent = await requestEmailOtp('resend');
        if (sent) {
            setOtp('');
        }
    };

    // Step 2: Verify OTP + password inside popup
    const handleVerifyEmailOTP = async (e) => {
        e.preventDefault();

        if(!otp || otp.length !== 6){
            toast.error('Please enter a valid 6-digit OTP');
            return;
        }

        if(!password){
            toast.error('Please enter your password');
            return;
        }

        try{
            setIsVerifyingOtp(true);
            const { data } = await api.post(
                '/settings/verify-update-email-otp',
                {
                    password,
                    newEmail: trimmedNewEmail,
                    otp,
                },
                { headers: authHeaders }
            );

            if(data?.success){
                setUser((prev) => ({ ...prev, email: trimmedNewEmail }));
                setShowOtpPopup(false);
                setNewEmail('');
                setOtp('');
                setPassword('');
                toast.success(data.message || 'Email updated successfully');
            }
        }catch(error){
            toast.error(getErrorMessage(error, 'Failed to verify OTP'));
        }finally{
            setIsVerifyingOtp(false);
        }
    };

    // Close OTP popup and reset its state
    const handleCloseOtpPopup = () => {
        setShowOtpPopup(false);
        setOtp('');
        setPassword('');
        // Keep newEmail so user doesn't have to retype it
    };

    const handleDeactivateAccount = async (data) => {
        setIsDeactivating(true);
        try {
            const response = await api.post(
                '/settings/deactivate-account',
                { password: data.deactivatePassword },
                { headers: authHeaders }
            );

            setShowDeactivatePopup(false);
            resetDeactivate();
            toast.success(response?.data?.message || 'Account deactivated');
            await logout();
        } catch (err) {
            toast.error(getErrorMessage(err, 'Something went wrong'));
        } finally {
            setIsDeactivating(false);
        }
    };

    const handleDeleteAccount = async (data) => {
        setIsDeletingAccount(true);
        try {
            const response = await api.delete('/settings/delete-account', {
                data: { password: data.deletePassword },
                headers: authHeaders,
            });

            setShowDeletePopup(false);
            resetDelete();
            toast.success(response?.data?.message || 'Account deleted');
            await logout();
        } catch (err) {
            toast.error(getErrorMessage(err, 'Failed to delete account'));
        } finally {
            setIsDeletingAccount(false);
        }
    };

    return (
        <div className="relative max-w-3xl mx-auto px-4 py-8 space-y-6 overflow-hidden">

            <div className="absolute -top-24 -left-24 w-64 h-64 bg-blue-400/15 rounded-full blur-3xl -z-10"></div>
            <div className="absolute -bottom-24 -right-24 w-72 h-72 bg-teal-400/15 rounded-full blur-3xl -z-10"></div>

            <div className="bg-white/90 border border-blue-100 rounded-3xl p-5 shadow-[0_16px_45px_-35px_rgba(37,99,235,0.4)] backdrop-blur-sm">
                <div className="flex flex-wrap items-center gap-3">
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Account Summary</span>
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-100">
                        {user?.email || 'No email'}
                    </span>
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                        Status: {user?.isAccountVerified ? 'Verified' : 'Pending Verification'}
                    </span>
                </div>
            </div>

            {/* ── Change Email Card ── */}
            <div className="bg-white/90 border border-blue-100 rounded-3xl p-6 shadow-[0_16px_45px_-35px_rgba(37,99,235,0.4)] space-y-4 backdrop-blur-sm">
                <h3 className="flex items-center gap-2 text-base font-semibold text-slate-700">
                    <Mail size={16} className="text-blue-500" /> Change Email
                </h3>
                <p className="text-sm text-slate-500">
                    Current email: <strong className="text-slate-700">{user?.email}</strong>
                </p>

                {/* Step 1: Enter new email & request OTP — no inline step 2 anymore */}
                <form onSubmit={handleSendOTP} className="space-y-3">
                    <div className="space-y-1.5">
                        <label className="text-xs font-medium text-slate-600 uppercase tracking-wide">
                            New Email Address
                        </label>
                        <div className="flex gap-2">
                            <input
                                type="email"
                                placeholder="newemail@example.com"
                                value={newEmail}
                                onChange={(e) => setNewEmail(e.target.value)}
                                required
                                className="flex-1 px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-300 transition"
                            />
                            <button
                                type="submit"
                                disabled={isSendingOtp || !isValidNewEmail}
                                className="flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-teal-600 disabled:bg-slate-300 disabled:cursor-not-allowed rounded-xl transition-all shadow-sm whitespace-nowrap"
                            >
                                <Send size={14} /> Send OTP
                            </button>
                        </div>
                        <button
                            type="button"
                            onClick={() => setNewEmail('')}
                            disabled={!newEmail || isSendingOtp}
                            className="text-xs font-medium text-slate-600 hover:text-slate-700 disabled:text-slate-400 disabled:cursor-not-allowed"
                        >
                            Discard Changes
                        </button>
                    </div>
                </form>
            </div>

            {/* ── Danger Zone Card ── */}
            <div className="bg-white border border-rose-100 rounded-2xl p-6 shadow-sm space-y-4">
                <h3 className="flex items-center gap-2 text-base font-semibold text-slate-700">
                    <AlertTriangle size={16} className="text-rose-400" /> Danger Zone
                </h3>

                {/* Deactivate */}
                <div className="flex items-center justify-between gap-4 p-4 rounded-xl bg-amber-50 border border-amber-100">
                    <div>
                        <p className="text-sm font-medium text-slate-700">Deactivate Account</p>
                        <p className="text-xs text-slate-500 mt-0.5">
                            Temporarily hide your profile. Your data stays safe, you can reactivate anytime.
                        </p>
                    </div>
                    <button
                        onClick={() => setShowDeactivatePopup(true)}
                        className="shrink-0 px-4 py-2 text-sm font-medium text-amber-700 bg-amber-100 hover:bg-amber-200 border border-amber-200 rounded-xl transition-colors whitespace-nowrap"
                    >
                        Deactivate
                    </button>
                </div>

                <hr className="border-slate-100" />

                {/* Delete */}
                <div className="flex items-center justify-between gap-4 p-4 rounded-xl bg-rose-50 border border-rose-100">
                    <div>
                        <p className="text-sm font-medium text-slate-700">Delete Account</p>
                        <p className="text-xs text-slate-500 mt-0.5">
                            Permanently remove your account and all data. This cannot be undone.
                        </p>
                    </div>
                    <button
                        onClick={() => setShowDeletePopup(true)}
                        className="shrink-0 flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-rose-600 bg-rose-100 hover:bg-rose-200 border border-rose-200 rounded-xl transition-colors whitespace-nowrap"
                    >
                        <Trash2 size={14} /> Delete
                    </button>
                </div>
            </div>

            {/* ── OTP Popup ── */}
            {showOtpPopup && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm px-4"
                    onClick={handleCloseOtpPopup}
                >
                    <div
                        className="w-full max-w-md bg-white rounded-2xl shadow-xl p-6 space-y-4"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between">
                            <div>
                                <h4 className="text-base font-semibold text-slate-800">Verify New Email</h4>
                                <p className="text-xs text-slate-500 mt-0.5">
                                    OTP sent to <strong className="text-slate-700">{newEmail}</strong>. Check your inbox.
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={handleCloseOtpPopup}
                                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition"
                            >
                                <X size={16} />
                            </button>
                        </div>

                        <div className="h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent" />

                        <form onSubmit={handleVerifyEmailOTP} className="space-y-4">

                            {/* OTP Input */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-medium text-slate-600 uppercase tracking-wide">
                                    Enter OTP
                                </label>
                                <OTP value={otp} onChange={(value) => setOtp(value)} />
                                <button
                                    type="button"
                                    onClick={handleResendOTP}
                                    disabled={isResendingOtp}
                                    className="text-xs font-medium text-blue-600 hover:text-blue-700 disabled:text-slate-400 disabled:cursor-not-allowed"
                                >
                                    Resend OTP
                                </button>
                            </div>

                            {/* Password Input */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-medium text-slate-600 uppercase tracking-wide">
                                    Confirm Password
                                </label>
                                <div className="relative">
                                    <input
                                        type={showEmailPass ? "text" : "password"}
                                        placeholder="Enter your password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        autoFocus
                                        className="w-full px-3.5 py-2.5 pr-11 text-sm rounded-xl border border-slate-200 bg-slate-50 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-300 transition"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowEmailPass(!showEmailPass)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition"
                                    >
                                        {showEmailPass ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-2.5 pt-1">
                                <button
                                    type="button"
                                    onClick={handleCloseOtpPopup}
                                    className="flex-1 py-2.5 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isVerifyingOtp}
                                    className="flex-1 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-teal-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-all shadow-sm"
                                >
                                    Verify & Update
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ── Deactivate Popup ── */}
            {showDeactivatePopup && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm px-4"
                    onClick={() => { setShowDeactivatePopup(false); resetDeactivate(); }}
                >
                    <div
                        className="w-full max-w-md bg-white rounded-2xl shadow-xl p-6 space-y-4"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between">
                            <h4 className="text-base font-semibold text-slate-800">Deactivate Account?</h4>
                            <button
                                type="button"
                                onClick={() => { setShowDeactivatePopup(false); resetDeactivate(); }}
                                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition"
                            >
                                <X size={16} />
                            </button>
                        </div>
                        <p className="text-sm text-slate-500 leading-relaxed">
                            Your profile will be hidden from all teams and searches. Log in again to reactivate.
                        </p>

                        <form onSubmit={handleDeactivateSubmit(handleDeactivateAccount)} className="space-y-3">
                            <div className="space-y-1.5">
                                <label className="text-xs font-medium text-slate-600 uppercase tracking-wide">
                                    Confirm Password
                                </label>
                                <div className="relative">
                                    <input
                                        type={showDeactivatePass ? "text" : "password"}
                                        {...registerDeactivate('deactivatePassword', { required: 'Password is required' })}
                                        placeholder="Enter your password"
                                        className="w-full px-3.5 py-2.5 pr-11 text-sm rounded-xl border border-slate-200 bg-slate-50 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-300 focus:border-amber-300 transition"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowDeactivatePass(!showDeactivatePass)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition"
                                    >
                                        {showDeactivatePass ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                                {deactivateErrors.deactivatePassword && (
                                    <p className="text-xs text-rose-500">{deactivateErrors.deactivatePassword.message}</p>
                                )}
                            </div>

                            <div className="flex gap-2.5 pt-1">
                                <button
                                    type="button"
                                    onClick={() => { setShowDeactivatePopup(false); resetDeactivate(); }}
                                    className="flex-1 py-2.5 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isDeactivating}
                                    className="flex-1 py-2.5 text-sm font-medium text-white bg-amber-500 hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-colors shadow-sm"
                                >
                                    Yes, Deactivate
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ── Delete Popup ── */}
            {showDeletePopup && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm px-4"
                    onClick={() => { setShowDeletePopup(false); resetDelete(); }}
                >
                    <div
                        className="w-full max-w-md bg-white rounded-2xl shadow-xl p-6 space-y-4"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between">
                            <h4 className="text-base font-semibold text-slate-800">Delete Account</h4>
                            <button
                                type="button"
                                onClick={() => { setShowDeletePopup(false); resetDelete(); }}
                                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition"
                            >
                                <X size={16} />
                            </button>
                        </div>
                        <p className="text-sm text-slate-500 leading-relaxed">
                            This is permanent. Enter your password to confirm deletion.
                        </p>

                        <form onSubmit={handleDeleteSubmit(handleDeleteAccount)} className="space-y-3">
                            <div className="space-y-1.5">
                                <label className="text-xs font-medium text-slate-600 uppercase tracking-wide">
                                    Confirm Password
                                </label>
                                <div className="relative">
                                    <input
                                        type={showDeletePass ? "text" : "password"}
                                        {...registerDelete('deletePassword', { required: 'Password is required' })}
                                        placeholder="Enter your password"
                                        className="w-full px-3.5 py-2.5 pr-11 text-sm rounded-xl border border-slate-200 bg-slate-50 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-300 focus:border-rose-300 transition"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowDeletePass(!showDeletePass)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition"
                                    >
                                        {showDeletePass ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                                {deleteErrors.deletePassword && (
                                    <p className="text-xs text-rose-500">{deleteErrors.deletePassword.message}</p>
                                )}
                            </div>

                            <div className="flex gap-2.5 pt-1">
                                <button
                                    type="button"
                                    onClick={() => { setShowDeletePopup(false); resetDelete(); }}
                                    className="flex-1 py-2.5 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isDeletingAccount}
                                    className="flex-1 py-2.5 text-sm font-medium text-white bg-rose-500 hover:bg-rose-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-colors shadow-sm"
                                >
                                    Delete Account
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AccountPage;