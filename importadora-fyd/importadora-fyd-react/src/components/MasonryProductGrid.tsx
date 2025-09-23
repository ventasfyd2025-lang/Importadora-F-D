import HitesProductCard from './modern/HitesProductCard';
import { Product } from '@/types';

type ProductWithExtras = Product & {
  marca?: string;
  precioOriginal?: number;
  rating?: number;
  reviewCount?: number;
};

interface MasonryProductGridProps {
  products: ProductWithExtras[];
}

const layoutPattern: Array<{
  colSpanClass: string;
  rowSpanClass: string;
  sizeVariant: 'square' | 'wide';
}> = [
  { colSpanClass: 'col-span-1', rowSpanClass: 'row-span-1', sizeVariant: 'square' },
  { colSpanClass: 'col-span-1', rowSpanClass: 'row-span-1', sizeVariant: 'square' },
  { colSpanClass: 'col-span-2 sm:col-span-2 lg:col-span-2 xl:col-span-3', rowSpanClass: 'row-span-1', sizeVariant: 'wide' },
  { colSpanClass: 'col-span-1', rowSpanClass: 'row-span-1', sizeVariant: 'square' },
  { colSpanClass: 'col-span-1', rowSpanClass: 'row-span-1', sizeVariant: 'square' },
  { colSpanClass: 'col-span-1', rowSpanClass: 'row-span-1', sizeVariant: 'square' },
  { colSpanClass: 'col-span-2 sm:col-span-2 lg:col-span-2 xl:col-span-3', rowSpanClass: 'row-span-1', sizeVariant: 'wide' },
  { colSpanClass: 'col-span-1', rowSpanClass: 'row-span-1', sizeVariant: 'square' },
];

export default function MasonryProductGrid({ products }: MasonryProductGridProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-2 sm:gap-3 lg:gap-4 auto-rows-[15rem] sm:auto-rows-[17rem] lg:auto-rows-[19rem] xl:auto-rows-[21rem] grid-flow-row-dense p-2 sm:p-3 lg:p-4">
      {products.map((product, index) => {
        const { colSpanClass, rowSpanClass, sizeVariant } = layoutPattern[index % layoutPattern.length];

        return (
          <div key={product.id} className={`${colSpanClass} ${rowSpanClass} flex`}>
            <HitesProductCard
              product={product}
              className="h-full w-full"
              sizeVariant={sizeVariant}
            />
          </div>
        );
      })}
    </div>
  );
}
