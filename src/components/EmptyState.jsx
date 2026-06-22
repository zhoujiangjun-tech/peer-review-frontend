/**
 * components/EmptyState.jsx
 * 友好空状态：插画（纯 SVG）+ 主副标题 + 可选 CTA
 */

import { palette } from '../theme.js';

export default function EmptyState({
  title = '空空如也',
  description,
  action
}) {
  return (
    <div
      style={{
        textAlign: 'center',
        padding: '64px 24px',
        background: palette.surface,
        borderRadius: 14,
        border: `1px dashed ${palette.line}`
      }}
    >
      {/* 抽象插画：同心圆 + 一片叶子 */}
      <svg width="120" height="120" viewBox="0 0 120 120" style={{ marginBottom: 16 }}>
        <circle cx="60" cy="60" r="48" fill={palette.lineSoft} />
        <circle cx="60" cy="60" r="32" fill="none" stroke={palette.line} strokeWidth="1.5" />
        <circle cx="60" cy="60" r="16" fill={palette.primarySoft} />
        <circle cx="60" cy="60" r="4"  fill={palette.primary} />
      </svg>

      <div style={{
        fontFamily: 'Instrument Serif, serif',
        fontSize: 22,
        color: palette.ink,
        marginBottom: 6
      }}>
        {title}
      </div>
      {description && (
        <div style={{ color: palette.mute, fontSize: 14, marginBottom: action ? 20 : 0 }}>
          {description}
        </div>
      )}
      {action}
    </div>
  );
}
