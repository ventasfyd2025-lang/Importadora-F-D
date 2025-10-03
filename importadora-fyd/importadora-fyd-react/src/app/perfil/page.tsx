'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUserAuth } from '@/hooks/useUserAuth';
import { useOrderNotifications } from '@/hooks/useOrderNotifications';
import Layout from '@/components/Layout';
import { UserIcon, MapPinIcon, PhoneIcon, EnvelopeIcon, KeyIcon } from '@heroicons/react/24/outline';
import { updatePassword, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import { auth } from '@/lib/firebase';

export default function ProfilePage() {
  const { currentUser, userProfile, updateUserProfile, isRegistered, loading } = useUserAuth();
  const unreadOrderNotifications = useOrderNotifications();
  const router = useRouter();

  const [isEditing, setIsEditing] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    rut: '',
    address: {
      street: '',
      city: '',
      region: '',
      postalCode: ''
    }
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!loading && !isRegistered) {
      router.push('/login');
      return;
    }

    if (userProfile) {
      setFormData({
        firstName: userProfile.firstName || '',
        lastName: userProfile.lastName || '',
        phone: userProfile.phone || '',
        rut: userProfile.rut || '',
        address: {
          street: userProfile.address?.street || '',
          city: userProfile.address?.city || '',
          region: userProfile.address?.region || '',
          postalCode: userProfile.address?.postalCode || ''
        }
      });
    }
  }, [userProfile, loading, isRegistered, router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name.startsWith('address.')) {
      const addressField = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        address: {
          ...prev.address,
          [addressField]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage('');

    try {
      await updateUserProfile(formData);
      setIsEditing(false);
      setMessage('Perfil actualizado correctamente');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage('Error al actualizar el perfil');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (userProfile) {
      setFormData({
        firstName: userProfile.firstName || '',
        lastName: userProfile.lastName || '',
        phone: userProfile.phone || '',
        rut: userProfile.rut || '',
        address: {
          street: userProfile.address?.street || '',
          city: userProfile.address?.city || '',
          region: userProfile.address?.region || '',
          postalCode: userProfile.address?.postalCode || ''
        }
      });
    }
    setIsEditing(false);
  };

  const handlePasswordChange = async () => {
    setMessage('');

    // Validaciones
    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      setMessage('Por favor completa todos los campos');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setMessage('La nueva contraseña debe tener al menos 6 caracteres');
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setMessage('Las contraseñas nuevas no coinciden');
      return;
    }

    if (passwordData.currentPassword === passwordData.newPassword) {
      setMessage('La nueva contraseña debe ser diferente a la actual');
      return;
    }

    try {
      setSaving(true);
      const user = auth.currentUser;

      if (!user || !user.email) {
        setMessage('Error: Usuario no autenticado');
        return;
      }

      // Reautenticar usuario
      const credential = EmailAuthProvider.credential(
        user.email,
        passwordData.currentPassword
      );

      await reauthenticateWithCredential(user, credential);

      // Actualizar contraseña
      await updatePassword(user, passwordData.newPassword);

      // Limpiar formulario y cerrar modal
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      setShowPasswordModal(false);
      setMessage('Contraseña actualizada correctamente');
      setTimeout(() => setMessage(''), 3000);
    } catch (error: any) {
      console.error('Error changing password:', error);

      if (error.code === 'auth/wrong-password') {
        setMessage('La contraseña actual es incorrecta');
      } else if (error.code === 'auth/requires-recent-login') {
        setMessage('Por seguridad, debes iniciar sesión nuevamente');
      } else {
        setMessage('Error al cambiar la contraseña');
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  if (!isRegistered) {
    return null; // Will redirect in useEffect
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 py-4 sm:py-8">
      <div className="max-w-4xl mx-auto px-3 sm:px-4 lg:px-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
            <div className="flex items-center space-x-3 sm:space-x-4">
              <div className="bg-orange-100 p-2 sm:p-3 rounded-full">
                <UserIcon className="h-6 w-6 sm:h-8 sm:w-8 text-orange-600" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Mi Perfil</h1>
                <p className="text-sm sm:text-base text-gray-600">Gestiona tu información personal</p>
              </div>
            </div>
            
            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                className="w-full sm:w-auto px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors text-sm sm:text-base"
              >
                Editar Perfil
              </button>
            ) : (
              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 w-full sm:w-auto">
                <button
                  onClick={handleCancel}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm sm:text-base"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50 text-sm sm:text-base"
                >
                  {saving ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            )}
          </div>
          
          {message && (
            <div className={`mt-4 p-3 rounded ${
              message.includes('Error') 
                ? 'bg-red-50 text-red-700 border border-red-200' 
                : 'bg-green-50 text-green-700 border border-green-200'
            }`}>
              {message}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
          {/* Información Personal */}
          <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
            <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-4 sm:mb-6 flex items-center">
              <UserIcon className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-gray-600" />
              Información Personal
            </h2>

            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm sm:text-base"
                    />
                  ) : (
                    <p className="text-gray-900 text-sm sm:text-base">{userProfile?.firstName || 'No especificado'}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Apellido
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm sm:text-base"
                    />
                  ) : (
                    <p className="text-gray-900 text-sm sm:text-base">{userProfile?.lastName || 'No especificado'}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                  <EnvelopeIcon className="h-4 w-4 mr-1" />
                  Email
                </label>
                <p className="text-gray-900 bg-gray-50 px-3 py-2 rounded-lg text-sm sm:text-base">
                  {userProfile?.email} (no se puede modificar)
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                  <PhoneIcon className="h-4 w-4 mr-1" />
                  Teléfono
                </label>
                {isEditing ? (
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="+56 9 1234 5678"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm sm:text-base"
                  />
                ) : (
                  <p className="text-gray-900 text-sm sm:text-base">{userProfile?.phone || 'No especificado'}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  RUT
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    name="rut"
                    value={formData.rut}
                    onChange={handleChange}
                    placeholder="12.345.678-9"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm sm:text-base"
                  />
                ) : (
                  <p className="text-gray-900 text-sm sm:text-base">{userProfile?.rut || 'No especificado'}</p>
                )}
              </div>
            </div>
          </div>

          {/* Dirección */}
          <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
            <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-4 sm:mb-6 flex items-center">
              <MapPinIcon className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-gray-600" />
              Dirección
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Dirección
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    name="address.street"
                    value={formData.address.street}
                    onChange={handleChange}
                    placeholder="Calle Principal 123"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm sm:text-base"
                  />
                ) : (
                  <p className="text-gray-900 text-sm sm:text-base">{userProfile?.address?.street || 'No especificado'}</p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ciudad
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      name="address.city"
                      value={formData.address.city}
                      onChange={handleChange}
                      placeholder="Santiago"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm sm:text-base"
                    />
                  ) : (
                    <p className="text-gray-900 text-sm sm:text-base">{userProfile?.address?.city || 'No especificado'}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Región
                  </label>
                  {isEditing ? (
                    <select
                      name="address.region"
                      value={formData.address.region}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm sm:text-base"
                    >
                      <option value="">Seleccionar región</option>
                      <option value="Metropolitana">Metropolitana</option>
                      <option value="Valparaíso">Valparaíso</option>
                      <option value="Biobío">Biobío</option>
                      <option value="Araucanía">Araucanía</option>
                      <option value="Los Lagos">Los Lagos</option>
                      <option value="Antofagasta">Antofagasta</option>
                      <option value="Coquimbo">Coquimbo</option>
                      <option value="O&apos;Higgins">O&apos;Higgins</option>
                      <option value="Maule">Maule</option>
                      <option value="Aysén">Aysén</option>
                      <option value="Magallanes">Magallanes</option>
                      <option value="Tarapacá">Tarapacá</option>
                      <option value="Atacama">Atacama</option>
                      <option value="Los Ríos">Los Ríos</option>
                      <option value="Arica y Parinacota">Arica y Parinacota</option>
                      <option value="Ñuble">Ñuble</option>
                    </select>
                  ) : (
                    <p className="text-gray-900 text-sm sm:text-base">{userProfile?.address?.region || 'No especificado'}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Código Postal
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    name="address.postalCode"
                    value={formData.address.postalCode}
                    onChange={handleChange}
                    placeholder="8320000"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                ) : (
                  <p className="text-gray-900 text-sm sm:text-base">{userProfile?.address?.postalCode || 'No especificado'}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-6 sm:mt-8 bg-white rounded-lg shadow-md p-4 sm:p-6">
          <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">Acciones Rápidas</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button
              onClick={() => setShowPasswordModal(true)}
              className="flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm sm:text-base"
            >
              <KeyIcon className="h-5 w-5 mr-2 text-gray-600" />
              <span className="text-gray-700">Cambiar Contraseña</span>
            </button>
            <button
              onClick={() => router.push('/mis-pedidos')}
              className="flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm sm:text-base relative"
            >
              <span className="text-gray-700">Ver Mis Pedidos</span>
              {unreadOrderNotifications > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold animate-pulse">
                  {unreadOrderNotifications > 9 ? '9+' : unreadOrderNotifications}
                </span>
              )}
            </button>
            <button
              onClick={() => router.push('/')}
              className="flex items-center justify-center px-4 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors text-sm sm:text-base sm:col-span-2"
            >
              <span>Continuar Comprando</span>
            </button>
          </div>
        </div>

        {/* Password Change Modal */}
        {showPasswordModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900 flex items-center">
                  <KeyIcon className="h-6 w-6 mr-2 text-orange-600" />
                  Cambiar Contraseña
                </h2>
                <button
                  onClick={() => {
                    setShowPasswordModal(false);
                    setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
                    setMessage('');
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Contraseña Actual
                  </label>
                  <input
                    type="password"
                    value={passwordData.currentPassword}
                    onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="Ingresa tu contraseña actual"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nueva Contraseña
                  </label>
                  <input
                    type="password"
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="Mínimo 6 caracteres"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Confirmar Nueva Contraseña
                  </label>
                  <input
                    type="password"
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="Repite la nueva contraseña"
                  />
                </div>

                {message && (
                  <div className={`p-3 rounded ${
                    message.includes('Error') || message.includes('incorrecta') || message.includes('coinciden')
                      ? 'bg-red-50 text-red-700 border border-red-200'
                      : 'bg-green-50 text-green-700 border border-green-200'
                  }`}>
                    {message}
                  </div>
                )}

                <div className="flex space-x-3 mt-6">
                  <button
                    onClick={() => {
                      setShowPasswordModal(false);
                      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
                      setMessage('');
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handlePasswordChange}
                    disabled={saving}
                    className="flex-1 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50"
                  >
                    {saving ? 'Cambiando...' : 'Cambiar Contraseña'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      </div>
    </Layout>
  );
}
