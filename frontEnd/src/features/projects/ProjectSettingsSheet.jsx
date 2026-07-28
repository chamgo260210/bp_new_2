import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useLocation, useNavigate } from 'react-router-dom';

import { getUserErrorMessage } from '../../shared/api/apiError.js';
import { Alert, AppIcon, Button, Dialog, SideSheet, TextInput, Textarea } from '../../shared/ui/index.js';
import { useApiClient } from '../../shared/api/ApiClientProvider.jsx';
import { createProjectApi } from './api/projectApi.js';
import { useProjectContext } from './ProjectContext.jsx';
import { appRoutes, projectRoutes } from './routing/projectRoutes.js';
import './projects.css';

export function ProjectActionMenu({ project, onDelete, onOpenChange }) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState(null);
  const triggerRef = useRef(null);
  const menuId = useId();
  const navigate = useNavigate();
  const location = useLocation();
  const close = useCallback(() => { setOpen(false); onOpenChange?.(false); requestAnimationFrame(() => triggerRef.current?.focus()); }, [onOpenChange]);
  const toggle = (event) => {
    event.preventDefault(); event.stopPropagation();
    const next = !open;
    if (next) { const rect = triggerRef.current?.getBoundingClientRect(); setPosition(rect ? { top: rect.bottom + 6, left: rect.right - 176 } : null); }
    setOpen(next); onOpenChange?.(next);
  };
  useEffect(() => {
    if (!open) return undefined;
    const closeOnOutside = (event) => { if (!triggerRef.current?.contains(event.target) && !event.target.closest?.(`#${menuId}`)) close(); };
    const onKey = (event) => { if (event.key === 'Escape') { event.preventDefault(); close(); } };
    window.addEventListener('pointerdown', closeOnOutside); window.addEventListener('keydown', onKey); window.addEventListener('resize', close); window.addEventListener('scroll', close, true);
    return () => { window.removeEventListener('pointerdown', closeOnOutside); window.removeEventListener('keydown', onKey); window.removeEventListener('resize', close); window.removeEventListener('scroll', close, true); };
  }, [close, menuId, open]);
  const go = (to) => { navigate(to, { state: { backgroundLocation: location, returnTo: `${location.pathname}${location.search}` } }); close(); };
  const menu = open && position && createPortal(<div id={menuId} className="project-action-menu__panel" role="menu" style={{ top: position.top, left: Math.max(8, position.left) }}><button type="button" role="menuitem" onClick={() => go(projectRoutes.overview(project.projectId))}>프로젝트 열기</button><button type="button" role="menuitem" onClick={() => go(projectRoutes.settings(project.projectId))}><AppIcon name="settings" />프로젝트 설정</button>{onDelete && <button type="button" role="menuitem" className="is-danger" onClick={() => { onDelete(); close(); }}><AppIcon name="trash" />프로젝트 삭제</button>}</div>, document.body);
  return <div className="project-action-menu"><Button ref={triggerRef} type="button" variant="ghost" className="project-action-menu__trigger" aria-label={`${project.name} 프로젝트 메뉴`} aria-haspopup="menu" aria-controls={open ? menuId : undefined} aria-expanded={open} onClick={toggle}><AppIcon name="more" /></Button>{menu}</div>;
}

export default function ProjectSettingsSheet() {
  const client = useApiClient();
  const navigate = useNavigate();
  const location = useLocation();
  const { project, retry } = useProjectContext();
  const [values, setValues] = useState({ title: project.name, industryCategory: project.industryCategory || '', description: project.description || '' });
  const [saving, setSaving] = useState(false); const [message, setMessage] = useState(''); const [error, setError] = useState('');
  const [confirmingDelete, setConfirmingDelete] = useState(false); const [confirmation, setConfirmation] = useState(''); const [deleting, setDeleting] = useState(false); const [deleteError, setDeleteError] = useState('');
  const update = (field) => (event) => setValues((current) => ({ ...current, [field]: event.target.value }));
  const close = () => { const returnTo = location.state?.returnTo; navigate(returnTo || projectRoutes.overview(project.projectId), { replace: Boolean(returnTo) }); };
  const save = async (event) => { event.preventDefault(); if (saving || !values.title.trim()) return; setSaving(true); setError(''); setMessage(''); try { await createProjectApi(client).update(project.projectId, { title: values.title.trim(), industryCategory: values.industryCategory.trim() || null, description: values.description.trim() || null }); await retry(); setMessage('변경사항을 저장했습니다.'); } catch (nextError) { setError(getUserErrorMessage(nextError)); } finally { setSaving(false); } };
  const remove = async () => { if (confirmation !== project.name || deleting) return; setDeleting(true); setDeleteError(''); try { await createProjectApi(client).remove(project.projectId); navigate(appRoutes.projects, { replace: true }); } catch (nextError) { setDeleteError(getUserErrorMessage(nextError)); setDeleting(false); } };
  const matches = confirmation === project.name;
  return <><SideSheet open title="프로젝트 설정" label="프로젝트 설정" onClose={saving ? () => {} : close} footer={<><Button variant="outline" size="small" disabled={saving} onClick={close}>취소</Button><Button type="submit" size="small" form="project-settings-form" loading={saving} disabled={saving}>변경사항 저장</Button></>}><div className="project-sheet__heading"><span><AppIcon name="settings" size={20} /></span><div><h2>프로젝트 설정</h2><p>프로젝트 기본 정보와 삭제를 관리합니다.</p></div></div><form id="project-settings-form" className="project-sheet__form" onSubmit={save}>{error && <Alert tone="danger" title="저장하지 못했습니다.">{error}</Alert>}{message && <Alert tone="success" title="저장됨">{message}</Alert>}<TextInput id="project-settings-title" label="프로젝트 이름" value={values.title} maxLength="150" required onChange={update('title')} /><TextInput id="project-settings-industry" label="사업 분야" value={values.industryCategory} maxLength="100" onChange={update('industryCategory')} /><Textarea id="project-settings-description" label="프로젝트 설명" value={values.description} maxLength="10000" onChange={update('description')} /></form><section className="project-sheet__danger"><div><span><AppIcon name="trash" /></span><div><h2>프로젝트 삭제</h2><p>프로젝트와 연결된 문서·분석 결과에 더 이상 접근할 수 없습니다. 이 작업은 되돌릴 수 없습니다.</p></div></div><Button variant="danger" size="small" onClick={() => setConfirmingDelete(true)}><AppIcon name="trash" />프로젝트 삭제</Button></section></SideSheet><Dialog open={confirmingDelete} onClose={() => !deleting && setConfirmingDelete(false)} title="프로젝트를 삭제할까요?"><div className="project-delete-dialog"><p>이 작업은 되돌릴 수 없습니다. 연결된 문서와 분석 결과도 더 이상 사용할 수 없습니다.</p><div className="project-delete-dialog__target"><span>삭제할 프로젝트</span><strong>{project.name}</strong></div><TextInput id="delete-project-confirmation" label="확인을 위해 프로젝트 이름을 입력하세요." value={confirmation} onChange={(event) => setConfirmation(event.target.value)} />{confirmation && !matches && <p className="project-delete-dialog__mismatch" role="status">프로젝트 이름이 일치하지 않습니다.</p>}{deleteError && <Alert tone="danger" title="삭제하지 못했습니다.">{deleteError}</Alert>}<div className="dialog-actions"><Button variant="outline" disabled={deleting} onClick={() => setConfirmingDelete(false)}>취소</Button><Button variant="danger" loading={deleting} disabled={!matches || deleting} onClick={remove}>영구 삭제</Button></div></div></Dialog></>;
}
