import React, { useContext, useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { AppContext } from '../../context/AppContext'
import { Check, Circle, Eye, EyeOff, Lock, ShieldCheck } from 'lucide-react'
import { toast } from 'react-toastify'
import LoadingPage from '../LoadingPage'
import OTP from '../AuthComponents/OTP'
import api from '../../api/axiosInstance.js'

const SecurityPage = () => {
    const { authHeaders, logout } = useContext(AppContext)

    const [isFetchingStatus, setIsFetchingStatus] = useState(false)
    const [isChangingPassword, setIsChangingPassword] = useState(false)
    const [isRequestingTwoFAOtp, setIsRequestingTwoFAOtp] = useState(false)
    const [isVerifyingTwoFA, setIsVerifyingTwoFA] = useState(false)

    const { register, handleSubmit, formState: { errors }, watch, resetField } = useForm()

    const newPassword = watch('newPassword') || ''
    const [showCurrentPassword, setShowCurrentPassword] = useState(false)
    const [showNewPassword, setShowNewPassword] = useState(false)
    const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false)

    const [twoFAEnabled, setTwoFAEnabled] = useState(false)
    const [show2FASetup, setShow2FASetup] = useState(false)
    const [twoFAMode, setTwoFAMode] = useState('enable')

    const [otp, setOtp] = useState('')

    const getErrorMessage = (error, fallbackMessage) => {
        return error?.response?.data?.message || fallbackMessage
    }

    const fetchTwoFactorStatus = async () => {
        try {
            setIsFetchingStatus(true)
            const { data } = await api.get('/settings/2fa-status', {
                headers: authHeaders,
            })

            if (data?.success) {
                setTwoFAEnabled(Boolean(data.twoFactorEnabled))
            }
        } catch (error) {
            if (error?.response?.status === 401) {
                await logout()
                return
            }
            toast.error(getErrorMessage(error, 'Failed to fetch 2FA status'))
        } finally {
            setIsFetchingStatus(false)
        }
    }

    useEffect(() => {
        fetchTwoFactorStatus()
    }, [authHeaders])

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
            const endpoint = twoFAEnabled ? '/settings/2fa-disable' : '/settings/2fa-setup'
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
            const endpoint = twoFAMode === 'enable' ? '/settings/2fa-verify-enable' : '/settings/2fa-verify-disable'
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
        <div className="relative max-w-3xl mx-auto px-4 py-8 space-y-6 overflow-hidden">

            <div className="absolute -top-24 -left-24 w-64 h-64 bg-blue-400/15 rounded-full blur-3xl -z-10"></div>
            <div className="absolute -bottom-24 -right-24 w-72 h-72 bg-teal-400/15 rounded-full blur-3xl -z-10"></div>

            <div className="bg-white/90 border border-blue-100 rounded-3xl p-5 shadow-[0_16px_45px_-35px_rgba(37,99,235,0.4)] backdrop-blur-sm">
                <div className="flex flex-wrap items-center gap-3">
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Security Summary</span>
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${twoFAEnabled ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-slate-100 text-slate-700 border-slate-200'}`}>
                        2FA: {twoFAEnabled ? 'Enabled' : 'Disabled'}
                    </span>
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-100">
                        Password checks: {passedChecksCount}/4
                    </span>
                </div>
            </div>

      {/* ── Change Password Card ── */}
    <div className="bg-white/90 border border-blue-100 rounded-3xl p-6 shadow-[0_16px_45px_-35px_rgba(37,99,235,0.4)] space-y-5 backdrop-blur-sm">

        {/* Card Header */}
        <div className="flex items-center gap-3 pb-2 border-b border-slate-100">
            <div className="p-2 bg-blue-50 rounded-lg">
                <Lock size={18} className="text-blue-500" />
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
                    className="w-full px-3.5 py-2.5 pr-10 text-sm rounded-xl border border-slate-200 bg-slate-50 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-300 transition" />
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
                <label className="text-xs font-medium text-slate-600 uppercase tracking-wide">New Password</label>
                <div className="relative">
              <input
                type={showNewPassword ? 'text' : 'password'}
                placeholder="Enter new password"
                {...register('newPassword', {
                  required: 'New password is required',
                  minLength: { value: 8, message: 'Password must be at least 8 characters' },
                })}
                                className="w-full px-3.5 py-2.5 pr-10 text-sm rounded-xl border border-slate-200 bg-slate-50 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-300 transition"
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
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Password checklist</p>
                    <div className="grid grid-cols-2 gap-1.5">
                        {strengthChecks.map((check) => (
                            <span key={check.label} className={`text-xs flex items-center gap-1.5 ${check.pass ? 'text-emerald-600' : 'text-slate-400'}`}>
                                {check.pass ? <Check size={12} /> : <Circle size={12} />}
                                {check.label}
                            </span>
                        ))}
                    </div>
                </div>
            )}
            </div>

            {/* Confirm New Password */}
            <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-600 uppercase tracking-wide">Confirm New Password</label>
                <div className="relative">
                    <input type={showConfirmNewPassword ? 'text' : 'password'}
                    placeholder="Confirm New Password"
                    {...register('confirmNewPassword', {required: 'Please confirm your password', validate: (value)=> value === newPassword || 'password do not match'})}
                    className="w-full px-3.5 py-2.5 pr-10 text-sm rounded-xl border border-slate-200 bg-slate-50 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-300 transition" />
                    <button type="button" onClick={()=> setShowConfirmNewPassword(!showConfirmNewPassword)}
                        disabled={isChangingPassword}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition">
                        {showConfirmNewPassword? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                </div>
                {errors.confirmNewPassword && <p className="text-xs text-rose-500">{errors.confirmNewPassword.message}</p>}
            </div>

            <div className="flex gap-3">
                <button type="button" onClick={resetPasswordForm} disabled={isChangingPassword}
                    className="flex-1 py-2.5 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-colors">
                    Discard Changes
                </button>
                <button type="submit" disabled={isChangingPassword}
                    className="flex-1 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-teal-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-all shadow-sm">
                    {isChangingPassword ? 'Saving...' : 'Save Changes'}
                </button>
            </div>
        </form>
      </div>

      {/* ── Two-Factor Authentication Card ── */}
    <div className="bg-white/90 border border-blue-100 rounded-3xl p-6 shadow-[0_16px_45px_-35px_rgba(20,184,166,0.4)] space-y-4 backdrop-blur-sm">
        <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-50 rounded-lg">
                    <ShieldCheck size={18} className="text-blue-500" />
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
        <button onClick={handleEnableOrDisable2FA}
            disabled={isRequestingTwoFAOtp}
            className={`w-full py-2.5 text-sm font-medium rounded-xl transition-colors shadow-sm
                ${twoFAEnabled
                    ? 'text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200'
                    : 'text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-teal-600'
                }`}>
            {isRequestingTwoFAOtp
                ? (twoFAEnabled ? 'Sending disable OTP...' : 'Sending enable OTP...')
                : (twoFAEnabled ? 'Disable 2FA' : 'Enable 2FA')}
        </button>
      </div>

      {/* ── 2FA Setup Popup ── */}
      {show2FASetup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm px-4"
            onClick={()=> {if(!isVerifyingTwoFA){setShow2FASetup(false); setOtp('')}}}>
            <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-6 space-y-4"
                onClick={(e) => e.stopPropagation()}>
                <h4 className="text-base font-semibold text-slate-800">
                    {twoFAMode === 'enable' ? 'Enable Two-Factor Authentication' : 'Disable Two-Factor Authentication'}
                </h4>
                <p className="text-sm text-slate-500 leading-relaxed">
                    {twoFAMode === 'enable'
                        ? 'We have sent an OTP to your registered email. Enter it below to enable 2FA.'
                        : 'We have sent an OTP to your registered email. Enter it below to disable 2FA.'}
                </p>

                <OTP value={otp} onChange={setOtp} />

                <div className="flex gap-2.5">
                    <button type="button" onClick={()=> {setShow2FASetup(false); setOtp('')}}
                        disabled={isVerifyingTwoFA}
                        className="flex-1 py-2.5 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors">
                        Cancel
                    </button>
                    <button type="button" onClick={handleVerify2FA}
                        disabled={isVerifyingTwoFA}
                        className="flex-1 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-teal-600 rounded-xl transition-all shadow-sm">
                        {isVerifyingTwoFA
                            ? 'Verifying...'
                            : (twoFAMode === 'enable' ? 'Verify & Enable' : 'Verify & Disable')}
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