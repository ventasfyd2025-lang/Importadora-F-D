'use client';

import { useNotification } from '@/context/NotificationContext';
import { XMarkIcon, CheckCircleIcon, ExclamationTriangleIcon, InformationCircleIcon } from '@heroicons/react/24/outline';

export default function NotificationDisplay() {
  const { notifications, removeNotification } = useNotification();

  if (notifications.length === 0) return null;

  return (
    <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-[9999] space-y-2 pointer-events-none w-full max-w-sm px-4 sm:px-0">
      {notifications.map((notification) => {
        const getIcon = () => {
          switch (notification.type) {
            case 'success':
              return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
            case 'error':
              return <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />;
            case 'warning':
              return <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500" />;
            case 'info':
              return <InformationCircleIcon className="h-5 w-5 text-blue-500" />;
            default:
              return <InformationCircleIcon className="h-5 w-5 text-gray-500" />;
          }
        };

        const getBgColor = () => {
          switch (notification.type) {
            case 'success':
              return 'bg-green-50 border-green-200';
            case 'error':
              return 'bg-red-50 border-red-200';
            case 'warning':
              return 'bg-yellow-50 border-yellow-200';
            case 'info':
              return 'bg-blue-50 border-blue-200';
            default:
              return 'bg-gray-50 border-gray-200';
          }
        };

        return (
          <div
            key={notification.id}
            className={`w-full ${getBgColor()} border rounded-lg shadow-xl p-4 animate-slide-in-right pointer-events-auto min-h-[4rem]`}
          >
            <div className="flex items-start">
              <div className="flex-shrink-0">
                {getIcon()}
              </div>
              <div className="ml-3 w-0 flex-1">
                <p className="text-sm font-medium text-gray-900">
                  {notification.title}
                </p>
                {notification.message && (
                  <p className="mt-1 text-sm text-gray-500">
                    {notification.message}
                  </p>
                )}
              </div>
              <div className="ml-4 flex-shrink-0 flex">
                <button
                  className="inline-flex text-gray-400 hover:text-gray-600 focus:outline-none"
                  onClick={() => removeNotification(notification.id)}
                >
                  <XMarkIcon className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}