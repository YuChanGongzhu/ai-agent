import React from 'react';
import FileManager from '../employee/edit/FileManager';
import { useUser } from '../context/UserContext';

const FileManagement: React.FC = () => {
  const { userProfile, isAdmin } = useUser();
  
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">文件管理</h1>
      <FileManager />
    </div>
  );
};

export default FileManagement;
