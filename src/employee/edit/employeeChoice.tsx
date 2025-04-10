import React, { useState, useEffect } from 'react';
import clsx from 'clsx';
import { WxAccount } from '../../api/airflow';
import { getAllIndustries, Industry } from '../../api/supabase/industryService';

interface EmployeeChoiceProps {
    className?: string;
    wxAccount?: WxAccount;
    selectedConfig?: string;
    setSelectedConfig: (config: string) => void;
}

export const EmployeeChoice: React.FC<EmployeeChoiceProps> = ({ className, wxAccount, selectedConfig, setSelectedConfig }) => {
    const [industries, setIndustries] = useState<Industry[]>([]);

    useEffect(() => {
        const fetchIndustries = async () => {
            try {
                const data = await getAllIndustries();
                setIndustries(data);
            } catch (error) {
                console.error('获取行业列表失败:', error);
            }
        };

        fetchIndustries();
    }, []);

    const handleCardClick = (appId: string | null) => {
        if (!appId) {
            console.error('应用ID不存在');
            return;
        }
        setSelectedConfig(appId);
    };

    return (
        <div className={clsx('bg-white rounded-lg h-[40vh] shadow-lg p-4 flex flex-col', className)}>
            <div className="flex items-center">
                <h3 className="text-base font-medium text-gray-900">员工配置</h3>
                <span className='text-[rgba(108,93,211,1)] text-sm'>&nbsp;选好员工配置在右侧调试完成之后，点击"保存效果"按钮即在客服中生效</span>
            </div>
            <div className={clsx('mt-2 overflow-x-auto', className)}>
                <div className="flex space-x-4 pb-2 min-w-full">
                    {industries.map((industry) => (
                        <div
                            key={industry.id}
                            className={clsx(
                                'cursor-pointer p-4 rounded-lg border transition-all flex-shrink-0',
                                'hover:shadow-md',
                                'w-[280px] h-[150px] flex flex-col',
                                !industry.app_id && 'opacity-50 cursor-not-allowed',
                                selectedConfig === industry.app_id
                                    ? 'border-[rgba(108,93,211,1)] bg-[rgba(108,93,211,0.05)]'
                                    : 'border-gray-200 bg-white'
                            )}
                            onClick={() => industry.app_id && handleCardClick(industry.app_id)}
                        >
                            <h3 className="text-base font-medium text-gray-900 mb-2">
                                {industry.nickname || industry.name}
                            </h3>
                            <p className="text-sm text-gray-600 overflow-hidden">{industry.description}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
