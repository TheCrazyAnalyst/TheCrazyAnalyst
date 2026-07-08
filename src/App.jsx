import React, { useState, useCallback, useRef, useEffect, useMemo } from "react";
import {
  Loader2,
  RotateCcw,
  AlertCircle,
  Sparkles,
  Download,
  ChevronDown,
  ArrowRight,
  Settings,
  X,
  Check,
  ExternalLink,
  KeyRound,
} from "lucide-react";

/* Inline base64 app logo — golden "2SF" mark, transparent background */
const LOGO_2SF = "data:image/png;base64,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";

/* ---------- Minimal in-browser ZIP reader (no external library) ---------- */
/* Unchanged from the previous version. */

async function inflateRaw(bytes) {
  if (typeof DecompressionStream === "undefined") throw new Error("unsupported-browser");
  const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream("deflate-raw"));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

async function readLargestTxtFromZip(arrayBuffer) {
  const view = new DataView(arrayBuffer);
  const bytes = new Uint8Array(arrayBuffer);
  const len = bytes.length;

  let eocd = -1;
  for (let i = len - 22; i >= Math.max(0, len - 65557); i--) {
    if (view.getUint32(i, true) === 0x06054b50) { eocd = i; break; }
  }
  if (eocd === -1) throw new Error("not-a-zip");

  const total = view.getUint16(eocd + 10, true);
  let p = view.getUint32(eocd + 16, true);
  const candidates = [];

  for (let i = 0; i < total; i++) {
    if (view.getUint32(p, true) !== 0x02014b50) break;
    const method = view.getUint16(p + 10, true);
    const compSize = view.getUint32(p + 20, true);
    const rawSize = view.getUint32(p + 24, true);
    const nameLen = view.getUint16(p + 28, true);
    const extraLen = view.getUint16(p + 30, true);
    const commentLen = view.getUint16(p + 32, true);
    const localOffset = view.getUint32(p + 42, true);
    const name = new TextDecoder().decode(bytes.slice(p + 46, p + 46 + nameLen));
    if (/\.txt$/i.test(name) && rawSize > 0) {
      candidates.push({ name, method, compSize, rawSize, localOffset });
    }
    p += 46 + nameLen + extraLen + commentLen;
  }
  if (candidates.length === 0) throw new Error("no-txt-in-zip");
  candidates.sort((a, b) => b.rawSize - a.rawSize);
  const entry = candidates[0];

  const lh = entry.localOffset;
  const nameLen = view.getUint16(lh + 26, true);
  const extraLen = view.getUint16(lh + 28, true);
  const dataStart = lh + 30 + nameLen + extraLen;
  const raw = bytes.slice(dataStart, dataStart + entry.compSize);
  const inflated = entry.method === 0 ? raw : await inflateRaw(raw);
  return new TextDecoder("utf-8").decode(inflated);
}

/* ---------------------------- Report prompt ----------------------------- */
/* STYLES and SCHEMA are the exact same prompts as before: they are what
   gives the report its quality, tone and structure, so they are untouched. */

const STYLES = {
  fun: {
    label: "Mordant",
    desc: "Roast affectueux, direct, sans filtre",
    system:
      "Tu es 2 Sans Filtres, une IA qui lit des conversations de groupe ou privées et livre un rapport-roast complet, à la première personne, dans le style d'une longue chronique éditoriale mordante façon 'la Yelp review de votre relation' : plusieurs parties distinctes, chacune avec son propre titre accrocheur et un vrai développement (plusieurs phrases, pas une seule ligne). Ton ton : mordant, très direct, drôle, familier, tu tutoies et interpelles les gens par leur prénom, tu enchaînes les formules qui marquent. Tu t'appuies systématiquement sur des détails précis et des citations exactes tirées de la conversation pour appuyer chaque observation — plus tu cites, plus c'est crédible et drôle. Tu n'es jamais méchant gratuitement : sous le roast, il y a une vraie observation psychologique, parfois touchante. Reste en français, style oral, rythmé, plein de formules choc, avec quelques emojis bien placés (jamais dans les citations exactes). Chaque champ texte doit être développé (plusieurs phrases riches), car ce rapport doit se lire comme plusieurs pages, pas comme un résumé.",
  },
  neutral: {
    label: "Introspectif",
    desc: "Plus posé, plus profond, moins de vanne",
    system:
      "Tu es 2 Sans Filtres, une IA qui lit des conversations de groupe ou privées et livre un rapport complet et honnête, à la première personne, dans le style d'une longue chronique éditoriale posée mais incisive : plusieurs parties distinctes, chacune avec son propre titre et un vrai développement (plusieurs phrases, pas une seule ligne). Ton ton : posé, observateur, sincère, parfois émouvant, tu tutoies et interpelles les gens par leur prénom. Tu t'appuies systématiquement sur des détails précis et des citations exactes tirées de la conversation. Reste en français, avec quelques emojis discrets et bien choisis (jamais dans les citations exactes). Chaque champ texte doit être développé (plusieurs phrases riches), car ce rapport doit se lire comme plusieurs pages, pas comme un résumé.",
  },
};

const SCHEMA = `Réponds UNIQUEMENT avec un objet JSON valide, sans texte avant/après, sans markdown. Forme exacte :
{
  "ouverture": "un paragraphe de 3-5 phrases, façon 'Bon. J'ai lu. J'ai TOUT lu.' qui annonce le nombre approximatif de messages lus, plante le décor, pose le ton avec humour et une pointe de suspense sur ce qui va suivre, à la première personne de 2 Sans Filtres",
  "verdict": "une phrase choc de moins de 8 mots qui résume la relation ou le groupe, façon titre de couverture de magazine",
  "notes": [{"categorie": "nom court d'une catégorie notée, ex: Communication, Ambiance, Ponctualité, Fidélité au groupe, Investissement émotionnel", "etoiles": nombre entier de 1 à 5, "commentaire": "2-3 phrases développées qui justifient la note avec un détail précis et si possible une allusion à un échange réel"}],
  "decodeur_titre": "le titre de la section lexique (façon 'Le décodeur : ...'), à INVENTER entièrement à partir du vocabulaire, des surnoms ou du ton réels de CETTE conversation précise — jamais la même formule d'une conversation à l'autre, jamais générique",
  "decodeur_intro": "1-2 phrases qui introduisent cette section lexique avec humour, écrites spécifiquement pour cette conversation (peuvent citer un mot ou un ton caractéristique du groupe), jamais une formule toute faite recyclable telle quelle pour n'importe quelle autre conversation",
  "decodeur": [{"terme": "mot, surnom ou expression récurrente trouvée EXACTEMENT dans la conversation", "definition": "traduction ironique et développée (1-2 phrases), avec une pointe d'humour ou d'observation"}],
  "structure": "un texte de 4-6 phrases sur la dynamique réelle du groupe ou de la relation : qui mène, qui répond à qui, rapports de force, rituels, habitudes récurrentes, avec des exemples concrets tirés de la conversation",
  "paradoxe": {"titre": "un titre de section accrocheur façon 'Le paradoxe que personne d'autre ne vous dira', spécifique à cette conversation", "texte": "3-5 phrases qui pointent une vraie contradiction ou un contraste frappant dans le comportement du groupe ou de la relation (ex : tendresse vs vannes, sérieux vs délire, generosité vs mauvaise foi), illustré par un exemple concret"},
  "portraits": [{"nom": "prénom exact trouvé dans la conversation", "roast": "3-4 phrases développées qui interpellent cette personne directement (tutoiement), basées sur plusieurs comportements observés, avec au moins une touche d'humour et une touche plus sincère"}],
  "extraits": [{"citation": "une courte citation EXACTE tirée du texte fourni (moins de 20 mots, reproduite mot pour mot)", "auteur": "prénom exact de la personne qui a écrit ce message", "commentaire": "1-2 phrases de commentaire de 2 Sans Filtres sur cet extrait, avec humour ou finesse"}],
  "moment_cle": {"titre": "un titre de section façon 'La conversation que vous avez vraiment eue', qui évoque un moment marquant identifiable dans les échanges (une bascule de ton, une confidence, une dispute, une réconciliation)", "texte": "4-6 phrases qui racontent ce moment précis, pourquoi il compte, ce qu'il révèle sur la relation ou le groupe, sans being trop intrusif sur des détails très privés — reste évocateur plutôt que voyeuriste si le sujet est sensible", "citation": "une citation EXACTE et courte (moins de 20 mots) tirée de ce moment, ou vide si aucune ne convient", "auteur": "prénom exact de l'auteur de cette citation, ou vide"},
  "drapeaux_rouges": [{"nom": "prénom exact", "texte": "2-3 phrases qui pointent un vrai travers observé dans la conversation, avec bienveillance mais sans filtre, si possible avec un exemple précis"}],
  "drapeaux_verts": "un texte de 4-6 phrases sur ce qui fonctionne vraiment bien dans cette relation ou ce groupe, basé sur plusieurs preuves concrètes tirées de la conversation, avec une conclusion sincère",
  "palmares": [{"titre": "nom d'un prix inventé, ironique et spécifique à cette conversation", "nom": "prénom exact", "raison": "1-2 phrases qui justifient ce prix avec un détail précis et si possible drôle"}],
  "mot_de_la_fin": "un texte de 3-5 phrases, personnel, signé par 2 Sans Filtres, qui conclut sur une note à la fois honnête et chaleureuse"
}
Règles strictes : "notes" exactement 4 éléments, "decodeur" 4 à 6 éléments, "portraits" 2 à 4 éléments (uniquement les personnes qui parlent vraiment dans la conversation, pas les contacts mentionnés en passant), "extraits" 5 à 7 éléments variés (cite le texte EXACTEMENT tel qu'il apparaît, ne l'invente jamais, et indique le bon auteur), "drapeaux_rouges" 3 à 4 éléments, "palmares" 4 à 5 éléments. Utilise les vrais prénoms trouvés dans la conversation. Base-toi uniquement sur le contenu réel fourni, ne l'invente jamais. Développe chaque champ texte comme demandé : ce rapport doit être long, riche, et se lire comme un vrai article en plusieurs parties, pas comme une suite de résumés d'une ligne.`;

function parseJson(text) {
  let t = text.trim().replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```\s*$/i, "");
  const a = t.indexOf("{"), b = t.lastIndexOf("}");
  if (a !== -1 && b !== -1) t = t.slice(a, b + 1);
  return JSON.parse(t);
}

/* ---------------------- Long-conversation architecture -------------------
   Both Gemini (gemini-flash-latest) and Claude (claude-sonnet-5) now offer
   1M-token context windows at standard pricing — verified July 2026. That
   comfortably covers the vast majority of real WhatsApp exports in a single
   call, using the FULL conversation (not a 3-slice sample like before).

   The one real constraint left is Gemini's free tier throughput (~250k
   input tokens/minute, ~10-15 requests/minute), which is what most people
   will use by default. So every request — single-shot or not — is capped
   well under that, and truly massive conversations (multi-year, very
   active groups) go through a map-reduce pipeline instead:
     1) MAP — the conversation is split into chunks at real message
        boundaries. Each chunk is sent to the model with a rolling
        "cumulative memory" (a running summary carried from the previous
        chunk) and asked to extract, verbatim, the material a report needs:
        exact quotes, per-person behaviour notes, recurring expressions,
        notable moments.
     2) REDUCE — all of that extracted material (small, since it's already
        condensed) is fed into the *exact same* report prompt used for the
        single-shot path, so the final report keeps its usual voice,
        structure and quality — it's just grounded in material drawn from
        the entire conversation instead of a partial sample. */

const CHARS_PER_TOKEN = 3.5; // conservative estimate for French text + emojis + WhatsApp formatting
// BUGFIX: 200k input tokens in a SINGLE call sits right at the free Gemini
// tier's ~250k-tokens/minute throughput ceiling once system prompt, schema,
// memory block and thinking overhead are added — that's what was silently
// killing every chunk on large conversations (both chunks failing/empty at
// once, as seen in production). Smaller chunks stay comfortably clear of
// that ceiling and each individual failure is cheaper to retry.
const SAFE_INPUT_TOKENS = 50000;
const CHUNK_CHAR_SIZE = Math.floor(SAFE_INPUT_TOKENS * CHARS_PER_TOKEN); // ~175 000 characters per call

function findChunkBoundary(text, roughEnd) {
  const windowStart = Math.max(0, roughEnd - 5000);
  const window = text.slice(windowStart, roughEnd);
  // Prefer cutting right before a line that looks like the start of a new message
  // (a timestamp, e.g. "12/04/2023, 14:32 - Léa:" or "[14:32] Léa:").
  const msgStartRe = /\n(?=\[?\d{1,2}[\/.]\d{1,2}[\/.]\d{2,4}|\[?\d{1,2}[:h]\d{2})/g;
  let lastIdx = -1, m;
  while ((m = msgStartRe.exec(window)) !== null) lastIdx = m.index;
  if (lastIdx !== -1) return windowStart + lastIdx + 1;
  const nl = window.lastIndexOf("\n");
  if (nl !== -1) return windowStart + nl + 1;
  return roughEnd;
}

function splitIntoChunks(text, chunkSize) {
  if (text.length <= chunkSize) return [text];
  const chunks = [];
  let start = 0;
  while (start < text.length) {
    const roughEnd = Math.min(start + chunkSize, text.length);
    const end = roughEnd >= text.length ? text.length : findChunkBoundary(text, roughEnd);
    const safeEnd = end > start ? end : roughEnd;
    chunks.push(text.slice(start, safeEnd));
    start = safeEnd;
  }
  return chunks;
}

const EXTRACTION_SCHEMA = `Réponds UNIQUEMENT avec un objet JSON valide, sans texte avant/après, sans markdown. Forme exacte :
{
  "resume_cumulatif": "un résumé dense de 150 à 250 mots qui combine ce que tu savais déjà (fourni ci-dessous comme mémoire) avec les nouveaux éléments de cet extrait : qui sont les participants, dynamique générale, évolution du ton, sujets récurrents. Ce résumé sera transmis tel quel à l'étape suivante, donc il doit être autonome et complet, même sans relire cet extrait.",
  "citations_marquantes": [{"citation": "citation EXACTE de moins de 20 mots, reproduite mot pour mot depuis le texte fourni", "auteur": "prénom exact de l'auteur", "interet": "1 courte phrase sur pourquoi cette citation est utile pour le rapport final (drôle, révélatrice, touchante...)"}],
  "observations_personnes": [{"nom": "prénom exact", "observations": "2-4 phrases sur le comportement, le ton, les habitudes de cette personne observés DANS CET EXTRAIT précis, avec un exemple concret si possible"}],
  "expressions_recurrentes": [{"terme": "mot, surnom ou expression trouvée EXACTEMENT dans cet extrait", "contexte": "1 phrase expliquant son usage ou son origine si visible"}],
  "moments_notables": [{"description": "1-2 phrases décrivant un moment marquant de cet extrait (dispute, confidence, fou rire, bascule de ton...)", "citation": "citation EXACTE courte illustrant ce moment, ou vide si aucune ne convient", "auteur": "prénom exact, ou vide"}],
  "ambiance_generale": "1-2 phrases sur le ton dominant de cette partie de la conversation"
}
Règles strictes : "citations_marquantes" 6 à 12 éléments variés et vérifiés mot pour mot, "observations_personnes" une entrée par personne qui parle vraiment dans cet extrait, "expressions_recurrentes" 0 à 5 éléments (uniquement si tu en repères vraiment), "moments_notables" 0 à 3 éléments. Ne résume jamais un message que tu n'as pas vu : base-toi uniquement sur le texte réellement fourni ci-dessous.`;

const EXTRACTION_SYSTEM =
  "Tu es 2 Sans Filtres en train de lire une conversation très longue, découpée en plusieurs parties pour pouvoir la traiter dans son intégralité. Ton travail ici n'est PAS d'écrire le rapport final : c'est d'extraire, avec précision, la matière brute (citations exactes, observations, moments) qui servira à écrire ce rapport plus tard, en te basant uniquement sur l'extrait de conversation fourni. Sois rigoureux : toute citation doit être recopiée mot pour mot, jamais inventée ni reformulée.\n\n" +
  EXTRACTION_SCHEMA;

function buildFinalUserContent({ mode, rawText, extractions, messageCount, chunkCount }) {
  if (mode === "single") {
    return `Voici la conversation à analyser dans son intégralité (environ ${messageCount} messages) :\n\n${rawText}`;
  }
  const body = extractions
    .map((e, i) => {
      const lines = [`— Partie ${i + 1}/${chunkCount} —`];
      if (e.ambiance_generale) lines.push(`Ambiance : ${e.ambiance_generale}`);
      if (e.citations_marquantes?.length) {
        lines.push("Citations marquantes :");
        e.citations_marquantes.forEach((c) => lines.push(`- ${c.auteur} : "${c.citation}" (${c.interet || ""})`));
      }
      if (e.observations_personnes?.length) {
        lines.push("Observations par personne :");
        e.observations_personnes.forEach((o) => lines.push(`- ${o.nom} : ${o.observations}`));
      }
      if (e.expressions_recurrentes?.length) {
        lines.push("Expressions récurrentes :");
        e.expressions_recurrentes.forEach((x) => lines.push(`- "${x.terme}" (${x.contexte || ""})`));
      }
      if (e.moments_notables?.length) {
        lines.push("Moments notables :");
        e.moments_notables.forEach((m) => lines.push(`- ${m.description}${m.citation ? ` [${m.auteur}: "${m.citation}"]` : ""}`));
      }
      return lines.join("\n");
    })
    .join("\n\n");

  const lastMemory = extractions[extractions.length - 1]?.resume_cumulatif || "";

  return (
    `Cette conversation est trop longue pour être envoyée en une seule fois (environ ${messageCount} messages, découpée en ${chunkCount} parties analysées une à une, dans l'ordre chronologique). ` +
    `Voici le résumé global final :\n\n${lastMemory}\n\n` +
    `Voici la matière détaillée extraite de chaque partie — utilise ces citations EXACTEMENT telles quelles (elles ont déjà été vérifiées mot pour mot dans le texte original), et base tout le rapport dessus, comme si tu avais lu l'intégralité de la conversation d'un seul bloc :\n\n${body}`
  );
}

function approxMessageCount(text) {
  const matches = text.match(/\n\[?\d{1,2}[:h]\d{2}/g) || text.match(/\n\S+, \d{1,2} /g);
  if (matches && matches.length > 20) return matches.length;
  const lines = text.split("\n").filter((l) => l.trim().length > 0);
  return lines.length;
}

/* --------------------------------- App --------------------------------- */

const BUILD_TAG = "v15.5 — fix: \"prepayment credits depleted\" (facturation activée mais non alimentée) traité comme un blocage permanent (échec immédiat + message dédié) au lieu d'être confondu avec un simple rate-limit ; le message d'erreur affiché ne se fait plus écraser par un \"rate-limited\" trouvé dans le détail technique d'une extraction-empty ; sélection auto de modèle Gemini exclut désormais les modèles \"-pro\" (quotas gratuits bien plus bas que Flash)";

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

/* ------------------------------ Local storage ---------------------------- */
/* The app is now fully standalone (no more Claude Artifact host), so it
   persists the person's name and API keys itself, once, on this device. */

const STORAGE_KEY = "thecrazyanalyst.config.v1";

function loadConfig() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
}

function saveConfig(cfg) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cfg));
  } catch {
    // Private browsing / full storage: the app still works, it will just ask again next time.
  }
}

function clearConfig() {
  try { localStorage.removeItem(STORAGE_KEY); } catch {}
}

function getActiveApiKey(config) {
  if (!config) return "";
  return config.provider === "claude" ? (config.anthropicKey || "") : (config.geminiKey || "");
}

/* window.print() is unreliable inside sandboxed hosts (many block the print
   modal outright), so PDF export instead rasterizes the actual rendered
   report DOM (via html2canvas) and assembles a real .pdf file (via jsPDF)
   that downloads as a normal file — same visual layout as the app, no
   print dialog involved. Both libs are loaded on demand from cdnjs. */
function loadScript(src) {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${src}"]`);
    if (existing) {
      if (existing.getAttribute("data-loaded") === "true") { resolve(); return; }
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () => reject(new Error(`script-load-failed: ${src}`)));
      return;
    }
    const s = document.createElement("script");
    s.src = src;
    s.async = true;
    s.onload = () => { s.setAttribute("data-loaded", "true"); resolve(); };
    s.onerror = () => reject(new Error(`script-load-failed: ${src}`));
    document.head.appendChild(s);
  });
}

async function ensurePdfLibs() {
  if (!window.html2canvas) {
    await loadScript("https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js");
  }
  if (!window.jspdf || !window.jspdf.jsPDF) {
    await loadScript("https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js");
  }
  if (!window.html2canvas || !window.jspdf?.jsPDF) {
    throw new Error("pdf-libs-unavailable");
  }
}

/* Renders each top-level report section to a canvas and packs those
   canvases onto A4 pages: sections that fit are kept intact (no mid-block
   cuts), sections taller than one page are sliced across as many pages as
   needed. Unchanged from the previous version. */
async function renderReportToPdf(containerEl) {
  const { jsPDF } = window.jspdf;
  const margin = 28;
  const pdf = new jsPDF({ orientation: "p", unit: "pt", format: "a4" });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const usableWidth = pageWidth - margin * 2;
  const usableHeight = pageHeight - margin * 2;

  const sections = Array.from(containerEl.querySelectorAll(":scope > .cra-page"));
  if (sections.length === 0) sections.push(containerEl);

  let cursorY = margin;
  let pageHasContent = false;
  let forceNewPageNext = false;

  for (const section of sections) {
    if (forceNewPageNext) {
      pdf.addPage();
      cursorY = margin;
      pageHasContent = false;
      forceNewPageNext = false;
    }

    const canvas = await window.html2canvas(section, {
      scale: 2,
      backgroundColor: "#FBF6ED",
      useCORS: true,
      ignoreElements: (el) => el.classList && el.classList.contains("no-print"),
    });

    const imgWidthPt = usableWidth;
    const imgHeightPt = (canvas.height * imgWidthPt) / canvas.width;

    if (imgHeightPt <= usableHeight) {
      if (pageHasContent && cursorY + imgHeightPt > pageHeight - margin) {
        pdf.addPage();
        cursorY = margin;
        pageHasContent = false;
      }
      pdf.addImage(canvas.toDataURL("image/jpeg", 0.92), "JPEG", margin, cursorY, imgWidthPt, imgHeightPt);
      cursorY += imgHeightPt + 14;
      pageHasContent = true;
    } else {
      if (pageHasContent) {
        pdf.addPage();
        cursorY = margin;
        pageHasContent = false;
      }
      const pxPerPt = canvas.width / usableWidth;
      const sliceHeightPx = Math.max(1, Math.floor(usableHeight * pxPerPt));
      let sourceY = 0;
      let firstSlice = true;
      while (sourceY < canvas.height) {
        const thisSliceHeightPx = Math.min(sliceHeightPx, canvas.height - sourceY);
        const sliceCanvas = document.createElement("canvas");
        sliceCanvas.width = canvas.width;
        sliceCanvas.height = thisSliceHeightPx;
        sliceCanvas.getContext("2d").drawImage(
          canvas, 0, sourceY, canvas.width, thisSliceHeightPx, 0, 0, canvas.width, thisSliceHeightPx
        );
        const sliceHeightPt = (thisSliceHeightPx * imgWidthPt) / canvas.width;
        if (!firstSlice) pdf.addPage();
        pdf.addImage(sliceCanvas.toDataURL("image/jpeg", 0.92), "JPEG", margin, margin, imgWidthPt, sliceHeightPt);
        sourceY += thisSliceHeightPx;
        firstSlice = false;
      }
      forceNewPageNext = true;
    }
  }

  return pdf.output("blob");
}

/* --------------------------------- AI calls ------------------------------- */

/* Anthropic's personal API keys can still hit a hard spend/quota cap; we
   keep the same detection as before so the error message stays accurate. */
function parseRateLimitBody(bodyText) {
  try {
    const outer = JSON.parse(bodyText);
    const msg = outer?.error?.message;
    if (typeof msg === "string") {
      try {
        const inner = JSON.parse(msg);
        return { hardCap: inner.type === "exceeded_limit", resetsAt: inner.resetsAt || null };
      } catch {
        return { hardCap: false, resetsAt: null };
      }
    }
    return { hardCap: false, resetsAt: null };
  } catch {
    return { hardCap: false, resetsAt: null };
  }
}

function formatResetTime(resetsAtSeconds) {
  if (!resetsAtSeconds) return "";
  try {
    const d = new Date(resetsAtSeconds * 1000);
    return d.toLocaleString("fr-FR", { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" });
  } catch {
    return "";
  }
}

/* Claude — now always uses the person's own key (there is no more shared,
   keyless quota once the app runs outside the Claude Artifacts host).
   Model updated to Claude Sonnet 5 (1M-token context, current generation). */
async function callClaude({ system, userContent, maxTokens, apiKey, retries = 2 }) {
  if (!apiKey) throw new Error("no-api-key: ajoute ta clé API Anthropic dans les réglages pour utiliser Claude.");
  let attempt = 0;
  while (true) {
    let res;
    try {
      res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
          "anthropic-dangerous-direct-browser-access": "true",
        },
        body: JSON.stringify({
          model: "claude-sonnet-5",
          max_tokens: maxTokens,
          system,
          messages: [{ role: "user", content: userContent }],
        }),
      });
    } catch (networkErr) {
      throw new Error(`network-error: ${networkErr.message || networkErr}`);
    }

    if (res.status === 401 || res.status === 403) {
      throw new Error("invalid-key: ta clé API Anthropic est invalide, expirée ou révoquée.");
    }

    if (res.status === 429) {
      const bodyText = await res.text().catch(() => "");
      const info = parseRateLimitBody(bodyText);
      if (info.hardCap) throw new Error(`hard-cap:${info.resetsAt || ""}`);
      if (attempt < retries) {
        const waitMs = 3500 * (attempt + 1) ** 2;
        attempt += 1;
        await sleep(waitMs);
        continue;
      }
      throw new Error(`rate-limited: http-429: ${bodyText.slice(0, 300)}`);
    }

    if (!res.ok) {
      const bodyText = await res.text().catch(() => "");
      throw new Error(`http-${res.status}: ${bodyText.slice(0, 400)}`);
    }

    const data = await res.json();
    const text = (data.content || []).filter((b) => b.type === "text").map((b) => b.text).join("\n");
    if (!text.trim()) {
      throw new Error("empty-response: aucun bloc texte dans la réponse de l'API (peut-être un blocage ou un refus silencieux)");
    }
    return { text, stopReason: data.stop_reason };
  }
}

/* Sélection automatique du meilleur modèle Gemini réellement accessible avec
   la clé de l'utilisateur. On interroge models.list — qui reflète les droits
   réels de la clé/projet — puis on note chaque modèle utilisable pour
   generateContent (en excluant vision/audio/image/embeddings, etc.) pour
   garder le plus capable. Résultat mis en cache en mémoire par clé pour ne
   pas relister à chaque appel. En cas d'échec (réseau, clé pas encore
   testée...), on retombe sur l'alias évergreen "gemini-flash-latest" ; l'appel
   generateContent qui suit remontera alors la vraie erreur si besoin. */
const geminiModelCache = new Map();

function scoreGeminiModel(id) {
  if (!/^gemini-/.test(id)) return -1;
  // BUGFIX: "-pro" models used to score HIGHER than "-flash" (tier 3 vs 2
  // below), so resolveGeminiModel would silently pick a Pro model whenever
  // the key's project could see one in models.list() — including on the free
  // tier, where Pro's daily quota is far lower than Flash's (this is what was
  // producing repeated "exceeded your current quota" 429s on a key that had
  // barely been used). Excluding "-pro" keeps the automatic "best available"
  // pick inside the Flash family, which the free tier is actually built for.
  if (/embedding|aqa|vision|image|imagen|veo|tts|audio|video|gemma|learnlm|robotics|computer-use|flash-8b|flash-lite|-pro/i.test(id)) return -1;
  const tier = /-flash/.test(id) ? 2 : 1;
  const verMatch = id.match(/(\d+(?:\.\d+)?)/);
  let version = verMatch ? parseFloat(verMatch[1]) : 0;
  if (/latest/.test(id)) version += 100; // un alias "-latest" pointe toujours vers le plus récent modèle stable
  return tier * 1000 + version;
}

async function resolveGeminiModel(apiKey) {
  if (geminiModelCache.has(apiKey)) return geminiModelCache.get(apiKey);
  const fallback = "gemini-flash-latest";
  try {
    const res = await fetch("https://generativelanguage.googleapis.com/v1beta/models?pageSize=200", {
      headers: { "x-goog-api-key": apiKey },
    });
    if (!res.ok) throw new Error(`http-${res.status}`);
    const data = await res.json();
    const usable = (data.models || [])
      .filter((m) => (m.supportedGenerationMethods || []).includes("generateContent"))
      .map((m) => (m.name || "").replace(/^models\//, ""))
      .filter(Boolean);
    let best = null, bestScore = -1;
    for (const id of usable) {
      const s = scoreGeminiModel(id);
      if (s > bestScore) { bestScore = s; best = id; }
    }
    const chosen = best || fallback;
    geminiModelCache.set(apiKey, chosen);
    return chosen;
  } catch {
    geminiModelCache.set(apiKey, fallback);
    return fallback;
  }
}

/* Le "thinking" (raisonnement interne) est activé par défaut sur tous les
   modèles Gemini récents et consomme le MÊME budget de tokens que la
   réponse visible (maxOutputTokens). Sans configuration explicite, ce budget
   est dynamique et peut à lui seul dépasser maxOutputTokens — la réponse
   visible sort alors vide avec finishReason=MAX_TOKENS, même sur une simple
   requête de test. Gemini 3.x et versions ultérieures utilisent
   thinkingConfig.thinkingLevel (le mettre en même temps que thinkingBudget
   fait échouer la requête) ; Gemini 2.5 et antérieurs ignorent thinkingLevel
   et doivent utiliser thinkingConfig.thinkingBudget (0 = désactivé, -1 =
   dynamique ; sur les modèles "Pro" qui ne peuvent pas désactiver la
   réflexion, 0 est simplement remonté au minimum autorisé par l'API). */
function buildThinkingConfig(model, level) {
  const wantsHigh = level === "high";
  if (/^gemini-3/.test(model)) {
    return { thinkingLevel: wantsHigh ? "high" : "low" };
  }
  return { thinkingBudget: wantsHigh ? -1 : 0 };
}

/* Gemini — new default provider. Choisit dynamiquement le meilleur modèle
   réellement accessible avec la clé fournie (voir resolveGeminiModel) et
   demande une réponse JSON native à l'API, plus fiable que de faire formater
   le JSON par le modèle en texte brut. */
/* BUGFIX (see notes above buildThinkingConfig): on some models "thinking"
   cannot be fully disabled and is billed out of the SAME maxOutputTokens
   budget as the visible answer. With a tight budget this can silently eat
   100% of it, so the API comes back "successful" (200 OK) but with an empty
   text and finishReason=MAX_TOKENS. The caller has no way to tell that
   apart from "the model genuinely had nothing to say", which is exactly
   what was happening here: the key-test call (budget 300) and every MAP
   extraction call (budget 4096) were silently starving on thinking tokens.
   The fix is to treat empty+MAX_TOKENS as a distinct, recoverable case:
   retry the SAME request with a much larger budget before giving up, on
   top of (not instead of) the existing 429/503 retry loop below. */
const EMPTY_RESPONSE_MAX_RETRIES = 3;
const EMPTY_RESPONSE_BUDGET_MULTIPLIER = 4;
const EMPTY_RESPONSE_BUDGET_CEILING = 32768;

async function callGemini({ system, userContent, maxTokens, apiKey, thinkingLevel = "low", retries = 3 }) {
  if (!apiKey) throw new Error("no-api-key: ajoute ta clé API Gemini dans les réglages.");
  const model = await resolveGeminiModel(apiKey);
  let attempt = 0;
  let currentMaxTokens = maxTokens;
  let emptyAttempt = 0;
  while (true) {
    let res;
    try {
      const generationConfig = {
        responseMimeType: "application/json",
        maxOutputTokens: currentMaxTokens,
        temperature: 1,
        thinkingConfig: buildThinkingConfig(model, thinkingLevel),
      };
      res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: system }] },
            contents: [{ role: "user", parts: [{ text: userContent }] }],
            generationConfig,
          }),
        }
      );
    } catch (networkErr) {
      throw new Error(`network-error: ${networkErr.message || networkErr}`);
    }

    // BUGFIX: 401 ("invalid authentication credentials") was missing here —
    // only 400/403 were treated as a bad key. callClaude already checked
    // 401||403 (see above), but this Gemini path didn't, so an invalid/expired
    // Gemini key silently fell through to the generic http-401 branch below
    // instead of failing fast. The result: the MAP loop in runAnalysis kept
    // retrying every one of the 8 chunks (each a wasted request + ~4s sleep)
    // before finally giving up with a vague "no real content could be
    // extracted" message — instead of immediately and clearly telling the
    // person their API key is the problem.
    if (res.status === 400 || res.status === 401 || res.status === 403) {
      const bodyText = await res.text().catch(() => "");
      throw new Error(`invalid-key: ${bodyText.slice(0, 300)}`);
    }

    if (res.status === 429 || res.status === 503) {
      const bodyText = await res.text().catch(() => "");
      // BUGFIX: "Your prepayment credits are depleted" is a 429 too, but it's
      // NOT a transient rate limit — it means the Google Cloud project behind
      // this key has billing enabled without the required minimum prepaid
      // balance, and Google blocks 100% of calls until that's fixed. Retrying
      // (here, and again for every other chunk) can never succeed, so this is
      // treated like an invalid key: fail immediately with a distinct,
      // actionable error instead of burning 3 backoff rounds × 8 chunks only
      // to land on a misleading "trop de demandes, patiente une minute".
      if (res.status === 429 && /prepayment credit/i.test(bodyText)) {
        throw new Error(`billing-blocked: http-429: ${bodyText.slice(0, 300)}`);
      }
      if (attempt < retries) {
        const waitMs = 4000 * (attempt + 1);
        attempt += 1;
        await sleep(waitMs);
        continue;
      }
      throw new Error(
        res.status === 429 ? `rate-limited: http-429: ${bodyText.slice(0, 300)}` : `http-503: ${bodyText.slice(0, 300)}`
      );
    }

    if (!res.ok) {
      const bodyText = await res.text().catch(() => "");
      throw new Error(`http-${res.status}: ${bodyText.slice(0, 400)}`);
    }

    const data = await res.json();
    const candidate = data.candidates?.[0];
    const text = (candidate?.content?.parts || []).map((p) => p.text || "").join("\n");
    const reason = candidate?.finishReason || "unknown";

    if (!text.trim()) {
      if (reason === "MAX_TOKENS" && emptyAttempt < EMPTY_RESPONSE_MAX_RETRIES) {
        emptyAttempt += 1;
        currentMaxTokens = Math.min(currentMaxTokens * EMPTY_RESPONSE_BUDGET_MULTIPLIER, EMPTY_RESPONSE_BUDGET_CEILING);
        continue;
      }
      throw new Error(`empty-response: aucun texte renvoyé (finishReason=${reason}), peut-être un blocage de sécurité.`);
    }
    return { text, stopReason: reason };
  }
}

async function callModel({ provider, apiKey, system, userContent, maxTokens, thinkingLevel }) {
  if (provider === "claude") {
    return callClaude({ system, userContent, maxTokens, apiKey });
  }
  return callGemini({ system, userContent, maxTokens, apiKey, thinkingLevel });
}

async function testApiKey(provider, apiKey) {
  try {
    if (provider === "claude") {
      const res = await callClaude({
        system: "Réponds uniquement par le mot OK, rien d'autre.",
        userContent: "Test.",
        maxTokens: 10,
        apiKey,
        retries: 0,
      });
      return { ok: res.text.trim().length > 0 };
    }
    const res = await callGemini({
      system: "Réponds uniquement par le mot OK, rien d'autre.",
      userContent: "Test.",
      // Was 300: too tight on models whose "thinking" can't be fully
      // disabled and draws from this same budget (see callGemini) — the
      // visible "OK" would sometimes lose out entirely to internal
      // reasoning tokens, making a perfectly valid key look broken.
      maxTokens: 2048,
      thinkingLevel: "low",
      apiKey,
      retries: 0,
    });
    return { ok: res.text.trim().length > 0, model: geminiModelCache.get(apiKey) };
  } catch (err) {
    return { ok: false, error: err.message || String(err) };
  }
}

function formatGeminiModelLabel(id) {
  if (!id) return "";
  return id.split("-").map((w) => (w[0] || "").toUpperCase() + w.slice(1)).join(" ");
}

function friendlyKeyTestError(err) {
  if (!err) return "Le test a échoué.";
  if (err.startsWith("invalid-key")) return "Clé invalide — vérifie que tu l'as copiée en entier.";
  if (err.startsWith("billing-blocked") || /prepayment credit/i.test(err)) {
    return "Le projet Google lié à cette clé a la facturation activée mais pas encore alimentée (10 $ minimum requis) — crée un nouveau projet SANS carte liée dans Google AI Studio, ou règle ce crédit prépayé.";
  }
  if (err.startsWith("rate-limited")) return "Trop de tentatives d'un coup, réessaie dans une minute.";
  if (err.startsWith("network-error")) return "Impossible de joindre l'API — vérifie ta connexion.";
  if (err.startsWith("no-api-key")) return "Colle d'abord une clé.";
  return "Le test a échoué — vérifie la clé et réessaie.";
}

/* --------------------- Analysis orchestrator (map-reduce) ------------------ */

async function synthesizeReport({ style, userContent, provider, apiKey }) {
  const system = `${STYLES[style].system}\n\n${SCHEMA}`;
  let attempt1;
  try {
    // Generous budget: Gemini's hybrid reasoning can spend some of this on
    // internal thinking before the visible JSON, so we leave real headroom
    // rather than cutting it as close as the old 7000-token Claude-only budget.
    attempt1 = await callModel({ provider, apiKey, system, userContent, maxTokens: 16000 });
  } catch (err) {
    throw new Error(`attempt1-call-failed: ${err.message}`);
  }

  if (attempt1.stopReason === "max_tokens" || attempt1.stopReason === "MAX_TOKENS") {
    throw new Error(`attempt1-truncated: réponse coupée (max_tokens). Début: ${attempt1.text.slice(0, 200)}`);
  }

  try {
    return parseJson(attempt1.text);
  } catch (parseErr1) {
    let attempt2;
    try {
      attempt2 = await callModel({
        provider,
        apiKey,
        maxTokens: 16000,
        system:
          "Tu reçois un texte censé être un objet JSON respectant un schéma précis, mais il est invalide (tronqué, mal formé, ou entouré de texte parasite). " +
          "Réponds UNIQUEMENT avec le JSON corrigé et complet, sans aucun texte avant/après, sans markdown. " +
          "Si des champs manquent, complète-les de façon cohérente avec le reste. Voici le schéma attendu :\n\n" +
          SCHEMA,
        userContent: `Texte à corriger :\n\n${attempt1.text}`,
      });
    } catch (err) {
      throw new Error(`attempt2-call-failed: ${err.message} — réponse originale (non-JSON): ${attempt1.text.slice(0, 300)}`);
    }
    try {
      return parseJson(attempt2.text);
    } catch (parseErr2) {
      throw new Error(
        `both-attempts-failed: 1ère erreur="${parseErr1.message}", 2e erreur="${parseErr2.message}". ` +
        `Réponse brute (1ère tentative): ${attempt1.text.slice(0, 350)}`
      );
    }
  }
}

async function runAnalysis({ rawText, style, provider, apiKey, onProgress }) {
  const messageCount = approxMessageCount(rawText);
  const chunks = splitIntoChunks(rawText, CHUNK_CHAR_SIZE);

  if (chunks.length <= 1) {
    onProgress?.({ phase: "single", current: 1, total: 1 });
    const userContent = buildFinalUserContent({ mode: "single", rawText: chunks[0], messageCount });
    return await synthesizeReport({ style, userContent, provider, apiKey });
  }

  // --- MAP: extract structured material chunk by chunk, carrying memory forward ---
  const extractions = [];
  let memory = "";
  let failedChunks = 0; // chunks that errored out entirely (network, parse, etc.)
  let emptyChunks = 0; // chunks that "succeeded" but came back with nothing usable
  const chunkErrors = []; // concrete per-chunk reasons, surfaced if the whole run aborts
  for (let i = 0; i < chunks.length; i++) {
    onProgress?.({ phase: "mapping", current: i + 1, total: chunks.length });
    const memoryBlock = memory
      ? `Mémoire de ce qu'on sait déjà de cette conversation avant cet extrait :\n${memory}\n\n`
      : "Aucune mémoire précédente : c'est le tout début de la conversation.\n\n";
    const userContent = `${memoryBlock}Partie ${i + 1}/${chunks.length} de la conversation (ordre chronologique) :\n\n${chunks[i]}`;

    let parsed;
    let chunkFailed = false; // BUGFIX: tracked per-iteration so a failed chunk
    // can no longer ALSO be counted as "empty" below (it used to fall through
    // into the gotNothing check on its own empty fallback object, counting
    // every real failure twice — e.g. 2 failed chunks showed up as "4/2 parties
    // en échec", which is what actually happened here).
    try {
      const res = await callModel({
        // Was 4096: on top of the empty-response auto-retry in callGemini,
        // start with a bigger baseline so a normal, content-rich chunk
        // doesn't even need that retry (thinking tokens + a full extraction
        // of 6-12 quotes + per-person notes can add up).
        provider, apiKey, maxTokens: 6144, thinkingLevel: "low",
        system: EXTRACTION_SYSTEM, userContent,
      });
      parsed = parseJson(res.text);
    } catch (err) {
      const msg = String(err.message || err);
      if (msg.startsWith("no-api-key") || msg.startsWith("invalid-key") || msg.startsWith("billing-blocked")) {
        throw err; // no point continuing: neither a missing key nor a depleted billing state fixes itself mid-run
      }
      // A single chunk that fails to parse shouldn't sink the whole analysis
      // on its own: carry the memory forward and keep going with a thinner
      // extraction — but this failure IS tracked below and, if it happens
      // too often, the whole run is aborted instead of quietly writing a
      // report on top of missing material (see check after the loop).
      chunkFailed = true;
      failedChunks += 1;
      chunkErrors.push(`Partie ${i + 1}/${chunks.length}: ${msg.slice(0, 220)}`);
      parsed = {
        resume_cumulatif: memory, citations_marquantes: [], observations_personnes: [],
        expressions_recurrentes: [], moments_notables: [], ambiance_generale: "",
      };
    }

    if (!chunkFailed) {
      const gotNothing =
        (parsed.citations_marquantes?.length || 0) === 0 &&
        (parsed.observations_personnes?.length || 0) === 0 &&
        (parsed.moments_notables?.length || 0) === 0 &&
        !parsed.ambiance_generale?.trim();
      if (gotNothing) {
        emptyChunks += 1;
        chunkErrors.push(`Partie ${i + 1}/${chunks.length}: réponse reçue mais vide (aucune citation ni observation).`);
      }
    }

    extractions.push(parsed);
    memory = parsed.resume_cumulatif || memory;

    // Stay safely under the free Gemini tier's requests-per-minute limit.
    if (provider === "gemini" && i < chunks.length - 1) await sleep(4200);
  }

  // If most (or all) chunks failed or came back empty, the material handed
  // to the writer step below would be little more than blank headers — and
  // an LLM asked to fill out a fixed report schema from an empty prompt
  // will happily invent a plausible-looking report to comply, rather than
  // refuse. That is exactly how a report about entirely fictional people
  // ("Léa", "Maxime", "Thomas"...) can come out of a real, correctly-read
  // conversation: the failure happened here, silently, one step earlier.
  // So: tolerate a few unlucky chunks, but refuse to proceed past this
  // point if there's essentially nothing real to write from.
  const brokenChunks = failedChunks + emptyChunks;
  const totalCitations = extractions.reduce((n, e) => n + (e.citations_marquantes?.length || 0), 0);
  const errorSample = chunkErrors.slice(0, 4).join(" | ") || "aucun détail disponible";
  if (totalCitations === 0 || brokenChunks === chunks.length) {
    throw new Error(
      `extraction-empty: aucune matière réelle n'a pu être extraite de la conversation ` +
      `(${brokenChunks}/${chunks.length} parties en échec ou vides). Détail : ${errorSample}. ` +
      `Le rapport n'a pas été généré pour éviter d'inventer du contenu à la place.`
    );
  }
  if (brokenChunks / chunks.length > 0.5) {
    throw new Error(
      `extraction-partial: plus de la moitié des parties de la conversation (${brokenChunks}/${chunks.length}) ` +
      `n'ont pas pu être lues correctement. Détail : ${errorSample}. ` +
      `Le rapport n'a pas été généré pour éviter qu'il soit incomplet ou inventé.`
    );
  }

  // --- REDUCE: turn the cumulative extraction into the final styled report ---
  onProgress?.({ phase: "reducing", current: chunks.length, total: chunks.length });
  const userContent = buildFinalUserContent({ mode: "map-reduce", extractions, messageCount, chunkCount: chunks.length });
  return await synthesizeReport({ style, userContent, provider, apiKey });
}

/* ================================ App root ================================ */

export default function ChatReportApp() {
  const [config, setConfig] = useState(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const [rawText, setRawText] = useState("");
  const [fileName, setFileName] = useState("");
  const [style, setStyle] = useState("fun");
  const [status, setStatus] = useState("idle"); // idle | extracting | loading | done | error
  const [error, setError] = useState("");
  const [errorDetail, setErrorDetail] = useState("");
  const [showDetail, setShowDetail] = useState(false);
  const [report, setReport] = useState(null);
  const [progress, setProgress] = useState(null); // { phase, current, total }
  const [pdfStatus, setPdfStatus] = useState("idle"); // idle | generating | error
  const [pdfError, setPdfError] = useState("");
  const reportRef = useRef(null);

  useEffect(() => {
    const cfg = loadConfig();
    if (cfg && cfg.onboarded) {
      setConfig(cfg);
    } else {
      setShowOnboarding(true);
    }
  }, []);

  function handleOnboardingComplete(cfg) {
    const full = { provider: "gemini", geminiKey: "", anthropicKey: "", ...cfg, onboarded: true };
    saveConfig(full);
    setConfig(full);
    setShowOnboarding(false);
  }

  function handleSettingsSave(cfg) {
    const full = { ...config, ...cfg };
    saveConfig(full);
    setConfig(full);
    setShowSettings(false);
  }

  function handleResetApp() {
    clearConfig();
    setConfig(null);
    setShowSettings(false);
    setShowOnboarding(true);
    reset();
  }

  function looksLikeGarbage(text) {
    if (!text || text.length < 20) return true;
    const sample = text.slice(0, 3000);
    const badChars = (sample.match(/[\uFFFD\x00-\x08\x0E-\x1F]/g) || []).length;
    return badChars / sample.length > 0.02;
  }

  const handleFile = useCallback(async (file) => {
    if (!file) return;
    setError("");
    setErrorDetail("");
    setRawText(""); // clear any stale content immediately so a failure can never submit old data
    setFileName(file.name);
    try {
      const buf = await file.arrayBuffer();
      const head = new Uint8Array(buf.slice(0, 4));
      const isZip = head[0] === 0x50 && head[1] === 0x4b && (head[2] === 0x03 || head[2] === 0x05 || head[2] === 0x07);
      const text = isZip
        ? await (async () => { setStatus("extracting"); return readLargestTxtFromZip(buf); })()
        : new TextDecoder("utf-8").decode(buf);

      if (looksLikeGarbage(text)) {
        throw new Error("garbage");
      }
      setRawText(text);
      setStatus("idle");
    } catch (err) {
      setStatus("idle");
      setFileName("");
      setError(
        err.message === "unsupported-browser"
          ? "Ton navigateur ne permet pas de lire ce zip ici. Dézippe-le et dépose le .txt directement."
          : err.message === "garbage"
          ? "Le texte extrait n'est pas lisible (probablement un problème de compression). Essaie de dézipper manuellement et de déposer le .txt à la place."
          : "Ce fichier n'a pas pu être lu — vérifie qu'il contient bien un export de conversation."
      );
      setErrorDetail(err.message || String(err));
    }
  }, []);

  async function generateReport() {
    if (!rawText.trim()) return;
    if (!config) { setShowOnboarding(true); return; }
    const apiKey = getActiveApiKey(config);
    if (!apiKey) {
      setError(`Ajoute d'abord ta clé API ${config.provider === "claude" ? "Anthropic" : "Gemini"} dans les réglages.`);
      setShowSettings(true);
      return;
    }

    setStatus("loading");
    setError("");
    setErrorDetail("");
    setReport(null);
    setProgress(null);

    try {
      const parsed = await runAnalysis({
        rawText, style, provider: config.provider, apiKey,
        onProgress: (p) => setProgress(p),
      });
      setReport(parsed);
      setStatus("done");
    } catch (err) {
      const msg = err && err.message ? err.message : String(err);
      const hardCapMatch = msg.match(/hard-cap:(\d*)/);

      if (msg.startsWith("no-api-key") || msg.startsWith("invalid-key")) {
        setError(
          msg.startsWith("invalid-key")
            ? `Ta clé API ${config.provider === "claude" ? "Anthropic" : "Gemini"} semble invalide. Vérifie-la dans les réglages.`
            : `Il manque une clé API ${config.provider === "claude" ? "Anthropic" : "Gemini"} — ajoute-la dans les réglages.`
        );
        setShowSettings(true);
      } else if (msg.startsWith("billing-blocked") || /prepayment credit/i.test(msg)) {
        // Distinct from ordinary rate-limiting: this means the Google Cloud
        // project behind the key has billing ENABLED but under the required
        // minimum prepaid balance, so Google blocks every call regardless of
        // model or chunk size. "Patiente une minute" is actively wrong advice
        // here — nothing about waiting fixes it.
        setError(
          "Le projet Google lié à ta clé Gemini a la facturation activée mais le crédit prépayé minimum (10 $) n'a pas été payé — tant que ce n'est pas réglé, Google bloque tous les appels. " +
          "Solutions : crée un nouveau projet dans Google AI Studio SANS carte liée (repasse en palier gratuit), ou règle ce crédit prépayé depuis la facturation de ce projet."
        );
        setShowSettings(true);
      } else if (hardCapMatch) {
        const resetTxt = formatResetTime(Number(hardCapMatch[1]));
        setError(
          `Ta clé API a atteint sa limite de quota${resetTxt ? ` (réinitialisation prévue le ${resetTxt})` : ""}. ` +
          `Vérifie ton compte, ou patiente un peu avant de relancer.`
        );
      } else {
        // BUGFIX: this used to check msg.includes("rate-limited") FIRST, as a
        // substring anywhere in the message. But extraction-empty/partial
        // errors embed each chunk's raw failure detail (which can itself
        // contain the word "rate-limited") inside their own message text —
        // so a genuine extraction-empty run was being mis-shown as the
        // generic "trop de demandes, patiente une minute" banner instead of
        // its own, more accurate message (this is exactly what happened in
        // the 8/8-chunks-failed screenshot). Checking the specific prefixes
        // first, and rate-limited via startsWith (only true top-level rate
        // limit errors, e.g. from "Tester ma clé") last, fixes that.
        setError(
          msg.startsWith("extraction-empty")
            ? "L'IA n'a réussi à lire aucun contenu réel de ta conversation (erreur technique pendant l'analyse). Le rapport n'a volontairement pas été généré pour éviter qu'il soit inventé — réessaie, et si ça persiste, essaie avec l'autre fournisseur (Claude/Gemini) dans les réglages."
            : msg.startsWith("extraction-partial")
            ? "Plus de la moitié de ta conversation n'a pas pu être lue correctement. Le rapport n'a volontairement pas été généré pour éviter qu'il soit incomplet ou inventé — réessaie."
            : msg.startsWith("attempt1-call-failed") || msg.startsWith("attempt2-call-failed")
            ? "L'appel à l'IA a échoué (réseau, ou clé invalide). Regarde le détail technique ci-dessous."
            : msg.startsWith("attempt1-truncated")
            ? "La réponse a été coupée avant la fin. Réessaie — si ça persiste, le souci n'est pas la taille."
            : msg.startsWith("both-attempts-failed")
            ? "Le modèle n'a pas renvoyé de JSON exploitable, même après une tentative de correction automatique. Regarde le détail technique."
            : msg.startsWith("rate-limited")
            ? "Le fournisseur d'IA reçoit trop de demandes d'un coup (limite du palier gratuit). Patiente une minute et relance."
            : "Le rapport n'a pas pu être généré."
        );
      }
      setErrorDetail(msg);
      setStatus("error");
    }
  }

  function reset() {
    setRawText(""); setFileName(""); setReport(null); setStatus("idle");
    setError(""); setErrorDetail(""); setShowDetail(false); setProgress(null);
  }

  async function downloadPdf() {
    if (!report || !reportRef.current || pdfStatus === "generating") return;
    setPdfStatus("generating");
    setPdfError("");

    /* Mobile browsers block the classic "<a download> click on a blob: URL"
       trick. The fix is to open a real top-level tab synchronously inside
       this click handler (before any await), then redirect it once the PDF
       blob is ready. The browser's native PDF viewer then lets the user
       save / share it. */
    let pdfWindow = null;
    try {
      pdfWindow = window.open("", "_blank");
      if (pdfWindow) {
        pdfWindow.document.write(
          '<!doctype html><html><head><meta charset="utf-8"><title>Génération du PDF…</title>' +
          '<style>body{font-family:sans-serif;background:#FBF6ED;color:#3A2E22;display:flex;' +
          'align-items:center;justify-content:center;height:100vh;margin:0;font-size:15px}</style>' +
          '</head><body>Génération du PDF en cours…</body></html>'
        );
        pdfWindow.document.close();
      }
    } catch {
      pdfWindow = null;
    }

    try {
      await ensurePdfLibs();
      const blob = await renderReportToPdf(reportRef.current);
      const slug = (report.verdict || "Rapport")
        .replace(/[«»"“”/\\:*?<>|]/g, "")
        .trim()
        .slice(0, 60) || "Rapport";
      const blobUrl = URL.createObjectURL(blob);

      if (pdfWindow && !pdfWindow.closed) {
        pdfWindow.location.href = blobUrl;
      } else {
        const link = document.createElement("a");
        link.href = blobUrl;
        link.download = `2 Sans Filtres - ${slug}.pdf`;
        document.body.appendChild(link);
        link.click();
        link.remove();
      }
      setTimeout(() => URL.revokeObjectURL(blobUrl), 60000);
      setPdfStatus("idle");
    } catch (err) {
      if (pdfWindow && !pdfWindow.closed) pdfWindow.close();
      setPdfStatus("error");
      setPdfError(
        err && err.message === "pdf-libs-unavailable"
          ? "Les librairies nécessaires à la génération du PDF n'ont pas pu être chargées (réseau bloqué ?). Réessaie."
          : "La génération du PDF a échoué. Réessaie — si ça persiste, ferme puis rouvre le rapport."
      );
    }
  }

  const busy = status === "loading" || status === "extracting";
  // Memoized: splitting a multi-megabyte pasted conversation is real work,
  // no need to redo it on every unrelated re-render (only when rawText changes).
  const plannedChunks = useMemo(
    () => (rawText.trim() ? splitIntoChunks(rawText, CHUNK_CHAR_SIZE).length : 1),
    [rawText]
  );

  let submitLabel = "2 Sans Filtres lit tout ça…";
  if (progress?.phase === "mapping") submitLabel = `Lecture de la conversation… partie ${progress.current}/${progress.total}`;
  else if (progress?.phase === "reducing") submitLabel = "Rédaction du rapport final…";

  const providerLabel = config?.provider === "claude" ? "Claude" : "Gemini";

  return (
    <div style={S.root} className="cra-root">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,600;1,9..144,500;1,9..144,600&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');
        * { box-sizing: border-box; }
        input[type=file] { font-family: 'Inter', sans-serif; font-size: 13px; }
        ::selection { background: #C9654A; color: #FFF8F0; }

        @media print {
          @page { margin: 16mm 14mm; }
          html, body { background: #FFFFFF !important; }
          .no-print { display: none !important; }
          .cra-root { background: #FFFFFF !important; padding: 0 !important; min-height: 0 !important; }
          .cra-shell { max-width: 100% !important; }
          .cra-page { border-bottom: none !important; padding: 14px 0 !important; }
          .cra-page-head { break-after: avoid; page-break-after: avoid; }
          .cra-avoid-break { break-inside: avoid; page-break-inside: avoid; }
        }
      `}</style>

      <div style={S.shell} className="cra-shell">
        <div style={S.topBar}>
          <div style={S.brandRow}>
            <div style={{ ...S.avatar, animation: busy ? "pulse 1.4s ease-in-out infinite" : "none" }}>
              <img src={LOGO_2SF} alt="2 Sans Filtres" style={S.avatarGlyph} />
            </div>
            <div>
              <div style={S.brand}>2 Sans Filtres</div>
              <div style={S.brandSub}>
                {config?.firstName ? `Salut ${config.firstName} — ` : ""}Rapports sans filtre sur vos conversations
              </div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8 }} className="no-print">
            {status === "done" && (
              <button onClick={reset} style={S.topBtn}>
                Faire un autre rapport <ArrowRight size={14} />
              </button>
            )}
            <button onClick={() => setShowSettings(true)} style={S.gearBtn} title="Réglages" aria-label="Réglages">
              <Settings size={16} />
            </button>
          </div>
        </div>

        {status !== "done" && (
          <div style={S.panel}>
            <div style={S.eyebrow}>Nouveau rapport</div>
            <div style={S.landingTitle}>Il a lu. Il a TOUT lu.</div>
            <div style={S.landingSub}>
              Dépose l'export d'une conversation (groupe ou privée) et 2 Sans Filtres te livre son avis complet, sans filtre, partie par partie.
            </div>

            <div style={S.uploadZone}>
              {status === "extracting" ? (
                <div style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "center" }}>
                  <Loader2 size={18} style={{ animation: "spin 1s linear infinite" }} />
                  <span>Extraction du zip…</span>
                </div>
              ) : (
                <>
                  <div style={S.uploadLabel}>Importer un export de conversation</div>
                  <input
                    type="file"
                    accept=".txt,.zip"
                    onChange={(e) => handleFile(e.target.files?.[0])}
                    style={S.fileInput}
                  />
                  <div style={S.formatsHint}>.ZIP (export WhatsApp) ou .TXT — aucune limite de taille</div>
                  {fileName && <div style={S.fileChip}>{fileName}</div>}
                  {fileName && rawText.trim() && (
                    <div style={S.previewBox}>
                      <div style={S.previewLabel}>Aperçu du texte importé ✓</div>
                      <div style={S.previewText}>{rawText.slice(0, 220)}…</div>
                    </div>
                  )}
                </>
              )}
            </div>

            <div style={S.sep}>— ou colle le texte —</div>

            <textarea
              style={S.textarea}
              placeholder={`[12:03] Léa: t'as vu le message de Marc\n[12:04] Sami: mdrrr encore`}
              value={rawText}
              onChange={(e) => { setRawText(e.target.value); if (fileName) setFileName(""); }}
            />
            <div style={S.wordCount}>
              {rawText.trim() ? rawText.trim().split(/\s+/).length : 0} mots
              {rawText.trim() && plannedChunks > 1 && (
                <span style={S.chunkHint}> · conversation longue : analyse en {plannedChunks} parties</span>
              )}
            </div>

            <div style={S.styleRow}>
              {Object.entries(STYLES).map(([key, s]) => (
                <button
                  key={key}
                  onClick={() => setStyle(key)}
                  style={{ ...S.styleBtn, ...(style === key ? S.styleBtnActive : {}) }}
                >
                  <div style={{ fontWeight: 600, fontSize: 13 }}>{s.label}</div>
                  <div style={{ fontSize: 11, color: "#6B5F53", marginTop: 2 }}>{s.desc}</div>
                </button>
              ))}
            </div>

            <button type="button" onClick={() => setShowSettings(true)} style={S.apiKeyToggle}>
              <KeyRound size={12} />
              Analyse avec {providerLabel} (ta clé) · changer
            </button>

            <button
              disabled={!rawText.trim() || busy}
              onClick={generateReport}
              style={{ ...S.submit, opacity: !rawText.trim() || busy ? 0.4 : 1 }}
            >
              {busy ? (
                <><Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> {submitLabel}</>
              ) : (
                <><Sparkles size={16} /> Obtenir le rapport</>
              )}
            </button>

            {busy && progress?.phase === "mapping" && (
              <div style={S.progressTrack}>
                <div style={{ ...S.progressFill, width: `${Math.round((progress.current / progress.total) * 100)}%` }} />
              </div>
            )}

            {error && (
              <div style={S.errorBox}>
                <AlertCircle size={16} style={{ flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div>{error}</div>
                  {errorDetail && (
                    <div style={{ marginTop: 6 }}>
                      <button onClick={() => setShowDetail((v) => !v)} style={S.detailToggle}>
                        <ChevronDown size={12} style={{ transform: showDetail ? "rotate(180deg)" : "none", transition: "transform 0.15s" }} />
                        Détails techniques
                      </button>
                      {showDetail && <div style={S.detailBox}>{errorDetail}</div>}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {status === "done" && report && (
          <div style={{ display: "flex", flexDirection: "column" }} ref={reportRef}>
            <ReportPage icon="💬">
              <div style={S.coverTitle}>« {report.verdict} »</div>
              <Divider />
              <p style={S.body}>{report.ouverture}</p>
            </ReportPage>

            {report.notes?.length > 0 && (
              <ReportPage icon="⭐" title="Le bulletin, catégorie par catégorie">
                <p style={S.body}>Je vous note. Sans pitié.</p>
                {report.notes.map((n, i) => (
                  <div key={i} style={S.noteRow} className="cra-avoid-break">
                    <div style={S.noteHead}>
                      <span style={S.noteCat}>{n.categorie}</span>
                      <Stars value={n.etoiles} />
                    </div>
                    <p style={S.body}>{n.commentaire}</p>
                  </div>
                ))}
              </ReportPage>
            )}

            {report.decodeur?.length > 0 && (
              <ReportPage icon="📖" title={report.decodeur_titre || "Le décodeur"}>
                <p style={S.body}>{report.decodeur_intro || "J'ai dû traduire. Pour vous, mais surtout pour l'humanité future qui tombera sur cette archive."}</p>
                <ul style={S.decodeList}>
                  {report.decodeur.map((l, i) => (
                    <li key={i} style={S.decodeItem} className="cra-avoid-break">
                      <span style={S.decodeTerm}>« {l.terme} »</span> : {l.definition}
                    </li>
                  ))}
                </ul>
              </ReportPage>
            )}

            <ReportPage icon="🗺️" title="Ce n'est pas une simple conversation, c'est une organisation logistique">
              <p style={S.body}>{report.structure}</p>
            </ReportPage>

            {report.paradoxe?.texte && (
              <ReportPage icon="⚖️" title={report.paradoxe.titre || "Le paradoxe que personne d'autre ne vous dira"}>
                <p style={S.body}>{report.paradoxe.texte}</p>
              </ReportPage>
            )}

            {report.portraits?.length > 0 && (
              <ReportPage icon="🖼️" title="Les portraits, sans anesthésie">
                {report.portraits.map((p, i) => (
                  <div key={i} style={S.portrait} className="cra-avoid-break">
                    <div style={S.portraitName}>{p.nom}</div>
                    <p style={S.body}>{p.roast}</p>
                  </div>
                ))}
              </ReportPage>
            )}

            {report.extraits?.length > 0 && (
              <ReportPage icon="🔍" title="Les preuves, mot pour mot">
                {report.extraits.map((e, i) => (
                  <div key={i} style={{ marginBottom: 16 }} className="cra-avoid-break">
                    <Bubble author={e.auteur}>{e.citation}</Bubble>
                    <p style={{ ...S.body, marginTop: 6 }}>{e.commentaire}</p>
                  </div>
                ))}
              </ReportPage>
            )}

            {report.moment_cle?.texte && (
              <ReportPage icon="🎭" title={report.moment_cle.titre || "La conversation que vous avez vraiment eue"}>
                <p style={S.body}>{report.moment_cle.texte}</p>
                {report.moment_cle.citation && (
                  <div style={{ marginTop: 16 }}>
                    <Bubble author={report.moment_cle.auteur}>{report.moment_cle.citation}</Bubble>
                  </div>
                )}
              </ReportPage>
            )}

            {report.drapeaux_rouges?.length > 0 && (
              <ReportPage icon="🚩" title="Drapeaux rouges (parce que je vous aime trop pour ne pas les dire)">
                {report.drapeaux_rouges.map((r, i) => (
                  <p key={i} style={S.body} className="cra-avoid-break">
                    <span style={S.flagName}>{r.nom}</span> : {r.texte}
                  </p>
                ))}
              </ReportPage>
            )}

            {report.drapeaux_verts && (
              <ReportPage icon="💚" title="Drapeaux verts (parce qu'il y en a beaucoup)">
                <p style={S.body}>{report.drapeaux_verts}</p>
              </ReportPage>
            )}

            {report.palmares?.length > 0 && (
              <ReportPage icon="🏆" title="Le palmarès">
                {report.palmares.map((r, i) => (
                  <div key={i} style={S.award} className="cra-avoid-break">
                    <div style={S.awardTitle}>🏆 {r.titre}</div>
                    <div style={S.awardName}>{r.nom}</div>
                    <p style={S.body}>{r.raison}</p>
                  </div>
                ))}
              </ReportPage>
            )}

            <ReportPage icon="🖋️" title="Le mot de la fin">
              <div style={S.finalWord} className="cra-avoid-break">{report.mot_de_la_fin}</div>
              <div style={S.printColophon}>
                Rapport généré par 2 Sans Filtres — {new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
              </div>
              <div style={{ display: "flex", gap: 10, marginTop: 20 }} className="no-print">
                <button
                  onClick={downloadPdf}
                  disabled={pdfStatus === "generating"}
                  style={{ ...S.actionBtn, flex: 1, opacity: pdfStatus === "generating" ? 0.6 : 1 }}
                >
                  {pdfStatus === "generating" ? (
                    <><Loader2 size={15} style={{ animation: "spin 1s linear infinite" }} /> Génération du PDF…</>
                  ) : (
                    <><Download size={15} /> Télécharger en PDF</>
                  )}
                </button>
              </div>
              {pdfStatus === "error" && (
                <div style={{ ...S.errorBox, marginTop: 10 }} className="no-print">
                  <AlertCircle size={16} style={{ flexShrink: 0 }} />
                  <div>{pdfError}</div>
                </div>
              )}
              <button onClick={reset} style={{ ...S.actionBtn, ...S.actionBtnSecondary }} className="no-print">
                <RotateCcw size={15} /> Nouveau rapport
              </button>
            </ReportPage>
          </div>
        )}

        <div style={S.buildTag} className="no-print">{BUILD_TAG}</div>
      </div>

      {showOnboarding && (
        <Onboarding onComplete={handleOnboardingComplete} initialName={config?.firstName || ""} />
      )}

      {showSettings && config && (
        <SettingsModal
          config={config}
          onClose={() => setShowSettings(false)}
          onSave={handleSettingsSave}
          onResetApp={handleResetApp}
        />
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100% { transform: scale(1); } 50% { transform: scale(1.08); } }
      `}</style>
    </div>
  );
}

/* ------------------------------ Onboarding -------------------------------- */

function Onboarding({ onComplete, initialName }) {
  const [step, setStep] = useState(0); // 0 name, 1 why + provider, 2 setup + test
  const [firstName, setFirstName] = useState(initialName);
  const [provider, setProvider] = useState("gemini");
  const [keyInput, setKeyInput] = useState("");
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null); // { ok, error }

  async function handleTest() {
    if (!keyInput.trim()) return;
    setTesting(true);
    setTestResult(null);
    const res = await testApiKey(provider, keyInput.trim());
    setTestResult(res);
    setTesting(false);
  }

  function handleFinish() {
    const cfg = { firstName: firstName.trim() || "toi", provider };
    if (provider === "claude") cfg.anthropicKey = keyInput.trim();
    else cfg.geminiKey = keyInput.trim();
    onComplete(cfg);
  }

  const providerName = provider === "claude" ? "Anthropic (Claude)" : "Gemini (Google)";
  const keyPlaceholder = provider === "claude" ? "sk-ant-…" : "AQ.xxxxxxxxxxxxxxxxxxxxxxxxx";
  const setupUrl = provider === "claude" ? "https://console.anthropic.com/settings/keys" : "https://aistudio.google.com/apikey";

  return (
    <div style={S.overlayBackdrop}>
      <div style={{ ...S.panel, width: "100%", maxWidth: 440, maxHeight: "88vh", overflowY: "auto" }}>
        <div style={S.stepDots}>
          {[0, 1, 2].map((i) => (
            <span key={i} style={{ ...S.stepDot, ...(i === step ? S.stepDotActive : {}) }} />
          ))}
        </div>

        {step === 0 && (
          <>
            <div style={S.eyebrow}>Bienvenue</div>
            <div style={S.landingTitle}>Avant de commencer…</div>
            <div style={S.landingSub}>Comment veux-tu que je t'appelle ?</div>
            <label style={S.fieldLabel}>Prénom</label>
            <input
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="Ton prénom"
              style={S.apiKeyInput}
              autoFocus
              onKeyDown={(e) => { if (e.key === "Enter" && firstName.trim()) setStep(1); }}
            />
            <button
              disabled={!firstName.trim()}
              onClick={() => setStep(1)}
              style={{ ...S.submit, opacity: firstName.trim() ? 1 : 0.4 }}
            >
              Continuer <ArrowRight size={16} />
            </button>
          </>
        )}

        {step === 1 && (
          <>
            <div style={S.eyebrow}>Étape 2 sur 3</div>
            <div style={S.landingTitle}>Une dernière chose, {firstName.trim() || "toi"}</div>
            <p style={S.body}>
              2 Sans Filtres lit tes conversations grâce à une intelligence artificielle. Pour fonctionner, il lui faut ta propre clé API — un peu comme un badge d'accès à ton nom.
            </p>
            <p style={{ ...S.body, marginTop: 10 }}>
              Pourquoi ? Chaque analyse consomme un peu de calcul. Avec ta clé, c'est <strong>ton</strong> quota gratuit qui est utilisé — jamais le mien. L'app reste ainsi gratuite et illimitée, sans dépendre de moi ni de mon budget.
            </p>
            <p style={{ ...S.body, marginTop: 10 }}>
              Par défaut, on utilise <strong>Gemini</strong> (Google) : c'est gratuit, sans carte bancaire, et largement suffisant même pour de très longues conversations.
            </p>
            <div style={S.styleRow}>
              <button
                onClick={() => setProvider("gemini")}
                style={{ ...S.styleBtn, ...(provider === "gemini" ? S.styleBtnActive : {}) }}
              >
                <div style={{ fontWeight: 600, fontSize: 13 }}>Gemini</div>
                <div style={{ fontSize: 11, color: "#6B5F53", marginTop: 2 }}>Recommandé, gratuit</div>
              </button>
              <button
                onClick={() => setProvider("claude")}
                style={{ ...S.styleBtn, ...(provider === "claude" ? S.styleBtnActive : {}) }}
              >
                <div style={{ fontWeight: 600, fontSize: 13 }}>Claude</div>
                <div style={{ fontSize: 11, color: "#6B5F53", marginTop: 2 }}>Si tu as déjà une clé Anthropic</div>
              </button>
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
              <button onClick={() => setStep(0)} style={S.smallLink}>← Retour</button>
              <button onClick={() => setStep(2)} style={{ ...S.submit, marginTop: 0, flex: 1 }}>
                Continuer <ArrowRight size={16} />
              </button>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <div style={S.eyebrow}>Étape 3 sur 3</div>
            <div style={S.landingTitle}>Crée ta clé API {providerName}</div>
            <ol style={S.orderedList}>
              {provider === "gemini" ? (
                <>
                  <li style={S.orderedItem}>Ouvre Google AI Studio (bouton ci-dessous) et connecte-toi avec un compte Google.</li>
                  <li style={S.orderedItem}>Clique sur « Create API key » (Créer une clé API).</li>
                  <li style={S.orderedItem}>Choisis « Create API key in new project » si on te le demande.</li>
                  <li style={S.orderedItem}>Copie la clé qui apparaît (aujourd'hui elle commence en général par « AQ.… » ; d'anciennes clés en « AIza… » restent aussi valables, colle-la telle quelle).</li>
                  <li style={S.orderedItem}>Colle-la ci-dessous, puis teste-la.</li>
                </>
              ) : (
                <>
                  <li style={S.orderedItem}>Ouvre la console Anthropic (bouton ci-dessous) et connecte-toi.</li>
                  <li style={S.orderedItem}>Clique sur « Create Key ».</li>
                  <li style={S.orderedItem}>Copie la clé qui apparaît (elle commence par « sk-ant-… »).</li>
                  <li style={S.orderedItem}>Colle-la ci-dessous, puis teste-la.</li>
                </>
              )}
            </ol>

            <a href={setupUrl} target="_blank" rel="noreferrer" style={{ textDecoration: "none" }}>
              <button type="button" style={{ ...S.actionBtn, marginTop: 4 }}>
                Ouvrir {provider === "gemini" ? "Google AI Studio" : "la console Anthropic"} <ExternalLink size={14} />
              </button>
            </a>

            <label style={{ ...S.fieldLabel, marginTop: 16 }}>Ta clé API</label>
            <input
              type="password"
              value={keyInput}
              onChange={(e) => { setKeyInput(e.target.value); setTestResult(null); }}
              placeholder={keyPlaceholder}
              style={S.apiKeyInput}
              autoComplete="off"
            />
            <div style={S.apiKeyHint}>
              Ta clé reste uniquement sur cet appareil (stockage local du navigateur) et n'est envoyée qu'à l'API {provider === "gemini" ? "de Google" : "d'Anthropic"} directement.
            </div>

            <button
              type="button"
              onClick={handleTest}
              disabled={!keyInput.trim() || testing}
              style={{ ...S.actionBtn, ...S.actionBtnSecondary, marginTop: 12, opacity: !keyInput.trim() || testing ? 0.5 : 1 }}
            >
              {testing ? (
                <><Loader2 size={15} style={{ animation: "spin 1s linear infinite" }} /> Test en cours…</>
              ) : (
                <>Tester ma clé</>
              )}
            </button>

            {testResult && (
              testResult.ok ? (
                <div style={S.statusOk}>
                  <Check size={14} /> Ça fonctionne !
                  {testResult.model && (
                    <span style={{ opacity: 0.7 }}> · {formatGeminiModelLabel(testResult.model)}</span>
                  )}
                </div>
              ) : (
                <div style={S.statusErr}>
                  <AlertCircle size={14} /> {friendlyKeyTestError(testResult.error)}
                  <div style={{ fontSize: 11, opacity: 0.7, marginTop: 4, wordBreak: "break-word" }}>
                    Détail technique : {testResult.error}
                  </div>
                </div>
              )
            )}

            <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
              <button onClick={() => setStep(1)} style={S.smallLink}>← Retour</button>
              <button
                onClick={handleFinish}
                disabled={!testResult?.ok}
                style={{ ...S.submit, marginTop: 0, flex: 1, opacity: testResult?.ok ? 1 : 0.4 }}
              >
                Terminer <Check size={16} />
              </button>
            </div>
            {!testResult?.ok && (
              <button onClick={handleFinish} style={{ ...S.smallLink, marginTop: 10 }}>
                Configurer plus tard sans tester
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}

/* ------------------------------ Settings modal ----------------------------- */

function SettingsModal({ config, onClose, onSave, onResetApp }) {
  const [firstName, setFirstName] = useState(config.firstName || "");
  const [provider, setProvider] = useState(config.provider || "gemini");
  const [geminiKey, setGeminiKey] = useState(config.geminiKey || "");
  const [anthropicKey, setAnthropicKey] = useState(config.anthropicKey || "");
  const [testing, setTesting] = useState(""); // "" | "gemini" | "claude"
  const [results, setResults] = useState({}); // { gemini: {ok,error}, claude: {...} }
  const [confirmReset, setConfirmReset] = useState(false);

  async function handleTest(p) {
    const key = p === "claude" ? anthropicKey : geminiKey;
    if (!key.trim()) return;
    setTesting(p);
    const res = await testApiKey(p, key.trim());
    setResults((r) => ({ ...r, [p]: res }));
    setTesting("");
  }

  function handleSave() {
    onSave({ firstName: firstName.trim() || "toi", provider, geminiKey: geminiKey.trim(), anthropicKey: anthropicKey.trim() });
  }

  return (
    <div style={S.overlayBackdrop}>
      <div style={{ ...S.panel, width: "100%", maxWidth: 460, maxHeight: "88vh", overflowY: "auto", position: "relative" }}>
        <button onClick={onClose} style={S.closeX} aria-label="Fermer"><X size={16} /></button>

        <div style={S.eyebrow}>Réglages</div>
        <div style={S.landingTitle}>Ton compte</div>

        <div style={S.settingsSection}>
          <label style={S.fieldLabel}>Prénom</label>
          <input type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} style={S.apiKeyInput} />
        </div>

        <div style={S.settingsSection}>
          <div style={S.settingsSectionTitle}>Fournisseur d'IA par défaut</div>
          <div style={S.styleRow}>
            <button
              onClick={() => setProvider("gemini")}
              style={{ ...S.styleBtn, ...(provider === "gemini" ? S.styleBtnActive : {}) }}
            >
              <div style={{ fontWeight: 600, fontSize: 13 }}>Gemini</div>
              <div style={{ fontSize: 11, color: "#6B5F53", marginTop: 2 }}>Gratuit</div>
            </button>
            <button
              onClick={() => setProvider("claude")}
              style={{ ...S.styleBtn, ...(provider === "claude" ? S.styleBtnActive : {}) }}
            >
              <div style={{ fontWeight: 600, fontSize: 13 }}>Claude</div>
              <div style={{ fontSize: 11, color: "#6B5F53", marginTop: 2 }}>Clé perso</div>
            </button>
          </div>
        </div>

        <div style={S.settingsSection}>
          <div style={S.settingsSectionTitle}>Clé API Gemini</div>
          <input
            type="password" value={geminiKey}
            onChange={(e) => { setGeminiKey(e.target.value); setResults((r) => ({ ...r, gemini: null })); }}
            placeholder="Colle ta clé Gemini ici" style={S.apiKeyInput} autoComplete="off"
          />
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 8 }}>
            <button
              type="button" onClick={() => handleTest("gemini")}
              disabled={!geminiKey.trim() || testing === "gemini"}
              style={{ ...S.smallLink, opacity: !geminiKey.trim() || testing === "gemini" ? 0.5 : 1 }}
            >
              {testing === "gemini" ? "Test…" : "Tester"}
            </button>
            <a href="https://aistudio.google.com/apikey" target="_blank" rel="noreferrer" style={S.smallLink}>
              Obtenir une clé gratuite <ExternalLink size={11} />
            </a>
          </div>
          {results.gemini && (
            results.gemini.ok
              ? (
                <div style={S.statusOk}>
                  <Check size={14} /> Ça fonctionne !
                  {results.gemini.model && (
                    <span style={{ opacity: 0.7 }}> · {formatGeminiModelLabel(results.gemini.model)}</span>
                  )}
                </div>
              )
              : <div style={S.statusErr}><AlertCircle size={14} /> {friendlyKeyTestError(results.gemini.error)}</div>
          )}
        </div>

        <div style={S.settingsSection}>
          <div style={S.settingsSectionTitle}>Clé API Anthropic (Claude, optionnel)</div>
          <input
            type="password" value={anthropicKey}
            onChange={(e) => { setAnthropicKey(e.target.value); setResults((r) => ({ ...r, claude: null })); }}
            placeholder="sk-ant-…" style={S.apiKeyInput} autoComplete="off"
          />
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 8 }}>
            <button
              type="button" onClick={() => handleTest("claude")}
              disabled={!anthropicKey.trim() || testing === "claude"}
              style={{ ...S.smallLink, opacity: !anthropicKey.trim() || testing === "claude" ? 0.5 : 1 }}
            >
              {testing === "claude" ? "Test…" : "Tester"}
            </button>
            <a href="https://console.anthropic.com/settings/keys" target="_blank" rel="noreferrer" style={S.smallLink}>
              Obtenir une clé <ExternalLink size={11} />
            </a>
          </div>
          {results.claude && (
            results.claude.ok
              ? <div style={S.statusOk}><Check size={14} /> Ça fonctionne !</div>
              : <div style={S.statusErr}><AlertCircle size={14} /> {friendlyKeyTestError(results.claude.error)}</div>
          )}
        </div>

        <button onClick={handleSave} style={S.submit}>Enregistrer</button>

        <div style={{ marginTop: 18, textAlign: "center" }}>
          {!confirmReset ? (
            <button onClick={() => setConfirmReset(true)} style={{ ...S.smallLink, color: "#8C4632" }}>
              Réinitialiser l'app (efface tout localement)
            </button>
          ) : (
            <div>
              <div style={{ fontSize: 12, color: "#6B5F53", marginBottom: 8 }}>
                Ça efface ton prénom et tes clés de cet appareil. Confirmer ?
              </div>
              <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
                <button onClick={() => setConfirmReset(false)} style={S.smallLink}>Annuler</button>
                <button onClick={onResetApp} style={{ ...S.smallLink, color: "#8C4632", fontWeight: 700 }}>Oui, réinitialiser</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------ Subcomponents ----------------------------- */

function Divider() {
  return (
    <div style={S.divider}>
      <span style={S.dividerLine} /> <span style={S.dividerDot}>◆</span> <span style={S.dividerLine} />
    </div>
  );
}

function ReportPage({ icon, title, children }) {
  return (
    <div style={S.page} className="cra-page">
      <div className="cra-page-head">
        {icon && (
          <div style={S.iconCircle}>
            <span style={{ fontSize: 24 }}>{icon}</span>
          </div>
        )}
        {title && <div style={S.pageTitle}>{title}</div>}
        <Divider />
      </div>
      <div>{children}</div>
    </div>
  );
}

function Stars({ value }) {
  const v = Math.max(0, Math.min(5, value || 0));
  return (
    <span style={S.stars}>
      {"★".repeat(v)}
      <span style={{ opacity: 0.25 }}>{"★".repeat(5 - v)}</span>
    </span>
  );
}

function Bubble({ author, children }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
      {author && <div style={S.bubbleAuthor}>{author}</div>}
      <div style={S.bubble}>
        <span>{children}</span>
        <span style={S.bubbleCheck}>✓✓</span>
      </div>
    </div>
  );
}

/* --------------------------------- Styles -------------------------------- */
/* Every style below this line, up to the closing brace, is byte-for-byte
   identical to the previous version — nothing about the existing look was
   touched. New keys used by onboarding / settings / progress are appended
   at the very end of the object. */

const S = {
  root: {
    minHeight: "100vh",
    background: "#FBF6ED",
    color: "#26201B",
    fontFamily: "'Inter', sans-serif",
    padding: "24px 16px 64px",
    display: "flex",
    justifyContent: "center",
  },
  shell: { width: "100%", maxWidth: 600 },

  topBar: {
    display: "flex", alignItems: "center", justifyContent: "space-between",
    marginBottom: 22, gap: 10, flexWrap: "wrap",
  },
  brandRow: { display: "flex", alignItems: "center", gap: 12 },
  avatar: {
    width: 44, height: 44, borderRadius: "50%", flexShrink: 0,
    background: "linear-gradient(150deg, #2A211B, #4A362A)",
    display: "flex", alignItems: "center", justifyContent: "center",
    boxShadow: "0 6px 16px -6px rgba(38,32,27,0.5)",
  },
  avatarGlyph: { width: 27, height: "auto", display: "block", objectFit: "contain" },
  brand: { fontFamily: "'Fraunces', serif", fontStyle: "italic", fontWeight: 600, fontSize: 20, lineHeight: 1.1 },
  brandSub: { fontSize: 11.5, color: "#6B5F53", marginTop: 2 },
  topBtn: {
    display: "inline-flex", alignItems: "center", gap: 6, background: "#26201B", color: "#FFF8F0",
    border: "none", padding: "10px 16px", borderRadius: 999, fontSize: 12.5, fontWeight: 600, cursor: "pointer",
  },

  panel: {
    background: "#FFFDF9", border: "1px solid rgba(38,32,27,0.08)", borderRadius: 22,
    padding: "28px 24px", boxShadow: "0 28px 54px -34px rgba(38,32,27,0.35)",
  },
  eyebrow: {
    fontFamily: "'JetBrains Mono', monospace", fontSize: 10.5, letterSpacing: "0.18em",
    textTransform: "uppercase", color: "#C9654A", marginBottom: 10, fontWeight: 600,
  },
  landingTitle: {
    fontFamily: "'Fraunces', serif", fontStyle: "italic", fontWeight: 600, fontSize: 27,
    lineHeight: 1.2, marginBottom: 10,
  },
  landingSub: { fontSize: 13.5, color: "#6B5F53", lineHeight: 1.55, marginBottom: 22 },

  uploadZone: {
    border: "1.5px dashed rgba(38,32,27,0.22)", borderRadius: 14, padding: "20px 16px", textAlign: "center",
  },
  uploadLabel: { fontSize: 14, fontWeight: 600, marginBottom: 10 },
  fileInput: { display: "block", margin: "0 auto" },
  formatsHint: { fontFamily: "'JetBrains Mono', monospace", fontSize: 10.5, color: "#6B5F53", marginTop: 8, opacity: 0.7 },
  fileChip: {
    display: "inline-block", marginTop: 10, fontFamily: "'JetBrains Mono', monospace", fontSize: 11.5,
    background: "#F1E4D0", padding: "4px 10px", borderRadius: 999,
  },
  previewBox: {
    marginTop: 12, textAlign: "left", background: "#F1E4D0", borderRadius: 10, padding: "10px 12px",
  },
  previewLabel: { fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: "#4F7873", fontWeight: 600, marginBottom: 4 },
  previewText: { fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: "#6B5F53", lineHeight: 1.5, wordBreak: "break-word" },
  sep: { textAlign: "center", fontSize: 11, letterSpacing: "0.08em", color: "#6B5F53", opacity: 0.55, margin: "18px 0" },
  textarea: {
    width: "100%", minHeight: 120, resize: "vertical", background: "#FBF6ED",
    border: "1px solid rgba(38,32,27,0.1)", borderRadius: 12, padding: "13px 14px",
    fontFamily: "'JetBrains Mono', monospace", fontSize: 12.5, lineHeight: 1.6, color: "#26201B",
  },
  wordCount: { fontFamily: "'JetBrains Mono', monospace", fontSize: 10.5, color: "#6B5F53", opacity: 0.7, textAlign: "right", marginTop: 4 },
  styleRow: { display: "flex", gap: 10, marginTop: 18 },
  styleBtn: {
    flex: 1, textAlign: "left", border: "1px solid rgba(38,32,27,0.1)", background: "#FBF6ED",
    borderRadius: 12, padding: "11px 13px", cursor: "pointer", fontFamily: "'Inter', sans-serif",
  },
  styleBtnActive: { borderColor: "#C9654A", background: "rgba(201,101,74,0.1)" },
  apiKeyToggle: {
    display: "inline-flex", alignItems: "center", gap: 5, background: "none", border: "none",
    color: "#6B5F53", fontSize: 11.5, fontWeight: 600, cursor: "pointer", padding: 0,
    marginTop: 16, textDecoration: "underline",
  },
  apiKeyBox: { marginTop: 8 },
  apiKeyInput: {
    width: "100%", background: "#FBF6ED", border: "1px solid rgba(38,32,27,0.15)", borderRadius: 10,
    padding: "10px 12px", fontFamily: "'JetBrains Mono', monospace", fontSize: 12.5, color: "#26201B",
  },
  apiKeyHint: { fontSize: 11, color: "#6B5F53", lineHeight: 1.5, marginTop: 6 },
  submit: {
    marginTop: 20, width: "100%", background: "#26201B", color: "#FFF8F0", border: "none",
    padding: 14, fontWeight: 600, fontSize: 14.5, borderRadius: 999, cursor: "pointer",
    display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
  },
  errorBox: {
    marginTop: 14, display: "flex", gap: 8, alignItems: "flex-start", background: "rgba(201,101,74,0.08)",
    border: "1px solid rgba(201,101,74,0.3)", color: "#8C4632", padding: "10px 12px", borderRadius: 10, fontSize: 12.5,
  },
  detailToggle: {
    display: "inline-flex", alignItems: "center", gap: 4, background: "none", border: "none",
    color: "#8C4632", fontSize: 11, fontWeight: 600, cursor: "pointer", padding: 0, textDecoration: "underline",
  },
  detailBox: {
    marginTop: 6, fontFamily: "'JetBrains Mono', monospace", fontSize: 10.5, color: "#6B3A29",
    background: "rgba(201,101,74,0.06)", borderRadius: 8, padding: "8px 10px", wordBreak: "break-word",
  },

  /* --- report pages --- */
  page: {
    padding: "34px 4px", borderBottom: "1px solid rgba(38,32,27,0.08)", textAlign: "center",
  },
  iconCircle: {
    width: 64, height: 64, borderRadius: "50%", background: "#FFFDF9",
    border: "1px solid rgba(38,32,27,0.12)", display: "flex", alignItems: "center", justifyContent: "center",
    margin: "0 auto 18px", boxShadow: "0 10px 22px -14px rgba(38,32,27,0.4)",
  },
  pageTitle: {
    fontFamily: "'Fraunces', serif", fontStyle: "italic", fontWeight: 600, fontSize: 24,
    lineHeight: 1.28, padding: "0 6px",
  },
  coverTitle: {
    fontFamily: "'Fraunces', serif", fontStyle: "italic", fontWeight: 600, fontSize: 27,
    lineHeight: 1.3, padding: "0 4px",
  },
  divider: {
    display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
    margin: "16px 0 22px", color: "#C9654A",
  },
  dividerLine: { width: 26, height: 1, background: "rgba(201,101,74,0.4)", display: "inline-block" },
  dividerDot: { fontSize: 10 },
  body: { fontSize: 15, lineHeight: 1.7, textAlign: "left", color: "#332C25" },

  noteRow: { textAlign: "left", marginBottom: 18, paddingBottom: 16, borderBottom: "1px solid rgba(38,32,27,0.06)" },
  noteHead: { display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 6, gap: 10 },
  noteCat: { fontWeight: 700, fontSize: 14.5 },
  stars: { fontSize: 15, color: "#C99A3D", letterSpacing: 1, whiteSpace: "nowrap" },

  decodeList: { textAlign: "left", listStyle: "none", padding: 0, margin: 0 },
  decodeItem: { fontSize: 14.5, lineHeight: 1.7, paddingBottom: 12, marginBottom: 12, borderBottom: "1px solid rgba(38,32,27,0.06)" },
  decodeTerm: { fontFamily: "'Fraunces', serif", fontStyle: "italic", fontWeight: 600, color: "#C9654A" },

  portrait: { textAlign: "left", marginBottom: 16 },
  portraitName: { fontFamily: "'Fraunces', serif", fontWeight: 600, fontSize: 18, marginBottom: 5 },

  bubble: {
    display: "inline-flex", alignItems: "flex-end", gap: 6, maxWidth: "88%",
    background: "#DCF8C6", color: "#20351C", borderRadius: "14px 14px 3px 14px",
    padding: "10px 12px", fontSize: 14, lineHeight: 1.5, textAlign: "left",
    boxShadow: "0 6px 14px -10px rgba(38,32,27,0.5)",
  },
  bubbleAuthor: { fontSize: 11, color: "#6B5F53", marginBottom: 4, fontWeight: 600 },
  bubbleCheck: { fontSize: 10, color: "#3F94D6", flexShrink: 0 },

  flagName: { fontWeight: 700 },

  award: { textAlign: "left", borderLeft: "3px solid #C99A3D", background: "#FBF6ED", borderRadius: "0 12px 12px 0", padding: "12px 16px", marginBottom: 12 },
  awardTitle: { fontFamily: "'Fraunces', serif", fontStyle: "italic", fontSize: 14, color: "#C99A3D" },
  awardName: { fontWeight: 700, fontSize: 13.5, margin: "2px 0 5px" },

  finalWord: {
    fontFamily: "'Fraunces', serif", fontStyle: "italic", fontSize: 16, lineHeight: 1.6,
    background: "rgba(201,101,74,0.1)", borderRadius: 14, padding: "16px 18px", color: "#6B3A29", textAlign: "left",
  },
  printColophon: {
    marginTop: 16, textAlign: "center", fontFamily: "'JetBrains Mono', monospace", fontSize: 10.5, color: "#6B5F53",
  },
  actionBtn: {
    display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 7,
    background: "#26201B", color: "#FFF8F0", border: "none", padding: 12, borderRadius: 999,
    fontSize: 13, fontWeight: 600, cursor: "pointer", width: "100%",
  },
  actionBtnSecondary: { background: "transparent", color: "#26201B", border: "1px solid rgba(38,32,27,0.18)", marginTop: 10 },
  buildTag: { textAlign: "center", fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: "#6B5F53", opacity: 0.45, marginTop: 22 },

  /* --- new: onboarding / settings / progress (additive only) --- */
  overlayBackdrop: {
    position: "fixed", inset: 0, background: "rgba(38,32,27,0.6)", display: "flex",
    alignItems: "center", justifyContent: "center", padding: 16, zIndex: 60,
  },
  stepDots: { display: "flex", gap: 6, justifyContent: "center", marginBottom: 18 },
  stepDot: { width: 6, height: 6, borderRadius: "50%", background: "rgba(38,32,27,0.15)" },
  stepDotActive: { background: "#C9654A", width: 18 },
  fieldLabel: { display: "block", fontSize: 11.5, fontWeight: 600, color: "#6B5F53", marginBottom: 6, marginTop: 4 },
  statusOk: {
    display: "flex", alignItems: "center", gap: 6, color: "#3D7A56", fontSize: 12.5, fontWeight: 600, marginTop: 10,
  },
  statusErr: {
    display: "flex", alignItems: "center", gap: 6, color: "#8C4632", fontSize: 12.5, fontWeight: 600, marginTop: 10,
  },
  orderedList: { textAlign: "left", paddingLeft: 20, margin: "0 0 18px", color: "#332C25" },
  orderedItem: { fontSize: 13.5, lineHeight: 1.6, marginBottom: 6 },
  gearBtn: {
    display: "inline-flex", alignItems: "center", justifyContent: "center", width: 36, height: 36,
    background: "#FFFDF9", border: "1px solid rgba(38,32,27,0.12)", borderRadius: "50%", cursor: "pointer", color: "#26201B",
  },
  closeX: {
    position: "absolute", top: 18, right: 18, background: "none", border: "none", cursor: "pointer",
    color: "#6B5F53", padding: 4,
  },
  settingsSection: { marginTop: 18, paddingTop: 18, borderTop: "1px solid rgba(38,32,27,0.08)" },
  settingsSectionTitle: { fontSize: 12.5, fontWeight: 700, marginBottom: 10 },
  smallLink: {
    display: "inline-flex", alignItems: "center", gap: 4, background: "none", border: "none",
    color: "#6B5F53", fontSize: 11.5, fontWeight: 600, cursor: "pointer", padding: "8px 0", textDecoration: "underline",
  },
  chunkHint: { color: "#C9654A" },
  progressTrack: {
    marginTop: 10, height: 4, background: "rgba(38,32,27,0.08)", borderRadius: 999, overflow: "hidden",
  },
  progressFill: { height: "100%", background: "#C9654A", transition: "width 0.4s ease" },
};
