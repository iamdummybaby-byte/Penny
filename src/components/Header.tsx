import React, { useState, useEffect } from 'react';
import { PixelBagIcon, PixelSearchIcon, PixelCreatureSprite } from './PixelSprites';
import { sound } from '../utils/sound';

interface HeaderProps {
  cartCount: number;
  wishlistCount: number;
  onOpenCart: () => void;
  onOpenSearch: () => void;
  onNavigateHome: (sectionId?: string) => void;
  currentView: 'home' | 'product' | 'checkout' | 'confirmation';
}

export const Header: React.FC<HeaderProps> = ({
  cartCount,
  onOpenCart,
  onOpenSearch,
  onNavigateHome,
  currentView,
}) => {
  const [scrolled, setScrolled] = useState(false);
  const [logoHovered, setLogoHovered] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [cartBump, setCartBump] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 28);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (cartCount > 0) {
      setCartBump(true);
      const t = setTimeout(() => setCartBump(false), 300);
      return () => clearTimeout(t);
    }
  }, [cartCount]);

  const handleNavClick = (sectionId: string) => {
    sound.playBlip(620, 0.04);
    setMobileMenuOpen(false);
    onNavigateHome(sectionId);
  };

  return (
    <header
      className={`sticky top-0 z-40 w-full transition-all duration-150 border-b-[3px] border-[#1C1917] ${
        scrolled
          ? 'bg-[#F6F3EB] py-2.5 shadow-[0_4px_0_#1C1917]'
          : 'bg-[#F6F3EB]/95 backdrop-blur-xs py-4'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
        {/* Zone 1: Brand Wordmark with subtle jumping creature on hover */}
        <a
          href="#top"
          onClick={(e) => {
            e.preventDefault();
            sound.playBlip(700, 0.04);
            onNavigateHome('top');
          }}
          onMouseEnter={() => {
            setLogoHovered(true);
            sound.playBlip(540, 0.03);
          }}
          onMouseLeave={() => setLogoHovered(false)}
          className="relative font-pixel-arcade text-xl sm:text-2xl tracking-tight text-[#1C1917] whitespace-nowrap shrink-0 py-1 focus:outline-none"
        >
          PENNY
          {logoHovered && (
            <span
              className="pointer-events-none absolute -top-3 left-1/2 -translate-x-1/2 animate-pixel-bounce"
              aria-hidden="true"
            >
              <PixelCreatureSprite className="w-5 h-5" />
            </span>
          )}
        </a>

        {/* Zone 2: 4 Single-line Navigation Links */}
        <nav className="hidden md:flex items-center gap-8" aria-label="Main Navigation">
          <button
            type="button"
            onClick={() => handleNavClick('shop-section')}
            className={`font-pixel-display text-sm tracking-wide uppercase whitespace-nowrap shrink-0 cursor-pointer transition-colors hover:text-[#D95D39] hover:underline decoration-2 underline-offset-4 ${
              currentView === 'product' ? 'text-[#D95D39] underline' : 'text-[#1C1917]'
            }`}
          >
            SHOP
          </button>
          <button
            type="button"
            onClick={() => handleNavClick('collect-section')}
            className="font-pixel-display text-sm tracking-wide uppercase text-[#1C1917] whitespace-nowrap shrink-0 cursor-pointer transition-colors hover:text-[#D95D39] hover:underline decoration-2 underline-offset-4"
          >
            CREATURES
          </button>
          <button
            type="button"
            onClick={() => handleNavClick('about-section')}
            className="font-pixel-display text-sm tracking-wide uppercase text-[#1C1917] whitespace-nowrap shrink-0 cursor-pointer transition-colors hover:text-[#D95D39] hover:underline decoration-2 underline-offset-4"
          >
            ABOUT
          </button>
          <button
            type="button"
            onClick={() => handleNavClick('desk-section')}
            className="font-pixel-display text-sm tracking-wide uppercase text-[#1C1917] whitespace-nowrap shrink-0 cursor-pointer transition-colors hover:text-[#D95D39] hover:underline decoration-2 underline-offset-4"
          >
            HOW IT WORKS
          </button>
        </nav>

        {/* Zone 3: Search & Cart Actions */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => {
              sound.playBlip(640, 0.04);
              onOpenSearch();
            }}
            aria-label="Search creatures"
            className="pixel-btn-sm bg-[#EFECE2] hover:bg-[#E6B84D] text-[#1C1917] px-3 py-2 flex items-center gap-2 text-xs font-pixel-display whitespace-nowrap"
          >
            <PixelSearchIcon className="w-4 h-4" />
            <span className="hidden sm:inline">SEARCH</span>
          </button>

          <button
            type="button"
            onClick={() => {
              sound.playBlip(720, 0.04);
              onOpenCart();
            }}
            aria-label={`Open cart with ${cartCount} items`}
            className={`pixel-btn-sm bg-[#1C1917] hover:bg-[#D95D39] text-[#F6F3EB] px-3.5 py-2 flex items-center gap-2 text-xs font-pixel-display whitespace-nowrap ${
              cartBump ? 'scale-105 bg-[#D95D39]' : ''
            }`}
          >
            <PixelBagIcon className="w-4 h-4" />
            <span>CART</span>
            <span className="font-pixel-mono text-base leading-none bg-[#F6F3EB] text-[#1C1917] px-1.5 py-0.5">
              {cartCount}
            </span>
          </button>

          {/* Mobile Pixel Hamburger Button */}
          <button
            type="button"
            onClick={() => {
              sound.playBlip(500, 0.04);
              setMobileMenuOpen(!mobileMenuOpen);
            }}
            aria-label="Toggle navigation menu"
            aria-expanded={mobileMenuOpen}
            className="md:hidden pixel-btn-sm bg-[#EFECE2] text-[#1C1917] p-2 flex flex-col justify-center items-center w-10 h-10 gap-1"
          >
            <span
              className={`block w-5 h-[3px] bg-[#1C1917] transition-transform ${
                mobileMenuOpen ? 'rotate-45 translate-y-[7px]' : ''
              }`}
            />
            <span
              className={`block w-5 h-[3px] bg-[#1C1917] transition-opacity ${
                mobileMenuOpen ? 'opacity-0' : 'opacity-100'
              }`}
            />
            <span
              className={`block w-5 h-[3px] bg-[#1C1917] transition-transform ${
                mobileMenuOpen ? '-rotate-45 -translate-y-[7px]' : ''
              }`}
            />
          </button>
        </div>
      </div>

      {/* Mobile Dropdown Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t-[3px] border-[#1C1917] bg-[#F6F3EB] px-4 pt-3 pb-5 space-y-2">
          <button
            type="button"
            onClick={() => handleNavClick('shop-section')}
            className="w-full text-left font-pixel-display text-base py-2.5 px-3 hover:bg-[#EFECE2] border-2 border-transparent hover:border-[#1C1917] flex items-center justify-between"
          >
            <span>SHOP</span>
            <span className="font-pixel-mono text-lg">→</span>
          </button>
          <button
            type="button"
            onClick={() => handleNavClick('collect-section')}
            className="w-full text-left font-pixel-display text-base py-2.5 px-3 hover:bg-[#EFECE2] border-2 border-transparent hover:border-[#1C1917] flex items-center justify-between"
          >
            <span>CREATURES</span>
            <span className="font-pixel-mono text-lg">→</span>
          </button>
          <button
            type="button"
            onClick={() => handleNavClick('about-section')}
            className="w-full text-left font-pixel-display text-base py-2.5 px-3 hover:bg-[#EFECE2] border-2 border-transparent hover:border-[#1C1917] flex items-center justify-between"
          >
            <span>ABOUT</span>
            <span className="font-pixel-mono text-lg">→</span>
          </button>
          <button
            type="button"
            onClick={() => handleNavClick('desk-section')}
            className="w-full text-left font-pixel-display text-base py-2.5 px-3 hover:bg-[#EFECE2] border-2 border-transparent hover:border-[#1C1917] flex items-center justify-between"
          >
            <span>HOW IT WORKS</span>
            <span className="font-pixel-mono text-lg">→</span>
          </button>
        </div>
      )}
    </header>
  );
};
