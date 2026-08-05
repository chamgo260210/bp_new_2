const messages = {
  'job.idea.file.extraction.started': '첨부 문서의 텍스트와 표를 읽고 있습니다.',
  'job.idea.followup.ready': '추가 확인이 필요한 질문을 준비했습니다.',
  'job.idea.attachment.received': '첨부파일을 안전하게 저장했습니다.',
  'job.idea.attachment.parsing.started': '첨부파일에서 텍스트를 추출하고 있습니다.',
  'job.idea.attachment.parsing.failed': '첨부파일을 처리하지 못했습니다. 파일 형식을 확인해 주세요.',
  'job.idea.information.extraction.started': '대화와 자료에서 필요한 정보를 정리하고 있습니다.',
  'job.idea.information.extraction.completed': '자료에서 필요한 정보를 정리했습니다.',
  'job.idea.brief.draft.queued': 'Opportunity Brief 초안 생성을 준비하고 있습니다.',
  'job.idea.brief.draft.started': 'Opportunity Brief 초안을 만들고 있습니다.',
  'job.idea.brief.draft.completed': 'Opportunity Brief 초안이 준비되었습니다.',
  'job.idea.brief.draft.failed': 'Opportunity Brief 초안을 만들지 못했습니다. 다시 시도해 주세요.',
  'job.idea.questions.completed': '추가 확인이 필요한 질문을 준비했습니다.',
  'job.boundary.lookup.started': '관련 공식 법령 근거를 확인하고 있습니다.',
  'job.concept.legal-validation.started': 'Concept의 사업자 역할과 운영 구조를 확인하고 있습니다.',
  'job.concept.redesign.started': '규제 조건에 맞도록 운영 방식을 다시 설계하고 있습니다.',
  'job.legal-report.build.started': '선택한 Concept의 법률 보고서를 구성하고 있습니다.',
};

export function jobEventMessage(event) {
  const template = messages[event?.messageKey] ?? '작업 상태가 업데이트되었습니다.';
  return template.replace(/\{([a-zA-Z0-9_]+)\}/g, (_, key) => {
    const value = event?.messageParams?.[key];
    return typeof value === 'string' || typeof value === 'number' ? String(value) : '';
  });
}
