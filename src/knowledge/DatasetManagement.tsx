import React from 'react';
import { MaterialUpload } from '../employee/edit/materialUpload';
import { useUser } from '../context/UserContext';

const DatasetManagement: React.FC = () => {
  const { userProfile, isAdmin } = useUser();
  
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">知识库管理</h1>
      <MaterialUpload />
    </div>
  );
};

export default DatasetManagement;
