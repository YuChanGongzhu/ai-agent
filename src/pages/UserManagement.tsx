import React, { useState, useEffect } from 'react';
import { getUsers, deleteUser } from '../api/nacos';

// 导入正确的类型
interface User {
  username: string;
  email: string;
  phone: string;
  createdAt: string;
  role: 'user' | 'admin';
  inviteCode: string;
}

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  // 直接设置为true，因为能访问该页面的用户就是管理员
  const [isAdmin, setIsAdmin] = useState(true);
  const [deletingUser, setDeletingUser] = useState<string | null>(null);
  
  // 加载用户列表
  const loadUsers = async () => {
    try {
      setLoading(true);
      const userList = await getUsers();
      setUsers(userList);
    } catch (err) {
      setError('加载用户失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };
  
  // 初始化时加载用户
  useEffect(() => {
    loadUsers();
  }, []);
  
  // 筛选用户
  const filteredUsers = users.filter(user => 
    user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (user.phone && user.phone.includes(searchTerm))
  );
  
  // 处理删除用户
  const handleDeleteUser = async (username: string) => {
    try {
      setDeletingUser(username);
      setError('');
      setSuccessMessage('');
      
      // 确认是否删除
      if (!window.confirm(`确定要删除用户 "${username}" 吗？此操作无法撤销，用户的所有配置数据将被清除。`)) {
        setDeletingUser(null);
        return;
      }
      
      const success = await deleteUser(username);
      
      if (success) {
        setSuccessMessage(`用户 "${username}" 已成功删除`);
        // 重新加载用户列表
        loadUsers();
      } else {
        setError(`删除用户 "${username}" 失败，请稍后重试`);
      }
    } catch (err) {
      setError(`删除用户时发生错误`);
    } finally {
      setDeletingUser(null);
    }
  };

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="bg-white shadow-lg rounded-xl p-6">
        <h1 className="text-2xl font-medium text-gray-900 mb-6">用户管理</h1>
        
        {/* 显示管理员状态提示 */}
        <div className="rounded-md bg-blue-50 p-4 mb-6">
          <div className="text-sm text-blue-700">您当前以管理员身份登录，可以删除普通用户</div>
        </div>
        
        {error && (
          <div className="rounded-md bg-red-50 p-4 mb-6">
            <div className="text-sm text-red-700">{error}</div>
          </div>
        )}
        
        {successMessage && (
          <div className="rounded-md bg-green-50 p-4 mb-6">
            <div className="text-sm text-green-700">{successMessage}</div>
          </div>
        )}
        
        {/* 搜索框 */}
        <div className="mb-6">
          <div className="relative">
            <input
              type="text"
              placeholder="搜索用户名、邮箱或手机号..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
            <div className="absolute left-3 top-2.5">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
        </div>
        
        {/* 用户列表 */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  用户名
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  邮箱
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  手机号
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  角色
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  注册时间
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  邀请码
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center text-sm text-gray-500">
                    加载中...
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center text-sm text-gray-500">
                    {searchTerm ? '没有找到匹配的用户' : '暂无用户'}
                  </td>
                </tr>
              ) : (
                filteredUsers.map(user => (
                  <tr key={user.username}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {user.username}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user.phone || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${user.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'}`}>
                        {user.role === 'admin' ? '管理员' : '普通用户'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(user.createdAt).toLocaleString('zh-CN')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user.inviteCode}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user.role !== 'admin' && (
                        <button
                          type="button"
                          onClick={() => handleDeleteUser(user.username)}
                          disabled={!!deletingUser}
                          className={`px-3 py-1 rounded-md bg-red-100 text-red-700 hover:bg-red-200 focus:outline-none ${deletingUser === user.username ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          {deletingUser === user.username ? '删除中...' : '删除用户'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default UserManagement; 