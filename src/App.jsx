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
      "Tu es TheCrazyAnalyst, une IA qui lit des conversations de groupe ou privées et livre un rapport-roast complet, à la première personne, dans le style d'une longue chronique éditoriale mordante façon 'la Yelp review de votre relation' : plusieurs parties distinctes, chacune avec son propre titre accrocheur et un vrai développement (plusieurs phrases, pas une seule ligne). Ton ton : mordant, très direct, drôle, familier, tu tutoies et interpelles les gens par leur prénom, tu enchaînes les formules qui marquent. Tu t'appuies systématiquement sur des détails précis et des citations exactes tirées de la conversation pour appuyer chaque observation — plus tu cites, plus c'est crédible et drôle. Tu n'es jamais méchant gratuitement : sous le roast, il y a une vraie observation psychologique, parfois touchante. Reste en français, style oral, rythmé, plein de formules choc, avec quelques emojis bien placés (jamais dans les citations exactes). Chaque champ texte doit être développé (plusieurs phrases riches), car ce rapport doit se lire comme plusieurs pages, pas comme un résumé.",
  },
  neutral: {
    label: "Introspectif",
    desc: "Plus posé, plus profond, moins de vanne",
    system:
      "Tu es TheCrazyAnalyst, une IA qui lit des conversations de groupe ou privées et livre un rapport complet et honnête, à la première personne, dans le style d'une longue chronique éditoriale posée mais incisive : plusieurs parties distinctes, chacune avec son propre titre et un vrai développement (plusieurs phrases, pas une seule ligne). Ton ton : posé, observateur, sincère, parfois émouvant, tu tutoies et interpelles les gens par leur prénom. Tu t'appuies systématiquement sur des détails précis et des citations exactes tirées de la conversation. Reste en français, avec quelques emojis discrets et bien choisis (jamais dans les citations exactes). Chaque champ texte doit être développé (plusieurs phrases riches), car ce rapport doit se lire comme plusieurs pages, pas comme un résumé.",
  },
};

const SCHEMA = `Réponds UNIQUEMENT avec un objet JSON valide, sans texte avant/après, sans markdown. Forme exacte :
{
  "ouverture": "un paragraphe de 3-5 phrases, façon 'Bon. J'ai lu. J'ai TOUT lu.' qui annonce le nombre approximatif de messages lus, plante le décor, pose le ton avec humour et une pointe de suspense sur ce qui va suivre, à la première personne de TheCrazyAnalyst",
  "verdict": "une phrase choc de moins de 8 mots qui résume la relation ou le groupe, façon titre de couverture de magazine",
  "notes": [{"categorie": "nom court d'une catégorie notée, ex: Communication, Ambiance, Ponctualité, Fidélité au groupe, Investissement émotionnel", "etoiles": nombre entier de 1 à 5, "commentaire": "2-3 phrases développées qui justifient la note avec un détail précis et si possible une allusion à un échange réel"}],
  "decodeur_titre": "le titre de la section lexique (façon 'Le décodeur : ...'), à INVENTER entièrement à partir du vocabulaire, des surnoms ou du ton réels de CETTE conversation précise — jamais la même formule d'une conversation à l'autre, jamais générique",
  "decodeur_intro": "1-2 phrases qui introduisent cette section lexique avec humour, écrites spécifiquement pour cette conversation (peuvent citer un mot ou un ton caractéristique du groupe), jamais une formule toute faite recyclable telle quelle pour n'importe quelle autre conversation",
  "decodeur": [{"terme": "mot, surnom ou expression récurrente trouvée EXACTEMENT dans la conversation", "definition": "traduction ironique et développée (1-2 phrases), avec une pointe d'humour ou d'observation"}],
  "structure": "un texte de 4-6 phrases sur la dynamique réelle du groupe ou de la relation : qui mène, qui répond à qui, rapports de force, rituels, habitudes récurrentes, avec des exemples concrets tirés de la conversation",
  "paradoxe": {"titre": "un titre de section accrocheur façon 'Le paradoxe que personne d'autre ne vous dira', spécifique à cette conversation", "texte": "3-5 phrases qui pointent une vraie contradiction ou un contraste frappant dans le comportement du groupe ou de la relation (ex : tendresse vs vannes, sérieux vs délire, generosité vs mauvaise foi), illustré par un exemple concret"},
  "portraits": [{"nom": "prénom exact trouvé dans la conversation", "roast": "3-4 phrases développées qui interpellent cette personne directement (tutoiement), basées sur plusieurs comportements observés, avec au moins une touche d'humour et une touche plus sincère"}],
  "extraits": [{"citation": "une courte citation EXACTE tirée du texte fourni (moins de 20 mots, reproduite mot pour mot)", "auteur": "prénom exact de la personne qui a écrit ce message", "commentaire": "1-2 phrases de commentaire de TheCrazyAnalyst sur cet extrait, avec humour ou finesse"}],
  "moment_cle": {"titre": "un titre de section façon 'La conversation que vous avez vraiment eue', qui évoque un moment marquant identifiable dans les échanges (une bascule de ton, une confidence, une dispute, une réconciliation)", "texte": "4-6 phrases qui racontent ce moment précis, pourquoi il compte, ce qu'il révèle sur la relation ou le groupe, sans being trop intrusif sur des détails très privés — reste évocateur plutôt que voyeuriste si le sujet est sensible", "citation": "une citation EXACTE et courte (moins de 20 mots) tirée de ce moment, ou vide si aucune ne convient", "auteur": "prénom exact de l'auteur de cette citation, ou vide"},
  "drapeaux_rouges": [{"nom": "prénom exact", "texte": "2-3 phrases qui pointent un vrai travers observé dans la conversation, avec bienveillance mais sans filtre, si possible avec un exemple précis"}],
  "drapeaux_verts": "un texte de 4-6 phrases sur ce qui fonctionne vraiment bien dans cette relation ou ce groupe, basé sur plusieurs preuves concrètes tirées de la conversation, avec une conclusion sincère",
  "palmares": [{"titre": "nom d'un prix inventé, ironique et spécifique à cette conversation", "nom": "prénom exact", "raison": "1-2 phrases qui justifient ce prix avec un détail précis et si possible drôle"}],
  "mot_de_la_fin": "un texte de 3-5 phrases, personnel, signé par TheCrazyAnalyst, qui conclut sur une note à la fois honnête et chaleureuse"
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
const SAFE_INPUT_TOKENS = 200000; // stays well under both the free Gemini tier's TPM and any model's context window
const CHUNK_CHAR_SIZE = Math.floor(SAFE_INPUT_TOKENS * CHARS_PER_TOKEN); // ~700 000 characters per call

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
  "Tu es TheCrazyAnalyst en train de lire une conversation très longue, découpée en plusieurs parties pour pouvoir la traiter dans son intégralité. Ton travail ici n'est PAS d'écrire le rapport final : c'est d'extraire, avec précision, la matière brute (citations exactes, observations, moments) qui servira à écrire ce rapport plus tard, en te basant uniquement sur l'extrait de conversation fourni. Sois rigoureux : toute citation doit être recopiée mot pour mot, jamais inventée ni reformulée.\n\n" +
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

const BUILD_TAG = "v15.2 — fix: retry auto sur réponse vide (MAX_TOKENS/thinking) + abandon explicite si l'extraction échoue au lieu d'un rapport inventé";

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
  if (/embedding|aqa|vision|image|imagen|veo|tts|audio|video|gemma|learnlm|robotics|computer-use|flash-8b|flash-lite/i.test(id)) return -1;
  const tier = /-pro/.test(id) ? 3 : /-flash/.test(id) ? 2 : 1;
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

    if (res.status === 400 || res.status === 403) {
      const bodyText = await res.text().catch(() => "");
      throw new Error(`invalid-key: ${bodyText.slice(0, 300)}`);
    }

    if (res.status === 429 || res.status === 503) {
      const bodyText = await res.text().catch(() => "");
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
  for (let i = 0; i < chunks.length; i++) {
    onProgress?.({ phase: "mapping", current: i + 1, total: chunks.length });
    const memoryBlock = memory
      ? `Mémoire de ce qu'on sait déjà de cette conversation avant cet extrait :\n${memory}\n\n`
      : "Aucune mémoire précédente : c'est le tout début de la conversation.\n\n";
    const userContent = `${memoryBlock}Partie ${i + 1}/${chunks.length} de la conversation (ordre chronologique) :\n\n${chunks[i]}`;

    let parsed;
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
      if (String(err.message || err).startsWith("no-api-key") || String(err.message || err).startsWith("invalid-key")) {
        throw err; // no point continuing without a working key
      }
      // A single chunk that fails to parse shouldn't sink the whole analysis
      // on its own: carry the memory forward and keep going with a thinner
      // extraction — but this failure IS tracked below and, if it happens
      // too often, the whole run is aborted instead of quietly writing a
      // report on top of missing material (see check after the loop).
      failedChunks += 1;
      parsed = {
        resume_cumulatif: memory, citations_marquantes: [], observations_personnes: [],
        expressions_recurrentes: [], moments_notables: [], ambiance_generale: "",
      };
    }

    const gotNothing =
      (parsed.citations_marquantes?.length || 0) === 0 &&
      (parsed.observations_personnes?.length || 0) === 0 &&
      (parsed.moments_notables?.length || 0) === 0 &&
      !parsed.ambiance_generale?.trim();
    if (gotNothing) emptyChunks += 1;

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
  if (totalCitations === 0 || brokenChunks === chunks.length) {
    throw new Error(
      `extraction-empty: aucune matière réelle n'a pu être extraite de la conversation ` +
      `(${brokenChunks}/${chunks.length} parties en échec ou vides). Le rapport n'a pas été généré ` +
      `pour éviter d'inventer du contenu à la place.`
    );
  }
  if (brokenChunks / chunks.length > 0.5) {
    throw new Error(
      `extraction-partial: plus de la moitié des parties de la conversation (${brokenChunks}/${chunks.length}) ` +
      `n'ont pas pu être lues correctement. Le rapport n'a pas été généré pour éviter qu'il soit incomplet ou inventé.`
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
      } else if (hardCapMatch) {
        const resetTxt = formatResetTime(Number(hardCapMatch[1]));
        setError(
          `Ta clé API a atteint sa limite de quota${resetTxt ? ` (réinitialisation prévue le ${resetTxt})` : ""}. ` +
          `Vérifie ton compte, ou patiente un peu avant de relancer.`
        );
      } else {
        setError(
          msg.includes("rate-limited")
            ? "Le fournisseur d'IA reçoit trop de demandes d'un coup (limite du palier gratuit). Patiente une minute et relance."
            : msg.startsWith("extraction-empty")
            ? "L'IA n'a réussi à lire aucun contenu réel de ta conversation (erreur technique pendant l'analyse). Le rapport n'a volontairement pas été généré pour éviter qu'il soit inventé — réessaie, et si ça persiste, essaie avec l'autre fournisseur (Claude/Gemini) dans les réglages."
            : msg.startsWith("extraction-partial")
            ? "Plus de la moitié de ta conversation n'a pas pu être lue correctement. Le rapport n'a volontairement pas été généré pour éviter qu'il soit incomplet ou inventé — réessaie."
            : msg.startsWith("attempt1-call-failed") || msg.startsWith("attempt2-call-failed")
            ? "L'appel à l'IA a échoué (réseau, ou clé invalide). Regarde le détail technique ci-dessous."
            : msg.startsWith("attempt1-truncated")
            ? "La réponse a été coupée avant la fin. Réessaie — si ça persiste, le souci n'est pas la taille."
            : msg.startsWith("both-attempts-failed")
            ? "Le modèle n'a pas renvoyé de JSON exploitable, même après une tentative de correction automatique. Regarde le détail technique."
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
        link.download = `TheCrazyAnalyst - ${slug}.pdf`;
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

  let submitLabel = "TheCrazyAnalyst lit tout ça…";
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
              <span style={S.avatarGlyph}>C</span>
            </div>
            <div>
              <div style={S.brand}>TheCrazyAnalyst</div>
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
              Dépose l'export d'une conversation (groupe ou privée) et TheCrazyAnalyst te livre son avis complet, sans filtre, partie par partie.
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
                Rapport généré par TheCrazyAnalyst — {new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
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
              TheCrazyAnalyst lit tes conversations grâce à une intelligence artificielle. Pour fonctionner, il lui faut ta propre clé API — un peu comme un badge d'accès à ton nom.
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
  avatarGlyph: { fontFamily: "'Fraunces', serif", fontStyle: "italic", fontWeight: 600, fontSize: 20, color: "#F4C88B" },
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
