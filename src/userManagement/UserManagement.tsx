import React, { useState, useEffect } from 'react';
import { supabase } from '../auth/supabaseConfig';
import { UserProfileService, UserProfile } from './userProfileService';
import { UserData } from './types';
import { useNavigate } from 'react-router-dom';
import { getDatasetsApi, Dataset } from '../api/dify';
import { useUser } from '../context/UserContext';

interface UserManagementProps {
  externalDatasets?: Dataset[];
  externalDatasetsLoading?: boolean;
}

// 集成用户编辑组件到用户管理页面
const UserManagement: React.FC<UserManagementProps> = ({ externalDatasets, externalDatasetsLoading }) => {
  const navigate = useNavigate();
  const [users, setUsers] = useState<UserData[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // 管理员验证状态
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [isAdminChecking, setIsAdminChecking] = useState<boolean>(true);
  
  // 分页相关状态
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 10;
  
  // 用户编辑相关状态
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [editModeActive, setEditModeActive] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  
  // 素材管理相关状态
  const [materialInput, setMaterialInput] = useState('');
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [datasetsLoading, setDatasetsLoading] = useState(false);
  
  // 编辑表单状态
  const [formData, setFormData] = useState<any>({
    display_name: '',
    email: '',
    phone: '',
    department: '',
    position: '',
    bio: '',
    is_active: true,
    mobile_devices: [],
    servers: [],
    material_list: [],
    role: 'user'
  });
  
  const [deviceInput, setDeviceInput] = useState('');
  const [serverInput, setServerInput] = useState('');
  const [saveLoading, setSaveLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // 使用UserContext获取用户信息和管理员状态
  const { userProfile, isAdmin: contextIsAdmin, isLoading: userContextLoading } = useUser();
  
  // 验证当前用户是否为管理员（使用上下文）
  useEffect(() => {
    async function checkAdminPermission() {
      try {
        setIsAdminChecking(true);
        
        // 从用户上下文获取管理员状态
        if (userContextLoading) {
          // 如果上下文还在加载，等待
          return;
        }
        
        // 使用上下文中的管理员状态
        if (contextIsAdmin) {
          setIsAdmin(true);
          setError(null);
          console.log('用户是管理员（从上下文获取）');
        } else {
          // 不是管理员，设置状态但不重定向
          setIsAdmin(false);
          setError('您没有访问用户管理页面的权限');
          console.log('用户不是管理员（从上下文获取）');
        }
      } catch (err) {
        console.error('验证管理员权限失败:', err);
        setIsAdmin(false);
        setError('验证管理员权限失败，请刷新页面或者联系系统管理员');
      } finally {
        setIsAdminChecking(false);
      }
    }
    
    checkAdminPermission();
  }, [contextIsAdmin, userContextLoading]); // 依赖于上下文中的数据，当上下文更新时重新检查

  // 搜索功能
  useEffect(() => {
    if (!users.length) return;
    
    const results = users.filter(user => 
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.display_name && user.display_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (user.profile?.department && user.profile.department.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (user.last_sign_in_at && user.last_sign_in_at.toLowerCase().includes(searchTerm.toLowerCase()))
    );
    
    setFilteredUsers(results);
    setTotalPages(Math.ceil(results.length / itemsPerPage));
    setCurrentPage(1); // 重置到第一页
  }, [searchTerm, users]);
  
  // 获取当前页的用户
  const getCurrentPageUsers = () => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredUsers.slice(startIndex, startIndex + itemsPerPage);
  };
  
  // 分页导航
  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  // 获取素材库数据（如果没有提供外部数据集）
  const fetchDatasets = async () => {
    if (externalDatasets) return; // 如果提供了外部数据集，则不需要获取
    
    try {
      setDatasetsLoading(true);
      const response = await getDatasetsApi({});
      setDatasets(response.data);
    } catch (error) {
      console.error('获取素材库列表失败:', error);
    } finally {
      setDatasetsLoading(false);
    }
  };

  // 使用外部数据集（如果提供）
  useEffect(() => {
    if (externalDatasets) {
      setDatasets(externalDatasets);
    }
  }, [externalDatasets]);

  // 使用外部数据集加载状态（如果提供）
  useEffect(() => {
    if (externalDatasetsLoading !== undefined) {
      setDatasetsLoading(externalDatasetsLoading);
    }
  }, [externalDatasetsLoading]);

  // 仅当用户是管理员时，才加载用户列表和素材库
  useEffect(() => {
    if (!isAdmin || isAdminChecking) return;
    
    // 加载素材库数据（如果没有提供外部数据集）
    if (!externalDatasets) {
      fetchDatasets();
    }
    
    async function fetchUsers() {
      try {
        setLoading(true);
        
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
          setFilteredUsers(sortedUsers);
          setTotalPages(Math.ceil(sortedUsers.length / itemsPerPage));
          setError(null);
        } else {
          // 如果没有用户数据，显示空列表
          setUsers([]);
          setFilteredUsers([]);
          setTotalPages(0);
          setError('暂无用户数据');
        }
      } catch (err: any) {
        console.error('Error fetching users:', err);
        setError(err.message || '获取用户列表失败');
        setUsers([]);
        setFilteredUsers([]);
      } finally {
        setLoading(false);
      }
    }

    fetchUsers();
  }, [isAdmin, isAdminChecking]);

  // 刷新用户数据
  const refreshUsers = async () => {
    if (!isAdmin) return;
    
    setLoading(true);
    setError(null);
    
    try {
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
        setFilteredUsers(sortedUsers.filter(user => 
          user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (user.display_name && user.display_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (user.profile?.department && user.profile.department.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (user.last_sign_in_at && user.last_sign_in_at.toLowerCase().includes(searchTerm.toLowerCase()))
        ));
        setTotalPages(Math.ceil(sortedUsers.length / itemsPerPage));
        setError(null);
      } else {
        setUsers([]);
        setFilteredUsers([]);
        setTotalPages(0);
        setError('暂无用户数据');
      }
    } catch (err: any) {
      console.error('刷新用户列表失败:', err);
      setError(err.message || '刷新用户列表失败');
    } finally {
      setLoading(false);
    }
  };

  const handleEditUser = (user: UserData) => {
    setSelectedUser(user);
    setEditModeActive(true);
    setFormData({
      display_name: user.display_name || '',
      email: user.profile?.email || '',
      phone: user.profile?.phone || '',
      department: user.profile?.department || '',
      position: user.profile?.position || '',
      bio: user.profile?.bio || '',
      is_active: user.profile?.is_active !== undefined ? user.profile.is_active : true,
      mobile_devices: user.profile?.mobile_devices || [],
      servers: user.profile?.servers || [],
      material_list: user.profile?.material_list || [],
      role: user.profile?.role || 'user'
    });
  };

  // 取消编辑
  const handleCancelEdit = () => {
    setEditModeActive(false);
    setSelectedUser(null);
    setFormError(null);
  };

  // 表单字段变更处理
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' 
        ? (e.target as HTMLInputElement).checked 
        : value
    });
  };

  // 添加设备
  const handleAddDevice = () => {
    if (!deviceInput.trim()) return;
    
    const newDevice = {
      id: `device_${Date.now()}`,
      name: deviceInput,
      added_at: new Date().toISOString()
    };
    
    setFormData({
      ...formData,
      mobile_devices: [...formData.mobile_devices, newDevice]
    });
    
    setDeviceInput('');
  };

  // 移除设备
  const handleRemoveDevice = (deviceId: string) => {
    setFormData({
      ...formData,
      mobile_devices: formData.mobile_devices.filter((device: any) => device.id !== deviceId)
    });
  };

  // 添加服务器
  const handleAddServer = () => {
    if (!serverInput.trim()) return;
    
    const newServer = {
      id: `server_${Date.now()}`,
      name: serverInput,
      added_at: new Date().toISOString()
    };
    
    setFormData({
      ...formData,
      servers: [...formData.servers, newServer]
    });
    
    setServerInput('');
  };

  // 移除服务器
  const handleRemoveServer = (serverId: string) => {
    setFormData({
      ...formData,
      servers: formData.servers.filter((server: any) => server.id !== serverId)
    });
  };
  
  // 添加素材ID (保留兼容旧代码)
  const handleAddMaterial = () => {
    if (!materialInput.trim()) return;
    
    // 确保不添加重复的素材ID
    if (!formData.material_list.includes(materialInput)) {
      setFormData({
        ...formData,
        material_list: [...formData.material_list, materialInput]
      });
    }
    
    setMaterialInput('');
  };
  
  // 添加所有素材库
  const handleAddAllMaterials = () => {
    if (!datasets.length) return;
    
    const allDatasetIds = datasets.map(dataset => dataset.id);
    // 使用Array.from和Set来去重，避免TypeScript的降级迭代错误
    const uniqueList = Array.from(new Set([...formData.material_list, ...allDatasetIds]));
    
    setFormData({
      ...formData,
      material_list: uniqueList
    });
  };
  
  // 清空所有选择
  const handleClearAllMaterials = () => {
    setFormData({
      ...formData,
      material_list: []
    });
  };
  
  // 获取数据集名称
  const getDatasetNameById = (id: string): string => {
    const dataset = datasets.find(ds => ds.id === id);
    return dataset ? dataset.name : id;
  };
  
  // 移除素材ID
  const handleRemoveMaterial = (materialId: string) => {
    setFormData({
      ...formData,
      material_list: formData.material_list.filter((id: string) => id !== materialId)
    });
  };

  // 保存用户表单
  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    
    setSaveLoading(true);
    setFormError(null);

    try {
      // 准备用户配置数据
      const profileData: Partial<UserProfile> = {
        display_name: formData.display_name,
        email: formData.email,
        phone: formData.phone,
        department: formData.department,
        position: formData.position,
        bio: formData.bio,
        is_active: formData.is_active === true || formData.is_active === 'true',
        mobile_devices: formData.mobile_devices,
        servers: formData.servers,
        material_list: formData.material_list,
        role: formData.role
      };

      // 更新用户配置
      const updatedProfile = await UserProfileService.updateUserProfile(
        selectedUser.id, 
        profileData
      );

      // 更新用户对象
      const updatedUser = {
        ...selectedUser,
        display_name: formData.display_name,
        email: formData.email,
        is_active: formData.is_active === true || formData.is_active === 'true',
        role: formData.role,
        profile: updatedProfile
      };

      // 更新用户列表
      const updatedUsers = users.map(user => 
        user.id === updatedUser.id ? updatedUser : user
      );
      
      // 按最后登录时间排序
      const sortedUsers = updatedUsers.sort((a, b) => {
        // 如果没有profile或updated_at，则排在最后
        if (!a.profile?.updated_at) return 1;
        if (!b.profile?.updated_at) return -1;
        // 降序排序，最新的在前面
        return new Date(b.profile.updated_at).getTime() - new Date(a.profile.updated_at).getTime();
      });
      
      setUsers(sortedUsers);
      setFilteredUsers(sortedUsers.filter(user => 
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (user.display_name && user.display_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (user.profile?.department && user.profile.department.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (user.last_sign_in_at && user.last_sign_in_at.toLowerCase().includes(searchTerm.toLowerCase()))
      ));
      
      // 显示成功提示
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      
      // 退出编辑模式
      setEditModeActive(false);
      setSelectedUser(null);
    } catch (err: any) {
      console.error('更新用户失败:', err);
      setFormError(err.message || '保存用户信息失败');
    } finally {
      setSaveLoading(false);
    }
  };

  // 渲染分页控件
  const renderPagination = () => {
    if (totalPages <= 1) return null;
    
    return (
      <div className="flex justify-center mt-4">
        <nav className="inline-flex rounded-md shadow">
          <button
            onClick={() => goToPage(currentPage - 1)}
            disabled={currentPage === 1}
            className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
          >
            上一页
          </button>
          
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
            <button
              key={page}
              onClick={() => goToPage(page)}
              className={`relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium ${
                currentPage === page
                  ? 'bg-primary bg-opacity-10 text-primary'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              {page}
            </button>
          ))}
          
          <button
            onClick={() => goToPage(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
          >
            下一页
          </button>
        </nav>
      </div>
    );
  };

  // 如果正在检查管理员权限，显示加载中
  if (isAdminChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  // 如果不是管理员，显示错误消息而不是返回null
  if (!isAdmin && !isAdminChecking) {
    return (
      <div className="p-6">
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <svg className="h-12 w-12 text-red-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <h2 className="text-xl font-bold text-gray-800 mb-2">权限不足</h2>
          <p className="text-gray-600 mb-6">{error || '您没有管理员权限，无法访问用户管理页面。'}</p>
          <button 
            onClick={() => navigate('/employee')} 
            className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-6 rounded-md shadow-sm transition-colors"
          >
            返回主页
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">用户管理</h1>
        <button
          onClick={refreshUsers}
          disabled={loading}
          className="px-4 py-2 bg-primary text-white rounded-md shadow hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary focus:ring-opacity-50 transition-colors disabled:opacity-50"
        >
          {loading ? '刷新中...' : '刷新用户列表'}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      {saveSuccess && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-4 fixed top-4 right-4 z-50 shadow-md">
          用户信息已成功保存
        </div>
      )}

      <div className="mb-4">
        <div className="relative">
          <input
            type="text"
            placeholder="搜索用户（邮箱、名称、部门或登录时间）"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary pl-10"
          />
          <div className="absolute left-3 top-2.5 text-gray-400">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-6">
        {/* 用户列表部分 */}
        <div className={`bg-white rounded-lg shadow-md overflow-hidden ${editModeActive ? 'md:w-3/5' : 'w-full'}`}>
          {loading ? (
            <div className="py-12 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="py-8 text-center text-gray-500">
              没有找到用户记录
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      名称 / 邮箱
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      部门 / 职位
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      最后登录时间
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      角色
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      行业
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      操作
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {getCurrentPageUsers().map(user => (
                    <tr 
                      key={user.id} 
                      className={`hover:bg-gray-50 ${selectedUser?.id === user.id ? 'bg-primary bg-opacity-5' : ''}`}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 bg-gray-100 rounded-full flex items-center justify-center">
                            {user.display_name ? (
                              <span className="text-lg font-medium text-gray-700">
                                {user.display_name[0].toUpperCase()}
                              </span>
                            ) : (
                              <svg className="h-6 w-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                              </svg>
                            )}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {user.display_name || '未设置名称'}
                            </div>
                            <div className="text-sm text-gray-500">
                              {user.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {user.profile?.department || '未设置部门'}
                        </div>
                        <div className="text-sm text-gray-500">
                          {user.profile?.position || '未设置职位'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {user.last_sign_in_at}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          user.profile?.role === 'admin' 
                            ? 'bg-purple-100 text-purple-800' 
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {user.profile?.role === 'admin' ? '管理员' : '普通用户'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                          {user.profile?.industry || '未分配'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleEditUser(user)}
                          className="text-primary hover:text-primary-dark"
                        >
                          编辑
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {renderPagination()}
        </div>

        {/* 侧边编辑表单部分 */}
        {editModeActive && selectedUser && (
          <div className="md:w-2/5 bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">编辑用户信息</h2>
            
            {formError && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
                {formError}
              </div>
            )}
            
            <form onSubmit={handleSaveUser}>
              <div className="grid grid-cols-1 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    邮箱 (ID)
                  </label>
                  <input
                    type="text"
                    value={selectedUser.email || selectedUser.id}
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    电子邮箱
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
                    placeholder="user@example.com"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    显示名称
                  </label>
                  <input
                    type="text"
                    name="display_name"
                    value={formData.display_name}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    手机号码
                  </label>
                  <input
                    type="text"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    部门
                  </label>
                  <input
                    type="text"
                    name="department"
                    value={formData.department}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    职位
                  </label>
                  <input
                    type="text"
                    name="position"
                    value={formData.position}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    角色
                  </label>
                  <select
                    name="role"
                    value={formData.role || 'user'}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
                  >
                    <option value="user">普通用户</option>
                    <option value="admin">管理员</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    状态
                  </label>
                  <select
                    name="is_active"
                    value={formData.is_active ? "true" : "false"}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
                  >
                    <option value="true">正常</option>
                    <option value="false">已禁用</option>
                  </select>
                </div>
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  个人简介
                </label>
                <textarea
                  name="bio"
                  value={formData.bio}
                  onChange={handleChange}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
                />
              </div>

              {/* 手机设备管理 */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  关联手机设备
                </label>
                <div className="flex space-x-2 mb-2">
                  <input
                    type="text"
                    value={deviceInput}
                    onChange={(e) => setDeviceInput(e.target.value)}
                    placeholder="输入设备名称"
                    className="flex-grow px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
                  />
                  <button
                    type="button"
                    onClick={handleAddDevice}
                    className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
                  >
                    添加
                  </button>
                </div>

                {formData.mobile_devices.length > 0 ? (
                  <ul className="border border-gray-300 rounded-md divide-y divide-gray-300">
                    {formData.mobile_devices.map((device: any) => (
                      <li key={device.id} className="px-3 py-2 flex justify-between items-center">
                        <span>
                          {device.name}
                          {device.added_at && (
                            <span className="text-xs text-gray-500 ml-2">
                              {new Date(device.added_at).toLocaleDateString()}
                            </span>
                          )}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveDevice(device.id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          删除
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-500">未添加任何设备</p>
                )}
              </div>

              {/* 服务器管理 */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  关联服务器
                </label>
                <div className="flex space-x-2 mb-2">
                  <input
                    type="text"
                    value={serverInput}
                    onChange={(e) => setServerInput(e.target.value)}
                    placeholder="输入服务器名称"
                    className="flex-grow px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
                  />
                  <button
                    type="button"
                    onClick={handleAddServer}
                    className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
                  >
                    添加
                  </button>
                </div>

                {formData.servers.length > 0 ? (
                  <ul className="border border-gray-300 rounded-md divide-y divide-gray-300">
                    {formData.servers.map((server: any) => (
                      <li key={server.id} className="px-3 py-2 flex justify-between items-center">
                        <span>
                          {server.name}
                          {server.added_at && (
                            <span className="text-xs text-gray-500 ml-2">
                              {new Date(server.added_at).toLocaleDateString()}
                            </span>
                          )}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveServer(server.id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          删除
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-500">未添加任何服务器</p>
                )}
              </div>
              
              {/* 素材库管理 */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  可访问素材库
                </label>
                <div className="mb-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    选择素材库
                  </label>
                  <div className="bg-gray-50 p-3 rounded-md border border-gray-300 max-h-60 overflow-y-auto">
                    {datasetsLoading ? (
                      <div className="text-center py-2">加载中...</div>
                    ) : datasets.length === 0 ? (
                      <div className="text-center py-2">暂无可用素材库</div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {datasets.map(dataset => {
                          const isSelected = formData.material_list.includes(dataset.id);
                          return (
                            <div 
                              key={dataset.id} 
                              className={`p-2 rounded-md cursor-pointer border flex items-center ${isSelected ? 'bg-blue-50 border-blue-300' : 'bg-white border-gray-200 hover:bg-gray-50'}`}
                              onClick={() => {
                                // 如果已选中，则移除
                                if (isSelected) {
                                  handleRemoveMaterial(dataset.id);
                                } else {
                                  // 否则添加到选中列表
                                  setFormData({
                                    ...formData,
                                    material_list: [...formData.material_list, dataset.id]
                                  });
                                }
                              }}
                            >
                              <div className={`w-5 h-5 rounded border mr-2 flex-shrink-0 ${isSelected ? 'bg-blue-500 border-blue-500' : 'border-gray-300'}`}>
                                {isSelected && (
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                  </svg>
                                )}
                              </div>
                              <div className="flex-grow">
                                <div className="font-medium">{dataset.name}</div>
                                <div className="text-xs text-gray-500">{dataset.id}</div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-4">
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">已选素材库 ({formData.material_list.length})</span>
                    <div className="space-x-2">
                      <button
                        type="button"
                        onClick={handleAddAllMaterials}
                        className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                        disabled={datasetsLoading}
                      >
                        全选
                      </button>
                      <button
                        type="button"
                        onClick={handleClearAllMaterials}
                        className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                        disabled={formData.material_list.length === 0}
                      >
                        清空
                      </button>
                    </div>
                  </div>
                  
                  {datasetsLoading ? (
                    <p className="text-sm text-gray-500">加载素材库中...</p>
                  ) : formData.material_list.length > 0 ? (
                    <ul className="border border-gray-300 rounded-md divide-y divide-gray-300 max-h-40 overflow-y-auto">
                      {formData.material_list.map((materialId: string) => (
                        <li key={materialId} className="px-3 py-2 flex justify-between items-center">
                          <span>
                            {getDatasetNameById(materialId)}
                            <span className="text-xs text-gray-500 ml-2">{materialId}</span>
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemoveMaterial(materialId)}
                            className="text-red-600 hover:text-red-800"
                          >
                            删除
                          </button>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-gray-500">未添加任何素材库</p>
                  )}
                </div>
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={saveLoading}
                  className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50"
                >
                  {saveLoading ? '保存中...' : '保存'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserManagement;
