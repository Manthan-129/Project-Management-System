import React, { useContext, useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { AppContext } from '../../context/AppContext'
import { Check, Circle, Eye, EyeOff, Lock, ShieldCheck } from 'lucide-react'
import { toast } from 'react-toastify'
import LoadingPage from '../LoadingPage'
import OTP from '../AuthComponents/OTP'
import api from '../../api/axiosInstance.js'

const SecurityPage = () => {
    const { user, authHeaders, logout } = useContext(AppContext)

    const [isFetchingStatus, setIsFetchingStatus] = useState(false)
    const [isChangingPassword, setIsChangingPassword] = useState(false)
    const [isRequestingTwoFAOtp, setIsRequestingTwoFAOtp] = useState(false)
    const [isVerifyingTwoFA, setIsVerifyingTwoFA] = useState(false)

    const { register, handleSubmit, formState: { errors }, watch, resetField } = useForm()

    const newPassword = watch('newPassword') || ''
    const [showCurrentPassword, setShowCurrentPassword] = useState(false)
    const [showNewPassword, setShowNewPassword] = useState(false)
    const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false)

    const [twoFAEnabled, setTwoFAEnabled] = useState(Boolean(user?.twoFactorEnabled))
    const [show2FASetup, setShow2FASetup] = useState(false)
    const [twoFAMode, setTwoFAMode] = useState('enable')

    const [otp, setOtp] = useState('')

    const getErrorMessage = (error, fallbackMessage) => {
        return error?.response?.data?.message || fallbackMessage
    }

    useEffect(() => {
        if (user) {
            setTwoFAEnabled(Boolean(user.twoFactorEnabled))
        }
    }, [user])

    const handleChangePassword = async (data) => {
        try {
            setIsChangingPassword(true)
            const { data: response } = await api.patch(
                '/settings/change-password',
                {
                    currentPassword: data.currentPassword,
                    newPassword: data.newPassword,
                },
                {
                    headers: authHeaders,
                }
            )

            if (response?.success) {
                resetField('currentPassword')
                resetField('newPassword')
                resetField('confirmNewPassword')
                setShowCurrentPassword(false)
                setShowNewPassword(false)
                setShowConfirmNewPassword(false)
            }
        } catch (error) {
            if (error?.response?.status === 401) {
                await logout()
                return
            }
            toast.error(getErrorMessage(error, 'Failed to change password'))
        } finally {
            setIsChangingPassword(false)
        }
    }

    const handleEnableOrDisable2FA = async () => {
        try {
            setIsRequestingTwoFAOtp(true)
            const endpoint = twoFAEnabled ? '/settings/2fa/disable-request' : '/settings/2fa/setup'
            const { data } = await api.post(
                endpoint,
                {},
                {
                    headers: authHeaders,
                }
            )

            if (data?.success) {
                setTwoFAMode(twoFAEnabled ? 'disable' : 'enable')
                setShow2FASetup(true)
                setOtp('')
            }
        } catch (error) {
            if (error?.response?.status === 401) {
                await logout()
                return
            }
            toast.error(getErrorMessage(error, 'Failed to process 2FA request'))
        } finally {
            setIsRequestingTwoFAOtp(false)
        }
    }

    const handleVerify2FA = async () => {
        if (!otp || otp.length !== 6) {
            toast.error('Please enter a valid 6-digit OTP')
            return
        }

        try {
            setIsVerifyingTwoFA(true)
            const endpoint = twoFAMode === 'enable' ? '/settings/2fa/enable' : '/settings/2fa/disable'
            const { data } = await api.post(
                endpoint,
                { otp },
                {
                    headers: authHeaders,
                }
            )

            if (data?.success) {
                setTwoFAEnabled(twoFAMode === 'enable')
                setShow2FASetup(false)
                setOtp('')
            }
        } catch (error) {
            if (error?.response?.status === 401) {
                await logout()
                return
            }
            toast.error(getErrorMessage(error, 'Failed to verify OTP'))
        } finally {
            setIsVerifyingTwoFA(false)
        }
    }

    const strengthChecks = [
        { label: '8+ characters', pass: newPassword.length >= 8 },
        { label: 'Uppercase letter', pass: /[A-Z]/.test(newPassword) },
        { label: 'Number', pass: /[0-9]/.test(newPassword) },
        { label: 'Special character', pass: /[^A-Za-z0-9]/.test(newPassword) },
    ]

    const passedChecksCount = useMemo(() => {
        return strengthChecks.filter((check) => check.pass).length
    }, [strengthChecks])

    const resetPasswordForm = () => {
        resetField('currentPassword')
        resetField('newPassword')
        resetField('confirmNewPassword')
        setShowCurrentPassword(false)
        setShowNewPassword(false)
        setShowConfirmNewPassword(false)
    }

    if (isFetchingStatus) return <LoadingPage />

  return (
        <div className="relative max-w-3xl mx-auto space-y-6">

            <div className="dd-section-card p-4">
                <div className="flex flex-wrap items-center gap-2.5">
                    <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400">Security Summary</span>
                    <span className={`dd-badge ${twoFAEnabled ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-slate-200 bg-slate-50 text-slate-600'}`}>
                        2FA: {twoFAEnabled ? 'Enabled' : 'Disabled'}
                    </span>
                    <span className="dd-badge border-indigo-100 bg-indigo-50 text-indigo-700">
                        Password Strength: {passedChecksCount}/4
                    </span>
                </div>
            </div>

      {/* Change Password Card */}
    <div className="dd-section-card p-6 space-y-5">
        <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                <Lock size={18} />
            </div>
            <div>
                <h3 className="text-base font-bold text-slate-900">Change Password</h3>
                <p className="text-xs text-slate-500">Choose a secure password containing at least 8 characters.</p>
            </div>
        </div>

        <form onSubmit={handleSubmit(handleChangePassword)} className="space-y-4">
            {/* Current Password */}
            <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Current Password *</label>
                <div className="relative">
                    <input type={showCurrentPassword ? 'text' : 'password'} placeholder="Enter current password"
                    {...register('currentPassword', {required: 'Current Password is required'})}
                    className="dd-input pr-10" />
                    <button type="button" onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        disabled={isChangingPassword}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition">
                        {showCurrentPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                </div>
                {errors.currentPassword && <p className="text-xs text-rose-500">{errors.currentPassword.message}</p>}
            </div>

            {/* New Password */}
            <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">New Password *</label>
                <div className="relative">
              <input
                type={showNewPassword ? 'text' : 'password'}
                placeholder="Enter new password"
                {...register('newPassword', {
                  required: 'New password is required',
                  minLength: { value: 8, message: 'Password must be at least 8 characters' },
                })}
                className="dd-input pr-10"
              />
              <button type="button" onClick={() => setShowNewPassword(!showNewPassword)}
                disabled={isChangingPassword}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition">
                {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {errors.newPassword && <p className="text-xs text-rose-500">{errors.newPassword.message}</p>}

            {newPassword && (
                <div className="space-y-2 pt-1">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Password Checklist</p>
                    <div className="grid grid-cols-2 gap-2">
                        {strengthChecks.map((check) => (
                            <span key={check.label} className={`text-xs flex items-center gap-1.5 font-medium ${check.pass ? 'text-emerald-600' : 'text-slate-400'}`}>
                                {check.pass ? <Check size={13} className="text-emerald-600" /> : <Circle size={13} />}
                                {check.label}
                            </span>
                        ))}
                    </div>
                </div>
            )}
            </div>

            {/* Confirm New Password */}
            <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Confirm New Password *</label>
                <div className="relative">
                    <input type={showConfirmNewPassword ? 'text' : 'password'}
                    placeholder="Confirm new password"
                    {...register('confirmNewPassword', {required: 'Please confirm your password', validate: (value)=> value === newPassword || 'Passwords do not match'})}
                    className="dd-input pr-10" />
                    <button type="button" onClick={()=> setShowConfirmNewPassword(!showConfirmNewPassword)}
                        disabled={isChangingPassword}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition">
                        {showConfirmNewPassword? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                </div>
                {errors.confirmNewPassword && <p className="text-xs text-rose-500">{errors.confirmNewPassword.message}</p>}
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
                <button type="button" onClick={resetPasswordForm} disabled={isChangingPassword}
                    className="dd-ghost-button">
                    Discard Changes
                </button>
                <button type="submit" disabled={isChangingPassword}
                    className="dd-primary-button">
                    {isChangingPassword ? 'Saving...' : 'Save Changes'}
                </button>
            </div>
        </form>
      </div>

      {/* Two-Factor Authentication Card */}
    <div className="dd-section-card p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-50 text-teal-600">
                    <ShieldCheck size={18} />
                </div>
                <div>
                    <h3 className="text-base font-bold text-slate-900">Two-Factor Authentication</h3>
                    <p className="text-xs text-slate-500">Protect your account with OTP email confirmation during sign in.</p>
                </div>
            </div>
            <span className={`dd-badge shrink-0 ${twoFAEnabled ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-slate-200 bg-slate-50 text-slate-500'}`}>
                {twoFAEnabled ? 'Enabled' : 'Disabled'}
            </span>
        </div>
        <div className="pt-2">
            <button onClick={handleEnableOrDisable2FA}
                type="button"
                disabled={isRequestingTwoFAOtp}
                className={twoFAEnabled ? 'dd-danger-button w-full' : 'dd-primary-button w-full'}>
                {isRequestingTwoFAOtp
                    ? (twoFAEnabled ? 'Sending disable OTP...' : 'Sending enable OTP...')
                    : (twoFAEnabled ? 'Disable 2FA' : 'Enable 2FA')}
            </button>
        </div>
      </div>

      {/* 2FA Setup Popup */}
      {show2FASetup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm px-4 dd-fade-in"
            onClick={()=> {if(!isVerifyingTwoFA){setShow2FASetup(false); setOtp('')}}}>
            <div className="w-full max-w-md rounded-2xl border border-[#1b3a5c] bg-[#0c1f38] p-6 space-y-4 text-white shadow-[0_25px_60px_rgba(0,0,0,0.5)] dd-fade-up"
                onClick={(e) => e.stopPropagation()}>
                <h4 className="text-base font-bold text-white">
                    {twoFAMode === 'enable' ? 'Enable Two-Factor Authentication' : 'Disable Two-Factor Authentication'}
                </h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                    {twoFAMode === 'enable'
                        ? 'We have dispatched a verification code to your registered email address. Please enter it below to activate 2FA.'
                        : 'We have dispatched a verification code to your registered email address. Please enter it below to disable 2FA.'}
                </p>

                <div className="py-1">
                    <OTP value={otp} onChange={setOtp} />
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-[#1b3a5c]">
                    <button type="button" onClick={()=> {setShow2FASetup(false); setOtp('')}}
                        disabled={isVerifyingTwoFA}
                        className="rounded-xl border border-[#1b3a5c] bg-[#0a1829] px-4 py-2 text-sm font-semibold text-slate-300 transition hover:bg-[#132d52] hover:text-white disabled:opacity-50">
                        Cancel
                    </button>
                    <button type="button" onClick={handleVerify2FA}
                        disabled={isVerifyingTwoFA}
                        className="rounded-xl bg-indigo-600 hover:bg-indigo-500 px-5 py-2 text-sm font-semibold text-white shadow-sm transition disabled:opacity-50">
                        {isVerifyingTwoFA
                            ? 'Verifying...'
                            : (twoFAMode === 'enable' ? 'Verify & Enable' : 'Verify & Disable')}
                    </button>
                </div>
            </div>
        </div>
      )}

      {/* Security Tips Card */}
      <div className="flex gap-3 p-4 bg-[#0c1f38] border border-[#1b3a5c] rounded-2xl text-slate-200 shadow-xs">
        <ShieldCheck size={18} className="text-sky-400 shrink-0 mt-0.5" />
        <div className="space-y-1.5">
          <p className="text-xs font-bold uppercase tracking-wider text-sky-300">Security Recommendations</p>
          <ul className="space-y-1 list-none p-0 m-0">
            <li className="text-xs text-slate-300 flex items-start gap-1.5"><span className="text-sky-400 font-bold">•</span>Use a mix of uppercase, lowercase, numbers, and symbols</li>
            <li className="text-xs text-slate-300 flex items-start gap-1.5"><span className="text-sky-400 font-bold">•</span>Avoid reusing passwords across multiple platforms</li>
            <li className="text-xs text-slate-300 flex items-start gap-1.5"><span className="text-sky-400 font-bold">•</span>Keep Two-Factor Authentication enabled for your account</li>
          </ul>
        </div>
      </div>

    </div>
  )
}

export default SecurityPage