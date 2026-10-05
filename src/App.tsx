/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  INITIAL_PRODUCTS,
  Product,
  ProductDimensions,
} from './data/products';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { ConceptSection } from './components/ConceptSection';
import { ShopSection } from './components/ShopSection';
import { ProductDetail } from './components/ProductDetail';
import {
  WhyPennySection,
  DeskSceneSection,
  CollectThemAllSection,
  AboutPennySection,
  FaqSection,
  Footer,
} from './components/StorySections';
import { PennyClubSection } from './components/PennyClubSection';
import {
  SearchModal,
  QuickViewModal,
  PolicyModal,
} from './components/Modals';
import {
  CartDrawer,
  CheckoutPage,
  OrderConfirmationPage,
  CartItem,
  OrderRecord,
} from './components/CartAndCheckout';
import { PixelCreatureSprite } from './components/PixelSprites';

interface PixelToast {
  id: number;
  title: string;
  subtitle?: string;
  type: 'acquire' | 'release' | 'info';
}

export default function App() {
  const [products, setProducts] = useState<Product[]>(() => {
    try {
      const saved = localStorage.getItem('penny_products_v2');
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return INITIAL_PRODUCTS;
  });

  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('penny_cart_v1');
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return [];
  });

  const [wishlist, setWishlist] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('penny_wishlist_v1');
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return ['penny-01'];
  });

  const [currentView, setCurrentView] = useState<
    'home' | 'product' | 'checkout' | 'confirmation'
  >('home');
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
  const [policyModal, setPolicyModal] = useState<
    'shipping' | 'returns' | 'contact' | 'privacy' | null
  >(null);
  const [completedOrder, setCompletedOrder] = useState<OrderRecord | null>(null);
  const [toast, setToast] = useState<PixelToast | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem('penny_cart_v1', JSON.stringify(cart));
    } catch {
      // ignore
    }
  }, [cart]);

  useEffect(() => {
    try {
      localStorage.setItem('penny_wishlist_v1', JSON.stringify(wishlist));
    } catch {
      // ignore
    }
  }, [wishlist]);

  useEffect(() => {
    try {
      localStorage.setItem('penny_products_v2', JSON.stringify(products));
    } catch {
      // ignore
    }
  }, [products]);

  const showToast = useCallback(
    (title: string, subtitle?: string, type: 'acquire' | 'release' | 'info' = 'acquire') => {
      setToast({ id: Date.now(), title, subtitle, type });
    },
    []
  );

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 3200);
    return () => clearTimeout(timer);
  }, [toast]);

  // Sync URL path `/shop/product-name` with state
  useEffect(() => {
    const syncFromPath = () => {
      const path = window.location.pathname;
      if (path.startsWith('/shop/')) {
        const slug = path.replace('/shop/', '').trim();
        const found = products.find((p) => p.slug === slug);
        if (found) {
          setSelectedSlug(found.slug);
          setCurrentView('product');
          return;
        }
      } else if (path === '/checkout') {
        setCurrentView('checkout');
        return;
      }
      setCurrentView('home');
    };

    syncFromPath();
    window.addEventListener('popstate', syncFromPath);
    return () => window.removeEventListener('popstate', syncFromPath);
  }, [products]);

  // Keyboard shortcut Esc to close modals
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSearchOpen(false);
        setQuickViewProduct(null);
        setCartOpen(false);
        setPolicyModal(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const navigateToProduct = (product: Product) => {
    setSelectedSlug(product.slug);
    setCurrentView('product');
    try {
      window.history.pushState({}, '', `/shop/${product.slug}`);
    } catch {
      // ignore in restricted iframe
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const navigateHome = (sectionId?: string) => {
    setCurrentView('home');
    try {
      window.history.pushState({}, '', '/');
    } catch {
      // ignore
    }
    if (sectionId && sectionId !== 'top') {
      setTimeout(() => {
        const el = document.getElementById(sectionId);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth' });
        }
      }, 60);
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleAddToCart = (product: Product, quantity = 1) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...prev, { product, quantity }];
    });
    showToast(
      `+${quantity} CREATURE ACQUIRED`,
      `${product.name} added to your bag.`,
      'acquire'
    );
  };

  const handleBuyNow = (product: Product, quantity = 1) => {
    handleAddToCart(product, quantity);
    setCartOpen(false);
    setCurrentView('checkout');
    try {
      window.history.pushState({}, '', '/checkout');
    } catch {
      // ignore
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleUpdateCartQty = (productId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.product.id !== productId) return item;
          const nextQty = item.quantity + delta;
          return nextQty > 0 ? { ...item, quantity: nextQty } : null;
        })
        .filter(Boolean) as CartItem[]
    );
    if (delta < 0) {
      const target = cart.find((c) => c.product.id === productId);
      if (target && target.quantity === 1) {
        showToast('CREATURE RELEASED', `${target.product.name} left your bag.`, 'release');
      }
    }
  };

  const handleRemoveCartItem = (productId: string) => {
    const target = cart.find((c) => c.product.id === productId);
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
    if (target) {
      showToast('CREATURE RELEASED', `${target.product.name} was released back to the wild.`, 'release');
    }
  };

  const handleToggleWishlist = (productId: string) => {
    const exists = wishlist.includes(productId);
    const target = products.find((p) => p.id === productId);
    setWishlist((prev) =>
      exists ? prev.filter((id) => id !== productId) : [...prev, productId]
    );
    if (target) {
      showToast(
        exists ? 'REMOVED FROM SAVED' : 'CREATURE FAVORITED ♥',
        target.name,
        'info'
      );
    }
  };

  const handleUpdateDimensions = (
    productId: string,
    dimensions: ProductDimensions,
    material: string
  ) => {
    setProducts((prev) =>
      prev.map((p) =>
        p.id === productId ? { ...p, dimensions, material } : p
      )
    );
    showToast('MEASUREMENTS UPDATED', 'Product specifications saved.', 'info');
  };

  const handleUpdateProductImage = (productId: string, newImageUrl: string) => {
    setProducts((prev) =>
      prev.map((p) =>
        p.id === productId
          ? {
              ...p,
              image: newImageUrl,
              gallery: p.gallery.map((g) => ({ ...g, image: newImageUrl })),
            }
          : p
      )
    );
    showToast('PHOTO UPDATED', 'Creature image updated in catalog.', 'info');
  };

  const totalCartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const activeProduct =
    products.find((p) => p.slug === selectedSlug) || products[0];

  return (
    <div className="min-h-screen flex flex-col bg-[#F6F3EB] text-[#1C1917] selection:bg-[#D95D39] selection:text-[#F6F3EB]">
      {/* Sticky Pixel Navigation Header */}
      <Header
        cartCount={totalCartCount}
        wishlistCount={wishlist.length}
        onOpenCart={() => setCartOpen(true)}
        onOpenSearch={() => setSearchOpen(true)}
        onNavigateHome={navigateHome}
        currentView={currentView}
      />

      {/* Main View Router */}
      <main className="flex-1">
        {currentView === 'home' && (
          <>
            <Hero
              featuredCreatures={products}
              onShopClick={() => navigateHome('shop-section')}
              onMeetWeirdosClick={() => navigateHome('collect-section')}
              onSelectProduct={navigateToProduct}
              onQuickAdd={(prod) => handleAddToCart(prod, 1)}
            />

            <ConceptSection />

            <ShopSection
              products={products}
              wishlist={wishlist}
              onToggleWishlist={handleToggleWishlist}
              onSelectProduct={navigateToProduct}
              onAddToCart={handleAddToCart}
              onQuickView={(prod) => setQuickViewProduct(prod)}
            />

            <WhyPennySection />

            <DeskSceneSection
              products={products}
              onSelectProduct={navigateToProduct}
            />

            <CollectThemAllSection
              products={products}
              onSelectProduct={navigateToProduct}
            />

            <AboutPennySection />

            <FaqSection />
          </>
        )}

        {currentView === 'product' && activeProduct && (
          <ProductDetail
            product={activeProduct}
            allProducts={products}
            isWishlisted={wishlist.includes(activeProduct.id)}
            onToggleWishlist={handleToggleWishlist}
            onAddToCart={handleAddToCart}
            onBuyNow={handleBuyNow}
            onOpenCart={() => setCartOpen(true)}
            onBackToShop={() => navigateHome('shop-section')}
            onSelectProduct={navigateToProduct}
            onUpdateDimensions={handleUpdateDimensions}
            onUpdateProductImage={handleUpdateProductImage}
          />
        )}

        {currentView === 'checkout' && (
          <CheckoutPage
            items={cart}
            onBackToShop={() => navigateHome('shop-section')}
            onCompleteOrder={(orderRecord) => {
              setCompletedOrder(orderRecord);
              setCart([]);
              setCurrentView('confirmation');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        )}

        {currentView === 'confirmation' && completedOrder && (
          <OrderConfirmationPage
            order={completedOrder}
            onBackToShop={() => navigateHome('top')}
            onMeetMoreCreatures={() => navigateHome('shop-section')}
          />
        )}
      </main>

      {/* Interactive PENNY CLUB Membership Application Terminal */}
      <PennyClubSection
        onBackToCreatures={() => navigateHome('shop-section')}
        onOpenPrivacyPolicy={() => setPolicyModal('privacy')}
      />

      {/* Dark Pixel-Art Footer */}
      <Footer
        onNavigateHome={navigateHome}
        onShowPolicyModal={(type) => setPolicyModal(type)}
      />

      {/* Slide-in Pixel Cart Drawer */}
      <CartDrawer
        isOpen={cartOpen}
        items={cart}
        onClose={() => setCartOpen(false)}
        onUpdateQty={handleUpdateCartQty}
        onRemoveItem={handleRemoveCartItem}
        onProceedToCheckout={() => {
          setCartOpen(false);
          setCurrentView('checkout');
          try {
            window.history.pushState({}, '', '/checkout');
          } catch {
            // ignore
          }
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onSelectProduct={navigateToProduct}
      />

      {/* Pixel Search Modal */}
      <SearchModal
        isOpen={searchOpen}
        products={products}
        onClose={() => setSearchOpen(false)}
        onSelectProduct={navigateToProduct}
        onQuickAdd={(prod) => handleAddToCart(prod, 1)}
      />

      {/* Quick View Modal */}
      <QuickViewModal
        product={quickViewProduct}
        onClose={() => setQuickViewProduct(null)}
        onAddToCart={handleAddToCart}
        onOpenFullProfile={navigateToProduct}
      />

      {/* Shipping / Returns / Contact Modal */}
      <PolicyModal
        policy={policyModal}
        onClose={() => setPolicyModal(null)}
      />

      {/* Mini Pixel Notification Toast */}
      {toast && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-5 right-5 z-50 pixel-box bg-[#1C1917] text-[#F6F3EB] p-4 max-w-xs sm:max-w-sm shadow-[6px_6px_0_#D95D39]"
        >
          <div className="flex items-start gap-3">
            <PixelCreatureSprite
              className="w-7 h-7 shrink-0 animate-pixel-bounce"
              color={toast.type === 'release' ? '#D95D39' : '#4A6B53'}
            />
            <div className="space-y-1 flex-1 min-w-0">
              <div className="font-pixel-display text-xs sm:text-sm font-bold text-[#E6B84D]">
                {toast.title}
              </div>
              {toast.subtitle && (
                <div className="font-pixel-body text-xs text-[#F6F3EB]/90 truncate">
                  {toast.subtitle}
                </div>
              )}
              {toast.type === 'acquire' && (
                <div className="pt-2 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setToast(null);
                      setCartOpen(true);
                    }}
                    className="pixel-btn-sm bg-[#D95D39] text-[#F6F3EB] px-2.5 py-1 font-pixel-display text-[10px] uppercase"
                  >
                    VIEW CART
                  </button>
                  <button
                    type="button"
                    onClick={() => setToast(null)}
                    className="pixel-btn-sm bg-[#23211E] text-[#F6F3EB] border-[#F6F3EB] px-2.5 py-1 font-pixel-display text-[10px] uppercase"
                  >
                    KEEP SHOPPING
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
