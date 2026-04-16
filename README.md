# 🎥 Video Toolkit PRO (YouTube + Niconico)

**Última actualización:** 15 de abril de 2026

Script de **Tampermonkey** que mejora la experiencia en video con funciones avanzadas para:

* ▶ YouTube
* ▶ Niconico

---

## ✨ Características

### 📌 Resaltado inteligente desde marcadores

* 📥 Importa marcadores desde archivo `.html` (Chrome / Chromium)
* 🎯 Detecta automáticamente:

  * YouTube
  * Niconico
* 🟡 Resaltado tipo YouTube (overlay, sin romper layout)
* 🧠 Evita falsos positivos (comentarios y enlaces irrelevantes)
* ⚡ Compatible con navegación dinámica (SPA)

---

### ▶ YouTube – Funciones extra

#### ⏩ Botón de velocidad

* 🔘 Botón integrado en el reproductor
* 🔁 Alterna entre:

  * `1× → 1.5× → 2×`
* 🎯 Texto perfectamente centrado
* 🔄 Persistente al cambiar de video (SPA)

---

#### ❤️ Limpieza de “Videos que te gustan”

* 🗑️ Elimina likes en masa desde:
  https://www.youtube.com/playlist?list=LL
* 📢 Muestra overlay central de progreso
* 🤖 Automatizado (scroll + eliminación continua)

---

#### 💬 Mostrar / ocultar comentarios

* 🔘 Toggle desde menú Tampermonkey
* 🧼 Mejora enfoque en el contenido

---

### ▶ Niconico – Resaltado mejorado

* 🎯 Resalta correctamente tarjetas de video (no solo links)
* 🟡 Overlay visual tipo YouTube (sin mover layout)
* ❌ Sin “saltos” ni desplazamientos
* 🧠 Uso de `data-decoration-video-id` para precisión

---

## 📦 Instalación

1. Instala **Tampermonkey**
   👉 https://www.tampermonkey.net/

2. Instala el script:

[![Instalar con Tampermonkey](https://img.shields.io/badge/Tampermonkey-Instalar-blue?logo=tampermonkey)](https://github.com/wernser412/Resaltar-videos-youtube/raw/refs/heads/main/Resaltador%20desde%20marcadores%20(YouTube%20+%20Niconico).user.js)

---

## 🛠 Cómo usar

### 📌 Importar marcadores

1. Abre `chrome://bookmarks/`
2. Menú ⋮ → **Exportar marcadores**
3. Abre YouTube o Niconico
4. Abre Tampermonkey
5. Selecciona **📥 Importar bookmarks**
6. Carga el archivo `.html`

👉 Los videos guardados se resaltarán automáticamente.

---

### ❤️ Limpiar playlist de Me gusta (YouTube)

1. Ve a:
   https://www.youtube.com/playlist?list=LL
2. Ejecuta:
   **❤️ Limpiar Me gusta**

---

### 💬 Alternar comentarios

* Menú Tampermonkey →
  **💬 ON/OFF comentarios**

---

## 📜 Licencia

Uso **personal y educativo**

* ✏️ Libre modificación
* ⚠️ Sin garantía (cambios frecuentes en UI de plataformas)

---

⭐ Si te resulta útil, ¡una estrella en GitHub se agradece!
