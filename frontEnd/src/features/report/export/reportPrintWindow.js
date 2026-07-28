const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' })[character]);
const list = (items = []) => items.length ? `<ul>${items.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul>` : '<p>분석 결과가 아직 생성되지 않았습니다.</p>';

export function openReportPrintWindow(report) {
  const printWindow = window.open('', '_blank', 'noopener,noreferrer');
  if (!printWindow) return false;
  const project = report.project || {};
  const sections = [
    ['report-summary', '01 Executive Summary', `보고서 상태: ${report.reportStatusLabel}`],
    ['report-project', '02 프로젝트 개요', project.description || '프로젝트 설명이 아직 입력되지 않았습니다.'],
    ['report-plan', '03 사업계획 구조화 결과', `${escapeHtml(report.plan?.summary || '')}${list((report.plan?.sections || []).map((item) => `${item.displayName}: ${item.extractedContent || '추출 내용 없음'}`))}`],
    ['report-legal', '04 법률·규제 검토', `${escapeHtml(report.legal?.summary || '')}${list((report.legal?.importantFindings || []).map((item) => `${item.categoryLabel}: ${item.finding}`))}`],
    ['report-feasibility', '05 사업 타당성 분석', `${escapeHtml(report.feasibility?.summary || '')}${list((report.feasibility?.dimensions || []).map((item) => `${item.label}: ${item.finding}`))}`],
    ['report-validation', '06 AI 패널·고객 검증', escapeHtml(report.persona?.summary || '분석 결과가 아직 생성되지 않았습니다.')],
    ['report-risks', '07 주요 위험', list((report.legal?.importantFindings || []).map((item) => item.finding))],
    ['report-recommendations', '08 개선 제안', list((report.validationTasks || []).map((item) => `${item.title} — ${item.method}`))],
    ['report-next-actions', '09 권장 다음 행동', list((report.validationTasks || []).map((item) => item.title))],
    ['report-sources', '10 근거 및 출처', list((report.provenance || []).map((item) => `${item.section}: ${item.provider} · ${item.model}`))],
  ];
  const toc = sections.map(([id, title]) => `<a href="#${id}"><span>${title}</span><span>→</span></a>`).join('');
  const content = sections.map(([id, title, body]) => `<section id="${id}"><h2>${title}</h2><div>${body}</div></section>`).join('');
  printWindow.document.write(`<!doctype html><html lang="ko"><head><meta charset="utf-8"><title>${escapeHtml(project.name)} - 사업 검증 결과 및 개선 제안서</title><style>@page{size:A4;margin:18mm 16mm 20mm}body{margin:0;color:#172b35;font:10.5pt/1.7 Arial,sans-serif}.cover{min-height:245mm;display:grid;align-content:center;gap:14mm;break-after:page}.brand{color:#087f75;font-weight:800;letter-spacing:.13em}.line{width:45mm;border-top:3px solid #0f8878}.cover h1{font-size:29pt;line-height:1.28;margin:0}.meta{display:grid;gap:4mm;margin-top:35mm}.meta div{display:grid;grid-template-columns:30mm 1fr;border-bottom:1px solid #dbe5e2;padding-bottom:2mm}.toc{break-after:page}.toc h2,section h2{font-size:16pt;margin:0 0 7mm}.toc a{display:flex;justify-content:space-between;color:inherit;text-decoration:none;border-bottom:1px dotted #aab8b4;padding:3mm 0}section{break-inside:avoid;margin:0 0 13mm}section h2{border-bottom:2px solid #0f8878;padding-bottom:3mm}ul{padding-left:5mm}.footer{margin-top:14mm;color:#667e81;font-size:8.5pt}@media print{a[href]::after{content:none!important}}</style></head><body><main class="report-document"><header class="cover"><p class="brand">VENTURE VERIFY</p><div class="line"></div><h1>사업 검증 결과 및<br>개선 제안서</h1><p>사업 검증 결과를 의사결정에 활용할 수 있도록 정리한 문서입니다.</p><div class="meta"><div><strong>프로젝트명</strong><span>${escapeHtml(project.name)}</span></div><div><strong>사업 분야</strong><span>${escapeHtml(project.industryCategory || '정보 없음')}</span></div><div><strong>생성일</strong><span>${escapeHtml(report.generatedAtLabel)}</span></div><div><strong>보고서 상태</strong><span>${escapeHtml(report.reportStatusLabel)}</span></div></div><a href="#report-toc">목차 보기 →</a></header><nav id="report-toc" class="toc"><h2>목차</h2>${toc}</nav>${content}<p class="footer">Venture Verify · ${escapeHtml(project.name)} · ${escapeHtml(report.generatedAtLabel)}</p></main></body></html>`);
  printWindow.document.close();
  printWindow.focus();
  window.setTimeout(() => printWindow.print(), 150);
  return true;
}
