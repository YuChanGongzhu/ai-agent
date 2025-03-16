import React, { useState } from 'react';
import { AccountManage } from "./accountManage";
import { CustomerShow } from "./customerShow";
import { DashboardHeader } from "./dashboardHeader";
import { SalesThread } from "./salesThread";
import { WechatList } from "./wechatList";

export const Dashboard = () => {
    const [isLoading, setIsLoading] = useState(true);

    return (
        <div className="p-4">
            {/* <DashboardHeader />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <WechatList />
                <AccountManage />
                <CustomerShow />
                <SalesThread />
            </div> */}
            {/* {isLoading && (
                <div className="flex justify-center items-center h-[95vh]">
                    <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-purple-600"></div>
                    <span className="ml-3 text-base text-gray-600">加载中...</span>
                </div>
            )}
            <iframe
                src={`${process.env.REACT_APP_GRAFANA_URL}&kiosk=tv`}
                allow="microphone"
                style={{ 
                    width: '100%', 
                    height: '95vh',
                    border: 'none',
                    overflow: 'hidden',
                    display: isLoading ? 'none' : 'block'
                }}
                onLoad={() => setIsLoading(false)}
            ></iframe> */}
            待开放
        </div>
    );
};