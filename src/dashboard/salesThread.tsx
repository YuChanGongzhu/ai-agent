import React from 'react';

interface SalesStage {
    name: string;
    color: string;
}

interface SalesPerson {
    name: string;
    stages: number[];  // Percentages for each stage
}

const stages: SalesStage[] = [
    { name: '初接触', color: 'bg-blue-500' },
    { name: '跟进中', color: 'bg-cyan-400' },
    { name: '转转化', color: 'bg-pink-400' },
    { name: '已转化', color: 'bg-indigo-600' }
];

const salesPeople: SalesPerson[] = [
    { name: '周杰伦', stages: [35, 20, 15, 30] },
    { name: 'John Snow', stages: [25, 15, 20, 40] },
    { name: 'Chris Evans', stages: [40, 25, 10, 25] },
    { name: 'Chris Rock', stages: [45, 15, 10, 30] }
];

export const SalesThread: React.FC = () => {
    return (
        <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold">销售线索</h2>
                <div className="flex items-center space-x-4">
                    <div className="flex items-center">
                        <span className="text-gray-600 mr-2">当前转化</span>
                        <span className="text-red-500">4.3%</span>
                    </div>
                    <div className="flex items-center">
                        <span className="text-gray-600 mr-2">目标转化</span>
                        <span className="text-blue-500">8%</span>
                    </div>
                    <button className="text-gray-400 hover:text-gray-600">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                        </svg>
                    </button>
                </div>
            </div>

            <div className="flex items-center space-x-4 mb-6">
                {stages.map((stage, index) => (
                    <div key={index} className="flex items-center">
                        <div className={`w-3 h-3 rounded-full ${stage.color} mr-2`}></div>
                        <span className="text-sm text-gray-600">{stage.name}</span>
                    </div>
                ))}
            </div>

            <div className="space-y-6">
                {salesPeople.map((person, personIndex) => (
                    <div key={personIndex} className="space-y-2">
                        <div className="text-sm text-gray-600">{person.name}</div>
                        <div className="flex w-full h-2 rounded-full overflow-hidden">
                            {person.stages.map((percentage, stageIndex) => (
                                <div
                                    key={stageIndex}
                                    className={`${stages[stageIndex].color}`}
                                    style={{ width: `${percentage}%` }}
                                ></div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            <div className="mt-6 text-center">
                <button className="text-blue-600 hover:text-blue-800 flex items-center justify-center w-full">
                    <span>查看详情</span>
                    <svg className="w-4 h-4 ml-1" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                </button>
            </div>
        </div>
    );
};
