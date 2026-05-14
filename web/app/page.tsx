'use client';

import ParticleCanvas from '@/components/particles/ParticleCanvas';
import TopBar from '@/components/layout/TopBar';
import Sidebar from '@/components/layout/Sidebar';
import MainContent from '@/components/layout/MainContent';

export default function Home() {
  return (
    <div className="noise-bg grid-bg">
      <ParticleCanvas />
      <main className="relative z-10 grid grid-cols-[280px_1fr] grid-rows-[56px_1fr] h-screen">
        <TopBar />
        <Sidebar />
        <MainContent />
      </main>
    </div>
  );
}
