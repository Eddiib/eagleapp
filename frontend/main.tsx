import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'sonner';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import { ConfirmDialogProvider } from './context/ConfirmDialog';
import { CompanySettingsProvider } from './context/CompanySettingsContext';
import { BookingStatusesProvider } from './context/BookingStatusesContext';
import { TabsProvider } from './context/TabsContext';
import './styles/globals.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <CompanySettingsProvider>
          <BookingStatusesProvider>
            <ConfirmDialogProvider>
              <TabsProvider>
                <App />
              </TabsProvider>
            </ConfirmDialogProvider>
          </BookingStatusesProvider>
        </CompanySettingsProvider>
      </AuthProvider>
      <Toaster position="top-right" richColors closeButton />
    </BrowserRouter>
  </React.StrictMode>
);
