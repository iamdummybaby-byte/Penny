import React, { useState, useEffect, useRef } from 'react';
import { Product, FAQ_ITEMS, HERO_DESK_IMAGE } from '../data/products';
import {
  PixelCreatureSprite,
  PixelChompSprite,
  PixelBlobSprite,
  PixelImage,
  PixelStar,
  PixelHeart,
} from './PixelSprites';
import { sound } from '../utils/sound';
import { trackEvent, trackCtaClick } from '../utils/analytics';

/* ============================================================================
   SECTION: WHY PENNY (3 Pixel Cards)
   ============================================================================ */
export const WhyPennySection: React.FC = () => {
  const cards = [
    {
      title: 'WEIRD',
      copy: 'Because boring desks are overrated.',
      accent: '#D95D39',
      sprite: <PixelCreatureSprite className="w-12 h-12 animate-pixel-bounce" color="#D95D39" />,
      tag: '01 / PERSONALITY',
    },
    {
      title: 'USEFUL',
      copy: 'They actually hold your pens. We promise.',
      accent: '#4A6B53',
      sprite: <PixelChompSprite className="w-12 h-12 animate-float-slow" />,
      tag: '02 / FUNCTION',
    },
    {
      title: 'COLLECTIBLE',
      copy: 'One creature is never enough.',
      accent: '#E6B84D',
      sprite: <PixelBlobSprite className="w-12 h-12 animate-pixel-bounce" />,
      tag: '03 / OBSESSION',
    },
  ];

  return (
    <section className="bg-[#EFECE2] border-b-[3px] border-[#1C1917] py-16 sm:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <div className="font-pixel-mono text-sm uppercase tracking-wider text-[#4A6B53]">
            THREE REASONS TO ADOPT
          </div>
          <h2 className="font-pixel-display text-2xl sm:text-4xl font-bold text-[#1C1917]">
            WHY PENNY?
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
          {cards.map((card) => (
            <div
              key={card.title}
              className="pixel-card bg-[#F6F3EB] p-6 sm:p-8 flex flex-col justify-between space-y-6"
            >
              <div className="flex items-center justify-between border-b-2 border-dashed border-[#1C1917]/20 pb-4">
                <span className="font-pixel-mono text-xs text-[#57534E]">
                  {card.tag}
                </span>
                <div className="pixel-box-sm bg-[#EFECE2] p-2.5">{card.sprite}</div>
              </div>

              <div className="space-y-2">
                <h3
                  className="font-pixel-display text-2xl font-bold text-[#1C1917]"
                  style={{ color: card.accent }}
                >
                  {card.title}
                </h3>
                <p className="font-pixel-body text-lg text-[#1C1917] leading-snug">
                  {card.copy}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

/* ============================================================================
   SECTION: HOW IT LOOKS ON YOUR DESK (Interactive Desk Scene)
   ============================================================================ */
interface DeskSceneProps {
  products: Product[];
  onSelectProduct: (product: Product) => void;
}

export const DeskSceneSection: React.FC<DeskSceneProps> = ({
  products,
  onSelectProduct,
}) => {
  const [activeHotspot, setActiveHotspot] = useState<string>('creature-1');

  const hotspots = [
    {
      id: 'creature-1',
      label: 'PENNY CREATURE #01',
      x: '68%',
      y: '46%',
      title: 'THE GREMLIN ON DUTY',
      detail: 'Sitting right beside your keyboard, holding 3 pens and silently judging your typos.',
      linkedSlug: 'the-gremlin',
    },
    {
      id: 'keyboard',
      label: 'MECHANICAL KEYBOARD',
      x: '42%',
      y: '72%',
      title: 'CLACKY KEYBOARD ZONE',
      detail: 'Every good keyboard setup needs a weird little desk companion within arm’s reach.',
    },
    {
      id: 'notebooks',
      label: 'SKETCHBOOK & PENS',
      x: '24%',
      y: '55%',
      title: 'DOTTED NOTEBOOKS & PENS',
      detail: 'No more pens rolling off the desk edge when you reach for your coffee.',
    },
    {
      id: 'creature-2',
      label: 'PENNY CREATURE #02',
      x: '78%',
      y: '58%',
      title: 'THE CHOMP GUARDING MARKERS',
      detail: 'Because one creature looks cute, and two looks like a curated studio.',
      linkedSlug: 'the-chomp',
    },
  ];

  const selectedSpot =
    hotspots.find((h) => h.id === activeHotspot) || hotspots[0];
  const linkedProduct = products.find((p) => p.slug === selectedSpot.linkedSlug);

  return (
    <section
      id="desk-section"
      className="bg-pixel-grid border-b-[3px] border-[#1C1917] py-16 sm:py-24 overflow-hidden"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="space-y-2">
            <div className="font-pixel-mono text-sm uppercase tracking-wider text-[#D95D39]">
              NATURAL HABITAT SIMULATION
            </div>
            <h2 className="font-pixel-display text-2xl sm:text-4xl font-bold text-[#1C1917]">
              HOW IT LOOKS ON YOUR DESK
            </h2>
            <p className="font-pixel-body text-lg text-[#57534E]">
              Imagine one living next to your keyboard, notebooks, and late-night coffee.
            </p>
          </div>
          <div className="font-pixel-mono text-xs text-[#57534E] pixel-box-sm bg-[#EFECE2] px-3 py-2">
            CLICK THE PIXEL MARKERS ON THE DESK TO INSPECT
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Interactive Desk Photograph Stage */}
          <div className="lg:col-span-8">
            <div className="pixel-box-lg bg-[#1C1917] p-2 sm:p-3 relative">
              <div className="relative aspect-video w-full overflow-hidden border-2 border-[#F6F3EB]">
                <PixelImage
                  src={HERO_DESK_IMAGE}
                  alt="Creative studio desk with mechanical keyboard, notebooks, pens, and PENNY creature pen holders"
                  className="w-full h-full object-cover"
                />

                {/* Interactive Pixel Hotspots */}
                {hotspots.map((spot, idx) => {
                  const isActive = spot.id === activeHotspot;
                  return (
                    <button
                      key={spot.id}
                      type="button"
                      onClick={() => {
                        sound.playBlip(600 + idx * 50, 0.04);
                        setActiveHotspot(spot.id);
                      }}
                      style={{ left: spot.x, top: spot.y }}
                      aria-label={`Inspect ${spot.label}`}
                      className={`-translate-x-1/2 -translate-y-1/2 absolute z-20 pixel-btn-sm px-2 py-1 font-pixel-mono text-xs flex items-center gap-1.5 whitespace-nowrap ${
                        isActive
                          ? 'bg-[#D95D39] text-[#F6F3EB] scale-110'
                          : 'bg-[#F6F3EB] text-[#1C1917] hover:bg-[#E6B84D]'
                      }`}
                    >
                      <span className="w-2 h-2 bg-current inline-block animate-pulse" />
                      <span>0{idx + 1}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Inspector Panel */}
          <div className="lg:col-span-4 space-y-5">
            <div className="pixel-box bg-[#F6F3EB] p-6 space-y-4">
              <div className="flex items-center justify-between border-b-2 border-[#1C1917] pb-2">
                <span className="font-pixel-mono text-xs text-[#D95D39] font-bold">
                  DESK INSPECTOR
                </span>
                <PixelCreatureSprite className="w-6 h-6" />
              </div>

              <h3 className="font-pixel-display text-lg font-bold text-[#1C1917]">
                {selectedSpot.title}
              </h3>

              <p className="font-pixel-body text-base text-[#57534E] leading-relaxed">
                {selectedSpot.detail}
              </p>

              {linkedProduct && (
                <div className="pixel-box-sm bg-[#EFECE2] p-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-12 h-12 border border-[#1C1917] shrink-0 overflow-hidden bg-[#F6F3EB]">
                      <PixelImage
                        src={linkedProduct.image}
                        alt={linkedProduct.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="min-w-0">
                      <div className="font-pixel-display text-xs font-bold text-[#1C1917] truncate">
                        {linkedProduct.name}
                      </div>
                      <div className="font-pixel-mono text-base font-bold text-[#D95D39]">
                        ₹{linkedProduct.price}
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      sound.playBlip(680, 0.04);
                      onSelectProduct(linkedProduct);
                    }}
                    className="pixel-btn-sm bg-[#1C1917] text-[#F6F3EB] hover:bg-[#D95D39] px-3 py-1.5 font-pixel-mono text-xs whitespace-nowrap"
                  >
                    VIEW →
                  </button>
                </div>
              )}

              {/* Desk Setup Checklist */}
              <div className="pt-2 border-t-2 border-dashed border-[#1C1917]/20 space-y-1.5 font-pixel-mono text-xs text-[#57534E]">
                <div>[✓] MECHANICAL KEYBOARD</div>
                <div>[✓] DOTTED NOTEBOOK & PENS</div>
                <div>[✓] STACK OF UNREAD DESIGN BOOKS</div>
                <div className="text-[#1C1917] font-bold">
                  [✓] AT LEAST ONE PENNY CREATURE
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

/* ============================================================================
   SECTION: COLLECT THEM ALL (Horizontal Scrolling Gallery)
   ============================================================================ */
interface CollectSectionProps {
  products: Product[];
  onSelectProduct: (product: Product) => void;
}

export const CollectThemAllSection: React.FC<CollectSectionProps> = ({
  products,
  onSelectProduct,
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const scrollByAmount = (dir: 'left' | 'right') => {
    sound.playBlip(dir === 'left' ? 480 : 620, 0.04);
    if (!scrollContainerRef.current) return;
    const offset = dir === 'left' ? -340 : 340;
    scrollContainerRef.current.scrollBy({ left: offset, behavior: 'smooth' });
  };

  return (
    <section
      id="collect-section"
      className="bg-[#EFECE2] border-b-[3px] border-[#1C1917] py-16 sm:py-24 overflow-hidden"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div className="space-y-2">
            <div className="font-pixel-mono text-sm uppercase tracking-wider text-[#4A6B53]">
              THE FULL LINEUP
            </div>
            <h2
              className="font-pixel-display text-2xl sm:text-4xl font-bold text-[#1C1917] leading-tight"
              style={{ textWrap: 'balance' }}
            >
              ONE IS CUTE.
              <span className="block text-[#D95D39]">THREE IS A COLLECTION.</span>
            </h2>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => scrollByAmount('left')}
              aria-label="Scroll collection left"
              className="pixel-btn-sm bg-[#F6F3EB] hover:bg-[#E6B84D] text-[#1C1917] px-4 py-2 font-pixel-mono text-lg"
            >
              ← PREV
            </button>
            <button
              type="button"
              onClick={() => scrollByAmount('right')}
              aria-label="Scroll collection right"
              className="pixel-btn-sm bg-[#1C1917] hover:bg-[#D95D39] text-[#F6F3EB] px-4 py-2 font-pixel-mono text-lg"
            >
              NEXT →
            </button>
          </div>
        </div>

        {/* Horizontal Scroll Track */}
        <div
          ref={scrollContainerRef}
          className="flex gap-6 overflow-x-auto pb-6 pt-2 snap-x snap-mandatory scrollbar-thin"
        >
          {products.map((creature, index) => (
            <div
              key={creature.id}
              onClick={() => {
                sound.playBlip(640, 0.04);
                onSelectProduct(creature);
              }}
              className="snap-start shrink-0 w-72 sm:w-80 pixel-card bg-[#F6F3EB] p-4 flex flex-col justify-between cursor-pointer group"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between font-pixel-mono text-xs text-[#57534E]">
                  <span>SERIES #0{index + 1}</span>
                  <span>WEIRDNESS: {creature.weirdnessScore}/100</span>
                </div>

                <div className="aspect-square w-full border-2 border-[#1C1917] bg-[#EFECE2] overflow-hidden p-3">
                  <PixelImage
                    src={creature.image}
                    alt={creature.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                  />
                </div>

                {/* Tiny Personality Quote Bubble */}
                <div className="pixel-box-sm bg-[#EFECE2] px-3 py-2">
                  <p className="font-pixel-display text-xs text-[#1C1917]">
                    &ldquo;{creature.speechBubble}&rdquo;
                  </p>
                </div>
              </div>

              <div className="pt-4 mt-4 border-t-2 border-[#1C1917] flex items-baseline justify-between">
                <h3 className="font-pixel-display text-base font-bold text-[#1C1917] group-hover:text-[#D95D39]">
                  {creature.name}
                </h3>
                <span className="font-pixel-mono text-2xl font-bold text-[#1C1917] tabular-nums">
                  ₹{creature.price}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

/* ============================================================================
   SECTION: ABOUT PENNY (Dark Charcoal CRT Editorial Section)
   ============================================================================ */
export const AboutPennySection: React.FC = () => {
  const [eyePos, setEyePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMove = (e: MouseEvent) => {
      const x = Math.max(-4, Math.min(4, (e.clientX / window.innerWidth - 0.5) * 10));
      const y = Math.max(-4, Math.min(4, (e.clientY / window.innerHeight - 0.5) * 10));
      setEyePos({ x, y });
    };
    window.addEventListener('mousemove', handleMove, { passive: true });
    return () => window.removeEventListener('mousemove', handleMove);
  }, []);

  return (
    <section
      id="about-section"
      className="bg-pixel-dark-grid text-[#F6F3EB] border-b-[3px] border-[#1C1917] py-20 sm:py-28 relative overflow-hidden"
    >
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="pixel-box-dark p-8 sm:p-12 space-y-8">
          {/* Interactive Staring Creature Eyes Header */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-b-2 border-[#F6F3EB]/20 pb-6">
            <div className="font-pixel-mono text-sm uppercase tracking-widest text-[#E6B84D]">
              MANIFESTO · EST. 2026
            </div>

            {/* Pixel Eyes that watch you procrastinate */}
            <div
              className="flex items-center gap-3 bg-[#181715] border-2 border-[#F6F3EB] px-4 py-2"
              aria-label="Pixel creature eyes watching your cursor"
            >
              <span className="font-pixel-mono text-xs text-[#F6F3EB]/70 mr-1">
                CURRENTLY STARING AT YOU:
              </span>
              {[0, 1].map((eye) => (
                <div
                  key={eye}
                  className="w-6 h-6 bg-[#F6F3EB] flex items-center justify-center relative"
                >
                  <div
                    className="w-2.5 h-2.5 bg-[#181715] transition-transform duration-75"
                    style={{
                      transform: `translate(${eyePos.x}px, ${eyePos.y}px)`,
                    }}
                  />
                </div>
              ))}
            </div>
          </div>

          <h2
            className="font-pixel-display text-2xl sm:text-4xl lg:text-5xl font-bold text-[#F6F3EB] leading-tight tracking-wide"
            style={{ textWrap: 'balance' }}
          >
            PENNY IS A LITTLE WEIRD.{' '}
            <span className="text-[#E6B84D]">INTENTIONALLY.</span>
          </h2>

          <div className="space-y-4 font-pixel-body text-lg sm:text-xl text-[#F6F3EB]/90 leading-relaxed max-w-2xl">
            <p>
              PENNY exists to turn ordinary desk objects into things you actually
              enjoy looking at.
            </p>
            <p>
              The brand believes functional products don&apos;t have to look boring.
            </p>
            <div className="py-3 space-y-2 font-pixel-display text-sm sm:text-base text-[#E6B84D]">
              <p>A pen holder can be useful.</p>
              <p>It can also have a face.</p>
              <p>It can also stare at you while you procrastinate.</p>
            </div>
            <p className="font-pixel-display text-xl sm:text-2xl text-[#D95D39] pt-2">
              That&apos;s PENNY.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

/* ============================================================================
   SECTION: FAQ (Expandable Pixel Accordion)
   ============================================================================ */
export const FaqSection: React.FC = () => {
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  return (
    <section
      id="faq-section"
      className="bg-pixel-grid border-b-[3px] border-[#1C1917] py-16 sm:py-24"
    >
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        <div className="text-center space-y-2">
          <div className="font-pixel-mono text-sm uppercase tracking-wider text-[#D95D39]">
            QUESTIONS & SUSPICIONS
          </div>
          <h2 className="font-pixel-display text-2xl sm:text-4xl font-bold text-[#1C1917]">
            FREQUENTLY ASKED QUESTIONS
          </h2>
        </div>

        <div className="space-y-3">
          {FAQ_ITEMS.map((item, idx) => {
            const isOpen = openIdx === idx;
            return (
              <div
                key={item.q}
                className="pixel-box-sm bg-[#F6F3EB] overflow-hidden"
              >
                <button
                  type="button"
                  onClick={() => {
                    sound.playBlip(isOpen ? 440 : 620, 0.04);
                    if (!isOpen) {
                      trackEvent({
                        type: 'faq_open',
                        page: 'faq',
                        section: 'faq-section',
                        elementName: item.q,
                        heatmapZone: 'faq-section',
                      });
                    }
                    setOpenIndex(isOpen ? null : idx);
                  }}
                  aria-expanded={isOpen}
                  className="w-full px-5 py-4 text-left flex items-center justify-between gap-4 hover:bg-[#EFECE2] cursor-pointer transition-colors"
                >
                  <span className="font-pixel-display text-sm sm:text-base font-bold text-[#1C1917]">
                    {item.q}
                  </span>
                  <span
                    className={`font-pixel-mono text-xl text-[#D95D39] shrink-0 transition-transform duration-150 ${
                      isOpen ? 'rotate-90' : ''
                    }`}
                  >
                    ▶
                  </span>
                </button>
                {isOpen && (
                  <div className="px-5 pb-5 pt-2 border-t-2 border-dashed border-[#1C1917]/20 bg-[#EFECE2]/60 font-pixel-body text-base text-[#57534E] leading-relaxed">
                    {item.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

/* ============================================================================
   SECTION: DARK PIXEL FOOTER
   ============================================================================ */
interface FooterProps {
  onNavigateHome: (sectionId?: string) => void;
  onShowPolicyModal: (policyType: 'shipping' | 'returns' | 'contact' | 'privacy') => void;
  onOpenAdmin?: () => void;
}

export const Footer: React.FC<FooterProps> = ({
  onNavigateHome,
  onShowPolicyModal,
  onOpenAdmin,
}) => {
  const [soundEnabled, setSoundEnabled] = useState(sound.enabled);

  const toggleAudio = () => {
    sound.enabled = !soundEnabled;
    setSoundEnabled(sound.enabled);
    if (sound.enabled) {
      sound.playBlip(680, 0.05);
    }
  };

  return (
    <footer className="bg-[#181715] text-[#F6F3EB] pt-16 pb-10 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 pb-12 border-b-2 border-[#F6F3EB]/15">
          {/* Column 1: Brand Identity */}
          <div className="md:col-span-4 space-y-4">
            <div className="font-pixel-arcade text-2xl text-[#F6F3EB] tracking-tight">
              PENNY
            </div>
            <p className="font-pixel-display text-sm text-[#E6B84D]">
              Tiny creatures. Big desk energy.
            </p>
            <p className="font-pixel-body text-sm text-[#F6F3EB]/70 max-w-xs leading-relaxed">
              We make weird little creatures that hold your pens. Collect responsibly.
            </p>
            <div className="pt-2">
              <button
                type="button"
                onClick={toggleAudio}
                className="pixel-btn-sm border-[#F6F3EB] bg-[#23211E] text-[#F6F3EB] px-3 py-1.5 font-pixel-mono text-xs uppercase cursor-pointer"
              >
                8-BIT SFX: {soundEnabled ? 'ON [♪]' : 'MUTED [×]'}
              </button>
            </div>
          </div>

          {/* Column 2: Navigation & Policies */}
          <div className="md:col-span-4 grid grid-cols-2 gap-6">
            <div className="space-y-3">
              <div className="font-pixel-mono text-sm uppercase text-[#E6B84D]">
                NAVIGATION
              </div>
              <ul className="space-y-2 font-pixel-display text-xs">
                <li>
                  <button
                    type="button"
                    onClick={() => onNavigateHome('shop-section')}
                    className="hover:text-[#D95D39] cursor-pointer"
                  >
                    Shop
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => onNavigateHome('collect-section')}
                    className="hover:text-[#D95D39] cursor-pointer"
                  >
                    Creatures
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => onNavigateHome('about-section')}
                    className="hover:text-[#D95D39] cursor-pointer"
                  >
                    About
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => onNavigateHome('faq-section')}
                    className="hover:text-[#D95D39] cursor-pointer"
                  >
                    FAQ
                  </button>
                </li>
              </ul>
            </div>

            <div className="space-y-3">
              <div className="font-pixel-mono text-sm uppercase text-[#E6B84D]">
                INFO & SUPPORT
              </div>
              <ul className="space-y-2 font-pixel-display text-xs">
                <li>
                  <button
                    type="button"
                    onClick={() => onShowPolicyModal('shipping')}
                    className="hover:text-[#D95D39] cursor-pointer"
                  >
                    Shipping
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => onShowPolicyModal('returns')}
                    className="hover:text-[#D95D39] cursor-pointer"
                  >
                    Returns
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => onShowPolicyModal('privacy')}
                    className="hover:text-[#D95D39] cursor-pointer"
                  >
                    Privacy Policy
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => onShowPolicyModal('contact')}
                    className="hover:text-[#D95D39] cursor-pointer"
                  >
                    Contact
                  </button>
                </li>
              </ul>
            </div>
          </div>

          {/* Column 3: PENNY CLUB TERMINAL */}
          <div className="md:col-span-4 space-y-4">
            <div className="font-pixel-display text-sm uppercase text-[#E6B84D] flex items-center gap-2">
              <PixelStar className="w-4 h-4" />
              <span>PENNY CLUB TERMINAL</span>
            </div>
            <p className="font-pixel-body text-sm text-[#F6F3EB]/80">
              Secret underground society for people who like strange desk creatures.
            </p>
            <button
              type="button"
              onClick={() => {
                sound.playBlip(640, 0.04);
                trackCtaClick(
                  'JOIN THE PENNY CLUB',
                  'footer',
                  'home',
                  'penny-club-section'
                );
                onNavigateHome('penny-club-section');
              }}
              className="bg-[#D95D39] hover:bg-[#E6B84D] hover:text-[#1C1917] text-[#F6F3EB] border-2 border-[#F6F3EB] px-5 py-3 font-pixel-display text-xs uppercase cursor-pointer transition-colors whitespace-nowrap"
            >
              APPLY FOR MEMBERSHIP →
            </button>
          </div>
        </div>

        {/* Tiny Pixel Creatures Parading Along the Bottom Border + Subtle Admin Entry */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-pixel-mono text-[#F6F3EB]/60">
          <div>© 2026 PENNY. All rights reserved.</div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3" aria-hidden="true">
              <PixelCreatureSprite className="w-6 h-6 animate-pixel-bounce" color="#4A6B53" />
              <PixelChompSprite className="w-6 h-6 animate-float-slow" />
              <PixelBlobSprite className="w-6 h-6 animate-pixel-bounce" />
              <PixelCreatureSprite className="w-6 h-6 animate-float-slow" color="#D95D39" />
            </div>
            {onOpenAdmin && (
              <button
                type="button"
                onClick={() => {
                  sound.playBlip(520, 0.03);
                  onOpenAdmin();
                }}
                title="PENNY Admin Telemetry"
                className="font-pixel-mono text-[11px] text-[#F6F3EB]/30 hover:text-[#E6B84D] transition-colors cursor-pointer ml-2 select-none"
              >
                ⚙ ADMIN
              </button>
            )}
          </div>
        </div>
      </div>
    </footer>
  );
};
