import React, { useState } from 'react';

export const EmployeeStudy: React.FC = () => {
    const [studyContent, setStudyContent] = useState('');
    const [isConfiguring, setIsConfiguring] = useState(false);

    const handleSave = () => {
        // TODO: Implement save functionality
        console.log('Saving content:', studyContent);
    };

    const handleConfigure = () => {
        setIsConfiguring(true);
    };

    return (
        <div className="bg-white rounded-3xl shadow-lg p-6 h-full flex flex-col">
            <div className="mb-4 flex items-center justify-between">
                <h2 className="text-xl font-medium">员工学习</h2>
                <div className="space-x-2">
                    <button 
                        className="btn btn-sm"
                        onClick={handleConfigure}
                    >
                        配置
                    </button>
                    <button 
                        className="btn btn-sm btn-primary"
                        onClick={handleSave}
                        disabled={!studyContent.trim()}
                    >
                        保存
                    </button>
                </div>
            </div>

            <div className="flex-1 relative">
                <textarea
                    className="w-full h-full resize-none border rounded-2xl p-4 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    value={studyContent}
                    onChange={(e) => setStudyContent(e.target.value)}
                    placeholder="请输入学习内容..."
                />
            </div>

            {/* Configuration Modal */}
            <dialog id="config_modal" className={`modal ${isConfiguring ? 'modal-open' : ''}`}>
                <div className="modal-box">
                    <h3 className="font-bold text-lg mb-4">学习配置</h3>
                    
                    <div className="form-control w-full mb-4">
                        <label className="label">
                            <span className="label-text">学习目标</span>
                        </label>
                        <input 
                            type="text" 
                            className="input input-bordered w-full" 
                            placeholder="请输入学习目标"
                        />
                    </div>

                    <div className="form-control w-full mb-4">
                        <label className="label">
                            <span className="label-text">学习周期</span>
                        </label>
                        <select className="select select-bordered w-full">
                            <option value="daily">每日</option>
                            <option value="weekly">每周</option>
                            <option value="monthly">每月</option>
                        </select>
                    </div>

                    <div className="modal-action">
                        <button 
                            className="btn btn-primary"
                            onClick={() => setIsConfiguring(false)}
                        >
                            确定
                        </button>
                        <button 
                            className="btn"
                            onClick={() => setIsConfiguring(false)}
                        >
                            取消
                        </button>
                    </div>
                </div>
                <form method="dialog" className="modal-backdrop">
                    <button onClick={() => setIsConfiguring(false)}>close</button>
                </form>
            </dialog>
        </div>
    );
};
