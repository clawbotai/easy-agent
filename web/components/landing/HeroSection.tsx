export default function HeroSection() {
  return (
    <div className="text-center mb-10">
      <div className="inline-flex items-center justify-center w-16 h-16 mb-6 shape-rect-lg bg-gradient-to-br from-accent to-accent-light shadow-[0_0_40px_-10px_rgba(99,102,241,0.5)]">
        <span className="text-white text-2xl font-bold">M</span>
      </div>
      <h1 className="text-4xl font-bold text-gradient mb-3 tracking-tight">
        MOSS
      </h1>
      <p className="text-text-secondary text-base max-w-md mx-auto leading-relaxed">
        由 Claude Code 与 Codex 协作驱动的智能开发平台
      </p>
    </div>
  );
}
