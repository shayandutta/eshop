'use client';
import GoogleButton from '@/shared/components/google-button';
import { useMutation } from '@tanstack/react-query';
import { Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React, { useRef, useState } from 'react';
import { set, useForm } from 'react-hook-form';
import axios, { AxiosError } from 'axios';

type FormData = {
  name: string;
  email: string;
  password: string;
};

const SignUp = () => {
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [showOtp, setShowOtp] = useState(false);
  const [canResend, setCanResend] = useState(true);
  const [timer, setTimer] = useState(60);
  const [otp, setOtp] = useState(['', '', '', '']);
  const [userData, setUserData] = useState<FormData | null>(null);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>();

  const startResendTimer = () => {
    const interval = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setCanResend(true);
          return 0; // reset timer for next time
        }
        return prev - 1;
      });
    }, 1000);
  };

  const signupMutation = useMutation({
    mutationFn: async (data: FormData) => {
      // Backend exposes the register route at POST /api/v1/register
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_SERVER_URI}/auth/api/v1/register`,
        data,
      );
      return response.data;
    },
    onSuccess: (_, formData) => {
      setUserData(formData); // Store form data to use after OTP verification
      setShowOtp(true);
      setCanResend(false);
      setTimer(60);
      startResendTimer();
    },
  });

  const verifyOtpMutation = useMutation({
    mutationFn: async () => {
      if(!userData) return;
      const response = await axios.post(`${process.env.NEXT_PUBLIC_SERVER_URI}/auth/api/v1/verify`, {
        ...userData,
        otp: otp.join(''),
      })
      return response.data;
    },
    onSuccess: () => {
      router.push('/login');  //after verification redirect to login page
    }
  })

  const onSubmit = (data: FormData) => {
    // console.log('Form Data:', data);
    signupMutation.mutate(data);
  };

  const handleOtpChange = (index: number, value: string) => {
    // Allow empty string so Backspace can clear the input when user deletes
    if (value === '') {
      const newOtp = [...otp];
      newOtp[index] = '';
      setOtp(newOtp);
      return;
    }
    // Accept only a single digit (handle paste by taking last digit)
    const lastChar = value.slice(-1);
    if (!/^[0-9]$/.test(lastChar)) return;

    const newOtp = [...otp];
    newOtp[index] = lastChar;
    setOtp(newOtp);
    // Move focus to next input after a valid digit
    if (index < inputRefs.current.length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const resendOtp = () => {};

  return (
    <div className="w-full pt-10 pb-20 min-h-[85vh] bg-gray-100">
      <h1 className="text-4xl font-Poppins font-semibold text-black text-center">
        Sign Up
      </h1>
      <p className="text-center font-medium py-3 text-[#00000099] text-lg">
        Home . Sign Up
      </p>

      <div className="w-full flex justify-center">
        <div className="md:w-[480px] p-8 bg-white shadow rounded-lg">
          <h3 className="text-3xl font-semibold text-center mb-2">
            Signup to Eshop
          </h3>
          <p className="text-center text-[#00000099] mb-4">
            Already have an account?
            <Link href="/login" className="text-blue-500 ml-1">
              Login
            </Link>
          </p>
          <GoogleButton />
          <div className="flex items-center my-5 text-gray-400 text-sm">
            <div className="flex-1 border-t border-gray-300" />
            <span className="px-4">or Sign Up with Email</span>
            <div className="flex-1 border-t border-gray-300" />
          </div>

          {/* otp based dynamic rendering */}
          {!showOtp ? (
            <form onSubmit={handleSubmit(onSubmit)}>
              <label className="block text-gray-700 mb-1">Name</label>
              <input
                type="text"
                placeholder="Enter your name"
                className="w-full p-2 border border-gray-300 outline-0 !rounded mb-1"
                {...register('name', {
                  required: 'Name is required',
                })}
              />

              <label className="block text-gray-700 mb-1 mt-1">Email</label>
              <input
                type="email"
                placeholder="support@eshop.com"
                className="w-full p-2 border border-gray-300 outline-0 !rounded mb-1"
                {...register('email', {
                  required: 'Email is required',
                  pattern: {
                    value: /^[a-zA-Z0-9._%-+]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/,
                    message: 'Invalid email address',
                  },
                })}
              />
              {errors.email && (
                <p className="text-red-500 text-sm">
                  {String(errors.email.message)}
                </p>
              )}

              <label className="block text-gray-700 mt-1 mb-1">Password</label>
              <div className="relative">
                <input
                  type={passwordVisible ? 'text' : 'password'}
                  placeholder="Min. 6 characters"
                  className="w-full p-2 border border-gray-300 outline-0 !rounded mb-1"
                  {...register('password', {
                    required: 'password is required',
                    minLength: {
                      value: 6,
                      message: 'Password must be at least 6 characters',
                    },
                  })}
                />
                <button
                  type="button"
                  onClick={() => setPasswordVisible(!passwordVisible)}
                  className="absolute inset-y-0 right-3 flex items-center  text-gray-400"
                >
                  {passwordVisible ? <Eye /> : <EyeOff />}
                </button>
                {errors.password && (
                  <p className="text-red-500 text-sm">
                    {String(errors.password.message)}
                  </p>
                )}
              </div>
              <button
                type="submit"
                disabled={signupMutation.isPending}
                className="w-full bg-black text-white py-2 rounded-lg cursor-pointer mb-2 mt-4"
              >
                {signupMutation.isPending ? "Signing Up..." : "Sign Up"}  {/*  DIFINING THE LOADING STATE OF THE SIGNUP BUTTON BASED ON THE MUTATION STATUS */}
              </button>
                {signupMutation?.isError && 
                signupMutation.error instanceof AxiosError && (
                  <p className='text-red-500 text-sm mt-2'>
                    {signupMutation.error.response?.data?.message || signupMutation.error.message || "An error occurred during signup"}
                  </p>
                )
              }
            </form>
          ) : (
            <div>
              <h3 className="text-xl font-semibold text-center mb-4">
                Enter Otp
              </h3>
              <div className="flex justify-center gap-6">
                {otp?.map((digit, index) => (
                  <input
                    key={index}
                    type="text"
                    ref={(el) => {
                      if (el) inputRefs.current[index] = el;
                    }}
                    maxLength={1}
                    className="w-12 h-12 text-center border border-gray-300 outline-none !rounded"
                    value={digit}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(index, e)}
                  />
                ))}
              </div>
              <button 
              disabled = {verifyOtpMutation.isPending}
              onClick={() => verifyOtpMutation.mutate()}
              className="w-full mt-4 text-lg cursor-pointer bg-blue-500 text-white py-2 rounded-lg">
                {verifyOtpMutation.isPending ? "Verifying..." : "Verify OTP"}
              </button>
               {signupMutation?.isError && 
                signupMutation.error instanceof AxiosError && (
                  <p className='text-red-500 text-sm mt-2'>
                    {signupMutation.error.response?.data?.message || signupMutation.error.message || "An error occurred during signup"}
                  </p>
                )
              }
              <p className="text-center text-sm mt-4">
                {canResend ? (
                  <button
                    onClick={resendOtp}
                    className="text-blue-500 cursor-pointer"
                  >
                    Resend OTP
                  </button>
                ) : (
                  `Resend OTP in ${timer}s`
                )}
              </p>
              {
                verifyOtpMutation?.isError && 
                verifyOtpMutation.error instanceof AxiosError && (
                  <p className='text-red-500 text-sm mt-2'>
                    {verifyOtpMutation.error.response?.data?.message || verifyOtpMutation.error.message || "An error occurred while verifying OTP"}
                  </p>
                )
              }
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SignUp;
