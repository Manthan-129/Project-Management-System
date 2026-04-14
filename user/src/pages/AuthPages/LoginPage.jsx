import { Link, ShieldCheck, Sparkles, X } from 'lucide-react'
import { useContext, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'react-toastify'
import api from '../../api/axiosInstance'
import { assets } from '../../assets/assets'
import OTP from '../../components/AuthComponents/OTP'
import Loading from '../../components/LoadingPage'
import { AppContext } from '../../context/AppContext'

const LoginPage = () => {

    const {navigate, setToken}= useContext(AppContext)
    const [loading, setLoading]= useState(false);
    const [openOtp, setOpenOtp] = useState(false);
    const [otp, setOtp] = useState('');
    const [twoFactorToken, setTwoFactorToken] = useState('');
    const [pendingCredential, setPendingCredential] = useState('');
    const { register, handleSubmit, formState: { errors }}= useForm({
        mode: 'onTouched',
    });

    const [showPass, setShowPass]= useState(false);

    const loginDescription = useMemo(() => {
        return openOtp
            ? 'Enter the 6-digit code sent to your email to finish signing in.'
            : 'Enter your credentials to continue';
    }, [openOtp]);

    if(loading) return <Loading />

    const onSubmit= async (data)=>{
        try{
            setLoading(true);

            const { data: response } = await api.post('/auth/login', data);

            if(response?.twoFactorRequired){
                setTwoFactorToken(response.twoFactorToken || '');
                setPendingCredential(data.loginCredential);
                setOtp('');
                setOpenOtp(true);
                toast.success(response.message || '2FA verification required');
                return;
            }

            if(response?.success && response?.token){
                setToken(response.token || '');
                toast.success(response.message || 'Logged in successfully');
                navigate('/dashboard');
                return;
            }

            toast.error(response?.message || 'Login failed');
        }catch(error){
            toast.error(error?.response?.data?.message || 'Unable to login right now');
        }finally{
            setLoading(false);
        }
    }

    const handleOTPChange = (value) => {
        setOtp(value);
    }

    const verifyOTP = async (e) => {
        e.preventDefault();

        if(otp.length !== 6){
            toast.error('Enter the 6-digit OTP');
            return;
        }

        try{
            setLoading(true);

            const payload = {
                otp,
                twoFactorToken,
            };

            if(pendingCredential.includes('@')){
                payload.email = pendingCredential;
            }

            const { data: response } = await api.post('/auth/verify-login-2fa', payload);

            if(response?.success && response?.token){
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
        }catch(error){
            toast.error(error?.response?.data?.message || 'Unable to verify OTP');
        }finally{
            setLoading(false);
        }
    }
    
  return (
    <div className="dd-app-shell flex min-h-screen items-center justify-center px-4 py-10">
        <div className="grid w-full max-w-5xl gap-6 lg:grid-cols-[1.05fr_0.95fr]">
            <div className="dd-shell-frame overflow-hidden p-6 md:p-8">
                <div className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                    <span className="dd-page-kicker"><Sparkles size={13} /> DevDash</span>
                    <span className="hidden sm:inline">Secure workspace access</span>
                </div>
                <div className="mt-6 space-y-4">
                    <h2 className="text-4xl font-black tracking-tight text-slate-900">Welcome back.</h2>
                    <p className="max-w-md text-sm leading-6 text-slate-600">{loginDescription}</p>
                </div>

                <div className="mt-8 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-sm">
                        <ShieldCheck size={18} className="text-[#315e8d]" />
                        <p className="mt-3 text-sm font-semibold text-slate-800">Protected sessions</p>
                        <p className="mt-1 text-xs text-slate-500">Two-factor verification is fully supported.</p>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-sm">
                        <Link size={18} className="text-[#315e8d]" />
                        <p className="mt-3 text-sm font-semibold text-slate-800">Fast handoff</p>
                        <p className="mt-1 text-xs text-slate-500">Jump straight from auth into dashboard and settings.</p>
                    </div>
                </div>
            </div>

            <div className="dd-shell-frame p-6 md:p-8">
            <form onSubmit= {handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Username Or Email</label>
                    <input
                        type="text"
                        autoComplete="username"
                        {...register("loginCredential", {
                            required: "Username or email is required",
                            validate: (value) => value.trim().length >= 3 || 'Enter at least 3 characters',
                        })}
                        placeholder="Enter your username or email"
                        className="w-full px-3.5 py-2.5 text-sm text-gray-800 bg-gray-50 border border-gray-200 rounded-lg placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 transition"
                    />
                    {errors.loginCredential && <p className="text-xs text-red-400">{errors.loginCredential.message}</p>}
                </div>

                <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Password</label>
                    <div className="relative">
                    <input
                        type={showPass ? "text" : "password"}
                        autoComplete="current-password"
                        {...register("password", {required: "Password is required"})}
                        placeholder="Enter your password"
                        className="w-full px-3.5 py-2.5 pr-11 text-sm text-gray-800 bg-gray-50 border border-gray-200 rounded-lg placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 transition"
                    />
                    <button onClick={()=> setShowPass(!showPass)} type="button" aria-label={showPass ? 'Hide password' : 'Show password'} className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer opacity-60 hover:opacity-100 transition-opacity">
                        {showPass ? <img src={assets.close_eye_icon || "Hide"} alt="" className="w-5 h-5" /> : <img src={assets.open_eye_icon || "Show"} alt="" className="w-5 h-5" />}
                    </button>
                    </div>
                    {errors.password && <p className="text-xs text-red-400">{errors.password.message}</p>}
                </div>
                
                <div className="flex justify-end">
                    <button type="button" onClick={()=>navigate('/forget-password')} className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 transition-colors">
                        Forgot password?
                    </button>
                </div>
                <div>
                    <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white font-semibold text-sm py-2.5 rounded-lg transition-colors shadow-sm shadow-indigo-100" disabled={loading}>
                        {loading ? 'Signing in...' : 'Login'}
                    </button>
                </div>
            </form>
            <button onClick={()=> navigate("/signup")} className="mt-5 w-full text-sm text-gray-500 hover:text-indigo-600 transition-colors">
                Don't have an account ? Sign Up
            </button>
            </div>
        </div>

        {openOtp && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/25 backdrop-blur-sm px-4" onClick={() => setOpenOtp(false)}>
                <div className="w-full max-w-sm bg-white rounded-2xl border border-gray-200 shadow-lg p-7 space-y-5" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-start justify-between">
                        <div>
                            <h2 className="text-base font-bold text-gray-900 tracking-tight">Verify your login</h2>
                            <p className="text-xs text-gray-400 mt-1">Enter the 6-digit OTP sent to your email.</p>
                        </div>
                        <button onClick={()=> setOpenOtp(false)} type="button" aria-label="Close OTP dialog" className="p-1.5 text-gray-300 hover:text-gray-500 hover:bg-gray-100 rounded-lg transition">
                            <X size={14} strokeWidth={2} />
                        </button>
                    </div>

                    <form onSubmit={verifyOTP} className="space-y-4">
                        <OTP value={otp} onChange={handleOTPChange} />
                        <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white font-semibold text-sm py-2.5 rounded-lg transition-colors shadow-sm shadow-indigo-100" disabled={loading || otp.length !== 6}>
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