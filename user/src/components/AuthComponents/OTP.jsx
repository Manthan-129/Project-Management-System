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
        <div className="flex justify-center gap-3">
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
                    className="h-14 w-12 rounded-2xl border border-slate-200 bg-slate-50 text-center text-xl font-black tracking-widest text-slate-900 outline-none transition-all duration-200 placeholder:text-slate-300 focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-100 focus:scale-[1.03] hover:border-slate-300"
                />
            ))}
        </div>
    );
};

export default OTP;