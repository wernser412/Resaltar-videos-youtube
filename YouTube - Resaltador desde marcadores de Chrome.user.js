// ==UserScript==
// @name         YouTube - Resaltador desde marcadores de Chrome
// @namespace    https://chat.openai.com/
// @version      2025.09.08
// @description  Resalta videos en YouTube si están entre los marcadores de Chrome importados (.html exportado desde Chrome)
// @author       wernser412
// @icon         data:image/x-icon;base64,AAABAAEAEBAAAAEAIABoBAAAFgAAACgAAAAQAAAAIAAAAAEAIAAAAAAAAAQAABILAAASCwAAAAAAAAAAAAD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8AAAD/EAAA/0AAAP9AAAD/cAAA/4AAAP+AAAD/gAAA/4AAAP+AAAD/QAAA/0AAAP8Q////AP///wD///8AAAD/YAAA//8AAP//AAD//wAA//8AAP//AAD//wAA//8AAP//AAD//wAA//8AAP//AAD//wAA/2D///8AAAD/MAAA//8AAP//AAD//wAA//8AAP//AAD//wAA//8AAP//AAD//wAA//8AAP//AAD//wAA//8AAP//AAD/MAAA/1AAAP//AAD//wAA//8AAP//AAD//wAA//8QEP//AAD//wAA//8AAP//AAD//wAA//8AAP//AAD//wAA/2AAAP+AAAD//wAA//8AAP//AAD//wAA//8AAP//4OD//1BQ//8AAP//AAD//wAA//8AAP//AAD//wAA//8AAP+AAAD/gAAA//8AAP//AAD//wAA//8AAP//AAD/////////////wMD//yAg//8AAP//AAD//wAA//8AAP//AAD/gAAA/4AAAP//AAD//wAA//8AAP//AAD//wAA/////////////7Cw//8gIP//AAD//wAA//8AAP//AAD//wAA/4AAAP+AAAD//wAA//8AAP//AAD//wAA//8AAP//4OD//0BA//8AAP//AAD//wAA//8AAP//AAD//wAA//8AAP+AAAD/UAAA//8AAP//AAD//wAA//8AAP//AAD//wAA//8AAP//AAD//wAA//8AAP//AAD//wAA//8AAP//AAD/YAAA/zAAAP//AAD//wAA//8AAP//AAD//wAA//8AAP//AAD//wAA//8AAP//AAD//wAA//8AAP//AAD//wAA/zD///8AAAD/YAAA//8AAP//AAD//wAA//8AAP//AAD//wAA//8AAP//AAD//wAA//8AAP//AAD//wAA/2D///8A////AP///wAAAP8QAAD/QAAA/0AAAP+AAAD/gAAA/4AAAP+AAAD/gAAA/4AAAP9AAAD/QAAA/xD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A//8AAP//AADAAwAAgAEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAgAEAAMADAAD//wAA//8AAA==
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
