import React from 'react';
import {
  PixelCreatureSprite,
  PixelChompSprite,
  PixelBlobSprite,
  PixelDivider,
  PixelStar,
} from './PixelSprites';

export const ConceptSection: React.FC = () => {
  return (
    <section
      id="concept-section"
      className="bg-[#EFECE2] border-b-[3px] border-[#1C1917] py-14 sm:py-20 relative overflow-hidden"
    >
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="pixel-box bg-[#F6F3EB] p-6 sm:p-10 lg:p-12 relative">
          {/* Decorative Pixel Sprites in Corners */}
          <div className="hidden sm:flex items-center gap-2 absolute -top-5 left-8 pixel-box-sm bg-[#E6B84D] px-3 py-1">
            <PixelStar className="w-3.5 h-3.5" color="#1C1917" />
            <span className="font-pixel-mono text-sm font-bold text-[#1C1917]">
              THE CONCEPT
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Left Side: Heading & Pixel Sprite Trio */}
            <div className="lg:col-span-6 space-y-6">
              <h2
                className="font-pixel-display text-2xl sm:text-3xl lg:text-4xl font-bold text-[#1C1917] leading-tight"
                style={{ textWrap: 'balance' }}
              >
                WHY DOES A PEN HOLDER NEED A PERSONALITY?
              </h2>

              <div className="flex items-center gap-4 pt-2">
                <div className="pixel-box-sm bg-[#EFECE2] p-3 flex flex-col items-center gap-1">
                  <PixelCreatureSprite className="w-10 h-10 animate-pixel-bounce" />
                  <span className="font-pixel-mono text-xs text-[#57534E]">WEIRD</span>
                </div>
                <div className="pixel-box-sm bg-[#EFECE2] p-3 flex flex-col items-center gap-1">
                  <PixelChompSprite className="w-10 h-10 animate-float-slow" />
                  <span className="font-pixel-mono text-xs text-[#57534E]">HUNGRY</span>
                </div>
                <div className="pixel-box-sm bg-[#EFECE2] p-3 flex flex-col items-center gap-1">
                  <PixelBlobSprite className="w-10 h-10 animate-pixel-bounce" />
                  <span className="font-pixel-mono text-xs text-[#57534E]">CALM</span>
                </div>
              </div>
            </div>

            {/* Right Side: Exact Brand Copy */}
            <div className="lg:col-span-6 space-y-4 font-pixel-body text-lg sm:text-xl text-[#1C1917] leading-relaxed border-t-2 lg:border-t-0 lg:border-l-[3px] border-[#1C1917] pt-6 lg:pt-0 lg:pl-8">
              <p className="font-semibold">
                We thought your desk deserved better than another boring plastic cup.
              </p>
              <p className="text-[#57534E]">
                PENNY creates strange little creatures designed to hold your pens,
                pencils and other desk essentials.
              </p>
              <div className="pt-2 space-y-1.5 font-pixel-display text-sm sm:text-base text-[#1C1917]">
                <div className="flex items-center gap-2.5">
                  <span className="w-2.5 h-2.5 bg-[#4A6B53] inline-block shrink-0" />
                  <span>They are useful.</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <span className="w-2.5 h-2.5 bg-[#E6B84D] inline-block shrink-0" />
                  <span>They are collectible.</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <span className="w-2.5 h-2.5 bg-[#D95D39] inline-block shrink-0" />
                  <span>They are slightly ridiculous.</span>
                </div>
              </div>
              <p className="pt-2 font-pixel-display text-base sm:text-lg text-[#D95D39]">
                That&apos;s the point.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-8">
          <PixelDivider />
        </div>
      </div>
    </section>
  );
};
