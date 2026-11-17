
// ======================================
// SOPHIA — ASSISTANTE INTELLIGENTE
// Cloudflare Workers AI + Google Gemma
// ======================================

const mic = document.querySelector("#mic");
const statusEl = document.querySelector("#status");
const conversation = document.querySelector("#conversation");
const language = document.querySelector("#language");
const voiceSelect = document.querySelector("#voice");

const API_URL =
  "https://sophia-ai.jnyvenermacenat.workers.dev/api/chat";

const HISTORY_KEY = "sophia_history";

const SpeechRecognition =
  window.SpeechRecognition ||
  window.webkitSpeechRecognition;

let recognition = null;
let voices = [];
let waiting = false;

// ======================================
// MÉMOIRE DE SOPHIA
// ======================================

function loadHistory() {
  try {
    const data = JSON.parse(
      localStorage.getItem(HISTORY_KEY) || "[]"
    );

    if (!Array.isArray(data)) return [];

    return data
      .filter(m =>
        ["user", "assistant"].includes(m.role) &&
        typeof m.content === "string"
      )
      .slice(-40);

  } catch {
    return [];
  }
}

let history = loadHistory();

function saveHistory() {
  history = history.slice(-40);

  try {
    localStorage.setItem(
      HISTORY_KEY,
      JSON.stringify(history)
    );
  } catch (error) {
    console.warn("Mémoire indisponible", error);
  }
}

function remember(role, content) {
  history.push({ role, content });
  saveHistory();
}

// ======================================
// AFFICHAGE DES MESSAGES
// ======================================

function addBubble(text, who) {
  const p = document.createElement("p");

  p.className = `bubble ${who}`;
  p.textContent = text;

  conversation.appendChild(p);

  conversation.scrollTop =
    conversation.scrollHeight;
}

// Restaurer les anciennes conversations

history.forEach(message => {
  addBubble(
    message.content,
    message.role === "user" ? "user" : "sophia"
  );
});

// ======================================
// VOIX DE SOPHIA
// ======================================

function loadVoices() {
  if (!("speechSynthesis" in window)) return;

  voices = speechSynthesis.getVoices();

  voiceSelect.innerHTML =
    '<option value="">Voix automatique</option>';

  voices.forEach((voice, index) => {
    const option = document.createElement("option");

    option.value = String(index);
    option.textContent =
      `${voice.name} — ${voice.lang}`;

    voiceSelect.appendChild(option);
  });
}

if ("speechSynthesis" in window) {
  loadVoices();

  speechSynthesis.onvoiceschanged =
    loadVoices;
}

function speak(text) {
  if (!("speechSynthesis" in window)) return;

  const utterance =
    new SpeechSynthesisUtterance(text);

  utterance.lang =
    language.value || "fr-FR";

  const selected =
    voiceSelect.value === ""
      ? voices.find(v =>
          /female|woman|zira|samantha|google français/i.test(v.name)
        )
      : voices[Number(voiceSelect.value)];

  if (selected) {
    utterance.voice = selected;
  }

  speechSynthesis.cancel();
  speechSynthesis.speak(utterance);
}

// ======================================
// INTELLIGENCE ARTIFICIELLE
// ======================================

async function respond(text) {
  const question = String(text || "").trim();

  if (!question || waiting) return;

  remember("user", question);
  addBubble(question, "user");

  waiting = true;

  if (statusEl) {
    statusEl.textContent = "SOPHIA réfléchit…";
  }

  if (mic) mic.disabled = true;

  try {
    const response = await fetch(API_URL, {
      method: "POST",

      headers: {
        "Content-Type": "application/json"
      },

      body: JSON.stringify({
        messages: history.slice(-12)
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.error || "Erreur de connexion au serveur."
      );
    }

    const answer = String(data.answer || "").trim();

    if (!answer) {
      throw new Error("Réponse vide de l'intelligence artificielle.");
    }

    remember("assistant", answer);

    addBubble(answer, "sophia");

    speak(answer);

    if (statusEl) {
      statusEl.textContent = "Prête à discuter";
    }

  } catch (error) {

    addBubble(
      "Je rencontre un problème de connexion : " +
      error.message,
      "sophia"
    );

    if (statusEl) {
      statusEl.textContent = "Connexion à vérifier";
    }

  } finally {

    waiting = false;

    if (mic && SpeechRecognition) {
      mic.disabled = false;
    }
  }
}

// ======================================
// RECONNAISSANCE VOCALE
// ======================================

if (!SpeechRecognition) {

  statusEl.textContent =
    "Reconnaissance vocale indisponible dans ce navigateur.";

  mic.disabled = true;

} else {

  recognition = new SpeechRecognition();

  recognition.continuous = false;
  recognition.interimResults = false;

  recognition.onstart = () => {
    statusEl.textContent = "J'écoute…";
  };

  recognition.onerror = event => {
    statusEl.textContent =
      "Erreur micro : " + event.error;
  };

  recognition.onend = () => {
    if (
      !statusEl.textContent.startsWith("Erreur")
    ) {
      statusEl.textContent = "Prête à discuter";
    }
  };

  recognition.onresult = event => {
    const heard =
      event.results[0][0].transcript;

    respond(heard);
  };

  mic.addEventListener("click", () => {

    recognition.lang =
      language.value || "fr-FR";

    try {
      recognition.start();
    } catch {
      statusEl.textContent =
        "Attends un instant puis réessaie.";
    }
  });
}

// ======================================
// EFFACER LA MÉMOIRE
// Console : clearSophiaMemory()
// ======================================

function clearSophiaMemory() {
  history = [];

  localStorage.removeItem(HISTORY_KEY);

  conversation.innerHTML = "";

  addBubble(
    "Ma mémoire locale a été effacée.",
    "sophia"
  );
}

window.clearSophiaMemory = clearSophiaMemory;

// ======================================
// SERVICE WORKER
// ======================================

if (
  "serviceWorker" in navigator &&
  location.protocol.startsWith("http")
) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("./sw.js")
      .catch(() => {});
  });
}

/* SOPHIA - MEMOIRE PERSONNELLE */

const sophiaMemory = JSON.parse(
  localStorage.getItem("sophia_personal_memory") || "{}"
);

sophiaMemory.name = "Yvener";

function saveSophiaMemory(key, value) {
  sophiaMemory[key] = value;
  localStorage.setItem(
    "sophia_personal_memory",
    JSON.stringify(sophiaMemory)
  );
}

function getSophiaMemory() {
  return sophiaMemory;
}

function rememberUser(message) {
  const text = message.trim();

  const nameMatch = text.match(
    /(?:mon prénom est|je m'appelle|appelle-moi)\s+(.+)/i
  );

  if (nameMatch) {
    saveSophiaMemory("name", nameMatch[1].trim());
  }

  const preferenceMatch = text.match(
    /(?:je préfère|j'aime|je n'aime pas)\s+(.+)/i
  );

  if (preferenceMatch) {
    const preferences = sophiaMemory.preferences || [];
    preferences.push(preferenceMatch[0]);
    saveSophiaMemory("preferences", preferences);
  }
}

function clearSophiaPersonalMemory() {
  localStorage.removeItem("sophia_personal_memory");
  location.reload();
}

/* SOPHIA - MEMOIRE PERSONNELLE */

const sophiaMemory = JSON.parse(
  localStorage.getItem("sophia_personal_memory") || "{}"
);

sophiaMemory.name = "Yvener";

function saveSophiaMemory(key, value) {
  sophiaMemory[key] = value;
  localStorage.setItem(
    "sophia_personal_memory",
    JSON.stringify(sophiaMemory)
  );
}

function getSophiaMemory() {
  return sophiaMemory;
}

function rememberUser(message) {
  const text = message.trim();

  const nameMatch = text.match(
    /(?:mon prénom est|je m'appelle|appelle-moi)\s+(.+)/i
  );

  if (nameMatch) {
    saveSophiaMemory("name", nameMatch[1].trim());
  }

  const preferenceMatch = text.match(
    /(?:je préfère|j'aime|je n'aime pas)\s+(.+)/i
  );

  if (preferenceMatch) {
    const preferences = sophiaMemory.preferences || [];
    preferences.push(preferenceMatch[0]);
    saveSophiaMemory("preferences", preferences);
  }
}

function clearSophiaPersonalMemory() {
  localStorage.removeItem("sophia_personal_memory");
  location.reload();
}

/* SOPHIA - MEMOIRE PERSONNELLE */

const sophiaMemory = JSON.parse(
  localStorage.getItem("sophia_personal_memory") || "{}"
);

sophiaMemory.name = "Yvener";

function saveSophiaMemory(key, value) {
  sophiaMemory[key] = value;
  localStorage.setItem(
    "sophia_personal_memory",
    JSON.stringify(sophiaMemory)
  );
}

function getSophiaMemory() {
  return sophiaMemory;
}

function rememberUser(message) {
  const text = message.trim();

  const nameMatch = text.match(
    /(?:mon prénom est|je m'appelle|appelle-moi)\s+(.+)/i
  );

  if (nameMatch) {
    saveSophiaMemory("name", nameMatch[1].trim());
  }

  const preferenceMatch = text.match(
    /(?:je préfère|j'aime|je n'aime pas)\s+(.+)/i
  );

  if (preferenceMatch) {
    const preferences = sophiaMemory.preferences || [];
    preferences.push(preferenceMatch[0]);
    saveSophiaMemory("preferences", preferences);
  }
}

function clearSophiaPersonalMemory() {
  localStorage.removeItem("sophia_personal_memory");
  location.reload();
}
/* SOPHIA - MEMOIRE PERSONNELLE */

const sophiaMemory = JSON.parse(
  localStorage.getItem("sophia_personal_memory") || "{}"
);

sophiaMemory.name = "Yvener";

function saveSophiaMemory(key, value) {
  sophiaMemory[key] = value;
  localStorage.setItem(
    "sophia_personal_memory",
    JSON.stringify(sophiaMemory)
  );
}

function getSophiaMemory() {
  return sophiaMemory;
}

function rememberUser(message) {
  const text = message.trim();

  const nameMatch = text.match(
    /(?:mon prénom est|je m'appelle|appelle-moi)\s+(.+)/i
  );

  if (nameMatch) {
    saveSophiaMemory("name", nameMatch[1].trim());
  }

  const preferenceMatch = text.match(
    /(?:je préfère|j'aime|je n'aime pas)\s+(.+)/i
  );

  if (preferenceMatch) {
    const preferences = sophiaMemory.preferences || [];
    preferences.push(preferenceMatch[0]);
    saveSophiaMemory("preferences", preferences);
  }
}

function clearSophiaPersonalMemory() {
  localStorage.removeItem("sophia_personal_memory");
  location.reload();
}

