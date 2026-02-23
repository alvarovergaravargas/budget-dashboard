import React from 'react';

const Bone = ({ w = '100%', h = 20, style = {} }) => (
  <div style={{
    width: w, height: h, borderRadius: 8,
    background: 'linear-gradient(90deg, var(--bg-card) 25%, var(--bg-hover) 50%, var(--bg-card) 75%)',
    backgroundSize: '200% 100%',
    animation: 'shimmer 1.5s infinite',
    ...style,
  }} />
);

export const LoadingSkeleton = () => (
  <div style={{ padding:'32px', display:'flex', flexDirection:'column', gap:24 }}>
    <style>{`@keyframes shimmer { from { background-position: 200% 0 } to { background-position: -200% 0 } }`}</style>
    {/* KPI row */}
    <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:16 }}>
      {[...Array(4)].map((_,i) => <Bone key={i} h={110} style={{ borderRadius:16 }} />)}
    </div>
    {/* Charts row */}
    <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr', gap:16 }}>
      <Bone h={340} style={{ borderRadius:16 }} />
      <Bone h={340} style={{ borderRadius:16 }} />
    </div>
    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
      <Bone h={300} style={{ borderRadius:16 }} />
      <Bone h={300} style={{ borderRadius:16 }} />
    </div>
    <Bone h={400} style={{ borderRadius:16 }} />
  </div>
);
