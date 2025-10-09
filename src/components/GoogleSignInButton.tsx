'use client';

import { useGoogleAuth } from '@/hooks/useGoogleAuth';
import { useUserAuth } from '@/hooks/useUserAuth';

interface GoogleSignInButtonProps {
  mode?: 'signin' | 'signup' | 'link';
  onSuccess?: () => void;
  onError?: (error: string) => void;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'outline' | 'filled';
}

export default function GoogleSignInButton({
  mode = 'signin',
  onSuccess,
  onError,
  className = '',
  size = 'md',
  variant = 'outline'
}: GoogleSignInButtonProps) {
  const { signInWithGoogle, linkGoogleAccount, loading, error } = useGoogleAuth();
  const { currentUser } = useUserAuth();

  const handleClick = async () => {
    try {
      if (mode === 'link' && currentUser) {
        await linkGoogleAccount(currentUser as any);
      } else {
        await signInWithGoogle();
      }

      onSuccess?.();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      onError?.(errorMessage);
    }
  };

  const getButtonText = () => {
    if (loading) return 'Conectando...';

    switch (mode) {
      case 'signup':
        return 'Registrarse con Google';
      case 'link':
        return 'Vincular cuenta de Google';
      case 'signin':
      default:
        return 'Continuar con Google';
    }
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'px-3 py-2 text-sm';
      case 'lg':
        return 'px-6 py-4 text-lg';
      case 'md':
      default:
        return 'px-4 py-3 text-base';
    }
  };

  const getVariantClasses = () => {
    switch (variant) {
      case 'filled':
        return 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 shadow-sm';
      case 'outline':
      default:
        return 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50';
    }
  };

  return (
    <div className="w-full">
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        className={`
          w-full flex items-center justify-center
          ${getSizeClasses()}
          ${getVariantClasses()}
          font-medium rounded-lg
          transition-all duration-200
          disabled:opacity-50 disabled:cursor-not-allowed
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
          ${className}
        `}
      >
        {loading ? (
          <div className="flex items-center">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-600 mr-3"></div>
            {getButtonText()}
          </div>
        ) : (
          <div className="flex items-center">
            {/* Google Logo SVG */}
            <svg
              className="w-5 h-5 mr-3"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            {getButtonText()}
          </div>
        )}
      </button>

      {error && (
        <div className="mt-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-2">
          {error}
        </div>
      )}
    </div>
  );
}