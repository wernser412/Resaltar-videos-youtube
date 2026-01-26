# 🎥 YouTube - Resaltador desde marcadores de Chrome

**Última Actualización:** 25 de enero de 2026

Este script de Tampermonkey resalta automáticamente los videos de YouTube que están guardados en tus marcadores de Google Chrome y ahora también permite limpiar masivamente tu playlist de **Videos que te gustan**.

Ideal para organizar tu historial y evitar volver a ver contenido repetido.

---

## 📦 Instalación

1. Instala la extensión [Tampermonkey](https://www.tampermonkey.net/) en tu navegador.
2. Haz clic para instalar el script:

[![Instalar con Tampermonkey](https://img.shields.io/badge/Tampermonkey-Instalar-blue?logo=tampermonkey)](https://github.com/wernser412/Resaltar-videos-youtube/raw/refs/heads/main/YouTube%20-%20Resaltador%20desde%20marcadores%20de%20Chrome.user.js)

---

## ✨ Características

### 📌 Resaltado de videos

- 📥 Importa marcadores desde archivo `.html` de Chrome
- 🎯 Resalta videos guardados con fondo amarillo y borde naranja
- 🧠 Evita falsos positivos en comentarios
- 🔄 Compatible con navegación dinámica de YouTube (SPA)

### 🧹 Limpieza automática de “Videos que te gustan”

- ❤️ Elimina likes en masa desde la playlist: https://www.youtube.com/playlist?list=LL
- 📢 Muestra mensaje central de progreso mientras limpia
- 🚀 No requiere clic manual video por video

---

## 🛠 Cómo usar

### ▶ Resaltar videos desde marcadores

1. Abre `chrome://bookmarks/`
2. Menú ⋮ → **Exportar marcadores**
3. En YouTube abre Tampermonkey
4. Selecciona **📥 Importar desde HTML de marcadores**
5. Carga el archivo `.html`

Los videos guardados se marcarán automáticamente.

---

### ❤️ Limpiar playlist de Me gusta

1. Ve a: https://www.youtube.com/playlist?list=LL
2. Abre Tampermonkey
3. Pulsa **🧹 Limpiar playlist de Me gusta**
4. Aparecerá un mensaje central indicando que se están quitando los likes

---

## 🧪 Licencia

Script de uso personal y educativo.  
Puedes modificarlo libremente.  
Sin garantía de funcionamiento futuro (YouTube cambia su interfaz seguido).
