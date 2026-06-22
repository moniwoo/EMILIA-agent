// ── API KEY MANAGEMENT ──────────────────────────────────────────────────────
function saveKey() {
  const key = document.getElementById('api-key-input').value.trim();
  if (!key) {
    alert('Por favor, introduce tu API key de Gemini.');
    return;
  }
  localStorage.setItem('gemini_key', key);
  document.getElementById('api-overlay').style.display = 'none';
  document.getElementById('app').style.display = 'flex';
  initCompanies();
}

function clearKey() {
  localStorage.removeItem('gemini_key');
  location.reload();
}

function getKey() {
  return localStorage.getItem('gemini_key');
}

// ── INIT ─────────────────────────────────────────────────────────────────────
window.addEventListener('DOMContentLoaded', () => {
  const key = getKey();
  if (key) {
    document.getElementById('api-overlay').style.display = 'none';
    document.getElementById('app').style.display = 'flex';
    initCompanies();
  }
});

// ── PANEL NAVIGATION ─────────────────────────────────────────────────────────
const PANEL_META = {
  post:     { title: 'Redactar post',          sub: 'Convierte una idea en un post con tu voz' },
  trends:   { title: 'Tendencias del sector',  sub: 'Novedades en ingeniería aeroespacial e IA' },
  events:   { title: 'Eventos de interés',     sub: 'Conferencias y meetups relevantes para tu perfil' },
  tracking: { title: 'Seguimiento de empresas', sub: 'Novedades y oportunidades en tus empresas objetivo' },
  study:    { title: 'Estudio técnico',        sub: 'Generación didáctica de exámenes y solucionarios estructurados' }
};

function switchPanel(id, el) {
  // Ocultamos todos los paneles añadiendo 'hidden' y quitando 'active'
  document.querySelectorAll('.panel').forEach(p => { 
    p.classList.add('hidden'); 
    p.classList.remove('active'); 
  });
  
  // Quitamos la clase activa de todos los botones de la barra lateral
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  
  // Activamos el panel correspondiente
  const panel = document.getElementById('panel-' + id);
  if (panel) {
    panel.classList.remove('hidden');
    panel.classList.add('active');
  }
  
  // Activamos el botón de la barra lateral
  el.classList.add('active');
  
  // Cambiamos los textos de la barra superior
  document.getElementById('topbar-title').textContent = PANEL_META[id].title;
  document.getElementById('topbar-sub').textContent = PANEL_META[id].sub;
}

// ── GEMINI API CONNECTOR ──────────────────────────────────────────────────────
async function callGemini(systemPrompt, userPrompt, inlineFiles = []) {
  const key = getKey();
  if (!key) throw new Error('No se ha encontrado la clave de API.');

  // Construcción del cuerpo según la especificación oficial de Gemini API
  const contentsParts = [];
  
  // Añadimos archivos adjuntos si existen en formato { mimeType, data }
  inlineFiles.forEach(file => {
    contentsParts.push({
      inlineData: {
        mimeType: file.mimeType,
        data: file.data
      }
    });
  });

  // Añadimos el prompt de usuario
  contentsParts.push({ text: userPrompt });

  const body = {
    contents: [{ parts: contentsParts }],
    systemInstruction: {
      parts: [{ text: systemPrompt }]
    }
  };

  // Usamos el endpoint oficial para gemini-2.5-flash
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${key}`;

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || 'Error de comunicación con la API de Gemini');
  }

  const data = await res.json();
  try {
    return data.candidates[0].content.parts[0].text;
  } catch (e) {
    throw new Error('La respuesta del modelo no contiene una estructura de texto válida.');
  }
}

// ── FILE HELPER (CONVERT TO BASE64) ──────────────────────────────────────────
function fileToGenerativePart(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64Data = reader.result.split(',')[1];
      resolve({
        mimeType: file.type,
        data: base64Data
      });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// ── HELPERS ───────────────────────────────────────────────────────────────────
function showLoading(outputId, resultId) {
  document.getElementById(outputId).innerHTML = '<span class="loading-text">CARLA está procesando tu solicitud... Esto se puede demorar unos segundos.</span>';
  document.getElementById(resultId).classList.remove('hidden');
  document.getElementById(resultId).style.display = 'flex';
}

function showError(outputId, msg) {
  document.getElementById(outputId).textContent = '⚠ ' + msg;
}

function copyText(id) {
  const text = document.getElementById(id).textContent;
  navigator.clipboard.writeText(text).then(() => {
    const btn = event.currentTarget;
    const orig = btn.innerHTML;
    btn.innerHTML = '<i class="ti ti-check"></i> Copiado';
    setTimeout(() => { btn.innerHTML = orig; }, 1500);
  });
}

// ── POST MODULE ───────────────────────────────────────────────────────────────
async function generatePost() {
  const idea = document.getElementById('post-idea').value.trim();
  if (!idea) { alert('Escribe una idea primero.'); return; }

  const tone = document.getElementById('post-tone').value;
  const length = document.getElementById('post-length').value;

  showLoading('post-output', 'post-result');

  const system = `Eres CARLA.agent, la asistente e inteligente aliada de LinkedIn de Moni, estudiante de ingenieria mecánica en Sevilla. Moni ha cursado un master en Ingenieria aerosespacial y cursa un máster en Visión Artificial y es miembro de EYE, European Young Engineers. Tienes un profundo interés por aerospace, IA, drones, defensa, emprendimiento y la sostenibilidad.
Redactas posts profesionales optimizados para LinkedIn en su voz exacta: directa, contundente, estructurada con saltos de línea estratégicos, apertura de alto impacto, sin halagos corporativos empalagosos y con un máximo de 1-2 emojis contextuales. En español y a veces en inglés.

Tono requerido: ${tone}
Extensión estimada: ${length}`;

  try {
    const result = await callGemini(system, `Genera el post definitivo basándote en esta nota o idea: ${idea}`);
    document.getElementById('post-output').textContent = result;
  } catch (e) {
    showError('post-output', e.message);
  }
}

// ── TRENDS MODULE ─────────────────────────────────────────────────────────────
async function getTrends() {
  showLoading('trends-output', 'trends-result');

  const extra = document.getElementById('trends-extra').value.trim();
  const period = document.getElementById('trends-period').value;
  const topics = 'Ingeniería aeroespacial, defensa, drones UAS avanzados, IA aplicada, gemelos digitales y Computer Vision' + (extra ? ', ' + extra : '');

  const system = `Eres CARLA.agent, analista técnica sénior. Tu tarea es estructurar un informe claro, analítico y conciso sobre las tendencias tecnológicas globales en la última ${period}. Formatea el texto limpiamente usando viñetas e incluye secciones de impacto en sectores clave en idioma español de España.`;

  try {
    const result = await callGemini(system, `Analiza las tendencias más urgentes y relevantes en los campos de: ${topics}`);
    document.getElementById('trends-output').textContent = result;
  } catch (e) {
    showError('trends-output', e.message);
  }
}

function trendToPost() {
  const trends = document.getElementById('trends-output').textContent;
  document.getElementById('post-idea').value = trends.substring(0, 500);
  switchPanel('post', document.querySelector('[data-panel="post"]'));
}

// ── EVENTS MODULE ─────────────────────────────────────────────────────────────
// ── EVENTS MODULE ─────────────────────────────────────────────────────────────
async function getEvents() {
  showLoading('events-output', 'events-result');

  const country = document.getElementById('events-country').value;
  const region = document.getElementById('events-region').value.trim();
  const horizon = document.getElementById('events-horizon').value;
  const focus = document.getElementById('events-focus').value.trim();

  const system = `Eres CARLA.agent, mentora de carrera en ingeniería. Lista ferias de empleo, congresos de aeronáutica, defensa, robótica e inteligencia artificial. Devuelve una lista organizada por fechas que detone el nombre del evento, la localización exacta y el valor técnico o de networking que aporta a un perfil de ingeniería avanzada. Idioma español.`;

  // Construimos la localización combinando País y Provincia de forma natural
  let localizacion = country;
  if (region) {
    localizacion = `${region} (${country})`;
  }

  const query = `Eventos, hackatones o conferencias de alta ingeniería y tecnología en ${localizacion} planificados para los próximos ${horizon}${focus ? ' con especial enfoque en ' + focus : ''}`;

  try {
    const result = await callGemini(system, query);
    document.getElementById('events-output').textContent = result;
  } catch (e) {
    showError('events-output', e.message);
  }
}
// ── TRACKING MODULE ───────────────────────────────────────────────────────────
const DEFAULT_COMPANIES = [
  { name: 'Airbus', category: 'Aerospace' },
  { name: 'Indra', category: 'Defense / AI' },
  { name: 'Akkodis', category: 'Engineering' },
  { name: 'Multiverse Computing', category: 'Quantum / AI' },
  { name: 'UAV Navigation', category: 'Drones' }
];

let companies = [];

function loadCompanies() {
  const stored = localStorage.getItem('tracked_companies');
  return stored ? JSON.parse(stored) : [...DEFAULT_COMPANIES];
}

function saveCompanies() {
  localStorage.setItem('tracked_companies', JSON.stringify(companies));
}

function initCompanies() {
  companies = loadCompanies();
  renderCompanies();
}

function renderCompanies() {
  const list = document.getElementById('company-list');
  if(!list) return;
  list.innerHTML = '';
  companies.forEach((c, i) => {
    const row = document.createElement('div');
    row.className = 'company-row';
    row.innerHTML = `
      <div class="company-meta">
        <span>${c.name}</span>
        <span class="badge">${c.category}</span>
      </div>
      <button class="btn-remove" onclick="removeCompany(${i})" title="Eliminar"><i class="ti ti-x"></i></button>
    `;
    list.appendChild(row);
  });
}

function addCompany() {
  const input = document.getElementById('new-company');
  const name = input.value.trim();
  if (!name) return;
  if (companies.find(c => c.name.toLowerCase() === name.toLowerCase())) {
    input.value = '';
    return;
  }
  companies.push({ name, category: 'Nuevo' });
  saveCompanies();
  renderCompanies();
  input.value = '';
}

function removeCompany(i) {
  companies.splice(i, 1);
  saveCompanies();
  renderCompanies();
}

async function getTracking() {
  if (companies.length === 0) { alert('Añade al menos una empresa.'); return; }
  showLoading('tracking-output', 'tracking-result');
  const names = companies.map(c => c.name).join(', ');

  const system = `Eres un agente analista de mercado corporativo. Examina hitos recientes, proyectos industriales estratégicos adjudicados y dinámicas operativas relevantes de las siguientes corporaciones tecnológicas. Genera un reporte directo en español con notas explícitas de acercamiento táctico para Moni.`;

  try {
    const result = await callGemini(system, `Genera informe estratégico de actualización para: ${names}`);
    document.getElementById('tracking-output').textContent = result;
  } catch (e) {
    showError('tracking-output', e.message);
  }
}

function trackingToPost() {
  const info = document.getElementById('tracking-output').textContent;
  document.getElementById('post-idea').value = info.substring(0, 500);
  switchPanel('post', document.querySelector('[data-panel="post"]'));
}

// ── NEW STUDY MODULE (MULTIMODAL GEMINI) ──────────────────────────────────────
async function generateStudyMaterial() {
  const materialFile = document.getElementById('study-material').files[0];
  const examFile = document.getElementById('study-exam').files[0];
  const studyType = document.getElementById('study-type').value;
  const difficulty = document.getElementById('study-difficulty').value;

  showLoading('study-output', 'study-result');

  const system = `Eres CARLA.agent, la mentora y profesora particular de ingeniería avanzada de Moni. Tu objetivo es dinamizar asignaturas complejas y áridas (matemáticas avanzadas, mecánica de fluidos, cálculo numérico, estructuras). 
Eres experta en metodología didáctica e impecable a nivel matemático y físico.
Cuando generes enunciados o resuelvas problemas:
1. Explica minuciosamente el trasfondo físico y lógico de cada paso, aislando las variables clave.
2. Desglosa los desarrollos matemáticos de manera secuencial, clara y super exacta con alta precisión numérica.
3. El formato de salida debe ser estructurado usando texto limpio scannable y ordenado para facilitar el estudio visual.`;

  let promptUsuario = `Por favor, actúa como mi tutora técnica y genera el siguiente material de estudio:
- Tipo de material: ${studyType.replace('_', ' ')}
- Nivel de dificultad elegido: ${difficulty === 'similar' ? 'Fiel e idéntico al estándar del examen previo' : 'Nivel Reto (un paso más avanzado para asegurar excelente nota)'}.

INSTRUCCIONES CLAVE:
Si te he adjuntado un modelo de examen previo, replica meticulosamente su estructura, formato de preguntas, lenguaje académico, sistema de puntuación y estilo conceptual.
Si te he adjuntado apuntes, extrae los conceptos clave de ahí.
Al final, incluye obligatoriamente un SOLUCIONARIO detallado, justificando físicamente cada paso, fórmula empleada y el resultado algebraico o numérico obtenido.`;

  try {
    const attachments = [];
    
    // Convertimos a base64 los archivos que el usuario haya seleccionado voluntariamente
    if (materialFile) {
      const part = await fileToGenerativePart(materialFile);
      attachments.push(part);
      promptUsuario += "\n[Analiza el archivo adjunto que contiene los apuntes de la asignatura]";
    }
    if (examFile) {
      const part = await fileToGenerativePart(examFile);
      attachments.push(part);
      promptUsuario += "\n[Analiza el archivo adjunto que contiene el modelo de examen antiguo para clonar su estilo y formato]";
    }

    const result = await callGemini(system, promptUsuario, attachments);
    document.getElementById('study-output').textContent = result;
  } catch (e) {
    showError('study-output', e.message);
  }
}
