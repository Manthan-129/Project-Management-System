import React from 'react'
import {useState, useContext} from 'react'
import { useForm } from 'react-hook-form'
import { AppContext } from '../../context/AppContext'
import { assets } from '../../assets/assets'
import Loading from '../../components/LoadingPage'
import OTP from '../../components/AuthComponents/OTP'
import { X } from 'lucide-react'

const ForgetPassword = () => {

    const {navigate }= useContext(AppContext);

    const [showPass, setShowPass]= useState(false);

    const [email, setEmail]= useState('');
    const [openOtp, setOpenOtp]= useState(false);
    const [otp,setOtp]= useState('');
    
    const [pass, setPass]= useState('');
    const [confirmPass, setConfirmPass]= useState('');


    const handleOTPChange= (value)=>{
        setOtp(value);
    }
    
  return (
    <div>
        <div>
            <div>
                <div><span>Account Recovery</span></div>
                <h1>Reset Password</h1>
                <p>Enter your email address and we'll send you a OTP to reset your password.</p>
            </div>
            <form>
                <input type="email" placeholder="Enter your email" value={email} onChange={(e)=> setEmail(e.target.value)} required/>
                <button type='submit'>Send OTP</button>
            </form>
            <div><span onClick={()=> navigate('/login')}>Back to Login</span></div>
        </div>

        {/* Open OTP Page */}
        {openOtp && (
            <div onClick={()=> setOpenOtp(false)}>
                <div onClick={(e)=> e.stopPropagation()}>
                    <div>   
                        <div>
                            <h2 className="text-lg font-bold text-gray-900">Reset Your Password</h2>
                            <p className="text-xs text-gray-500 mt-0.5">Enter the OTP and your new password</p>
                        </div>
                        <button onClick={()=> setOpenOtp(false)}><X size={14} strokeWidth={2}/></button>
                    </div>
                    <form>
                        <div>
                            <label>OTP Code</label>
                            <OTP value={otp} onChange={handleOTPChange}></OTP>
                        </div>
                        <div>
                            <label>New Password</label>
                            <input type={showPass ? "text" : "password"} placeholder="Enter your new password" value={pass} onChange={(e)=> setPass(e.target.value)} required minLength={6}/>
                            <button type="button" onClick={() => setShowPass(!showPass)}>
                            {showPass ? "Hide" : "Show"}
                        </button>
                        </div>
                        <div>
                            <label>Confirm Password</label>
                            <input type={showPass ? "text" : "password"} placeholder="Confirm your new password" value={confirmPass} onChange={(e)=> setConfirmPass(e.target.value)} required minLength={6}/>
                            <button type="button" onClick={() => setShowPass(!showPass)}>
                            {showPass ? "Hide" : "Show"}
                        </button>
                        </div>
                        <div>
                            <button type="submit" disabled={otp.length !== 6}>Reset Password</button>
                        </div>
                    </form>
                </div>
            </div>
        )}
    </div>
  )
}

export default ForgetPassword