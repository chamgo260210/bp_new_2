import { useEffect, useRef, useState } from 'react';

import { PROJECT_AREA_DEFINITIONS, PROJECT_STATUS_VIEW } from '../model/projectWorkflowModel.js';

const AREA_DESCRIPTIONS = { OVERVIEW: '프로젝트 전체 현황', PLAN: '사업계획서와 구조화 계획', REVIEW: '법률·규제와 사업 타당성 분석', VALIDATE: 'AI 패널과 시장 반응 검증', REPORT: '통합 분석 결과' };
const STATUS_DESCRIPTIONS = { DRAFT: '준비 중인 프로젝트', ACTIVE: '작업을 진행 중인 프로젝트', PAUSED: '일시 중단된 프로젝트', COMPLETED: '검증이 완료된 프로젝트', ARCHIVED: '보관된 프로젝트' };

export default function ProjectStatusHelp() {
  const [open, setOpen] = useState(false);
  const railRef = useRef(null);
  useEffect(() => {
    if (!open) return undefined;
    const onPointerDown = (event) => { if (!railRef.current?.contains(event.target)) setOpen(false); };
    const onKeyDown = (event) => { if (event.key === 'Escape') setOpen(false); };
    window.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('keydown', onKeyDown);
    return () => { window.removeEventListener('pointerdown', onPointerDown); window.removeEventListener('keydown', onKeyDown); };
  }, [open]);
  return <aside ref={railRef} className={`project-status-help ${open ? 'is-open' : ''}`} aria-label="프로젝트 상태 안내">
    <button type="button" className="project-status-help__trigger" aria-expanded={open} aria-controls="project-status-help-content" onClick={() => setOpen((value) => !value)}><span aria-hidden="true">?</span><span>상태 안내</span></button>
    {open && <div id="project-status-help-content" className="project-status-help__content"><div><h2>Area</h2><p>프로젝트가 현재 위치한 검증 영역입니다.</p><dl>{PROJECT_AREA_DEFINITIONS.map((area) => <div key={area.id}><dt>{area.label}</dt><dd>{AREA_DESCRIPTIONS[area.id]}</dd></div>)}</dl></div><div><h2>Status</h2><p>프로젝트 전체 처리 상태입니다.</p><dl>{Object.entries(PROJECT_STATUS_VIEW).map(([status, view]) => <div key={status}><dt>{view.label}</dt><dd>{STATUS_DESCRIPTIONS[status] || status}</dd></div>)}</dl></div></div>}
  </aside>;
}
