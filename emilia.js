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
// 3. LLAMADA DE RED UNIFICADA (MÁXIMA ESTABILIDAD)
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
    // URL e Identificador oficial de producción para evitar errores 404
    const url = "https://generativelanguage.googleapis.com/v1/models/gemini-3.5-flash:generateContent?key=" + apiKey;

    const response = await fetch(url, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json" 
      },
      body: JSON.stringify({
        contents: [{ 
          parts: [{ text: promptText }] 
        }]
      })
    });

    const data = await response.json();
    
    if (data.error) {
      console.error("Error devuelto por Google:", data.error);
      if (outputBox) outputBox.innerHTML = "Error de Google: " + data.error.message;
      return;
    }

    if (data.candidates && data.candidates[0].content.parts[0].text) {
      let responseText = data.candidates[0].content.parts[0].text;
      
      // Formateo visual para saltos de línea y negritas en la interfaz HTML
      responseText = responseText.replace(/\n/g, '<br>').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      if (outputBox) outputBox.innerHTML = responseText;
    } else {
      if (outputBox) outputBox.innerHTML = "Error: No se recibió una respuesta válida de Emilia.";
    }
  } catch (error) {
    console.error("Fallo crítico en la conexión:", error);
    if (outputBox) outputBox.innerHTML = "Hubo un error de red al conectar con Emilia. Revisa la consola.";
  }
}

// ==========================================
// 4. FUNCIONES INTERNAS DE PANELES
// ==========================================

function generatePost() {
  const idea = document.getElementById('post-idea').value;
  const tone = document.getElementById('post-tone').value;
  const length = document.getElementById('post-length').value;
  if (!idea) { alert("Escribe una idea primero."); return; }
  
  const prompt = `Actúa como una mentora experta llamada Emilia. Redacta un post profesional para LinkedIn basado en esta idea: "${idea}". Tono del escrito: ${tone}. Longitud aproximada: ${length}. Mantenlo directo e interesante.`;
  callGemini(prompt, 'post-output', 'post-result');
}

function getTrends() {
  const focus = document.getElementById('trends-focus').value || "general";
  const period = document.getElementById('trends-period').value;
  
  const prompt = `Analiza las tendencias más recientes en ingeniería, tecnologías emergentes e IA, haciendo un enfoque especial en: "${focus}" para el periodo del último/a ${period}. Estructura la respuesta con puntos claros.`;
  callGemini(prompt, 'trends-output', 'trends-result');
}

function getEvents() {
  const country = document.getElementById('events-country').value;
  const region = document.getElementById('events-region').value;
  const horizon = document.getElementById('events-horizon').value;
  const focus = document.getElementById('events-focus').value || "tecnología e ingeniería";
  
  const prompt = `Genera un listado de eventos técnicos, congresos, ferias sectoriales o conferencias en ${country} (Región/Provincia: ${region}) previstos para los próximos/as ${horizon} sobre el sector: ${focus}.`;
  callGemini(prompt, 'events-output', 'events-result');
}

function generateStudyMaterial() {
  const type = document.getElementById('study-type').value;
  const difficulty = document.getElementById('study-difficulty').value;
  
  const prompt = `Genera un ejercicio académico detallado de nivel universitario avanzado para ingeniería. Tipo de ejercicio: "${type}" con una dificultad: "${difficulty}". Incluye todo el desarrollo matemático o conceptual explicado paso a paso de forma impecable y didáctica.`;
  callGemini(prompt, 'study-output', 'study-result');
}

// ==========================================
// 5. SEGUIMIENTO DE EMPRESAS
// ==========================================

let companies = [];

function initCompanies() {
  const stored = localStorage.getItem('emilia-companies');
  if (stored) {
    companies = JSON.parse(stored);
  } else {
    companies = ["Navantia", "Airbus", "Akkodis"];
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
  const focus = document.getElementById('tracking-focus').value || "vacantes generales";
  if (companies.length === 0) { alert("Añade al menos una empresa al listado para realizar el seguimiento."); return; }
  
  const prompt = `Realiza un informe estratégico de monitorización de mercado enfocado en las siguientes empresas: ${companies.join(', ')}. El objetivo prioritario de este informe es: "${focus}".`;
  callGemini(prompt, 'tracking-output', 'tracking-result');
}

// ==========================================
// 6. FUNCIONES DE CONVERSIÓN Y COPIADO
// ==========================================

function trendToPost() {
  const trendsContent = document.getElementById('trends-output').innerText;
  navigateToPanel('post');
  document.getElementById('post-idea').value = `Basándote en estas tendencias de mercado:\n\n${trendsContent}\n\nRedacta un post estratégico analizando el impacto de esto en la ingeniería.`;
}

function trackingToPost() {
  const trackingContent = document.getElementById('tracking-output').innerText;
  navigateToPanel('post');
  document.getElementById('post-idea').value = `A raíz de este análisis estratégico de empresas:\n\n${trackingContent}\n\nEscribe una reflexión profesional para LinkedIn sobre los perfiles más demandados y las oportunidades detectadas.`;
}

function copyText(elementId) {
  const element = document.getElementById(elementId);
  if (!element) return;
  const text = element.innerText || element.value;
  navigator.clipboard.writeText(text).then(() => alert('¡Contenido copiado al portapapeles con éxito!'));
}
