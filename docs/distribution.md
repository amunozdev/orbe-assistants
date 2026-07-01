# Distribución de los orbes

Este proyecto es una **galería copy-paste**: cada orbe vive en `src/registry/orbe/<orb>/` y es la
fuente de verdad. Hay dos vías para que un usuario se lleve un orbe a su proyecto.

## 1. Copy code

Cada tarjeta de la galería expone **"Ver código"** con tabs por archivo (`*.tsx`,
`*.module.css`, variante Tailwind) y un botón **"Copiar código"** que copia el archivo al
portapapeles. El usuario pega los archivos, añade las utilidades compartidas de
`src/registry/lib/` (`orb-state.ts`, `use-orb-level.ts`, `use-audio-level.ts`) e instala las
dependencias que indique la tarjeta.

## 2. Copy prompt para IA

Botón **"Copiar prompt para IA"** por orbe. Copia un prompt autocontenido (utilidades
compartidas + archivos del orbe + contrato de props/estados) optimizado para pegar en
Cursor / Copilot / Claude Code y que el asistente recree el orbe adaptándolo al proyecto.
El prompt se genera en `src/registry/prompt.ts`.

## Contrato común (para customización)

Props: `state`, `size`, `speed`, `colorFrom`, `colorTo`, `levelRef`, `label`, `className`.
CSS vars públicas: `--orb-size`, `--orb-speed`, `--orb-color-from`, `--orb-color-to`,
`--orb-level`.

- Orbes CSS-driven (`pulse-orb`, `glass-orb`): variante Tailwind (`*-tw.tsx`) y CSS Module.
- Orbes logic-driven (`gooey`, `plasma`, `nebula`): JS/SVG/GLSL con `className` passthrough,
  una sola implementación.
