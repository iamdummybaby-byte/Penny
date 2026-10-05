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
import { AdminAnalyticsPanel } from './components/AdminAnalyticsPanel';
import {
  trackEvent,
  trackCtaClick,
  getAnonymousSessionId,
  setAnalyticsCurrentPage,
} from './utils/analytics';

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
    'home' | 'product' | 'checkout' | 'confirmation' | 'admin'
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
  const [productViewEnteredAt, setProductViewEnteredAt] = useState<number>(0);

  // Initial session_start & page_view + 20s live visitor heartbeat
  useEffect(() => {
    const { isNewSession } = getAnonymousSessionId();
    if (isNewSession) {
      trackEvent({ type: 'session_start', page: 'home' });
    }
    trackEvent({ type: 'page_view', page: 'home', heatmapZone: 'hero' });

    const hb = setInterval(() => {
      if (window.location.pathname !== '/admin') {
        trackEvent({ type: 'heartbeat' });
      }
    }, 20000);
    return () => clearInterval(hb);
  }, []);

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

  // Sync URL path `/shop/product-name` or `/admin` with state
  useEffect(() => {
    const syncFromPath = () => {
      const path = window.location.pathname;
      if (path === '/admin') {
        setCurrentView('admin');
        return;
      }
      if (path.startsWith('/shop/')) {
        const slug = path.replace('/shop/', '').trim();
        const found = products.find((p) => p.slug === slug);
        if (found) {
          setSelectedSlug(found.slug);
          setCurrentView('product');
          setAnalyticsCurrentPage('product');
          return;
        }
      } else if (path === '/checkout') {
        setCurrentView('checkout');
        setAnalyticsCurrentPage('checkout');
        return;
      }
      setCurrentView('home');
      setAnalyticsCurrentPage('home');
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

  const flushProductDwell = () => {
    if (currentView === 'product' && productViewEnteredAt > 0 && selectedSlug) {
      const targetProd = products.find((p) => p.slug === selectedSlug);
      const sec = Math.round((Date.now() - productViewEnteredAt) / 1000);
      if (targetProd && sec >= 1) {
        trackEvent({
          type: 'product_dwell',
          page: 'product',
          productId: targetProd.id,
          productName: targetProd.name,
          productSlug: targetProd.slug,
          durationSec: sec,
        });
      }
      setProductViewEnteredAt(0);
    }
  };

  const navigateToProduct = (product: Product) => {
    flushProductDwell();
    setSelectedSlug(product.slug);
    setCurrentView('product');
    setProductViewEnteredAt(Date.now());
    setAnalyticsCurrentPage('product');
    trackEvent({
      type: 'page_view',
      page: 'product',
      productId: product.id,
      productName: product.name,
      productSlug: product.slug,
      heatmapZone: 'product-gallery',
    });
    trackEvent({
      type: 'product_view',
      page: 'product',
      section: 'product-detail',
      elementName: 'VIEW DETAILS',
      productId: product.id,
      productName: product.name,
      productSlug: product.slug,
      heatmapZone: 'product-gallery',
    });
    try {
      window.history.pushState({}, '', `/shop/${product.slug}`);
    } catch {
      // ignore in restricted iframe
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const navigateHome = (sectionId?: string) => {
    flushProductDwell();
    setCurrentView('home');
    const virtualPage =
      sectionId === 'shop-section'
        ? 'shop'
        : sectionId === 'about-section'
        ? 'about'
        : sectionId === 'faq-section'
        ? 'faq'
        : sectionId === 'penny-club-section'
        ? 'penny-club'
        : 'home';
    setAnalyticsCurrentPage(virtualPage);
    trackEvent({
      type: 'page_view',
      page: virtualPage,
      section: sectionId || 'top',
      heatmapZone: sectionId || 'hero',
    });
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

  const navigateToAdmin = () => {
    flushProductDwell();
    setCurrentView('admin');
    try {
      window.history.pushState({}, '', '/admin');
    } catch {
      // ignore
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAddToCart = (product: Product, quantity = 1) => {
    trackEvent({
      type: 'add_to_cart',
      section: currentView === 'product' ? 'purchase-module' : 'shop-section',
      elementName: 'ADD TO CART',
      productId: product.id,
      productName: product.name,
      productSlug: product.slug,
      quantity,
      heatmapZone: 'ADD TO CART',
    });
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
    trackCtaClick('BUY NOW', 'purchase-module', 'product', 'BUY NOW');
    handleAddToCart(product, quantity);
    setCartOpen(false);
    setCurrentView('checkout');
    setAnalyticsCurrentPage('checkout');
    trackEvent({
      type: 'checkout_start',
      page: 'checkout',
      section: 'checkout-shipping',
      elementName: 'CHECKOUT',
      productId: product.id,
      productName: product.name,
      heatmapZone: 'checkout-shipping',
    });
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
        trackEvent({
          type: 'remove_from_cart',
          productId: target.product.id,
          productName: target.product.name,
        });
        showToast('CREATURE RELEASED', `${target.product.name} left your bag.`, 'release');
      }
    }
  };

  const handleRemoveCartItem = (productId: string) => {
    const target = cart.find((c) => c.product.id === productId);
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
    if (target) {
      trackEvent({
        type: 'remove_from_cart',
        productId: target.product.id,
        productName: target.product.name,
      });
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
      if (!exists) {
        trackEvent({
          type: 'wishlist_add',
          productId: target.id,
          productName: target.name,
          productSlug: target.slug,
          elementName: 'WISHLIST HEART',
          heatmapZone: 'CREATURE PRODUCT CARDS',
        });
      }
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

  // Separate Private Admin Analytics Control Room
  if (currentView === 'admin') {
    return (
      <AdminAnalyticsPanel
        products={products}
        onExitAdmin={() => navigateHome('top')}
      />
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#F6F3EB] text-[#1C1917] selection:bg-[#D95D39] selection:text-[#F6F3EB]">
      {/* Sticky Pixel Navigation Header */}
      <Header
        cartCount={totalCartCount}
        wishlistCount={wishlist.length}
        onOpenCart={() => {
          trackEvent({
            type: 'cart_view',
            section: 'header',
            elementName: 'CART',
            heatmapZone: 'CART',
          });
          setCartOpen(true);
        }}
        onOpenSearch={() => {
          trackEvent({
            type: 'search',
            section: 'header',
            elementName: 'SEARCH',
            heatmapZone: 'SEARCH',
          });
          setSearchOpen(true);
        }}
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
            onOpenCart={() => {
              trackEvent({
                type: 'cart_view',
                section: 'product-detail',
                elementName: 'CART',
              });
              setCartOpen(true);
            }}
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
              // Record anonymized purchase event for each ordered creature + overall order
              for (const item of orderRecord.items) {
                trackEvent({
                  type: 'purchase',
                  page: 'checkout',
                  section: 'checkout-complete',
                  elementName: 'CHECKOUT',
                  productId: item.product.id,
                  productName: item.product.name,
                  productSlug: item.product.slug,
                  quantity: item.quantity,
                  orderValue: orderRecord.total,
                  country: 'INDIA',
                  heatmapZone: 'checkout_complete',
                });
              }
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
        onOpenAdmin={navigateToAdmin}
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
          setAnalyticsCurrentPage('checkout');
          trackEvent({
            type: 'checkout_start',
            page: 'checkout',
            section: 'cart-drawer',
            elementName: 'CHECKOUT',
            heatmapZone: 'checkout-shipping',
          });
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
        onSelectProduct={(prod) => {
          trackEvent({
            type: 'search_result_click',
            page: 'home',
            section: 'search-modal',
            elementName: 'SEARCH',
            productId: prod.id,
            productName: prod.name,
            productSlug: prod.slug,
          });
          navigateToProduct(prod);
        }}
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
