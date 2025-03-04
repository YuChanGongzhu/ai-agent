import React from 'react';
import { useNavigate } from 'react-router-dom';
import clsx from 'clsx';
import { WxAccount } from '../../api/airflow';

interface EmployeeConfigProps {
    className?: string;
    wxAccount?: WxAccount;
}

export const EmployeeConfig: React.FC<EmployeeConfigProps> = ({ className, wxAccount }) => {
    const navigate = useNavigate();

    const handleReturn = () => {
        navigate('/employee');
    };
    return (
        <div className={clsx('bg-white rounded-lg shadow-lg p-6', className)}>
            <div className="flex justify-between items-center mb-4">
                <button
                    onClick={handleReturn}
                    className="text-gray-600 hover:text-gray-800 flex items-center"
                >
                    <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    返回
                </button>
            </div>
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium text-gray-900">员工配置 - {wxAccount?.name}</h3>
                <button className="text-purple-600 px-3 py-1 rounded-md hover:bg-purple-50">
                    保存
                </button>
            </div>
            <textarea
                className={clsx(
                    'mt-3 block w-full resize-none rounded-lg border border-gray-200 bg-white py-2 px-3 text-sm/6 text-gray-900',
                    'focus:outline-none focus:ring-2 focus:ring-purple-500'
                )}
                rows={8}
                placeholder="请输入员工配置..."
            />
        </div>
    );
};
