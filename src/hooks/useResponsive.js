/**
 * useResponsive.js
 * 响应式断点 hook（基于 antd Grid）
 *
 * 返回：
 *   - breakpoints: antd 原始断点对象 { xs, sm, md, lg, xl, xxl }
 *   - isMobile:    true 表示 < md (< 768px)
 *   - isTablet:    true 表示 md <= w < lg (768~992)
 *   - isDesktop:   true 表示 >= lg
 */

import { Grid } from 'antd';

const { useBreakpoint } = Grid;

export default function useResponsive() {
  const bp = useBreakpoint();

  const isMobile  = !bp.md;                   // < 768
  const isTablet  = !!bp.md && !bp.lg;         // 768~992
  const isDesktop = !!bp.lg;                   // >= 992

  return { breakpoints: bp, isMobile, isTablet, isDesktop };
}
