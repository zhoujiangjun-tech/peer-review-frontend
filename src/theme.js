/**
 * theme.js
 * Ant Design v5 主题 token 定制
 *
 * 调色：深森林绿（主色）+ 朱砂红（强调） + 暖白（背景）
 * 字体：Instrument Serif（serif 显示）+ Manrope（无衬线正文）
 */

import { theme as antdTheme } from 'antd';

// 调色板
export const palette = {
  primary:     '#2D5F4A',  // 深森林绿
  primarySoft: '#E8F0EC',  // 主色淡背景
  accent:      '#A23B2D',  // 朱砂红（强调）
  ink:         '#1A1A1A',  // 主文字
  inkSoft:     '#4A4A4A',  // 次要文字
  mute:        '#8C8C8C',  // 辅助文字
  line:        '#E8E5DE',  // 边框
  lineSoft:    '#F0EDE6',  // 淡边框
  paper:       '#FAFAF7',  // 背景
  paperWarm:   '#F5F2EC',  // 暖色面板
  surface:     '#FFFFFF',
  success:     '#3F7C5F',
  warning:     '#B8862C',
  danger:      '#A23B2D',
  info:        '#4A6B7C'
};

export const theme = {
  algorithm: antdTheme.defaultAlgorithm,
  token: {
    colorPrimary:       palette.primary,
    colorInfo:          palette.info,
    colorSuccess:       palette.success,
    colorWarning:       palette.warning,
    colorError:         palette.danger,
    colorTextBase:      palette.ink,
    colorBgBase:        palette.surface,
    colorBgLayout:      palette.paper,
    colorBgContainer:   palette.surface,
    colorBgElevated:    palette.surface,
    colorBorder:        palette.line,
    colorBorderSecondary: palette.lineSoft,

    borderRadius:    8,
    borderRadiusLG:  12,
    borderRadiusSM:  6,

    fontFamily: 'Manrope, -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif',
    fontSize:   14,
    fontSizeLG: 16,
    fontSizeHeading1: 38,
    fontSizeHeading2: 30,
    fontSizeHeading3: 24,

    boxShadow:
      '0 1px 2px rgba(26,26,26,0.04), 0 4px 12px rgba(26,26,26,0.04)',
    boxShadowSecondary:
      '0 1px 3px rgba(26,26,26,0.06), 0 8px 24px rgba(26,26,26,0.06)',
    boxShadowTertiary: '0 2px 8px rgba(26,26,26,0.05)',

    wireframe: false
  },
  components: {
    Button: {
      controlHeight: 38,
      controlHeightLG: 44,
      fontWeight: 500,
      primaryShadow: 'none',
      defaultShadow: 'none',
      dangerShadow: 'none'
    },
    Card: {
      borderRadiusLG: 14,
      paddingLG: 28,
      boxShadowTertiary:
        '0 1px 2px rgba(26,26,26,0.04), 0 4px 16px rgba(26,26,26,0.04)'
    },
    Input: {
      controlHeight: 40,
      controlHeightLG: 48,
      paddingBlock: 10
    },
    Layout: {
      bodyBg: palette.paper,
      headerBg: palette.surface,
      headerHeight: 64,
      headerPadding: '0 32px',
      siderBg: palette.surface
    },
    Menu: {
      itemBg: 'transparent',
      itemSelectedBg: palette.primarySoft,
      itemSelectedColor: palette.primary,
      itemHoverBg: palette.lineSoft,
      itemBorderRadius: 8,
      itemMarginInline: 8,
      itemHeight: 40
    },
    Tag: {
      borderRadiusSM: 6,
      defaultBg: palette.lineSoft,
      defaultColor: palette.inkSoft
    },
    Modal: {
      borderRadiusLG: 16
    },
    Progress: {
      defaultColor: palette.primary,
      remainingColor: palette.lineSoft
    }
  }
};
