import React from 'react';
import clsx from 'clsx';
import { WxAccount } from '../../api/airflow';
import { getWxAccountPromptApi } from '../../api/airflow';

interface EmployeeConfigProps {
    className?: string;
    wxAccount?: WxAccount;
    prompt: string;
    setPrompt: (prompt: string) => void;
}

export const EmployeeConfig: React.FC<EmployeeConfigProps> = ({ className, wxAccount, prompt, setPrompt }) => {
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
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
            />
        </div>
    );
};
