/* 라이팅 코치 — English Writing Feedback Tool
 * © 2026 EnL_language. All rights reserved. For personal and classroom use only.
 * Do not copy, share, or redistribute without permission.
 * Client-side only: essays and API keys go directly from the browser to
 * Anthropic's API. Nothing is sent to or stored on any third-party server.
 */

const GRADE_GROUPS = [
  {
    label: '유치원 · Kindergarten',
    items: [
      { id: 'k', short: '유치원', display: '유치원 (만 5~6세)', desc: 'Kindergarten (ages 5–6): emergent writing, sight words, simple phonetic spelling, one or two very simple sentences.' },
    ],
  },
  {
    label: '초등학교 · Elementary (Grades 1–5, 한국 초1~초5)',
    items: [
      { id: 'g1', short: '초1', display: 'Grade 1', desc: 'Grade 1 (ages 6–7): simple sentences, basic sight words, beginning capitalization and punctuation.' },
      { id: 'g2', short: '초2', display: 'Grade 2', desc: 'Grade 2 (ages 7–8): short paragraphs, simple and compound sentences, growing sight-word vocabulary.' },
      { id: 'g3', short: '초3', display: 'Grade 3', desc: 'Grade 3 (ages 8–9): organized paragraphs with a main idea and supporting details, expanding vocabulary.' },
      { id: 'g4', short: '초4', display: 'Grade 4', desc: 'Grade 4 (ages 9–10): multi-paragraph writing, transition words, more varied sentence structure.' },
      { id: 'g5', short: '초5', display: 'Grade 5', desc: 'Grade 5 (ages 10–11): clear intro/body/conclusion structure, more descriptive and precise vocabulary.' },
    ],
  },
  {
    label: '중학교 · Middle School (Grades 6–8, 한국 초6~중2)',
    items: [
      { id: 'g6', short: '초6', display: 'Grade 6', desc: 'Grade 6 (ages 11–12): a clear main idea/thesis-like statement, introduction of compound-complex sentences.' },
      { id: 'g7', short: '중1', display: 'Grade 7', desc: 'Grade 7 (ages 12–13): organized essays with evidence and support, more varied sentence structure.' },
      { id: 'g8', short: '중2', display: 'Grade 8', desc: 'Grade 8 (ages 13–14): clear argumentative/analytical structure, more sophisticated vocabulary and syntax.' },
    ],
  },
  {
    label: '고등학교 · High School (Grades 9–12, 한국 중3~고3)',
    items: [
      { id: 'g9', short: '중3', display: 'Grade 9', desc: 'Grade 9 (ages 14–15): high-school level essay structure, a clear thesis, growing sentence variety.' },
      { id: 'g10', short: '고1', display: 'Grade 10', desc: 'Grade 10 (ages 15–16): analytical writing with strong evidence and reasoning, complex sentence variety.' },
      { id: 'g11', short: '고2', display: 'Grade 11', desc: 'Grade 11 (ages 16–17): college-prep level argumentation, nuanced word choice, rhetorical sophistication.' },
      { id: 'g12', short: '고3', display: 'Grade 12', desc: 'Grade 12 (ages 17–18): college-ready clarity, sophisticated vocabulary and syntax, strong rhetorical control.' },
    ],
  },
  {
    label: '성인 · Adult',
    items: [
      { id: 'adult', short: '성인', display: '성인 (Adult)', desc: 'Adult learner / general adult writing: professional or academic-level clarity, precision, and nuance.' },
    ],
  },
];

const MODEL_IDS = ['claude-haiku-5-5', 'claude-sonnet-5-5', 'claude-opus-5-5'];
const DEFAULT_MODEL = 'claude-sonnet-5-5';

/* 피드백 언어: 설명은 이 언어로, 학생 원문 인용과 고친 영어 문장은 영어 그대로. */
const FEEDBACK_LANGS = {
  ko: { name: 'Korean (한국어)', locale: 'ko-KR', ui: {
    results: '채점 결과', overall: '종합 평가', strengths: '👍 잘한 점', next: '🎯 다음 단계 목표',
    level: '학년/연령', time: '채점 시각', title: '제목', score: '종합 점수', essay: '제출한 글',
    note: '※ 본 결과는 AI가 생성한 참고용 첨삭입니다. 최종 판단은 교사·학부모가 함께 확인해 주세요.' } },
  en: { name: 'English', locale: 'en-US', ui: {
    results: 'Feedback Report', overall: 'Overall', strengths: '👍 Strengths', next: '🎯 Next Steps',
    level: 'Grade/Age', time: 'Graded at', title: 'Title', score: 'Overall score', essay: 'Student writing',
    note: '※ AI-generated feedback for reference only. Please have a teacher or parent review it.' } },
  ja: { name: 'Japanese (日本語)', locale: 'ja-JP', ui: {
    results: '添削結果', overall: '総合評価', strengths: '👍 よくできた点', next: '🎯 次の目標',
    level: '学年/年齢', time: '採点日時', title: 'タイトル', score: '総合点', essay: '提出した文章',
    note: '※ この結果はAIが作成した参考用の添削です。最終的な判断は先生・保護者がご確認ください。' } },
  zh: { name: 'Simplified Chinese (简体中文)', locale: 'zh-CN', ui: {
    results: '批改结果', overall: '总体评价', strengths: '👍 做得好的地方', next: '🎯 下一步目标',
    level: '年级/年龄', time: '批改时间', title: '题目', score: '总分', essay: '提交的作文',
    note: '※ 本结果由AI生成，仅供参考。请老师或家长最终确认。' } },
  es: { name: 'Spanish (Español)', locale: 'es-ES', ui: {
    results: 'Resultado de la corrección', overall: 'Evaluación general', strengths: '👍 Puntos fuertes', next: '🎯 Próximos objetivos',
    level: 'Curso/Edad', time: 'Fecha', title: 'Título', score: 'Puntuación total', essay: 'Texto del alumno',
    note: '※ Corrección generada por IA solo como referencia. Un docente o familiar debe revisarla.' } },
  vi: { name: 'Vietnamese (Tiếng Việt)', locale: 'vi-VN', ui: {
    results: 'Kết quả chấm bài', overall: 'Đánh giá tổng quát', strengths: '👍 Điểm làm tốt', next: '🎯 Mục tiêu tiếp theo',
    level: 'Lớp/Tuổi', time: 'Thời gian chấm', title: 'Tiêu đề', score: 'Tổng điểm', essay: 'Bài viết của học sinh',
    note: '※ Kết quả do AI tạo, chỉ để tham khảo. Giáo viên hoặc phụ huynh nên kiểm tra lại.' } },
};

const COPYRIGHT = '© 2026 EnL_language. All rights reserved. For personal and classroom use only. Do not copy, share, or redistribute without permission.';

function langOf(code) { return FEEDBACK_LANGS[code] || FEEDBACK_LANGS.ko; }

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
  els.feedbackLang = document.getElementById('feedbackLang');
  els.lessonMode = document.getElementById('lessonMode');
  els.resultsTitle = document.getElementById('resultsTitle');
  els.overallTitle = document.getElementById('overallTitle');
  els.strengthsTitle = document.getElementById('strengthsTitle');
  els.nextStepsTitle = document.getElementById('nextStepsTitle');
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
  els.feedbackLang.addEventListener('change', persistPrefs);
  els.lessonMode.addEventListener('change', persistPrefs);
}

/* 피드백 언어·수업 여부는 비밀이 아니므로 키 기억 여부와 상관없이 저장 */
function persistPrefs() {
  try {
    localStorage.setItem('wc_prefs', JSON.stringify({ lang: els.feedbackLang.value, lesson: els.lessonMode.value }));
  } catch (e) { /* ignore */ }
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
      // 예전 버전에 저장된 모델 이름은 무시하고 기본 모델 사용
      els.modelSelect.value = MODEL_IDS.includes(data.model) ? data.model : DEFAULT_MODEL;
    }
  } catch (e) {
    /* ignore corrupted storage */
  }
  try {
    const prefs = JSON.parse(localStorage.getItem('wc_prefs') || '{}');
    if (prefs.lang && FEEDBACK_LANGS[prefs.lang]) els.feedbackLang.value = prefs.lang;
    if (prefs.lesson === 'test' || prefs.lesson === 'lesson') els.lessonMode.value = prefs.lesson;
  } catch (e) { /* ignore */ }
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

/* 영어(라틴 문자) 단어만 셉니다. 한글·한자·가나 등 다른 문자는 따로 셉니다. */
function analyzeText(text) {
  // "dolphin을", "海豚。Dolphins"처럼 다른 글자에 붙은 영어 단어도 셉니다.
  const englishWords = (text.match(/\p{Script=Latin}+(?:['’-]\p{Script=Latin}+)*/gu) || []).length;
  const letters = text.match(/\p{L}/gu) || [];
  const latin = letters.filter((ch) => /\p{Script=Latin}/u.test(ch)).length;
  const nonLatin = letters.length - latin;
  return {
    englishWords,
    chars: [...text].length,
    nonLatin,
    latinRatio: letters.length ? latin / letters.length : 1,
  };
}

function updateWordCount() {
  const info = analyzeText(els.essayText.value.trim());
  let label = `영어 ${info.englishWords} 단어 · ${info.chars}자`;
  if (info.nonLatin > 0) label += ` · 영어 외 글자 ${info.nonLatin}개`;
  els.wordCount.textContent = label;
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
  const info = analyzeText(essay);
  const minWords = grade.id === 'k' || grade.id === 'g1' ? 3 : 10;
  if (info.englishWords < minWords) {
    showError(info.nonLatin > info.englishWords
      ? '이 도구는 영어 글 첨삭용입니다. 영어로 쓴 글을 입력해주세요. (피드백을 받을 언어는 "2. 채점 옵션"에서 고를 수 있어요.)'
      : `채점할 영어 글이 너무 짧습니다. 영어 단어 ${minWords}개 이상 입력해주세요.`);
    return;
  }
  if (info.latinRatio < 0.7) {
    const ok = window.confirm('글에 영어가 아닌 부분이 많습니다. 영어 부분만 채점하고, 다른 언어로 쓴 부분은 따로 알려 드립니다. 계속할까요?');
    if (!ok) return;
  }

  setLoading(true);
  try {
    const result = await gradeEssay({
      apiKey,
      model: MODEL_IDS.includes(els.modelSelect.value) ? els.modelSelect.value : DEFAULT_MODEL,
      grade,
      langCode: els.feedbackLang.value,
      lessonMode: els.lessonMode.value,
      title: els.essayTitle.value.trim(),
      essay,
    });
    state.lastResult = {
      ...result, grade, title: els.essayTitle.value.trim(), essay, gradedAt: new Date(),
      langCode: els.feedbackLang.value, lessonMode: els.lessonMode.value,
    };
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
  if (msg.includes('404') || msg.toLowerCase().includes('model')) {
    return '선택한 채점 모델을 사용할 수 없습니다. "⚙️ API 설정"에서 다른 모델을 골라 다시 시도해주세요.';
  }
  if (msg.includes('429') || msg.includes('529') || msg.toLowerCase().includes('overloaded')) {
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

Each "details" array should have 2-4 items when possible. Quote short snippets from the student's actual text where useful. Keep language simple enough for a parent to understand.

Language rules:
- Write every explanation (overallSummary, each summary, the explanatory part of each details item, strengths, nextSteps) in the feedback language named in the user message.
- Never translate the student's writing. Keep quotes from the student's text, corrected sentences, and suggested words in English, inside double quotes, e.g. "there way" → "their way".
- Grade only the English parts of the text. If some parts are written in another language, do not score those parts; mention it once in overallSummary (in the feedback language) and encourage the student to write them in English.
- Do not penalize the student for using American or British spelling, as long as it is consistent.

Output nothing but the JSON object.`;

const FLOW_RULES = {
  lesson: 'This essay was written after the student attended a lesson (e.g. a Zoom class). For Flow & Organization, first acknowledge what the student did well, then focus on the ending: if the conclusion lacks supporting detail or includes content unrelated to the topic, give a clear direction for improving it.',
  test: 'This essay was written as a test without a lesson. For Flow & Organization, give a balanced picture of the strengths and weaknesses of the overall flow and structure (beginning, middle, and end).',
};

async function gradeEssay({ apiKey, model, grade, title, essay, langCode, lessonMode }) {
  const lang = langOf(langCode);
  const userPrompt = `Student grade/age level: ${grade.display} — ${grade.desc}
Feedback language: ${lang.name}
Writing context: ${FLOW_RULES[lessonMode] || FLOW_RULES.lesson}

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
      max_tokens: 4000,
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
  if (data.stop_reason === 'max_tokens') {
    throw new Error('채점 결과가 너무 길어 중간에 잘렸습니다. 글을 나누어 다시 채점해주세요.');
  }
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
  const lang = langOf(result.langCode);
  els.resultsPanel.hidden = false;
  els.resultsPanel.lang = (lang.locale || 'ko').slice(0, 2);
  els.resultsTitle.textContent = lang.ui.results;
  els.overallTitle.textContent = lang.ui.overall;
  els.strengthsTitle.textContent = lang.ui.strengths;
  els.nextStepsTitle.textContent = lang.ui.next;
  els.resultMeta.textContent =
    `${result.title ? result.title + ' · ' : ''}${lang.ui.level}: ${result.grade.display} · ${lang.ui.time}: ${result.gradedAt.toLocaleString(lang.locale)}`;

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
  const lang = langOf(result.langCode);
  const ui = lang.ui;
  const lines = [];
  lines.push(`=== ${ui.results} ===`);
  if (result.title) lines.push(`${ui.title}: ${result.title}`);
  lines.push(`${ui.level}: ${result.grade.display}`);
  lines.push(`${ui.time}: ${result.gradedAt.toLocaleString(lang.locale)}`);
  lines.push(`${ui.score}: ${clampScore(result.overallScore, 100)}/100`);
  lines.push('');
  lines.push(`[${ui.overall}]`);
  lines.push(result.overallSummary || '');
  lines.push('');
  CATEGORY_META.forEach((meta) => {
    const cat = (result.categories && result.categories[meta.key]) || {};
    lines.push(`[${meta.label}] ${clampScore(cat.score, 10)}/10`);
    lines.push(cat.summary || '');
    (cat.details || []).forEach((d) => lines.push(`  - ${d}`));
    lines.push('');
  });
  lines.push(`[${ui.strengths.replace(/^\S+\s/, '')}]`);
  (result.strengths || []).forEach((s) => lines.push(`  - ${s}`));
  lines.push('');
  lines.push(`[${ui.next.replace(/^\S+\s/, '')}]`);
  (result.nextSteps || []).forEach((s) => lines.push(`  - ${s}`));
  lines.push('');
  lines.push(ui.note);
  lines.push(COPYRIGHT);
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
  const lang = langOf(result.langCode);
  const ui = lang.ui;
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
<html lang="${lang.locale.slice(0, 2)}"><head><meta charset="UTF-8"><title>${escapeHtml(result.title || ui.results)}</title>
<style>
body{font-family:'Noto Sans KR','Noto Sans JP','Noto Sans SC','PingFang SC','Hiragino Sans',Arial,sans-serif;max-width:760px;margin:32px auto;padding:0 16px;color:#1e2130;line-height:1.6;}
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
  <h1>✍️ ${escapeHtml(ui.results)}</h1>
  <p class="meta">${result.title ? escapeHtml(result.title) + ' · ' : ''}${escapeHtml(ui.level)}: ${escapeHtml(result.grade.display)} · ${escapeHtml(ui.time)}: ${escapeHtml(result.gradedAt.toLocaleString(lang.locale))}</p>

  <h3>${escapeHtml(ui.essay)}</h3>
  <div class="essay-box">${escapeHtml(result.essay || '')}</div>

  <div class="overall">
    <div class="score">${clampScore(result.overallScore, 100)}</div>
    <div><h3 style="margin:0 0 4px;">${escapeHtml(ui.overall)}</h3><p style="margin:0;font-size:14px;color:#656b7c;">${escapeHtml(result.overallSummary || '')}</p></div>
  </div>

  <div class="category-grid">${categoryBlocks}</div>

  <div class="two-col">
    <div class="callout callout-good"><h3 style="margin:0 0 8px;color:#16a34a;">${escapeHtml(ui.strengths)}</h3><ul>${strengths}</ul></div>
    <div class="callout callout-next"><h3 style="margin:0 0 8px;color:#d97706;">${escapeHtml(ui.next)}</h3><ul>${nextSteps}</ul></div>
  </div>

  <footer>
    ${escapeHtml(ui.note)}<br>
    ${escapeHtml(COPYRIGHT)}
  </footer>
</body></html>`;
}

function saveResults() {
  if (!state.lastResult) return;
  const html = buildReportHtml(state.lastResult);
  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  // 한·중·일 등 모든 언어 글자는 살리고, 파일 이름에 못 쓰는 기호만 뺍니다.
  const safeTitle = (state.lastResult.title || 'writing-feedback').replace(/[^\p{L}\p{N}\-_ ]/gu, '').trim().slice(0, 60) || 'writing-feedback';
  a.href = url;
  a.download = `${safeTitle}-feedback.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
