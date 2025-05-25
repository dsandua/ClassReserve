import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import { BookingProvider } from './context/BookingContext';
import { NotificationsProvider } from './context/NotificationsContext';
import { Toaster } from 'react-hot-toast';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <BookingProvider>
          <NotificationsProvider>
            <App />
            <Toaster position="top-right" />
          </NotificationsProvider>
        </BookingProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>
);