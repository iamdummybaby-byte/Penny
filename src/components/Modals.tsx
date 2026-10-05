import React, { useState, useEffect, useRef } from 'react';
import { Product } from '../data/products';
import { PixelCreatureSprite, PixelImage, PixelSearchIcon } from './PixelSprites';
import { sound } from '../utils/sound';
import { FORMSPREE_ENDPOINT, submitToFormspree } from '../utils/formspree';

/* ============================================================================
   PIXEL SEARCH MODAL
   ============================================================================ */
interface SearchModalProps {
  isOpen: boolean;
  products: Product[];
  onClose: () => void;
  onSelectProduct: (product: Product) => void;
  onQuickAdd: (product: Product) => void;
}

export const SearchModal: React.FC<SearchModalProps> = ({
  isOpen,
  products,
  onClose,
  onSelectProduct,
  onQuickAdd,
}) => {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const trimmed = query.trim().toLowerCase();
  const results = products.filter((p) => {
    if (!trimmed) return true;
    return (
      p.name.toLowerCase().includes(trimmed) ||
      p.personality.toLowerCase().includes(trimmed) ||
      p.category.toLowerCase().includes(trimmed) ||
      p.tags.some((t) => t.toLowerCase().includes(trimmed))
    );
  });

  return (
    <div
      className="fixed inset-0 z-50 bg-[#181715]/75 backdrop-blur-xs flex items-start justify-center p-4 pt-16 sm:pt-24"
      onClick={onClose}
    >
      <div
        className="pixel-box-lg bg-[#F6F3EB] w-full max-w-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Title Bar */}
        <div className="bg-[#1C1917] text-[#F6F3EB] px-4 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2 font-pixel-mono text-sm">
            <PixelSearchIcon className="w-4 h-4 text-[#E6B84D]" />
            <span>PENNY CREATURE FINDER</span>
          </div>
          <button
            type="button"
            onClick={() => {
              sound.playBlip(440, 0.04);
              onClose();
            }}
            className="pixel-btn-sm bg-[#D95D39] text-[#F6F3EB] px-2.5 py-0.5 font-pixel-mono text-xs"
          >
            [ESC / ×]
          </button>
        </div>

        {/* Search Input */}
        <div className="p-4 sm:p-6 bg-[#EFECE2] border-b-[3px] border-[#1C1917]">
          <div className="relative">
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="SEARCH FOR SOMETHING WEIRD..."
              aria-label="Search for something weird"
              className="pixel-input w-full px-4 py-3.5 font-pixel-display text-sm sm:text-base text-[#1C1917] placeholder:text-[#57534E]"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 font-pixel-mono text-xs text-[#57534E] hover:text-[#1C1917] cursor-pointer"
              >
                [CLEAR]
              </button>
            )}
          </div>
        </div>

        {/* Search Results */}
        <div className="max-h-[60vh] overflow-y-auto p-4 sm:p-6 space-y-3">
          {results.length > 0 ? (
            results.map((item) => (
              <div
                key={item.id}
                onClick={() => {
                  sound.playBlip(620, 0.04);
                  onSelectProduct(item);
                  onClose();
                }}
                className="pixel-box-sm bg-[#F6F3EB] hover:bg-[#EFECE2] p-3 flex items-center justify-between gap-4 cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-14 h-14 border-2 border-[#1C1917] bg-[#EFECE2] shrink-0 overflow-hidden">
                    <PixelImage
                      src={item.image}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-pixel-display text-sm sm:text-base font-bold text-[#1C1917] truncate">
                      {item.name}
                    </h3>
                    <p className="font-pixel-body text-xs text-[#57534E] truncate">
                      &ldquo;{item.personality}&rdquo;
                    </p>
                    <div className="font-pixel-mono text-xl font-bold text-[#D95D39] tabular-nums">
                      ₹{item.price}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    sound.playAcquire();
                    onQuickAdd(item);
                  }}
                  className="pixel-btn-sm bg-[#1C1917] hover:bg-[#4A6B53] text-[#F6F3EB] px-3 py-2 font-pixel-display text-xs whitespace-nowrap shrink-0"
                >
                  + QUICK ADD
                </button>
              </div>
            ))
          ) : (
            <div className="py-12 text-center space-y-3">
              <PixelCreatureSprite className="w-12 h-12 mx-auto animate-pixel-bounce" color="#D95D39" />
              <div className="font-pixel-display text-xl font-bold text-[#1C1917]">
                NOTHING FOUND.
              </div>
              <p className="font-pixel-body text-base text-[#57534E]">
                Try searching for a creature instead.
              </p>
              <div className="pt-2 flex flex-wrap justify-center gap-2">
                {['Gremlin', 'Chomp', 'Blob', 'Muncher', 'Weirdo'].map((term) => (
                  <button
                    key={term}
                    type="button"
                    onClick={() => setQuery(term)}
                    className="pixel-btn-sm bg-[#EFECE2] hover:bg-[#E6B84D] text-[#1C1917] px-2.5 py-1 font-pixel-mono text-xs"
                  >
                    {term.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/* ============================================================================
   QUICK VIEW MODAL
   ============================================================================ */
interface QuickViewModalProps {
  product: Product | null;
  onClose: () => void;
  onAddToCart: (product: Product, quantity: number) => void;
  onOpenFullProfile: (product: Product) => void;
}

export const QuickViewModal: React.FC<QuickViewModalProps> = ({
  product,
  onClose,
  onAddToCart,
  onOpenFullProfile,
}) => {
  const [qty, setQty] = useState(1);

  useEffect(() => {
    setQty(1);
  }, [product]);

  if (!product) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-[#181715]/75 backdrop-blur-xs flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="pixel-box-lg bg-[#F6F3EB] w-full max-w-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-[#1C1917] text-[#F6F3EB] px-4 py-2.5 flex items-center justify-between">
          <span className="font-pixel-mono text-sm">
            QUICK VIEW // {product.name}
          </span>
          <button
            type="button"
            onClick={() => {
              sound.playBlip(440, 0.04);
              onClose();
            }}
            className="pixel-btn-sm bg-[#D95D39] text-[#F6F3EB] px-2.5 py-0.5 font-pixel-mono text-xs"
          >
            [CLOSE ×]
          </button>
        </div>

        <div className="p-6 grid grid-cols-1 sm:grid-cols-12 gap-6 items-center">
          <div className="sm:col-span-6 aspect-square border-2 border-[#1C1917] bg-[#EFECE2] p-3 relative">
            <PixelImage
              src={product.image}
              alt={product.name}
              className="w-full h-full object-cover"
            />
            <div className="absolute bottom-3 left-3 pixel-box-sm bg-[#F6F3EB] px-2.5 py-1">
              <span className="font-pixel-display text-[11px] text-[#1C1917]">
                &ldquo;{product.speechBubble}&rdquo;
              </span>
            </div>
          </div>

          <div className="sm:col-span-6 space-y-4">
            <div>
              <div className="font-pixel-mono text-xs uppercase text-[#4A6B53]">
                {product.availability} · {product.category}
              </div>
              <h3 className="font-pixel-display text-2xl font-bold text-[#1C1917]">
                {product.name}
              </h3>
              <div className="font-pixel-mono text-3xl font-bold text-[#D95D39] tabular-nums">
                ₹{product.price}
              </div>
            </div>

            <p className="font-pixel-body text-sm text-[#57534E] leading-relaxed">
              {product.description}
            </p>

            {/* Quantity & Add */}
            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                className="pixel-btn-sm bg-[#EFECE2] px-3 py-2 font-pixel-mono text-base font-bold"
              >
                [ − ]
              </button>
              <span className="pixel-box-sm bg-[#FFFFFF] px-4 py-1.5 font-pixel-mono text-lg font-bold tabular-nums">
                {qty}
              </span>
              <button
                type="button"
                onClick={() => setQty((q) => q + 1)}
                className="pixel-btn-sm bg-[#EFECE2] px-3 py-2 font-pixel-mono text-base font-bold"
              >
                [ + ]
              </button>
            </div>

            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  sound.playAcquire();
                  onAddToCart(product, qty);
                  onClose();
                }}
                className="w-full pixel-btn-sm bg-[#1C1917] hover:bg-[#D95D39] text-[#F6F3EB] py-3 font-pixel-display text-xs uppercase"
              >
                ADD TO CART — ₹{product.price * qty}
              </button>
              <button
                type="button"
                onClick={() => {
                  sound.playBlip(640, 0.04);
                  onOpenFullProfile(product);
                  onClose();
                }}
                className="w-full pixel-btn-sm bg-[#EFECE2] hover:bg-[#E6B84D] text-[#1C1917] py-2.5 font-pixel-display text-xs uppercase"
              >
                VIEW FULL CREATURE PROFILE →
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ============================================================================
   POLICY / CONTACT INFO MODAL
   ============================================================================ */
interface PolicyModalProps {
  policy: 'shipping' | 'returns' | 'contact' | 'privacy' | null;
  onClose: () => void;
}

export const PolicyModal: React.FC<PolicyModalProps> = ({ policy, onClose }) => {
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactMessage, setContactMessage] = useState('');
  const [contactStatus, setContactStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');

  useEffect(() => {
    setContactStatus('idle');
    setContactName('');
    setContactEmail('');
    setContactMessage('');
  }, [policy]);

  if (!policy) return null;

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactName.trim() || !contactEmail.trim() || !contactMessage.trim()) return;
    setContactStatus('sending');
    sound.playBlip(580, 0.04);
    const result = await submitToFormspree({
      _subject: `PENNY Studio Inquiry from ${contactName.trim()}`,
      form_type: 'CONTACT_INQUIRY',
      name: contactName.trim(),
      email: contactEmail.trim(),
      message: contactMessage.trim(),
    });
    if (result.ok) {
      sound.playAcquire();
      setContactStatus('sent');
    } else {
      sound.playRelease();
      setContactStatus('error');
    }
  };

  const contentMap = {
    shipping: {
      title: 'SHIPPING POLICY',
      body: [
        'We ship PENNY creatures across all serviceable PIN codes in India.',
        'Dispatch time: 24–48 hours from our studio.',
        'Standard Delivery: ₹49 flat rate (FREE on orders of ₹799 or more).',
        'Estimated transit: 3–5 business days for metro cities, 5–7 days elsewhere.',
      ],
    },
    returns: {
      title: 'RETURNS & REPLACEMENTS',
      body: [
        'Every creature is inspected before entering its box.',
        'If your creature arrives damaged in transit, reach out within 7 days with an unboxing photo for an immediate free replacement or full refund.',
      ],
    },
    contact: {
      title: 'TALK TO THE PENNY STUDIO',
      body: [
        'Got a question about a creature, bulk studio orders, or collaborations?',
        'Send us a direct message below and our studio team will get back to you.',
        'Operating Hours: Mon–Sat, 10:00 AM – 7:00 PM IST',
      ],
    },
    privacy: {
      title: 'PRIVACY POLICY',
      body: [
        'PENNY collects only the details you explicitly share for orders or PENNY Club membership (name/alias, country, delivery address for orders, and contact info).',
        'We never sell, rent, or trade your personal data to third parties or data brokers.',
        'Your details are used strictly for order updates, new creature drop alerts, and occasional club dispatches.',
        'You can request deletion of your membership record at any time through our Contact form.',
      ],
    },
  };

  const active = contentMap[policy];

  return (
    <div
      className="fixed inset-0 z-50 bg-[#181715]/75 backdrop-blur-xs flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="pixel-box-lg bg-[#F6F3EB] w-full max-w-md overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-[#1C1917] text-[#F6F3EB] px-4 py-2.5 flex items-center justify-between">
          <span className="font-pixel-mono text-sm">{active.title}</span>
          <button
            type="button"
            onClick={onClose}
            className="pixel-btn-sm bg-[#D95D39] text-[#F6F3EB] px-2.5 py-0.5 font-pixel-mono text-xs"
          >
            [×]
          </button>
        </div>
        <div className="p-6 space-y-3 font-pixel-body text-base text-[#1C1917]">
          {active.body.map((line, i) => (
            <p key={i} className="leading-relaxed">
              • {line}
            </p>
          ))}

          {policy === 'contact' && (
            <div className="pt-3 border-t-2 border-dashed border-[#1C1917]/25">
              {contactStatus === 'sent' ? (
                <div className="pixel-box-sm bg-[#EFECE2] p-4 text-center space-y-2">
                  <div className="font-pixel-display text-xs font-bold text-[#4A6B53]">
                    MESSAGE RECEIVED BY THE CREATURES!
                  </div>
                  <p className="font-pixel-body text-xs text-[#57534E]">
                    Your message has been logged in the PENNY studio terminal.
                  </p>
                </div>
              ) : (
                <form
                  action={FORMSPREE_ENDPOINT}
                  method="POST"
                  onSubmit={handleContactSubmit}
                  className="space-y-3"
                >
                  <input type="hidden" name="form_type" value="CONTACT_INQUIRY" />
                  <div>
                    <label className="block font-pixel-mono text-xs text-[#1C1917] mb-1">
                      YOUR NAME *
                    </label>
                    <input
                      type="text"
                      name="name"
                      required
                      value={contactName}
                      onChange={(e) => setContactName(e.target.value)}
                      placeholder="Type your name..."
                      className="pixel-input w-full px-3 py-2 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block font-pixel-mono text-xs text-[#1C1917] mb-1">
                      YOUR EMAIL *
                    </label>
                    <input
                      type="email"
                      name="email"
                      required
                      value={contactEmail}
                      onChange={(e) => setContactEmail(e.target.value)}
                      placeholder="you@desk.in"
                      className="pixel-input w-full px-3 py-2 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block font-pixel-mono text-xs text-[#1C1917] mb-1">
                      MESSAGE *
                    </label>
                    <textarea
                      name="message"
                      required
                      rows={3}
                      value={contactMessage}
                      onChange={(e) => setContactMessage(e.target.value)}
                      placeholder="Ask about a creature or order..."
                      className="pixel-input w-full px-3 py-2 text-xs"
                    />
                  </div>
                  {contactStatus === 'error' && (
                    <p className="font-pixel-mono text-xs text-[#D95D39]">
                      ! Could not send message. Please try again.
                    </p>
                  )}
                  <button
                    type="submit"
                    disabled={contactStatus === 'sending'}
                    className="w-full pixel-btn-sm bg-[#D95D39] hover:bg-[#c04c2b] text-[#F6F3EB] py-2.5 font-pixel-display text-xs uppercase"
                  >
                    {contactStatus === 'sending' ? 'DISPATCHING...' : 'SEND MESSAGE →'}
                  </button>
                </form>
              )}
            </div>
          )}

          <div className="pt-2">
            <button
              type="button"
              onClick={onClose}
              className="w-full pixel-btn-sm bg-[#1C1917] text-[#F6F3EB] py-2.5 font-pixel-display text-xs"
            >
              CLOSE
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
