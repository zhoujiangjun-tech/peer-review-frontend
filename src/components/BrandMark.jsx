/**
 * components/BrandMark.jsx
 * 品牌标：双环 + 圆点（暗示「多视角评审」），可配副标
 */

import { palette } from '../theme.js';

export default function BrandMark({ showText = true, size = 32, compact = false }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <svg width={size} height={size} viewBox="0 0 32 32">
        <circle cx="16" cy="16" r="14" fill="none" stroke={palette.primary} strokeWidth="1.5" />
        <circle cx="16" cy="16" r="8"  fill="none" stroke={palette.primary} strokeWidth="1.5" opacity="0.5" />
        <circle cx="16" cy="16" r="3"  fill={palette.primary} />
      </svg>
      {showText && !compact && (
        <div style={{ lineHeight: 1.1 }}>
          <div style={{
            fontFamily: 'Instrument Serif, serif',
            fontSize: 20,
            color: palette.ink,
            letterSpacing: 0.3
          }}>
            Peer Review
          </div>
          <div style={{
            fontSize: 10,
            color: palette.mute,
            letterSpacing: 2,
            textTransform: 'uppercase'
          }}>
            作业互评系统
          </div>
        </div>
      )}
    </div>
  );
}
