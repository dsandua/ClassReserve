import { useState, useEffect } from 'react';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { Filter, Search, Download, FileText, ChevronDown, Trash, Euro, Plus, X, User } from 'lucide-react';
import { useBooking } from '../../hooks/useBooking';
import { Booking } from '../../context/BookingContext';
import toast from 'react-hot-toast';
import { createClient } from '@supabase/supabase-js';
import { formatTimeRange } from '../../utils/time';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

type Student = {
  id: string;
  name: string;
  email: string;
  price: number;
};

const HistoryPage = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<Booking[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [showAddClassModal, setShowAddClassModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [bookingNotes, setBookingNotes] = useState('');
  const [showStatusMenu, setShowStatusMenu] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [totalAmount, setTotalAmount] = useState(0);
  const [students, setStudents] = useState<Student[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // New class form state
  const [newClass, setNewClass] = useState({
    studentId: '',
    date: '',
    startTime: '',
    endTime: '',
    status: 'completed' as const,
    notes: '',
    price: ''
  });
  
  const { getTeacherBookings } = useBooking();

  const fetchBookings = async () => {
    try {
      setIsLoading(true);
      const allBookings = await getTeacherBookings();
      setBookings(allBookings);
      setFilteredBookings(allBookings);
    } catch (error) {
      console.error('Error fetching bookings:', error);
      toast.error('Error al cargar las reservas');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStudents = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, name, email, price')
        .eq('role', 'student')
        .order('name');

      if (error) throw error;
      setStudents(data || []);
    } catch (error) {
      console.error('Error fetching students:', error);
      toast.error('Error al cargar los estudiantes');
    }
  };
  
  useEffect(() => {
    fetchBookings();
    fetchStudents();
  }, [getTeacherBookings]);
  
  useEffect(() => {
    let filtered = [...bookings];
    
    if (statusFilter !== 'all') {
      filtered = filtered.filter(booking => booking.status === statusFilter);
    }
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(booking => {
        const date = format(parseISO(booking.date), 'dd/MM/yyyy');
        return (
          booking.studentName.toLowerCase().includes(query) ||
          date.includes(query) ||
          booking.startTime.includes(query) ||
          booking.endTime.includes(query) ||
          (booking.notes && booking.notes.toLowerCase().includes(query))
        );
      });
    }
    
    setFilteredBookings(filtered);
    
    // Calcular el importe total de las clases completadas
    const completedBookings = filtered.filter(booking => booking.status === 'completed');
    const total = completedBookings.reduce((sum, booking) => sum + (booking.price || 0), 0);
    setTotalAmount(total);
  }, [bookings, searchQuery, statusFilter]);

  const handleCreateManualClass = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newClass.studentId || !newClass.date || !newClass.startTime || !newClass.endTime) {
      toast.error('Por favor, completa todos los campos requeridos');
      return;
    }

    if (newClass.startTime >= newClass.endTime) {
      toast.error('La hora de fin debe ser posterior a la hora de inicio');
      return;
    }

    setIsSubmitting(true);

    try {
      const selectedStudent = students.find(s => s.id === newClass.studentId);
      const price = newClass.price ? parseFloat(newClass.price) : (selectedStudent?.price || 25.00);

      const { data, error } = await supabase
        .from('bookings')
        .insert([{
          student_id: newClass.studentId,
          date: newClass.date,
          start_time: newClass.startTime,
          end_time: newClass.endTime,
          status: newClass.status,
          notes: newClass.notes,
          price: price,
          created_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) throw error;

      // Refresh bookings
      await fetchBookings();

      // Reset form
      setNewClass({
        studentId: '',
        date: '',
        startTime: '',
        endTime: '',
        status: 'completed',
        notes: '',
        price: ''
      });

      setShowAddClassModal(false);
      toast.success('Clase añadida con éxito');
    } catch (error) {
      console.error('Error creating manual class:', error);
      toast.error('Error al crear la clase');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStudentChange = (studentId: string) => {
    const selectedStudent = students.find(s => s.id === studentId);
    setNewClass(prev => ({
      ...prev,
      studentId,
      price: selectedStudent?.price?.toString() || ''
    }));
  };

  const handleDeleteBooking = async () => {
    if (!selectedBooking) return;
    
    try {
      // Eliminar la reserva de la base de datos
      const { error } = await supabase
        .from('bookings')
        .delete()
        .eq('id', selectedBooking.id);

      if (error) throw error;
      
      // Actualizar el estado local
      setBookings(prev => prev.filter(booking => booking.id !== selectedBooking.id));
      setFilteredBookings(prev => prev.filter(booking => booking.id !== selectedBooking.id));
      setShowDeleteModal(false);
      setSelectedBooking(null);
      toast.success('Reserva eliminada con éxito');
    } catch (error) {
      console.error('Error deleting booking:', error);
      toast.error('Error al eliminar la reserva');
    }
  };

  const handleStatusChange = async (bookingId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ status: newStatus })
        .eq('id', bookingId);

      if (error) throw error;

      setBookings(prev => prev.map(booking => {
        if (booking.id === bookingId) {
          return {
            ...booking,
            status: newStatus as Booking['status']
          };
        }
        return booking;
      }));
      setShowStatusMenu(null);
      toast.success('Estado actualizado con éxito');
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Error al actualizar el estado');
    }
  };
  
  const handleExportData = () => {
    toast.success('Exportación iniciada. El archivo se descargará automáticamente.');
  };
  
  const handleOpenNotesModal = (booking: Booking) => {
    setSelectedBooking(booking);
    setBookingNotes(booking.notes || '');
    setShowNotesModal(true);
  };
  
  const handleSaveNotes = async () => {
    if (!selectedBooking) return;
    
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ notes: bookingNotes })
        .eq('id', selectedBooking.id);

      if (error) throw error;

      setBookings(prev => prev.map(booking => {
        if (booking.id === selectedBooking.id) {
          return { ...booking, notes: bookingNotes };
        }
        return booking;
      }));

      toast.success('Notas guardadas correctamente');
      setShowNotesModal(false);
    } catch (error) {
      console.error('Error saving notes:', error);
      toast.error('Error al guardar las notas');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
            Pendiente
          </span>
        );
      case 'confirmed':
        return (
          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
            Confirmada
          </span>
        );
      case 'cancelled':
        return (
          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
            Cancelada
          </span>
        );
      case 'completed':
        return (
          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
            Completada
          </span>
        );
      default:
        return null;
    }
  };
  
  return (
    <div>
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Historial de Clases</h1>
          <p className="text-gray-600 mt-1">
            Visualiza y gestiona todas las clases
          </p>
        </div>
        
        <div className="mt-4 sm:mt-0 flex space-x-3">
          <button
            className="btn btn-primary flex items-center"
            onClick={() => setShowAddClassModal(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Añadir clase manual
          </button>
          <button
            className="btn btn-secondary flex items-center"
            onClick={handleExportData}
          >
            <Download className="h-4 w-4 mr-2" />
            Exportar datos
          </button>
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
        <div className="sm:flex sm:items-center sm:space-x-4">
          <div className="sm:flex-1 relative max-w-lg">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              className="focus:ring-primary-500 focus:border-primary-500 block w-full pl-10 pr-3 py-2 sm:text-sm border-gray-300 rounded-md"
              placeholder="Buscar por alumno, fecha o notas..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="mt-3 sm:mt-0 sm:ml-4">
            <div className="flex items-center space-x-2">
              <Filter className="h-5 w-5 text-gray-500" />
              <select
                className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">Todos los estados</option>
                <option value="pending">Pendientes</option>
                <option value="confirmed">Confirmadas</option>
                <option value="completed">Completadas</option>
                <option value="cancelled">Canceladas</option>
              </select>
            </div>
          </div>
          <div className="mt-3 sm:mt-0 sm:ml-4">
            <div className="bg-success-50 border border-success-200 rounded-lg px-4 py-2 flex items-center">
              <Euro className="h-5 w-5 text-success-600 mr-2" />
              <div>
                <div className="text-xs font-medium text-success-800">Importe Total</div>
                <div className="text-lg font-bold text-success-900">€{totalAmount.toFixed(2)}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="text-center py-10">
            <p className="text-gray-500">Cargando historial...</p>
          </div>
        ) : filteredBookings.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-gray-500">No se encontraron clases.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Alumno
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fecha
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Hora
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Precio
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Reservada el
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredBookings.map((booking) => (
                  <tr key={booking.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                            <span className="text-primary-800 font-medium">
                              {booking.studentName?.charAt(0) ?? ''}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{booking.studentName}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {format(parseISO(booking.date), 'dd/MM/yyyy')}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{booking.startTime?.slice(0, 5) } - {booking.endTime?.slice(0, 5) }</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">€{(booking.price || 0).toFixed(2)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="relative">
                        <button
                          onClick={() => setShowStatusMenu(showStatusMenu === booking.id ? null : booking.id)}
                          className="flex items-center space-x-2 focus:outline-none"
                        >
                          {getStatusBadge(booking.status)}
                          <ChevronDown className="h-4 w-4 text-gray-500 ml-1" />
                        </button>
                        
                        {showStatusMenu === booking.id && (
                          <div className="absolute z-10 mt-2 w-40 bg-white rounded-md shadow-lg border border-gray-200">
                            <div className="py-1">
                              <button
                                className="w-full px-4 py-2 text-sm text-left text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
                                onClick={() => handleStatusChange(booking.id, 'pending')}
                              >
                                <span className="w-2 h-2 rounded-full bg-yellow-400"></span>
                                <span>Pendiente</span>
                              </button>
                              <button
                                className="w-full px-4 py-2 text-sm text-left text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
                                onClick={() => handleStatusChange(booking.id, 'confirmed')}
                              >
                                <span className="w-2 h-2 rounded-full bg-green-400"></span>
                                <span>Confirmada</span>
                              </button>
                              <button
                                className="w-full px-4 py-2 text-sm text-left text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
                                onClick={() => handleStatusChange(booking.id, 'completed')}
                              >
                                <span className="w-2 h-2 rounded-full bg-blue-400"></span>
                                <span>Completada</span>
                              </button>
                              <button
                                className="w-full px-4 py-2 text-sm text-left text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
                                onClick={() => handleStatusChange(booking.id, 'cancelled')}
                              >
                                <span className="w-2 h-2 rounded-full bg-red-400"></span>
                                <span>Cancelada</span>
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(booking.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-3">
                        <button
                          className="text-primary-600 hover:text-primary-900 flex items-center"
                          onClick={() => handleOpenNotesModal(booking)}
                        >
                          <FileText className="h-4 w-4" />
                        </button>
                        <button
                          className="text-error-600 hover:text-error-900 flex items-center"
                          onClick={() => {
                            setSelectedBooking(booking);
                            setShowDeleteModal(true);
                          }}
                        >
                          <Trash className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Manual Class Modal */}
      {showAddClassModal && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full mx-4 animate-slide-in">
            <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">Añadir clase manual</h3>
              <button
                className="text-gray-400 hover:text-gray-500"
                onClick={() => setShowAddClassModal(false)}
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <form onSubmit={handleCreateManualClass} className="p-4">
              <div className="space-y-4">
                <div>
                  <label htmlFor="student" className="block text-sm font-medium text-gray-700 mb-1">
                    Alumno *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User className="h-5 w-5 text-gray-400" />
                    </div>
                    <select
                      id="student"
                      className="input pl-10"
                      value={newClass.studentId}
                      onChange={(e) => handleStudentChange(e.target.value)}
                      required
                    >
                      <option value="">Selecciona un alumno</option>
                      {students.map((student) => (
                        <option key={student.id} value={student.id}>
                          {student.name} - {student.email}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                
                <div>
                  <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">
                    Fecha *
                  </label>
                  <input
                    type="date"
                    id="date"
                    className="input"
                    value={newClass.date}
                    onChange={(e) => setNewClass(prev => ({ ...prev, date: e.target.value }))}
                    required
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="startTime" className="block text-sm font-medium text-gray-700 mb-1">
                      Hora inicio *
                    </label>
                    <input
                      type="time"
                      id="startTime"
                      className="input"
                      value={newClass.startTime}
                      onChange={(e) => setNewClass(prev => ({ ...prev, startTime: e.target.value }))}
                      required
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="endTime" className="block text-sm font-medium text-gray-700 mb-1">
                      Hora fin *
                    </label>
                    <input
                      type="time"
                      id="endTime"
                      className="input"
                      value={newClass.endTime}
                      onChange={(e) => setNewClass(prev => ({ ...prev, endTime: e.target.value }))}
                      required
                    />
                  </div>
                </div>
                
                <div>
                  <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                    Estado *
                  </label>
                  <select
                    id="status"
                    className="input"
                    value={newClass.status}
                    onChange={(e) => setNewClass(prev => ({ ...prev, status: e.target.value as 'pending' | 'confirmed' | 'completed' | 'cancelled' }))}
                    required
                  >
                    <option value="completed">Completada</option>
                    <option value="confirmed">Confirmada</option>
                    <option value="pending">Pendiente</option>
                    <option value="cancelled">Cancelada</option>
                  </select>
                </div>
                
                <div>
                  <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">
                    Precio (€)
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Euro className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="number"
                      id="price"
                      step="0.01"
                      min="0"
                      className="input pl-10"
                      placeholder="Precio automático del alumno"
                      value={newClass.price}
                      onChange={(e) => setNewClass(prev => ({ ...prev, price: e.target.value }))}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Si no se especifica, se usará el precio por defecto del alumno
                  </p>
                </div>
                
                <div>
                  <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
                    Notas
                  </label>
                  <textarea
                    id="notes"
                    rows={3}
                    className="input"
                    placeholder="Notas sobre la clase..."
                    value={newClass.notes}
                    onChange={(e) => setNewClass(prev => ({ ...prev, notes: e.target.value }))}
                  />
                </div>
              </div>
              
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowAddClassModal(false)}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Añadiendo...' : 'Añadir clase'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* Notes Modal */}
      {showNotesModal && selectedBooking && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full mx-4 animate-slide-in">
            <div className="px-4 py-3 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">
                Notas de clase - {selectedBooking.studentName}
              </h3>
              <p className="text-sm text-gray-500">
                {format(parseISO(selectedBooking.date), "EEEE, d 'de' MMMM", { locale: es })} • {selectedBooking.startTime} - {selectedBooking.endTime}
              </p>
            </div>
            
            <div className="p-4">
              <textarea
                className="w-full h-40 border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                placeholder="Añade notas sobre esta clase..."
                value={bookingNotes}
                onChange={(e) => setBookingNotes(e.target.value)}
              ></textarea>
              
              <div className="mt-4 flex justify-end space-x-3">
                <button
                  className="btn btn-secondary"
                  onClick={() => setShowNotesModal(false)}
                >
                  Cancelar
                </button>
                <button
                  className="btn btn-primary"
                  onClick={handleSaveNotes}
                >
                  Guardar notas
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedBooking && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 animate-slide-in">
            <div className="px-4 py-3 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Confirmar eliminación</h3>
            </div>
            
            <div className="p-4">
              <p className="text-sm text-gray-500">
                ¿Estás seguro de que quieres eliminar esta reserva? Esta acción no se puede deshacer.
              </p>
              
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  className="btn btn-secondary"
                  onClick={() => setShowDeleteModal(false)}
                >
                  Cancelar
                </button>
                <button
                  className="btn btn-error"
                  onClick={handleDeleteBooking}
                >
                  Eliminar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HistoryPage;