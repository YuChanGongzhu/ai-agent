'use client'

import React from 'react';
import Header from './components/Header';
import Footer from './components/Footer';

export default function Home() {
  // 定义PDF URL
  const pdfUrl = 'https://lucyai-1347723456.cos.ap-guangzhou.myqcloud.com/LucyAI%2020250327.pdf';
  // 完整的PDF查看器URL（包括PDF URL作为参数）
  const pdfViewerUrl = `/pdfviewer.html?file=${encodeURIComponent(pdfUrl)}`;
  
  return (
    <main className="min-h-screen flex flex-col">
      <Header />
      
      <section className="flex-grow container-section py-10">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">欢迎来到 LucyAI</h1>
          <p className="text-gray-600">
            使用最先进的 AI 技术助力您的业务增长
          </p>
        </div>
        
        <div className="pdf-container bg-white rounded-lg shadow-md p-1 md:p-2">
          <iframe
            src={pdfViewerUrl}
            className="w-full h-[calc(100vh-250px)]"
            frameBorder="0"
            allowFullScreen
          ></iframe>
          <div className="text-center py-2 text-sm">
            如果无法查看PDF，请<a href={pdfUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">点击此处下载</a>
          </div>
        </div>
      </section>
      
      <Footer />
    </main>
  );
} 