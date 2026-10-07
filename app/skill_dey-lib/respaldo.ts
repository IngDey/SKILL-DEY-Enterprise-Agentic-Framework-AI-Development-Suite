// SKILL_DEY — respaldo y deshacer GARANTIZADOS (lo usan el plugin guardián y la tool skill_dey_deshacer).
// Con git: guarda "fotos" completas del proyecto en refs/skill_dey/* SIN tocar tus ramas, tu historial ni tu staging.
// Sin git: copia cada archivo antes de editarlo en .skill_dey/respaldos-archivos/<fecha>/ (con manifiesto).
import { spawnSync } from "node:child_process"
import { existsSync, mkdirSync, readFileSync, writeFileSync, copyFileSync, unlinkSync, readdirSync, statSync, rmSync } from "node:fs"
import { join, dirname, resolve, relative, isAbsolute } from "node:path"
import { homedir } from "node:os"

const ID = { GIT_AUTHOR_NAME: "SKILL_DEY", GIT_AUTHOR_EMAIL: "skill_dey@local", GIT_COMMITTER_NAME: "SKILL_DEY", GIT_COMMITTER_EMAIL: "skill_dey@local" }
// Nunca se fotografían ni se restauran/borran: secretos (.env*), memoria de SKILL_DEY (.skill_dey/) ni dependencias/compilados.
const EXCLUIR = [
  ":(exclude,glob)**/.skill_dey/**",
  ":(exclude,glob)**/node_modules/**", ":(exclude,glob)**/vendor/**", ":(exclude,glob)**/.venv/**", ":(exclude,glob)**/venv/**",
  ":(exclude,glob)**/dist/**", ":(exclude,glob)**/build/**", ":(exclude,glob)**/.next/**", ":(exclude,glob)**/.nuxt/**", ":(exclude,glob)**/coverage/**",
  ":(exclude,glob)**/__pycache__/**",
]
const PROTEGIDO = /(^|\/)(\.env(?!\.example$)(\..*)?|\.skill_dey\/.*)$/ // .env.example SÍ se versiona y se puede deshacer
const MAX_FOTOS = 60

export function git(cwd: string, args: string[], env: Record<string, string> = {}) {
  const r = spawnSync("git", args, { cwd, encoding: "utf8", maxBuffer: 200_000_000, timeout: 120_000, env: { ...process.env, ...ID, ...env } })
  return { ok: r.status === 0, out: (r.stdout ?? "").trim(), err: (r.stderr ?? "").trim(), sinGit: !!r.error }
}
export const hayGit = (cwd: string) => !git(cwd, ["--version"]).sinGit
export const esRepo = (cwd: string) => git(cwd, ["rev-parse", "--is-inside-work-tree"]).out === "true"
const raiz = (cwd: string) => git(cwd, ["rev-parse", "--show-toplevel"]).out || cwd

/** Si hay git y la carpeta no es repo (y no es tu carpeta personal ni la raíz), la convierte en repo para poder deshacer. */
export function asegurarRepo(cwd: string): boolean {
  if (!hayGit(cwd)) return false
  if (esRepo(cwd)) return true
  const r = resolve(cwd)
  if (r === resolve(homedir()) || r === resolve("/") || /^[A-Za-z]:\\?$/.test(r)) return false
  return git(cwd, ["init", "-q"]).ok
}

type Foto = { ref: string; commit: string; ts: number; tipo: string; nota: string }
function listar(cwd: string, grupo: "pasos" | "deshecho" | "rehacer"): Foto[] {
  const r = git(cwd, ["for-each-ref", "--sort=-refname", "--format=%(refname) %(objectname) %(contents:subject)", `refs/skill_dey/${grupo}/`])
  if (!r.ok || !r.out) return []
  return r.out.split("\n").map((l) => {
    const [ref, commit, ...resto] = l.split(" ")
    const subj = resto.join(" ")
    const m = subj.match(/^skill_dey\[(\w[\w-]*)\] (.*)$/)
    return { ref, commit, ts: Number(ref.split("/").pop()), tipo: m?.[1] ?? "?", nota: m?.[2] ?? subj }
  })
}

/** Toma una foto completa del proyecto (archivos versionados + nuevos no ignorados). Devuelve el commit o null. */
export function foto(cwd: string, grupo: "pasos" | "rehacer", tipo: string, nota: string): string | null {
  if (!asegurarRepo(cwd)) return null
  const root = raiz(cwd)
  const idx = join(root, git(root, ["rev-parse", "--git-dir"]).out || ".git", "skill_dey-index")
  const env = { GIT_INDEX_FILE: isAbsolute(idx) ? idx : join(root, idx) }
  const head = git(root, ["rev-parse", "--verify", "-q", "HEAD"]).out
  git(root, head ? ["read-tree", "HEAD"] : ["read-tree", "--empty"], env)
  if (!git(root, ["add", "-A", "--", ".", ...EXCLUIR], env).ok) return null
  const secretos = git(root, ["ls-files"], env).out.split("\n").filter((f) => f && PROTEGIDO.test(f))
  for (let i = 0; i < secretos.length; i += 200) git(root, ["rm", "--cached", "-q", "--", ...secretos.slice(i, i + 200)], env)
  const tree = git(root, ["write-tree"], env).out
  if (!tree) return null
  const ultima = listar(root, grupo)[0]
  if (ultima && git(root, ["rev-parse", `${ultima.commit}^{tree}`]).out === tree) return ultima.commit // sin cambios desde la última foto
  const c = git(root, ["commit-tree", tree, ...(head ? ["-p", head] : []), "-m", `skill_dey[${tipo}] ${nota.replace(/\s+/g, " ").slice(0, 150)}`]).out
  if (!c) return null
  const ts = Date.now()
  git(root, ["update-ref", `refs/skill_dey/${grupo}/${ts}`, c])
  for (const vieja of listar(root, grupo).slice(MAX_FOTOS)) git(root, ["update-ref", "-d", vieja.ref])
  return c
}

/** Deja los archivos EXACTAMENTE como estaban en la foto (restaura, y borra lo que se creó después). No toca .env ni ignorados. */
function aplicar(root: string, commit: string): { restaurados: number; borrados: string[] } {
  const actuales = new Set(git(root, ["ls-files", "-co", "--exclude-standard", "--", ".", ...EXCLUIR]).out.split("\n").filter(Boolean))
  const destino = new Set(git(root, ["ls-tree", "-r", "--name-only", commit]).out.split("\n").filter(Boolean))
  const idx = join(root, git(root, ["rev-parse", "--git-dir"]).out || ".git", "skill_dey-index")
  const env = { GIT_INDEX_FILE: isAbsolute(idx) ? idx : join(root, idx) }
  git(root, ["read-tree", commit], env)
  for (const f of destino) if (PROTEGIDO.test(f)) destino.delete(f)
  const lista = [...destino]
  for (let i = 0; i < lista.length; i += 500) git(root, ["checkout-index", "-f", "--", ...lista.slice(i, i + 500)], env)
  const borrados: string[] = []
  for (const f of actuales) if (!destino.has(f) && !PROTEGIDO.test(f)) { try { unlinkSync(join(root, f)); borrados.push(f) } catch {} }
  return { restaurados: destino.size, borrados }
}

function difResumen(root: string, desde: string, hasta: string) {
  return git(root, ["diff", "--stat", "--stat-width=90", desde, hasta]).out.split("\n").slice(-12).join("\n")
}

export function deshacer(cwd: string, pasos = 1): string {
  if (!esRepo(cwd)) return deshacerSinGit(cwd)
  const root = raiz(cwd)
  const fotos = listar(root, "pasos")
  if (!fotos.length) return "No hay cambios de SKILL_DEY para deshacer en este proyecto."
  const n = Math.min(Math.max(1, pasos), fotos.length)
  const objetivo = fotos[n - 1]
  const actual = foto(root, "rehacer", "antes-de-deshacer", `estado antes de deshacer ${n} paso(s)`)
  const r = aplicar(root, objetivo.commit)
  for (const f of fotos.slice(0, n)) { git(root, ["update-ref", `refs/skill_dey/deshecho/${f.ts}`, f.commit]); git(root, ["update-ref", "-d", f.ref]) }
  return [
    `↩ Deshecho(s) ${n} cambio(s). Proyecto restaurado a como estaba antes de: "${objetivo.nota}" (${new Date(objetivo.ts).toLocaleString()}).`,
    actual ? difResumen(root, actual, objetivo.commit) : "",
    r.borrados.length ? `Archivos creados por el cambio y eliminados: ${r.borrados.slice(0, 10).join(", ")}${r.borrados.length > 10 ? "…" : ""}` : "",
    "Se puede REHACER si fue un error. .env y archivos ignorados no se tocaron. Si hubo migraciones de BD, revierte también la BD (ver respaldos-bd).",
  ].filter(Boolean).join("\n")
}

export function rehacer(cwd: string): string {
  if (!esRepo(cwd)) return "Rehacer solo está disponible en proyectos con git."
  const root = raiz(cwd)
  const r = listar(root, "rehacer")[0]
  if (!r) return "No hay nada para rehacer."
  const r2 = aplicar(root, r.commit)
  git(root, ["update-ref", "-d", r.ref])
  const d = listar(root, "deshecho")[0]
  if (d) { git(root, ["update-ref", `refs/skill_dey/pasos/${d.ts}`, d.commit]); git(root, ["update-ref", "-d", d.ref]) }
  return `↪ Rehecho: el proyecto volvió al estado anterior al deshacer. ${r2.borrados.length ? "Eliminados: " + r2.borrados.join(", ") : ""}`
}

export function historial(cwd: string): string {
  if (!esRepo(cwd)) {
    const d = join(cwd, ".skill_dey", "respaldos-archivos")
    const l = existsSync(d) ? readdirSync(d).sort().reverse().slice(0, 15) : []
    return l.length ? "Respaldos (sin git):\n" + l.map((x, i) => `${i + 1}. ${x}`).join("\n") : "Sin respaldos."
  }
  const root = raiz(cwd)
  const f = listar(root, "pasos")
  const lineas = f.slice(0, 15).map((x, i) => `${i + 1}. ${new Date(x.ts).toLocaleString()} · antes de: ${x.nota}`)
  const reh = listar(root, "rehacer").length
  return (lineas.length ? "Cambios que se pueden deshacer (1 = el último):\n" + lineas.join("\n") : "No hay cambios para deshacer.") + (reh ? `\n(${reh} deshacer reversible con rehacer)` : "")
}

// ---------- respaldo por archivo cuando NO hay git ----------
export function respaldarArchivo(cwd: string, archivo: string, turno: string) {
  const abs = isAbsolute(archivo) ? archivo : join(cwd, archivo)
  const rel = relative(cwd, abs)
  if (rel.startsWith("..") || rel.startsWith(".skill_dey")) return
  const dir = join(cwd, ".skill_dey", "respaldos-archivos", turno)
  mkdirSync(dir, { recursive: true })
  const man = join(dir, "manifiesto.json")
  const m: { archivos: { ruta: string; existia: boolean }[] } = existsSync(man) ? JSON.parse(readFileSync(man, "utf8")) : { archivos: [] }
  if (m.archivos.some((a) => a.ruta === rel)) return // ya respaldado en este turno (se guarda el estado ORIGINAL)
  const existia = existsSync(abs) && statSync(abs).isFile()
  if (existia) { mkdirSync(dirname(join(dir, "archivos", rel)), { recursive: true }); copyFileSync(abs, join(dir, "archivos", rel)) }
  m.archivos.push({ ruta: rel, existia })
  writeFileSync(man, JSON.stringify(m, null, 1))
}

function deshacerSinGit(cwd: string): string {
  const base = join(cwd, ".skill_dey", "respaldos-archivos")
  const turnos = existsSync(base) ? readdirSync(base).sort().reverse() : []
  if (!turnos.length) return "No hay respaldos para deshacer (instala git para protección completa)."
  const dir = join(base, turnos[0])
  const m = JSON.parse(readFileSync(join(dir, "manifiesto.json"), "utf8"))
  const hecho: string[] = []
  for (const a of m.archivos) {
    const dst = join(cwd, a.ruta)
    if (a.existia) { mkdirSync(dirname(dst), { recursive: true }); copyFileSync(join(dir, "archivos", a.ruta), dst); hecho.push("restaurado " + a.ruta) }
    else if (existsSync(dst)) { unlinkSync(dst); hecho.push("eliminado " + a.ruta) }
  }
  rmSync(dir, { recursive: true, force: true })
  return `↩ Deshecho el último cambio (sin git):\n${hecho.join("\n")}`
}
