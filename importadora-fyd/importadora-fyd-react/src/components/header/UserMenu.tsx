'use client';

import { memo } from 'react';
import Link from 'next/link';
import { UserIcon, ShoppingBagIcon, ArrowRightOnRectangleIcon } from '@heroicons/react/24/outline';

interface UserMenuProps {
  isOpen: boolean;
  isRegistered: boolean;
  isGuest: boolean;
  userMenuRef: React.RefObject<HTMLDivElement>;
  onLogout: () => void;
}

const UserMenu = memo(function UserMenu({
  isOpen,
  isRegistered,
  isGuest,
  userMenuRef,
  onLogout
}: UserMenuProps) {
  if (!isOpen) return null;

  return (
    <div
      ref={userMenuRef}
      className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 border border-gray-200"
    >
      {isRegistered && (
        <>
          <Link
            href="/perfil"
            className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
          >
            <UserIcon className="w-4 h-4 mr-2" />
            Mi Perfil
          </Link>
          <Link
            href="/mis-pedidos"
            className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
          >
            <ShoppingBagIcon className="w-4 h-4 mr-2" />
            Mis Pedidos
          </Link>
        </>
      )}

      {isGuest && (
        <>
          <Link
            href="/login"
            className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
          >
            <UserIcon className="w-4 h-4 mr-2" />
            Iniciar Sesión
          </Link>
          <Link
            href="/registro"
            className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
          >
            Registrarse
          </Link>
        </>
      )}

      {!isGuest && (
        <button
          onClick={onLogout}
          className="flex items-center w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
        >
          <ArrowRightOnRectangleIcon className="w-4 h-4 mr-2" />
          Cerrar Sesión
        </button>
      )}
    </div>
  );
});

export default UserMenu;
