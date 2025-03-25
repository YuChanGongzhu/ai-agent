import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { WxAccount, ConfigKey, updateWxDifyReplyApi, updateWxDifyGroupReplyApi } from '../api/airflow';
import { useWxAccount } from '../context/WxAccountContext';
import { useUser } from '../context/UserContext';

export const EmployeeTable: React.FC = () => {
    const navigate = useNavigate();
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [isUpdating, setIsUpdating] = useState<{[key: string]: boolean}>({});
    const [notification, setNotification] = useState<{message: string, type: 'success' | 'error'} | null>(null);
    
    const { filteredWxAccountList, isLoading, refreshWxAccounts } = useWxAccount();

    const{isAdmin} = useUser();
    
    // API配置选项映射
    const configOptions: {[key: string]: string} = {
        [ConfigKey.SALES]: '销售行业',
        [ConfigKey.HEALTH]: '医疗健康',
        [ConfigKey.BEAUTY]: '美容美妆',
        [ConfigKey.FINANCE]: '金融理财',
        [ConfigKey.LUCY]: ' Lucy',
        [ConfigKey.LUCY_GROUP]: ' Lucy Group'
    };

    const handleEdit = (wxAccount: WxAccount) => {
        navigate(`/employee/edit/${wxAccount.wxid}`, { state: { wxAccount } });
    };
    
    const showNotification = (message: string, type: 'success' | 'error') => {
        setNotification({ message, type });
        setTimeout(() => setNotification(null), 3000);
    };
    
    const handleUpdatePrivateApi = async (wxAccount: WxAccount, config: string) => {
        if (!config) return;
        try {
            setIsUpdating(prev => ({ ...prev, [wxAccount.wxid + '_private']: true }));
            await updateWxDifyReplyApi(wxAccount.wxid, wxAccount.name, config);
            showNotification(`${wxAccount.name} 私聊API已更新为${configOptions[config]}`, 'success');
        } catch (error) {
            console.error('更新私聊API失败:', error);
            showNotification('更新私聊API失败', 'error');
        } finally {
            setIsUpdating(prev => ({ ...prev, [wxAccount.wxid + '_private']: false }));
        }
    };
    
    const handleUpdateGroupApi = async (wxAccount: WxAccount, config: string) => {
        if (!config) return;
        try {
            setIsUpdating(prev => ({ ...prev, [wxAccount.wxid + '_group']: true }));
            await updateWxDifyGroupReplyApi(wxAccount.wxid, wxAccount.name, config);
            showNotification(`${wxAccount.name} 群聊API已更新为${configOptions[config]}`, 'success');
        } catch (error) {
            console.error('更新群聊API失败:', error);
            showNotification('更新群聊API失败', 'error');
        } finally {
            setIsUpdating(prev => ({ ...prev, [wxAccount.wxid + '_group']: false }));
        }
    };

    const handleRefresh = async () => {
        setIsRefreshing(true);
        try {
            await refreshWxAccounts();
        } finally {
            setIsRefreshing(false);
        }
    };

    return (
        <div className="bg-white rounded-lg shadow-lg text p-2 m-2 relative">  
            {notification && (
                <div className={`absolute top-2 right-2 px-4 py-2 rounded shadow-md ${notification.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {notification.message}
                </div>
            )}
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-700">微信账号列表</h2>
                <button 
                    onClick={handleRefresh}
                    disabled={isLoading || isRefreshing}
                    className="px-4 py-2 bg-[rgba(108,93,211,1)] text-white rounded-lg hover:bg-[rgba(108,93,211,0.9)] focus:outline-none focus:ring-2 focus:ring-[rgba(108,93,211,0.5)] focus:ring-opacity-50 transition-colors duration-200 flex items-center"
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
                    <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[rgba(108,93,211,1)]"></div>
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
                                {isAdmin && (
                                    <>
                                        <th className="text-left py-2 px-1 text-gray-600 text-base font-medium">私聊API</th>
                                        <th className="text-left py-2 px-1 text-gray-600 text-base font-medium">群聊API</th>
                                    </>
                                )}
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
                                    {isAdmin && (
                                        <>
                                            <td className="py-2 px-1">
                                                <div className="relative">
                                                    <select 
                                                        className="w-full py-1 px-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-[rgba(108,93,211,1)]"
                                                        onChange={(e) => handleUpdatePrivateApi(wxAccount, e.target.value)}
                                                        disabled={isUpdating[wxAccount.wxid + '_private']}
                                                    >
                                                        <option value="">选择API</option>
                                                        {Object.entries(configOptions).map(([key, value]) => (
                                                            <option key={key} value={key}>{value}</option>
                                                        ))}
                                                    </select>
                                                    {isUpdating[wxAccount.wxid + '_private'] && (
                                                        <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                                                            <div className="w-4 h-4 border-2 border-[rgba(108,93,211,1)] border-t-transparent rounded-full animate-spin"></div>
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="py-2 px-1">
                                                <div className="relative">
                                                    <select 
                                                        className="w-full py-1 px-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-[rgba(108,93,211,1)]"
                                                        onChange={(e) => handleUpdateGroupApi(wxAccount, e.target.value)}
                                                        disabled={isUpdating[wxAccount.wxid + '_group']}
                                                    >
                                                        <option value="">选择API</option>
                                                        {Object.entries(configOptions).map(([key, value]) => (
                                                            <option key={key} value={key}>{value}</option>
                                                        ))}
                                                    </select>
                                                    {isUpdating[wxAccount.wxid + '_group'] && (
                                                        <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                                                            <div className="w-4 h-4 border-2 border-[rgba(108,93,211,1)] border-t-transparent rounded-full animate-spin"></div>
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                        </>
                                    )}
                                    <td className="py-2 px-1">
                                        <button
                                            onClick={() => handleEdit(wxAccount)}
                                            className="text-[rgba(108,93,211,1)] hover:text-[rgba(108,93,211,0.8)] text-base font-medium"
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
