import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from "react";
import { WxAccount, getWxAccountListApi } from '../api/airflow';

export const EmployeeTable: React.FC = () => {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(true);
    const [wxAccountList, setWxAccountList] = useState<WxAccount[]>([]);

    const handleEdit = (wxAccount: WxAccount) => {
        navigate(`/employee/edit/${wxAccount.wxid}`, { state: { wxAccount } });
    };

    useEffect(() => {
        const fetchWxAccounts = async () => {
            try {
                setIsLoading(true);
                const accounts = await getWxAccountListApi();
                setWxAccountList(accounts);
                // console.log('微信账号列表', accounts);
            } catch (error) {
                console.error('Failed to fetch wx accounts:', error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchWxAccounts();
    }, [])

    return (
        <div className="bg-white rounded-lg shadow-lg p-6 text-lg p-4 m-10">
            {isLoading ? (
                <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-purple-600"></div>
                    <span className="ml-3 text-xl text-gray-600">加载中...</span>
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="table w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="text-left py-4 px-4 text-gray-600 text-lg font-medium">微信头像</th>
                                <th className="text-left py-4 px-4 text-gray-600 text-lg font-medium">微信名称</th>
                                <th className="text-left py-4 px-4 text-gray-600 text-lg font-medium">手机号</th>
                                <th className="text-left py-4 px-4 text-gray-600 text-lg font-medium">员工编辑</th>
                            </tr>
                        </thead>
                        <tbody>
                            {wxAccountList.map((wxAccount, index) => (
                                <tr key={index} className="border-t border-gray-100">
                                    <td className="py-4 px-4">
                                        <div className="avatar">
                                            <div className="w-16 rounded-full"><img src={wxAccount.small_head_url} alt={wxAccount.name} /></div>
                                        </div>
                                    </td>
                                    <td className="py-4 px-4 text-lg">{wxAccount.name}</td>
                                    <td className="py-4 px-4 text-lg">{wxAccount.mobile || '-'}</td>
                                    <td className="py-4 px-4">
                                        <button
                                            onClick={() => handleEdit(wxAccount)}
                                            className="text-purple-600 hover:text-purple-700 text-lg font-medium"
                                        >
                                            编辑
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};
