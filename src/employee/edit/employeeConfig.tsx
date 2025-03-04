import React, { useEffect } from 'react';
import clsx from 'clsx';
import { WxAccount } from '../../api/airflow';
import { getWxAccountPromptApi } from '../../api/airflow';
import{useState} from "react";

interface EmployeeConfigProps {
    className?: string;
    wxAccount?: WxAccount;
}

export const EmployeeConfig: React.FC<EmployeeConfigProps> = ({ className, wxAccount }) => {
    const [prompt, setPrompt] = useState('')

    useEffect(() => {
        const fetchPrompt = async () => {
            if (wxAccount) {
                try {
                    const response = await getWxAccountPromptApi(wxAccount.wxid, wxAccount.name);
                    if (response && response.value) {
                        setPrompt(response.value);
                    }
                } catch (error) {
                    console.error('Failed to fetch prompt:', error);
                }
            }
        };
        
        fetchPrompt();
    }, [wxAccount])
    return (
        <div className={clsx('bg-white rounded-lg shadow-lg p-6', className)}>
            <h3 className="text-lg font-medium text-gray-900">当前员工配置</h3>
            <textarea
                className={clsx(
                    'mt-3 block w-full resize-none rounded-lg border border-gray-200 bg-white py-2 px-3 text-sm/6 text-gray-900',
                    'focus:outline-none focus:ring-2 focus:ring-purple-500'
                )}
                rows={8}
                placeholder="初始化员工配置..."
                disabled
                value={prompt}
            />
        </div>
    );
};
