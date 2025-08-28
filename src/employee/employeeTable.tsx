import React, { useState, useEffect } from 'react';
import dayjs from 'dayjs';
import { useNavigate } from 'react-router-dom';
import { WxAccount, updateWxDifyReplyApi, updateWxDifyGroupReplyApi } from '../api/airflow';
import { useWxAccount } from '../context/WxAccountContext';
import { useUser } from '../context/UserContext';
import { getTokenUsageApi } from '../api/mysql';

export const EmployeeTable: React.FC = () => {
    // 计算在线时长函数
    const calculateOnlineDuration = (createTime: string): string => {
        if (!createTime) return '-';
        
        const createTimeDate = dayjs(createTime);
        const now = dayjs();
        
        // 检查时间格式是否有效
        if (!createTimeDate.isValid()) return '时间格式无效';
        
        // 计算时间差（毫秒）
        const diffMs = now.diff(createTimeDate);
        
        // 计算天、小时、分钟
        const days = Math.floor(diffMs / (24 * 60 * 60 * 1000));
        const hours = Math.floor((diffMs % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
        const minutes = Math.floor((diffMs % (60 * 60 * 1000)) / (60 * 1000));
        
        // 格式化输出
        return `${days}天${hours}时${minutes}分`;
    };
    const navigate = useNavigate();
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [isUpdating, setIsUpdating] = useState<{[key: string]: boolean}>({});
    const [notification, setNotification] = useState<{message: string, type: 'success' | 'error'} | null>(null);
    const [tokenUsage, setTokenUsage] = useState<{[key: string]: number}>({});
    const [isLoadingTokens, setIsLoadingTokens] = useState<{[key: string]: boolean}>({});
    
    const { filteredWxAccountList, isLoading, refreshWxAccounts } = useWxAccount();

    const{isAdmin} = useUser();
    
    // API配置选项映射
    const configOptions: {[key: string]: string} = {
        'app-GUUwm6Ljj6fgFGeFyKOsk0HK': '销售行业',
        'app-BLxs45G5gAdQfLsIY1qWombM': '医疗健康',
        'app-qKIPKEM5uzaGW0AFzAobz2Td': '美容美妆',
        'app-2KWay9Ljqkp5BqlMEcHttVlt': '金融理财',
        'app-8T9wSYOP8fxelJplwbhSg3Eq': 'Lucy',
        'app-89Vks1Sm4ygcsdW2XON8uVXq': 'Lucy Group'
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

    const fetchTokenUsage = async (wxId: string, source_platform: string) => {
        setIsLoadingTokens(prev => ({ ...prev, [wxId]: true }));
        try {
            console.log('Fetching token usage for:', wxId);
            const params = {
                token_source_platform: source_platform,
                wx_user_id: wxId,
            };
            console.log('Request params:', params);
            const result = await getTokenUsageApi(params);
            
            console.log('Token usage API response:', result);
            if (result.code === 0 && result.sum) {
                setTokenUsage(prev => ({
                    ...prev,
                    [wxId]: result.sum.sum_token
                }));
                showNotification(`${wxId} token用量已更新`, 'success');
            } else {
                showNotification(`获取token用量失败: ${result.message}`, 'error');
            }
        } catch (error) {
            console.error('获取token用量失败:', error);
            showNotification('获取token用量失败', 'error');
        } finally {
            setIsLoadingTokens(prev => ({ ...prev, [wxId]: false }));
        }
    };
    
    const fetchAllTokenUsage = async () => {
        if (filteredWxAccountList.length === 0) return;
        
        for (const account of filteredWxAccountList) {
            await fetchTokenUsage(account.wxid);
        }
    };
    
    // 组件加载时获取所有微信账号的token用量
    useEffect(() => {
        if (filteredWxAccountList.length > 0) {
            fetchAllTokenUsage();
        }
    }, [filteredWxAccountList]);
    
    const handleRefresh = async () => {
        setIsRefreshing(true);
        try {
            await refreshWxAccounts();
        } finally {
            setIsRefreshing(false);
        }
    };

    return (
        <div className="bg-white rounded-lg shadow-lg p-2 m-2 md:mt-2 mt-16 relative">  
            {notification && (
                <div className={`fixed top-4 right-4 z-50 px-4 py-2 rounded shadow-md ${notification.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {notification.message}
                </div>
            )}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-2">
                <h2 className="text-xl font-semibold text-gray-700">微信账号列表</h2>
                <button 
                    onClick={handleRefresh}
                    disabled={isLoading || isRefreshing}
                    className="w-full md:w-auto px-4 py-2 bg-[rgba(108,93,211,1)] text-white rounded-lg hover:bg-[rgba(108,93,211,0.9)] focus:outline-none focus:ring-2 focus:ring-[rgba(108,93,211,0.5)] focus:ring-opacity-50 transition-colors duration-200 flex items-center justify-center md:justify-start"
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
                <div>
                    {filteredWxAccountList.length === 0 ? (
                        <div className="text-center py-10">
                            <p className="text-gray-500 mb-2">没有可显示的微信账号</p>
                            <p className="text-sm text-gray-400">请联系管理员获取微信账号访问权限</p>
                        </div>
                    ) : (
                    <>
                        {/* Desktop Table View - Hidden on Mobile */}
                        <div className="hidden md:block overflow-x-auto">
                            <table className="table w-full">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="text-left py-2 px-1 text-gray-600 text-base font-medium">微信头像</th>
                                        <th className="text-left py-2 px-1 text-gray-600 text-base font-medium">微信名称</th>
                                        <th className="text-left py-2 px-1 text-gray-600 text-base font-medium">手机号</th>
                                        <th className="text-left py-2 px-1 text-gray-600 text-base font-medium">行业</th>
                                        <th className="text-left py-2 px-1 text-gray-600 text-base font-medium">在线时长</th>
                                        <th className="text-left py-2 px-1 text-gray-600 text-base font-medium">Token用量</th>
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
                                        <tr key={index} className="border-b border-gray-100">
                                            <td className="py-2 px-1">
                                                <div className="avatar">
                                                    <div className="w-8 rounded-full"><img src={wxAccount.small_head_url} alt={wxAccount.name} /></div>
                                                </div>
                                            </td>

                                            <td className="py-2 px-1 text-base">{wxAccount.name}</td>
                                            <td className="py-2 px-1 text-base">{wxAccount.mobile || '-'}</td>
                                            <td className="py-2 px-1 text-base">医美</td>
                                            <td className="py-2 px-1 text-base">{calculateOnlineDuration(wxAccount.create_time)}</td>
                                            <td className="py-2 px-1 text-base">
                                                <div className="flex items-center space-x-2">
                                                    <span>{tokenUsage[wxAccount.wxid] || 0}</span>
                                                    <button
                                                        onClick={() => fetchTokenUsage(wxAccount.wxid,'all')}
                                                        disabled={isLoadingTokens[wxAccount.wxid]}
                                                        className="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-colors duration-200 flex items-center"
                                                    >
                                                        {isLoadingTokens[wxAccount.wxid] ? (
                                                            <span className="loading loading-spinner loading-xs"></span>
                                                        ) : (
                                                            '重新获取'
                                                        )}
                                                    </button>
                                                </div>
                                            </td>
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
                        </div>

                        {/* Mobile Card View */}
                        <div className="md:hidden">
                            <div className="space-y-4">
                                {filteredWxAccountList.map((wxAccount, index) => (
                                    <div key={index} className="bg-white rounded-lg shadow p-4 border-l-4 border-[rgba(108,93,211,1)]">
                                        <div className="flex items-center mb-3">
                                            <div className="avatar mr-3">
                                                <div className="w-12 rounded-full">
                                                    <img src={wxAccount.small_head_url} alt={wxAccount.name} />
                                                </div>
                                            </div>
                                            <div>
                                                <h3 className="font-medium text-lg">{wxAccount.name}</h3>
                                                <p className="text-gray-600">{wxAccount.mobile || '-'}</p>
                                            </div>
                                            <button
                                                onClick={() => handleEdit(wxAccount)}
                                                className="ml-auto bg-[rgba(108,93,211,0.1)] text-[rgba(108,93,211,1)] px-3 py-1 rounded-lg font-medium"
                                            >
                                                编辑
                                            </button>
                                        </div>
                                        
                                        <div className="grid grid-cols-2 gap-2 mb-2">
                                            <div className="bg-gray-50 p-2 rounded">
                                                <span className="text-gray-500 text-xs block">行业</span>
                                                <span className="font-medium">医美</span>
                                            </div>
                                            <div className="bg-gray-50 p-2 rounded">
                                                <span className="text-gray-500 text-xs block">在线时长</span>
                                                <span className="font-medium">{calculateOnlineDuration(wxAccount.create_time)}</span>
                                            </div>
                                        </div>
                                        
                                        <div className="grid grid-cols-1 gap-2 mb-2">
                                            <div className="bg-gray-50 p-2 rounded">
                                                <span className="text-gray-500 text-xs block">Token用量</span>
                                                <div className="flex items-center space-x-2">
                                                    <span className="font-medium">{tokenUsage[wxAccount.wxid] || 0}</span>
                                                    <button
                                                        onClick={() => fetchTokenUsage(wxAccount.wxid,'wx_chat')}
                                                        disabled={isLoadingTokens[wxAccount.wxid]}
                                                        className="text-xs bg-blue-500 text-white rounded p-1 flex items-center"
                                                    >
                                                        {isLoadingTokens[wxAccount.wxid] ? (
                                                            <span className="loading loading-spinner loading-xs"></span>
                                                        ) : (
                                                            '获取'
                                                        )}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>

                                        {isAdmin && (
                                            <div className="space-y-2 mt-3 pt-3 border-t border-gray-100">
                                                <div>
                                                    <label className="text-xs text-gray-500 block mb-1">私聊API</label>
                                                    <div className="relative">
                                                        <select 
                                                            className="w-full py-2 px-3 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-[rgba(108,93,211,1)]"
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
                                                </div>
                                                <div>
                                                    <label className="text-xs text-gray-500 block mb-1">群聊API</label>
                                                    <div className="relative">
                                                        <select 
                                                            className="w-full py-2 px-3 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-[rgba(108,93,211,1)]"
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
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </>
                    )}
                </div>
            )}
        </div>
    );
};
