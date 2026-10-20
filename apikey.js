/* ============================================================
   RYEDZ — Gemini API Key (Opsional)
   Dapatkan: https://aistudio.google.com/app/apikey
   ============================================================ */

const RYEDZ_GEMINI_KEY = '';

function isGeminiReady() {
  return !!(RYEDZ_GEMINI_KEY && RYEDZ_GEMINI_KEY.length > 10);
}

async function callGemini(promptText, options) {
  options = options || {};
  if (!isGeminiReady()) {
    throw new Error('GEMINI key belum diisi di apikey.js');
  }
  const model = options.model || 'gemini-2.0-flash';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${RYEDZ_GEMINI_KEY}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: promptText }] }],
      generationConfig: {
        temperature: options.temperature ?? 0.7,
        maxOutputTokens: options.maxTokens ?? 2048
      }
    })
  });
  if (!res.ok) throw new Error('Gemini error: ' + res.status);
  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
}

async function generatePromptFromTitle(judul) {
  const instruction = `Kamu adalah prompt engineer profesional.
Buatkan ISI PROMPT AI lengkap untuk judul: "${judul}".

Aturan:
- Sertakan peran, konteks, instruksi spesifik, format output
- 100-400 kata
- Output HANYA isi prompt

Buat:`;
  return callGemini(instruction, { temperature: 0.8 });
}

window.RyedzKeys = {
  isGeminiReady,
  callGemini,
  generatePromptFromTitle
};