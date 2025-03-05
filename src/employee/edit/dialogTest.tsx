import React, { useState, useRef, useEffect } from 'react';
import clsx from 'clsx';
import { WxAccount } from '../../api/airflow';
import { useNavigate } from 'react-router-dom';

interface DialogTestProps {
    wxAccount?: WxAccount;
}

export const DialogTest: React.FC<DialogTestProps> = ({ wxAccount }) => {
    const chatbotUrl=process.env.REACT_APP_DIFY_CHATBOT_ID
    const navigate = useNavigate();
    const handleReturn = () => {
        navigate('/employee');
    };
    return (
        <div className="bg-white rounded-lg shadow-lg h-[600px] flex flex-col">
            <div className="p-4 border-b flex justify-between items-center">
                <h3 className="text-lg font-medium text-gray-900">效果测试 - {wxAccount?.name}</h3>
                <button
                    onClick={handleReturn}
                    className="text-gray-600 hover:text-gray-800 flex items-center"
                >
                    <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    返回
                </button>
            </div>

            <iframe
                src={chatbotUrl}
                allow="microphone"
                style={{ width: '100%', height: '100%', minHeight: '700px' }}
            ></iframe>
        </div>
    );
};
