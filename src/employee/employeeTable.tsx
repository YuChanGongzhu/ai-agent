import React from 'react';
import {  useNavigate } from 'react-router-dom';
import {useEffect, useState} from "react";
import { WxAccount, getWxAccountListApi } from '../api/airflow';

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

    const handleEdit = (wxAccount: WxAccount) => {
        navigate(`/employee/edit/${wxAccount.wxid}`, { state: { wxAccount } });
    };
    const [wxAccountList, setWxAccountList] = useState<WxAccount[]>([]);

    useEffect(() => {
        const fetchWxAccounts = async () => {
            try {
                const accounts = await getWxAccountListApi();
                setWxAccountList(accounts);
                console.log('微信账号列表', accounts);
            } catch (error) {
                console.error('Failed to fetch wx accounts:', error);
            }
        };
        fetchWxAccounts();
    }, [])

    
    return (
        <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="overflow-x-auto">
                <table className="table w-full">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="text-left py-3 px-4 text-gray-600 text-sm font-medium">微信号</th>
                            <th className="text-left py-3 px-4 text-gray-600 text-sm font-medium">名称</th>
                            <th className="text-left py-3 px-4 text-gray-600 text-sm font-medium">手机号</th>
                            <th className="text-left py-3 px-4 text-gray-600 text-sm font-medium">IP地址</th>
                            <th className="text-left py-3 px-4 text-gray-600 text-sm font-medium">更新时间</th>
                            <th className="text-left py-3 px-4 text-gray-600 text-sm font-medium">员工编辑</th>
                        </tr>
                    </thead>
                    <tbody>
                        {wxAccountList.map((wxAccount, index) => (
                            <tr key={index} className="border-t border-gray-100">
                                <td className="py-3 px-4">{wxAccount.wxid}</td>
                                <td className="py-3 px-4">{wxAccount.name}</td>
                                <td className="py-3 px-4">{wxAccount.mobile || '-'}</td>
                                <td className="py-3 px-4">{wxAccount.source_ip}</td>
                                <td className="py-3 px-4">{wxAccount.update_time}</td>
                                <td className="py-3 px-4">
                                    <button
                                        onClick={() => handleEdit(wxAccount)}
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
