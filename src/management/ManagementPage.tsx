import React, { useState, useEffect } from 'react';
import UserManagement from './userManagement/UserManagement';
import IndustryManagement from './industry/IndustryManagement';
import InvitationCodeManagement from './invitationCode/invitationCode';
import { getDatasetsApi, Dataset } from '../api/dify';
import { supabase } from '../auth/supabaseConfig';
import * as IndustryService from '../api/supabase/industryService';
import { UserData } from '../context/type';
import { Industry } from '../api/supabase/industryService';

// Tab类型定义
type TabType = 'users' | 'industry' | 'invitation';

const ManagementPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('users');
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [datasetsLoading, setDatasetsLoading] = useState(false);
  
  // 用户数据状态
  const [users, setUsers] = useState<UserData[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersError, setUsersError] = useState<string | null>(null);
  
  // 行业数据状态
  const [industries, setIndustries] = useState<Industry[]>([]);
  const [industriesLoading, setIndustriesLoading] = useState(false);
  const [industriesError, setIndustriesError] = useState<string | null>(null);

  // 获取素材库数据（只获取一次，两个组件共用）
  const fetchDatasets = async () => {
    try {
      setDatasetsLoading(true);
      const response = await getDatasetsApi({});
      if (response && response.data) {
        setDatasets(response.data);
      }
    } catch (error) {
      console.error('获取素材库列表失败:', error);
    } finally {
      setDatasetsLoading(false);
    }
  };

  // 获取用户数据
  const fetchUsers = async () => {
    try {
      setUsersLoading(true);
      
      // 从 user_profiles 表获取用户配置信息
      const { data: profilesData, error: profilesError } = await supabase
        .from('user_profiles')
        .select('*');
      
      if (profilesError) {
        throw profilesError;
      }
      
      if (profilesData && profilesData.length > 0) {
        // 使用配置信息构建用户列表
        const formattedUsers = profilesData.map(profile => {
          return {
            id: profile.user_id,
            email: profile.email || '从未登录',
            last_sign_in_at: profile.updated_at ? new Date(profile.updated_at).toLocaleString() : '从未登录',
            created_at: profile.created_at || '',
            is_active: profile.is_active !== undefined ? profile.is_active : true,
            role: profile.role || 'user',
            display_name: profile.display_name || '',
            profile: profile
          };
        });
        
        // 按最后登录时间排序，最新登录的显示在最上面
        const sortedUsers = formattedUsers.sort((a, b) => {
          // 如果没有profile或updated_at，则排在最后
          if (!a.profile?.updated_at) return 1;
          if (!b.profile?.updated_at) return -1;
          // 降序排序，最新的在前面
          return new Date(b.profile.updated_at).getTime() - new Date(a.profile.updated_at).getTime();
        });
        
        setUsers(sortedUsers);
        setUsersError(null);
      } else {
        setUsers([]);
        setUsersError('暂无用户数据');
      }
    } catch (err: any) {
      console.error('获取用户列表失败:', err);
      setUsersError(err.message || '获取用户列表失败');
      setUsers([]);
    } finally {
      setUsersLoading(false);
    }
  };
  
  // 获取行业数据
  const fetchIndustries = async () => {
    try {
      setIndustriesLoading(true);
      const industriesData = await IndustryService.getAllIndustries();
      
      if (industriesData && industriesData.length > 0) {
        // 按名称排序
        const sortedIndustries = industriesData.sort((a, b) => 
          a.name.localeCompare(b.name, 'zh-CN')
        );
        
        setIndustries(sortedIndustries);
        setIndustriesError(null);
      } else {
        setIndustries([]);
        setIndustriesError('暂无行业数据');
      }
    } catch (err: any) {
      console.error('获取行业列表失败:', err);
      setIndustriesError(err.message || '获取行业列表失败');
      setIndustries([]);
    } finally {
      setIndustriesLoading(false);
    }
  };

  // 页面加载时获取所有数据
  useEffect(() => {
    fetchDatasets();
    fetchUsers();
    fetchIndustries();
  }, []);

  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-6">系统管理</h1>
      
      {/* 选项卡导航 */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('users')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'users'
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            用户管理
          </button>
          <button
            onClick={() => setActiveTab('industry')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'industry'
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            行业管理
          </button>
          <button
            onClick={() => setActiveTab('invitation')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'invitation'
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            邀请码管理
          </button>
        </nav>
      </div>

      {/* 内容区域 */}
      <div className="mt-6">
        {activeTab === 'users' && (
          <UserManagement 
            externalDatasets={datasets} 
            externalDatasetsLoading={datasetsLoading}
            externalUsers={users}
            externalUsersLoading={usersLoading}
            externalUsersError={usersError}
            externalRefetchUsers={fetchUsers}
            externalIndustries={industries}
          />
        )}
        {activeTab === 'industry' && (
          <IndustryManagement 
            externalDatasets={datasets} 
            externalDatasetsLoading={datasetsLoading}
            externalIndustries={industries}
            externalIndustriesLoading={industriesLoading}
            externalIndustriesError={industriesError}
            externalRefetchIndustries={fetchIndustries}
          />
        )}
        {activeTab === 'invitation' && (
          <InvitationCodeManagement />
        )}
      </div>
    </div>
  );
};

export default ManagementPage;
