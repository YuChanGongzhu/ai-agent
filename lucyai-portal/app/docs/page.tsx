'use client'

import React from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';

export default function Docs() {
  // 使用在线PDF链接
  const pdfUrl = 'https://lucyai-1347723456.cos.ap-guangzhou.myqcloud.com/LucyAI%2020250327.pdf';
  
  return (
    <main className="min-h-screen flex flex-col">
      <Header />
      
      <section className="flex-grow container-section py-10">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">文档中心</h1>
          <p className="text-gray-600">
            了解 LucyAI 智能客服系统的详细信息
          </p>
        </div>
        
        <div className="pdf-container bg-white rounded-lg shadow-md p-1 md:p-2">
          <object
            data={pdfUrl}
            type="application/pdf"
            className="w-full h-[calc(100vh-250px)]"
          >
            <p className="text-center py-4">您的浏览器无法显示PDF，<a href={pdfUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">点击下载</a></p>
          </object>
        </div>
      </section>
      
      <Footer />
    </main>
  );
} 