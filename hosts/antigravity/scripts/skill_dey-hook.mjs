#!/usr/bin/env node
// SKILL DEY 41.0.0 · generado por scripts/build.mjs desde app/skill_dey-lib/hook.ts — no editar a mano
// app/skill_dey-lib/hook.ts
import { existsSync as existsSync6, readFileSync as readFileSync8, writeFileSync as writeFileSync5, mkdirSync as mkdirSync5, appendFileSync as appendFileSync2, statSync as statSync6, openSync, readSync, closeSync, unlinkSync as unlinkSync2 } from "node:fs";
import { join as join10, resolve as resolve4, isAbsolute as isAbsolute5, dirname as dirname2 } from "node:path";
import { homedir as homedir4 } from "node:os";
import { createHash as createHash2 } from "node:crypto";

// app/skill_dey-lib/guardia.ts
import { spawnSync as spawnSync2 } from "node:child_process";
import { existsSync, readFileSync as readFileSync2, appendFileSync, readdirSync, statSync } from "node:fs";
import { join as join2, extname, isAbsolute as isAbsolute2, resolve, relative, sep } from "node:path";
import { homedir as _home } from "node:os";

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
var SECRETO = /(AKIA[0-9A-Z]{16}|ASIA[0-9A-Z]{16}|AIza[0-9A-Za-z_-]{35}|sk-(ant-|proj-)?[A-Za-z0-9_-]{32,}|gh[pousr]_[A-Za-z0-9]{36,}|github_pat_[A-Za-z0-9_]{60,}|xox[abpr]-[A-Za-z0-9-]{10,}|-----BEGIN (RSA |EC |DSA |OPENSSH |PGP )?PRIVATE KEY-----|(password|passwd|pwd|secret|api[_-]?key|apikey|token|client_secret)\s*[:=]\s*["'][^"'\s$]{8,}["'])/i;
var PLACEHOLDER = /(process\.env|getenv|env\(|os\.environ|changeme|example|xxxx|\$\{|<[^>]+>|your[_-]|tu[_-])/i;
var CLIENTE_BD = String.raw`\b(psql|mysql|mariadb|sqlite3|sqlcmd|mongosh?|redis-cli|clickhouse-client|duckdb|cockroach\s+sql)\b`;
var PELIGROSO = [
  [/\bgit\b[^|;&]*\bpush\b[^|;&]*(\s--force(-with-lease)?\b|\s-[a-zA-Z]*f[a-zA-Z]*(\s|$)|\s\+[\w./-]+|\s--mirror\b|\s:(main|master|develop|production|prod)\b|\s(--delete|-d)\s+(main|master|develop|production|prod)\b)/, "push forzado o borrado de rama principal"],
  [/\bgit\s+clean\b[^|;&]*(\s-[a-zA-Z]*[fxX][a-zA-Z]*|\s--force)\b/, "git clean (borra archivos no versionados o ignorados: .env, bases, subidas)"],
  [new RegExp(CLIENTE_BD + String.raw`[\s\S]*(\bdrop\s+(database|schema|table|collection)\b|\btruncate\s+(table\s+)?[\w."\x60\[\]]+|\bdelete\s+from\s+[\w."\x60\[\]]+\s*(["'\x60;)]|$)|dropDatabase\s*\(|\.drop\s*\(\s*\)|\bflushall\b|\bflushdb\b|\.(deleteMany|remove)\s*\(\s*(\{\s*\})?\s*\))`, "i"), "eliminación o vaciado de base de datos/tabla"],
  [/\bdropdb\b|\bmysqladmin\b[^|;&]*\bdrop\b/i, "eliminación de base de datos"],
  [/\b(migrate:(fresh|reset|refresh)|migrate\s+reset|db:(drop|wipe|reset|schema:load|seed:undo:all)|schema:drop|database:drop|--force-reset|--accept-data-loss|manage\.py\s+flush|rollback\s+--all|db:migrate:undo:all|alembic\s+downgrade\s+base|drizzle-kit\s+(drop|push\b[^|;&]*--force))\b/i, "borrado masivo de la base (migración destructiva)"],
  [/\b(rm|del|erase|unlink|Remove-Item|ri|mv|move)\b[^|;&]*\.(db|sqlite3?|mdb|accdb)(\s|["']|$)|(^|[\s;&|])(:|true|echo\s*\S*)?\s*>\s*[^\s|;&]*\.(db|sqlite3?)\b|\btruncate\s+-s\s*0\b[^|;&]*\.(db|sqlite3?)\b|\bfind\b[^|;&]*\.(db|sqlite3?)\b[^|;&]*(-delete|-exec\s+rm)/i, "borrado o vaciado del archivo de base de datos"],
  [/\bdocker(-compose|\s+compose)?\b[^|;&]*\bdown\b[^|;&]*(\s-v\b|\s--volumes\b)|\bdocker\s+volume\s+(rm|prune)\b|\bdocker\s+system\s+prune\b[^|;&]*--volumes/i, "borrado de volúmenes de Docker (ahí viven los datos de la BD)"],
  [/\b(curl|wget)\b[^|;&]*\|\s*(sudo\s+)?(ba|z|da)?sh\b|\b(iwr|irm|Invoke-WebRequest|Invoke-RestMethod)\b[^|;&]*\|\s*(iex|Invoke-Expression)\b|\biex\s*\(\s*(iwr|irm|\(?New-Object)/i, "ejecutar un script descargado sin revisarlo"],
  [/\b(artisan\s+migrate|prisma\s+migrate|knex\s+migrate|sequelize(-cli)?\s+db:migrate|rails\s+db:migrate|manage\.py\s+migrate|typeorm\S*\s+migration:run)\b[^|;&]*(--env[= ]?prod\w*|\bproduction\b)/i, "migración en producción"]
];
function borradoMasivo(cmd, cwd = process.cwd()) {
  const H = _home();
  const peligroso = (t) => {
    const x = t.replace(/^["']|["']$/g, "").replace(/^\$\{?HOME\}?|^~|^%USERPROFILE%|^\$env:USERPROFILE/i, H).replace(/^\$\(pwd\)$|^\$PWD$|^\$\{PWD\}$|^`pwd`$/i, cwd);
    if (/^(\*|\*\.\*)$/.test(x))
      return true;
    const sinComodin = x.replace(/[\\/]\*(\.\*)?$/, "");
    const r = resolve(cwd, sinComodin === "" && x !== "" ? "/" : sinComodin), rel = relative(r, cwd);
    if (sinComodin !== x && (r === resolve(cwd) || !rel || !rel.startsWith("..") || r === resolve("/")))
      return true;
    return r === resolve("/") || /^[A-Za-z]:\\?$/.test(r) || r === resolve(H) || !rel || !rel.startsWith("..") && !isAbsolute2(rel) || resolve(H).startsWith(r + sep);
  };
  for (const parte of cmd.split(/&&|\|\||;|\|/)) {
    const toks = parte.trim().match(/"[^"]*"|'[^']*'|\S+/g) ?? [];
    const i = toks.findIndex((t) => /^(rm|rmdir|rd|del|erase|Remove-Item|ri)$/i.test(t));
    if (i < 0)
      continue;
    const resto = toks.slice(i + 1), banderas = resto.filter((t) => /^-/.test(t) || /^\/[a-z]$/i.test(t)).join(" ");
    const recursivo = /(^|\s)-\w*[rR]\w*\b|--recursive\b|-Recurse\b|(^|\s)\/s\b/i.test(banderas) || /^(rmdir|rd)$/i.test(toks[i]);
    if (!recursivo && !/^(del|erase)$/i.test(toks[i]))
      continue;
    const objetivos = resto.filter((t) => !(/^-/.test(t) || /^\/[a-z]$/i.test(t)));
    if (objetivos.some(peligroso))
      return true;
  }
  return /\bfind\s+(\.|\/|~|\$HOME)\s+((-maxdepth|-mindepth)\s+\d+\s+|-type\s+\w\s+)*(-delete|-exec\s+rm)\b/.test(cmd);
}
function sqlEjecutado(cmd, cwd) {
  if (!new RegExp(CLIENTE_BD, "i").test(cmd))
    return "";
  const archivos = [...cmd.matchAll(/(?:<\s*|-f\s*|--file[= ]|\.read\s+|-i\s+|\bsource\s+|\bcat\s+|\\\.\s+)["']?([^\s"'|;&<>()$]+\.sql)\b/gi)].map((m) => m[1]);
  let txt = "";
  for (const f of archivos.slice(0, 5)) {
    try {
      txt += readFileSync2(isAbsolute2(f) ? f : join2(cwd, f), "utf8").slice(0, 5000000) + `
`;
    } catch {}
  }
  return txt;
}
function blindarGitignore(cwd) {
  const gi = join2(cwd, ".gitignore");
  const actual = existsSync(gi) ? readFileSync2(gi, "utf8") : "";
  const faltan = [".env", ".env.*", "!.env.example", ".skill_dey/shots/", ".skill_dey/.ultimo-verificar.json", ".skill_dey/respaldos-bd/", ".skill_dey/respaldos-archivos/"].filter((l) => !actual.split(/\r?\n/).map((x) => x.trim()).includes(l));
  if (faltan.length)
    appendFileSync(gi, (actual && !actual.endsWith(`
`) ? `
` : "") + `# SKILL_DEY: nunca subir secretos ni temporales
` + faltan.join(`
`) + `
`);
  const r = spawnSync2("git", ["ls-files", "--cached", "--", ".env", ".env.local", ".env.production", ".env.prod"], { cwd, encoding: "utf8", timeout: 1e4, maxBuffer: 1e7 });
  const trackeados = (r.stdout || "").trim();
  return trackeados ? trackeados.split(/\r?\n/).join(", ") : null;
}
var TRUNCADO = /(\/\/|#|\/\*|<!--|--)\s*\.{3}\s*(resto|rest|existing|c[oó]digo|code|same|sin cambios|unchanged|igual|anterior|previous|etc)|\.{3}\s*(resto del|rest of (the )?)(c[oó]digo|code|file|archivo)|(\/\/|#)\s*(aqu[ií] va|el resto|the rest|remaining code|c[oó]digo existente|existing code)\b/i;
var SERVIDOR = /(^|&&|;|\|\|)\s*((npm|pnpm|yarn|bun)\s+(run\s+)?(dev|start|serve|watch|preview)(?![:\w-])|php\s+(artisan\s+serve|-S\s)|(python3?|py)\s+manage\.py\s+runserver|nodemon\b|npx\s+(vite(?!\s+build)|next\s+dev|nodemon)|vite(\s+(dev|serve|preview)\b|\s*($|&&|;|\|))|next\s+dev|flask\s+run|uvicorn\b|rails\s+s(erver)?\b|dotnet\s+watch\b)/i;
var DEPENDENCIA = /\b(npm\s+(i|install|add)|yarn\s+add|pnpm\s+(add|i|install)|bun\s+add|composer\s+require|pip3?\s+install|poetry\s+add|go\s+get|cargo\s+add|gem\s+install|dotnet\s+add\s+package)\s+(?<pkgs>[^&|;]+)/i;
var SOLO_LECTURA = /^\s*(ls|dir|cat|type|head|tail|less|grep|rg|find|wc|tree|pwd|echo|which|where|whoami|printenv|node\s+(-v|--version|--check)|npm\s+(ls|view|outdated|audit(?!\s+fix))|pip\s+(show|list)|composer\s+(show|audit)|git\s+(status|log|diff|show|branch|rev-parse|ls-files|grep|remote|config\s+--get|blame|describe|tag\s*$))\b/i;
var esSoloLectura = (cmd) => !/[^2]>|>>|\btee\b|\s-i\b|\s-delete\b|\s-exec(dir)?\b|\s-ok\b|\$\(|`|\bxargs\b/.test(cmd) && !/\bgit\s+(branch|tag|remote)\b[^|;&]*\s(-d|-D|-m|-M|-f|--delete|--move|--force|add|remove|rm|rename|set-url)\b/.test(cmd) && cmd.split(/&&|\|\||;|\|/).every((p) => !p.trim() || SOLO_LECTURA.test(p));
var EDITA = new Set(["edit", "write", "patch", "multiedit", "apply_patch"]);
var fueraDelProyecto = (cwd, archivo) => {
  const rel = relative(resolve(cwd), resolve(isAbsolute2(archivo) ? archivo : join2(cwd, archivo)));
  return rel.startsWith("..") || isAbsolute2(rel);
};
var CODIGO = /\.(m?[jt]sx?|cjs|php|py|java|cs|go|rb|vue|svelte|dart|kt|swift|rs)$/i;
function impactoDe(cwd, abs, viejo, nuevo) {
  const cuenta = (t) => {
    const m = new Map;
    for (const l of t.split(/\r?\n/))
      m.set(l, (m.get(l) ?? 0) + 1);
    return m;
  };
  const a = cuenta(viejo), b = cuenta(nuevo), cambiadas = [];
  for (const [l, n] of a)
    if ((b.get(l) ?? 0) < n)
      cambiadas.push(l);
  for (const [l, n] of b)
    if ((a.get(l) ?? 0) < n)
      cambiadas.push(l);
  const DEF = /(?:function|def|class|interface|type|enum|func|fn|const|let|var)\s+([A-Za-z_$][\w$]+)|^\s*(?:export\s+)?(?:public|private|protected|static|async|\s)*\s*([A-Za-z_$][\w$]{2,})\s*\([^)]*\)\s*[:{]/;
  const nombres = [...new Set(cambiadas.map((l) => l.match(DEF)).filter(Boolean).map((m) => m[1] ?? m[2]).filter((n) => !/^(if|for|while|switch|catch|function|return|constructor|render|main|index|data|item|value|result)$/.test(n)))].slice(0, 4);
  if (!nombres.length)
    return "";
  const rel = relative(cwd, abs).replace(/\\/g, "/"), L = [];
  for (const n of nombres) {
    const r = spawnSync2("git", ["-c", "core.quotepath=off", "grep", "--untracked", "-l", "-w", "-I", "-F", "-e", n, "--", ".", ":!node_modules", ":!vendor", ":!dist", ":!build", ":!.skill_dey", ":!*.min.*", ":!*.lock", ":!docs"], { cwd, encoding: "utf8", timeout: 5000 });
    const usos = (r.stdout ?? "").split(`
`).map((x) => x.trim()).filter((x) => x && x !== rel).slice(0, 6);
    if (usos.length)
      L.push(`\`${n}\` → ${usos.join(", ")}`);
  }
  return L.length ? `⚠ SKILL_DEY impacto: cambiaste algo que OTROS archivos usan:
${L.join(`
`)}
→ Revisa que esos usos sigan siendo compatibles (nombre, parámetros, lo que devuelve). Si no, ajústalos o revierte.` : "";
}
var relNorm = (cwd, archivo) => {
  const r = relative(resolve(cwd), resolve(isAbsolute2(archivo) ? archivo : join2(cwd, archivo))).replace(/\\/g, "/");
  return process.platform === "win32" ? r.toLowerCase() : r;
};
var ENV_REAL = /(^|[\\/])\.env(\.(?!example$|sample$|template$|dist$)[\w.-]+)?$/i;
var LEE_ENV = /(^|[\s;&|(])(cat|type|more|less|head|tail|bat|nl|strings|Get-Content|gc|findstr|Select-String|sls|grep|rg|awk|sed|source|xxd|od)\b[^|;&]*?(^|[\s"'=\/\\])\.env(\.(?!example\b|sample\b|template\b|dist\b)[\w.-]+)?(?=["'\s;|&)]|$)/i;
var MIGRACION = /(artisan\s+migrate(?!:status)|prisma\s+(migrate\s+(dev|deploy|reset)|db\s+push)|knex\s+migrate:(latest|up|down|rollback)|sequelize(-cli)?\s+db:migrate|alembic\s+(upgrade|downgrade)|manage\.py\s+migrate|typeorm.*migration:(run|revert)|flyway\s+migrate|rails\s+db:(migrate|rollback)|goose\s+(up|down)|doctrine:migrations:migrate)/i;
var BD_SQL = /\bdrop\s+(database|schema|table|collection)\b|\btruncate\s+table\s+[\w."`\[\]]+|\btruncate\s+[\w."`\[\]]+\s*;|\bdelete\s+from\s+[\w."`\[\]${}]+\s*(;|$)/i;
var BD_EN_CODIGO = /\b(query|execute|exec|raw|prepare|sql|statement|unsafe|run)\w*\s*\(\s*["'`]\s*(delete\s+from\s+[\w."`\[\]${}]+\s*["'`;]|truncate\s|drop\s+(table|database|schema)\b)|\.(deleteMany|remove)\s*\(\s*(\{\s*\})?\s*\)|\bknex\s*\([^)]*\)\s*\.(del|delete|truncate)\s*\(\s*\)|\.objects\.all\(\)\.delete\(\)|(->|::)truncate\s*\(\s*\)|\.sync\s*\(\s*\{[^}]*\bforce\s*:\s*true|\.dropDatabase\s*\(|\bcollection\s*\([^)]*\)\s*\.drop\s*\(\s*\)|\bdb\.\w+\.drop\s*\(\s*\)|\b(flushall|flushdb)\s*\(/i;
function bdDestructivo(texto, esSql) {
  for (const l of texto.split(/\r?\n/)) {
    const t = l.trim();
    if (!t || /^(\/\/|#|--|\*|\/\*|<!--|rem\s)/i.test(t))
      continue;
    const m = (esSql ? t.match(BD_SQL) : null) ?? t.match(BD_EN_CODIGO) ?? (/["'`][^"'`]*\bdrop\s+(database|schema|table)\b/i.test(t) ? t.match(/\bdrop\s+(database|schema|table)\b/i) : null);
    if (m)
      return m[0];
  }
  return null;
}
var SQL_MODIFICA = /(psql|mysql|mariadb|sqlite3|sqlcmd|mongosh?)\b[\s\S]*\b(delete\s+from|update\s+[\w."`\[\]]+\s+set|alter\s+table|drop\s+(table|column|index)|insert\s+into|deleteMany|updateMany)\b/i;
function respaldoBdReciente(cwd, horas = 3) {
  const d = join2(cwd, ".skill_dey", "respaldos-bd");
  if (!existsSync(d))
    return false;
  try {
    return readdirSync(d).some((f) => {
      try {
        return Date.now() - statSync(join2(d, f)).mtimeMs < horas * 3600000;
      } catch {
        return false;
      }
    });
  } catch {
    return false;
  }
}
function sintaxis(cwd, file) {
  const f = isAbsolute2(file) ? file : join2(cwd, file);
  if (!existsSync(f))
    return "";
  const e = extname(f).toLowerCase();
  if ([".js", ".mjs", ".cjs"].includes(e))
    return errorJs(cwd, f);
  const cmd = e === ".php" ? `php -l "${f}"` : e === ".py" ? `${process.platform === "win32" ? "python" : "python3"} -m py_compile "${f}"` : [".js", ".mjs", ".cjs"].includes(e) ? `node --check "${f}"` : "";
  if (e === ".json") {
    try {
      JSON.parse(readFileSync2(f, "utf8"));
      return "";
    } catch (x) {
      return `JSON inválido: ${x.message}`;
    }
  }
  if (!cmd)
    return "";
  const r = spawnSync2(cmd, { cwd, shell: true, encoding: "utf8", timeout: 8000 });
  const out = `${r.stdout ?? ""}${r.stderr ?? ""}`;
  if (r.status === 0 || /not recognized|not found|no se reconoce/i.test(out))
    return "";
  return out.split(/\r?\n/).filter((l) => l.trim() && !/^\s*at \S|^Node\.js v/.test(l)).slice(-6).join(`
`);
}

// app/skill_dey-lib/respaldo.ts
import { spawnSync as spawnSync3 } from "node:child_process";
import { existsSync as existsSync2, mkdirSync, readFileSync as readFileSync3, writeFileSync as writeFileSync2, copyFileSync, unlinkSync, readdirSync as readdirSync2, statSync as statSync2, lstatSync, rmSync as rmSync2 } from "node:fs";
import { join as join3, dirname, resolve as resolve2, relative as relative2, isAbsolute as isAbsolute3 } from "node:path";
import { homedir } from "node:os";
import { createHash } from "node:crypto";
var ID = { GIT_AUTHOR_NAME: "SKILL_DEY", GIT_AUTHOR_EMAIL: "skill_dey@local", GIT_COMMITTER_NAME: "SKILL_DEY", GIT_COMMITTER_EMAIL: "skill_dey@local" };
var GITC = ["-c", "core.quotepath=off", "-c", "core.autocrlf=false", "-c", "core.safecrlf=false"];
var EXCL_DIRS = [".skill_dey", "node_modules", "vendor", ".venv", "venv", "dist", "build", ".next", ".nuxt", "coverage", "__pycache__"];
var EXCL_EXT = [
  "zip",
  "rar",
  "7z",
  "gz",
  "tar",
  "iso",
  "dmg",
  "exe",
  "msi",
  "mp4",
  "mov",
  "avi",
  "mkv",
  "mp3",
  "wav",
  "psd",
  "bak",
  "dump",
  "log",
  "sqlite",
  "sqlite3",
  "db",
  "db-wal",
  "db-shm",
  "db-journal",
  "mdb",
  "accdb",
  "csv",
  "xlsx",
  "xls"
];
var POSITIVOS = [...EXCL_DIRS.map((d) => `:(glob)**/${d}/**`), ...EXCL_EXT.map((e) => `:(glob)**/*.${e}`)];
var EXCLUIR = POSITIVOS.map((p) => p.replace(":(glob)", ":(exclude,glob)"));
var EXCL_RE = new RegExp(`(^|/)(${EXCL_DIRS.map((d) => d.replace(/\./g, "\\.")).join("|")})/|\\.(${EXCL_EXT.join("|")})$`, "i");
var PROTEGIDO = /(^|\/)(\.env(?!\.example$)(\..*)?|\.skill_dey\/.*)$/i;
var MAX_FOTOS = 150;
var MAX_ARCHIVO = 30;
function git(cwd, args, env = {}, input) {
  const r = spawnSync3("git", [...GITC, ...args], { cwd, encoding: "utf8", maxBuffer: 500000000, timeout: 120000, input, env: { ...process.env, ...ID, ...env } });
  return { ok: r.status === 0, out: (r.stdout ?? "").trim(), raw: r.stdout ?? "", err: (r.stderr ?? "").trim(), sinGit: !!r.error };
}
var lista0 = (s) => s.split("\x00").filter(Boolean);
var hayGit = (cwd) => !git(cwd, ["--version"]).sinGit;
var esRepo = (cwd) => git(cwd, ["rev-parse", "--is-inside-work-tree"]).out === "true";
var raiz = (cwd) => git(cwd, ["rev-parse", "--show-toplevel"]).out || cwd;
var esCarpetaPeligrosa = (p) => {
  const r = resolve2(p);
  return r === resolve2(homedir()) || r === resolve2("/") || /^[A-Za-z]:\\?$/.test(r);
};
function asegurarRepo(cwd) {
  if (!hayGit(cwd))
    return false;
  if (esRepo(cwd))
    return !esCarpetaPeligrosa(raiz(cwd));
  if (esCarpetaPeligrosa(cwd))
    return false;
  return git(cwd, ["init", "-q"]).ok;
}
function ctxGit(cwd) {
  const root = raiz(cwd);
  const prefijo = git(cwd, ["rev-parse", "--show-prefix"]).out.replace(/\\/g, "/");
  const gd = git(root, ["rev-parse", "--git-dir"]).out || ".git";
  const gitDir = isAbsolute3(gd) ? gd : join3(root, gd);
  const clave = createHash("sha1").update(resolve2(root) + "|" + prefijo).digest("hex").slice(0, 12);
  return { root, prefijo, gitDir, clave, spec: prefijo ? prefijo.replace(/\/$/, "") : "." };
}
var comillas = (t) => t.startsWith('"') ? t : `"${t}"`;
var dentro = (f, prefijo) => !prefijo || f.startsWith(prefijo);
var REF = (c, grupo, ...resto) => ["refs/skill_dey", c.clave, grupo, ...resto].join("/");
function indice(gitDir, nombre) {
  const idx = join3(gitDir, nombre);
  try {
    if (existsSync2(idx + ".lock") && Date.now() - statSync2(idx + ".lock").mtimeMs > 120000)
      rmSync2(idx + ".lock", { force: true });
  } catch {}
  return { GIT_INDEX_FILE: idx };
}
function arbolActual(c, nombreIdx) {
  const env = indice(c.gitDir, nombreIdx);
  const head = git(c.root, ["rev-parse", "--verify", "-q", "HEAD"]).out;
  if (!git(c.root, head ? ["read-tree", "HEAD"] : ["read-tree", "--empty"], env).ok)
    return null;
  git(c.root, ["rm", "--cached", "-r", "-q", "--ignore-unmatch", "--", ...POSITIVOS], env);
  const extra = [];
  for (let i = 0;i < 6; i++) {
    const a = git(c.root, ["add", "-A", "--", c.spec, ...EXCLUIR, ...extra], env);
    if (a.ok)
      break;
    const sub = a.err.match(/'([^']+?)\/?' does not have a commit checked out/)?.[1];
    if (!sub || i === 5)
      return null;
    extra.push(`:(exclude)${sub}`);
  }
  const forzados = lista0(git(c.root, ["ls-files", "-z", "-c", "-i", "--exclude-standard", "--", c.spec]).raw).filter((f) => !EXCL_RE.test(f) && !PROTEGIDO.test(f));
  if (forzados.length)
    git(c.root, ["add", "-f", "--pathspec-from-file=-", "--pathspec-file-nul"], env, forzados.join("\x00") + "\x00");
  const secretos = lista0(git(c.root, ["ls-files", "-z"], env).raw).filter((f) => PROTEGIDO.test(f));
  if (secretos.length)
    git(c.root, ["rm", "--cached", "-q", "--ignore-unmatch", "--pathspec-from-file=-", "--pathspec-file-nul"], env, secretos.join("\x00") + "\x00");
  return git(c.root, ["write-tree"], env).out || null;
}
function listar(c, grupo) {
  const r = git(c.root, ["for-each-ref", "--sort=-refname", "--format=%(refname) %(objectname) %(contents:subject)", REF(c, grupo) + "/"]);
  if (!r.ok || !r.out)
    return [];
  return r.out.split(`
`).map((l) => {
    const [ref, commit, ...resto] = l.split(" ");
    const subj = resto.join(" ");
    const m = subj.match(/^skill_dey\[(\w[\w-]*)\] (.*)$/);
    return { ref, commit, ts: Number(ref.split("/").pop()), tipo: m?.[1] ?? "?", nota: m?.[2] ?? subj };
  }).filter((f) => Number.isFinite(f.ts));
}
var ultimoTs = 0;
var nuevoTs = () => ultimoTs = Math.max(Date.now(), ultimoTs + 1);
var arbolDe = (c, commit) => git(c.root, ["rev-parse", `${commit}^{tree}`]).out;
function fotoInterna(cwd, grupo, tipo, nota, deduplicar = true) {
  if (!asegurarRepo(cwd))
    return null;
  const c = ctxGit(cwd);
  const tree = arbolActual(c, "skill_dey-index");
  if (!tree)
    return null;
  const ultima = listar(c, grupo)[0];
  if (deduplicar && ultima && arbolDe(c, ultima.commit) === tree)
    return { commit: ultima.commit, ts: ultima.ts };
  const head = git(c.root, ["rev-parse", "--verify", "-q", "HEAD"]).out;
  const commit = git(c.root, ["commit-tree", tree, ...head ? ["-p", head] : [], "-m", `skill_dey[${tipo}] ${(c.prefijo ? "[" + c.prefijo + "] " : "") + nota.replace(/\s+/g, " ").slice(0, 150)}`]).out;
  if (!commit)
    return null;
  const ts = nuevoTs();
  if (!git(c.root, ["update-ref", REF(c, grupo, ts), commit]).ok)
    return null;
  if (grupo === "pasos") {
    for (const vieja of listar(c, "pasos").slice(MAX_FOTOS))
      git(c.root, ["update-ref", "-d", vieja.ref]);
    if (tipo === "cambio")
      archivarRehacer(c);
  }
  return { commit, ts };
}
function archivarRehacer(c) {
  for (const g of ["rehacer", "deshecho"])
    for (const f of listar(c, g)) {
      git(c.root, ["update-ref", REF(c, "archivo", nuevoTs()), f.commit]);
      git(c.root, ["update-ref", "-d", f.ref]);
    }
  for (const vieja of listar(c, "archivo").slice(MAX_ARCHIVO))
    git(c.root, ["update-ref", "-d", vieja.ref]);
}
function foto(cwd, grupo, tipo, nota) {
  return fotoInterna(cwd, grupo, tipo, nota)?.commit ?? null;
}
function aplicar(c, commit) {
  const no = (error) => ({ ok: false, restaurados: 0, borrados: [], error });
  if (!git(c.root, ["cat-file", "-e", `${commit}^{commit}`]).ok)
    return no("la foto ya no existe en git");
  const lt = git(c.root, ["ls-tree", "-r", "-z", "--full-tree", commit]);
  if (!lt.ok)
    return no("no pude leer la foto");
  const blobs = new Map;
  for (const e of lista0(lt.raw)) {
    const m = e.match(/^\d+ blob ([0-9a-f]+)\t([\s\S]+)$/);
    if (m && dentro(m[2], c.prefijo) && !PROTEGIDO.test(m[2]) && !EXCL_RE.test(m[2]))
      blobs.set(m[2], m[1]);
  }
  const choque = [...blobs.keys()].find((f) => {
    try {
      return lstatSync(join3(c.root, f)).isDirectory();
    } catch {
      return false;
    }
  });
  if (choque)
    return no(`"${choque}" ahora es una carpeta y en la foto era un archivo; muévela o renómbrala y repite (no toco nada para no perder lo que tiene dentro)`);
  const existentes = [...blobs.keys()].filter((f) => {
    try {
      return lstatSync(join3(c.root, f)).isFile();
    } catch {
      return false;
    }
  });
  const hashes = existentes.length ? git(c.root, ["hash-object", "--stdin-paths"], {}, existentes.join(`
`) + `
`).out.split(`
`) : [];
  const igual = new Set(existentes.filter((f, i) => hashes[i] === blobs.get(f)));
  const cambiar = [...blobs.keys()].filter((f) => !igual.has(f));
  const actuales = lista0(git(c.root, ["ls-files", "-z", "-co", "--exclude-standard", "--", c.spec, ...EXCLUIR]).raw);
  const forzados = lista0(git(c.root, ["ls-files", "-z", "-c", "-i", "--exclude-standard", "--", c.spec]).raw);
  const env = indice(c.gitDir, "skill_dey-index");
  if (!git(c.root, ["read-tree", commit], env).ok)
    return no("no pude cargar la foto");
  if (cambiar.length) {
    const r = git(c.root, ["checkout-index", "-f", "-z", "--stdin"], env, cambiar.join("\x00") + "\x00");
    if (!r.ok)
      return no("no pude restaurar: " + r.err.slice(0, 160));
  }
  const candidatos = [...new Set([...actuales, ...forzados])].filter((f) => !blobs.has(f) && !PROTEGIDO.test(f) && !EXCL_RE.test(f) && dentro(f, c.prefijo));
  const ignorados = new Set(candidatos.length ? lista0(git(c.root, ["check-ignore", "--no-index", "-z", "--stdin"], {}, candidatos.join("\x00") + "\x00").raw) : []);
  const borrados = [];
  for (const f of candidatos) {
    if (ignorados.has(f) && !forzados.includes(f))
      continue;
    try {
      unlinkSync(join3(c.root, f));
      borrados.push(f);
    } catch {}
  }
  return { ok: true, restaurados: cambiar.length, borrados };
}
function difResumen(root, desde, hasta) {
  return git(root, ["diff", "--stat", "--stat-width=90", desde, hasta]).out.split(`
`).slice(-12).join(`
`);
}
function deshacer(cwd, pasos = 1) {
  if (!esRepo(cwd) || esCarpetaPeligrosa(raiz(cwd)))
    return deshacerSinGit(cwd);
  const c = ctxGit(cwd);
  const fotos = listar(c, "pasos");
  if (!fotos.length)
    return "No hay cambios de SKILL_DEY para deshacer en este proyecto.";
  const n = Math.min(Math.max(1, pasos), fotos.length);
  const objetivo = fotos[n - 1];
  const actual = fotoInterna(cwd, "rehacer", "antes-de-deshacer", `estado antes de deshacer ${n} paso(s)`, false);
  if (!actual)
    return "⛔ No deshice nada: no pude guardar primero el estado actual (para poder rehacer). Cierra otros procesos de git y repite.";
  const r = aplicar(c, objetivo.commit);
  if (!r.ok) {
    git(c.root, ["update-ref", "-d", REF(c, "rehacer", actual.ts)]);
    return `⛔ No deshice nada: ${r.error}. Tus archivos quedaron como estaban.`;
  }
  for (const f of fotos.slice(0, n)) {
    git(c.root, ["update-ref", REF(c, "deshecho", actual.ts, f.ts), f.commit]);
    git(c.root, ["update-ref", "-d", f.ref]);
  }
  return [
    `↩ Deshecho(s) ${n} cambio(s). Proyecto restaurado a como estaba antes de: ${comillas(objetivo.nota)} (${new Date(objetivo.ts).toLocaleString()}).`,
    difResumen(c.root, actual.commit, objetivo.commit),
    r.borrados.length ? `Archivos creados por el cambio y eliminados: ${r.borrados.slice(0, 10).join(", ")}${r.borrados.length > 10 ? "…" : ""}` : "",
    "Se puede REHACER si fue un error. .env, ignorados, dependencias y datos no se tocaron. Si hubo migraciones de BD, revierte también la BD (ver respaldos-bd)."
  ].filter(Boolean).join(`
`);
}
function rehacer(cwd) {
  if (!esRepo(cwd))
    return "Rehacer solo está disponible en proyectos con git.";
  const c = ctxGit(cwd);
  const r = listar(c, "rehacer")[0];
  if (!r)
    return "No hay nada para rehacer.";
  const seguro = fotoInterna(cwd, "pasos", "antes-de-rehacer", "estado antes de rehacer", false);
  if (!seguro)
    return "⛔ No rehice nada: no pude guardar primero el estado actual. Repite en un momento.";
  const r2 = aplicar(c, r.commit);
  if (!r2.ok) {
    git(c.root, ["update-ref", "-d", REF(c, "pasos", seguro.ts)]);
    return `⛔ No rehice nada: ${r2.error}.`;
  }
  git(c.root, ["update-ref", "-d", r.ref]);
  const vuelven = listar(c, "deshecho").filter((x) => x.ref.includes(`/deshecho/${r.ts}/`));
  for (const d of vuelven) {
    git(c.root, ["update-ref", REF(c, "pasos", d.ts), d.commit]);
    git(c.root, ["update-ref", "-d", d.ref]);
  }
  const masNuevo = vuelven.sort((a, b) => b.ts - a.ts)[0];
  if (masNuevo && arbolDe(c, masNuevo.commit) === arbolDe(c, seguro.commit))
    git(c.root, ["update-ref", "-d", REF(c, "pasos", seguro.ts)]);
  return `↪ Rehecho: el proyecto volvió al estado anterior al deshacer. ${r2.borrados.length ? "Eliminados: " + r2.borrados.slice(0, 10).join(", ") : ""}`.trim();
}
function historial(cwd) {
  if (!esRepo(cwd) || esCarpetaPeligrosa(raiz(cwd))) {
    const l = turnosSinGit(cwd).slice(0, 20);
    return l.length ? `Respaldos (sin git) · 1 = el último:
` + l.map((x, i) => {
      const p = leerManifiesto(join3(BASE_SIN_GIT(cwd), x)).pedido;
      return `${i + 1}. ${x.slice(0, 16).replace("T", " ")}${p ? ` · "${p}"` : ""}`;
    }).join(`
`) : "Sin respaldos.";
  }
  const c = ctxGit(cwd);
  const f = listar(c, "pasos");
  const lineas = f.slice(0, 25).map((x, i) => `${i + 1}. ${new Date(x.ts).toLocaleString()} · antes de: ${x.nota}`);
  const reh = listar(c, "rehacer").length;
  return (lineas.length ? `Puntos guardados (también de sesiones anteriores) · 1 = el más reciente${f.length > 25 ? ` · hay ${f.length} en total` : ""}:
` + lineas.join(`
`) + `

Para volver: "vuelve al punto 3" o "vuelve a antes de <lo que pediste>". Siempre se puede rehacer.` : "No hay cambios para deshacer.") + (reh ? `
(${reh} deshacer reversible con rehacer)` : "");
}
function deshacerDesde(cwd, desde, commitBase = "") {
  if (!esRepo(cwd) || esCarpetaPeligrosa(raiz(cwd))) {
    const out = [];
    for (let i = 0;i < 10; i++) {
      const t = turnosSinGit(cwd)[0];
      if (!t)
        break;
      const ms = Date.parse(t.replace(/^(\d{4}-\d{2}-\d{2}T\d{2})-(\d{2})-(\d{2})-(\d{3})Z.*$/, "$1:$2:$3.$4Z"));
      if (!Number.isFinite(ms) || ms < desde - 1000)
        break;
      out.push(deshacerSinGit(cwd));
    }
    return out.join(`
`) || "No había nada que deshacer.";
  }
  const fotos = listar(ctxGit(cwd), "pasos");
  const iBase = commitBase ? fotos.findIndex((f) => f.commit === commitBase) : -1;
  const n = iBase >= 0 ? iBase + 1 : fotos.filter((f) => f.ts >= desde - 1000).length;
  return n ? deshacer(cwd, n) : "No había nada que deshacer.";
}
function buscarPaso(cwd, texto) {
  const norm = (x) => x.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9ñ ]+/g, " ").replace(/\s+/g, " ").trim();
  const q = norm(texto).split(" ").filter((w) => w.length > 2 && !/^(los|las|del|que|cuando|antes|como|estaba|para|con)$/.test(w));
  if (!q.length || !esRepo(cwd))
    return { n: 0, nota: "" };
  const fotos = listar(ctxGit(cwd), "pasos");
  let mejor = { n: 0, nota: "", p: 0 };
  const raizDe = (w) => w.slice(0, Math.max(4, w.length - 2));
  fotos.forEach((f, i) => {
    const tw = norm(f.nota).split(" "), p = q.filter((w) => tw.some((x) => x.startsWith(raizDe(w)) || w.startsWith(raizDe(x)) && x.length > 3)).length / q.length;
    if (p > mejor.p)
      mejor = { n: i + 1, nota: f.nota, p };
  });
  return mejor.p >= 0.6 ? { n: mejor.n, nota: mejor.nota } : { n: 0, nota: "" };
}
var HITOS = (cwd) => join3(cwd, ".skill_dey", "HITOS.json");
var leerHitos = (cwd) => {
  try {
    const j = JSON.parse(readFileSync3(HITOS(cwd), "utf8"));
    return Array.isArray(j) ? j : [];
  } catch {
    return [];
  }
};
function listarHitos(cwd) {
  const j = leerHitos(cwd);
  if (!j.length)
    return "No hay checkpoints. Crea uno con /skill_dey checkpoint <nombre>.";
  return `\uD83D\uDCCD Checkpoints (vuelve con /skill_dey volver <nombre>):
` + j.slice().reverse().map((h) => `  · ${h.nombre} — ${new Date(h.ts).toLocaleString()}`).join(`
`);
}
var BASE_SIN_GIT = (cwd) => join3(cwd, ".skill_dey", "respaldos-archivos");
var leerManifiesto = (dir) => {
  try {
    const m = JSON.parse(readFileSync3(join3(dir, "manifiesto.json"), "utf8"));
    if (Array.isArray(m?.archivos))
      return m;
  } catch {}
  return { archivos: [] };
};
function turnosSinGit(cwd) {
  const base = BASE_SIN_GIT(cwd);
  try {
    return readdirSync2(base).filter((d) => {
      try {
        return statSync2(join3(base, d)).isDirectory();
      } catch {
        return false;
      }
    }).sort().reverse();
  } catch {
    return [];
  }
}
function respaldarArchivo(cwd, archivo, turno, pedido = "") {
  try {
    const abs = isAbsolute3(archivo) ? archivo : join3(cwd, archivo);
    const rel = relative2(cwd, abs);
    if (!rel || rel.startsWith("..") || isAbsolute3(rel) || rel.startsWith(".skill_dey"))
      return;
    const dir = join3(BASE_SIN_GIT(cwd), turno);
    mkdirSync(dir, { recursive: true });
    const m = leerManifiesto(dir);
    if (m.archivos.some((a) => a.ruta === rel))
      return;
    const existia = existsSync2(abs) && statSync2(abs).isFile();
    if (existia) {
      mkdirSync(dirname(join3(dir, "archivos", rel)), { recursive: true });
      copyFileSync(abs, join3(dir, "archivos", rel));
    }
    m.archivos.push({ ruta: rel, existia });
    if (pedido && !m.pedido)
      m.pedido = pedido.replace(/\s+/g, " ").slice(0, 120);
    writeFileSync2(join3(dir, "manifiesto.json"), JSON.stringify(m, null, 1));
    for (const viejo of turnosSinGit(cwd).slice(40))
      rmSync2(join3(BASE_SIN_GIT(cwd), viejo), { recursive: true, force: true });
  } catch {}
}
function deshacerSinGit(cwd) {
  const turnos = turnosSinGit(cwd);
  if (!turnos.length)
    return "No hay respaldos para deshacer (instala git para protección completa).";
  const dir = join3(BASE_SIN_GIT(cwd), turnos[0]);
  const m = leerManifiesto(dir);
  const hecho = [], faltan = [];
  for (const a of m.archivos) {
    if (!a.existia)
      continue;
    const src = join3(dir, "archivos", a.ruta), dst = join3(cwd, a.ruta);
    if (!existsSync2(src)) {
      faltan.push(a.ruta);
      continue;
    }
    try {
      mkdirSync(dirname(dst), { recursive: true });
      copyFileSync(src, dst);
      hecho.push("restaurado " + a.ruta);
    } catch {
      faltan.push(a.ruta);
    }
  }
  if (faltan.length)
    return `⛔ No terminé de deshacer: falta la copia de ${faltan.slice(0, 5).join(", ")}. Restauré lo demás y conservé el respaldo en .skill_dey/respaldos-archivos/${turnos[0]}.`;
  for (const a of m.archivos)
    if (!a.existia) {
      const dst = join3(cwd, a.ruta);
      try {
        if (existsSync2(dst) && statSync2(dst).isFile()) {
          unlinkSync(dst);
          hecho.push("eliminado " + a.ruta);
        }
      } catch {}
    }
  rmSync2(dir, { recursive: true, force: true });
  return `↩ Deshecho el último cambio (sin git):
${hecho.join(`
`) || "(nada que cambiar)"}`;
}
function cambiosExactos(cwd, max = 80) {
  if (!esRepo(cwd))
    return "Sin git en este proyecto: no puedo mostrar el diff exacto ni revertir. Conviene activar git para la red de seguridad.";
  const c = ctxGit(cwd);
  const fotos = listar(c, "pasos");
  if (!fotos.length)
    return "Aún no hay checkpoint en esta sesión (el primer cambio crea uno).";
  const tree = arbolActual(c, "skill_dey-index-dif");
  if (!tree)
    return "No pude calcular los cambios.";
  const d = git(c.root, ["diff", "--word-diff=plain", "--unified=0", fotos[0].commit + "^{tree}", tree, "--", c.spec]).out;
  if (!d.trim())
    return "✅ Sin cambios desde el último checkpoint.";
  const out = ["SKILL_DEY · cambios exactos desde el último checkpoint", "(para volver si algo falla: /skill_dey deshacer)", ""];
  let n = 0;
  for (const l of d.split(`
`)) {
    if (l.startsWith("+++ b/")) {
      out.push("· " + l.slice(6));
      continue;
    }
    const m = l.match(/^@@ -\d+(?:,\d+)? \+(\d+)/);
    if (m) {
      out.push("  línea " + m[1] + ":");
      continue;
    }
    if (/\[-|\{\+/.test(l) && n < max) {
      out.push("    " + l.trim().slice(0, 160));
      n++;
    }
  }
  if (n >= max)
    out.push("  … (" + max + "+ cambios)");
  return out.join(`
`);
}
function deshacerArchivo(cwd, ruta) {
  const abs = resolve2(cwd, ruta.trim().replace(/^["'`]|["'`]$/g, ""));
  const rel = relative2(cwd, abs).replace(/\\/g, "/");
  if (!rel || rel.startsWith("..") || isAbsolute3(rel))
    return `⛔ "${ruta}" está fuera del proyecto: no lo toco.`;
  if (PROTEGIDO.test(rel) || EXCL_RE.test(rel))
    return `⛔ "${rel}" no se restaura (.env, datos, dependencias o compilados nunca entran en las copias).`;
  if (existsSync2(abs) && !statSync2(abs).isFile())
    return `⛔ "${rel}" es una carpeta: dime el archivo exacto.`;
  const papelera = () => {
    const d = join3(cwd, ".skill_dey", "papelera", String(Date.now()), rel);
    mkdirSync(dirname(d), { recursive: true });
    copyFileSync(abs, d);
    unlinkSync(abs);
    return `.skill_dey/papelera/…/${rel}`;
  };
  if (!esRepo(cwd) || esCarpetaPeligrosa(raiz(cwd))) {
    for (const t of turnosSinGit(cwd)) {
      const dir = join3(BASE_SIN_GIT(cwd), t), m = leerManifiesto(dir), a = m.archivos.find((x) => x.ruta.replace(/\\/g, "/") === rel);
      if (!a)
        continue;
      try {
        if (a.existia) {
          const src = join3(dir, "archivos", a.ruta);
          if (!existsSync2(src))
            return `⛔ falta la copia de ${rel}; no toqué nada.`;
          mkdirSync(dirname(abs), { recursive: true });
          copyFileSync(src, abs);
        } else if (existsSync2(abs)) {
          const p = papelera();
          m.archivos = m.archivos.filter((x) => x !== a);
          writeFileSync2(join3(dir, "manifiesto.json"), JSON.stringify(m, null, 1));
          return `↩ ${rel} lo había creado el cambio: lo moví a ${p} (no se borró).`;
        }
        m.archivos = m.archivos.filter((x) => x !== a);
        writeFileSync2(join3(dir, "manifiesto.json"), JSON.stringify(m, null, 1));
        return `↩ Solo ${rel} volvió a como estaba (${t}). El resto del proyecto quedó igual.`;
      } catch (e) {
        return `⛔ No pude restaurar ${rel}: ${e.message}. No toqué nada más.`;
      }
    }
    return `No hay copia de ${rel}: skill_dey no lo cambió (o la copia ya se usó).`;
  }
  const c = ctxGit(cwd), p = c.prefijo + rel;
  const fotos = listar(c, "pasos");
  if (!fotos.length)
    return "No hay cambios de SKILL_DEY para deshacer en este proyecto.";
  const blobDe = (commit) => {
    const l = git(c.root, ["ls-tree", "-z", commit, "--", p]).raw.split("\x00")[0];
    const m = l.match(/^\d+ blob ([0-9a-f]+)\t/);
    return m?.[1] ?? "";
  };
  const actual = existsSync2(abs) ? git(c.root, ["hash-object", "--path=" + p, "--", p]).out : "";
  const previa = fotos.find((f) => blobDe(f.commit) !== actual);
  if (!previa)
    return `✅ ${rel} ya está como en todas las copias guardadas: no hay nada que deshacer en él.`;
  const blob = blobDe(previa.commit);
  if (!fotoInterna(cwd, "pasos", "antes-de-deshacer-archivo", `antes de deshacer ${rel}`, false))
    return "⛔ No deshice nada: no pude guardar primero el estado actual. Repite en un momento.";
  try {
    if (!blob) {
      if (existsSync2(abs))
        return `↩ ${rel} no existía antes del cambio: lo moví a ${papelera()} (no se borró). "deshaz" lo devuelve.`;
      return `✅ ${rel} no existe y antes tampoco existía.`;
    }
    const r = spawnSync3("git", [...GITC, "cat-file", "blob", blob], { cwd: c.root, maxBuffer: 500000000, timeout: 60000 });
    if (r.status !== 0 || !r.stdout)
      return `⛔ No pude leer la copia de ${rel}; no toqué nada.`;
    mkdirSync(dirname(abs), { recursive: true });
    writeFileSync2(abs, r.stdout);
  } catch (e) {
    return `⛔ No pude restaurar ${rel}: ${e.message}. No toqué nada más.`;
  }
  return `↩ Solo ${rel} volvió a como estaba antes de ${comillas(previa.nota)} (${new Date(previa.ts).toLocaleString()}). El resto del proyecto quedó igual. Si fue un error: "deshaz".`;
}

// app/skill_dey-lib/memoria_base.ts
import { existsSync as existsSync3, mkdirSync as mkdirSync2, writeFileSync as writeFileSync3, readFileSync as readFileSync4, readdirSync as readdirSync3, statSync as statSync3 } from "node:fs";

// app/skill_dey-lib/rutas.ts
import { join as join4 } from "node:path";
import { homedir as homedir2 } from "node:os";
var ocDir = (...p) => join4(process.env.OPENCODE_CONFIG_DIR || join4(homedir2(), ".config", "opencode"), ...p);

// app/skill_dey-lib/memoria_base.ts
import { join as join5 } from "node:path";
import { homedir as homedir3 } from "node:os";
import { resolve as resolve3 } from "node:path";
var PLANTILLAS = ocDir("skills", "skill-dey", "assets", "plantillas-memoria");
var BASE = {
  "NEGOCIO.md": `# NEGOCIO — qué es la app, usuarios, flujos y reglas (una idea por línea)
Qué es: …
Usuarios y roles: …
Flujos principales: …
Reglas de negocio: …
`,
  "ESTADO.md": `# ESTADO
Estado: EN_CURSO     Iteración: i1

## Stack
back: …
front: …
bd: …
adicionales: …
`,
  "DECISIONES.md": `# DECISIONES (qué se eligió y por qué)
`,
  "LECCIONES.md": `# LECCIONES (✅ repetir · ❌ no repetir) — una línea con [etiquetas]
`,
  "BITACORA.md": `# BITÁCORA
iter | fecha | cambio | commit | resultado
`,
  "APRENDIZAJE.md": `# APRENDIZAJE (qué funcionó y qué falló, por corrida)
`
};
var plantilla = (n) => {
  try {
    return readFileSync4(join5(PLANTILLAS, n), "utf8");
  } catch {
    return BASE[n] ?? `# ${n.replace(".md", "")}
`;
  }
};
function esCarpetaProyecto(cwd) {
  const r = resolve3(cwd);
  if (r === resolve3(homedir3()) || r === resolve3("/") || /^[A-Za-z]:\\?$/.test(r))
    return false;
  if (existsSync3(join5(cwd, ".skill_dey")))
    return true;
  const marcas = [".git", "package.json", "composer.json", "requirements.txt", "pyproject.toml", "pom.xml", "go.mod", "artisan", "src", "app", "index.php", "index.html", "manage.py"];
  return marcas.some((m) => existsSync3(join5(cwd, m)));
}
function asegurarMemoria(cwd) {
  if (!esCarpetaProyecto(cwd))
    return [];
  const dir = join5(cwd, ".skill_dey");
  try {
    mkdirSync2(dir, { recursive: true });
  } catch {
    return [];
  }
  const creados = [];
  for (const f of Object.keys(BASE)) {
    const p = join5(dir, f);
    if (!existsSync3(p)) {
      try {
        writeFileSync3(p, plantilla(f));
        creados.push(f);
      } catch {}
    }
  }
  const idx = join5(dir, "memoria.md");
  if (!existsSync3(idx)) {
    const cont = [
      "# MEMORIA del proyecto — índice (contexto y aprendizaje de skill_dey)",
      "",
      "Carpeta de contexto para que la IA entienda el proyecto sin releer todo. Se crea y mantiene sola. No borrar.",
      "",
      "| Archivo | Para qué |",
      "|---|---|",
      "| NEGOCIO.md | qué es la app, usuarios, flujos, reglas de negocio |",
      "| ESTADO.md | estado, iteración y **stack** (back / front / BD / adicionales) |",
      "| DECISIONES.md | decisiones técnicas y por qué |",
      "| LECCIONES.md | qué repetir y qué no (errores aprendidos) |",
      "| BITACORA.md | historial de cambios por iteración |",
      "| APRENDIZAJE.md | resultados de pruebas y verificaciones |",
      "",
      "> Stack del proyecto → ver ESTADO.md (## Stack).",
      ""
    ].join(`
`);
    try {
      writeFileSync3(idx, cont);
      creados.push("memoria.md");
    } catch {}
  }
  return creados;
}
function registrarCambio(cwd, archivos, pedido = "", resultado = "") {
  if (!archivos.length)
    return;
  const dir = join5(cwd, ".skill_dey");
  if (!existsSync3(dir))
    return;
  const fecha = new Date().toISOString().slice(0, 16).replace("T", " ");
  const lista = archivos.slice(0, 6).join(", ") + (archivos.length > 6 ? ` (+${archivos.length - 6})` : "");
  const bit = join5(dir, "BITACORA.md");
  try {
    let t = existsSync3(bit) ? readFileSync4(bit, "utf8") : `# BITÁCORA
iter | fecha | cambio | commit | resultado
`;
    const ped = pedido ? `"${pedido.replace(/\s+/g, " ").replace(/"/g, "'").slice(0, 110)}" · ` : "";
    if (!t.includes(`${fecha} · ${ped}${lista}`))
      t += `- ${fecha} · ${ped}${lista}${resultado ? " · " + resultado : ""}
`;
    const ls = t.split(`
`);
    if (ls.length > 230) {
      const cab = ls.filter((l) => l.startsWith("#") || l.includes("iter | fecha")).slice(0, 2);
      t = [...cab, ...ls.filter((l) => l.startsWith("- ")).slice(-200)].join(`
`) + `
`;
    }
    writeFileSync3(bit, t);
  } catch {}
  try {
    const est = join5(dir, "ESTADO.md");
    if (existsSync3(est)) {
      let e = readFileSync4(est, "utf8");
      const sello = `Último cambio: ${fecha} (${archivos.length} archivo(s))`;
      e = /^Último cambio:.*$/m.test(e) ? e.replace(/^Último cambio:.*$/m, sello) : e.replace(/^(# ESTADO.*)$/m, `$1
${sello}`);
      writeFileSync3(est, e);
    }
  } catch {}
}
function dondeQuedamos(cwd, n = 6) {
  try {
    return readFileSync4(join5(cwd, ".skill_dey", "BITACORA.md"), "utf8").split(`
`).filter((l) => l.startsWith("- ")).slice(-n).map((l) => l.slice(2));
  } catch {
    return [];
  }
}
function contarArchivos(cwd, limite = 3000) {
  const IG = /^(node_modules|vendor|dist|build|out|\.git|\.skill_dey|coverage|\.next|\.nuxt|__pycache__|venv|\.venv|env|storage|cache|\.cache|tmp|temp|logs?|backups?|respaldos?|dumps?|exports?|export|uploads?|media|imagenes|img|data|datos)$/i;
  let n = 0;
  const walk = (d, prof) => {
    if (n >= limite || prof > 9)
      return;
    let es = [];
    try {
      es = readdirSync3(d);
    } catch {
      return;
    }
    for (const e of es) {
      if (n >= limite)
        return;
      const p = join5(d, e);
      let st;
      try {
        st = statSync3(p);
      } catch {
        continue;
      }
      if (st.isDirectory()) {
        if (!IG.test(e))
          walk(p, prof + 1);
      } else
        n++;
    }
  };
  try {
    walk(cwd, 0);
  } catch {}
  return n;
}

// app/skill_dey-lib/comandos.ts
function intencion(texto) {
  const t = texto.trim().toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[¿?¡!.,"'“”«»`]/g, "").trim();
  if (!t || t.split(/\s+/).length > 12)
    return null;
  if (/^(revisa|revisar|prueba|probar|abre|abrir|lee|leer|mira|mirar|verifica|chequea|conectate|testea|corre)\b/.test(t) && (/\b(en|con|usando|desde) (el |mi )?(chrome|navegador)\b|\bconsola (del navegador|de chrome|de devtools|del browser)\b|\bdevtools\b/.test(t) || /^(revisa|lee|mira|chequea) (la )?consola$/.test(t))) {
    const url = texto.match(/https?:\/\/[^\s"'<>]+/i)?.[0];
    return ["chrome", url, /\bvisible\b|que (yo )?(lo )?vea|ver(lo)? navegando/.test(t) ? "visible" : "", /conecta|mi chrome|chrome abierto|ya abierto/.test(t) ? "conectar" : ""].filter(Boolean).join(" ");
  }
  const da = texto.trim().replace(/[.!¡¿?]+$/, "").match(/^(?:deshaz|deshacer|revierte|revertir|regresa|devuelve|restaura)(?:\s+(?:solo|solamente|únicamente|unicamente))?(?:\s+(?:el|lo|los)\s+(?:cambios?|archivo)(?:\s+(?:de|en|del))?)?(?:\s+(?:lo de|el|la))?\s+[`"']?([\w.\/\\-]+\.[A-Za-z0-9]{1,6})[`"']?(?:\s+(?:como estaba|a como estaba))?$/i);
  if (da)
    return `deshacer ${da[1]}`;
  const vp = t.match(/^(?:vuelve|volver|regresa|regresar|devuelvete|devuelve todo)(?: al?)?(?: (?:punto|paso|cambio))? (\d{1,3})$/);
  if (vp)
    return `deshacer ${vp[1]}`;
  const va = t.match(/^(?:vuelve|volver|regresa|regresar|deja todo)(?: (?:a|todo|el proyecto|la app))?(?: (?:como|a como) estaba)? antes de(?:l| que| lo de| la| el)? (.{3,80})$/);
  if (va)
    return `antes-de ${va[1]}`;
  if (/^(sigue|sigamos|continua|continuemos|seguimos|reanuda|retoma)( (con )?(lo (de antes|de ayer|que (ibamos|estabamos))|lo pendiente|donde (ibamos|quedamos)|la tarea|el trabajo))?$/.test(t))
    return "sigue";
  if (/^(en )?donde (ibamos|quedamos|nos quedamos)$|^(que|en que) (hicimos|ibamos|quedamos|estabamos haciendo)( ayer| antes| la ultima vez)?$|^que (fue lo ultimo|hiciste) (que hicimos|la ultima vez)$/.test(t))
    return "donde";
  const SD = "( (de |en )?(la )?skill ?dey)?";
  const R = [
    [new RegExp(`^(ayuda|comandos)${SD}$|^(que|cuales son los) comandos( tiene| hay)?${SD}$`), "ayuda"],
    [/^que (hace|es) (la )?skill ?dey$|^que hace (la|esta) skill$/, "que-hace"],
    [/^(muestra(me)?|dame|haz(me)?|genera)?\s*(la )?estructura del? (proyecto|codigo)$|^arbol de (archivos|dependencias)( del proyecto)?$|^mapa de (estructura|dependencias)$/, "estructura"],
    [/^(analisis de dependencias|impacto profundo|dependencias ocultas)( del proyecto)?$/, "impacto-profundo"],
    [/^(que|cuales) (lineas|palabras|archivos) (cambiaste|moviste|modificaste)$|^cambios exactos$/, "cambios"],
    [/^(documenta|documentar)( la| el| toda la)? (app|aplicacion|proyecto)$|^(genera|actualiza|haz|crea)( la| el| los)? (documentacion|manual(es)?( de usuario| tecnico)?|diccionario de datos)( de la app| del proyecto)?$/, "documentar"],
    [/^(prepara|genera|haz|arma)( el| la| un| una)? (empalme|paquete de empalme|entrega del (cargo|puesto))$/, "empalme"],
    [/^(cuantos|cuantas) tokens( (me quedan|llevo|he gastado|gaste))?$|^cuanto (he gastado|llevo gastado|me queda)( de tokens)?$|^(consumo|mi consumo|uso) de tokens$/, "consumo"],
    [/^(muestra(me)?|ver|dame|abre)( el)? tablero( de (consumo|tokens))?$/, "tablero"],
    [/^busca(r)? (una )?skill (para|de) .+/, "buscar-skill"],
    [/^(que|cuales) modelos( tengo| hay| gratis| disponibles)?$|^modelos (gratis|disponibles)$/, "modelos"],
    [new RegExp(`^(version|que version|cual version|en que version)( es| esta| tiene)?${SD}$|^skill ?dey version$`), "version"],
    [/^skill ?dey (funciona|esta funcionando)$|^(funciona|prueba) (la )?skill ?dey$/, "prueba"],
    [new RegExp(`^(doctor|diagnostico de instalacion)${SD}$|^(revisa|verifica) (la )?instalacion${SD}$|^(skill ?dey )?esta bien instalad[ao]$`), "doctor"],
    [/^(instala|pon|activa)( el| un)? (git ?hook|pre-?commit)$/, "hook"],
    [new RegExp(`^(reporte|informe) de uso${SD}$|^(reporte|informe) de skill ?dey$|^(resumen|estadisticas) de uso$`), "reporte"],
    [/^(deshaz|deshacer|revierte|revertir|vuelve( a)? como estaba|eso lo dano|regresa como estaba)( (el|lo) ultimo( cambio)?)?$/, "deshacer"],
    [/^(rehaz|rehacer)$/, "rehacer"],
    [new RegExp(`^historial( de cambios)?${SD}$|^que cambios (hiciste|guardaste)$`), "historial"],
    [new RegExp(`^(que|cuales) reglas( tiene| hay)?( (la app|el proyecto))?${SD}$|^(muestra|ver) (las )?(reglas|vacunas)$`), "reglas"],
    [/^(haz|crea|dame)( la| una)? copia de prueba de (la )?(bd|base de datos)$/, "copia-bd"],
    [/^(revisa|revisar|chequea|audita)( la)? seguridad( de la app| del proyecto)?$|^(hay )?huecos de seguridad$/, "seguridad"],
    [/^(prueba|probar|testea)( la)? (app|aplicacion|aplicativo)$/, "probar"],
    [/^(haz(me)?|corre|ejecuta)( las)? pruebas profesionales$|^(suite de pruebas|testeo profesional)$/, "pruebas"],
    [/^(crea|haz|genera|graba)( el| un)? video (de capacitacion|tutorial)( de la app)?$/, "capacitar"],
    [/^(revisa|prueba|analiza)( la)? app (movil|flutter|react native)$/, "movil"],
    [/^(configura|instala|activa) (skill ?dey )?(para )?(todas las ias|multi ?ia|otras ias)$|^(haz que )?(skill ?dey )?(funcione|sirva) (con|en) (todas las|otras) ias$|^reglas para (cursor|copilot|windsurf|gemini|codex|cline)$/, "multi-ia"],
    [/^(haz(me)?|crea|genera|dame) (un |el )?mapa mental( del (plan|proyecto))?$|^mindmap$/, "mapa"],
    [/^(mockup|maqueta) (de |para )?.+/, "mockup"],
    [/^(optimiza|mejora) (mi|este) (prompt|pedido)\b.*/, "prompt"],
    [/^(haz(me)?|dame|arma|armame) (un |el )?plan( de trabajo| de implementacion)? para (implementar|agregar|crear|construir|hacer|desarrollar|integrar|migrar|cambiar|mejorar|refactorizar|arreglar|corregir)\b.+|^solo (el )?plan\b.*|^primero (el|un) plan\b.*/, "plan"],
    [/^(construye|ejecuta|implementa) (el|ese|mi) plan$|^(dale,? )?build$/, "build"],
    [/^(muestra(me)?|abre|ver) (el )?panel de (observabilidad|skill ?dey|consumo)$|^observabilidad$/, "panel"],
    [/^(hitos|checkpoints)$|^lista de (puntos|checkpoints|hitos)$/, "hitos"],
    [/^busca(r)? en (la |mi )?memoria .+|^que recuerdas (de|sobre) .+/, "buscar-memoria"],
    [/^(genera|haz|crea)( las| el)? (notas de version|changelog|novedades de la version)$/, "notas"],
    [new RegExp(`^(que|cuales) (son los )?principios${SD}$|^ver principios$`), "principios"],
    [/^(organiza|ordena)( el| todo el)? (proyecto|codigo|estructura del proyecto)$/, "organizar"],
    [/^(revisa|mide|chequea)( el)? rendimiento( de la app| del sitio)?$|^que tan rapida es la app$/, "rendimiento"],
    [/^(valida|validar)( los| las)? (formularios|campos)$/, "validar"],
    [/^(formatea|formatear)( el)? codigo$/, "formato"],
    [/^((ver|muestra(me)?|revisa) (los )?)?(errores de produccion|logs del servidor)$|^revisa los logs$/, "produccion"]
  ];
  for (const [re, c] of R)
    if (re.test(t))
      return c;
  return null;
}

// app/skill_dey-lib/listar.ts
import { spawnSync as spawnSync4 } from "node:child_process";
import { readdirSync as readdirSync4, statSync as statSync4 } from "node:fs";
import { join as join6, relative as relative3 } from "node:path";
var IGN = /(^|[\\/])(node_modules|vendor|dist|build|\.git|\.skill_dey|coverage|\.venv|venv|__pycache__|\.next|\.nuxt|storage[\\/]framework|bootstrap[\\/]cache)([\\/]|$)|\.min\.(js|css)$|\.bundle\.js$/i;
function listarArchivos(cwd, maxFiles = 20000) {
  const g = spawnSync4("git", ["-c", "core.quotepath=off", "ls-files", "-co", "--exclude-standard", "-z"], { cwd, encoding: "utf8", maxBuffer: 1e8, timeout: 20000 });
  if (g.status === 0 && g.stdout.trim())
    return g.stdout.split("\x00").filter((f) => f && !IGN.test(f)).slice(0, maxFiles);
  const out = [];
  const walk = (d, prof) => {
    if (out.length >= maxFiles || prof > 12)
      return;
    let ents = [];
    try {
      ents = readdirSync4(d);
    } catch {
      return;
    }
    for (const e of ents) {
      if (e.startsWith(".") && e !== ".env.example")
        continue;
      const p = join6(d, e);
      const rel = relative3(cwd, p);
      if (IGN.test(rel) || IGN.test("/" + rel))
        continue;
      let st;
      try {
        st = statSync4(p);
      } catch {
        continue;
      }
      if (st.isDirectory())
        walk(p, prof + 1);
      else if (st.size < 3000000)
        out.push(rel.replace(/\\/g, "/"));
      if (out.length >= maxFiles)
        return;
    }
  };
  walk(cwd, 0);
  return out;
}

// app/skill_dey-lib/documentar.ts
import { spawnSync as spawnSync6 } from "node:child_process";
import { existsSync as existsSync5, readFileSync as readFileSync7, writeFileSync as writeFileSync4, mkdirSync as mkdirSync4, statSync as statSync5 } from "node:fs";
import { join as join9, basename as basename3 } from "node:path";

// app/skill_dey-lib/manual.ts
import { readFileSync as readFileSync5 } from "node:fs";
import { join as join7, basename as basename2 } from "node:path";
var cache = new Map;
var leer = (p) => {
  if (cache.has(p))
    return cache.get(p);
  let t = "";
  try {
    t = readFileSync5(p, "utf8");
  } catch {}
  cache.set(p, t);
  return t;
};
var limpiar = (t) => t.replace(/<\?(php|=)[\s\S]*?\?>/g, " ").replace(/\{[^{}]*\}/g, " ").replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();
var humano = (n) => n.replace(/\[\]$/, "").replace(/[_-]+/g, " ").replace(/([a-z])([A-Z])/g, "$1 $2").replace(/^\w/, (c) => c.toUpperCase());
var attr = (tag, a) => tag.match(new RegExp(`\\b${a}\\s*=\\s*["']([^"']*)["']`, "i"))?.[1];
function tituloPantalla(f, src) {
  const t = limpiar(src.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? "") || limpiar(src.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)?.[1] ?? "") || limpiar(src.match(/<h2[^>]*>([\s\S]*?)<\/h2>/i)?.[1] ?? "");
  return (t && t.length < 80 ? t : "") || humano(basename2(f).replace(/\.(blade\.)?[^.]+$/, ""));
}
function campos(src) {
  const etiquetas = new Map;
  for (const m of src.matchAll(/<label\b([^>]*)>([\s\S]*?)<\/label>/gi)) {
    const id = attr(m[1], "for") ?? attr(m[1], "htmlFor");
    if (id)
      etiquetas.set(id, limpiar(m[2]));
  }
  const out = [], vistos = new Set;
  for (const m of src.matchAll(/<(input|select|textarea)\b([^>]*)>([\s\S]*?<\/select>)?/gi)) {
    const tag = m[2], tipo = m[1].toLowerCase() === "input" ? (attr(tag, "type") ?? "text").toLowerCase() : m[1].toLowerCase();
    if (["hidden", "submit", "button", "reset", "image"].includes(tipo))
      continue;
    const nombre = attr(tag, "name") ?? attr(tag, "id") ?? "";
    if (!nombre || vistos.has(nombre))
      continue;
    vistos.add(nombre);
    const id = attr(tag, "id") ?? "";
    const etiqueta = etiquetas.get(id) || attr(tag, "placeholder") || attr(tag, "aria-label") || humano(nombre);
    const opciones = m[3] ? [...m[3].matchAll(/<option\b[^>]*>([\s\S]*?)<\/option>/gi)].map((o) => limpiar(o[1])).filter(Boolean) : [];
    const T = { text: "texto", email: "correo", password: "contraseña", number: "número", date: "fecha", "datetime-local": "fecha y hora", time: "hora", tel: "teléfono", file: "archivo", checkbox: "casilla", radio: "opción", select: "lista", textarea: "texto largo", search: "búsqueda", url: "enlace", month: "mes", color: "color" };
    out.push({ etiqueta: etiqueta.replace(/[:*]\s*$/, "").trim(), tipo: T[tipo] ?? tipo, obligatorio: /\brequired\b/i.test(tag), opciones: opciones.slice(0, 6).join(", ") + (opciones.length > 6 ? "…" : "") });
  }
  return out.slice(0, 25);
}
function botones(src) {
  const b = [...src.matchAll(/<button\b[^>]*>([\s\S]*?)<\/button>/gi)].map((m) => limpiar(m[1]));
  for (const m of src.matchAll(/<input\b([^>]*type\s*=\s*["'](submit|button)["'][^>]*)>/gi))
    b.push(attr(m[1], "value") ?? "");
  for (const m of src.matchAll(/<a\b([^>]*class\s*=\s*["'][^"']*\bbtn\b[^"']*["'][^>]*)>([\s\S]*?)<\/a>/gi))
    b.push(limpiar(m[2]));
  return [...new Set(b.map((x) => x.trim()).filter((x) => x && x.length < 40 && !/^[×✕x]$/i.test(x)))].slice(0, 12);
}
function mensajes(src) {
  const m = new Set;
  for (const x of src.matchAll(/(?:alert|confirm|toast(?:r)?\.\w+|Swal\.fire|mostrarMensaje|notify)\s*\(\s*(?:\{[^}]*?(?:title|text)\s*:\s*)?["'`]([^"'`$]{4,120})["'`]/g))
    m.add(x[1]);
  for (const x of src.matchAll(/["']([^"'\n]{6,120}(?:correctamente|exitosamente|con éxito|no se (?:encontr|pud)|inválid|obligatori|requerid|no tiene permiso|incorrect|ya existe|debe )[^"'\n]{0,80})["']/gi))
    m.add(x[1]);
  for (const x of src.matchAll(/class\s*=\s*["'][^"']*\balert\b[^"']*["'][^>]*>([^<]{6,140})</gi))
    m.add(limpiar(x[1]));
  return [...m].map((s) => s.trim()).filter((s) => !/[{}<>;=]|\$\w/.test(s)).slice(0, 8);
}
function columnas(src) {
  return [...new Set([...src.matchAll(/<th\b[^>]*>([\s\S]*?)<\/th>/gi)].map((m) => limpiar(m[1])).filter((x) => x && x.length < 40))].slice(0, 15);
}
function fichaPantalla(cwd, f, todas) {
  const src = leer(join7(cwd, f)), titulo = tituloPantalla(f, src);
  const C = campos(src), B = botones(src), M = mensajes(src), TH = columnas(src);
  const login = (C.some((c) => c.tipo === "contraseña") || /<form/i.test(src)) && /login|ingres|iniciar sesi|acceso|signin/i.test(basename2(f) + " " + titulo);
  const graficos = /new Chart\(|chart\.js|apexcharts|echarts|highcharts|recharts|<canvas/i.test(src);
  const exporta = [/xlsx|excel|phpspreadsheet|\.csv/i.test(src) && "Excel/CSV", /pdf|dompdf|tcpdf|fpdf|jspdf|window\.print/i.test(src) && "PDF/impresión"].filter(Boolean);
  const elimina = /eliminar|borrar|delete/i.test(B.join(" ") + src.slice(0, 50000));
  const sesion = /\$_SESSION\[|session_start\(|Auth::|middleware\(['"]auth|useAuth|requireAuth|isAuthenticated/.test(src);
  const rol = src.match(/\$_SESSION\[['"](rol|role|perfil|tipo_usuario)['"]\]\s*[!=]==?\s*['"]([^'"]+)['"]/i)?.[2];
  const nombreArchivo = basename2(f);
  const desde = todas.filter((o) => o !== f).map((o) => ({ o, s: leer(join7(cwd, o)) })).filter(({ s }) => new RegExp(`href\\s*=\\s*["'][^"']*${nombreArchivo.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`, "i").test(s) || new RegExp(`to\\s*=\\s*["']/${nombreArchivo.replace(/\.[^.]+$/, "")}["']`).test(s)).map(({ o, s }) => {
    const a = s.match(new RegExp(`<a\\b[^>]*href\\s*=\\s*["'][^"']*${nombreArchivo.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}[^>]*>([\\s\\S]*?)<\\/a>`, "i"));
    return `${tituloPantalla(o, s)}${a && limpiar(a[1]) ? ` → "${limpiar(a[1])}"` : ""}`;
  }).slice(0, 5);
  const proposito = login ? "Ingresar a la aplicación con usuario y contraseña." : C.length && TH.length ? `Registrar y consultar ${titulo.toLowerCase()}.` : C.length ? `Registrar o modificar ${titulo.toLowerCase()} mediante un formulario.` : graficos ? `Consultar los indicadores y gráficas de ${titulo.toLowerCase()}.` : TH.length ? `Consultar el listado de ${titulo.toLowerCase()}.` : `Ver ${titulo.toLowerCase()}.`;
  const obligatorios = C.filter((c) => c.obligatorio).map((c) => c.etiqueta);
  const accion = B.find((b) => /guardar|registrar|enviar|crear|ingresar|entrar|aceptar|buscar|filtrar|consultar|actualizar/i.test(b)) ?? B[0];
  const pasos = [
    `Abre **${titulo}**${desde.length ? ` desde ${desde[0].split(" → ")[0]}${desde[0].includes("→") ? ` (enlace ${desde[0].split(" → ")[1]})` : ""}` : ""}.`,
    C.length ? `Completa los campos${obligatorios.length ? `; son obligatorios: ${obligatorios.join(", ")}` : ""}.` : TH.length ? "Revisa la información en la tabla." : graficos ? "Revisa las gráficas e indicadores." : "",
    accion ? `Pulsa **${accion}**.` : "",
    exporta.length ? `Para descargar la información usa la opción de exportar (${exporta.join(", ")}).` : ""
  ].filter(Boolean);
  const L = [`**Para qué sirve:** ${proposito}`];
  L.push(`**Dónde está:** \`${f.replace(/\\/g, "/")}\`${desde.length ? ` · se llega desde: ${desde.join(" · ")}` : ""}`);
  if (sesion || login)
    L.push(`**Acceso:** ${login ? "pantalla pública de ingreso" : `requiere iniciar sesión${rol ? ` (rol: ${rol})` : ""}`}`);
  if (TH.length || graficos)
    L.push(`**Qué muestra:** ${[TH.length && `tabla con ${TH.join(", ")}`, graficos && "gráficas"].filter(Boolean).join(" · ")}`);
  if (C.length)
    L.push("", "| Campo | Tipo | Obligatorio | Opciones |", "|---|---|---|---|", ...C.map((c) => `| ${c.etiqueta} | ${c.tipo} | ${c.obligatorio ? "Sí" : "No"} | ${c.opciones} |`), "");
  if (B.length)
    L.push(`**Botones:** ${B.join(" · ")}${elimina ? " (eliminar no se puede deshacer: confirma antes)" : ""}`);
  if (pasos.length)
    L.push("**Pasos:**", ...pasos.map((p, i) => `${i + 1}. ${p}`));
  if (M.length)
    L.push(`**Mensajes que puede mostrar:** ${M.map((m) => `"${m}"`).join(" · ")}`);
  return { titulo, cuerpo: L.join(`
`) };
}
function manualUsuario(cwd, vistas, doc) {
  cache.clear();
  let fichas = 0;
  vistas = vistas.filter((v) => /<(html|body|form|table|div|main|section|h1|h2|template)\b|echo\s|print\s|<\?=|return\s*\(?\s*</i.test(leer(join7(cwd, v))));
  for (const v of vistas) {
    const id = v.replace(/\\/g, "/"), { titulo, cuerpo } = fichaPantalla(cwd, v, vistas);
    const bloque = `<!-- AUTO:pantalla:${id} (generado por skill_dey desde el código; lo de abajo de este bloque es tuyo) -->
${cuerpo}
<!-- /AUTO:pantalla:${id} -->`;
    const re = new RegExp(`<!-- AUTO:pantalla:${id.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")} [\\s\\S]*?<!-- /AUTO:pantalla:${id.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")} -->`);
    if (re.test(doc))
      doc = doc.replace(re, () => bloque);
    else if (doc.includes(`<!-- PANTALLA:${id} -->`))
      doc = doc.replace(new RegExp(`(<!-- PANTALLA:${id.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")} -->\\n## [^\\n]*\\n)(_\\(pendiente:[^\\n]*\\n)?`), (_m, a) => `${a}${bloque}
`);
    else
      doc += `
<!-- PANTALLA:${id} -->
## ${titulo}
${bloque}
`;
    fichas++;
  }
  doc = doc.replace(/\n?<!-- PANTALLA:[^>]+ -->\n## [^\n]*\n_\(pendiente:[^\n]*\)_\n?/g, `
`);
  return { doc, fichas };
}

// app/skill_dey-lib/bd.ts
import { spawnSync as spawnSync5 } from "node:child_process";
import { readFileSync as readFileSync6, copyFileSync as copyFileSync2, existsSync as existsSync4, mkdirSync as mkdirSync3 } from "node:fs";
import { join as join8, isAbsolute as isAbsolute4 } from "node:path";
var leer2 = (p) => {
  try {
    return readFileSync6(p, "utf8");
  } catch {
    return "";
  }
};
function conexion(cwd) {
  const env = leer2(join8(cwd, ".env"));
  if (!env)
    return null;
  const v = (...ks) => {
    for (const k of ks) {
      const m = env.match(new RegExp(`^\\s*${k}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\r\\n#]*))`, "m"));
      const x = (m?.[1] ?? m?.[2] ?? m?.[3] ?? "").trim();
      if (x)
        return x;
    }
    return "";
  };
  let tipo = v("DB_CONNECTION", "DB_DRIVER", "DB_TYPE", "DB_ENGINE").toLowerCase();
  let host = v("DB_HOST", "DB_SERVER", "MYSQL_HOST", "PGHOST") || "127.0.0.1", port = v("DB_PORT", "MYSQL_PORT", "PGPORT");
  let db = v("DB_DATABASE", "DB_NAME", "MYSQL_DATABASE", "PGDATABASE"), user = v("DB_USERNAME", "DB_USER", "MYSQL_USER", "PGUSER"), pass = v("DB_PASSWORD", "DB_PASS", "MYSQL_PASSWORD", "PGPASSWORD");
  const url = v("DATABASE_URL").match(/^(\w+):\/\/(?:([^:@/]+)(?::([^@/]*))?@)?([^:/?]+)?(?::(\d+))?\/([^?]+)/);
  if (url) {
    tipo = tipo || url[1];
    user = user || decodeURIComponent(url[2] ?? "");
    pass = pass || decodeURIComponent(url[3] ?? "");
    host = url[4] ?? host;
    port = port || (url[5] ?? "");
    db = db || url[6];
  }
  if (!db)
    return null;
  const motor = /sqlite/.test(tipo) || /\.(sqlite3?|db)$/i.test(db) ? "sqlite" : /pg|postgres/.test(tipo) ? "pg" : "mysql";
  return { motor, host, port, db: motor === "sqlite" && !isAbsolute4(db) ? join8(cwd, db) : db, user, pass };
}
function correr(c, cmd, sql = "", otraBd) {
  const db = otraBd ?? c.db;
  const r = c.motor === "sqlite" ? spawnSync5("sqlite3", cmd === "dump" ? ["-readonly", db, ".schema"] : ["-readonly", "-noheader", db, sql], { encoding: "utf8", timeout: 25000 }) : c.motor === "pg" ? spawnSync5(cmd === "dump" ? "pg_dump" : "psql", cmd === "dump" ? ["--schema-only", "--no-owner", "--no-privileges", "-h", c.host, ...c.port ? ["-p", c.port] : [], ...c.user ? ["-U", c.user] : [], db] : ["-tA", "-h", c.host, ...c.port ? ["-p", c.port] : [], ...c.user ? ["-U", c.user] : [], "-d", db, "-c", sql], { encoding: "utf8", timeout: 25000, env: { ...process.env, PGPASSWORD: c.pass, PGOPTIONS: "-c default_transaction_read_only=on" } }) : spawnSync5(cmd === "dump" ? "mysqldump" : "mysql", cmd === "dump" ? ["--no-data", "--skip-comments", "--skip-add-drop-table", "--skip-lock-tables", "-h", c.host, ...c.port ? ["-P", c.port] : [], ...c.user ? ["-u", c.user] : [], db] : ["-N", "-B", "-h", c.host, ...c.port ? ["-P", c.port] : [], ...c.user ? ["-u", c.user] : [], db, "-e", `START TRANSACTION READ ONLY; ${sql}; ROLLBACK;`], { encoding: "utf8", timeout: 25000, env: { ...process.env, MYSQL_PWD: c.pass } });
  return { ok: r.status === 0, out: `${r.stdout ?? ""}`.trim() || `${r.stderr ?? r.error?.message ?? ""}`.trim() };
}
function volcarEsquema(cwd) {
  const c = conexion(cwd);
  if (!c)
    return { sql: "", motor: "" };
  const r = correr(c, "dump");
  return { sql: r.ok ? r.out : "", motor: { mysql: "MySQL/MariaDB", pg: "PostgreSQL", sqlite: "SQLite" }[c.motor] };
}

// app/skill_dey-lib/documentar.ts
var IGN2 = /(^|[\\/])(node_modules|vendor|dist|build|\.git|\.skill_dey|coverage|\.venv|venv|__pycache__)([\\/]|$)/;
var archivos = (cwd) => listarArchivos(cwd, 8000).filter((f) => !IGN2.test(f));
var leer3 = (p) => {
  try {
    return readFileSync7(p, "utf8");
  } catch {
    return "";
  }
};
function desdeSQL(txt, origen) {
  const t = [];
  for (const m of txt.matchAll(/create\s+table\s+(?:if\s+not\s+exists\s+)?[`"[]?(\w+)[`"\]]?\s*\(([\s\S]*?)\)\s*(?:engine|comment|;|with|\n\s*\n)/gi)) {
    const cols = [];
    for (let l of m[2].split(/,\s*\n|,(?![^(]*\))/)) {
      l = l.trim();
      if (!l)
        continue;
      const pk = l.match(/^primary\s+key\s*\(([^)]+)\)/i);
      if (pk) {
        pk[1].split(",").forEach((c) => {
          const x = cols.find((k) => k.nombre === c.replace(/[`"\s]/g, ""));
          if (x)
            x.clave = "PK";
        });
        continue;
      }
      const fk = l.match(/foreign\s+key\s*\(([^)]+)\)\s*references\s+[`"]?(\w+)[`"]?\s*\(([^)]+)\)/i);
      if (fk) {
        const x = cols.find((k) => k.nombre === fk[1].replace(/[`"\s]/g, ""));
        if (x)
          x.clave = `FK → ${fk[2]}.${fk[3].replace(/[`"\s]/g, "")}`;
        continue;
      }
      if (/^(unique|key|index|constraint|check)\b/i.test(l))
        continue;
      const c = l.match(/^[`"[]?(\w+)[`"\]]?\s+([\w]+(?:\s*\([^)]*\))?(?:\s+unsigned)?)(.*)$/i);
      if (!c)
        continue;
      const resto = c[3];
      cols.push({
        nombre: c[1],
        tipo: c[2].toUpperCase(),
        nulo: !/not\s+null|primary\s+key/i.test(resto),
        defecto: resto.match(/default\s+('[^']*'|[\w.()]+)/i)?.[1],
        clave: /primary\s+key/i.test(resto) ? "PK" : resto.match(/references\s+[`"]?(\w+)[`"]?\s*\(\s*[`"]?(\w+)/i) ? `FK → ${RegExp.$1}.${RegExp.$2}` : /unique/i.test(resto) ? "UNIQUE" : undefined,
        comentario: resto.match(/comment\s+'([^']*)'/i)?.[1]
      });
    }
    t.push({ nombre: m[1], columnas: cols, origen });
  }
  return t;
}
function desdePrisma(txt, origen) {
  return [...txt.matchAll(/model\s+(\w+)\s*\{([\s\S]*?)\n\}/g)].map((m) => ({ nombre: m[1], origen, columnas: m[2].split(`
`).map((l) => l.trim()).filter((l) => /^\w+\s+\w/.test(l) && !l.startsWith("@@")).map((l) => {
    const [n, t, ...r] = l.split(/\s+/);
    const resto = r.join(" ");
    return { nombre: n, tipo: t.replace("?", ""), nulo: t.endsWith("?"), defecto: resto.match(/@default\(([^)]*\)?)\)/)?.[1], clave: /@id/.test(resto) ? "PK" : /@relation/.test(resto) ? "relación" : /@unique/.test(resto) ? "UNIQUE" : undefined, comentario: l.match(/\/\/\/?\s*(.*)$/)?.[1] };
  }).filter((c) => /^[A-Z]|^(String|Int|Float|Boolean|DateTime|Decimal|Json|BigInt|Bytes)/.test(c.tipo)) }));
}
var TIPO_LARAVEL = { string: "VARCHAR(255)", text: "TEXT", longtext: "LONGTEXT", integer: "INT", biginteger: "BIGINT", unsignedbiginteger: "BIGINT", foreignid: "BIGINT", smallinteger: "SMALLINT", tinyinteger: "TINYINT", boolean: "BOOLEAN", date: "DATE", datetime: "DATETIME", timestamp: "TIMESTAMP", time: "TIME", float: "FLOAT", double: "DOUBLE", decimal: "DECIMAL(12,2)", json: "JSON", uuid: "CHAR(36)", enum: "VARCHAR(50)", char: "CHAR(1)" };
function desdeLaravel(txt, origen) {
  return [...txt.matchAll(/Schema::create\(\s*['"](\w+)['"][\s\S]*?\{([\s\S]*?)\n\s*\}\);/g)].map((m) => {
    const cols = [];
    for (const c of m[2].matchAll(/\$table->(\w+)\(\s*(?:['"](\w+)['"])?\s*(?:,\s*([^)]*))?\)([^;]*);/g)) {
      const [linea, tipo, nombre, args, cadena] = c;
      const t = tipo.toLowerCase();
      if (t === "id" || t === "increments" || t === "bigincrements") {
        cols.push({ nombre: nombre ?? "id", tipo: "BIGINT", nulo: false, clave: "PK" });
        continue;
      }
      if (t === "timestamps") {
        cols.push({ nombre: "created_at", tipo: "TIMESTAMP", nulo: true }, { nombre: "updated_at", tipo: "TIMESTAMP", nulo: true });
        continue;
      }
      if (t === "softdeletes") {
        cols.push({ nombre: "deleted_at", tipo: "TIMESTAMP", nulo: true });
        continue;
      }
      if (!nombre)
        continue;
      let sql = TIPO_LARAVEL[t] ?? t.toUpperCase();
      if (args && /^(string|char)$/.test(t))
        sql = `${t === "char" ? "CHAR" : "VARCHAR"}(${args.split(",")[0].trim()})`;
      if (args && /^(decimal|double|float)$/.test(t))
        sql = `DECIMAL(${args.replace(/\s/g, "")})`;
      const fk = /foreignId|constrained/.test(linea) ? `FK → ${cadena.match(/constrained\(\s*['"](\w+)/)?.[1] ?? nombre.replace(/_id$/, "") + "s"}.id` : /->unique\(/.test(cadena) ? "UNIQUE" : undefined;
      cols.push({ nombre, tipo: sql, nulo: /->nullable\(/.test(cadena), defecto: cadena.match(/->default\(([^)]*)\)/)?.[1], clave: fk, comentario: cadena.match(/->comment\(['"]([^'"]*)/)?.[1] });
    }
    return { nombre: m[1], origen, columnas: cols };
  });
}
function desdeBdViva(cwd) {
  const { sql, motor } = volcarEsquema(cwd);
  const db = (conexion(cwd)?.db ?? "").split(/[\\/]/).pop();
  const tablas = sql ? desdeSQL(sql, `BD en vivo: ${db}`) : [];
  return tablas.length ? { tablas, motor } : null;
}
function esquema(cwd) {
  const fs = archivos(cwd);
  const sqlArchivos = fs.filter((f) => f.endsWith(".sql") && !/database[\\/]instalacion(\.skill_dey)?\.sql$/.test(f) && (() => {
    try {
      return statSync5(join9(cwd, f)).size < 1e6;
    } catch {
      return false;
    }
  })()).sort();
  let tablas = [];
  for (const f of sqlArchivos)
    tablas.push(...desdeSQL(leer3(join9(cwd, f)), f));
  for (const f of fs.filter((f) => f.endsWith("schema.prisma")))
    tablas.push(...desdePrisma(leer3(join9(cwd, f)), f));
  for (const f of fs.filter((f) => /migrations?[\\/].*\.php$/.test(f)).sort())
    tablas.push(...desdeLaravel(leer3(join9(cwd, f)), f));
  let motorVivo = "";
  if (!tablas.length) {
    const v = desdeBdViva(cwd);
    if (v) {
      tablas = v.tablas;
      motorVivo = v.motor;
    }
  }
  const vistas = new Map;
  for (const t of tablas)
    vistas.set(t.nombre.toLowerCase(), t);
  const env = leer3(join9(cwd, ".env.example")) + leer3(join9(cwd, "prisma", "schema.prisma"));
  const motor = motorVivo || (/postgres/i.test(env) ? "PostgreSQL" : /mysql|mariadb/i.test(env) ? "MySQL/MariaDB" : /sqlite/i.test(env) ? "SQLite" : /sqlserver|mssql/i.test(env) ? "SQL Server" : "SQL estándar");
  return { tablas: [...vistas.values()], sqlArchivos, motor };
}
function conAuto(ruta, titulo, secciones, manualInicial = "") {
  let doc = existsSync5(ruta) ? readFileSync7(ruta, "utf8") : `# ${titulo}

${manualInicial}`;
  for (const [id, cuerpo] of Object.entries(secciones)) {
    const bloque = `<!-- AUTO:${id} (generado por skill_dey; no editar dentro) -->
${cuerpo.trim()}
<!-- /AUTO:${id} -->`;
    const re = new RegExp(`<!-- AUTO:${id} [\\s\\S]*?<!-- /AUTO:${id} -->`);
    doc = re.test(doc) ? doc.replace(re, () => bloque) : doc.trimEnd() + `

` + bloque + `
`;
  }
  mkdirSync4(join9(ruta, ".."), { recursive: true });
  writeFileSync4(ruta, doc);
}
function documentar(cwd) {
  const fs = archivos(cwd), hecho = [];
  const pkg = (() => {
    try {
      return JSON.parse(leer3(join9(cwd, "package.json")));
    } catch {
      return null;
    }
  })();
  const comp = (() => {
    try {
      return JSON.parse(leer3(join9(cwd, "composer.json")));
    } catch {
      return null;
    }
  })();
  const nombreApp = pkg?.name ?? comp?.name ?? basename3(cwd);
  const fecha = new Date().toISOString().slice(0, 10);
  const { tablas, sqlArchivos, motor } = esquema(cwd);
  if (tablas.length) {
    const dic = tablas.map((t) => [
      `### ${t.nombre}`,
      `Origen: \`${t.origen}\``,
      "",
      "| Campo | Tipo | Nulo | Por defecto | Clave | Descripción |",
      "|---|---|---|---|---|---|",
      ...t.columnas.map((c) => `| ${c.nombre} | ${c.tipo} | ${c.nulo ? "Sí" : "No"} | ${c.defecto ?? ""} | ${c.clave ?? ""} | ${c.comentario ?? ""} |`),
      ""
    ].join(`
`)).join(`
`);
    conAuto(join9(cwd, "docs", "DICCIONARIO-DATOS.md"), `Diccionario de datos — ${nombreApp}`, { resumen: `Motor: ${motor} · Tablas: ${tablas.length} · Actualizado: ${fecha}`, tablas: dic }, `Descripción funcional de las tablas (escríbela aquí; lo de abajo se actualiza solo):
`);
    hecho.push(`docs/DICCIONARIO-DATOS.md (${tablas.length} tablas)`);
    let script = "";
    const prisma = fs.find((f) => f.endsWith("schema.prisma"));
    if (prisma && existsSync5(join9(cwd, "node_modules", ".bin", process.platform === "win32" ? "prisma.cmd" : "prisma"))) {
      const r = spawnSync6("npx", ["--no-install", "prisma", "migrate", "diff", "--from-empty", "--to-schema-datamodel", prisma, "--script"], { cwd, encoding: "utf8", shell: process.platform === "win32", timeout: 120000 });
      if (r.status === 0)
        script = r.stdout;
    }
    const ddl = (ts) => ts.map((t) => `CREATE TABLE IF NOT EXISTS ${t.nombre} (
${t.columnas.map((c) => `  ${c.nombre} ${c.tipo}${c.nulo ? "" : " NOT NULL"}${c.defecto ? " DEFAULT " + c.defecto : ""}${c.clave === "PK" ? " PRIMARY KEY" : c.clave === "UNIQUE" ? " UNIQUE" : ""}`).concat(t.columnas.filter((c) => c.clave?.startsWith("FK → ")).map((c) => `  FOREIGN KEY (${c.nombre}) REFERENCES ${c.clave.slice(5).replace(".", "(")})`)).join(`,
`)}
);`).join(`

`);
    if (!script) {
      const soloDDL = (t) => t.split(/;\s*(?:\r?\n|$)/).map((x) => x.trim()).filter((x) => /^(--[^\n]*\n\s*)*(create|alter|comment\s+on)\b/i.test(x)).map((x) => x + ";").join(`

`);
      const deSQL = sqlArchivos.map((f) => {
        const d = soloDDL(leer3(join9(cwd, f)));
        return d ? `-- ===== ${f} (solo estructura) =====
${d}
` : "";
      }).filter(Boolean).join(`
`);
      const otras = tablas.filter((t) => !t.origen.endsWith(".sql"));
      script = [deSQL, otras.length ? `-- ===== Tablas definidas en migraciones/modelos (convertidas a SQL) =====
${ddl(otras)}` : ""].filter(Boolean).join(`
`);
    }
    if (!script)
      script = tablas.map((t) => `CREATE TABLE IF NOT EXISTS ${t.nombre} (
${t.columnas.filter((c) => !c.nombre.includes("/")).map((c) => `  ${c.nombre} ${c.tipo.replace(/^STRING$/, "VARCHAR(255)").replace(/^INTEGER$/, "INTEGER")}${c.nulo ? "" : " NOT NULL"}${c.defecto ? " DEFAULT " + c.defecto : ""}${c.clave === "PK" ? " PRIMARY KEY" : ""}`).join(`,
`)}
);`).join(`

`);
    mkdirSync4(join9(cwd, "database"), { recursive: true });
    const destinoSql = (() => {
      const f = join9(cwd, "database", "instalacion.sql");
      return !existsSync5(f) || /Generado por skill_dey/.test(leer3(f).slice(0, 400)) ? f : join9(cwd, "database", "instalacion.skill_dey.sql");
    })();
    writeFileSync4(destinoSql, `-- Script de instalación de la base de datos — ${nombreApp}
-- Motor: ${motor} · Generado por skill_dey el ${fecha} a partir de: ${[...new Set(tablas.map((t) => t.origen))].join(", ")}
-- Uso: crear la BD vacía y ejecutar este archivo. Revisar tipos si se cambia de motor.

${script.trim()}
`);
    hecho.push("database/" + destinoSql.split(/[\\/]/).pop());
  }
  const ex = leer3(join9(cwd, ".env.example")).split(/\r?\n/).filter((l) => /^\s*[A-Z_][A-Z0-9_]*\s*=/.test(l)).map((l) => {
    const [k, ...r] = l.split("=");
    const coment = r.join("=").split("#").slice(1).join("#").trim();
    return `| ${k.trim()} | ${coment} |`;
  });
  const scripts = [...Object.entries(pkg?.scripts ?? {}).map(([k, v]) => `| npm run ${k} | ${v} |`), ...Object.entries(comp?.scripts ?? {}).map(([k, v]) => `| composer ${k} | ${Array.isArray(v) ? v.join(" && ") : v} |`)];
  const stack = [pkg && "Node.js", comp && "PHP (Composer)", fs.some((f) => f.endsWith(".php")) && !comp && "PHP", fs.some((f) => f.endsWith(".py")) && "Python", fs.some((f) => /\.(tsx?|jsx)$/.test(f)) && "TypeScript/JSX", pkg?.dependencies?.react && "React", pkg?.dependencies?.vue && "Vue", pkg?.dependencies?.express && "Express", comp?.require?.["laravel/framework"] && "Laravel"].filter(Boolean).join(" · ");
  const rutas = [];
  for (const f of fs.filter((f) => /\.(m?[jt]s|php|py)$/.test(f)).slice(0, 800)) {
    const t = leer3(join9(cwd, f));
    for (const m of t.matchAll(/(?:app|router|Route)(?:\.|::)(get|post|put|patch|delete)\s*\(\s*['"]([^'"]+)['"]/gi))
      rutas.push(`| ${m[1].toUpperCase()} | ${m[2]} | ${f} |`);
    for (const m of t.matchAll(/@(?:app|bp|router)\.(get|post|put|delete|route)\(\s*['"]([^'"]+)['"]/g))
      rutas.push(`| ${m[1].toUpperCase()} | ${m[2]} | ${f} |`);
  }
  const paginas = fs.filter((f) => f.endsWith(".php") && !/vendor|config|includes?|lib|src[\\/]|app[\\/]|clases?|models?|controllers?|migrations?|tests?/i.test(f));
  const carpetas = [...new Set(fs.map((f) => f.split(/[\\/]/)[0]).filter((d) => !d.includes(".")))].slice(0, 25);
  const deps = Object.keys({ ...pkg?.dependencies ?? {}, ...comp?.require ?? {} }).slice(0, 40);
  conAuto(join9(cwd, "docs", "MANUAL-TECNICO.md"), `Manual técnico — ${nombreApp}`, {
    general: `Stack detectado: ${stack || "—"} · Base de datos: ${tablas.length ? motor + ` (${tablas.length} tablas, ver DICCIONARIO-DATOS.md)` : "—"} · Actualizado: ${fecha}`,
    instalacion: ["1. Clonar/copiar el proyecto.", pkg ? "2. `npm install`" : comp ? "2. `composer install`" : "2. Instalar dependencias del stack.", "3. Copiar `.env.example` a `.env` y completar los valores.", tablas.length ? "4. Crear la base de datos y ejecutar `database/instalacion.sql` (o las migraciones)." : "", "5. Iniciar con el comando de la tabla Comandos."].filter(Boolean).join(`
`),
    variables: ex.length ? ["| Variable | Descripción |", "|---|---|", ...ex].join(`
`) : "Sin `.env.example`.",
    comandos: scripts.length ? ["| Comando | Ejecuta |", "|---|---|", ...scripts].join(`
`) : "—",
    estructura: carpetas.map((d) => `- \`${d}/\` (${fs.filter((f) => f.startsWith(d + "/") || f.startsWith(d + "\\")).length} archivos)`).join(`
`) || "—",
    rutas: rutas.length ? ["| Método | Ruta | Archivo |", "|---|---|---|", ...[...new Set(rutas)].slice(0, 150)].join(`
`) : paginas.length ? ["| Página | Archivo |", "|---|---|", ...paginas.slice(0, 150).map((p) => `| /${p.replace(/\\/g, "/")} | ${p} |`)].join(`
`) : "—",
    dependencias: deps.length ? deps.map((d) => `\`${d}\``).join(" · ") : "—"
  }, `## Arquitectura y decisiones
(El agente completa esta parte en cambios N2/N3; lo marcado AUTO se regenera solo.)
`);
  hecho.push("docs/MANUAL-TECNICO.md");
  const vistas = [...paginas, ...fs.filter((f) => /(pages|views|screens)[\\/].*\.(vue|svelte|[jt]sx|html|blade\.php)$/.test(f))].slice(0, 80);
  const mu = join9(cwd, "docs", "MANUAL-USUARIO.md");
  let doc = existsSync5(mu) ? readFileSync7(mu, "utf8") : `# Manual de usuario — ${nombreApp}

Cómo usar la aplicación, pantalla por pantalla.
`;
  const r = manualUsuario(cwd, vistas, doc);
  mkdirSync4(join9(cwd, "docs"), { recursive: true });
  writeFileSync4(mu, r.doc);
  hecho.push(`docs/MANUAL-USUARIO.md (${r.fichas} pantallas documentadas)`);
  return `Documentación actualizada: ${hecho.join(" · ")}`;
}

// app/skill_dey-lib/hook.ts
var VERSION = "41.0.0";
var CFG = () => process.env.SKILL_DEY_CONFIG_DIR || join10(homedir4(), ".config", "skill_dey");
var log = (t) => {
  try {
    mkdirSync5(CFG(), { recursive: true });
    appendFileSync2(join10(CFG(), "errores-hook.log"), `${new Date().toISOString()} ${t}
`);
  } catch {}
};
var activo = () => {
  try {
    return JSON.parse(readFileSync8(join10(CFG(), "ACTIVO.json"), "utf8")).activo !== false;
  } catch {
    return true;
  }
};
var fijarActivo = (v) => {
  try {
    mkdirSync5(CFG(), { recursive: true });
    writeFileSync5(join10(CFG(), "ACTIVO.json"), JSON.stringify({ activo: v, desde: new Date().toISOString() }));
  } catch {}
};
var nuevo = (sid) => ({ sid, turno: new Date().toISOString().replace(/[:.]/g, "-"), inicioPedido: Date.now(), foto: false, commitBase: "", baseVerde: false, ultimaEdicion: 0, editados: [], firmas: {}, ediciones: 0, evaluaciones: 0, enRojo: false, accionesEnRojo: 0, prompt: "", nombrados: [], existentes: [], amplio: false, entendido: false, avisoEntendi: false, autoIntentos: 0, pidioVerificar: false, avisos: [], sesionVista: false });
var archivoEstado = (cwd, host) => join10(cwd, ".skill_dey", `.sesion-${host}.json`);
function cargar(cwd, host, sid) {
  try {
    const e = JSON.parse(readFileSync8(archivoEstado(cwd, host), "utf8"));
    if (!sid || e.sid === sid)
      return { ...nuevo(sid), ...e };
  } catch {}
  return nuevo(sid);
}
function guardar(cwd, host, e) {
  try {
    mkdirSync5(join10(cwd, ".skill_dey"), { recursive: true });
    writeFileSync5(archivoEstado(cwd, host), JSON.stringify(e));
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
  const c = primero(ev, ["cwd", "workspace", "workspacePath", "workspace_path", "workspaceRoot", "workspace_root", "workspaceRoots.0", "workspace_roots.0", "project_dir", "projectDir"]) ?? process.env.CLAUDE_PROJECT_DIR ?? process.env.GEMINI_PROJECT_DIR;
  const dir = typeof c === "string" ? c.replace(/^file:\/\//, "") : "";
  if (!dir)
    return null;
  if (existsSync6(join10(dir, "plugin.json")) && existsSync6(join10(dir, "scripts", "skill_dey-hook.mjs")))
    return null;
  if (resolve4(dir) === resolve4(homedir4()) || resolve4(dir) === resolve4("/") || /^[A-Za-z]:\\?$/.test(dir))
    return null;
  return dir;
}
var ES_COMANDO = /(^|_|\b)(bash|shell|run_command|run_shell_command|terminal|exec|powershell|pwsh)($|_|\b)/i;
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
function textos(a, claves) {
  const partes = [];
  const tomar = (o) => {
    if (!o || typeof o !== "object")
      return;
    for (const [k, v] of Object.entries(o)) {
      if (typeof v === "string" && claves.test(k))
        partes.push(v);
      else if (Array.isArray(v))
        v.forEach(tomar);
    }
  };
  tomar(a);
  return partes.join(`
`);
}
var NUEVO = /^(content|new_?string|newString|code_?content|CodeContent|replacement(_?content)?|ReplacementContent|new_text|new_source)$/i;
var VIEJO = /^(old_?string|oldString|TargetContent|target_?content|old_text)$/i;
function normalizar(herramienta, args) {
  const h = String(herramienta ?? ""), a = args ?? {};
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
  const reescribe = tipo === "editar" && /^(write|write_file|write_to_file|create_file)$/i.test(h);
  return { tipo, herramienta: h, archivos: archivo ? [archivo] : [], texto: tipo === "editar" ? textos(a, NUEVO) : "", quita: tipo === "editar" ? textos(a, VIEJO) : "", comando, reescribe };
}
function leerCola(f, max = 600000) {
  try {
    const n = statSync6(f).size, fd = openSync(f, "r"), b = Buffer.alloc(Math.min(n, max));
    readSync(fd, b, 0, b.length, Math.max(0, n - b.length));
    closeSync(fd);
    return b.toString("utf8");
  } catch {
    return "";
  }
}
function textoIADesdeUsuario(transcript) {
  if (!transcript || !existsSync6(transcript))
    return null;
  const lineas = leerCola(transcript).split(`
`).filter((l) => l.trim().startsWith("{"));
  const msgs = [];
  for (const l of lineas) {
    try {
      const j = JSON.parse(l), m = j.message ?? j, rol = String(m.role ?? j.type ?? "");
      const c = m.content ?? m.parts ?? j.content;
      const partes = Array.isArray(c) ? c : [{ type: "text", text: String(c ?? "") }];
      const reales = partes.filter((p) => p && (p.type === "text" || p.type === "thinking" || p.type === "reasoning" || typeof p.text === "string" && !p.type));
      const esResultado = partes.some((p) => p?.type === "tool_result" || p?.functionResponse);
      if (rol === "user" && esResultado)
        continue;
      msgs.push({ rol: rol === "model" ? "assistant" : rol, txt: reales.map((p) => p.text ?? p.thinking ?? "").join(`
`) });
    } catch {}
  }
  if (!msgs.length)
    return null;
  let i = msgs.length - 1;
  while (i >= 0 && !(msgs[i].rol === "user" && msgs[i].txt.trim() && !/^\s*\[(GUARDIAN|SKILL_DEY)/.test(msgs[i].txt)))
    i--;
  if (i < 0)
    return null;
  const tras = msgs.slice(i + 1).filter((m) => m.rol === "assistant").map((m) => m.txt).join(`
`);
  const prev = msgs.slice(0, i).reverse().find((m) => m.rol === "assistant")?.txt ?? "";
  return { desde: tras, antes: prev };
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
    const ctx = [s.mostrar && `[SKILL_DEY] Resultado ya ejecutado por código. Muéstralo al usuario tal cual, sin ejecutar nada:
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
var FONDO = {
  claude: "Vuelve a ejecutarlo con run_in_background: true y revisa la salida después.",
  gemini: "Vuelve a ejecutarlo en segundo plano con log: nohup <comando> > .skill_dey/logs/servidor.log 2>&1 &",
  antigravity: "Ejecútalo en segundo plano con log (nohup <comando> > .skill_dey/logs/servidor.log 2>&1 & · en Windows: Start-Process sin -Redirect) y lee el log."
};
var SI = /^\s*(s[ií]|si señor|ok|okay|dale|hazlo|h[aá]gale|listo|de acuerdo|autorizo|autorizado|adelante|procede|correcto|est[aá] bien|perfecto|aprobado)(?![\wáéíóúñ])/i;
var INICIAR = /\b(iniciar|inicia|activar|activa|encender|enciende|empezar)\s+(la\s+)?skill[\s_-]*dey\b/i;
var FINALIZAR = /\b(finalizar|finaliza|desactivar|desactiva|apagar|apaga|terminar|termina|detener|salir\s+de)\s+(la\s+)?skill[\s_-]*dey\b/i;
var AMPLIO = /reescrib|refactoriz|reorganiz|reestructur|limpia (el|todo)|optimiza (todo|el proyecto)|mejora todo|todo el (proyecto|c[oó]digo)|formatea|corrige todos|todos los archivos|migra(r)? (el|todo)/i;
var nombresEn = (t) => (t.match(/[\w\/\\.-]+\.[A-Za-z][A-Za-z0-9]{0,5}\b/g) ?? []).map((x) => x.replace(/\\/g, "/").toLowerCase().split("/").pop()).filter((x) => !/^(www|http|https)\b|\.(com|net|org|co|io)$/.test(x));
var PREG = (q) => `${q} NO lo cambies por tu cuenta. Si de verdad es indispensable para lo que pidió, PREGÚNTALE en 1 línea: "Para <lo que pidió> necesito tocar <archivo> porque <motivo>. ¿Lo autorizas?" y espera su sí. Si es una mejora aparte, solo propónla al final.`;
var MODIFICA_BASH = /\bsed\s+(-[a-z]*i|--in-place)|\bperl\s+-[a-z]*i|\bSet-Content\b|\bOut-File\b|\bAdd-Content\b|\btee\b|-replace\b|[^>&0-9]>>?\s*[^&>\s]|\b(mv|move|ren|rename|Move-Item|Rename-Item)\b/i;
var IGNORA_ALCANCE = /(^|\/)(\.skill_dey|docs?|tests?|__tests__|spec|logs?|tmp|temp|dist|build|node_modules|vendor|coverage)\/|\.(test|spec)\.|\.(md|mdx|txt|log|lock)$/i;
var viejoDe = (cwd, abs) => join10(cwd, ".skill_dey", ".viejos", createHash2("sha1").update(abs).digest("hex").slice(0, 16) + ".txt");
function porCodigo(cwd, texto) {
  const c = intencion(texto);
  if (!c)
    return null;
  const [cmd, ...r] = c.split(" "), arg = r.join(" ").trim();
  if (cmd === "deshacer")
    return arg && !/^\d+$/.test(arg) ? deshacerArchivo(cwd, arg) : deshacer(cwd, Number(arg) || 1);
  if (cmd === "rehacer")
    return rehacer(cwd);
  if (cmd === "historial")
    return historial(cwd);
  if (cmd === "antes-de") {
    const p = buscarPaso(cwd, arg);
    return p.n ? deshacer(cwd, p.n) : `No encontré un punto guardado que coincida con "${arg}". Escribe "historial" para ver la lista.`;
  }
  if (cmd === "donde") {
    const l = dondeQuedamos(cwd, 6);
    return l.length ? `**Dónde quedamos** (últimos pedidos en este proyecto, de todas las sesiones):
` + l.map((x) => "- " + x).join(`
`) + `

Para seguir: "sigue". Para volver a un punto: "historial".` : "Aún no hay pedidos registrados en este proyecto.";
  }
  if (cmd === "cambios")
    return cambiosExactos(cwd);
  if (cmd === "hitos")
    return listarHitos(cwd);
  if (cmd === "version")
    return `SKILL_DEY ${VERSION} · guardián en vivo activo en esta IA.`;
  return null;
}
function procesar(host, ev, entrada) {
  const prompt = String(primero(entrada, ["prompt", "user_prompt", "userMessage", "message", "input.prompt"]) ?? "");
  if (ev === "prompt" && FINALIZAR.test(prompt) && prompt.trim().length <= 40) {
    fijarActivo(false);
    return { mostrar: '⏸ SKILL_DEY apagado. Escribe "iniciar skill dey" para encenderlo de nuevo.' };
  }
  if (ev === "prompt" && INICIAR.test(prompt)) {
    fijarActivo(true);
    return { mostrar: `▶ SKILL_DEY ${VERSION} encendido: guardián, copias para deshacer y cero errores activos.` };
  }
  if (!activo())
    return {};
  const cwd = carpetaProyecto(entrada);
  const sid = String(primero(entrada, ["session_id", "sessionId", "conversation_id", "conversationId"]) ?? "");
  const transcript = String(primero(entrada, ["transcript_path", "transcriptPath"]) ?? "");
  const st = cwd ? cargar(cwd, host, sid) : nuevo(sid);
  const fin = (s) => {
    if (cwd)
      guardar(cwd, host, st);
    return s;
  };
  if (ev === "inicio") {
    let extra = "";
    if (cwd) {
      try {
        asegurarMemoria(cwd);
      } catch {}
      try {
        const l = dondeQuedamos(cwd, 4);
        if (l.length)
          extra = `
[SKILL_DEY · proyecto con historia] Últimos pedidos (de sesiones anteriores):
` + l.map((x) => "- " + x).join(`
`) + `
Si el usuario dice 'sigue' o se refiere a algo anterior, parte de aquí.`;
      } catch {}
      st.sesionVista = true;
    }
    let reglas = "";
    if (host === "claude")
      try {
        reglas = `

` + readFileSync8(join10(dirname2(process.argv[1] ?? ""), "..", "REGLAS.md"), "utf8");
      } catch {}
    return fin({ contexto: `SKILL_DEY ${VERSION} activo.${reglas}${extra}` });
  }
  if (ev === "prompt") {
    const autoriza = SI.test(prompt) && prompt.trim().length <= 80;
    if (autoriza) {
      const t = textoIADesdeUsuario(transcript);
      st.nombrados = [...new Set([...st.nombrados, ...nombresEn(prompt), ...nombresEn(t?.desde || t?.antes || "")])];
      return fin({});
    }
    const previo = { ...st };
    Object.assign(st, nuevo(sid), { prompt: prompt.slice(0, 2000), nombrados: nombresEn(prompt), amplio: AMPLIO.test(prompt), sesionVista: previo.sesionVista });
    if (cwd)
      try {
        const v = JSON.parse(readFileSync8(join10(cwd, ".skill_dey", ".ultimo-verificar.json"), "utf8"));
        st.baseVerde = v?.ok === true;
      } catch {}
    if (cwd) {
      const r = porCodigo(cwd, prompt);
      if (r)
        return fin({ mostrar: r });
    }
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
  const base = cwd ?? "/";
  if (ev === "antes") {
    const cmd = acc.comando;
    if (acc.tipo === "leer" && acc.archivos.some((f) => ENV_REAL.test(f)) || acc.tipo === "comando" && LEE_ENV.test(cmd))
      return fin({ negar: "SKILL_DEY: no leo .env reales (credenciales). Usa .env.example o pregunta el nombre de la variable." });
    if (acc.tipo === "editar" && acc.archivos.some((f) => ENV_REAL.test(f) && existsSync6(isAbsolute5(f) ? f : join10(base, f))))
      return fin({ negar: "SKILL_DEY: no escribo ni borro .env reales (tus credenciales no se pueden deshacer). Agrega la variable a .env.example y dile al usuario qué copiar a su .env." });
    if (!/skill_dey_(deshacer|historial|estado|rehacer)/.test(herramienta)) {
      const firma = `${herramienta}|${JSON.stringify(args).slice(0, 400)}|${st.ediciones}${acc.tipo === "editar" ? "|" + st.evaluaciones : ""}`;
      const n = (st.firmas[firma] ?? 0) + 1;
      st.firmas[firma] = n;
      if (Object.keys(st.firmas).length > 300)
        st.firmas = { [firma]: n };
      if (n >= 3)
        return fin({ negar: `SKILL_DEY anti-vueltas: ya hiciste exactamente esto ${n - 1} veces sin cambiar nada; el resultado será igual. Cambia de enfoque: escribe en 1 línea síntoma + hipótesis comprobable, o skill_dey_deshacer y reporta.` });
      if (st.enRojo) {
        st.accionesEnRojo++;
        if (st.accionesEnRojo === 15)
          return fin({ negar: "SKILL_DEY anti-vueltas: 15 acciones sobre el mismo error sin quedar verde. Para: escribe en 1 línea qué sabes (hechos) y tu hipótesis; haz UNA comprobación que la refute (references/diagnostico-sistematico.md de la skill skill-dey)." });
        if (st.accionesEnRojo >= 30 && !/skill_dey_/.test(herramienta))
          return fin({ negar: "SKILL_DEY FRENO: 30 acciones sin resolver el error. No sigas: skill_dey_deshacer al último verde y reporta al usuario hechos · hipótesis · siguiente paso (2–3 opciones)." });
      }
    }
    if (acc.tipo === "leer" || /skill_dey_/.test(herramienta))
      st.evaluaciones++;
    const modifica = acc.tipo === "editar" || acc.tipo === "comando" && !!cmd && !esSoloLectura(cmd);
    if (acc.tipo === "editar" && cwd) {
      for (const f of acc.archivos)
        if (fueraDelProyecto(cwd, f))
          return fin({ negar: `SKILL_DEY: ${f} está FUERA del proyecto. No lo modifiques sin que el usuario lo autorice explícitamente para esa ruta.` });
    }
    if (cwd) {
      let objetivos = [];
      if (acc.tipo === "editar")
        objetivos = acc.archivos;
      else if (acc.tipo === "comando" && MODIFICA_BASH.test(cmd))
        objetivos = [...cmd.matchAll(/(?:^|[\s>"'=(])([\w.\/\\:-]+\.[A-Za-z][\w]{0,5})\b/g)].map((m) => m[1]).filter((f) => {
          try {
            return existsSync6(isAbsolute5(f) ? f : join10(cwd, f)) && !fueraDelProyecto(cwd, f);
          } catch {
            return false;
          }
        });
      const nombrados = new Set(st.nombrados), existentes = new Set(st.existentes);
      for (const f of objetivos) {
        const abs = isAbsolute5(f) ? f : join10(cwd, f), clave = relNorm(cwd, f);
        if (!existsSync6(abs) || existentes.has(clave) || IGNORA_ALCANCE.test(clave))
          continue;
        const nombre = clave.split("/").pop().toLowerCase();
        if (nombrados.size && !nombrados.has(nombre))
          return fin({ negar: PREG(`SKILL_DEY alcance: el usuario pidió cambios en ${[...nombrados].slice(0, 5).join(", ")}, no en "${clave}" (que ya funcionaba).`) });
        if (!nombrados.size && !st.amplio && existentes.size >= 3)
          return fin({ negar: PREG(`SKILL_DEY alcance: ya modificaste ${existentes.size} archivos que existían (${[...existentes].slice(0, 4).join(", ")}) y ahora vas por "${clave}".`) });
      }
      if (!st.amplio && acc.tipo === "editar" && acc.archivos[0]) {
        const abs = isAbsolute5(acc.archivos[0]) ? acc.archivos[0] : join10(cwd, acc.archivos[0]);
        if (existsSync6(abs)) {
          let viejo = "";
          try {
            if (statSync6(abs).size < 2000000)
              viejo = readFileSync8(abs, "utf8");
          } catch {}
          const vl = viejo.split(/\r?\n/);
          const quita = acc.reescribe ? (() => {
            const m = new Map;
            for (const l of acc.texto.split(/\r?\n/))
              m.set(l, (m.get(l) ?? 0) + 1);
            let q = 0;
            for (const l of vl) {
              const n = m.get(l) ?? 0;
              if (n > 0)
                m.set(l, n - 1);
              else if (l.trim())
                q++;
            }
            return q;
          })() : acc.quita.split(/\r?\n/).filter((l) => l.trim()).length;
          const limite = Math.max(25, Math.round(vl.length * 0.3));
          if (viejo && quita > limite)
            return fin({ negar: `SKILL_DEY alcance: ibas a cambiar ${quita} líneas de "${relNorm(cwd, acc.archivos[0])}" (de ${vl.length}). Cambia SOLO las líneas necesarias para lo que pidió el usuario, con ediciones pequeñas. No reescribas ni "mejores" el resto del archivo. Si el usuario pidió reescribirlo, que lo diga.` });
        }
      }
      for (const f of objetivos)
        if (existsSync6(isAbsolute5(f) ? f : join10(cwd, f)))
          existentes.add(relNorm(cwd, f));
      st.existentes = [...existentes];
      if (acc.tipo === "editar" && !st.entendido && !st.avisoEntendi && acc.archivos.some((f) => existsSync6(isAbsolute5(f) ? f : join10(cwd, f)))) {
        const t = textoIADesdeUsuario(transcript);
        if (!t)
          st.entendido = true;
        else if (/entend[ií]\s*:/i.test(t.desde) && /(causa|por ?qu[eé]|plan|pasos?)\s*:/i.test(t.desde))
          st.entendido = true;
        else {
          st.avisoEntendi = true;
          return fin({ negar: `SKILL_DEY razonar: antes de cambiar código, escribe al usuario (corto):
Entendí: <qué pidió exactamente y qué NO pidió>
Causa/Por qué: <qué hay hoy en el código y por qué pasa o qué falta, con archivo:línea que LEÍSTE>
Plan: <cambio mínimo, archivo por archivo, y cómo lo vas a comprobar>
Si algo no está claro, PREGUNTA en vez de suponer. Luego haz el cambio.` });
        }
      }
      if (modifica)
        try {
          const cong = readFileSync8(join10(cwd, ".skill_dey", "CONGELADO.txt"), "utf8").split(/\r?\n/).map((l) => l.trim().replace(/\\/g, "/").replace(/^\.\//, "")).filter((l) => l && !l.startsWith("#")).map((l) => process.platform === "win32" ? l.toLowerCase() : l);
          const rutas = acc.archivos.map((f) => relNorm(cwd, f));
          if (acc.tipo === "comando")
            for (const m of cmd.matchAll(/(?:^|[\s>"'])([\w.\/\\-]+\.[\w]+)/g))
              rutas.push(relNorm(cwd, m[1]));
          const choca = rutas.find((r) => cong.some((c) => r === c || r.startsWith(c.replace(/\/$/, "") + "/")));
          if (choca)
            return fin({ negar: `SKILL_DEY: "${choca}" está en zona CONGELADA (.skill_dey/CONGELADO.txt): no se toca sin permiso. Si el usuario lo autoriza, quítalo de ese archivo primero.` });
        } catch {}
    }
    if (acc.tipo === "editar") {
      const t = acc.texto.split(/\r?\n/).find((l) => TRUNCADO.test(l));
      if (t)
        return fin({ negar: `SKILL_DEY: código truncado bloqueado ("${t.trim().slice(0, 70)}"). Escribe el contenido COMPLETO o edita solo las líneas que cambian.` });
      if (!acc.archivos.every((f) => /\.env(\.|$)|\.example|\.md$/i.test(f))) {
        const linea = acc.texto.split(/\r?\n/).find((l) => SECRETO.test(l) && !PLACEHOLDER.test(l));
        if (linea)
          return fin({ negar: `SKILL_DEY: secreto en código bloqueado → "${linea.trim().slice(0, 80)}". Muévelo a .env y documenta la variable en .env.example.` });
      }
      if (!acc.archivos.every((f) => /(^|[\\/])(migrations?|migrate|alembic[\\/]versions)([\\/]|$)|\.(md|mdx|txt|rst)$/i.test(f))) {
        const d = bdDestructivo(acc.texto, acc.archivos.some((f) => /\.sql$/i.test(f)));
        if (d)
          return fin({ negar: `SKILL_DEY: PROHIBIDO para proteger la integridad de los datos → "${d.slice(0, 60)}". No se elimina base ni tabla, ni se vacía una tabla. Si de verdad hace falta, dilo al usuario para que lo haga él.` });
      }
    }
    let nuevoCmd = "";
    if (acc.tipo === "comando" && cmd) {
      for (const [re, motivo] of PELIGROSO)
        if (re.test(cmd))
          return fin({ negar: `SKILL_DEY: bloqueado (${motivo}). Pide confirmación explícita al usuario y que lo ejecute él.` });
      if (borradoMasivo(cmd, base))
        return fin({ negar: "SKILL_DEY: bloqueado (borrado masivo de carpetas). Pide confirmación explícita al usuario y que lo ejecute él." });
      const sqlArchivo = cwd ? sqlEjecutado(cmd, cwd) : "";
      if (sqlArchivo && bdDestructivo(sqlArchivo, true))
        return fin({ negar: "SKILL_DEY: bloqueado: el archivo .sql que vas a ejecutar elimina o vacía datos (DROP/TRUNCATE/DELETE sin WHERE). Que lo ejecute el usuario si de verdad hace falta." });
      const yaFondo = /(&\s*$|nohup|disown|--detach|-d\b)/.test(cmd) || args?.run_in_background === true || args?.is_background === true;
      if (/\bStart-Process\b[^;|]*-Redirect(StandardOutput|StandardError|StandardInput)\b|\bstart\s+\/b\b/i.test(cmd))
        return fin({ negar: `SKILL_DEY: ese arranque deja la terminal colgada en Windows (la salida queda atada al servidor). ${FONDO[host]}` });
      if (SERVIDOR.test(cmd) && !yaFondo) {
        if (host === "gemini" && process.platform !== "win32") {
          const log = `.skill_dey/logs/servidor-${Date.now()}.log`;
          nuevoCmd = `mkdir -p .skill_dey/logs && (nohup sh -c '${cmd.replace(/'/g, `'\\''`)}' > "${log}" 2>&1 &) ; sleep 8 ; echo "[SKILL_DEY] servidor en segundo plano · log: ${log}" ; tail -n 25 "${log}"`;
        } else
          return fin({ negar: `SKILL_DEY: este comando deja un servidor corriendo y congela la sesión. ${FONDO[host]}` });
      }
      let t = nuevoCmd || cmd;
      if (/\bvitest\b/.test(t) && !/\bvitest\s+(run|related)\b|--run\b/.test(t))
        t = t.replace(/\bvitest\b/, "vitest run");
      if (/--watch(All)?\b/.test(t) && /jest|vitest|mocha|test/.test(t))
        t = t.replace(/\s--watch(All)?\b/g, "");
      if (t !== (nuevoCmd || cmd)) {
        if (host === "gemini")
          nuevoCmd = t;
        else
          return fin({ negar: `SKILL_DEY: las pruebas en modo "watch" no terminan nunca. Usa: ${t}` });
      }
      const dep = cmd.match(DEPENDENCIA);
      if (dep && st.prompt && !/(^|\s)-(D|-save-dev)\b.*playwright|--dry-run/.test(cmd)) {
        const paquetes = (dep.groups?.pkgs ?? "").split(/\s+/).filter((x) => x && !x.startsWith("-")).map((x) => x.replace(/@[\d^~<>=.*x-]+$/, ""));
        const tu = st.prompt.toLowerCase();
        const pidio = /instal|dependenc|librer|paquete|package|m[oó]dulo npm|composer/.test(tu) || paquetes.some((p) => tu.includes(p.toLowerCase().split("/").pop())) || SI.test(tu) || paquetes.length === 0;
        if (!pidio)
          return fin({ negar: `SKILL_DEY: no agregues dependencias que no se pidieron (${paquetes.join(", ")}). Propónselas al usuario en 1 línea (para qué y alternativa sin dependencia) y espera su OK.` });
      }
      if (cwd) {
        if ((MIGRACION.test(cmd) || SQL_MODIFICA.test(cmd) || sqlArchivo && /\b(insert|update|delete|alter|create|drop|replace)\b/i.test(sqlArchivo)) && !/--pretend\b|--dry-run\b|\bmigrate:status\b|\bmigrate\s+status\b|\s--status\b|\bshowmigrations\b/.test(cmd) && !/\b(DB_DATABASE|DB_NAME|DATABASE_URL)["']?\s*=\s*["']?[^\s"';]*(_skilldey_prueba_?\d*|bd-prueba\.sqlite)\b/i.test(cmd) && !respaldoBdReciente(cwd))
          return fin({ negar: "SKILL_DEY: antes de migrar o modificar la BD real: 1) ensaya en una copia · 2) haz respaldo en .skill_dey/respaldos-bd/ (pg_dump -Fc -f .skill_dey/respaldos-bd/<fecha>.dump <bd> · mysqldump <bd> > .skill_dey/respaldos-bd/<fecha>.sql · copiar el .sqlite). Si es BD de producción, NO lo hagas: pide al usuario." });
        if (/git\s+(add|commit)\b/.test(cmd)) {
          const tr = blindarGitignore(cwd);
          if (tr)
            return fin({ negar: `SKILL_DEY: ${tr} está versionado en git (secretos expuestos). Ejecuta: git rm --cached ${tr} y avisa al usuario que cambie esas claves.` });
        }
        if (/git\s+commit\b/.test(cmd) && !/checkpoint|baseline|wip/i.test(cmd) && st.ultimaEdicion > 0) {
          let v = null;
          try {
            v = JSON.parse(readFileSync8(join10(cwd, ".skill_dey", ".ultimo-verificar.json"), "utf8"));
          } catch {}
          if (!v || !v.ok || v.ts < st.ultimaEdicion)
            return fin({ negar: "SKILL_DEY: commit bloqueado. Ejecuta skill_dey_verificar (debe salir ✅) después de tu última edición. Para guardar avance usa un commit 'skill_dey: checkpoint'." });
        }
      }
    }
    if (modifica && cwd) {
      try {
        const ped = st.prompt.replace(/\s+/g, " ").trim().slice(0, 100);
        if (!st.foto) {
          st.foto = true;
          const grande = (() => {
            try {
              return contarArchivos(cwd, 2500) >= 2500;
            } catch {
              return false;
            }
          })();
          st.git = esRepo(cwd) ? asegurarRepo(cwd) : grande ? false : asegurarRepo(cwd);
          if (st.git) {
            const c = foto(cwd, "pasos", "cambio", ped ? `"${ped}"` : acc.tipo === "comando" ? `bash: ${cmd}` : `${acc.herramienta} ${acc.archivos.join(", ")}`);
            if (c && !st.commitBase)
              st.commitBase = c;
          }
        }
        if (!st.git)
          for (const f of acc.archivos)
            respaldarArchivo(cwd, f, st.turno, ped);
      } catch (e) {
        log(`foto: ${e?.message}`);
      }
      if (acc.tipo === "editar")
        for (const f of acc.archivos) {
          const abs = isAbsolute5(f) ? f : join10(cwd, f);
          if (!CODIGO.test(abs))
            continue;
          try {
            if (existsSync6(abs) && statSync6(abs).size < 400000) {
              const d = viejoDe(cwd, abs);
              mkdirSync5(dirname2(d), { recursive: true });
              writeFileSync5(d, readFileSync8(abs, "utf8"));
            }
          } catch {}
        }
    }
    return fin(nuevoCmd ? { comando: nuevoCmd } : {});
  }
  if (ev === "despues") {
    const resp = JSON.stringify(primero(entrada, ["tool_response", "toolResponse", "output", "result", "error"]) ?? "");
    if (/skill_dey_(verificar|revisar|chrome)/.test(herramienta)) {
      if (/✅ todo verde|✅ sitio sin errores|0 problema/.test(resp)) {
        st.enRojo = false;
        st.accionesEnRojo = 0;
        st.firmas = {};
      } else if (/❌/.test(resp))
        st.enRojo = true;
    }
    if (/skill_dey_(deshacer|rehacer)/.test(herramienta))
      st.foto = false;
    if (acc.tipo === "comando" && acc.comando && !esSoloLectura(acc.comando)) {
      st.ediciones++;
      if (MODIFICA_BASH.test(acc.comando))
        st.ultimaEdicion = Date.now();
    }
    if (acc.tipo !== "editar" || !cwd)
      return fin({});
    st.ediciones++;
    st.ultimaEdicion = Date.now();
    const avisos = [];
    for (const archivo of acc.archivos) {
      if (!st.editados.includes(archivo))
        st.editados.push(archivo);
      const abs = isAbsolute5(archivo) ? archivo : join10(cwd, archivo), d = viejoDe(cwd, abs);
      try {
        if (existsSync6(d)) {
          const a = impactoDe(cwd, abs, readFileSync8(d, "utf8"), readFileSync8(abs, "utf8"));
          unlinkSync2(d);
          if (a)
            avisos.push(a);
        }
      } catch {}
      const err = sintaxis(cwd, archivo);
      if (err)
        avisos.push(`⚠ SKILL_DEY sintaxis en ${archivo}:
${err}
→ Corrígelo antes de seguir.`);
    }
    if (!avisos.length)
      return fin({});
    if (host === "antigravity") {
      st.avisos.push(...avisos);
      return fin({});
    }
    return fin({ contexto: avisos.join(`

`) });
  }
  if (!cwd || !st.editados.length) {
    if (cwd && st.avisos.length) {
      const a = st.avisos.join(`

`);
      st.avisos = [];
      return fin({ frenar: a });
    }
    return fin({});
  }
  const errores = st.editados.map((f) => {
    const e = sintaxis(cwd, f);
    if (e) {
      const l = e.split(`
`);
      return `${f}: ${(l.find((x) => /error/i.test(x)) ?? l[l.length - 1]).trim().slice(0, 120)}`;
    }
    try {
      const abs = isAbsolute5(f) ? f : join10(cwd, f);
      if (existsSync6(abs) && statSync6(abs).size < 2000000 && /^(<{7}|={7}|>{7})( |$)/m.test(readFileSync8(abs, "utf8")))
        return `${f}: marcas de conflicto de git sin resolver`;
    } catch {}
    return "";
  }).filter(Boolean);
  if (errores.length && st.autoIntentos < 3) {
    st.autoIntentos++;
    const orden = st.autoIntentos >= 3 ? "CICLO 4 — DIAGNÓSTICO SISTEMÁTICO: abandona el enfoque anterior; escribe tu hipótesis comprobable en 1 línea antes de editar (references/diagnostico-sistematico.md). Si no queda bien: skill_dey_deshacer." : "Corrige exactamente eso por causa raíz.";
    return fin({ frenar: `[GUARDIAN] ${errores.slice(0, 6).join(" | ")}
${orden} Responde en 1-3 líneas.` });
  }
  let resultado = "✅";
  if (errores.length) {
    resultado = "❌ quedó con errores";
    if (st.baseVerde && st.git) {
      const r = deshacerDesde(cwd, st.inicioPedido, st.commitBase);
      resultado = "↩ deshecho automático (rompía la app)";
      try {
        appendFileSync2(join10(cwd, ".skill_dey", "BITACORA.md"), `- ${new Date().toISOString().slice(0, 16).replace("T", " ")} · "${st.prompt.replace(/\s+/g, " ").slice(0, 100)}" · ↩ DESHECHO AUTOMÁTICO: rompía lo que funcionaba (${errores[0].slice(0, 120)})
`);
      } catch {}
      st.editados = [];
      st.autoIntentos = 99;
      return fin({ frenar: `[GUARDIAN] Deshice tu cambio automáticamente: rompía lo que funcionaba y no quedó bien en 3 intentos.
${errores.join(" | ").slice(0, 600)}
${r.split(`
`)[0]}
No vuelvas a editar. Dile al usuario en 2 líneas qué pasó y que puede escribir "rehaz" si igual lo quiere.` });
    }
  } else {
    try {
      mkdirSync5(join10(cwd, ".skill_dey"), { recursive: true });
      writeFileSync5(join10(cwd, ".skill_dey", ".ultimo-verificar.json"), JSON.stringify({ ok: true, ts: Date.now(), errores: 0, origen: `guardian-${host}`, archivos: st.editados.slice(0, 50) }));
    } catch {}
  }
  const lista = st.editados.map((f) => relNorm(cwd, f));
  try {
    registrarCambio(cwd, lista, st.prompt, resultado);
  } catch {}
  try {
    if (contarArchivos(cwd, 2500) < 2500 && lista.some((f) => !/(^|\/)docs\/|database\/instalacion\.sql$/.test(f)))
      documentar(cwd);
  } catch (e) {
    log(`documentar: ${String(e?.message ?? e).slice(0, 200)}`);
  }
  st.editados = [];
  const avisos = st.avisos.splice(0);
  if (avisos.length)
    return fin({ frenar: avisos.join(`

`) });
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
  const host = argv[0] ?? "claude", ev = argv[1] ?? "antes";
  const t0 = Date.now();
  let salida = {};
  try {
    if (!["claude", "gemini", "antigravity"].includes(host) || !["inicio", "prompt", "antes", "despues", "fin"].includes(ev))
      throw new Error("uso: skill_dey-hook <claude|gemini|antigravity> <inicio|prompt|antes|despues|fin>");
    const txt = await leerStdin();
    salida = responder(host, ev, procesar(host, ev, txt.trim() ? JSON.parse(txt) : {}));
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
  normalizar,
  procesar,
  textoIADesdeUsuario
};
