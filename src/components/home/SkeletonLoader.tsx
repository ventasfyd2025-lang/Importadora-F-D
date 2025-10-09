'use client';

import React, { memo } from 'react';
import { useI18n } from '@/context/I18nContext';

interface ProductCardSkeletonProps {
  count?: number;
}

const ProductCardSkeleton = memo(({ count = 1 }: ProductCardSkeletonProps) => {
  const { t } = useI18n();
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="flex flex-col bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm animate-pulse" aria-label={t('common.loading')}>
          <div className="bg-gray-200 aspect-square w-full rounded-t-xl"></div>
          <div className="p-4 flex flex-col flex-1">
            <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
            <div className="h-5 bg-gray-200 rounded w-4/5 mb-3"></div>
            <div className="flex items-baseline gap-2 mb-3">
              <div className="h-6 bg-gray-200 rounded w-1/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/6"></div>
            </div>
            <div className="flex items-center mt-2">
              <div className="flex space-x-1">
                <div className="h-4 w-4 bg-gray-200 rounded-full"></div>
                <div className="h-4 w-4 bg-gray-200 rounded-full"></div>
                <div className="h-4 w-4 bg-gray-200 rounded-full"></div>
                <div className="h-4 w-4 bg-gray-200 rounded-full"></div>
                <div className="h-4 w-4 bg-gray-200 rounded-full"></div>
              </div>
              <div className="h-3 bg-gray-200 rounded w-1/6 ml-2"></div>
            </div>
            <div className="mt-4 h-10 bg-gray-200 rounded-lg w-full"></div>
          </div>
        </div>
      ))}
    </>
  );
});

ProductCardSkeleton.displayName = 'ProductCardSkeleton';

interface BannerSkeletonProps {
  count?: number;
}

const BannerSkeleton = memo(({ count = 1 }: BannerSkeletonProps) => {
  const { t } = useI18n();
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="relative w-full h-64 md:h-96 rounded-2xl overflow-hidden shadow-xl animate-pulse" aria-label={t('common.loading')}>
          <div className="bg-gray-200 w-full h-full"></div>
          <div className="absolute inset-0 flex items-center">
            <div className="container mx-auto px-4 md:px-8">
              <div className="max-w-xl">
                <div className="h-6 bg-gray-300 rounded-full w-1/4 mb-4"></div>
                <div className="h-10 bg-gray-300 rounded w-3/4 mb-3"></div>
                <div className="h-6 bg-gray-300 rounded w-1/2 mb-6"></div>
                <div className="h-12 bg-gray-300 rounded-lg w-1/3"></div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </>
  );
});

BannerSkeleton.displayName = 'BannerSkeleton';

export { ProductCardSkeleton, BannerSkeleton };