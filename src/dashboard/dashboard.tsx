import { AccountManage } from "./accountManage";
import { CustomerShow } from "./customerShow";
import { DashboardHeader } from "./dashboardHeader";
import { SalesThread } from "./salesThread";
import { WechatList } from "./wechatList";

export const Dashboard = () => (
    <div className="p-4">
        {/* <DashboardHeader />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <WechatList />
            <AccountManage />
            <CustomerShow />
            <SalesThread />
        </div> */}
        <iframe
            src={`${process.env.REACT_APP_GRAFANA_URL}&kiosk=tv`}
            allow="microphone"
            style={{ 
                width: '100%', 
                height: '95vh',
                border: 'none',
                overflow: 'hidden'
            }}
            frameBorder="0"
        ></iframe>
    </div>
)