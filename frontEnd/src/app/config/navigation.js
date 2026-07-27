const steps = [
  ['시작', 'overview'], ['사업계획 입력', 'input'], ['정보 구조화', 'structure'],
  ['법률·규제 검토', 'legal-review'], ['사업 타당성 분석', 'feasibility'],
  ['AI 패널 검증', 'personas'], ['통합 보고서', 'report'],
];

export function getProjectNavigation(projectId) {
  const root = `/projects/${projectId}`;
  return steps.map(([label, path], index) => ({ label, to: `${root}/${path}`, stage: index + 1 }));
}
