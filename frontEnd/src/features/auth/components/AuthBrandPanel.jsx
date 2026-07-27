import { useState } from 'react';
import useReducedMotion from '../../landing/hooks/useReducedMotion.js';
import { authBrandScenes } from '../data/authBrandScenes.js';
import useAuthBrandCycle from '../hooks/useAuthBrandCycle.js';
import useBrandCopyTyping from '../hooks/useBrandCopyTyping.js';
import useAuthMotion from '../hooks/useAuthMotion.js';

const copy = {
  login: {
    eyebrow: 'AI 기반 사업 아이디어 검증',
    title: ['사업 아이디어를', '검증 가능한 계획으로 바꿉니다.'],
    body: ['문서에서 핵심 정보를 구조화하고,', '근거와 위험을 확인한 뒤 다음 행동을 정리합니다.'],
  },
  signup: {
    eyebrow: 'START YOUR VALIDATION',
    title: ['사업 아이디어를', '검증 가능한 계획으로 바꿉니다.'],
    body: ['문서에서 핵심 정보를 구조화하고,', '근거와 위험을 확인한 뒤 다음 행동을 정리합니다.'],
  },
};

function TypingCursor({ active, name }) {
  return active === name ? <i className="auth-brand-copy__cursor" aria-hidden="true">▍</i> : null;
}

export default function AuthBrandPanel({ mode }) {
  const reducedMotion = useReducedMotion();
  const { motionReady } = useAuthMotion();
  const [interactionPaused, setInteractionPaused] = useState(false);
  const content = copy[mode];
  const typed = useBrandCopyTyping(content, { enabled: motionReady, paused: interactionPaused, reducedMotion });
  const { sceneIndex, setSceneIndex } = useAuthBrandCycle({ enabled: motionReady, paused: interactionPaused, reducedMotion, sceneCount: authBrandScenes.length });
  const scene = authBrandScenes[sceneIndex];
  const pauseOnBlur = (event) => { if (!event.currentTarget.contains(event.relatedTarget)) setInteractionPaused(false); };

  return <aside className="auth-brand-panel" onMouseEnter={() => setInteractionPaused(true)} onMouseLeave={() => setInteractionPaused(false)} onFocusCapture={() => setInteractionPaused(true)} onBlurCapture={pauseOnBlur}>
    <p className="auth-brand-panel__eyebrow">{content.eyebrow}</p>
    <div className="auth-brand-copy">
      <div className="auth-brand-copy__reserve" aria-hidden="true"><h2><span>{content.title[0]}</span><span>{content.title[1]}</span></h2><p><span>{content.body[0]}</span><span>{content.body[1]}</span></p></div>
      <div className="auth-brand-copy__animated" style={{ opacity: typed.opacity }} aria-hidden="true"><h2><span>{typed.titleFirst}<TypingCursor active={typed.active} name="titleFirst" /></span><span>{typed.titleSecond}<TypingCursor active={typed.active} name="titleSecond" /></span></h2><p><span>{typed.bodyFirst}<TypingCursor active={typed.active} name="bodyFirst" /></span><span>{typed.bodySecond}<TypingCursor active={typed.active} name="bodySecond" /></span></p></div>
    </div>
    <p className="visually-hidden">사업 아이디어를 검증 가능한 계획으로 바꾸고, 문서의 핵심 정보와 근거, 위험, 다음 행동을 정리합니다.</p>
    <ol className="auth-brand-panel__flow"><li><b>01</b><span>문서 구조화</span></li><li><b>02</b><span>근거와 위험 확인</span></li><li><b>03</b><span>다음 행동 정리</span></li></ol>
    <section className="auth-preview" aria-label="제품 미리보기 예시">
      <header className="auth-preview__header"><span>사업 검증 프로젝트</span><b>{scene.title}</b></header>
      <div className="auth-preview__viewport"><div className="auth-preview__scene" key={scene.id}>{scene.lines.map(([label, value]) => <p key={label}><span>{label}</span><b>{value}</b></p>)}</div></div>
      <footer className="auth-preview__footer"><div className="auth-preview__dots" aria-label="제품 미리보기 화면 선택">{authBrandScenes.map((item, index) => <button type="button" key={item.id} aria-label={`${index + 1}번째 화면: ${item.title}`} aria-pressed={sceneIndex === index} className={sceneIndex === index ? 'is-active' : ''} disabled={!motionReady} onClick={() => setSceneIndex(index)} />)}</div><small>가상 예시 데이터</small></footer>
    </section>
  </aside>;
}
