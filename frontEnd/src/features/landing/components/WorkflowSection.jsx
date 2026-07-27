import { useEffect, useRef, useState } from 'react';
import ProductPreview from './ProductPreview.jsx';
import { workflowSteps } from '../data/landingData.js';

export default function WorkflowSection({ onNavigate }) {
  const [activeStep, setActiveStep] = useState(0);
  const targetsRef = useRef([]);
  useEffect(() => {
    if (!window.IntersectionObserver) return undefined;
    const observer = new IntersectionObserver((entries) => entries.forEach((entry) => { if (entry.isIntersecting) setActiveStep(Number(entry.target.dataset.step)); }), { rootMargin: '-35% 0px -45% 0px', threshold: 0.01 });
    targetsRef.current.filter(Boolean).forEach((target) => observer.observe(target));
    return () => observer.disconnect();
  }, []);
  const goToStep = (index) => { setActiveStep(index); targetsRef.current[index]?.scrollIntoView?.({ behavior: 'smooth', block: 'center' }); };
  const onKeyDown = (event) => { const next = event.key === 'ArrowDown' || event.key === 'PageDown' ? activeStep + 1 : event.key === 'ArrowUp' || event.key === 'PageUp' ? activeStep - 1 : event.key === 'Home' ? 0 : event.key === 'End' ? workflowSteps.length - 1 : null; if (next !== null) { event.preventDefault(); goToStep(Math.max(0, Math.min(workflowSteps.length - 1, next))); } };
  const step = workflowSteps[activeStep];
  return <section id="workflow" className="landing-section landing-workflow" aria-labelledby="workflow-title"><div className="landing-container"><p className="landing-eyebrow">HOW IT WORKS</p><h2 id="workflow-title">하나의 문서가,<br />하나의 검증 흐름이 됩니다.</h2><p className="landing-section__lede">사업계획서 등록부터 검토 결과 확인까지, 프로젝트별 진행 상태를 따라 단계적으로 수행합니다.</p><div className="workflow-desktop" tabIndex="0" onKeyDown={onKeyDown} aria-label="5단계 사업 검증 흐름">
    <div className="workflow-stage"><div className="workflow-stage__copy"><p className="workflow-stage__eyebrow">현재 단계 <b>{step.number}</b> / 05</p><h3>{step.title}</h3><p>{step.description}</p><div className="workflow-rail" aria-label="단계 선택">{workflowSteps.map((item, index) => <button type="button" key={item.number} className={index === activeStep ? 'is-active' : ''} aria-current={index === activeStep ? 'step' : undefined} onClick={() => goToStep(index)}><span>{item.number}</span><i /></button>)}</div>{step.number === '05' && <button type="button" className="landing-text-button" onClick={() => onNavigate('demo')}>샘플 결과 보기 →</button>}</div><div className="workflow-stage__preview"><ProductPreview kind={step.kind} label={`${step.number}단계 예시 제품 화면`} /></div></div>
    <div className="workflow-scroll-track" aria-hidden="true">{workflowSteps.map((item, index) => <div key={item.number} data-step={index} ref={(node) => { targetsRef.current[index] = node; }} />)}</div>
  </div><div className="workflow-mobile">{workflowSteps.map((item) => <article key={item.number}><span className="workflow-step__number">{item.number}</span><h3>{item.title}</h3><p>{item.description}</p><ProductPreview kind={item.kind} /></article>)}</div></div></section>;
}
