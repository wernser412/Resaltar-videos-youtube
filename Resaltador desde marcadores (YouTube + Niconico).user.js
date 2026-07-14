// ==UserScript==
// @name         Resaltador desde marcadores (YouTube + Niconico)
// @namespace    http://tampermonkey.net/
// @version      2026.07.14
// @description  Resalta videos + velocidad + volumen 300%
// @author       wernser412
// @icon         https://github.com/wernser412/Resaltar-videos-youtube/raw/refs/heads/main/ICONO.ico
// @downloadURL  https://github.com/wernser412/Resaltar-videos-youtube/raw/refs/heads/main/YouTube%20-%20Resaltador%20desde%20marcadores%20de%20Chrome.user.js
// @match        https://www.youtube.com/*
// @match        https://youtube.com/*
// @match        https://www.nicovideo.jp/*
// @match        https://nico.ms/*
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_registerMenuCommand
// @grant        GM_addStyle
// @run-at       document-idle
// ==/UserScript==

(function () {

'use strict';

/* ============================ */

let urls = [];

let idsYT = new Set();

let idsNico = new Set();

/* ============================ PANEL */

let vhPanel;

let vhFab;

let vhBody;

let vhObserver;

let vhWatchdogTimer;

/* ============================ CONFIG */

const MENU_VISIBLE_KEY = "vh_menu_visible";

const HIGHLIGHT_STYLE_ID = "vh-highlight-style";

const UI_STYLE_ID = "vh-ui-style";

// Estado de visibilidad mantenido en memoria (se carga una sola vez al
// arrancar y solo se modifica al hacer click en el menú de Tampermonkey).
// Evita releer storage repetidamente, que era la causa de que el botón
// "reapareciera solo" tras ocultarlo.
let vhVisibleState = false;

/* ============================ VOLUMEN */

let ctx, gainNode;

let connectedVideo = null; // video actualmente conectado al AudioContext

let vhSlider, vhLabel;

const VOL_KEY = "vh_volume";

/* ============================ VELOCIDAD */

const SPEEDS = [1, 1.5, 2];

let speedIndex = 0;

/* ============================ DETECCIÓN */

const isYT = () =>
    location.hostname.includes("youtube.com");

const isNico = () =>
    location.hostname.includes("nicovideo.jp") ||
    location.hostname.includes("nico.ms");

/* ============================ IDS */

function getYTid(url) {

    try {

        const u = new URL(url);

        if (u.hostname === "youtu.be")
            return u.pathname.slice(1);

        if (u.pathname.startsWith("/shorts/"))
            return u.pathname.split("/")[2];

        return u.searchParams.get("v");

    } catch {

        return null;
    }
}

function getNicoId(url) {

    try {

        const u = new URL(url);

        if (u.hostname.includes("nico.ms"))
            return u.pathname.slice(1);

        const m =
            u.pathname.match(
                /\/watch\/([a-z]{2}\d+)/
            );

        return m ? m[1] : null;

    } catch {

        return null;
    }
}

/* ============================ BUILD */

function rebuild() {

    idsYT.clear();

    idsNico.clear();

    urls.forEach(u => {

        const yt =
            getYTid(u);

        const ni =
            getNicoId(u);

        if (yt)
            idsYT.add(yt);

        if (ni)
            idsNico.add(ni);
    });
}

/* ============================ IMPORT */

function extractAll(html) {

    const yt =
        html.match(
            /https:\/\/(?:www\.)?(?:youtube\.com\/watch\?v=[\w-]+|youtu\.be\/[\w-]+)/gi
        ) || [];

    const ni =
        html.match(
            /https:\/\/(?:www\.)?(?:nicovideo\.jp\/watch\/[a-z]{2}\d+|nico\.ms\/[a-z]{2}\d+)/gi
        ) || [];

    return [...new Set([...yt, ...ni])];
}

async function importHTML() {

    const input =
        document.createElement("input");

    input.type = "file";

    input.accept = ".html";

    input.onchange = async () => {

        if (!input.files.length)
            return;

        const html =
            await input.files[0].text();

        const found =
            extractAll(html);

        if (!found.length) {

            alert(
                "❌ No se encontraron videos"
            );

            return;
        }

        urls = [
            ...new Set([
                ...urls,
                ...found
            ])
        ];

        await GM_setValue(
            "vh_urls",
            urls
        );

        rebuild();

        refresh();

        alert(
            `✅ ${found.length} videos importados`
        );
    };

    input.click();
}

/* ============================ LIMPIAR BOOKMARKS */

async function clearBookmarks() {

    const ok = confirm(
        "⚠️ ¿Eliminar todos los bookmarks importados?"
    );

    if (!ok)
        return;

    urls = [];

    idsYT.clear();

    idsNico.clear();

    await GM_setValue(
        "vh_urls",
        []
    );

    refresh();

    alert(
        "🗑 Bookmarks eliminados"
    );
}

/* ============================ RESALTAR */

function highlightYT() {

    document.querySelectorAll(
        'a[href*="watch?v="], a[href*="youtu.be/"]'
    ).forEach(a => {

        if (
            a.closest('ytd-comments') ||
            a.closest('#comments') ||
            a.closest(
                'ytd-comment-thread-renderer'
            )
        ) return;

        const id =
            getYTid(a.href);

        if (
            id &&
            idsYT.has(id)
        ) {

            a.classList.add("vh-h");
        }
    });

    document
        .querySelectorAll(".vh-title")
        .forEach(el =>
            el.classList.remove("vh-title")
        );

    const id =
        getYTid(location.href);

    if (
        id &&
        idsYT.has(id)
    ) {

        document
            .querySelector(
                'ytd-watch-metadata h1 yt-formatted-string'
            )
            ?.classList.add("vh-title");
    }
}

function highlightNico() {

    document.querySelectorAll(
        'a[href*="/watch/"], a[href*="nico.ms"]'
    ).forEach(a => {

        const id =
            getNicoId(a.href);

        if (
            id &&
            idsNico.has(id)
        ) {

            a.classList.add("vh-h");
        }
    });

    document
        .querySelectorAll(".vh-title")
        .forEach(el =>
            el.classList.remove("vh-title")
        );

    const id =
        getNicoId(location.href);

    if (
        id &&
        idsNico.has(id)
    ) {

        document
            .querySelector("h1")
            ?.classList.add("vh-title");
    }
}

function refresh() {

    if (isYT())
        highlightYT();

    if (isNico())
        highlightNico();
}

/* ============================ VELOCIDAD */

// Aplica la velocidad recordada al elemento <video> actual. Se llama tanto
// al pulsar el botón como al navegar a un video nuevo, para que el botón
// y la velocidad real del video nunca queden desincronizados (bug corregido:
// antes, al cambiar de video YouTube reseteaba la velocidad a 1x pero el
// botón seguía mostrando la velocidad anterior).
function applySpeed() {

    const v =
        document.querySelector('video');

    if (!v)
        return;

    v.playbackRate =
        SPEEDS[speedIndex];

    const btn =
        document.getElementById('vh-speed');

    if (btn)
        btn.textContent =
            SPEEDS[speedIndex] + '×';
}

function addSpeedBtn() {

    if (!isYT())
        return;

    const controls =
        document.querySelector(
            '.ytp-right-controls'
        );

    if (
        !controls ||
        document.getElementById('vh-speed')
    ) return;

    const btn =
        document.createElement('button');

    btn.id = 'vh-speed';

    btn.className = 'ytp-button';

    btn.title = 'Velocidad';

    btn.style.cssText = `
        display:flex;

        align-items:center;
        justify-content:center;

        width:48px;
        height:100%;

        font-size:13px;
        font-weight:600;
    `;

    btn.textContent =
        SPEEDS[speedIndex] + '×';

    btn.onclick = () => {

        speedIndex =
            (speedIndex + 1) %
            SPEEDS.length;

        applySpeed();
    };

    controls.prepend(btn);

    applySpeed();
}

/* ============================ VOLUMEN */

function setupAudio(video) {

    if (video === connectedVideo)
        return;

    // Cada <video> solo puede conectarse una vez a un MediaElementSource,
    // así que si ya existe un contexto lo reutilizamos y solo creamos
    // una fuente nueva para el video nuevo.
    if (!ctx)
        ctx = new AudioContext();

    const source =
        ctx.createMediaElementSource(video);

    if (!gainNode) {

        gainNode =
            ctx.createGain();

        gainNode.connect(ctx.destination);
    }

    source.connect(gainNode);

    connectedVideo = video;
}

// Aplica el volumen guardado al video actual sin esperar a que el usuario
// mueva el slider (bug corregido: antes el volumen guardado solo se
// aplicaba al tocar manualmente el control, así que un video nuevo
// siempre arrancaba al 100% real aunque el slider mostrara otro valor).
async function applySavedVolume() {

    if (!isYT())
        return;

    const video =
        document.querySelector('video');

    if (!video)
        return;

    if (video === connectedVideo && !vhSlider)
        return;

    const saved =
        Number(
            await GM_getValue(
                VOL_KEY,
                100
            )
        );

    setupAudio(video);

    if (ctx.state === "suspended")
        ctx.resume();

    gainNode.gain.value =
        saved / 100;

    if (vhSlider) {

        vhSlider.value = saved;

        vhLabel.textContent =
            saved + '%';
    }
}

async function addVolumeSlider() {

    if (!isYT())
        return;

    const controls =
        document.querySelector(
            '.ytp-right-controls'
        );

    if (
        !controls ||
        document.getElementById('vh-volume')
    ) return;

    const container =
        document.createElement('div');

    container.id = 'vh-volume';

    container.style.cssText = `
        display:flex;

        align-items:center;

        gap:6px;

        margin-right:10px;
    `;

    const saved =
        await GM_getValue(
            VOL_KEY,
            100
        );

    vhLabel =
        document.createElement('span');

    vhLabel.textContent =
        saved + '%';

    vhLabel.style.fontSize =
        '12px';

    vhSlider =
        document.createElement('input');

    vhSlider.type = 'range';

    vhSlider.min = 100;

    vhSlider.max = 300;

    vhSlider.value = saved;

    vhSlider.style.width =
        '80px';

    vhSlider.oninput = async () => {

        const video =
            document.querySelector(
                'video'
            );

        if (!video)
            return;

        setupAudio(video);

        if (ctx.state === "suspended")
            ctx.resume();

        gainNode.gain.value =
            vhSlider.value / 100;

        vhLabel.textContent =
            vhSlider.value + '%';

        await GM_setValue(
            VOL_KEY,
            vhSlider.value
        );
    };

    container.appendChild(vhLabel);

    container.appendChild(vhSlider);

    controls.prepend(container);

    applySavedVolume();
}

/* ============================ ESTILOS UI (FAB + PANEL) */

const UI_THEME = `
  #vh-fab {
    position:fixed; right:20px; bottom:20px; width:48px; height:48px;
    border:none; border-radius:50%;
    background:linear-gradient(140deg,#818cf8,#6366f1 60%,#4338ca);
    color:white; font-size:22px; cursor:pointer;
    display:flex; align-items:center; justify-content:center;
    z-index:999999;
    box-shadow:0 8px 22px rgba(99,102,241,.4), 0 0 0 1px rgba(255,255,255,.10) inset;
    transition:transform .18s ease, box-shadow .18s ease; user-select:none;
  }
  #vh-fab:hover { box-shadow:0 12px 30px rgba(99,102,241,.6), 0 0 0 1px rgba(255,255,255,.14) inset; transform:translateY(-2px); }
  #vh-fab:active { transform:scale(.92); }

  #vh-panel {
    position:fixed; right:20px; bottom:78px; width:290px; max-height:70vh;
    background:#15171c; color:#f1f1f1; border-radius:16px; padding:0;
    display:none; flex-direction:column; overflow:hidden; z-index:999998;
    font-family:-apple-system,Segoe UI,Arial,sans-serif; font-size:13px;
    box-shadow:0 16px 40px rgba(0,0,0,.55), 0 0 0 1px rgba(255,255,255,.06);
    opacity:0; transform:translateY(10px) scale(.97);
    transition:opacity .18s ease, transform .18s ease;
  }
  #vh-panel.open { display:flex; opacity:1; transform:translateY(0) scale(1); }

  #vh-panel .vh-head {
    display:flex; align-items:center; gap:8px; padding:14px 16px;
    background:linear-gradient(135deg, rgba(251,111,44,.22), rgba(251,111,44,0) 70%);
    border-bottom:1px solid rgba(255,255,255,.07);
  }
  #vh-panel .vh-head .vh-emoji { font-size:17px; }
  #vh-panel .vh-head b { font-size:14.5px; letter-spacing:.2px; font-weight:600; }

  #vh-panel .vh-body { overflow-y:auto; padding:12px 12px 8px; display:flex; flex-direction:column; gap:7px; }

  .vh-row {
    display:flex; justify-content:space-between; align-items:center; gap:10px;
    padding:11px 12px; background:#1d2026; border-radius:11px; cursor:pointer;
    transition:background .12s ease, transform .1s ease; border:1px solid transparent;
    width:100%; text-align:left; color:#eee; font-family:inherit;
  }
  .vh-row:hover { background:#242832; border-color:rgba(251,111,44,.25); }
  .vh-row:active { transform:scale(.98); }
  .vh-row .vh-label { display:flex; flex-direction:column; min-width:0; }
  .vh-row .vh-title { font-size:12.5px; color:#f1f1f1; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; font-weight:500; }
  .vh-row .vh-desc { font-size:10.5px; color:#8a8f98; margin-top:2px; }
  .vh-row .vh-icon { font-size:16px; margin-right:2px; }

  #vh-panel .vh-foot { padding:8px 12px 12px; font-size:10px; color:#63666d; text-align:center; border-top:1px solid rgba(255,255,255,.05); }
`;

function ensureUIStyleInjected() {
    if (document.getElementById(UI_STYLE_ID))
        return;

    const style = document.createElement("style");

    style.id = UI_STYLE_ID;

    style.textContent = UI_THEME;

    (document.head || document.documentElement).appendChild(style);
}

function ensureHighlightStyleInjected() {
    if (document.getElementById(HIGHLIGHT_STYLE_ID))
        return;

    const style = document.createElement("style");

    style.id = HIGHLIGHT_STYLE_ID;

    style.textContent = `
        .vh-h{
            background:#fff3a0 !important;
            border-left:6px solid orange !important;
            padding-left:6px !important;
        }
        .vh-title{
            background:linear-gradient(90deg,#fff3a0,transparent) !important;
            border-left:6px solid orange !important;
            padding:6px 10px !important;
            border-radius:6px !important;
        }
    `;

    (document.head || document.documentElement).appendChild(style);
}

/* ============================ PANEL: BUILD */

function addPanelAction(icon, title, desc, action) {

    const row =
        document.createElement("button");

    row.className = "vh-row";

    const label =
        document.createElement("div");

    label.className = "vh-label";

    const titleEl =
        document.createElement("div");

    titleEl.className = "vh-title";

    titleEl.textContent =
        `${icon}  ${title}`;

    label.appendChild(titleEl);

    if (desc) {

        const descEl =
            document.createElement("div");

        descEl.className = "vh-desc";

        descEl.textContent = desc;

        label.appendChild(descEl);
    }

    row.appendChild(label);

    row.onclick = action;

    vhBody.appendChild(row);
}

function toggleMenu() {

    if (!vhPanel)
        return;

    vhPanel.classList.toggle("open");
}

/* ============================ RESILIENCIA (adjunto/fullscreen/estilo) */

/**
 * Garantiza que exista un único FAB/panel en el DOM, que las referencias
 * apunten al nodo real, que el CSS siga inyectado, y que el nodo esté
 * en el contenedor correcto (respetando la Fullscreen API nativa, que
 * renderiza el elemento en pantalla completa por encima de todo lo demás
 * sin importar z-index — un fixed externo quedaría tapado si no se
 * mueve dentro de ese contenedor).
 */
function ensureFabAttached() {

    ensureUIStyleInjected();

    ensureHighlightStyleInjected();

    const fabDupes =
        document.querySelectorAll("#vh-fab");

    if (fabDupes.length > 1)
        fabDupes.forEach((n, i) => { if (i > 0) n.remove(); });

    const panelDupes =
        document.querySelectorAll("#vh-panel");

    if (panelDupes.length > 1)
        panelDupes.forEach((n, i) => { if (i > 0) n.remove(); });

    const realFab = document.getElementById("vh-fab");

    const realPanel = document.getElementById("vh-panel");

    if (realFab) vhFab = realFab;

    if (realPanel) vhPanel = realPanel;

    const fsEl =
        document.fullscreenElement ||
        document.webkitFullscreenElement;

    const target = fsEl || document.body;

    if (vhFab && !document.body.contains(vhFab))
        target.appendChild(vhFab);

    if (vhPanel && !document.body.contains(vhPanel))
        target.appendChild(vhPanel);

    if (vhFab && vhFab.parentNode !== target)
        target.appendChild(vhFab);

    if (vhPanel && vhPanel.parentNode !== target)
        target.appendChild(vhPanel);
}

function applyFloatingMenuVisibility() {

    if (!vhFab)
        return;

    ensureFabAttached();

    vhFab.style.display =
        vhVisibleState ? "flex" : "none";

    if (!vhVisibleState && vhPanel)
        vhPanel.classList.remove("open");
}

async function toggleFloatingMenuVisibility() {

    vhVisibleState = !vhVisibleState;

    await GM_setValue(
        MENU_VISIBLE_KEY,
        vhVisibleState
    );

    applyFloatingMenuVisibility();
}

function startWatchdog() {

    if (vhObserver)
        vhObserver.disconnect();

    vhObserver = new MutationObserver(() => {

        if (
            !vhFab || !document.body.contains(vhFab) ||
            !vhPanel || !document.body.contains(vhPanel) ||
            !document.getElementById(UI_STYLE_ID)
        ) {
            applyFloatingMenuVisibility();
        }
    });

    vhObserver.observe(document.body, { childList: true, subtree: false });

    vhObserver.observe(document.head || document.documentElement, { childList: true, subtree: false });

    ["fullscreenchange", "webkitfullscreenchange"].forEach(ev => {

        document.addEventListener(ev, ensureFabAttached, true);
    });

    if (vhWatchdogTimer)
        clearInterval(vhWatchdogTimer);

    vhWatchdogTimer = setInterval(() => {

        ensureFabAttached();

        if (vhFab)
            vhFab.style.display =
                vhVisibleState ? "flex" : "none";

    }, 1500);
}

/* ============================ PANEL: CREAR */

async function createFloatingMenu() {

    if (vhPanel)
        return;

    ensureUIStyleInjected();

    vhVisibleState =
        await GM_getValue(
            MENU_VISIBLE_KEY,
            false
        );

    vhPanel =
        document.createElement("div");

    vhPanel.id = "vh-panel";

    const head =
        document.createElement("div");

    head.className = "vh-head";

    const emoji =
        document.createElement("span");

    emoji.className = "vh-emoji";

    emoji.textContent = "🔖";

    const title =
        document.createElement("b");

    title.textContent =
        "Marcadores";

    head.append(emoji, title);

    vhBody =
        document.createElement("div");

    vhBody.className = "vh-body";

    const foot =
        document.createElement("div");

    foot.className = "vh-foot";

    foot.textContent =
        "Resaltador desde marcadores";

    vhPanel.append(head, vhBody, foot);

    document.body.appendChild(vhPanel);

    vhFab =
        document.createElement("button");

    vhFab.id = "vh-fab";

    vhFab.title = "Menú";

    vhFab.textContent = "🔖";

    vhFab.onclick = toggleMenu;

    document.body.appendChild(vhFab);

    addPanelAction(
        "📥", "Importar bookmarks",
        "Cargar videos desde un HTML",
        importHTML
    );

    addPanelAction(
        "🗑", "Limpiar bookmarks",
        "Elimina todos los importados",
        clearBookmarks
    );

    applyFloatingMenuVisibility();

    startWatchdog();
}

/* ============================ OBSERVER GENERAL (highlight, controles YT) */

let debounce;

new MutationObserver(() => {

    clearTimeout(debounce);

    debounce = setTimeout(() => {

        refresh();

        addSpeedBtn();

        addVolumeSlider();

        createFloatingMenu();

    }, 300);

}).observe(document.body, {

    childList: true,

    subtree: true
});

/* ============================ YOUTUBE SPA */

window.addEventListener(
    'yt-navigate-finish',
    () => {

        setTimeout(() => {

            refresh();

            addSpeedBtn();

            addVolumeSlider();

            applySpeed();

            applySavedVolume();

            createFloatingMenu();

        }, 500);
    }
);

/* ============================ INIT */

window.addEventListener(
    "load",
    async () => {

        urls =
            await GM_getValue(
                "vh_urls",
                []
            );

        rebuild();

        refresh();

        addSpeedBtn();

        addVolumeSlider();

        createFloatingMenu();
    }
);

/* ============================ MENU */

GM_registerMenuCommand(
    "🔖 Mostrar/Ocultar botón flotante",
    toggleFloatingMenuVisibility
);

})();
