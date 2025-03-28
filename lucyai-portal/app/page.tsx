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
          <iframe 
            src={pdfUrl}
            className="w-full h-[calc(100vh-120px)] border-none" 
            title="LucyAI PDF文档"
            loading="eager"
          ></iframe>
        </div>
      </section>
      
      <Footer />
    </main>
  );
} 