import { useState, useEffect } from 'react';
import { Search, Plus, Trash, Edit, ExternalLink, X, History } from 'lucide-react';
import { User } from '../../context/AuthContext';
import { useBooking } from '../../context/BookingContext';
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
  const [students, setStudents] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredStudents, setFilteredStudents] = useState<User[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<User | null>(null);
  const [studentBookings, setStudentBookings] = useState<Booking[]>([]);
  const [newStudent, setNewStudent] = useState({
    name: '',
    email: '',
    phone: '',
    notes: ''
  });
  const [editStudent, setEditStudent] = useState({
    name: '',
    email: '',
    phone: '',
    notes: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { getStudentBookings } = useBooking();

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        setIsLoading(true);
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('role', 'student');

        if (error) throw error;

        setStudents(data || []);
        setFilteredStudents(data || []);
      } catch (error) {
        console.error('Error fetching students:', error);
        toast.error('Error al cargar los alumnos');
      } finally {
        setIsLoading(false);
      }
    };

    fetchStudents();
  }, []);
  
  useEffect(() => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const filtered = students.filter(student => {
        return (
          student.name.toLowerCase().includes(query) ||
          student.email.toLowerCase().includes(query)
        );
      });
      setFilteredStudents(filtered);
    } else {
      setFilteredStudents(students);
    }
  }, [students, searchQuery]);

  const handleCreateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStudent.name || !newStudent.email) {
      toast.error('Por favor, completa los campos requeridos');
      return;
    }
    setIsSubmitting(true);

    try {
      const { data, error } = await supabase
        .from('profiles')
        .insert([{
          name: newStudent.name,
          email: newStudent.email,
          phone: newStudent.phone,
          notes: newStudent.notes,
          role: 'student'
        }])
        .select()
        .single();

      if (error) throw error;
      setStudents(prev => [...prev, data]);
      setShowAddModal(false);
      setNewStudent({ name: '', email: '', phone: '', notes: '' });
      toast.success('Alumno añadido con éxito');
    } catch (error) {
      console.error('Error creating student:', error);
      toast.error('Error al crear el alumno');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent) return;
    if (!editStudent.name || !editStudent.email) {
      toast.error('Por favor, completa los campos requeridos');
      return;
    }
    setIsSubmitting(true);

    try {
      const { data: updatedStudents, error } = await supabase
        .from('profiles')
        .update({
          name: editStudent.name,
          email: editStudent.email,
          phone: editStudent.phone,
          notes: editStudent.notes
        })
        .eq('id', selectedStudent.id)
        .select();

      if (error) throw error;
      if (updatedStudents && updatedStudents.length > 0) {
        setStudents(prev => prev.map(student =>
          student.id === selectedStudent.id ? updatedStudents[0] : student
        ));
        setShowEditModal(false);
        setSelectedStudent(null);
        setEditStudent({ name: '', email: '', phone: '', notes: '' });
        toast.success('Alumno actualizado con éxito');
      } else {
        throw new Error('No se pudo actualizar el alumno');
      }
    } catch (error: any) {
      console.error('Error updating student:', error);
      toast.error(error.message || 'Error al actualizar el alumno');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteStudent = async () => {
    if (!selectedStudent) return;
    
    setIsSubmitting(true);
    
    try {
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', selectedStudent.id);

      if (error) throw error;
      
      setStudents(prev => prev.filter(student => student.id !== selectedStudent.id));
      setShowDeleteModal(false);
      setSelectedStudent(null);
      toast.success('Alumno eliminado con éxito');
    } catch (error) {
      console.error('Error deleting student:', error);
      toast.error('Error al eliminar el alumno');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditModal = (student: User) => {
    setSelectedStudent(student);
    setEditStudent({
      name: student.name,
      email: student.email,
      phone: student.phone || '',
      notes: student.notes || ''
    });
    setShowEditModal(true);
  };
  
  const openDeleteModal = (student: User) => {
    setSelectedStudent(student);
    setShowDeleteModal(true);
  };
  
  const openHistoryModal = async (student: User) => {
    setSelectedStudent(student);
    const bookings = await getStudentBookings(student.id);
    // Filtrar solo las clases completadas
    const completedBookings = bookings.filter(booking => booking.status === 'completed');
    setStudentBookings(completedBookings);
    setShowHistoryModal(true);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-warning-100 text-warning-800">
            Pendiente
          </span>
        );
      case 'confirmed':
        return (
          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-success-100 text-success-800">
            Confirmada
          </span>
        );
      case 'cancelled':
        return (
          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-error-100 text-error-800">
            Cancelada
          </span>
        );
      case 'completed':
        return (
          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-primary-100 text-primary-800">
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
          <h1 className="text-2xl font-bold text-gray-900">Alumnos</h1>
          <p className="text-gray-600 mt-1">
            Gestiona todos tus alumnos
          </p>
        </div>
        
        <div className="mt-4 sm:mt-0">
          <button
            className="btn btn-primary flex items-center"
            onClick={() => setShowAddModal(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Añadir alumno
          </button>
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
        <div className="relative max-w-lg">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            className="focus:ring-primary-500 focus:border-primary-500 block w-full pl-10 pr-3 py-2 sm:text-sm border-gray-300 rounded-md"
            placeholder="Buscar por nombre o email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="text-center py-10">
            <p className="text-gray-500">Cargando alumnos...</p>
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-gray-500">No se encontraron alumnos.</p>
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
                    Email
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Teléfono
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Notas
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredStudents.map((student) => (
                  <tr key={student.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          {student.avatar ? (
                            <img
                              className="h-10 w-10 rounded-full"
                              src={student.avatar}
                              alt={student.name}
                            />
                          ) : (
                            <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                              <span className="text-primary-800 font-medium">
                                {student.name.charAt(0)}
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{student.name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{student.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{student.phone || '-'}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-500 max-w-xs truncate">
                        {student.notes || '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-3">
                        <button
                          className="text-primary-600 hover:text-primary-900"
                          onClick={() => openEditModal(student)}
                          title="Editar alumno"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          className="text-error-600 hover:text-error-900"
                          onClick={() => openDeleteModal(student)}
                          title="Eliminar alumno"
                        >
                          <Trash className="h-4 w-4" />
                        </button>
                        <button
                          className="text-accent-600 hover:text-accent-900"
                          onClick={() => openHistoryModal(student)}
                          title="Ver historial"
                        >
                          <History className="h-4 w-4" />
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
      
      {/* Add Student Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 animate-slide-in">
            <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">Añadir nuevo alumno</h3>
              <button
                className="text-gray-400 hover:text-gray-500"
                onClick={() => setShowAddModal(false)}
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <form onSubmit={handleCreateStudent} className="p-4">
              <div className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre completo *
                  </label>
                  <input
                    type="text"
                    id="name"
                    className="input"
                    value={newStudent.name}
                    onChange={(e) => setNewStudent(prev => ({ ...prev, name: e.target.value }))}
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    Email *
                  </label>
                  <input
                    type="email"
                    id="email"
                    className="input"
                    value={newStudent.email}
                    onChange={(e) => setNewStudent(prev => ({ ...prev, email: e.target.value }))}
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                    Teléfono
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    className="input"
                    value={newStudent.phone}
                    onChange={(e) => setNewStudent(prev => ({ ...prev, phone: e.target.value }))}
                  />
                </div>
                
                <div>
                  <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
                    Notas
                  </label>
                  <textarea
                    id="notes"
                    rows={3}
                    className="input"
                    value={newStudent.notes}
                    onChange={(e) => setNewStudent(prev => ({ ...prev, notes: e.target.value }))}
                  />
                </div>
              </div>
              
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowAddModal(false)}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Añadiendo...' : 'Añadir alumno'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* Edit Student Modal */}
      {showEditModal && selectedStudent && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 animate-slide-in">
            <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">Editar alumno</h3>
              <button
                className="text-gray-400 hover:text-gray-500"
                onClick={() => setShowEditModal(false)}
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <form onSubmit={handleEditStudent} className="p-4">
              <div className="space-y-4">
                <div>
                  <label htmlFor="edit-name" className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre completo *
                  </label>
                  <input
                    type="text"
                    id="edit-name"
                    className="input"
                    value={editStudent.name}
                    onChange={(e) => setEditStudent(prev => ({ ...prev, name: e.target.value }))}
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="edit-email" className="block text-sm font-medium text-gray-700 mb-1">
                    Email *
                  </label>
                  <input
                    type="email"
                    id="edit-email"
                    className="input"
                    value={editStudent.email}
                    onChange={(e) => setEditStudent(prev => ({ ...prev, email: e.target.value }))}
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="edit-phone" className="block text-sm font-medium text-gray-700 mb-1">
                    Teléfono
                  </label>
                  <input
                    type="tel"
                    id="edit-phone"
                    className="input"
                    value={editStudent.phone}
                    onChange={(e) => setEditStudent(prev => ({ ...prev, phone: e.target.value }))}
                  />
                </div>
                
                <div>
                  <label htmlFor="edit-notes" className="block text-sm font-medium text-gray-700 mb-1">
                    Notas
                  </label>
                  <textarea
                    id="edit-notes"
                    rows={3}
                    className="input"
                    value={editStudent.notes}
                    onChange={(e) => setEditStudent(prev => ({ ...prev, notes: e.target.value }))}
                  />
                </div>
              </div>
              
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowEditModal(false)}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Guardando...' : 'Guardar cambios'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedStudent && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 animate-slide-in">
            <div className="px-4 py-3 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Confirmar eliminación</h3>
            </div>
            
            <div className="p-4">
              <p className="text-sm text-gray-500">
                ¿Estás seguro de que quieres eliminar al alumno <span className="font-medium text-gray-900">{selectedStudent.name}</span>? Esta acción no se puede deshacer.
              </p>
              
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowDeleteModal(false)}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  className="btn btn-error"
                  onClick={handleDeleteStudent}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Eliminando...' : 'Eliminar alumno'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Student History Modal */}
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
    </div>
  );
};

export default StudentsPage;