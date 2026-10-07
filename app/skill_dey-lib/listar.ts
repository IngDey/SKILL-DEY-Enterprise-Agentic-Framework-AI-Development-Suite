// SKILL_DEY — listado de archivos del proyecto con RESPALDO sin git (arregla el "verde falso": si no hay repo,
// igual recorre el disco). `hayGit` dice si se pudo usar git; quien revisa seguridad/errores debe avisar si NO pudo listar.
import { spawnSync } from "node:child_process"
import { readdirSync, statSync } from "node:fs"
import { join, relative } from "node:path"

const IGN = /(^|[\\/])(node_modules|vendor|dist|build|\.git|\.skill_dey|coverage|\.venv|venv|__pycache__|\.next|\.nuxt|storage[\\/]framework|bootstrap[\\/]cache)([\\/]|$)|\.min\.(js|css)$|\.bundle\.js$/i

export function esRepoGit(cwd: string): boolean {
  return spawnSync("git", ["rev-parse", "--is-inside-work-tree"], { cwd, encoding: "utf8" }).stdout?.trim() === "true"
}

/** Archivos versionables del proyecto. Usa git; si no hay repo, recorre el disco (hasta `maxFiles`). */
export function listarArchivos(cwd: string, maxFiles = 20_000): string[] {
  const g = spawnSync("git", ["ls-files", "-co", "--exclude-standard"], { cwd, encoding: "utf8", maxBuffer: 1e8 })
  if (g.status === 0 && g.stdout.trim()) return g.stdout.split(/\r?\n/).filter((f) => f && !IGN.test(f))
  // Sin git (o repo vacío): recorrer el disco
  const out: string[] = []
  const walk = (d: string, prof: number) => {
    if (out.length >= maxFiles || prof > 12) return
    let ents: string[] = []; try { ents = readdirSync(d) } catch { return }
    for (const e of ents) {
      if (e.startsWith(".") && e !== ".env.example") continue
      const p = join(d, e); const rel = relative(cwd, p)
      if (IGN.test(rel) || IGN.test("/" + rel)) continue
      let st; try { st = statSync(p) } catch { continue }
      if (st.isDirectory()) walk(p, prof + 1)
      else if (st.size < 3_000_000) out.push(rel.replace(/\\/g, "/"))
      if (out.length >= maxFiles) return
    }
  }
  walk(cwd, 0)
  return out
}
