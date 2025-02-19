import { AccountManage } from "./accountManage";
import { CustomerShow } from "./customerShow";
import { SalesThread } from "./salesThread";
import { WechatList } from "./wechatList";
export const Dashboard = () => (
    <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <AccountManage />
            <WechatList />
            <CustomerShow />
            <SalesThread />
        </div>
    </div>
)