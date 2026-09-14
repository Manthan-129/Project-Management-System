import { useContext, useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'react-toastify'
import { CheckCircle2, Eye, EyeOff, ShieldCheck, Sparkles, X } from 'lucide-react'
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
    const [resolvedTheme, setResolvedTheme] = useState('light')

    const {
        register: registerRequest,
        handleSubmit: handleRequestSubmit,
        formState: { errors: requestErrors, isSubmitted: isRequestSubmitted },
    } = useForm({
        mode: 'onSubmit',
        reValidateMode: 'onBlur',
    })

    const {
        register: registerReset,
        handleSubmit: handleResetSubmit,
        watch,
        reset: resetResetForm,
        formState: { errors: resetErrors, isSubmitted: isResetSubmitted },
    } = useForm({
        mode: 'onSubmit',
        reValidateMode: 'onBlur',
        shouldUnregister: true,
    })

    const passwordValue = watch('newPassword')

    const getResolvedTheme = () => {
        if (typeof window === 'undefined') return 'light'
        const savedTheme = localStorage.getItem('theme') || 'system'

        if (savedTheme === 'system') {
            return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
        }

        return savedTheme
    }

    useEffect(() => {
        if (typeof window === 'undefined') return

        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')

        const updateTheme = () => {
            setResolvedTheme(getResolvedTheme())
        }

        const handleStorageChange = (event) => {
            if (!event.key || event.key === 'theme') {
                updateTheme()
            }
        }

        updateTheme()
        window.addEventListener('storage', handleStorageChange)
        window.addEventListener('app:theme-change', updateTheme)

        if (mediaQuery.addEventListener) {
            mediaQuery.addEventListener('change', updateTheme)
        } else {
            mediaQuery.addListener(updateTheme)
        }

        return () => {
            window.removeEventListener('storage', handleStorageChange)
            window.removeEventListener('app:theme-change', updateTheme)

            if (mediaQuery.removeEventListener) {
                mediaQuery.removeEventListener('change', updateTheme)
            } else {
                mediaQuery.removeListener(updateTheme)
            }
        }
    }, [])

    const isDarkTheme = resolvedTheme === 'dark'

    const handleOTPChange = (value) => {
        setOtp(value)
    }

    const requestOtp = async (data) => {
        try {
            setLoading(true)

            const email = data.email.trim().toLowerCase()
            const { data: response } = await api.post('/auth/forget-password/send-otp', { email })

            if (response?.success) {
                setPendingEmail(email)
                setOtp('')
                resetResetForm({ newPassword: '', confirmPassword: '' })
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

            const { data: response } = await api.post('/auth/forget-password/verify-otp', {
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
        <div className={`aurora-auth relative min-h-screen overflow-hidden transition-colors duration-300 ${isDarkTheme ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
            {/* Ambient Background Glows */}
            <div className="pointer-events-none absolute inset-0 overflow-hidden">
                <div className={`absolute -top-32 -left-32 h-96 w-96 rounded-full blur-3xl transition-opacity duration-500 ${isDarkTheme ? 'bg-indigo-900/20' : 'bg-indigo-200/40'}`} />
                <div className={`absolute top-1/4 -right-32 h-96 w-96 rounded-full blur-3xl transition-opacity duration-500 ${isDarkTheme ? 'bg-violet-900/20' : 'bg-violet-200/40'}`} />
                <div className={`absolute -bottom-32 left-1/3 h-96 w-96 rounded-full blur-3xl transition-opacity duration-500 ${isDarkTheme ? 'bg-sky-900/15' : 'bg-sky-200/40'}`} />
                <div className="absolute inset-0 [background-image:linear-gradient(to_right,rgba(148,163,184,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(148,163,184,0.05)_1px,transparent_1px)] [background-size:40px_40px]" />
            </div>

            <div className="relative mx-auto flex min-h-screen w-full max-w-6xl items-center px-4 py-12 sm:px-6 lg:px-8">
                <div className="grid w-full items-center gap-8 lg:grid-cols-[1.1fr_0.9fr]">

                    {/* Left Showcase Banner */}
                    <section className={`hidden rounded-3xl border p-8 backdrop-blur-xl lg:block xl:p-10 ${
                        isDarkTheme
                            ? 'border-slate-800 bg-slate-900/80 shadow-[0_16px_40px_rgba(0,0,0,0.4)]'
                            : 'border-slate-200/80 bg-white/80 shadow-[0_16px_40px_rgba(15,23,42,0.04)]'
                    }`}>
                        <div className="mb-8 flex items-center gap-3">
                            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-tr from-indigo-500 to-violet-600 text-white shadow-md shadow-indigo-500/20">
                                <Sparkles size={18} />
                            </div>
                            <div>
                                <p className="text-xs font-bold uppercase tracking-[0.25em] text-indigo-600 dark:text-indigo-400">DevDash</p>
                                <p className="text-xs text-slate-500 dark:text-slate-400">Account Recovery</p>
                            </div>
                        </div>

                        <h2 className="text-3xl font-extrabold tracking-tight xl:text-4xl">
                            Recover your account
                            <br />
                            <span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent dark:from-indigo-400 dark:to-violet-400">
                                with a secure reset flow.
                            </span>
                        </h2>
                        <p className="mt-4 max-w-md text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                            Request a one-time code, verify ownership, and set a fresh password in minutes.
                        </p>

                        <div className="mt-6 grid grid-cols-2 gap-3">
                            <div className={`rounded-2xl border p-4 ${isDarkTheme ? 'border-slate-800 bg-slate-800/60' : 'border-slate-200/80 bg-white/90'}`}>
                                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">OTP validity</p>
                                <p className="mt-1 text-2xl font-bold text-indigo-600 dark:text-indigo-400">6 digits</p>
                            </div>
                            <div className={`rounded-2xl border p-4 ${isDarkTheme ? 'border-slate-800 bg-slate-800/60' : 'border-slate-200/80 bg-white/90'}`}>
                                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Reset speed</p>
                                <p className="mt-1 text-2xl font-bold text-violet-600 dark:text-violet-400">~2 mins</p>
                            </div>
                        </div>

                        <div className="mt-8 space-y-3">
                            {[
                                'Step-by-step flow with one clear action at a time',
                                'Email OTP verification before password changes',
                                'Consistent secure experience across auth screens',
                            ].map((item) => (
                                <div
                                    key={item}
                                    className={`flex items-start gap-3 rounded-2xl border p-3.5 ${
                                        isDarkTheme ? 'border-slate-800/80 bg-slate-800/40 text-slate-200' : 'border-slate-200/70 bg-slate-50/70 text-slate-700'
                                    }`}
                                >
                                    <span className="mt-1 inline-block h-2 w-2 rounded-full bg-indigo-500 dark:bg-indigo-400" />
                                    <p className="text-xs leading-relaxed font-medium">{item}</p>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* Right Request Form Card */}
                    <section className="relative w-full">
                        <div className={`relative mx-auto w-full max-w-xl rounded-3xl border p-6 sm:p-8 backdrop-blur-xl transition-all duration-300 ${
                            isDarkTheme
                                ? 'border-slate-800 bg-slate-900/85 shadow-[0_20px_50px_rgba(0,0,0,0.5)]'
                                : 'border-slate-200/80 bg-white/90 shadow-[0_20px_50px_rgba(15,23,42,0.06)]'
                        }`}>
                            <div className="mb-6 text-center">
                                <div className="mb-4 inline-flex items-center gap-2.5">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-tr from-indigo-500 to-violet-600 text-white shadow-md shadow-indigo-500/20">
                                        <Sparkles size={18} />
                                    </div>
                                    <div className="text-left">
                                        <h1 className="text-lg font-bold leading-none text-slate-900 dark:text-white">
                                            Dev<span className="text-indigo-600 dark:text-indigo-400">Dash</span>
                                        </h1>
                                        <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Recover your account</p>
                                    </div>
                                </div>

                                <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">Forget Password</h2>
                                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Enter your email and we will send a secure OTP.</p>

                                <div className="mt-3.5 flex items-center justify-center gap-2">
                                    <span className="inline-flex items-center gap-1.5 rounded-full border border-indigo-200/70 bg-indigo-50/70 px-2.5 py-1 text-[10px] font-semibold text-indigo-700 dark:border-indigo-900/50 dark:bg-indigo-950/40 dark:text-indigo-300">
                                        <ShieldCheck size={12} />
                                        OTP Protected
                                    </span>
                                    <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200/70 bg-emerald-50/70 px-2.5 py-1 text-[10px] font-semibold text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-300">
                                        <CheckCircle2 size={12} />
                                        Password Recovery
                                    </span>
                                </div>
                            </div>

                            <form onSubmit={handleRequestSubmit(requestOtp)} noValidate className="space-y-4">
                                <div className="space-y-1.5">
                                    <label className="text-[11px] font-semibold tracking-wide text-slate-600 dark:text-slate-300">
                                        Email
                                    </label>
                                    <input
                                        type="email"
                                        autoComplete="email"
                                        {...registerRequest('email', {
                                            required: 'Email is required',
                                            pattern: {
                                                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                                                message: 'Invalid email address',
                                            },
                                        })}
                                        placeholder="Enter your email"
                                        className="w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 outline-none transition-all duration-150 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 dark:border-slate-700 dark:bg-slate-800/70 dark:text-slate-100 dark:placeholder-slate-500 dark:focus:border-indigo-400 dark:focus:bg-slate-800"
                                    />
                                    {!requestErrors.email && (
                                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                                            We will send a 6-digit verification code to this email address.
                                        </p>
                                    )}
                                    {requestErrors.email && isRequestSubmitted && (
                                        <p className="text-[11px] font-medium text-rose-500">{requestErrors.email.message}</p>
                                    )}
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="mt-2 flex w-full items-center justify-center rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 py-2.5 text-sm font-semibold text-white shadow-md shadow-indigo-500/20 transition-all duration-150 hover:from-indigo-600 hover:to-violet-700 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    {loading ? 'Sending OTP...' : 'Send OTP'}
                                </button>
                            </form>

                            <div className="mt-6 text-center">
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                    Remember your password?{' '}
                                    <button
                                        type="button"
                                        onClick={() => navigate('/login')}
                                        className="font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300"
                                    >
                                        Back to Login
                                    </button>
                                </p>
                            </div>
                        </div>
                    </section>
                </div>
            </div>

            {/* OTP + Reset Password Modal */}
            {openOtp && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm"
                    onClick={() => setOpenOtp(false)}
                >
                    <div
                        className="relative w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl transition-all dark:border-slate-800 dark:bg-slate-900"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400">
                                    <Sparkles size={20} />
                                </div>
                                <div>
                                    <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">Reset your password</h2>
                                    <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">Enter OTP and set your new password.</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setOpenOtp(false)}
                                type="button"
                                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                            >
                                <X size={16} />
                            </button>
                        </div>

                        <form onSubmit={handleResetSubmit(resetPassword)} noValidate className="mt-6 space-y-4">
                            <div className="flex justify-center">
                                <OTP value={otp} onChange={handleOTPChange} />
                            </div>

                            <div className="space-y-1">
                                <label className="text-[11px] font-semibold tracking-wide text-slate-600 dark:text-slate-300">
                                    New Password
                                </label>
                                <div className="relative">
                                    <input
                                        type={showPass ? 'text' : 'password'}
                                        autoComplete="new-password"
                                        {...registerReset('newPassword', {
                                            required: 'New password is required',
                                            minLength: { value: 6, message: 'Password must be at least 6 characters' },
                                        })}
                                        placeholder="Enter your new password"
                                        className="w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3.5 py-2 pr-10 text-sm text-slate-900 placeholder-slate-400 outline-none transition-all duration-150 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 dark:border-slate-700 dark:bg-slate-800/70 dark:text-slate-100 dark:placeholder-slate-500 dark:focus:border-indigo-400 dark:focus:bg-slate-800"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPass(!showPass)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                                    >
                                        {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                                {resetErrors.newPassword && isResetSubmitted && (
                                    <p className="text-[11px] font-medium text-rose-500">{resetErrors.newPassword.message}</p>
                                )}
                            </div>

                            <div className="space-y-1">
                                <label className="text-[11px] font-semibold tracking-wide text-slate-600 dark:text-slate-300">
                                    Confirm Password
                                </label>
                                <div className="relative">
                                    <input
                                        type={showPass ? 'text' : 'password'}
                                        autoComplete="new-password"
                                        {...registerReset('confirmPassword', {
                                            required: 'Please confirm your password',
                                            validate: (value) => value === passwordValue || 'Passwords do not match',
                                        })}
                                        placeholder="Confirm your new password"
                                        className="w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3.5 py-2 pr-10 text-sm text-slate-900 placeholder-slate-400 outline-none transition-all duration-150 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 dark:border-slate-700 dark:bg-slate-800/70 dark:text-slate-100 dark:placeholder-slate-500 dark:focus:border-indigo-400 dark:focus:bg-slate-800"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPass(!showPass)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                                    >
                                        {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                                {resetErrors.confirmPassword && isResetSubmitted && (
                                    <p className="text-[11px] font-medium text-rose-500">{resetErrors.confirmPassword.message}</p>
                                )}
                            </div>

                            <button
                                type="submit"
                                disabled={loading || otp.length !== 6}
                                className="flex w-full items-center justify-center rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 py-2.5 text-sm font-semibold text-white shadow-md shadow-indigo-500/20 transition-all duration-150 hover:from-indigo-600 hover:to-violet-700 active:scale-[0.99] disabled:opacity-50"
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
