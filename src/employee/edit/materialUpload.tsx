import React, { useCallback, useEffect, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { createDocumentByFileApi, defaultDocumentUploadOptions, CreateDocumentByFileData, getDatasetsApi, Dataset } from '../../api/dify';
import { WxAccount } from '../../api/airflow';

interface FileWithPreview extends File {
    preview?: string;
}

interface MaterialUploadProps {
    wxAccount?: WxAccount;
}

export const MaterialUpload: React.FC<MaterialUploadProps> = ({ wxAccount }) => {
    const [files, setFiles] = useState<FileWithPreview[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadStatus, setUploadStatus] = useState<{success: string[], error: {name: string, message: string}[]}>({success: [], error: []});
    const [datasetId, setDatasetId] = useState<string>('e3044eb3-694c-4c23-82ed-88a8bc9feda1'); // Default dataset ID
    const [datasets, setDatasets] = useState<Dataset[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const res = await getDatasetsApi({});
                console.log('知识库', res);
                setDatasets(res.data);
                
                // If we have datasets and no datasetId is selected yet, select the first one
                if (res.data.length > 0 && !datasetId) {
                    setDatasetId(res.data[0].id);
                }
            } catch (error) {
                console.error('Failed to fetch datasets:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

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
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
        }
    });

    // Clean up previews when component unmounts
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
        setUploadStatus({success: [], error: []});
        
        const uploadPromises = files.map(async (file) => {
            try {
                // Use default options with any necessary overrides
                const data: CreateDocumentByFileData = {
                    ...defaultDocumentUploadOptions as CreateDocumentByFileData,
                    indexing_technique: 'high_quality', // This is now explicitly typed as 'high_quality' | 'economy'
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
        
        // Update status with results
        const successFiles = results.filter(r => r.success).map(r => r.name);
        const errorFiles = results.filter(r => !r.success).map(r => ({ 
            name: r.name, 
            message: typeof r.error === 'string' ? r.error : 'Upload failed'
        }));
        
        setUploadStatus({
            success: successFiles,
            error: errorFiles
        });
        
        // Clear successfully uploaded files
        if (successFiles.length > 0) {
            const successFileNames = new Set(successFiles);
            setFiles(prevFiles => {
                const remainingFiles = prevFiles.filter(file => !successFileNames.has(file.name));
                // Revoke object URLs for removed files
                prevFiles.forEach(file => {
                    if (successFileNames.has(file.name) && file.preview) {
                        URL.revokeObjectURL(file.preview);
                    }
                });
                return remainingFiles;
            });
        }
        
        setIsUploading(false);
    };

    return (
        <div className="bg-white rounded-lg shadow-lg p-6">
            {/* Knowledge Base Tabs */}
            {loading ? (
                <div className="flex justify-center items-center h-12 mb-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-500"></div>
                </div>
            ) : (
                <div className="mb-6 overflow-x-auto">
                    <div className="flex space-x-2 pb-2">
                        {datasets.map((dataset) => (
                            <div
                                key={dataset.id}
                                onClick={() => handleSelectDataset(dataset.id)}
                                className={`
                                    flex items-center px-4 py-2 rounded-full cursor-pointer transition-all
                                    ${datasetId === dataset.id 
                                        ? 'bg-purple-100 text-purple-700 border border-purple-300' 
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}
                                `}
                            >
                                <div className="flex items-center">
                                    <span className="mr-2">{dataset.name}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="mb-4">
                <h3 className="text-lg font-medium text-gray-900">素材库</h3>
            </div>
            
            <div 
                {...getRootProps()} 
                className={`
                    border-2 border-dashed rounded-lg p-8
                    ${isDragActive ? 'border-purple-500 bg-purple-50' : 'border-gray-300'}
                    transition-colors duration-200 ease-in-out
                    flex flex-col items-center justify-center
                    cursor-pointer
                    hover:border-purple-500 hover:bg-purple-50
                `}
            >
                <input {...getInputProps()} />
                <div className="text-center">
                    {isDragActive ? (
                        <div className="text-purple-600">
                            <svg className="w-12 h-12 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                            </svg>
                            <p>放开文件以上传</p>
                        </div>
                    ) : (
                        <>
                            <svg className="w-12 h-12 mx-auto mb-2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            <p className="text-gray-600">拖拽文件到此处上传</p>
                            <p className="text-sm text-gray-500 mt-1">
                                支持 JPG, PNG, GIF, PDF, DOC, DOCX 格式
                            </p>
                        </>
                    )}
                </div>
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
                    
                    {/* Upload Status Messages */}
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
                                            <li key={idx}>{err.name}: {err.message}</li>
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
