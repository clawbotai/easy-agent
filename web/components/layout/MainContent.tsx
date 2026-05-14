'use client';

import { useAppStore } from '@/store/appStore';
import HeroSection from '@/components/landing/HeroSection';
import StarterGrid from '@/components/landing/StarterGrid';
import Thread from '@/components/conversation/Thread';
import Composer from '@/components/composer/Composer';

export default function MainContent() {
  const { currentRun } = useAppStore();

  return (
    <section className="flex flex-col min-h-0 min-w-0">
      <div className="flex-1 min-h-0 overflow-auto">
        {currentRun ? (
          <Thread />
        ) : (
          <div className="min-h-full flex items-center justify-center p-8">
            <div className="w-full max-w-2xl animate-fade-in">
              <HeroSection />
              <StarterGrid />
            </div>
          </div>
        )}
      </div>
      <Composer />
    </section>
  );
}
