import React from 'react';
import { useParams } from 'react-router-dom';
import { EmployeeConfig } from './edit/employeeConfig';
import { MaterialUpload } from './edit/materialUpload';
import { DialogTest } from './edit/dialogTest';

export const EmployeeEdit: React.FC = () => {
    const { name } = useParams<{ name: string }>();

    return (
        <div className="p-4">
            <div className="mb-6">
                <h2 className="text-2xl font-semibold text-gray-900">员工编辑 - {name}</h2>
            </div>
            <div className="grid grid-cols-2 gap-6">
                <div className="space-y-6">
                    <EmployeeConfig />
                    <MaterialUpload />
                </div>
                <div>
                    <DialogTest />
                </div>
            </div>
        </div>
    );
};
