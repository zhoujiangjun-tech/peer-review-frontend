/**
 * pages/student/StudentAssignments.jsx
 * 学生：我的作业（已加入班级的所有作业）
 *
 *   - 卡片网格：每张卡片含作业标题、状态、提交/修改按钮
 *   - 已提交显示提交时间 + 文件名
 *   - 弹窗：支持文件上传（pdf/word/图片/压缩包等） + 文字内容
 *   - 同一弹窗既支持首次提交，也支持修改提交
 */

import { useEffect, useState } from 'react';
import {
  Row, Col, Card, Button, Modal, Form, Input, Upload,
  App as AntApp, Spin, Tag, Tooltip
} from 'antd';
import {
  UploadOutlined, CheckCircleOutlined, InboxOutlined,
  PaperClipOutlined, FileTextOutlined, EditOutlined, DownloadOutlined
} from '@ant-design/icons';

import { assignmentApi, submissionApi } from '../../api/index.js';
import { palette } from '../../theme.js';
import StatusTag from '../../components/StatusTag.jsx';
import EmptyState from '../../components/EmptyState.jsx';
import dayjs from 'dayjs';

const { Dragger } = Upload;

// 接受的文件扩展名（与后端白名单保持一致）
const ACCEPT_EXT = [
  '.pdf','.doc','.docx','.ppt','.pptx','.xls','.xlsx','.txt','.md','.rtf',
  '.zip','.7z','.rar','.tar','.gz',
  '.png','.jpg','.jpeg','.gif','.webp','.bmp','.svg',
  '.js','.ts','.jsx','.tsx','.py','.java','.c','.cpp','.h','.hpp',
  '.go','.rs','.rb','.php','.sh','.json','.xml','.yaml','.yml','.html','.css','.sql'
].join(',');

function formatSize(b) {
  if (!b && b !== 0) return '';
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / 1024 / 1024).toFixed(2)} MB`;
}

export default function StudentAssignments() {
  const { message } = AntApp.useApp();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [mineMap, setMineMap] = useState({});
  // openTarget: { id, mode: 'submit' | 'update', existing? }
  const [openTarget, setOpenTarget] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm();
  const [file, setFile] = useState(null);   // 待上传的新文件

  const load = async () => {
    setLoading(true);
    try {
      const { assignments } = await assignmentApi.list();
      setItems(assignments);
      const pairs = await Promise.all(
        assignments.map(async (a) => {
          try {
            const { submissions } = await submissionApi.mine(a.id);
            return [a.id, submissions[0] || null];
          } catch {
            return [a.id, null];
          }
        })
      );
      setMineMap(Object.fromEntries(pairs));
    } catch {
      message.error('加载作业列表失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

  // 打开"首次提交"弹窗
  const openSubmit = (id) => {
    form.resetFields();
    setFile(null);
    setOpenTarget({ id, mode: 'submit' });
  };

  // 打开"修改提交"弹窗（带旧值预填）
  const openUpdate = (assignment) => {
    const mine = mineMap[assignment.id];
    if (!mine) return;
    form.resetFields();
    form.setFieldsValue({ content: mine.content || '' });
    setFile(null);
    setOpenTarget({ id: assignment.id, mode: 'update', existing: mine });
  };

  const closeSubmit = () => {
    setOpenTarget(null);
    setFile(null);
  };

  const onSubmit = async (values) => {
    const target = openTarget;
    if (!target) return;

    const hasNewFile = !!file;
    const hasContent = !!(values.content && values.content.trim());

    // 修改模式：必须保留至少一项（不传文件则保留旧文件）
    if (target.mode === 'update' && !hasNewFile && !hasContent) {
      // 还要检查旧提交至少有一项
      const oldHasFile = !!target.existing?.file_path;
      const oldHasContent = !!(target.existing?.content && target.existing.content.trim());
      if (!oldHasFile && !oldHasContent) {
        message.warning('请上传文件或填写文字内容');
        return;
      }
    }
    // 首次提交：必须填一个
    if (target.mode === 'submit' && !hasNewFile && !hasContent) {
      message.warning('请上传文件或填写文字内容');
      return;
    }

    setSubmitting(true);
    try {
      if (target.mode === 'submit') {
        await submissionApi.submit({
          assignment_id: target.id,
          content: values.content,
          file
        });
        message.success('提交成功');
      } else {
        await submissionApi.update(target.existing.id, {
          content: values.content,
          file
        });
        message.success('修改成功');
      }
      closeSubmit();
      await load();
    } catch (e) {
      message.error(e.response?.data?.error || (target.mode === 'submit' ? '提交失败' : '修改失败'));
    } finally {
      setSubmitting(false);
    }
  };

  // 下载老师发布的参考资料
  const downloadAssignmentAttachment = (a) => {
    assignmentApi.downloadAttachment(a.id, a.attachment_name)
      .catch((e) => message.error('下载失败：' + (e.response?.data?.error || e.message)));
  };

  // 提交弹窗里取当前作业的附件信息
  const currentAssignment = openTarget ? items.find((x) => x.id === openTarget.id) : null;

  if (loading) {
    return <div style={{ textAlign: 'center', padding: 80 }}><Spin size="large" /></div>;
  }

  return (
    <div>
      <h1 style={{ ...styles.title, fontSize: isMobile ? 24 : 36 }}>我的作业</h1>
      <p style={styles.subtitle}>已加入班级的所有作业</p>

      {items.length === 0 ? (
        <EmptyState
          title="暂无可提交作业"
          description="加入班级后，老师发布的作业会出现在这里"
        />
      ) : (
        <Row gutter={[20, 20]} style={{ marginTop: 24 }}>
          {items.map((a) => {
            const mine = mineMap[a.id];
            const submitted = !!mine;
            const isOpen = a.status === 'open';
            return (
              <Col key={a.id} xs={24} sm={12} md={8} lg={8}>
                <Card bordered style={styles.card}>
                  <div style={styles.cardHead}>
                    <StatusTag type="assignment" value={a.status} />
                    {submitted && (
                      <span style={{ color: palette.success, fontSize: 12 }}>
                        <CheckCircleOutlined /> 已提交
                      </span>
                    )}
                  </div>
                  <h3 style={styles.cardTitle}>
                    {a.title}
                    {a.attachment_name && (
                      <Tooltip title={`老师附件：${a.attachment_name}`}>
                        <Button
                          type="text"
                          size="small"
                          icon={<PaperClipOutlined />}
                          onClick={(e) => { e.stopPropagation(); downloadAssignmentAttachment(a); }}
                          style={{ marginLeft: 4, color: palette.primary, padding: '0 4px' }}
                        />
                      </Tooltip>
                    )}
                  </h3>
                  <p style={styles.cardDesc}>
                    {a.description || '（老师没有写描述）'}
                  </p>
                  {submitted && (
                    <div style={styles.submittedBox}>
                      <FileTextOutlined style={{ color: palette.mute, marginRight: 6 }} />
                      <span style={{ fontSize: 12, color: palette.inkSoft, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {mine.file_name || (mine.content ? '（仅文字内容）' : '（无内容）')}
                      </span>
                      {mine.file_size != null && (
                        <span style={{ fontSize: 11, color: palette.mute, marginRight: 6 }}>
                          {formatSize(mine.file_size)}
                        </span>
                      )}
                      <span style={{ fontSize: 12, color: palette.mute }}>
                        {dayjs(mine.submitted_at).format('MM-DD HH:mm')}
                      </span>
                      {mine.file_name && (
                        <Tooltip title="下载已提交文件">
                          <Button
                            type="text"
                            size="small"
                            icon={<DownloadOutlined />}
                            onClick={(e) => {
                              e.stopPropagation();
                              submissionApi.download(mine.id, mine.file_name);
                            }}
                            style={{ marginLeft: 4, color: palette.primary }}
                          />
                        </Tooltip>
                      )}
                    </div>
                  )}
                  <div style={styles.cardFoot}>
                    {isOpen && !submitted && (
                      <Button
                        type="primary"
                        icon={<UploadOutlined />}
                        onClick={() => openSubmit(a.id)}
                      >
                        提交作业
                      </Button>
                    )}
                    {isOpen && submitted && (
                      <Button
                        icon={<EditOutlined />}
                        onClick={() => openUpdate(a)}
                      >
                        修改提交
                      </Button>
                    )}
                    {!isOpen && !submitted && (
                      <span style={{ color: palette.mute, fontSize: 13 }}>已截止</span>
                    )}
                    {!isOpen && submitted && (
                      <Tag color="default" style={{ marginRight: 0 }}>已锁定，不可修改</Tag>
                    )}
                  </div>
                </Card>
              </Col>
            );
          })}
        </Row>
      )}

      <Modal
        title={openTarget?.mode === 'update' ? '修改提交' : '提交作业'}
        open={openTarget !== null}
        onCancel={closeSubmit}
        footer={null}
        destroyOnClose
        width={isMobile ? '100%' : 560}
        style={isMobile ? { top: 0, paddingBottom: 0, maxWidth: '100vw' } : undefined}
      >
        <Form form={form} layout="vertical" onFinish={onSubmit} style={{ marginTop: 16 }}>
          {/* 老师发布的参考资料 */}
          {currentAssignment?.attachment_name && (
            <div style={styles.teacherAttach}>
              <PaperClipOutlined style={{ color: palette.primary, fontSize: 16, marginRight: 8 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, color: palette.mute, marginBottom: 2 }}>老师附件（参考资料）</div>
                <div style={{
                  fontSize: 13, color: palette.ink, fontWeight: 500,
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                }}>
                  {currentAssignment.attachment_name}
                  {currentAssignment.attachment_size != null && (
                    <span style={{ color: palette.mute, fontWeight: 400, marginLeft: 6, fontSize: 12 }}>
                      ({formatSize(currentAssignment.attachment_size)})
                    </span>
                  )}
                </div>
              </div>
              <Button
                type="primary"
                size="small"
                icon={<DownloadOutlined />}
                onClick={() => downloadAssignmentAttachment(currentAssignment)}
              >
                下载
              </Button>
            </div>
          )}

          {/* 修改模式：显示已提交的文件，并提示可替换 */}
          {openTarget?.mode === 'update' && openTarget.existing?.file_path && (
            <div style={styles.existingFile}>
              <PaperClipOutlined style={{ color: palette.primary, marginRight: 8 }} />
              <span style={{ flex: 1, color: palette.ink, fontSize: 13, fontWeight: 500 }}>
                {openTarget.existing.file_name}
              </span>
              {openTarget.existing.file_size != null && (
                <Tag color="default" style={{ marginRight: 8 }}>
                  {formatSize(openTarget.existing.file_size)}
                </Tag>
              )}
              <Tooltip title="下载已提交文件">
                <Button
                  type="text"
                  size="small"
                  icon={<DownloadOutlined />}
                  onClick={() => submissionApi.download(openTarget.existing.id, openTarget.existing.file_name)}
                  style={{ color: palette.primary }}
                />
              </Tooltip>
            </div>
          )}

          {/* 文件上传区（替换或新增） */}
          <Form.Item
            label={
              openTarget?.mode === 'update' && openTarget.existing?.file_path
                ? '替换文件（可选，不选则保留原文件）'
                : '上传文件（可选）'
            }
            style={{ marginTop: openTarget?.mode === 'update' ? 12 : 0 }}
          >
            <Dragger
              multiple={false}
              maxCount={1}
              accept={ACCEPT_EXT}
              beforeUpload={(f) => {
                if (f.size > 20 * 1024 * 1024) {
                  message.error('文件超过 20MB');
                  return Upload.LIST_IGNORE;
                }
                setFile(f);
                return false; // 阻止 antd 自动上传
              }}
              onRemove={() => { setFile(null); }}
              fileList={file ? [{
                uid: '-1', name: file.name, status: 'done', size: file.size
              }] : []}
              style={{
                background: palette.paper,
                border: `1px dashed ${palette.line}`,
                borderRadius: 10
              }}
            >
              <p style={{ margin: '4px 0', color: palette.inkSoft, fontSize: 32 }}>
                <InboxOutlined />
              </p>
              <p style={{ color: palette.ink, margin: '4px 0', fontWeight: 500 }}>
                点击或拖拽文件到此处{openTarget?.mode === 'update' ? '替换' : '上传'}
              </p>
              <p style={{ color: palette.mute, fontSize: 12, margin: 0 }}>
                支持 pdf / word / ppt / excel / 图片 / 压缩包 / 代码等，单文件 ≤ 20MB
              </p>
            </Dragger>
          </Form.Item>

          {/* 文字内容 */}
          <Form.Item
            name="content"
            label={
              <span>
                <PaperClipOutlined style={{ marginRight: 6, color: palette.mute }} />
                附加说明（可选）
              </span>
            }
          >
            <Input.TextArea
              rows={4}
              placeholder="可以粘贴文字内容、备注、链接等..."
              style={{ fontFamily: 'Manrope, monospace', fontSize: 13 }}
            />
          </Form.Item>

          <div style={{ fontSize: 12, color: palette.mute, marginBottom: 12 }}>
            <Tag color="default">提示</Tag>
            {openTarget?.mode === 'update'
              ? '修改提交后，提交时间会更新；旧文件会被自动清理。'
              : '文件和文字内容至少填一个；提交后老师会看到你的文件。'}
          </div>

          <Button
            type="primary"
            htmlType="submit"
            loading={submitting}
            block
            size="large"
          >
            {openTarget?.mode === 'update' ? '保存修改' : '提交'}
          </Button>
        </Form>
      </Modal>
    </div>
  );
}

const styles = {
  title: { fontFamily: 'Instrument Serif, serif', fontSize: 36, color: palette.ink, margin: 0, fontWeight: 400 },
  subtitle: { color: palette.mute, fontSize: 14, marginTop: 4, marginBottom: 8 },
  card: { borderRadius: 12, border: `1px solid ${palette.line}` },
  cardHead: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  cardTitle: { fontSize: 18, fontWeight: 600, color: palette.ink, margin: '4px 0 8px' },
  cardDesc: { color: palette.mute, fontSize: 13, minHeight: 38 },
  submittedBox: {
    background: palette.lineSoft || '#f6f5f1',
    padding: '8px 10px',
    borderRadius: 8,
    marginTop: 10,
    display: 'flex',
    alignItems: 'center'
  },
  cardFoot: { marginTop: 16, display: 'flex', justifyContent: 'flex-end', minHeight: 32 },
  teacherAttach: {
    display: 'flex', alignItems: 'center',
    background: palette.paperWarm, border: `1px solid ${palette.line}`,
    borderRadius: 10, padding: '10px 12px', marginBottom: 12
  },
  existingFile: {
    background: palette.lineSoft || '#f6f5f1',
    padding: '8px 10px',
    borderRadius: 8,
    display: 'flex',
    alignItems: 'center'
  }
};
