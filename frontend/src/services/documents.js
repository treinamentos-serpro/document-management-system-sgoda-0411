const API_BASE = '/api';

async function ensureSuccess(response) {
  if (response.ok) return response;

  let payload;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  throw new Error(payload?.error?.message || 'Não foi possível concluir a operação.');
}

export async function listDocuments() {
  const response = await ensureSuccess(await fetch(`${API_BASE}/documents`));
  return response.json();
}

export async function uploadDocument(file) {
  const formData = new FormData();
  formData.append('file', file);
  const response = await ensureSuccess(await fetch(`${API_BASE}/upload`, {
    method: 'POST',
    body: formData,
  }));
  return response.json();
}

export async function downloadDocument(id) {
  const response = await ensureSuccess(await fetch(
    `${API_BASE}/documents/${encodeURIComponent(id)}/download`,
  ));
  return response.blob();
}