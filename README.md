# 📊 Sistema de Gestión de KPIs (Key Performance Indicators)

Bienvenido al repositorio oficial del **Sistema KPI**. Este software automatiza la medición, procesamiento y visualización de indicadores críticos (Mantenimiento, Seguridad y Operaciones).

---

## 📋 Requisitos Previos (Antes de empezar)

Para ejecutar este proyecto en tu computadora local, necesitas tener instalado:
1.  **Node.js** (Versión 18 o superior). Puedes descargarlo en [nodejs.org](https://nodejs.org/).
2.  **Git** para clonar el repositorio.
3.  **Una cuenta en Supabase** (Gratuita) para la base de datos PostgreSQL. Regístrate en [supabase.com](https://supabase.com/).

---

## 🚀 Guía de Instalación Paso a Paso

### 1. Clonar el repositorio
Abre una terminal en tu computadora y ejecuta:
```bash
git clone https://github.com/Juan-7u7/kpis.git
cd kpis
```

### 2. Instalar dependencias
Instala todas las librerías necesarias ejecutando:
```bash
npm install
```

### 3. Configuración de la Base de Datos (Supabase)
Sigue estos pasos para preparar tu base de datos:
1.  Crea un nuevo proyecto en **Supabase**.
2.  En el panel de tu proyecto, ve a la sección **SQL Editor**.
3.  **Importante:** Ejecuta primero el contenido del archivo `bd.sql` (esto creará las tablas, relaciones y vistas).
4.  Luego, ejecuta el contenido del archivo `seed.sql` (esto cargará los indicadores base y configuraciones de ejemplo).

### 4. Variables de Entorno
Crea un archivo llamado `.env` en la raíz del proyecto y copia el siguiente formato. Debes reemplazar los valores con tus credenciales de Supabase (las encuentras en *Project Settings > API*):

```env
# Conexión Frontend (Vite)
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu-clave-anon-aqui

# Conexión Backend (Node.js)
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_ANON_KEY=tu-clave-anon-aqui
```

---

## 🏃 Cómo ejecutar el proyecto

Para ver la aplicación funcionando en tu navegador, necesitas correr dos procesos (puedes abrir dos terminales):

### Opción A: Ejecutar todo el sistema (Recomendado)
```bash
npm run dev
```
Esto iniciará el **Frontend** en `http://localhost:5173`. 
*Nota: Asegúrate de tener configurado el `.env` para que el Tablero pueda leer los datos.*

### Opción B: Ejecutar solo el Backend (Para pruebas de API)
```bash
npm run server
```
Esto iniciará el servidor Express en `http://localhost:3000`.

---

## 📂 Estructura del Menú de Documentación
Si deseas profundizar en el funcionamiento interno, consulta nuestra carpeta `/docs`:
- [Arquitectura Frontend](./docs/frontend.md)
- [Arquitectura Backend](./docs/backend.md)
- [Lógica de Fórmulas y Cálculos](./docs/formulas_kpis.md)
- [Manual de Usuario Operativo](./docs/manual_usuario.md)

---

## 🛠️ Comandos Útiles
- `npm run lint`: Verifica que no haya errores de formato o lógica en el código.
- `npm run build`: Prepara la aplicación para ser subida a producción (Vercel).

---

## 🤝 Contribuciones
Si deseas agregar nuevas fórmulas o mejorar el diseño:
1.  Haz un Fork del proyecto.
2.  Crea una rama con tu mejora (`git checkout -b feature/mejora`).
3.  Envía un Pull Request.

---

**Autor:** Producido por **Antigravity AI** para la gestión de excelencia operativa.
