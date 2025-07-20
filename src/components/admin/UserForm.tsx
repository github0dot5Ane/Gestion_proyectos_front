// src/components/admin/UserForm.tsx
import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { User, UserFormData } from '../../types';
import { AppDispatch } from '../../app/store';
import { selectUserError, selectUsersStatus, clearUserError } from '../../features/users/userSlice';

interface UserFormProps {
  user?: User | null;
  onSubmit: (formData: UserFormData, userId?: number) => void;
  onCancel: () => void;
}

const UserForm: React.FC<UserFormProps> = ({ user, onSubmit, onCancel }) => {
  const dispatch: AppDispatch = useDispatch();
  const status = useSelector(selectUsersStatus);
  const error = useSelector(selectUserError);
  const isLoading = status === 'loading';

  const [formData, setFormData] = useState<UserFormData>({
    nombre: '',
    email: '',
    telefono: '',
    estado: true,
    admin: false,
    password: '',
  });

  const isEditing = !!user;

  useEffect(() => {
    if (isEditing && user) {
      setFormData({
        nombre: user.nombre,
        email: user.email,
        telefono: user.telefono || '',
        estado: user.estado,
        admin: user.admin,
        password: '',
      });
    } else {
      setFormData({ nombre: '', email: '', telefono: '', estado: true, admin: false, password: '' });
    }
    dispatch(clearUserError());
  }, [user, isEditing, dispatch]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    dispatch(clearUserError());
    if (!formData.email || !formData.nombre) {
      alert("Nombre y Email son requeridos.");
      return;
    }
    if (!isEditing && !formData.password) {
      alert("La contraseña es requerida para crear un usuario.");
      return;
    }
    if (!isEditing && formData.password && formData.password.length < 8) {
      alert("La contraseña debe tener al menos 8 caracteres.");
      return;
    }

    const dataToSend = { ...formData };
    if (isEditing) {
      delete dataToSend.password;
      onSubmit(dataToSend, user?.id);
    } else {
      onSubmit(dataToSend);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded text-sm">
          Error: {error}
        </div>
      )}

      <div>
        <label htmlFor="nombre" className="block text-sm font-medium text-gray-700">
          Nombre Completo <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          name="nombre"
          id="nombre"
          required
          value={formData.nombre}
          onChange={handleChange}
          disabled={isLoading}
          className={`mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm sm:text-sm disabled:bg-gray-50 focus:ring-indigo-500 focus:border-indigo-500 ${
            formData.nombre ? 'text-gray-900' : 'text-gray-500'
          }`}
        />
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700">
          Email <span className="text-red-500">*</span>
        </label>
        <input
          type="email"
          name="email"
          id="email"
          required
          value={formData.email}
          onChange={handleChange}
          disabled={isLoading}
          className={`mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm sm:text-sm disabled:bg-gray-50 focus:ring-indigo-500 focus:border-indigo-500 ${
            formData.email ? 'text-gray-900' : 'text-gray-500'
          }`}
        />
      </div>

      <div>
        <label htmlFor="telefono" className="block text-sm font-medium text-gray-700">
          Teléfono
        </label>
        <input
          type="tel"
          name="telefono"
          id="telefono"
          value={formData.telefono}
          onChange={handleChange}
          disabled={isLoading}
          className={`mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm sm:text-sm disabled:bg-gray-50 focus:ring-indigo-500 focus:border-indigo-500 ${
            formData.telefono ? 'text-gray-900' : 'text-gray-500'
          }`}
        />
      </div>

      {!isEditing && (
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700">
            Contraseña <span className="text-red-500">*</span>
          </label>
          <input
            type="password"
            name="password"
            id="password"
            required
            placeholder="Mínimo 8 caracteres"
            value={formData.password}
            onChange={handleChange}
            disabled={isLoading}
            className={`mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm sm:text-sm disabled:bg-gray-50 focus:ring-indigo-500 focus:border-indigo-500 ${
              formData.password ? 'text-gray-900' : 'text-gray-500'
            }`}
          />
        </div>
      )}

      <div className="flex space-x-6 pt-2">
        <div className="flex items-center">
          <input
            id="estado"
            name="estado"
            type="checkbox"
            checked={formData.estado}
            onChange={handleChange}
            disabled={isLoading}
            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded disabled:opacity-50"
          />
          <label htmlFor="estado" className="ml-2 block text-sm text-gray-900">Habilitado</label>
        </div>
        <div className="flex items-center">
          <input
            id="admin"
            name="admin"
            type="checkbox"
            checked={formData.admin}
            onChange={handleChange}
            disabled={isLoading}
            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded disabled:opacity-50"
          />
          <label htmlFor="admin" className="ml-2 block text-sm text-gray-900">Es Administrador</label>
        </div>
      </div>

      <div className="flex justify-end space-x-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          disabled={isLoading}
          className="bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 px-4 rounded-md text-sm disabled:opacity-50"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-4 rounded-md text-sm disabled:opacity-50 flex items-center"
        >
          {isLoading && (
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" />
          )}
          {isEditing ? 'Guardar Cambios' : 'Crear Usuario'}
        </button>
      </div>
    </form>
  );
};

export default UserForm;
