'use client'

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const Header = () => {
  const pathname = usePathname();
  const adminUrl = process.env.NEXT_PUBLIC_ADMIN_URL || 'https://lucyai.sale';
  
  return (
    <div className="bg-gradient-to-r from-[#5c3eb2] via-[#6a5abe] to-[#4b34a7] shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-2 sm:px-3">
        <div className="flex items-center justify-between h-14">
          {/* Logo */}
          <div className="flex-shrink-0 flex items-center">
            <Link href="/" className="flex items-center">
              <span className="text-lg font-bold text-white">LucyAI</span>
            </Link>
          </div>
          
          {/* 导航选项卡 */}
          <div className="hidden md:flex flex-1 justify-center ml-4">
            <div className="nav-tabs">
              <Link href="/" className={`nav-tab ${pathname === '/' ? 'nav-tab-active' : ''}`}>
                首页
              </Link>
              <Link href="/about" className={`nav-tab ${pathname === '/about' ? 'nav-tab-active' : ''}`}>
                关于我们
              </Link>
              <Link href="/contact" className={`nav-tab ${pathname === '/contact' ? 'nav-tab-active' : ''}`}>
                联系我们
              </Link>
            </div>
          </div>
          
          {/* 登录按钮 */}
          <div className="flex items-center">
            <a
              href={adminUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="py-1 px-3 bg-white text-[#5c3eb2] text-sm font-semibold rounded shadow-sm hover:bg-gray-100 transition duration-300"
            >
              登录控制台
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Header; 