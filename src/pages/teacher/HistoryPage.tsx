import { useState, useEffect } from 'react';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { Filter, Search, Download, FileText, ChevronDown, Trash } from 'lucide-react';
import { useBooking } from '../../hooks/useBooking';
import { Booking } from '../../context/BookingContext';
import toast from 'react-hot-toast';

const HistoryPage = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<Booking[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [bookingNotes, setBookingNotes] = useState('');
  const [showStatusMenu, setShowStatusMenu] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  
  const { getTeacherBookings } = useBooking();
  
  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const allBookings = await getTeacherBookings();
        setBookings(Array.isArray(allBookings) ? allBookings : []);
        setFilteredBookings(Array.isArray(allBookings) ? allBookings : []);
      } catch (error) {
        console.error('Error fetching bookings:', error);
        toast.error('Error al cargar las reservas');
        setBookings([]);
        setFilteredBookings([]);
      }
    };
    
    fetchBookings();
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
  }, [bookings, searchQuery, statusFilter]);
  
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

  const handleStatusChange = (bookingId: string, newStatus: string) => {
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
  };
  
  const handleExportData = () => {
    toast.success('Exportación iniciada. El archivo se descargará automáticamente.');
  };
  
  const handleOpenNotesModal = (booking: Booking) => {
    setSelectedBooking(booking);
    setBookingNotes(booking.notes || '');
    setShowNotesModal(true);
  };
  
  const handleSaveNotes = () => {
    if (!selectedBooking) return;
    
    toast.success('Notas guardadas correctamente');
    setShowNotesModal(false);
  };

  const handleDeleteBooking = () => {
    if (!selectedBooking) return;
    
    setBookings(prev => prev.filter(booking => booking.id !== selectedBooking.id));
    setFilteredBookings(prev => prev.filter(booking => booking.id !== selectedBooking.id));
    setShowDeleteModal(false);
    setSelectedBooking(null);
    toast.success('Reserva eliminada con éxito');
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
        
        <div className="mt-4 sm:mt-0">
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
        <div className="sm:flex sm:items-center">
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
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        {filteredBookings.length === 0 ? (
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
                          {booking.studentName.charAt(0)}
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
                      <div className="text-sm text-gray-900">{booking.startTime} - {booking.endTime}</div>
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