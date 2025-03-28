'use client'

import React from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import PDFViewer from '../components/PDFViewer';

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
        
        <div className="pdf-container">
          <PDFViewer pdfUrl={pdfUrl} title="LucyAI 产品文档" />
        </div>
      </section>
      
      <Footer />
    </main>
  );
} 