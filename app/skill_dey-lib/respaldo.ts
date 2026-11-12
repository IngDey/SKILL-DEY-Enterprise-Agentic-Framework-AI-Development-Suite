// SKILL_DEY — respaldo y deshacer GARANTIZADOS (lo usan el plugin guardián y la tool skill_dey_deshacer).
// Con git: guarda "fotos" completas del proyecto en refs/skill_dey/<proyecto>/* SIN tocar tus ramas, tu historial ni tu staging.
// Sin git: copia cada archivo antes de editarlo en .skill_dey/respaldos-archivos/<fecha>/ (con manifiesto).
// Reglas de oro: si no puede asegurar el estado actual, NO deshace · solo reescribe archivos que de verdad cambiaron ·
// nunca borra lo ignorado, .env, dependencias, binarios ni datos · cada worktree y cada subproyecto tiene sus propias fotos ·
// nunca usa un repo de tu carpeta personal.
import { spawnSync } from "node:child_process"
import { existsSync, mkdirSync, readFileSync, writeFileSync, copyFileSync, unlinkSync, readdirSync, statSync, lstatSync, rmSync } from "node:fs"
import { join, dirname, resolve, relative, isAbsolute } from "node:path"
import { homedir } from "node:os"
import { createHash } from "node:crypto"

const ID = { GIT_AUTHOR_NAME: "SKILL_DEY", GIT_AUTHOR_EMAIL: "skill_dey@local", GIT_COMMITTER_NAME: "SKILL_DEY", GIT_COMMITTER_EMAIL: "skill_dey@local" }
// rutas con tildes/ñ sin comillas · sin conversión automática de finales de línea · nunca falla por avisos de CRLF
const GITC = ["-c", "core.quotepath=off", "-c", "core.autocrlf=false", "-c", "core.safecrlf=false"]
// Nunca se fotografían ni se restauran/borran: memoria de SKILL_DEY, dependencias/compilados, binarios pesados y DATOS (bases de datos, hojas).
const EXCL_DIRS = [".skill_dey", "node_modules", "vendor", ".venv", "venv", "dist", "build", ".next", ".nuxt", "coverage", "__pycache__"]
const EXCL_EXT = ["zip", "rar", "7z", "gz", "tar", "iso", "dmg", "exe", "msi", "mp4", "mov", "avi", "mkv", "mp3", "wav", "psd", "bak", "dump", "log",
  "sqlite", "sqlite3", "db", "db-wal", "db-shm", "db-journal", "mdb", "accdb", "csv", "xlsx", "xls"]
const POSITIVOS = [...EXCL_DIRS.map((d) => `:(glob)**/${d}/**`), ...EXCL_EXT.map((e) => `:(glob)**/*.${e}`)]
const EXCLUIR = POSITIVOS.map((p) => p.replace(":(glob)", ":(exclude,glob)"))
const EXCL_RE = new RegExp(`(^|/)(${EXCL_DIRS.map((d) => d.replace(/\./g, "\\.")).join("|")})/|\\.(${EXCL_EXT.join("|")})$`, "i")
const PROTEGIDO = /(^|\/)(\.env(?!\.example$)(\..*)?|\.skill_dey\/.*)$/i // .env.example SÍ se versiona y se puede deshacer
const MAX_FOTOS = 150, MAX_ARCHIVO = 30 // ~150 pedidos atrás (git no duplica lo que no cambió: pesa muy poco)

export function git(cwd: string, args: string[], env: Record<string, string> = {}, input?: string) {
  const r = spawnSync("git", [...GITC, ...args], { cwd, encoding: "utf8", maxBuffer: 500_000_000, timeout: 120_000, input, env: { ...process.env, ...ID, ...env } })
  return { ok: r.status === 0, out: (r.stdout ?? "").trim(), raw: r.stdout ?? "", err: (r.stderr ?? "").trim(), sinGit: !!r.error }
}
const lista0 = (s: string) => s.split("\0").filter(Boolean)
export const hayGit = (cwd: string) => !git(cwd, ["--version"]).sinGit
export const esRepo = (cwd: string) => git(cwd, ["rev-parse", "--is-inside-work-tree"]).out === "true"
const raiz = (cwd: string) => git(cwd, ["rev-parse", "--show-toplevel"]).out || cwd
const esCarpetaPeligrosa = (p: string) => { const r = resolve(p); return r === resolve(homedir()) || r === resolve("/") || /^[A-Za-z]:\\?$/.test(r) }

/** Si hay git y la carpeta no es repo (y no es tu carpeta personal ni la raíz), la convierte en repo para poder deshacer. */
export function asegurarRepo(cwd: string): boolean {
  if (!hayGit(cwd)) return false
  if (esRepo(cwd)) return !esCarpetaPeligrosa(raiz(cwd)) // repo en tu carpeta personal (dotfiles): no se usa para fotos
  if (esCarpetaPeligrosa(cwd)) return false
  return git(cwd, ["init", "-q"]).ok
}

type Ctx = { root: string; prefijo: string; gitDir: string; clave: string; spec: string }
/** Contexto git del PROYECTO: raíz del repo, prefijo de la carpeta (si vive dentro de un repo más grande) y su espacio de fotos propio. */
function ctxGit(cwd: string): Ctx {
  const root = raiz(cwd)
  const prefijo = git(cwd, ["rev-parse", "--show-prefix"]).out.replace(/\\/g, "/") // "" o "sub/carpeta/"
  const gd = git(root, ["rev-parse", "--git-dir"]).out || ".git"
  const gitDir = isAbsolute(gd) ? gd : join(root, gd) // cada worktree tiene su propio git-dir
  const clave = createHash("sha1").update(resolve(root) + "|" + prefijo).digest("hex").slice(0, 12) // fotos separadas por worktree + carpeta
  return { root, prefijo, gitDir, clave, spec: prefijo ? prefijo.replace(/\/$/, "") : "." } // todo corre en la raíz del repo
}
const comillas = (t: string) => (t.startsWith('"') ? t : `"${t}"`)
const dentro = (f: string, prefijo: string) => !prefijo || f.startsWith(prefijo)
const REF = (c: Ctx, grupo: string, ...resto: (string | number)[]) => ["refs/skill_dey", c.clave, grupo, ...resto].join("/")

/** Índice temporal propio (nunca el tuyo). Quita bloqueos viejos de una corrida interrumpida. */
function indice(gitDir: string, nombre: string) {
  const idx = join(gitDir, nombre)
  try { if (existsSync(idx + ".lock") && Date.now() - statSync(idx + ".lock").mtimeMs > 120_000) rmSync(idx + ".lock", { force: true }) } catch {}
  return { GIT_INDEX_FILE: idx }
}

/** Arma en un índice propio el estado ACTUAL del proyecto y devuelve el árbol (o null si no pudo). */
function arbolActual(c: Ctx, nombreIdx: string): string | null {
  const env = indice(c.gitDir, nombreIdx)
  const head = git(c.root, ["rev-parse", "--verify", "-q", "HEAD"]).out
  if (!git(c.root, head ? ["read-tree", "HEAD"] : ["read-tree", "--empty"], env).ok) return null
  git(c.root, ["rm", "--cached", "-r", "-q", "--ignore-unmatch", "--", ...POSITIVOS], env) // lo excluido no se guarda NI se restaura (tus cambios ahí quedan intactos)
  // repos anidados sin commits hacen fallar "git add": se excluyen y se reintenta (antes: sin foto → sin deshacer)
  const extra: string[] = []
  for (let i = 0; i < 6; i++) {
    const a = git(c.root, ["add", "-A", "--", c.spec, ...EXCLUIR, ...extra], env)
    if (a.ok) break
    const sub = a.err.match(/'([^']+?)\/?' does not have a commit checked out/)?.[1]
    if (!sub || i === 5) return null
    extra.push(`:(exclude)${sub}`)
  }
  // archivos que TÚ forzaste con "git add -f" aunque estén ignorados: también entran en la foto
  const forzados = lista0(git(c.root, ["ls-files", "-z", "-c", "-i", "--exclude-standard", "--", c.spec]).raw).filter((f) => !EXCL_RE.test(f) && !PROTEGIDO.test(f))
  if (forzados.length) git(c.root, ["add", "-f", "--pathspec-from-file=-", "--pathspec-file-nul"], env, forzados.join("\0") + "\0")
  const secretos = lista0(git(c.root, ["ls-files", "-z"], env).raw).filter((f) => PROTEGIDO.test(f))
  if (secretos.length) git(c.root, ["rm", "--cached", "-q", "--ignore-unmatch", "--pathspec-from-file=-", "--pathspec-file-nul"], env, secretos.join("\0") + "\0")
  return git(c.root, ["write-tree"], env).out || null
}

type Grupo = "pasos" | "deshecho" | "rehacer" | "hitos" | "archivo"
type Foto = { ref: string; commit: string; ts: number; tipo: string; nota: string }
function listar(c: Ctx, grupo: Grupo): Foto[] {
  const r = git(c.root, ["for-each-ref", "--sort=-refname", "--format=%(refname) %(objectname) %(contents:subject)", REF(c, grupo) + "/"])
  if (!r.ok || !r.out) return []
  return r.out.split("\n").map((l) => {
    const [ref, commit, ...resto] = l.split(" ")
    const subj = resto.join(" ")
    const m = subj.match(/^skill_dey\[(\w[\w-]*)\] (.*)$/)
    return { ref, commit, ts: Number(ref.split("/").pop()), tipo: m?.[1] ?? "?", nota: m?.[2] ?? subj }
  }).filter((f) => Number.isFinite(f.ts))
}
let ultimoTs = 0
const nuevoTs = () => (ultimoTs = Math.max(Date.now(), ultimoTs + 1))
const arbolDe = (c: Ctx, commit: string) => git(c.root, ["rev-parse", `${commit}^{tree}`]).out

/** Foto interna: devuelve commit y la marca de tiempo de su ref (o null). */
function fotoInterna(cwd: string, grupo: Grupo, tipo: string, nota: string, deduplicar = true): { commit: string; ts: number } | null {
  if (!asegurarRepo(cwd)) return null
  const c = ctxGit(cwd)
  const tree = arbolActual(c, "skill_dey-index")
  if (!tree) return null
  const ultima = listar(c, grupo)[0]
  if (deduplicar && ultima && arbolDe(c, ultima.commit) === tree) return { commit: ultima.commit, ts: ultima.ts }
  const head = git(c.root, ["rev-parse", "--verify", "-q", "HEAD"]).out
  const commit = git(c.root, ["commit-tree", tree, ...(head ? ["-p", head] : []), "-m", `skill_dey[${tipo}] ${(c.prefijo ? "[" + c.prefijo + "] " : "") + nota.replace(/\s+/g, " ").slice(0, 150)}`]).out
  if (!commit) return null
  const ts = nuevoTs()
  if (!git(c.root, ["update-ref", REF(c, grupo, ts), commit]).ok) return null
  if (grupo === "pasos") {
    for (const vieja of listar(c, "pasos").slice(MAX_FOTOS)) git(c.root, ["update-ref", "-d", vieja.ref])
    if (tipo === "cambio") archivarRehacer(c) // trabajo NUEVO: lo deshecho ya no se rehace (rehacer pisaría este trabajo), pero se ARCHIVA, no se pierde
  }
  return { commit, ts }
}
/** Mueve lo que se podía rehacer a un archivo (últimas 30) en vez de borrarlo: nada se pierde para siempre. */
function archivarRehacer(c: Ctx) {
  for (const g of ["rehacer", "deshecho"] as Grupo[]) for (const f of listar(c, g)) { git(c.root, ["update-ref", REF(c, "archivo", nuevoTs()), f.commit]); git(c.root, ["update-ref", "-d", f.ref]) }
  for (const vieja of listar(c, "archivo").slice(MAX_ARCHIVO)) git(c.root, ["update-ref", "-d", vieja.ref])
}

/** Toma una foto completa del proyecto (archivos versionados + nuevos no ignorados). Devuelve el commit o null. */
export function foto(cwd: string, grupo: "pasos" | "rehacer", tipo: string, nota: string): string | null {
  return fotoInterna(cwd, grupo, tipo, nota)?.commit ?? null
}

/** Deja los archivos del PROYECTO exactamente como en la foto. Solo reescribe los que cambiaron, nunca borra lo ignorado,
 *  y si algo puede perder datos (una carpeta donde va un archivo) NO toca nada. */
function aplicar(c: Ctx, commit: string): { ok: boolean; restaurados: number; borrados: string[]; error?: string } {
  const no = (error: string) => ({ ok: false, restaurados: 0, borrados: [] as string[], error })
  if (!git(c.root, ["cat-file", "-e", `${commit}^{commit}`]).ok) return no("la foto ya no existe en git")
  const lt = git(c.root, ["ls-tree", "-r", "-z", "--full-tree", commit])
  if (!lt.ok) return no("no pude leer la foto")
  const blobs = new Map<string, string>() // ruta → blob de la foto
  for (const e of lista0(lt.raw)) { const m = e.match(/^\d+ blob ([0-9a-f]+)\t([\s\S]+)$/); if (m && dentro(m[2], c.prefijo) && !PROTEGIDO.test(m[2]) && !EXCL_RE.test(m[2])) blobs.set(m[2], m[1]) }
  // 1) ¿hay una CARPETA donde la foto tiene un archivo? → abortar (checkout la vaciaría, con lo ignorado adentro)
  const choque = [...blobs.keys()].find((f) => { try { return lstatSync(join(c.root, f)).isDirectory() } catch { return false } })
  if (choque) return no(`"${choque}" ahora es una carpeta y en la foto era un archivo; muévela o renómbrala y repite (no toco nada para no perder lo que tiene dentro)`)
  // 2) solo los archivos que de verdad cambiaron (no reescribe el resto: respeta finales de línea, fechas y tu servidor en marcha)
  const existentes = [...blobs.keys()].filter((f) => { try { return lstatSync(join(c.root, f)).isFile() } catch { return false } })
  const hashes = existentes.length ? git(c.root, ["hash-object", "--stdin-paths"], {}, existentes.join("\n") + "\n").out.split("\n") : []
  const igual = new Set(existentes.filter((f, i) => hashes[i] === blobs.get(f)))
  const cambiar = [...blobs.keys()].filter((f) => !igual.has(f))
  const actuales = lista0(git(c.root, ["ls-files", "-z", "-co", "--exclude-standard", "--", c.spec, ...EXCLUIR]).raw)
  const forzados = lista0(git(c.root, ["ls-files", "-z", "-c", "-i", "--exclude-standard", "--", c.spec]).raw)
  const env = indice(c.gitDir, "skill_dey-index")
  if (!git(c.root, ["read-tree", commit], env).ok) return no("no pude cargar la foto")
  if (cambiar.length) {
    const r = git(c.root, ["checkout-index", "-f", "-z", "--stdin"], env, cambiar.join("\0") + "\0")
    if (!r.ok) return no("no pude restaurar: " + r.err.slice(0, 160))
  }
  // 3) borrar lo creado DESPUÉS de la foto — salvo lo que (con el .gitignore ya restaurado) está ignorado
  const candidatos = [...new Set([...actuales, ...forzados])].filter((f) => !blobs.has(f) && !PROTEGIDO.test(f) && !EXCL_RE.test(f) && dentro(f, c.prefijo))
  const ignorados = new Set(candidatos.length ? lista0(git(c.root, ["check-ignore", "--no-index", "-z", "--stdin"], {}, candidatos.join("\0") + "\0").raw) : [])
  const borrados: string[] = []
  for (const f of candidatos) { if (ignorados.has(f) && !forzados.includes(f)) continue; try { unlinkSync(join(c.root, f)); borrados.push(f) } catch {} }
  return { ok: true, restaurados: cambiar.length, borrados }
}

function difResumen(root: string, desde: string, hasta: string) {
  return git(root, ["diff", "--stat", "--stat-width=90", desde, hasta]).out.split("\n").slice(-12).join("\n")
}

export function deshacer(cwd: string, pasos = 1): string {
  if (!esRepo(cwd) || esCarpetaPeligrosa(raiz(cwd))) return deshacerSinGit(cwd)
  const c = ctxGit(cwd)
  const fotos = listar(c, "pasos")
  if (!fotos.length) return "No hay cambios de SKILL_DEY para deshacer en este proyecto." // (en un repo NUNCA se usan respaldos viejos sin git)
  const n = Math.min(Math.max(1, pasos), fotos.length)
  const objetivo = fotos[n - 1]
  const actual = fotoInterna(cwd, "rehacer", "antes-de-deshacer", `estado antes de deshacer ${n} paso(s)`, false)
  if (!actual) return "⛔ No deshice nada: no pude guardar primero el estado actual (para poder rehacer). Cierra otros procesos de git y repite."
  const r = aplicar(c, objetivo.commit)
  if (!r.ok) { git(c.root, ["update-ref", "-d", REF(c, "rehacer", actual.ts)]); return `⛔ No deshice nada: ${r.error}. Tus archivos quedaron como estaban.` }
  for (const f of fotos.slice(0, n)) { git(c.root, ["update-ref", REF(c, "deshecho", actual.ts, f.ts), f.commit]); git(c.root, ["update-ref", "-d", f.ref]) }
  return [
    `↩ Deshecho(s) ${n} cambio(s). Proyecto restaurado a como estaba antes de: ${comillas(objetivo.nota)} (${new Date(objetivo.ts).toLocaleString()}).`,
    difResumen(c.root, actual.commit, objetivo.commit),
    r.borrados.length ? `Archivos creados por el cambio y eliminados: ${r.borrados.slice(0, 10).join(", ")}${r.borrados.length > 10 ? "…" : ""}` : "",
    "Se puede REHACER si fue un error. .env, ignorados, dependencias y datos no se tocaron. Si hubo migraciones de BD, revierte también la BD (ver respaldos-bd).",
  ].filter(Boolean).join("\n")
}

export function rehacer(cwd: string): string {
  if (!esRepo(cwd)) return "Rehacer solo está disponible en proyectos con git."
  const c = ctxGit(cwd)
  const r = listar(c, "rehacer")[0]
  if (!r) return "No hay nada para rehacer."
  const seguro = fotoInterna(cwd, "pasos", "antes-de-rehacer", "estado antes de rehacer", false) // rehacer también se puede deshacer
  if (!seguro) return "⛔ No rehice nada: no pude guardar primero el estado actual. Repite en un momento."
  const r2 = aplicar(c, r.commit)
  if (!r2.ok) { git(c.root, ["update-ref", "-d", REF(c, "pasos", seguro.ts)]); return `⛔ No rehice nada: ${r2.error}.` }
  git(c.root, ["update-ref", "-d", r.ref])
  const vuelven = listar(c, "deshecho").filter((x) => x.ref.includes(`/deshecho/${r.ts}/`))
  for (const d of vuelven) { git(c.root, ["update-ref", REF(c, "pasos", d.ts), d.commit]); git(c.root, ["update-ref", "-d", d.ref]) }
  // si la foto de seguridad es idéntica al paso que volvió, sobra (si no, el próximo "deshacer" no haría nada)
  const masNuevo = vuelven.sort((a, b) => b.ts - a.ts)[0]
  if (masNuevo && arbolDe(c, masNuevo.commit) === arbolDe(c, seguro.commit)) git(c.root, ["update-ref", "-d", REF(c, "pasos", seguro.ts)])
  return `↪ Rehecho: el proyecto volvió al estado anterior al deshacer. ${r2.borrados.length ? "Eliminados: " + r2.borrados.slice(0, 10).join(", ") : ""}`.trim()
}

export function historial(cwd: string): string {
  if (!esRepo(cwd) || esCarpetaPeligrosa(raiz(cwd))) {
    const l = turnosSinGit(cwd).slice(0, 20)
    return l.length ? "Respaldos (sin git) · 1 = el último:\n" + l.map((x, i) => { const p = (leerManifiesto(join(BASE_SIN_GIT(cwd), x)) as any).pedido; return `${i + 1}. ${x.slice(0, 16).replace("T", " ")}${p ? ` · "${p}"` : ""}` }).join("\n") : "Sin respaldos."
  }
  const c = ctxGit(cwd)
  const f = listar(c, "pasos")
  const lineas = f.slice(0, 25).map((x, i) => `${i + 1}. ${new Date(x.ts).toLocaleString()} · antes de: ${x.nota}`)
  const reh = listar(c, "rehacer").length
  return (lineas.length ? `Puntos guardados (también de sesiones anteriores) · 1 = el más reciente${f.length > 25 ? ` · hay ${f.length} en total` : ""}:\n` + lineas.join("\n") + `\n\nPara volver: "vuelve al punto 3" o "vuelve a antes de <lo que pediste>". Siempre se puede rehacer.` : "No hay cambios para deshacer.") + (reh ? `\n(${reh} deshacer reversible con rehacer)` : "")
}

/** Deshace TODO lo hecho desde `desde` (ms): todas las fotos de ese pedido (incluye los reintentos automáticos). Reversible con rehacer. */
export function deshacerDesde(cwd: string, desde: number, commitBase = ""): string {
  if (!esRepo(cwd) || esCarpetaPeligrosa(raiz(cwd))) {
    const out: string[] = []
    for (let i = 0; i < 10; i++) { const t = turnosSinGit(cwd)[0]; if (!t) break; const ms = Date.parse(t.replace(/^(\d{4}-\d{2}-\d{2}T\d{2})-(\d{2})-(\d{2})-(\d{3})Z.*$/, "$1:$2:$3.$4Z")); if (!Number.isFinite(ms) || ms < desde - 1000) break; out.push(deshacerSinGit(cwd)) }
    return out.join("\n") || "No había nada que deshacer."
  }
  const fotos = listar(ctxGit(cwd), "pasos")
  const iBase = commitBase ? fotos.findIndex((f) => f.commit === commitBase) : -1 // la foto "antes del pedido" (puede ser más vieja si el proyecto no había cambiado)
  const n = iBase >= 0 ? iBase + 1 : fotos.filter((f) => f.ts >= desde - 1000).length
  return n ? deshacer(cwd, n) : "No había nada que deshacer."
}

/** Número del punto guardado cuyo pedido coincide con el texto ("vuelve a antes de arreglar el login"). 0 si no hay. */
export function buscarPaso(cwd: string, texto: string): { n: number; nota: string } {
  const norm = (x: string) => x.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9ñ ]+/g, " ").replace(/\s+/g, " ").trim()
  const q = norm(texto).split(" ").filter((w) => w.length > 2 && !/^(los|las|del|que|cuando|antes|como|estaba|para|con)$/.test(w))
  if (!q.length || !esRepo(cwd)) return { n: 0, nota: "" }
  const fotos = listar(ctxGit(cwd), "pasos")
  let mejor = { n: 0, nota: "", p: 0 }
  const raizDe = (w: string) => w.slice(0, Math.max(4, w.length - 2)) // "arreglar" ≈ "arregla" ≈ "arreglo"
  fotos.forEach((f, i) => { const tw = norm(f.nota).split(" "), p = q.filter((w) => tw.some((x) => x.startsWith(raizDe(w)) || w.startsWith(raizDe(x)) && x.length > 3)).length / q.length; if (p > mejor.p) mejor = { n: i + 1, nota: f.nota, p } })
  return mejor.p >= 0.6 ? { n: mejor.n, nota: mejor.nota } : { n: 0, nota: "" }
}

// ---------- CHECKPOINTS (time-travel): hitos con nombre, en refs propias que NUNCA se podan ----------
const HITOS = (cwd: string) => join(cwd, ".skill_dey", "HITOS.json")
const leerHitos = (cwd: string): any[] => { try { const j = JSON.parse(readFileSync(HITOS(cwd), "utf8")); return Array.isArray(j) ? j : [] } catch { return [] } }

/** Guarda un punto nombrado al que se puede volver exactamente. */
export function checkpoint(cwd: string, nombre: string): string {
  if (!nombre || !nombre.trim()) return "dale un nombre, ej: /skill_dey checkpoint antes-de-pagos"
  if (!asegurarRepo(cwd)) return "los checkpoints necesitan git (haz git init)"
  const f = fotoInterna(cwd, "pasos", "checkpoint", "hito: " + nombre)
  if (!f) return "no pude crear el checkpoint"
  const c = ctxGit(cwd)
  git(c.root, ["update-ref", REF(c, "hitos", nuevoTs()), f.commit]) // protege el commit de la poda y del recolector de git
  const j = leerHitos(cwd).filter((h) => h.nombre !== nombre.trim())
  j.push({ nombre: nombre.trim(), commit: f.commit, ts: Date.now() })
  try { mkdirSync(join(cwd, ".skill_dey"), { recursive: true }); writeFileSync(HITOS(cwd), JSON.stringify(j, null, 1)) } catch {}
  return `📍 Checkpoint "${nombre.trim()}" guardado. Vuelve con: /skill_dey volver ${nombre.trim()}`
}

export function listarHitos(cwd: string): string {
  const j = leerHitos(cwd)
  if (!j.length) return "No hay checkpoints. Crea uno con /skill_dey checkpoint <nombre>."
  return "📍 Checkpoints (vuelve con /skill_dey volver <nombre>):\n" + j.slice().reverse().map((h) => `  · ${h.nombre} — ${new Date(h.ts).toLocaleString()}`).join("\n")
}

/** Restaura el proyecto EXACTAMENTE a un checkpoint (por nombre o número). Reversible con rehacer. */
export function volver(cwd: string, nombre: string): string {
  if (!esRepo(cwd)) return "volver necesita git"
  const c = ctxGit(cwd)
  const j = leerHitos(cwd)
  const h = j.find((x) => x.nombre === (nombre || "").trim()) || (/^\d+$/.test((nombre || "").trim()) ? j.slice().reverse()[Number(nombre) - 1] : null)
  if (!h) return `no encuentro el checkpoint "${nombre}". Mira /skill_dey hitos`
  if (!/^[0-9a-f]{7,64}$/i.test(String(h.commit)) || !git(c.root, ["cat-file", "-e", `${h.commit}^{commit}`]).ok) return `⛔ El checkpoint "${h.nombre}" ya no existe en git (¿copiaste el proyecto sin su .git?). No toqué nada.`
  const seguro = fotoInterna(cwd, "rehacer", "antes-de-volver", `estado antes de volver a ${h.nombre}`, false)
  if (!seguro) return "⛔ No volví: no pude guardar primero el estado actual. No toqué nada."
  const r = aplicar(c, h.commit)
  if (!r.ok) { git(c.root, ["update-ref", "-d", REF(c, "rehacer", seguro.ts)]); return `⛔ No volví: ${r.error}. Tus archivos quedaron como estaban.` }
  return `⏮ Restaurado al checkpoint "${h.nombre}" (${new Date(h.ts).toLocaleString()}). ${r.restaurados} archivo(s)${r.borrados.length ? `, ${r.borrados.length} creados después eliminados` : ""}. Reversible con /skill_dey rehacer. (.env y BD no se tocan)`
}

// ---------- respaldo por archivo cuando NO hay git (o proyecto enorme sin git) ----------
const BASE_SIN_GIT = (cwd: string) => join(cwd, ".skill_dey", "respaldos-archivos")
const leerManifiesto = (dir: string): { archivos: { ruta: string; existia: boolean }[] } => {
  try { const m = JSON.parse(readFileSync(join(dir, "manifiesto.json"), "utf8")); if (Array.isArray(m?.archivos)) return m } catch {}
  return { archivos: [] }
}
function turnosSinGit(cwd: string): string[] {
  const base = BASE_SIN_GIT(cwd)
  try { return readdirSync(base).filter((d) => { try { return statSync(join(base, d)).isDirectory() } catch { return false } }).sort().reverse() } catch { return [] }
}

export function respaldarArchivo(cwd: string, archivo: string, turno: string, pedido = "") {
  try {
    const abs = isAbsolute(archivo) ? archivo : join(cwd, archivo)
    const rel = relative(cwd, abs)
    if (!rel || rel.startsWith("..") || isAbsolute(rel) || rel.startsWith(".skill_dey")) return
    const dir = join(BASE_SIN_GIT(cwd), turno)
    mkdirSync(dir, { recursive: true })
    const m = leerManifiesto(dir)
    if (m.archivos.some((a) => a.ruta === rel)) return // ya respaldado en este turno (se guarda el estado ORIGINAL)
    const existia = existsSync(abs) && statSync(abs).isFile()
    if (existia) { mkdirSync(dirname(join(dir, "archivos", rel)), { recursive: true }); copyFileSync(abs, join(dir, "archivos", rel)) }
    m.archivos.push({ ruta: rel, existia })
    if (pedido && !(m as any).pedido) (m as any).pedido = pedido.replace(/\s+/g, " ").slice(0, 120)
    writeFileSync(join(dir, "manifiesto.json"), JSON.stringify(m, null, 1))
    for (const viejo of turnosSinGit(cwd).slice(40)) rmSync(join(BASE_SIN_GIT(cwd), viejo), { recursive: true, force: true }) // tope de espacio
  } catch {}
}

function deshacerSinGit(cwd: string): string {
  const turnos = turnosSinGit(cwd)
  if (!turnos.length) return "No hay respaldos para deshacer (instala git para protección completa)."
  const dir = join(BASE_SIN_GIT(cwd), turnos[0])
  const m = leerManifiesto(dir)
  const hecho: string[] = [], faltan: string[] = []
  for (const a of m.archivos) { // 1) restaurar todo lo que existía
    if (!a.existia) continue
    const src = join(dir, "archivos", a.ruta), dst = join(cwd, a.ruta)
    if (!existsSync(src)) { faltan.push(a.ruta); continue }
    try { mkdirSync(dirname(dst), { recursive: true }); copyFileSync(src, dst); hecho.push("restaurado " + a.ruta) } catch { faltan.push(a.ruta) }
  }
  if (faltan.length) return `⛔ No terminé de deshacer: falta la copia de ${faltan.slice(0, 5).join(", ")}. Restauré lo demás y conservé el respaldo en .skill_dey/respaldos-archivos/${turnos[0]}.`
  for (const a of m.archivos) if (!a.existia) { const dst = join(cwd, a.ruta); try { if (existsSync(dst) && statSync(dst).isFile()) { unlinkSync(dst); hecho.push("eliminado " + a.ruta) } } catch {} } // 2) quitar lo creado
  rmSync(dir, { recursive: true, force: true })
  return `↩ Deshecho el último cambio (sin git):\n${hecho.join("\n") || "(nada que cambiar)"}`
}

/** Diff EXACTO (archivo · línea · palabra) desde el último checkpoint, para saber qué volver si algo falla. */
export function cambiosExactos(cwd: string, max = 80): string {
  if (!esRepo(cwd)) return "Sin git en este proyecto: no puedo mostrar el diff exacto ni revertir. Conviene activar git para la red de seguridad."
  const c = ctxGit(cwd)
  const fotos = listar(c, "pasos")
  if (!fotos.length) return "Aún no hay checkpoint en esta sesión (el primer cambio crea uno)."
  const tree = arbolActual(c, "skill_dey-index-dif")
  if (!tree) return "No pude calcular los cambios."
  const d = git(c.root, ["diff", "--word-diff=plain", "--unified=0", fotos[0].commit + "^{tree}", tree, "--", c.spec]).out
  if (!d.trim()) return "✅ Sin cambios desde el último checkpoint."
  const out: string[] = ["SKILL_DEY · cambios exactos desde el último checkpoint", "(para volver si algo falla: /skill_dey deshacer)", ""]
  let n = 0
  for (const l of d.split("\n")) {
    if (l.startsWith("+++ b/")) { out.push("· " + l.slice(6)); continue }
    const m = l.match(/^@@ -\d+(?:,\d+)? \+(\d+)/); if (m) { out.push("  línea " + m[1] + ":"); continue }
    if (/\[-|\{\+/.test(l) && n < max) { out.push("    " + l.trim().slice(0, 160)); n++ }
  }
  if (n >= max) out.push("  … (" + max + "+ cambios)")
  return out.join("\n")
}

/** Deshace SOLO un archivo: lo deja como estaba antes de su último cambio (el resto del proyecto no se toca).
 *  Si el archivo lo creó el cambio, lo mueve a .skill_dey/papelera/ (no lo borra). Reversible con "deshaz". */
export function deshacerArchivo(cwd: string, ruta: string): string {
  const abs = resolve(cwd, ruta.trim().replace(/^["'`]|["'`]$/g, ""))
  const rel = relative(cwd, abs).replace(/\\/g, "/")
  if (!rel || rel.startsWith("..") || isAbsolute(rel)) return `⛔ "${ruta}" está fuera del proyecto: no lo toco.`
  if (PROTEGIDO.test(rel) || EXCL_RE.test(rel)) return `⛔ "${rel}" no se restaura (.env, datos, dependencias o compilados nunca entran en las copias).`
  if (existsSync(abs) && !statSync(abs).isFile()) return `⛔ "${rel}" es una carpeta: dime el archivo exacto.`
  const papelera = () => { const d = join(cwd, ".skill_dey", "papelera", String(Date.now()), rel); mkdirSync(dirname(d), { recursive: true }); copyFileSync(abs, d); unlinkSync(abs); return `.skill_dey/papelera/…/${rel}` }
  if (!esRepo(cwd) || esCarpetaPeligrosa(raiz(cwd))) { // sin git: la copia por archivo más reciente que lo tenga
    for (const t of turnosSinGit(cwd)) {
      const dir = join(BASE_SIN_GIT(cwd), t), m = leerManifiesto(dir), a = m.archivos.find((x) => x.ruta.replace(/\\/g, "/") === rel)
      if (!a) continue
      try {
        if (a.existia) { const src = join(dir, "archivos", a.ruta); if (!existsSync(src)) return `⛔ falta la copia de ${rel}; no toqué nada.`; mkdirSync(dirname(abs), { recursive: true }); copyFileSync(src, abs) }
        else if (existsSync(abs)) { const p = papelera(); m.archivos = m.archivos.filter((x) => x !== a); writeFileSync(join(dir, "manifiesto.json"), JSON.stringify(m, null, 1)); return `↩ ${rel} lo había creado el cambio: lo moví a ${p} (no se borró).` }
        m.archivos = m.archivos.filter((x) => x !== a); writeFileSync(join(dir, "manifiesto.json"), JSON.stringify(m, null, 1))
        return `↩ Solo ${rel} volvió a como estaba (${t}). El resto del proyecto quedó igual.`
      } catch (e: any) { return `⛔ No pude restaurar ${rel}: ${e.message}. No toqué nada más.` }
    }
    return `No hay copia de ${rel}: skill_dey no lo cambió (o la copia ya se usó).`
  }
  const c = ctxGit(cwd), p = c.prefijo + rel
  const fotos = listar(c, "pasos")
  if (!fotos.length) return "No hay cambios de SKILL_DEY para deshacer en este proyecto."
  const blobDe = (commit: string) => { const l = git(c.root, ["ls-tree", "-z", commit, "--", p]).raw.split("\0")[0]; const m = l.match(/^\d+ blob ([0-9a-f]+)\t/); return m?.[1] ?? "" }
  const actual = existsSync(abs) ? git(c.root, ["hash-object", "--path=" + p, "--", p]).out : ""
  const previa = fotos.find((f) => blobDe(f.commit) !== actual) // la foto más nueva donde el archivo era DISTINTO = antes de su último cambio
  if (!previa) return `✅ ${rel} ya está como en todas las copias guardadas: no hay nada que deshacer en él.`
  const blob = blobDe(previa.commit)
  if (!fotoInterna(cwd, "pasos", "antes-de-deshacer-archivo", `antes de deshacer ${rel}`, false)) return "⛔ No deshice nada: no pude guardar primero el estado actual. Repite en un momento."
  try {
    if (!blob) { if (existsSync(abs)) return `↩ ${rel} no existía antes del cambio: lo moví a ${papelera()} (no se borró). "deshaz" lo devuelve.`; return `✅ ${rel} no existe y antes tampoco existía.` }
    const r = spawnSync("git", [...GITC, "cat-file", "blob", blob], { cwd: c.root, maxBuffer: 500_000_000, timeout: 60_000 })
    if (r.status !== 0 || !r.stdout) return `⛔ No pude leer la copia de ${rel}; no toqué nada.`
    mkdirSync(dirname(abs), { recursive: true }); writeFileSync(abs, r.stdout)
  } catch (e: any) { return `⛔ No pude restaurar ${rel}: ${e.message}. No toqué nada más.` }
  return `↩ Solo ${rel} volvió a como estaba antes de ${comillas(previa.nota)} (${new Date(previa.ts).toLocaleString()}). El resto del proyecto quedó igual. Si fue un error: "deshaz".`
}
