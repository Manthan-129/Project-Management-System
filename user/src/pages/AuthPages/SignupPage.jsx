import React from 'react'
import {useState, useContext} from 'react'
import { useForm } from 'react-hook-form'
import { AppContext } from '../../context/AppContext'
import { assets } from '../../assets/assets'
import Loading from '../../components/LoadingPage'
import OTP from '../../components/AuthComponents/OTP'
import { X } from 'lucide-react'

const SignupPage = () => {
    const {navigate,token , setToken }= useContext(AppContext);
    const [loading, setLoading]= useState(false);
    const [showPass, setShowPass]= useState(false);

    const {register, handleSubmit, formState: {errors}, watch}= useForm();
    
    const [openOtp , setOpenOtp]= useState(false);
    const [otp, setOtp]= useState('');
    const [formData, setFormData]= useState(null);


    if(loading) return <Loading />

    const onSubmit= (data)=>{
        setFormData(data);
        console.log(data);
    }

    const handleOTPChange= (value)=>{
        setOtp(value);
    }

    const verifyOTP= async (e)=>{
        e.preventDefault();
        console.log("Verifying OTP: ", otp);
    }

  return (
    <div className="min-h-screen bg-[#f8f9fb] flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">

            {/* Welcome Div */}
            <div className="mb-6 text-center">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-blue-50 text-blue-600 text-xs font-semibold rounded-full border border-blue-100 mb-3 uppercase tracking-wider">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>
                    Join DevDash
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-1 tracking-tight">Create Account</h2>
                <p className="text-gray-400 text-sm">Sign up to start managing your projects</p>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm px-8 py-8">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">First Name</label>
                        <input type="text" {...register("firstName", {required: "First name is required"})} placeholder="Jane"
                        className="w-full px-3.5 py-2.5 text-sm text-gray-800 bg-gray-50 border border-gray-200 rounded-lg placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition" />
                        {errors.firstName && <p className="text-xs text-red-400">{errors.firstName.message}</p>}
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Last Name</label>
                        <input type="text" {...register("lastName", {required: "Last name is required"})} placeholder="Doe"
                        className="w-full px-3.5 py-2.5 text-sm text-gray-800 bg-gray-50 border border-gray-200 rounded-lg placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition" />
                        {errors.lastName && <p className="text-xs text-red-400">{errors.lastName.message}</p>}
                    </div>
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Username</label>
                        <input type="text" {...register("username", {required: "Username is required"})} placeholder="janedoe"
                        className="w-full px-3.5 py-2.5 text-sm text-gray-800 bg-gray-50 border border-gray-200 rounded-lg placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition" />
                        {errors.username && <p className="text-xs text-red-400">{errors.username.message}</p>}
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Email</label>
                        <input type="email" {...register("email" ,{required: "Email is required", pattern: {value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i, message: "Invalid email address"}})} placeholder="jane@example.com"
                        className="w-full px-3.5 py-2.5 text-sm text-gray-800 bg-gray-50 border border-gray-200 rounded-lg placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition" />
                        {errors.email && <p className="text-xs text-red-400">{errors.email.message}</p>}
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Password</label>
                        <div className="relative">
                        <input type={showPass? "text" : "password"} 
                        {...register("password", {required: "Password is required", minLength: {value: 6, message: "Password must be at least 6 characters"}})}
                        placeholder="••••••••"
                        className="w-full px-3.5 py-2.5 pr-10 text-sm text-gray-800 bg-gray-50 border border-gray-200 rounded-lg placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition" />
                        {errors.password && <p className="text-xs text-red-400">{errors.password.message}</p>}
                        <button type="button" onClick={() => setShowPass(!showPass)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-gray-400 hover:text-blue-500 transition">
                            {showPass ? "Hide" : "Show"}
                        </button>
                        </div>
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Confirm Password</label>
                        <div className="relative">
                        <input type={showPass? "text" : "password"} 
                        {...register("confirmPassword", {required: "Please confirm your password", validate: (value) => value === watch("password") || "Passwords do not match"})}
                        placeholder="••••••••"
                        className="w-full px-3.5 py-2.5 pr-10 text-sm text-gray-800 bg-gray-50 border border-gray-200 rounded-lg placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition" />
                        {errors.confirmPassword && <p className="text-xs text-red-400">{errors.confirmPassword.message}</p>}
                        <button type="button" onClick={() => setShowPass(!showPass)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-gray-400 hover:text-blue-500 transition">
                            {showPass ? "Hide" : "Show"}
                        </button>
                        </div>
                    </div>

                    <div className="pt-1">
                        <button type="submit"
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm py-2.5 rounded-lg transition-colors shadow-sm shadow-blue-100">
                            Sign Up
                        </button>
                    </div>
            </form>
            <div className="mt-5 text-center">
                <p className="text-xs text-gray-400">
                    Already have an Account?{' '}
                    <span onClick={()=> navigate('/login')}
                    className="text-blue-500 hover:text-blue-600 font-semibold cursor-pointer transition">
                        Login here.
                    </span>
                </p>
            </div>
            </div>
        </div>

        {/* Open OTP Model */}
        {openOtp && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/25 backdrop-blur-sm px-4"
            onClick={()=> setOpenOtp(false)}>
                <div className="w-full max-w-sm bg-white rounded-2xl border border-gray-200 shadow-lg p-7 space-y-5"
                onClick={(e)=> e.stopPropagation()}>
                    <div className="flex items-start justify-between">
                        <div>
                            <h2 className="text-base font-bold text-gray-900 tracking-tight">Verify your Email.</h2>
                            <p className="text-xs text-gray-400 mt-1">Enter the 6-digit OTP sent to your email.</p>
                        </div>
                        <button onClick={()=> setOpenOtp(false)}
                        className="p-1.5 text-gray-300 hover:text-gray-500 hover:bg-gray-100 rounded-lg transition">
                            <X size={14} strokeWidth={2} />
                        </button>
                    </div>

                    <form onSubmit={verifyOTP} className="space-y-4">
                        <OTP value={otp} onChange={handleOTPChange} />
                        <button type="submit"
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm py-2.5 rounded-lg transition-colors shadow-sm shadow-blue-100">
                            Verify & Create Account
                        </button>
                    </form>
                </div>
            </div>
        )}
    </div>
  )
}

export default SignupPage