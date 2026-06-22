// ── API KEY MANAGEMENT ──────────────────────────────────────────────────────
function saveKey() {
  const input = document.getElementById('api-key-input');
  const key = input.value.trim();
  if (key) {
    localStorage.setItem('gemini_api_key', key);
    
    // Ocultamos el bloqueo y mostramos la app
    document.getElementById('api-overlay').style.display = 'none';
    document.getElementById('app').style.display = 'flex';
    
    // Inicializamos las empresas y el saludo de bienvenida
    if (typeof initCompanies === 'function') initCompanies();
    if (typeof generateRandomGreeting === 'function') generateRandomGreeting();
  } else {
    alert('Por favor, introduce una API key válida.');
  }
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
  const key = localStorage.getItem('gemini_api_key'); // o tu función getKey()
  if (key) {
    document.getElementById('api-overlay').style.display = 'none';
    document.getElementById('app').style.display = 'flex';
    if (typeof initCompanies === 'function') initCompanies();
    if (typeof generateRandomGreeting === 'function') generateRandomGreeting();
  }
});

// ── SALUDOS ALEATORIOS ESTILO GEMINI ─────────────────────────────────────────
function generateRandomGreeting() {
  const greetings = [
    "Hellou Hellouuu Moni"
    "¡Hola, Moni!",
    "¡Buenas de nuevo, Moni!",
    "¡Qué pasa pichona!"
    "¡Hola de nuevo, jefa!",
    "¡Todo listo, Moni!"
  ];
  
  const messages = [
    "Qué alegría verte de nuevo. ¿Qué vamos a diseñar u optimizar hoy?",
    "Es un gran día para impulsar tus redes y avanzar en tus asignaturas técnicas.",
    "Un placer saludarte. ¿Revisamos tendencias de mercado o preparamos un simulacro de examen?",
    "Lista para la acción. Dime en qué módulo nos enfocamos hoy."
  ];

  // Elegimos combinaciones aleatorias
  const randomGreeting = greetings[Math.floor(Math.random() * greetings.length)];
  const randomMessage = messages[Math.floor(Math.random() * messages.length)];

  const greetingEl = document.getElementById('welcome-greeting');
  const messageEl = document.getElementById('welcome-message');

  if (greetingEl) greetingEl.textContent = randomGreeting;
  if (messageEl) messageEl.textContent = randomMessage;
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
  // Asegurar que ocultamos la pantalla de bienvenida al cambiar de sección
  const welcome = document.getElementById('welcome-screen');
  if (welcome) {
    welcome.style.display = 'none';
  }

  // Ocultar todos los paneles (tu código actual continúa aquí abajo...)
  document.querySelectorAll('.panel').forEach(p => p.classList.add('hidden'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  
  const target = document.getElementById(`panel-${id}`);
  if (target) target.classList.remove('hidden');
  if (el) el.classList.add('active');
}
  
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
  document.getElementById(outputId).innerHTML = '<span class="loading-text">EMILIA está procesando tu solicitud... Esto se puede demorar unos segundos.</span>';
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

  const system = `Eres EMILIA.agent, la asistente e inteligente aliada de LinkedIn de Moni, estudiante de ingenieria mecánica en Sevilla. Moni ha cursado un master en Ingenieria aerosespacial y cursa un máster en Visión Artificial y es miembro de EYE, European Young Engineers. Tienes un profundo interés por aerospace, IA, drones, defensa, emprendimiento y la sostenibilidad.
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

  const focusTopic = document.getElementById('trends-focus').value.trim();
  const period = document.getElementById('trends-period').value;
  
  let topics = 'Ingeniería aeroespacial, defensa, drones UAS avanzados, IA aplicada, gemelos digitales y Computer Vision';
  if (focusTopic) {
    topics = `EL ASPECTO ESPECÍFICO: "${focusTopic}" enfocado e intersecado con la ingeniería avanzada`;
  }

  const system = `Eres EMILIA.agent, analista técnica sénior. Estructura un informe claro, analítico y altamente visual en español de España sobre las novedades de la última ${period}.
INSTRUCCIONES DE FORMATO IMPRESCINDIBLES:
- Usa títulos claros con '##' o '###'.
- Usa negritas '**texto**' para destacar palabras clave de impacto y subrayados '__texto__' para nombres de tecnologías o proyectos.
- Organiza todo con guiones ejecutivos para hacer el texto escaneable.
- SI EXISTEN DATOS NUMÉRICOS, PORCENTAJES O ESTADÍSTICAS CRUCIALES, genera obligatoriamente un gráfico usando exactamente esta estructura sintáctica al final del bloque: [CHART: Nombre del Gráfico | Criterio1:80%, Criterio2:45%]`;

  try {
    const result = await callGemini(system, `Analiza las tendencias más recientes y movimientos de mercado en: ${topics}. Recuerda omitir introducciones vacías.`);
    // Renderizamos usando nuestro nuevo formateador visual
    document.getElementById('trends-output').innerHTML = parseMarkdown(result);
  } catch (e) {
    showError('trends-output', e.message);
  }
}

// ── EVENTS MODULE ─────────────────────────────────────────────────────────────
async function getEvents() {
  showLoading('events-output', 'events-result');

  const country = document.getElementById('events-country').value;
  const region = document.getElementById('events-region').value.trim();
  const horizon = document.getElementById('events-horizon').value;
  const focus = document.getElementById('events-focus').value.trim();

  const system = `Eres EMILIA.agent, mentora de carrera en ingeniería. Lista ferias de empleo, congresos de aeronáutica, defensa, robótica e inteligencia artificial. Devuelve una lista organizada por fechas que detone el nombre del evento, la localización exacta y el valor técnico o de networking que aporta a un perfil de ingeniería avanzada. Idioma español.`;

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
async function getTracking() {
  if (companies.length === 0) { alert('Añade al menos una empresa.'); return; }
  showLoading('tracking-output', 'tracking-result');
  const names = companies.map(c => c.name).join(', ');
  const objective = document.getElementById('tracking-focus').value.trim();

  let peticion = `Genera un informe estratégico de actualización enfocado en las dinámicas generales de: ${names}`;
  if (objective) {
    peticion = `Busca, rastrea y analiza exhaustivamente dentro de las siguientes empresas (${names}) este objetivo específico: "${objective}". Pon foco absoluto en resolver esta intención.`;
  }

  const system = `Eres una agente analista de mercado corporativo y headhunter de ingeniería. Examina hitos industriales y operacionales. 
INSTRUCCIONES DE FORMATO:
- Usa títulos llamativos ('##' o '###'), negritas en hitos importantes y listas ordenadas con guiones ejecutivos. No entregues bloques de texto planos.
- Si el usuario busca ofertas, oportunidades o datos numéricos de mercado, y detectas valores estadísticos significativos o comparativas, genera un gráfico usando esta estructura exacta al final de la sección: [CHART: Título del Análisis | Item1:90%, Item2:60%]`;

  try {
    const result = await callGemini(system, peticion);
    // Renderizamos usando nuestro nuevo formateador visual
    document.getElementById('tracking-output').innerHTML = parseMarkdown(result);
  } catch (e) {
    showError('tracking-output', e.message);
  }
}
// ── NEW STUDY MODULE (MULTIMODAL GEMINI) ──────────────────────────────────────
async function generateStudyMaterial() {
  const materialFile = document.getElementById('study-material').files[0];
  const examFile = document.getElementById('study-exam').files[0];
  const studyType = document.getElementById('study-type').value;
  const difficulty = document.getElementById('study-difficulty').value;

  showLoading('study-output', 'study-result');

  const system = `Eres EMILIA.agent, la mentora y profesora particular de ingeniería avanzada de Moni. Tu objetivo es dinamizar asignaturas complejas y áridas (matemáticas avanzadas, mecánica de fluidos, cálculo numérico, estructuras). 
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
// ── CONVERSOR DE MARKDOWN A HTML VISUAL CORREGIDO (LÍNEA POR LÍNEA) ──────────
function parseMarkdown(text) {
  if (!text) return '';

  let lines = text.split('\n');
  let htmlResult = [];
  let inList = false;

  lines.forEach(line => {
    let cleanLine = line.trim();

    // Saltar líneas vacías pero asegurar separación de párrafos
    if (cleanLine === '') {
      if (inList) { htmlResult.push('</ul>'); inList = false; }
      htmlResult.push('<br>');
      return;
    }

    // Procesar bloques de gráficos si la IA los genera
    if (cleanLine.startsWith('[CHART:')) {
      const chartRegex = /\[CHART:\s*([^|]+)\s*\|\s*([^\]]+)\]/g;
      cleanLine = cleanLine.replace(chartRegex, (match, title, dataStr) => {
        let chartHtml = `<div class="stats-chart-mock"><strong>📊 ${title.trim()}</strong><div style="margin-top:0.75rem;">`;
        const pairs = dataStr.split(',');
        pairs.forEach(pair => {
          const [label, val] = pair.split(':');
          if(label && val) {
            const percent = parseInt(val.replace(/[^0-9]/g, '')) || 50;
            chartHtml += `
              <div class="chart-bar-row">
                <div class="chart-label">${label.trim()}</div>
                <div class="chart-bar-wrapper"><div class="chart-bar-fill" style="width: ${Math.min(percent, 100)}%"></div></div>
                <div class="chart-value">${val.trim()}</div>
              </div>`;
          }
        });
        chartHtml += `</div></div>`;
        return chartHtml;
      });
      htmlResult.push(cleanLine);
      return;
    }

    // Procesar Títulos (Headers)
    if (cleanLine.startsWith('### ')) {
      if (inList) { htmlResult.push('</ul>'); inList = false; }
      htmlResult.push(`<h4>${cleanLine.replace('### ', '')}</h4>`);
      return;
    }
    if (cleanLine.startsWith('## ')) {
      if (inList) { htmlResult.push('</ul>'); inList = false; }
      htmlResult.push(`<h3>${cleanLine.replace('## ', '')}</h3>`);
      return;
    }

    // Procesar Listas / Bullets (líneas que empiezan con - o *)
    if (cleanLine.startsWith('- ') || cleanLine.startsWith('* ')) {
      if (!inList) { htmlResult.push('<ul>'); inList = true; }
      let content = cleanLine.substring(2);
      content = applyInlineFormatting(content);
      htmlResult.push(`<li>${content}</li>`);
      return;
    }

    // Línea normal de texto (párrafo)
    if (inList) { htmlResult.push('</ul>'); inList = false; }
    htmlResult.push(`<p>${applyInlineFormatting(cleanLine)}</p>`);
  });

  if (inList) htmlResult.push('</ul>');

  return htmlResult.join('');
}

// Función auxiliar para procesar negritas, cursivas y subrayados sin romper la línea
function applyInlineFormatting(txt) {
  let formatted = txt;
  formatted = formatted.replace(/\*\*\*\*(.*?)\*\*\*\*/g, '<strong>$1</strong>');
  formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  formatted = formatted.replace(/\*(.*?)\*/g, '<em>$1</em>');
  formatted = formatted.replace(/__(.*?)__/g, '<u>$1</u>');
  return formatted;
}

// ── COMPANY LIST DATABASE & LOGIC ───────────────────────────────────────────
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

function trendToPost() {
  const trends = document.getElementById('trends-output').textContent;
  document.getElementById('post-idea').value = trends.substring(0, 500);
  switchPanel('post', document.querySelector('[data-panel="post"]'));
}

function trackingToPost() {
  const info = document.getElementById('tracking-output').textContent;
  document.getElementById('post-idea').value = info.substring(0, 500);
  switchPanel('post', document.querySelector('[data-panel="post"]'));
}
