import React, { useState } from 'react';

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

    return (
        <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="mb-6">
                <h2 className="text-xl font-medium">资料库</h2>
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
