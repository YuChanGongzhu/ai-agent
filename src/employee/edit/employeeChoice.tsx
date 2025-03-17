import React, { useState } from 'react';
import clsx from 'clsx';
import { WxAccount } from '../../api/airflow';
import type { ConfigKey } from '../../api/airflow';

interface ConfigCard {
    id: ConfigKey;
    title: string;
    description: string;
}

interface EmployeeChoiceProps {
    className?: string;
    wxAccount?: WxAccount;
    selectedConfig?: string;
    setSelectedConfig: (config: string) => void;
}

export const EmployeeChoice: React.FC<EmployeeChoiceProps> = ({ className, wxAccount, selectedConfig, setSelectedConfig }) => {

    const configCards: ConfigCard[] = [
        {
            id: 'config1',
            title: '销售顾问配置',
            description: '品牌护肤品的线上销售顾问，专业解答护肤品相关问题'
        },
        {
            id: 'config2',
            title: '健康顾问配置',
            description: '针对健康场景，帮助客户解决健康管理方面的问题，比如营养调理、身体养护、抗衰'
        },
        {
            id: 'config3',
            title: '医美客服配置',
            description: '医美的客服顾问，帮助客户解答皮肤管理、抗衰、轮廓塑形等医美相关的问题'
        },
        {
            id: 'config4',
            title: '金融顾问配置',
            description: '金融领域的客服顾问，帮助客户解答理财、投资、保险等金融相关的问题'
        }
    ];

    const handleCardClick = (cardId: ConfigKey) => {
        setSelectedConfig(cardId);
    };

    return (
        <div className={clsx('bg-white rounded-lg h-[40vh] shadow-lg p-4 flex flex-col', className)}>
            <div className="flex items-center">
                <h3 className="text-base font-medium text-gray-900">员工配置</h3>
                <span className='text-purple-800 text-sm'>&nbsp;选好员工配置在右侧调试完成之后，点击“保存效果”按钮即在客服中生效</span>
            </div>
            <div className={clsx('mt-2 overflow-x-auto', className)}>
                <div className="flex space-x-4 pb-2 min-w-full">
                    {configCards.map((card) => (
                        <div
                            key={card.id}
                            className={clsx(
                                'cursor-pointer p-4 rounded-lg border transition-all flex-shrink-0',
                                'hover:shadow-md',
                                'w-[280px] h-[150px] flex flex-col',
                                selectedConfig === card.id
                                    ? 'border-purple-500 bg-purple-50'
                                    : 'border-gray-200 bg-white'
                            )}
                            onClick={() => handleCardClick(card.id)}
                        >
                            <h3 className="text-base font-medium text-gray-900 mb-2">
                                {card.title}
                            </h3>
                            <p className="text-sm text-gray-600 overflow-hidden">{card.description}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
