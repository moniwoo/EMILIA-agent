// ==========================================
// 1. CONTROL DE ACCESO Y API KEY
// ==========================================

function getKey() {
  return localStorage.getItem('my-carla-gemini-key');
}

function saveKey() {
  const input = document.getElementById('api-key-input');
  if (!input) return;
  
  const key = input.value.trim();
  if (key.length > 10) {
    localStorage.setItem('my-carla-gemini-key', key);
    launchApp();
  } else {
    alert('Por favor, introduce una API key válida.');
  }
}

function clearKey() {
  localStorage.removeItem('my-carla-gemini-key');
  location.reload();
}

function launchApp() {
  const overlay = document.getElementById('api-overlay');
  const appContainer = document.getElementById('app');
  
  if (overlay) overlay.style.display = 'none';
  if (appContainer) appContainer.style.display = 'flex';
  
  // Cargamos las empresas guardadas al arrancar
  initCompanies();
}

window.addEventListener('DOMContentLoaded', () => {
  const key = getKey();
  if (key) {
    launchApp();
  }
});

// ==========================================
// 2. NAVEGACIÓN ENTRE PANELES
// ==========================================

function switchPanel(panelId, element) {
  const welcome = document.getElementById('welcome-screen');
  if (welcome) welcome.style.display = 'none';
  
  const panels = document.querySelectorAll('.panel');
  panels.forEach(p => p.classList.add('hidden'));
  
  const targetPanel = document.getElementById(`panel-${panelId}`);
  if (targetPanel) {
    targetPanel.classList.remove('hidden');
  }
  
  const items = document.querySelectorAll('.nav-item');
  items.forEach(item => item.classList.remove('active'));
  if (element) element.classList.add('active');
  
  const titles = {
    'post': { t: 'Redactar Post', s: 'Crea contenido con tu propia voz' },
    'trends': { t: 'Análisis de Tendencias', s: 'Sectores tecnológicos e IA' },
    'events': { t: 'Buscador de Eventos', s: 'Congresos y ferias del sector' },
    'tracking': { t: 'Seguimiento de Empresas', s: 'Monitoreo de vacantes' },
    'study': { t: 'Estudio Técnico', s: 'Simulador académico y solucionarios paso a paso' }
  };
  
  if (titles[panelId]) {
    document.getElementById('topbar-title').innerText = titles[panelId].t;
    document.getElementById('topbar-sub').innerText = titles[panelId].s;
  }
}

function navigateToPanel(panelId) {
  const navItem = document.querySelector(`.nav-item[data-panel="${panelId}"]`);
  switchPanel(panelId, navItem);
}

// ==========================================
// 3. LLAMADA REAL A LA API DE GEMINI
// ==========================================
async function callGemini(promptText, outputElementId, resultCardId) {
  const apiKey = getKey();
  const outputBox = document.getElementById(outputElementId);
  const resultCard = document.getElementById(resultCardId);
  
  if (!apiKey) {
    alert("Falta la API Key. Por favor, inicia sesión de nuevo.");
    return;
  }
  
  if (resultCard) resultCard.classList.remove('hidden');
  if (outputBox) outputBox.innerHTML = "<div class='loading-box'>✨ Emilia está pensando y procesando los datos...</div>";

  try {
    // URL actualizada a la API oficial v1 con el modelo estable
const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: promptText }] }]
      })
    });

    const data = await response.json();
    
    // Si la API devuelve un error estructurado, lo capturamos aquí
    if (data.error) {
      console.error("Error de la API de Google:", data.error);
      if (outputBox) outputBox.innerHTML = `Error de Google: ${data.error.message}`;
      return;
    }

    if (data.candidates && data.candidates[0].content.parts[0].text) {
      let responseText = data.candidates[0].content.parts[0].text;
      
      // Formateo para saltos de línea y negritas
      responseText = responseText.replace(/\n/g, '<br>').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      if (outputBox) outputBox.innerHTML = responseText;
    } else {
      if (outputBox) outputBox.innerHTML = "Error: No se recibió una respuesta válida de Gemini. Revisa el formato de tu clave.";
    }
  } catch (error) {
    console.error("Error en la petición:", error);
    if (outputBox) outputBox.innerHTML = "Hubo un error al conectar con Emilia. Inténtalo de nuevo.";
  }
}

// ==========================================
// 4. FUNCIONES DE EMILIA ACTICADAS
// ==========================================

function generatePost() {
  const idea = document.getElementById('post-idea').value;
  const tone = document.getElementById('post-tone').value;
  const length = document.getElementById('post-length').value;
  
  if (!idea) {
    alert("Por favor, escribe una idea o nota primero.");
    return;
  }
  
  const prompt = `Actúa como una mentora experta en ingeniería y comunicación llamada Emilia. Redacta un post para LinkedIn basado en esta idea: "${idea}". El tono debe ser ${tone} y la longitud debe ser de tamaño ${length}. No añadas introducciones innecesarias, ve directo al grano.`;
  
  callGemini(prompt, 'post-output', 'post-result');
}

function getTrends() {
  const focus = document.getElementById('trends-focus').value || "general";
  const period = document.getElementById('trends-period').value;
  
  const prompt = `Analiza las tendencias más recientes en tecnología, ingeniería avanzada e Inteligencia Artificial aplicadas, enfocándote especialmente en: "${focus}" para el periodo del ${period}. Genera un informe estructurado con viñetas claras.`;
  
  callGemini(prompt, 'trends-output', 'trends-result');
}

function getEvents() {
  const country = document.getElementById('events-country').value;
  const region = document.getElementById('events-region').value;
  const horizon = document.getElementById('events-horizon').value;
  const focus = document.getElementById('events-focus').value || "tecnología e ingeniería";
  
  const prompt = `Busca y genera un listado de eventos de ingeniería, congresos técnicos o ferias tecnológicas clave en ${country} (Región: ${region}) planeados para los próximos ${horizon}. Enfócate en la temática: ${focus}. Organízalo en formato de lista clara con fechas estimadas si es posible.`;
  
  callGemini(prompt, 'events-output', 'events-result');
}

function generateStudyMaterial() {
  const type = document.getElementById('study-type').value;
  const difficulty = document.getElementById('study-difficulty').value;
  
  const prompt = `Como Emilia, tu mentora académica de ingeniería avanzada, genera un recurso de estudio de tipo "${type}" con un nivel de dificultad "${difficulty}" enfocado en materias complejas de ingeniería (como cálculo numérico, estructuras de edificación o análisis de circuitos). Proporciona un desarrollo limpio, claro y detallado paso a paso.`;
  
  callGemini(prompt, 'study-output', 'study-result');
}

// ==========================================
// 5. GESTIÓN COHESIVA DE SEGUIMIENTO (EMPRESAS)
// ==========================================

let companies = [];

function initCompanies() {
  const stored = localStorage.getItem('emilia-companies');
  if (stored) {
    companies = JSON.parse(stored);
  } else {
    companies = ["Navantia", "General Dynamics", "Airbus"]; // Valores iniciales por defecto
  }
  renderCompanies();
}

function renderCompanies() {
  const listContainer = document.getElementById('company-list');
  if (!listContainer) return;
  
  listContainer.innerHTML = '';
  companies.forEach((company, index) => {
    const tag = document.createElement('span');
    tag.className = 'tag';
    tag.innerHTML = `${company} <i class="ti ti-x" onclick="removeCompany(${index})" style="cursor:pointer; margin-left:5px;"></i>`;
    listContainer.appendChild(tag);
  });
}

function addCompany() {
  const input = document.getElementById('new-company');
  if (!input) return;
  
  const name = input.value.trim();
  if (name && !companies.includes(name)) {
    companies.push(name);
    localStorage.setItem('emilia-companies', JSON.stringify(companies));
    renderCompanies();
    input.value = '';
  }
}

function removeCompany(index) {
  companies.splice(index, 1);
  localStorage.setItem('emilia-companies', JSON.stringify(companies));
  renderCompanies();
}

function getTracking() {
  const focus = document.getElementById('tracking-focus').value || "vacantes abiertas";
  if (companies.length === 0) {
    alert("Añade al menos una empresa al seguimiento.");
    return;
  }
  
  const prompt = `Genera un informe estratégico de seguimiento sobre el estado actual del mercado, ofertas de empleo, adjudicaciones públicas o contratos recientes para el siguiente listado de empresas: ${companies.join(', ')}. Concéntrate en este objetivo: "${focus}".`;
  
  callGemini(prompt, 'tracking-output', 'tracking-result');
}

// ==========================================
// 6. UTILIDADES
// ==========================================

function copyText(elementId) {
  const element = document.getElementById(elementId);
  if (!element) return;
  const text = element.innerText || element.value;
  navigator.clipboard.writeText(text).then(() => alert('¡Texto copiado al portapapeles!'));
}
