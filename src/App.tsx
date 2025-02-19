import './App.css';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import NavBar from './navBar/navBar';
import { Dashboard } from './dashboard/dashboard';

function App() {
  return (
    <BrowserRouter>
      <div className="flex">
        <NavBar />
        <div className="flex-1">
          <Routes>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/employee" element={<div>Employee Page</div>} />
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
