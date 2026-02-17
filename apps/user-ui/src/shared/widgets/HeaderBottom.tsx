'use client';

import { navItems } from '@/configs/constants';
import {
  AlignLeft,
  ChevronDown,
  HeartIcon,
  ShoppingCart,
  User,
} from 'lucide-react';
import Link from 'next/link';
import React, { useEffect, useState } from 'react';

const HeaderBottom = () => {
  const [show, setShow] = useState(false);
  const [isSticky, setIsSticky] = useState(false);

  //need to make a useEffect hook for `tracking the scroll postition`
  //whenever someone scrolls, browser please run the handleScroll function and check if the scrollY position is greater than 100px, if it is then make the header sticky by setting the state to true, otherwise set it to false
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 100) {
        setIsSticky(true);
      } else {
        setIsSticky(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return (
    <div
      className={`w-full transition-all duration-300 ${isSticky ? 'fixed top-0 left-0 z-[100] bg-white shadow-lg' : 'relative'}`}
    >
      <div
        className={`w-[80%] relative m-auto flex items-center justify-between ${isSticky ? ' pt-2 pb-2' : 'py-0'}`}
      >
        {/* ALL DROPDOWNS */}
        <div
          className={`w-[260px] ${isSticky && '-mb-4'} cursor-pointer flex items-center justify-between px-5 h-[50px] bg-[#3489ff]`}
          onClick={() => setShow(!show)}
        >
          <div className="flex items-center gap-2">
            <AlignLeft color="white" />
            <span className="text-white font-md">All Departments</span>
          </div>
          <ChevronDown color="white" />
        </div>

        {/* DROPDOWN MENU */}
        {show && (
          <div
            className={`absolute left-0 ${isSticky ? 'top-[70px]' : 'top-[50px]'} w-[260px] h-[400px] bg-[#f5f5f5] shadow-lg`}
          ></div>
        )}

        {/* NAVIGATION LINKS */}
        <div className="flex items-center">
          {navItems.map((i: NavItemsTypes, index: number) => (
            <Link
              className="px-5 font-medium text-lg"
              href={i.href}
              key={index}
            >
              {i.title}
            </Link>
          ))}
        </div>

          {/* when sticky, view the user profile also in the sticky bar */}
        <div>
          {isSticky && (
            <div className="flex items-center gap-8">
              <div className="flex items-center gap-2 cursor-pointer">
                <Link
                  href={'/login'}
                  className="border-2 w-[50px] h-[50px] flex items-center justify-center rounded-full border-gray-300"
                >
                  <User className="w-6 h-6" />
                </Link>

                <Link href={'/login'}>
                  <span className="block font-medium">Hello, </span>
                  <span className="font-semibold">Sign In</span>
                </Link>
              </div>
              <div className="flex items-center gap-5">
                <Link href={'/wishlist'} className="relative">
                  <HeartIcon />
                  <div className="w-6 h-6 border-2 border-white bg-red-500 rounded-full flex items-center justify-center absolute top-[-10px] right-[-10px]">
                    <span className="font-medium text-sm text-white">0</span>
                  </div>
                </Link>
                <Link href={'/cart'} className="relative">
                  <ShoppingCart />
                  <div className="w-6 h-6 border-2 border-white bg-red-500 rounded-full flex items-center justify-center absolute top-[-10px] right-[-10px]">
                    <span className="font-medium text-sm text-white">9</span>
                  </div>
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HeaderBottom;
