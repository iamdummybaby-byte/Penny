import React, { useState, useEffect } from 'react';
import { Product, ProductDimensions } from '../data/products';
import { PixelHeart, PixelImage, PixelCreatureSprite } from './PixelSprites';
import { sound } from '../utils/sound';
import { FORMSPREE_ENDPOINT, submitToFormspree } from '../utils/formspree';

interface ProductDetailProps {
  product: Product;
  allProducts: Product[];
  isWishlisted: boolean;
  onToggleWishlist: (productId: string) => void;
  onAddToCart: (product: Product, quantity: number) => void;
  onBuyNow: (product: Product, quantity: number) => void;
  onOpenCart: () => void;
  onBackToShop: () => void;
  onSelectProduct: (product: Product) => void;
  onUpdateDimensions: (productId: string, dims: ProductDimensions, material: string) => void;
  onUpdateProductImage?: (productId: string, newImageUrl: string) => void;
}

export const ProductDetail: React.FC<ProductDetailProps> = ({
  product,
  allProducts,
  isWishlisted,
  onToggleWishlist,
  onAddToCart,
  onBuyNow,
  onOpenCart,
  onBackToShop,
  onSelectProduct,
  onUpdateDimensions,
  onUpdateProductImage,
}) => {
  const [activeViewIdx, setActiveViewIdx] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [isZoomed, setIsZoomed] = useState(false);
  const [zoomOrigin, setZoomOrigin] = useState({ x: 50, y: 50 });
  const [cartFlowState, setCartFlowState] = useState<'idle' | 'loading' | 'acquired'>('idle');

  // Editable Measurements state (so specs are never fabricated, yet editable live)
  const [editingSpecs, setEditingSpecs] = useState(false);
  const [heightInput, setHeightInput] = useState(product.dimensions.height);
  const [widthInput, setWidthInput] = useState(product.dimensions.width);
  const [depthInput, setDepthInput] = useState(product.dimensions.depth);
  const [materialInput, setMaterialInput] = useState(product.material);

  useEffect(() => {
    setActiveViewIdx(0);
    setQuantity(1);
    setIsZoomed(false);
    setCartFlowState('idle');
    setEditingSpecs(false);
    setHeightInput(product.dimensions.height);
    setWidthInput(product.dimensions.width);
    setDepthInput(product.dimensions.depth);
    setMaterialInput(product.material);
  }, [product]);

  const activeGalleryItem = product.gallery[activeViewIdx] || product.gallery[0];

  const handleImageMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isZoomed) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setZoomOrigin({ x, y });
  };

  const handleAdd = () => {
    if (cartFlowState === 'loading') return;
    sound.playBlip(580, 0.04);
    setCartFlowState('loading');
    setTimeout(() => {
      sound.playAcquire();
      onAddToCart(product, quantity);
      setCartFlowState('acquired');
    }, 320);
  };

  const handleSaveSpecs = async (e: React.FormEvent) => {
    e.preventDefault();
    sound.playBlip(700, 0.04);
    const updatedDimensions = {
      height: heightInput.trim() || '[ADD PRODUCT MEASUREMENTS]',
      width: widthInput.trim() || '[ADD PRODUCT MEASUREMENTS]',
      depth: depthInput.trim() || '[ADD PRODUCT MEASUREMENTS]',
    };
    const updatedMaterial = materialInput.trim() || '[ADD PRODUCT MATERIAL]';

    onUpdateDimensions(product.id, updatedDimensions, updatedMaterial);
    setEditingSpecs(false);

    await submitToFormspree({
      _subject: `PENNY Product Specification Update: ${product.name}`,
      form_type: 'PRODUCT_SPEC_UPDATE',
      product_id: product.id,
      product_name: product.name,
      height: updatedDimensions.height,
      width: updatedDimensions.width,
      depth: updatedDimensions.depth,
      material: updatedMaterial,
    });
  };

  const relatedCreatures = allProducts
    .filter((p) => p.id !== product.id)
    .slice(0, 3);

  return (
    <div className="bg-pixel-grid min-h-screen py-8 sm:py-12 border-b-[3px] border-[#1C1917]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Top Breadcrumb & Clean URL Path Bar */}
        <div className="pixel-box-sm bg-[#EFECE2] px-4 py-2.5 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2 font-pixel-mono text-sm text-[#57534E]">
            <button
              type="button"
              onClick={() => {
                sound.playBlip(520, 0.04);
                onBackToShop();
              }}
              className="text-[#1C1917] hover:text-[#D95D39] font-bold cursor-pointer flex items-center gap-1.5"
            >
              <span>← BACK TO SHOP</span>
            </button>
            <span aria-hidden="true">/</span>
            <span>shop</span>
            <span aria-hidden="true">/</span>
            <span className="text-[#D95D39] font-bold">{product.slug}</span>
          </div>

          <div className="font-pixel-mono text-xs text-[#57534E]">
            CREATURE PROFILE #{product.id.toUpperCase()}
          </div>
        </div>

        {/* Main Contiguous Split Layout: Left Gallery, Right Purchase Module */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          {/* Left Column: Sticky Product Image Gallery */}
          <div className="lg:col-span-7 space-y-4 lg:sticky lg:top-24">
            <div className="pixel-box-lg bg-[#EFECE2] overflow-hidden">
              {/* Retro Viewer Header Bar */}
              <div className="bg-[#1C1917] text-[#F6F3EB] px-4 py-2.5 flex items-center justify-between">
                <div className="flex items-center gap-2 font-pixel-mono text-sm">
                  <span className="w-2.5 h-2.5 bg-[#4A6B53] inline-block" />
                  <span>
                    VIEW: {activeGalleryItem.label} ({activeViewIdx + 1}/
                    {product.gallery.length})
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {onUpdateProductImage && (
                    <label className="pixel-btn-sm bg-[#4A6B53] text-[#F6F3EB] hover:bg-[#E6B84D] hover:text-[#1C1917] px-2.5 py-0.5 font-pixel-mono text-xs uppercase cursor-pointer">
                      [UPLOAD PHOTO]
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          const reader = new FileReader();
                          reader.onload = () => {
                            if (typeof reader.result === 'string') {
                              sound.playAcquire();
                              onUpdateProductImage(product.id, reader.result);
                            }
                          };
                          reader.readAsDataURL(file);
                        }}
                      />
                    </label>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      sound.playBlip(640, 0.04);
                      setIsZoomed(!isZoomed);
                    }}
                    className="pixel-btn-sm bg-[#EFECE2] text-[#1C1917] hover:bg-[#E6B84D] px-2.5 py-0.5 font-pixel-mono text-xs uppercase"
                  >
                    {isZoomed ? '[− EXIT ZOOM]' : '[+ ZOOM LENS]'}
                  </button>
                </div>
              </div>

              {/* Main Large Photograph Stage */}
              <div
                onClick={() => {
                  sound.playBlip(600, 0.03);
                  setIsZoomed(!isZoomed);
                }}
                onMouseMove={handleImageMouseMove}
                onMouseLeave={() => setIsZoomed(false)}
                className={`relative aspect-square bg-[#F6F3EB] p-6 sm:p-10 flex items-center justify-center overflow-hidden ${
                  isZoomed ? 'cursor-zoom-out' : 'cursor-zoom-in'
                }`}
              >
                <div
                  className="w-full h-full transition-transform duration-150 flex items-center justify-center"
                  style={
                    isZoomed
                      ? {
                          transform: 'scale(1.85)',
                          transformOrigin: `${zoomOrigin.x}% ${zoomOrigin.y}%`,
                        }
                      : undefined
                  }
                >
                  <PixelImage
                    src={activeGalleryItem.image}
                    alt={`${product.name} — ${activeGalleryItem.label} view`}
                    className={`w-full h-full object-cover border-2 border-[#1C1917] transition-transform duration-200 ${
                      activeGalleryItem.cropStyle || ''
                    }`}
                  />
                </div>

                {/* Scale / Measurement CAD Grid Overlay when SCALE tab is active */}
                {activeGalleryItem.id === 'scale' && (
                  <div
                    className="pointer-events-none absolute inset-6 border-2 border-dashed border-[#D95D39] flex flex-col justify-between p-3 bg-[#1C1917]/5"
                    aria-hidden="true"
                  >
                    <div className="flex justify-between items-start">
                      <span className="pixel-box-sm bg-[#F6F3EB] px-2 py-0.5 font-pixel-mono text-xs text-[#1C1917]">
                        ↕ HEIGHT: {product.dimensions.height}
                      </span>
                      <span className="pixel-box-sm bg-[#E6B84D] px-2 py-0.5 font-pixel-mono text-xs text-[#1C1917]">
                        SCALE VIEW
                      </span>
                    </div>
                    <div className="flex justify-between items-end">
                      <span className="pixel-box-sm bg-[#F6F3EB] px-2 py-0.5 font-pixel-mono text-xs text-[#1C1917]">
                        ↔ WIDTH: {product.dimensions.width}
                      </span>
                      <span className="pixel-box-sm bg-[#F6F3EB] px-2 py-0.5 font-pixel-mono text-xs text-[#1C1917]">
                        ⤢ DEPTH: {product.dimensions.depth}
                      </span>
                    </div>
                  </div>
                )}

                {/* Creature Speech Bubble Overlay */}
                {!isZoomed && (
                  <div className="pointer-events-none absolute bottom-4 left-4 pixel-box-sm bg-[#F6F3EB] px-3 py-1.5">
                    <span className="font-pixel-display text-xs text-[#1C1917]">
                      &ldquo;{product.speechBubble}&rdquo;
                    </span>
                  </div>
                )}
              </div>

              {/* Caption Bar */}
              <div className="bg-[#EFECE2] border-t-[3px] border-[#1C1917] px-4 py-2.5 font-pixel-body text-xs sm:text-sm text-[#57534E] flex items-center justify-between">
                <span>{activeGalleryItem.caption}</span>
                <span className="font-pixel-mono text-xs text-[#1C1917] hidden sm:inline">
                  CLICK IMAGE TO ZOOM
                </span>
              </div>
            </div>

            {/* 5 View Selector Thumbnails (Front, Side, Back, Detail, Scale) */}
            <div className="grid grid-cols-5 gap-2.5 sm:gap-3">
              {product.gallery.map((view, idx) => (
                <button
                  key={view.id}
                  type="button"
                  onClick={() => {
                    sound.playBlip(540 + idx * 40, 0.03);
                    setActiveViewIdx(idx);
                    setIsZoomed(false);
                  }}
                  className={`pixel-btn-sm p-1.5 flex flex-col items-center gap-1 ${
                    activeViewIdx === idx
                      ? 'bg-[#1C1917] text-[#F6F3EB]'
                      : 'bg-[#F6F3EB] text-[#1C1917] hover:bg-[#EFECE2]'
                  }`}
                >
                  <div className="w-full aspect-square overflow-hidden border border-[#1C1917] bg-[#EFECE2]">
                    <PixelImage
                      src={view.image}
                      alt={view.label}
                      className={`w-full h-full object-cover ${view.cropStyle || ''}`}
                    />
                  </div>
                  <span className="font-pixel-mono text-xs tracking-wider uppercase">
                    {view.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Right Column: Contiguous Collectible Creature Profile & Purchase Module */}
          <div className="lg:col-span-5 space-y-6">
            <div className="pixel-box-lg bg-[#F6F3EB] p-6 sm:p-8 space-y-6">
              {/* Availability & Category Metadata */}
              <div className="flex items-center justify-between border-b-2 border-dashed border-[#1C1917]/25 pb-3">
                <div className="flex items-center gap-2 font-pixel-mono text-sm">
                  <span
                    className="w-2.5 h-2.5 inline-block"
                    style={{
                      backgroundColor:
                        product.availability === 'In Stock'
                          ? '#4A6B53'
                          : product.availability === 'Low Stock'
                          ? '#E6B84D'
                          : '#D95D39',
                    }}
                  />
                  <span className="uppercase font-bold text-[#1C1917]">
                    {product.availability}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span className="text-[#57534E] uppercase">
                    {product.category} CLASS
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    sound.playBlip(700, 0.04);
                    onToggleWishlist(product.id);
                  }}
                  className="pixel-btn-sm bg-[#EFECE2] hover:bg-[#E6B84D] px-2.5 py-1 flex items-center gap-1.5 font-pixel-mono text-xs"
                >
                  <PixelHeart className="w-3.5 h-3.5" filled={isWishlisted} />
                  <span>{isWishlisted ? 'SAVED' : 'SAVE'}</span>
                </button>
              </div>

              {/* Creature Name & Large Pixel Price */}
              <div className="space-y-2">
                <h1 className="font-pixel-display text-3xl sm:text-4xl font-bold text-[#1C1917]">
                  {product.name}
                </h1>
                <p className="font-pixel-body text-lg font-semibold text-[#D95D39]">
                  &ldquo;{product.personality}&rdquo;
                </p>
                <div className="pt-2 flex items-baseline gap-3">
                  <span className="font-pixel-mono text-4xl sm:text-5xl font-bold text-[#1C1917] tabular-nums">
                    ₹{product.price}
                  </span>
                  {product.oldPrice && (
                    <span className="font-pixel-mono text-xl text-[#57534E] line-through tabular-nums">
                      ₹{product.oldPrice}
                    </span>
                  )}
                  <span className="font-pixel-mono text-xs text-[#57534E] uppercase">
                    (INCL. OF ALL TAXES)
                  </span>
                </div>
              </div>

              {/* Humorous & Practical Description */}
              <div className="space-y-3 border-t-[3px] border-[#1C1917] pt-5">
                <p className="font-pixel-body text-base text-[#1C1917] leading-relaxed">
                  {product.description}
                </p>
                <ul className="space-y-2 pt-1">
                  {product.practicalPoints.map((pt, idx) => (
                    <li
                      key={idx}
                      className="flex items-start gap-2.5 font-pixel-body text-sm text-[#57534E]"
                    >
                      <span className="w-2 h-2 bg-[#1C1917] mt-1.5 shrink-0" />
                      <span>{pt}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* MEASUREMENTS Section (No Fabricated Specs — Clearly Editable Placeholder) */}
              <div className="pixel-box-sm bg-[#EFECE2] p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="font-pixel-display text-xs sm:text-sm font-bold text-[#1C1917] uppercase tracking-wider">
                    MEASUREMENTS & SPECS
                  </h2>
                  <button
                    type="button"
                    onClick={() => {
                      sound.playBlip(560, 0.03);
                      setEditingSpecs(!editingSpecs);
                    }}
                    className="font-pixel-mono text-xs text-[#D95D39] hover:underline cursor-pointer"
                  >
                    {editingSpecs ? '[CANCEL]' : '[EDIT MEASUREMENTS]'}
                  </button>
                </div>

                {!editingSpecs ? (
                  <div className="space-y-1.5 font-pixel-mono text-sm text-[#1C1917]">
                    <div className="flex justify-between py-1 border-b border-[#1C1917]/15">
                      <span className="text-[#57534E]">Height:</span>
                      <span className="font-bold tabular-nums">{product.dimensions.height}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-[#1C1917]/15">
                      <span className="text-[#57534E]">Width:</span>
                      <span className="font-bold tabular-nums">{product.dimensions.width}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-[#1C1917]/15">
                      <span className="text-[#57534E]">Depth:</span>
                      <span className="font-bold tabular-nums">{product.dimensions.depth}</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-[#57534E]">Material:</span>
                      <span className="font-bold">{product.material}</span>
                    </div>
                  </div>
                ) : (
                  <form
                    action={FORMSPREE_ENDPOINT}
                    method="POST"
                    onSubmit={handleSaveSpecs}
                    className="space-y-2.5 pt-1"
                  >
                    <input type="hidden" name="form_type" value="PRODUCT_SPEC_UPDATE" />
                    <input type="hidden" name="product_name" value={product.name} />
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <div>
                        <label className="block font-pixel-mono text-xs text-[#57534E]">
                          Height (e.g. 9.5 cm)
                        </label>
                        <input
                          type="text"
                          name="height"
                          value={heightInput}
                          onChange={(e) => setHeightInput(e.target.value)}
                          className="pixel-input w-full px-2 py-1 text-xs font-pixel-mono"
                        />
                      </div>
                      <div>
                        <label className="block font-pixel-mono text-xs text-[#57534E]">
                          Width (e.g. 8.0 cm)
                        </label>
                        <input
                          type="text"
                          name="width"
                          value={widthInput}
                          onChange={(e) => setWidthInput(e.target.value)}
                          className="pixel-input w-full px-2 py-1 text-xs font-pixel-mono"
                        />
                      </div>
                      <div>
                        <label className="block font-pixel-mono text-xs text-[#57534E]">
                          Depth (e.g. 8.5 cm)
                        </label>
                        <input
                          type="text"
                          name="depth"
                          value={depthInput}
                          onChange={(e) => setDepthInput(e.target.value)}
                          className="pixel-input w-full px-2 py-1 text-xs font-pixel-mono"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block font-pixel-mono text-xs text-[#57534E]">
                        Material
                      </label>
                      <input
                        type="text"
                        name="material"
                        value={materialInput}
                        onChange={(e) => setMaterialInput(e.target.value)}
                        className="pixel-input w-full px-2 py-1 text-xs font-pixel-mono"
                      />
                    </div>
                    <button
                      type="submit"
                      className="pixel-btn-sm bg-[#4A6B53] text-[#F6F3EB] font-pixel-display text-xs px-3 py-1.5"
                    >
                      SAVE MEASUREMENTS
                    </button>
                  </form>
                )}
              </div>

              {/* Quantity Selector & Primary/Secondary CTAs */}
              <div className="space-y-4 pt-2">
                <div className="flex items-center justify-between">
                  <span className="font-pixel-display text-xs uppercase text-[#1C1917]">
                    QUANTITY
                  </span>
                  {/* Pixel-style Quantity Selector: [ − ] 1 [ + ] */}
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        sound.playBlip(440, 0.03);
                        setQuantity((q) => Math.max(1, q - 1));
                      }}
                      aria-label="Decrease quantity"
                      className="pixel-btn-sm bg-[#EFECE2] hover:bg-[#E6B84D] text-[#1C1917] w-11 h-11 font-pixel-mono text-xl font-bold flex items-center justify-center"
                    >
                      [ − ]
                    </button>
                    <span className="pixel-box-sm bg-[#FFFFFF] px-5 h-11 font-pixel-mono text-2xl font-bold flex items-center justify-center tabular-nums min-w-[3.25rem]">
                      {quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        sound.playBlip(660, 0.03);
                        setQuantity((q) => q + 1);
                      }}
                      aria-label="Increase quantity"
                      className="pixel-btn-sm bg-[#EFECE2] hover:bg-[#E6B84D] text-[#1C1917] w-11 h-11 font-pixel-mono text-xl font-bold flex items-center justify-center"
                    >
                      [ + ]
                    </button>
                  </div>
                </div>

                {/* Primary Button: ADD TO CART */}
                <button
                  type="button"
                  onClick={handleAdd}
                  className={`w-full pixel-btn py-4 px-6 font-pixel-display text-sm sm:text-base uppercase tracking-wider flex items-center justify-center gap-3 whitespace-nowrap ${
                    cartFlowState === 'acquired'
                      ? 'bg-[#4A6B53] text-[#F6F3EB]'
                      : cartFlowState === 'loading'
                      ? 'bg-[#E6B84D] text-[#1C1917]'
                      : 'bg-[#1C1917] hover:bg-[#332E2A] text-[#F6F3EB]'
                  }`}
                >
                  {cartFlowState === 'loading' && (
                    <span className="font-pixel-mono text-lg">
                      ACQUIRING CREATURE [■■■□]...
                    </span>
                  )}
                  {cartFlowState === 'acquired' && (
                    <span>+{quantity} CREATURE ACQUIRED!</span>
                  )}
                  {cartFlowState === 'idle' && (
                    <span>
                      ADD TO CART — ₹{(product.price * quantity).toLocaleString('en-IN')}
                    </span>
                  )}
                </button>

                {/* Post-Add Inline Action Prompt: VIEW CART or KEEP SHOPPING */}
                {cartFlowState === 'acquired' && (
                  <div className="pixel-box-sm bg-[#EFECE2] p-3.5 space-y-2.5 animate-fadeIn">
                    <div className="flex items-center gap-2 font-pixel-display text-xs text-[#4A6B53]">
                      <PixelCreatureSprite className="w-5 h-5" />
                      <span>+{quantity} CREATURE ACQUIRED IN YOUR BAG</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2.5">
                      <button
                        type="button"
                        onClick={() => {
                          sound.playBlip(680, 0.04);
                          onOpenCart();
                        }}
                        className="pixel-btn-sm bg-[#1C1917] text-[#F6F3EB] hover:bg-[#D95D39] py-2 px-3 font-pixel-display text-xs whitespace-nowrap"
                      >
                        VIEW CART
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          sound.playBlip(520, 0.04);
                          setCartFlowState('idle');
                          onBackToShop();
                        }}
                        className="pixel-btn-sm bg-[#F6F3EB] text-[#1C1917] hover:bg-[#E6B84D] py-2 px-3 font-pixel-display text-xs whitespace-nowrap"
                      >
                        KEEP SHOPPING
                      </button>
                    </div>
                  </div>
                )}

                {/* Secondary Direct Purchase Button: BUY NOW */}
                <button
                  type="button"
                  onClick={() => {
                    sound.playAcquire();
                    onBuyNow(product, quantity);
                  }}
                  className="w-full pixel-btn bg-[#D95D39] hover:bg-[#c04c2b] text-[#F6F3EB] py-4 px-6 font-pixel-display text-sm sm:text-base uppercase tracking-wider flex items-center justify-center gap-2 whitespace-nowrap"
                >
                  <span>BUY NOW</span>
                  <span className="font-pixel-mono text-xl leading-none">→</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Related Creatures Row */}
        <div className="pt-10 border-t-[3px] border-[#1C1917] space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="font-pixel-display text-xl sm:text-2xl font-bold text-[#1C1917]">
              OTHER WEIRDOS LOOKING FOR A DESK
            </h2>
            <button
              type="button"
              onClick={onBackToShop}
              className="font-pixel-display text-xs text-[#D95D39] hover:underline cursor-pointer"
            >
              VIEW ALL →
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {relatedCreatures.map((rel) => (
              <div
                key={rel.id}
                onClick={() => {
                  sound.playBlip(620, 0.04);
                  onSelectProduct(rel);
                }}
                className="pixel-card bg-[#F6F3EB] p-4 flex items-center gap-4 cursor-pointer"
              >
                <div className="w-20 h-20 shrink-0 border-2 border-[#1C1917] bg-[#EFECE2] overflow-hidden">
                  <PixelImage
                    src={rel.image}
                    alt={rel.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="min-w-0 flex-1 space-y-1">
                  <h3 className="font-pixel-display text-sm font-bold text-[#1C1917] truncate">
                    {rel.name}
                  </h3>
                  <p className="font-pixel-body text-xs text-[#57534E] truncate">
                    {rel.personality}
                  </p>
                  <div className="font-pixel-mono text-xl font-bold text-[#D95D39] tabular-nums">
                    ₹{rel.price}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
