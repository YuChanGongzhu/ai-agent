'use client'

import React from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import PDFViewer from '../components/PDFViewer';

export default function Contact() {
  // 使用在线PDF链接
  const pdfUrl = 'https://lucyai-1347723456.cos.ap-guangzhou.myqcloud.com/LucyAI%2020250327.pdf';
  
  return (
    <main className="min-h-screen flex flex-col">
      <Header />
      
      <section className="flex-grow container-section py-10">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">联系我们</h1>
          <p className="text-gray-600">
            获取 LucyAI 的联系方式和咨询信息
          </p>
        </div>
        
        <div className="pdf-container">
          <PDFViewer pdfUrl={pdfUrl} title="LucyAI 联系方式" />
        </div>
      </section>
      
      <Footer />
    </main>
  );
} 