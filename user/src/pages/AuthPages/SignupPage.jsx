import { CheckCircle2, Eye, EyeOff, ShieldCheck, Sparkles, X } from 'lucide-react'
import { useContext, useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'react-toastify'
import api from '../../api/axiosInstance'
import OTP from '../../components/AuthComponents/OTP'
import Loading from '../../components/LoadingPage'
import { AppContext } from '../../context/AppContext'

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

    const getResolvedTheme = () => {
        if (typeof window === 'undefined') return 'light';
        const savedTheme = localStorage.getItem('theme') || 'system';

        if (savedTheme === 'system') {
            return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        }

        return savedTheme;
    };

    const [resolvedTheme, setResolvedTheme] = useState(getResolvedTheme);

    useEffect(() => {
        if (typeof window === 'undefined') return;

        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

        const updateTheme = () => {
            setResolvedTheme(getResolvedTheme());
        };

        const handleStorageChange = (event) => {
            if (!event.key || event.key === 'theme') {
                updateTheme();
            }
        };

        updateTheme();
        window.addEventListener('storage', handleStorageChange);
        window.addEventListener('app:theme-change', updateTheme);

        if (mediaQuery.addEventListener) {
            mediaQuery.addEventListener('change', updateTheme);
        } else {
            mediaQuery.addListener(updateTheme);
        }

        return () => {
            window.removeEventListener('storage', handleStorageChange);
            window.removeEventListener('app:theme-change', updateTheme);
            if (mediaQuery.removeEventListener) {
                mediaQuery.removeEventListener('change', updateTheme);
            } else {
                mediaQuery.removeListener(updateTheme);
            }
        };
    }, []);

    const isDarkTheme = resolvedTheme === 'dark';
    const watchedPassword = watch('password') || '';

    const passwordStrength = useMemo(() => {
        const checks = [
            watchedPassword.length >= 8,
            /[A-Z]/.test(watchedPassword),
            /[0-9]/.test(watchedPassword),
            /[^A-Za-z0-9]/.test(watchedPassword),
        ];

        const passedChecks = checks.filter(Boolean).length;
        const score = Math.round((passedChecks / checks.length) * 100);

        if (!watchedPassword) {
            return {
                score: 0,
                label: 'Not set',
                tone: isDarkTheme ? 'text-slate-400' : 'text-slate-500',
                bar: isDarkTheme ? 'bg-slate-600' : 'bg-slate-300',
            };
        }

        if (score < 50) {
            return { score, label: 'Weak', tone: 'text-rose-500', bar: 'bg-rose-500' };
        }

        if (score < 75) {
            return { score, label: 'Fair', tone: 'text-amber-500', bar: 'bg-amber-500' };
        }

        return { score, label: 'Strong', tone: 'text-emerald-500', bar: 'bg-emerald-500' };
    }, [watchedPassword, isDarkTheme]);

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
        <div className={`relative min-h-screen overflow-hidden transition-colors duration-300 ${isDarkTheme ? 'bg-[#0b1324]' : 'bg-[#eef4fb]'}`}>
            <div className={`pointer-events-none absolute inset-0 ${isDarkTheme ? 'opacity-40' : 'opacity-90'}`}>
                <div className={`absolute -top-24 -left-24 h-72 w-72 rounded-full blur-3xl animate-[pulse_6s_ease-in-out_infinite] ${isDarkTheme ? 'bg-cyan-500/20' : 'bg-[#79a6d8]/35'}`} />
                <div className={`absolute top-20 right-[-100px] h-80 w-80 rounded-full blur-3xl animate-[pulse_8s_ease-in-out_infinite] ${isDarkTheme ? 'bg-indigo-500/20' : 'bg-[#9cc2ea]/45'}`} />
                <div className={`absolute -bottom-28 left-1/2 h-80 w-80 -translate-x-1/2 rounded-full blur-3xl animate-[pulse_7s_ease-in-out_infinite] ${isDarkTheme ? 'bg-blue-400/10' : 'bg-[#bfd9f2]/55'}`} />
                <div className={`absolute inset-0 ${isDarkTheme ? 'opacity-40' : 'opacity-60'} [background-image:linear-gradient(to_right,rgba(148,163,184,0.08)_1px,transparent_1px),linear-gradient(to_bottom,rgba(148,163,184,0.08)_1px,transparent_1px)] [background-size:46px_46px]`} />
            </div>

            <div className="relative mx-auto flex min-h-screen w-full max-w-6xl items-center px-4 py-10 sm:px-6 lg:px-8">
                <div className="grid w-full gap-6 lg:grid-cols-[1.1fr_0.9fr]">

                    <section className={`hidden rounded-3xl border p-8 lg:block xl:p-10 [animation:fadeUp_.45s_ease_both] ${isDarkTheme ? 'border-slate-700/70 bg-slate-900/70 text-slate-100' : 'border-[#d8e5f4] bg-white/75 text-slate-900'} backdrop-blur-xl shadow-[0_20px_60px_-30px_rgba(0,0,0,0.35)]`}>
                        <div className="mb-10 flex items-center gap-3">
                            <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${isDarkTheme ? 'bg-cyan-500/20' : 'bg-[#315e8d]'}`}>
                                <Sparkles size={18} className={isDarkTheme ? 'text-cyan-300' : 'text-white'} />
                            </div>
                            <div>
                                <p className={`text-xs font-semibold uppercase tracking-[0.28em] ${isDarkTheme ? 'text-cyan-300/90' : 'text-[#315e8d]'}`}>DevDash</p>
                                <p className={`text-xs ${isDarkTheme ? 'text-slate-400' : 'text-slate-500'}`}>Collaboration Platform</p>
                            </div>
                        </div>

                        <h2 className={`text-3xl font-black leading-tight xl:text-4xl ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>
                            Build, track and ship work with your team in one focused space.
                        </h2>
                        <p className={`mt-4 max-w-md text-sm leading-relaxed ${isDarkTheme ? 'text-slate-300' : 'text-slate-600'}`}>
                            Real-time boards, cleaner team communication, and project visibility from kickoff to delivery.
                        </p>

                        <div className="mt-6 grid grid-cols-2 gap-3">
                            <div className={`rounded-xl border px-3 py-2 ${isDarkTheme ? 'border-slate-700 bg-slate-800/70' : 'border-slate-200 bg-white/90'}`}>
                                <p className={`text-[11px] ${isDarkTheme ? 'text-slate-400' : 'text-slate-500'}`}>Teams onboarded</p>
                                <p className={`text-lg font-bold ${isDarkTheme ? 'text-cyan-300' : 'text-[#315e8d]'}`}>12k+</p>
                            </div>
                            <div className={`rounded-xl border px-3 py-2 ${isDarkTheme ? 'border-slate-700 bg-slate-800/70' : 'border-slate-200 bg-white/90'}`}>
                                <p className={`text-[11px] ${isDarkTheme ? 'text-slate-400' : 'text-slate-500'}`}>Task updates/day</p>
                                <p className={`text-lg font-bold ${isDarkTheme ? 'text-cyan-300' : 'text-[#315e8d]'}`}>280k</p>
                            </div>
                        </div>

                        <div className="mt-8 space-y-3">
                            {[
                                'Live team boards and task status in one view',
                                'Friendly onboarding with secure OTP verification',
                                'Theme preferences that follow your system style',
                            ].map((item) => (
                                <div key={item} className={`flex items-start gap-3 rounded-xl border p-3 ${isDarkTheme ? 'border-slate-700 bg-slate-800/65' : 'border-slate-200 bg-white/85'}`}>
                                    <span className={`mt-1 inline-block h-2.5 w-2.5 rounded-full ${isDarkTheme ? 'bg-cyan-300' : 'bg-[#315e8d]'}`} />
                                    <p className={`text-sm ${isDarkTheme ? 'text-slate-200' : 'text-slate-700'}`}>{item}</p>
                                </div>
                            ))}
                        </div>
                    </section>

                    <section className="relative w-full">
                        <div className="pointer-events-none absolute -inset-2 hidden sm:block">
                            <div className={`absolute inset-0 rounded-[30px] border ${isDarkTheme ? 'border-slate-700/60' : 'border-slate-300/70'}`} />
                            <div className={`absolute -inset-1.5 rounded-[34px] border border-dashed animate-[spin_28s_linear_infinite] ${isDarkTheme ? 'border-slate-600/35' : 'border-slate-400/45'}`} />
                        </div>

                        <div className={`relative mx-auto w-full max-w-xl rounded-3xl border p-5 sm:p-8 [animation:fadeUp_.45s_ease_.08s_both] ${isDarkTheme ? 'border-slate-700/70 bg-slate-900/75' : 'border-[#d8e5f4] bg-white/80'} backdrop-blur-xl shadow-[0_20px_55px_-30px_rgba(0,0,0,0.45)] transition-transform duration-300 hover:-translate-y-0.5 overflow-hidden`}>

                            <div className={`pointer-events-none absolute inset-0 ${isDarkTheme ? 'opacity-70' : 'opacity-90'} [background-image:radial-gradient(circle_at_0%_0%,rgba(255,255,255,0.08),transparent_36%),radial-gradient(circle_at_100%_100%,rgba(148,163,184,0.08),transparent_42%)]`} />
                            <div className={`pointer-events-none absolute left-10 right-10 top-0 h-px animate-[pulse_3.5s_ease-in-out_infinite] ${isDarkTheme ? 'bg-gradient-to-r from-transparent via-cyan-300/70 to-transparent' : 'bg-gradient-to-r from-transparent via-[#315e8d]/65 to-transparent'}`} />
                            <div className={`pointer-events-none absolute left-16 right-16 bottom-0 h-px animate-[pulse_4.2s_ease-in-out_infinite] ${isDarkTheme ? 'bg-gradient-to-r from-transparent via-slate-300/50 to-transparent' : 'bg-gradient-to-r from-transparent via-slate-500/40 to-transparent'}`} />

                            <div className={`pointer-events-none absolute -right-8 -top-8 h-20 w-20 rounded-2xl border ${isDarkTheme ? 'border-slate-700/60 bg-slate-800/35' : 'border-slate-300/60 bg-white/35'} rotate-12`} />
                            <div className={`pointer-events-none absolute -bottom-6 -left-6 h-16 w-16 rounded-xl border ${isDarkTheme ? 'border-slate-700/60 bg-slate-800/30' : 'border-slate-300/60 bg-white/40'} -rotate-6`} />

                            <div className="mb-7 text-center [animation:fadeUp_.4s_ease_both]">
                                <div className="mb-4 inline-flex items-center gap-2">
                                    <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${isDarkTheme ? 'bg-cyan-500/20' : 'bg-[#315e8d]'} shadow-sm`}>
                                        <Sparkles size={18} className={isDarkTheme ? 'text-cyan-300' : 'text-white'} />
                                    </div>
                                    <div className="text-left">
                                        <h1 className={`text-lg font-bold leading-none ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>
                                            Dev<span className={isDarkTheme ? 'text-cyan-300' : 'text-[#315e8d]'}>Dash</span>
                                        </h1>
                                        <p className={`text-[10px] font-medium ${isDarkTheme ? 'text-slate-400' : 'text-slate-400'}`}>Create your workspace</p>
                                    </div>
                                </div>

                                <h2 className={`text-2xl font-black tracking-tight sm:text-3xl ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>Create your account</h2>
                                <p className={`mt-1 text-sm ${isDarkTheme ? 'text-slate-300' : 'text-slate-500'}`}>Start managing projects with a cleaner, faster workflow.</p>
                                <div className="mt-3 flex items-center justify-center gap-2">
                                    <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-semibold ${isDarkTheme ? 'border-slate-700 bg-slate-800 text-slate-200' : 'border-slate-200 bg-slate-50 text-slate-600'}`}>
                                        <ShieldCheck size={12} className={isDarkTheme ? 'text-cyan-300' : 'text-[#315e8d]'} />
                                        Secure OTP Signup
                                    </span>
                                    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-semibold ${isDarkTheme ? 'border-slate-700 bg-slate-800 text-slate-200' : 'border-slate-200 bg-slate-50 text-slate-600'}`}>
                                        <CheckCircle2 size={12} className="mr-1 text-emerald-500" />
                                        2-min onboarding
                                    </span>
                                </div>
                            </div>

                            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 [animation:fadeUp_.45s_ease_.14s_both]">

                                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 [animation:fadeUp_.35s_ease_.2s_both]">
                                    <div className="space-y-1.5">
                                        <label className={`text-[10px] font-bold uppercase tracking-[.18em] ${isDarkTheme ? 'text-slate-400' : 'text-slate-400'}`}>First Name</label>
                                        <input
                                            type="text"
                                            autoComplete="given-name"
                                            {...register('firstName', { required: 'First name is required' })}
                                            placeholder="Jane"
                                            className={`w-full rounded-xl border px-3 py-2.5 text-sm outline-none transition-all duration-150 focus:ring-2 ${isDarkTheme ? 'border-slate-700 bg-slate-800 text-slate-100 placeholder-slate-500 focus:border-cyan-300 focus:ring-cyan-300/25' : 'border-[#dbe5f1] bg-[#f8fafd] text-slate-800 placeholder-slate-300 focus:border-[#315e8d] focus:ring-[#315e8d]/25'}`}
                                        />
                                        {errors.firstName && <p className="text-[11px] font-medium text-rose-500">{errors.firstName.message}</p>}
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className={`text-[10px] font-bold uppercase tracking-[.18em] ${isDarkTheme ? 'text-slate-400' : 'text-slate-400'}`}>Last Name</label>
                                        <input
                                            type="text"
                                            autoComplete="family-name"
                                            {...register('lastName', { required: 'Last name is required' })}
                                            placeholder="Doe"
                                            className={`w-full rounded-xl border px-3 py-2.5 text-sm outline-none transition-all duration-150 focus:ring-2 ${isDarkTheme ? 'border-slate-700 bg-slate-800 text-slate-100 placeholder-slate-500 focus:border-cyan-300 focus:ring-cyan-300/25' : 'border-[#dbe5f1] bg-[#f8fafd] text-slate-800 placeholder-slate-300 focus:border-[#315e8d] focus:ring-[#315e8d]/25'}`}
                                        />
                                        {errors.lastName && <p className="text-[11px] font-medium text-rose-500">{errors.lastName.message}</p>}
                                    </div>
                                </div>

                                <div className="space-y-1.5 [animation:fadeUp_.35s_ease_.24s_both]">
                                    <label className={`text-[10px] font-bold uppercase tracking-[.18em] ${isDarkTheme ? 'text-slate-400' : 'text-slate-400'}`}>Username</label>
                                    <input
                                        type="text"
                                        autoComplete="username"
                                        {...register('username', { required: 'Username is required' })}
                                        placeholder="janedoe"
                                        className={`w-full rounded-xl border px-3 py-2.5 text-sm outline-none transition-all duration-150 focus:ring-2 ${isDarkTheme ? 'border-slate-700 bg-slate-800 text-slate-100 placeholder-slate-500 focus:border-cyan-300 focus:ring-cyan-300/25' : 'border-[#dbe5f1] bg-[#f8fafd] text-slate-800 placeholder-slate-300 focus:border-[#315e8d] focus:ring-[#315e8d]/25'}`}
                                    />
                                    {errors.username && <p className="text-[11px] font-medium text-rose-500">{errors.username.message}</p>}
                                </div>

                                <div className="space-y-1.5 [animation:fadeUp_.35s_ease_.28s_both]">
                                    <label className={`text-[10px] font-bold uppercase tracking-[.18em] ${isDarkTheme ? 'text-slate-400' : 'text-slate-400'}`}>Email</label>
                                    <input
                                        type="email"
                                        autoComplete="email"
                                        {...register('email', {
                                            required: 'Email is required',
                                            pattern: { value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i, message: 'Invalid email address' }
                                        })}
                                        placeholder="jane@example.com"
                                        className={`w-full rounded-xl border px-3 py-2.5 text-sm outline-none transition-all duration-150 focus:ring-2 ${isDarkTheme ? 'border-slate-700 bg-slate-800 text-slate-100 placeholder-slate-500 focus:border-cyan-300 focus:ring-cyan-300/25' : 'border-[#dbe5f1] bg-[#f8fafd] text-slate-800 placeholder-slate-300 focus:border-[#315e8d] focus:ring-[#315e8d]/25'}`}
                                    />
                                    {errors.email && <p className="text-[11px] font-medium text-rose-500">{errors.email.message}</p>}
                                </div>

                                <div className="space-y-1.5 [animation:fadeUp_.35s_ease_.32s_both]">
                                    <label className={`text-[10px] font-bold uppercase tracking-[.18em] ${isDarkTheme ? 'text-slate-400' : 'text-slate-400'}`}>Password</label>
                                    <div className="relative">
                                        <input
                                            type={showPass ? 'text' : 'password'}
                                            autoComplete="new-password"
                                            {...register('password', {
                                                required: 'Password is required',
                                                minLength: { value: 6, message: 'Password must be at least 6 characters' }
                                            })}
                                            placeholder="Create a strong password"
                                            className={`w-full rounded-xl border px-3 py-2.5 pr-10 text-sm outline-none transition-all duration-150 focus:ring-2 ${isDarkTheme ? 'border-slate-700 bg-slate-800 text-slate-100 placeholder-slate-500 focus:border-cyan-300 focus:ring-cyan-300/25' : 'border-[#dbe5f1] bg-[#f8fafd] text-slate-800 placeholder-slate-300 focus:border-[#315e8d] focus:ring-[#315e8d]/25'}`}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPass(!showPass)}
                                            className={`absolute right-3 top-1/2 -translate-y-1/2 transition-colors ${isDarkTheme ? 'text-slate-400 hover:text-cyan-300' : 'text-slate-400 hover:text-[#315e8d]'}`}
                                        >
                                            {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                                        </button>
                                    </div>

                                    <div className={`mt-2 rounded-xl border px-3 py-2.5 ${isDarkTheme ? 'border-slate-700 bg-slate-800/70' : 'border-slate-200 bg-slate-50/80'}`}>
                                        <div className="flex items-center justify-between text-[11px]">
                                            <span className={isDarkTheme ? 'text-slate-400' : 'text-slate-500'}>Password quality</span>
                                            <span className={`font-semibold ${passwordStrength.tone}`}>{passwordStrength.label}</span>
                                        </div>

                                        <div className={`mt-1.5 h-1.5 w-full overflow-hidden rounded-full ${isDarkTheme ? 'bg-slate-700' : 'bg-slate-200'}`}>
                                            <div
                                                className={`h-full rounded-full transition-all duration-300 ${passwordStrength.bar}`}
                                                style={{ width: `${passwordStrength.score}%` }}
                                            />
                                        </div>

                                        <p className={`mt-1.5 text-[10px] ${isDarkTheme ? 'text-slate-400' : 'text-slate-500'}`}>
                                            Tip: use 8+ characters with uppercase letters, numbers and symbols.
                                        </p>
                                    </div>

                                    {errors.password && <p className="text-[11px] font-medium text-rose-500">{errors.password.message}</p>}
                                </div>

                                <div className="space-y-1.5 [animation:fadeUp_.35s_ease_.36s_both]">
                                    <label className={`text-[10px] font-bold uppercase tracking-[.18em] ${isDarkTheme ? 'text-slate-400' : 'text-slate-400'}`}>Confirm Password</label>
                                    <div className="relative">
                                        <input
                                            type={showPass ? 'text' : 'password'}
                                            autoComplete="new-password"
                                            {...register('confirmPassword', {
                                                required: 'Please confirm your password',
                                                validate: (value) => value === watch('password') || 'Passwords do not match'
                                            })}
                                            placeholder="Re-enter password"
                                            className={`w-full rounded-xl border px-3 py-2.5 pr-10 text-sm outline-none transition-all duration-150 focus:ring-2 ${isDarkTheme ? 'border-slate-700 bg-slate-800 text-slate-100 placeholder-slate-500 focus:border-cyan-300 focus:ring-cyan-300/25' : 'border-[#dbe5f1] bg-[#f8fafd] text-slate-800 placeholder-slate-300 focus:border-[#315e8d] focus:ring-[#315e8d]/25'}`}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPass(!showPass)}
                                            className={`absolute right-3 top-1/2 -translate-y-1/2 transition-colors ${isDarkTheme ? 'text-slate-400 hover:text-cyan-300' : 'text-slate-400 hover:text-[#315e8d]'}`}
                                        >
                                            {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                                        </button>
                                    </div>
                                    {errors.confirmPassword && <p className="text-[11px] font-medium text-rose-500">{errors.confirmPassword.message}</p>}
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className={`mt-1 w-full rounded-xl py-2.5 text-sm font-semibold text-white transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-60 active:scale-[0.99] ${isDarkTheme ? 'bg-cyan-500 hover:bg-cyan-400 hover:shadow-[0_8px_24px_-10px_rgba(34,211,238,0.9)]' : 'bg-[#315e8d] hover:bg-[#26486d] hover:shadow-[0_8px_24px_-10px_rgba(49,94,141,0.85)]'} shadow-sm`}
                                >
                                    {loading ? 'Sending OTP...' : 'Create Account'}
                                </button>
                            </form>

                            <div className="mt-5 text-center">
                                <p className={`text-xs ${isDarkTheme ? 'text-slate-400' : 'text-slate-500'}`}>
                                    Already have an account?{' '}
                                    <button
                                        type="button"
                                        onClick={() => navigate('/login')}
                                        className={`font-bold transition-colors ${isDarkTheme ? 'text-cyan-300 hover:text-cyan-200' : 'text-[#315e8d] hover:text-[#26486d]'}`}
                                    >
                                        Login here.
                                    </button>
                                </p>
                            </div>
                        </div>
                    </section>
                </div>
            </div>

            {/* ── OTP Modal ── */}
            {openOtp && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 backdrop-blur-md px-4 [animation:fadeUp_.25s_ease_both]"
                    onClick={() => setOpenOtp(false)}
                >
                    <div
                        className="relative w-full max-w-md"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="pointer-events-none absolute -inset-2">
                            <div className={`absolute inset-0 rounded-[22px] border ${isDarkTheme ? 'border-slate-600/70' : 'border-slate-300/70'}`} />
                            <div className={`absolute -inset-1.5 rounded-[26px] border border-dashed animate-[spin_26s_linear_infinite] ${isDarkTheme ? 'border-slate-500/35' : 'border-slate-400/45'}`} />
                        </div>

                        <div className={`pointer-events-none absolute -left-7 top-8 hidden sm:flex items-center gap-2 rounded-xl border px-2.5 py-1.5 text-[10px] font-semibold [animation:fadeUp_.35s_ease_.06s_both] ${isDarkTheme ? 'border-slate-700 bg-slate-800/95 text-slate-200' : 'border-slate-200 bg-white/95 text-slate-600'}`}>
                            <ShieldCheck size={12} className={isDarkTheme ? 'text-cyan-300' : 'text-[#315e8d]'} />
                            Encrypted
                        </div>
                        <div className={`pointer-events-none absolute -right-7 bottom-10 hidden sm:flex items-center gap-2 rounded-xl border px-2.5 py-1.5 text-[10px] font-semibold [animation:fadeUp_.35s_ease_.12s_both] ${isDarkTheme ? 'border-slate-700 bg-slate-800/95 text-slate-200' : 'border-slate-200 bg-white/95 text-slate-600'}`}>
                            <CheckCircle2 size={12} className="text-emerald-500" />
                            6-digit OTP
                        </div>

                        <div
                            className={`relative w-full rounded-2xl border p-6 shadow-2xl space-y-5 [animation:fadeUp_.35s_ease_.04s_both] ${isDarkTheme ? 'bg-slate-900 border-slate-700' : 'bg-white border-[#dbe5f1]'}`}
                        >
                            <div className={`pointer-events-none absolute -right-6 -top-6 h-16 w-16 rounded-xl border rotate-12 ${isDarkTheme ? 'border-slate-700/60 bg-slate-800/35' : 'border-slate-300/60 bg-white/45'}`} />
                            <div className={`pointer-events-none absolute -bottom-4 -left-4 h-12 w-12 rounded-lg border -rotate-6 ${isDarkTheme ? 'border-slate-700/60 bg-slate-800/30' : 'border-slate-300/60 bg-white/40'}`} />

                        {/* Modal Header */}
                        <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                                <div className={`w-9 h-9 rounded-xl flex items-center justify-center animate-[pulse_2.6s_ease-in-out_infinite] ${isDarkTheme ? 'bg-cyan-500/20' : 'bg-[#e9f0f8]'}`}>
                                    <Sparkles size={16} className={isDarkTheme ? 'text-cyan-300' : 'text-[#315e8d]'} />
                                </div>
                                <div>
                                    <h2 className={`text-sm font-bold ${isDarkTheme ? 'text-slate-100' : 'text-slate-900'}`}>Verify your Email</h2>
                                    <p className={`mt-0.5 text-[11px] ${isDarkTheme ? 'text-slate-400' : 'text-slate-400'}`}>Enter the 6-digit OTP sent to your email.</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setOpenOtp(false)}
                                type="button"
                                className={`w-7 h-7 flex items-center justify-center rounded-lg transition-all duration-150 ${isDarkTheme ? 'text-slate-400 hover:bg-slate-800 hover:text-slate-200' : 'text-slate-400 hover:bg-slate-100 hover:text-slate-600'}`}
                            >
                                <X size={14} />
                            </button>
                        </div>

                        <form onSubmit={verifyOTP} className="space-y-4">
                            <OTP value={otp} onChange={handleOTPChange} />
                            <button
                                type="submit"
                                disabled={loading || otp.length !== 6}
                                className={`w-full rounded-xl py-2.5 text-sm font-semibold text-white transition-all duration-150 disabled:opacity-60 active:scale-[0.99] ${isDarkTheme ? 'bg-cyan-500 hover:bg-cyan-400 hover:shadow-[0_8px_24px_-10px_rgba(34,211,238,0.9)]' : 'bg-[#315e8d] hover:bg-[#26486d] hover:shadow-[0_8px_24px_-10px_rgba(49,94,141,0.85)]'}`}
                            >
                                {loading ? 'Verifying...' : 'Verify & Create Account'}
                            </button>
                        </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default SignupPage