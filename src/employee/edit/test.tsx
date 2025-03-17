import React, { useCallback, useEffect, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { 
    createDocumentByFileApi, 
    defaultDocumentUploadOptions, 
    CreateDocumentByFileData, 
    getDatasetsApi, 
    Dataset,
    getDatasetDocumentsApi,
    deleteDatasetDocumentApi,
    DocumentItem
} from '../../api/dify';
import { WxAccount } from '../../api/airflow';
import { supabase } from '../../auth/supabaseConfig';
import { UserProfileService } from '../../userManagement/userProfileService';

interface FileWithPreview extends File {
    preview?: string;
}

interface MaterialUploadProps {
    wxAccount?: WxAccount;
}

export const MaterialUpload: React.FC<MaterialUploadProps> = ({ wxAccount }) => {
    const [files, setFiles] = useState<FileWithPreview[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadStatus, setUploadStatus] = useState<{ success: string[], error: { name: string, message: string }[] }>({ success: [], error: [] });
    const [datasetId, setDatasetId] = useState<string>(); 
    const [datasets, setDatasets] = useState<Dataset[]>([]);
    const [loading, setLoading] = useState(true);
    const [notification, setNotification] = useState<{show: boolean, message: string}>({show: false, message: ''});
    
    // New states for document management
    const [documents, setDocuments] = useState<DocumentItem[]>([]);
    const [documentsLoading, setDocumentsLoading] = useState(false);
    const [deletingDocId, setDeletingDocId] = useState<string | null>(null);
    
    // Confirmation modal states
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [documentToDelete, setDocumentToDelete] = useState<{id: string, name: string} | null>(null);
    
    // User states
    const [isAdmin, setIsAdmin] = useState(false);
    const [userMaterialList, setUserMaterialList] = useState<string[]>([]);
    const [userLoading, setUserLoading] = useState(true);

    // 获取当前用户信息和权限
    useEffect(() => {
        const fetchUserData = async () => {
            try {
                setUserLoading(true);
                
                // 获取当前用户
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) return;
                
                // 获取用户配置
                const profile = await UserProfileService.getUserProfile(user.id);
                
                // 检查用户是否是管理员
                const { data: roleData } = await supabase
                    .from('user_profiles')
                    .select('role')
                    .eq('user_id', user.id)
                    .single();
                
                const isUserAdmin = roleData?.role === 'admin';
                setIsAdmin(isUserAdmin);
                
                // 获取用户可访问的素材库列表
                if (profile && profile.material_list) {
                    setUserMaterialList(profile.material_list);
                }
            } catch (error) {
                console.error('Failed to fetch user data:', error);
            } finally {
                setUserLoading(false);
            }
        };
        
        fetchUserData();
    }, []);
    
    // 获取数据集并根据用户权限进行过滤
    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const res = await getDatasetsApi({});
                
                // 管理员可以看到所有素材库
                // 非管理员只能看到分配给他们的素材库
                let filteredDatasets = res.data;
                if (!isAdmin && userMaterialList.length > 0) {
                    filteredDatasets = res.data.filter(dataset => 
                        userMaterialList.includes(dataset.id)
                    );
                } else if (!isAdmin && userMaterialList.length === 0) {
                    // 用户无权限且没有被分配素材库
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
        
        // 只有在用户加载完成后才获取数据集
        if (!userLoading) {
            fetchData();
        }
    }, [userLoading, isAdmin, userMaterialList, datasetId]);

    useEffect(() => {
        if (datasetId) {
            fetchDocuments();
        }
    }, [datasetId]);

    const fetchDocuments = async () => {
        if (!datasetId) return;
        
        try {
            setDocumentsLoading(true);
            const response = await getDatasetDocumentsApi(datasetId, { limit: 50 });
            setDocuments(response.data);
        } catch (error) {
            console.error('Failed to fetch documents:', error);
            showNotification('获取文档列表失败');
        } finally {
            setDocumentsLoading(false);
        }
    };

    const handleDeleteDocument = async (documentId: string) => {
        if (!datasetId) return;
        
        try {
            setDeletingDocId(documentId);
            await deleteDatasetDocumentApi(datasetId, documentId);
            
            // Update documents list
            setDocuments(prevDocs => prevDocs.filter(doc => doc.id !== documentId));
            
            showNotification('文档删除成功');
        } catch (error) {
            console.error('Failed to delete document:', error);
            showNotification('文档删除失败');
        } finally {
            setDeletingDocId(null);
            setShowDeleteModal(false);
            setDocumentToDelete(null);
        }
    };
    
    const openDeleteModal = (doc: DocumentItem) => {
        setDocumentToDelete({id: doc.id, name: doc.name});
        setShowDeleteModal(true);
    };
    
    const closeDeleteModal = () => {
        setShowDeleteModal(false);
        setDocumentToDelete(null);
    };

    const showNotification = (message: string) => {
        setNotification({
            show: true,
            message
        });
        
        setTimeout(() => {
            setNotification({show: false, message: ''});
        }, 3000);
    };

    const handleSelectDataset = (id: string) => {
        setDatasetId(id);
    };

    const onDrop = useCallback((acceptedFiles: File[]) => {
        const newFiles = acceptedFiles.map(file =>
            Object.assign(file, {
                preview: URL.createObjectURL(file)
            })
        );
        setFiles(prev => [...prev, ...newFiles]);
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'image/*': ['.jpeg', '.jpg', '.png', '.gif'],
            'application/pdf': ['.pdf'],
            'application/msword': ['.doc'],
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
            'text/plain': ['.txt']
        }
    });

    React.useEffect(() => {
        return () => {
            files.forEach(file => {
                if (file.preview) {
                    URL.revokeObjectURL(file.preview);
                }
            });
        };
    }, [files]);

    const handleUpload = async () => {
        if (files.length === 0 || !datasetId) return;

        setIsUploading(true);
        setUploadStatus({ success: [], error: [] });
        setNotification({show: false, message: ''});

        const uploadPromises = files.map(async (file) => {
            try {
                const data: CreateDocumentByFileData = {
                    ...defaultDocumentUploadOptions as CreateDocumentByFileData,
                    indexing_technique: 'high_quality',
                    process_rule: {
                        mode: 'custom',
                        rules: {
                            pre_processing_rules: [
                                { id: 'remove_extra_spaces', enabled: true },
                                { id: 'remove_urls_emails', enabled: true }
                            ],
                            segmentation: {
                                separator: '\n',
                                max_tokens: 1000
                            }
                        }
                    }
                };

                const result = await createDocumentByFileApi(datasetId, file, data);
                console.log('Upload success:', result);
                return { success: true, name: file.name, result };
            } catch (error) {
                console.error('Upload error:', error);
                return {
                    success: false,
                    name: file.name,
                    error: error instanceof Error ? error.message : 'Unknown error'
                };
            }
        });

        const results = await Promise.all(uploadPromises);

        const successFiles = results.filter(r => r.success).map(r => r.name);
        const errorFiles = results.filter(r => !r.success).map(r => ({
            name: r.name,
            message: typeof r.error === 'string' ? r.error : 'Upload failed'
        }));

        setUploadStatus({
            success: successFiles,
            error: errorFiles
        });

        // Show notification if there are successful uploads
        if (successFiles.length > 0) {
            const message = successFiles.length === 1 
                ? `成功上传: ${successFiles[0]}`
                : `成功上传 ${successFiles.length} 个文件`;
            
            showNotification(message);
            
            // Auto-hide notification after 3 seconds
            setTimeout(() => {
                setNotification({show: false, message: ''});
            }, 3000);

            const successFileNames = new Set(successFiles);
            setFiles(prevFiles => {
                const remainingFiles = prevFiles.filter(file => !successFileNames.has(file.name));
                prevFiles.forEach(file => {
                    if (successFileNames.has(file.name) && file.preview) {
                        URL.revokeObjectURL(file.preview);
                    }
                });
                return remainingFiles;
            });

            // Refresh documents list after successful upload
            fetchDocuments();
        }

        setIsUploading(false);
    };

    return (
        <div className="bg-white rounded-lg shadow-lg p-4 relative">
            {/* Success Notification Popup */}
            {notification.show && (
                <div className="absolute top-4 right-4 bg-green-100 border-l-4 border-green-500 text-green-700 p-3 rounded shadow-md z-10 max-w-xs transition-all duration-300 ease-in-out opacity-100">
                    <div className="flex items-center">
                        <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                        </svg>
                        <p className="text-base">{notification.message}</p>
                    </div>
                </div>
            )}
            
            {/* Delete Confirmation Modal */}
            {showDeleteModal && documentToDelete && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
                        <div className="mb-4">
                            <h3 className="text-lg font-medium text-gray-900">确认删除</h3>
                            <p className="text-sm text-gray-500 mt-2">
                                您确定要删除文档 <span className="font-semibold">{documentToDelete.name}</span> 吗？此操作无法撤销。
                            </p>
                        </div>
                        <div className="flex justify-end space-x-3">
                            <button
                                onClick={closeDeleteModal}
                                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
                                disabled={deletingDocId !== null}
                            >
                                取消
                            </button>
                            <button
                                onClick={() => handleDeleteDocument(documentToDelete.id)}
                                disabled={deletingDocId !== null}
                                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors disabled:bg-red-400"
                            >
                                {deletingDocId === documentToDelete.id ? (
                                    <span className="flex items-center">
                                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        删除中...
                                    </span>
                                ) : '确认删除'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="mb-4">
                <h3 className="text-xl font-medium text-gray-900 mb-3">素材库</h3>
                
                {loading ? (
                    <div className="flex justify-center items-center py-6">
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
                    <div className="border-b border-gray-200">
                        <ul className="flex flex-wrap -mb-px text-sm font-medium text-center">
                            {datasets.map((dataset) => (
                                <li key={dataset.id} className="mr-2">
                                    <button
                                        onClick={() => handleSelectDataset(dataset.id)}
                                        className={`inline-flex items-center justify-center p-4 border-b-2 rounded-t-lg group
                                            ${datasetId === dataset.id 
                                                ? 'text-purple-600 border-purple-600 active' 
                                                : 'border-transparent text-gray-500 hover:text-gray-600 hover:border-gray-300'}`}
                                    >
                                        <svg className="w-4 h-4 mr-2 text-gray-400 group-hover:text-gray-500" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20">
                                            <path d="M10 0C4.612 0 0 5.336 0 7c0 1.742 3.546 7 10 7 6.454 0 10-5.258 10-7 0-1.664-4.612-7-10-7Zm0 10a3 3 0 1 1 0-6 3 3 0 0 1 0 6Z"/>
                                        </svg>
                                        {dataset.name}
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>

            {/* Document List Section */}
            {datasetId && (
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
                            <span className="ml-3 text-gray-600">加载文档中...</span>
                        </div>
                    ) : documents.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                            暂无文档，请上传文件
                        </div>
                    ) : (
                        <div className="overflow-y-auto max-h-60">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            文件名
                                        </th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            操作
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {documents.map((doc) => (
                                        <tr key={doc.id}>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
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
            )}

            <div
                {...getRootProps()}
                className={`
                    border-2 border-dashed rounded-lg p-4
                    ${isDragActive ? 'border-purple-500 bg-purple-50' : 'border-gray-300'}
                    flex flex-col items-center justify-center cursor-pointer
                `}
            >
                <input {...getInputProps()} />
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <p className="mt-2 text-base text-gray-600">拖拽文件到这里，或者点击上传</p>
                <p className="text-sm text-gray-500 mt-1">
                    支持 PDF, DOC, DOCX, TXT 格式
                </p>
            </div>

            {files.length > 0 && (
                <>
                    <div className="mt-6 grid grid-cols-4 gap-4">
                        {files.map((file, index) => (
                            <div key={index} className="relative group">
                                {file.type.startsWith('image/') ? (
                                    <img
                                        src={file.preview}
                                        alt={file.name}
                                        className="w-full h-24 object-cover rounded-lg"
                                    />
                                ) : (
                                    <div className="w-full h-24 rounded-lg bg-gray-100 flex items-center justify-center p-2">
                                        <div className="text-center">
                                            <svg className="w-8 h-8 mx-auto mb-1 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                {file.type === 'application/pdf' ? (
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                ) : (
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0112.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                                )}
                                            </svg>
                                            <p className="text-xs text-gray-500 truncate">{file.name}</p>
                                        </div>
                                    </div>
                                )}
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setFiles(files.filter((_, i) => i !== index));
                                        if (file.preview) {
                                            URL.revokeObjectURL(file.preview);
                                        }
                                    }}
                                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                        ))}
                    </div>

                    <div className="mt-6">
                        <button
                            onClick={handleUpload}
                            disabled={isUploading}
                            className={`px-4 py-2 rounded-md text-white ${isUploading ? 'bg-purple-400' : 'bg-purple-600 hover:bg-purple-700'} transition-colors`}
                        >
                            {isUploading ? '上传中...' : '上传到知识库'}
                        </button>
                    </div>

                    {/* Upload Status Messages - Show both success and error messages */}
                    {(uploadStatus.success.length > 0 || uploadStatus.error.length > 0) && (
                        <div className="mt-4">
                            {uploadStatus.success.length > 0 && (
                                <div className="mb-2 p-2 bg-green-50 text-green-800 rounded">
                                    <h4 className="font-medium">成功上传:</h4>
                                    <ul className="list-disc pl-5 mt-1">
                                        {uploadStatus.success.map((name, idx) => (
                                            <li key={idx}>{name}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                            {uploadStatus.error.length > 0 && (
                                <div className="p-2 bg-red-50 text-red-800 rounded">
                                    <h4 className="font-medium">上传失败:</h4>
                                    <ul className="list-disc pl-5 mt-1">
                                        {uploadStatus.error.map((err, idx) => (
                                            <li key={idx}>{err.name}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    )}
                </>
            )}
        </div>
    );
};
