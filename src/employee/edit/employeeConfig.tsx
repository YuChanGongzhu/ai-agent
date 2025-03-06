import React from 'react';
import clsx from 'clsx';
import { WxAccount } from '../../api/airflow';

interface EmployeeConfigProps {
    className?: string;
    wxAccount?: WxAccount;
    prompt: string;
    setPrompt: (prompt: string) => void;
}

export const EmployeeConfig: React.FC<EmployeeConfigProps> = ({ className, wxAccount, prompt, setPrompt }) => {
    return (
        <div className={clsx('bg-white rounded-lg h-[45vh] shadow-lg p-6 flex flex-col', className)}>
            <div className="flex items-center">
                <h3 className="text-lg font-medium text-gray-900">员工配置</h3>
                <span className='text-purple-800'>&nbsp;（编辑好提示词在右侧调试完成之后，点击“保存效果”按钮即在客服中生效)</span>
            </div>
            <textarea
                className={clsx(
                    'flex-1 mt-3 w-full resize-none rounded-lg border border-gray-200 bg-white py-2 px-3 text-sm/6 text-gray-900',
                    'focus:outline-none focus:ring-2 focus:ring-purple-500'
                )}
                placeholder="初始化员工配置..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
            />
        </div>
    );
};
