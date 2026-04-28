#!/usr/bin/env node
/* ============================================================
 * build.js — partycrew.app Production Build
 *
 * Was es tut:
 *   1. Liest app.html (Single-File-PWA)
 *   2. Findet alle <script>-Blöcke OHNE src
 *   3. Minify + Obfuskiert deren Inhalt
 *   4. Minify das gesamte HTML (whitespace, comments)
 *   5. Schreibt nach dist/app.html
 *
 * Abhängigkeiten:
 *   npm install
 *
 * Verwendung:
 *   node build.js [pfad/zu/app.html]
 *
 * Standardpfad: ../app.html
 * ============================================================ */

const fs = require('fs');
const path = require('path');
const { minify: minifyJs } = require('terser');
const Obfuscator = require('javascript-obfuscator');
const { minify: minifyHtml } = require('html-minifier-terser');
const { JSDOM } = require('jsdom');

const SRC = process.argv[2] || path.resolve(__dirname, '..', 'app.html');
const OUT_DIR = path.resolve(__dirname, '..', 'dist');
const OUT = path.join(OUT_DIR, 'app.html');

// Obfuskations-Level — kannst du runter drehen wenn die App Bugs zeigt
// "low" = nur Minify, "medium" = + String-Encryption, "high" = + Control-Flow
const OBFUSCATION_LEVEL = process.env.OBF_LEVEL || 'medium';

const obfuscatorOptions = {
  low: {
    compact: true,
    controlFlowFlattening: false,
    deadCodeInjection: false,
    stringArray: false,
    rotateStringArray: false,
    selfDefending: false,
    splitStrings: false,
    transformObjectKeys: false,
    unicodeEscapeSequence: false,
  },
  medium: {
    compact: true,
    controlFlowFlattening: false,
    deadCodeInjection: false,
    stringArray: true,
    stringArrayEncoding: ['base64'],
    stringArrayThreshold: 0.5,
    rotateStringArray: true,
    shuffleStringArray: true,
    splitStrings: true,
    splitStringsChunkLength: 10,
    identifierNamesGenerator: 'mangled-shuffled',
    selfDefending: false,
    transformObjectKeys: false,
    unicodeEscapeSequence: false,
    target: 'browser',
  },
  high: {
    compact: true,
    controlFlowFlattening: true,
    controlFlowFlatteningThreshold: 0.5,
    deadCodeInjection: true,
    deadCodeInjectionThreshold: 0.3,
    stringArray: true,
    stringArrayEncoding: ['rc4'],
    stringArrayThreshold: 0.8,
    rotateStringArray: true,
    shuffleStringArray: true,
    splitStrings: true,
    splitStringsChunkLength: 5,
    identifierNamesGenerator: 'mangled-shuffled',
    selfDefending: true,
    transformObjectKeys: true,
    target: 'browser',
  },
};

const opts = obfuscatorOptions[OBFUSCATION_LEVEL] || obfuscatorOptions.medium;
console.log(`[build] Obfuscation-Level: ${OBFUSCATION_LEVEL}`);

(async () => {
  if (!fs.existsSync(SRC)) {
    console.error(`[build] ERROR: ${SRC} nicht gefunden`);
    process.exit(1);
  }
  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

  const html = fs.readFileSync(SRC, 'utf8');
  console.log(`[build] Lese ${SRC} (${(html.length/1024).toFixed(1)} KB)`);

  // 1. Inline-Scripts extrahieren via JSDOM
  const dom = new JSDOM(html);
  const doc = dom.window.document;
  const scripts = doc.querySelectorAll('script:not([src])');
  console.log(`[build] Gefunden: ${scripts.length} Inline-Script-Block(s)`);

  let processed = 0;
  for (const s of scripts) {
    const code = s.textContent;
    if (!code || !code.trim()) continue;
    // Modul-Scripts (type="module") nicht obfuscaten — kann brechen
    const isModule = (s.getAttribute('type') || '').toLowerCase() === 'module';

    try {
      // Erst Terser-Minify
      const minified = await minifyJs(code, {
        compress: { drop_console: true, drop_debugger: true, passes: 2 },
        mangle: { toplevel: false },
        format: { comments: false },
      });
      let result = minified.code || code;

      // Dann Obfuscator (außer bei Modulen oder bei "low")
      if (!isModule && OBFUSCATION_LEVEL !== 'low') {
        const obf = Obfuscator.obfuscate(result, opts);
        result = obf.getObfuscatedCode();
      }

      s.textContent = result;
      processed++;
    } catch (err) {
      console.warn(`[build] WARN: Script konnte nicht verarbeitet werden — bleibt im Original.`);
      console.warn(`        Grund: ${err.message}`);
    }
  }
  console.log(`[build] Verarbeitet: ${processed} Scripts`);

  // 2. HTML-Minify
  let outHtml = dom.serialize();
  outHtml = await minifyHtml(outHtml, {
    collapseWhitespace: true,
    removeComments: true,
    removeRedundantAttributes: true,
    removeScriptTypeAttributes: false,  // type="module" muss bleiben
    removeStyleLinkTypeAttributes: true,
    minifyCSS: true,
    minifyJS: false, // wir haben das schon gemacht
    useShortDoctype: true,
  });

  fs.writeFileSync(OUT, outHtml);
  const before = (html.length / 1024).toFixed(1);
  const after = (outHtml.length / 1024).toFixed(1);
  const ratio = ((1 - outHtml.length / html.length) * 100).toFixed(1);
  console.log(`[build] DONE: ${SRC} → ${OUT}`);
  console.log(`        ${before} KB → ${after} KB (-${ratio}%)`);
})();
