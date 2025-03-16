import './App.css';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import NavBar from './navBar/navBar';
import { Dashboard } from './dashboard/dashboard';
import { EmployeeTable } from './employee/employeeTable';
import { EmployeeEdit } from './employee/employeeEdit';
import { Dialog } from './dialog/dialog';
import { CalendarComponent } from './calendar/calender';
import Login from './pages/Login';
import ProtectedRoute from './components/ProtectedRoute';
import TaskPage from './task/task';
import PersonSelector from './task/person';
import ServerManage from './server/serverManage';
import UserManagement from './userManagement/UserManagement';
import { UserProvider } from './context/UserContext';
import { WxAccountProvider } from './context/WxAccountContext';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              {/* 使用UserProvider包装整个应用，提供用户配置上下文 */}
              <UserProvider>
                {/* 使用WxAccountProvider提供微信账号上下文 */}
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
                        <Route path="/server" element={<ServerManage />} />
                        <Route path="/users" element={<UserManagement />} />
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
