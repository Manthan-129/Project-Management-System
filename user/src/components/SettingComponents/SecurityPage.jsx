// import React, { useState, useEffect, useContext } from 'react'
// import { useForm } from 'react-hook-form'
// import {AppContext} from '../../context/AppContext'
// import { Check, Circle, Eye, EyeOff, Lock, ShieldCheck } from 'lucide-react';
// import LoadingPage from '../LoadingPage'

// const SecurityPage = () => {

//     const {loading, setLoading}= useContext(AppContext);

//     const {register, handleSubmit, watch, formState: {errors, isSubmitting}, resetField, setValue, setError}= useForm({
//         defaultValues: {
//             currentPassword: '',
//         newPassword: '',
//         confirmNewPassword: '',
//         twoFAOtp: '',
//         }
//     });

//     const [showCurrentPassword, setShowCurrentPassword]= useState(false);
//     const [showNewPassword, setShowNewPassword]= useState(false);
//     const [showConfirmNewPassword, setShowConfirmNewPassword]= useState(false);

//     const [twoFAEnabled, setTwoFAEnabled]= useState(false);
//     const [show2FASetup, setShow2FASetup]= useState(false);

//     const newPassword= watch('newPassword');
//     const confirmNewPassword= watch('confirmNewPassword');
//     const twoFAOtp= watch('twoFAOtp');

//     const getPasswordStrength= (password)=>{
//         if(!password) return {score: 0, label: ''};
//         let score= 0;

//         if(password.length >= 8) score++;
//         if (/[A-Z]/.test(password)) score++;
//     if (/[0-9]/.test(password)) score++;
//     if (/[^A-Za-z0-9]/.test(password)) score++;

//     const levels= [
//         {score: 0, label: ''},
//         { score: 1, label: 'Weak' },
//       { score: 2, label: 'Fair' },
//       { score: 3, label: 'Good' },
//       { score: 4, label: 'Strong' },
//     ]

//     return levels[score];
//     }

//     const strength= getPasswordStrength(newPassword);

//     const handleChangePassword= async(formData)=>{
//         const payload= {
//             currentPassword: formData.currentPassword,
//             newPassword: formData.newPassword,
//         }

//         // API: POST /api/auth/update-password
//     // await axios.post('/api/auth/update-password', payload, { withCredentials: true })
//     console.log('Sending password update to backend:', payload)

//     resetField('currentPassword')
//     resetField('newPassword')
//     resetField('confirmNewPassword')
//     }

//     const handleEnable2FA= ()=>{
//         if(!twoFAEnabled){
//             setShow2FASetup(true);
//             // API: POST /api/auth/send-2fa-otp
//       console.log('2FA OTP sent')
//         }
//         else{
//             // API: POST /api/auth/disable-2fa
//       setTwoFAEnabled(false)
//       console.log('2FA disabled')
//         }
//     }

//     const handleVerify2FA= async ()=>{
//         if(!twoFAOtp){
//             setError('twoFAOtp', { type: 'manual', message: 'Enter OTP' })
//       return
//         }
//         // API: POST /api/auth/verify-2fa { otp }
//     setTwoFAEnabled(true)
//     setShow2FASetup(false)
//     setValue('twoFAOtp', '')
//     console.log('2FA enabled')
//     }

//     const strengthChecks= [
//         {label: '8+ characters', pass: newPassword.length >= 8 },
//         {label: 'Uppercase letter', pass: /[A-Z]/.test(newPassword) },
//         {label: 'Number', pass: /[0-9]/.test(newPassword) },
//         {label: 'Special character', pass: /[^A-Za-z0-9]/.test(newPassword) },
//     ]

//     if (loading) return <LoadingPage />;

//   return (
//     <div>
//         {/* Page Header */}
//       <h2>Security</h2>
//       <p>Manage your password and account protection.</p>

//       {/* ── Change Password Card ── */}
//       <div>
//         {/* Card Header */}
//         <div>
//             <Lock size={18}></Lock>
//             <div>
//                 <h3>Change Password</h3>
//             <p>Choose a strong password with at least 8 characters.</p>
//             </div>
//         </div>

//         <form onSubmit={handleSubmit(handleChangePassword)}>
//             {/* Current Password */}
//             <div>
//                 <label>Current Password</label>
//                 <div>
//                     <input type={showCurrentPassword ? 'text' : 'password'} placeholder="Enter current password"
//                     {...register('currentPassword', {required: 'Current Password is required'})} />

//                     <button type="button" onClick={() => setShowCurrentPassword(!showCurrentPassword)}>{showCurrentPassword ? <EyeOff size={16} /> : <Eye size={16} />}</button>
//                 </div>
//                 {errors.currentPassword && <p>{errors.currentPassword.message}</p>}
//             </div>

//             {/* New Password */}
//             <div>
//                 <label>New Password</label>
//                 <div>
//               <input
//                 type={showNewPassword ? 'text' : 'password'}
//                 placeholder="Enter new password"
//                 {...register('newPassword', {
//                   required: 'New password is required',
//                   minLength: {
//                     value: 8,
//                     message: 'Password must be at least 8 characters',
//                   },
//                 })}
//               />
//               <button type="button" onClick={() => setShowNewPassword(!showNewPassword)}>
//                 {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
//               </button>
//             </div>
//             {errors.newPassword && <p>{errors.newPassword.message}</p>}

//             {/* Password Strength Meter */}
//             {newPassword && (
//                 <div>
                    
//                 {/* Strength bar */}
//                 <span>{strength.label}</span>

//                 {/* Strength check list */}
//                 <div>
//                     {strengthChecks.map((check)=>(
//                         <span key={check.label}>
//                             {check.pass ? <Check size={12} /> : <Circle size={12} />} 
//                             {check.label}
//                         </span>
//                     ))}
//                 </div>
//                 </div>
//             )}
//             </div>

//             {/* Confirm New Password */}
//             <div>
//                 <label>Confirm New Password</label>
//                 <div>
//                     <input type={showConfirmNewPassword ? 'text' : 'password'}
//                     placeholder="Confirm New Password"
//                     {...register('confirmNewPassword', {required: 'Please confirm your password', validate: (value)=> value === newPassword || 'password do not match'})} />
                    
//                     <button type="button" onClick={()=> setShowConfirmNewPassword(!showConfirmNewPassword)}>
//                     {showConfirmNewPassword? <EyeOff size={16} /> : <Eye size={16} />}
//                      </button>
                    
//                 </div>
//                 {errors.confirmNewPassword && <p>{errors.confirmNewPassword.message}</p>}
//             {confirmNewPassword && newPassword !== confirmNewPassword && (
//               <p>Passwords do not match</p>
//             )}
//             </div>

//             <button type="submit" disabled={isSubmitting}>
//                 {isSubmitting ? 'Updating...' : 'Update Password'}
//                 </button>
//         </form>
//       </div>

//       {/* ── Two-Factor Authentication Card ── */}
//       <div> 
//         <div>
//             <div>
//                 <ShieldCheck size={18} />
//                 <div>
//                     <h3>Two-Factor Authentication</h3>
//               <p>Add an extra layer of security with OTP verification on login.</p>
//                 </div>
//             </div>
//                 <span>{twoFAEnabled ? 'Enabled' : 'Disabled'}</span>
//         </div>
//         <button onClick={handleEnable2FA}>{twoFAEnabled ? 'Disable 2FA' : 'Enable 2FA' }</button>
//       </div>

//       {/* ── 2FA Setup Popup ── */}
//       {show2FASetup && (
//         <div onClick={()=> {setShow2FASetup(false); setValue('twoFAOtp','')}}>
//             <div onClick={(e) => e.stopPropagation()} >
//                  <h4>Enable Two-Factor Authentication</h4>
//             <p>We have sent an OTP to your registered email. Enter it below to enable 2FA.</p>

//             <input type="text"
//             placeholder="Enter 6 digit-OTP"
//             minLength={6}
//             maxLength={6}
//             {...register('twoFAOtp')} />
//             {errors.twoFAOtp && <p>{errors.twoFAOtp.message}</p>}

//             <div>
//                 <button type="button"  onClick={()=> {setShow2FASetup(false); setValue('twoFAOtp', '')}}>Cancel</button>
//                 <button onClick={handleVerify2FA}>Verify & Enable</button>
//             </div>
//             </div>
//         </div>
//       )}

//       {/* ── Security Tips Card ── */}
//       <div>
//         <ShieldCheck size={18} />
//         <div>
//           <p>Security Tips</p>
//           <ul>
//             <li>Use a mix of uppercase, lowercase, numbers, and symbols</li>
//             <li>Avoid reusing passwords across multiple sites</li>
//             <li>Enable two-factor authentication for extra protection</li>
//             <li>Change your password regularly</li>
//           </ul>
//         </div>
//       </div>

//     </div>
//   )
// }

// export default SecurityPage


import React, { useState, useContext } from 'react'
import { useForm } from 'react-hook-form'
import {AppContext} from '../../context/AppContext'
import { Eye, EyeOff, Lock, ShieldCheck } from 'lucide-react';
import LoadingPage from '../LoadingPage'
import OTP from '../AuthComponents/OTP'

const SecurityPage = () => {

    const [loading, setLoading]= useState(false);

    const {register, handleSubmit,formState: {errors, isSubmitting}, watch, resetField, setValue, setError}= useForm();

    const newPassword= watch('newPassword');
    const [showCurrentPassword, setShowCurrentPassword]= useState(false);
    const [showNewPassword, setShowNewPassword]= useState(false);
    const [showConfirmNewPassword, setShowConfirmNewPassword]= useState(false);

    const [twoFAEnabled, setTwoFAEnabled]= useState(false);
    const [show2FASetup, setShow2FASetup]= useState(false);

    const [otp, setOtp]= useState('');

    const handleOTPChange= (otpValue)=>{
        setOtp(otpValue);
    }

    const handleChangePassword= async(data)=>{
        // API call to backend newPassword, currentPassword
    console.log('Sending password update to backend:', data);
    resetField('currentPassword')
    resetField('newPassword')
    resetField('confirmNewPassword')
    setShowCurrentPassword(false);
    setShowNewPassword(false);
    setShowConfirmNewPassword(false);
    }

    const handleEnable2FA= ()=>{
        if(!twoFAEnabled){
            setShow2FASetup(true);
      console.log('2FA OTP sent')
        }
        else{
      setTwoFAEnabled(false)
      console.log('2FA disabled')
        }
    }

    const handleVerify2FA= async ()=>{
        if(!otp){
            <p className="text-xs text-rose-500">Enter OTP</p>
            return
        }
        setTwoFAEnabled(true)
        setShow2FASetup(false)
        setOtp('');
        console.log('2FA enabled')
    }

    if (loading) return <LoadingPage />;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">

        {/* Page Header */}
      <h2 className="text-2xl font-semibold text-slate-800">Security</h2>
      <p className="text-sm text-slate-500 -mt-4">Manage your password and account protection.</p>

      {/* ── Change Password Card ── */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-5">

        {/* Card Header */}
        <div className="flex items-center gap-3 pb-2 border-b border-slate-100">
            <div className="p-2 bg-indigo-50 rounded-lg">
                <Lock size={18} className="text-indigo-400" />
            </div>
            <div>
                <h3 className="text-base font-semibold text-slate-700">Change Password</h3>
                <p className="text-xs text-slate-500">Choose a strong password with at least 8 characters.</p>
            </div>
        </div>

        <form onSubmit={handleSubmit(handleChangePassword)} className="space-y-4">

            {/* Current Password */}
            <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-600 uppercase tracking-wide">Current Password</label>
                <div className="relative">
                    <input type={showCurrentPassword ? 'text' : 'password'} placeholder="Enter current password"
                    {...register('currentPassword', {required: 'Current Password is required'})}
                    className="w-full px-3.5 py-2.5 pr-10 text-sm rounded-xl border border-slate-200 bg-slate-50 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-300 transition" />
                    <button type="button" onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition">
                        {showCurrentPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                </div>
                {errors.currentPassword && <p className="text-xs text-rose-500">{errors.currentPassword.message}</p>}
            </div>

            {/* New Password */}
            <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-600 uppercase tracking-wide">New Password</label>
                <div className="relative">
              <input
                type={showNewPassword ? 'text' : 'password'}
                placeholder="Enter new password"
                {...register('newPassword', {
                  required: 'New password is required',
                  minLength: { value: 8, message: 'Password must be at least 8 characters' },
                })}
                className="w-full px-3.5 py-2.5 pr-10 text-sm rounded-xl border border-slate-200 bg-slate-50 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-300 transition"
              />
              <button type="button" onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition">
                {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {errors.newPassword && <p className="text-xs text-rose-500">{errors.newPassword.message}</p>}
            </div>

            {/* Confirm New Password */}
            <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-600 uppercase tracking-wide">Confirm New Password</label>
                <div className="relative">
                    <input type={showConfirmNewPassword ? 'text' : 'password'}
                    placeholder="Confirm New Password"
                    {...register('confirmNewPassword', {required: 'Please confirm your password', validate: (value)=> value === newPassword || 'password do not match'})}
                    className="w-full px-3.5 py-2.5 pr-10 text-sm rounded-xl border border-slate-200 bg-slate-50 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-300 transition" />
                    <button type="button" onClick={()=> setShowConfirmNewPassword(!showConfirmNewPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition">
                        {showConfirmNewPassword? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                </div>
                {errors.confirmNewPassword && <p className="text-xs text-rose-500">{errors.confirmNewPassword.message}</p>}
            </div>

            <button type="submit" disabled={isSubmitting}
                className="w-full py-2.5 text-sm font-medium text-white bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-colors shadow-sm">
                {isSubmitting ? 'Updating...' : 'Update Password'}
            </button>
        </form>
      </div>

      {/* ── Two-Factor Authentication Card ── */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-50 rounded-lg">
                    <ShieldCheck size={18} className="text-indigo-400" />
                </div>
                <div>
                    <h3 className="text-base font-semibold text-slate-700">Two-Factor Authentication</h3>
                    <p className="text-xs text-slate-500">Add an extra layer of security with OTP verification on login.</p>
                </div>
            </div>
            <span className={`shrink-0 text-xs font-medium px-2.5 py-1 rounded-full ${twoFAEnabled ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                {twoFAEnabled ? 'Enabled' : 'Disabled'}
            </span>
        </div>
        <button onClick={handleEnable2FA}
            className={`w-full py-2.5 text-sm font-medium rounded-xl transition-colors shadow-sm
                ${twoFAEnabled
                    ? 'text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200'
                    : 'text-white bg-indigo-500 hover:bg-indigo-600'
                }`}>
            {twoFAEnabled ? 'Disable 2FA' : 'Enable 2FA'}
        </button>
      </div>

      {/* ── 2FA Setup Popup ── */}
      {show2FASetup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm px-4"
            onClick={()=> {setShow2FASetup(false); setOtp('')}}>
            <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-6 space-y-4"
                onClick={(e) => e.stopPropagation()}>
                <h4 className="text-base font-semibold text-slate-800">Enable Two-Factor Authentication</h4>
                <p className="text-sm text-slate-500 leading-relaxed">We have sent an OTP to your registered email. Enter it below to enable 2FA.</p>

                {/* <div className="space-y-1.5">
                    <input type="text"
                    placeholder="Enter 6-digit OTP"
                    minLength={6}
                    maxLength={6}
                    {...register('twoFAOtp')}
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-300 tracking-[0.3em] transition" />
                    {errors.twoFAOtp && <p className="text-xs text-rose-500">{errors.twoFAOtp.message}</p>}
                </div> */}

                <OTP value={otp} onChange={handleOTPChange} />

                <div className="flex gap-2.5">
                    <button type="button" onClick={()=> {setShow2FASetup(false); setOtp('')}}
                        className="flex-1 py-2.5 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors">
                        Cancel
                    </button>
                    <button type="button" onClick={handleVerify2FA}
                        className="flex-1 py-2.5 text-sm font-medium text-white bg-indigo-500 hover:bg-indigo-600 rounded-xl transition-colors shadow-sm">
                        Verify & Enable
                    </button>
                </div>
            </div>
        </div>
      )}

      {/* ── Security Tips Card ── */}
      <div className="flex gap-3 p-4 bg-sky-50 border border-sky-100 rounded-2xl">
        <ShieldCheck size={18} className="text-sky-400 shrink-0 mt-0.5" />
        <div className="space-y-1.5">
          <p className="text-sm font-medium text-slate-700">Security Tips</p>
          <ul className="space-y-1">
            <li className="text-xs text-slate-500 flex items-start gap-1.5"><span className="text-sky-400 mt-0.5">•</span>Use a mix of uppercase, lowercase, numbers, and symbols</li>
            <li className="text-xs text-slate-500 flex items-start gap-1.5"><span className="text-sky-400 mt-0.5">•</span>Avoid reusing passwords across multiple sites</li>
            <li className="text-xs text-slate-500 flex items-start gap-1.5"><span className="text-sky-400 mt-0.5">•</span>Enable two-factor authentication for extra protection</li>
            <li className="text-xs text-slate-500 flex items-start gap-1.5"><span className="text-sky-400 mt-0.5">•</span>Change your password regularly</li>
          </ul>
        </div>
      </div>

    </div>
  )
}

export default SecurityPage