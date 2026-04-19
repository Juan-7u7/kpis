Fase 3 — Backend mínimo funcional

Objetivo: exponer datos por API para el frontend.

Tareas:

crear servidor Node + Express
configurar rutas
crear endpoint GET /kpis
filtrar por año y mes
retornar JSON limpio
manejar errores básicos
validar respuesta en navegador o Postman

Resultado:

API funcional consumiendo Supabase
Fase 4 — Frontend base

Objetivo: levantar la app React y mostrar datos reales.

Tareas:

crear proyecto React/Vite
configurar estructura base
crear layout general
crear pantalla inicial dashboard
consumir endpoint del backend
mostrar lista o cards simples
agregar selector de año y mes

Resultado:

frontend conectado con datos reales
Fase 5 — Dashboard funcional V1

Objetivo: ya ver KPIs en formato usable.

Tareas:

crear cards KPI
mostrar:
área
nombre KPI
valor
semáforo
agrupar por área
mostrar estado visual
manejar loading y error
hacer responsive básico

Resultado:

dashboard simple pero usable
Fase 6 — Captura de datos

Objetivo: permitir ingresar información mensual.

Tareas:

crear pantalla de captura
detectar tipo de KPI
mostrar formulario según tipo:
binario documental
conteo
conteo operativo
fechas
guardar en Supabase
validar campos
permitir editar captura del mes

Resultado:

usuario puede capturar información real
Fase 7 — Cálculo automático

Objetivo: que el sistema calcule resultados reales y no solo lea seed.

Tareas:

implementar motor de cálculo en backend
mapear formula_tipo
calcular resultado al guardar captura
guardar en kpi_resultados
asignar semáforo
manejar casos especiales:
división entre 0
sin actividad
múltiples entregas

Resultado:

sistema calcula KPIs automáticamente
Fase 8 — Histórico y filtros

Objetivo: hacer el sistema útil para análisis.

Tareas:

filtrar por año
filtrar por mes
filtrar por área
filtrar por KPI
mostrar histórico mensual
comparar periodos

Resultado:

navegación analítica real
Fase 9 — Gráficas

Objetivo: acercarse a la visualización del Excel.

Tareas:

definir librería de gráficas
crear componentes de gráfica reutilizables
implementar:
barras
líneas
indicadores circulares
usar 3D solo donde ayude
degradar a 2D en móvil o si afecta legibilidad

Resultado:

dashboard visual con gráficas funcionales
Fase 10 — Responsive real

Objetivo: que funcione en varios dispositivos.

Tareas:

adaptar dashboard a móvil
adaptar captura a móvil
simplificar gráficas en pantallas pequeñas
revisar tablet
revisar desktop
corregir spacing y layout

Resultado:

sistema usable en móvil, tablet y desktop

Fase 11 — Autenticación y roles

Objetivo: controlar acceso.

Tareas:

integrar login
conectar con Supabase Auth
crear perfiles
asignar roles
restringir vistas y acciones
validar flujo de usuario

Resultado:

acceso controlado
Fase 12 — Calidad y estabilidad

Objetivo: dejarlo confiable.

Tareas:

validar errores
revisar consistencia de datos
probar capturas
probar cálculos
probar dashboard
probar casos vacíos
limpiar código duplicado

Resultado:

sistema estable
