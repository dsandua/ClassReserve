import { useState, useEffect } from 'react';
import { Search, Plus, Trash, Edit, ExternalLink, X, History } from 'lucide-react';
import { mockUsers } from '../../data/mockData';
import { User } from '../../context/AuthContext';
import { useBooking } from '../../hooks/useBooking';
import { Booking } from '../../context/BookingContext';
import toast from 'react-hot-toast';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

const StudentsPage = () => {
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<User | null>(null);
  const [studentBookings, setStudentBookings] = useState<Booking[]>([]);

  const openHistoryModal = async (student: User) => {
    setSelectedStudent(student);
    const bookings = await getStudentBookings(student.id);
    // Filtrar solo las clases completadas
    const completedBookings = bookings.filter(booking => booking.status === 'completed');
    setStudentBookings(completedBookings);
    setShowHistoryModal(true);
  };

  {showHistoryModal && selectedStudent && (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 animate-slide-in">
        <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium text-gray-900">Historial del alumno</h3>
            <p className="text-sm text-gray-500">{selectedStudent.name}</p>
          </div>
          <button
            className="text-gray-400 hover:text-gray-500"
            onClick={() => setShowHistoryModal(false)}
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4">
              <div className="flex-shrink-0">
                {selectedStudent.avatar ? (
                  <img
                    className="h-12 w-12 rounded-full"
                    src={selectedStudent.avatar}
                    alt={selectedStudent.name}
                  />
                ) : (
                  <div className="h-12 w-12 rounded-full bg-primary-100 flex items-center justify-center">
                    <span className="text-primary-800 font-medium text-lg">
                      {selectedStudent.name.charAt(0)}
                    </span>
                  </div>
                )}
              </div>
              <div>
                <h4 className="text-lg font-medium text-gray-900">{selectedStudent.name}</h4>
                <p className="text-sm text-gray-500">{selectedStudent.email}</p>
              </div>
            </div>
            
            <div className="text-right">
              <div className="text-2xl font-bold text-gray-900">{studentBookings.length}</div>
              <div className="text-sm text-gray-500">clases completadas</div>
            </div>
          </div>
          
          <div className="border-t border-gray-200 pt-4">
            <div className="flex items-center justify-between mb-4">
              <h5 className="text-base font-medium text-gray-900">Historial de clases completadas</h5>
              <button 
                className="btn btn-secondary text-sm"
                onClick={() => {
                  toast.success('Historial exportado correctamente');
                }}
              >
                Exportar historial
              </button>
            </div>
            
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 rounded-lg">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900">Fecha</th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Hora</th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Estado</th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Notas</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {studentBookings.map((booking) => (
                    <tr key={booking.id}>
                      <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm text-gray-900">
                        {format(parseISO(booking.date), "d 'de' MMMM, yyyy", { locale: es })}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {booking.startTime} - {booking.endTime}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm">
                        {getStatusBadge(booking.status)}
                      </td>
                      <td className="px-3 py-4 text-sm text-gray-500">
                        {booking.notes || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  )}

  return null; // Add proper return statement for the component
};

export default StudentsPage;