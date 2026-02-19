'use client';

import { useMutation } from '@tanstack/react-query';
import axios, { AxiosError } from 'axios';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React, { useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';

type FormData = {
  email: string;
  password: string;
};

const ForgotPassword = () => {
  const [step, setStep] = useState<'email' | 'otp' | 'reset'>('email');
  const [otp, setOtp] = useState(['', '', '', '']);
  const [userEmail, setUserEmail] = useState<string | null>(null); // true for email, false for phone
  const [timer, setTimer] = useState(60);
  const [canResend, setCanResend] = useState(true);
  const [serverError, setServerError] = useState<string | null>(null);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>();

  //   const loginMutation = useMutation({
  //     mutationFn: async (data: FormData) => {
  //       const response = await axios.post(
  //         `${process.env.NEXT_PUBLIC_SERVER_URI}/auth/api/v1/login`,
  //         data,
  //         {withCredentials: true} // include cookies in the request -> else cookie-parser in backend won't be able to read the cookie and thus won't set the user in req.user, causing auth middleware to fail and return 401 unauthorized
  //       );
  //       return response.data;
  //     },
  //     onSuccess: (data) => {
  //       setServerError(null);
  //       // Redirect to home page or dashboard after successful login
  //       router.push('/');
  //     },
  //     onError: (error: AxiosError) => {
  //       const errorMessage = (error.response?.data as {message?:string})?.message || "Invalid credentials";
  //       setServerError(errorMessage);
  //     }
  //   })

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

  const requestOtpMutation = useMutation({
    mutationFn: async (email: string) => {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_SERVER_URI}/auth/api/v1/forgot-password`,
        { email },
      );
      return response.data;
    },
    onSuccess: (_, email) => {
      setUserEmail(email);
      setServerError(null);
      setStep('otp');
      setCanResend(false);
      setTimer(60);
      startResendTimer();
    },
    onError: (error: AxiosError) => {
      const errorMessage =
        (error.response?.data as { message?: string })?.message ||
        'Invalid Otp. Try again later.';
      setServerError(errorMessage);
    },
  });

  const verifyOtpMutation = useMutation({
    mutationFn: async () => {
      if (!userEmail) return;
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_SERVER_URI}/auth/api/v1/verify`,
        {
          email: userEmail,
          otp: otp.join(''),
        },
      );
      return response.data;
    },
    onSuccess: () => {
      setServerError(null);
      setStep('reset');
    },
    onError: (error: AxiosError) => {
      const errorMessage =
        (error.response?.data as { message?: string })?.message ||
        'Invalid Otp. Try again later.';
      setServerError(errorMessage);
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: async ({ password }: { password: string }) => {
      if (!password) return;
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_SERVER_URI}/auth/api/v1/reset-password`,
        {
          email: userEmail,
          newPassword: password,
        },
      );
      return response.data;
    },
    onSuccess: () => {
      setStep('email');
      toast.success(
        'Password reset successful. Please login with your new password.',
      );
      setServerError(null);
      router.push('/login');
    },
    onError: (error: AxiosError) => {
      const errorMessage =
        (error.response?.data as { message?: string })?.message ||
        'Failed to reset password. Try again later.';
      setServerError(errorMessage);
    },
  });

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

  const onSubmitEmail = ({ email }: { email: string }) => {
    requestOtpMutation.mutate(email);
  };

  const onSubmitPassword = ({ password }: { password: string }) => {
    resetPasswordMutation.mutate({ password });
  };


  return (
    <div className="w-full pt-10 pb-20 min-h-[85vh] bg-gray-100">
      <h1 className="text-4xl font-Poppins font-semibold text-black text-center">
        Forgot Password
      </h1>
      <p className="text-center font-medium py-3 text-[#00000099] text-lg">
        Home . Forgot-password
      </p>

      <div className="w-full flex justify-center">
        <div className="md:w-[480px] p-8 bg-white shadow rounded-lg">
          {step === 'email' && (
            <>
              <h3 className="text-3xl font-semibold text-center mb-2">
                Login to Eshop
              </h3>
              <p className="text-center text-[#00000099] mb-4">
                Go back to Login?
                <Link href="/login" className="text-blue-500 ml-1">
                  Login
                </Link>
              </p>

              {/* FORM */}
              <form onSubmit={handleSubmit(onSubmitEmail)}>
                <label className="block text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  placeholder="support@eshop.com"
                  className="w-full p-2 border border-gray-300 outline-0 !rounded mb-1"
                  {...register('email', {
                    required: 'Email is required',
                    pattern: {
                      value:
                        /^[a-zA-Z0-9._%-+]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/,
                      message: 'Invalid email address',
                    },
                  })}
                />
                {errors.email && (
                  <p className="text-red-500 text-sm">
                    {String(errors.email.message)}
                  </p>
                )}

                {/* <label className="block text-gray-700 mt-2 mb-1">Password</label>
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
            <div className="flex justify-between items-center my-4">
              <label className="flex items-center text-gray-600">
                <input
                  type="checkbox"
                  className="mr-2"
                  checked={rememberMe}
                  onChange={() => setRememberMe(!rememberMe)}
                />
                Remember Me
              </label>
              <Link href={'/forgot-password'} className="text-blue-500 text-sm">
                Forgot Password?
              </Link>
            </div> */}

                <button
                  type="submit"
                  disabled={requestOtpMutation.isPending}
                  className="w-full bg-black text-white py-2 rounded-lg cursor-pointer mb-2 mt-4"
                >
                  {requestOtpMutation.isPending ? 'Sending OTP...' : 'Submit'}
                </button>

                {serverError && (
                  <p className="text-red-500 text-sm mt-2 text-center">
                    {serverError}
                  </p>
                )}
              </form>
            </>
          )}

          {step === 'otp' && (
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
                disabled={verifyOtpMutation.isPending}
                onClick={() => verifyOtpMutation.mutate()}
                className="w-full mt-4 text-lg cursor-pointer bg-blue-500 text-white py-2 rounded-lg"
              >
                {verifyOtpMutation.isPending ? 'Verifying...' : 'Verify OTP'}
              </button>
              {canResend ? (
                <button
                  onClick={() => requestOtpMutation.mutate(userEmail!)}
                  className="text-blue-500 cursor-pointer mt-4"
                >
                  Resend OTP
                </button>
              ) : (
                <p className="text-center text-sm mt-4">
                  Resend OTP in {timer}s
                </p>
              )}

              {serverError && (
                <div className="text-red-500 text-sm mt-2 text-center">
                  {serverError}
                </div>
              )}
            </div>
          )}

          {step === 'reset' && (
            <>
              <h3 className="text-xl font-semibold text-center mb-4">
                Reset Password
              </h3>
              <form onSubmit={handleSubmit(onSubmitPassword)}>
                <label className="block text-gray-700 mb-1">New Password</label>
                <input
                  type="password"
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
                {errors.password && (
                  <p className="text-red-500 text-sm">
                    {String(errors.password.message)}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={resetPasswordMutation.isPending}
                  className="w-full bg-black text-white py-2 rounded-lg cursor-pointer mb-2 mt-4"
                >
                  {resetPasswordMutation.isPending
                    ? 'Resetting...'
                    : 'Reset Password'}
                </button>

                {serverError && (
                  <p className="text-red-500 text-sm mt-2 text-center">
                    {serverError}
                  </p>
                )}
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
