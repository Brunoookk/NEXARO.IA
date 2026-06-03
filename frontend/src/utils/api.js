const BASE = import.meta.env.VITE_API_BASE_URL || 'https://nexaro-ia.onrender.com';

export async function createSession() {
  const res = await fetch(`${BASE}/session/new`, { method: 'POST' });
  return res.json();
}

export async function clearHistory(sessionId) {
  await fetch(`${BASE}/session/${sessionId}/clear`, { method: 'DELETE' });
}

export async function uploadPDF(sessionId, file) {
  const form = new FormData();
  form.append('file', file);
  const res = await fetch(`${BASE}/upload/pdf?session_id=${sessionId}`, {
    method: 'POST', body: form,
  });
  if (!res.ok) throw new Error('Upload falhou');
  return res.json();
}

export async function streamChat(sessionId, message, onToken, onDone, onError) {
  const res = await fetch(`${BASE}/chat/stream`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ session_id: sessionId, message }),
  });
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    const lines = decoder.decode(value).split('\n').filter(l => l.startsWith('data: '));
    for (const line of lines) {
      try {
        const data = JSON.parse(line.slice(6));
        if (data.token) onToken(data.token);
        if (data.done) onDone();
        if (data.error) onError(data.error);
      } catch {}
    }
  }
}
