import React from 'react'
import { useContext, useState } from 'react'
import { useForm } from 'react-hook-form'
import { AppContext } from '../../context/AppContext'
import { assets } from '../../assets/assets'
import Loading from '../../components/LoadingPage'

const LoginPage = () => {

    const {navigate}= useContext(AppContext)
    const [loading, setLoading]= useState(false);
    const { register, handleSubmit, formState: { errors }}= useForm();

    const [showPass, setShowPass]= useState(false);

    if(loading) return <Loading />

    const onSubmit= (data)=>{
        console.log(data);
    }
    
  return (
    <div>
        <div>
            {/* Welcome Div */}
            <div className="mb-8 text-center">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-indigo-100/80 text-indigo-700 text-xs font-bold rounded-full border border-indigo-200/50 mb-3 uppercase tracking-wider">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"></span>
                    Welcome Back
                </div>
                <h2 className="text-2xl font-extrabold text-gray-900 mb-1">Login to DevDash</h2>
                <p className="text-gray-500 text-sm">Enter your credentials to continue</p>
            </div>
            <form onSubmit= {handleSubmit(onSubmit)}>
                <div>
                    <label>Username Or Email</label>
                    <input type="text" {...register("loginCredential", {required: "Username or Email is required"})} placeHolder="Enter your username or email" />
                    {errors.loginCredential && <p>{errors.loginCredential.message}</p>}
                </div>
                <div>
                    <label>Password</label>
                    <input type={showPass ? "text" : "password"} {...register("password", {required: "Password is required"})} placeHolder="Enter your password" />
                    <button onClick={()=> setShowPass(!showPass)} type="button" className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer opacity-60 hover:opacity-100 transition-opacity">{showPass ? <img src={assets.close_eye_icon || "Hide"} alt="" className="w-5 h-5" /> : <img src={assets.open_eye_icon || "Show"} alt="" className="w-5 h-5" />}</button>
                    {errors.password && <p>{errors.password.message}</p>}
                </div>
                
                <div>
                    <p onClick={()=>navigate('/forget-password')}>Forgot password?</p>
                </div>
                <div>
                    <button type="submit">Login</button>
                </div>
            </form>
            <button onClick={()=> navigate("/signup")}>Don't have an account ? Sign Up</button>
        </div>
    </div>
  )
}

export default LoginPage