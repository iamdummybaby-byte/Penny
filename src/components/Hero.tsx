import React, { useState, useEffect } from 'react';
import { Product } from '../data/products';
import {
  PixelHeart,
  PixelStar,
  PixelCoin,
  PixelCreatureSprite,
  PixelImage,
} from './PixelSprites';
import { sound } from '../utils/sound';

interface HeroProps {
  featuredCreatures: Product[];
  onShopClick: () => void;
  onMeetWeirdosClick: () => void;
  onSelectProduct: (product: Product) => void;
  onQuickAdd: (product: Product) => void;
}

export const Hero: React.FC<HeroProps> = ({
  featuredCreatures,
  onShopClick,
  onMeetWeirdosClick,
  onSelectProduct,
  onQuickAdd,
}) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [mouseOffset, setMouseOffset] = useState({ x: 0, y: 0 });
  const [scrollOffset, setScrollOffset] = useState(0);
  const [pokedQuote, setPokedQuote] = useState<string | null>(null);

  const activeCreature = featuredCreatures[activeIndex] || featuredCreatures[0];

  useEffect(() => {
    const handleScroll = () => {
      setScrollOffset(Math.min(window.scrollY * 0.12, 36));
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width - 0.5) * 14;
    const y = ((e.clientY - rect.top) / rect.height - 0.5) * 14;
    setMouseOffset({ x, y });
  };

  const handlePokeCreature = () => {
    sound.playBlip(760, 0.05);
    const quotes = [
      activeCreature.speechBubble,
      'HEY! HANDS OFF THE EARS.',
      'GOT ANY 0.5MM GEL PENS?',
      'YOUR DESK LOOKED LONELY.',
    ];
    const nextQuote = quotes[Math.floor(Math.random() * quotes.length)];
    setPokedQuote(nextQuote);
  };

  return (
    <section
      id="top"
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setMouseOffset({ x: 0, y: 0 })}
      className="relative bg-pixel-grid border-b-[3px] border-[#1C1917] overflow-hidden pt-8 pb-12 lg:py-16"
    >
      {/* Subtle drifting pixel dust in background */}
      <div
        className="pointer-events-none absolute inset-0 overflow-hidden opacity-60"
        aria-hidden="true"
      >
        <div
          className="absolute top-12 left-[8%] transition-transform duration-200"
          style={{ transform: `translate(${mouseOffset.x * -0.8}px, ${mouseOffset.y * -0.8}px)` }}
        >
          <PixelStar className="w-4 h-4" color="#D95D39" />
        </div>
        <div
          className="absolute top-28 right-[10%] transition-transform duration-200"
          style={{ transform: `translate(${mouseOffset.x * 1.1}px, ${mouseOffset.y * 1.1}px)` }}
        >
          <PixelStar className="w-5 h-5" color="#4A6B53" />
        </div>
        <div
          className="absolute bottom-20 left-[44%] transition-transform duration-200"
          style={{ transform: `translate(${mouseOffset.x * 0.6}px, ${mouseOffset.y * -0.6}px)` }}
        >
          <PixelCoin className="w-4 h-4" />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          {/* Left Column: Witty Copy & Pixel Game CTAs */}
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 text-xs sm:text-sm font-pixel-display text-[#4A6B53] tracking-wider uppercase">
              <span className="w-2.5 h-2.5 bg-[#D95D39] inline-block animate-pulse" />
              <span>COLLECTIBLE DESK COMPANIONS · INDIA</span>
            </div>

            <h1
              className="font-pixel-display text-3xl sm:text-5xl lg:text-6xl font-bold text-[#1C1917] leading-[1.08] tracking-tight"
              style={{ textWrap: 'balance' }}
            >
              TINY CREATURES.
              <span className="block text-[#D95D39] mt-1">BIG DESK ENERGY.</span>
            </h1>

            <div className="space-y-2 max-w-xl">
              <p className="font-pixel-body text-xl sm:text-2xl font-semibold text-[#1C1917] leading-snug">
                We make weird little things that hold your pens.
              </p>
              <p className="font-pixel-body text-base sm:text-lg text-[#57534E]">
                Collect one. Collect five. Pretend this was intentional.
              </p>
            </div>

            {/* Primary & Secondary CTAs */}
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <button
                type="button"
                onClick={() => {
                  sound.playBlip(680, 0.05);
                  onShopClick();
                }}
                className="pixel-btn bg-[#D95D39] hover:bg-[#c04c2b] text-[#F6F3EB] font-pixel-display text-sm sm:text-base px-6 py-4 flex items-center gap-3 whitespace-nowrap"
              >
                <span>SHOP THE CREATURES</span>
                <span className="font-pixel-mono text-xl leading-none animate-pixel-bounce">→</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  sound.playBlip(520, 0.05);
                  onMeetWeirdosClick();
                }}
                className="pixel-btn bg-[#EFECE2] hover:bg-[#E6B84D] text-[#1C1917] font-pixel-display text-sm sm:text-base px-6 py-4 whitespace-nowrap"
              >
                MEET THE WEIRDOS
              </button>
            </div>

            {/* Quiet Unboxed Metadata Highlights (Zero-Pill compliant) */}
            <div className="pt-4 border-t-2 border-dashed border-[#1C1917]/25 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm font-pixel-body text-[#57534E]">
              <span className="text-[#1C1917] font-semibold">Starting at ₹299</span>
              <span aria-hidden="true">·</span>
              <span>Real tactile desk sculptures</span>
              <span aria-hidden="true">·</span>
              <span>Ships across India</span>
            </div>
          </div>

          {/* Right Column: Physical Creature inside Interactive Pixel Environment */}
          <div className="lg:col-span-5">
            <div
              className="relative mx-auto max-w-md transition-transform duration-200"
              style={{
                transform: `translate3d(${mouseOffset.x * 0.5}px, ${
                  mouseOffset.y * 0.5 - scrollOffset * 0.35
                }px, 0)`,
              }}
            >
              {/* Floating Pixel Speech Bubble */}
              <div className="absolute -top-5 left-4 z-20 pixel-box-sm bg-[#F6F3EB] px-3.5 py-2 flex items-center gap-2">
                <PixelHeart className="w-4 h-4 shrink-0" />
                <span className="font-pixel-display text-xs text-[#1C1917]">
                  &ldquo;{pokedQuote || activeCreature.speechBubble}&rdquo;
                </span>
              </div>

              {/* Floating Pixel Price Tag */}
              <div className="absolute -right-3 top-6 z-20 pixel-box-sm bg-[#E6B84D] px-3 py-1.5 text-[#1C1917]">
                <span className="font-pixel-mono text-2xl font-bold leading-none tabular-nums">
                  ₹{activeCreature.price}
                </span>
              </div>

              {/* Pixel Measurement / Scale Markers on Left Edge */}
              <div
                className="hidden sm:flex flex-col justify-between items-end absolute -left-8 top-12 bottom-16 z-10 font-pixel-mono text-xs text-[#57534E] select-none"
                aria-hidden="true"
              >
                <span>┼ TOP</span>
                <span className="h-full border-r-2 border-dashed border-[#1C1917]/40 my-1" />
                <span>┼ PENS</span>
                <span className="h-full border-r-2 border-dashed border-[#1C1917]/40 my-1" />
                <span>┼ DESK</span>
              </div>

              {/* Main Pixel Window Stage Framing the Real Product */}
              <div className="pixel-box-lg bg-[#EFECE2] overflow-hidden">
                {/* Retro Window Title Bar */}
                <div className="bg-[#1C1917] text-[#F6F3EB] px-3.5 py-2 flex items-center justify-between border-b-[3px] border-[#1C1917]">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 bg-[#D95D39] inline-block" />
                    <span className="w-2.5 h-2.5 bg-[#E6B84D] inline-block" />
                    <span className="w-2.5 h-2.5 bg-[#4A6B53] inline-block" />
                    <span className="font-pixel-mono text-sm tracking-wider ml-1 text-[#F6F3EB]">
                      SPECIMEN: {activeCreature.name}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handlePokeCreature}
                    className="font-pixel-mono text-xs text-[#E6B84D] hover:underline cursor-pointer"
                  >
                    [POKE CREATURE]
                  </button>
                </div>

                {/* Real Product Image Stage with Floating Bob Animation */}
                <div
                  onClick={() => onSelectProduct(activeCreature)}
                  className="relative aspect-square bg-[#F6F3EB] p-5 flex items-center justify-center cursor-pointer group overflow-hidden"
                >
                  {/* Pixel Corner Crosshairs */}
                  <span
                    className="absolute top-3 left-3 w-3 h-3 border-t-2 border-l-2 border-[#1C1917]/40"
                    aria-hidden="true"
                  />
                  <span
                    className="absolute top-3 right-3 w-3 h-3 border-t-2 border-r-2 border-[#1C1917]/40"
                    aria-hidden="true"
                  />
                  <span
                    className="absolute bottom-3 left-3 w-3 h-3 border-b-2 border-l-2 border-[#1C1917]/40"
                    aria-hidden="true"
                  />
                  <span
                    className="absolute bottom-3 right-3 w-3 h-3 border-b-2 border-r-2 border-[#1C1917]/40"
                    aria-hidden="true"
                  />

                  <div className="w-full h-full animate-float-slow flex items-center justify-center">
                    <PixelImage
                      src={activeCreature.image}
                      alt={`${activeCreature.name} — ${activeCreature.personality}`}
                      className="w-full h-full object-cover border-2 border-[#1C1917] group-hover:scale-[1.03] transition-transform duration-200"
                    />
                  </div>

                  {/* Floating Mini Pixel Sprite Companion */}
                  <div
                    className="absolute bottom-4 right-4 pixel-box-sm bg-[#F6F3EB] p-1.5"
                    aria-hidden="true"
                  >
                    <PixelCreatureSprite
                      className="w-6 h-6"
                      color={activeCreature.accentHex}
                    />
                  </div>
                </div>

                {/* Stage Footer Bar: Quick Creature Switcher & Direct Action */}
                <div className="bg-[#EFECE2] border-t-[3px] border-[#1C1917] p-3.5 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-pixel-display text-sm text-[#1C1917] truncate">
                      {activeCreature.name}
                    </div>
                    <div className="font-pixel-body text-xs text-[#57534E] truncate">
                      {activeCreature.personality}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        sound.playAcquire();
                        onQuickAdd(activeCreature);
                      }}
                      className="pixel-btn-sm bg-[#4A6B53] hover:bg-[#3b5742] text-[#F6F3EB] font-pixel-display text-xs px-3 py-2 whitespace-nowrap"
                    >
                      + GRAB ONE
                    </button>
                  </div>
                </div>
              </div>

              {/* Creature Stage Selector Tabs */}
              <div className="mt-4 flex items-center justify-between gap-2">
                <span className="font-pixel-mono text-sm text-[#57534E]">
                  SWITCH DESK WEIRDO:
                </span>
                <div className="flex items-center gap-2">
                  {featuredCreatures.slice(0, 4).map((creature, idx) => (
                    <button
                      key={creature.id}
                      type="button"
                      onClick={() => {
                        sound.playBlip(580 + idx * 60, 0.04);
                        setActiveIndex(idx);
                        setPokedQuote(null);
                      }}
                      className={`pixel-btn-sm px-2.5 py-1 font-pixel-mono text-sm whitespace-nowrap ${
                        idx === activeIndex
                          ? 'bg-[#1C1917] text-[#F6F3EB]'
                          : 'bg-[#EFECE2] text-[#1C1917] hover:bg-[#E6B84D]'
                      }`}
                    >
                      0{idx + 1}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll to Meet the Creatures Prompt */}
        <div className="mt-12 pt-4 flex justify-center">
          <button
            type="button"
            onClick={() => {
              sound.playBlip(480, 0.04);
              onShopClick();
            }}
            className="group inline-flex items-center gap-2 font-pixel-display text-xs sm:text-sm text-[#1C1917] hover:text-[#D95D39] cursor-pointer py-2 px-4"
          >
            <span>SCROLL TO MEET THE CREATURES</span>
            <span className="font-pixel-mono text-lg animate-pixel-bounce inline-block">
              ↓
            </span>
          </button>
        </div>
      </div>
    </section>
  );
};
