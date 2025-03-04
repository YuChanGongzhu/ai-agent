import React, { useState } from 'react';
import { createDatasetApi,getDatasetDocumentsApi } from '../api/dify';

interface Material {
    id: number;
    name: string;
    description: string;
}

export const MaterialBase: React.FC = () => {
    const [materials] = useState<Material[]>([
        { id: 1, name: 'Alve', description: '霜甲兰' },
        { id: 2, name: 'IRY', description: '' },
        { id: 3, name: 'Kevin Sandra', description: '' },
        { id: 4, name: 'Ed Hellen', description: '' },
    ]);

    const handleMaterialClick = () => {
        // createDatasetApi({name:'testtest'})
        let dataset_id='e3044eb3-694c-4c23-82ed-88a8bc9feda1'
        getDatasetDocumentsApi(dataset_id)
    };

    return (
        <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-medium">资料库</h2>
                <button className="text-gray-400 hover:text-gray-600" onClick={handleMaterialClick}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" />
                    </svg>
                </button>
            </div>

            <div className="overflow-x-auto">
                <table className="table">
                    {/* head */}
                    <thead>
                        <tr>
                            <th>资料</th>
                            <th>描述</th>
                        </tr>
                    </thead>
                    <tbody>
                        {materials.map((material) => (
                            <tr 
                                key={material.id}
                                className="hover:bg-gray-50 cursor-pointer"
                                onClick={() => console.log('Clicked:', material.name)}
                            >
                                <td>{material.name}</td>
                                <td>{material.description || '-'}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
