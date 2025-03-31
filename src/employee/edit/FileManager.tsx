import React, { useCallback, useEffect, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { tencentCOSService, CosFileItem } from '../../api/tencent_cos';
import { useUser } from '../../context/UserContext';
import { 
  createDocumentByFileApi, 
  CreateDocumentByFileData, 
  getDatasetsApi, 
  Dataset,
  DocType 
} from '../../api/dify';
import { WxAccount } from '../../api/airflow';

interface FileManagerProps {
  wxAccount?: WxAccount;
}

// 文件管理组件
const FileManager: React.FC<FileManagerProps> = ({ wxAccount }) => {
    // 文件上传状态
    const [files, setFiles] = useState<File[]>([]);
    const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({});
    const [uploadedFiles, setUploadedFiles] = useState<CosFileItem[]>([]);
    const [notification, setNotification] = useState<{ show: boolean, message: string, type?: 'success' | 'error' }>({ 
      show: false, 
      message: '',
      type: 'success' 
    });
    
    // 用户上下文
    const { userProfile, isLoading: userLoading } = useUser();
    
    // 知识库集成状态
    const [datasets, setDatasets] = useState<Dataset[]>([]);
    const [selectedDataset, setSelectedDataset] = useState<string | null>(null);
    const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
    const [isAddingToDify, setIsAddingToDify] = useState(false);
    const [datasetsLoading, setDatasetsLoading] = useState(false);
    const [showDatasetSelector, setShowDatasetSelector] = useState(false);
    
    // 文件拖放上传配置
    const onDrop = useCallback((acceptedFiles: File[]) => {
        setFiles(acceptedFiles.map(file => Object.assign(file, {
            preview: URL.createObjectURL(file)
        })));
    }, []);
    
    const { getRootProps, getInputProps } = useDropzone({
        onDrop,
        accept: {
            'application/pdf': ['.pdf'],
            'application/msword': ['.doc'],
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
            'text/plain': ['.txt'],
            'application/vnd.ms-excel': ['.xls'],
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
            'text/csv': ['.csv']
        },
        maxSize: 100 * 1024 * 1024 // 100MB
    });
    
    // 获取已上传的文件列表
    useEffect(() => {
        if (!userLoading && userProfile) {
            fetchFiles();
            fetchDatasets();
        }
    }, [userLoading, userProfile]);
    
    // 获取用户上传的文件
    const fetchFiles = async () => {
        try {
            if (userProfile) {
                const userDisplayName = userProfile.display_name || 'unknown_user';
                const fileList = await tencentCOSService.listFiles(userDisplayName);
                
                // 过滤文件列表，只保留实际文件，去除文件夹
                const filteredFiles = fileList.filter(file => {
                    // 检查是否是文件而不是目录
                    // 文件在COS中通常有扩展名、有大小，并且不以/结尾
                    const isFile = file.size > 0 && !!file.name && !file.key.endsWith('/');
                    
                    // 确保文件就在当前用户的目录下，而不是子目录
                    const isDirectFile = file.key.split('/').length === 2; // 用户名/文件名的形式
                    
                    return isFile && isDirectFile;
                });
                
                setUploadedFiles(filteredFiles);
            }
        } catch (error) {
            console.error('Failed to fetch files:', error);
            showNotification('获取文件列表失败', 'error');
        }
    };
    
    // 获取知识库列表
    const fetchDatasets = async () => {
        try {
            setDatasetsLoading(true);
            const response = await getDatasetsApi({ limit: '50' });
            
            // 判断用户权限
            const isUserAdmin = userProfile?.role?.toLowerCase() === 'admin';
            const userMaterialList = userProfile?.material_list || [];
            
            // 管理员可以看到所有素材库
            // 非管理员只能看到分配给他们的素材库
            let filteredDatasets = response.data;
            if (!isUserAdmin && userMaterialList.length > 0) {
                filteredDatasets = response.data.filter(dataset =>
                    userMaterialList.includes(dataset.id)
                );
            } else if (!isUserAdmin && userMaterialList.length === 0) {
                filteredDatasets = [];
            }
            
            console.log('User dataset permissions:', {
                isAdmin: isUserAdmin,
                userMaterialList,
                availableDatasets: filteredDatasets.map(d => ({ id: d.id, name: d.name }))
            });
            
            setDatasets(filteredDatasets);
            if (filteredDatasets.length > 0 && !selectedDataset) {
                setSelectedDataset(filteredDatasets[0].id);
            }
        } catch (error) {
            console.error('Failed to fetch datasets:', error);
        } finally {
            setDatasetsLoading(false);
        }
    };
    
    // 处理文件上传到腾讯云COS
    const handleUpload = async () => {
        if (files.length === 0) return;
        
        // 清空进度条状态
        setUploadProgress({});
        
        try {
            const userDisplayName = userProfile?.display_name || 'unknown_user';
            
            const uploadPromises = files.map(async (file) => {
                // 显示上传开始通知
                showNotification(`开始上传文件 ${file.name}`, 'success');
                
                try {
                    // 上传文件到腾讯云COS
                    await tencentCOSService.uploadFile(
                        file,
                        `${userDisplayName}`, // 只传递用户目录，不包含文件名
                        (progressData) => {
                            setUploadProgress(prev => ({
                                ...prev,
                                [file.name]: progressData.percent * 100
                            }));
                        }
                    );
                    
                    // 显示上传成功通知
                    showNotification(`文件 ${file.name} 上传成功`, 'success');
                    return true;
                } catch (error) {
                    console.error(`Error uploading ${file.name}:`, error);
                    showNotification(`文件 ${file.name} 上传失败`, 'error');
                    return false;
                }
            });
            
            await Promise.all(uploadPromises);
            
            // 清空选中的文件并刷新文件列表
            setFiles([]);
            fetchFiles();
            
        } catch (error) {
            console.error('Upload error:', error);
            showNotification('上传过程中发生错误', 'error');
        }
    };
    
    // 处理文件删除
    const handleDelete = async (file: CosFileItem) => {
        try {
            // 删除腾讯云COS中的文件
            await tencentCOSService.deleteFile(file.key);
            
            // 更新文件列表
            setUploadedFiles(uploadedFiles.filter(f => f.key !== file.key));
            
            showNotification(`已删除文件: ${file.name}`, 'success');
        } catch (error) {
            console.error('Delete error:', error);
            showNotification(`删除文件 ${file.name} 失败`, 'error');
        }
    };
    
    // 显示通知信息
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
    
    // 切换文件选择状态
    const toggleFileSelection = (fileKey: string) => {
        setSelectedFiles(prevSelected => {
            if (prevSelected.includes(fileKey)) {
                return prevSelected.filter(key => key !== fileKey);
            } else {
                return [...prevSelected, fileKey];
            }
        });
    };
    
    // 添加单个文件到Dify知识库
    const handleAddFileToDify = async (file: CosFileItem) => {
        // 每次点击AI图标，都显示知识库选择对话框
        setSelectedFiles([file.key]);
        setShowDatasetSelector(true);
        
        // 如果还没有获取知识库列表，先获取
        if (datasets.length === 0) {
            await fetchDatasets();
        }
    };
    
    // 添加选中的文件到Dify知识库
    const addSelectedFilesToDify = async () => {
        if (!selectedDataset || selectedFiles.length === 0) {
            showNotification('请选择知识库和文件', 'error');
            return;
        }
        
        setIsAddingToDify(true);
        
        try {
            const selectedFilesData = uploadedFiles.filter(file => 
                selectedFiles.includes(file.key)
            );
            
            // 批量添加文件到知识库
            const addPromises = selectedFilesData.map(async (file) => {
                try {
                    // 显示处理中状态
                    showNotification(`正在处理文件 ${file.name}...`, 'success');
                    
                    // 从文件名提取扩展名
                    const fileExt = file.name.split('.').pop()?.toLowerCase() || '';
                    
                    // 根据文件类型确定doc_type
                    let docType: DocType = 'personal_document';
                    if (['doc', 'docx', 'pdf', 'txt'].includes(fileExt)) {
                        docType = 'personal_document';
                    } else if (['csv', 'xls', 'xlsx'].includes(fileExt)) {
                        docType = 'business_document';
                    } else if (['ppt', 'pptx'].includes(fileExt)) {
                        docType = 'business_document';
                    }
                    
                    // 从腾讯云COS获取文件内容
                    console.log(`从腾讯云获取文件: ${file.key}`);
                    const fileObj = await tencentCOSService.getFileContent(file.key, file.name, file.type);
                    
                    // 准备请求数据
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
                            cos_url: file.url,
                            cos_key: file.key,
                            filename: file.name,
                            upload_time: new Date().toISOString()
                        }
                    };
                    
                    console.log(`上传文件到Dify知识库 ${selectedDataset}`);
                    // 调用API添加文件到知识库
                    await createDocumentByFileApi(selectedDataset, fileObj, data);
                    return true;
                } catch (error) {
                    console.error(`Failed to add ${file.name} to Dify:`, error);
                    return false;
                }
            });
            
            const results = await Promise.all(addPromises);
            const successCount = results.filter(Boolean).length;
            
            if (successCount === selectedFiles.length) {
                showNotification(`成功添加${successCount}个文件到知识库`, 'success');
            } else {
                showNotification(`添加完成：${successCount}/${selectedFiles.length}个文件成功`, 
                    successCount > 0 ? 'success' : 'error');
            }
            
            // 重置选择
            setSelectedFiles([]);
            setShowDatasetSelector(false);
            
        } catch (error) {
            console.error('Failed to add files to Dify:', error);
            showNotification('添加文件到知识库失败', 'error');
        } finally {
            setIsAddingToDify(false);
        }
    };
    
    // 渲染上传进度条
    const renderProgressBar = (filename: string) => {
        const progress = uploadProgress[filename] || 0;
        return (
            <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div 
                    className="bg-purple-600 h-2.5 rounded-full" 
                    style={{ width: `${progress}%` }}
                ></div>
                <p className="text-xs text-gray-500 mt-1">{progress.toFixed(0)}%</p>
            </div>
        );
    };
    
    // 根据文件类型获取图标
    const getFileIcon = (fileType: string) => {
        if (fileType.includes('pdf')) return '📄';
        if (fileType.includes('word') || fileType.includes('doc')) return '📝';
        if (fileType.includes('excel') || fileType.includes('sheet') || fileType.includes('csv')) return '📊';
        if (fileType.includes('powerpoint') || fileType.includes('presentation')) return '📊';
        if (fileType.includes('text')) return '📄';
        return '📁';
    };

    return (
        <div className="bg-white shadow-lg rounded-lg p-4">
            {/* 通知栏 */}
            {notification.show && (
                <div className={`fixed top-4 right-4 ${notification.type === 'success' ? 'bg-green-500' : 'bg-red-500'} text-white px-4 py-2 rounded-md shadow-lg z-50`}>
                    {notification.message}
                </div>
            )}
            
            {/* 标题栏 */}
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-800">文件管理</h2>
                
                {/* 批量操作按钮 */}
                <div className="flex space-x-2">
                    {selectedFiles.length > 0 && (
                        <button
                            onClick={() => setShowDatasetSelector(true)}
                            className="px-3 py-1.5 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors text-sm flex items-center"
                        >
                            添加到知识库 ({selectedFiles.length})
                        </button>
                    )}
                    <button
                        onClick={fetchFiles}
                        className="px-3 py-1.5 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors text-sm"
                    >
                        刷新
                    </button>
                </div>
            </div>
            
            {/* 文件上传区域 */}
            <div className="mb-6">
                {/* 上传速度提示 */}
                <div className="p-4 border rounded-lg bg-blue-50 mb-4">
                    <h3 className="text-lg font-medium text-blue-800 mb-2">上传资料说明</h3>
                    <p className="text-sm text-blue-600">上传的资料需要等待3-5个工作日处理。</p>
                </div>
                <div
                    {...getRootProps()}
                    className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-purple-500 transition-colors cursor-pointer"
                >
                    <input {...getInputProps()} />
                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <p className="mt-2 text-sm text-gray-600">拖拽文件到此处或点击选择文件</p>
                    <p className="text-xs text-gray-500 mt-1">支持 PDF, Word, Excel, TXT, CSV 格式（最大100MB）</p>
                </div>
                
                {/* 选中的待上传文件列表 */}
                {files.length > 0 && (
                    <div className="mt-4">
                        <div className="flex justify-between items-center mb-2">
                            <h3 className="text-md font-medium text-gray-700">已选择的文件</h3>
                            <button
                                onClick={handleUpload}
                                className="px-3 py-1 bg-[rgba(108,93,211,1)] text-white rounded-md hover:bg-[rgba(98,83,201,1)] transition-colors text-sm"
                            >
                                上传全部
                            </button>
                        </div>
                        <div className="space-y-3">
                            {files.map((file) => (
                                <div key={file.name} className="border rounded-lg p-3">
                                    <div className="flex justify-between items-start">
                                        <div className="flex items-center">
                                            <span className="text-2xl mr-2">
                                                {file.type.includes('pdf') ? '📄' : 
                                                 file.type.includes('word') || file.type.includes('doc') ? '📝' :
                                                 file.type.includes('excel') || file.type.includes('sheet') ? '📊' :
                                                 file.type.includes('powerpoint') ? '📊' : '📁'}
                                            </span>
                                            <div>
                                                <p className="font-medium text-gray-900">{file.name}</p>
                                                <p className="text-xs text-gray-500">{(file.size / 1024).toFixed(1)} KB</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => setFiles(files.filter(f => f !== file))}
                                            className="text-gray-400 hover:text-red-500"
                                        >
                                            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                    </div>
                                    {uploadProgress[file.name] !== undefined && (
                                        <div className="mt-2">
                                            {renderProgressBar(file.name)}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
            
            {/* 知识库选择器模态窗口 */}
            {showDatasetSelector && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg shadow-xl p-4 w-96">
                        <div className="flex justify-between items-center mb-3">
                            <h3 className="text-lg font-medium text-gray-900">链接知识库</h3>
                            <button 
                                onClick={() => setShowDatasetSelector(false)}
                                className="text-gray-400 hover:text-gray-500"
                            >
                                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        
                        {datasetsLoading ? (
                            <div className="flex justify-center py-4">
                                <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-[rgba(108,93,211,1)]"></div>
                            </div>
                        ) : (
                            <div className="mb-4">
                                <div className="relative rounded-md shadow-sm">
                                    {selectedDataset && (
                                        <div className="flex items-center px-3 py-2 border border-gray-300 rounded-md">
                                            <span>{datasets.find(d => d.id === selectedDataset)?.name}</span>
                                            {selectedDataset && (
                                                <button 
                                                    onClick={() => setSelectedDataset(null)}
                                                    className="ml-2 text-gray-400 hover:text-gray-500"
                                                >
                                                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                    </svg>
                                                </button>
                                            )}
                                        </div>
                                    )}

                                    {!selectedDataset && (
                                        <div className="mt-1">
                                            <ul className="bg-white rounded-md shadow-lg max-h-60 overflow-auto p-1">
                                                {datasets.length === 0 ? (
                                                    <li className="px-3 py-2 text-gray-500 text-center">暂无可用的知识库</li>
                                                ) : (
                                                    datasets.map(dataset => (
                                                        <li
                                                            key={dataset.id}
                                                            onClick={() => setSelectedDataset(dataset.id)}
                                                            className="px-3 py-2 hover:bg-gray-100 cursor-pointer rounded-md flex items-center"
                                                        >
                                                            <svg className="w-5 h-5 mr-2 text-[rgba(108,93,211,1)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                                                            </svg>
                                                            {dataset.name}
                                                        </li>
                                                    ))
                                                )}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                        
                        <div className="flex justify-end space-x-2">
                            <button
                                onClick={() => setShowDatasetSelector(false)}
                                className="px-4 py-2 border border-gray-300 rounded text-sm text-gray-700 bg-white hover:bg-gray-50"
                            >
                                取消
                            </button>
                            <button
                                onClick={addSelectedFilesToDify}
                                disabled={!selectedDataset || selectedFiles.length === 0 || isAddingToDify}
                                className={`px-4 py-2 rounded text-sm text-white bg-[rgba(108,93,211,1)] hover:bg-[rgba(98,83,201,1)]
                                    ${(!selectedDataset || selectedFiles.length === 0 || isAddingToDify) ? 'opacity-50 cursor-not-allowed' : ''}
                                `}
                            >
                                确定
                            </button>
                        </div>
                    </div>
                </div>
            )}
            
            {/* 已上传文件列表 */}
            <div>
                <h3 className="text-md font-medium text-gray-800 mb-3">已上传文件</h3>
                
                {uploadedFiles.length === 0 ? (
                    <div className="text-center py-8 bg-gray-50 rounded-lg">
                        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                        </svg>
                        <p className="mt-2 text-gray-500">暂无已上传文件</p>
                    </div>
                ) : (
                    <div className="bg-white shadow overflow-x-auto rounded-lg">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        选择
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        名称
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        上传日期
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        大小
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        操作
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {uploadedFiles.map((file) => (
                                    <tr key={file.key} className={selectedFiles.includes(file.key) ? 'bg-[rgba(108,93,211,0.1)]' : 'hover:bg-gray-50'}>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <input
                                                type="checkbox"
                                                checked={selectedFiles.includes(file.key)}
                                                onChange={() => toggleFileSelection(file.key)}
                                                className="h-4 w-4 text-[rgba(108,93,211,1)] border-gray-300 rounded focus:ring-[rgba(108,93,211,1)]"
                                            />
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <span className="text-2xl mr-2">{getFileIcon(file.type)}</span>
                                                <span className="text-sm font-medium text-gray-900">{file.name}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {new Date(file.lastModified).toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {(file.size / 1024).toFixed(1)} KB
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            <div className="flex space-x-2">
                                                <button 
                                                    onClick={() => window.open(file.url, '_blank')}
                                                    className="text-[rgba(108,93,211,1)] hover:text-[rgba(88,73,191,1)]"
                                                    title="查看文件"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                    </svg>
                                                </button>
                                                <button 
                                                    onClick={() => handleDelete(file)}
                                                    className="text-red-600 hover:text-red-900"
                                                    title="删除文件"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                    </svg>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default FileManager;
