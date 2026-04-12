import React from 'react'
import { useContext, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'react-toastify'
import { AppContext } from '../../context/AppContext'
import { assets } from '../../assets/assets'
import Loading from '../../components/LoadingPage'
import OTP from '../../components/AuthComponents/OTP'
import api from '../../api/axiosInstance'
import { X } from 'lucide-react'

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
    <div className="min-h-screen bg-[#f8f9fb] flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
            {/* Welcome Div */}
            <div className="mb-8 text-center">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-indigo-100/80 text-indigo-700 text-xs font-bold rounded-full border border-indigo-200/50 mb-3 uppercase tracking-wider">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"></span>
                    Welcome Back
                </div>
                <h2 className="text-2xl font-extrabold text-gray-900 mb-1">Login to DevDash</h2>
                <p className="text-gray-500 text-sm">{loginDescription}</p>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm px-8 py-8">
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