'use client'

import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import Footer from './components/Footer';
import PDFViewer from './components/PDFViewer';
import Link from 'next/link';

export default function Home() {
  // PDF文件路径改为在线URL
  const pdfUrl = 'https://lucyai-1347723456.cos.ap-guangzhou.myqcloud.com/LucyAI%2020250327.pdf';
  
  // 模拟选项卡状态
  const [activeTab, setActiveTab] = useState('home');
  
  // 只针对顶部下拉刷新进行处理，允许页面内滚动
  useEffect(() => {
    const preventPullToRefresh = (e: TouchEvent) => {
      // 只有在顶部下拉时才阻止默认行为
      if (document.scrollingElement && document.scrollingElement.scrollTop <= 0) {
        // 检查是否是向下拖动(下拉刷新手势)
        if (e.touches && e.touches[0].clientY > 10) {
          e.preventDefault();
        }
      }
    };
    
    // 只监听document级别的touchmove，不阻止内部组件的滚动
    document.addEventListener('touchmove', preventPullToRefresh, { passive: false });
    
    return () => {
      document.removeEventListener('touchmove', preventPullToRefresh);
    };
  }, []);
  
  return (
    <main className="min-h-screen flex flex-col bg-gray-50 overflow-hidden max-w-screen">
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
      
      <section className="flex-grow container-section py-0 md:py-1 overflow-hidden w-full">
        <div className="pdf-container max-w-full mx-auto w-full overflow-hidden">
          <PDFViewer pdfUrl={pdfUrl} title="" longPageMode={true} />
        </div>
      </section>
      
      <Footer />
    </main>
  );
} 