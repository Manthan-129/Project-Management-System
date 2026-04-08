// import { AlertTriangle, Mail, Send, Trash2, X } from 'lucide-react'
// import React, { useContext, useState, useEffect } from 'react'
// import { AppContext } from '../../context/AppContext'
// import { useForm } from 'react-hook-form'
// import { toast } from 'react-toastify'
// import LoadingPage from '../LoadingPage.jsx'   
// import { assets } from '../../assets/assets.js'

// const AccountPage = () => {
//     const { user, deleteAccount, deactivateAccount, loading, setLoading }= useContext(AppContext);

//     // Email Change Form
//     const { register: registerEmail, handleSubmit: handleEmailSubmit, formState: {errors: emailErrors}, reset: resetEmail, watch: watchEmail }= useForm();

//     useEffect(()=>{
//         if(user){
//             resetEmail({
//                 newEmail: '',
//                 emailOtp: '',
//             });
//         }
//     }, [user, resetEmail]);

//     // Delete Account Form
//     const { register: registerDelete, handleSubmit: handleDeleteSubmit, formState: {errors: deleteErrors}, reset: resetDelete}= useForm();

//     useEffect(()=>{
//         if(user){
//             resetDelete({
//                 deletePassword: ''
//             })
//         }
//     }, [user, resetDelete]);

//     const [emailOtpSent, setEmailOtpSent]= useState(false);
//     const [showDeactivatePopup, setShowDeactivatePopup]= useState(false);
//     const [showDeletePopup, setShowDeletePopup]= useState(false);   
    
//     const handleSendOtp= (data)=>{
//         // API call to send OTP to new email
//         setEmailOtpSent(true);
//     }

//     const handleVerifyEmailOtp= (data)=>{
//         // API call to verify OTP and change email
//         setEmailOtpSent(false);
//         resetEmail();
//     }

//     const handleDeactivateAccount= async ()=>{
//         setLoading(true);
//         try {
//             await deactivateAccount();
//             setShowDeactivatePopup(false);
//             } catch(err) {
//             toast.error("Something went wrong");
//         }
//         setLoading(false);
//     }

//     const handleDeleteAccount= async (data)=>{
//         setLoading(true);
//         try {
//             await deleteAccount(data.deletePassword);
//             setShowDeletePopup(false);
//             } catch(err) {
//             toast.error("Failed to delete account");
//         }
//         setLoading(false);
//     }

//     if (loading) return <LoadingPage />;

//   return (
//     <div>
//        {/* Page Header */}
//       <h2>Account</h2>
//       <p>Manage your email, username, and account status.</p> 
//       {/* ── Change Email Card ── */}
//       <div>
//         <h3><Mail size={16} /> Change Email</h3>
//         <p>Current email: <strong>{user?.email}</strong></p>

//         <form onSubmit= {!emailOtpSent ? handleEmailSubmit(handleSendOtp) : handleEmailSubmit(handleVerifyEmailOtp)}>

//             <div>
//                 <label >New Email Address</label>
//                 <div>
//                     <input type="email" {...registerEmail('newEmail', {required: 'Email is required', pattern: { value: /^\S+@\S+\.\S+$/, message: 'Invalid email' }})} placeholder="newemail@example.com"
//                     disabled={emailOtpSent} />

//                     {emailErrors.newEmail && <p>{emailErrors.newEmail.message}</p>}

//                     {!emailOtpSent && (
//                         <button type="submit"><Send size= {14} /> Send OTP</button>
//                     )}
//                 </div>
//             </div>

//             {/* OTP Input — shown only after OTP is sent */}
//             {emailOtpSent && (
//                 <div>
//                     <label>Enter OTP</label>
//                     <div>
//                         <input type="text" {...registerEmail('emailOtp', {required: 'OTP is required', minLength: {value: 6, message: 'OTP must be 6 digits'},
//                         maxLength: {value: 6, message: 'OTP must be 6 digits'}
//                         })}
//                         placeholder="Enter 6-digit OTP"
//                         maxLength= {6} />

//                         {emailErrors.emailOtp && <p>{emailErrors.emailOtp.message}</p>}
                        
//                         <div>
//                             <button type="button" onClick={() => {
//                                 setEmailOtpSent(false)
//                                 resetEmail()
//                                 }}>
//                                 Cancel
//                             </button>
//                             <button type="submit">Verify OTP</button>
//                         </div>                   
//                     </div>

//                     <p>OTP sent to {watchEmail('newEmail')}. Check your inbox.</p>

//                 </div>
//             )}
//         </form>
//       </div>

//       {/* ── Danger Zone Card ── */}
//       <div>
//         <h3><AlertTriangle size={16} /> Danger Zone</h3>

//         {/* Deactivate */}
//         <div>
//             <div>
//                 <p>Deactivate Account</p>
//                 <p>Temporarily hide your profile. Your data stays safe, you can reactivate anytime.</p>
//             </div>
//             <button onClick={ () => setShowDeactivatePopup(true) }>Deactivate</button>
//         </div>

//         <hr />

//         {/* Delete */}
//         <div>
//             <div>
//                 <p>Delete Account</p>
//                 <p>Permanently remove your account and all data. This cannot be undone.</p>
//             </div>
//             <button onClick={ () => setShowDeletePopup(true) }>
//                 <Trash2 size={14} /> Delete
//             </button>
//         </div>
//       </div>
        
//       {/* ── Deactivate Popup ── */}
//         {showDeactivatePopup && (
//             <div onClick={()=> setShowDeactivatePopup(false)}>
//                 <div onClick={(e) => e.stopPropagation()}>
//                     <div>
//                         <h4>Deactivate Account?</h4>
//                         <button onClick={() => setShowDeactivatePopup(false)}><X size={16} /></button>
//                     </div>
//                     <p>Your profile will be hidden from all teams and searches. Log in again to reactivate.</p>
//                     <div>
//                         <button onClick={()=> setShowDeactivatePopup(false)}>Cancel</button>
//                         <button onClick={handleDeactivateAccount}>Yes, Deactivate</button>
//                     </div>
//                 </div>
//             </div>
//         )}

//         {/* ── Delete Popup ── */}
//         {showDeletePopup && (
//             <div onClick={()=> {setShowDeletePopup(false); resetDelete()}}>
//                 <div onClick={(e) => e.stopPropagation()}>
//                     <div>
//                         <h4>Delete Account</h4>
//                         <button onClick={() => { setShowDeletePopup(false); resetDelete() }}><X size={16} /></button>
//                     </div>
//                     <p>This is permanent. Enter your password to confirm deletion.</p>

//                     <form onSubmit={handleDeleteSubmit(handleDeleteAccount)}>
//                         <input type="password"
//                         {...registerDelete('deletePassword', {required: 'Password is required'})}
//                         placeholder="Enter your password" />

//                         {deleteErrors.deletePassword && <p>{deleteErrors.deletePassword.message}</p>}

//                         <div>
//                             <button type="button" onClick={()=> {setShowDeletePopup(false); resetDelete()}}>
//                                 Cancel
//                             </button>
//                             <button type="submit" disabled={loading}>Delete Account</button>
//                         </div>
//                     </form>
//                 </div>
//             </div>
//         )}
//     </div>
//   )
// }

// export default AccountPage

import { AlertTriangle, Eye, EyeOff, Mail, Send, Trash2, X } from 'lucide-react'
import React, { useContext, useState, useEffect } from 'react'
import { AppContext } from '../../context/AppContext'
import { useForm } from 'react-hook-form'
import { toast } from 'react-toastify'
import LoadingPage from '../LoadingPage.jsx'
import OTP from '../AuthComponents/OTP.jsx'

const AccountPage = () => {
    const { user } = useContext(AppContext);
    const [loading, setLoading]= useState(false);
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

    // Step 1: Send OTP — opens the OTP popup instead of showing inline
    const handleSendOTP = (e) => {
        e.preventDefault();
        // TODO: API call to send OTP to newEmail
        setShowOtpPopup(true);
    };

    // Step 2: Verify OTP + password inside popup
    const handleVerifyEmailOTP = (e) => {
        e.preventDefault();
        // TODO: API call to verify OTP + password, then update email
        setShowOtpPopup(false);
        setNewEmail('');
        setOtp('');
        setPassword('');
        toast.success("Email updated successfully");
    };

    // Close OTP popup and reset its state
    const handleCloseOtpPopup = () => {
        setShowOtpPopup(false);
        setOtp('');
        setPassword('');
        // Keep newEmail so user doesn't have to retype it
    };

    const handleDeactivateAccount = async (data) => {
        setLoading(true);
        try {
            // TODO: await deactivateAccount(data.deactivatePassword);
            setShowDeactivatePopup(false);
            resetDeactivate();
            toast.success("Account deactivated");
        } catch (err) {
            toast.error("Something went wrong");
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteAccount = async (data) => {
        setLoading(true);
        try {
            // TODO: await deleteAccount(data.deletePassword);
            setShowDeletePopup(false);
            resetDelete();
            toast.success("Account deleted");
        } catch (err) {
            toast.error("Failed to delete account");
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <LoadingPage />;

    return (
        <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">

            {/* ── Page Header ── */}
            <div>
                <h2 className="text-2xl font-semibold text-slate-800">Account</h2>
                <p className="text-sm text-slate-500 mt-1">Manage your email and account status.</p>
            </div>

            {/* ── Change Email Card ── */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
                <h3 className="flex items-center gap-2 text-base font-semibold text-slate-700">
                    <Mail size={16} className="text-indigo-400" /> Change Email
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
                                className="flex-1 px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-300 transition"
                            />
                            <button
                                type="submit"
                                className="flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium text-white bg-indigo-500 hover:bg-indigo-600 rounded-xl transition-colors shadow-sm whitespace-nowrap"
                            >
                                <Send size={14} /> Send OTP
                            </button>
                        </div>
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
                                        className="w-full px-3.5 py-2.5 pr-11 text-sm rounded-xl border border-slate-200 bg-slate-50 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-300 transition"
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
                                    disabled={loading}
                                    className="flex-1 py-2.5 text-sm font-medium text-white bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-colors shadow-sm"
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
                                    disabled={loading}
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
                                    disabled={loading}
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