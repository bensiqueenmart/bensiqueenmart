import React, { useEffect, useMemo, useState } from 'react';
import { Plus, Minus, ShoppingBag, Check, Eye, ChevronRight } from 'lucide-react';
import type { PublicProduct } from '@bqm/types';
import { imageSrc, packOptions, prettyCategory, type PackOption } from '../api';
import { formatPrice, packPrice } from '../utils/pricing';
import { useCart } from '../context/CartContext';
import { ProductDetailModal } from './ProductDetailModal';

interface ProductCardProps {
  product: PublicProduct;
  layout?: 'grid' | 'list';
}

const FALLBACK_IMAGE = '/images/Products_Cover.jpg';

/* ── Pack size chips ─────────────────────────────────────────────── */
const PackChips: React.FC<{
  options: PackOption[];
  value: string;
  onChange: (value: string) => void;
}> = ({ options, value, onChange }) => {
  if (options.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1.5" role="group" aria-label="Pack size">
      {options.map((opt) => {
        const selected = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            disabled={!opt.available}
            aria-pressed={selected}
            onClick={() => onChange(opt.value)}
            className={`min-h-[40px] min-w-[44px] px-2.5 rounded-lg border text-xs font-bold tabular-nums transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#A8C66C]/70 ${
              !opt.available
                ? 'bg-[#F4F2EC] text-gray-400 border-[#E7E3D8] line-through cursor-not-allowed'
                : selected
                  ? 'bg-[#123B26] text-white border-[#123B26]'
                  : 'bg-white text-[#123B26] border-[#DCE8C8] hover:border-[#205C38]'
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
};

/* ── Quantity stepper ─────────────────────────────────────────────── */
const QtyStepper: React.FC<{
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
}> = ({ value, onChange, disabled }) => (
  <div className="flex items-center flex-shrink-0 overflow-hidden rounded-xl border border-[#DCE8C8] bg-[#F7F5E8]">
    <button
      type="button"
      onClick={() => onChange(value - 1)}
      disabled={disabled || value <= 1}
      aria-label="Decrease quantity"
      className="h-10 w-10 flex items-center justify-center text-gray-500 hover:text-[#123B26] hover:bg-[#DCE8C8]/60 disabled:opacity-30 transition-colors"
    >
      <Minus className="h-3.5 w-3.5" />
    </button>
    <span className="w-7 text-center font-bold text-xs text-[#123B26] tabular-nums">{value}</span>
    <button
      type="button"
      onClick={() => onChange(value + 1)}
      disabled={disabled}
      aria-label="Increase quantity"
      className="h-10 w-10 flex items-center justify-center text-gray-500 hover:text-[#123B26] hover:bg-[#DCE8C8]/60 disabled:opacity-30 transition-colors"
    >
      <Plus className="h-3.5 w-3.5" />
    </button>
  </div>
);

/* ── Price block — the card's focal point ─────────────────────────── */
const PriceBlock: React.FC<{
  amount: number | null;
  caption: string;
  muted?: boolean;
}> = ({ amount, caption, muted }) => (
  <div>
    {amount !== null ? (
      <p
        className={`font-poppins text-[26px] font-extrabold leading-none tracking-tight tabular-nums ${
          muted ? 'text-[#9BA79B]' : 'text-[#123B26]'
        }`}
      >
        {formatPrice(amount)}
      </p>
    ) : (
      <p className="font-poppins text-sm font-bold text-gray-500">Price on request</p>
    )}
    <p className="mt-1.5 text-[11px] font-medium text-gray-500">{caption}</p>
  </div>
);

export const ProductCard: React.FC<ProductCardProps> = ({ product, layout = 'grid' }) => {
  const { addToCart } = useCart();
  const options = useMemo(() => packOptions(product), [product]);
  const [selectedWeight, setSelectedWeight] = useState<string>(
    () => options.find((o) => o.available)?.value ?? options[0]?.value ?? '',
  );
  const [quantity, setQuantity] = useState<number>(1);
  const [isAdded, setIsAdded] = useState<boolean>(false);
  const [showDetailModal, setShowDetailModal] = useState<boolean>(false);

  const imgSrc = imageSrc(product.image);
  const unavailable = !product.available;
  const selectedAvailable = options.some((o) => o.value === selectedWeight && o.available);
  const soldOut = unavailable || !selectedAvailable;
  const unit = packPrice(product, selectedWeight);
  const packLabel = options.find((o) => o.value === selectedWeight)?.label ?? selectedWeight;
  const amount = unit !== null ? unit * quantity : null;
  const caption = quantity > 1 ? `${quantity} × ${packLabel}` : packLabel;

  // If the chosen pack goes stale (stock changed), fall back to an available pack.
  useEffect(() => {
    if (options.length === 0) return;
    const current = options.find((o) => o.value === selectedWeight);
    if (current?.available) return;
    const next = options.find((o) => o.available);
    if (next && next.value !== selectedWeight) setSelectedWeight(next.value);
  }, [options, selectedWeight]);

  const handleIncrement = () => setQuantity((q) => q + 1);
  const handleDecrement = () => setQuantity((q) => (q > 1 ? q - 1 : 1));

  const handleAddToCart = () => {
    if (soldOut) return;
    addToCart(product, selectedWeight, quantity);
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 1800);
  };

  const categoryLabel = prettyCategory(product.category);
  const altText = `${product.name}${product.tamilName ? ` – ${product.tamilName}` : ''}`;

  const photoImage = (
    <img
      src={imgSrc || FALLBACK_IMAGE}
      alt={altText}
      loading="lazy"
      onError={(e) => {
        e.currentTarget.onerror = null;
        e.currentTarget.src = FALLBACK_IMAGE;
      }}
      className={`h-full w-full object-cover object-center ${
        unavailable ? 'grayscale opacity-60' : ''
      }`}
    />
  );

  const ctaClasses = `h-11 min-w-[88px] inline-flex items-center justify-center gap-1.5 rounded-xl px-4 font-bold text-[13px] uppercase tracking-wider whitespace-nowrap transition-all duration-200 active:scale-[0.98] ${
    soldOut
      ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
      : isAdded
        ? 'bg-[#205C38] text-white'
        : 'bg-[#123B26] hover:bg-[#205C38] text-white'
  }`;

  const ctaContent = soldOut ? (
    <span>Sold out</span>
  ) : isAdded ? (
    <>
      <Check className="h-4 w-4 text-[#A8C66C]" />
      <span>Added</span>
    </>
  ) : (
    <>
      <ShoppingBag className="h-4 w-4 text-[#A8C66C]" />
      <span>Add</span>
    </>
  );

  /* ── List layout ─────────────────────────────────────────────────── */
  if (layout === 'list') {
    return (
      <>
        <article className="flex flex-wrap items-start gap-x-5 gap-y-3 rounded-2xl border border-[#E8DFC8] bg-white p-4 transition-all duration-200 hover:border-[#A8C66C] hover:shadow-md lg:items-center">
          <button
            type="button"
            onClick={() => setShowDetailModal(true)}
            title={`View details for ${product.name}`}
            aria-label={`View details for ${product.name}`}
            className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-[#F7F5E8] lg:h-32 lg:w-32"
          >
            {photoImage}
            <span className="pointer-events-none absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-white/90 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-[#123B26]">
              <Eye className="h-3 w-3 text-[#205C38]" />
              Quick view
            </span>
            {unavailable && (
              <span className="absolute inset-x-0 bottom-0 bg-[#123B26]/92 px-2 py-1 text-center text-[10px] font-bold uppercase tracking-wider text-white">
                Out of stock
              </span>
            )}
          </button>

          <div className="min-w-0 flex-1 basis-[220px]">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#5E7A63]">
              {categoryLabel}
            </p>
            <h3 className="mt-1 font-poppins text-[15px] font-extrabold leading-snug text-[#123B26]">
              <button
                type="button"
                onClick={() => setShowDetailModal(true)}
                className="inline-flex items-center gap-1 text-left transition-colors hover:text-[#205C38]"
              >
                {product.name}
                <ChevronRight className="h-4 w-4 shrink-0 text-[#205C38]" />
              </button>
            </h3>
            {product.tamilName ? (
              <p className="mt-0.5 font-mukta text-xs font-semibold text-[#205C38]">{product.tamilName}</p>
            ) : (
              <div className="mt-0.5 h-4" aria-hidden="true" />
            )}
          </div>

          <div className="basis-full lg:basis-auto lg:w-24 lg:shrink-0 lg:text-right">
            <PriceBlock amount={amount} caption={caption} muted={unavailable} />
          </div>

          <div className="basis-full lg:basis-auto lg:shrink-0">
            <PackChips options={options} value={selectedWeight} onChange={setSelectedWeight} />
          </div>

          <div className="basis-full flex items-center justify-between gap-2 lg:basis-auto lg:shrink-0 lg:justify-end">
            <QtyStepper value={quantity} onChange={setQuantity} disabled={soldOut} />
            <button
              type="button"
              onClick={handleAddToCart}
              disabled={soldOut}
              className={ctaClasses}
            >
              {ctaContent}
            </button>
          </div>
        </article>

        {showDetailModal && (
          <ProductDetailModal product={product} onClose={() => setShowDetailModal(false)} />
        )}
      </>
    );
  }

  /* ── Grid layout ─────────────────────────────────────────────────── */
  return (
    <>
      <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-[#E8DFC8] bg-white transition-all duration-200 hover:border-[#A8C66C] hover:shadow-lg">
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-[#F7F5E8]">
          <button
            type="button"
            onClick={() => setShowDetailModal(true)}
            title={`View details for ${product.name}`}
            aria-label={`View details for ${product.name}`}
            className="block h-full w-full cursor-pointer"
          >
            {photoImage}
          </button>

          {/* Quick view — always visible, never hover-only */}
          <span className="pointer-events-none absolute left-2.5 top-2.5 inline-flex items-center gap-1 rounded-full bg-white/90 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-[#123B26]">
            <Eye className="h-3 w-3 text-[#205C38]" />
            Quick view
          </span>

          {unavailable && (
            <span className="absolute inset-x-0 bottom-0 bg-[#123B26]/92 px-3 py-1.5 text-center text-[10px] font-bold uppercase tracking-wider text-white">
              Out of stock — back soon
            </span>
          )}
        </div>

        <div className="flex flex-1 flex-col gap-3 p-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#5E7A63]">
              {categoryLabel}
            </p>
            <h3 className="mt-1 min-h-[41px] font-poppins text-[15px] font-extrabold leading-snug text-[#123B26]">
              <button
                type="button"
                onClick={() => setShowDetailModal(true)}
                className="line-clamp-2 text-left transition-colors hover:text-[#205C38]"
              >
                {product.name}
              </button>
            </h3>
            {product.tamilName ? (
              <p className="mt-0.5 font-mukta text-xs font-semibold text-[#205C38]">{product.tamilName}</p>
            ) : (
              <div className="mt-0.5 h-4" aria-hidden="true" />
            )}
          </div>

          <PriceBlock amount={amount} caption={caption} muted={unavailable} />

          <PackChips options={options} value={selectedWeight} onChange={setSelectedWeight} />

          <div className="mt-auto flex items-center justify-between gap-2 pt-1">
            <QtyStepper value={quantity} onChange={setQuantity} disabled={soldOut} />
            <button
              type="button"
              onClick={handleAddToCart}
              disabled={soldOut}
              className={ctaClasses}
            >
              {ctaContent}
            </button>
          </div>
        </div>
      </article>

      {showDetailModal && (
        <ProductDetailModal product={product} onClose={() => setShowDetailModal(false)} />
      )}
    </>
  );
};
