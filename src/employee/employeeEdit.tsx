import React, { useState, useEffect } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { EmployeeConfig } from './edit/employeeConfig';
import { MaterialUpload } from './edit/materialUpload';
import { WxAccount } from '../api/airflow';
import EffectTest from './edit/effectTest';
import { getWxAccountPromptApi } from '../api/airflow';
import { useNavigate } from 'react-router-dom';
import { EmployeeChoice } from './edit/employeeChoice';
import FileManager from './edit/FileManager';


export const EmployeeEdit: React.FC = () => {
    const { wxid } = useParams<{ wxid: string }>();
    const location = useLocation();
    const wxAccount = location.state?.wxAccount as WxAccount;
    const [prompt, setPrompt] = useState('');
    const [selectedConfig, setSelectedConfig] = useState<string>();
    const [activeTab, setActiveTab] = useState('fileManager'); // 默认显示文件管理

    const navigate = useNavigate();
    const handleReturn = () => {
        navigate('/employee');
    };

    useEffect(() => {
        const fetchPrompt = async () => {
            if (wxAccount) {
                try {
                    const response = await getWxAccountPromptApi(wxAccount.wxid, wxAccount.name);
                    if (response && response.value) {
                        setPrompt(JSON.parse(response.value));
                    }
                } catch (error) {
                    console.error('Failed to fetch prompt:', error);
                }
            }
        };

        fetchPrompt();
    }, [wxAccount]);

    return (
        <div className="p-2 md:mt-1 mt-16 min-h-screen overflow-x-hidden">
            <div className="flex flex-wrap items-center gap-2 sm:gap-4">
                <button
                    onClick={handleReturn}
                    className="btn btn-outline btn-sm text-[rgba(108,93,211,1)] border-[rgba(108,93,211,1)] hover:bg-[rgba(108,93,211,1)] hover:text-white touch-manipulation"
                >
                    <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    返回
                </button>

                <div className="avatar">
                    <div className="w-8 rounded">
                        <img
                            src={wxAccount?.small_head_url}
                            alt={wxAccount?.name || wxid} />
                    </div>
                </div>
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 truncate max-w-[50vw]">{wxAccount?.name || wxid}</h3>
            </div>

            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-4">
                    <EmployeeChoice wxAccount={wxAccount} selectedConfig={selectedConfig} setSelectedConfig={setSelectedConfig}/>
                    {/* <EmployeeConfig wxAccount={wxAccount} prompt={prompt} setPrompt={setPrompt} /> */}
                    
                    {/* 文件管理和素材上传 Tab */}
                    <div className="bg-white shadow-md rounded-lg overflow-hidden">
                        <div className="flex flex-wrap border-b border-gray-200">
                            <button
                                onClick={() => setActiveTab('fileManager')}
                                className={`flex-1 px-3 sm:px-6 py-3 text-xs sm:text-sm font-medium touch-manipulation ${activeTab === 'fileManager' ? 'text-[rgba(108,93,211,1)] border-b-2 border-[rgba(108,93,211,1)]' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                <div className="flex items-center justify-center sm:justify-start">
                                    <svg className="w-4 h-4 sm:w-5 sm:h-5 sm:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                                    </svg>
                                    <span className="hidden sm:inline">文件管理</span>
                                    <span className="sm:hidden">文件</span>
                                </div>
                            </button>
                            <button
                                onClick={() => setActiveTab('materialUpload')}
                                className={`flex-1 px-3 sm:px-6 py-3 text-xs sm:text-sm font-medium touch-manipulation ${activeTab === 'materialUpload' ? 'text-[rgba(108,93,211,1)] border-b-2 border-[rgba(108,93,211,1)]' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                <div className="flex items-center justify-center sm:justify-start">
                                    <svg className="w-4 h-4 sm:w-5 sm:h-5 sm:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                                    </svg>
                                    <span className="hidden sm:inline">知识库管理</span>
                                    <span className="sm:hidden">知识库</span>
                                </div>
                            </button>
                        </div>
                        
                        <div className="overflow-x-auto">
                            {activeTab === 'fileManager' ? (
                                <FileManager wxAccount={wxAccount} />
                            ) : (
                                <MaterialUpload wxAccount={wxAccount} />
                            )}
                        </div>
                    </div>
                </div>
                <div className="mt-4 md:mt-0">
                    <EffectTest wxAccount={wxAccount} prompt={prompt} selectedConfig={selectedConfig} />
                </div>
            </div>
        </div>
    );
};
