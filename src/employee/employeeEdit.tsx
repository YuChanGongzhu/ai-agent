import React from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { EmployeeConfig } from './edit/employeeConfig';
import { MaterialUpload } from './edit/materialUpload';
import { DialogTest } from './edit/dialogTest';
import { WxAccount } from '../api/airflow';

export const EmployeeEdit: React.FC = () => {
    const { wxid } = useParams<{ wxid: string }>();
    const location = useLocation();
    const wxAccount = location.state?.wxAccount as WxAccount;

    return (
        <div className="p-4">
            <div className="mb-6">
                <h2 className="text-2xl font-semibold text-gray-900">员工编辑 - {wxAccount?.name || wxid}</h2>
            </div>
            <div className="grid grid-cols-2 gap-6">
                <div className="space-y-6">
                    <MaterialUpload wxAccount={wxAccount} />
                </div>
                <div>
                <EmployeeConfig wxAccount={wxAccount} />
                    <DialogTest wxAccount={wxAccount} />
                </div>
            </div>
        </div>
    );
};
