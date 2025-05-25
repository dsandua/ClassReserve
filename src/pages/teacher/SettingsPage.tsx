import { useState, useEffect } from 'react';
import { Clock, Save } from 'lucide-react';
import { DayAvailability } from '../../context/BookingContext';
import toast from 'react-hot-toast';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

const SettingsPage = () => {
  const [isUpdating, setIsUpdating] = useState(false);
  const [availabilityData, setAvailabilityData] = useState<DayAvailability[]>([
    { dayOfWeek: 1, isAvailable: false, slots: [] }, // Lunes
    { dayOfWeek: 2, isAvailable: false, slots: [] }, // Martes
    { dayOfWeek: 3, isAvailable: false, slots: [] }, // Miércoles
    { dayOfWeek: 4, isAvailable: false, slots: [] }, // Jueves
    { dayOfWeek: 5, isAvailable: false, slots: [] }, // Viernes
    { dayOfWeek: 6, isAvailable: false, slots: [] }, // Sábado
    { dayOfWeek: 0, isAvailable: false, slots: [] }, // Domingo
  ]);
  const [minAdvance, setMinAdvance] = useState('3');
  const [maxAdvance, setMaxAdvance] = useState('30');
  const [cancelLimit, setCancelLimit] = useState('12');

  // Time slots
  const timeSlots = [
    { start: '10:00', end: '11:00' },
    { start: '11:00', end: '12:00' },
    { start: '12:00', end: '13:00' },
    { start: '13:00', end: '14:00' },
    { start: '14:00', end: '15:00' },
    { start: '15:00', end: '16:00' },
    { start: '16:00', end: '17:00' },
    { start: '17:00', end: '18:00' },
    { start: '18:00', end: '19:00' },
    { start: '19:00', end: '20:00' },
  ];

  // Fetch initial availability data
  const fetchAvailability = async () => {
    try {
      const { data, error } = await supabase
        .from('availability')
        .select('*')
        .order('day_of_week');

      if (error) throw error;

      if (data) {
        const formattedData = [
          { dayOfWeek: 1, isAvailable: false, slots: [] },
          { dayOfWeek: 2, isAvailable: false, slots: [] },
          { dayOfWeek: 3, isAvailable: false, slots: [] },
          { dayOfWeek: 4, isAvailable: false, slots: [] },
          { dayOfWeek: 5, isAvailable: false, slots: [] },
          { dayOfWeek: 6, isAvailable: false, slots: [] },
          { dayOfWeek: 0, isAvailable: false, slots: [] },
        ].map(day => {
          const dayData = data.find(d => d.day_of_week === day.dayOfWeek);
          return {
            ...day,
            isAvailable: dayData?.is_available || false,
            slots: dayData?.slots || []
          };
        });
        setAvailabilityData(formattedData);
      }
    } catch (error) {
      console.error('Error fetching availability:', error);
      toast.error('Error al cargar la disponibilidad');
    }
  };
const fetchSettings = async () => {
  try {
    const { data, error } = await supabase
      .from('settings')
      .select('*')
      .eq('id', 'main') 
      .limit(1)
      .single();

    if (error) throw error;

    if (data) {
      setMinAdvance(data.min_advance?.toString() ?? '3');
      setMaxAdvance(data.max_advance?.toString() ?? '30');
      setCancelLimit(data.cancel_limit?.toString() ?? '12');
    }
  } catch (error) {
    console.error('Error fetching settings:', error);
    toast.error('Error al cargar la configuración de reservas');
  }
};

useEffect(() => {
  fetchAvailability();
  fetchSettings();
}, []);

  // ------- SOLO CAMBIOS AQUÍ ABAJO --------

  // Handle toggling day availability
  const handleToggleDay = async (dayOfWeek: number) => {
    try {
      const updatedData = availabilityData.map(day => {
        if (day.dayOfWeek === dayOfWeek) {
          return {
            ...day,
            isAvailable: !day.isAvailable,
            slots: !day.isAvailable ? timeSlots.map(slot => ({
              startTime: slot.start,
              endTime: slot.end
            })) : []
          };
        }
        return day;
      });

      setAvailabilityData(updatedData);

      const updatedDay = updatedData.find(d => d.dayOfWeek === dayOfWeek);

      // Haz el upsert SOLO del día cambiado
      const { error } = await supabase
        .from('availability')
        .upsert(
          [{
            day_of_week: dayOfWeek,
            is_available: updatedDay.isAvailable,
            slots: updatedDay.slots
          }],
          { onConflict: 'day_of_week' }
        );

      if (error) throw error;
    } catch (error) {
      console.error('Error toggling day:', error);
      toast.error('Error al actualizar la disponibilidad');
    }
  };

  // Handle toggling time slot
  const handleToggleTimeSlot = async (dayOfWeek: number, slot: { start: string, end: string }) => {
    try {
      const updatedData = availabilityData.map(day => {
        if (day.dayOfWeek === dayOfWeek) {
          const hasSlot = day.slots.some(
            s => s.startTime === slot.start && s.endTime === slot.end
          );
          return {
            ...day,
            slots: hasSlot
              ? day.slots.filter(s => !(s.startTime === slot.start && s.endTime === slot.end))
              : [...day.slots, { startTime: slot.start, endTime: slot.end }]
          };
        }
        return day;
      });

      setAvailabilityData(updatedData);

      const updatedDay = updatedData.find(d => d.dayOfWeek === dayOfWeek);

      // Haz el upsert SOLO del día cambiado
      const { error } = await supabase
        .from('availability')
        .upsert(
          [{
            day_of_week: dayOfWeek,
            is_available: updatedDay.isAvailable,
            slots: updatedDay.slots
          }],
          { onConflict: 'day_of_week' }
        );

      if (error) throw error;
    } catch (error) {
      console.error('Error toggling slot:', error);
      toast.error('Error al actualizar el horario');
    }
  };

  // Save all changes
  const handleSaveChanges = async () => {
    setIsUpdating(true);
    try {
      // Aquí sí puedes hacer el upsert de todo
      const { error: availabilityError } = await supabase
        .from('availability')
        .upsert(
          availabilityData.map(day => ({
            day_of_week: day.dayOfWeek,
            is_available: day.isAvailable,
            slots: day.slots
          })),
          { onConflict: 'day_of_week' }
        );

      if (availabilityError) throw availabilityError;

      // Save booking settings
      const { error: settingsError } = await supabase
        .from('settings')
        .upsert({
          id: 'main',
          min_advance: parseInt(minAdvance),
          max_advance: parseInt(maxAdvance),
          cancel_limit: parseInt(cancelLimit)
        });

      if (settingsError) throw settingsError;

      toast.success('Configuración guardada con éxito');
      await fetchAvailability();
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Error al guardar la configuración');
    } finally {
      setIsUpdating(false);
    }
  };

  // Check if a time slot is active
  const isTimeSlotActive = (dayOfWeek: number, start: string, end: string) => {
    const day = availabilityData.find(d => d.dayOfWeek === dayOfWeek);
    if (!day || !day.isAvailable) return false;
    return day.slots.some(slot => slot.startTime === start && slot.endTime === end);
  };

  // Days of the week
  const daysOfWeek = [
    { value: 1, label: 'Lunes' },
    { value: 2, label: 'Martes' },
    { value: 3, label: 'Miércoles' },
    { value: 4, label: 'Jueves' },
    { value: 5, label: 'Viernes' },
    { value: 6, label: 'Sábado' },
    { value: 0, label: 'Domingo' },
  ];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Configuración</h1>
        <p className="text-gray-600 mt-1">
          Gestiona tu disponibilidad y preferencias
        </p>
      </div>

      {/* Availability settings */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden mb-8">
        <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
          <h3 className="text-lg leading-6 font-medium text-gray-900 flex items-center">
            <Clock className="h-5 w-5 mr-2 text-gray-500" />
            Disponibilidad semanal
          </h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            Configura tus horarios disponibles para cada día de la semana
          </p>
        </div>

        <div className="px-4 py-5 sm:p-6">
          <div className="space-y-6">
            {daysOfWeek.map((day) => {
              const dayData = availabilityData.find(d => d.dayOfWeek === day.value);
              
              return (
                <div key={day.value} className="border-b border-gray-200 pb-5 last:border-b-0 last:pb-0">
                  <div className="flex items-center justify-between">
                    <h4 className="text-base font-medium text-gray-900">{day.label}</h4>
                    <div className="flex items-center">
                      <span className="mr-3 text-sm text-gray-500">
                        {dayData?.isAvailable ? 'Disponible' : 'No disponible'}
                      </span>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          className="sr-only peer"
                          checked={dayData?.isAvailable || false}
                          onChange={() => handleToggleDay(day.value)}
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                      </label>
                    </div>
                  </div>

                  {dayData?.isAvailable && (
                    <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
                      {timeSlots.map((slot) => (
                        <button
                          key={`${day.value}-${slot.start}`}
                          onClick={() => handleToggleTimeSlot(day.value, slot)}
                          className={`
                            py-2 px-3 text-sm font-medium rounded-md border transition-colors
                            ${isTimeSlotActive(day.value, slot.start, slot.end)
                              ? 'bg-primary-50 border-primary-500 text-primary-700'
                              : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                            }
                          `}
                        >
                          {slot.start} - {slot.end}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="mt-6">
            <button
              type="button"
              className="btn btn-primary flex items-center"
              onClick={handleSaveChanges}
              disabled={isUpdating}
            >
              <Save className="h-4 w-4 mr-2" />
              {isUpdating ? 'Guardando...' : 'Guardar cambios'}
            </button>
          </div>
        </div>
      </div>

      {/* Booking settings */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Configuración de reservas
          </h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            Configura las reglas para las reservas de clases
          </p>
        </div>
        
        <div className="px-4 py-5 sm:p-6">
          <div className="space-y-6">
            <div>
              <label htmlFor="min-advance" className="block text-sm font-medium text-gray-700 mb-1">
                Tiempo mínimo de antelación para reservar
              </label>
              <select
                id="min-advance"
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
                value={minAdvance}
                onChange={(e) => setMinAdvance(e.target.value)}
              >
                <option value="1">1 hora</option>
                <option value="2">2 horas</option>
                <option value="3">3 horas</option>
                <option value="6">6 horas</option>
                <option value="12">12 horas</option>
                <option value="24">1 día</option>
                <option value="48">2 días</option>
              </select>
            </div>
            
            <div>
              <label htmlFor="max-advance" className="block text-sm font-medium text-gray-700 mb-1">
                Tiempo máximo de antelación para reservar
              </label>
              <select
                id="max-advance"
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
                value={maxAdvance}
                onChange={(e) => setMaxAdvance(e.target.value)}
              >
                <option value="7">1 semana</option>
                <option value="14">2 semanas</option>
                <option value="30">1 mes</option>
                <option value="60">2 meses</option>
                <option value="90">3 meses</option>
              </select>
            </div>
            
            <div>
              <label htmlFor="cancel-limit" className="block text-sm font-medium text-gray-700 mb-1">
                Tiempo límite para cancelar reservas
              </label>
              <select
                id="cancel-limit"
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
                value={cancelLimit}
                onChange={(e) => setCancelLimit(e.target.value)}
              >
                <option value="3">3 horas</option>
                <option value="6">6 horas</option>
                <option value="12">12 horas</option>
                <option value="24">1 día</option>
                <option value="48">2 días</option>
              </select>
            </div>
            
            <div className="bg-blue-50 p-4 rounded-md">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-blue-800">Nota</h3>
                  <div className="mt-2 text-sm text-blue-700">
                    <p>
                      Para la integración con Google Calendar, deberás configurar tu cuenta en la sección de integraciones.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-6">
            <button
              type="button"
              className="btn btn-primary flex items-center"
              onClick={handleSaveChanges}
              disabled={isUpdating}
            >
              <Save className="h-4 w-4 mr-2" />
              {isUpdating ? 'Guardando...' : 'Guardar cambios'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
