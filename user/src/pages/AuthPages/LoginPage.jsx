import React from 'react'
import { useContext, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'react-toastify'
import { AppContext } from '../../context/AppContext'
import { assets } from '../../assets/assets'
import Loading from '../../components/LoadingPage'
import OTP from '../../components/AuthComponents/OTP'
import api from '../../api/axiosInstance'
import { Eye, EyeOff, Sparkles, X } from 'lucide-react'

const LoginPage = () => {

    const { navigate, setToken } = useContext(AppContext)
    const [loading, setLoading] = useState(false);
    const [openOtp, setOpenOtp] = useState(false);
    const [otp, setOtp] = useState('');
    const [twoFactorToken, setTwoFactorToken] = useState('');
    const [pendingCredential, setPendingCredential] = useState('');
    const { register, handleSubmit, formState: { errors } } = useForm({
        mode: 'onTouched',
    });

    const [showPass, setShowPass] = useState(false);

    const loginDescription = useMemo(() => {
        return openOtp
            ? 'Enter the 6-digit code sent to your email to finish signing in.'
            : 'Enter your credentials to continue';
    }, [openOtp]);

    if (loading) return <Loading />

    const onSubmit = async (data) => {
        try {
            setLoading(true);

            const { data: response } = await api.post('/auth/login', data);

            if (response?.twoFactorRequired) {
                setTwoFactorToken(response.twoFactorToken || '');
                setPendingCredential(data.loginCredential);
                setOtp('');
                setOpenOtp(true);
                toast.success(response.message || '2FA verification required');
                return;
            }

            if (response?.success && response?.token) {
                setToken(response.token || '');
                toast.success(response.message || 'Logged in successfully');
                navigate('/dashboard');
                return;
            }

            toast.error(response?.message || 'Login failed');
        } catch (error) {
            toast.error(error?.response?.data?.message || 'Unable to login right now');
        } finally {
            setLoading(false);
        }
    }

    const handleOTPChange = (value) => {
        setOtp(value);
    }

    const verifyOTP = async (e) => {
        e.preventDefault();

        if (otp.length !== 6) {
            toast.error('Enter the 6-digit OTP');
            return;
        }

        try {
            setLoading(true);

            const payload = { otp, twoFactorToken };

            if (pendingCredential.includes('@')) {
                payload.email = pendingCredential;
            }

            const { data: response } = await api.post('/auth/verify-login-2fa', payload);

            if (response?.success && response?.token) {
                setToken(response.token);
                localStorage.setItem('token', response.token);
                setOpenOtp(false);
                setOtp('');
                setTwoFactorToken('');
                setPendingCredential('');
                toast.success(response.message || '2FA verified successfully');
                navigate('/dashboard');
                return;
            }

            toast.error(response?.message || 'OTP verification failed');
        } catch (error) {
            toast.error(error?.response?.data?.message || 'Unable to verify OTP');
        } finally {
            setLoading(false);
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
                            <span className="text-[10px]">👋</span>
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-[.18em] text-[#315e8d]">
                            Welcome Back
                        </span>
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Login to DevDash</h2>
                    <p className="text-sm text-slate-400 mt-1">{loginDescription}</p>
                </div>

                {/* ── Form Card ── */}
                <div className="bg-white border border-[#dbe5f1] rounded-2xl px-8 py-7 shadow-sm [animation:fadeUp_.4s_ease_.05s_both]">
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

                        {/* Username or Email */}
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold uppercase tracking-[.12em] text-slate-400">
                                Username or Email
                            </label>
                            <input
                                type="text"
                                autoComplete="username"
                                {...register("loginCredential", {
                                    required: "Username or email is required",
                                    validate: (value) => value.trim().length >= 3 || 'Enter at least 3 characters',
                                })}
                                placeholder="Enter your username or email"
                                className="w-full px-3 py-2.5 text-sm text-slate-800 bg-[#f8fafd] border border-[#dbe5f1] rounded-xl placeholder-slate-300 outline-none focus:ring-2 focus:ring-[#315e8d]/25 focus:border-[#315e8d] transition-all duration-150"
                            />
                            {errors.loginCredential && (
                                <p className="text-[11px] text-red-500 font-medium">{errors.loginCredential.message}</p>
                            )}
                        </div>

                        {/* Password */}
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold uppercase tracking-[.12em] text-slate-400">
                                Password
                            </label>
                            <div className="relative">
                                <input
                                    type={showPass ? "text" : "password"}
                                    autoComplete="current-password"
                                    {...register("password", { required: "Password is required" })}
                                    placeholder="Enter your password"
                                    className="w-full px-3 py-2.5 pr-10 text-sm text-slate-800 bg-[#f8fafd] border border-[#dbe5f1] rounded-xl placeholder-slate-300 outline-none focus:ring-2 focus:ring-[#315e8d]/25 focus:border-[#315e8d] transition-all duration-150"
                                />
                                <button
                                    onClick={() => setShowPass(!showPass)}
                                    type="button"
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#315e8d] transition-colors duration-150"
                                >
                                    {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                                </button>
                            </div>
                            {errors.password && (
                                <p className="text-[11px] text-red-500 font-medium">{errors.password.message}</p>
                            )}
                        </div>

                        {/* Forgot Password */}
                        <div className="flex justify-end">
                            <button
                                type="button"
                                onClick={() => navigate('/forget-password')}
                                className="text-[11px] font-bold text-[#315e8d] hover:text-[#26486d] transition-colors duration-150"
                            >
                                Forgot password?
                            </button>
                        </div>

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-[#315e8d] hover:bg-[#26486d] disabled:opacity-60 text-white font-semibold text-sm py-2.5 rounded-xl transition-all duration-150 shadow-sm cursor-pointer"
                        >
                            {loading ? 'Signing in...' : 'Login'}
                        </button>
                    </form>

                    {/* Sign Up Link */}
                    <div className="mt-5 text-center">
                        <p className="text-xs text-slate-400">
                            Don't have an account?{' '}
                            <button
                                type="button"
                                onClick={() => navigate('/signup')}
                                className="text-[#315e8d] hover:text-[#26486d] font-bold cursor-pointer transition-colors duration-150"
                            >
                                Sign up here.
                            </button>
                        </p>
                    </div>
                </div>
            </div>

            {/* ── OTP Modal ── */}
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
                                    <h2 className="text-sm font-bold text-slate-900">Verify your Login</h2>
                                    <p className="text-[11px] text-slate-400 mt-0.5">Enter the 6-digit OTP sent to your email.</p>
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

                        <form onSubmit={verifyOTP} className="space-y-4">
                            <OTP value={otp} onChange={handleOTPChange} />
                            <button
                                type="submit"
                                disabled={loading || otp.length !== 6}
                                className="w-full bg-[#315e8d] hover:bg-[#26486d] disabled:opacity-60 text-white font-semibold text-sm py-2.5 rounded-xl transition-all duration-150 shadow-sm cursor-pointer"
                            >
                                {loading ? 'Verifying...' : 'Verify & Continue'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}

export default LoginPage