// ==UserScript==
// @name         YouTube - Resaltador desde marcadores + botón 2x + Comentarios ON/OFF
// @namespace    https://chat.openai.com/
// @version      2026.02.10
// @description  Resalta videos guardados en marcadores + limpia playlist de Me gusta + botón 2x
// @author       wernser412
// @icon         https://github.com/wernser412/Resaltar-videos-youtube/raw/refs/heads/main/ICONO.ico
// @downloadURL  https://github.com/wernser412/Resaltar-videos-youtube/raw/refs/heads/main/YouTube%20-%20Resaltador%20desde%20marcadores%20de%20Chrome.user.js
// @match        https://www.youtube.com/*
// @grant        GM_registerMenuCommand
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_addStyle
// ==/UserScript==

(function () {
'use strict';

let urlsMarcadas = [];
let idsMarcados = new Set();
let ytOverlay;

/* ============================
   OVERLAY CENTRAL
============================ */

function mostrarOverlay(texto, esLink = false) {
    const app = document.querySelector("ytd-app");
    if (!app) return;

    if (!ytOverlay) {
        ytOverlay = document.createElement("div");
        ytOverlay.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            z-index: 2147483647;
        `;

        const box = document.createElement("textarea");
        box.id = "tm-like-overlay-text";
        box.readOnly = true;
        box.style.cssText = `
            width: 420px;
            height: 120px;
            resize: none;
            background: #0b1220;
            color: #ffffff;
            border: 4px solid #4fc3ff;
            border-radius: 20px;
            padding: 20px;
            font-size: 22px;
            font-weight: bold;
            text-align: center;
            outline: none;
            box-shadow: 0 0 40px rgba(0,0,0,.9);
        `;

        ytOverlay.appendChild(box);
        app.appendChild(ytOverlay);
    }

    const textarea = ytOverlay.querySelector("#tm-like-overlay-text");
    textarea.value = esLink
        ? "ABRE PRIMERO ESTA PLAYLIST:\n\nhttps://www.youtube.com/playlist?list=LL"
        : texto;
}

/* ============================
   UTILIDADES
============================ */

function obtenerVideoId(url) {
    try {
        const u = new URL(url);
        if (u.hostname === "youtu.be") return u.pathname.slice(1);
        return u.searchParams.get("v");
    } catch {
        return null;
    }
}

function reconstruirSetIds() {
    idsMarcados = new Set(urlsMarcadas.map(obtenerVideoId).filter(Boolean));
}

/* ============================
   CARGA / IMPORTACIÓN
============================ */

async function cargarMarcadores() {
    urlsMarcadas = await GM_getValue("urlsYoutube", []);
    reconstruirSetIds();
}

function extraerYouTubeURLsDesdeHTML(html) {
    const regex = /href="(https:\/\/(www\.)?(youtube\.com\/watch\?[^"]+|youtu\.be\/[^"]+))"/gi;
    const urls = [];
    let match;
    while ((match = regex.exec(html)) !== null) urls.push(match[1]);
    return [...new Set(urls)];
}

async function importarMarcadoresHTML() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.html';

    input.onchange = async () => {
        const contenido = await input.files[0].text();
        const urls = extraerYouTubeURLsDesdeHTML(contenido);
        if (!urls.length) return alert('❌ No se encontraron URLs de YouTube.');

        await GM_setValue("urlsYoutube", urls);
        urlsMarcadas = urls;
        reconstruirSetIds();
        alert(`✅ Importación completada\n🎬 Videos únicos: ${idsMarcados.size}`);
        resaltarVideos();
        resaltarTituloVideoActual();
    };
    input.click();
}

/* ============================
   RESALTADO
============================ */

function resaltarVideos() {
    if (!idsMarcados.size) return;
    document.querySelectorAll('a[href*="watch?v="], a[href*="youtu.be/"]').forEach(link => {
        if (link.closest('ytd-comments')) return;
        const id = obtenerVideoId(link.href);
        if (id && idsMarcados.has(id)) link.classList.add("yt-bookmark-highlight");
    });
}

function resaltarTituloVideoActual() {
    const id = obtenerVideoId(location.href);
    if (!idsMarcados.has(id)) return;
    const titulo = document.querySelector('ytd-watch-metadata h1 yt-formatted-string');
    if (titulo) titulo.classList.add("yt-bookmark-title-highlight");
}

/* ============================
   ESTILOS
============================ */

GM_addStyle(`
.yt-bookmark-highlight {
    background-color: #fff3a0 !important;
    border-left: 6px solid orange !important;
    padding-left: 6px !important;
}
.yt-bookmark-title-highlight {
    background: linear-gradient(90deg, #fff3a0, transparent) !important;
    border-left: 6px solid orange !important;
    padding: 6px 10px !important;
    border-radius: 6px !important;
}
`);

/* ============================
   BOTÓN VELOCIDAD 2X
============================ */

function agregarBotonVelocidad() {
    const controls = document.querySelector('.ytp-right-controls');
    if (!controls || document.getElementById('yt-speed-2x')) return;

    const btn = document.createElement('button');
    btn.id = 'yt-speed-2x';
    btn.className = 'ytp-button';
    btn.textContent = '2×';
    btn.title = 'Velocidad 2x';
    btn.style.cssText = `
        display:flex;
        align-items:center;
        justify-content:center;
        font-size:14px;
        font-weight:600;
        opacity:.6;
    `;

    btn.onclick = () => {
        const v = document.querySelector('video');
        if (!v) return;
        v.playbackRate = v.playbackRate === 2 ? 1 : 2;
        btn.style.opacity = v.playbackRate === 2 ? '1' : '.6';
    };

    controls.prepend(btn);
}

/* ============================
   COMENTARIOS ON / OFF
============================ */

const COMMENTS_KEY = "comentariosActivos";

async function refrescarComentarios() {
    const activos = await GM_getValue(COMMENTS_KEY, true);
    const comments = document.querySelector('ytd-comments');
    if (!comments) return;

    document.getElementById('tm-comments-disabled-msg')?.remove();

    if (activos) {
        comments.style.display = '';
        return;
    }

    comments.style.display = 'none';

    const msg = document.createElement('div');
    msg.id = 'tm-comments-disabled-msg';
    msg.textContent = '💬 Comentarios desactivados';
    msg.style.cssText = `
        margin:30px auto;
        padding:20px;
        max-width:800px;
        text-align:center;
        font-size:22px;
        font-weight:bold;
        color:#aaa;
        background:#111827;
        border:3px dashed #4fc3ff;
        border-radius:16px;
    `;
    comments.parentElement.insertBefore(msg, comments);
}

/* ============================
   OBSERVER SPA
============================ */

let debounce;
new MutationObserver(() => {
    clearTimeout(debounce);
    debounce = setTimeout(() => {
        resaltarVideos();
        resaltarTituloVideoActual();
        agregarBotonVelocidad();
        refrescarComentarios();
    }, 300);
}).observe(document.body, { childList: true, subtree: true });

window.addEventListener('yt-navigate-finish', () => {
    setTimeout(() => {
        resaltarTituloVideoActual();
        agregarBotonVelocidad();
        refrescarComentarios();
    }, 400);
});

/* ============================
   LIMPIAR PLAYLIST ME GUSTA
============================ */

async function limpiarPlaylistMeGusta() {
    if (!location.href.includes("playlist?list=LL")) {
        mostrarOverlay("", true);
        return;
    }
    mostrarOverlay("❤️ Quitando likes...");
    const sleep = ms => new Promise(r => setTimeout(r, ms));

    while (true) {
        const menus = document.querySelectorAll(
            'ytd-playlist-video-renderer ytd-menu-renderer button'
        );
        for (const btn of menus) {
            btn.scrollIntoView({ block: "center" });
            await sleep(600);
            btn.click();
            await sleep(600);
            document.querySelector('ytd-menu-service-item-renderer')?.click();
            await sleep(1200);
        }
        window.scrollBy(0, 1500);
        await sleep(2000);
    }
}

/* ============================
   MENÚ TAMPERMONKEY
============================ */

GM_registerMenuCommand("📥 Importar desde HTML de marcadores", importarMarcadoresHTML);

GM_registerMenuCommand("❤️ Limpiar playlist de Me gusta (LL)", limpiarPlaylistMeGusta);

GM_registerMenuCommand("💬 Activar / Desactivar comentarios", async () => {
    const estado = await GM_getValue(COMMENTS_KEY, true);
    await GM_setValue(COMMENTS_KEY, !estado);
    refrescarComentarios();
});

/* ============================
   INIT
============================ */

window.addEventListener('load', async () => {
    await cargarMarcadores();
    resaltarVideos();
    resaltarTituloVideoActual();
    agregarBotonVelocidad();
    refrescarComentarios();
});

})();
