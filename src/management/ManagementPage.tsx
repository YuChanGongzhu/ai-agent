import React, { useState, useEffect } from 'react';
import { useUser } from '../context/UserContext';
import UserManagement from '../userManagement/UserManagement';
import IndustryManagement from '../industry/IndustryManagement';
import { getDatasetsApi, Dataset } from '../api/dify';
import { Navigate } from 'react-router-dom';

// Tab类型定义
type TabType = 'users' | 'industry';

const ManagementPage: React.FC = () => {
  const { isAdmin } = useUser();
  const [isAdminChecking, setIsAdminChecking] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('users');
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [datasetsLoading, setDatasetsLoading] = useState(false);

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

  // 仅当用户是管理员时，才加载素材库数据
  useEffect(() => {
    if (!isAdmin || isAdminChecking) return;
    fetchDatasets();
  }, [isAdmin, isAdminChecking]);

  // 如果正在检查管理员状态，显示加载中
  if (isAdminChecking) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  // 如果不是管理员，重定向到首页
  if (!isAdmin) {
    return <Navigate to="/" />;
  }

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
        </nav>
      </div>

      {/* 内容区域 */}
      <div className="mt-6">
        {activeTab === 'users' && (
          <UserManagement 
            externalDatasets={datasets} 
            externalDatasetsLoading={datasetsLoading} 
          />
        )}
        {activeTab === 'industry' && (
          <IndustryManagement 
            externalDatasets={datasets} 
            externalDatasetsLoading={datasetsLoading} 
          />
        )}
      </div>
    </div>
  );
};

export default ManagementPage;
