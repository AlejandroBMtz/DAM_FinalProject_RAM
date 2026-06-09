# 📱 RAM (Red de Apoyo Mutuo)

> Una plataforma moderna de asistencia académica colaborativa para la comunidad de estudiantes de la UAQ, construida con React Native, Expo y Firebase.

---

## 📖 Sobre el Proyecto

**RAM** es una aplicación móvil diseñada para facilitar la tutoría y el apoyo académico mutuo entre los estudiantes de la facultad. Los estudiantes que necesitan ayuda con materias o temas particulares pueden crear solicitudes de soporte (tickets) etiquetándolas con habilidades específicas. A su vez, otros estudiantes con conocimientos en esas áreas pueden aceptar dichas solicitudes, iniciando un chat en tiempo real para resolver dudas.

La aplicación integra un completo **sistema de gamificación** (karma, rachas de resolución, subidas de nivel y desbloqueo de insignias) para fomentar e incentivar la participación activa en el apoyo académico.

---

## ✨ Características Principales

*   **Publicación de Tickets**: Creación, edición y eliminación de solicitudes de apoyo académico con niveles de urgencia (Alta, Media, Baja) y etiquetas de habilidades.
*   **Chat en Tiempo Real**: Mensajería instantánea directa entre solicitantes y ayudantes con indicadores de estado de conexión (en línea), escritura ("escribiendo...") y confirmación de lectura.
*   **Envío de Evidencia Visual**: Integración de fotos y capturas de pantalla a través del ImagePicker y almacenamiento en la nube con **Cloudinary**.
*   **Gamificación Activa**:
    *   **Puntos**: Otorgamiento y penalización de karma según prioridad, velocidad de respuesta y calificación de estrellas.
    *   **Niveles y Rangos**: Rango progresivo desde *Novato* hasta *Héroe* según los puntos acumulados.
    *   **Insignias**: Catálogo dinámico de insignias desbloqueables (ej. primer ticket resuelto, racha de 7 días, experto en bases de datos).
*   **Multi-idioma**: Soporte de traducción dinámico (Español e Inglés) a través de `i18next`.
*   **Notificaciones Push y Locales**: Notificación automática a los estudiantes cuyas habilidades coinciden con un nuevo ticket publicado.

---

## 📂 Arquitectura del Proyecto

El proyecto está estructurado siguiendo principios de escalabilidad, modularidad y legibilidad:

```text
src/
├── components/          # Componentes reutilizables
│   ├── common/          # Componentes básicos (botones, inputs, etc.)
│   ├── layout/          # Estructuras de layouts y grids
│   └── tickets/         # Componentes relacionados a los tickets
├── config/              # Configuraciones de servicios (firebase.js, cloudinary.js)
├── constants/           # Constantes del sistema (theme.js, tags.js)
├── contexts/            # Contextos de React (AuthContext.js para sesión)
├── hooks/               # Custom hooks reutilizables
├── navigation/          # Navegadores de la app (AppNavigator.js, AuthNavigator.js, MainNavigator.js)
├── screens/             # Vistas de la aplicación
│   ├── auth/            # Login, Registro e Información de Registro
│   ├── main/            # Feed de inicio, chat, tickets y perfil
│   ├── settings/        # Configuración de idioma, perfil, contraseña y legal
│   └── tutorial/        # Presentación interactiva / Swiper
├── services/            # Servicios de traducción (staticTL.js) e inicio (startup.js)
└── utils/               # Utilidades, cálculo de puntos, insignias y formatters
```

---

## 🚀 Instalación y Entorno Local

### Prerrequisitos
*   **Node.js** instalado (versión compatible con Expo).
*   **Expo Go** en tu dispositivo móvil (SDK Version 54).
*   Archivo de configuración `.env` en la raíz con las credenciales de Firebase y Cloudinary.

### Pasos
1.  Ejecutar el comando `npm install` en el directorio base para descargar dependencias.
2.  Ejecutar el comando `npx expo start -c` o `npm run start` para iniciar el servidor de desarrollo Metro.
3.  Escanear el código QR con tu app **Expo Go** (Android) o la cámara (iOS) para cargar la aplicación.

