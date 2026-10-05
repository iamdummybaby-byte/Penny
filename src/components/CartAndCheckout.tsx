import React, { useState } from 'react';
import { Product } from '../data/products';
import {
  PixelCreatureSprite,
  PixelChompSprite,
  PixelImage,
  PixelStar,
  PixelHeart,
} from './PixelSprites';
import { sound } from '../utils/sound';
import { FORMSPREE_ENDPOINT, submitToFormspree } from '../utils/formspree';

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface OrderRecord {
  orderNumber: string;
  items: CartItem[];
  subtotal: number;
  shipping: number;
  total: number;
  customer: {
    email: string;
    phone: string;
    fullName: string;
    address: string;
    city: string;
    state: string;
    pincode: string;
    deliveryMethod: 'standard' | 'express';
    paymentMethod: 'upi' | 'card' | 'cod';
  };
}

/* ============================================================================
   SLIDE-IN PIXEL CART DRAWER ("YOUR CREATURES")
   ============================================================================ */
interface CartDrawerProps {
  isOpen: boolean;
  items: CartItem[];
  onClose: () => void;
  onUpdateQty: (productId: string, delta: number) => void;
  onRemoveItem: (productId: string) => void;
  onProceedToCheckout: () => void;
  onSelectProduct: (product: Product) => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  items,
  onClose,
  onUpdateQty,
  onRemoveItem,
  onProceedToCheckout,
  onSelectProduct,
}) => {
  if (!isOpen) return null;

  const subtotal = items.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );
  const freeShippingThreshold = 799;
  const shipping = subtotal === 0 ? 0 : subtotal >= freeShippingThreshold ? 0 : 49;
  const total = subtotal + shipping;
  const amountForFreeShipping = Math.max(0, freeShippingThreshold - subtotal);

  return (
    <div
      className="fixed inset-0 z-50 bg-[#181715]/70 backdrop-blur-xs flex justify-end"
      onClick={onClose}
    >
      <aside
        className="w-full max-w-md bg-[#F6F3EB] border-l-[3px] border-[#1C1917] h-full flex flex-col justify-between shadow-[-8px_0_0_#1C1917]"
        onClick={(e) => e.stopPropagation()}
        aria-label="Shopping Cart"
      >
        {/* Drawer Header */}
        <div className="bg-[#1C1917] text-[#F6F3EB] px-5 py-4 flex items-center justify-between border-b-[3px] border-[#1C1917]">
          <div className="flex items-center gap-2.5">
            <PixelCreatureSprite className="w-6 h-6 animate-pixel-bounce" />
            <h2 className="font-pixel-display text-base sm:text-lg font-bold tracking-wider">
              YOUR CREATURES
            </h2>
          </div>
          <button
            type="button"
            onClick={() => {
              sound.playBlip(440, 0.04);
              onClose();
            }}
            className="pixel-btn-sm bg-[#D95D39] text-[#F6F3EB] px-2.5 py-1 font-pixel-mono text-xs"
          >
            [CLOSE ×]
          </button>
        </div>

        {/* Free Shipping Pixel Meter */}
        {items.length > 0 && (
          <div className="bg-[#EFECE2] border-b-[3px] border-[#1C1917] px-5 py-3 space-y-1.5">
            <div className="font-pixel-mono text-xs text-[#1C1917] flex justify-between">
              {amountForFreeShipping > 0 ? (
                <span>ADD ₹{amountForFreeShipping} MORE FOR FREE SHIPPING!</span>
              ) : (
                <span className="text-[#4A6B53] font-bold">
                  ★ FREE INDIA SHIPPING UNLOCKED!
                </span>
              )}
              <span>
                {Math.min(100, Math.round((subtotal / freeShippingThreshold) * 100))}%
              </span>
            </div>
            <div className="w-full h-3 bg-[#F6F3EB] border-2 border-[#1C1917] p-0.5">
              <div
                className="h-full bg-[#4A6B53] transition-all duration-200"
                style={{
                  width: `${Math.min(100, (subtotal / freeShippingThreshold) * 100)}%`,
                }}
              />
            </div>
          </div>
        )}

        {/* Cart Items List */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center py-12 space-y-4">
              <PixelChompSprite className="w-16 h-16 animate-float-slow" />
              <div className="space-y-1">
                <h3 className="font-pixel-display text-lg font-bold text-[#1C1917]">
                  NO CREATURES ACQUIRED YET.
                </h3>
                <p className="font-pixel-body text-sm text-[#57534E] max-w-xs">
                  Your desk is currently unprotected and your pens are rolling around loose.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  sound.playBlip(600, 0.04);
                  onClose();
                }}
                className="pixel-btn bg-[#D95D39] text-[#F6F3EB] font-pixel-display text-xs px-5 py-3"
              >
                KEEP SHOPPING
              </button>
            </div>
          ) : (
            items.map(({ product, quantity }) => (
              <div
                key={product.id}
                className="pixel-box-sm bg-[#EFECE2] p-3.5 flex gap-3.5 items-center"
              >
                <div
                  onClick={() => {
                    onSelectProduct(product);
                    onClose();
                  }}
                  className="w-20 h-20 border-2 border-[#1C1917] bg-[#F6F3EB] shrink-0 overflow-hidden cursor-pointer"
                >
                  <PixelImage
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                </div>

                <div className="flex-1 min-w-0 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        onSelectProduct(product);
                        onClose();
                      }}
                      className="font-pixel-display text-sm font-bold text-[#1C1917] hover:text-[#D95D39] text-left truncate cursor-pointer"
                    >
                      {product.name}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        sound.playRelease();
                        onRemoveItem(product.id);
                      }}
                      aria-label={`Remove ${product.name}`}
                      className="font-pixel-mono text-xs text-[#57534E] hover:text-[#D95D39] cursor-pointer shrink-0"
                    >
                      [REMOVE]
                    </button>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    {/* Pixel Stepper */}
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          sound.playBlip(460, 0.03);
                          onUpdateQty(product.id, -1);
                        }}
                        className="pixel-btn-sm bg-[#F6F3EB] w-7 h-7 font-pixel-mono text-sm font-bold flex items-center justify-center"
                      >
                        −
                      </button>
                      <span className="font-pixel-mono text-base font-bold px-2 tabular-nums">
                        {quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          sound.playBlip(640, 0.03);
                          onUpdateQty(product.id, 1);
                        }}
                        className="pixel-btn-sm bg-[#F6F3EB] w-7 h-7 font-pixel-mono text-sm font-bold flex items-center justify-center"
                      >
                        +
                      </button>
                    </div>

                    <div className="font-pixel-mono text-xl font-bold text-[#1C1917] tabular-nums">
                      ₹{(product.price * quantity).toLocaleString('en-IN')}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Drawer Footer: Subtotal, Shipping, Total & CTAs */}
        {items.length > 0 && (
          <div className="bg-[#EFECE2] border-t-[3px] border-[#1C1917] p-5 space-y-4">
            <div className="space-y-1.5 font-pixel-mono text-base">
              <div className="flex justify-between text-[#57534E]">
                <span>Subtotal</span>
                <span className="tabular-nums text-[#1C1917]">
                  ₹{subtotal.toLocaleString('en-IN')}
                </span>
              </div>
              <div className="flex justify-between text-[#57534E]">
                <span>Shipping</span>
                <span className="tabular-nums text-[#1C1917]">
                  {shipping === 0 ? 'FREE' : `₹${shipping}`}
                </span>
              </div>
              <div className="flex justify-between text-xl font-bold text-[#1C1917] pt-2 border-t-2 border-[#1C1917]">
                <span>Total</span>
                <span className="tabular-nums text-[#D95D39]">
                  ₹{total.toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            <div className="space-y-2.5">
              <button
                type="button"
                onClick={() => {
                  sound.playBlip(720, 0.05);
                  onProceedToCheckout();
                }}
                className="w-full pixel-btn bg-[#D95D39] hover:bg-[#c04c2b] text-[#F6F3EB] py-3.5 px-5 font-pixel-display text-xs sm:text-sm uppercase tracking-wider flex items-center justify-center gap-2 whitespace-nowrap"
              >
                <span>PROCEED TO CHECKOUT</span>
                <span className="font-pixel-mono text-lg leading-none">→</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  sound.playBlip(500, 0.04);
                  onClose();
                }}
                className="w-full pixel-btn-sm bg-[#F6F3EB] hover:bg-[#E6B84D] text-[#1C1917] py-2.5 px-5 font-pixel-display text-xs uppercase tracking-wider whitespace-nowrap"
              >
                KEEP SHOPPING
              </button>
            </div>
          </div>
        )}
      </aside>
    </div>
  );
};

/* ============================================================================
   PENNY CHECKOUT PAGE (Pixel Interface, Trustworthy Payment Controls)
   ============================================================================ */
interface CheckoutPageProps {
  items: CartItem[];
  onBackToShop: () => void;
  onCompleteOrder: (order: OrderRecord) => void;
}

export const CheckoutPage: React.FC<CheckoutPageProps> = ({
  items,
  onBackToShop,
  onCompleteOrder,
}) => {
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [fullName, setFullName] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [stateName, setStateName] = useState('');
  const [pincode, setPincode] = useState('');
  const [deliveryMethod, setDeliveryMethod] = useState<'standard' | 'express'>('standard');
  const [paymentMethod, setPaymentMethod] = useState<'upi' | 'card' | 'cod'>('upi');
  const [upiId, setUpiId] = useState('');
  const [activeStep, setActiveStep] = useState<1 | 2>(1);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const subtotal = items.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );
  const baseShipping = subtotal >= 799 ? 0 : 49;
  const shipping = deliveryMethod === 'express' ? 99 : baseShipping;
  const total = subtotal + shipping;

  const handleContinueStep = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !phone.trim() || !fullName.trim() || !address.trim() || !city.trim() || !pincode.trim()) {
      setFormError('Please fill in all contact and shipping address fields.');
      return;
    }
    setFormError(null);
    sound.playBlip(680, 0.04);
    setActiveStep(2);
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !phone.trim() || !fullName.trim() || !address.trim() || !city.trim() || !pincode.trim()) {
      setFormError('Please fill in all contact and shipping address fields.');
      return;
    }
    setFormError(null);
    setSubmitting(true);
    sound.playBlip(600, 0.05);

    const randomOrderNum = `PNY-${Math.floor(10000 + Math.random() * 90000)}`;
    const itemizedSummary = items
      .map(
        (i) =>
          `${i.product.name} (x${i.quantity}) — ₹${i.product.price * i.quantity}`
      )
      .join(' | ');

    const result = await submitToFormspree({
      _subject: `New PENNY Order #${randomOrderNum} from ${fullName.trim()}`,
      form_type: 'PENNY_STORE_ORDER',
      order_number: randomOrderNum,
      email: email.trim(),
      phone: phone.trim(),
      full_name: fullName.trim(),
      street_address: address.trim(),
      city: city.trim(),
      state: stateName.trim() || 'India',
      pin_code: pincode.trim(),
      delivery_method: deliveryMethod,
      payment_method: paymentMethod,
      upi_id: upiId.trim() || 'N/A',
      items_ordered: itemizedSummary,
      subtotal_inr: subtotal,
      shipping_inr: shipping,
      total_inr: total,
    });

    if (!result.ok) {
      sound.playRelease();
      setSubmitting(false);
      setFormError(
        result.errorMessage || 'Could not submit order to server. Please try again.'
      );
      return;
    }

    sound.playCelebration();
    onCompleteOrder({
      orderNumber: randomOrderNum,
      items,
      subtotal,
      shipping,
      total,
      customer: {
        email,
        phone,
        fullName,
        address,
        city,
        state: stateName || 'India',
        pincode,
        deliveryMethod,
        paymentMethod,
      },
    });
  };

  if (items.length === 0) {
    return (
      <div className="bg-pixel-grid min-h-[70vh] py-16 px-4 flex items-center justify-center">
        <div className="pixel-box bg-[#F6F3EB] p-8 max-w-md w-full text-center space-y-4">
          <PixelCreatureSprite className="w-12 h-12 mx-auto" />
          <h1 className="font-pixel-display text-2xl font-bold">YOUR BAG IS EMPTY</h1>
          <p className="font-pixel-body text-sm text-[#57534E]">
            Grab at least one creature before heading to checkout.
          </p>
          <button
            type="button"
            onClick={onBackToShop}
            className="pixel-btn bg-[#D95D39] text-[#F6F3EB] font-pixel-display text-xs px-5 py-3"
          >
            BACK TO THE SHOP
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-pixel-grid min-h-screen py-10 sm:py-14 border-b-[3px] border-[#1C1917]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Checkout Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b-[3px] border-[#1C1917] pb-5">
          <div className="space-y-1">
            <div className="font-pixel-mono text-xs uppercase text-[#4A6B53]">
              ENCRYPTED DESK DISPATCH
            </div>
            <h1 className="font-pixel-display text-2xl sm:text-4xl font-bold text-[#1C1917]">
              PENNY CHECKOUT
            </h1>
          </div>
          <button
            type="button"
            onClick={() => {
              sound.playBlip(500, 0.04);
              onBackToShop();
            }}
            className="pixel-btn-sm bg-[#EFECE2] text-[#1C1917] px-3.5 py-2 font-pixel-mono text-sm"
          >
            ← KEEP SHOPPING
          </button>
        </div>

        <form
          action={FORMSPREE_ENDPOINT}
          method="POST"
          onSubmit={handlePlaceOrder}
          className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start"
        >
          <input type="hidden" name="form_type" value="PENNY_STORE_ORDER" />
          {/* Left 7 Cols: Contact, Shipping, Delivery, Payment */}
          <div className="lg:col-span-7 space-y-6">
            {formError && (
              <div className="pixel-box-sm bg-[#D95D39] text-[#F6F3EB] p-3 font-pixel-body text-sm">
                ! {formError}
              </div>
            )}

            {/* 1. Contact Information */}
            <div className="pixel-box bg-[#F6F3EB] p-6 space-y-4">
              <div className="flex items-center justify-between border-b-2 border-[#1C1917] pb-2.5">
                <h2 className="font-pixel-display text-sm sm:text-base font-bold text-[#1C1917]">
                  01. CONTACT INFORMATION
                </h2>
                <span className="font-pixel-mono text-xs text-[#57534E]">
                  FOR TRACKING UPDATES
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-pixel-mono text-sm text-[#1C1917] mb-1">
                    EMAIL ADDRESS *
                  </label>
                  <input
                    type="email"
                    name="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@desk.in"
                    className="pixel-input w-full px-3.5 py-2.5 text-sm"
                  />
                </div>
                <div>
                  <label className="block font-pixel-mono text-sm text-[#1C1917] mb-1">
                    PHONE NUMBER (INDIA) *
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="pixel-input w-full px-3.5 py-2.5 text-sm"
                  />
                </div>
              </div>
            </div>

            {/* 2. Shipping Address */}
            <div className="pixel-box bg-[#F6F3EB] p-6 space-y-4">
              <div className="flex items-center justify-between border-b-2 border-[#1C1917] pb-2.5">
                <h2 className="font-pixel-display text-sm sm:text-base font-bold text-[#1C1917]">
                  02. SHIPPING ADDRESS
                </h2>
                <span className="font-pixel-mono text-xs text-[#57534E]">
                  WHERE THE CREATURE LIVES
                </span>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block font-pixel-mono text-sm text-[#1C1917] mb-1">
                    FULL NAME *
                  </label>
                  <input
                    type="text"
                    name="full_name"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Aarav Sharma"
                    className="pixel-input w-full px-3.5 py-2.5 text-sm"
                  />
                </div>

                <div>
                  <label className="block font-pixel-mono text-sm text-[#1C1917] mb-1">
                    STREET ADDRESS / STUDIO / FLAT NO. *
                  </label>
                  <input
                    type="text"
                    name="street_address"
                    required
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="42 Indiranagar 100 Feet Road, Apt 4B"
                    className="pixel-input w-full px-3.5 py-2.5 text-sm"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block font-pixel-mono text-sm text-[#1C1917] mb-1">
                      CITY *
                    </label>
                    <input
                      type="text"
                      name="city"
                      required
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="Bengaluru"
                      className="pixel-input w-full px-3.5 py-2.5 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block font-pixel-mono text-sm text-[#1C1917] mb-1">
                      STATE
                    </label>
                    <input
                      type="text"
                      name="state"
                      value={stateName}
                      onChange={(e) => setStateName(e.target.value)}
                      placeholder="Karnataka"
                      className="pixel-input w-full px-3.5 py-2.5 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block font-pixel-mono text-sm text-[#1C1917] mb-1">
                      PIN CODE *
                    </label>
                    <input
                      type="text"
                      name="pin_code"
                      required
                      value={pincode}
                      onChange={(e) => setPincode(e.target.value)}
                      placeholder="560038"
                      className="pixel-input w-full px-3.5 py-2.5 text-sm font-pixel-mono"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* 3. Delivery Method */}
            <div className="pixel-box bg-[#F6F3EB] p-6 space-y-4">
              <h2 className="font-pixel-display text-sm sm:text-base font-bold text-[#1C1917] border-b-2 border-[#1C1917] pb-2.5">
                03. DELIVERY METHOD
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label
                  onClick={() => {
                    sound.playBlip(540, 0.03);
                    setDeliveryMethod('standard');
                  }}
                  className={`pixel-box-sm p-3.5 cursor-pointer flex items-start justify-between gap-2 ${
                    deliveryMethod === 'standard'
                      ? 'bg-[#EFECE2] border-[#D95D39]'
                      : 'bg-[#FFFFFF]'
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    <input
                      type="radio"
                      name="deliveryMethod"
                      checked={deliveryMethod === 'standard'}
                      onChange={() => setDeliveryMethod('standard')}
                      className="mt-1 accent-[#D95D39]"
                    />
                    <div>
                      <div className="font-pixel-display text-xs font-bold text-[#1C1917]">
                        STANDARD SURFACE
                      </div>
                      <div className="font-pixel-body text-xs text-[#57534E]">
                        3–5 business days
                      </div>
                    </div>
                  </div>
                  <span className="font-pixel-mono text-base font-bold text-[#1C1917]">
                    {baseShipping === 0 ? 'FREE' : `₹${baseShipping}`}
                  </span>
                </label>

                <label
                  onClick={() => {
                    sound.playBlip(580, 0.03);
                    setDeliveryMethod('express');
                  }}
                  className={`pixel-box-sm p-3.5 cursor-pointer flex items-start justify-between gap-2 ${
                    deliveryMethod === 'express'
                      ? 'bg-[#EFECE2] border-[#D95D39]'
                      : 'bg-[#FFFFFF]'
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    <input
                      type="radio"
                      name="deliveryMethod"
                      checked={deliveryMethod === 'express'}
                      onChange={() => setDeliveryMethod('express')}
                      className="mt-1 accent-[#D95D39]"
                    />
                    <div>
                      <div className="font-pixel-display text-xs font-bold text-[#1C1917]">
                        AIR EXPRESS
                      </div>
                      <div className="font-pixel-body text-xs text-[#57534E]">
                        1–2 business days
                      </div>
                    </div>
                  </div>
                  <span className="font-pixel-mono text-base font-bold text-[#1C1917]">
                    ₹99
                  </span>
                </label>
              </div>

              {activeStep === 1 && (
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={handleContinueStep}
                    className="pixel-btn bg-[#1C1917] hover:bg-[#D95D39] text-[#F6F3EB] px-6 py-3 font-pixel-display text-xs uppercase"
                  >
                    CONTINUE TO PAYMENT →
                  </button>
                </div>
              )}
            </div>

            {/* 4. Payment Method (Trustworthy, Clear Controls) */}
            <div className="pixel-box bg-[#F6F3EB] p-6 space-y-4">
              <div className="flex items-center justify-between border-b-2 border-[#1C1917] pb-2.5">
                <h2 className="font-pixel-display text-sm sm:text-base font-bold text-[#1C1917]">
                  04. PAYMENT METHOD
                </h2>
                <span className="font-pixel-mono text-xs text-[#4A6B53] font-bold">
                  [256-BIT VERIFIED]
                </span>
              </div>

              <div className="space-y-3">
                {[
                  {
                    id: 'upi' as const,
                    title: 'UPI (GPay, PhonePe, Paytm, BHIM)',
                    desc: 'Instant verification with zero gateway fee',
                  },
                  {
                    id: 'card' as const,
                    title: 'Credit / Debit Card (Visa, Mastercard, RuPay)',
                    desc: 'Standard bank OTP checkout',
                  },
                  {
                    id: 'cod' as const,
                    title: 'Cash on Delivery (Pay at Doorstep)',
                    desc: 'Pay via Cash or UPI when your creature arrives',
                  },
                ].map((opt) => (
                  <label
                    key={opt.id}
                    onClick={() => {
                      sound.playBlip(600, 0.03);
                      setPaymentMethod(opt.id);
                    }}
                    className={`pixel-box-sm p-4 block cursor-pointer ${
                      paymentMethod === opt.id
                        ? 'bg-[#EFECE2] border-[#1C1917]'
                        : 'bg-[#FFFFFF]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="paymentMethod"
                        checked={paymentMethod === opt.id}
                        onChange={() => setPaymentMethod(opt.id)}
                        className="accent-[#D95D39]"
                      />
                      <div>
                        <div className="font-pixel-display text-xs sm:text-sm font-bold text-[#1C1917]">
                          {opt.title}
                        </div>
                        <div className="font-pixel-body text-xs text-[#57534E]">
                          {opt.desc}
                        </div>
                      </div>
                    </div>

                    {paymentMethod === 'upi' && opt.id === 'upi' && (
                      <div className="mt-3 pt-3 border-t border-[#1C1917]/20">
                        <label className="block font-pixel-mono text-xs text-[#1C1917] mb-1">
                          UPI ID (OPTIONAL FOR EXPRESS PROMPT)
                        </label>
                        <input
                          type="text"
                          value={upiId}
                          onChange={(e) => setUpiId(e.target.value)}
                          placeholder="yourname@okaxis"
                          className="pixel-input w-full px-3 py-2 text-xs font-pixel-mono"
                        />
                      </div>
                    )}
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Right 5 Cols: Sticky Order Summary & PLACE ORDER Button */}
          <div className="lg:col-span-5 lg:sticky lg:top-24">
            <div className="pixel-box-lg bg-[#EFECE2] p-6 space-y-6">
              <h2 className="font-pixel-display text-base sm:text-lg font-bold text-[#1C1917] border-b-[3px] border-[#1C1917] pb-3">
                ORDER SUMMARY ({items.reduce((s, i) => s + i.quantity, 0)})
              </h2>

              <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                {items.map(({ product, quantity }) => (
                  <div
                    key={product.id}
                    className="pixel-box-sm bg-[#F6F3EB] p-3 flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-12 h-12 border border-[#1C1917] bg-[#EFECE2] shrink-0 overflow-hidden">
                        <PixelImage
                          src={product.image}
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="min-w-0">
                        <div className="font-pixel-display text-xs font-bold text-[#1C1917] truncate">
                          {product.name}
                        </div>
                        <div className="font-pixel-mono text-xs text-[#57534E]">
                          QTY: {quantity} × ₹{product.price}
                        </div>
                      </div>
                    </div>
                    <div className="font-pixel-mono text-lg font-bold text-[#1C1917] tabular-nums">
                      ₹{(product.price * quantity).toLocaleString('en-IN')}
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-2 border-t-2 border-[#1C1917] pt-4 font-pixel-mono text-base">
                <div className="flex justify-between text-[#57534E]">
                  <span>Subtotal</span>
                  <span className="tabular-nums text-[#1C1917]">
                    ₹{subtotal.toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="flex justify-between text-[#57534E]">
                  <span>Shipping ({deliveryMethod.toUpperCase()})</span>
                  <span className="tabular-nums text-[#1C1917]">
                    {shipping === 0 ? 'FREE' : `₹${shipping}`}
                  </span>
                </div>
                <div className="flex justify-between text-2xl font-bold text-[#1C1917] pt-2 border-t-2 border-[#1C1917]">
                  <span>TOTAL</span>
                  <span className="tabular-nums text-[#D95D39]">
                    ₹{total.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full pixel-btn bg-[#D95D39] hover:bg-[#c04c2b] text-[#F6F3EB] py-4 px-6 font-pixel-display text-sm sm:text-base uppercase tracking-wider flex items-center justify-center gap-2 whitespace-nowrap"
              >
                {submitting ? (
                  <span className="font-pixel-mono text-lg">
                    DISPATCHING CREATURES [■■■□]...
                  </span>
                ) : (
                  <>
                    <span>PLACE ORDER — ₹{total.toLocaleString('en-IN')}</span>
                    <span className="font-pixel-mono text-xl leading-none">→</span>
                  </>
                )}
              </button>

              <p className="font-pixel-mono text-xs text-center text-[#57534E]">
                7-DAY DAMAGE REPLACEMENT GUARANTEE · SHIPS ACROSS INDIA
              </p>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

/* ============================================================================
   ORDER CONFIRMATION SCREEN ("CREATURE ACQUIRED!")
   ============================================================================ */
interface OrderConfirmationProps {
  order: OrderRecord;
  onBackToShop: () => void;
  onMeetMoreCreatures: () => void;
}

export const OrderConfirmationPage: React.FC<OrderConfirmationProps> = ({
  order,
  onBackToShop,
  onMeetMoreCreatures,
}) => {
  return (
    <div className="bg-pixel-grid min-h-screen py-12 sm:py-20 border-b-[3px] border-[#1C1917]">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="pixel-box-lg bg-[#F6F3EB] overflow-hidden">
          {/* Top Celebration Banner */}
          <div className="bg-[#1C1917] text-[#F6F3EB] px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2 font-pixel-mono text-sm text-[#E6B84D]">
              <PixelStar className="w-4 h-4" />
              <span>ORDER CONFIRMED // #{order.orderNumber}</span>
            </div>
            <span className="font-pixel-mono text-xs bg-[#4A6B53] text-[#F6F3EB] px-2.5 py-0.5">
              PREPARING SHIPMENT
            </span>
          </div>

          <div className="p-6 sm:p-10 space-y-8 text-center">
            {/* Animated Celebrating Pixel Creature Stage */}
            <div className="inline-flex items-center justify-center gap-4 pixel-box-sm bg-[#EFECE2] px-8 py-6">
              <PixelStar className="w-5 h-5 animate-pulse" color="#D95D39" />
              <PixelCreatureSprite
                className="w-16 h-16 animate-pixel-bounce"
                color="#4A6B53"
              />
              <PixelHeart className="w-6 h-6 animate-pixel-bounce" />
              <PixelChompSprite className="w-16 h-16 animate-float-slow" />
              <PixelStar className="w-5 h-5 animate-pulse" color="#E6B84D" />
            </div>

            <div className="space-y-2">
              <h1 className="font-pixel-display text-3xl sm:text-5xl font-bold text-[#1C1917]">
                CREATURE ACQUIRED!
              </h1>
              <p className="font-pixel-body text-lg sm:text-xl text-[#57534E]">
                Your new desk companion is on its way.
              </p>
            </div>

            {/* Order Details Box */}
            <div className="pixel-box-sm bg-[#EFECE2] p-6 text-left space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-b-2 border-[#1C1917] pb-4 font-pixel-mono text-sm">
                <div>
                  <span className="text-[#57534E] block">ORDER NUMBER:</span>
                  <span className="text-lg font-bold text-[#1C1917]">
                    {order.orderNumber}
                  </span>
                </div>
                <div>
                  <span className="text-[#57534E] block">SHIPPING TO:</span>
                  <span className="font-bold text-[#1C1917]">
                    {order.customer.fullName} — {order.customer.city} (
                    {order.customer.pincode})
                  </span>
                </div>
              </div>

              {/* Acquired Items */}
              <div className="space-y-3">
                <div className="font-pixel-mono text-xs uppercase text-[#57534E]">
                  ACQUIRED SPECIMENS
                </div>
                {order.items.map(({ product, quantity }) => (
                  <div
                    key={product.id}
                    className="flex items-center justify-between gap-4 bg-[#F6F3EB] border-2 border-[#1C1917] p-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 border border-[#1C1917] overflow-hidden shrink-0">
                        <PixelImage
                          src={product.image}
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div>
                        <div className="font-pixel-display text-xs sm:text-sm font-bold text-[#1C1917]">
                          {product.name}
                        </div>
                        <div className="font-pixel-mono text-xs text-[#57534E]">
                          QTY: {quantity}
                        </div>
                      </div>
                    </div>
                    <div className="font-pixel-mono text-lg font-bold text-[#1C1917] tabular-nums">
                      ₹{(product.price * quantity).toLocaleString('en-IN')}
                    </div>
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div className="border-t-2 border-[#1C1917] pt-4 flex items-center justify-between font-pixel-mono text-xl font-bold">
                <span>TOTAL PAID ({order.customer.paymentMethod.toUpperCase()})</span>
                <span className="text-[#D95D39] tabular-nums">
                  ₹{order.total.toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
              <button
                type="button"
                onClick={() => {
                  sound.playBlip(640, 0.04);
                  onBackToShop();
                }}
                className="pixel-btn bg-[#D95D39] hover:bg-[#c04c2b] text-[#F6F3EB] font-pixel-display text-xs sm:text-sm px-6 py-4"
              >
                BACK TO THE SHOP
              </button>
              <button
                type="button"
                onClick={() => {
                  sound.playBlip(540, 0.04);
                  onMeetMoreCreatures();
                }}
                className="pixel-btn bg-[#EFECE2] hover:bg-[#E6B84D] text-[#1C1917] font-pixel-display text-xs sm:text-sm px-6 py-4"
              >
                MEET MORE CREATURES
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
