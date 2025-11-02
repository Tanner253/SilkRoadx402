'use client';

export function FallingLeavesCSS() {
  // Generate 20 leaves with random positions and animation delays
  const leaves = Array.from({ length: 20 }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    animationDelay: Math.random() * 10,
    animationDuration: 10 + Math.random() * 10,
    size: 20 + Math.random() * 20,
    emoji: Math.random() > 0.5 ? '🍁' : '🍂',
  }));

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-[15]">
      {leaves.map((leaf) => (
        <div
          key={leaf.id}
          className="falling-leaf"
          style={{
            left: `${leaf.left}%`,
            top: '-50px',
            fontSize: `${leaf.size}px`,
            animationDelay: `${leaf.animationDelay}s`,
            animationDuration: `${leaf.animationDuration}s, ${leaf.animationDuration * 0.6}s, ${leaf.animationDuration * 0.8}s`,
            opacity: 0.9,
          }}
        >
          {leaf.emoji}
        </div>
      ))}
    </div>
  );
}

