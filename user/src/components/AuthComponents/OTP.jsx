import React, { useEffect, useRef } from 'react';

const OTP = ({ value = '', onChange = () => {} }) => {

    const inputRefs = useRef([]);

    const otpValue = value.slice(0, 6);

    const updateOTP = (otp) => {
        onChange(otp.slice(0, 6));
    };

    // Handle typing
    const handleChange = (e, index) => {
        const digit = e.target.value.replace(/\D/g, '').slice(-1);

        const otp = Array.from({ length: 6 }, (_, i) => otpValue[i] || '');
        otp[index] = digit;

        updateOTP(otp.join(''));

        // Move forward only if digit entered
        if (digit && index < 5) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    // Handle backspace properly
    const handleKeyDown = (e, index) => {
        if (e.key === 'Backspace') {
            const otp = Array.from({ length: 6 }, (_, i) => otpValue[i] || '');

            if (otp[index]) {
                // Clear current box
                otp[index] = '';
                updateOTP(otp.join(''));
            } else if (index > 0) {
                // Move back
                inputRefs.current[index - 1]?.focus();
            }
        }

        // Optional: arrow navigation (pro UX)
        if (e.key === 'ArrowLeft' && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
        if (e.key === 'ArrowRight' && index < 5) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    // Handle paste
    const handlePaste = (e) => {
        e.preventDefault();

        const pasted = e.clipboardData
            .getData('text')
            .replace(/\D/g, '')
            .slice(0, 6);

        updateOTP(pasted);

        // Ensure focus after render
        setTimeout(() => {
            inputRefs.current[Math.min(pasted.length, 5)]?.focus();
        }, 0);
    };

    // Focus first input on mount
    useEffect(() => {
        inputRefs.current[0]?.focus();
    }, []);

    return (
        <div className="flex gap-3">
            {[...Array(6)].map((_, index) => (
                <input
                    key={index}
                    type="text"
                    value={otpValue[index] || ''}
                    maxLength={1}
                    ref={(el) => {
                        if (el) inputRefs.current[index] = el;
                    }}
                    onChange={(e) => handleChange(e, index)}
                    onKeyDown={(e) => handleKeyDown(e, index)}
                    onPaste={handlePaste}
                    inputMode="numeric"
                    pattern="[0-9]*"
                    aria-label={`OTP digit ${index + 1}`}
                    autoComplete="one-time-code"
                    className="w-12 h-14 text-center text-xl font-bold border-2 border-gray-300 rounded-xl outline-none bg-gray-50 text-gray-800 caret-indigo-500 transition-all duration-200 focus:border-indigo-500 focus:bg-white focus:shadow-md focus:shadow-indigo-200 focus:scale-105 hover:border-gray-400"
                />
            ))}
        </div>
    );
};

export default OTP;