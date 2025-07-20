// src/pages/AdminUserManagementPage.tsx
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch } from '../app/store';
import { fetchUsers, createUser, updateUser, deleteUser, setUserForEdit, selectAllUsers, selectUsersStatus, selectUserError, selectUserForEdit, clearUserError } from '../features/users/userSlice';
import { User, UserFormData } from '../types';
import UserForm from '../components/admin/UserForm';

const AdminUserManagementPage: React.FC = () => {
    const dispatch: AppDispatch = useDispatch();
    const users = useSelector(selectAllUsers);
    const status = useSelector(selectUsersStatus);
    const error = useSelector(selectUserError);
    const userToEdit = useSelector(selectUserForEdit);

    const [showFormModal, setShowFormModal] = useState(false);
    const [deletingId, setDeletingId] = useState<number | null>(null);

    useEffect(() => {
        if (status === 'idle') {
            dispatch(fetchUsers());
        }
        dispatch(clearUserError());
    }, [status, dispatch]);

    const handleOpenCreateModal = () => {
        dispatch(setUserForEdit(null));
        setShowFormModal(true);
    };

    const handleOpenEditModal = (user: User) => {
        dispatch(setUserForEdit(user));
        setShowFormModal(true);
    };

    const handleCloseModal = () => {
        setShowFormModal(false);
        dispatch(setUserForEdit(null));
        dispatch(clearUserError());
    };

    const handleFormSubmit = (formData: UserFormData, userId?: number) => {
        if (userId) {
            dispatch(updateUser({ userId, userData: formData }))
                .unwrap()
                .then(() => handleCloseModal())
                .catch(err => console.error("Update user failed:", err));
        } else {
            dispatch(createUser(formData))
                .unwrap()
                .then(() => handleCloseModal())
                .catch(err => console.error("Create user failed:", err));
        }
    };

    const handleDeleteUser = (userId: number) => {
        if (window.confirm('¿Estás seguro de que quieres eliminar este usuario?')) {
            setDeletingId(userId);
            dispatch(deleteUser(userId))
                .unwrap()
                .catch((err) => alert(`Error al eliminar usuario: ${err}`))
                .finally(() => setDeletingId(null));
        }
    };

    if (status === 'loading' && users.length === 0) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Modal para Crear/Editar Usuario */}
            {showFormModal && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
                    <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md">
                        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                            <h3 className="text-xl font-bold text-gray-900">
                                {userToEdit ? 'Editar Usuario' : 'Crear Nuevo Usuario'}
                            </h3>
                            <button 
                                onClick={handleCloseModal} 
                                className="text-gray-400 hover:text-gray-500 focus:outline-none"
                                disabled={status === 'loading'}
                            >
                                <span className="sr-only">Cerrar</span>
                                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        <div className="px-6 py-4">
                            <UserForm
                                user={userToEdit}
                                onSubmit={handleFormSubmit}
                                onCancel={handleCloseModal}
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Encabezado */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Gestión de Usuarios</h1>
                    <p className="mt-1 text-sm text-gray-500">
                        Administra los usuarios del sistema
                    </p>
                </div>
                <button
                    onClick={handleOpenCreateModal}
                    className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                    <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                    </svg>
                    Crear Usuario
                </button>
            </div>

            {/* Mensaje de error */}
            {status === 'failed' && error && !showFormModal && (
                <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4">
                    <div className="flex">
                        <div className="flex-shrink-0">
                            <svg className="h-5 w-5 text-red-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <div className="ml-3">
                            <p className="text-sm text-red-700">
                                <span className="font-medium">Error:</span> {error}
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Tabla de Usuarios */}
            <div className="shadow overflow-hidden border-b border-gray-200 sm:rounded-lg">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Teléfono</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rol</th>
                                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {users.map((user) => (
                                <tr key={user.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-gray-900">{user.nombre}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-500">{user.email}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-500">{user.telefono || '-'}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${user.estado ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                            {user.estado ? 'Habilitado' : 'Deshabilitado'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${user.admin ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'}`}>
                                            {user.admin ? 'Admin' : 'Usuario'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <div className="flex justify-end space-x-3">
                                            <button 
                                                onClick={() => handleOpenEditModal(user)} 
                                                className="text-indigo-600 hover:text-indigo-900"
                                                title="Editar"
                                            >
                                                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                </svg>
                                            </button>
                                            <button 
                                                onClick={() => handleDeleteUser(user.id)}
                                                disabled={deletingId === user.id}
                                                className="text-red-600 hover:text-red-900 disabled:opacity-50"
                                                title="Eliminar"
                                            >
                                                {deletingId === user.id ? (
                                                    <svg className="animate-spin h-5 w-5 text-red-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                    </svg>
                                                ) : (
                                                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                    </svg>
                                                )}
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {users.length === 0 && status !== 'loading' && (
                    <div className="text-center py-12 bg-white">
                        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                        </svg>
                        <h3 className="mt-2 text-sm font-medium text-gray-900">No hay usuarios</h3>
                        <p className="mt-1 text-sm text-gray-500">No se encontraron usuarios registrados en el sistema.</p>
                        <div className="mt-6">
                            <button
                                onClick={handleOpenCreateModal}
                                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                            >
                                <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                                </svg>
                                Crear Usuario
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminUserManagementPage;