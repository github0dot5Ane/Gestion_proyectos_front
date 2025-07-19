// src/app/router.tsx
import { createBrowserRouter, Navigate } from 'react-router-dom';
import LoginPage from '../pages/LoginPage';
import RegisterPage from '../pages/RegisterPage';
import AppLayout from '../components/layout/AppLayout';
import DashboardPage from '../pages/DashboardPage';
import ProtectedRoute from './ProtectedRoute';
import ProjectListPage from '../pages/ProjectListPage'; // <-- Importar
import ProjectDetailsPage from '../pages/ProjectDetailsPage'; // <-- Importar
import MyTasksPage from '../pages/MyTasksPage'; // <-- Importar
import AdminRoute from './AdminRoute'; // <-- Importar AdminRoute
import AdminUserManagementPage from '../pages/AdminUserManagementPage'; // <-- Importar página Admin
// Importar otras páginas cuando existan
// import MyTasksPage from '../pages/MyTasksPage';
// import TaskDetailsPage from '../pages/TaskDetailsPage';
// import AdminUserManagementPage from '../pages/AdminUserManagementPage';

export const router = createBrowserRouter([
    { path: '/login', element: <LoginPage />, },
    { path: '/register', element: <RegisterPage />, },
    {
        path: '/',
        element: <ProtectedRoute><AppLayout /></ProtectedRoute>,
        children: [
            { index: true, element: <DashboardPage /> },
            { path: 'projects', element: <ProjectListPage /> },         // <-- Ruta Lista Proyectos
            { path: 'projects/:projectId', element: <ProjectDetailsPage /> }, // <-- Ruta Detalles Proyecto
            { path: 'my-tasks', element: <MyTasksPage /> }, // <-- Ruta Mis Tareas
            // { path: 'tasks/:taskId', element: <TaskDetailsPage /> },
            // --- Rutas de Admin ---
            {
                path: 'admin/users',
                element: <AdminRoute><AdminUserManagementPage /></AdminRoute> // <-- Proteger con AdminRoute
            },
        ]
    },
    { path: '*', element: <Navigate to="/" replace /> }
]);