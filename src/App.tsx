import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';

// Layouts
import MainLayout from './layouts/MainLayout';
import TeacherLayout from './layouts/TeacherLayout';

// Pages
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import BookingPage from './pages/BookingPage';
import BookingConfirmationPage from './pages/BookingConfirmationPage';
import StudentDashboardPage from './pages/student/DashboardPage';
import StudentHistoryPage from './pages/student/HistoryPage';
import StudentProfilePage from './pages/student/ProfilePage';
import TeacherDashboardPage from './pages/teacher/DashboardPage';
import TeacherCalendarPage from './pages/teacher/CalendarPage';
import TeacherStudentsPage from './pages/teacher/StudentsPage';
import TeacherHistoryPage from './pages/teacher/HistoryPage';
import TeacherSettingsPage from './pages/teacher/SettingsPage';
import TeacherNotificationsPage from './pages/teacher/NotificationsPage';
import NotFoundPage from './pages/NotFoundPage';
import ResetPasswordPage from './pages/ResetPasswordPage';

// Protected route components
const StudentRoute = ({ children }: { children: JSX.Element }) => {
  const { user, isAuthenticated } = useAuth();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }
  
  return children;
};

const TeacherRoute = ({ children }: { children: JSX.Element }) => {
  const { user, isAuthenticated } = useAuth();
  
  if (!isAuthenticated || user?.role !== 'teacher') {
    return <Navigate to="/login" />;
  }
  
  return children;
};

function App() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<MainLayout />}>
        <Route index element={<HomePage />} />
        <Route path="login" element={<LoginPage />} />
        <Route path="register" element={<RegisterPage />} />
        <Route path="forgot-password" element={<ForgotPasswordPage />} />
        <Route path="booking" element={<BookingPage />} />
        <Route path="booking/confirmation" element={<BookingConfirmationPage />} />
        <Route path="reset-password" element={<ResetPasswordPage />} />
      </Route>
      
      {/* Student routes */}
      <Route path="/student" element={
        <StudentRoute>
          <MainLayout />
        </StudentRoute>
      }>
        <Route path="dashboard" element={<StudentDashboardPage />} />
        <Route path="history" element={<StudentHistoryPage />} />
        <Route path="profile" element={<StudentProfilePage />} />
      </Route>
      
      {/* Teacher routes */}
      <Route path="/teacher" element={
        <TeacherRoute>
          <TeacherLayout />
        </TeacherRoute>
      }>
        <Route path="dashboard" element={<TeacherDashboardPage />} />
        <Route path="calendar" element={<TeacherCalendarPage />} />
        <Route path="students" element={<TeacherStudentsPage />} />
        <Route path="history" element={<TeacherHistoryPage />} />
        <Route path="settings" element={<TeacherSettingsPage />} />
        <Route path="notifications" element={<TeacherNotificationsPage />} />
      </Route>
      
      {/* 404 page */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

export default App;