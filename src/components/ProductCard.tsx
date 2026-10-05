import React, { useState } from 'react';
import { Product } from '../data/products';
import { PixelHeart, PixelImage, PixelStar } from './PixelSprites';
import { sound } from '../utils/sound';

interface ProductCardProps {
  product: Product;
  isWishlisted: boolean;
  onToggleWishlist: (productId: string) => void;
  onSelectProduct: (product: Product) => void;
  onAddToCart: (product: Product, quantity?: number) => void;
  onQuickView: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  isWishlisted,
  onToggleWishlist,
  onSelectProduct,
  onAddToCart,
  onQuickView,
}) => {
  const [addingState, setAddingState] = useState<'idle' | 'loading' | 'added'>('idle');
  const [isHovered, setIsHovered] = useState(false);

  const handleAddClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (addingState !== 'idle') return;
    sound.playBlip(560, 0.04);
    setAddingState('loading');

    setTimeout(() => {
      sound.playAcquire();
      onAddToCart(product, 1);
      setAddingState('added');
      setTimeout(() => {
        setAddingState('idle');
      }, 1300);
    }, 280);
  };

  return (
    <article
      onClick={() => {
        sound.playBlip(640, 0.04);
        onSelectProduct(product);
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="pixel-card bg-[#F6F3EB] hover:bg-[#EFECE2] flex flex-col justify-between cursor-pointer group relative"
    >
      {/* Top Image Area (65-75% height) */}
      <div className="relative aspect-square w-full bg-[#EFECE2] border-b-[3px] border-[#1C1917] overflow-hidden p-4 flex items-center justify-center">
        {/* Hover Speech Bubble */}
        <div
          className={`pointer-events-none absolute top-3 left-3 right-12 z-20 transition-all duration-150 ${
            isHovered
              ? 'opacity-100 translate-y-0'
              : 'opacity-0 translate-y-2'
          }`}
        >
          <div className="pixel-box-sm bg-[#F6F3EB] px-2.5 py-1.5 inline-block">
            <p className="font-pixel-display text-[11px] leading-tight text-[#1C1917]">
              &ldquo;{product.speechBubble}&rdquo;
            </p>
          </div>
        </div>

        {/* Wishlist Heart Toggle */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            sound.playBlip(isWishlisted ? 420 : 780, 0.05);
            onToggleWishlist(product.id);
          }}
          aria-label={isWishlisted ? `Remove ${product.name} from wishlist` : `Save ${product.name} to wishlist`}
          className="absolute top-3 right-3 z-20 pixel-btn-sm bg-[#F6F3EB] p-2 hover:bg-[#E6B84D]"
        >
          <PixelHeart className="w-4 h-4" filled={isWishlisted} />
        </button>

        {/* Subtle Pixel Sparkle on Hover */}
        {isHovered && (
          <div className="pointer-events-none absolute bottom-12 right-4 z-20 animate-pixel-bounce" aria-hidden="true">
            <PixelStar className="w-4 h-4" color="#D95D39" />
          </div>
        )}

        {/* Product Image + Pixel Shadow beneath on hover */}
        <div className="w-full h-full flex flex-col items-center justify-center relative">
          <PixelImage
            src={product.image}
            alt={`${product.name} pen holder — ${product.personality}`}
            className="w-full h-full object-cover border-2 border-[#1C1917] transition-transform duration-150 group-hover:-translate-y-1.5"
          />
        </div>

        {/* Quick View Trigger Bar on Hover */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            sound.playBlip(600, 0.04);
            onQuickView(product);
          }}
          className={`absolute bottom-3 left-3 z-20 pixel-btn-sm bg-[#1C1917] text-[#F6F3EB] hover:bg-[#D95D39] px-2.5 py-1 font-pixel-mono text-xs tracking-wider uppercase transition-opacity duration-150 whitespace-nowrap ${
            isHovered ? 'opacity-100' : 'opacity-90 sm:opacity-0 group-hover:opacity-100'
          }`}
        >
          [QUICK VIEW]
        </button>
      </div>

      {/* Card Content Area */}
      <div className="p-4 flex-1 flex flex-col justify-between space-y-4">
        <div className="space-y-1.5">
          {/* Clean Unboxed Metadata Line (Zero-Pill Discipline) */}
          <div className="flex items-center justify-between text-xs font-pixel-mono text-[#57534E]">
            <div className="flex items-center gap-1.5">
              <span
                className="w-2 h-2 inline-block shrink-0"
                style={{
                  backgroundColor:
                    product.availability === 'In Stock'
                      ? '#4A6B53'
                      : product.availability === 'Low Stock'
                      ? '#E6B84D'
                      : '#D95D39',
                }}
              />
              <span className="uppercase">{product.availability}</span>
              <span aria-hidden="true">·</span>
              <span className="uppercase">{product.category}</span>
            </div>
            <span className="uppercase text-[#1C1917]">{product.sizeClass}</span>
          </div>

          {/* Wacky Product Name & Large Pixel Price */}
          <div className="flex items-baseline justify-between gap-2 pt-0.5">
            <h3 className="font-pixel-display text-base sm:text-lg font-bold text-[#1C1917] group-hover:text-[#D95D39] transition-colors truncate">
              {product.name}
            </h3>
            <div className="flex items-baseline gap-1.5 shrink-0">
              {product.oldPrice && (
                <span className="font-pixel-mono text-sm text-[#57534E] line-through tabular-nums">
                  ₹{product.oldPrice}
                </span>
              )}
              <span className="font-pixel-mono text-2xl font-bold text-[#1C1917] tabular-nums">
                ₹{product.price}
              </span>
            </div>
          </div>

          {/* One-line Personality Description */}
          <p className="font-pixel-body text-sm text-[#57534E] line-clamp-2 min-h-[2.5rem]">
            &ldquo;{product.personality}&rdquo;
          </p>
        </div>

        {/* ADD TO CART Button with Pixel Loading & Success State */}
        <button
          type="button"
          onClick={handleAddClick}
          disabled={addingState !== 'idle'}
          className={`w-full pixel-btn-sm py-2.5 px-4 font-pixel-display text-xs sm:text-sm uppercase tracking-wider flex items-center justify-center gap-2 whitespace-nowrap ${
            addingState === 'added'
              ? 'bg-[#4A6B53] text-[#F6F3EB]'
              : addingState === 'loading'
              ? 'bg-[#E6B84D] text-[#1C1917]'
              : 'bg-[#1C1917] hover:bg-[#D95D39] text-[#F6F3EB]'
          }`}
        >
          {addingState === 'loading' && (
            <span className="font-pixel-mono text-sm">LOADING [■■□]...</span>
          )}
          {addingState === 'added' && (
            <span>+1 CREATURE ACQUIRED</span>
          )}
          {addingState === 'idle' && (
            <>
              <span>ADD TO CART</span>
              <span className="font-pixel-mono text-base leading-none">+</span>
            </>
          )}
        </button>
      </div>
    </article>
  );
};
