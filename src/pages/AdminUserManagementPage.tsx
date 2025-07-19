// src/pages/AdminUserManagementPage.tsx
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch } from '../app/store';
import { fetchUsers, createUser, updateUser, deleteUser, setUserForEdit, selectAllUsers, selectUsersStatus, selectUserError, selectUserForEdit, clearUserError } from '../features/users/userSlice';
import { User, UserFormData } from '../types';
import UserForm from '../components/admin/UserForm'; // Importar el formulario

const AdminUserManagementPage: React.FC = () => {
    const dispatch: AppDispatch = useDispatch();
    const users = useSelector(selectAllUsers);
    const status = useSelector(selectUsersStatus);
    const error = useSelector(selectUserError); // Error general del slice
    const userToEdit = useSelector(selectUserForEdit); // Usuario seleccionado para editar

    const [showFormModal, setShowFormModal] = useState(false);
    const [deletingId, setDeletingId] = useState<number | null>(null);

    useEffect(() => {
        // Cargar usuarios al montar si no están cargados
        if (status === 'idle') {
            dispatch(fetchUsers());
        }
        // Limpiar error al montar
        dispatch(clearUserError());
    }, [status, dispatch]);

    // Abrir modal para crear
    const handleOpenCreateModal = () => {
        dispatch(setUserForEdit(null)); // Asegurar que no haya usuario para editar seleccionado
        setShowFormModal(true);
    };

    // Abrir modal para editar
    const handleOpenEditModal = (user: User) => {
        dispatch(setUserForEdit(user));
        setShowFormModal(true);
    };

    // Cerrar modal
    const handleCloseModal = () => {
        setShowFormModal(false);
        dispatch(setUserForEdit(null)); // Limpiar usuario en edición al cerrar
        dispatch(clearUserError()); // Limpiar posible error del formulario
    };

    // Handler para submit del formulario (crear o editar)
    const handleFormSubmit = (formData: UserFormData, userId?: number) => {
        if (userId) { // Editar
            dispatch(updateUser({ userId, userData: formData }))
                .unwrap()
                .then(() => handleCloseModal()) // Cerrar modal si éxito
                .catch(err => console.error("Update user failed:", err)); // El error se muestra en el form
        } else { // Crear
            dispatch(createUser(formData))
                .unwrap()
                .then(() => handleCloseModal()) // Cerrar modal si éxito
                .catch(err => console.error("Create user failed:", err)); // El error se muestra en el form
        }
    };

    // Handler para eliminar usuario
    const handleDeleteUser = (userId: number) => {
        if (window.confirm('¿Estás seguro de que quieres eliminar este usuario?')) {
            setDeletingId(userId);
            dispatch(deleteUser(userId))
                .unwrap()
                .catch((err) => alert(`Error al eliminar usuario: ${err}`)) // Mostrar alerta si falla
                .finally(() => setDeletingId(null));
        }
    };


    if (status === 'loading' && users.length === 0) {
        return <div className="text-center p-10">Cargando usuarios...</div>;
    }

    // No mostrar error general aquí si el error es del formulario dentro del modal
    // if (status === 'failed' && users.length === 0) {
    //    return <div className="text-center p-10 text-red-600">Error al cargar usuarios: {error}</div>;
    // }


    return (
        <div>
            {/* Modal para Crear/Editar Usuario */}
            {showFormModal && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-75 overflow-y-auto h-full w-full z-50 flex justify-center items-start pt-10">
                    <div className="relative mx-auto p-5 border w-full max-w-lg shadow-lg rounded-md bg-white">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-semibold">{userToEdit ? 'Editar Usuario' : 'Crear Nuevo Usuario'}</h3>
                            <button onClick={handleCloseModal} className="text-gray-500 hover:text-gray-700 text-2xl" disabled={status === 'loading'}>×</button>
                        </div>
                        <UserForm
                            user={userToEdit}
                            onSubmit={handleFormSubmit}
                            onCancel={handleCloseModal}
                        />
                    </div>
                </div>
            )}


            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold">Gestión de Usuarios</h1>
                <button
                    onClick={handleOpenCreateModal}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-4 rounded-md text-sm"
                >
                    + Crear Usuario
                </button>
            </div>

            {/* Mostrar error de carga inicial o de eliminación */}
            {status === 'failed' && error && !showFormModal && (
                <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded text-sm">
                    Error: {error}
                </div>
            )}


            {/* Tabla de Usuarios */}
            <div className="bg-white shadow overflow-x-auto sm:rounded-md">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Teléfono</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rol</th>
                            <th scope="col" className="relative px-6 py-3"><span className="sr-only">Acciones</span></th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {users.map((user) => (
                            <tr key={user.id}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{user.nombre}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.email}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.telefono || '-'}</td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${user.estado ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                        }`}>
                                        {user.estado ? 'Habilitado' : 'Deshabilitado'}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {user.admin ? 'Admin' : 'Usuario'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                                    <button onClick={() => handleOpenEditModal(user)} className="text-indigo-600 hover:text-indigo-900" title='Editar'>✏️</button>
                                    <button onClick={() => handleDeleteUser(user.id)}
                                        disabled={deletingId === user.id}
                                        className="text-red-600 hover:text-red-900 disabled:opacity-50" title='Eliminar'>
                                        {deletingId === user.id ? '...' : '🗑️'}
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {users.length === 0 && status !== 'loading' && (
                <p className="text-center text-gray-500 mt-10">No hay usuarios registrados.</p>
            )}
        </div>
    );
};

export default AdminUserManagementPage;