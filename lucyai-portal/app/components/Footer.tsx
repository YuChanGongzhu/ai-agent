'use client'

import React from 'react';
import Link from 'next/link';

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();
  const adminUrl = process.env.NEXT_PUBLIC_ADMIN_URL || 'https://lucyai.sale';
  
  return (
    <footer className="bg-gray-800 text-white py-6">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <h3 className="text-base font-bold mb-2">LucyAI</h3>
            <p className="text-gray-300 text-sm">
              智能客服解决方案提供商
            </p>
          </div>
          
          <div>
            <h3 className="text-base font-bold mb-2">解决方案</h3>
            <ul className="space-y-1 text-sm">
              <li><Link href="/solutions" className="text-gray-300 hover:text-white">智能会话</Link></li>
              <li><Link href="/solutions" className="text-gray-300 hover:text-white">客服自动化</Link></li>
              <li><Link href="/solutions" className="text-gray-300 hover:text-white">数据分析</Link></li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-base font-bold mb-2">联系我们</h3>
            <ul className="space-y-1 text-sm text-gray-300">
              <li>邮箱: lucyai@lucyai.com</li>
              <li>电话: xxxxxxxxxxx</li>
              <li className="mt-2">
                <a 
                  href={adminUrl}
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-block bg-primary-600 text-white py-1 px-3 text-sm rounded hover:bg-primary-700 transition duration-300"
                >
                  登录控制台
                </a>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-gray-700 mt-4 pt-4 text-center text-gray-400 text-xs">
          <p>© {currentYear} LucyAI. 保留所有权利</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer; 