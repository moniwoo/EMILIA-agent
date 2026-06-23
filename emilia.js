// ==========================================
// 1. CONTROL DE ACCESO, API KEY Y BIENVENIDA
// ==========================================

// Lista de mensajes dinámicos: todos se introducen como "Soy Emilia"
// Tus saludos personalizados con mucha personalidad
const saludosMoni = [
  "¡Hola, Moni!",
  "Hellou Hellouu Moni 👋",
  "¡Qué alegría verte de nuevo, Moni!",
  "¡A darle caña, Moni! 🚀",
  "¡Buenas, pichona! ¿Qué se cuece hoy?",
  "¿Qué tal Moni?",
  "¿Qué hubo puees Moni?",
  "Moni, tus paneles están listos ✨"
];

function mostrarSaludoAleatorio() {
  const contenedorSaludo = document.getElementById("welcome-greeting");
  if (contenedorSaludo) {
    contenedorSaludo.innerHTML = ""; // Limpiar glitch visual previo
    const indiceAleatorio = Math.floor(Math.random() * saludosMoni.length);
    contenedorSaludo.innerHTML = saludosMoni[indiceAleatorio];
  }
}
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
  const panels = document.querySelectorAll('.panel');
  
  // 1. Manejo exclusivo de la pantalla de bienvenida
  if (panelId === 'welcome' || panelId === 'inicio') {
    if (welcome) welcome.style.display = 'block';
  } else {
    if (welcome) welcome.style.display = 'none';
  }
  
  // 2. Ocultar todos los paneles y mostrar el seleccionado
  panels.forEach(p => p.classList.add('hidden'));
  const targetPanel = document.getElementById(`panel-${panelId}`);
  if (targetPanel) {
    targetPanel.classList.remove('hidden');
  }
  
  // 3. Actualizar estado de navegación
  const items = document.querySelectorAll('.nav-item');
  items.forEach(item => item.classList.remove('active'));
  if (element) element.classList.add('active');
  
  // 4. Actualizar textos de la barra superior
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
// 3. LLAMADA A GEMINI
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
  if (outputBox) outputBox.innerHTML = "<div class='loading-box'>✨ Emilia está procesando los datos en el panel...</div>";

  // Volvemos a tu configuración favorita: 3.5 como motor principal
  let targetModel = "gemini-3.5-flash";
  const isTechnicalStudy = outputElementId.toLowerCase().includes("tecnico") || outputElementId.toLowerCase().includes("technical") || document.querySelector('.active')?.innerText.toLowerCase().includes("técnico") || document.getElementById("estudio-tecnico")?.classList.contains("active");

  let enhancedPrompt = promptText;

  if (isTechnicalStudy) {
    enhancedPrompt += "\n\n[INSTRUCCIÓN ACADÉMICA: Desarrolla el problema paso a paso con la máxima rigurosidad. Utiliza formato LaTeX clásico para las fórmulas, ecuaciones, determinantes, matrices e integrales (usa '$' para fórmulas en línea y '$$' para bloques de ecuaciones independientes). Estructura el documento usando títulos claros con '## '].";
  } else {
    enhancedPrompt += "\n\n[INSTRUCCIÓN DE DISEÑO: Organiza la respuesta usando títulos con '## ' para las secciones principales. Usa viñetas claras con '- '. Si vas a comparar datos, utiliza OBLIGATORIAMENTE tablas en formato Markdown clásico con celdas '|'].";
  }

  try {
    let url = `https://generativelanguage.googleapis.com/v1/models/${targetModel}:generateContent?key=${apiKey}`;

    let response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ parts: [{ text: enhancedPrompt }] }] })
    });

    let data = await response.json();

    // TU ESCUDO ORIGINAL: Si el 3.5 se satura (alta demanda), salta de inmediato al 2.5-flash
    if (data.error && (data.error.code === 429 || data.error.message.includes("high demand") || data.error.code === 404)) {
      console.warn("⚠️ Modelo 3.5 ocupado o no disponible. Activando Plan B con Gemini 2.5-Flash...");
      if (outputBox) outputBox.innerHTML = "<div class='loading-box'>⏳ Servidor principal ocupado. Desviando al motor de reserva avanzado...</div>";
      
      targetModel = "gemini-2.5-flash";
      url = `https://generativelanguage.googleapis.com/v1/models/${targetModel}:generateContent?key=${apiKey}`;
      
      response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: [{ parts: [{ text: enhancedPrompt }] }] })
      });
      data = await response.json();
    }

    if (data.error) {
      console.error("Error devuelto por Google:", data.error);
      if (outputBox) outputBox.innerHTML = "Error de Google: " + data.error.message;
      return;
    }

    if (data.candidates && data.candidates[0].content.parts[0].text) {
      let rawText = data.candidates[0].content.parts[0].text;
      rawText = rawText.replace(/```[a-z]*/g, '');

      let htmlOutput = "";

      // MÓDULO ESTUDIO TÉCNICO (FOLIO ACADÉMICO PARA PDF)
      if (isTechnicalStudy) {
        htmlOutput += `
          <div class="pdf-control-panel no-print">
            <button onclick="exportTechnicalToPDF()" class="btn-pdf">
              📄 Exportar Solucionario a PDF
            </button>
          </div>
          <div id="pdf-printable-area" class="academic-sheet">
        `;

        const lines = rawText.split('\n');
        lines.forEach(line => {
          let trimmed = line.trim();
          if (!trimmed) return;

          if (trimmed.startsWith('## ')) {
            htmlOutput += `<h2 class="academic-h2">${trimmed.replace('## ', '')}</h2>`;
          } else if (trimmed.startsWith('### ')) {
            htmlOutput += `<h3 class="academic-h3">${trimmed.replace('### ', '')}</h3>`;
          } else if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
            htmlOutput += `<p class="academic-p">• ${trimmed.substring(2)}</p>`;
          } else {
            htmlOutput += `<p class="academic-p">${trimmed}</p>`;
          }
        });

        htmlOutput += `</div>`;
      } 
      // MÓDULO GENERAL (TARJETAS VISUALES Y TABLAS)
      else {
        const lines = rawText.split('\n');
        let inBlock = false;
        let inTable = false;

        lines.forEach(line => {
          let trimmed = line.trim();
          if (!trimmed) return;

          if (trimmed.startsWith('|')) {
            if (trimmed.match(/^\|[ \t]*:?-+:?[ \t]*\|/)) return;
            let cells = trimmed.split('|').map(c => c.trim()).filter((c, i, arr) => i > 0 && i < arr.length - 1);
            if (!inTable) {
              inTable = true;
              htmlOutput += `<div class="table-container"><table class="visual-table"><thead><tr>`;
              cells.forEach(cell => { htmlOutput += `<th>${cell.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')}</th>`; });
              htmlOutput += `</tr></thead><tbody>`;
            } else {
              htmlOutput += `<tr>`;
              cells.forEach(cell => { htmlOutput += `<td>${cell.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')}</td>`; });
              htmlOutput += `</tr>`;
            }
            return;
          } else {
            if (inTable) { htmlOutput += `</tbody></table></div>`; inTable = false; }
          }

          if (trimmed.startsWith('## ')) {
            if (inBlock) htmlOutput += `</div></div>`;
            htmlOutput += `<div class="visual-section-card"><div class="visual-card-header"><span class="visual-card-dot"></span><h2 class="visual-h2">${trimmed.replace('## ', '')}</h2></div><div class="visual-card-body">`;
            inBlock = true;
          } else if (trimmed.startsWith('### ')) {
            htmlOutput += `<h3 class="visual-h3">${trimmed.replace('### ', '')}</h3>`;
          } else if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
            htmlOutput += `<div class="visual-bullet"><span class="visual-spark">✦</span><span>${trimmed.replace(/^[-*]\s+/, '').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')}</span></div>`;
          } else {
            htmlOutput += `<p class="visual-p">${trimmed.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')}</p>`;
          }
        });
        if (inTable) htmlOutput += `</tbody></table></div>`;
        if (inBlock) htmlOutput += `</div></div>`;
      }

      if (outputBox) outputBox.innerHTML = htmlOutput;

      // Renderizado matemático con MathJax
      if (window.MathJax && window.MathJax.typesetPromise) {
        window.MathJax.typesetPromise([outputBox]).catch((err) => console.error("Error en MathJax:", err));
      }

    } else {
      if (outputBox) outputBox.innerHTML = "Error: Respuesta inválida de Emilia.";
    }
  } catch (error) {
    console.error("Fallo de red crítico:", error);
    if (outputBox) outputBox.innerHTML = "Hubo un error de red al conectar con Emilia.";
  }
}

function exportTechnicalToPDF() {
  const element = document.getElementById('pdf-printable-area');
  if (!element) return;
  
  const opt = {
    margin:       [15, 15, 15, 15],
    filename:     'Solucionario_Academico_Emilia.pdf',
    image:        { type: 'jpeg', quality: 0.98 },
    html2canvas:  { scale: 2, useCORS: true, logging: false },
    jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' },
    pagebreak:    { mode: ['avoid-all', 'css', 'legacy'] }
  };
  
  html2pdf().set(opt).from(element).save();
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
  const postIdeaInput = document.getElementById('post-idea');
  
  if (postIdeaInput) {
    postIdeaInput.value = `Basándote en estas tendencias de mercado:\n\n${trendsContent}\n\nRedacta un post estratégico analizando el impacto de esto en la ingeniería.`;
  }
  
  // Navegamos al panel después de haber cargado el texto
  navigateToPanel('post');
}

function trackingToPost() {
  const trackingContent = document.getElementById('tracking-output').innerText;
  const postIdeaInput = document.getElementById('post-idea');
  
  if (postIdeaInput) {
    postIdeaInput.value = `A raíz de este análisis estratégico de empresas:\n\n${trackingContent}\n\nEscribe una reflexión profesional para LinkedIn sobre los perfiles más demandados y las oportunidades detectadas.`;
  }
  
  // Navegamos al panel después de haber cargado el texto
  navigateToPanel('post');
}
