import React from 'react';
import {  useNavigate } from 'react-router-dom';

interface Employee {
    name: string;
    bindStatus: '未绑定' | '已绑定';
    loginStatus: '已登录' | null;
}

const employees: Employee[] = [
    {
        name: '周杰伦',
        bindStatus: '未绑定',
        loginStatus: null,
    },
    {
        name: 'IRY',
        bindStatus: '已绑定',
        loginStatus: '已登录',
    },
    {
        name: 'Kevin Sandra',
        bindStatus: '已绑定',
        loginStatus: null,
    }
];

export const EmployeeTable: React.FC = () => {
    const navigate = useNavigate();

    const handleEdit = (employeeName: string) => {
        navigate(`/employee/edit/${employeeName}`);
    };
    return (
        <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="overflow-x-auto">
                <table className="table w-full">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="text-left py-3 px-4 text-gray-600 text-sm font-medium">员工列表</th>
                            <th className="text-left py-3 px-4 text-gray-600 text-sm font-medium">员工状态</th>
                            <th className="text-left py-3 px-4 text-gray-600 text-sm font-medium">员工接入</th>
                            <th className="text-left py-3 px-4 text-gray-600 text-sm font-medium">员工编辑</th>
                        </tr>
                    </thead>
                    <tbody>
                        {employees.map((employee, index) => (
                            <tr key={index} className="border-t border-gray-100">
                                <td className="py-3 px-4">{employee.name}</td>
                                <td className="py-3 px-4">
                                    <span className={`text-sm ${employee.bindStatus === '已绑定' ? 'text-green-600' : 'text-gray-500'}`}>
                                        {employee.bindStatus}
                                    </span>
                                </td>
                                <td className="py-3 px-4">
                                    {employee.loginStatus ? (
                                        <span className="text-green-600 text-sm">{employee.loginStatus}</span>
                                    ) : (
                                        <button className="text-purple-600 hover:text-purple-700 text-sm">
                                            登录
                                        </button>
                                    )}
                                </td>
                                <td className="py-3 px-4">
                                    <button
                                        onClick={() => handleEdit(employee.name)}
                                        className="text-purple-600 hover:text-purple-700 text-sm"
                                    >
                                        编辑
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
