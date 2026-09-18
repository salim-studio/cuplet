// GPU-accelerated effects via CSS filter strings (browser-optimized, faster than custom WebGL passes).
export const FILTERS: Record<string, { label: string; value: string }> = {
  none: { label: 'بدون', value: '' },
  cinema: { label: 'سينمائي', value: 'contrast(1.12) saturate(1.15) brightness(.98)' },
  warm: { label: 'دافئ', value: 'sepia(.35) saturate(1.3) contrast(1.05)' },
  cold: { label: 'بارد', value: 'saturate(.9) hue-rotate(15deg) brightness(1.05)' },
  bw: { label: 'أبيض وأسود', value: 'grayscale(1) contrast(1.15)' },
  vintage: { label: 'فينتاج', value: 'sepia(.6) contrast(.95) brightness(1.02)' },
  vivid: { label: 'زاهي', value: 'saturate(1.8) contrast(1.15)' },
  blurbg: { label: 'ضبابي', value: 'blur(0px)' },
};

export function captionStyle(preset: string): { bg: string; color: string; weight: number } {
  switch (preset) {
    case 'karaoke': return { bg: 'rgba(0,0,0,.65)', color: '#ffe45e', weight: 800 };
    case 'minimal': return { bg: 'transparent', color: '#ffffff', weight: 600 };
    case 'pop': return { bg: '#7c3aed', color: '#ffffff', weight: 800 };
    default: return { bg: 'rgba(0,0,0,.7)', color: '#ffffff', weight: 700 };
  }
}
