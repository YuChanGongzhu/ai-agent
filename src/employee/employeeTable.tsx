import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from "react";
import { WxAccount, getWxAccountListApi } from '../api/airflow';
import { supabase } from '../utils/supabaseConfig';
import { UserProfile, UserProfileService } from '../userManagement/userProfileService';

export const EmployeeTable: React.FC = () => {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(true);
    const [wxAccountList, setWxAccountList] = useState<WxAccount[]>([]);
    const [filteredWxAccountList, setFilteredWxAccountList] = useState<WxAccount[]>([]);
    const [isAdmin, setIsAdmin] = useState(false);
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

    const handleEdit = (wxAccount: WxAccount) => {
        navigate(`/employee/edit/${wxAccount.wxid}`, { state: { wxAccount } });
    };

    // 获取当前用户的配置信息及角色
    const fetchUserProfileAndCheckAdmin = async (userId: string) => {
        try {
            const profile = await UserProfileService.getUserProfile(userId);
            setUserProfile(profile);
            
            // 从配置信息中获取用户角色
            const isUserAdmin = profile?.role === 'admin';
            setIsAdmin(isUserAdmin);
            
            return { profile, isUserAdmin };
        } catch (error) {
            console.error('获取用户配置失败:', error);
            setIsAdmin(false);
            return { profile: null, isUserAdmin: false };
        }
    };

    // 过滤微信账号列表
    const filterWxAccounts = (accounts: WxAccount[], profile: UserProfile | null, isUserAdmin: boolean) => {
        if (isUserAdmin) {
            // 管理员可以看到所有账号
            return accounts;
        }
        
        if (!profile || !profile.mobile_devices || profile.mobile_devices.length === 0) {
            // 如果用户没有关联设备，则不显示任何账号
            return [];
        }
        
        // 只显示用户关联设备中包含的手机号对应的微信账号
        const mobileDevices = profile.mobile_devices || [];
        return accounts.filter(account => 
            account.mobile && mobileDevices.some(device => device === account.mobile)
        );
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                setIsLoading(true);
                
                // 获取当前用户信息
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) {
                    console.error('未登录用户');
                    setIsLoading(false);
                    return;
                }
                
                // 获取用户配置并检查管理员角色
                const { profile, isUserAdmin } = await fetchUserProfileAndCheckAdmin(user.id);
                
                // 获取微信账号列表
                const accounts = await getWxAccountListApi();
                setWxAccountList(accounts);
                
                // 过滤微信账号列表
                const filtered = filterWxAccounts(accounts, profile, isUserAdmin);
                setFilteredWxAccountList(filtered);
            } catch (error) {
                console.error('获取数据失败:', error);
            } finally {
                setIsLoading(false);
            }
        };
        
        fetchData();
    }, []);

    return (
        <div className="bg-white rounded-lg shadow-lg text p-2 m-2">
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
