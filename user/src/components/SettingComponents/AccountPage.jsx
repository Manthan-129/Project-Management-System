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
                '/settings/update-email/request-otp',
                { newEmail: trimmedNewEmail },
                { headers: authHeaders }
            );

            if (data?.success) {
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
                '/settings/update-email/verify-otp',
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
            }
        }catch(error){
            if (error?.response?.status === 401) {
                await logout();
                return;
            }
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
            await logout();
        } catch (err) {
            if (err?.response?.status === 401) {
                await logout();
                return;
            }
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
            await logout();
        } catch (err) {
            if (err?.response?.status === 401) {
                await logout();
                return;
            }
            toast.error(getErrorMessage(err, 'Failed to delete account'));
        } finally {
            setIsDeletingAccount(false);
        }
    };

    return (
        <div className="relative max-w-3xl mx-auto space-y-6">

            <div className="dd-section-card p-4">
                <div className="flex flex-wrap items-center gap-2.5">
                    <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400">Account Summary</span>
                    <span className="dd-badge border-indigo-100 bg-indigo-50 text-indigo-700">
                        {user?.email || 'No email'}
                    </span>
                    <span className={`dd-badge ${user?.isAccountVerified ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-amber-200 bg-amber-50 text-amber-700'}`}>
                        {user?.isAccountVerified ? 'Verified' : 'Pending Verification'}
                    </span>
                </div>
            </div>

            {/* Change Email Card */}
            <div className="dd-section-card p-6 space-y-4">
                <h3 className="flex items-center gap-2 text-base font-bold text-slate-900">
                    <Mail size={16} className="text-indigo-600" /> Change Email
                </h3>
                <p className="text-xs text-slate-500">
                    Current email address: <strong className="font-semibold text-slate-800">{user?.email}</strong>
                </p>

                <form onSubmit={handleSendOTP} className="space-y-3">
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-700">
                            New Email Address
                        </label>
                        <div className="flex flex-col sm:flex-row gap-2">
                            <input
                                type="email"
                                placeholder="newemail@example.com"
                                value={newEmail}
                                onChange={(e) => setNewEmail(e.target.value)}
                                required
                                className="dd-input flex-1"
                            />
                            <button
                                type="submit"
                                disabled={isSendingOtp || !isValidNewEmail}
                                className="dd-primary-button whitespace-nowrap"
                            >
                                <Send size={14} /> Send OTP
                            </button>
                        </div>
                        {newEmail && (
                            <button
                                type="button"
                                onClick={() => setNewEmail('')}
                                disabled={!newEmail || isSendingOtp}
                                className="text-xs font-semibold text-slate-500 hover:text-slate-700 disabled:opacity-40"
                            >
                                Clear Input
                            </button>
                        )}
                    </div>
                </form>
            </div>

            {/* Danger Zone Card */}
            <div className="dd-section-card border-rose-900/40 bg-slate-900/60 p-6 space-y-4">
                <h3 className="flex items-center gap-2 text-base font-bold text-rose-400">
                    <AlertTriangle size={16} className="text-rose-400" /> Danger Zone
                </h3>

                {/* Deactivate */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-amber-950/20 border border-amber-900/30">
                    <div>
                        <p className="text-sm font-bold text-amber-200">Deactivate Account</p>
                        <p className="text-xs text-amber-200/70 mt-0.5">
                            Temporarily hide your profile. Your project data stays intact and can be reactivated on next sign in.
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={() => setShowDeactivatePopup(true)}
                        className="shrink-0 px-3.5 py-2 text-xs font-bold text-amber-200 bg-amber-900/30 hover:bg-amber-800/40 border border-amber-700/40 rounded-xl transition-all whitespace-nowrap"
                    >
                        Deactivate
                    </button>
                </div>

                {/* Delete */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-rose-950/25 border border-rose-900/35">
                    <div>
                        <p className="text-sm font-bold text-rose-200">Delete Account</p>
                        <p className="text-xs text-rose-200/70 mt-0.5">
                            Permanently remove your account, profile, and associated permissions. This action cannot be undone.
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={() => setShowDeletePopup(true)}
                        className="dd-danger-button shrink-0 text-xs whitespace-nowrap"
                    >
                        <Trash2 size={14} /> Delete Account
                    </button>
                </div>
            </div>

            {/* OTP Popup */}
            {showOtpPopup && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm px-4 dd-fade-in"
                    onClick={handleCloseOtpPopup}
                >
                    <div
                        className="w-full max-w-md rounded-2xl border border-[#1b3a5c] bg-[#0c1f38] p-6 space-y-4 text-white shadow-[0_25px_60px_rgba(0,0,0,0.5)] dd-fade-up"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between border-b border-[#1b3a5c] pb-3">
                            <div>
                                <h4 className="text-base font-bold text-white">Verify New Email</h4>
                                <p className="text-xs text-slate-300 mt-0.5">
                                    OTP sent to <strong className="font-semibold text-sky-400">{newEmail}</strong>.
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={handleCloseOtpPopup}
                                className="p-1.5 text-slate-400 hover:text-white hover:bg-[#132d52] rounded-lg transition"
                            >
                                <X size={16} />
                            </button>
                        </div>

                        <form onSubmit={handleVerifyEmailOTP} className="space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                                    Enter 6-Digit OTP
                                </label>
                                <OTP value={otp} onChange={(value) => setOtp(value)} />
                                <button
                                    type="button"
                                    onClick={handleResendOTP}
                                    disabled={isResendingOtp}
                                    className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 disabled:opacity-50"
                                >
                                    Resend OTP
                                </button>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                                    Confirm Current Password
                                </label>
                                <div className="relative">
                                    <input
                                        type={showEmailPass ? "text" : "password"}
                                        placeholder="Enter your password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        autoFocus
                                        className="dd-input pr-10"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowEmailPass(!showEmailPass)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition"
                                    >
                                        {showEmailPass ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                            </div>

                            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-[#1b3a5c]">
                                <button
                                    type="button"
                                    onClick={handleCloseOtpPopup}
                                    className="rounded-xl border border-[#1b3a5c] bg-[#0a1829] px-4 py-2 text-sm font-semibold text-slate-300 transition hover:bg-[#132d52] hover:text-white"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isVerifyingOtp}
                                    className="rounded-xl bg-indigo-600 hover:bg-indigo-500 px-5 py-2 text-sm font-semibold text-white shadow-sm transition disabled:opacity-50"
                                >
                                    Verify & Update
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Deactivate Popup */}
            {showDeactivatePopup && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm px-4 dd-fade-in"
                    onClick={() => { setShowDeactivatePopup(false); resetDeactivate(); }}
                >
                    <div
                        className="w-full max-w-md rounded-2xl border border-[#1b3a5c] bg-[#0c1f38] p-6 space-y-4 text-white shadow-[0_25px_60px_rgba(0,0,0,0.5)] dd-fade-up"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between border-b border-[#1b3a5c] pb-3">
                            <h4 className="text-base font-bold text-white">Deactivate Account?</h4>
                            <button
                                type="button"
                                onClick={() => { setShowDeactivatePopup(false); resetDeactivate(); }}
                                className="p-1.5 text-slate-400 hover:text-white hover:bg-[#132d52] rounded-lg transition"
                            >
                                <X size={16} />
                            </button>
                        </div>
                        <div className="rounded-xl border border-amber-500/30 bg-amber-500/15 p-3.5 text-xs text-amber-200 leading-relaxed">
                            Your profile will be hidden from team rosters and collaborator search results. You can sign in at any time to resume.
                        </div>

                        <form onSubmit={handleDeactivateSubmit(handleDeactivateAccount)} className="space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                                    Confirm Password
                                </label>
                                <div className="relative">
                                    <input
                                        type={showDeactivatePass ? "text" : "password"}
                                        {...registerDeactivate('deactivatePassword', { required: 'Password is required' })}
                                        placeholder="Enter your password"
                                        className="dd-input pr-10"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowDeactivatePass(!showDeactivatePass)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition"
                                    >
                                        {showDeactivatePass ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                                {deactivateErrors.deactivatePassword && (
                                    <p className="text-xs text-rose-400">{deactivateErrors.deactivatePassword.message}</p>
                                )}
                            </div>

                            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-[#1b3a5c]">
                                <button
                                    type="button"
                                    onClick={() => { setShowDeactivatePopup(false); resetDeactivate(); }}
                                    className="rounded-xl border border-[#1b3a5c] bg-[#0a1829] px-4 py-2 text-sm font-semibold text-slate-300 transition hover:bg-[#132d52] hover:text-white"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isDeactivating}
                                    className="rounded-xl bg-amber-600 hover:bg-amber-500 px-5 py-2 text-sm font-semibold text-white shadow-sm transition disabled:opacity-50"
                                >
                                    {isDeactivating ? 'Deactivating...' : 'Yes, Deactivate'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Popup */}
            {showDeletePopup && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm px-4 dd-fade-in"
                    onClick={() => { setShowDeletePopup(false); resetDelete(); }}
                >
                    <div
                        className="w-full max-w-md rounded-2xl border border-[#1b3a5c] bg-[#0c1f38] p-6 space-y-4 text-white shadow-[0_25px_60px_rgba(0,0,0,0.5)] dd-fade-up"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between border-b border-[#1b3a5c] pb-3">
                            <h4 className="text-base font-bold text-white">Delete Account</h4>
                            <button
                                type="button"
                                onClick={() => { setShowDeletePopup(false); resetDelete(); }}
                                className="p-1.5 text-slate-400 hover:text-white hover:bg-[#132d52] rounded-lg transition"
                            >
                                <X size={16} />
                            </button>
                        </div>
                        <div className="rounded-xl border border-rose-500/30 bg-rose-500/15 p-3.5 text-xs text-rose-200 leading-relaxed">
                            This action is permanent and cannot be reversed. All your created tasks and workspaces will be affected. Please type your password to confirm deletion.
                        </div>

                        <form onSubmit={handleDeleteSubmit(handleDeleteAccount)} className="space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                                    Confirm Password
                                </label>
                                <div className="relative">
                                    <input
                                        type={showDeletePass ? "text" : "password"}
                                        {...registerDelete('deletePassword', { required: 'Password is required' })}
                                        placeholder="Enter your password"
                                        className="dd-input pr-10"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowDeletePass(!showDeletePass)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition"
                                    >
                                        {showDeletePass ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                                {deleteErrors.deletePassword && (
                                    <p className="text-xs text-rose-400">{deleteErrors.deletePassword.message}</p>
                                )}
                            </div>

                            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-[#1b3a5c]">
                                <button
                                    type="button"
                                    onClick={() => { setShowDeletePopup(false); resetDelete(); }}
                                    className="rounded-xl border border-[#1b3a5c] bg-[#0a1829] px-4 py-2 text-sm font-semibold text-slate-300 transition hover:bg-[#132d52] hover:text-white"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isDeletingAccount}
                                    className="rounded-xl bg-rose-600 hover:bg-rose-500 px-5 py-2 text-sm font-semibold text-white shadow-sm transition disabled:opacity-50"
                                >
                                    {isDeletingAccount ? 'Deleting...' : 'Delete Account'}
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