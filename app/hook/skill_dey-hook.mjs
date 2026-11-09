#!/usr/bin/env node
// SKILL DEY 40.0.0 · generado por scripts/build.mjs desde app/skill_dey-lib/hook.ts — no editar a mano
// app/skill_dey-lib/hook.ts
import { existsSync as existsSync3, readFileSync as readFileSync4, writeFileSync as writeFileSync3, mkdirSync as mkdirSync2, appendFileSync as appendFileSync2 } from "node:fs";
import { join as join4, resolve as resolve3, isAbsolute as isAbsolute4, dirname as dirname2 } from "node:path";
import { homedir as homedir2 } from "node:os";

// app/skill_dey-lib/guardia.ts
import { spawnSync as spawnSync2 } from "node:child_process";
import { existsSync, readFileSync as readFileSync2, appendFileSync, readdirSync, statSync } from "node:fs";
import { join as join2, extname, isAbsolute as isAbsolute2, resolve, relative } from "node:path";

// app/skill_dey-lib/sintaxis.ts
import { spawnSync } from "node:child_process";
import { readFileSync, writeFileSync, rmSync } from "node:fs";
import { join, basename, isAbsolute } from "node:path";
import { tmpdir } from "node:os";
function errorJs(cwd, archivo) {
  const abs = isAbsolute(archivo) ? archivo : join(cwd, archivo);
  let src = "";
  try {
    src = readFileSync(abs, "utf8");
  } catch {
    return "";
  }
  if (/\.js$/i.test(abs) && /<[A-Za-z][\w.]*[\s>\/]/.test(src) && /(\/>|<\/[A-Za-z])/.test(src))
    return "";
  const esm = /\.js$/i.test(abs) && /^\s*(import\s|import\{|export\s|export\{)/m.test(src);
  const tmp = esm ? join(tmpdir(), `skill_dey-chk-${process.pid}-${Date.now()}-${basename(abs)}.mjs`) : "";
  if (tmp)
    writeFileSync(tmp, src);
  const r = spawnSync("node", ["--check", tmp || abs], { cwd, encoding: "utf8", timeout: 20000 });
  if (tmp)
    try {
      rmSync(tmp);
    } catch {}
  if (r.error || r.status === 0)
    return "";
  return `${r.stdout ?? ""}${r.stderr ?? ""}`.split(tmp || "\x00").join(archivo).split(/\r?\n/).filter((l) => l.trim() && !/^\s*at \S|^Node\.js v/.test(l)).slice(-6).join(`
`);
}

// app/skill_dey-lib/guardia.ts
var SECRETO = /(AKIA[0-9A-Z]{16}|ASIA[0-9A-Z]{16}|AIza[0-9A-Za-z_-]{35}|sk-(ant-|proj-)?[A-Za-z0-9_-]{20,}|gh[pousr]_[A-Za-z0-9]{36,}|xox[abpr]-[A-Za-z0-9-]{10,}|-----BEGIN (RSA |EC |DSA |OPENSSH |PGP )?PRIVATE KEY-----|(password|passwd|pwd|secret|api[_-]?key|apikey|token|client_secret|access[_-]?key)\s*[:=]\s*["'][^"'\s$]{8,}["'])/i;
var PLACEHOLDER = /(process\.env|getenv|env\(|os\.environ|import\.meta\.env|changeme|example|xxxx|\$\{|<[^>]+>|your[_-]|tu[_-]|dummy|fake|test[_-]?key)/i;
var PELIGROSO = [
  [/git\s+push\b.*\s(--force(-with-lease)?|-f)\b/, "push forzado"],
  [/\brm\s+(-[a-z]*r[a-z]*\s+|--recursive\s+)(-[a-z]+\s+)*(\/|~\/?|\*|\.\/?|\$HOME\/?|%USERPROFILE%)(\s|$)/i, "borrado masivo"],
  [/\b(rmdir|rd)\s+\/s\s+(\/q\s+)?([a-z]:\\?|\\)\s*$/i, "borrado masivo"],
  [/\bRemove-Item\b.*-Recurse\b.*\s(\\|[a-z]:\\|~|\$HOME|\*)/i, "borrado masivo"],
  [/git\s+clean\s+-[a-z]*f[a-z]*d|git\s+clean\s+-[a-z]*d[a-z]*f/, "git clean de archivos no versionados"],
  [/git\s+reset\s+--hard\b/, "git reset --hard (pierde cambios)"],
  [/\b(drop\s+(database|schema|table)|truncate\s+table)\b/i, "borrado de base de datos o tabla"],
  [/(psql|mysql|mariadb|sqlite3|sqlcmd)\b[\s\S]*\btruncate\b/i, "vaciado de tabla"],
  [/\bdelete\s+from\s+[\w."`\[\]]+\s*(;|"|'|$)(?![\s\S]*\bwhere\b)/i, "DELETE sin WHERE (vacía la tabla)"],
  [/\b(dropdb|mysqladmin\s+.*\bdrop)\b/i, "borrado de base de datos"],
  [/\b(dropDatabase|deleteMany\(\s*\{\s*\}\s*\)|\.drop\(\s*\))/, "borrado de base de datos (Mongo)"],
  [/\b(flushall|flushdb)\b/i, "vaciado de Redis"],
  [/(artisan\s+(migrate:(fresh|reset|refresh)|db:wipe)|prisma\s+migrate\s+reset|prisma\s+db\s+push\s+.*--force-reset|rails\s+db:(drop|reset|schema:load)|manage\.py\s+flush|sequelize(-cli)?\s+db:(drop|migrate:undo:all)|knex\s+migrate:rollback\s+--all|doctrine:(database:drop|schema:drop))/i, "reinicio/borrado de base de datos"],
  [/(migrate|migration).*(--env[= ]?prod|production)/i, "migración en producción"],
  [/\b(mkfs|format\s+[a-z]:|diskpart)\b/i, "formateo de disco"],
  [/:\(\)\s*\{\s*:\|:&\s*\};:/, "bomba de procesos"],
  [/\b(curl|wget|iwr|Invoke-WebRequest)\b[^|]*\|\s*(sudo\s+)?(ba|z)?sh\b|\biex\s*\(\s*(iwr|irm|New-Object)/i, "ejecutar un script descargado sin revisarlo"]
];
var TRUNCADO = /(\/\/|#|\/\*|<!--|--)\s*\.{3}\s*(resto|rest|existing|c[oó]digo|code|same|sin cambios|unchanged|igual|anterior|previous|etc)|\.{3}\s*(resto del|rest of (the )?)(c[oó]digo|code|file|archivo)|(\/\/|#)\s*(aqu[ií] va|el resto|the rest|remaining code|c[oó]digo existente|existing code)\b/i;
var SERVIDOR = /(^|&&|;|\|\|)\s*((npm|pnpm|yarn|bun)\s+(run\s+)?(dev|start|serve|watch|preview)\b|php\s+(artisan\s+serve|-S\s)|(python3?|py)\s+manage\.py\s+runserver|nodemon\b|npx\s+(vite|next\s+dev|nodemon)|vite(\s|$)|next\s+dev|flask\s+run|uvicorn\b|rails\s+s(erver)?\b|dotnet\s+(run|watch)\b|go\s+run\b)/i;
var DEPENDENCIA = /\b(npm\s+(i|install|add)|yarn\s+add|pnpm\s+(add|i|install)|bun\s+add|composer\s+require|pip3?\s+install|uv\s+(add|pip\s+install)|poetry\s+add|go\s+get|cargo\s+add|gem\s+install|dotnet\s+add\s+package)\s+(?<pkgs>[^&|;]+)/i;
var SOLO_LECTURA = /^\s*(ls|dir|cat|type|head|tail|less|grep|rg|find|wc|tree|pwd|echo|which|where|whoami|date|env|printenv|node\s+(-v|--version|--check)|npm\s+(ls|view|outdated|audit(?!\s+fix))|pip\s+(show|list)|composer\s+(show|audit)|git\s+(status|log|diff|show|branch|rev-parse|ls-files|grep|remote|config\s+--get|blame|describe|tag\s*$))\b/i;
var MIGRACION = /(artisan\s+migrate(?!:status)|prisma\s+(migrate\s+(dev|deploy)|db\s+push)|knex\s+migrate:(latest|up|down|rollback)|sequelize(-cli)?\s+db:migrate|alembic\s+(upgrade|downgrade)|manage\.py\s+migrate|typeorm.*migration:(run|revert)|flyway\s+migrate|rails\s+db:(migrate|rollback)|goose\s+(up|down)|doctrine:migrations:migrate|drizzle-kit\s+(push|migrate))/i;
var SQL_MODIFICA = /(psql|mysql|mariadb|sqlite3|sqlcmd|mongosh?)\b[\s\S]*\b(delete\s+from|update\s+[\w."`\[\]]+\s+set|alter\s+table|drop\s+(column|index)|insert\s+into|updateMany)\b/i;
var ENV_REAL = /(^|[\\/])\.env(\.(local|production|prod|dev|development|staging|test))?$/;
var esSoloLectura = (cmd) => !/[^2]>|>>|\btee\b|\s-i\b/.test(cmd) && cmd.split(/&&|\|\||;|\|/).every((p) => !p.trim() || SOLO_LECTURA.test(p));
var ES_COMANDO = /(^|_|\b)(bash|shell|run_command|run_shell_command|terminal|exec|powershell)($|_|\b)/i;
var ES_LEER = /^(read|view|cat)$|read_file|view_file|read_many_files|^Read$/i;
var ES_EDITAR = /(edit|write|replace|patch|create_file|multiedit|notebook|apply_diff|insert)/i;
function campo(a, claves) {
  if (!a || typeof a !== "object")
    return "";
  for (const [k, v] of Object.entries(a))
    if (claves.test(k) && typeof v === "string")
      return v;
  return "";
}
function textoNuevo(a) {
  if (!a || typeof a !== "object")
    return "";
  const partes = [];
  const tomar = (o) => {
    if (!o || typeof o !== "object")
      return;
    for (const [k, v] of Object.entries(o)) {
      if (typeof v === "string" && /^(content|new_?string|newString|code_?content|CodeContent|replacement(_?content)?|ReplacementContent|new_text|text|patch(Text)?|diff|new_source)$/i.test(k))
        partes.push(v);
      else if (Array.isArray(v))
        v.forEach(tomar);
    }
  };
  tomar(a);
  return partes.join(`
`);
}
function normalizar(herramienta, args) {
  const h = String(herramienta ?? "");
  const a = args ?? {};
  const archivo = campo(a, /^(file_?path|filePath|path|absolute_path|AbsolutePath|TargetFile|target_file|notebook_path|file)$/i);
  const comando = campo(a, /^(command|CommandLine|cmd|script)$/i);
  let tipo = "otra";
  if (/^mcp/i.test(h))
    tipo = "otra";
  else if (ES_COMANDO.test(h) || comando && !archivo)
    tipo = "comando";
  else if (ES_LEER.test(h))
    tipo = "leer";
  else if (ES_EDITAR.test(h))
    tipo = "editar";
  return { tipo, herramienta: h, archivo, texto: tipo === "editar" ? textoNuevo(a) : "", comando };
}
function respaldoBdReciente(cwd, horas = 3) {
  const d = join2(cwd, ".skill_dey", "respaldos-bd");
  if (!existsSync(d))
    return false;
  try {
    return readdirSync(d).some((f) => Date.now() - statSync(join2(d, f)).mtimeMs < horas * 3600000);
  } catch {
    return false;
  }
}
function blindarGitignore(cwd) {
  const gi = join2(cwd, ".gitignore");
  const actual = existsSync(gi) ? readFileSync2(gi, "utf8") : "";
  const lineas = actual.split(/\r?\n/).map((x) => x.trim());
  const faltan = [".env", ".env.*", "!.env.example", ".skill_dey/shots/", ".skill_dey/.ultimo-verificar.json", ".skill_dey/respaldos-bd/", ".skill_dey/respaldos-archivos/", ".skill_dey/.sesion-*.json", ".skill_dey/logs/"].filter((l) => !lineas.includes(l));
  if (faltan.length)
    appendFileSync(gi, (actual && !actual.endsWith(`
`) ? `
` : "") + `# SKILL_DEY: nunca subir secretos ni temporales
` + faltan.join(`
`) + `
`);
  const r = spawnSync2("git", ["ls-files", "--cached", "--", ".env", ".env.local", ".env.production", ".env.prod"], { cwd, encoding: "utf8" });
  const trackeados = (r.stdout || "").trim();
  return trackeados ? trackeados.split(/\r?\n/).join(", ") : null;
}
function sintaxis(cwd, file) {
  const f = isAbsolute2(file) ? file : join2(cwd, file);
  if (!existsSync(f))
    return "";
  const e = extname(f).toLowerCase();
  if ([".js", ".mjs", ".cjs"].includes(e))
    return errorJs(cwd, f);
  if (e === ".json" && !/tsconfig|jsconfig|\.vscode/.test(f)) {
    try {
      JSON.parse(readFileSync2(f, "utf8"));
      return "";
    } catch (x) {
      return `JSON inválido: ${x.message}`;
    }
  }
  const cmd = e === ".php" ? `php -l "${f}"` : e === ".py" ? `${process.platform === "win32" ? "python" : "python3"} -m py_compile "${f}"` : "";
  if (!cmd)
    return "";
  const r = spawnSync2(cmd, { cwd, shell: true, encoding: "utf8", timeout: 20000 });
  const out = `${r.stdout ?? ""}${r.stderr ?? ""}`;
  if (r.status === 0 || /not recognized|not found|no se reconoce/i.test(out))
    return "";
  return out.split(/\r?\n/).filter((l) => l.trim() && !/^\s*at \S|^Node\.js v/.test(l)).slice(-6).join(`
`);
}
function congeladas(cwd) {
  try {
    return readFileSync2(join2(cwd, ".skill_dey", "CONGELADO.txt"), "utf8").split(/\r?\n/).map((l) => l.trim()).filter((l) => l && !l.startsWith("#"));
  } catch {
    return [];
  }
}
var MSG = "SKILL_DEY";
function evaluar(acc, c) {
  try {
    return evaluarInterno(acc, c);
  } catch {
    return {};
  }
}
function evaluarInterno(acc, c) {
  const { cwd } = c;
  const archivo = acc.archivo;
  if (acc.tipo === "leer" && ENV_REAL.test(archivo))
    return { bloquear: `${MSG}: no leo .env reales (credenciales). Usa .env.example o pregunta el nombre de la variable.` };
  if (acc.tipo === "comando" && /\b(cat|type|less|more|head|tail|Get-Content|gc)\b[^|;&]*(^|[\s"'\\/])\.env(\.(local|production|prod|dev|development|staging))?(\s|"|'|$)/i.test(acc.comando))
    return { bloquear: `${MSG}: no leo .env reales (credenciales). Usa .env.example o pregunta el nombre de la variable.` };
  if (acc.tipo === "editar" && archivo) {
    const abs = resolve(isAbsolute2(archivo) ? archivo : join2(cwd, archivo));
    if (relative(resolve(cwd), abs).startsWith(".."))
      return { bloquear: `${MSG}: ${archivo} está FUERA del proyecto. No lo modifiques sin que el usuario lo autorice explícitamente para esa ruta.` };
  }
  const modifica = acc.tipo === "editar" || acc.tipo === "comando" && !esSoloLectura(acc.comando);
  if (modifica) {
    const cong = congeladas(cwd);
    if (cong.length) {
      const rutas = [];
      if (archivo)
        rutas.push(relative(resolve(cwd), resolve(isAbsolute2(archivo) ? archivo : join2(cwd, archivo))).replace(/\\/g, "/"));
      if (acc.tipo === "comando")
        for (const m of acc.comando.matchAll(/(?:^|[\s>"'])([\w./-]+\.[\w]+|[\w.-]+\/[\w./-]*)/g))
          rutas.push(m[1].replace(/^\.\//, ""));
      const choca = rutas.find((r) => cong.some((x) => {
        const z = x.replace(/\\/g, "/").replace(/\/$/, "");
        return r === z || r.startsWith(z + "/");
      }));
      if (choca)
        return { bloquear: `${MSG}: "${choca}" está en zona CONGELADA (.skill_dey/CONGELADO.txt): no se toca sin permiso. Si el usuario lo autoriza, quítalo de ese archivo primero.` };
    }
  }
  if (acc.tipo === "editar") {
    const t = acc.texto.split(/\r?\n/).find((l) => TRUNCADO.test(l));
    if (t)
      return { bloquear: `${MSG}: código truncado bloqueado ("${t.trim().slice(0, 70)}"). Escribe el contenido COMPLETO o edita solo las líneas que cambian.` };
    if (!/\.env(\.|$)|\.example|\.md$|\.txt$/i.test(archivo)) {
      const linea = acc.texto.split(/\r?\n/).find((l) => SECRETO.test(l) && !PLACEHOLDER.test(l));
      if (linea)
        return { bloquear: `${MSG}: secreto en código bloqueado → "${linea.trim().slice(0, 60)}…". Muévelo a .env y documenta la variable en .env.example.` };
    }
    return {};
  }
  if (acc.tipo !== "comando" || !acc.comando)
    return {};
  const cmd = acc.comando;
  for (const [re, motivo] of PELIGROSO)
    if (re.test(cmd))
      return { bloquear: `${MSG}: bloqueado (${motivo}). Explícale al usuario qué haría y que lo ejecute él si de verdad lo quiere.` };
  if ((MIGRACION.test(cmd) || SQL_MODIFICA.test(cmd)) && !/--pretend|--dry-run|--status|\bstatus\b|SKILL_DEY_BD_PRUEBA=1/.test(cmd) && !respaldoBdReciente(cwd))
    return { bloquear: `${MSG}: antes de migrar o modificar la BD: 1) ensaya en una copia · 2) haz respaldo en .skill_dey/respaldos-bd/ (pg_dump -Fc -f .skill_dey/respaldos-bd/<fecha>.dump <bd> · mysqldump <bd> > .skill_dey/respaldos-bd/<fecha>.sql · copiar el .sqlite). Si es BD de producción, NO lo hagas: pide al usuario.` };
  const dep = cmd.match(DEPENDENCIA);
  if (dep && c.pidioDependencias && !/--dry-run/.test(cmd)) {
    const paquetes = (dep.groups?.pkgs ?? "").split(/\s+/).filter((x) => x && !x.startsWith("-")).map((x) => x.replace(/@[\d^~<>=.*x-]+$/, ""));
    if (paquetes.length && c.pidioDependencias(paquetes) === false)
      return { bloquear: `${MSG}: no agregues dependencias que no se pidieron (${paquetes.join(", ")}). Propónselas al usuario en 1 línea (para qué y alternativa sin dependencia) y espera su OK.` };
  }
  if (/git\s+(add|commit)\b/.test(cmd)) {
    const trackeado = blindarGitignore(cwd);
    if (trackeado)
      return { bloquear: `${MSG}: ${trackeado} está versionado en git (secretos expuestos). Ejecuta: git rm --cached ${trackeado} y avisa al usuario que cambie esas claves.` };
  }
  if (/git\s+commit\b/.test(cmd) && !/checkpoint|baseline|wip/i.test(cmd) && (c.ultimaEdicion ?? 0) > 0) {
    let v = null;
    try {
      v = JSON.parse(readFileSync2(join2(cwd, ".skill_dey", ".ultimo-verificar.json"), "utf8"));
    } catch {}
    if (!v || !v.ok || v.ts < (c.ultimaEdicion ?? 0))
      return { bloquear: `${MSG}: commit bloqueado. Corre skill_dey_verificar (debe salir ✅) después de tu última edición. Para guardar avance usa un commit "skill_dey: checkpoint".` };
  }
  const yaFondo = /(&\s*$|nohup|start\s+\/b|disown|--detach|-d\b|Start-Process)/.test(cmd);
  let nuevo = cmd;
  if (/\bvitest\b/.test(nuevo) && !/\bvitest\s+(run|related)\b|--run\b/.test(nuevo))
    nuevo = nuevo.replace(/\bvitest\b/, "vitest run");
  if (/--watch(All)?\b/.test(nuevo) && /jest|vitest|mocha|test/.test(nuevo))
    nuevo = nuevo.replace(/\s--watch(All)?\b/g, "");
  if (SERVIDOR.test(cmd) && !yaFondo) {
    if (c.puedeReescribir && process.platform !== "win32") {
      const log = `.skill_dey/logs/servidor-${Date.now()}.log`;
      return { comando: `mkdir -p .skill_dey/logs && (nohup sh -c '${nuevo.replace(/'/g, `'\\''`)}' > "${log}" 2>&1 &) ; sleep 8 ; echo "[SKILL_DEY] servidor en segundo plano · log: ${log}" ; tail -n 25 "${log}"` };
    }
    return { bloquear: `${MSG}: este comando deja un servidor corriendo y congela la sesión. ${c.comoSegundoPlano ?? "Córrelo en segundo plano con log (ej.: nohup <comando> > .skill_dey/logs/servidor.log 2>&1 &) y lee el log."}` };
  }
  if (nuevo !== cmd) {
    if (c.puedeReescribir)
      return { comando: nuevo };
    return { bloquear: `${MSG}: las pruebas en modo "watch" no terminan nunca. Usa: ${nuevo}` };
  }
  return {};
}

// app/skill_dey-lib/respaldo.ts
import { spawnSync as spawnSync3 } from "node:child_process";
import { existsSync as existsSync2, mkdirSync, readFileSync as readFileSync3, writeFileSync as writeFileSync2, copyFileSync, unlinkSync, readdirSync as readdirSync2, statSync as statSync2, rmSync as rmSync2 } from "node:fs";
import { join as join3, dirname, resolve as resolve2, relative as relative2, isAbsolute as isAbsolute3 } from "node:path";
import { homedir } from "node:os";
var ID = { GIT_AUTHOR_NAME: "SKILL_DEY", GIT_AUTHOR_EMAIL: "skill_dey@local", GIT_COMMITTER_NAME: "SKILL_DEY", GIT_COMMITTER_EMAIL: "skill_dey@local" };
var EXCLUIR = [
  ":(exclude,glob)**/.skill_dey/**",
  ":(exclude,glob)**/node_modules/**",
  ":(exclude,glob)**/vendor/**",
  ":(exclude,glob)**/.venv/**",
  ":(exclude,glob)**/venv/**",
  ":(exclude,glob)**/dist/**",
  ":(exclude,glob)**/build/**",
  ":(exclude,glob)**/.next/**",
  ":(exclude,glob)**/.nuxt/**",
  ":(exclude,glob)**/coverage/**",
  ":(exclude,glob)**/__pycache__/**"
];
var PROTEGIDO = /(^|\/)(\.env(?!\.example$)(\..*)?|\.skill_dey\/.*)$/;
var MAX_FOTOS = 60;
function git(cwd, args, env = {}) {
  const r = spawnSync3("git", args, { cwd, encoding: "utf8", maxBuffer: 200000000, timeout: 120000, env: { ...process.env, ...ID, ...env } });
  return { ok: r.status === 0, out: (r.stdout ?? "").trim(), err: (r.stderr ?? "").trim(), sinGit: !!r.error };
}
var hayGit = (cwd) => !git(cwd, ["--version"]).sinGit;
var esRepo = (cwd) => git(cwd, ["rev-parse", "--is-inside-work-tree"]).out === "true";
var raiz = (cwd) => git(cwd, ["rev-parse", "--show-toplevel"]).out || cwd;
function asegurarRepo(cwd) {
  if (!hayGit(cwd))
    return false;
  if (esRepo(cwd))
    return true;
  const r = resolve2(cwd);
  if (r === resolve2(homedir()) || r === resolve2("/") || /^[A-Za-z]:\\?$/.test(r))
    return false;
  return git(cwd, ["init", "-q"]).ok;
}
function listar(cwd, grupo) {
  const r = git(cwd, ["for-each-ref", "--sort=-refname", "--format=%(refname) %(objectname) %(contents:subject)", `refs/skill_dey/${grupo}/`]);
  if (!r.ok || !r.out)
    return [];
  return r.out.split(`
`).map((l) => {
    const [ref, commit, ...resto] = l.split(" ");
    const subj = resto.join(" ");
    const m = subj.match(/^skill_dey\[(\w[\w-]*)\] (.*)$/);
    return { ref, commit, ts: Number(ref.split("/").pop()), tipo: m?.[1] ?? "?", nota: m?.[2] ?? subj };
  });
}
function foto(cwd, grupo, tipo, nota) {
  if (!asegurarRepo(cwd))
    return null;
  const root = raiz(cwd);
  const idx = join3(root, git(root, ["rev-parse", "--git-dir"]).out || ".git", "skill_dey-index");
  const env = { GIT_INDEX_FILE: isAbsolute3(idx) ? idx : join3(root, idx) };
  const head = git(root, ["rev-parse", "--verify", "-q", "HEAD"]).out;
  git(root, head ? ["read-tree", "HEAD"] : ["read-tree", "--empty"], env);
  if (!git(root, ["add", "-A", "--", ".", ...EXCLUIR], env).ok)
    return null;
  const secretos = git(root, ["ls-files"], env).out.split(`
`).filter((f) => f && PROTEGIDO.test(f));
  for (let i = 0;i < secretos.length; i += 200)
    git(root, ["rm", "--cached", "-q", "--", ...secretos.slice(i, i + 200)], env);
  const tree = git(root, ["write-tree"], env).out;
  if (!tree)
    return null;
  const ultima = listar(root, grupo)[0];
  if (ultima && git(root, ["rev-parse", `${ultima.commit}^{tree}`]).out === tree)
    return ultima.commit;
  const c = git(root, ["commit-tree", tree, ...head ? ["-p", head] : [], "-m", `skill_dey[${tipo}] ${nota.replace(/\s+/g, " ").slice(0, 150)}`]).out;
  if (!c)
    return null;
  const ts = Date.now();
  git(root, ["update-ref", `refs/skill_dey/${grupo}/${ts}`, c]);
  for (const vieja of listar(root, grupo).slice(MAX_FOTOS))
    git(root, ["update-ref", "-d", vieja.ref]);
  return c;
}
function aplicar(root, commit) {
  const actuales = new Set(git(root, ["ls-files", "-co", "--exclude-standard", "--", ".", ...EXCLUIR]).out.split(`
`).filter(Boolean));
  const destino = new Set(git(root, ["ls-tree", "-r", "--name-only", commit]).out.split(`
`).filter(Boolean));
  const idx = join3(root, git(root, ["rev-parse", "--git-dir"]).out || ".git", "skill_dey-index");
  const env = { GIT_INDEX_FILE: isAbsolute3(idx) ? idx : join3(root, idx) };
  git(root, ["read-tree", commit], env);
  for (const f of destino)
    if (PROTEGIDO.test(f))
      destino.delete(f);
  const lista = [...destino];
  for (let i = 0;i < lista.length; i += 500)
    git(root, ["checkout-index", "-f", "--", ...lista.slice(i, i + 500)], env);
  const borrados = [];
  for (const f of actuales)
    if (!destino.has(f) && !PROTEGIDO.test(f)) {
      try {
        unlinkSync(join3(root, f));
        borrados.push(f);
      } catch {}
    }
  return { restaurados: destino.size, borrados };
}
function difResumen(root, desde, hasta) {
  return git(root, ["diff", "--stat", "--stat-width=90", desde, hasta]).out.split(`
`).slice(-12).join(`
`);
}
function deshacer(cwd, pasos = 1) {
  if (!esRepo(cwd))
    return deshacerSinGit(cwd);
  const root = raiz(cwd);
  const fotos = listar(root, "pasos");
  if (!fotos.length)
    return "No hay cambios de SKILL_DEY para deshacer en este proyecto.";
  const n = Math.min(Math.max(1, pasos), fotos.length);
  const objetivo = fotos[n - 1];
  const actual = foto(root, "rehacer", "antes-de-deshacer", `estado antes de deshacer ${n} paso(s)`);
  const r = aplicar(root, objetivo.commit);
  for (const f of fotos.slice(0, n)) {
    git(root, ["update-ref", `refs/skill_dey/deshecho/${f.ts}`, f.commit]);
    git(root, ["update-ref", "-d", f.ref]);
  }
  return [
    `↩ Deshecho(s) ${n} cambio(s). Proyecto restaurado a como estaba antes de: "${objetivo.nota}" (${new Date(objetivo.ts).toLocaleString()}).`,
    actual ? difResumen(root, actual, objetivo.commit) : "",
    r.borrados.length ? `Archivos creados por el cambio y eliminados: ${r.borrados.slice(0, 10).join(", ")}${r.borrados.length > 10 ? "…" : ""}` : "",
    "Se puede REHACER si fue un error. .env y archivos ignorados no se tocaron. Si hubo migraciones de BD, revierte también la BD (ver respaldos-bd)."
  ].filter(Boolean).join(`
`);
}
function rehacer(cwd) {
  if (!esRepo(cwd))
    return "Rehacer solo está disponible en proyectos con git.";
  const root = raiz(cwd);
  const r = listar(root, "rehacer")[0];
  if (!r)
    return "No hay nada para rehacer.";
  const r2 = aplicar(root, r.commit);
  git(root, ["update-ref", "-d", r.ref]);
  const d = listar(root, "deshecho")[0];
  if (d) {
    git(root, ["update-ref", `refs/skill_dey/pasos/${d.ts}`, d.commit]);
    git(root, ["update-ref", "-d", d.ref]);
  }
  return `↪ Rehecho: el proyecto volvió al estado anterior al deshacer. ${r2.borrados.length ? "Eliminados: " + r2.borrados.join(", ") : ""}`;
}
function respaldarArchivo(cwd, archivo, turno) {
  const abs = isAbsolute3(archivo) ? archivo : join3(cwd, archivo);
  const rel = relative2(cwd, abs);
  if (rel.startsWith("..") || rel.startsWith(".skill_dey"))
    return;
  const dir = join3(cwd, ".skill_dey", "respaldos-archivos", turno);
  mkdirSync(dir, { recursive: true });
  const man = join3(dir, "manifiesto.json");
  const m = existsSync2(man) ? JSON.parse(readFileSync3(man, "utf8")) : { archivos: [] };
  if (m.archivos.some((a) => a.ruta === rel))
    return;
  const existia = existsSync2(abs) && statSync2(abs).isFile();
  if (existia) {
    mkdirSync(dirname(join3(dir, "archivos", rel)), { recursive: true });
    copyFileSync(abs, join3(dir, "archivos", rel));
  }
  m.archivos.push({ ruta: rel, existia });
  writeFileSync2(man, JSON.stringify(m, null, 1));
}
function deshacerSinGit(cwd) {
  const base = join3(cwd, ".skill_dey", "respaldos-archivos");
  const turnos = existsSync2(base) ? readdirSync2(base).sort().reverse() : [];
  if (!turnos.length)
    return "No hay respaldos para deshacer (instala git para protección completa).";
  const dir = join3(base, turnos[0]);
  const m = JSON.parse(readFileSync3(join3(dir, "manifiesto.json"), "utf8"));
  const hecho = [];
  for (const a of m.archivos) {
    const dst = join3(cwd, a.ruta);
    if (a.existia) {
      mkdirSync(dirname(dst), { recursive: true });
      copyFileSync(join3(dir, "archivos", a.ruta), dst);
      hecho.push("restaurado " + a.ruta);
    } else if (existsSync2(dst)) {
      unlinkSync(dst);
      hecho.push("eliminado " + a.ruta);
    }
  }
  rmSync2(dir, { recursive: true, force: true });
  return `↩ Deshecho el último cambio (sin git):
${hecho.join(`
`)}`;
}

// app/skill_dey-lib/hook.ts
var VERSION = "40.0.0";
var CFG = join4(homedir2(), ".config", "skill_dey");
var log = (t) => {
  try {
    mkdirSync2(CFG, { recursive: true });
    appendFileSync2(join4(CFG, "errores-hook.log"), `${new Date().toISOString()} ${t}
`);
  } catch {}
};
var activo = () => {
  try {
    return JSON.parse(readFileSync4(join4(CFG, "estado.json"), "utf8")).activo !== false;
  } catch {
    return true;
  }
};
var fijarActivo = (v) => {
  try {
    mkdirSync2(CFG, { recursive: true });
    writeFileSync3(join4(CFG, "estado.json"), JSON.stringify({ activo: v, desde: new Date().toISOString() }));
  } catch {}
};
var nuevo = (sid) => ({ sid, turno: Date.now(), foto: false, ultimaEdicion: 0, editados: [], firmas: {}, ediciones: 0, paradas: 0, prompt: "", avisos: [], rojo: 0, git: undefined, pidioVerificar: false });
function cargar(cwd, host, sid) {
  try {
    const e = JSON.parse(readFileSync4(join4(cwd, ".skill_dey", `.sesion-${host}.json`), "utf8"));
    if (e.sid === sid || !sid)
      return { ...nuevo(sid), ...e };
  } catch {}
  return nuevo(sid);
}
function guardar(cwd, host, e) {
  try {
    mkdirSync2(join4(cwd, ".skill_dey"), { recursive: true });
    writeFileSync3(join4(cwd, ".skill_dey", `.sesion-${host}.json`), JSON.stringify(e));
  } catch {}
}
var primero = (o, claves) => {
  for (const k of claves) {
    const v = k.split(".").reduce((a, p) => a?.[p], o);
    if (v !== undefined && v !== null && v !== "")
      return v;
  }
  return;
};
function carpetaProyecto(ev) {
  const c = primero(ev, ["cwd", "workspace", "workspacePath", "workspace_path", "workspaceRoot", "workspace_root", "workspaceRoots.0", "workspace_roots.0", "project_dir", "projectDir"]) ?? process.env.CLAUDE_PROJECT_DIR ?? process.env.GEMINI_PROJECT_DIR ?? process.env.WORKSPACE_PATH;
  const dir = typeof c === "string" ? c.replace(/^file:\/\//, "") : process.cwd();
  if (existsSync3(join4(dir, "plugin.json")) && existsSync3(join4(dir, "scripts", "skill_dey-hook.mjs")))
    return null;
  if (resolve3(dir) === resolve3(homedir2()) || resolve3(dir) === resolve3("/"))
    return null;
  return dir;
}
var NOMBRE_EV = {
  claude: { inicio: "SessionStart", prompt: "UserPromptSubmit", antes: "PreToolUse", despues: "PostToolUse", fin: "Stop" },
  gemini: { inicio: "SessionStart", prompt: "BeforeAgent", antes: "BeforeTool", despues: "AfterTool", fin: "AfterAgent" },
  antigravity: { inicio: "SessionStart", prompt: "PreInvocation", antes: "PreToolUse", despues: "PostToolUse", fin: "Stop" }
};
function responder(host, ev, s) {
  const nombre = NOMBRE_EV[host][ev];
  if (host === "claude") {
    if (s.negar)
      return { hookSpecificOutput: { hookEventName: nombre, permissionDecision: "deny", permissionDecisionReason: s.negar } };
    if (s.mostrar)
      return { decision: "block", reason: s.mostrar };
    if (s.frenar)
      return { decision: "block", reason: s.frenar };
    if (s.contexto)
      return { hookSpecificOutput: { hookEventName: nombre, additionalContext: s.contexto } };
    return {};
  }
  if (host === "gemini") {
    if (s.negar)
      return { decision: "deny", reason: s.negar };
    if (s.comando)
      return { hookSpecificOutput: { hookEventName: nombre, tool_input: { command: s.comando } } };
    if (s.frenar)
      return { decision: "deny", reason: s.frenar };
    const ctx = [s.mostrar && `Informa al usuario exactamente esto y no hagas nada más:
${s.mostrar}`, s.contexto].filter(Boolean).join(`
`);
    if (ctx && ev !== "antes")
      return { hookSpecificOutput: { hookEventName: nombre, additionalContext: ctx } };
    return {};
  }
  if (s.negar)
    return { decision: "deny", reason: s.negar };
  if (s.frenar)
    return { decision: "block", reason: s.frenar };
  return {};
}
var AYUDA_FONDO = {
  claude: "Vuelve a ejecutarlo con run_in_background: true y revisa la salida con BashOutput.",
  gemini: "Vuelve a ejecutarlo en segundo plano (is_background: true) o con: nohup <comando> > .skill_dey/logs/servidor.log 2>&1 &",
  antigravity: "Ejecútalo en segundo plano con log: nohup <comando> > .skill_dey/logs/servidor.log 2>&1 & (en Windows: Start-Process) y lee el log."
};
var DESHAZ = /^\s*(deshaz|deshacer|deshaz (el|lo) [uú]ltimo( cambio)?|undo)\s*[.!]*\s*$/i;
var REHAZ = /^\s*(rehaz|rehacer|redo)\s*[.!]*\s*$/i;
var APAGAR = /\b(finalizar|apagar|desactivar|detener)\s+(la\s+)?skill[\s_-]?dey\b/i;
var ENCENDER = /\b(iniciar|encender|activar)\s+(la\s+)?skill[\s_-]?dey\b/i;
var MODIFICA_BASH = /sed -i|>>?|\btee\b|\bmv\b|\bcp\b|git (checkout|restore|apply|stash)|npm (i|install)|composer (require|install)|pip install|migrate/;
function procesar(host, ev, entrada) {
  const prompt = String(primero(entrada, ["prompt", "user_prompt", "userMessage", "message", "input.prompt"]) ?? "");
  if (ev === "prompt" && APAGAR.test(prompt)) {
    fijarActivo(false);
    return { mostrar: '⏸ SKILL DEY apagado. Escribe "iniciar skill dey" para encenderlo de nuevo.' };
  }
  if (ev === "prompt" && ENCENDER.test(prompt)) {
    fijarActivo(true);
    return { mostrar: `▶ SKILL DEY ${VERSION} encendido: guardián, copias para deshacer y cero errores activos.` };
  }
  if (!activo())
    return {};
  const cwd = carpetaProyecto(entrada);
  const sid = String(primero(entrada, ["session_id", "sessionId", "conversation_id", "conversationId"]) ?? "");
  const st = cwd ? cargar(cwd, host, sid) : nuevo(sid);
  const fin = (s) => {
    if (cwd)
      guardar(cwd, host, st);
    return s;
  };
  if (ev === "inicio") {
    let reglas = "";
    if (host === "claude")
      try {
        reglas = `

` + readFileSync4(join4(dirname2(process.argv[1] ?? ""), "..", "REGLAS.md"), "utf8");
      } catch {}
    return fin({ contexto: `SKILL DEY ${VERSION} activo (guardián en vivo). Antes de cada cambio se guarda una copia: si el usuario dice "deshaz", usa la herramienta skill_dey_deshacer. Para cosas de código usa la skill skill-dey. Cierra todo cambio con skill_dey_verificar en verde.${reglas}` });
  }
  if (ev === "prompt") {
    Object.assign(st, nuevo(sid), { prompt: prompt.slice(0, 2000) });
    if (cwd && DESHAZ.test(prompt))
      return fin({ mostrar: deshacer(cwd, 1) });
    if (cwd && REHAZ.test(prompt))
      return fin({ mostrar: rehacer(cwd) });
    return fin({});
  }
  const herramienta = String(primero(entrada, ["tool_name", "toolName", "tool", "name", "tool_call.name", "toolCall.name"]) ?? "");
  let args = primero(entrada, ["tool_input", "toolInput", "args", "arguments", "input", "tool_call.args", "toolCall.args", "parameters"]) ?? {};
  if (typeof args === "string") {
    try {
      args = JSON.parse(args);
    } catch {
      args = {};
    }
  }
  const acc = normalizar(herramienta, args);
  if (ev === "antes") {
    if (!/skill_dey_(deshacer|historial|estado)/.test(herramienta)) {
      const firma = `${herramienta}|${JSON.stringify(args).slice(0, 400)}|${st.ediciones}`;
      const n = (st.firmas[firma] ?? 0) + 1;
      st.firmas[firma] = n;
      if (Object.keys(st.firmas).length > 300)
        st.firmas = { [firma]: n };
      if (n >= 3)
        return fin({ negar: `SKILL_DEY anti-vueltas: ya hiciste exactamente esto ${n - 1} veces sin cambiar nada; el resultado será igual. Cambia de enfoque: escribe en 1 línea síntoma + hipótesis comprobable, o usa skill_dey_deshacer y reporta.` });
      if (st.rojo >= 15 && !/skill_dey_/.test(herramienta)) {
        st.rojo = 0;
        return fin({ negar: "SKILL_DEY FRENO: 15 acciones sobre el mismo error sin quedar en verde. Para: escribe qué sabes (hechos) y tu hipótesis; prueba UNA comprobación que la refute, o deshaz y reporta 2–3 opciones al usuario." });
      }
      if (st.rojo)
        st.rojo++;
    }
    const ctx = {
      cwd: cwd ?? process.cwd(),
      ultimaEdicion: st.ultimaEdicion,
      comoSegundoPlano: AYUDA_FONDO[host],
      puedeReescribir: host === "gemini",
      pidioDependencias: st.prompt ? (pk) => {
        const t = st.prompt.toLowerCase();
        return /instal|dependenc|librer|paquete|package|m[oó]dulo|composer|\bpip\b|\bnpm\b/.test(t) || pk.some((p) => t.includes(p.toLowerCase().split("/").pop())) || /^\s*(ok|s[ií]|dale|hazlo|listo|de acuerdo|aprobado|adelante|procede)\b/.test(t);
      } : undefined
    };
    const d = cwd ? evaluar(acc, ctx) : evaluar({ ...acc, archivo: acc.archivo && isAbsolute4(acc.archivo) ? acc.archivo : "" }, { ...ctx, cwd: "/" });
    if (d.bloquear)
      return fin({ negar: d.bloquear });
    const modifica = acc.tipo === "editar" || acc.tipo === "comando" && !!acc.comando && !esSoloLectura(acc.comando);
    if (modifica && cwd) {
      try {
        if (!st.foto) {
          st.foto = true;
          st.git = asegurarRepo(cwd);
          if (st.git)
            foto(cwd, "pasos", "cambio", acc.tipo === "comando" ? `bash: ${acc.comando}` : `${acc.herramienta} ${acc.archivo}`);
        }
        if (acc.archivo && !st.git)
          respaldarArchivo(cwd, acc.archivo, String(st.turno));
      } catch (e) {
        log(`foto: ${e?.message}`);
      }
    }
    return fin(d.comando ? { comando: d.comando } : {});
  }
  if (ev === "despues") {
    const resp = JSON.stringify(primero(entrada, ["tool_response", "toolResponse", "output", "result", "error"]) ?? "");
    if (/skill_dey_(verificar|revisar|sitio)/.test(herramienta)) {
      if (/✅ todo verde|✅ sitio sin errores|"ok":\s*true/.test(resp))
        st.rojo = 0;
      else if (/❌/.test(resp))
        st.rojo = st.rojo || 1;
    }
    if (acc.tipo === "comando" && MODIFICA_BASH.test(acc.comando)) {
      st.ediciones++;
      st.ultimaEdicion = Date.now();
    }
    if (acc.tipo !== "editar" || !acc.archivo || !cwd)
      return fin({});
    st.ediciones++;
    st.ultimaEdicion = Date.now();
    if (!st.editados.includes(acc.archivo))
      st.editados.push(acc.archivo);
    const err = sintaxis(cwd, acc.archivo);
    if (!err)
      return fin({});
    const aviso = `⚠ SKILL_DEY sintaxis en ${acc.archivo}:
${err}
→ Corrígelo antes de seguir.`;
    if (host === "antigravity") {
      st.avisos.push(aviso);
      return fin({});
    }
    return fin({ contexto: aviso });
  }
  if (!cwd || !st.editados.length)
    return fin({});
  const errores = st.editados.map((f) => {
    const e = sintaxis(cwd, f);
    return e ? `${f}: ${e.split(`
`)[0]}` : "";
  }).filter(Boolean);
  if (errores.length && st.paradas < 2) {
    st.paradas++;
    return fin({ frenar: `SKILL_DEY cero errores: quedan archivos con error de sintaxis:
${errores.slice(0, 6).join(`
`)}
Corrígelos (o usa skill_dey_deshacer) antes de terminar.` });
  }
  let v = null;
  try {
    v = JSON.parse(readFileSync4(join4(cwd, ".skill_dey", ".ultimo-verificar.json"), "utf8"));
  } catch {}
  const verde = v?.ok && v.ts >= st.ultimaEdicion;
  if (!verde && !st.pidioVerificar) {
    st.pidioVerificar = true;
    return fin({ frenar: `SKILL_DEY cero errores: cambiaste ${st.editados.length} archivo(s) y no hay verificación verde después. Corre la herramienta skill_dey_verificar; si sale ❌ corrige y repite. Luego entrega el resumen.` });
  }
  st.editados = [];
  return fin({});
}
async function leerStdin() {
  if (process.stdin.isTTY)
    return "";
  let t = "";
  process.stdin.setEncoding("utf8");
  for await (const c of process.stdin)
    t += c;
  return t;
}
async function main(argv) {
  const host = argv[0] ?? "claude";
  const ev = argv[1] ?? "antes";
  const t0 = Date.now();
  let salida = {};
  try {
    if (!["claude", "gemini", "antigravity"].includes(host) || !["inicio", "prompt", "antes", "despues", "fin"].includes(ev))
      throw new Error(`uso: skill_dey-hook <claude|gemini|antigravity> <inicio|prompt|antes|despues|fin>`);
    const txt = await leerStdin();
    const entrada = txt.trim() ? JSON.parse(txt) : {};
    salida = responder(host, ev, procesar(host, ev, entrada));
  } catch (e) {
    log(`${host}/${ev}: ${String(e?.stack ?? e).slice(0, 400)}`);
    salida = {};
  }
  const ms = Date.now() - t0;
  if (ms > 3000)
    log(`lento ${host}/${ev} ${ms} ms`);
  process.stdout.write(JSON.stringify(salida));
}
if (process.argv[1] && /skill_dey-hook\.(mjs|ts|js)$/.test(process.argv[1]))
  main(process.argv.slice(2));
export {
  main,
  procesar
};
