---
name: politicas-ia
description: Política de uso seguro de IA para las personas de una empresa (qué usar, qué no, qué datos nunca compartir), o evaluar si un uso de IA es seguro.
license: MIT
metadata:
  version: "41.0.0"
  author: Ing. Dey (@IngDey)
  idioma: es
---

# Políticas de uso seguro de IA (para personas)

Objetivo: que la gente use IA para trabajar mejor **sin** exponer datos, dinero ni reputación de la empresa. Escribe para personas no técnicas: frases cortas, ejemplos reales, nada de jerga.

## 1. Antes de redactar, pregunta (máx. 5)
1. Empresa, sector y país (ley de datos aplicable: Colombia Ley 1581/2012, UE RGPD, etc.).
2. Herramientas de IA ya aprobadas o contratadas (y con qué licencia: personal o empresarial).
3. Datos más sensibles que manejan (clientes, nómina, salud, financieros, propiedad industrial).
4. ¿Quién aprueba nuevas herramientas? (TI, comité, gerencia).
5. ¿Formato? (política formal, guía de una página, capacitación, lista de chequeo).
Si el usuario no sabe, usa supuestos conservadores y márcalos como `[confirmar]`.

## 2. Clasificación de datos (semáforo)
| Nivel | Ejemplos | ¿A una IA? |
|---|---|---|
| 🟢 Público | Página web, catálogos publicados, textos ya publicados | Sí, en cualquier herramienta aprobada |
| 🟡 Interno | Procedimientos, actas sin datos personales, borradores | Solo herramientas **empresariales** aprobadas (sin entrenamiento con tus datos) |
| 🔴 Confidencial | Datos personales, cédulas, nómina, claves, contratos, estados financieros, código fuente, datos de clientes | **Nunca** en IA pública. Solo en entornos aprobados por TI para ese uso, anonimizado cuando se pueda |

## 3. Contenido mínimo de la política
1. **Propósito y alcance:** a quién aplica (empleados, contratistas, practicantes) y qué herramientas cubre (chat, asistentes de correo, código, imagen, voz, extensiones del navegador, agentes).
2. **Herramientas aprobadas / prohibidas:** lista concreta con el uso permitido de cada una. Toda herramienta nueva pasa por TI antes de usarse, incluidas extensiones y "apps de IA gratis".
3. **Reglas de oro (nunca):** pegar contraseñas, claves de API o tokens; subir datos personales o de clientes a IA pública; enviar documentos confidenciales; dejar que un agente de IA envíe correos, pague, borre o publique sin revisión humana; usar cuentas personales para trabajo.
4. **Siempre:** revisar lo que la IA produce antes de usarlo (puede inventar datos, citas o cifras); decir cuándo un entregable se hizo con IA si la política lo exige; usar la cuenta corporativa; anonimizar.
5. **Riesgos específicos:** suplantación (voz o video falsos de jefes pidiendo pagos), phishing redactado con IA, instrucciones ocultas en documentos o páginas que manipulan al asistente (*prompt injection*), propiedad intelectual y derechos de autor.
6. **Agentes y automatizaciones:** permisos mínimos; acciones con dinero, borrado o envío externo requieren aprobación humana; registro de lo que hicieron.
7. **Reporte de incidentes:** a quién avisar si se compartió algo indebido (canal, plazo máximo, sin castigo por reportar a tiempo).
8. **Responsables, sanciones y revisión:** dueño de la política, consecuencias y fecha de revisión (mínimo cada 6 meses: la IA cambia rápido).

## 4. Entregables posibles
- **Política formal** (secciones 1–8, versión, fecha, aprobaciones).
- **Guía de una página** con el semáforo y 10 reglas.
- **Lista de chequeo de 30 segundos** antes de pegar algo en una IA:
  ¿Es público? · ¿Hay datos de personas o clientes? · ¿Hay claves o números de cuenta? · ¿La herramienta es la aprobada y con cuenta de la empresa? · ¿Voy a revisar el resultado antes de usarlo?
- **Capacitación** con 5 casos: correo urgente del "gerente" pidiendo transferencia, USB encontrado, archivo de nómina para "resumir", extensión de IA gratis, agente que quiere enviar un correo masivo.

## 5. Evaluar un uso concreto
Responde: ✅ permitido / ⚠ permitido con condiciones / ⛔ no permitido, con el motivo en 1 línea y la alternativa segura.

## Estilo
Español claro, tuteo o usted según la empresa, sin tecnicismos. Nada de alarmismo: la IA es bienvenida, con reglas. No es asesoría legal: recomienda que el área jurídica valide la versión final.
