import './App.css';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import NavBar from './navBar/navBar';
import { Dashboard } from './dashboard/dashboard';
import { EmployeeTable } from './employee/employeeTable';
import { EmployeeEdit } from './employee/employeeEdit';
import { Dialog } from './dialog/dialog';
import { CalendarComponent } from './calendar/calender';
import Login from './login/Login';
import Register from './login/Register';
import ProtectedRoute from './components/ProtectedRoute';
import TaskPage from './task/task';
import PersonSelector from './task/person';
import ServerManage from './server/serverManage';
import ManagementPage from './management/ManagementPage';
import FileManagement from './knowledge/FileManagement';
import DatasetManagement from './knowledge/DatasetManagement';
import OfficialAccount from './channels/OfficialAccount';
import EnterpriseWeChat from './channels/EnterpriseWeChat';
import { UserProvider } from './context/UserContext';
import { WxAccountProvider } from './context/WxAccountContext';
// Placeholder components for new routes
const VideoAnalysis = () => <div className="p-8"><h1 className="text-2xl font-bold mb-4">视频号直播监控</h1><p>此功能正在开发中...</p></div>;
const FriendTest = () => <div className="p-8"><h1 className="text-2xl font-bold mb-4">朋友圈分析</h1><p>此功能正在开发中...</p></div>;

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <UserProvider>
                <WxAccountProvider>
                  <div className="flex">
                    <NavBar />
                    <div className="flex-1">
                      <Routes>
                        <Route path="/" element={<Navigate to="/dashboard" replace />} />
                        <Route path="/dashboard" element={<Dashboard />} />
                        <Route path="/employee" element={<EmployeeTable />} />
                        <Route path="/employee/edit/:wxid" element={<EmployeeEdit />} />
                        <Route path="/dialog" element={<Dialog />} />
                        <Route path="/task" element={<TaskPage />} />
                        <Route path="/task/invite" element={<PersonSelector />} />
                        <Route path="/calendar" element={<CalendarComponent />} />
                        <Route path="/channels/personal" element={<ServerManage />} />
                        <Route path="/channels/official" element={<OfficialAccount />} />
                        <Route path="/channels/enterprise" element={<EnterpriseWeChat />} />
                        <Route path="/manage" element={<ManagementPage />} />
                        <Route path="/knowledge/files" element={<FileManagement />} />
                        <Route path="/knowledge/datasets" element={<DatasetManagement />} />
                        {/* New AI feature routes */}
                        <Route path="/ai/video" element={<VideoAnalysis />} />
                        <Route path="/ai/legal" element={<FriendTest />} />
                      </Routes>
                    </div>
                  </div>
                </WxAccountProvider>
              </UserProvider>
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
