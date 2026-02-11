# 🎥 YouTube – Resaltador desde marcadores de Chrome

**Última actualización:** 10 de febrero de 2026  
**Autor:** @wernser412  

Script de **Tampermonkey** que mejora YouTube de tres formas clave:

- 🎯 Resalta automáticamente videos guardados en tus marcadores
- ❤️ Limpia masivamente la playlist **Videos que te gustan**
- ⏩ Agrega un botón **2×** al reproductor para controlar la velocidad

Ideal para organizar tu contenido, evitar repeticiones y consumir videos más rápido.

---

## 📦 Instalación

1. Instala la extensión **Tampermonkey** en tu navegador  
   👉 https://www.tampermonkey.net/

2. Instala el script desde GitHub:

[![Instalar con Tampermonkey](https://img.shields.io/badge/Tampermonkey-Instalar-blue?logo=tampermonkey)](
https://github.com/wernser412/Resaltar-videos-youtube/raw/refs/heads/main/YouTube%20-%20Resaltador%20desde%20marcadores%20de%20Chrome.user.js
)

---

## ✨ Características

### 📌 Resaltado de videos desde marcadores

- 📥 Importa marcadores desde archivo `.html` (Chrome / Chromium)
- 🎯 Resalta videos guardados con **fondo amarillo** y **borde naranja**
- 🧠 Evita falsos positivos (comentarios y enlaces irrelevantes)
- 🔄 Compatible con navegación dinámica de YouTube (SPA)

---

### ❤️ Limpieza automática de “Videos que te gustan”

- 🗑️ Elimina likes en masa desde la playlist:
https://www.youtube.com/playlist?list=LL
- 📢 Muestra un mensaje central de progreso
- 🚀 No requiere clic manual video por video
- 🤖 Funciona automáticamente mientras haces scroll

---

### ⏩ Botón de velocidad 2× (nuevo)

- ▶ Agrega un botón **2×** directamente al reproductor de YouTube
- 🔁 Alterna entre **1× ⇄ 2×**
- 🎨 Estilo nativo (integrado con los controles oficiales)
- 🧠 Se mantiene activo al cambiar de video (SPA friendly)

Perfecto para podcasts, tutoriales y videos largos.

---

## 🛠 Cómo usar

### ▶ Resaltar videos desde marcadores

1. Abre `chrome://bookmarks/`
2. Menú ⋮ → **Exportar marcadores**
3. Abre YouTube
4. Haz clic en el icono de Tampermonkey
5. Selecciona **📥 Importar desde HTML de marcadores**
6. Carga el archivo `.html`

👉 Los videos guardados se marcarán automáticamente en toda la plataforma.

---

### ❤️ Limpiar playlist de Me gusta

1. Ve a:
https://www.youtube.com/playlist?list=LL
2. Abre Tampermonkey
3. Selecciona **❤️ Limpiar playlist de Me gusta**
4. Aparecerá un mensaje central indicando el progreso

⚠️ **Nota:** el proceso es continuo; puedes detenerlo cerrando la pestaña.

---

## 🧪 Compatibilidad

- ✔ Chrome / Chromium
- ✔ Tampermonkey
- ✔ YouTube SPA (navegación sin recarga)

---

## 📜 Licencia

Script de uso **personal y educativo**.

- ✏️ Puedes modificarlo libremente
- ⚠️ Sin garantía de funcionamiento futuro  
(YouTube cambia su interfaz con frecuencia)

---

⭐ Si te resulta útil, ¡una estrella en GitHub siempre se agradece!
