import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';

interface FileWithPreview extends File {
    preview?: string;
}

export const MaterialUpload: React.FC = () => {
    const [files, setFiles] = useState<FileWithPreview[]>([]);

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

    return (
        <div className="bg-white rounded-lg shadow-lg p-6">
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
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
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
            )}
        </div>
    );
};
