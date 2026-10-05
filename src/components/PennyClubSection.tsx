import React, { useState, useEffect } from 'react';
import {
  PixelCreatureSprite,
  PixelChompSprite,
  PixelBlobSprite,
  PixelStar,
  PixelHeart,
} from './PixelSprites';
import { sound } from '../utils/sound';
import { FORMSPREE_ENDPOINT, submitToFormspree } from '../utils/formspree';

interface PennyClubSectionProps {
  onBackToCreatures: () => void;
  onOpenPrivacyPolicy: () => void;
}

interface CountryOption {
  code: string;
  name: string;
  mapX: number; // percentage on pixel world map
  mapY: number;
  flagColors: [string, string, string];
}

const COUNTRIES: CountryOption[] = [
  { code: 'IN', name: 'INDIA', mapX: 69, mapY: 52, flagColors: ['#D95D39', '#F6F3EB', '#4A6B53'] },
  { code: 'US', name: 'UNITED STATES', mapX: 22, mapY: 40, flagColors: ['#D95D39', '#F6F3EB', '#3B82F6'] },
  { code: 'GB', name: 'UNITED KINGDOM', mapX: 47, mapY: 31, flagColors: ['#3B82F6', '#F6F3EB', '#D95D39'] },
  { code: 'JP', name: 'JAPAN', mapX: 84, mapY: 42, flagColors: ['#F6F3EB', '#D95D39', '#F6F3EB'] },
  { code: 'CA', name: 'CANADA', mapX: 20, mapY: 27, flagColors: ['#D95D39', '#F6F3EB', '#D95D39'] },
  { code: 'DE', name: 'GERMANY', mapX: 51, mapY: 33, flagColors: ['#1C1917', '#D95D39', '#E6B84D'] },
  { code: 'AU', name: 'AUSTRALIA', mapX: 82, mapY: 76, flagColors: ['#3B82F6', '#F6F3EB', '#D95D39'] },
  { code: 'SG', name: 'SINGAPORE', mapX: 76, mapY: 59, flagColors: ['#D95D39', '#F6F3EB', '#D95D39'] },
  { code: 'FR', name: 'FRANCE', mapX: 48, mapY: 36, flagColors: ['#3B82F6', '#F6F3EB', '#D95D39'] },
  { code: 'AE', name: 'UAE', mapX: 61, mapY: 48, flagColors: ['#4A6B53', '#F6F3EB', '#1C1917'] },
  { code: 'BR', name: 'BRAZIL', mapX: 33, mapY: 68, flagColors: ['#4A6B53', '#E6B84D', '#3B82F6'] },
  { code: 'KR', name: 'SOUTH KOREA', mapX: 81, mapY: 41, flagColors: ['#F6F3EB', '#D95D39', '#3B82F6'] },
];

interface ReasonCardOption {
  id: string;
  icon: string;
  title: string;
  quote: string;
  color: string;
}

const REASON_OPTIONS: ReasonCardOption[] = [
  {
    id: 'need-pen-holder',
    icon: '🖊️',
    title: 'I NEED A PEN HOLDER',
    quote: 'My desk needs help.',
    color: '#D95D39',
  },
  {
    id: 'want-weirdo',
    icon: '👹',
    title: 'I WANT A WEIRDO',
    quote: 'Normal things are boring.',
    color: '#4A6B53',
  },
  {
    id: 'collect-strange',
    icon: '🧸',
    title: 'I COLLECT STRANGE THINGS',
    quote: 'This is becoming a problem.',
    color: '#E6B84D',
  },
  {
    id: 'buying-gift',
    icon: '🎁',
    title: "I'M BUYING A GIFT",
    quote: 'Someone needs a weird present.',
    color: '#D95D39',
  },
  {
    id: 'just-curious',
    icon: '👀',
    title: "I'M JUST CURIOUS",
    quote: "I don't know how I got here.",
    color: '#4A6B53',
  },
  {
    id: 'see-what-comes-next',
    icon: '✨',
    title: 'I WANT TO SEE WHAT COMES NEXT',
    quote: 'Show me the future weirdos.',
    color: '#E6B84D',
  },
];

const SCAN_STEPS = [
  'SCANNING...',
  'IDENTITY ACCEPTED...',
  'CREATURE SIGNAL CONNECTED...',
];

/* Tiny 3-band Pixel Flag Sprite */
const PixelFlagBadge: React.FC<{ colors: [string, string, string]; code: string }> = ({
  colors,
  code,
}) => (
  <span className="inline-flex items-center gap-1.5 bg-[#181715] border border-[#F6F3EB]/60 px-1.5 py-0.5">
    <svg
      viewBox="0 0 9 6"
      className="w-3.5 h-2.5 crisp-edges shrink-0"
      aria-hidden="true"
    >
      <rect x="0" y="0" width="9" height="2" fill={colors[0]} />
      <rect x="0" y="2" width="9" height="2" fill={colors[1]} />
      <rect x="0" y="4" width="9" height="2" fill={colors[2]} />
    </svg>
    <span className="font-pixel-mono text-xs text-[#F6F3EB] leading-none">{code}</span>
  </span>
);

/* Pixel World Map Location Radar Terminal */
const PixelWorldMapTerminal: React.FC<{
  selectedCountry: CountryOption | null;
  onSelectCountry: (country: CountryOption) => void;
}> = ({ selectedCountry, onSelectCountry }) => {
  const [otherCountryInput, setOtherCountryInput] = useState('');
  const [showOtherInput, setShowOtherInput] = useState(false);

  return (
    <div className="space-y-3">
      {/* Interactive Pixel World Map Grid */}
      <div className="relative w-full h-36 sm:h-44 bg-[#141311] border-2 border-[#F6F3EB]/50 overflow-hidden p-3 flex flex-col justify-between select-none">
        {/* Subtle Radar Grid Lines */}
        <div
          className="pointer-events-none absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              'linear-gradient(to right, #4A6B53 1px, transparent 1px), linear-gradient(to bottom, #4A6B53 1px, transparent 1px)',
            backgroundSize: '20px 20px',
          }}
          aria-hidden="true"
        />

        {/* Simplified Pixel Continents Silhouette SVG */}
        <svg
          viewBox="0 0 100 50"
          className="pointer-events-none absolute inset-0 w-full h-full opacity-30 crisp-edges"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          {/* North America */}
          <rect x="12" y="10" width="18" height="12" fill="#4A6B53" />
          <rect x="16" y="22" width="8" height="5" fill="#4A6B53" />
          {/* South America */}
          <rect x="26" y="29" width="10" height="15" fill="#4A6B53" />
          {/* Europe */}
          <rect x="44" y="11" width="14" height="10" fill="#4A6B53" />
          {/* Africa */}
          <rect x="45" y="23" width="14" height="16" fill="#4A6B53" />
          {/* Asia */}
          <rect x="59" y="10" width="26" height="18" fill="#4A6B53" />
          {/* India Subcontinent */}
          <rect x="66" y="24" width="6" height="8" fill="#4A6B53" />
          {/* Australia */}
          <rect x="77" y="34" width="11" height="9" fill="#4A6B53" />
        </svg>

        {/* Top Radar Status Bar */}
        <div className="relative z-10 flex items-center justify-between font-pixel-mono text-xs text-[#4A6B53]">
          <span>RADAR // GLOBAL CREATURE SCAN</span>
          <span>
            {selectedCountry
              ? `LOCK: [${selectedCountry.code}]`
              : 'SELECT YOUR COUNTRY'}
          </span>
        </div>

        {/* Clickable Country Beacons on Map */}
        {COUNTRIES.map((c) => {
          const isSelected = selectedCountry?.name === c.name;
          return (
            <button
              key={c.code}
              type="button"
              onClick={() => {
                sound.playBlip(660, 0.04);
                onSelectCountry(c);
                setShowOtherInput(false);
              }}
              style={{ left: `${c.mapX}%`, top: `${c.mapY}%` }}
              title={c.name}
              aria-label={`Select ${c.name}`}
              className={`-translate-x-1/2 -translate-y-1/2 absolute z-20 cursor-pointer transition-transform ${
                isSelected ? 'scale-125 z-30' : 'hover:scale-125 opacity-80 hover:opacity-100'
              }`}
            >
              <span
                className={`block w-3 h-3 border ${
                  isSelected
                    ? 'bg-[#E6B84D] border-[#F6F3EB] shadow-[0_0_8px_#E6B84D] animate-pulse'
                    : 'bg-[#D95D39] border-[#181715]'
                }`}
              />
            </button>
          );
        })}

        {/* Bottom Map Readout */}
        <div className="relative z-10 flex items-center justify-between">
          {selectedCountry ? (
            <div className="inline-flex items-center gap-2 bg-[#181715]/95 border border-[#E6B84D] px-2.5 py-1 font-pixel-display text-xs text-[#E6B84D]">
              <PixelFlagBadge
                colors={selectedCountry.flagColors}
                code={selectedCountry.code}
              />
              <span>PENNY FOUND YOU IN {selectedCountry.name}.</span>
            </div>
          ) : (
            <div className="inline-flex items-center gap-2 bg-[#181715]/90 border border-[#F6F3EB]/30 px-2.5 py-1 font-pixel-mono text-xs text-[#F6F3EB]/70">
              <span className="w-2 h-2 bg-[#E6B84D] inline-block animate-ping" />
              <span>SELECT YOUR COUNTRY BELOW OR CLICK A BEACON</span>
            </div>
          )}
        </div>
      </div>

      {/* Pixel Country Selector Buttons */}
      <div className="flex flex-wrap gap-1.5">
        {COUNTRIES.map((c) => {
          const isSelected = selectedCountry?.name === c.name;
          return (
            <button
              key={c.code}
              type="button"
              onClick={() => {
                sound.playBlip(620, 0.03);
                onSelectCountry(c);
                setShowOtherInput(false);
              }}
              className={`px-2.5 py-1.5 border-2 font-pixel-mono text-xs flex items-center gap-1.5 cursor-pointer transition-all whitespace-nowrap ${
                isSelected
                  ? 'border-[#E6B84D] bg-[#E6B84D] text-[#181715] font-bold -translate-y-0.5'
                  : 'border-[#F6F3EB]/40 bg-[#23211E] text-[#F6F3EB] hover:border-[#F6F3EB]'
              }`}
            >
              <PixelFlagBadge colors={c.flagColors} code={c.code} />
              <span>{c.name}</span>
            </button>
          );
        })}

        <button
          type="button"
          onClick={() => {
            sound.playBlip(540, 0.03);
            setShowOtherInput(!showOtherInput);
          }}
          className={`px-2.5 py-1.5 border-2 font-pixel-mono text-xs cursor-pointer whitespace-nowrap ${
            showOtherInput
              ? 'border-[#E6B84D] bg-[#E6B84D] text-[#181715] font-bold'
              : 'border-[#F6F3EB]/40 bg-[#23211E] text-[#E6B84D] hover:border-[#F6F3EB]'
          }`}
        >
          + OTHER COUNTRY
        </button>
      </div>

      {showOtherInput && (
        <div className="flex gap-2 pt-1">
          <input
            type="text"
            value={otherCountryInput}
            onChange={(e) => {
              const val = e.target.value;
              setOtherCountryInput(val);
              if (val.trim()) {
                onSelectCountry({
                  code: val.trim().slice(0, 2).toUpperCase(),
                  name: val.trim().toUpperCase(),
                  mapX: 50,
                  mapY: 45,
                  flagColors: ['#E6B84D', '#D95D39', '#4A6B53'],
                });
              }
            }}
            placeholder="TYPE YOUR COUNTRY..."
            className="flex-1 border-2 border-[#E6B84D] bg-[#23211E] px-3 py-2 font-pixel-display text-xs text-[#F6F3EB] placeholder:text-[#F6F3EB]/40 focus:outline-none"
          />
        </div>
      )}
    </div>
  );
};

/* Animated Pixel Envelope Travelling into Mailbox beside Email Input */
const PixelMailboxWidget: React.FC<{ isValidEmail: boolean }> = ({
  isValidEmail,
}) => (
  <div
    className="flex items-center gap-2 bg-[#141311] border-2 border-[#F6F3EB] px-3 py-2.5 shrink-0 select-none"
    aria-hidden="true"
  >
    {/* Travelling Pixel Envelope */}
    <div
      className={`transition-all duration-300 ${
        isValidEmail
          ? 'translate-x-3 scale-75 opacity-90'
          : 'translate-x-0 scale-100 opacity-60'
      }`}
    >
      <svg
        viewBox="0 0 14 10"
        className="w-6 h-4 crisp-edges"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect x="0" y="0" width="14" height="10" fill="#F6F3EB" />
        <rect x="1" y="1" width="12" height="8" fill="#181715" />
        <rect x="2" y="2" width="10" height="6" fill="#F6F3EB" />
        <rect x="2" y="2" width="2" height="2" fill="#D95D39" />
        <rect x="4" y="4" width="2" height="2" fill="#D95D39" />
        <rect x="6" y="5" width="2" height="2" fill="#D95D39" />
        <rect x="8" y="4" width="2" height="2" fill="#D95D39" />
        <rect x="10" y="2" width="2" height="2" fill="#D95D39" />
      </svg>
    </div>

    {/* Pixel Mailbox */}
    <svg
      viewBox="0 0 14 14"
      className="w-7 h-7 crisp-edges"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect
        x="2"
        y="3"
        width="9"
        height="6"
        fill={isValidEmail ? '#4A6B53' : '#57534E'}
      />
      {/* Mailbox Slot */}
      <rect x="3" y="5" width="4" height="2" fill="#181715" />
      {/* Mailbox Flag */}
      {isValidEmail ? (
        <>
          <rect x="11" y="1" width="1" height="5" fill="#E6B84D" />
          <rect x="12" y="1" width="2" height="2" fill="#D95D39" />
        </>
      ) : (
        <rect x="11" y="5" width="2" height="2" fill="#D95D39" />
      )}
      {/* Post */}
      <rect x="6" y="9" width="2" height="5" fill="#F6F3EB" />
    </svg>
  </div>
);

export const PennyClubSection: React.FC<PennyClubSectionProps> = ({
  onBackToCreatures,
  onOpenPrivacyPolicy,
}) => {
  // Strictly the 4 required fields:
  // 1. Name
  const [memberName, setMemberName] = useState('');
  // 2. Country
  const [selectedCountry, setSelectedCountry] = useState<CountryOption | null>(
    COUNTRIES[0]
  );
  // 3. Email
  const [email, setEmail] = useState('');
  // 4. Why they are interested
  const [selectedReasons, setSelectedReasons] = useState<string[]>([]);
  const [bouncingCardId, setBouncingCardId] = useState<string | null>(null);

  // UI & Submission state
  const [btnHovered, setBtnHovered] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [status, setStatus] = useState<'idle' | 'scanning' | 'welcomed'>('idle');
  const [scanStepIdx, setScanStepIdx] = useState(0);

  const isNameValid = memberName.trim().length > 0;
  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

  useEffect(() => {
    if (isNameValid && isEmailValid) {
      setErrorMsg(null);
    }
  }, [isNameValid, isEmailValid]);

  const handleToggleReason = (id: string) => {
    sound.playBlip(640, 0.04);
    setBouncingCardId(id);
    setTimeout(() => setBouncingCardId(null), 350);
    setSelectedReasons((prev) =>
      prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isNameValid) {
      sound.playRelease();
      setErrorMsg('THE CREATURES NEED TO KNOW WHAT TO CALL YOU.');
      return;
    }
    if (!selectedCountry) {
      sound.playRelease();
      setErrorMsg('SELECT WHERE IN THE WORLD YOU FOUND US.');
      return;
    }
    if (!isEmailValid) {
      sound.playRelease();
      setErrorMsg('THAT EMAIL LOOKS A LITTLE SUSPECT.');
      return;
    }

    setErrorMsg(null);
    setStatus('scanning');
    setScanStepIdx(0);
    sound.playBlip(540, 0.05);

    const t1 = setTimeout(() => {
      setScanStepIdx(1);
      sound.playBlip(660, 0.05);
    }, 420);

    const t2 = setTimeout(() => {
      setScanStepIdx(2);
      sound.playBlip(780, 0.05);
    }, 840);

    const selectedReasonTitles =
      selectedReasons.length > 0
        ? selectedReasons
            .map((id) => REASON_OPTIONS.find((r) => r.id === id)?.title || id)
            .join(', ')
        : "I'M JUST CURIOUS";

    // Run Formspree submission in parallel with the 1.2s terminal scan animation
    submitToFormspree({
      _subject: `PENNY Club Membership: ${memberName.trim()} (${selectedCountry.name})`,
      form_type: 'PENNY_CLUB_MEMBERSHIP',
      name: memberName.trim(),
      country: selectedCountry.name,
      email: email.trim(),
      why_interested: selectedReasonTitles,
    });

    setTimeout(() => {
      clearTimeout(t1);
      clearTimeout(t2);
      sound.playCelebration();
      setStatus('welcomed');
    }, 1280);
  };

  return (
    <section
      id="penny-club-section"
      className="bg-pixel-dark-grid text-[#F6F3EB] border-b-[3px] border-[#1C1917] py-16 sm:py-24 relative overflow-hidden"
    >
      {/* Subtle CRT Scanlines Overlay */}
      <div
        className="pointer-events-none absolute inset-0 crt-scanlines opacity-25"
        aria-hidden="true"
      />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 space-y-8">
        {/* Section Header */}
        <div className="text-center space-y-3">
          <h2 className="font-pixel-display text-3xl sm:text-5xl font-bold text-[#F6F3EB] tracking-tight">
            JOIN THE PENNY CLUB
          </h2>
          <p className="font-pixel-body text-base sm:text-lg text-[#F6F3EB]/80 max-w-lg mx-auto leading-relaxed">
            Get notified when new weirdos drop.
            <br />
            Zero corporate spam. Only creatures.
          </p>

          {/* Terminal Status Bar */}
          <div className="pt-2 inline-flex flex-wrap items-center justify-center gap-3 border-2 border-[#F6F3EB] bg-[#181715] px-4 py-2 shadow-[4px_4px_0_#D95D39]">
            <span className="font-pixel-mono text-xs sm:text-sm text-[#E6B84D] tracking-wider">
              PENNY CLUB // MEMBERSHIP TERMINAL
            </span>
            <span className="text-[#F6F3EB]/30" aria-hidden="true">
              |
            </span>
            <span className="inline-flex items-center gap-1.5 font-pixel-mono text-xs sm:text-sm text-[#4A6B53] font-bold">
              <span className="w-2 h-2 bg-[#4A6B53] inline-block animate-blink" />
              <span>STATUS: ACCEPTING HUMANS</span>
            </span>
          </div>
        </div>

        {/* Main Pixel-Art Membership Terminal */}
        <div className="border-[3px] border-[#F6F3EB] bg-[#23211E] shadow-[8px_8px_0_#1C1917]">
          {status === 'welcomed' ? (
            /* =================================================================
               CELEBRATION CONFIRMATION SCREEN ("WELCOME TO PENNY.")
               ================================================================= */
            <div className="p-8 sm:p-12 text-center space-y-8">
              {/* Tiny Celebration Animation with Several Pixel Creatures */}
              <div className="inline-flex items-center justify-center gap-4 border-2 border-[#E6B84D] bg-[#181715] px-6 py-4 shadow-[4px_4px_0_#D95D39]">
                <PixelStar className="w-5 h-5 animate-pulse" color="#E6B84D" />
                <PixelCreatureSprite
                  className="w-11 h-11 animate-pixel-bounce"
                  color="#4A6B53"
                />
                <PixelChompSprite className="w-11 h-11 animate-float-slow" />
                <PixelHeart className="w-5 h-5 animate-pixel-bounce" />
                <PixelBlobSprite className="w-11 h-11 animate-pixel-bounce" />
                <PixelCreatureSprite
                  className="w-11 h-11 animate-float-slow"
                  color="#D95D39"
                />
                <PixelStar className="w-5 h-5 animate-pulse" color="#D95D39" />
              </div>

              <div className="space-y-2.5 max-w-lg mx-auto">
                <h3 className="font-pixel-display text-3xl sm:text-5xl font-bold text-[#E6B84D]">
                  WELCOME TO PENNY.
                </h3>
                <p className="font-pixel-display text-base sm:text-xl text-[#F6F3EB]">
                  You&apos;re officially on the list, {memberName.trim()}.
                </p>
                <p className="font-pixel-body text-base text-[#F6F3EB]/80">
                  We&apos;ll let you know when the next weird creature appears.
                </p>
              </div>

              {/* Minted Pixel Membership Card */}
              <div className="max-w-sm mx-auto border-2 border-[#F6F3EB] bg-[#181715] p-4 text-left font-pixel-mono text-sm space-y-2 shadow-[4px_4px_0_#4A6B53]">
                <div className="flex items-center justify-between border-b border-[#F6F3EB]/20 pb-2 text-xs text-[#E6B84D]">
                  <span>PENNY CLUB PASS</span>
                  {selectedCountry && (
                    <PixelFlagBadge
                      colors={selectedCountry.flagColors}
                      code={selectedCountry.code}
                    />
                  )}
                </div>
                <div className="text-base font-pixel-display font-bold text-[#F6F3EB] truncate">
                  {memberName.trim()}
                </div>
                <div className="text-xs text-[#4A6B53]">
                  SIGNAL ACTIVE · {selectedCountry?.name}
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => {
                    sound.playBlip(680, 0.04);
                    onBackToCreatures();
                  }}
                  className="pixel-btn bg-[#D95D39] hover:bg-[#E6B84D] hover:text-[#1C1917] text-[#F6F3EB] border-[#F6F3EB] font-pixel-display text-xs sm:text-sm px-7 py-4 uppercase"
                >
                  MEET THE CREATURES →
                </button>
              </div>
            </div>
          ) : (
            /* =================================================================
               MINIMAL 4-STEP PIXEL MEMBERSHIP FORM
               ================================================================= */
            <form
              action={FORMSPREE_ENDPOINT}
              method="POST"
              onSubmit={handleSubmit}
              noValidate
              className="p-6 sm:p-10 space-y-8"
            >
              <input type="hidden" name="form_type" value="PENNY_CLUB_MEMBERSHIP" />
              <input
                type="hidden"
                name="country"
                value={selectedCountry?.name || ''}
              />

              {/* 01 — YOUR NAME + LIVE ANIMATED PIXEL MEMBERSHIP CARD */}
              <div className="border-2 border-[#F6F3EB]/40 bg-[#181715] p-5 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="font-pixel-mono text-xs text-[#E6B84D]">
                      01 — YOUR NAME
                    </div>
                    <label
                      htmlFor="penny-club-name"
                      className="block font-pixel-display text-base sm:text-lg font-bold text-[#F6F3EB]"
                    >
                      WHAT DO THE CREATURES CALL YOU?
                    </label>
                    <p className="font-pixel-body text-xs sm:text-sm text-[#F6F3EB]/70">
                      Your real name is fine. A mysterious alias is also acceptable.
                    </p>
                  </div>

                  {/* Small Animated Pixel Membership Card updating in real time */}
                  <div className="border-2 border-[#E6B84D] bg-[#23211E] px-3.5 py-2.5 min-w-[200px] sm:max-w-[240px] shrink-0 shadow-[3px_3px_0_#D95D39]">
                    <div className="flex items-center justify-between gap-2 border-b border-[#F6F3EB]/20 pb-1 mb-1.5">
                      <span className="font-pixel-mono text-[11px] text-[#E6B84D] tracking-wider">
                        PENNY CLUB MEMBER
                      </span>
                      <PixelCreatureSprite
                        className="w-4 h-4 animate-pixel-bounce"
                        color={memberName.trim() ? '#4A6B53' : '#57534E'}
                      />
                    </div>
                    <div className="font-pixel-display text-xs text-[#F6F3EB] truncate">
                      &ldquo;{memberName.trim() || 'UNNAMED HUMAN'}&rdquo;
                    </div>
                  </div>
                </div>

                <input
                  id="penny-club-name"
                  name="name"
                  type="text"
                  value={memberName}
                  onChange={(e) => setMemberName(e.target.value)}
                  placeholder="TYPE YOUR NAME..."
                  className="w-full border-2 border-[#F6F3EB] bg-[#23211E] px-4 py-3 font-pixel-display text-sm text-[#E6B84D] placeholder:text-[#F6F3EB]/35 focus:outline-none focus:border-[#D95D39]"
                />
              </div>

              {/* 02 — YOUR COUNTRY (Pixel World Map / Location Terminal) */}
              <div className="border-2 border-[#F6F3EB]/40 bg-[#181715] p-5 space-y-4">
                <div className="space-y-1">
                  <div className="font-pixel-mono text-xs text-[#E6B84D]">
                    02 — YOUR COUNTRY
                  </div>
                  <h3 className="font-pixel-display text-base sm:text-lg font-bold text-[#F6F3EB]">
                    WHERE IN THE WORLD DID YOU FIND US?
                  </h3>
                  <p className="font-pixel-body text-xs sm:text-sm text-[#F6F3EB]/70">
                    We like knowing where the weirdos are coming from.
                  </p>
                </div>

                <PixelWorldMapTerminal
                  selectedCountry={selectedCountry}
                  onSelectCountry={(country) => setSelectedCountry(country)}
                />
              </div>

              {/* 03 — YOUR EMAIL + TRAVELLING PIXEL ENVELOPE & MAILBOX */}
              <div className="border-2 border-[#F6F3EB]/40 bg-[#181715] p-5 space-y-4">
                <div className="space-y-1">
                  <div className="font-pixel-mono text-xs text-[#E6B84D]">
                    03 — YOUR EMAIL
                  </div>
                  <label
                    htmlFor="penny-club-email"
                    className="block font-pixel-display text-base sm:text-lg font-bold text-[#F6F3EB]"
                  >
                    WHERE SHOULD WE SEND THE CREATURE SIGNAL?
                  </label>
                  <p className="font-pixel-body text-xs sm:text-sm text-[#F6F3EB]/70">
                    New drops. Restocks. Strange announcements. Nothing boring.
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <input
                    id="penny-club-email"
                    name="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="ENTER YOUR EMAIL..."
                    className="flex-1 border-2 border-[#F6F3EB] bg-[#23211E] px-4 py-3 font-pixel-display text-sm text-[#F6F3EB] placeholder:text-[#F6F3EB]/35 focus:outline-none focus:border-[#D95D39]"
                  />
                  <PixelMailboxWidget isValidEmail={isEmailValid} />
                </div>
              </div>

              {/* 04 — WHY ARE YOU HERE? (Interactive Pixel Cards) */}
              <div className="border-2 border-[#F6F3EB]/40 bg-[#181715] p-5 space-y-4">
                <div className="space-y-1">
                  <div className="font-pixel-mono text-xs text-[#E6B84D]">
                    04 — WHY ARE YOU HERE?
                  </div>
                  <h3 className="font-pixel-display text-base sm:text-lg font-bold text-[#F6F3EB]">
                    SO... WHY DID YOU COME HERE?
                  </h3>
                  <p className="font-pixel-body text-xs sm:text-sm text-[#F6F3EB]/70">
                    Be honest. The creatures are listening.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {REASON_OPTIONS.map((card) => {
                    const isSelected = selectedReasons.includes(card.id);
                    const isBouncing = bouncingCardId === card.id;
                    return (
                      <button
                        key={card.id}
                        type="button"
                        onClick={() => handleToggleReason(card.id)}
                        aria-pressed={isSelected}
                        className={`text-left p-3.5 border-2 transition-all cursor-pointer flex flex-col justify-between gap-2 ${
                          isBouncing ? '-translate-y-1.5' : ''
                        } ${
                          isSelected
                            ? 'border-[#E6B84D] bg-[#2A2622] shadow-[4px_4px_0_#D95D39]'
                            : 'border-[#F6F3EB]/30 bg-[#23211E] hover:border-[#F6F3EB]'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span className="font-pixel-display text-xs font-bold text-[#F6F3EB] leading-snug">
                            <span className="mr-1.5" aria-hidden="true">
                              {card.icon}
                            </span>
                            {card.title}
                          </span>

                          {/* Tiny Creature Reaction + Pixel Checkmark */}
                          <div className="flex items-center gap-1.5 shrink-0">
                            {isSelected && (
                              <PixelCreatureSprite
                                className="w-4 h-4 animate-pixel-bounce"
                                color={card.color}
                              />
                            )}
                            <span
                              className={`w-4 h-4 border flex items-center justify-center font-pixel-mono text-[11px] font-bold ${
                                isSelected
                                  ? 'border-[#E6B84D] bg-[#E6B84D] text-[#181715]'
                                  : 'border-[#F6F3EB]/40 text-transparent'
                              }`}
                            >
                              ✓
                            </span>
                          </div>
                        </div>

                        <p className="font-pixel-body text-xs text-[#F6F3EB]/70">
                          &ldquo;{card.quote}&rdquo;
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Validation Message */}
              {errorMsg && (
                <div
                  role="alert"
                  className="border-2 border-[#D95D39] bg-[#2C1A16] px-4 py-3 flex items-center gap-3 font-pixel-display text-xs text-[#E6B84D]"
                >
                  <PixelChompSprite className="w-6 h-6 shrink-0 animate-pixel-bounce" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Final Button: LET ME IN → with hover pixel scatter + Privacy Note */}
              <div className="space-y-3 pt-1">
                <div className="relative">
                  {/* Tiny Scattering Pixels on Button Hover */}
                  {btnHovered && status === 'idle' && (
                    <div
                      className="pointer-events-none absolute -inset-2 flex items-center justify-between px-4"
                      aria-hidden="true"
                    >
                      <span className="w-2 h-2 bg-[#E6B84D] -translate-y-3 animate-ping" />
                      <PixelStar className="w-4 h-4 -translate-y-4 animate-pixel-bounce" />
                      <span className="w-2 h-2 bg-[#D95D39] -translate-y-3 animate-ping" />
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={status === 'scanning'}
                    onMouseEnter={() => setBtnHovered(true)}
                    onMouseLeave={() => setBtnHovered(false)}
                    className="w-full pixel-btn bg-[#D95D39] hover:bg-[#E6B84D] hover:text-[#181715] text-[#F6F3EB] border-[#F6F3EB] py-4 px-6 font-pixel-display text-sm sm:text-base uppercase tracking-wider flex items-center justify-center gap-3 cursor-pointer"
                  >
                    {status === 'scanning' ? (
                      <span className="font-pixel-mono text-lg tracking-widest">
                        {SCAN_STEPS[scanStepIdx]}
                      </span>
                    ) : (
                      <span>LET ME IN →</span>
                    )}
                  </button>
                </div>

                {/* Extremely Small Readable Privacy Note & Normal Privacy Policy Link */}
                <div className="text-[11px] font-pixel-body text-[#F6F3EB]/65 flex flex-wrap items-center justify-between gap-2 pt-1">
                  <span>
                    Your details stay with PENNY. No selling. No spam. Just
                    occasional creature-related nonsense.
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      sound.playBlip(540, 0.03);
                      onOpenPrivacyPolicy();
                    }}
                    className="underline text-[#E6B84D] hover:text-[#D95D39] cursor-pointer"
                  >
                    Privacy Policy
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>
    </section>
  );
};
