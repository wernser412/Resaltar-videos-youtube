// ==UserScript==
// @name         YouTube - Resaltador desde marcadores de Chrome
// @namespace    https://chat.openai.com/
// @version      2025.12.28
// @description  Resalta videos en YouTube si están entre los marcadores de Chrome importados (.html exportado desde Chrome)
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

    /* ============================
       Utilidades
    ============================ */

    function obtenerVideoId(url) {
        try {
            const u = new URL(url);
            return u.searchParams.get("v");
        } catch {
            return null;
        }
    }

    function reconstruirSetIds() {
        idsMarcados = new Set(
            urlsMarcadas
                .map(obtenerVideoId)
                .filter(Boolean)
        );
    }

    /* ============================
       Carga / Importación
    ============================ */

    async function cargarMarcadores() {
        urlsMarcadas = await GM_getValue("urlsYoutube", []);
        reconstruirSetIds();
    }

    function extraerYouTubeURLsDesdeHTML(html) {
        const regex = /href="(https:\/\/www\.youtube\.com\/watch\?[^"]+)"/gi;
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

            if (urls.length === 0) {
                alert('❌ No se encontraron URLs de YouTube en el archivo.');
            } else {
                await GM_setValue("urlsYoutube", urls);
                urlsMarcadas = urls;
                reconstruirSetIds();
                alert(`✅ Se importaron ${urls.length} URLs de YouTube desde tus marcadores.`);
                resaltarVideos();
            }
        };

        input.click();
    }

    /* ============================
       Resaltado
    ============================ */

    function resaltarVideos() {
        if (idsMarcados.size === 0) return;

        const enlaces = document.querySelectorAll(
            'a[href*="watch?v="]'
        );

        enlaces.forEach(link => {
            if (link.classList.contains("yt-bookmark-highlight")) return;

            const videoId = obtenerVideoId(link.href);
            if (videoId && idsMarcados.has(videoId)) {
                link.classList.add("yt-bookmark-highlight");
            }
        });
    }

    /* ============================
       Estilos
    ============================ */

    GM_addStyle(`
        .yt-bookmark-highlight {
            background-color: #fff3a0 !important;
            border-left: 6px solid orange !important;
            padding-left: 6px !important;
            box-sizing: border-box;
        }
    `);

    /* ============================
       Observer optimizado
    ============================ */

    let debounceTimer;
    const observer = new MutationObserver(() => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(resaltarVideos, 300);
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true
    });

    /* ============================
       Menú
    ============================ */

    GM_registerMenuCommand(
        "📥 Importar desde HTML de marcadores",
        importarMarcadoresHTML
    );

    /* ============================
       Init
    ============================ */

    window.addEventListener('load', async () => {
        await cargarMarcadores();
        resaltarVideos();
    });

})();
