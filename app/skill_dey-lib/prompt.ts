// SKILL_DEY — OPTIMIZADOR del pedido (gratis, 0 tokens del modelo): toma lo que escribes, aunque sea vago, y lo
// reescribe como una instrucción clara y estructurada (objetivo, criterios, lo implícito deducido, qué aclarar).
// Hace acertar más a modelos flojos y evita idas y vueltas. Lo hace el CÓDIGO, no el modelo.
import { clasificar } from "./ruteo.ts"

/** Reescribe el pedido del usuario como un prompt estructurado y completo. */
export function optimizarPrompt(texto: string): string {
  const t = (texto || "").trim()
  if (!t) return "escribe el pedido a optimizar, ej: /skill_dey prompt agrega el login de usuarios"
  const nivel = clasificar(t)
  const tl = t.toLowerCase()
  const falta: string[] = []
  if (!/\b(archivo|pantalla|p[aá]gina|vista|componente|ruta|secci[oó]n|\.php|\.js|\.ts|\.vue|\.html)\b/i.test(tl)) falta.push("¿en qué pantalla/archivo exactamente?")
  if (/\b(crea|agrega|formulario|registro|guardar|campo|alta)\b/i.test(tl) && !/valida/i.test(tl)) falta.push("¿qué campos y cuáles son obligatorios?")
  if (/\b(usuario|login|acceso|rol|privado|admin)\b/i.test(tl) && !/permiso|rol/i.test(tl)) falta.push("¿qué permisos o roles?")
  if (/\b(lista|tabla|reporte|datos|consulta)\b/i.test(tl) && !/vac[ií]o|sin datos/i.test(tl)) falta.push("¿qué mostrar si no hay datos o si falla?")
  if (/\b(integr|conecta|api|servicio|pago|correo|whatsapp)\b/i.test(tl) && !/credencial|clave|token|\.env/i.test(tl)) falta.push("¿qué credenciales/servicio? (van en .env, no en el código)")
  return [
    "📝 Pedido optimizado (úsalo tal cual o pégalo):",
    "",
    `🎯 Objetivo: ${t}`,
    `📐 Nivel estimado: ${nivel}${nivel === "complejo" ? " → conviene un modelo potente" : " → basta un modelo rápido/barato"}`,
    "📋 Incluir por defecto (deducido, no hace falta pedirlo): validación de entradas · permisos/sesión · estados vacío y de error · responsive (móvil) · mensajes claros al usuario.",
    "✅ Criterios de aceptación: funciona sin errores (código y consola) · no rompe lo existente (deja cómo deshacer) · cubre CADA punto pedido · con pruebas reales si toca UI o datos.",
    "🚫 Restricciones: cambios quirúrgicos · no inventar nombres/rutas/APIs · sin secretos en el código (usar .env).",
    falta.length ? "⚠ Conviene aclarar antes (si aplica): " + falta.join(" · ") : "✔ Tiene suficiente detalle para empezar.",
  ].join("\n")
}
