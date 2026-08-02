const projectBase = (projectId) => `/app/projects/${encodeURIComponent(projectId)}`;

export const appRoutes = Object.freeze({
  home: '/app',
  projects: '/app/projects',
  newProject: '/app/projects/new',
  profileSettings: '/app/settings/profile',
  securitySettings: '/app/settings/security',
});

export const projectRoutes = Object.freeze({
  base: projectBase,
  overview: (projectId) => projectBase(projectId),
  getStarted: (projectId) => `${projectBase(projectId)}/get-started`,
  plan: (projectId) => `${projectBase(projectId)}/plan`,
  briefSettings: (projectId) => `${projectBase(projectId)}/settings`,
  documents: (projectId) => `${projectBase(projectId)}/plan/documents`,
  structure: (projectId) => `${projectBase(projectId)}/plan/structure`,
  review: (projectId) => `${projectBase(projectId)}/review`,
  legal: (projectId) => `${projectBase(projectId)}/legal`,
  feasibility: (projectId) => `${projectBase(projectId)}/review/market`,
  financial: (projectId) => `${projectBase(projectId)}/review/financial`,
  financialNew: (projectId) => `${projectBase(projectId)}/review/financial/new`,
  financialDetail: (projectId, analysisId) => `${projectBase(projectId)}/review/financial/${encodeURIComponent(analysisId)}`,
  validate: (projectId) => `${projectBase(projectId)}/validate`,
  personas: (projectId) => `${projectBase(projectId)}/validate/personas`,
  interview: (projectId) => `${projectBase(projectId)}/validate/interview`,
  interviewDetail: (projectId, interviewId) =>
    `${projectBase(projectId)}/validate/interview/${encodeURIComponent(interviewId)}`,
  marketResponse: (projectId) => `${projectBase(projectId)}/validate/market-response`,
  marketResponseDetail: (projectId, predictionId) =>
    `${projectBase(projectId)}/validate/market-response/${encodeURIComponent(predictionId)}`,
  marketing: (projectId) => `${projectBase(projectId)}/validate/marketing`,
  marketingNew: (projectId) => `${projectBase(projectId)}/validate/marketing/new`,
  marketingContent: (projectId, contentId) =>
    `${projectBase(projectId)}/validate/marketing/${encodeURIComponent(contentId)}`,
  report: (projectId) => `${projectBase(projectId)}/report`,
  settings: (projectId) => `${projectBase(projectId)}/settings`,
  danger: (projectId) => `${projectBase(projectId)}/settings`,
});
