import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { WxAccount } from '../api/airflow';
import { useWxAccount } from '../context/WxAccountContext';

export const EmployeeTable: React.FC = () => {
    const navigate = useNavigate();
    const [isRefreshing, setIsRefreshing] = useState(false);
    
    // 使用微信账号上下文获取账号列表和刷新方法
    const { filteredWxAccountList, isLoading, refreshWxAccounts } = useWxAccount();

    const handleEdit = (wxAccount: WxAccount) => {
        navigate(`/employee/edit/${wxAccount.wxid}`, { state: { wxAccount } });
    };

    // 处理刷新按钮点击
    const handleRefresh = async () => {
        setIsRefreshing(true);
        try {
            await refreshWxAccounts();
        } finally {
            setIsRefreshing(false);
        }
    };

    return (
        <div className="bg-white rounded-lg shadow-lg text p-2 m-2">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-700">微信账号列表</h2>
                <button 
                    onClick={handleRefresh}
                    disabled={isLoading || isRefreshing}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-opacity-50 transition-colors duration-200 flex items-center"
                >
                    {isRefreshing ? (
                        <>
                            <span className="loading loading-spinner loading-sm mr-2"></span>
                            <span>刷新中...</span>
                        </>
                    ) : (
                        <>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            <span>刷新账号列表</span>
                        </>
                    )}
                </button>
            </div>
            
            {isLoading ? (
                <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-purple-600"></div>
                    <span className="ml-3 text-x s text-gray-600">加载中...</span>
                </div>
            ) : (
                <div className="overflow-x-auto">
                    {filteredWxAccountList.length === 0 ? (
                        <div className="text-center py-10">
                            <p className="text-gray-500 mb-2">没有可显示的微信账号</p>
                            <p className="text-sm text-gray-400">请联系管理员获取微信账号访问权限</p>
                        </div>
                    ) : (
                    <table className="table w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="text-left py-2 px-1 text-gray-600 text-base font-medium">微信头像</th>
                                <th className="text-left py-2 px-1 text-gray-600 text-base font-medium">微信名称</th>
                                <th className="text-left py-2 px-1 text-gray-600 text-base font-medium">手机号</th>
                                <th className="text-left py-2 px-1 text-gray-600 text-base font-medium">行业</th>
                                <th className="text-left py-2 px-1 text-gray-600 text-base font-medium">员工编辑</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredWxAccountList.map((wxAccount, index) => (
                                <tr key={index} className=" border-gray-100">
                                    <td className="py-2 px-1">
                                        <div className="avatar">
                                            <div className="w-8 rounded-full"><img src={wxAccount.small_head_url} alt={wxAccount.name} /></div>
                                        </div>
                                    </td>

                                    <td className="py-2 px-1 text-base">{wxAccount.name}</td>
                                    <td className="py-2 px-1 text-base">{wxAccount.mobile || '-'}</td>
                                    <td className="py-2 px-1 text-base">医美</td>
                                    <td className="py-2 px-1">
                                        <button
                                            onClick={() => handleEdit(wxAccount)}
                                            className="text-purple-600 hover:text-purple-700 text-base font-medium"
                                        >
                                            编辑
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    )}
                </div>
            )}
        </div>
    );
};
