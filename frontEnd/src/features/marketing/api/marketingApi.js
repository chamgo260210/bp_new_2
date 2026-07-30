const root = (projectId) =>
  `/projects/${encodeURIComponent(projectId)}/marketing-contents`;

export function createMarketingApi(client) {
  return {
    async list(projectId, options) {
      return (await client.get(root(projectId), options)).data;
    },
    async create(projectId, payload, options) {
      return (await client.post(root(projectId), payload, options)).data;
    },
    async detail(projectId, contentId, options) {
      return (await client.get(
        `${root(projectId)}/${encodeURIComponent(contentId)}`,
        options,
      )).data;
    },
    async update(projectId, contentId, payload, options) {
      return (await client.patch(
        `${root(projectId)}/${encodeURIComponent(contentId)}`,
        payload,
        options,
      )).data;
    },
    async remove(projectId, contentId, options) {
      return client.delete(
        `${root(projectId)}/${encodeURIComponent(contentId)}`,
        options,
      );
    },
    async alternateDraft(projectId, contentId, alternative, options) {
      return (await client.post(
        `${root(projectId)}/${encodeURIComponent(contentId)}/draft-copy?alternative=${alternative}`,
        undefined,
        options,
      )).data;
    },
    async createVersion(projectId, contentId, draft, options) {
      return (await client.post(
        `${root(projectId)}/${encodeURIComponent(contentId)}/versions`,
        draft,
        options,
      )).data;
    },
    async versions(projectId, contentId, options) {
      return (await client.get(
        `${root(projectId)}/${encodeURIComponent(contentId)}/versions`,
        options,
      )).data;
    },
    async refreshSource(projectId, contentId, payload, options) {
      return (await client.post(
        `${root(projectId)}/${encodeURIComponent(contentId)}/source-refresh`,
        payload,
        options,
      )).data;
    },
  };
}
