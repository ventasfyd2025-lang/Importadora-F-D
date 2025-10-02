'use client';

import { memo } from 'react';
import Link from 'next/link';
import { User, ShoppingBag, LogOut } from 'lucide-react';

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
      className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-2xl py-2 z-50 border border-orange-100"
    >
      {isRegistered && (
        <>
          <Link
            href="/perfil"
            className="flex items-center px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-orange-50 hover:text-orange-600 transition-colors"
          >
            <User className="w-5 h-5 mr-3 text-orange-500" strokeWidth={2.5} />
            Mi Perfil
          </Link>
          <Link
            href="/mis-pedidos"
            className="flex items-center px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-orange-50 hover:text-orange-600 transition-colors"
          >
            <ShoppingBag className="w-5 h-5 mr-3 text-orange-500" strokeWidth={2.5} />
            Mis Pedidos
          </Link>
        </>
      )}

      {isGuest && (
        <>
          <Link
            href="/login"
            className="flex items-center px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-orange-50 hover:text-orange-600 transition-colors"
          >
            <User className="w-5 h-5 mr-3 text-orange-500" strokeWidth={2.5} />
            Iniciar Sesión
          </Link>
          <Link
            href="/registro"
            className="flex items-center px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-orange-50 hover:text-orange-600 transition-colors"
          >
            Registrarse
          </Link>
        </>
      )}

      {!isGuest && (
        <button
          onClick={onLogout}
          className="flex items-center w-full text-left px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors border-t border-gray-100 mt-1"
        >
          <LogOut className="w-5 h-5 mr-3" strokeWidth={2.5} />
          Cerrar Sesión
        </button>
      )}
    </div>
  );
});

export default UserMenu;
