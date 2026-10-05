import React, { useState, useMemo } from 'react';
import { Product } from '../data/products';
import { ProductCard } from './ProductCard';
import { sound } from '../utils/sound';

interface ShopSectionProps {
  products: Product[];
  wishlist: string[];
  onToggleWishlist: (productId: string) => void;
  onSelectProduct: (product: Product) => void;
  onAddToCart: (product: Product, quantity?: number) => void;
  onQuickView: (product: Product) => void;
}

type SortOption = 'featured' | 'newest' | 'price-asc' | 'price-desc' | 'weirdest';

export const ShopSection: React.FC<ShopSectionProps> = ({
  products,
  wishlist,
  onToggleWishlist,
  onSelectProduct,
  onAddToCart,
  onQuickView,
}) => {
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [sizeFilter, setSizeFilter] = useState<string>('ALL');
  const [priceFilter, setPriceFilter] = useState<string>('ALL');
  const [availabilityFilter, setAvailabilityFilter] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<SortOption>('featured');
  const [showWishlistOnly, setShowWishlistOnly] = useState(false);

  const filteredAndSortedProducts = useMemo(() => {
    return products
      .filter((p) => {
        if (showWishlistOnly && !wishlist.includes(p.id)) return false;
        if (categoryFilter !== 'ALL' && p.category.toUpperCase() !== categoryFilter) {
          return false;
        }
        if (sizeFilter !== 'ALL' && p.sizeClass.toUpperCase() !== sizeFilter) {
          return false;
        }
        if (priceFilter === 'UNDER-350' && p.price >= 350) {
          return false;
        }
        if (priceFilter === '350-PLUS' && p.price < 350) {
          return false;
        }
        if (availabilityFilter === 'IN-STOCK' && p.availability !== 'In Stock') {
          return false;
        }
        if (availabilityFilter === 'LIMITED' && p.availability === 'In Stock') {
          return false;
        }
        return true;
      })
      .sort((a, b) => {
        switch (sortBy) {
          case 'newest':
            return (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0);
          case 'price-asc':
            return a.price - b.price;
          case 'price-desc':
            return b.price - a.price;
          case 'weirdest':
            return b.weirdnessScore - a.weirdnessScore;
          case 'featured':
          default:
            return (b.featured ? 1 : 0) - (a.featured ? 1 : 0);
        }
      });
  }, [
    products,
    wishlist,
    showWishlistOnly,
    categoryFilter,
    sizeFilter,
    priceFilter,
    availabilityFilter,
    sortBy,
  ]);

  const resetFilters = () => {
    sound.playBlip(500, 0.04);
    setCategoryFilter('ALL');
    setSizeFilter('ALL');
    setPriceFilter('ALL');
    setAvailabilityFilter('ALL');
    setSortBy('featured');
    setShowWishlistOnly(false);
  };

  return (
    <section
      id="shop-section"
      className="bg-pixel-grid border-b-[3px] border-[#1C1917] py-16 sm:py-24"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        {/* Section Heading */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b-[3px] border-[#1C1917] pb-6">
          <div className="space-y-2">
            <div className="font-pixel-mono text-sm uppercase tracking-wider text-[#D95D39]">
              COLLECTIBLE CATALOG · {filteredAndSortedProducts.length} SPECIMENS
            </div>
            <h2 className="font-pixel-display text-3xl sm:text-4xl font-bold text-[#1C1917]">
              MEET THE CREATURES
            </h2>
            <p className="font-pixel-body text-lg text-[#57534E]">
              Every one of them has a job. Mostly holding your pens.
            </p>
          </div>

          {/* Sort Dropdown & Wishlist Filter */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => {
                sound.playBlip(620, 0.04);
                setShowWishlistOnly(!showWishlistOnly);
              }}
              className={`pixel-btn-sm px-3 py-2 font-pixel-display text-xs whitespace-nowrap ${
                showWishlistOnly
                  ? 'bg-[#D95D39] text-[#F6F3EB]'
                  : 'bg-[#EFECE2] text-[#1C1917] hover:bg-[#E6B84D]'
              }`}
            >
              ♥ SAVED ({wishlist.length})
            </button>

            <div className="flex items-center gap-2">
              <label
                htmlFor="penny-sort"
                className="font-pixel-mono text-sm text-[#57534E] whitespace-nowrap"
              >
                SORT BY:
              </label>
              <select
                id="penny-sort"
                value={sortBy}
                onChange={(e) => {
                  sound.playBlip(580, 0.04);
                  setSortBy(e.target.value as SortOption);
                }}
                className="pixel-box-sm bg-[#F6F3EB] px-3 py-1.5 font-pixel-display text-xs text-[#1C1917] cursor-pointer focus:outline-none"
              >
                <option value="featured">Featured</option>
                <option value="weirdest">Weirdest First</option>
                <option value="newest">Newest</option>
                <option value="price-asc">Price: Low → High</option>
                <option value="price-desc">Price: High → Low</option>
              </select>
            </div>
          </div>
        </div>

        {/* Pixel Control Bar: Creature Type, Size, Price, Availability */}
        <div className="pixel-box bg-[#EFECE2] p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Creature Type Filter */}
          <div className="space-y-1.5">
            <span className="font-pixel-mono text-xs uppercase text-[#57534E] block">
              CREATURE TYPE
            </span>
            <div className="flex flex-wrap gap-1.5">
              {['ALL', 'CHAOTIC', 'HUNGRY', 'UNBOTHERED', 'GRUMPY'].map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => {
                    sound.playBlip(540, 0.03);
                    setCategoryFilter(cat);
                  }}
                  className={`px-2.5 py-1 font-pixel-mono text-xs border-2 border-[#1C1917] cursor-pointer whitespace-nowrap transition-colors ${
                    categoryFilter === cat
                      ? 'bg-[#1C1917] text-[#F6F3EB]'
                      : 'bg-[#F6F3EB] text-[#1C1917] hover:bg-[#E6B84D]'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Size Filter */}
          <div className="space-y-1.5">
            <span className="font-pixel-mono text-xs uppercase text-[#57534E] block">
              SIZE CLASS
            </span>
            <div className="flex flex-wrap gap-1.5">
              {['ALL', 'COMPACT', 'STANDARD', 'CHUNKY'].map((sz) => (
                <button
                  key={sz}
                  type="button"
                  onClick={() => {
                    sound.playBlip(560, 0.03);
                    setSizeFilter(sz);
                  }}
                  className={`px-2.5 py-1 font-pixel-mono text-xs border-2 border-[#1C1917] cursor-pointer whitespace-nowrap transition-colors ${
                    sizeFilter === sz
                      ? 'bg-[#1C1917] text-[#F6F3EB]'
                      : 'bg-[#F6F3EB] text-[#1C1917] hover:bg-[#E6B84D]'
                  }`}
                >
                  {sz}
                </button>
              ))}
            </div>
          </div>

          {/* Price Filter */}
          <div className="space-y-1.5">
            <span className="font-pixel-mono text-xs uppercase text-[#57534E] block">
              PRICE RANGE
            </span>
            <div className="flex flex-wrap gap-1.5">
              {[
                { id: 'ALL', label: 'ALL PRICES' },
                { id: 'UNDER-350', label: '₹299 – ₹349' },
                { id: '350-PLUS', label: '₹350+' },
              ].map((pr) => (
                <button
                  key={pr.id}
                  type="button"
                  onClick={() => {
                    sound.playBlip(580, 0.03);
                    setPriceFilter(pr.id);
                  }}
                  className={`px-2.5 py-1 font-pixel-mono text-xs border-2 border-[#1C1917] cursor-pointer whitespace-nowrap transition-colors ${
                    priceFilter === pr.id
                      ? 'bg-[#1C1917] text-[#F6F3EB]'
                      : 'bg-[#F6F3EB] text-[#1C1917] hover:bg-[#E6B84D]'
                  }`}
                >
                  {pr.label}
                </button>
              ))}
            </div>
          </div>

          {/* Availability Filter */}
          <div className="space-y-1.5">
            <span className="font-pixel-mono text-xs uppercase text-[#57534E] block">
              AVAILABILITY
            </span>
            <div className="flex flex-wrap gap-1.5">
              {[
                { id: 'ALL', label: 'ALL' },
                { id: 'IN-STOCK', label: 'IN STOCK' },
                { id: 'LIMITED', label: 'LIMITED / LOW' },
              ].map((av) => (
                <button
                  key={av.id}
                  type="button"
                  onClick={() => {
                    sound.playBlip(600, 0.03);
                    setAvailabilityFilter(av.id);
                  }}
                  className={`px-2.5 py-1 font-pixel-mono text-xs border-2 border-[#1C1917] cursor-pointer whitespace-nowrap transition-colors ${
                    availabilityFilter === av.id
                      ? 'bg-[#1C1917] text-[#F6F3EB]'
                      : 'bg-[#F6F3EB] text-[#1C1917] hover:bg-[#E6B84D]'
                  }`}
                >
                  {av.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Product Grid: 4 per row on Desktop, 2-3 on Tablet, 1-2 on Mobile */}
        {filteredAndSortedProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 sm:gap-7">
            {filteredAndSortedProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                isWishlisted={wishlist.includes(product.id)}
                onToggleWishlist={onToggleWishlist}
                onSelectProduct={onSelectProduct}
                onAddToCart={onAddToCart}
                onQuickView={onQuickView}
              />
            ))}
          </div>
        ) : (
          <div className="pixel-box bg-[#EFECE2] p-12 text-center space-y-4">
            <p className="font-pixel-display text-xl text-[#1C1917]">
              NO CREATURES MATCH THOSE EXACT FILTERS.
            </p>
            <p className="font-pixel-body text-base text-[#57534E]">
              Even our weirdos have limits. Try resetting your filter switches.
            </p>
            <button
              type="button"
              onClick={resetFilters}
              className="pixel-btn bg-[#D95D39] text-[#F6F3EB] font-pixel-display text-xs px-5 py-3"
            >
              RESET ALL FILTERS
            </button>
          </div>
        )}
      </div>
    </section>
  );
};
