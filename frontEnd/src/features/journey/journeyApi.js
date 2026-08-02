const base = (projectId) => `/api/v2/projects/${encodeURIComponent(projectId)}`;

export function createJourneyApi(client, projectId) {
  const root = base(projectId);
  return {
    async currentIdea() { return (await client.get(`${root}/ideas/current`)).data; },
    async saveText(input) { return (await client.post(`${root}/ideas`, input)).data; },
    async saveFile(title, file) {
      const form = new FormData();
      if (title) form.append('title', title);
      form.append('file', file);
      return (await client.upload(`${root}/ideas`, form)).data;
    },
    async currentInterpretation() { return (await client.get(`${root}/idea-interpretations/current`)).data; },
    async interpret() { return (await client.post(`${root}/idea-interpretations`, undefined, { timeoutMs: 90000 })).data; },
    async confirm(versionId) { return (await client.post(`${root}/idea-versions/${encodeURIComponent(versionId)}/confirm`)).data; },
    async currentLegal() { return (await client.get(`${root}/legal-reviews/current`)).data; },
    async legalReview() { return (await client.post(`${root}/legal-reviews`, undefined, { timeoutMs: 90000 })).data; },
    async concepts() { return (await client.get(`${root}/concepts`)).data; },
    async generateConcepts() { return (await client.post(`${root}/concept-generations`, undefined, { timeoutMs: 120000 })).data; },
    async currentQuick() { return (await client.get(`${root}/quick-assessments/current`)).data; },
    async quickAssessment() { return (await client.post(`${root}/quick-assessments`, undefined, { timeoutMs: 120000 })).data; },
    async currentShortlist() { return (await client.get(`${root}/shortlist`)).data; },
    async saveShortlist(input) { return (await client.put(`${root}/shortlist`, input)).data; },
    async currentDetailed() { return (await client.get(`${root}/detailed-analyses/current`)).data; },
    async detailedAnalysis(input) { return (await client.post(`${root}/detailed-analyses`, input, { timeoutMs: 120000 })).data; },
    async currentSelection() { return (await client.get(`${root}/concept-selection`)).data; },
    async selectConcept(input) { return (await client.put(`${root}/concept-selection`, input)).data; },
  };
}
