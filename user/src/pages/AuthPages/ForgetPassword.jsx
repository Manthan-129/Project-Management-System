import React from 'react'
import { useContext, useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'react-toastify'
import { Eye, EyeOff, Sparkles, X } from 'lucide-react'
import { AppContext } from '../../context/AppContext'
import OTP from '../../components/AuthComponents/OTP'
import api from '../../api/axiosInstance'

const ForgetPassword = () => {
    const { navigate, setToken } = useContext(AppContext)

    const [showPass, setShowPass] = useState(false)
    const [loading, setLoading] = useState(false)
    const [openOtp, setOpenOtp] = useState(false)
    const [otp, setOtp] = useState('')
    const [pendingEmail, setPendingEmail] = useState('')

    const {
        register,
        handleSubmit,
        watch,
        formState: { errors },
    } = useForm({
        mode: 'onTouched',
    })

    const passwordValue = watch('newPassword')

    const handleOTPChange = (value) => {
        setOtp(value)
    }

    const requestOtp = async (data) => {
        try {
            setLoading(true)

            const email = data.email.trim().toLowerCase()
            const { data: response } = await api.post('/auth/forget-password-otp-request', { email })

            if (response?.success) {
                setPendingEmail(email)
                setOtp('')
                setOpenOtp(true)
                toast.success(response.message || 'OTP sent to email for password reset')
                return
            }

            toast.error(response?.message || 'Unable to send reset OTP')
        } catch (error) {
            toast.error(error?.response?.data?.message || 'Unable to send reset OTP right now')
        } finally {
            setLoading(false)
        }
    }

    const resetPassword = async (data) => {
        if (otp.length !== 6) {
            toast.error('Enter the 6-digit OTP')
            return
        }

        if (!pendingEmail) {
            toast.error('Reset session expired. Please request a new OTP.')
            return
        }

        if (data.newPassword !== data.confirmPassword) {
            toast.error('Passwords do not match')
            return
        }

        try {
            setLoading(true)

            const { data: response } = await api.post('/auth/verify-change-pass-otp', {
                email: pendingEmail,
                otp,
                newPass: data.newPassword,
            })

            if (response?.success && response?.token) {
                setToken(response.token)
                localStorage.setItem('token', response.token)
                toast.success(response.message || 'Password updated successfully')
                setOpenOtp(false)
                setOtp('')
                setPendingEmail('')
                navigate('/dashboard')
                return
            }

            toast.error(response?.message || 'Unable to reset password')
        } catch (error) {
            toast.error(error?.response?.data?.message || 'Unable to reset password right now')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-[#f0f4f8] flex items-center justify-center px-4 py-12">
            <div className="w-full max-w-md">

                {/* ── Brand Badge ── */}
                <div className="mb-6 text-center [animation:fadeUp_.4s_ease_both]">
                    <div className="inline-flex items-center gap-2 mb-4">
                        <div className="w-10 h-10 rounded-xl bg-[#315e8d] flex items-center justify-center shadow-sm">
                            <Sparkles size={18} className="text-white" />
                        </div>
                        <div className="text-left">
                            <h1 className="text-lg font-bold text-slate-900 leading-none">
                                Dev<span className="text-[#315e8d]">Dash</span>
                            </h1>
                            <p className="text-[10px] text-slate-400 font-medium">Project Management</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 mb-1.5 justify-center">
                        <div className="w-7 h-7 rounded-lg bg-[#e9f0f8] flex items-center justify-center">
                            <span className="text-[10px]">🔒</span>
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-[.18em] text-[#315e8d]">
                            Account Recovery
                        </span>
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Reset Password</h2>
                    <p className="text-sm text-slate-400 mt-1">
                        Enter your email and we'll send you a one-time code to reset your password.
                    </p>
                </div>

                {/* ── Form Card ── */}
                <div className="bg-white border border-[#dbe5f1] rounded-2xl px-8 py-7 shadow-sm [animation:fadeUp_.4s_ease_.05s_both]">
                    <form onSubmit={handleSubmit(requestOtp)} className="space-y-4">

                        {/* Email */}
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold uppercase tracking-[.12em] text-slate-400">
                                Email
                            </label>
                            <input
                                type="email"
                                autoComplete="email"
                                {...register('email', {
                                    required: 'Email is required',
                                    pattern: {
                                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                                        message: 'Invalid email address',
                                    },
                                })}
                                placeholder="Enter your email"
                                className="w-full px-3 py-2.5 text-sm text-slate-800 bg-[#f8fafd] border border-[#dbe5f1] rounded-xl placeholder-slate-300 outline-none focus:ring-2 focus:ring-[#315e8d]/25 focus:border-[#315e8d] transition-all duration-150"
                            />
                            {errors.email && (
                                <p className="text-[11px] text-red-500 font-medium">{errors.email.message}</p>
                            )}
                        </div>

                        {/* Submit */}
                        <div className="pt-1">
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-[#315e8d] hover:bg-[#26486d] disabled:opacity-60 text-white font-semibold text-sm py-2.5 rounded-xl transition-all duration-150 shadow-sm cursor-pointer"
                            >
                                {loading ? 'Sending OTP...' : 'Send OTP'}
                            </button>
                        </div>
                    </form>

                    {/* Back to Login */}
                    <div className="mt-5 text-center">
                        <p className="text-xs text-slate-400">
                            Remember your password?{' '}
                            <button
                                type="button"
                                onClick={() => navigate('/login')}
                                className="text-[#315e8d] hover:text-[#26486d] font-bold cursor-pointer transition-colors duration-150"
                            >
                                Back to Login.
                            </button>
                        </p>
                    </div>
                </div>
            </div>

            {/* ── OTP + Reset Password Modal ── */}
            {openOtp && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4"
                    onClick={() => setOpenOtp(false)}
                >
                    <div
                        className="w-full max-w-sm bg-white border border-[#dbe5f1] rounded-2xl shadow-2xl p-6 space-y-5"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Modal Header */}
                        <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl bg-[#e9f0f8] flex items-center justify-center">
                                    <Sparkles size={16} className="text-[#315e8d]" />
                                </div>
                                <div>
                                    <h2 className="text-sm font-bold text-slate-900">Reset Your Password</h2>
                                    <p className="text-[11px] text-slate-400 mt-0.5">Enter the OTP and your new password.</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setOpenOtp(false)}
                                type="button"
                                className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-all duration-150"
                            >
                                <X size={14} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit(resetPassword)} className="space-y-4">

                            {/* OTP */}
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold uppercase tracking-[.12em] text-slate-400">
                                    OTP Code
                                </label>
                                <OTP value={otp} onChange={handleOTPChange} />
                            </div>

                            {/* New Password */}
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold uppercase tracking-[.12em] text-slate-400">
                                    New Password
                                </label>
                                <div className="relative">
                                    <input
                                        type={showPass ? 'text' : 'password'}
                                        autoComplete="new-password"
                                        {...register('newPassword', {
                                            required: 'New password is required',
                                            minLength: { value: 6, message: 'Password must be at least 6 characters' },
                                        })}
                                        placeholder="Enter your new password"
                                        className="w-full px-3 py-2.5 pr-10 text-sm text-slate-800 bg-[#f8fafd] border border-[#dbe5f1] rounded-xl placeholder-slate-300 outline-none focus:ring-2 focus:ring-[#315e8d]/25 focus:border-[#315e8d] transition-all duration-150"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPass(!showPass)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#315e8d] transition-colors duration-150"
                                    >
                                        {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                                    </button>
                                </div>
                                {errors.newPassword && (
                                    <p className="text-[11px] text-red-500 font-medium">{errors.newPassword.message}</p>
                                )}
                            </div>

                            {/* Confirm Password */}
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold uppercase tracking-[.12em] text-slate-400">
                                    Confirm Password
                                </label>
                                <div className="relative">
                                    <input
                                        type={showPass ? 'text' : 'password'}
                                        autoComplete="new-password"
                                        {...register('confirmPassword', {
                                            required: 'Please confirm your password',
                                            validate: (value) => value === passwordValue || 'Passwords do not match',
                                        })}
                                        placeholder="Confirm your new password"
                                        className="w-full px-3 py-2.5 pr-10 text-sm text-slate-800 bg-[#f8fafd] border border-[#dbe5f1] rounded-xl placeholder-slate-300 outline-none focus:ring-2 focus:ring-[#315e8d]/25 focus:border-[#315e8d] transition-all duration-150"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPass(!showPass)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#315e8d] transition-colors duration-150"
                                    >
                                        {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                                    </button>
                                </div>
                                {errors.confirmPassword && (
                                    <p className="text-[11px] text-red-500 font-medium">{errors.confirmPassword.message}</p>
                                )}
                            </div>

                            {/* Submit */}
                            <button
                                type="submit"
                                disabled={loading || otp.length !== 6}
                                className="w-full bg-[#315e8d] hover:bg-[#26486d] disabled:opacity-60 text-white font-semibold text-sm py-2.5 rounded-xl transition-all duration-150 shadow-sm cursor-pointer"
                            >
                                {loading ? 'Resetting...' : 'Reset Password'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}

export default ForgetPassword