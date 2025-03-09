import React, { useState, useEffect } from 'react';
import { getInviteCodes, addInviteCode, deleteInviteCode } from '../api/nacos';

// 邀请码类型定义
interface InviteCode {
  code: string;
  used: boolean;
  usedBy?: string;
  usedAt?: string;
}

const InviteCodes: React.FC = () => {
  const [inviteCodes, setInviteCodes] = useState<InviteCode[]>([]);
  const [newCode, setNewCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [deletingCode, setDeletingCode] = useState<string | null>(null);

  // 加载邀请码列表
  const loadInviteCodes = async () => {
    try {
      setLoading(true);
      const codes = await getInviteCodes();
      setInviteCodes(codes);
      
      if (isInitialLoad && codes.length === 0) {
        setError('邀请码列表为空，请添加邀请码');
      }
      
      setIsInitialLoad(false);
    } catch (err) {
      console.error('加载邀请码失败:', err);
      setError('加载邀请码失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };
  
  // 初始化时加载邀请码
  useEffect(() => {
    loadInviteCodes();
  }, []);

  // 生成随机邀请码
  const generateRandomCode = () => {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    const length = 8;
    for (let i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    setNewCode(result);
  };

  // 添加新邀请码
  const handleAddCode = async () => {
    if (!newCode.trim()) {
      setError('请输入邀请码');
      return;
    }

    try {
      setLoading(true);
      setError('');
      setSuccess('');
      
      const result = await addInviteCode(newCode);
      if (result) {
        setSuccess(`邀请码 ${newCode} 添加成功`);
        setNewCode('');
        // 重新加载邀请码列表
        await loadInviteCodes();
      } else {
        setError(`邀请码 ${newCode} 添加失败，可能已经存在`);
      }
    } catch (err) {
      console.error('添加邀请码失败:', err);
      setError('添加邀请码失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  // 删除邀请码
  const handleDeleteCode = async (code: string) => {
    try {
      setDeletingCode(code);
      setError('');
      setSuccess('');
      
      const result = await deleteInviteCode(code);
      if (result) {
        setSuccess(`邀请码 ${code} 删除成功`);
        // 重新加载邀请码列表
        await loadInviteCodes();
      } else {
        setError(`邀请码 ${code} 删除失败，可能已被使用或不存在`);
      }
    } catch (err) {
      console.error('删除邀请码失败:', err);
      setError('删除邀请码失败，请稍后重试');
    } finally {
      setDeletingCode(null);
    }
  };

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="bg-white shadow-lg rounded-xl p-6">
        <h1 className="text-2xl font-medium text-gray-900 mb-6">邀请码管理</h1>
        
        {/* 添加邀请码表单 */}
        <div className="mb-8 p-6 bg-gray-50 rounded-lg">
          <h2 className="text-lg font-medium text-gray-700 mb-4">添加新邀请码</h2>
          
          {error && (
            <div className="rounded-md bg-red-50 p-4 mb-4">
              <div className="text-sm text-red-700">{error}</div>
            </div>
          )}
          
          {success && (
            <div className="rounded-md bg-green-50 p-4 mb-4">
              <div className="text-sm text-green-700">{success}</div>
            </div>
          )}
          
          <div className="flex items-center space-x-4 mb-4">
            <input
              type="text"
              value={newCode}
              onChange={(e) => setNewCode(e.target.value)}
              placeholder="输入邀请码"
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
            <button
              type="button"
              onClick={generateRandomCode}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
            >
              生成随机码
            </button>
            <button
              type="button"
              onClick={handleAddCode}
              disabled={loading}
              className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors disabled:bg-gray-400"
            >
              {loading ? '添加中...' : '添加'}
            </button>
          </div>
          
          <div className="text-sm text-gray-500 mt-2">
            <p>注意：邀请码添加后可用于用户注册，每个邀请码只能使用一次</p>
          </div>
        </div>
        
        {/* 邀请码列表 */}
        <div>
          <h2 className="text-lg font-medium text-gray-700 mb-4">邀请码列表</h2>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    邀请码
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    状态
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    使用者
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    使用时间
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {inviteCodes.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
                      {loading ? '加载中...' : '暂无邀请码，请点击"添加"按钮创建邀请码'}
                    </td>
                  </tr>
                ) : (
                  inviteCodes.map(code => (
                    <tr key={code.code}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {code.code}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${code.used ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                          {code.used ? '已使用' : '未使用'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {code.usedBy || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {code.usedAt ? new Date(code.usedAt).toLocaleString('zh-CN') : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        {!code.used && (
                          <button
                            onClick={() => handleDeleteCode(code.code)}
                            disabled={deletingCode === code.code}
                            className="text-red-600 hover:text-red-900"
                          >
                            {deletingCode === code.code ? '删除中...' : '删除'}
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
    </div>
  );
};

export default InviteCodes; 