import React, { useEffect, useRef } from 'react'

const OTP = ({ value = '', onChange = () => {} }) => {

    const inputRefs= useRef([]);

    const otpValue = value.slice(0, 6);

    const updateOTP = (otp)=> onChange(otp.slice(0,6));

    const handleChange= (e, index)=>{
        const digit= e.target.value.replace(/\D/g,"").slice(-1);
        const otp = Array.from({ length: 6 }, (_, otpIndex) => otpValue[otpIndex] || '');

        otp[index]= digit;
        updateOTP(otp.join(""));

        digit && inputRefs.current[index + 1]?.focus();
    }

    const handleBackspace= (e, index)=>{
        if(e.key === 'Backspace' && index > 0 && !otpValue[index]){
            inputRefs.current[index - 1]?.focus();
        }
    }

    const handlePaste = (e) => {
        e.preventDefault();
        const otp = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
        updateOTP(otp);
        inputRefs.current[Math.min(otp.length, 5)]?.focus();
    }

    useEffect(() => {
        if (inputRefs.current[0] && !otpValue) {
            inputRefs.current[0].focus();
        }
    }, [otpValue])

  return (
    <div className="flex gap-3">
        {[...Array(6)].map((_,index)=>(
            <input key={index} type="text" required 
            value={otpValue[index] || ''}
            maxLength= {1}
            ref={(e)=> inputRefs.current[index] = e}
            onChange= {(e)=> handleChange(e, index)}
            onKeyDown= {(e)=> handleBackspace(e, index)}
            onPaste= {handlePaste}
            inputMode="numeric"
            pattern="[0-9]*"
            aria-label={`OTP digit ${index + 1}`}
            autoComplete= "off"
            className="w-12 h-14 text-center text-xl font-bold border-2 border-gray-300 rounded-xl outline-none bg-gray-50 text-gray-800 caret-indigo-500 transition-all duration-200 focus:border-indigo-500 focus:bg-white focus:shadow-md focus:shadow-indigo-200 focus:scale-105 hover:border-gray-400"
            />
        ))}
    </div>
  )
}

export default OTP