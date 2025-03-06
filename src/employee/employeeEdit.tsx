import React, { useState, useEffect } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { EmployeeConfig } from './edit/employeeConfig';
import { MaterialUpload } from './edit/materialUpload';
import { WxAccount } from '../api/airflow';
import EffectTest from './edit/effectTest';
import { getWxAccountPromptApi } from '../api/airflow';
import { useNavigate } from 'react-router-dom';


export const EmployeeEdit: React.FC = () => {
    const { wxid } = useParams<{ wxid: string }>();
    const location = useLocation();
    const wxAccount = location.state?.wxAccount as WxAccount;
    const [prompt, setPrompt] = useState('');

    const navigate = useNavigate();
    const handleReturn = () => {
        navigate('/employee');
    };

    useEffect(() => {
        const fetchPrompt = async () => {
            if (wxAccount) {
                try {
                    const response = await getWxAccountPromptApi(wxAccount.wxid, wxAccount.name);
                    if (response && response.value) {
                        setPrompt(JSON.parse(response.value));
                    }
                } catch (error) {
                    console.error('Failed to fetch prompt:', error);
                }
            }
        };

        fetchPrompt();
    }, [wxAccount]);

    return (
        <div className="p-4 mt-4">
            <div className="flex items-center mb-6 space-x-4">
            <button
                    onClick={handleReturn}
                    className="text-gray-600 hover:text-gray-800 flex items-center"
                >
                    <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    返回
                </button>

                <div className="avatar">
                    <div className="w-11 rounded">
                        <img
                            src={wxAccount?.small_head_url}
                            alt={wxAccount?.name || wxid} />
                    </div>
                </div>
                <h2 className="text-2xl font-semibold text-gray-900">{wxAccount?.name || wxid}</h2>
            </div>

            <div className="grid grid-cols-2 gap-6">
                <div className="space-y-6">
                <EmployeeConfig wxAccount={wxAccount} prompt={prompt} setPrompt={setPrompt} />
                    <MaterialUpload wxAccount={wxAccount} />
                </div>
                <div>
                    <EffectTest wxAccount={wxAccount} prompt={prompt} />
                </div>
            </div>
        </div>
    );
};
