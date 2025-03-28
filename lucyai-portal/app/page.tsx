'use client'

import React, { useState } from 'react';
import Header from './components/Header';
import Footer from './components/Footer';
import PDFViewer from './components/PDFViewer';
import Link from 'next/link';

export default function Home() {
  // PDF文件路径
  const pdfPath = '/pdfs/LucyAI 20250327.pdf';
  
  // 模拟选项卡状态
  const [activeTab, setActiveTab] = useState('home');
  
  return (
    <main className="min-h-screen flex flex-col bg-gray-50">
      {/* 单行导航区域 */}
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
                <Link href="/" className={`nav-tab ${activeTab === 'home' ? 'nav-tab-active' : ''}`}>
                  首页
                </Link>
                <Link href="/about" className={`nav-tab ${activeTab === 'about' ? 'nav-tab-active' : ''}`}>
                  关于我们
                </Link>
                <Link href="/solutions" className={`nav-tab ${activeTab === 'solutions' ? 'nav-tab-active' : ''}`}>
                  解决方案
                </Link>
                <Link href="/docs" className={`nav-tab ${activeTab === 'docs' ? 'nav-tab-active' : ''}`}>
                  文档中心
                </Link>
                <Link href="/contact" className={`nav-tab ${activeTab === 'contact' ? 'nav-tab-active' : ''}`}>
                  联系我们
                </Link>
              </div>
            </div>
            
            {/* 登录按钮 */}
            <div className="flex items-center">
              <a
                href={process.env.NEXT_PUBLIC_ADMIN_URL || 'https://lucyai.sale'}
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
      
      <section className="flex-grow container-section py-0 md:py-1">
        <div className="pdf-container max-w-6xl mx-auto touch-none">
          <PDFViewer pdfUrl={pdfPath} title="" longPageMode={true} />
        </div>
      </section>
      
      <Footer />
    </main>
  );
} 