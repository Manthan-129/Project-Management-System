import React from 'react'
import { useContext, useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'react-toastify'
import { AppContext } from '../../context/AppContext'
import Loading from '../../components/LoadingPage'
import OTP from '../../components/AuthComponents/OTP'
import { Eye, EyeOff, Sparkles, X } from 'lucide-react'
import api from '../../api/axiosInstance'

const SignupPage = () => {
    const { navigate, setToken } = useContext(AppContext);
    const [loading, setLoading] = useState(false);
    const [showPass, setShowPass] = useState(false);

    const { register, handleSubmit, formState: { errors }, watch } = useForm({
        mode: 'onTouched',
    });

    const [openOtp, setOpenOtp] = useState(false);
    const [otp, setOtp] = useState('');
    const [formData, setFormData] = useState(null);

    if (loading) return <Loading />

    const onSubmit = async (data) => {
        try {
            setLoading(true);

            const payload = {
                firstName: data.firstName.trim(),
                lastName: data.lastName.trim(),
                username: data.username.trim(),
                email: data.email.trim().toLowerCase(),
                password: data.password,
                confirmPassword: data.confirmPassword,
            };

            const { data: response } = await api.post('/auth/send-registration-otp', {
                email: payload.email,
                username: payload.username,
            });

            if (response?.success) {
                setFormData(payload);
                setOtp('');
                setOpenOtp(true);
                setToken(response.token || '');
                toast.success(response.message || 'OTP sent to email successfully');
                return;
            }

            toast.error(response?.message || 'Unable to send OTP');
        } catch (error) {
            toast.error(error?.response?.data?.message || 'Unable to send OTP right now');
        } finally {
            setLoading(false);
        }
    }

    const handleOTPChange = (value) => {
        setOtp(value);
    }

    const verifyOTP = async (e) => {
        e.preventDefault();

        if (!formData) {
            toast.error('Signup session expired. Please submit the form again.');
            return;
        }

        if (otp.length !== 6) {
            toast.error('Enter the 6-digit OTP');
            return;
        }

        try {
            setLoading(true);

            const { data: response } = await api.post('/auth/verify-registration-otp', {
                ...formData,
                otp,
            });

            if (response?.success && response?.token) {
                setToken(response.token);
                localStorage.setItem('token', response.token);
                toast.success(response.message || 'Account created successfully');
                setOpenOtp(false);
                setOtp('');
                setFormData(null);
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
                            Get Started
                        </span>
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Create your Account</h2>
                    <p className="text-sm text-slate-400 mt-1">Sign up to start managing your projects</p>
                </div>

                {/* ── Form Card ── */}
                <div className="bg-white border border-[#dbe5f1] rounded-2xl px-8 py-7 shadow-sm [animation:fadeUp_.4s_ease_.05s_both]">
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

                        {/* First & Last Name */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold uppercase tracking-[.12em] text-slate-400">First Name</label>
                                <input
                                    type="text"
                                    autoComplete="given-name"
                                    {...register("firstName", { required: "First name is required" })}
                                    placeholder="Jane"
                                    className="w-full px-3 py-2.5 text-sm text-slate-800 bg-[#f8fafd] border border-[#dbe5f1] rounded-xl placeholder-slate-300 outline-none focus:ring-2 focus:ring-[#315e8d]/25 focus:border-[#315e8d] transition-all duration-150"
                                />
                                {errors.firstName && <p className="text-[11px] text-red-500 font-medium">{errors.firstName.message}</p>}
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold uppercase tracking-[.12em] text-slate-400">Last Name</label>
                                <input
                                    type="text"
                                    autoComplete="family-name"
                                    {...register("lastName", { required: "Last name is required" })}
                                    placeholder="Doe"
                                    className="w-full px-3 py-2.5 text-sm text-slate-800 bg-[#f8fafd] border border-[#dbe5f1] rounded-xl placeholder-slate-300 outline-none focus:ring-2 focus:ring-[#315e8d]/25 focus:border-[#315e8d] transition-all duration-150"
                                />
                                {errors.lastName && <p className="text-[11px] text-red-500 font-medium">{errors.lastName.message}</p>}
                            </div>
                        </div>

                        {/* Username */}
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold uppercase tracking-[.12em] text-slate-400">Username</label>
                            <input
                                type="text"
                                autoComplete="username"
                                {...register("username", { required: "Username is required" })}
                                placeholder="janedoe"
                                className="w-full px-3 py-2.5 text-sm text-slate-800 bg-[#f8fafd] border border-[#dbe5f1] rounded-xl placeholder-slate-300 outline-none focus:ring-2 focus:ring-[#315e8d]/25 focus:border-[#315e8d] transition-all duration-150"
                            />
                            {errors.username && <p className="text-[11px] text-red-500 font-medium">{errors.username.message}</p>}
                        </div>

                        {/* Email */}
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold uppercase tracking-[.12em] text-slate-400">Email</label>
                            <input
                                type="email"
                                autoComplete="email"
                                {...register("email", {
                                    required: "Email is required",
                                    pattern: { value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i, message: "Invalid email address" }
                                })}
                                placeholder="jane@example.com"
                                className="w-full px-3 py-2.5 text-sm text-slate-800 bg-[#f8fafd] border border-[#dbe5f1] rounded-xl placeholder-slate-300 outline-none focus:ring-2 focus:ring-[#315e8d]/25 focus:border-[#315e8d] transition-all duration-150"
                            />
                            {errors.email && <p className="text-[11px] text-red-500 font-medium">{errors.email.message}</p>}
                        </div>

                        {/* Password */}
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold uppercase tracking-[.12em] text-slate-400">Password</label>
                            <div className="relative">
                                <input
                                    type={showPass ? "text" : "password"}
                                    autoComplete="new-password"
                                    {...register("password", {
                                        required: "Password is required",
                                        minLength: { value: 6, message: "Password must be at least 6 characters" }
                                    })}
                                    placeholder="••••••••"
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
                            {errors.password && <p className="text-[11px] text-red-500 font-medium">{errors.password.message}</p>}
                        </div>

                        {/* Confirm Password */}
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold uppercase tracking-[.12em] text-slate-400">Confirm Password</label>
                            <div className="relative">
                                <input
                                    type={showPass ? "text" : "password"}
                                    autoComplete="new-password"
                                    {...register("confirmPassword", {
                                        required: "Please confirm your password",
                                        validate: (value) => value === watch("password") || "Passwords do not match"
                                    })}
                                    placeholder="••••••••"
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
                            {errors.confirmPassword && <p className="text-[11px] text-red-500 font-medium">{errors.confirmPassword.message}</p>}
                        </div>

                        {/* Submit */}
                        <div className="pt-1">
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-[#315e8d] hover:bg-[#26486d] disabled:opacity-60 text-white font-semibold text-sm py-2.5 rounded-xl transition-all duration-150 shadow-sm cursor-pointer"
                            >
                                {loading ? 'Sending OTP...' : 'Create Account'}
                            </button>
                        </div>
                    </form>

                    {/* Login Link */}
                    <div className="mt-5 text-center">
                        <p className="text-xs text-slate-400">
                            Already have an account?{' '}
                            <button
                                type="button"
                                onClick={() => navigate('/login')}
                                className="text-[#315e8d] hover:text-[#26486d] font-bold cursor-pointer transition-colors duration-150"
                            >
                                Login here.
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
                                    <h2 className="text-sm font-bold text-slate-900">Verify your Email</h2>
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
                                {loading ? 'Verifying...' : 'Verify & Create Account'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}

export default SignupPage