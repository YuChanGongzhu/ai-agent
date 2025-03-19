import React, { useState, useEffect } from 'react';
import {
  createDocumentByFileApi,
  CreateDocumentByFileData,
  getDatasetsApi,
  Dataset,
  getDatasetDocumentsApi,
  deleteDatasetDocumentApi,
  DocumentItem,
  createDatasetApi,
  DocType
} from '../../api/dify';
import { CosFileItem } from '../../api/tencent_cos';
import { useUser } from '../../context/UserContext';
import { WxAccount } from '../../api/airflow';

interface MaterialUploadProps {
  wxAccount?: WxAccount;
}

// 知识库素材上传组件 - 重新设计
export const MaterialUpload: React.FC<MaterialUploadProps> = ({ wxAccount }) => {
  // 数据集相关状态
  const [datasetId, setDatasetId] = useState<string>();
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreatingDataset, setIsCreatingDataset] = useState(false);
  const [notification, setNotification] = useState<{ show: boolean, message: string, type?: 'success' | 'error' }>({
    show: false,
    message: '',
    type: 'success'
  });

  // 文档相关状态
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [documentsLoading, setDocumentsLoading] = useState(false);
  const [deletingDocId, setDeletingDocId] = useState<string | null>(null);
  const [documentToDelete, setDocumentToDelete] = useState<{ id: string, name: string } | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // 添加文档相关状态
  const [selectedFile, setSelectedFile] = useState<CosFileItem | null>(null);
  const [isAddingDocument, setIsAddingDocument] = useState(false);

  // 新增素材库相关状态
  const [showCreateDatasetModal, setShowCreateDatasetModal] = useState(false);
  const [newDatasetName, setNewDatasetName] = useState('');
  const [newDatasetDescription, setNewDatasetDescription] = useState('');

  // 用户权限相关状态
  const { userProfile, isLoading: userContextLoading, isAdmin: contextIsAdmin } = useUser();
  const [userLoading, setUserLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [userMaterialList, setUserMaterialList] = useState<string[]>([]);

  // 加载用户权限
  useEffect(() => {
    if (!userContextLoading) {
      try {
        setUserLoading(true);
        setIsAdmin(contextIsAdmin);
        if (userProfile && userProfile.material_list) {
          setUserMaterialList(userProfile.material_list);
        }
      } catch (error) {
        console.error('获取用户权限失败:', error);
      } finally {
        setUserLoading(false);
      }
    }
  }, [userProfile, contextIsAdmin, userContextLoading]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await getDatasetsApi({ limit: '50' });

        let filteredDatasets = res.data;
        if (!isAdmin && userMaterialList.length > 0) {
          filteredDatasets = res.data.filter(dataset =>
            userMaterialList.includes(dataset.id)
          );
        } else if (!isAdmin && userMaterialList.length === 0) {
          filteredDatasets = [];
        }

        console.log('User material permissions:', {
          isAdmin,
          userMaterialList,
          availableDatasets: filteredDatasets.map(d => ({ id: d.id, name: d.name }))
        });

        setDatasets(filteredDatasets);

        // 如果有可用的数据集且没有选择任何数据集，选择第一个
        if (filteredDatasets.length > 0 && !datasetId) {
          setDatasetId(filteredDatasets[0].id);
        }
      } catch (error) {
        console.error('Failed to fetch datasets:', error);
      } finally {
        setLoading(false);
      }
    };

    if (!userLoading) {
      fetchData();
    }
  }, [userLoading, isAdmin, userMaterialList, datasetId]);

  useEffect(() => {
    if (datasetId) {
      fetchDocuments();
    }
  }, [datasetId]);
  
  const handleSelectDataset = (id: string) => {
    setDatasetId(id);
  };

  const handleCreateDataset = async () => {
    if (!newDatasetName.trim()) return;

    try {
      setIsCreatingDataset(true);

      const response = await createDatasetApi({
        name: newDatasetName.trim(),
        description: newDatasetDescription.trim() || undefined,
        indexing_technique: 'high_quality',
        permission: 'all_team_members',
      });

      setDatasets(prev => [response, ...prev]);
      setDatasetId(response.id);

      setShowCreateDatasetModal(false);
      setNewDatasetName('');
      setNewDatasetDescription('');

      showNotification('素材库创建成功', 'success');
    } catch (error) {
      console.error('Failed to create dataset:', error);
      showNotification('创建素材库失败', 'error');
    } finally {
      setIsCreatingDataset(false);
    }
  };

  const fetchDocuments = async () => {
    if (!datasetId) return;

    try {
      setDocumentsLoading(true);
      const response = await getDatasetDocumentsApi(datasetId, { limit: 50 });
      setDocuments(response.data);
    } catch (error) {
      console.error('Failed to fetch documents:', error);
    } finally {
      setDocumentsLoading(false);
    }
  };

  const handleDeleteDocument = async (documentId: string) => {
    if (!datasetId) return;

    try {
      setDeletingDocId(documentId);

      await deleteDatasetDocumentApi(datasetId, documentId);

      setDocuments(prevDocs => prevDocs.filter(doc => doc.id !== documentId));

      showNotification('文档删除成功', 'success');
    } catch (error) {
      console.error('Failed to delete document:', error);
      showNotification('删除文档失败', 'error');
    } finally {
      setDeletingDocId(null);
      setShowDeleteModal(false);
      setDocumentToDelete(null);
    }
  };

  const openDeleteModal = (doc: DocumentItem) => {
    setDocumentToDelete({ id: doc.id, name: doc.name });
    setShowDeleteModal(true);
  };
  const closeDeleteModal = () => {
    setShowDeleteModal(false);
    setDocumentToDelete(null);
  };

  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({
      show: true,
      message,
      type
    });

    setTimeout(() => {
      setNotification({ show: false, message: '', type: 'success' });
    }, 3000);
  };

  const handleFileSelect = async (cosFile: CosFileItem) => {
    if (!datasetId) {
      showNotification('请先选择或创建一个知识库', 'error');
      return;
    }

    setSelectedFile(cosFile);
  };

  const addFileToDify = async () => {
    if (!selectedFile || !datasetId) return;

    try {
      setIsAddingDocument(true);
      
      const fileName = selectedFile.name;
      const fileExt = fileName.split('.').pop()?.toLowerCase() || '';
      
      let docType: DocType = 'personal_document';
      if (['doc', 'docx', 'pdf', 'txt'].includes(fileExt)) {
        docType = 'personal_document';
      } else if (['csv', 'xls', 'xlsx'].includes(fileExt)) {
        docType = 'business_document';
      } else if (['ppt', 'pptx'].includes(fileExt)) {
        docType = 'business_document';
      }

      const fileBlob = new Blob([''], { type: selectedFile.type });
      const file = new File([fileBlob], fileName, { type: selectedFile.type });

      const data: CreateDocumentByFileData = {
        indexing_technique: 'high_quality',
        doc_type: docType,
        process_rule: {
          mode: 'automatic',
          rules: {
            pre_processing_rules: [
              { id: 'remove_extra_spaces', enabled: true },
            ],
            segmentation: {
              separator: '\n',
              max_tokens: 1000
            }
          }
        },
        doc_metadata: {
          cos_url: selectedFile.url,
          cos_key: selectedFile.key,
          filename: fileName,
          upload_time: new Date().toISOString()
        }
      };

      const result = await createDocumentByFileApi(datasetId, file, data);
      
      fetchDocuments();
      
      setSelectedFile(null);
      
      showNotification(`成功将文件 ${fileName} 添加到知识库`, 'success');
      
    } catch (error: any) {
      console.error('添加文件到知识库失败:', error);
      showNotification(
        `添加失败: ${error.message || '未知错误'}`,
        'error'
      );
    } finally {
      setIsAddingDocument(false);
    }
  };

  return (
    <div className="bg-white shadow-md rounded-lg p-4">
      {/* 通知消息 */}
      {notification.show && (
        <div className={`fixed top-4 right-4 ${notification.type === 'success' ? 'bg-green-500' : 'bg-red-500'} text-white px-4 py-2 rounded-md shadow-lg z-50`}>
          {notification.message}
        </div>
      )}

      {/* 创建素材库模态窗口 */}
      {showCreateDatasetModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
            <div className="mb-4">
              <h3 className="text-lg font-medium text-gray-900">创建新素材库</h3>
              <p className="text-sm text-gray-500">
                创建新的知识库素材库，用于存储和管理文档。
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label htmlFor="dataset-name" className="block text-sm font-medium text-gray-700">素材库名称</label>
                <input
                  type="text"
                  id="dataset-name"
                  value={newDatasetName}
                  onChange={(e) => setNewDatasetName(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 text-sm"
                  placeholder="例如：客户资料库"
                />
              </div>

              <div>
                <label htmlFor="dataset-description" className="block text-sm font-medium text-gray-700">描述（可选）</label>
                <textarea
                  id="dataset-description"
                  value={newDatasetDescription}
                  onChange={(e) => setNewDatasetDescription(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 text-sm"
                  rows={3}
                  placeholder="描述这个素材库的用途"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-5">
              <button
                onClick={() => {
                  setShowCreateDatasetModal(false);
                  setNewDatasetName('');
                  setNewDatasetDescription('');
                }}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                取消
              </button>
              <button
                onClick={handleCreateDataset}
                disabled={!newDatasetName.trim() || isCreatingDataset}
                className={`px-3 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500
                  ${(!newDatasetName.trim() || isCreatingDataset) ? 'opacity-50 cursor-not-allowed' : ''}
                `}
              >
                {isCreatingDataset ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline-block" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    创建中...
                  </>
                ) : '创建素材库'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && documentToDelete && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
            <div className="mb-4">
              <h3 className="text-lg font-medium text-red-600">确认删除</h3>
              <p className="text-sm text-gray-500 mt-2">
                您确定要删除文档 <span className="font-medium">{documentToDelete.name}</span> 吗？此操作无法撤销。
              </p>
            </div>
            <div className="flex justify-end space-x-3">
              <button
                onClick={closeDeleteModal}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                取消
              </button>
              <button
                onClick={() => handleDeleteDocument(documentToDelete.id)}
                disabled={!!deletingDocId}
                className={`px-3 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none
                  ${deletingDocId ? 'opacity-50 cursor-not-allowed' : ''}
                `}
              >
                {deletingDocId === documentToDelete.id ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline-block" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    删除中...
                  </>
                ) : '删除'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 主内容区域 */}
      <div className="mb-1 flex justify-between items-center">
        <h3 className="text-xl font-medium text-gray-900">知识库</h3>
        {isAdmin && (
          <button
            onClick={() => setShowCreateDatasetModal(true)}
            className="px-3 py-1 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors text-sm flex items-center"
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            创建知识库
          </button>
        )}
      </div>

      {/* 数据集选择标签 */}
      {loading ? (
        <div className="flex justify-center items-center m-4">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-600"></div>
            <span className="ml-3 text-lg text-gray-600">加载中...</span>
        </div>
      ) : datasets.length === 0 ? (
        <div className="text-center py-10 border-2 border-dashed border-gray-300 rounded-lg">
            <p className="text-gray-500 mb-2">没有可用的数据集</p>
            {!isAdmin && (
                <p className="text-sm text-gray-400">请联系管理员获取素材库访问权限</p>
            )}
        </div>
      ) : (
        <div className="mb-2 overflow-x-auto">
            <div className="flex flex-nowrap space-x-2 pb-1 min-w-max">
                {datasets.map((dataset) => (
                    <div
                        key={dataset.id}
                        onClick={() => handleSelectDataset(dataset.id)}
                        className={`
                            flex items-center px-4 py-2 rounded-full cursor-pointer transition-all whitespace-nowrap
                            ${datasetId === dataset.id
                                ? 'bg-purple-100 text-purple-700 border border-purple-300'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}
                        `}
                    >
                        <div className="flex items-center">
                            <span className="text-base">{dataset.name}</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
      )}

      {/* 文件选择和添加区域 */}
      {datasetId && (
        <div className="space-y-6">
          {/* 选中的数据集信息 */}
          <div className="p-4 border rounded-lg bg-blue-50">
            <h3 className="text-lg font-medium text-blue-800 mb-2">{datasets.find(d => d.id === datasetId)?.name}</h3>
            <p className="text-sm text-blue-600">已选择此知识库，您可以在「文件管理」选项卡中将文件添加到此知识库。</p>
          </div>

          {/* 知识库文档列表 */}
          <div className="mb-2 border rounded-lg p-4">
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-lg font-medium text-gray-900">知识库文档</h4>
              <button 
                onClick={fetchDocuments}
                className="text-sm text-purple-600 hover:text-purple-800"
              >
                刷新
              </button>
            </div>

            {documentsLoading ? (
              <div className="flex justify-center items-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-purple-600"></div>
              </div>
            ) : documents.length === 0 ? (
              <div className="text-center py-8 bg-gray-50 rounded-lg">
                <p className="text-gray-500">暂无文档，请添加文件到知识库</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">文档名称</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {documents.map((doc) => (
                      <tr key={doc.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {doc.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <button
                            onClick={() => openDeleteModal(doc)}
                            className="text-red-600 hover:text-red-900"
                          >
                            删除
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

