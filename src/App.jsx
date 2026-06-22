/**
 * App.jsx
 * 顶层路由表：登录 / 注册公开，其余受保护并按角色分流
 */

import { Routes, Route, Navigate } from 'react-router-dom';

import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import AppLayout from './components/AppLayout.jsx';

import StudentHome from './pages/student/StudentHome.jsx';
import StudentAssignments from './pages/student/StudentAssignments.jsx';
import ReviewSubmission from './pages/student/ReviewSubmission.jsx';
import JoinClass from './pages/student/JoinClass.jsx';

import TeacherHome from './pages/teacher/TeacherHome.jsx';
import AssignmentDetail from './pages/teacher/AssignmentDetail.jsx';

export default function App() {
  return (
    <Routes>
      {/* 公开页 */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* 受保护：学生 */}
      <Route
        path="/student"
        element={
          <ProtectedRoute role="student">
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<StudentHome />} />
        <Route path="assignments" element={<StudentAssignments />} />
        <Route path="join" element={<JoinClass />} />
        <Route path="review/:taskId" element={<ReviewSubmission />} />
      </Route>

      {/* 受保护：教师 */}
      <Route
        path="/teacher"
        element={
          <ProtectedRoute role="teacher">
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<TeacherHome />} />
        <Route path="assignments/:id" element={<AssignmentDetail />} />
      </Route>

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
