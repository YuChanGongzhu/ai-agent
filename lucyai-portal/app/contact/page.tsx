'use client'

import React from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';

export default function Contact() {
  // 使用图片URL代替PDF
  const imageUrl = 'https://lucyai-1347723456.cos.ap-guangzhou.myqcloud.com/aboutus.png';
  
  return (
    <main className="min-h-screen flex flex-col">
      <Header />
      
      <section className="flex-grow container-section py-10">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">联系我们</h1>
          <p className="text-gray-600">
            有任何问题或需求，欢迎随时联系我们
          </p>
        </div>
        
        <div className="image-container bg-white rounded-lg shadow-md p-1 md:p-4 text-center">
          <img 
            src={imageUrl} 
            alt="联系LucyAI" 
            className="max-w-full h-auto mx-auto rounded"
          />
        </div>
      </section>
      
      <Footer />
    </main>
  );
} 