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
  };
}
