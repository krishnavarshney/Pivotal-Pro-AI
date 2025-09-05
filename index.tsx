import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './src/App';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { DashboardProvider } from './src/contexts/DashboardProvider';
import { SidebarProvider } from './src/components/ui/sidebar.tsx';
import { AuthProvider } from './src/contexts/AuthProvider';
import './src/styles.css';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = createRoot(rootElement);
root.render(
  <React.StrictMode>
    <AuthProvider>
        <DndProvider backend={HTML5Backend}>
            <DashboardProvider>
                <SidebarProvider>
                    <App />
                </SidebarProvider>
            </DashboardProvider>
        </DndProvider>
    </AuthProvider>
  </React.StrictMode>
);