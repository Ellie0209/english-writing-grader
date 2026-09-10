/* 라이팅 코치 — English Writing Feedback Tool
 * Client-side only: essays and API keys go directly from the browser to
 * Anthropic's API. Nothing is sent to or stored on any third-party server.
 */

const GRADE_GROUPS = [
  {
    label: '유치원 · Kindergarten',
    items: [
      { id: 'k', short: '유치원', display: '유치원 (6~7세)', desc: 'Kindergarten (ages 5–6): emergent writing, sight words, simple phonetic spelling, one or two very simple sentences.' },
    ],
  },
  {
    label: '초등학교 · Elementary (Grades 1–5)',
    items: [
      { id: 'g1', short: '초1', display: 'Grade 1', desc: 'Grade 1 (ages 6–7): simple sentences, basic sight words, beginning capitalization and punctuation.' },
      { id: 'g2', short: '초2', display: 'Grade 2', desc: 'Grade 2 (ages 7–8): short paragraphs, simple and compound sentences, growing sight-word vocabulary.' },
      { id: 'g3', short: '초3', display: 'Grade 3', desc: 'Grade 3 (ages 8–9): organized paragraphs with a main idea and supporting details, expanding vocabulary.' },
      { id: 'g4', short: '초4', display: 'Grade 4', desc: 'Grade 4 (ages 9–10): multi-paragraph writing, transition words, more varied sentence structure.' },
      { id: 'g5', short: '초5', display: 'Grade 5', desc: 'Grade 5 (ages 10–11): clear intro/body/conclusion structure, more descriptive and precise vocabulary.' },
    ],
  },
  {
    label: '중학교 · Middle School (Grades 6–8)',
    items: [
      { id: 'g6', short: '중1', display: 'Grade 6', desc: 'Grade 6 (ages 11–12): a clear main idea/thesis-like statement, introduction of compound-complex sentences.' },
      { id: 'g7', short: '중2', display: 'Grade 7', desc: 'Grade 7 (ages 12–13): organized essays with evidence and support, more varied sentence structure.' },
      { id: 'g8', short: '중3', display: 'Grade 8', desc: 'Grade 8 (ages 13–14): clear argumentative/analytical structure, more sophisticated vocabulary and syntax.' },
    ],
  },
  {
    label: '고등학교 · High School (Grades 9–12)',
    items: [
      { id: 'g9', short: '고1', display: 'Grade 9', desc: 'Grade 9 (ages 14–15): high-school level essay structure, a clear thesis, growing sentence variety.' },
      { id: 'g10', short: '고2', display: 'Grade 10', desc: 'Grade 10 (ages 15–16): analytical writing with strong evidence and reasoning, complex sentence variety.' },
      { id: 'g11', short: '고3', display: 'Grade 11', desc: 'Grade 11 (ages 16–17): college-prep level argumentation, nuanced word choice, rhetorical sophistication.' },
      { id: 'g12', short: '고3(상급)', display: 'Grade 12', desc: 'Grade 12 (ages 17–18): college-ready clarity, sophisticated vocabulary and syntax, strong rhetorical control.' },
    ],
  },
  {
    label: '성인 · Adult',
    items: [
      { id: 'adult', short: '성인', display: '성인 (Adult)', desc: 'Adult learner / general adult writing: professional or academic-level clarity, precision, and nuance.' },
    ],
  },
];

const state = {
  selectedGrade: null,
  lastResult: null,
};

const els = {};

document.addEventListener('DOMContentLoaded', init);

function init() {
  cacheEls();
  renderGradeButtons();
  restoreSettings();
  bindEvents();
  updateWordCount();
}

function cacheEls() {
  els.settingsToggle = document.getElementById('settingsToggle');
  els.settingsPanel = document.getElementById('settingsPanel');
  els.apiKey = document.getElementById('apiKey');
  els.modelSelect = document.getElementById('modelSelect');
  els.rememberKey = document.getElementById('rememberKey');
  els.gradeGroups = document.getElementById('gradeGroups');
  els.essayTitle = document.getElementById('essayTitle');
  els.essayText = document.getElementById('essayText');
  els.wordCount = document.getElementById('wordCount');
  els.sampleBtn = document.getElementById('sampleBtn');
  els.gradeBtn = document.getElementById('gradeBtn');
  els.errorMsg = document.getElementById('errorMsg');
  els.resultsPanel = document.getElementById('resultsPanel');
  els.resultMeta = document.getElementById('resultMeta');
  els.overallScore = document.getElementById('overallScore');
  els.overallSummary = document.getElementById('overallSummary');
  els.categoryGrid = document.getElementById('categoryGrid');
  els.strengthsList = document.getElementById('strengthsList');
  els.nextStepsList = document.getElementById('nextStepsList');
  els.copyBtn = document.getElementById('copyBtn');
  els.saveBtn = document.getElementById('saveBtn');
  els.printBtn = document.getElementById('printBtn');
  els.loadingOverlay = document.getElementById('loadingOverlay');
}

function renderGradeButtons() {
  els.gradeGroups.innerHTML = '';
  GRADE_GROUPS.forEach((group) => {
    const wrap = document.createElement('div');
    wrap.className = 'grade-group';

    const label = document.createElement('div');
    label.className = 'grade-group-label';
    label.textContent = group.label;
    wrap.appendChild(label);

    const btnRow = document.createElement('div');
    btnRow.className = 'grade-buttons';

    group.items.forEach((item) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'grade-btn';
      btn.textContent = item.display;
      btn.dataset.gradeId = item.id;
      btn.addEventListener('click', () => selectGrade(item.id));
      btnRow.appendChild(btn);
    });

    wrap.appendChild(btnRow);
    els.gradeGroups.appendChild(wrap);
  });
}

function findGrade(id) {
  for (const group of GRADE_GROUPS) {
    const found = group.items.find((i) => i.id === id);
    if (found) return found;
  }
  return null;
}

function selectGrade(id) {
  state.selectedGrade = id;
  document.querySelectorAll('.grade-btn').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.gradeId === id);
  });
  hideError();
}

function bindEvents() {
  els.settingsToggle.addEventListener('click', toggleSettings);
  els.essayText.addEventListener('input', updateWordCount);
  els.sampleBtn.addEventListener('click', fillSampleEssay);
  els.gradeBtn.addEventListener('click', handleGrade);
  els.copyBtn.addEventListener('click', copyResults);
  els.saveBtn.addEventListener('click', saveResults);
  els.printBtn.addEventListener('click', () => window.print());
  els.apiKey.addEventListener('change', persistSettingsIfRemembered);
  els.rememberKey.addEventListener('change', persistSettingsIfRemembered);
  els.modelSelect.addEventListener('change', persistSettingsIfRemembered);
}

function toggleSettings() {
  const isHidden = els.settingsPanel.hidden;
  els.settingsPanel.hidden = !isHidden;
  els.settingsToggle.setAttribute('aria-expanded', String(isHidden));
}

function restoreSettings() {
  try {
    const saved = localStorage.getItem('wc_settings');
    if (!saved) return;
    const data = JSON.parse(saved);
    if (data.remember) {
      els.rememberKey.checked = true;
      if (data.apiKey) els.apiKey.value = data.apiKey;
      if (data.model) els.modelSelect.value = data.model;
    }
  } catch (e) {
    /* ignore corrupted storage */
  }
}

function persistSettingsIfRemembered() {
  try {
    if (els.rememberKey.checked) {
      localStorage.setItem('wc_settings', JSON.stringify({
        remember: true,
        apiKey: els.apiKey.value,
        model: els.modelSelect.value,
      }));
    } else {
      localStorage.removeItem('wc_settings');
    }
  } catch (e) {
    /* localStorage unavailable (private mode, etc.) — fail silently */
  }
}

function updateWordCount() {
  const text = els.essayText.value.trim();
  const words = text.length ? text.split(/\s+/).filter(Boolean).length : 0;
  els.wordCount.textContent = `${words} 단어 · ${text.length}자`;
}

function fillSampleEssay() {
  els.essayTitle.value = 'My Favorite Animal';
  els.essayText.value = `My favorite animal is the dolphin. Dolphins are very smart animals. They live in the ocean and they can swim very fast. Dolphins use sound to talk to each other, this is called echolocation.

I like dolphins because they are friendly. Some dolphins even help lost swimmers find there way back to the beach. They also jump very high out of the water which is cool to watch.

In conclusion dolphins are amazing animals and I hope I can see one in real life someday.`;
  updateWordCount();
}

function showError(msg) {
  els.errorMsg.textContent = msg;
  els.errorMsg.hidden = false;
}

function hideError() {
  els.errorMsg.hidden = true;
}

async function handleGrade() {
  hideError();

  const apiKey = els.apiKey.value.trim();
  const essay = els.essayText.value.trim();
  const grade = state.selectedGrade ? findGrade(state.selectedGrade) : null;

  if (!apiKey) {
    showError('먼저 상단의 "⚙️ API 설정"에서 Anthropic API 키를 입력해주세요.');
    els.settingsPanel.hidden = false;
    els.settingsToggle.setAttribute('aria-expanded', 'true');
    return;
  }
  if (!grade) {
    showError('연령 / 학년을 먼저 선택해주세요.');
    return;
  }
  if (essay.length < 10) {
    showError('채점할 글이 너무 짧습니다. 최소 몇 문장 이상 입력해주세요.');
    return;
  }

  setLoading(true);
  try {
    const result = await gradeEssay({
      apiKey,
      model: els.modelSelect.value,
      grade,
      title: els.essayTitle.value.trim(),
      essay,
    });
    state.lastResult = { ...result, grade, title: els.essayTitle.value.trim(), essay, gradedAt: new Date() };
    renderResults(state.lastResult);
  } catch (err) {
    console.error(err);
    showError(friendlyError(err));
  } finally {
    setLoading(false);
  }
}

function friendlyError(err) {
  const msg = String(err && err.message || err);
  if (msg.includes('401') || msg.toLowerCase().includes('authentication')) {
    return 'API 키가 유효하지 않습니다. 키를 다시 확인해주세요.';
  }
  if (msg.includes('429')) {
    return '요청이 너무 많습니다 (rate limit). 잠시 후 다시 시도해주세요.';
  }
  if (msg.toLowerCase().includes('failed to fetch') || msg.toLowerCase().includes('networkerror')) {
    return '네트워크 오류가 발생했습니다. 인터넷 연결과 API 키를 확인해주세요.';
  }
  return `오류가 발생했습니다: ${msg}`;
}

function setLoading(isLoading) {
  els.loadingOverlay.hidden = !isLoading;
  els.gradeBtn.disabled = isLoading;
}

const SYSTEM_PROMPT = `You are an experienced English writing teacher who grades student writing (from kindergarten through adult learners) using a US-style writing rubric with exactly four categories:

1. Grammar & Conventions — grammar, spelling, punctuation, and other mechanical issues that affect the overall quality of the writing.
2. Vocabulary — assess the approximate vocabulary/grade level shown, suggest specific stronger or more advanced words the student could use to move up a level, and point out words that are overly simplistic or repeated too often.
3. Sentence Structure — evaluate sentence construction; identify any broken or awkward sentences and show how to fix them; describe what grade-appropriate sentence structure should look/feel like.
4. Flow & Organization — evaluate the overall organization and flow of ideas. Pay special attention to the ending/conclusion: check whether it has enough supporting detail and stays on topic, or drifts into unrelated content. Give concrete, actionable suggestions to improve structure and flow.

Always calibrate your expectations and tone to the student's stated grade/age level — do not grade a kindergartner by high-school standards or vice versa. Be encouraging and constructive, never harsh, while still being specific and honest about issues.

You must respond with ONLY a single valid JSON object (no markdown code fences, no commentary before or after) matching exactly this schema:

{
  "overallScore": <integer 0-100>,
  "overallSummary": "<2-4 sentence overall summary written for the student/parent, calibrated to the grade level>",
  "categories": {
    "grammar": { "score": <integer 0-10>, "summary": "<1-2 sentence summary>", "details": ["<specific example + fix>", "..."] },
    "vocabulary": { "score": <integer 0-10>, "summary": "<1-2 sentence summary>", "details": ["<specific example + suggested stronger word, or note on repetition/monotony>", "..."] },
    "sentenceStructure": { "score": <integer 0-10>, "summary": "<1-2 sentence summary>", "details": ["<specific broken/awkward sentence + fixed version>", "..."] },
    "flowOrganization": { "score": <integer 0-10>, "summary": "<1-2 sentence summary>", "details": ["<specific observation about structure/flow, especially the ending>", "..."] }
  },
  "strengths": ["<specific strength>", "..."],
  "nextSteps": ["<specific, actionable next goal>", "..."]
}

Each "details" array should have 2-4 items when possible. Quote short snippets from the student's actual text where useful. Keep language simple enough for a parent to understand. Output nothing but the JSON object.`;

async function gradeEssay({ apiKey, model, grade, title, essay }) {
  const userPrompt = `Student grade/age level: ${grade.display} — ${grade.desc}

${title ? `Essay title: ${title}\n\n` : ''}Essay text to grade:
"""
${essay}
"""

Grade this essay now and return only the JSON object described in your instructions.`;

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model,
      max_tokens: 2500,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userPrompt }],
    }),
  });

  if (!response.ok) {
    let detail = '';
    try {
      const errBody = await response.json();
      detail = errBody && errBody.error && errBody.error.message ? errBody.error.message : '';
    } catch (e) { /* noop */ }
    throw new Error(`${response.status} ${detail}`.trim());
  }

  const data = await response.json();
  const rawText = (data.content || []).map((c) => c.text || '').join('').trim();
  return parseGradingJson(rawText);
}

function parseGradingJson(rawText) {
  let text = rawText.trim();
  // Strip markdown code fences if the model added them despite instructions.
  text = text.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '');
  const firstBrace = text.indexOf('{');
  const lastBrace = text.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1) {
    text = text.slice(firstBrace, lastBrace + 1);
  }
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch (e) {
    throw new Error('AI 응답을 해석하지 못했습니다. 다시 시도해주세요.');
  }
  return parsed;
}

const CATEGORY_META = [
  { key: 'grammar', label: 'Grammar & Conventions', icon: '📝' },
  { key: 'vocabulary', label: 'Vocabulary', icon: '📚' },
  { key: 'sentenceStructure', label: 'Sentence Structure', icon: '🧩' },
  { key: 'flowOrganization', label: 'Flow & Organization', icon: '🌊' },
];

function renderResults(result) {
  els.resultsPanel.hidden = false;
  els.resultMeta.textContent =
    `${result.title ? result.title + ' · ' : ''}학년/연령: ${result.grade.display} · 채점 시각: ${result.gradedAt.toLocaleString('ko-KR')}`;

  els.overallScore.textContent = clampScore(result.overallScore, 100);
  els.overallSummary.textContent = result.overallSummary || '';

  els.categoryGrid.innerHTML = '';
  CATEGORY_META.forEach((meta) => {
    const cat = (result.categories && result.categories[meta.key]) || {};
    const score = clampScore(cat.score, 10);
    const card = document.createElement('div');
    card.className = 'category-card';
    card.innerHTML = `
      <div class="category-card-head">
        <h4>${meta.icon} ${meta.label}</h4>
        <span class="category-score">${score}/10</span>
      </div>
      <div class="score-bar-track"><div class="score-bar-fill" style="width:${score * 10}%"></div></div>
      <p class="summary">${escapeHtml(cat.summary || '')}</p>
      <ul>${(cat.details || []).map((d) => `<li>${escapeHtml(d)}</li>`).join('')}</ul>
    `;
    els.categoryGrid.appendChild(card);
  });

  els.strengthsList.innerHTML = (result.strengths || []).map((s) => `<li>${escapeHtml(s)}</li>`).join('') || '<li>-</li>';
  els.nextStepsList.innerHTML = (result.nextSteps || []).map((s) => `<li>${escapeHtml(s)}</li>`).join('') || '<li>-</li>';

  els.resultsPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function clampScore(value, max) {
  const n = Number(value);
  if (Number.isNaN(n)) return 0;
  return Math.max(0, Math.min(max, Math.round(n)));
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = String(str);
  return div.innerHTML;
}

function buildPlainTextReport(result) {
  const lines = [];
  lines.push('=== 라이팅 코치 채점 결과 ===');
  if (result.title) lines.push(`제목: ${result.title}`);
  lines.push(`학년/연령: ${result.grade.display}`);
  lines.push(`채점 시각: ${result.gradedAt.toLocaleString('ko-KR')}`);
  lines.push(`종합 점수: ${clampScore(result.overallScore, 100)}/100`);
  lines.push('');
  lines.push('[종합 평가]');
  lines.push(result.overallSummary || '');
  lines.push('');
  CATEGORY_META.forEach((meta) => {
    const cat = (result.categories && result.categories[meta.key]) || {};
    lines.push(`[${meta.label}] ${clampScore(cat.score, 10)}/10`);
    lines.push(cat.summary || '');
    (cat.details || []).forEach((d) => lines.push(`  - ${d}`));
    lines.push('');
  });
  lines.push('[잘한 점]');
  (result.strengths || []).forEach((s) => lines.push(`  - ${s}`));
  lines.push('');
  lines.push('[다음 단계 목표]');
  (result.nextSteps || []).forEach((s) => lines.push(`  - ${s}`));
  lines.push('');
  lines.push('※ 본 결과는 AI(Anthropic Claude API)가 생성한 참고용 첨삭입니다.');
  return lines.join('\n');
}

async function copyResults() {
  if (!state.lastResult) return;
  const text = buildPlainTextReport(state.lastResult);
  try {
    await navigator.clipboard.writeText(text);
    flashButton(els.copyBtn, '✅ 복사됨!');
  } catch (e) {
    // Fallback for browsers without clipboard API permission
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    try {
      document.execCommand('copy');
      flashButton(els.copyBtn, '✅ 복사됨!');
    } catch (e2) {
      showError('복사에 실패했습니다. 직접 선택하여 복사해주세요.');
    }
    document.body.removeChild(textarea);
  }
}

function flashButton(btn, tempLabel) {
  const original = btn.textContent;
  btn.textContent = tempLabel;
  setTimeout(() => { btn.textContent = original; }, 1500);
}

function buildReportHtml(result) {
  const categoryBlocks = CATEGORY_META.map((meta) => {
    const cat = (result.categories && result.categories[meta.key]) || {};
    const score = clampScore(cat.score, 10);
    const details = (cat.details || []).map((d) => `<li>${escapeHtml(d)}</li>`).join('');
    return `
      <div class="category-card">
        <div class="category-card-head"><h4>${meta.icon} ${escapeHtml(meta.label)}</h4><span class="category-score">${score}/10</span></div>
        <div class="score-bar-track"><div class="score-bar-fill" style="width:${score * 10}%"></div></div>
        <p class="summary">${escapeHtml(cat.summary || '')}</p>
        <ul>${details}</ul>
      </div>`;
  }).join('\n');

  const strengths = (result.strengths || []).map((s) => `<li>${escapeHtml(s)}</li>`).join('') || '<li>-</li>';
  const nextSteps = (result.nextSteps || []).map((s) => `<li>${escapeHtml(s)}</li>`).join('') || '<li>-</li>';

  return `<!DOCTYPE html>
<html lang="ko"><head><meta charset="UTF-8"><title>${escapeHtml(result.title || '라이팅 첨삭 결과')}</title>
<style>
body{font-family:'Noto Sans KR',Arial,sans-serif;max-width:760px;margin:32px auto;padding:0 16px;color:#1e2130;line-height:1.6;}
h1{font-size:20px;} .meta{color:#656b7c;font-size:13px;margin-bottom:20px;}
.essay-box{background:#f6f7fb;border:1px solid #e2e5ee;border-radius:12px;padding:16px;white-space:pre-wrap;font-size:14px;margin-bottom:24px;}
.overall{display:flex;align-items:center;gap:16px;background:#f0f2f8;border-radius:12px;padding:16px;margin-bottom:20px;}
.overall .score{width:64px;height:64px;border-radius:50%;background:#4f46e5;color:#fff;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:20px;flex:none;}
.category-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:14px;margin-bottom:20px;}
.category-card{border:1px solid #e2e5ee;border-radius:12px;padding:14px;}
.category-card-head{display:flex;justify-content:space-between;margin-bottom:6px;}
.category-card h4{margin:0;font-size:14px;} .category-score{font-weight:800;color:#4f46e5;font-size:13px;}
.score-bar-track{height:6px;border-radius:4px;background:#e2e5ee;overflow:hidden;margin-bottom:8px;}
.score-bar-fill{height:100%;background:#4f46e5;}
.summary{font-size:13.5px;margin:0 0 6px;} ul{margin:0;padding-left:18px;font-size:13px;color:#656b7c;}
.two-col{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:14px;}
.callout{border-radius:12px;padding:14px;} .callout-good{background:#ecfdf3;} .callout-next{background:#fffaeb;}
footer{margin-top:28px;font-size:11px;color:#8a8f9e;text-align:center;line-height:1.7;}
@media print{body{margin:0;}}
</style></head>
<body>
  <h1>✍️ 라이팅 코치 — 채점 결과</h1>
  <p class="meta">${result.title ? escapeHtml(result.title) + ' · ' : ''}학년/연령: ${escapeHtml(result.grade.display)} · 채점 시각: ${result.gradedAt.toLocaleString('ko-KR')}</p>

  <h3>제출한 글</h3>
  <div class="essay-box">${escapeHtml(result.essay || '')}</div>

  <div class="overall">
    <div class="score">${clampScore(result.overallScore, 100)}</div>
    <div><h3 style="margin:0 0 4px;">종합 평가</h3><p style="margin:0;font-size:14px;color:#656b7c;">${escapeHtml(result.overallSummary || '')}</p></div>
  </div>

  <div class="category-grid">${categoryBlocks}</div>

  <div class="two-col">
    <div class="callout callout-good"><h3 style="margin:0 0 8px;color:#16a34a;">👍 잘한 점</h3><ul>${strengths}</ul></div>
    <div class="callout callout-next"><h3 style="margin:0 0 8px;color:#d97706;">🎯 다음 단계 목표</h3><ul>${nextSteps}</ul></div>
  </div>

  <footer>
    본 결과는 AI(Anthropic Claude API)가 생성한 참고용 첨삭이며, Anthropic 또는 Claude와 공식 제휴되지 않은 독립 프로젝트 "라이팅 코치"로 생성되었습니다.<br>
    최종 판단은 반드시 사람(교사·학부모)이 함께 확인해 주세요.
  </footer>
</body></html>`;
}

function saveResults() {
  if (!state.lastResult) return;
  const html = buildReportHtml(state.lastResult);
  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const safeTitle = (state.lastResult.title || 'writing-feedback').replace(/[^\w\-가-힣 ]/g, '').trim() || 'writing-feedback';
  a.href = url;
  a.download = `${safeTitle}-결과.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
