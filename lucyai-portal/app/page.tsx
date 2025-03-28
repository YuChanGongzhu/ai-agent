'use client'

import React from 'react';
import Header from './components/Header';
import Footer from './components/Footer';

export default function Home() {
  // 在线PDF链接
  const pdfUrl = 'https://lucyai-1347723456.cos.ap-guangzhou.myqcloud.com/LucyAI%2020250327.pdf';
  
  return (
    <main className="min-h-screen flex flex-col bg-gray-50 overflow-hidden max-w-screen">
      <Header />
      
      <section className="flex-grow container-section py-0 md:py-1 overflow-hidden w-full">
        <div className="pdf-container max-w-full mx-auto w-full overflow-hidden bg-white rounded-lg shadow-md p-1 md:p-2">
          <object
            data={pdfUrl}
            type="application/pdf"
            className="w-full h-[calc(100vh-120px)]"
          >
            <p className="text-center py-4">您的浏览器无法显示PDF，<a href={pdfUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">点击下载</a></p>
          </object>
        </div>
      </section>
      
      <Footer />
    </main>
  );
} 