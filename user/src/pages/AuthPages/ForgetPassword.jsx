import React from 'react'
import { useContext, useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'react-toastify'
import { X } from 'lucide-react'
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
        <div className="min-h-screen bg-[#f8f9fb] flex items-center justify-center px-4 py-12">
            <div className="w-full max-w-md">
                <div className="mb-6 text-center">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-violet-50 text-violet-600 text-xs font-semibold rounded-full border border-violet-100 mb-3 uppercase tracking-wider">
                        <span className="w-1.5 h-1.5 rounded-full bg-violet-500 animate-pulse"></span>
                        Account Recovery
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-1 tracking-tight">Reset Password</h1>
                    <p className="text-gray-400 text-sm">Enter your email and we&apos;ll send you a one-time code to reset your password.</p>
                </div>

                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm px-8 py-8">
                    <form onSubmit={handleSubmit(requestOtp)} className="space-y-4">
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Email</label>
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
                                className="w-full px-3.5 py-2.5 text-sm text-gray-800 bg-gray-50 border border-gray-200 rounded-lg placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-violet-100 focus:border-violet-400 transition"
                            />
                            {errors.email && <p className="text-xs text-red-400">{errors.email.message}</p>}
                        </div>

                        <div className="pt-1">
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-violet-600 hover:bg-violet-700 disabled:bg-violet-300 text-white font-semibold text-sm py-2.5 rounded-lg transition-colors shadow-sm shadow-violet-100"
                            >
                                {loading ? 'Sending OTP...' : 'Send OTP'}
                            </button>
                        </div>
                    </form>

                    <div className="mt-5 text-center">
                        <button
                            type="button"
                            onClick={() => navigate('/login')}
                            className="text-xs font-semibold text-violet-600 hover:text-violet-700 transition-colors"
                        >
                            Back to Login
                        </button>
                    </div>
                </div>
            </div>

            {openOtp && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/25 backdrop-blur-sm px-4" onClick={() => setOpenOtp(false)}>
                    <div className="w-full max-w-sm bg-white rounded-2xl border border-gray-200 shadow-lg p-7 space-y-5" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-start justify-between">
                            <div>
                                <h2 className="text-base font-bold text-gray-900 tracking-tight">Reset Your Password</h2>
                                <p className="text-xs text-gray-400 mt-1">Enter the OTP and your new password.</p>
                            </div>
                            <button onClick={() => setOpenOtp(false)} type="button" aria-label="Close reset dialog" className="p-1.5 text-gray-300 hover:text-gray-500 hover:bg-gray-100 rounded-lg transition">
                                <X size={14} strokeWidth={2} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit(resetPassword)} className="space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">OTP Code</label>
                                <OTP value={otp} onChange={handleOTPChange} />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">New Password</label>
                                <div className="relative">
                                    <input
                                        type={showPass ? 'text' : 'password'}
                                        autoComplete="new-password"
                                        {...register('newPassword', {
                                            required: 'New password is required',
                                            minLength: { value: 6, message: 'Password must be at least 6 characters' },
                                        })}
                                        placeholder="Enter your new password"
                                        className="w-full px-3.5 py-2.5 pr-11 text-sm text-gray-800 bg-gray-50 border border-gray-200 rounded-lg placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-violet-100 focus:border-violet-400 transition"
                                    />
                                    <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-gray-400 hover:text-violet-500 transition">
                                        {showPass ? 'Hide' : 'Show'}
                                    </button>
                                </div>
                                {errors.newPassword && <p className="text-xs text-red-400">{errors.newPassword.message}</p>}
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Confirm Password</label>
                                <div className="relative">
                                    <input
                                        type={showPass ? 'text' : 'password'}
                                        autoComplete="new-password"
                                        {...register('confirmPassword', {
                                            required: 'Please confirm your password',
                                            validate: (value) => value === passwordValue || 'Passwords do not match',
                                        })}
                                        placeholder="Confirm your new password"
                                        className="w-full px-3.5 py-2.5 pr-11 text-sm text-gray-800 bg-gray-50 border border-gray-200 rounded-lg placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-violet-100 focus:border-violet-400 transition"
                                    />
                                    <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-gray-400 hover:text-violet-500 transition">
                                        {showPass ? 'Hide' : 'Show'}
                                    </button>
                                </div>
                                {errors.confirmPassword && <p className="text-xs text-red-400">{errors.confirmPassword.message}</p>}
                            </div>

                            <div>
                                <button
                                    type="submit"
                                    disabled={loading || otp.length !== 6}
                                    className="w-full bg-violet-600 hover:bg-violet-700 disabled:bg-violet-300 text-white font-semibold text-sm py-2.5 rounded-lg transition-colors shadow-sm shadow-violet-100"
                                >
                                    {loading ? 'Resetting...' : 'Reset Password'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}

export default ForgetPassword