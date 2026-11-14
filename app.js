const mic = document.querySelector("#mic");
const statusEl = document.querySelector("#status");
const conversation = document.querySelector("#conversation");
const language = document.querySelector("#language");
const voiceSelect = document.querySelector("#voice");
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
let recognition = null;
let voices = [];

function addBubble(text, who) {
  const p = document.createElement("p");
  p.className = `bubble ${who}`;
  p.textContent = text;
  conversation.appendChild(p);
  conversation.scrollTop = conversation.scrollHeight;
}
function loadVoices() {
  if (!("speechSynthesis" in window)) return;
  voices = speechSynthesis.getVoices();
  voiceSelect.innerHTML = '<option value="">Voix féminine disponible (automatique)</option>';
  voices.forEach((v, i) => {
    const opt = document.createElement("option");
    opt.value = String(i);
    opt.textContent = `${v.name} — ${v.lang}`;
    voiceSelect.appendChild(opt);
  });
}
if ("speechSynthesis" in window) {
  loadVoices();
  speechSynthesis.onvoiceschanged = loadVoices;
}
function speak(text) {
  if (!("speechSynthesis" in window)) return;
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = language.value;
  const chosen = voiceSelect.value === "" ? voices.find(v => /female|woman|zira|samantha|google français/i.test(v.name)) : voices[Number(voiceSelect.value)];
  if (chosen) utterance.voice = chosen;
  speechSynthesis.cancel();
  speechSynthesis.speak(utterance);
}
function respond(text) {
  const t = text.toLowerCase();
  let answer;
  if (t.includes("bonjour sophia") || t.includes("salut sophia") || t.includes("bonjou sophia")) {
    answer = "Bonjour ! Je suis là. Que puis-je faire pour toi ?";
  } else if (t.includes("comment ça va") || t.includes("kijan ou ye")) {
    answer = "Je fonctionne correctement, merci ! Et toi, comment puis-je t'aider ?";
  } else if (t.includes("heure")) {
    answer = "Je peux t'aider à organiser ton temps. Consulte l'heure affichée sur ton téléphone.";
  } else if (t.includes("qui es-tu") || t.includes("qui est tu")) {
    answer = "Je suis Sophia, ton assistante personnelle en construction.";
  } else if (t.includes("aide")) {
    answer = "Tu peux me dire bonjour, demander qui je suis, ou me poser une question simple. Mes fonctions seront enrichies progressivement.";
  } else {
    answer = "J'ai bien entendu : " + text + ". Pour répondre à toutes tes questions, nous ajouterons ensuite un service d'intelligence artificielle.";
  }
  addBubble(answer, "sophia");
  speak(answer);
}
if (!SpeechRecognition) {
  statusEl.textContent = "Reconnaissance vocale non disponible dans ce navigateur";
  mic.disabled = true;
  mic.title = "Essaie Chrome récent et vérifie la connexion.";
} else {
  recognition = new SpeechRecognition();
  recognition.continuous = false;
  recognition.interimResults = false;
  recognition.onstart = () => statusEl.textContent = "J'écoute…";
  recognition.onerror = e => statusEl.textContent = "Erreur micro : " + e.error;
  recognition.onend = () => { if (!statusEl.textContent.startsWith("Erreur")) statusEl.textContent = "Prête à discuter"; };
  recognition.onresult = e => {
    const heard = e.results[0][0].transcript;
    addBubble(heard, "user");
    if (/bonjour sophia|bonjou sophia|salut sophia/i.test(heard)) {
      respond(heard);
    } else {
      respond(heard);
    }
  };
  mic.addEventListener("click", () => {
    recognition.lang = language.value;
    try { recognition.start(); } catch (_) { statusEl.textContent = "Attends un instant puis réessaie."; }
  });
}
if ("serviceWorker" in navigator && location.protocol.startsWith("http")) {
  window.addEventListener("load", () => navigator.serviceWorker.register("./sw.js").catch(()=>{}));
}