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

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/*"
          element={
            <ProtectedRoute>
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
                  </Routes>
                </div>
              </div>
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
