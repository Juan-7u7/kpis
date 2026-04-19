# Reglas de diseño para software de KPIs

## Enfoque general

- Diseñar con estilo de dashboard ejecutivo moderno.
- Priorizar claridad, jerarquía visual y lectura rápida.
- Mantener apariencia tecnológica, limpia y profesional.
- Evitar estilo recargado, experimental o excesivamente ornamental.
- El sistema debe transmitir control, análisis y toma de decisiones.

## Identidad visual

- Usar un estilo visual futurista sobrio.
- Combinar superficies limpias con acentos visuales de alto impacto.
- Mantener sensación premium y corporativa.
- Evitar colores chillones o demasiados contrastes agresivos.
- Preferir una estética elegante antes que llamativa.

## Filosofía de interfaz

- Cada pantalla debe responder rápidamente estas preguntas:
  - qué está pasando
  - qué KPI está bien o mal
  - por qué
  - qué periodo se está viendo
- El usuario debe entender el tablero en pocos segundos.
- La información crítica debe estar visible sin esfuerzo.
- No esconder datos importantes detrás de demasiados clics.

## Layout general

- Usar estructura tipo dashboard modular.
- Organizar la pantalla en bloques o cards.
- Separar claramente:
  - filtros
  - resumen general
  - gráficas
  - tablas o detalle
- Mantener márgenes amplios y respiración visual.
- Evitar pantallas saturadas.

## Jerarquía visual

- Mostrar primero KPIs principales.
- Mostrar después tendencias, comparativos y detalle.
- Dar mayor tamaño visual a:
  - resultado actual
  - variación
  - cumplimiento de meta
  - alertas
- Usar títulos claros y subtítulos breves.
- Hacer evidente qué es resumen y qué es detalle.

## Gráficas

- Las gráficas deben inspirarse en el Excel.
- Usar gráficas 3D únicamente cuando aporten impacto sin perder lectura.
- Si una gráfica 3D reduce claridad, usar versión 2D mejorada.
- La gráfica nunca debe ser más importante que el dato.
- Mostrar siempre etiquetas, valores y contexto.
- Incluir comparativos como:
  - real vs meta
  - periodo actual vs anterior
  - tendencia histórica
- Evitar exceso de efectos visuales innecesarios.
- Mantener consistencia entre todos los tipos de gráficas.

## Uso de 3D

- Aplicar 3D de forma controlada.
- Usar profundidad visual solo en módulos clave del dashboard.
- No usar 3D en todos los elementos.
- No hacer rotaciones innecesarias ni animaciones complejas permanentes.
- En móvil o dispositivos de bajo rendimiento, degradar a versión 2D automáticamente.
- El 3D debe mejorar percepción, no dificultar interpretación.

## Responsive design

- Diseñar mobile-first o al menos responsive real.
- Debe funcionar correctamente en:
  - celular
  - tablet
  - laptop
  - monitor grande
- En móvil:
  - apilar cards verticalmente
  - simplificar gráficas complejas
  - priorizar KPIs más importantes
  - ocultar elementos secundarios si estorban
- En tablet:
  - usar grids de 2 columnas cuando sea posible
- En desktop:
  - aprovechar grids amplios sin saturar
- Mantener interacción táctil cómoda en pantallas pequeñas.

## Componentes visuales

- Usar cards con esquinas suaves.
- Aplicar sombras ligeras y profundidad moderada.
- Botones claros, grandes y consistentes.
- Filtros visibles y fáciles de usar.
- Tabs y segmentadores simples.
- Tablas limpias, legibles y con buen espaciado.
- Indicadores de estado con semáforo visual bien definido.

## Colores

- Usar paleta corporativa oscura o clara, pero consistente.
- Recomendación principal:
  - fondo neutro oscuro o gris profundo
  - cards ligeramente más claras
  - color primario elegante
  - color de alerta controlado
- Usar colores funcionales para estados:
  - verde = correcto
  - amarillo = atención
  - rojo = riesgo
  - azul = información
- No depender solo del color para comunicar estado.
- Acompañar color con íconos, etiquetas o texto.

## Tipografía

- Usar tipografía sans-serif moderna y legible.
- Priorizar lectura en pantallas.
- Mantener escalas claras:
  - títulos
  - subtítulos
  - dato KPI
  - texto auxiliar
- Los valores numéricos deben destacar más que el texto secundario.
- Evitar fuentes decorativas.

## Iconografía

- Usar íconos simples y consistentes.
- Apoyar comprensión, no decorar por decorar.
- Usar íconos para:
  - tendencias
  - alertas
  - cumplimiento
  - áreas o categorías
- Evitar mezclar muchos estilos de iconos.

## Animaciones

- Usar animaciones cortas y suaves.
- Animar:
  - carga de cards
  - entrada de gráficas
  - cambios de filtros
  - hover o focus
- Evitar animaciones largas, pesadas o distractoras.
- El movimiento debe comunicar cambio, no espectáculo.

## Experiencia de usuario

- Reducir fricción al consultar KPIs.
- Hacer fácil cambiar:
  - periodo
  - área
  - KPI
  - vista
- Mantener filtros persistentes y visibles.
- Permitir comparar periodos de forma simple.
- Mostrar mensajes claros cuando no haya datos.

## Accesibilidad

- Garantizar buen contraste.
- Asegurar legibilidad en cualquier tamaño de pantalla.
- No usar texto pequeño en datos importantes.
- Hacer botones y controles suficientemente grandes.
- Soportar navegación por teclado cuando sea posible.
- No depender únicamente de colores para interpretar información.

## Tableros recomendados

- Dashboard ejecutivo general
- Dashboard por área
- Vista detalle por KPI
- Histórico por periodos
- Vista comparativa entre periodos
- Vista de alertas o KPIs fuera de meta

## Sensación visual buscada

- Profesional
- Moderna
- Tecnológica
- Analítica
- Clara
- Premium
- Corporativa

## Sensación visual a evitar

- Infantil
- Saturada
- Exageradamente gamer
- Demasiado experimental
- Confusa
- Con exceso de efectos

## Regla principal

- Si una decisión visual compite contra la claridad del KPI, siempre gana la claridad.
