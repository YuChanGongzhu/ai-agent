import './App.css';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import NavBar from './navBar/navBar';
import { Dashboard } from './dashboard/dashboard';
import { EmployeeTable } from './employee/employeeTable';
import { EmployeeEdit } from './employee/employeeEdit';

function App() {
  return (
    <BrowserRouter>
      <div className="flex">
        <NavBar />
        <div className="flex-1">
          <Routes>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/employee" element={<EmployeeTable />} />
            <Route path="/employee/edit/:name" element={<EmployeeEdit />} />
            <Route path="/dialog" element={<div>Dialog Page</div>} />
            <Route path="/task" element={<div>Task Page</div>} />
            <Route path="/calendar" element={<div>Calendar Page</div>} />
          </Routes>
        </div>
      </div>
    </BrowserRouter>
  );
}

export default App;
