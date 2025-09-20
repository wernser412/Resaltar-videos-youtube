// ==UserScript==
// @name         YouTube - Resaltador desde marcadores de Chrome
// @namespace    https://chat.openai.com/
// @version      2025.09.19
// @description  Resalta videos en YouTube si están entre los marcadores de Chrome importados (.html exportado desde Chrome)
// @author       wernser412
// @icon         https://github.com/wernser412/Resaltar-videos-youtube/raw/refs/heads/main/ICONO.ico
// @downloadURL  https://github.com/wernser412/Resaltar-videos-youtube/raw/refs/heads/main/YouTube%20-%20Resaltador%20desde%20marcadores%20de%20Chrome.user.js
// @match        https://www.youtube.com/*
// @grant        GM_registerMenuCommand
// @grant        GM_getValue
// @grant        GM_setValue
// ==/UserScript==

(function () {
    'use strict';

    let urlsMarcadas = [];

    async function cargarMarcadores() {
        urlsMarcadas = await GM_getValue("urlsYoutube", []);
    }

    function extraerYouTubeURLsDesdeHTML(html) {
        const regex = /HREF="(https:\/\/www\.youtube\.com\/watch\?v=[\w\-]+)"/g;
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
                alert(`✅ Se importaron ${urls.length} URLs de YouTube desde tus marcadores.`);
            }
        };

        input.click();
    }

    function resaltarVideos() {
        const videos = document.querySelectorAll('a#video-title');

        videos.forEach(link => {
            const url = link.href;
            if (urlsMarcadas.some(m => url.includes(m))) {
                link.style.backgroundColor = '#ffff99';
                link.style.border = '2px solid orange';
                link.style.padding = '2px';
            }
        });
    }

    GM_registerMenuCommand("📥 Importar desde HTML de marcadores", importarMarcadoresHTML);

    const observer = new MutationObserver(() => resaltarVideos());
    observer.observe(document.body, { childList: true, subtree: true });

    window.addEventListener('load', async () => {
        await cargarMarcadores();
        resaltarVideos();
    });
})();
