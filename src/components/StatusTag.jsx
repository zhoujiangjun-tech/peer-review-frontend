/**
 * components/StatusTag.jsx
 * 状态标签：不同状态映射到不同颜色 / 文本
 *
 *   <StatusTag type="assignment" value={a.status} />
 *   <StatusTag type="review" value={task.completed} />
 */

import { Tag } from 'antd';
import { palette } from '../theme.js';

const MAP = {
  assignment: {
    open:     { color: 'gold',     text: '待提交',  bg: '#FDF6E3' },
    reviewing:{ color: 'green',    text: '评审中',  bg: palette.primarySoft },
    closed:   { color: 'default',  text: '已截止',  bg: palette.lineSoft }
  },
  review: {
    true:  { color: 'green',   text: '已完成', bg: palette.primarySoft },
    false: { color: 'volcano', text: '待评',   bg: '#FDECEC' }
  },
  submission: {
    true:  { color: 'green',  text: '已提交', bg: palette.primarySoft },
    false: { color: 'default', text: '未提交', bg: palette.lineSoft }
  }
};

export default function StatusTag({ type, value }) {
  const cfg = MAP[type]?.[String(value)];
  if (!cfg) return null;
  return (
    <Tag
      style={{
        background: cfg.bg,
        color: cfg.color === 'default' ? palette.inkSoft : palette[cfg.color] || palette.inkSoft,
        border: 'none',
        fontWeight: 500,
        padding: '2px 10px'
      }}
    >
      {cfg.text}
    </Tag>
  );
}
