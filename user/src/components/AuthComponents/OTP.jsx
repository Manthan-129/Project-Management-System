import React, {useRef} from 'react'

const OTP = ({value, onChange}) => {

    const inputRefs= useRef([]);

    const updateOTP = (otp)=> onChange(otp.slice(0,6));

    const handleChange= (e, index)=>{
        const digit= e.target.value.replace(/\D/g,"");
        const otp = value.split("");

        otp[index]= digit;
        updateOTP(otp.join(""));

        digit && inputRefs.current[index + 1]?.focus();
    }

    const handleBackspace= (e, index)=>{
        if(e.key === 'Backspace' &&  index > 0 && !value[index]){
            inputRefs.current[index - 1]?.focus();
        }
    }

    const handlePaste = (e) => {
        e.preventDefault();
        const otp = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
        updateOTP(otp);
        inputRefs.current[otp.length - 1]?.focus();
    }

  return (
    <div className="flex gap-3">
        {[...Array(6)].map((_,index)=>(
            <input key={index} type="text" required 
            value={value[index] || ''}
            maxLength= {1}
            ref={(e)=> inputRefs.current[index] = e}
            onChange= {(e)=> handleChange(e, index)}
            onKeyDown= {(e)=> handleBackspace(e, index)}
            onPaste= {handlePaste}
            autoComplete= "off"
            className="w-12 h-14 text-center text-xl font-bold border-2 border-gray-300 rounded-xl outline-none bg-gray-50 text-gray-800 caret-indigo-500 transition-all duration-200 focus:border-indigo-500 focus:bg-white focus:shadow-md focus:shadow-indigo-200 focus:scale-105 hover:border-gray-400"
            />
        ))}
    </div>
  )
}

export default OTP