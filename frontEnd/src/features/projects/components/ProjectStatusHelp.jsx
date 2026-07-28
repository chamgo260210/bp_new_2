import { useEffect, useMemo, useRef, useState } from 'react';

import { PROJECT_AREA_DEFINITIONS, PROJECT_STATUS_VIEW } from '../model/projectWorkflowModel.js';

const AREA_DESCRIPTIONS = { OVERVIEW: '프로젝트 전체 현황', PLAN: '사업계획서와 구조화 계획', REVIEW: '법률·규제와 사업 타당성 분석', VALIDATE: 'AI 패널과 시장 반응 검증', REPORT: '통합 분석 결과' };
const STATUS_DESCRIPTIONS = { DRAFT: '준비 중인 프로젝트', ACTIVE: '작업을 진행 중인 프로젝트', PAUSED: '일시 중단된 프로젝트', COMPLETED: '검증이 완료된 프로젝트', ARCHIVED: '보관된 프로젝트' };

export default function ProjectStatusHelp({ persistent = false, visible = true }) {
  const [open, setOpen] = useState(false);
  const [slide, setSlide] = useState(0);
  const railRef = useRef(null);
  const slides = useMemo(() => [
    { title: 'AREA', body: <>프로젝트가 현재 어느 검증 영역에 있는지 나타냅니다.<dl>{PROJECT_AREA_DEFINITIONS.filter((area) => area.id !== 'OVERVIEW').map((area) => <div key={area.id}><dt>{area.label}</dt><dd>{AREA_DESCRIPTIONS[area.id]}</dd></div>)}</dl></> },
    { title: 'STATUS', body: <>프로젝트 전체 처리 상태를 나타냅니다.<dl>{Object.entries(PROJECT_STATUS_VIEW).map(([status, view]) => <div key={status}><dt>{view.label}</dt><dd>{STATUS_DESCRIPTIONS[status] || status}</dd></div>)}</dl></> },
    { title: '프로젝트 열기', body: <>프로젝트 행 전체를 선택하면 해당 프로젝트로 이동합니다. 더보기 메뉴에서는 설정과 삭제를 관리할 수 있습니다.</> },
    { title: '다음 행동', body: <>각 프로젝트의 현재 상태에 따라 이어갈 수 있는 작업을 확인할 수 있습니다.</> },
  ], []);
  useEffect(() => {
    if (!open) return undefined;
    const onPointerDown = (event) => { if (!railRef.current?.contains(event.target)) setOpen(false); };
    const onKeyDown = (event) => { if (event.key === 'Escape') setOpen(false); if (event.key === 'ArrowLeft') setSlide((value) => Math.max(0, value - 1)); if (event.key === 'ArrowRight') setSlide((value) => Math.min(slides.length - 1, value + 1)); };
    window.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('keydown', onKeyDown);
    return () => { window.removeEventListener('pointerdown', onPointerDown); window.removeEventListener('keydown', onKeyDown); };
  }, [open, slides.length]);
  if (!persistent) return null;
  const current = slides[slide];
  return <aside ref={railRef} className={`project-status-help ${open ? 'is-open' : ''} ${visible ? '' : 'is-hidden'}`} aria-hidden={!visible} aria-label="프로젝트 상태 안내">
    <button type="button" className="project-status-help__trigger" aria-expanded={open} aria-controls="project-status-help-content" onClick={() => setOpen((value) => !value)}><span aria-hidden="true">?</span><span>상태 안내</span></button>
    {open && <section id="project-status-help-content" className="project-status-help__content" aria-live="polite"><header><p>프로젝트 안내</p><span>{slide + 1} / {slides.length}</span></header><div className="project-status-help__slide" key={slide}><h2>{current.title}</h2><div>{current.body}</div></div><footer><button type="button" aria-label="이전 안내" disabled={slide === 0} onClick={() => setSlide((value) => value - 1)}>‹</button><button type="button" aria-label="다음 안내" disabled={slide === slides.length - 1} onClick={() => setSlide((value) => value + 1)}>›</button></footer></section>}
  </aside>;
}
