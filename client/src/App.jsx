import { Routes, Route, Link, Navigate } from 'react-router-dom'
import Teacher from './pages/Teacher.jsx'
import StudentNamePage from './pages/StudentNamePage.jsx';
import StudentPollPage from './pages/StudentPollPage.jsx';
import Dashboard from './pages/Dashboard.jsx';

export default function App() {
  return (
    <div>
      
      <Routes>
        <Route path="/" element={<Dashboard/>} />
        <Route path="/teacher" element={<Teacher />} />
        <Route path="/student" element={<StudentNamePage />} />
        <Route path="/student/poll" element={<StudentPollPage />} />
        
      </Routes>
    </div>
  )
}



