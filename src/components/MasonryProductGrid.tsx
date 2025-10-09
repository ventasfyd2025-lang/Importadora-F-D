'use client';

import { useMemo } from 'react';
import ProductCard from '@/components/ProductCard';
import { Product } from '@/types';
import type { LayoutPatternsConfig, LayoutPatternSpan, LayoutPatternVariant } from '@/types';

type ProductWithExtras = Product & {
  marca?: string;
  precioOriginal?: number;
  rating?: number;
  reviewCount?: number;
};

interface MasonryProductGridProps {
  products: ProductWithExtras[];
  layoutConfig?: LayoutPatternsConfig;
}

interface TileStyle {
  colSpanClass: string;
  rowSpanClass: string;
  cardHeightClass: string;
}

const DEFAULT_TILE_STYLE: TileStyle = {
  colSpanClass: 'col-span-1',
  rowSpanClass: 'row-span-1',
  cardHeightClass: 'h-full',
};

const SPAN_STYLE_MAP: Record<LayoutPatternSpan, TileStyle> = {
  '1x1': {
    colSpanClass: 'col-span-1',
    rowSpanClass: 'row-span-1',
    cardHeightClass: 'h-full',
  },
  '2x1': {
    colSpanClass: 'col-span-2 sm:col-span-2 lg:col-span-2 xl:col-span-2',
    rowSpanClass: 'row-span-1',
    cardHeightClass: 'h-full',
  },
  '1x2': {
    colSpanClass: 'col-span-1 sm:col-span-1 lg:col-span-1 xl:col-span-1',
    rowSpanClass: 'row-span-2',
    cardHeightClass: 'h-full',
  },
  '2x2': {
    colSpanClass: 'col-span-2 sm:col-span-2 lg:col-span-2 xl:col-span-2',
    rowSpanClass: 'row-span-2',
    cardHeightClass: 'h-full',
  },
};

const VARIANT_PRIORITY: LayoutPatternVariant[] = ['large', 'horizontal', 'vertical', 'small'];

const buildLayoutSequence = (config?: LayoutPatternsConfig) => {
  const effectiveConfig = config ?? { rules: [] };
  const rulesMap = new Map<LayoutPatternVariant, LayoutPatternSpan>();
  const intervalMap = new Map<LayoutPatternVariant, number>();
  (effectiveConfig.rules ?? []).forEach((rule) => {
    rulesMap.set(rule.variant, rule.span);
    intervalMap.set(rule.variant, rule.enabled && rule.interval > 0 ? rule.interval : Number.POSITIVE_INFINITY);
  });

  const enabledIntervals = Array.from(intervalMap.values()).filter((value) => Number.isFinite(value));
  const cycleLength = enabledIntervals.length > 0 ? Math.max(12, Math.max(...enabledIntervals) * 2) : 12;

  return Array.from({ length: cycleLength }, (_, index) => {
    const position = index + 1;

    for (const variant of VARIANT_PRIORITY) {
      const interval = intervalMap.get(variant);
      if (!interval || !Number.isFinite(interval) || interval <= 0) continue;
      if (position % interval === 0) {
        const span = rulesMap.get(variant) ?? '1x1';
        return SPAN_STYLE_MAP[span] ?? DEFAULT_TILE_STYLE;
      }
    }

    return DEFAULT_TILE_STYLE;
  });
};

export default function MasonryProductGrid({ products, layoutConfig }: MasonryProductGridProps) {
  const layoutSequence = useMemo(() => buildLayoutSequence(layoutConfig), [layoutConfig]);

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-2 sm:gap-3 lg:gap-4 auto-rows-[12rem] sm:auto-rows-[13rem] lg:auto-rows-[14rem] xl:auto-rows-[15rem] grid-flow-row-dense p-2 sm:p-3 lg:p-4">
      {products.map((product, index) => {
        const style = layoutSequence[index % layoutSequence.length];

        return (
          <div key={product.id} className={`${style.colSpanClass} ${style.rowSpanClass} flex`}>
            <div className="w-full">
              <ProductCard product={product} customHeight={style.cardHeightClass} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
