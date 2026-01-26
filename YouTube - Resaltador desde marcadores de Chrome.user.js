// ==UserScript==
// @name         YouTube - Resaltador desde marcadores de Chrome
// @namespace    https://chat.openai.com/
// @version      2026.01.25
// @description  Resalta videos guardados en marcadores + limpia playlist de Me gusta
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

    if (esLink) {
        textarea.value =
            "ABRE PRIMERO ESTA PLAYLIST:\n\n" +
            "https://www.youtube.com/playlist?list=LL";
    } else {
        textarea.value = texto;
    }
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
    idsMarcados = new Set(
        urlsMarcadas.map(obtenerVideoId).filter(Boolean)
    );
}

function obtenerVideosRepetidos(urls) {
    const contador = {};
    const repetidos = {};

    urls.forEach(url => {
        const id = obtenerVideoId(url);
        if (!id) return;

        contador[id] = (contador[id] || 0) + 1;
        if (contador[id] > 1) repetidos[id] = contador[id];
    });

    return repetidos;
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

    while ((match = regex.exec(html)) !== null) {
        urls.push(match[1]);
    }

    return [...new Set(urls)];
}

async function importarMarcadoresHTML() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.html';

    input.onchange = async () => {
        const archivo = input.files[0];
        if (!archivo) return;

        const contenido = await archivo.text();
        const urls = extraerYouTubeURLsDesdeHTML(contenido);

        if (!urls.length) {
            alert('❌ No se encontraron URLs de YouTube.');
            return;
        }

        await GM_setValue("urlsYoutube", urls);
        urlsMarcadas = urls;
        reconstruirSetIds();

        const repetidos = obtenerVideosRepetidos(urls);

        let mensaje =
            `✅ Importación completada\n\n` +
            `🔗 URLs encontradas: ${urls.length}\n` +
            `🎬 Videos únicos: ${idsMarcados.size}`;

        if (Object.keys(repetidos).length) {
            mensaje += `\n\n🔁 Videos repetidos:\n`;
            for (const [id, veces] of Object.entries(repetidos)) {
                mensaje += `• ${id} (${veces} veces)\n`;
            }
        }

        alert(mensaje);
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

    const enlaces = document.querySelectorAll(
        'a[href*="watch?v="], a[href*="youtu.be/"]'
    );

    enlaces.forEach(link => {
        if (link.closest('ytd-comments')) return;
        if (link.classList.contains("yt-bookmark-highlight")) return;

        const id = obtenerVideoId(link.href);
        if (id && idsMarcados.has(id)) {
            link.classList.add("yt-bookmark-highlight");
        }
    });
}

function resaltarTituloVideoActual() {
    const idActual = obtenerVideoId(window.location.href);
    if (!idActual || !idsMarcados.has(idActual)) return;

    const titulo = document.querySelector(
        'ytd-watch-metadata h1 yt-formatted-string'
    );

    if (titulo && !titulo.classList.contains("yt-bookmark-title-highlight")) {
        titulo.classList.add("yt-bookmark-title-highlight");
    }
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
   OBSERVER SPA
============================ */

let debounceTimer;
const observer = new MutationObserver(mutations => {
    if (!mutations.some(m => m.addedNodes.length)) return;

    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
        resaltarVideos();
        resaltarTituloVideoActual();
    }, 300);
});

observer.observe(document.body, { childList: true, subtree: true });

window.addEventListener('yt-navigate-finish', () => {
    setTimeout(resaltarTituloVideoActual, 400);
});

/* ============================
   LIMPIAR PLAYLIST ME GUSTA
============================ */

async function limpiarPlaylistMeGusta() {

    if (!location.href.includes("playlist?list=LL")) {
        mostrarOverlay("", true);
        return;
    }

    mostrarOverlay("❤️ Quitando likes automáticamente...");

    const sleep = ms => new Promise(r => setTimeout(r, ms));

    while (true) {

        const menus = document.querySelectorAll(
            'ytd-playlist-video-renderer ytd-menu-renderer button'
        );

        if (!menus.length) {
            window.scrollBy(0, 1200);
            await sleep(2000);
            continue;
        }

        for (let btn of menus) {
            btn.scrollIntoView({ behavior: "smooth", block: "center" });
            await sleep(700);
            btn.click();
            await sleep(700);

            const removeBtn = [...document.querySelectorAll(
                'ytd-menu-service-item-renderer'
            )].find(el =>
                el.innerText.toLowerCase().includes('me gusta') ||
                el.innerText.toLowerCase().includes('like')
            );

            if (removeBtn) {
                removeBtn.click();
                await sleep(1200 + Math.random() * 1200);
            } else {
                document.body.click();
                await sleep(300);
            }
        }

        window.scrollBy(0, 1500);
        await sleep(2000);
    }
}

/* ============================
   MENÚ TAMPERMONKEY
============================ */

GM_registerMenuCommand(
    "📥 Importar desde HTML de marcadores",
    importarMarcadoresHTML
);

GM_registerMenuCommand(
    "🗑️ Borrar marcadores",
    async () => {
        if (confirm("¿Borrar todos los marcadores importados?")) {
            await GM_setValue("urlsYoutube", []);
            urlsMarcadas = [];
            idsMarcados.clear();
            alert("🧹 Marcadores borrados.");
        }
    }
);

GM_registerMenuCommand(
    "❤️ Limpiar playlist de Me gusta (LL)",
    limpiarPlaylistMeGusta
);

/* ============================
   INIT
============================ */

window.addEventListener('load', async () => {
    await cargarMarcadores();
    resaltarVideos();
    resaltarTituloVideoActual();
});

})();
