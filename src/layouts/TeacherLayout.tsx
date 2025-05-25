import { Outlet } from 'react-router-dom';
import TeacherSidebar from '../components/navigation/TeacherSidebar';
import TeacherHeader from '../components/navigation/TeacherHeader';

const TeacherLayout = () => {
  return (
    <div className="flex h-screen bg-gray-50">
      <TeacherSidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <TeacherHeader />
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default TeacherLayout;