#!/usr/bin/env node
// SKILL DEY 41.0.0 · generado por scripts/build.mjs desde app/skill_dey-lib/cli.ts — no editar a mano
// app/skill_dey-lib/cli.ts
import { resolve as resolve2 } from "node:path";

// app/skill_dey-lib/listar.ts
import { spawnSync } from "node:child_process";
import { readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
var IGN = /(^|[\\/])(node_modules|vendor|dist|build|\.git|\.skill_dey|coverage|\.venv|venv|__pycache__|\.next|\.nuxt|storage[\\/]framework|bootstrap[\\/]cache)([\\/]|$)|\.min\.(js|css)$|\.bundle\.js$/i;
function listarArchivos(cwd, maxFiles = 20000) {
  const g = spawnSync("git", ["-c", "core.quotepath=off", "ls-files", "-co", "--exclude-standard", "-z"], { cwd, encoding: "utf8", maxBuffer: 1e8, timeout: 20000 });
  if (g.status === 0 && g.stdout.trim())
    return g.stdout.split("\x00").filter((f) => f && !IGN.test(f)).slice(0, maxFiles);
  const out = [];
  const walk = (d, prof) => {
    if (out.length >= maxFiles || prof > 12)
      return;
    let ents = [];
    try {
      ents = readdirSync(d);
    } catch {
      return;
    }
    for (const e of ents) {
      if (e.startsWith(".") && e !== ".env.example")
        continue;
      const p = join(d, e);
      const rel = relative(cwd, p);
      if (IGN.test(rel) || IGN.test("/" + rel))
        continue;
      let st;
      try {
        st = statSync(p);
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
import { spawnSync as spawnSync3 } from "node:child_process";
import { existsSync as existsSync2, readFileSync as readFileSync3, writeFileSync, mkdirSync as mkdirSync2, statSync as statSync2 } from "node:fs";
import { join as join4, basename as basename2 } from "node:path";

// app/skill_dey-lib/manual.ts
import { readFileSync } from "node:fs";
import { join as join2, basename } from "node:path";
var cache = new Map;
var leer = (p) => {
  if (cache.has(p))
    return cache.get(p);
  let t = "";
  try {
    t = readFileSync(p, "utf8");
  } catch {}
  cache.set(p, t);
  return t;
};
var limpiar = (t) => t.replace(/<\?(php|=)[\s\S]*?\?>/g, " ").replace(/\{[^{}]*\}/g, " ").replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();
var humano = (n) => n.replace(/\[\]$/, "").replace(/[_-]+/g, " ").replace(/([a-z])([A-Z])/g, "$1 $2").replace(/^\w/, (c) => c.toUpperCase());
var attr = (tag, a) => tag.match(new RegExp(`\\b${a}\\s*=\\s*["']([^"']*)["']`, "i"))?.[1];
function tituloPantalla(f, src) {
  const t = limpiar(src.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? "") || limpiar(src.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)?.[1] ?? "") || limpiar(src.match(/<h2[^>]*>([\s\S]*?)<\/h2>/i)?.[1] ?? "");
  return (t && t.length < 80 ? t : "") || humano(basename(f).replace(/\.(blade\.)?[^.]+$/, ""));
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
  const src = leer(join2(cwd, f)), titulo = tituloPantalla(f, src);
  const C = campos(src), B = botones(src), M = mensajes(src), TH = columnas(src);
  const login = (C.some((c) => c.tipo === "contraseña") || /<form/i.test(src)) && /login|ingres|iniciar sesi|acceso|signin/i.test(basename(f) + " " + titulo);
  const graficos = /new Chart\(|chart\.js|apexcharts|echarts|highcharts|recharts|<canvas/i.test(src);
  const exporta = [/xlsx|excel|phpspreadsheet|\.csv/i.test(src) && "Excel/CSV", /pdf|dompdf|tcpdf|fpdf|jspdf|window\.print/i.test(src) && "PDF/impresión"].filter(Boolean);
  const elimina = /eliminar|borrar|delete/i.test(B.join(" ") + src.slice(0, 50000));
  const sesion = /\$_SESSION\[|session_start\(|Auth::|middleware\(['"]auth|useAuth|requireAuth|isAuthenticated/.test(src);
  const rol = src.match(/\$_SESSION\[['"](rol|role|perfil|tipo_usuario)['"]\]\s*[!=]==?\s*['"]([^'"]+)['"]/i)?.[2];
  const nombreArchivo = basename(f);
  const desde = todas.filter((o) => o !== f).map((o) => ({ o, s: leer(join2(cwd, o)) })).filter(({ s }) => new RegExp(`href\\s*=\\s*["'][^"']*${nombreArchivo.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`, "i").test(s) || new RegExp(`to\\s*=\\s*["']/${nombreArchivo.replace(/\.[^.]+$/, "")}["']`).test(s)).map(({ o, s }) => {
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
  vistas = vistas.filter((v) => /<(html|body|form|table|div|main|section|h1|h2|template)\b|echo\s|print\s|<\?=|return\s*\(?\s*</i.test(leer(join2(cwd, v))));
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
import { spawnSync as spawnSync2 } from "node:child_process";
import { readFileSync as readFileSync2, copyFileSync, existsSync, mkdirSync } from "node:fs";
import { join as join3, isAbsolute } from "node:path";
var leer2 = (p) => {
  try {
    return readFileSync2(p, "utf8");
  } catch {
    return "";
  }
};
function conexion(cwd) {
  const env = leer2(join3(cwd, ".env"));
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
  return { motor, host, port, db: motor === "sqlite" && !isAbsolute(db) ? join3(cwd, db) : db, user, pass };
}
function correr(c, cmd, sql = "", otraBd) {
  const db = otraBd ?? c.db;
  const r = c.motor === "sqlite" ? spawnSync2("sqlite3", cmd === "dump" ? ["-readonly", db, ".schema"] : ["-readonly", "-noheader", db, sql], { encoding: "utf8", timeout: 25000 }) : c.motor === "pg" ? spawnSync2(cmd === "dump" ? "pg_dump" : "psql", cmd === "dump" ? ["--schema-only", "--no-owner", "--no-privileges", "-h", c.host, ...c.port ? ["-p", c.port] : [], ...c.user ? ["-U", c.user] : [], db] : ["-tA", "-h", c.host, ...c.port ? ["-p", c.port] : [], ...c.user ? ["-U", c.user] : [], "-d", db, "-c", sql], { encoding: "utf8", timeout: 25000, env: { ...process.env, PGPASSWORD: c.pass, PGOPTIONS: "-c default_transaction_read_only=on" } }) : spawnSync2(cmd === "dump" ? "mysqldump" : "mysql", cmd === "dump" ? ["--no-data", "--skip-comments", "--skip-add-drop-table", "--skip-lock-tables", "-h", c.host, ...c.port ? ["-P", c.port] : [], ...c.user ? ["-u", c.user] : [], db] : ["-N", "-B", "-h", c.host, ...c.port ? ["-P", c.port] : [], ...c.user ? ["-u", c.user] : [], db, "-e", `START TRANSACTION READ ONLY; ${sql}; ROLLBACK;`], { encoding: "utf8", timeout: 25000, env: { ...process.env, MYSQL_PWD: c.pass } });
  return { ok: r.status === 0, out: `${r.stdout ?? ""}`.trim() || `${r.stderr ?? r.error?.message ?? ""}`.trim() };
}
function volcarEsquema(cwd) {
  const c = conexion(cwd);
  if (!c)
    return { sql: "", motor: "" };
  const r = correr(c, "dump");
  return { sql: r.ok ? r.out : "", motor: { mysql: "MySQL/MariaDB", pg: "PostgreSQL", sqlite: "SQLite" }[c.motor] };
}
var consultaSegura = (sql) => /^\s*select\b/i.test(sql) && !/;\s*\S/.test(sql) && !/\b(insert|update|delete|drop|alter|create|truncate|grant|revoke|replace|merge|call|exec|execute|attach|detach|pragma|vacuum|into\s+(outfile|dumpfile)|load_file|load_extension|writefile|readfile|edit\s*\(|lo_(export|import)|pg_(sleep|terminate_backend|cancel_backend|reload_conf|read_file|read_binary_file|ls_dir|write)|dblink|setval|nextval|set_config|sleep\s*\(|benchmark\s*\(|get_lock|copy\s)\b/i.test(sql);
function contar(cwd, sql) {
  if (!consultaSegura(sql))
    return { ok: false, error: "consulta no permitida (solo SELECT de lectura)" };
  const c = conexion(cwd);
  if (!c)
    return { ok: false, error: "sin conexión a BD en .env" };
  const r = correr(c, "consulta", sql.replace(/;\s*$/, ""));
  if (!r.ok)
    return { ok: false, error: r.out.split(`
`)[0].replace(c.pass || "\x00", "***").slice(0, 120) };
  const n = Number(r.out.split(/\s+/)[0]);
  return Number.isFinite(n) ? { ok: true, n } : { ok: false, error: "la consulta no devolvió un número" };
}

// app/skill_dey-lib/documentar.ts
var IGN2 = /(^|[\\/])(node_modules|vendor|dist|build|\.git|\.skill_dey|coverage|\.venv|venv|__pycache__)([\\/]|$)/;
var archivos = (cwd) => listarArchivos(cwd, 8000).filter((f) => !IGN2.test(f));
var leer3 = (p) => {
  try {
    return readFileSync3(p, "utf8");
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
      return statSync2(join4(cwd, f)).size < 1e6;
    } catch {
      return false;
    }
  })()).sort();
  let tablas = [];
  for (const f of sqlArchivos)
    tablas.push(...desdeSQL(leer3(join4(cwd, f)), f));
  for (const f of fs.filter((f) => f.endsWith("schema.prisma")))
    tablas.push(...desdePrisma(leer3(join4(cwd, f)), f));
  for (const f of fs.filter((f) => /migrations?[\\/].*\.php$/.test(f)).sort())
    tablas.push(...desdeLaravel(leer3(join4(cwd, f)), f));
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
  const env = leer3(join4(cwd, ".env.example")) + leer3(join4(cwd, "prisma", "schema.prisma"));
  const motor = motorVivo || (/postgres/i.test(env) ? "PostgreSQL" : /mysql|mariadb/i.test(env) ? "MySQL/MariaDB" : /sqlite/i.test(env) ? "SQLite" : /sqlserver|mssql/i.test(env) ? "SQL Server" : "SQL estándar");
  return { tablas: [...vistas.values()], sqlArchivos, motor };
}
function conAuto(ruta, titulo, secciones, manualInicial = "") {
  let doc = existsSync2(ruta) ? readFileSync3(ruta, "utf8") : `# ${titulo}

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
  mkdirSync2(join4(ruta, ".."), { recursive: true });
  writeFileSync(ruta, doc);
}
function documentar(cwd) {
  const fs = archivos(cwd), hecho = [];
  const pkg = (() => {
    try {
      return JSON.parse(leer3(join4(cwd, "package.json")));
    } catch {
      return null;
    }
  })();
  const comp = (() => {
    try {
      return JSON.parse(leer3(join4(cwd, "composer.json")));
    } catch {
      return null;
    }
  })();
  const nombreApp = pkg?.name ?? comp?.name ?? basename2(cwd);
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
    conAuto(join4(cwd, "docs", "DICCIONARIO-DATOS.md"), `Diccionario de datos — ${nombreApp}`, { resumen: `Motor: ${motor} · Tablas: ${tablas.length} · Actualizado: ${fecha}`, tablas: dic }, `Descripción funcional de las tablas (escríbela aquí; lo de abajo se actualiza solo):
`);
    hecho.push(`docs/DICCIONARIO-DATOS.md (${tablas.length} tablas)`);
    let script = "";
    const prisma = fs.find((f) => f.endsWith("schema.prisma"));
    if (prisma && existsSync2(join4(cwd, "node_modules", ".bin", process.platform === "win32" ? "prisma.cmd" : "prisma"))) {
      const r = spawnSync3("npx", ["--no-install", "prisma", "migrate", "diff", "--from-empty", "--to-schema-datamodel", prisma, "--script"], { cwd, encoding: "utf8", shell: process.platform === "win32", timeout: 120000 });
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
        const d = soloDDL(leer3(join4(cwd, f)));
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
    mkdirSync2(join4(cwd, "database"), { recursive: true });
    const destinoSql = (() => {
      const f = join4(cwd, "database", "instalacion.sql");
      return !existsSync2(f) || /Generado por skill_dey/.test(leer3(f).slice(0, 400)) ? f : join4(cwd, "database", "instalacion.skill_dey.sql");
    })();
    writeFileSync(destinoSql, `-- Script de instalación de la base de datos — ${nombreApp}
-- Motor: ${motor} · Generado por skill_dey el ${fecha} a partir de: ${[...new Set(tablas.map((t) => t.origen))].join(", ")}
-- Uso: crear la BD vacía y ejecutar este archivo. Revisar tipos si se cambia de motor.

${script.trim()}
`);
    hecho.push("database/" + destinoSql.split(/[\\/]/).pop());
  }
  const ex = leer3(join4(cwd, ".env.example")).split(/\r?\n/).filter((l) => /^\s*[A-Z_][A-Z0-9_]*\s*=/.test(l)).map((l) => {
    const [k, ...r] = l.split("=");
    const coment = r.join("=").split("#").slice(1).join("#").trim();
    return `| ${k.trim()} | ${coment} |`;
  });
  const scripts = [...Object.entries(pkg?.scripts ?? {}).map(([k, v]) => `| npm run ${k} | ${v} |`), ...Object.entries(comp?.scripts ?? {}).map(([k, v]) => `| composer ${k} | ${Array.isArray(v) ? v.join(" && ") : v} |`)];
  const stack = [pkg && "Node.js", comp && "PHP (Composer)", fs.some((f) => f.endsWith(".php")) && !comp && "PHP", fs.some((f) => f.endsWith(".py")) && "Python", fs.some((f) => /\.(tsx?|jsx)$/.test(f)) && "TypeScript/JSX", pkg?.dependencies?.react && "React", pkg?.dependencies?.vue && "Vue", pkg?.dependencies?.express && "Express", comp?.require?.["laravel/framework"] && "Laravel"].filter(Boolean).join(" · ");
  const rutas = [];
  for (const f of fs.filter((f) => /\.(m?[jt]s|php|py)$/.test(f)).slice(0, 800)) {
    const t = leer3(join4(cwd, f));
    for (const m of t.matchAll(/(?:app|router|Route)(?:\.|::)(get|post|put|patch|delete)\s*\(\s*['"]([^'"]+)['"]/gi))
      rutas.push(`| ${m[1].toUpperCase()} | ${m[2]} | ${f} |`);
    for (const m of t.matchAll(/@(?:app|bp|router)\.(get|post|put|delete|route)\(\s*['"]([^'"]+)['"]/g))
      rutas.push(`| ${m[1].toUpperCase()} | ${m[2]} | ${f} |`);
  }
  const paginas = fs.filter((f) => f.endsWith(".php") && !/vendor|config|includes?|lib|src[\\/]|app[\\/]|clases?|models?|controllers?|migrations?|tests?/i.test(f));
  const carpetas = [...new Set(fs.map((f) => f.split(/[\\/]/)[0]).filter((d) => !d.includes(".")))].slice(0, 25);
  const deps = Object.keys({ ...pkg?.dependencies ?? {}, ...comp?.require ?? {} }).slice(0, 40);
  conAuto(join4(cwd, "docs", "MANUAL-TECNICO.md"), `Manual técnico — ${nombreApp}`, {
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
  const mu = join4(cwd, "docs", "MANUAL-USUARIO.md");
  let doc = existsSync2(mu) ? readFileSync3(mu, "utf8") : `# Manual de usuario — ${nombreApp}

Cómo usar la aplicación, pantalla por pantalla.
`;
  const r = manualUsuario(cwd, vistas, doc);
  mkdirSync2(join4(cwd, "docs"), { recursive: true });
  writeFileSync(mu, r.doc);
  hecho.push(`docs/MANUAL-USUARIO.md (${r.fichas} pantallas documentadas)`);
  return `Documentación actualizada: ${hecho.join(" · ")}`;
}

// app/skill_dey-lib/escaneo.ts
import { spawnSync as spawnSync5 } from "node:child_process";
import { existsSync as existsSync3, readFileSync as readFileSync5, statSync as statSync3 } from "node:fs";
import { join as join6 } from "node:path";

// app/skill_dey-lib/sintaxis.ts
import { spawnSync as spawnSync4 } from "node:child_process";
import { readFileSync as readFileSync4, writeFileSync as writeFileSync2, rmSync } from "node:fs";
import { join as join5, basename as basename3, isAbsolute as isAbsolute2 } from "node:path";
import { tmpdir } from "node:os";
function errorJs(cwd, archivo) {
  const abs = isAbsolute2(archivo) ? archivo : join5(cwd, archivo);
  let src = "";
  try {
    src = readFileSync4(abs, "utf8");
  } catch {
    return "";
  }
  if (/\.js$/i.test(abs) && /<[A-Za-z][\w.]*[\s>\/]/.test(src) && /(\/>|<\/[A-Za-z])/.test(src))
    return "";
  const esm = /\.js$/i.test(abs) && /^\s*(import\s|import\{|export\s|export\{)/m.test(src);
  const tmp = esm ? join5(tmpdir(), `skill_dey-chk-${process.pid}-${Date.now()}-${basename3(abs)}.mjs`) : "";
  if (tmp)
    writeFileSync2(tmp, src);
  const r = spawnSync4("node", ["--check", tmp || abs], { cwd, encoding: "utf8", timeout: 20000 });
  if (tmp)
    try {
      rmSync(tmp);
    } catch {}
  if (r.error || r.status === 0)
    return "";
  return `${r.stdout ?? ""}${r.stderr ?? ""}`.split(tmp || "\x00").join(archivo).split(/\r?\n/).filter((l) => l.trim() && !/^\s*at \S|^Node\.js v/.test(l)).slice(-6).join(`
`);
}

// app/skill_dey-lib/escaneo.ts
var WIN = process.platform === "win32";
var IGN3 = /(^|[\\/])(node_modules|vendor|dist|build|\.git|\.skill_dey|coverage|\.venv|venv|__pycache__|\.next|\.nuxt|storage|bootstrap[\\/]cache)([\\/]|$)|\.min\.(js|css)$|\.bundle\.js$/;
var sh = (c, cwd, t = 300000) => {
  const r = spawnSync5(c, { cwd, shell: true, encoding: "utf8", timeout: t, maxBuffer: 1e8, env: { ...process.env, CI: "1", NO_COLOR: "1" } });
  return { code: r.status ?? 1, out: `${r.stdout ?? ""}${r.stderr ?? ""}` };
};
var hay = (c, cwd) => sh(WIN ? `where ${c}` : `command -v ${c}`, cwd, 1e4).code === 0;
function revisarTodo(cwd) {
  const files = listarArchivos(cwd).filter((f) => !IGN3.test(f) && existsSync3(join6(cwd, f)) && statSync3(join6(cwd, f)).size < 2000000);
  const L = [];
  let errores = 0;
  const t0 = Date.now(), TOPE = 90000;
  const aTiempo = () => Date.now() - t0 < TOPE;
  const corte = (n, total) => n < total ? ` (revisados ${n} de ${total}: se acabó el tiempo; usa skill_dey_verificar sobre lo cambiado)` : "";
  const falla = (titulo, det) => {
    errores += det.length || 1;
    L.push(`❌ ${titulo}`, ...det.slice(0, 10).map((d) => "   " + d.replace(cwd, "").slice(0, 200)), ...det.length > 10 ? [`   … y ${det.length - 10} más`] : []);
  };
  const php = files.filter((f) => f.endsWith(".php"));
  if (php.length && hay("php", cwd)) {
    const malos = [];
    let n = 0;
    for (const f of php) {
      if (!aTiempo())
        break;
      n++;
      const r = spawnSync5("php", ["-l", f], { cwd, encoding: "utf8", timeout: 20000 });
      for (const l of `${r.stdout ?? ""}${r.stderr ?? ""}`.split(/\r?\n/))
        if (/(Parse error|Fatal error|Errors parsing)/i.test(l) && !/No syntax errors/i.test(l))
          malos.push(l.trim());
    }
    malos.length ? falla(`PHP: ${malos.length} archivo(s) con error de sintaxis (de ${php.length})`, malos) : L.push(`✅ PHP: ${n} archivos sin errores de sintaxis${corte(n, php.length)}`);
  }
  const js = files.filter((f) => /\.(m?js|cjs)$/.test(f));
  if (js.length) {
    const malos = [];
    let n = 0;
    for (const f of js) {
      if (!aTiempo())
        break;
      n++;
      const x = errorJs(cwd, f);
      if (x)
        malos.push(`${f}: ${(x.split(/\r?\n/).find((l) => /Error/.test(l)) ?? "error").trim()}`);
    }
    malos.length ? falla(`JavaScript: ${malos.length} archivo(s) con error (de ${js.length})`, malos) : L.push(`✅ JavaScript: ${n} archivos sin errores de sintaxis${corte(n, js.length)}`);
  }
  const py = files.filter((f) => f.endsWith(".py"));
  const pyCmd = ["python3", "python", "py"].find((c) => sh(`${c} --version`, cwd, 1e4).code === 0);
  if (py.length && pyCmd) {
    const det = [];
    let n = 0;
    for (let i = 0;i < py.length && aTiempo(); i += 100) {
      const lote = py.slice(i, i + 100);
      n += lote.length;
      const r = spawnSync5(pyCmd, ["-m", "py_compile", ...lote], { cwd, encoding: "utf8", timeout: 120000 });
      if (r.status !== 0)
        det.push(...`${r.stdout ?? ""}${r.stderr ?? ""}`.split(/\r?\n/).filter((l) => /Error|File "/.test(l)));
    }
    det.length ? falla("Python: errores de sintaxis", det) : L.push(`✅ Python: ${n} archivos sin errores de sintaxis${corte(n, py.length)}`);
  }
  const json = files.filter((f) => f.endsWith(".json") && !/lock/.test(f) && !/tsconfig|jsconfig|\.vscode/.test(f));
  const jmalos = json.filter((f) => {
    try {
      JSON.parse(readFileSync5(join6(cwd, f), "utf8"));
      return false;
    } catch {
      return true;
    }
  });
  if (json.length)
    jmalos.length ? falla(`JSON inválido`, jmalos) : L.push(`✅ JSON: ${json.length} archivos válidos`);
  if (existsSync3(join6(cwd, "tsconfig.json")) && existsSync3(join6(cwd, "node_modules", "typescript"))) {
    const r = sh("npx --no-install tsc --noEmit -p .", cwd, 600000);
    r.code !== 0 ? falla("TypeScript: errores de tipos", r.out.split(/\r?\n/).filter((l) => /error TS\d+/.test(l))) : L.push("✅ TypeScript: 0 errores de tipos");
  }
  const eslintCfg = ["eslint.config.js", "eslint.config.mjs", "eslint.config.cjs", ".eslintrc", ".eslintrc.js", ".eslintrc.json", ".eslintrc.cjs"].some((f) => existsSync3(join6(cwd, f)));
  if (eslintCfg && existsSync3(join6(cwd, "node_modules", "eslint"))) {
    const r = sh("npx --no-install eslint . --quiet --format unix", cwd, 600000);
    r.code !== 0 ? falla("ESLint: errores", r.out.split(/\r?\n/).filter((l) => /:\d+:\d+:/.test(l))) : L.push("✅ ESLint: 0 errores");
  }
  if (existsSync3(join6(cwd, "vendor", "bin", "phpstan"))) {
    const r = sh("php vendor/bin/phpstan analyse --no-progress --error-format=raw", cwd, 600000);
    r.code !== 0 ? falla("PHPStan: errores", r.out.split(/\r?\n/).filter((l) => /:\d+:/.test(l))) : L.push("✅ PHPStan: 0 errores");
  }
  if (py.length && hay("ruff", cwd)) {
    const r = sh("ruff check . --quiet", cwd);
    r.code !== 0 ? falla("Ruff: errores", r.out.split(/\r?\n/).filter((l) => /:\d+:\d+:/.test(l))) : L.push("✅ Ruff: 0 errores");
  }
  const texto = files.filter((f) => /\.(m?[jt]sx?|cjs|vue|svelte|php|py|go|java|cs|rb|html|css|scss|sql|json|ya?ml|env\.example)$/.test(f));
  const conflictos = texto.filter((f) => /^(<{7}|={7}|>{7})( |$)/m.test(readFileSync5(join6(cwd, f), "utf8")));
  if (conflictos.length)
    falla("Marcas de conflicto de git sin resolver", conflictos);
  const depuracion = texto.filter((f) => !/test|spec/i.test(f) && /\b(debugger;|var_dump\(|dd\(|print_r\(\$|console\.log\(['"]DEBUG)/.test(readFileSync5(join6(cwd, f), "utf8")));
  if (depuracion.length)
    L.push(`⚠ restos de depuración (debugger/var_dump/dd): ${depuracion.slice(0, 6).join(", ")}`);
  L.unshift(`Revisión completa: ${files.length} archivos`);
  return { ok: errores === 0, lineas: L, errores };
}

// app/skill_dey-lib/adopcion.ts
import { existsSync as existsSync4, readFileSync as readFileSync6, statSync as statSync4 } from "node:fs";
import { join as join7 } from "node:path";
var IGN4 = /(^|[\\/])(node_modules|vendor|dist|build|\.git|\.skill_dey|coverage|\.venv|venv|__pycache__|\.next|storage|tests?|__tests__|spec)([\\/]|$)|\.min\.js$/i;
var leer4 = (p) => {
  try {
    return readFileSync6(p, "utf8");
  } catch {
    return "";
  }
};
var VALIDA = /\b(empty|isset|filter_var|validate|trim|strlen)\s*\(|['"][^'"\n]*\brequired\b[^'"\n]*['"]|\.required\s*\(|if\s*\(\s*!/g;
function analizar(cwd) {
  const files = listarArchivos(cwd).filter((f) => f && !IGN4.test(f) && /\.(php|m?[jt]sx?|cjs|vue|svelte|py|html|blade\.php|twig|sql)$/.test(f) && existsSync4(join7(cwd, f)) && statSync4(join7(cwd, f)).size < 1500000);
  const H = [];
  const add = (prioridad, tipo, texto, donde) => {
    if (donde.length)
      H.push({ prioridad, tipo, texto, donde: [...new Set(donde)].slice(0, 12) });
  };
  const cache = new Map;
  const lineas = (f) => {
    let l = cache.get(f);
    if (!l) {
      l = leer4(join7(cwd, f)).split(/\r?\n/);
      cache.set(f, l);
    }
    return l;
  };
  const buscar = (re, filtro = () => true, excluir) => {
    const r = [];
    for (const f of files.filter(filtro))
      lineas(f).forEach((l, i) => {
        if (re.test(l) && !(excluir && excluir.test(l)))
          r.push(`${f}:${i + 1}`);
      });
    return r;
  };
  const php = (f) => /\.php$/.test(f), js = (f) => /\.(m?[jt]sx?|cjs|vue|svelte)$/.test(f), py = (f) => f.endsWith(".py");
  add("CRÍTICO", "seguridad", "Inyección SQL: datos del usuario concatenados en consultas (usa consultas preparadas)", [
    ...buscar(/(query|execute|prepare|mysqli_query|pg_query|mysql_query)\s*\([^;]*(\$_(GET|POST|REQUEST|COOKIE)|["']\s*\.\s*\$\w+)/i, php, /\?\s*["']|bind_param|:\w+/),
    ...buscar(/(query|execute|mysqli_query|pg_query)\s*\(\s*(\$\w+\s*,\s*)?"[^"]*(SELECT|INSERT|UPDATE|DELETE|WHERE|VALUES)[^"]*\$\w+/i, php, /bind_param|prepare/i),
    ...buscar(/(query|execute|raw)\s*\(\s*[`'"][^`'"]*(SELECT|INSERT|UPDATE|DELETE)[^`]*(\$\{req\.|["']\s*\+\s*req\.)/i, js),
    ...buscar(/execute\s*\(\s*f?["'][^"']*(SELECT|INSERT|UPDATE|DELETE)[^"']*(\{|%s["']\s*%)/i, py)
  ]);
  add("ALTO", "seguridad", "XSS: se imprime entrada del usuario sin escapar (usa htmlspecialchars / escape de plantilla)", [...buscar(/(echo|print|<\?=)\s*[^;]*\$_(GET|POST|REQUEST|COOKIE)/i, php, /htmlspecialchars|htmlentities|intval|\(int\)|filter_var/i), ...buscar(/innerHTML\s*=\s*[^;]*(location|params|query|input|value)/i, js), ...buscar(/dangerouslySetInnerHTML/, js)]);
  add("ALTO", "seguridad", "Credenciales escritas en el código (muévelas a .env)", [
    ...buscar(/(new\s+mysqli|mysqli_connect|new\s+PDO|pg_connect|createConnection|createPool|mongoose\.connect)\s*\([^)]*["'][^"'\s]{4,}["'][^)]*["'][^"'\s$]{4,}["']/i, (f) => !/\.example|test|spec/i.test(f), /getenv|env\(|process\.env|\$_ENV/i),
    ...buscar(/(password|passwd|pwd|pass|secret|api[_-]?key|token)\s*[:=]>?\s*["'][^"'\s$]{4,}["']/i, (f) => !/\.example|test|spec/i.test(f), /getenv|env\(|process\.env|os\.environ|placeholder|example|changeme/i)
  ]);
  const conSesion = files.filter(php).filter((f) => /\$_SESSION\[|session_start\(|Auth::|->middleware\(['"]auth/.test(leer4(join7(cwd, f))));
  const paginas = files.filter((f) => php(f) && !/config|includes?|lib|clases?|models?|controllers?|migrations?|routes?|vendor|conexion|db\.php/i.test(f));
  if (conSesion.length >= 2)
    add("ALTO", "seguridad", "Páginas sin control de sesión mientras otras sí lo tienen (¿acceso sin login?)", paginas.filter((f) => !conSesion.includes(f) && !/login|logout|index|registro|register|recuperar|forgot|public|api[\\/]health/i.test(f) && /(echo|print|<\?=|<html|<form|<table|<div|json_encode)/i.test(leer4(join7(cwd, f)))));
  add("MEDIO", "seguridad", "Errores silenciados (@, catch vacío, error_reporting(0)): ocultan fallas reales", [...buscar(/(^|[^\w])@(\$\w+->|mysqli_|mysql_|pg_|file_|fopen|unlink|mkdir|json_)|error_reporting\(\s*0\s*\)/, php), ...buscar(/catch\s*(\([^)]*\))?\s*\{\s*\}/, js), ...buscar(/except\s*:\s*pass|except Exception\s*:\s*pass/, py)]);
  const estados = new Map;
  for (const f of files.filter((f) => php(f) || js(f) || py(f)))
    leer4(join7(cwd, f)).split(/\r?\n/).forEach((l, i) => {
      for (const m of l.matchAll(/(?:[=!]==?|case|in_array\([^,]+,|IN\s*\()\s*\[?\s*["']([A-Za-zÁÉÍÓÚáéíóúñÑ ]{3,25})["']/g)) {
        const k = m[1].toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").trim();
        if (!estados.has(k))
          estados.set(k, new Map);
        const v = estados.get(k);
        if (!v.has(m[1]))
          v.set(m[1], []);
        v.get(m[1]).push(`${f}:${i + 1}`);
      }
    });
  for (const [, variantes] of estados)
    if (variantes.size > 1)
      add("MEDIO", "lógica", `Mismo estado/valor escrito distinto (${[...variantes.keys()].map((x) => `"${x}"`).join(" vs ")}): comparaciones que fallan en silencio`, [...variantes.values()].flat());
  const requeridosFront = new Set;
  for (const f of files.filter((f) => /\.(html|php|vue|[jt]sx|blade\.php|twig)$/.test(f)))
    for (const m of lineas(f).join(`
`).matchAll(/<(?:input|select|textarea)[^>]*\brequired\b[^>]*>/gi)) {
      const n = m[0].match(/name=["']([\w\[\]]+)["']/)?.[1];
      if (n)
        requeridosFront.add(n.replace(/\[\]$/, ""));
    }
  const usados = new Map, validados = new Set;
  for (const f of files.filter((f) => php(f) || js(f) || py(f)))
    lineas(f).forEach((l, i) => {
      for (const m of l.matchAll(/\$_(?:POST|REQUEST)\[['"](\w+)['"]\]|req\.body\.(\w+)|request\.(?:form|json)\[['"](\w+)['"]\]/g)) {
        const n = m[1] ?? m[2] ?? m[3];
        if (n && !usados.has(n))
          usados.set(n, `${f}:${i + 1}`);
      }
      for (const v of l.matchAll(VALIDA))
        for (const w of l.slice(v.index ?? 0).match(/\w+/g) ?? [])
          validados.add(w);
    });
  const sinValidarBack = [...requeridosFront].filter((n) => usados.has(n) && !validados.has(n)).map((n) => `${n} (${usados.get(n)})`);
  add("MEDIO", "lógica", "Campos obligatorios validados solo en el navegador (el servidor los acepta vacíos)", sinValidarBack);
  add("MEDIO", "lógica", "Cálculos de dinero/cantidades con float o redondeo intermedio (posibles descuadres)", [...buscar(/\b(round|toFixed|number_format)\s*\([^)]*\)\s*[\+\-\*\/]/, (f) => php(f) || js(f)), ...buscar(/parseFloat\([^)]*(precio|valor|total|monto|litros|cantidad)/i, js)]);
  add("BAJO", "lógica", "Reglas marcadas como pendientes en el código (TODO/FIXME/HACK)", buscar(/\b(TODO|FIXME|HACK|XXX)\b/));
  if (!existsSync4(join7(cwd, ".env.example")) && !existsSync4(join7(cwd, ".env.sample")))
    add("MEDIO", "calidad", "Sin .env.example: la configuración no está documentada ni separada del código", ["(raíz del proyecto)"]);
  const grandes = files.filter((f) => !f.endsWith(".sql")).filter((f) => leer4(join7(cwd, f)).split(`
`).length > 400).map((f) => `${f} (${leer4(join7(cwd, f)).split(`
`).length} líneas)`);
  add("BAJO", "calidad", "Archivos muy grandes (difíciles de mantener; dividir al tocarlos)", grandes);
  if (!files.some((f) => /test|spec/i.test(f)))
    add("MEDIO", "calidad", "La app no tiene pruebas automáticas: se crearán pruebas de humo de los flujos principales", ["(proyecto)"]);
  const orden = { "CRÍTICO": 0, ALTO: 1, MEDIO: 2, BAJO: 3 };
  return H.sort((a, b) => orden[a.prioridad] - orden[b.prioridad]);
}

// app/skill_dey-lib/empalme.ts
import { spawnSync as spawnSync9 } from "node:child_process";
import { existsSync as existsSync8, readFileSync as readFileSync10, writeFileSync as writeFileSync6, mkdirSync as mkdirSync7, statSync as statSync5, readdirSync as readdirSync4 } from "node:fs";
import { join as join13, basename as basename5 } from "node:path";

// app/skill_dey-lib/procesos.ts
import { spawn as spawn3, spawnSync as spawnSync8 } from "node:child_process";
import { existsSync as existsSync7, readFileSync as readFileSync8, mkdirSync as mkdirSync5, writeFileSync as writeFileSync4, readdirSync as readdirSync3 } from "node:fs";
import { join as join11, basename as basename4 } from "node:path";

// app/skill_dey-lib/navegador.ts
import { existsSync as existsSync5, mkdirSync as mkdirSync3 } from "node:fs";

// app/skill_dey-lib/rutas.ts
import { join as join8 } from "node:path";
import { homedir } from "node:os";
var ocDir = (...p) => join8(process.env.OPENCODE_CONFIG_DIR || join8(homedir(), ".config", "opencode"), ...p);
var sdDir = (...p) => ocDir("skill_dey", ...p);
var memoriaGlobal = (...p) => join8(process.env.SKILL_DEY_MEMORIA_GLOBAL || sdDir(), ...p);

// app/skill_dey-lib/navegador.ts
import { join as join9 } from "node:path";
import { homedir as homedir2 } from "node:os";
import { spawn, spawnSync as spawnSync6 } from "node:child_process";
var WIN2 = process.platform === "win32";
function rutaChrome() {
  const env = process.env.SKILL_DEY_CHROMIUM;
  if (env && existsSync5(env))
    return env;
  const H = homedir2(), E = process.env;
  const c = process.platform === "darwin" ? ["Google Chrome.app/Contents/MacOS/Google Chrome", "Microsoft Edge.app/Contents/MacOS/Microsoft Edge", "Brave Browser.app/Contents/MacOS/Brave Browser", "Chromium.app/Contents/MacOS/Chromium"].flatMap((a) => ["/Applications/" + a, join9(H, "Applications", a)]) : WIN2 ? [E.PROGRAMFILES, E["PROGRAMFILES(X86)"], E.LOCALAPPDATA].filter(Boolean).flatMap((b) => [
    join9(b, "Google", "Chrome", "Application", "chrome.exe"),
    join9(b, "Microsoft", "Edge", "Application", "msedge.exe"),
    join9(b, "BraveSoftware", "Brave-Browser", "Application", "brave.exe")
  ]) : ["/usr/bin/google-chrome", "/usr/bin/google-chrome-stable", "/opt/google/chrome/chrome", "/usr/bin/microsoft-edge", "/usr/bin/brave-browser", "/usr/bin/chromium", "/usr/bin/chromium-browser", "/snap/bin/chromium"];
  return c.find((p) => {
    try {
      return existsSync5(p);
    } catch {
      return false;
    }
  }) ?? null;
}
function usarChrome() {
  const r = rutaChrome();
  if (r)
    process.env.SKILL_DEY_CHROMIUM = r;
  return r;
}
function perfilChrome() {
  const d = sdDir("chrome-perfil");
  try {
    mkdirSync3(d, { recursive: true });
  } catch {}
  return d;
}
async function chromeAbierto(puerto = 9222) {
  for (const h of ["127.0.0.1", "localhost"]) {
    try {
      const r = await fetch(`http://${h}:${puerto}/json/version`, { signal: AbortSignal.timeout(1500) });
      if (r.ok)
        return `http://${h}:${puerto}`;
    } catch {}
  }
  return null;
}
function comoAbrirChrome(puerto = 9222) {
  const exe = rutaChrome() ?? (WIN2 ? "chrome.exe" : "google-chrome");
  if (WIN2)
    return `Start-Process "${exe}" -ArgumentList '--remote-debugging-port=${puerto}','--user-data-dir="${perfilChrome()}"'`;
  return `"${exe}" --remote-debugging-port=${puerto} --user-data-dir="${perfilChrome()}"`;
}
var ACCION_PELIGROSA = /(elimin|borr|delete|remove|destroy|quitar|anular|\bbaja\b|dar[-_ ]de[-_ ]baja|vaciar|truncate|drop|reset|logout|log-out|signout|salir|cerrar[-_ ]?(sesion|sesión|caja|mes|periodo|período)|desactiv|cancel|papelera|trash|purge|limpiar|install|setup|migrat|seed|import|aprob|approve|rechaz|reject|pagar|\bpay\b|pago|checkout|comprar|\bbuy\b|factur|invoice|emitir|transfer|despach|liquidar|n[oó]mina|payroll|reembols|refund|publicar|publish|notificar|notify|enviar[-_ ]?(correo|mail|masivo|a[-_ ]todos)|send[-_ ]?(mail|email)|confirmar[-_ ]?(pedido|compra|pago|despacho|orden)|\bdel\.php\b|\/del\b)/i;
function esLocal(url) {
  try {
    const h = new URL(url).hostname;
    return /^(localhost|127\.\d+\.\d+\.\d+|\[?::1\]?|0\.0\.0\.0)$/.test(h) || /\.(localhost|test)$/.test(h);
  } catch {
    return false;
  }
}
function matarArbol(pid) {
  if (!pid)
    return;
  try {
    if (WIN2)
      spawnSync6("taskkill", ["/pid", String(pid), "/T", "/F"], { windowsHide: true, timeout: 1e4 });
    else
      process.kill(-pid, "SIGKILL");
  } catch {}
  try {
    process.kill(pid, "SIGKILL");
  } catch {}
}
function correrProceso(cmd, args, cwd, ms = 170000, env = {}, senal) {
  return new Promise((ok) => {
    let stdout = "", stderr = "", fin = false, tiempoAgotado = false;
    let hijo;
    try {
      hijo = spawn(cmd, args, { cwd, env: { ...process.env, ...env }, detached: !WIN2, windowsHide: true, shell: WIN2 && cmd !== "node", stdio: ["ignore", "pipe", "pipe"] });
    } catch (e) {
      ok({ stdout: "", stderr: String(e?.message ?? e), status: 1, tiempoAgotado: false });
      return;
    }
    const cerrar = (status) => {
      if (fin)
        return;
      fin = true;
      clearTimeout(t);
      ok({ stdout, stderr, status, tiempoAgotado });
    };
    const t = setTimeout(() => {
      tiempoAgotado = true;
      matarArbol(hijo.pid);
      cerrar(null);
    }, ms);
    if (senal) {
      if (senal.aborted) {
        matarArbol(hijo.pid);
        cerrar(null);
      } else
        senal.addEventListener("abort", () => {
          matarArbol(hijo.pid);
          cerrar(null);
        }, { once: true });
    }
    hijo.stdout?.on("data", (d) => {
      if (stdout.length < 50000000)
        stdout += d;
    });
    hijo.stderr?.on("data", (d) => {
      if (stderr.length < 200000)
        stderr += d;
    });
    hijo.on("error", (e) => {
      stderr += String(e?.message ?? e);
      cerrar(1);
    });
    hijo.on("close", (c) => cerrar(c));
  });
}
async function correrShell(cmd, cwd, ms = 120000, env = {}, senal) {
  const r = await new Promise((ok) => {
    let stdout = "", stderr = "", fin = false, tiempoAgotado = false;
    let hijo;
    try {
      hijo = spawn(cmd, { cwd, env: { ...process.env, ...env }, shell: true, detached: !WIN2, windowsHide: true, stdio: ["ignore", "pipe", "pipe"] });
    } catch (e) {
      ok({ stdout: "", stderr: String(e?.message ?? e), status: 1, tiempoAgotado: false });
      return;
    }
    const cerrar = (status) => {
      if (fin)
        return;
      fin = true;
      clearTimeout(t);
      ok({ stdout, stderr, status, tiempoAgotado });
    };
    const t = setTimeout(() => {
      tiempoAgotado = true;
      matarArbol(hijo.pid);
      cerrar(null);
    }, ms);
    if (senal) {
      if (senal.aborted) {
        matarArbol(hijo.pid);
        cerrar(null);
      } else
        senal.addEventListener("abort", () => {
          matarArbol(hijo.pid);
          cerrar(null);
        }, { once: true });
    }
    hijo.stdout?.on("data", (d) => {
      if (stdout.length < 50000000)
        stdout += d;
    });
    hijo.stderr?.on("data", (d) => {
      if (stderr.length < 2000000)
        stderr += d;
    });
    hijo.on("error", (e) => {
      stderr += String(e?.message ?? e);
      cerrar(1);
    });
    hijo.on("close", (c) => cerrar(c));
  });
  return { code: r.status ?? 1, out: `${r.stdout}${r.stderr}`.trimEnd(), timeout: r.tiempoAgotado };
}
var correrNodo = (script, cwd, ms = 170000, env = {}, senal) => correrProceso("node", [script], cwd, ms, env, senal);
var ABRIR_NAVEGADOR = `
const _CDP = process.env.SKILL_DEY_CDP || '', _VIS = process.env.SKILL_DEY_VISIBLE === '1', _EXE = process.env.SKILL_DEY_CHROMIUM || undefined;
let b = null, ctx = null, _propio = true;
if (_CDP) { b = await chromium.connectOverCDP(_CDP); ctx = b.contexts()[0] ?? await b.newContext(); _propio = false; }
else if (_VIS && process.env.SKILL_DEY_PERFIL) { ctx = await chromium.launchPersistentContext(process.env.SKILL_DEY_PERFIL, { executablePath: _EXE, headless: false, viewport: { width: 1366, height: 900 } }); }
else { b = await chromium.launch({ executablePath: _EXE, headless: !_VIS }); ctx = await b.newContext({ viewport: { width: 1366, height: 900 } }); }
const _cerrar = async () => { try { if (_propio) { if (b) await b.close(); else await ctx.close(); } } catch {} };`;

// app/skill_dey-lib/app.ts
import { spawn as spawn2, spawnSync as spawnSync7 } from "node:child_process";
import { existsSync as existsSync6, readFileSync as readFileSync7, mkdirSync as mkdirSync4, writeFileSync as writeFileSync3, readdirSync as readdirSync2 } from "node:fs";
import { join as join10, relative as relative2 } from "node:path";
import { tmpdir as tmpdir2 } from "node:os";
import { createServer } from "node:net";
var WIN3 = process.platform === "win32";
var PW_DIR = sdDir("playwright");
var puertoLibre = () => new Promise((ok) => {
  const s = createServer();
  s.listen(0, "127.0.0.1", () => {
    const p = s.address().port;
    s.close(() => ok(p));
  });
});
var esperar = (ms) => new Promise((r) => setTimeout(r, ms));
async function responde(url, ms = 45000) {
  const fin = Date.now() + ms;
  while (Date.now() < fin) {
    try {
      const r = await fetch(url, { signal: AbortSignal.timeout(3000) });
      return true;
    } catch {}
    await esperar(200);
  }
  return false;
}
function matar(p) {
  if (!p.pid)
    return;
  try {
    if (WIN3)
      spawnSync7("taskkill", ["/pid", String(p.pid), "/T", "/F"], { timeout: 8000 });
    else {
      try {
        process.kill(-p.pid, "SIGKILL");
      } catch {}
      try {
        process.kill(p.pid, "SIGKILL");
      } catch {}
    }
  } catch {
    try {
      p.kill("SIGKILL");
    } catch {}
  }
}
function routerPhp() {
  const f = join10(tmpdir2(), "skill_dey-router.php");
  writeFileSync3(f, `<?php
$ruta = urldecode(parse_url($_SERVER["REQUEST_URI"], PHP_URL_PATH) ?? "/");
$archivo = $_SERVER["DOCUMENT_ROOT"] . $ruta;
if (is_file($archivo) || is_file(rtrim($archivo, "/") . "/index.php")) return false;
if (!preg_match('/\\.[A-Za-z0-9]+$/', $ruta) && is_file($_SERVER["DOCUMENT_ROOT"] . "/index.php")) return false;
http_response_code(404); echo "404 no encontrado: " . htmlspecialchars($ruta);
`);
  return f;
}
function docrootPhp(cwd) {
  return ["public", "public_html", "www", "htdocs", "web"].map((d) => join10(cwd, d)).find(existsSync6) ?? cwd;
}
async function iniciarApp(cwd) {
  const pkg = (() => {
    try {
      return JSON.parse(readFileSync7(join10(cwd, "package.json"), "utf8"));
    } catch {
      return null;
    }
  })();
  const puerto = await puertoLibre();
  const env = { ...process.env, PORT: String(puerto), BROWSER: "none", CI: "1", NODE_ENV: "development" };
  let cmd = "", como = "";
  if (pkg?.scripts?.dev) {
    cmd = `npm run dev -- --port ${puerto}`;
    como = "npm run dev";
  } else if (pkg?.scripts?.start) {
    cmd = "npm start";
    como = "npm start";
  } else if (existsSync6(join10(cwd, "artisan"))) {
    cmd = `php artisan serve --port=${puerto}`;
    como = "php artisan serve";
  } else if (existsSync6(join10(cwd, "manage.py"))) {
    cmd = `${WIN3 ? "python" : "python3"} manage.py runserver 127.0.0.1:${puerto}`;
    como = "django runserver";
  } else if (existsSync6(join10(cwd, "composer.json")) || existsSync6(join10(cwd, "index.php")) || existsSync6(join10(docrootPhp(cwd), "index.php")) || readdirSync2(docrootPhp(cwd)).some((f) => f.endsWith(".php"))) {
    cmd = `php -d display_errors=1 -d error_reporting=E_ALL -d log_errors=1 -S 127.0.0.1:${puerto} -t "${docrootPhp(cwd)}" "${routerPhp()}"`;
    como = "php -S";
  } else if (existsSync6(join10(cwd, "index.html"))) {
    cmd = `${WIN3 ? "python" : "python3"} -m http.server ${puerto} --bind 127.0.0.1`;
    como = "servidor estático";
  }
  if (!cmd)
    return null;
  const log = [];
  const p = spawn2(cmd, { cwd, shell: true, env, detached: !WIN3, stdio: ["ignore", "pipe", "pipe"] });
  const captar = (b) => {
    const t = b.toString();
    log.push(t);
    if (log.length > 200)
      log.shift();
  };
  p.stdout?.on("data", captar);
  p.stderr?.on("data", captar);
  const fin = Date.now() + (Number(process.env.SKILL_DEY_ARRANQUE_MS) || 22000);
  let url = `http://127.0.0.1:${puerto}`;
  while (Date.now() < fin) {
    const m = log.join("").match(/https?:\/\/(localhost|127\.0\.0\.1|0\.0\.0\.0|\[::1?\]):(\d+)/);
    const pto = m?.[2] ?? String(puerto);
    const errores = () => log.join("").split(/\r?\n/).filter((l) => /(PHP )?(Fatal error|Parse error|Warning|Notice|Deprecated)|Traceback|Error:|Exception|UnhandledPromise|ERR!/i.test(l) && !/DeprecationWarning: The `punycode`/.test(l)).map((l) => l.trim().slice(0, 200));
    for (const h of ["127.0.0.1", "[::1]", "localhost"]) {
      const u = `http://${h}:${pto}`;
      if (await responde(u, 1500)) {
        url = u;
        return { url, detener: () => matar(p), como, errores };
      }
    }
    if (p.exitCode !== null)
      break;
  }
  matar(p);
  return null;
}
var preparando = null;
function asegurarPlaywright(cwdProyecto) {
  const chrome = usarChrome();
  if (existsSync6(join10(cwdProyecto, "node_modules", "playwright")))
    return join10(cwdProyecto, "package.json");
  const pj = join10(PW_DIR, "package.json");
  if (existsSync6(join10(PW_DIR, "node_modules", "playwright")))
    return pj;
  if (!preparando)
    preparando = (async () => {
      try {
        mkdirSync4(PW_DIR, { recursive: true });
        if (!existsSync6(pj))
          writeFileSync3(pj, JSON.stringify({ name: "skill-dey-playwright", private: true }));
        const i = await correrShell("npm i playwright @axe-core/playwright --no-audit --no-fund --silent", PW_DIR, 300000, { PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD: "1" });
        if (i.code !== 0) {
          preparando = null;
          return false;
        }
        if (!chrome)
          await correrShell("npx playwright install chromium", PW_DIR, 600000);
        return true;
      } catch {
        preparando = null;
        return false;
      }
    })();
  return null;
}
function rutasAProbar(cwd, archivos) {
  const root = docrootPhp(cwd);
  const php = archivos.filter((f) => f.endsWith(".php") && !/vendor|config|includes?|lib|src\/|app\/|clases?|models?|controllers?/i.test(f)).map((f) => "/" + relative2(root, join10(cwd, f)).replace(/\\/g, "/")).filter((r) => !r.startsWith("/.."));
  const html = archivos.filter((f) => f.endsWith(".html")).map((f) => "/" + relative2(root, join10(cwd, f)).replace(/\\/g, "/")).filter((r) => !r.startsWith("/.."));
  return [...new Set(["/", ...php, ...html])].slice(0, 6);
}

// app/skill_dey-lib/procesos.ts
var WIN4 = process.platform === "win32";
var DEV = /\b(node|nodemon|tsx|ts-node|vite|next|nuxt|npm|npx|pnpm|yarn|bun|deno|php|php-cgi|artisan|python\d*|uvicorn|gunicorn|flask|java|dotnet|ruby|rails|go|air|webpack|esbuild)\b/i;
var SISTEMA = /\b(systemd|launchd|explorer|svchost|wininit|lsass|csrss|winlogon|services\.exe|kernel|WindowServer|loginwindow|sshd|postgres|mysqld|mariadbd|redis-server|mongod|docker|com\.docker|opencode)\b/i;
function sh2(c, t = 8000) {
  const r = spawnSync8(c, { shell: true, encoding: "utf8", timeout: t });
  return r.status === 0 ? r.stdout : "";
}
function escuchando() {
  const out = [];
  if (WIN4) {
    const tareas = new Map;
    for (const l of sh2("tasklist /fo csv /nh").split(/\r?\n/)) {
      const m = l.match(/^"([^"]+)","(\d+)"/);
      if (m)
        tareas.set(Number(m[2]), m[1]);
    }
    for (const l of sh2("netstat -ano").split(/\r?\n/)) {
      const m = l.match(/^\s*TCP\s+\S+:(\d+)\s+(0\.0\.0\.0:0|\[::\]:0|\*:\*)\s+\S+\s+(\d+)\s*$/i);
      if (m)
        out.push({ puerto: Number(m[1]), pid: Number(m[3]), cmd: tareas.get(Number(m[3])) ?? "" });
    }
  } else {
    for (const l of sh2("lsof -nP -iTCP -sTCP:LISTEN 2>/dev/null").split(`
`).slice(1)) {
      const c = l.trim().split(/\s+/);
      const pid = Number(c[1]);
      const port = Number(l.match(/:(\d+) \(LISTEN\)/)?.[1]);
      if (!pid || !port)
        continue;
      out.push({ pid, puerto: port, cmd: c[0] });
    }
    if (!out.length)
      for (const l of sh2("ss -ltnp 2>/dev/null").split(`
`)) {
        const m = l.match(/:(\d+)\s.*pid=(\d+)/);
        if (m)
          out.push({ puerto: Number(m[1]), pid: Number(m[2]), cmd: "" });
      }
    const pids = [...new Set(out.map((p) => p.pid))];
    if (pids.length)
      for (const l of sh2(`ps -o pid=,command= -p ${pids.join(",")}`).split(`
`)) {
        const m = l.trim().match(/^(\d+)\s+(.*)$/);
        if (m) {
          for (const p of out)
            if (p.pid === Number(m[1]))
              p.cmd = m[2];
        }
      }
  }
  const vistos = new Set;
  return out.filter((p) => {
    const k = p.pid + ":" + p.puerto;
    if (vistos.has(k))
      return false;
    vistos.add(k);
    return true;
  });
}
function matarArbol2(pid) {
  try {
    if (WIN4) {
      spawnSync8("taskkill", ["/pid", String(pid), "/T", "/F"], { timeout: 8000 });
      return;
    }
    try {
      process.kill(-pid, "SIGKILL");
    } catch {}
    try {
      process.kill(pid, "SIGKILL");
    } catch {}
  } catch {}
}
var leer5 = (p) => {
  try {
    return readFileSync8(p, "utf8");
  } catch {
    return "";
  }
};
function puertoEnv(dir) {
  const env = leer5(join11(dir, ".env")) + `
` + leer5(join11(dir, ".env.example"));
  const m = env.match(/^\s*(?:APP_)?PORT\s*=\s*(\d{2,5})/m) ?? env.match(/^\s*(?:SERVER|API|BACKEND)_PORT\s*=\s*(\d{2,5})/m);
  return m ? Number(m[1]) : undefined;
}
function detectar(dir, nombre) {
  const pkg = (() => {
    try {
      return JSON.parse(leer5(join11(dir, "package.json")));
    } catch {
      return null;
    }
  })();
  const deps = { ...pkg?.dependencies ?? {}, ...pkg?.devDependencies ?? {} };
  const front = !!(deps.vite || deps.react || deps.vue || deps.next || deps.nuxt || deps["@angular/core"] || deps.svelte) && !deps.express && !deps.fastify && !deps["@nestjs/core"];
  const tipo = /front|client|web|ui/i.test(nombre) || front ? "frontend" : /back|server|api/i.test(nombre) || deps.express || deps.fastify || deps["@nestjs/core"] ? "backend" : "app";
  if (pkg?.scripts?.dev || pkg?.scripts?.start) {
    const puerto = puertoEnv(dir) ?? (deps.vite ? 5173 : deps.next ? 3000 : deps["@angular/core"] ? 4200 : deps.nuxt ? 3000 : 3000);
    return { nombre, dir, tipo, cmd: pkg.scripts.dev ? "npm run dev" : "npm start", puerto };
  }
  if (existsSync7(join11(dir, "artisan")))
    return { nombre, dir, tipo: "backend", cmd: "php artisan serve --port=" + (puertoEnv(dir) ?? 8000), puerto: puertoEnv(dir) ?? 8000 };
  if (existsSync7(join11(dir, "manage.py")))
    return { nombre, dir, tipo: "backend", cmd: `${WIN4 ? "python" : "python3"} manage.py runserver ${puertoEnv(dir) ?? 8000}`, puerto: puertoEnv(dir) ?? 8000 };
  const docroot = ["public", "public_html", "www", "htdocs"].map((d) => join11(dir, d)).find(existsSync7) ?? dir;
  const hayPhp = (() => {
    try {
      return readdirSync3(docroot).some((f) => f.endsWith(".php"));
    } catch {
      return false;
    }
  })();
  if (existsSync7(join11(docroot, "index.php")) || existsSync7(join11(dir, "composer.json")) || hayPhp) {
    const p = puertoEnv(dir) ?? 8000;
    return { nombre, dir, tipo: "app", cmd: `php -d display_errors=1 -d error_reporting=E_ALL -S 127.0.0.1:${p} -t "${docroot}" "${routerPhp()}"`, puerto: p };
  }
  return null;
}
function servicios(cwd) {
  const s = [];
  const raizPhp = (() => {
    try {
      return existsSync7(join11(cwd, "composer.json")) || readdirSync3(cwd).some((f) => f.endsWith(".php"));
    } catch {
      return false;
    }
  })();
  for (const d of ["backend", "server", "api", "back", "servidor", "frontend", "client", "web", "front", "cliente", "app"]) {
    const x = existsSync7(join11(cwd, d)) ? detectar(join11(cwd, d), d) : null;
    if (x && !(raizPhp && x.cmd.includes(" -S ") && !existsSync7(join11(cwd, d, "composer.json"))))
      s.push(x);
  }
  if (!s.length) {
    const r = detectar(cwd, basename4(cwd));
    if (r)
      s.push(r);
  }
  return s.sort((a, b) => (a.tipo === "backend" ? 0 : a.tipo === "app" ? 1 : 2) - (b.tipo === "backend" ? 0 : b.tipo === "app" ? 1 : 2));
}
var ERR = /(\bError\b|Exception|Traceback|EADDRINUSE|ECONNREFUSED|ERR!|Unhandled|Fatal error|Parse error|PHP Warning|PHP Notice|Deprecated:|Cannot find module|Module not found|failed to compile|SyntaxError|TypeError|ReferenceError|SQLSTATE|password authentication failed|ER_ACCESS_DENIED|Segmentation fault)/i;
var RUIDO = /(DeprecationWarning: The `punycode`|ExperimentalWarning|Browserslist: caniuse-lite is outdated|0 errors?\b|without errors)/i;
var esperar2 = (ms) => new Promise((r) => setTimeout(r, ms));
function conTiempo(p, ms, fallback) {
  return new Promise((res) => {
    let listo = false;
    const t = setTimeout(() => {
      if (!listo) {
        listo = true;
        res(fallback);
      }
    }, ms);
    t.unref?.();
    p.then((v) => {
      if (!listo) {
        listo = true;
        clearTimeout(t);
        res(v);
      }
    }).catch(() => {
      if (!listo) {
        listo = true;
        clearTimeout(t);
        res(fallback);
      }
    });
  });
}
async function responde2(url) {
  try {
    await fetch(url, { signal: AbortSignal.timeout(2500) });
    return true;
  } catch {
    return false;
  }
}
async function urlQueResponde(puerto) {
  for (const h of ["127.0.0.1", "[::1]", "localhost"]) {
    const u = `http://${h}:${puerto}`;
    if (await responde2(u))
      return u;
  }
  return null;
}
var PROCS = (cwd) => join11(cwd, ".skill_dey", "procesos.json");
var nuestros = (cwd) => {
  try {
    const j = JSON.parse(readFileSync8(PROCS(cwd), "utf8"));
    return Array.isArray(j) ? j : [];
  } catch {
    return [];
  }
};
var anotar = (cwd, x) => {
  try {
    mkdirSync5(join11(cwd, ".skill_dey"), { recursive: true });
    writeFileSync4(PROCS(cwd), JSON.stringify([...nuestros(cwd).filter((y) => y.servicio !== x.servicio), x], null, 1));
  } catch {}
};
function pgidDe(pid) {
  if (WIN4)
    return 0;
  const m = sh2(`ps -o pgid= -p ${Number(pid)}`, 4000).trim();
  return Number(m) || 0;
}
function sigueSiendoNuestro(pid, cmd = "") {
  if (!pid || pid === process.pid)
    return false;
  const clave = (cmd.match(/[\w.-]+/g) ?? []).filter((w) => w.length > 2).slice(0, 3);
  const coincide = (linea) => (clave.length ? clave.every((w) => linea.includes(w)) : DEV.test(linea)) && !SISTEMA.test(linea);
  if (WIN4) {
    const t = sh2(`wmic process where ProcessId=${Number(pid)} get CommandLine /format:list`, 6000) || sh2(`tasklist /fi "PID eq ${Number(pid)}" /fo csv /nh`, 6000);
    return /\S/.test(t) && !/INFO:|No hay tareas|No tasks/i.test(t) && (clave.length ? clave.some((w) => t.includes(w)) : DEV.test(t)) && !SISTEMA.test(t);
  }
  const l = sh2(`ps -o pgid=,command= -p ${Number(pid)}`, 4000).trim();
  const m = l.match(/^(\d+)\s+(.*)$/);
  return !!m && Number(m[1]) === pid && coincide(m[2]);
}
function detenerNuestros(cwd) {
  const r = [];
  for (const x of nuestros(cwd))
    if (x.pid && !x.ajeno && sigueSiendoNuestro(Number(x.pid), String(x.cmd ?? ""))) {
      matarArbol2(Number(x.pid));
      r.push(`detenido ${x.servicio} (PID ${x.pid})`);
    }
  return r;
}
async function arranqueLimpio(cwd, espera = Number(process.env.SKILL_DEY_ARRANQUE_MS) || 22000, solo) {
  const topeTotal = Date.now() + Math.min(espera * 3 + 1e4, 90000);
  const notas = [], lista = [];
  for (const s of solo ?? servicios(cwd)) {
    const ocupan = escuchando().filter((x) => x.puerto === s.puerto);
    if (ocupan.length) {
      const previos = new Set(nuestros(cwd).filter((x) => !x.ajeno).map((x) => Number(x.pid)));
      const nuestro = ocupan.every((x) => previos.has(x.pid) || previos.has(pgidDe(x.pid)));
      const u = await urlQueResponde(s.puerto);
      if (nuestro) {
        for (const x of ocupan)
          matarArbol2(x.pid);
      } else if (u) {
        lista.push({ s, url: u, ok: true, errores: [], detener: () => {} });
        anotar(cwd, { servicio: s.nombre, tipo: s.tipo, url: u, ok: true, puerto: s.puerto, ajeno: true });
        notas.push(`${s.nombre}: uso el servidor que ya tienes corriendo en ${u} (no lo detengo)`);
        continue;
      } else {
        lista.push({ s, url: `http://127.0.0.1:${s.puerto}`, ok: false, errores: [`el puerto ${s.puerto} lo ocupa "${ocupan[0].cmd.slice(0, 50)}" y no responde: no lo toco`], detener: () => {} });
        continue;
      }
    }
    const log = [];
    const p = spawn3(s.cmd, { cwd: s.dir, shell: true, detached: !WIN4, env: { ...process.env, BROWSER: "none", CI: "1", FORCE_COLOR: "0" }, stdio: ["ignore", "pipe", "pipe"] });
    const tomar = (b) => {
      log.push(b.toString());
      if (log.length > 400)
        log.shift();
    };
    anotar(cwd, { servicio: s.nombre, tipo: s.tipo, pid: p.pid, puerto: s.puerto, ok: false, cmd: s.cmd });
    p.stdout?.on("data", tomar);
    p.stderr?.on("data", tomar);
    let url = `http://127.0.0.1:${s.puerto}`, ok = false;
    const fin = Math.min(Date.now() + espera, topeTotal);
    while (Date.now() < fin) {
      const m = log.join("").match(/https?:\/\/(?:localhost|127\.0\.0\.1|0\.0\.0\.0|\[::1?\]):(\d+)/);
      if (/EADDRINUSE|address already in use|port .* (is )?(already )?in use/i.test(log.join(""))) {
        notas.push(`${s.nombre}: su puerto está ocupado por otro programa; no lo detengo (cámbialo o ciérralo tú)`);
        break;
      }
      const u = await urlQueResponde(m?.[1] ?? s.puerto);
      if (u) {
        url = u;
        ok = true;
        break;
      }
      if (p.exitCode !== null)
        break;
      await esperar2(200);
    }
    await esperar2(500);
    const errores = [...new Set(log.join("").split(/\r?\n/).filter((l) => ERR.test(l) && !RUIDO.test(l)).map((l) => l.trim().replace(cwd, "").slice(0, 200)))].slice(0, 8);
    const detener = () => {
      try {
        if (p.pid)
          matarArbol2(p.pid);
      } catch {}
    };
    const salida = log.join("").split(/\r?\n/).filter((l) => l.trim()).slice(-12).join(`
`).slice(-1500);
    lista.push({ s, url, ok, pid: p.pid, salida, errores: ok ? errores : [...errores, p.exitCode !== null ? `el proceso terminó (código ${p.exitCode})` : "no respondió a tiempo"].slice(0, 8), detener });
    if (!ok && s.tipo === "backend")
      notas.push(`backend "${s.nombre}" no subió: el frontend dependerá de él`);
  }
  for (const a of lista)
    if (a.pid)
      anotar(cwd, { servicio: a.s.nombre, tipo: a.s.tipo, url: a.url, ok: a.ok, pid: a.pid, puerto: a.s.puerto, cmd: a.s.cmd });
  return { lista, notas };
}

// app/skill_dey-lib/reglas.ts
import { readFileSync as readFileSync9, writeFileSync as writeFileSync5, mkdirSync as mkdirSync6 } from "node:fs";
import { join as join12 } from "node:path";
var VACUNAS_F = () => memoriaGlobal("VACUNAS_F().json");
var leerJ = (p, d) => {
  try {
    return JSON.parse(readFileSync9(p, "utf8"));
  } catch {
    return d;
  }
};
var vacunas = () => leerJ(VACUNAS_F(), []);
var archivoReglas = (cwd) => join12(cwd, ".skill_dey", "REGLAS.json");
var reglas = (cwd) => leerJ(archivoReglas(cwd), []);
function verificarReglas(cwd) {
  const l = reglas(cwd);
  if (!l.length)
    return { lineas: [], fallas: 0 };
  if (!conexion(cwd))
    return { lineas: [`⏭ reglas de negocio (${l.length}): sin conexión a BD en .env`], fallas: 0 };
  let fallas = 0;
  const malas = [], sinProbar = [];
  for (const r of l) {
    const c = contar(cwd, r.sql);
    if (!c.ok)
      sinProbar.push(`${r.texto} (${c.error})`);
    else if (c.n > 0) {
      fallas++;
      malas.push(`${r.texto}: ${c.n} registro(s) la incumplen`);
    }
  }
  return { lineas: [fallas ? `❌ reglas de negocio incumplidas:
${malas.map((m) => "   " + m).join(`
`)}` : `✅ reglas de negocio (${l.length - sinProbar.length}) se cumplen`, ...sinProbar.length ? [`⚠ reglas sin probar: ${sinProbar.join(" · ")}`] : []], fallas };
}
function listar(cwd) {
  const v = vacunas(), r = reglas(cwd), vr = verificarReglas(cwd);
  return [
    `**Reglas de negocio de esta app** (${r.length})`,
    ...r.length ? r.map((x, i) => `${i + 1}. ${x.texto} — \`${x.sql}\``) : ['(ninguna: dile a skill_dey las reglas de tu negocio, ej. "los litros nunca pueden ser negativos")'],
    ...vr.lineas,
    "",
    `**Vacunas activas en todas tus apps** (${v.length})`,
    ...v.length ? v.map((x, i) => `${i + 1}. ${x.texto} (${x.fecha})`) : ["(ninguna aún: se crean solas cuando skill_dey corrige un error que se puede detectar)"],
    "",
    "Quitar: `/skill_dey quitar-regla <n>` · `/skill_dey quitar-vacuna <n>`"
  ].join(`
`);
}

// app/skill_dey-lib/empalme.ts
var leer6 = (p) => {
  try {
    return readFileSync10(p, "utf8");
  } catch {
    return "";
  }
};
var nombres = (env) => env.split(/\r?\n/).map((l) => l.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=/)?.[1]).filter(Boolean);
function empalme(cwd) {
  const docs = documentar(cwd);
  const pkg = (() => {
    try {
      return JSON.parse(leer6(join13(cwd, "package.json")));
    } catch {
      return null;
    }
  })();
  const app = pkg?.name ?? basename5(cwd), fecha = new Date().toISOString().slice(0, 10);
  const negocio = leer6(join13(cwd, ".skill_dey", "NEGOCIO.md")).split(`
`).filter((l) => l.trim() && !l.startsWith("#") && !/…\s*$/.test(l)).slice(0, 15);
  const ejemplo = nombres(leer6(join13(cwd, ".env.example"))), reales = nombres(leer6(join13(cwd, ".env")));
  const faltan = reales.filter((n) => !ejemplo.includes(n));
  const srv = servicios(cwd), c = conexion(cwd);
  const pantallas = (leer6(join13(cwd, "docs", "MANUAL-USUARIO.md")).match(/^## .+$/gm) ?? []).map((h) => h.slice(3));
  const H = (() => {
    try {
      return analizar(cwd).filter((h) => h.prioridad === "CRÍTICO" || h.prioridad === "ALTO");
    } catch {
      return [];
    }
  })();
  const errores = (leer6(join13(cwd, ".skill_dey", "ERRORES-SITIO.md")).match(/^- \[ \] .+$/gm) ?? []).slice(0, 10);
  const pendientes = leer6(join13(cwd, ".skill_dey", "ESTADO.md")).split(`
`).filter((l) => /PAUSAD|PENDIENTE|pendiente|\[ \]/.test(l)).slice(0, 10);
  const log = spawnSync9("git", ["log", "--date=short", "--pretty=format:%ad · %s", "-25"], { cwd, encoding: "utf8", timeout: 20000 }).stdout?.trim() ?? "";
  const R = reglas(cwd);
  const doc = [
    `# Empalme — ${app}`,
    `Generado por skill_dey el ${fecha}. Documento de entrega para quien recibe la aplicación.`,
    "",
    "## 1. Qué es",
    ...negocio.length ? negocio : ["(Completar: para qué sirve la app, quién la usa y qué procesos del negocio soporta.)"],
    "",
    "## 2. Cómo instalarla y correrla",
    "Ver `docs/MANUAL-TECNICO.md` (instalación, comandos, rutas). Resumen:",
    ...srv.length ? srv.map((s) => `- ${s.tipo} "${s.nombre}": \`${s.cmd.replace(/ "[^"]*skill_dey-router\.php"/, "")}\` (carpeta \`${s.dir.replace(cwd, ".") || "."}\`, puerto ${s.puerto})`) : ["- (no se detectó cómo arrancarla automáticamente)"],
    "",
    "## 3. Configuración (.env)",
    `Variables necesarias (los VALORES no se incluyen; pedirlos a quien entrega): ${ejemplo.length ? ejemplo.map((n) => `\`${n}\``).join(", ") : "(sin .env.example)"}`,
    ...faltan.length ? [`⚠ Variables que existen en el .env pero NO están documentadas en .env.example: ${faltan.map((n) => `\`${n}\``).join(", ")}`] : [],
    "",
    "## 4. Base de datos",
    c ? `Motor: ${{ mysql: "MySQL/MariaDB", pg: "PostgreSQL", sqlite: "SQLite" }[c.motor]} · BD: \`${basename5(c.db)}\` · estructura en \`docs/DICCIONARIO-DATOS.md\` · instalación en \`database/instalacion.sql\`` : "Ver `docs/DICCIONARIO-DATOS.md` si existe.",
    ...R.length ? ["Reglas de negocio que se verifican solas:", ...R.map((r) => `- ${r.texto}`)] : [],
    "",
    "## 5. Pantallas",
    ...pantallas.length ? pantallas.map((p) => `- ${p}`) : ["(ver docs/MANUAL-USUARIO.md)"],
    "Detalle de cada una en `docs/MANUAL-USUARIO.md`.",
    "",
    "## 6. Pendientes y riesgos",
    ...pendientes.length ? ["Tareas pendientes:", ...pendientes] : [],
    ...errores.length ? ["Errores conocidos del sitio:", ...errores] : [],
    ...H.length ? ["Riesgos de seguridad detectados:", ...H.map((h) => `- [${h.prioridad}] ${h.texto} → ${h.donde.slice(0, 3).join(", ")}`)] : ["Sin riesgos críticos/altos detectados."],
    "",
    "## 7. Cambios recientes",
    ...log ? log.split(`
`).map((l) => `- ${l}`) : ["(sin historial de git)"],
    "",
    "## 8. Para quien recibe",
    "- Pedir: valores del `.env`, accesos al servidor y a la BD, usuarios administradores.",
    "- Con skill_dey: escribir `/skill_dey ayuda` en OpenCode; `/skill_dey revisar` antes de cualquier cambio.",
    `- Protecciones activas: ${vacunas().length} vacuna(s) contra errores conocidos, copia y deshacer en cada cambio.`,
    "",
    "## 9. Contactos",
    "(Completar: quién entrega, quién recibe, proveedores, soporte.)"
  ].join(`
`);
  const previo = (() => {
    try {
      return readFileSync10(join13(cwd, "docs", "EMPALME.md"), "utf8");
    } catch {
      return "";
    }
  })();
  const seccion = (t, h) => {
    const i = t.indexOf(h);
    if (i < 0)
      return null;
    const j = t.indexOf(`
## `, i + h.length);
    return t.slice(i, j < 0 ? t.length : j).trimEnd();
  };
  let final = doc;
  for (const h of ["## 1. Qué es", "## 9. Contactos"]) {
    const antes = previo && seccion(previo, h), ahora = seccion(final, h);
    if (antes && ahora && !/\(Completar/.test(antes))
      final = final.replace(ahora, () => antes);
  }
  mkdirSync7(join13(cwd, "docs"), { recursive: true });
  writeFileSync6(join13(cwd, "docs", "EMPALME.md"), final);
  return `✅ Paquete de empalme listo: docs/EMPALME.md (+ ${docs.replace("Documentación actualizada: ", "")})${faltan.length ? `
⚠ ${faltan.length} variable(s) del .env sin documentar en .env.example` : ""}
Completa a mano solo: "Qué es" (si quedó vacío) y "Contactos".`;
}

// app/skill_dey-lib/saber.ts
import { existsSync as existsSync9, readFileSync as readFileSync11, writeFileSync as writeFileSync7, mkdirSync as mkdirSync8, appendFileSync } from "node:fs";
import { join as join14 } from "node:path";
import { spawnSync as spawnSync10 } from "node:child_process";
function notasVersion(cwd) {
  const log = spawnSync10("git", ["log", "--date=short", "--pretty=format:%s", "-40"], { cwd, encoding: "utf8", timeout: 20000 }).stdout?.trim() ?? "";
  if (!log)
    return "Sin historial de git para generar notas.";
  const cambios = log.split(`
`).filter((l) => l && !/^(wip|merge|checkpoint|skill_dey:|fixup)/i.test(l));
  const cat = (re) => cambios.filter((c) => re.test(c)).map((c) => "- " + c.replace(/^(\w+)(\([^)]*\))?:\s*/, "")).slice(0, 15);
  const nuevo = cat(/^(feat|add|nuev|agrega|crea)/i), arreglo = cat(/^(fix|corrig|arregl|bug)/i);
  const otros = cambios.filter((c) => !/^(feat|add|nuev|agrega|crea|fix|corrig|arregl|bug)/i.test(c)).map((c) => "- " + c).slice(0, 10);
  const doc = [
    `# Novedades — ${new Date().toISOString().slice(0, 10)}`,
    "",
    ...nuevo.length ? ["## Nuevo", ...nuevo, ""] : [],
    ...arreglo.length ? ["## Correcciones", ...arreglo, ""] : [],
    ...otros.length ? ["## Otros cambios", ...otros] : []
  ].join(`
`);
  mkdirSync8(join14(cwd, "docs"), { recursive: true });
  const f = join14(cwd, "docs", "NOVEDADES.md"), propio = !existsSync9(f) || /Generado por skill_dey/.test(readFileSync11(f, "utf8"));
  const destino = propio ? f : join14(cwd, "docs", "NOVEDADES.skill_dey.md");
  writeFileSync7(destino, doc + `

<!-- Generado por skill_dey desde los commits -->
`);
  return `✅ Notas de versión en docs/${destino.split(/[\\/]/).pop()}:

` + doc;
}

// app/skill_dey-lib/extras.ts
import { spawnSync as spawnSync11 } from "node:child_process";
import { existsSync as existsSync10, readFileSync as readFileSync12, writeFileSync as writeFileSync8, statSync as statSync6, rmSync as rmSync2, openSync, readSync, closeSync } from "node:fs";
import { join as join15, basename as basename6, isAbsolute as isAbsolute3 } from "node:path";
var leer7 = (p) => {
  try {
    return readFileSync12(p, "utf8");
  } catch {
    return "";
  }
};
var sh3 = (c, cwd, t = 120000) => {
  const r = spawnSync11(c, { cwd, shell: true, encoding: "utf8", timeout: t, maxBuffer: 50000000 });
  return { code: r.status ?? 1, out: `${r.stdout ?? ""}${r.stderr ?? ""}` };
};
var hay2 = (c, cwd) => sh3(process.platform === "win32" ? `where ${c}` : `command -v ${c}`, cwd, 8000).code === 0;
var archivos2 = (cwd) => listarArchivos(cwd);
function formatear(cwd, soloCambiados = true, lista) {
  const files = lista ?? (soloCambiados ? (spawnSync11("git", ["-c", "core.quotepath=off", "diff", "--name-only", "HEAD"], { cwd, encoding: "utf8", timeout: 20000 }).stdout ?? "").split(/\r?\n/).filter(Boolean) : []);
  const existe = (...f) => f.some((x) => existsSync10(join15(cwd, x)));
  const qq = (f) => process.platform === "win32" ? `"${f}"` : `'${f.replace(/'/g, "'\\''")}'`;
  const r = [];
  const prettier = existe(".prettierrc", ".prettierrc.json", ".prettierrc.js", ".prettierrc.cjs", ".prettierrc.yaml", ".prettierrc.yml", "prettier.config.js", "prettier.config.cjs", "prettier.config.mjs") || /"prettier"\s*:/.test(leer7(join15(cwd, "package.json")));
  const js = files.filter((f) => /\.(m?[jt]sx?|cjs|vue|svelte|css|scss|json|html|md)$/.test(f));
  if (prettier && existsSync10(join15(cwd, "node_modules", ".bin", "prettier")) && (js.length || !soloCambiados)) {
    const t = sh3(`npx --no-install prettier --write ${soloCambiados ? js.map(qq).join(" ") : "."}`, cwd);
    if (t.code === 0)
      r.push("prettier");
  }
  const php = files.filter((f) => f.endsWith(".php"));
  if (php.length || !soloCambiados) {
    if (existe("vendor/bin/php-cs-fixer") && existe(".php-cs-fixer.php", ".php-cs-fixer.dist.php")) {
      const t = sh3(`php vendor/bin/php-cs-fixer fix --quiet --path-mode=intersection ${soloCambiados ? "-- " + php.map(qq).join(" ") : ""}`, cwd);
      if (t.code === 0)
        r.push("php-cs-fixer");
    } else if (existe("vendor/bin/pint") && existe("pint.json", ".pint.json", "artisan")) {
      const t = sh3(`php vendor/bin/pint --quiet ${soloCambiados ? php.map(qq).join(" ") : ""}`, cwd);
      if (t.code === 0)
        r.push("laravel pint");
    }
  }
  const py = files.filter((f) => f.endsWith(".py"));
  const pyproject = leer7(join15(cwd, "pyproject.toml"));
  if (py.length || !soloCambiados) {
    if (/\[tool\.black\]/.test(pyproject) && hay2("black", cwd)) {
      const t = sh3(`black -q ${soloCambiados ? py.map(qq).join(" ") : "."}`, cwd);
      if (t.code === 0)
        r.push("black");
    } else if ((/\[tool\.ruff/.test(pyproject) || existe("ruff.toml", ".ruff.toml")) && hay2("ruff", cwd)) {
      sh3(`ruff format ${soloCambiados ? py.map(qq).join(" ") : "."}`, cwd);
      r.push("ruff format");
    }
  }
  return r.length ? `✅ formato aplicado (${r.join(" · ")})` : "⏭ formato: el proyecto no tiene formateador configurado (prettier/php-cs-fixer/pint/black/ruff)";
}
var VALIDA2 = /\b(empty|isset|filter_var|validate|trim|strlen)\s*\(|['"][^'"\n]*\brequired\b[^'"\n]*['"]|\.required\s*\(|if\s*\(\s*!/g;
function validacionServidor(cwd) {
  const req = new Set;
  for (const f of archivos2(cwd).filter((f) => /\.(html|php|vue|[jt]sx|blade\.php|twig)$/.test(f)))
    for (const m of leer7(join15(cwd, f)).matchAll(/<(?:input|select|textarea)[^>]*\brequired\b[^>]*>/gi)) {
      const n = m[0].match(/name=["']([\w[\]]+)["']/)?.[1];
      if (n)
        req.add(n.replace(/\[\]$/, ""));
    }
  if (!req.size)
    return "No hay campos obligatorios en formularios, o es una SPA (valida en el controlador de la API).";
  const usados = new Set, validados = new Set;
  for (const f of archivos2(cwd).filter((f) => /\.(php|m?[jt]s|py)$/.test(f)))
    for (const l of leer7(join15(cwd, f)).split(/\r?\n/)) {
      for (const m of l.matchAll(/\$_(?:POST|REQUEST)\[['"](\w+)['"]\]|req\.body\.(\w+)|request\.(?:form|json)\[['"](\w+)['"]\]/g))
        usados.add(m[1] ?? m[2] ?? m[3]);
      for (const v of l.matchAll(VALIDA2))
        for (const w of l.slice(v.index ?? 0).match(/\w+/g) ?? [])
          validados.add(w);
    }
  const sinValidar = [...req].filter((n) => usados.has(n) && !validados.has(n));
  if (!sinValidar.length)
    return "✅ validación de servidor: todos los campos obligatorios se validan en el backend.";
  const esLaravel = existsSync10(join15(cwd, "artisan")), esNode = existsSync10(join15(cwd, "package.json"));
  const ejemplo = esLaravel ? `$datos = $request->validate([
${sinValidar.map((n) => `  '${n}' => 'required',`).join(`
`)}
]);` : esNode ? `// con zod:
const esquema = z.object({
${sinValidar.map((n) => `  ${n}: z.string().min(1, "${n} es obligatorio"),`).join(`
`)}
});
const datos = esquema.parse(req.body);` : `foreach (['${sinValidar.join("','")}'] as $campo) {
  if (empty($_POST[$campo])) { http_response_code(422); exit("Falta: $campo"); }
}`;
  return `⚠ validación de servidor: estos campos obligatorios NO se validan en el backend (el servidor los acepta vacíos): ${sinValidar.join(", ")}
Agrega en el controlador:
${ejemplo}`;
}
function erroresProduccion(cwd) {
  const env = leer7(join15(cwd, ".env"));
  const candidatos = [
    env.match(/^\s*LOG_PATH\s*=\s*["']?([^"'\r\n]+)/m)?.[1],
    "storage/logs/laravel.log",
    "logs/error.log",
    "logs/app.log",
    "error_log",
    "php_errors.log",
    "var/log/app.log"
  ].filter(Boolean);
  const f = candidatos.map((c) => isAbsolute3(c) ? c : join15(cwd, c)).find((p) => {
    try {
      return statSync6(p).isFile();
    } catch {
      return false;
    }
  });
  if (!f)
    return "No encontré un archivo de log (define LOG_PATH en .env o dime la ruta). En producción con Sentry/Rollbar, pásame el acceso o el export.";
  const txt = (() => {
    try {
      const tam = statSync6(f).size, n = Math.min(tam, 400000), fd = openSync(f, "r"), b = Buffer.alloc(n);
      readSync(fd, b, 0, n, tam - n);
      closeSync(fd);
      return b.toString("utf8");
    } catch {
      return "";
    }
  })().split(/\r?\n/).slice(-400);
  const errs = txt.filter((l) => /(ERROR|CRITICAL|EMERGENCY|Fatal error|Uncaught|Exception|Stack trace|PHP Warning|SQLSTATE|\[error\])/i.test(l));
  const grupos = new Map;
  for (const e of errs) {
    const k = e.replace(/^\[[^\]]*\]\s*/, "").replace(/\d{4}-\d{2}-\d{2}[ T][\d:.]+/g, "").replace(/0x[0-9a-f]+|#\d+|:\d+/gi, "").trim().slice(0, 140);
    grupos.set(k, (grupos.get(k) ?? 0) + 1);
  }
  if (!grupos.size)
    return `✅ sin errores recientes en ${basename6(f)}.`;
  const orden = [...grupos.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10);
  return `Errores recientes en ${basename6(f)} (agrupados, más frecuentes primero):
` + orden.map(([e, n]) => `   ×${n} ${e}`).join(`
`) + `
Corrige por causa raíz el más frecuente primero (references/depuracion.md).`;
}

// app/skill_dey-lib/respaldo.ts
import { spawnSync as spawnSync12 } from "node:child_process";
import { existsSync as existsSync11, mkdirSync as mkdirSync9, readFileSync as readFileSync13, writeFileSync as writeFileSync9, copyFileSync as copyFileSync2, unlinkSync, readdirSync as readdirSync5, statSync as statSync7, lstatSync, rmSync as rmSync3 } from "node:fs";
import { join as join16, dirname, resolve, relative as relative3, isAbsolute as isAbsolute4 } from "node:path";
import { homedir as homedir3 } from "node:os";
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
  const r = spawnSync12("git", [...GITC, ...args], { cwd, encoding: "utf8", maxBuffer: 500000000, timeout: 120000, input, env: { ...process.env, ...ID, ...env } });
  return { ok: r.status === 0, out: (r.stdout ?? "").trim(), raw: r.stdout ?? "", err: (r.stderr ?? "").trim(), sinGit: !!r.error };
}
var lista0 = (s) => s.split("\x00").filter(Boolean);
var hayGit = (cwd) => !git(cwd, ["--version"]).sinGit;
var esRepo = (cwd) => git(cwd, ["rev-parse", "--is-inside-work-tree"]).out === "true";
var raiz = (cwd) => git(cwd, ["rev-parse", "--show-toplevel"]).out || cwd;
var esCarpetaPeligrosa = (p) => {
  const r = resolve(p);
  return r === resolve(homedir3()) || r === resolve("/") || /^[A-Za-z]:\\?$/.test(r);
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
  const gitDir = isAbsolute4(gd) ? gd : join16(root, gd);
  const clave = createHash("sha1").update(resolve(root) + "|" + prefijo).digest("hex").slice(0, 12);
  return { root, prefijo, gitDir, clave, spec: prefijo ? prefijo.replace(/\/$/, "") : "." };
}
var dentro = (f, prefijo) => !prefijo || f.startsWith(prefijo);
var REF = (c, grupo, ...resto) => ["refs/skill_dey", c.clave, grupo, ...resto].join("/");
function indice(gitDir, nombre) {
  const idx = join16(gitDir, nombre);
  try {
    if (existsSync11(idx + ".lock") && Date.now() - statSync7(idx + ".lock").mtimeMs > 120000)
      rmSync3(idx + ".lock", { force: true });
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
function listar2(c, grupo) {
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
  const ultima = listar2(c, grupo)[0];
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
    for (const vieja of listar2(c, "pasos").slice(MAX_FOTOS))
      git(c.root, ["update-ref", "-d", vieja.ref]);
    if (tipo === "cambio")
      archivarRehacer(c);
  }
  return { commit, ts };
}
function archivarRehacer(c) {
  for (const g of ["rehacer", "deshecho"])
    for (const f of listar2(c, g)) {
      git(c.root, ["update-ref", REF(c, "archivo", nuevoTs()), f.commit]);
      git(c.root, ["update-ref", "-d", f.ref]);
    }
  for (const vieja of listar2(c, "archivo").slice(MAX_ARCHIVO))
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
      return lstatSync(join16(c.root, f)).isDirectory();
    } catch {
      return false;
    }
  });
  if (choque)
    return no(`"${choque}" ahora es una carpeta y en la foto era un archivo; muévela o renómbrala y repite (no toco nada para no perder lo que tiene dentro)`);
  const existentes = [...blobs.keys()].filter((f) => {
    try {
      return lstatSync(join16(c.root, f)).isFile();
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
      unlinkSync(join16(c.root, f));
      borrados.push(f);
    } catch {}
  }
  return { ok: true, restaurados: cambiar.length, borrados };
}
var HITOS = (cwd) => join16(cwd, ".skill_dey", "HITOS.json");
var leerHitos = (cwd) => {
  try {
    const j = JSON.parse(readFileSync13(HITOS(cwd), "utf8"));
    return Array.isArray(j) ? j : [];
  } catch {
    return [];
  }
};
function checkpoint(cwd, nombre) {
  if (!nombre || !nombre.trim())
    return "dale un nombre, ej: /skill_dey checkpoint antes-de-pagos";
  if (!asegurarRepo(cwd))
    return "los checkpoints necesitan git (haz git init)";
  const f = fotoInterna(cwd, "pasos", "checkpoint", "hito: " + nombre);
  if (!f)
    return "no pude crear el checkpoint";
  const c = ctxGit(cwd);
  git(c.root, ["update-ref", REF(c, "hitos", nuevoTs()), f.commit]);
  const j = leerHitos(cwd).filter((h) => h.nombre !== nombre.trim());
  j.push({ nombre: nombre.trim(), commit: f.commit, ts: Date.now() });
  try {
    mkdirSync9(join16(cwd, ".skill_dey"), { recursive: true });
    writeFileSync9(HITOS(cwd), JSON.stringify(j, null, 1));
  } catch {}
  return `\uD83D\uDCCD Checkpoint "${nombre.trim()}" guardado. Vuelve con: /skill_dey volver ${nombre.trim()}`;
}
function listarHitos(cwd) {
  const j = leerHitos(cwd);
  if (!j.length)
    return "No hay checkpoints. Crea uno con /skill_dey checkpoint <nombre>.";
  return `\uD83D\uDCCD Checkpoints (vuelve con /skill_dey volver <nombre>):
` + j.slice().reverse().map((h) => `  · ${h.nombre} — ${new Date(h.ts).toLocaleString()}`).join(`
`);
}
function volver(cwd, nombre) {
  if (!esRepo(cwd))
    return "volver necesita git";
  const c = ctxGit(cwd);
  const j = leerHitos(cwd);
  const h = j.find((x) => x.nombre === (nombre || "").trim()) || (/^\d+$/.test((nombre || "").trim()) ? j.slice().reverse()[Number(nombre) - 1] : null);
  if (!h)
    return `no encuentro el checkpoint "${nombre}". Mira /skill_dey hitos`;
  if (!/^[0-9a-f]{7,64}$/i.test(String(h.commit)) || !git(c.root, ["cat-file", "-e", `${h.commit}^{commit}`]).ok)
    return `⛔ El checkpoint "${h.nombre}" ya no existe en git (¿copiaste el proyecto sin su .git?). No toqué nada.`;
  const seguro = fotoInterna(cwd, "rehacer", "antes-de-volver", `estado antes de volver a ${h.nombre}`, false);
  if (!seguro)
    return "⛔ No volví: no pude guardar primero el estado actual. No toqué nada.";
  const r = aplicar(c, h.commit);
  if (!r.ok) {
    git(c.root, ["update-ref", "-d", REF(c, "rehacer", seguro.ts)]);
    return `⛔ No volví: ${r.error}. Tus archivos quedaron como estaban.`;
  }
  return `⏮ Restaurado al checkpoint "${h.nombre}" (${new Date(h.ts).toLocaleString()}). ${r.restaurados} archivo(s)${r.borrados.length ? `, ${r.borrados.length} creados después eliminados` : ""}. Reversible con /skill_dey rehacer. (.env y BD no se tocan)`;
}

// app/skill_dey-lib/organizar.ts
import { readFileSync as readFileSync14 } from "node:fs";
import { join as join17, basename as basename7, extname, dirname as dirname2 } from "node:path";
var leer8 = (p) => {
  try {
    return readFileSync14(p, "utf8");
  } catch {
    return "";
  }
};
var IGN5 = /(^|[\\/])(node_modules|vendor|dist|build|\.git|\.skill_dey|coverage|\.venv|venv|__pycache__|\.next|storage|public[\\/]build|migrations?)([\\/]|$)|\.min\.|\.lock$/i;
var archivos3 = (cwd) => listarArchivos(cwd).filter((f) => !IGN5.test(f));
var COD = /\.(m?[jt]sx?|cjs|vue|svelte|php|py|go|java|cs|rb)$/;
function duplicados(cwd, files) {
  const vistos = new Map;
  for (const f of files.filter((f) => COD.test(f))) {
    const ls = leer8(join17(cwd, f)).split(/\r?\n/);
    for (let i = 0;i + 6 < ls.length; i += 6) {
      const bloque = ls.slice(i, i + 6).map((l) => l.trim()).filter(Boolean);
      if (bloque.length < 5)
        continue;
      const norm = bloque.join("\x01").replace(/["'`][^"'`]*["'`]/g, "S").replace(/\b\d+\b/g, "N").replace(/\s+/g, " ");
      if (norm.length < 80)
        continue;
      const k = norm;
      if (!vistos.has(k))
        vistos.set(k, []);
      vistos.get(k).push(`${f}:${i + 1}`);
    }
  }
  const destino = (f) => {
    const e = extname(f).toLowerCase();
    if (/\.php$/.test(e))
      return "app/Helpers/ (o includes/) como función/clase reutilizable";
    if (/\.py$/.test(e))
      return "utils.py como función reutilizable";
    if (/\.(m?[jt]sx?|cjs)$/.test(e))
      return /tsx?$/.test(e) && /[A-Z]/.test(basename7(f)[0] ?? "") ? "un componente compartido en src/components/ (o src/lib/)" : "src/lib/ (o utils/) como función exportada";
    return "un módulo común reutilizable";
  };
  const r = [];
  for (const [, locs] of vistos) {
    const arch = [...new Set(locs.map((l) => l.split(":")[0]))];
    if (locs.length >= 2 && arch.length >= 2) {
      const nombre = "comun" + (r.length + 1);
      r.push(`bloque repetido en ${locs.slice(0, 3).join(" ≈ ")}
     → PROPUESTA DRY: extrae ese bloque a ${destino(arch[0])}, nómbralo \`${nombre}()\` y reemplázalo en los ${arch.length} archivos. Hazlo con skill_dey_impacto + skill_dey_verificar (un cambio, con undo).`);
    }
  }
  return [...new Set(r)].slice(0, 8);
}
function huerfanos(cwd, files) {
  const cod = files.filter((f) => COD.test(f) && !/(index|app|main|server|autoload|bootstrap|routes?|web|api)\.[a-z]+$|(^|[\\/])(pages|views|screens|app)[\\/]/i.test(f));
  const citados = new Set;
  for (const f of files.filter((f) => /\.(m?[jt]sx?|cjs|vue|svelte|php|py|html|blade\.php|twig)$/.test(f)).slice(0, 8000))
    for (const m of leer8(join17(cwd, f)).slice(0, 1e6).matchAll(/['"\/]([\w.-]+?)(?:\.[a-z]+)?(?=['"\s)/])/g))
      citados.add(m[1]);
  return cod.filter((f) => {
    const base = basename7(f).replace(/\.[^.]+$/, "");
    return base.length > 2 && !citados.has(base);
  }).slice(0, 8);
}
function fueraDeLugar(cwd, files) {
  const r = [];
  for (const f of files.filter((f) => COD.test(f))) {
    const d = dirname2(f).toLowerCase(), t = leer8(join17(cwd, f)).slice(0, 4000);
    if (/(controller|controlador)/i.test(basename7(f)) && !/controller|controlador|routes?|app|src/i.test(d))
      r.push(`${f} parece un controlador fuera de controllers/`);
    if (/(SELECT |INSERT |new mysqli|new PDO|->query\()/i.test(t) && /(components?|views?|pages?|ui)[\\/]/.test(d))
      r.push(`${f} tiene SQL dentro de la capa visual → muévelo a un modelo/servicio`);
  }
  return [...new Set(r)].slice(0, 8);
}
function organizar(cwd) {
  const files = archivos3(cwd);
  const respaldo = foto(cwd, "pasos", "cambio", "antes de organizar (formato)");
  const fmt = formatear(cwd, false);
  const dup = duplicados(cwd, files), huer = huerfanos(cwd, files), lugar = fueraDeLugar(cwd, files);
  const grandes = files.filter((f) => COD.test(f) && leer8(join17(cwd, f)).split(`
`).length > 400).map((f) => `${f} (${leer8(join17(cwd, f)).split(`
`).length} líneas) → dividir`);
  const L = [
    `SKILL_DEY organizar · ${files.length} archivos`,
    "1) Indentación y estilo: " + fmt.replace(/^[✅⏭]\s*/, "") + (respaldo ? ' (reversible: escribe "deshaz")' : ""),
    dup.length ? `2) Reutilizar (código repetido):
` + dup.map((d) => "   - " + d).join(`
`) : "2) Reutilizar: sin duplicados evidentes ✅",
    lugar.length ? `3) Código fuera de su capa:
` + lugar.map((d) => "   - " + d).join(`
`) : "3) Capas: todo en su lugar ✅",
    grandes.length ? `4) Archivos muy grandes:
` + grandes.map((d) => "   - " + d).join(`
`) : "4) Tamaño de archivos: ok ✅",
    huer.length ? `5) Posibles huérfanos (revisar, NO borrar sin confirmar):
` + huer.map((d) => "   - " + d).join(`
`) : "5) Huérfanos: ninguno ✅",
    "",
    "El formato ya se aplicó. Lo demás (mover archivos, extraer funciones, dividir) hazlo con skill_dey_impacto antes y skill_dey_verificar después, un cambio a la vez, para no romper rutas ni imports. Si algo cambia de ruta, actualiza TODOS sus usos en la misma vuelta."
  ];
  return L.join(`
`);
}

// app/skill_dey-lib/pdf.ts
import { spawnSync as spawnSync13 } from "node:child_process";
import { readFileSync as readFileSync15, writeFileSync as writeFileSync10, existsSync as existsSync12, mkdirSync as mkdirSync10 } from "node:fs";
import { join as join18, basename as basename8 } from "node:path";
import { tmpdir as tmpdir3 } from "node:os";
var leer9 = (p) => {
  try {
    return readFileSync15(p, "utf8");
  } catch {
    return "";
  }
};
function mdAhtml(md) {
  const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const lineas = md.replace(/<!--[\s\S]*?-->/g, "").split(/\r?\n/);
  const out = [];
  let enTabla = false, enLista = false, enCode = false;
  const cerrar = () => {
    if (enLista) {
      out.push("</ul>");
      enLista = false;
    }
    if (enTabla) {
      out.push("</tbody></table>");
      enTabla = false;
    }
  };
  const inline = (s) => esc(s).replace(/`([^`]+)`/g, "<code>$1</code>").replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>").replace(/\[([^\]]+)\]\(([^)]+)\)/g, "$1");
  for (const l of lineas) {
    if (/^```/.test(l)) {
      cerrar();
      if (!enCode) {
        out.push("<pre><code>");
        enCode = true;
      } else {
        out.push("</code></pre>");
        enCode = false;
      }
      continue;
    }
    if (enCode) {
      out.push(esc(l));
      continue;
    }
    const t = l.trim();
    if (!t) {
      cerrar();
      continue;
    }
    const h = t.match(/^(#{1,4})\s+(.*)/);
    if (h) {
      cerrar();
      out.push(`<h${h[1].length}>${inline(h[2])}</h${h[1].length}>`);
      continue;
    }
    if (/^\|(.+)\|$/.test(t)) {
      const celdas = t.slice(1, -1).split("|").map((c) => c.trim());
      if (/^\|?[\s:-]+\|?$/.test(t.replace(/[^|:\- ]/g, "")) && celdas.every((c) => /^:?-+:?$/.test(c) || !c))
        continue;
      if (!enTabla) {
        out.push("<table><tbody>");
        enTabla = true;
        out.push("<tr>" + celdas.map((c) => `<th>${inline(c)}</th>`).join("") + "</tr>");
        continue;
      }
      out.push("<tr>" + celdas.map((c) => `<td>${inline(c)}</td>`).join("") + "</tr>");
      continue;
    } else if (enTabla) {
      out.push("</tbody></table>");
      enTabla = false;
    }
    const li = t.match(/^[-*]\s+(.*)/);
    if (li) {
      if (!enLista) {
        out.push("<ul>");
        enLista = true;
      }
      out.push(`<li>${inline(li[1])}</li>`);
      continue;
    }
    cerrar();
    out.push(`<p>${inline(t)}</p>`);
  }
  cerrar();
  if (enCode)
    out.push("</code></pre>");
  return out.join(`
`);
}
var MARCA = process.env.SKILL_DEY_MARCA || "";
function mdApdf(cwd, mdRel, titulo) {
  const mdPath = join18(cwd, mdRel);
  const md = leer9(mdPath);
  if (!md)
    return "";
  const pj = asegurarPlaywright(cwd);
  if (!pj)
    return "";
  const cuerpo = mdAhtml(md);
  const fecha = new Date().toLocaleDateString("es");
  const app = (() => {
    try {
      return JSON.parse(leer9(join18(cwd, "package.json"))).name;
    } catch {
      return basename8(cwd);
    }
  })();
  const html = `<!doctype html><html lang="es"><head><meta charset="utf-8"><style>
 *{box-sizing:border-box} body{font:13px/1.5 -apple-system,Segoe UI,Roboto,Arial,sans-serif;color:#1a2b3c;margin:0;padding:0}
 .marca{background:#0f766e;color:#fff;padding:10px 28px;font-size:12px;display:flex;justify-content:space-between}
 .cont{padding:16px 28px}
 h1{color:#0f766e;border-bottom:3px solid #0f766e;padding-bottom:6px;font-size:22px} h2{color:#115e59;margin-top:22px;font-size:17px;border-bottom:1px solid #d1d5db;padding-bottom:3px} h3{font-size:14px;color:#334155}
 table{border-collapse:collapse;width:100%;margin:10px 0;font-size:12px} th{background:#0f766e;color:#fff;text-align:left;padding:6px 8px} td{border:1px solid #cbd5e1;padding:5px 8px;vertical-align:top}
 tr:nth-child(even) td{background:#f1f5f9} code{background:#f1f5f9;padding:1px 4px;border-radius:3px;font-family:ui-monospace,Menlo,monospace;font-size:11px} pre{background:#0f172a;color:#e2e8f0;padding:10px;border-radius:6px;overflow:auto} pre code{background:none;color:inherit}
 ul{margin:6px 0 6px 18px} .pie{color:#64748b;font-size:10px;text-align:center;margin-top:24px;border-top:1px solid #e2e8f0;padding-top:6px}
</style></head><body>
 <div class="marca"><span>${MARCA || "SKILL_DEY"} · ${app}</span><span>${titulo} · ${fecha}</span></div>
 <div class="cont">${cuerpo}<div class="pie">Generado automáticamente por SKILL_DEY${MARCA ? " para " + MARCA : ""} · ${fecha}</div></div>
</body></html>`;
  const htmlPath = join18(tmpdir3(), `skill_dey-doc-${Date.now()}.html`);
  writeFileSync10(htmlPath, html);
  const outDir = join18(cwd, "docs", "pdf");
  mkdirSync10(outDir, { recursive: true });
  const pdfPath = join18(outDir, basename8(mdRel).replace(/\.md$/i, ".pdf"));
  const script = join18(tmpdir3(), `skill_dey-pdf-${Date.now()}.mjs`);
  writeFileSync10(script, `
import { createRequire } from 'node:module'; const require = createRequire(${JSON.stringify(pj)});
const { chromium } = require('playwright'); const b = await chromium.launch(process.env.SKILL_DEY_CHROMIUM ? { executablePath: process.env.SKILL_DEY_CHROMIUM } : {});
const p = await b.newPage(); await p.goto('file://' + ${JSON.stringify(htmlPath)}, { waitUntil: 'load' });
await p.pdf({ path: ${JSON.stringify(pdfPath)}, format: 'A4', printBackground: true, margin: { top: '12mm', bottom: '14mm', left: '12mm', right: '12mm' } });
await b.close();`);
  const r = spawnSync13(`node "${script}"`, { cwd, shell: true, encoding: "utf8", timeout: 120000 });
  return r.status === 0 && existsSync12(pdfPath) ? pdfPath : "";
}
function documentosPdf(cwd) {
  const docs = [
    ["docs/MANUAL-USUARIO.md", "Manual de usuario"],
    ["docs/MANUAL-TECNICO.md", "Manual técnico"],
    ["docs/DICCIONARIO-DATOS.md", "Diccionario de datos"],
    ["docs/EMPALME.md", "Empalme"]
  ];
  const hechos = [], faltan = [];
  for (const [rel, tit] of docs)
    if (existsSync12(join18(cwd, rel))) {
      const p = mdApdf(cwd, rel, tit);
      if (p)
        hechos.push("docs/pdf/" + basename8(p));
      else
        faltan.push(tit);
    }
  if (!hechos.length && !faltan.length)
    return "No hay documentos .md todavía; corre documentar primero.";
  return `PDF generados: ${hechos.join(" · ") || "ninguno"}${faltan.length ? ` · no se pudo: ${faltan.join(", ")} (¿sin navegador de pruebas?)` : ""}`;
}

// app/skill_dey-lib/seguridad.ts
import { existsSync as existsSync13, readFileSync as readFileSync16, statSync as statSync8 } from "node:fs";
import { join as join19 } from "node:path";
var IGN6 = /(^|[\\/])(node_modules|vendor|dist|build|\.git|\.skill_dey|coverage|\.venv|venv|__pycache__|\.next|storage|tests?|__tests__|spec|migrations?)([\\/]|$)|\.min\.js$/i;
var leer10 = (p) => {
  try {
    return readFileSync16(p, "utf8");
  } catch {
    return "";
  }
};
var php = (f) => /\.php$/.test(f);
var js = (f) => /\.(m?[jt]sx?|cjs)$/.test(f);
var web = (f) => /\.(php|m?[jt]sx?|vue|svelte|html|blade\.php|twig)$/.test(f);
function auditarSeguridad(cwd) {
  const files = listarArchivos(cwd).filter((f) => !IGN6.test(f) && web(f) && existsSync13(join19(cwd, f)) && statSync8(join19(cwd, f)).size < 1500000);
  const H = [];
  const add = (prioridad, texto, donde) => {
    if (donde.length)
      H.push({ prioridad, texto, donde: [...new Set(donde)].slice(0, 10) });
  };
  const buscar = (re, filtro, excluir) => {
    const r = [], g = new RegExp(re.source, re.flags.includes("g") ? re.flags : re.flags + "g");
    for (const f of files.filter(filtro)) {
      const t = leer10(join19(cwd, f));
      for (const m of t.matchAll(g)) {
        const i = m.index ?? 0;
        if (!excluir || !excluir.test(t.slice(Math.max(0, i - 1500), i + 1500))) {
          r.push(f);
          break;
        }
      }
    }
    return r;
  };
  add("CRÍTICO", "Contraseña guardada sin cifrar (usa password_hash/bcrypt/argon2)", [
    ...buscar(/(INSERT|UPDATE)[^;]*\b(password|passwd|clave|contrasena|contraseña)\b[^;]*(VALUES|=)[^;]*(\$_(POST|GET|REQUEST)|\$\w+)/i, php, /password_hash|bcrypt|hash\(/i),
    ...buscar(/\b(md5|sha1)\s*\(\s*\$?_?(POST|GET|REQUEST|password|pass|clave)/i, php),
    ...buscar(/password\s*:\s*(req\.body|input)\.\w+/i, js, /bcrypt|hash|argon/i)
  ]);
  const conSesion = files.filter(php).filter((f) => /\$_SESSION\[|session_start\(|Auth::|->middleware\(['"]auth|require.*auth/i.test(leer10(join19(cwd, f))));
  if (conSesion.length >= 2) {
    const paginas = files.filter((f) => php(f) && !/(^|[\\/])(config|includes?|lib|clases?|class|models?|controllers?|conexion|db|functions?|helpers?|api|vendor)([\\/]|\.|$)/i.test(f));
    add("ALTO", "Página sin verificar sesión mientras otras sí lo hacen (¿acceso sin login?)", paginas.filter((f) => !conSesion.includes(f) && !/login|logout|index|registro|register|recuperar|forgot|public|install/i.test(f) && /(echo|print|<\?=|<html|<form|<table|json_encode)/i.test(leer10(join19(cwd, f)))));
  }
  add("ALTO", "Formulario POST sin token CSRF (añade y valida un token)", buscar(/<form[^>]*method\s*=\s*["']?post/i, web, /csrf|(?<![A-Za-z])_token\b|authenticity_token|csrf_field|@csrf|nonce/i));
  add("ALTO", "Consulta por id tomado de la URL sin validar el dueño (otro usuario ve/edita datos ajenos)", [
    ...buscar(/WHERE\s+id\s*=\s*['"]?\s*(\.|\$\{?)?\s*\$_(GET|POST|REQUEST)\[/i, php, /user_id|usuario_id|owner|and\s+\w*user/i),
    ...buscar(/findByPk|findOne\(\s*\{?\s*id\s*:\s*(req\.params|req\.query)/i, js, /user|owner|where.*user/i)
  ]);
  add("ALTO", "Subida de archivos sin validar tipo ni tamaño", [
    ...buscar(/move_uploaded_file|\$_FILES\[/i, php, /mime_content_type|getimagesize|finfo|pathinfo\s*\(|\[\s*['"](type|size)['"]\s*\]|MAX_FILE_SIZE|in_array\s*\([^)]*(ext|extension|mime)/i),
    ...buscar(/multer|formidable|busboy|\.upload\(/i, js, /fileFilter|limits|mimetype|allowed/i)
  ]);
  add("ALTO", "Modo depuración o errores visibles al usuario (expón solo en desarrollo)", [
    ...buscar(/display_errors\s*[,=]\s*['"]?(1|On)|error_reporting\s*\(\s*E_ALL\s*\)/i, php),
    .../^\s*APP_DEBUG\s*=\s*["']?true/im.test(leer10(join19(cwd, ".env"))) && /^\s*APP_ENV\s*=\s*["']?prod/im.test(leer10(join19(cwd, ".env"))) ? [".env (APP_DEBUG=true con APP_ENV=production)"] : []
  ]);
  add("MEDIO", "CORS abierto a cualquier origen (*) (limita a los dominios necesarios)", [
    ...buscar(/Access-Control-Allow-Origin["'\s:,]+\*/i, web),
    ...buscar(/cors\(\s*\{\s*origin\s*:\s*["']?\*|cors\(\s*\)/i, js)
  ]);
  add("MEDIO", "Cookie sin HttpOnly/Secure (puede robarse desde el navegador)", buscar(/setcookie\s*\(|session_set_cookie_params\s*\(|res\.cookie\s*\(/i, web, /httponly|secure|samesite/i));
  const login = files.filter((f) => /login|signin|autenticar|authenticate/i.test(f) && /password|contrasena|contraseña|passwd/i.test(leer10(join19(cwd, f))));
  add("MEDIO", "Login sin límite de intentos (permite fuerza bruta)", login.filter((f) => !/intentos|attempts|rate.?limit|throttle|lockout|bloqueo|captcha/i.test(leer10(join19(cwd, f)))));
  const orden = { "CRÍTICO": 0, ALTO: 1, MEDIO: 2 };
  return H.sort((a, b) => orden[a.prioridad] - orden[b.prioridad]);
}
function resumenSeguridad(cwd) {
  const web2 = listarArchivos(cwd).filter((f) => web(f));
  if (!web2.length)
    return { lineas: ["⏭ seguridad: no encontré páginas/código web que revisar (¿carpeta vacía o fuera del proyecto?)"], criticos: 0 };
  const H = auditarSeguridad(cwd);
  if (!H.length)
    return { lineas: [`✅ seguridad: ${web2.length} archivo(s) revisados, sin huecos conocidos (sesión, contraseñas, CSRF, accesos, subidas, debug, CORS, cookies, fuerza bruta)`], criticos: 0 };
  const criticos = H.filter((h) => h.prioridad === "CRÍTICO").length;
  return { lineas: [`⚠ seguridad: ${H.length} hueco(s) → corrige los CRÍTICO/ALTO antes de entregar:`, ...H.map((h) => `   [${h.prioridad}] ${h.texto} → ${h.donde.slice(0, 3).join(", ")}`)], criticos };
}

// app/skill_dey-lib/testpro.ts
import { spawnSync as spawnSync16 } from "node:child_process";
import { writeFileSync as writeFileSync12, readFileSync as readFileSync19, mkdirSync as mkdirSync11, existsSync as existsSync16, rmSync as rmSync5 } from "node:fs";
import { join as join23, relative as relative4 } from "node:path";
import { tmpdir as tmpdir5 } from "node:os";

// app/skill_dey-lib/calidad.ts
import { writeFileSync as writeFileSync11, rmSync as rmSync4 } from "node:fs";
import { join as join20 } from "node:path";
import { tmpdir as tmpdir4 } from "node:os";
async function calidadWeb(base, pj, rutas) {
  const script = join20(tmpdir4(), `skill_dey-calidad-${Date.now()}.mjs`);
  writeFileSync11(script, `
import { createRequire } from 'node:module'; const require=createRequire(${JSON.stringify(pj)});
const { chromium } = require('playwright');
let AxeBuilder=null; try { AxeBuilder = require('@axe-core/playwright').default || require('@axe-core/playwright').AxeBuilder; } catch {}
const base=${JSON.stringify(base)}, rutas=${JSON.stringify(rutas)};
const b=await chromium.launch(process.env.SKILL_DEY_CHROMIUM?{executablePath:process.env.SKILL_DEY_CHROMIUM}:{});
const R=[];
// ACCESIBILIDAD (escritorio)
if(AxeBuilder){ const ctx=await b.newContext();
  for(const ruta of rutas){ const p=await ctx.newPage();
    try{ await p.goto(base+ruta,{waitUntil:'networkidle',timeout:30000});
      const res=await new AxeBuilder({page:p}).withTags(['wcag2a','wcag2aa']).analyze();
      const graves=res.violations.filter(v=>['serious','critical'].includes(v.impact));
      for(const v of graves.slice(0,4)) R.push('A11Y · '+ruta+' · '+v.id+' ('+v.impact+', '+v.nodes.length+' elem.): '+v.help.slice(0,70));
    }catch(e){ R.push('A11Y · '+ruta+' · no se pudo analizar'); } await p.close(); }
  await ctx.close();
} else R.push('A11Y · (axe-core no disponible; reinstala el navegador de skill_dey para activarlo)');
// RESPONSIVE (móvil 390x844): sin scroll horizontal
const mob=await b.newContext({viewport:{width:390,height:844},isMobile:true});
for(const ruta of rutas){ const p=await mob.newPage();
  try{ await p.goto(base+ruta,{waitUntil:'networkidle',timeout:30000});
    const over=await p.evaluate(()=>document.documentElement.scrollWidth>window.innerWidth+5);
    if(over){ const w=await p.evaluate(()=>document.documentElement.scrollWidth); R.push('RESPONSIVE · '+ruta+' · se desborda en móvil (ancho '+w+'px > 390): revisa anchos fijos/overflow'); }
  }catch{} await p.close(); }
await mob.close(); await b.close();
console.log('CAL:'+JSON.stringify(R));`);
  const r = await correrNodo(script, tmpdir4(), 600000);
  try {
    rmSync4(script, { force: true });
  } catch {}
  const line = (r.stdout ?? "").split(`
`).find((l) => l.startsWith("CAL:"));
  let R = [];
  try {
    R = JSON.parse(line.slice(4));
  } catch {
    return { lineas: [`⏭ calidad: no se pudo ejecutar (${(r.stderr ?? "").split(`
`)[0].slice(0, 80)})`], fallas: 0 };
  }
  const a11y = R.filter((x) => x.startsWith("A11Y ·") && !x.includes("no disponible")).length;
  const resp = R.filter((x) => x.startsWith("RESPONSIVE")).length;
  const fallas = R.filter((x) => /critical/.test(x)).length;
  const lineas = R.length ? [`\uD83D\uDD0E calidad: ${a11y} problema(s) de accesibilidad, ${resp} de responsive`, ...R.map((x) => "   " + x)] : [`✅ calidad: accesibilidad (WCAG A/AA) y responsive móvil sin problemas graves en ${rutas.length} ruta(s)`];
  return { lineas, fallas };
}
async function carga(base, rutas, usuarios = 20, rondas = 3) {
  if (!esLocal(base))
    return ["⏭ carga: solo contra tu app local (no se estresa producción)"];
  rutas = rutas.filter((r) => !ACCION_PELIGROSA.test(r));
  const objetivo = rutas.slice(0, 4);
  const L = [];
  for (const ruta of objetivo) {
    const tiempos = [];
    let errores = 0;
    for (let r = 0;r < rondas; r++) {
      await Promise.all(Array.from({ length: usuarios }, async () => {
        const t = Date.now();
        try {
          const resp = await fetch(base + ruta, { signal: AbortSignal.timeout(15000) });
          if (!resp.ok)
            errores++;
          await resp.text();
        } catch {
          errores++;
        }
        tiempos.push(Date.now() - t);
      }));
    }
    tiempos.sort((a, b) => a - b);
    const p = (q) => tiempos[Math.min(tiempos.length - 1, Math.floor(tiempos.length * q))] ?? 0;
    const total = usuarios * rondas;
    const pctErr = Math.round(errores / total * 100);
    L.push(`${pctErr > 5 ? "⚠" : "✅"} CARGA · ${ruta} · ${total} solicitudes (${usuarios} a la vez) · p50 ${p(0.5)}ms · p95 ${p(0.95)}ms · ${pctErr}% error`);
  }
  return L.length ? [`\uD83C\uDFCB carga (concurrencia):`, ...L.map((x) => "   " + x)] : [];
}

// app/skill_dey-lib/movil.ts
import { spawnSync as spawnSync14 } from "node:child_process";
import { existsSync as existsSync14, readFileSync as readFileSync17 } from "node:fs";
import { join as join21 } from "node:path";
function esMovil(cwd) {
  if (existsSync14(join21(cwd, "pubspec.yaml")))
    return "flutter";
  try {
    const pkg = JSON.parse(readFileSync17(join21(cwd, "package.json"), "utf8"));
    const deps = { ...pkg.dependencies, ...pkg.devDependencies };
    if (deps["react-native"] || deps["expo"])
      return "react-native";
  } catch {}
  return null;
}
function revisarMovil(cwd) {
  const tipo = esMovil(cwd);
  if (!tipo)
    return { ok: true, lineas: ["⏭ móvil: no es un proyecto Flutter ni React Native"], fallas: 0 };
  const run = (cmd) => spawnSync14(cmd, { cwd, shell: true, encoding: "utf8", timeout: 300000, maxBuffer: 50000000 });
  const L = [];
  let fallas = 0;
  const hay = (bin) => {
    try {
      return spawnSync14(bin, ["--version"], { shell: true, timeout: 15000 }).status === 0;
    } catch {
      return false;
    }
  };
  if (tipo === "flutter") {
    L.push("\uD83D\uDCF1 Flutter detectado");
    if (hay("flutter")) {
      const a = run("flutter analyze");
      const okA = a.status === 0;
      if (!okA)
        fallas++;
      L.push(`${okA ? "✅" : "❌"} flutter analyze${okA ? " sin problemas" : ": " + (a.stdout + a.stderr).split(`
`).filter((x) => /error|warning/i.test(x)).slice(0, 3).join(" · ").slice(0, 160)}`);
      if (existsSync14(join21(cwd, "test"))) {
        const t = run("flutter test");
        L.push(`${t.status === 0 ? "✅" : "❌"} flutter test`);
        if (t.status !== 0)
          fallas++;
      }
    } else
      L.push("⏭ no encuentro `flutter` en el PATH: instálalo para analizar y probar");
  } else {
    L.push("\uD83D\uDCF1 React Native detectado");
    const pkg = (() => {
      try {
        return JSON.parse(readFileSync17(join21(cwd, "package.json"), "utf8"));
      } catch {
        return {};
      }
    })();
    if (pkg.scripts?.lint) {
      const l = run("npm run lint --silent");
      L.push(`${l.status === 0 ? "✅" : "❌"} lint`);
      if (l.status !== 0)
        fallas++;
    }
    if (pkg.scripts?.test && !/no test specified/.test(pkg.scripts.test)) {
      const t = run("npm test --silent -- --watchAll=false");
      L.push(`${t.status === 0 ? "✅" : "❌"} pruebas (npm test)`);
      if (t.status !== 0)
        fallas++;
    }
    if (!pkg.scripts?.lint && !pkg.scripts?.test)
      L.push("⏭ sin scripts de lint/test en package.json: agrégalos para revisarlo");
    L.push("ℹ️ UI móvil: para capturas/flujos reales usa un emulador (Android Studio) o Detox; skill_dey revisa código y pruebas.");
  }
  return { ok: fallas === 0, fallas, lineas: L };
}

// app/skill_dey-lib/pro.ts
import { spawnSync as spawnSync15 } from "node:child_process";
import { existsSync as existsSync15, readFileSync as readFileSync18 } from "node:fs";
import { join as join22 } from "node:path";
var leer11 = (p) => {
  try {
    return readFileSync18(p, "utf8");
  } catch {
    return "";
  }
};
var tiene = (bin) => {
  try {
    return spawnSync15(bin, ["--version"], { shell: true, timeout: 15000 }).status === 0;
  } catch {
    return false;
  }
};
var run = async (cmd, cwd) => {
  const r = await correrShell(cmd, cwd, 300000);
  return { status: r.code, stdout: r.out, stderr: "" };
};
async function coberturaCodigo(cwd) {
  const pkg = (() => {
    try {
      return JSON.parse(leer11(join22(cwd, "package.json")));
    } catch {
      return null;
    }
  })();
  if (pkg?.scripts?.test && !/no test specified/.test(pkg.scripts.test)) {
    const s = pkg.scripts.test;
    const cmd = /vitest/.test(s) ? "npx vitest run --coverage" : /jest/.test(s) ? "npx jest --coverage" : /node\s+--test/.test(s) ? "node --test --experimental-test-coverage" : "npm test";
    const t = await (async () => {
      const r = await run(cmd, cwd);
      return r.stdout + r.stderr;
    })();
    const m = t.match(/all files\s*\|\s*(\d+(?:\.\d+)?)/i) || t.match(/(\d+(?:\.\d+)?)\s*%\s*(?:Stmts|statements|coverage|Lines)/i);
    return m ? `\uD83D\uDCC8 cobertura de código: ${m[1]}%` : "⏭ cobertura de código: el runner no reportó % (agrega c8/istanbul o la bandera --coverage)";
  }
  if (existsSync15(join22(cwd, "vendor", "bin", "phpunit")) || existsSync15(join22(cwd, "phpunit.xml"))) {
    const r = await (async () => {
      const a = await run(`${existsSync15(join22(cwd, "vendor", "bin", "phpunit")) ? "php vendor/bin/phpunit" : "phpunit"} --coverage-text`, cwd);
      return a;
    })();
    const m = r.stdout.match(/Lines:\s*(\d+(?:\.\d+)?)%/);
    return m ? `\uD83D\uDCC8 cobertura de código (PHP): ${m[1]}%` : "⏭ cobertura PHP: instala Xdebug o pcov para medir el %";
  }
  if (listarArchivos(cwd).some((f) => /test_.*\.py$|_test\.py$/.test(f))) {
    const r = await run(`${process.platform === "win32" ? "python" : "python3"} -m pytest --cov -q`, cwd);
    const m = r.stdout.match(/TOTAL\s+\d+\s+\d+\s+(\d+)%/);
    return m ? `\uD83D\uDCC8 cobertura de código (Python): ${m[1]}%` : "⏭ cobertura Python: instala pytest-cov";
  }
  return "⏭ cobertura de código: el proyecto no tiene runner de pruebas";
}
async function auditarDependencias(cwd) {
  const L = [];
  if (existsSync15(join22(cwd, "package.json")) && tiene("npm")) {
    const r = await run("npm audit --json", cwd);
    try {
      const j = JSON.parse(r.stdout);
      const v = j.metadata?.vulnerabilities || {};
      const tot = (v.critical || 0) + (v.high || 0) + (v.moderate || 0) + (v.low || 0);
      L.push(tot ? `${v.critical || v.high ? "❌" : "⚠"} deps npm: ${v.critical || 0} críticas · ${v.high || 0} altas · ${v.moderate || 0} medias (corrige con npm audit fix)` : "✅ deps npm: sin vulnerabilidades conocidas");
    } catch {
      L.push("⏭ npm audit: falta package-lock.json o no hay red");
    }
  }
  if (existsSync15(join22(cwd, "composer.json")) && tiene("composer")) {
    const r = await run("composer audit --format=plain", cwd);
    L.push(/no\s+security\s+vulnerabilit/i.test(r.stdout + r.stderr) ? "✅ deps PHP: sin vulnerabilidades" : "⚠ deps PHP: revisa `composer audit`");
  }
  if (existsSync15(join22(cwd, "requirements.txt")))
    L.push(tiene("pip-audit") ? /no known/i.test((await run("pip-audit", cwd)).stdout) ? "✅ deps Python: sin vulnerabilidades" : "⚠ deps Python: revisa `pip-audit`" : "⏭ deps Python: instala pip-audit para auditarlas");
  return L;
}
async function semgrep(cwd) {
  if (!tiene("semgrep"))
    return "⏭ semgrep no instalado (opcional): `pip install semgrep` para análisis estático estándar";
  const r = await run("semgrep --config auto --json --quiet", cwd);
  try {
    const j = JSON.parse(r.stdout);
    const n = j.results?.length || 0;
    const err = (j.results || []).filter((x) => x.extra?.severity === "ERROR").length;
    return n ? `${err ? "❌" : "⚠"} semgrep: ${n} hallazgo(s) (${err} de severidad alta)` : "✅ semgrep: sin hallazgos";
  } catch {
    return "⏭ semgrep: no se pudo analizar";
  }
}
function apiOpenapi(cwd, rutas) {
  const spec = ["openapi.json", "openapi.yaml", "swagger.json", join22("docs", "openapi.json")].map((f) => join22(cwd, f)).find(existsSync15);
  if (spec && /"auto \(completar\)"/.test(leer11(spec)))
    return "ℹ️ OpenAPI: solo está el borrador que generó skill_dey (docs/openapi.json); complétalo para que sirva";
  if (spec)
    return `✅ OpenAPI: encontrado ${spec.split(/[\\/]/).pop()} (sirve para probar endpoints y documentar la API)`;
  const esApi = listarArchivos(cwd).some((f) => /(^|[\\/])(api|routes)[\\/]/i.test(f)) || /express|fastify|@nestjs|fastapi|flask|laravel\/framework/.test(leer11(join22(cwd, "package.json")) + leer11(join22(cwd, "composer.json")) + leer11(join22(cwd, "requirements.txt")));
  if (!esApi)
    return "";
  return `ℹ️ OpenAPI: la API no tiene especificación (openapi.json). Si la quieres, pídela y la armo desde tus ${rutas.length || "las"} rutas (no la creo sin que la pidas)`;
}
async function docker(cwd) {
  const df = existsSync15(join22(cwd, "Dockerfile")), comp = existsSync15(join22(cwd, "docker-compose.yml")) || existsSync15(join22(cwd, "compose.yml"));
  if (!df && !comp)
    return "";
  if (!tiene("docker"))
    return "⏭ Docker: hay Dockerfile pero `docker` no está disponible aquí para validar el build";
  const r = comp ? await run("docker compose build", cwd) : await run("docker build -t skill_dey_check .", cwd);
  return r.status === 0 ? "✅ Docker: la imagen construye correctamente" : "❌ Docker: el build falla → " + (r.stdout + r.stderr).split(`
`).filter(Boolean).slice(-2).join(" ").slice(0, 160);
}
function sentryCheck(cwd) {
  const dep = /@sentry\/|sentry-sdk|sentry\/sentry|getsentry/.test(leer11(join22(cwd, "package.json")) + leer11(join22(cwd, "composer.json")) + leer11(join22(cwd, "requirements.txt")));
  const dsn = /SENTRY_DSN/.test(leer11(join22(cwd, ".env")) + leer11(join22(cwd, ".env.example")));
  if (dep && dsn)
    return "✅ Sentry: integrado (librería + SENTRY_DSN)";
  if (dep && !dsn)
    return "⚠ Sentry: la librería está pero falta SENTRY_DSN en .env";
  return "";
}
function i18nCheck(cwd) {
  const lib = /i18next|vue-i18n|react-intl|formatjs|next-intl/.test(leer11(join22(cwd, "package.json"))) || ["lang", "locales", join22("resources", "lang"), "i18n"].some((d) => existsSync15(join22(cwd, d)));
  return lib ? "\uD83C\uDF10 i18n: soporte de idiomas detectado (revisa que no queden textos quemados sin traducir en las vistas)" : "";
}
async function extrasPro(cwd, rutas) {
  const L = [await coberturaCodigo(cwd), ...await auditarDependencias(cwd), await semgrep(cwd), apiOpenapi(cwd, rutas), await docker(cwd), sentryCheck(cwd), i18nCheck(cwd)].filter(Boolean);
  if (L.some((x) => /Sentry|OpenAPI|i18n|Docker/.test(x)))
    L.push("ℹ️ nota: Sentry/OpenAPI/i18n son detección y Docker es validación de build — no auditoría profunda; úsalos como señal, no como garantía.");
  return L;
}

// app/skill_dey-lib/testpro.ts
var leer12 = (p) => {
  try {
    return readFileSync19(p, "utf8");
  } catch {
    return "";
  }
};
function escenarios(cwd) {
  const root = docrootPhp(cwd);
  const base = rutasAProbar(cwd, listarArchivos(cwd));
  const conForm = listarArchivos(cwd).filter((f) => /\.(php|html)$/i.test(f) && /<form/i.test(leer12(join23(cwd, f))) && !/vendor|config|includes?|conexion|node_modules/i.test(f)).map((f) => "/" + relative4(root, join23(cwd, f)).replace(/\\/g, "/")).filter((r) => !r.startsWith("/.."));
  const excluir = /\/docs\/|\/tests?\/|\.skill_dey|node_modules|\/vendor\//i;
  const rutas = [...new Set([...base, ...conForm])].filter((r) => !excluir.test(r) && !ACCION_PELIGROSA.test(r)).slice(0, 12);
  return rutas.map((r) => ({ ruta: r, form: conForm.includes(r) }));
}
function specEstandar(base, esc) {
  return `import { test, expect } from '@playwright/test'
// Suite generada por SKILL_DEY. Correr en CI:  npm i -D @playwright/test  &&  npx playwright test
const BASE = process.env.BASE_URL || ${JSON.stringify(base)}
const rutas = ${JSON.stringify(esc.map((e) => e.ruta))}
for (const ruta of rutas) {
  test('carga sin error: ' + ruta, async ({ page }) => {
    const errores: string[] = []
    page.on('pageerror', e => errores.push(String(e)))
    page.on('response', r => { if (r.status() >= 500) errores.push('HTTP ' + r.status() + ' ' + r.url()) })
    const resp = await page.goto(BASE + ruta, { waitUntil: 'networkidle' })
    expect(resp?.status() ?? 200, 'status de ' + ruta).toBeLessThan(400)
    expect(errores, 'sin errores de servidor/consola en ' + ruta).toEqual([])
  })
}
`;
}
function config(base) {
  return `import { defineConfig } from '@playwright/test'
export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30000,
  use: { baseURL: process.env.BASE_URL || ${JSON.stringify(base)}, headless: true },
  reporter: [['list']],
})
`;
}
async function smokeEnVivo(cwd, base, pj, esc) {
  const script = join23(tmpdir5(), `skill_dey-testpro-${Date.now()}.mjs`);
  writeFileSync12(script, `
import { createRequire } from 'node:module'; const require=createRequire(${JSON.stringify(pj)});
const { chromium } = require('playwright');
const base=${JSON.stringify(base)}, esc=${JSON.stringify(esc)};
const valido=(n,tipo)=>{ n=(n||'').toLowerCase();
  if(/correo|email|mail/.test(n)) return 'prueba@ejemplo.com';
  if(/tel|cel|phone|movil/.test(n)) return '3001234567';
  if(/fecha|date/.test(n)||tipo==='date') return '2026-01-15';
  if(/litros|cantidad|cant|stock|edad|numero|num|precio|valor|total|monto/.test(n)||tipo==='number') return '10';
  if(/nombre|name|cliente|usuario/.test(n)) return 'Juan Pérez';
  if(tipo==='password') return 'Prueba1234'; return 'Prueba'; };
const b=await chromium.launch(process.env.SKILL_DEY_CHROMIUM?{executablePath:process.env.SKILL_DEY_CHROMIUM}:{});
const ctx=await b.newContext(); ctx.on('dialog',d=>d.dismiss().catch(()=>{}));
const R=[];
for(const e of esc){ const p=await ctx.newPage(); const errs=[];
  p.on('pageerror',x=>errs.push(String(x).slice(0,80))); p.on('response',r=>{if(r.status()>=500)errs.push('HTTP '+r.status())});
  let status=0; try{ const resp=await p.goto(base+e.ruta,{waitUntil:'networkidle',timeout:30000}); status=resp?resp.status():200; }catch(ex){ R.push('FAIL · '+e.ruta+' · no cargó ('+String(ex).slice(0,50)+')'); await p.close(); continue; }
  if(status>=400){ R.push('FAIL · '+e.ruta+' · HTTP '+status); await p.close(); continue; }
  if(errs.length){ R.push('FAIL · '+e.ruta+' · '+errs.slice(0,2).join(' | ')); await p.close(); continue; }
  if(e.form){ try{ const campos=await p.$$eval('form:first-of-type [name]',els=>els.map(el=>({name:el.getAttribute('name'),tipo:(el.getAttribute('type')||el.tagName).toLowerCase()})).filter(c=>!['hidden','submit','button','reset','image','file'].includes(c.tipo)));
      for(const c of campos){ try{ await p.fill('form:first-of-type [name="'+c.name+'"]', valido(c.name,c.tipo)); }catch{} }
      R.push('PASS · '+e.ruta+' · carga ok + formulario llenable ('+campos.length+' campos)'); }catch{ R.push('PASS · '+e.ruta+' · carga ok'); } }
  else R.push('PASS · '+e.ruta+' · carga ok');
  await p.close(); }
await b.close(); console.log('RES:'+JSON.stringify(R));`);
  const r = await correrNodo(script, cwd, 600000);
  try {
    rmSync5(script, { force: true });
  } catch {}
  const line = (r.stdout ?? "").split(`
`).find((l) => l.startsWith("RES:"));
  try {
    return JSON.parse(line.slice(4));
  } catch {
    return [`⏭ smoke: no se pudo ejecutar (${(r.stderr ?? "").split(`
`)[0].slice(0, 90)})`];
  }
}
function correrUnitarias(cwd) {
  const pkg = (() => {
    try {
      return JSON.parse(readFileSync19(join23(cwd, "package.json"), "utf8"));
    } catch {
      return null;
    }
  })();
  const L = [];
  const run = (cmd) => spawnSync16(cmd, { cwd, shell: true, encoding: "utf8", timeout: 300000, maxBuffer: 50000000 });
  if (pkg?.scripts?.test && !/no test specified/.test(pkg.scripts.test)) {
    const r = run("npm test --silent");
    const ok = r.status === 0;
    L.push(`${ok ? "PASS" : "FAIL"} · unitarias (npm test): ${(r.stdout + r.stderr).split(`
`).filter((x) => /pass|fail|✓|✗|Tests:|test/i.test(x)).slice(-2).join(" ").slice(0, 120) || (ok ? "ok" : "revisa salida")}`);
  } else if (existsSync16(join23(cwd, "phpunit.xml")) || existsSync16(join23(cwd, "phpunit.xml.dist")) || existsSync16(join23(cwd, "vendor", "bin", "phpunit"))) {
    const r = run(existsSync16(join23(cwd, "vendor", "bin", "phpunit")) ? '"vendor/bin/phpunit"' : "phpunit");
    L.push(`${r.status === 0 ? "PASS" : "FAIL"} · unitarias PHP (phpunit)`);
  } else if (existsSync16(join23(cwd, "pytest.ini")) || existsSync16(join23(cwd, "tests")) && listarArchivos(cwd).some((f) => /test_.*\.py$|_test\.py$/.test(f))) {
    const r = run("python -m pytest -q");
    L.push(`${r.status === 0 ? "PASS" : "FAIL"} · unitarias Python (pytest)`);
  } else
    L.push("⏭ unitarias: el proyecto no tiene runner configurado (puedo generar un ejemplo si quieres)");
  return L;
}
async function pruebasProfesionales(cwd, url) {
  if (esMovil(cwd))
    return revisarMovil(cwd);
  const pj = asegurarPlaywright(cwd);
  let arr = null, app = null;
  try {
    let base = url;
    if (!base && servicios(cwd).length) {
      arr = await conTiempo(arranqueLimpio(cwd), 95000, null).catch(() => null);
      if (!arr)
        detenerNuestros(cwd);
      base = (arr?.lista.find((a) => a.ok && a.s.tipo === "frontend") ?? arr?.lista.find((a) => a.ok))?.url;
    }
    if (!base && !servicios(cwd).length)
      base = (app = await iniciarApp(cwd).catch(() => null))?.url;
    base = base || "http://localhost:3000";
    const esc = escenarios(cwd);
    const dir = join23(cwd, "tests", "e2e"), spec = join23(dir, "app.spec.ts");
    mkdirSync11(dir, { recursive: true });
    const propio = !existsSync16(spec) || /Generado por skill_dey/.test(readFileSync19(spec, "utf8"));
    const destino = propio ? spec : join23(dir, "skill_dey.spec.ts");
    writeFileSync12(destino, `// @ts-nocheck — Generado por skill_dey (no rompe tu build aunque no tengas @playwright/test)
` + specEstandar(base, esc));
    if (!existsSync16(join23(cwd, "playwright.config.ts")) && !existsSync16(join23(cwd, "playwright.config.js")))
      writeFileSync12(join23(cwd, "playwright.config.ts"), `// @ts-nocheck
` + config(base));
    const L = [`\uD83E\uDDEA Suite profesional generada: ${relative4(cwd, destino).replace(/\\/g, "/")} (${esc.length} escenarios) + playwright.config.ts`, "   Para correrla: `npm i -D @playwright/test && npx playwright test` (para CI agrega un paso que arranque tu app antes)"];
    let fallas = 0;
    const viva = pj && (app || arr?.lista?.some((a) => a.ok) || url);
    if (viva) {
      const res = await smokeEnVivo(cwd, base, pj, esc);
      fallas = res.filter((x) => x.startsWith("FAIL")).length;
      const ok = res.filter((x) => x.startsWith("PASS")).length;
      if (!ok && !fallas) {
        fallas = 1;
        L.push("❌ prueba en vivo: no se pudo ejecutar (navegador o app no disponibles)", ...res.map((x) => "   " + x));
      } else
        L.push(fallas ? `❌ prueba en vivo: ${fallas} fallo(s) de ${res.length}` : `✅ prueba en vivo: ${res.length} escenario(s) pasaron`, ...res.map((x) => "   " + x));
      L.push(`\uD83D\uDCCA cobertura funcional: ${ok}/${esc.length} rutas descubiertas ejercitadas (${Math.round(ok / Math.max(1, esc.length) * 100)}%)`);
      const cal = await calidadWeb(base, pj, esc.map((e) => e.ruta));
      fallas += cal.fallas;
      L.push(...cal.lineas);
      if (esLocal(base))
        L.push(...await carga(base, esc.map((e) => e.ruta)));
      else
        L.push("⏭ carga: solo contra tu app local (no se estresa producción)");
    } else
      L.push("⏭ prueba en vivo/calidad/carga: no pude levantar la app (pásame la url); la suite igual quedó en el repo");
    L.push(...correrUnitarias(cwd));
    L.push(...await extrasPro(cwd, esc.map((e) => e.ruta)));
    mkdirSync11(join23(cwd, ".skill_dey"), { recursive: true });
    writeFileSync12(join23(cwd, ".skill_dey", "PRUEBAS-PROFESIONALES.md"), [`# Testeo profesional · ${new Date().toISOString().slice(0, 16).replace("T", " ")}`, ...L].join(`
`));
    return { ok: fallas === 0, fallas, lineas: L };
  } finally {
    app?.detener?.();
    for (const a of arr?.lista ?? [])
      a.detener?.();
  }
}

// app/skill_dey-lib/video.ts
import { spawnSync as spawnSync17 } from "node:child_process";
import { writeFileSync as writeFileSync13, readFileSync as readFileSync20, mkdirSync as mkdirSync12, existsSync as existsSync17, unlinkSync as unlinkSync2, rmSync as rmSync6 } from "node:fs";
import { join as join24, basename as basename9, relative as relative5 } from "node:path";
import { tmpdir as tmpdir6 } from "node:os";
var leer13 = (p) => {
  try {
    return readFileSync20(p, "utf8");
  } catch {
    return "";
  }
};
var hayFfmpeg = () => {
  try {
    return spawnSync17("ffmpeg", ["-version"], { encoding: "utf8", timeout: 1e4, shell: true }).status === 0;
  } catch {
    return false;
  }
};
var SEG = 5;
function guion(cwd) {
  const root = docrootPhp(cwd);
  const archivos = listarArchivos(cwd).filter((f) => /\.(php|html)$/i.test(f) && !/vendor|config|includes?|conexion|node_modules|\/lib\/|\/docs\/|\/tests?\/|\.skill_dey/i.test(f));
  const pasos = [];
  const vistas = new Set;
  for (const f of archivos) {
    const src = leer13(join24(cwd, f));
    const r = "/" + relative5(root, join24(cwd, f)).replace(/\\/g, "/");
    if (r.startsWith("/..") || ACCION_PELIGROSA.test(r) || vistas.has(r))
      continue;
    const h1 = src.match(/<h1[^>]*>([^<]{2,60})</i)?.[1]?.trim() || src.match(/<title[^>]*>([^<]{2,60})</i)?.[1]?.trim();
    const campos = [...src.matchAll(/<(?:input|select|textarea)\b[^>]*name\s*=\s*["']([^"']+)/gi)].map((m) => m[1]).filter((v, i, a) => a.indexOf(v) === i).slice(0, 6);
    const tieneForm = /<form/i.test(src);
    const titulo = (h1 || basename9(f).replace(/\.(php|html)$/i, "")).slice(0, 60);
    const texto = tieneForm && campos.length ? `Completa los campos (${campos.join(", ")}) y usa el botón para guardar.` : `Pantalla "${titulo}".`;
    pasos.push({ ruta: r, titulo, texto });
    vistas.add(r);
    if (pasos.length >= 10)
      break;
  }
  if (!pasos.length)
    for (const r of rutasAProbar(cwd, listarArchivos(cwd)))
      pasos.push({ ruta: r, titulo: r === "/" ? "Inicio" : r, texto: `Pantalla ${r}.` });
  if (!pasos.length)
    pasos.push({ ruta: "/", titulo: "Inicio", texto: "Pantalla principal de la aplicación." });
  return pasos;
}
var pad = (n) => String(n).padStart(2, "0");
function srt(pasos) {
  const t = (s) => `00:${pad(Math.floor(s / 60))}:${pad(s % 60)},000`;
  return pasos.map((p, i) => `${i + 1}
${t(i * SEG)} --> ${t((i + 1) * SEG)}
${p.titulo}: ${p.texto}
`).join(`
`);
}
function htmlTutorial(pasos, titulo) {
  const datos = JSON.stringify(pasos.map((p) => ({ img: p.img, cap: `${p.titulo}: ${p.texto}` })));
  return `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Capacitación · ${titulo}</title><style>
:root{color-scheme:light dark}body{margin:0;font-family:system-ui,Arial,sans-serif;background:#111;color:#eee;display:flex;flex-direction:column;height:100vh}
#top{padding:8px 12px;font-weight:600}#wrap{flex:1;position:relative;overflow:hidden;background:#000}
#img{width:100%;height:100%;object-fit:contain}#cap{position:absolute;left:0;right:0;bottom:0;background:rgba(0,0,0,.7);color:#fff;padding:12px 16px;font-size:18px;line-height:1.4}
#bar{display:flex;gap:8px;align-items:center;padding:8px 12px;background:#1b1b1b}button{background:#2d6cdf;color:#fff;border:0;border-radius:6px;padding:8px 12px;font-size:14px;cursor:pointer}
#pos{margin-left:auto;font-size:13px;opacity:.8}</style></head><body>
<div id="top">\uD83C\uDF93 Capacitación — ${titulo} <span style="opacity:.6;font-weight:400">(subtitulado, ${pasos.length} pantallas)</span></div>
<div id="wrap"><img id="img" alt=""><div id="cap"></div></div>
<div id="bar"><button onclick="ir(-1)">◀ Anterior</button><button id="pp" onclick="toggle()">⏸ Pausa</button><button onclick="ir(1)">Siguiente ▶</button><span id="pos"></span></div>
<script>
const P=${datos},SEG=${SEG};let i=0,play=true,t;
const img=document.getElementById('img'),cap=document.getElementById('cap'),pos=document.getElementById('pos'),pp=document.getElementById('pp');
function pinta(){img.src=P[i].img;cap.textContent=P[i].cap;pos.textContent=(i+1)+' / '+P.length}
function ir(d){i=(i+d+P.length)%P.length;pinta()}
function ciclo(){if(play){clearTimeout(t);t=setTimeout(()=>{i=(i+1)%P.length;pinta();ciclo()},SEG*1000)}}
function toggle(){play=!play;pp.textContent=play?'⏸ Pausa':'▶ Reproducir';if(play)ciclo();else clearTimeout(t)}
pinta();ciclo();
</script></body></html>`;
}
async function capacitar(cwd, url) {
  const pj = asegurarPlaywright(cwd);
  if (!pj)
    return { ok: true, lineas: ["⏭ capacitar: falta el navegador de pruebas (sin red para instalarlo); se omitió"] };
  let arr = null, app = null;
  try {
    let base = url;
    if (!base && servicios(cwd).length) {
      arr = await conTiempo(arranqueLimpio(cwd), 95000, null).catch(() => null);
      if (!arr)
        detenerNuestros(cwd);
      base = (arr?.lista.find((a) => a.ok && a.s.tipo === "frontend") ?? arr?.lista.find((a) => a.ok))?.url;
    }
    if (!base && !servicios(cwd).length)
      base = (app = await iniciarApp(cwd).catch(() => null))?.url;
    if (!base)
      return { ok: true, lineas: ["⏭ capacitar: no pude levantar la app; pásame la url o levántala"] };
    const pasos = guion(cwd);
    const out = join24(cwd, "docs", "capacitacion");
    mkdirSync12(out, { recursive: true });
    const script = join24(tmpdir6(), `skill_dey-video-${Date.now()}.mjs`);
    writeFileSync13(script, `
import { createRequire } from 'node:module'; const require=createRequire(${JSON.stringify(pj)});
import { join } from 'node:path';
const { chromium } = require('playwright');
const base=${JSON.stringify(base)}, pasos=${JSON.stringify(pasos)}, out=${JSON.stringify(out)};
const b=await chromium.launch(process.env.SKILL_DEY_CHROMIUM?{executablePath:process.env.SKILL_DEY_CHROMIUM}:{});
const ctx=await b.newContext({viewport:{width:1280,height:800}}); ctx.on('dialog',d=>d.dismiss().catch(()=>{}));
const p=await ctx.newPage(); const hechos=[];
for(let i=0;i<pasos.length;i++){ const paso=pasos[i];
  try{ await p.goto(base+paso.ruta,{waitUntil:'networkidle',timeout:30000}); }catch{ try{ await p.goto(base+paso.ruta,{waitUntil:'domcontentloaded',timeout:15000}); }catch{ continue } }
  await p.evaluate(()=>{const f=document.querySelector('form'); if(f){ f.scrollIntoView({block:'center'}); f.style.outline='3px solid #e11'; }}).catch(()=>{});
  const nombre='paso-'+String(i+1).padStart(2,'0')+'.png';
  await p.screenshot({path:join(out,nombre),fullPage:false}).catch(()=>{});
  hechos.push({...paso,img:nombre});
}
await b.close(); console.log('PASOS:'+JSON.stringify(hechos));`);
    const r = await correrNodo(script, cwd, 600000);
    try {
      rmSync6(script, { force: true });
    } catch {}
    const line = (r.stdout ?? "").split(`
`).find((l) => l.startsWith("PASOS:"));
    let hechos = [];
    try {
      hechos = JSON.parse(line.slice(6));
    } catch {
      return { ok: true, lineas: [`⏭ capacitar: no pude grabar (${(r.stderr ?? "").split(`
`)[0].slice(0, 90)})`] };
    }
    if (!hechos.length)
      return { ok: true, lineas: ["⏭ capacitar: no encontré pantallas para grabar"] };
    writeFileSync13(join24(out, "guion.srt"), srt(hechos));
    writeFileSync13(join24(out, "tutorial.html"), htmlTutorial(hechos, basename9(cwd) || "app"));
    const L = [`✅ capacitación: ${hechos.length} pantalla(s) grabadas → docs/capacitacion/`, "   tutorial.html (se abre en cualquier navegador, con subtítulos) · guion.srt"];
    if (hayFfmpeg()) {
      const lista = join24(out, "_lista.txt");
      writeFileSync13(lista, hechos.map((h) => `file '${h.img}'
duration ${SEG}`).join(`
`) + `
file '${hechos[hechos.length - 1].img}'
`);
      const mp4 = join24(out, "capacitacion.mp4");
      const conSub = spawnSync17(`ffmpeg -y -f concat -safe 0 -i "${lista}" -vf "subtitles=guion.srt:force_style='FontSize=18,PrimaryColour=&H00FFFFFF,BorderStyle=3,Outline=1'" -pix_fmt yuv420p -r 25 "${mp4}"`, { cwd: out, shell: true, encoding: "utf8", timeout: 300000 });
      if (conSub.status === 0 && existsSync17(mp4))
        L.push("   capacitacion.mp4 (video con subtítulos quemados)");
      else {
        const r2 = spawnSync17(`ffmpeg -y -f concat -safe 0 -i "${lista}" -pix_fmt yuv420p -r 25 "${mp4}"`, { cwd: out, shell: true, encoding: "utf8", timeout: 300000 });
        if (r2.status === 0 && existsSync17(mp4))
          L.push("   capacitacion.mp4 (video; subtítulos en guion.srt)");
      }
    } else
      L.push("   (sin ffmpeg: usa tutorial.html; si instalas ffmpeg, genero también el .mp4)");
    try {
      unlinkSync2(join24(out, "_lista.txt"));
    } catch {}
    return { ok: true, lineas: L };
  } finally {
    app?.detener?.();
    for (const a of arr?.lista ?? [])
      a.detener?.();
  }
}

// app/skill_dey-lib/multiia.ts
import { writeFileSync as writeFileSync14, mkdirSync as mkdirSync13, existsSync as existsSync18, readFileSync as readFileSync21 } from "node:fs";
import { join as join25 } from "node:path";
function reglasPortables() {
  return `# Reglas de trabajo — SKILL_DEY (portátil)
Trabaja como SKILL_DEY en este proyecto, con esta ley y este flujo.

**Prioridad fija:** sin error > preciso > rápido > pocos tokens. Recorta ruido, nunca pasos que evitan errores.
**Entiende primero:** di en 1 línea "Entendí: <qué y para qué>"; deduce lo implícito (validación, permisos, vacío/error, móvil). Si es ambiguo y caro de deshacer, pregunta 1 cosa con opciones.
**Nunca rompas la app:** antes de cambios grandes, respaldo (git add/commit o copia); deja siempre cómo deshacer. Cambios quirúrgicos; no inventes nombres, rutas ni APIs; dependencia nueva → propón y espera OK.
**Cero errores:** al terminar, no entregues nada con errores de código ni de consola. Si 3 intentos no quedan en verde, cambia de enfoque (diagnóstico sistemático) y si no, revierte y explica.
**Acciones finales** (video, pruebas profesionales, publicar): no las hagas solas; ofrécelas con 1 pregunta cuando el proyecto esté listo.

**Chequeos deterministas (0 tokens): usa el CLI de skill_dey en la terminal** (funciona en Mac/Windows/Linux):
- \`node ~/.config/opencode/skill_dey/skill_dey.mjs revisar [carpeta]\`   — errores de código/arranque/sitio
- \`... seguridad [carpeta]\`   — huecos de seguridad + auditoría de dependencias
- \`... pruebas [carpeta] [url]\`   — suite E2E + prueba en vivo + a11y + carga + cobertura + CI
- \`... capacitar [carpeta] [url]\`   — video subtitulado de capacitación
- \`... organizar | documentar | validar | rendimiento | produccion | movil [carpeta]\`
(si no tienes Node, pídele a la IA que corra la acción equivalente a mano siguiendo estas reglas).
Las IAs con MCP pueden usar el servidor \`skill_dey-mcp\` para llamar estos chequeos como herramientas.`;
}
var DESTINOS = [
  { archivo: "AGENTS.md" },
  { archivo: "CLAUDE.md" },
  { archivo: "GEMINI.md" },
  { archivo: ".cursorrules" },
  { archivo: join25(".cursor", "rules", "skill_dey.mdc"), pre: `---
description: SKILL_DEY
alwaysApply: true
---

` },
  { archivo: ".windsurfrules" },
  { archivo: join25(".github", "copilot-instructions.md") },
  { archivo: ".clinerules" },
  { archivo: ".rules" },
  { archivo: join25(".idx", "airules.md") }
];
function instalarMultiIA(cwd) {
  const reglas = reglasPortables();
  const marca = "<!-- SKILL_DEY:inicio -->";
  const fin = "<!-- SKILL_DEY:fin -->";
  const bloque = `${marca}
${reglas}
${fin}
`;
  const hechos = [];
  for (const d of DESTINOS) {
    const ruta = join25(cwd, d.archivo);
    try {
      mkdirSync13(join25(ruta, ".."), { recursive: true });
      let contenido = "";
      try {
        contenido = existsSync18(ruta) ? readFileSync21(ruta, "utf8") : "";
      } catch {}
      if (contenido.includes(marca)) {
        contenido = contenido.replace(new RegExp(`${marca}[\\s\\S]*?${fin}\\n?`), bloque);
      } else {
        contenido = contenido ? contenido.trimEnd() + `

` + (d.pre ?? "") + bloque : (d.pre ?? "") + bloque;
      }
      writeFileSync14(ruta, contenido);
      hechos.push(d.archivo);
    } catch (e) {
      hechos.push(d.archivo + " (no se pudo: " + e.message + ")");
    }
  }
  mkdirSync13(join25(cwd, ".skill_dey"), { recursive: true });
  writeFileSync14(join25(cwd, ".skill_dey", "MULTI-IA.md"), `# SKILL_DEY multi-IA
Reglas escritas para: ${DESTINOS.map((d) => d.archivo).join(", ")}

${reglasPortables()}`);
  return {
    ok: true,
    lineas: [
      `\uD83C\uDF10 Multi-IA: reglas de skill_dey escritas para ${hechos.length} asistentes → ${hechos.join(", ")}`,
      "   Cada IA (Claude Code, Cursor, Windsurf, Copilot, Codex, Gemini, Cline, Zed, IDX) las lee de su propio archivo.",
      "   Chequeos: `node ~/.config/opencode/skill_dey/skill_dey.mjs <revisar|seguridad|pruebas|...>` o el servidor MCP skill_dey-mcp.",
      "   Nota: el guardián automático en vivo (copias, verificación al cerrar, cambio de modelo) solo corre dentro de OpenCode."
    ]
  };
}

// app/skill_dey-lib/robustez.ts
import { spawnSync as spawnSync18 } from "node:child_process";
import { existsSync as existsSync19, readFileSync as readFileSync22, statSync as statSync9, writeFileSync as writeFileSync15, chmodSync, mkdirSync as mkdirSync14, copyFileSync as copyFileSync3 } from "node:fs";
import { join as join26, isAbsolute as isAbsolute5 } from "node:path";
var OC = () => ocDir();
function doctor() {
  const oc = OC();
  const L = [];
  let mal = 0;
  const chk = (ok, bien, falla) => {
    L.push((ok ? "✅ " : "❌ ") + (ok ? bien : falla));
    if (!ok)
      mal++;
  };
  const ver = (() => {
    try {
      return readFileSync22(join26(oc, "skill_dey", "VERSION"), "utf8").trim();
    } catch {
      return "";
    }
  })();
  chk(!!ver, `versión instalada ${ver}`, "no encuentro skill_dey/VERSION → corre el instalador");
  const need = [
    "agents/skill_dey.md",
    "plugins/skill_dey-guardian.ts",
    "tools/skill_dey.ts",
    "skills/skill-dey/SKILL.md",
    "skill_dey-lib/comandos.ts",
    "skill_dey-lib/testpro.ts",
    "skill_dey-lib/calidad.ts",
    "skill_dey-lib/pro.ts",
    "skill_dey-lib/multiia.ts",
    "skill_dey/skill_dey.mjs",
    "skill_dey/skill_dey-mcp.mjs"
  ];
  for (const f of need)
    chk(existsSync19(join26(oc, f)), f, "falta " + f);
  try {
    const g = readFileSync22(join26(oc, "plugins", "skill_dey-guardian.ts"), "utf8");
    const m = g.match(/VERSION_CODIGO\s*=\s*"([\d.]+)"/);
    chk(!!m && m[1] === ver, `plugin y VERSION coinciden (${m?.[1] ?? "?"})`, `instalación mezclada (plugin ${m?.[1] ?? "?"} vs ${ver}): reinstala`);
  } catch {
    chk(false, "", "no pude leer el plugin");
  }
  for (const b of ["skill_dey/skill_dey.mjs", "skill_dey/skill_dey-mcp.mjs"]) {
    try {
      chk(statSync9(join26(oc, b)).size > 1e4, b + " (bundle OK)", b + " vacío/corrupto");
    } catch {}
  }
  L.push(mal ? `❌ doctor: ${mal} problema(s) → reinstala skill_dey o corre el instalador` : "✅ doctor: instalación sana. Test funcional completo: /skill_dey prueba (o eval)");
  return L;
}
function instalarHook(cwd) {
  const gp = spawnSync18("git", ["rev-parse", "--git-path", "hooks"], { cwd, encoding: "utf8", timeout: 1e4 });
  const gitDir = join26(cwd, ".git"), esDir = (() => {
    try {
      return statSync9(gitDir).isDirectory();
    } catch {
      return false;
    }
  })();
  if (gp.status !== 0 && !esDir)
    return "⏭ git hook: esta carpeta no es un repositorio git (haz `git init` primero)";
  const hooks = gp.status === 0 ? isAbsolute5(gp.stdout.trim()) ? gp.stdout.trim() : join26(cwd, gp.stdout.trim()) : join26(gitDir, "hooks");
  try {
    mkdirSync14(hooks, { recursive: true });
  } catch (e) {
    return "no pude preparar la carpeta de hooks: " + e.message;
  }
  const mjs = sdDir("skill_dey.mjs");
  const hook = `#!/bin/sh
# SKILL_DEY pre-commit — no deja commitear con errores (salta con: git commit --no-verify)
node "${mjs}" revisar . || { echo "SKILL_DEY: hay errores, corrígelos (o usa --no-verify)"; exit 1; }
`;
  const f = join26(hooks, "pre-commit");
  try {
    const actual = readFileSync22(f, "utf8");
    if (!/SKILL_DEY pre-commit/.test(actual))
      copyFileSync3(f, f + ".antes-skill_dey");
  } catch {}
  const previo = existsSync19(f + ".antes-skill_dey") ? `
# tu hook anterior sigue corriendo:
"${f}.antes-skill_dey" || exit 1
` : "";
  try {
    writeFileSync15(f, hook + previo);
    chmodSync(f, 493);
    return "✅ git hook instalado: antes de cada commit corre `revisar` y bloquea si hay errores (salta con --no-verify). Funciona en cualquier editor.";
  } catch (e) {
    return "no pude instalar el hook: " + e.message;
  }
}
function reporte(cwd) {
  const d = join26(cwd, ".skill_dey");
  const leer = (f) => {
    try {
      return readFileSync22(join26(d, f), "utf8");
    } catch {
      return "";
    }
  };
  const L = ["\uD83D\uDCD1 Reporte de uso de skill_dey en este proyecto:"];
  const cons = leer("CONSUMO.md").trim().split(`
`).filter((l) => l.includes("|"));
  L.push(cons.length ? `   consultas registradas: ${cons.length} · última: ${cons[cons.length - 1].slice(0, 90)}` : "   (sin CONSUMO.md todavía)");
  const ap = leer("APRENDIZAJE.md").split(`
`).filter((l) => l.trim().startsWith("❌"));
  if (ap.length) {
    const cont = {};
    for (const l of ap) {
      const k = l.replace(/\(\d{4}-\d\d-\d\d\)/, "").trim();
      cont[k] = (cont[k] || 0) + 1;
    }
    L.push(`   fallos aprendidos: ${ap.length} · más repetidos:`);
    for (const [k, c] of Object.entries(cont).sort((a, b) => b[1] - a[1]).slice(0, 5))
      L.push(`      (${c}×) ${k.slice(0, 88)}`);
  } else
    L.push("   fallos aprendidos: 0");
  const pp = leer("PRUEBAS-PROFESIONALES.md");
  if (pp)
    L.push("   último testeo: " + (pp.split(`
`).find((l) => /prueba en vivo|cobertura|✅|❌/.test(l)) || "").trim().slice(0, 88));
  const huecos = leer("HUECOS.md").split(`
`).filter((l) => l.trim().startsWith("-"));
  if (huecos.length)
    L.push(`   skills que faltaron: ${huecos.length}`);
  return L;
}

// app/skill_dey-lib/mapa_mental.ts
import { readFileSync as readFileSync23, writeFileSync as writeFileSync16, mkdirSync as mkdirSync15 } from "node:fs";
import { join as join27 } from "node:path";
var IGN7 = /(^|[\\/])(node_modules|vendor|dist|build|\.git|\.skill_dey|coverage|\.venv|venv|__pycache__|\.next|docs)([\\/]|$)|\.min\.|\.lock$/i;
var limpio = (s) => s.replace(/[()\[\]{}:;#"'`]/g, "").replace(/\s+/g, " ").trim().slice(0, 48) || "-";
function requisitos(cwd) {
  try {
    const t = readFileSync23(join27(cwd, ".skill_dey", "REQUISITOS.md"), "utf8");
    return t.split(/\r?\n/).filter((l) => /^\s*-\s*\[[ xX]\]/.test(l)).map((l) => l.replace(/^\s*-\s*\[[ xX]\]\s*/, "")).slice(0, 12);
  } catch {
    return [];
  }
}
function arquitectura(cwd) {
  const files = listarArchivos(cwd).filter((f) => !IGN7.test(f));
  const por = {};
  for (const f of files) {
    const g = f.includes("/") ? f.split("/")[0] : "(raíz)";
    (por[g] ||= []).push(f);
  }
  return Object.entries(por).sort((a, b) => b[1].length - a[1].length).slice(0, 8).map(([grupo, fs]) => ({ grupo: `${grupo} (${fs.length})`, ejemplos: fs.slice(0, 3).map((x) => x.split("/").pop() || x) }));
}
function mapaMental(cwd, tarea = "") {
  const raiz = limpio(tarea || cwd.split(/[\\/]/).pop() || "Proyecto");
  const reqs = requisitos(cwd);
  const arq = arquitectura(cwd);
  const L = ["mindmap", `  root((${raiz}))`];
  if (reqs.length) {
    L.push("    Requisitos");
    for (const r of reqs)
      L.push("      " + limpio(r));
  }
  if (arq.length) {
    L.push("    Arquitectura");
    for (const a of arq) {
      L.push("      " + limpio(a.grupo));
      for (const e of a.ejemplos)
        L.push("        " + limpio(e));
    }
  }
  if (!reqs.length && !arq.length)
    L.push("    (sin plan ni archivos aún)");
  const mermaid = L.join(`
`);
  mkdirSync15(join27(cwd, ".skill_dey"), { recursive: true });
  const md = `# Mapa mental — ${raiz}
_Se dibuja solo en GitHub/VS Code. Para el navegador abre MAPA.html._

\`\`\`mermaid
${mermaid}
\`\`\`
`;
  writeFileSync16(join27(cwd, ".skill_dey", "MAPA.md"), md);
  const html = `<!doctype html><html lang="es"><head><meta charset="utf-8"><title>Mapa mental · ${raiz}</title>
<script src="https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.min.js"></script></head>
<body style="font-family:system-ui;margin:0;padding:16px">
<h3>\uD83E\uDDE0 Mapa mental — ${raiz}</h3>
<pre class="mermaid">${mermaid}</pre>
<script>mermaid.initialize({startOnLoad:true});</script></body></html>`;
  writeFileSync16(join27(cwd, ".skill_dey", "MAPA.html"), html);
  return { ok: true, lineas: [`\uD83E\uDDE0 Mapa mental guardado en .skill_dey/MAPA.md (requisitos: ${reqs.length}, grupos: ${arq.length}). Ábrelo en VS Code/GitHub o MAPA.html en el navegador.`, "```mermaid", mermaid, "```"], mermaid };
}

// app/skill_dey-lib/diseno.ts
import { writeFileSync as writeFileSync17, mkdirSync as mkdirSync16, existsSync as existsSync20 } from "node:fs";
import { join as join28 } from "node:path";
var esc = (s) => s.replace(/[<>&]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;" })[c]);
function secciones(brief) {
  const t = brief.toLowerCase();
  const S = [];
  if (/login|ingres|sesi[oó]n|acceso|entrar/.test(t))
    S.push(`<section class="card centro"><h2>Iniciar sesión</h2><form><label>Correo<input type="email" placeholder="tu@correo.com"></label><label>Contraseña<input type="password" placeholder="••••••••"></label><button class="primario">Entrar</button><a class="link" href="#">¿Olvidaste tu contraseña?</a></form></section>`);
  if (/dashboard|tablero|panel|indicador|kpi|m[eé]trica/.test(t))
    S.push(`<section><h2>Panel</h2><div class="grid">${["Ventas", "Usuarios", "Tickets", "Disponibilidad"].map((k, i) => `<div class="card kpi"><span class="etq">${k}</span><strong>${["$ 1.2M", "3,480", "27", "99.8%"][i]}</strong><span class="delta">▲ 4.2%</span></div>`).join("")}</div></section>`);
  if (/tabla|listado|registros|reporte/.test(t))
    S.push(`<section class="card"><h2>Registros</h2><table><thead><tr><th>Fecha</th><th>Cliente</th><th>Estado</th><th>Total</th></tr></thead><tbody>${[1, 2, 3].map((i) => `<tr><td>2026-10-${10 + i}</td><td>Cliente ${i}</td><td><span class="chip ok">Activo</span></td><td>$ ${i}00.00</td></tr>`).join("")}</tbody></table></section>`);
  if (/formulario|registro|crear|alta|nuevo/.test(t) && !/login/.test(t))
    S.push(`<section class="card"><h2>Nuevo registro</h2><form class="dos"><label>Nombre<input placeholder="Nombre"></label><label>Correo<input type="email" placeholder="correo"></label><label>Teléfono<input placeholder="300..."></label><label>Ciudad<input placeholder="Ciudad"></label><label class="full">Notas<textarea placeholder="..."></textarea></label><button class="primario">Guardar</button></form></section>`);
  if (/landing|inicio|home|p[aá]gina|portada|producto/.test(t) || !S.length)
    S.unshift(`<section class="hero"><h1>${esc(brief.slice(0, 60) || "Tu producto")}</h1><p>Una descripción clara y breve de lo que ofreces. Llama a la acción.</p><div><button class="primario">Empezar</button><button class="ghost">Ver más</button></div></section>`);
  return S.join(`
`);
}
function generarMockup(cwd, brief) {
  if (!brief || !brief.trim())
    return { ok: false, lineas: ["di qué pantalla quieres, ej: /skill_dey mockup login con dashboard y tabla"] };
  const cuerpo = secciones(brief);
  const html = `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Mockup — ${esc(brief.slice(0, 40))}</title><style>
:root{--bg:#f7f8fa;--fg:#1a1d21;--card:#fff;--bor:#e5e7eb;--pri:#2d6cdf;--mut:#6b7280;color-scheme:light dark}
@media(prefers-color-scheme:dark){:root{--bg:#0f1115;--fg:#e8eaed;--card:#171a1f;--bor:#2a2e35}}
*{box-sizing:border-box}body{margin:0;font-family:system-ui,Arial,sans-serif;background:var(--bg);color:var(--fg);line-height:1.5}
header{display:flex;align-items:center;justify-content:space-between;padding:16px 24px;border-bottom:1px solid var(--bor)}
nav a{margin-left:16px;color:var(--mut);text-decoration:none}main{max-width:1000px;margin:0 auto;padding:24px 16px;display:flex;flex-direction:column;gap:24px}
h1{font-size:2rem;margin:.2em 0}h2{margin:.2em 0 .6em}.hero{text-align:center;padding:48px 16px}
.card{background:var(--card);border:1px solid var(--bor);border-radius:12px;padding:20px}.centro{max-width:380px;margin:0 auto}
.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:16px}.kpi{display:flex;flex-direction:column;gap:4px}
.etq{color:var(--mut);font-size:.85rem}.kpi strong{font-size:1.6rem}.delta{color:#16a34a;font-size:.85rem}
form{display:flex;flex-direction:column;gap:12px}form.dos{display:grid;grid-template-columns:1fr 1fr;gap:12px}.full{grid-column:1/-1}
label{display:flex;flex-direction:column;gap:4px;font-size:.9rem;color:var(--mut)}input,textarea{padding:10px;border:1px solid var(--bor);border-radius:8px;background:transparent;color:var(--fg)}
button{padding:10px 16px;border-radius:8px;border:1px solid var(--bor);background:transparent;color:var(--fg);cursor:pointer;font-size:.95rem}
.primario{background:var(--pri);color:#fff;border-color:var(--pri)}.ghost{}.link{color:var(--pri);text-decoration:none;font-size:.9rem;text-align:center}
table{width:100%;border-collapse:collapse}th,td{text-align:left;padding:10px;border-bottom:1px solid var(--bor)}th{color:var(--mut);font-weight:600}
.chip{padding:2px 8px;border-radius:999px;font-size:.8rem}.chip.ok{background:#16a34a22;color:#16a34a}
@media(max-width:560px){form.dos{grid-template-columns:1fr}}
</style></head><body>
<header><strong>Mi App</strong><nav><a href="#">Inicio</a><a href="#">Panel</a><a href="#">Cuenta</a></nav></header>
<main>${cuerpo}</main></body></html>`;
  mkdirSync16(join28(cwd, "docs", "mockups"), { recursive: true });
  const base = "mockup-" + ((brief || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40) || "pantalla");
  let f = join28(cwd, "docs", "mockups", base + ".html");
  for (let n = 2;existsSync20(f); n++)
    f = join28(cwd, "docs", "mockups", `${base}-${n}.html`);
  writeFileSync17(f, html);
  return { ok: true, lineas: [`\uD83C\uDFA8 Mockup generado: docs/mockups/${f.split(/[\\/]/).pop()} (ábrelo en el navegador). Punto de partida responsive y claro/oscuro; ajústalo a tu marca.`, "   Secciones según tu brief: " + brief.slice(0, 80)] };
}

// app/skill_dey-lib/modelos.ts
import { join as join29, extname as extname2, isAbsolute as isAbsolute6 } from "node:path";
var CATALOGO = sdDir("MODELOS.json");
var DIR = sdDir();
var LIMITES = join29(DIR, "LIMITES.json");
var RANKING = join29(DIR, "RANKING.json");
var SALUD = join29(DIR, "SALUD.json");

// app/skill_dey-lib/ruteo.ts
function clasificar(texto) {
  const t = (texto || "").toLowerCase();
  if (/\b(bd|base de datos|migrac|auth|login|sesi[oó]n|pago|dinero|arquitect|refactor|varios archivos|m[uú]ltiples|app nueva|aplicaci[oó]n nueva|integr|seguridad|despleg|desplieg|api\b|concurren|optimiz|algoritmo|dise[nñ]a|planifica|complejo|a fondo)/.test(t))
    return "complejo";
  if (texto.length <= 180 && /(cambia|corrige|arregla|ajusta|color|el texto|renombra|typo|traduce|comenta|formatea|mueve|quita|agrega un (texto|campo|bot[oó]n|enlace))/.test(t))
    return "simple";
  return texto.length > 420 ? "complejo" : "simple";
}

// app/skill_dey-lib/prompt.ts
function optimizarPrompt(texto) {
  const t = (texto || "").trim();
  if (!t)
    return "escribe el pedido a optimizar, ej: /skill_dey prompt agrega el login de usuarios";
  const nivel = clasificar(t);
  const tl = t.toLowerCase();
  const falta = [];
  if (!/\b(archivo|pantalla|p[aá]gina|vista|componente|ruta|secci[oó]n|\.php|\.js|\.ts|\.vue|\.html)\b/i.test(tl))
    falta.push("¿en qué pantalla/archivo exactamente?");
  if (/\b(crea|agrega|formulario|registro|guardar|campo|alta)\b/i.test(tl) && !/valida/i.test(tl))
    falta.push("¿qué campos y cuáles son obligatorios?");
  if (/\b(usuario|login|acceso|rol|privado|admin)\b/i.test(tl) && !/permiso|rol/i.test(tl))
    falta.push("¿qué permisos o roles?");
  if (/\b(lista|tabla|reporte|datos|consulta)\b/i.test(tl) && !/vac[ií]o|sin datos/i.test(tl))
    falta.push("¿qué mostrar si no hay datos o si falla?");
  if (/\b(integr|conecta|api|servicio|pago|correo|whatsapp)\b/i.test(tl) && !/credencial|clave|token|\.env/i.test(tl))
    falta.push("¿qué credenciales/servicio? (van en .env, no en el código)");
  return [
    "\uD83D\uDCDD Pedido optimizado (úsalo tal cual o pégalo):",
    "",
    `\uD83C\uDFAF Objetivo: ${t}`,
    `\uD83D\uDCD0 Nivel estimado: ${nivel}${nivel === "complejo" ? " → conviene un modelo potente" : " → basta un modelo rápido/barato"}`,
    "\uD83D\uDCCB Incluir por defecto (deducido, no hace falta pedirlo): validación de entradas · permisos/sesión · estados vacío y de error · responsive (móvil) · mensajes claros al usuario.",
    "✅ Criterios de aceptación: funciona sin errores (código y consola) · no rompe lo existente (deja cómo deshacer) · cubre CADA punto pedido · con pruebas reales si toca UI o datos.",
    "\uD83D\uDEAB Restricciones: cambios quirúrgicos · no inventar nombres/rutas/APIs · sin secretos en el código (usar .env).",
    falta.length ? "⚠ Conviene aclarar antes (si aplica): " + falta.join(" · ") : "✔ Tiene suficiente detalle para empezar."
  ].join(`
`);
}

// app/skill_dey-lib/trazas.ts
import { appendFileSync as appendFileSync2, readFileSync as readFileSync24, writeFileSync as writeFileSync18, mkdirSync as mkdirSync17 } from "node:fs";
import { join as join30 } from "node:path";
var F = (cwd) => join30(cwd, ".skill_dey", "TRACE.jsonl");
function leer14(cwd) {
  try {
    return readFileSync24(F(cwd), "utf8").split(`
`).filter(Boolean).map((l) => JSON.parse(l));
  } catch {
    return [];
  }
}
var k = (n) => n >= 1e6 ? (n / 1e6).toFixed(1) + "M" : n >= 1000 ? (n / 1000).toFixed(1) + "k" : String(Math.round(n));
function panel(cwd) {
  const t = leer14(cwd);
  if (!t.length)
    return { ok: true, lineas: ["⏭ panel: aún no hay trazas (aparecen al terminar cada respuesta)."] };
  const ult = t.slice(-40);
  const totTok = t.reduce((a, x) => a + (x.tokens || 0), 0), totCost = t.reduce((a, x) => a + (x.costo || 0), 0);
  const maxTok = Math.max(1, ...ult.map((x) => x.tokens || 0)), maxDur = Math.max(1, ...ult.map((x) => x.dur || 0));
  const barras = (vals, max, color) => ult.map((_, i) => `<rect x="${i * 14}" y="${60 - Math.round(vals[i] / max * 56)}" width="11" height="${Math.max(1, Math.round(vals[i] / max * 56))}" fill="${color}"><title>${vals[i]}</title></rect>`).join("");
  const w = ult.length * 14;
  const html = `<!doctype html><html lang="es"><head><meta charset="utf-8"><title>Panel · SKILL_DEY</title>
<style>:root{color-scheme:light dark}body{font-family:system-ui;margin:0;padding:20px;background:#0f1115;color:#e8eaed}
@media(prefers-color-scheme:light){body{background:#f7f8fa;color:#1a1d21}}
.kpis{display:flex;gap:16px;flex-wrap:wrap;margin-bottom:20px}.card{background:#171a1f22;border:1px solid #8884;border-radius:12px;padding:14px 18px}
.card strong{font-size:1.5rem;display:block}.card span{opacity:.7;font-size:.85rem}svg{max-width:100%}.g{margin:18px 0}</style></head><body>
<h2>\uD83D\uDCCA Panel de observabilidad — SKILL_DEY</h2>
<div class="kpis">
<div class="card"><span>Consultas</span><strong>${t.length}</strong></div>
<div class="card"><span>Tokens totales</span><strong>${k(totTok)}</strong></div>
<div class="card"><span>Costo total</span><strong>${totCost > 0 ? "US$" + totCost.toFixed(2) : "gratis"}</strong></div>
<div class="card"><span>Prom. tokens/consulta</span><strong>${k(totTok / t.length)}</strong></div>
<div class="card"><span>Modelo más usado</span><strong>${(Object.entries(t.reduce((a, x) => (a[x.modelo] = (a[x.modelo] || 0) + 1, a), {})).sort((a, b) => b[1] - a[1])[0]?.[0] || "—").split("/").pop()}</strong></div>
</div>
<div class="g"><b>Tokens por consulta</b> (últimas ${ult.length})<br><svg width="${w}" height="64">${barras(ult.map((x) => x.tokens || 0), maxTok, "#2d6cdf")}</svg></div>
<div class="g"><b>Tiempo por consulta (ms)</b><br><svg width="${w}" height="64">${barras(ult.map((x) => x.dur || 0), maxDur, "#16a34a")}</svg></div>
<p style="opacity:.6">Local y gratis. Datos crudos en .skill_dey/TRACE.jsonl</p></body></html>`;
  mkdirSync17(join30(cwd, ".skill_dey"), { recursive: true });
  writeFileSync18(join30(cwd, ".skill_dey", "PANEL.html"), html);
  return { ok: true, lineas: [`\uD83D\uDCCA Panel de observabilidad → .skill_dey/PANEL.html · ${t.length} consultas · ${k(totTok)} tokens${totCost > 0 ? " · US$" + totCost.toFixed(2) : ""}. Ábrelo en el navegador.`] };
}

// app/skill_dey-lib/indice.ts
import { readFileSync as readFileSync25, existsSync as existsSync21, readdirSync as readdirSync6 } from "node:fs";
import { join as join31 } from "node:path";
var FUENTES = ["LECCIONES.md", "DECISIONES.md", "NEGOCIO.md", "BITACORA.md", "ESTADO.md", "APRENDIZAJE.md", "PRINCIPIOS.md"];
var norm = (s) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").split(/[^a-z0-9]+/).filter((w) => w.length > 2);
function trozos(cwd) {
  const dir = join31(cwd, ".skill_dey");
  const out = [];
  const archivos = existsSync21(dir) ? readdirSync6(dir).filter((f) => FUENTES.includes(f)) : [];
  for (const f of archivos) {
    const t = (() => {
      try {
        return readFileSync25(join31(dir, f), "utf8");
      } catch {
        return "";
      }
    })();
    for (const linea of t.split(/\r?\n/)) {
      const l = linea.trim().replace(/^[-*#>\s]+/, "");
      if (l.length < 8 || l.startsWith("name:") || l.startsWith("description:"))
        continue;
      out.push({ fuente: f, texto: l.slice(0, 220), toks: norm(l) });
    }
  }
  try {
    const g = readFileSync25(memoriaGlobal("LECCIONES-GLOBALES.md"), "utf8");
    for (const linea of g.split(/\r?\n/)) {
      const l = linea.trim().replace(/^[-*#>\s]+/, "");
      if (l.length < 8 || l.startsWith("name:") || l.startsWith("description:"))
        continue;
      out.push({ fuente: "GLOBAL.md", texto: l.slice(0, 220), toks: norm(l) });
    }
  } catch {}
  return out;
}
function buscarMemoria(cwd, consulta, k = 6) {
  const docs = trozos(cwd);
  if (!docs.length)
    return [];
  const q = [...new Set(norm(consulta))];
  if (!q.length)
    return [];
  const N = docs.length, avgdl = docs.reduce((a, d) => a + d.toks.length, 0) / N;
  const df = {};
  for (const term of q)
    df[term] = docs.filter((d) => d.toks.includes(term)).length || 0;
  const idf = (term) => Math.log(1 + (N - (df[term] || 0) + 0.5) / ((df[term] || 0) + 0.5));
  const k1 = 1.5, b = 0.75;
  const puntuar = (d) => q.reduce((s, term) => {
    const tf = d.toks.filter((x) => x === term).length;
    if (!tf)
      return s;
    return s + idf(term) * (tf * (k1 + 1)) / (tf + k1 * (1 - b + b * (d.toks.length / avgdl)));
  }, 0);
  return docs.map((d) => ({ d, s: puntuar(d) })).filter((x) => x.s > 0).sort((a, b) => b.s - a.s).slice(0, k).map((x) => `[${x.d.fuente.replace(".md", "")}] ${x.d.texto}`);
}

// app/skill_dey-lib/sitio.ts
import { writeFileSync as writeFileSync19, readFileSync as readFileSync26, mkdirSync as mkdirSync18, rmSync as rmSync7 } from "node:fs";
import { join as join32, dirname as dirname3 } from "node:path";
import { tmpdir as tmpdir7 } from "node:os";
var DESTRUCTIVO = /(logout|log-out|signout|salir|cerrar[-_]?(sesion|caja)|delete|elimin|borr|destroy|remove|quitar|anular|\bbaja|reset|truncate|drop|vaciar|\bdel(\.php|\b))/i;
var SOLO_LECTURA = /(aprob|approve|rechaz|reject|confirm|activar|desactivar|enable|disable|cancel|anular|pagar|pay|checkout|enviar|send|toggle|publicar|publish|archivar|archive|restaurar|restore|importar|sync|ejecutar|execute|run|cron|install|setup|migrat|seed|backup|respald|export)/i;
var DESCARGA = /\.(pdf|zip|rar|7z|xlsx?|csv|docx?|pptx?|mp4|mp3|png|jpe?g|gif|webp|svg|ico|exe|dmg|apk)(\?|$)/i;
var ERROR_TEXTO = /(Fatal error|Parse error|Warning:|Notice:|Deprecated:|Uncaught |Stack trace:|SQLSTATE\[|Traceback \(most recent|Exception in |Undefined (index|variable|array key|offset)|mysqli_|You have an error in your SQL syntax|NaN|undefined(?![\w-]))/;
function loginPrueba(cwd) {
  const env = (() => {
    try {
      return readFileSync26(join32(cwd, ".env"), "utf8");
    } catch {
      return "";
    }
  })();
  const v = (k) => env.match(new RegExp(`^\\s*${k}\\s*=\\s*"?([^"\\r\\n]*)"?`, "m"))?.[1];
  const u = v("SKILL_DEY_TEST_USER"), p = v("SKILL_DEY_TEST_PASS");
  return u && p ? { u, p } : null;
}
function resumir(errores, paginas, conNavegador) {
  if (!errores.length)
    return [`✅ sitio completo: ${paginas} página(s) recorridas sin errores${conNavegador ? " (servidor, consola, red, imágenes y enlaces)" : " (servidor y enlaces; sin navegador)"}`];
  const grupos = new Map;
  for (const e of errores) {
    const k = `${e.tipo}: ${e.detalle}`;
    if (!grupos.has(k))
      grupos.set(k, []);
    grupos.get(k).push(e.pagina);
  }
  const n = (re) => errores.filter((e) => re.test(e.tipo)).length;
  const cats = [["consola", n(/^consola error/)], ["avisos consola", n(/^consola warning/)], ["JS", n(/excepción JS/)], ["red", n(/petición fallida|sin respuesta/)], ["HTTP", n(/^(HTTP|recurso|document|xhr|fetch|script|stylesheet|image|font) ?\d/)], ["página", n(/error (visible|impreso)/)]].filter(([, c]) => c).map(([k, c]) => `${k} ${c}`).join(" · ");
  const L = [`❌ sitio: ${errores.length} error(es) en ${new Set(errores.map((e) => e.pagina)).size} de ${paginas} página(s)${cats ? " — " + cats : ""}`];
  for (const [k, ps] of [...grupos].slice(0, 20))
    L.push(`   ${k.slice(0, 200)} ← ${[...new Set(ps)].slice(0, 3).join(", ")}${ps.length > 3 ? ` (+${ps.length - 3})` : ""}`);
  if (grupos.size > 20)
    L.push(`   … y ${grupos.size - 20} tipos más (ver .skill_dey/ERRORES-SITIO.md)`);
  return L;
}
async function rastrearFetch(cwd, base, max, DESTR = DESTRUCTIVO) {
  const origen = new URL(base).origin, cola = [new URL(base).pathname || "/"], vistas = new Set, recursos = new Map;
  const errores = [];
  while (cola.length && vistas.size < max) {
    const ruta = cola.shift();
    if (vistas.has(ruta))
      continue;
    vistas.add(ruta);
    try {
      const r = await fetch(origen + ruta, { redirect: "follow", signal: AbortSignal.timeout(15000) });
      const html = /html|text/.test(r.headers.get("content-type") ?? "") ? await r.text() : "";
      if (r.status >= 400)
        errores.push({ pagina: ruta, tipo: `HTTP ${r.status}`, detalle: "la página responde con error" });
      const m = html.replace(/<script[\s\S]*?<\/script>/gi, "").match(ERROR_TEXTO);
      if (m && m[0] !== "NaN" && !/^undefined/.test(m[0])) {
        const i = html.indexOf(m[0]);
        errores.push({ pagina: ruta, tipo: "error impreso en la página", detalle: html.slice(i, i + 150).replace(/<[^>]+>/g, "").replace(/\s+/g, " ").split(cwd + "/").join("") });
      }
      for (const x of html.matchAll(/<a\b[^>]*href=["']([^"'#]+)["']/gi)) {
        try {
          const u = new URL(x[1], origen + ruta);
          if (u.origin === origen && !DESTR.test(u.pathname + u.search) && !DESCARGA.test(u.pathname)) {
            const p = u.pathname + u.search;
            if (!vistas.has(p))
              cola.push(p);
          }
        } catch {}
      }
      for (const x of html.matchAll(/<(?:script|img|link|source)\b[^>]*(?:src|href)=["']([^"']+)["']/gi)) {
        try {
          const u = new URL(x[1], origen + ruta);
          if (u.origin === origen && !recursos.has(u.href))
            recursos.set(u.href, ruta);
        } catch {}
      }
    } catch {
      errores.push({ pagina: ruta, tipo: "sin respuesta", detalle: "la página no respondió en 15 s" });
    }
  }
  for (const [u, pagina] of [...recursos].slice(0, 200)) {
    try {
      const r = await fetch(u, { method: "GET", signal: AbortSignal.timeout(1e4) });
      if (r.status >= 400)
        errores.push({ pagina, tipo: `recurso ${r.status}`, detalle: u.replace(origen, "") });
    } catch {
      errores.push({ pagina, tipo: "recurso sin respuesta", detalle: u.replace(origen, "") });
    }
  }
  return { errores, paginas: vistas.size };
}
async function rastrearSitio(cwd, base, pj, max = 40, opc = {}) {
  let errores = [], paginas = 0, conNavegador = false, nota = "", capturas = [];
  const local = esLocal(base), DESTR = local ? DESTRUCTIVO : new RegExp(DESTRUCTIVO.source + "|" + SOLO_LECTURA.source, "i");
  if (!local)
    max = Math.min(max, 15);
  const SHOTS = join32(cwd, ".skill_dey", "shots", "sitio");
  try {
    rmSync7(SHOTS, { recursive: true, force: true });
    mkdirSync18(SHOTS, { recursive: true });
  } catch {}
  if (pj) {
    const script = join32(tmpdir7(), `skill_dey-sitio-${Date.now()}.mjs`);
    writeFileSync19(script, `
import { createRequire } from 'node:module'; const require = createRequire(${JSON.stringify(pj)});
const { chromium } = require('playwright');
const base = ${JSON.stringify(base)}, origen = new URL(base).origin, max = ${max}, login = ${JSON.stringify(loginPrueba(cwd))};
const DESTR = ${DESTR}, DESC = ${DESCARGA}, TXT = ${ERROR_TEXTO}, SHOTS = ${JSON.stringify(SHOTS)}, CAPT = [], LOCAL = ${local};
${ABRIR_NAVEGADOR}
ctx.on('dialog', d => d.dismiss().catch(() => {}));
const cola = [new URL(base).pathname || '/'], vistas = new Set(), E = []; let logueado = false;
const RAIZ = ${JSON.stringify(cwd)};
const add = (pagina, tipo, detalle) => E.push({ pagina, tipo, detalle: String(detalle).split(origen).join('').split(RAIZ + '/').join('').split(RAIZ + '\\\\').join('').slice(0, 180) });
async function visitar(ruta) {
  // (ruta ya marcada como vista por el trabajador)
  const p = await ctx.newPage(); p.on('dialog', d => d.dismiss().catch(() => {}));
  p.on('console', m => { if (['error', 'warning'].includes(m.type()) && !/DevTools|favicon|Download the React DevTools|\\[vite\\] connect|Failed to load resource/.test(m.text())) add(ruta, 'consola ' + m.type(), m.text()) });
  p.on('pageerror', e => add(ruta, 'excepción JS', e.message));
  p.on('requestfailed', r => { const f = r.failure()?.errorText || ''; if (!/ERR_ABORTED|favicon/.test(f + r.url())) add(ruta, 'petición fallida', r.method() + ' ' + r.url() + ' ' + f) });
  p.on('response', r => { if (r.status() >= 400 && !/favicon/.test(r.url())) add(ruta, (r.request().resourceType() === 'document' ? 'HTTP ' : r.request().resourceType() + ' ') + r.status(), r.url()) });
  try { await p.goto(origen + ruta, { waitUntil: 'networkidle', timeout: 30000 }) } catch (e) { add(ruta, 'no cargó', e.message.split('\\n')[0]) }
  if (login && !logueado && LOCAL && /login|ingres|acceso|signin|sign-in|auth|entrar|iniciar/i.test(ruta + ' ' + p.url()) && (await p.$$('input[type=password]')).length === 1) {
    try { await p.fill('input[type=email], input[name*=user i], input[name*=correo i], input[name*=email i], input[type=text]', login.u); await p.fill('input[type=password]', login.p);
      await Promise.all([p.waitForLoadState('networkidle').catch(() => {}), p.press('input[type=password]', 'Enter')]); logueado = true; if (!vistas.has(new URL(p.url()).pathname)) cola.unshift(new URL(p.url()).pathname) } catch (e) { add(ruta, 'login de prueba falló', e.message.split('\\n')[0]) }
  }
  const info = await p.evaluate(() => ({
    texto: (document.body?.innerText || '').slice(0, 200000),
    rotas: [...document.images].filter(i => i.complete && i.naturalWidth === 0 && i.src).map(i => i.src).slice(0, 5),
    mixto: location.protocol === 'https:' ? [...document.querySelectorAll('[src^="http:"],link[href^="http:"]')].length : 0,
    hscroll: document.documentElement.scrollWidth > window.innerWidth + 1,
    enlaces: [...document.querySelectorAll('a[href]')].map(a => a.href),
  })).catch(() => null);
  if (CAPT.length < 6 && E.some(e => e.pagina === ruta)) { const f = SHOTS + '/' + (ruta.replace(/^\\/+/, '').replace(/[^\\w-]+/g, '_').slice(0, 60) || 'inicio') + '.png'; try { await p.screenshot({ path: f }); CAPT.push(f) } catch {} }
  if (info) {
    let k = 0, fin = -1; for (const m of info.texto.matchAll(new RegExp(TXT.source, 'g'))) { const i = m.index; if (i < fin) continue; if (k++ >= 3) break; fin = i + 140; add(ruta, 'error visible en la página', info.texto.slice(Math.max(0, i - 20), i + 140).replace(/\\s+/g, ' ')) }
    for (const s of info.rotas) add(ruta, 'imagen rota', s);
    if (info.mixto) add(ruta, 'contenido mixto', info.mixto + ' recurso(s) http en página https');
    if (info.hscroll) add(ruta, 'diseño', 'scroll horizontal (algo se sale del ancho)');
    for (const h of info.enlaces) { try { const u = new URL(h); if (u.origin === origen && !DESTR.test(u.pathname + u.search) && !DESC.test(u.pathname)) { const r = u.pathname + u.search; if (!vistas.has(r) && !cola.includes(r)) cola.push(r) } } catch {} }
  }
  await p.close();
}
// 4 páginas a la vez (antes 1): mismo resultado, mucho menos tiempo en sitios grandes. La 1ª página va sola (posible login).
let activos = 0; const t0 = Date.now();
const trabajador = async () => { for (;;) {
  if (Date.now() - t0 > 150000) return; // guardia de reloj: nunca más de 150s por worker (evita cuelgues)
  if (!cola.length) { if (!activos) return; await new Promise(r => setTimeout(r, 40)); continue; }
  if (vistas.size >= max) return;
  const ruta = cola.shift(); if (vistas.has(ruta)) continue; vistas.add(ruta);
  activos++; try { await visitar(ruta) } finally { activos-- }
} };
await trabajador_inicial(); await Promise.all((_CDP || _VIS ? [1] : [1, 2, 3, 4]).map(trabajador)); // en tu Chrome / visible: 1 pestaña a la vez
async function trabajador_inicial() { const r = cola.shift(); vistas.add(r); await visitar(r) }
console.log(JSON.stringify({ errores: E, paginas: vistas.size, capturas: CAPT })); await _cerrar(); process.exit(0);`);
    const env = { SKILL_DEY_VISIBLE: opc.visible ? "1" : "0", SKILL_DEY_CDP: opc.cdp ?? "", SKILL_DEY_PERFIL: opc.visible && !opc.cdp ? perfilChrome() : "" };
    const correr = () => correrNodo(script, cwd, 170000, env, opc.senal);
    let r = await correr();
    if (opc.senal?.aborted) {
      try {
        rmSync7(script, { force: true });
      } catch {}
      return { ok: false, paginas: 0, errores: [], lineas: ["⏹ prueba en Chrome cancelada por el usuario"], conNavegador: false, capturas: [] };
    }
    if (!process.env.SKILL_DEY_CHROMIUM && /Executable doesn't exist|playwright install/i.test(r.stderr)) {
      await correrProceso("npx", ["playwright", "install", "chromium"], dirname3(pj), 300000);
      r = await correr();
    }
    try {
      const j = JSON.parse(r.stdout.trim().split(`
`).pop() ?? "");
      errores = j.errores;
      paginas = j.paginas;
      capturas = j.capturas ?? [];
      conNavegador = true;
    } catch {
      nota = r.tiempoAgotado ? "   ⚠ el navegador superó 170 s y se cortó (sin colgar OpenCode): revisé servidor y enlaces; repite con menos páginas (max)" : `   ⚠ el navegador de pruebas no arrancó (${(r.stderr.match(/\w*Error[^\n]*/)?.[0] ?? "sin detalle").slice(0, 120)}): consola y JS NO revisados, solo servidor y enlaces`;
    }
    try {
      rmSync7(script, { force: true });
    } catch {}
  }
  if (!conNavegador)
    ({ errores, paginas } = await rastrearFetch(cwd, base, max, DESTR));
  const unicos = [...new Map(errores.map((e) => [`${e.pagina}|${e.tipo}|${e.detalle}`, e])).values()];
  const lineas = resumir(unicos, paginas, conNavegador);
  if (nota)
    lineas.push(nota);
  if (capturas.length)
    lineas.push(`   \uD83D\uDCF8 capturas de las páginas con error: .skill_dey/shots/sitio/ (${capturas.length}) — míralas para ver el fallo`);
  if (!local)
    lineas.push("   \uD83D\uDD12 sitio remoto: modo solo lectura (máx. 15 páginas, sin enlaces que cambien datos)");
  mkdirSync18(join32(cwd, ".skill_dey"), { recursive: true });
  writeFileSync19(join32(cwd, ".skill_dey", "ERRORES-SITIO.md"), [`# Errores del sitio · ${new Date().toISOString().slice(0, 16).replace("T", " ")} · ${paginas} páginas`, ...unicos.length ? unicos.map((e) => `- [ ] ${e.pagina} · ${e.tipo} · ${e.detalle}`) : ["Sin errores."]].join(`
`));
  if (paginas <= 1 && !loginPrueba(cwd))
    lineas.push("   ℹ solo se pudo ver 1 página: si el resto está tras el login, agrega un usuario de PRUEBA en .env (SKILL_DEY_TEST_USER / SKILL_DEY_TEST_PASS) y repite");
  return { ok: unicos.length === 0, paginas, errores: unicos, lineas, conNavegador, capturas };
}

// app/skill_dey-lib/cli.ts
var banderas = process.argv.slice(2).filter((x) => x.startsWith("--"));
var posicionales = process.argv.slice(2).filter((x) => !x.startsWith("--"));
var [cmd = "ayuda", carpeta = ".", url] = posicionales;
var cwd = resolve2(carpeta);
var AYUDA = `skill_dey (terminal · funciona con cualquier IA)
  node skill_dey.mjs revisar [carpeta]          Errores de código, arranque y sitio
  node skill_dey.mjs chrome [carpeta] [url]     Abre la app en Chrome y lee consola/JS/red/HTTP (--visible · --conectar)
  node skill_dey.mjs seguridad [carpeta]        Huecos de seguridad + auditoría de dependencias + semgrep
  node skill_dey.mjs pruebas [carpeta] [url]    Suite E2E + prueba en vivo + a11y + carga + cobertura + CI
  node skill_dey.mjs capacitar [carpeta] [url]  Video subtitulado de capacitación (docs/capacitacion)
  node skill_dey.mjs movil [carpeta]            App Flutter/React Native: analizador + pruebas del stack
  node skill_dey.mjs organizar [carpeta]        Ordena el proyecto (formato + estructura)
  node skill_dey.mjs documentar [carpeta]       Manuales + diccionario + BD + PDF
  node skill_dey.mjs validar|produccion|formato|reglas|notas|empalme|pdf [carpeta]
  node skill_dey.mjs multi-ia [carpeta]         Escribe las reglas de skill_dey para TODAS las IAs del proyecto
  node skill_dey.mjs doctor                      Revisa que la instalación esté completa y coherente
  node skill_dey.mjs hook [carpeta]             Instala un git pre-commit que bloquea commits con errores
  node skill_dey.mjs reporte [carpeta]          Resumen de tu uso real (para recortar con datos)
  node skill_dey.mjs mapa [carpeta]             Mapa mental (Mermaid) con requisitos + arquitectura
  node skill_dey.mjs mockup . "<brief>"         Mockup de UI responsive desde un brief (docs/mockups)
  node skill_dey.mjs prompt <texto>             Reescribe tu pedido como instrucción clara y completa
  node skill_dey.mjs panel [carpeta]            Panel de observabilidad (tokens/costo/tiempo) en .skill_dey/PANEL.html
  node skill_dey.mjs checkpoint . <nombre>      Guarda un punto exacto para volver luego (time-travel)
  node skill_dey.mjs volver . <nombre>          Restaura el proyecto a ese checkpoint (reversible)
  node skill_dey.mjs hitos [carpeta]            Lista los checkpoints
  node skill_dey.mjs buscar-memoria <texto>     Busca en tu memoria solo lo relevante (BM25)
  node skill_dey.mjs ayuda                       Esta ayuda
Dentro de OpenCode: /skill_dey ayuda`;
async function main() {
  switch (cmd) {
    case "documentar":
      return console.log(documentar(cwd));
    case "empalme":
      return console.log(empalme(cwd));
    case "reglas":
      return console.log(listar(cwd));
    case "notas":
      return console.log(notasVersion(cwd));
    case "validar":
      return console.log(validacionServidor(cwd));
    case "produccion":
    case "logs":
      return console.log([erroresProduccion(cwd), sentryCheck(cwd)].filter(Boolean).join(`
`));
    case "formato":
      return console.log(formatear(cwd, false));
    case "organizar":
      return console.log(organizar(cwd));
    case "pdf":
      return console.log(documentosPdf(cwd));
    case "seguridad":
      return console.log([...resumenSeguridad(cwd).lineas, ...await auditarDependencias(cwd), await semgrep(cwd)].filter(Boolean).join(`
`));
    case "movil":
      return console.log(revisarMovil(cwd).lineas.join(`
`));
    case "multi-ia":
    case "multiia":
      return console.log(instalarMultiIA(cwd).lineas.join(`
`));
    case "doctor":
      return console.log(doctor().join(`
`));
    case "hook":
    case "git-hook":
      return console.log(instalarHook(cwd));
    case "reporte":
    case "informe":
      return console.log(reporte(cwd).join(`
`));
    case "mapa":
    case "mapa-mental":
    case "mindmap":
      return console.log(mapaMental(cwd).lineas.join(`
`));
    case "mockup":
    case "diseno":
      return console.log(generarMockup(cwd, url || "").lineas.join(`
`));
    case "prompt":
    case "optimizar":
      return console.log(optimizarPrompt(process.argv.slice(3).join(" ")));
    case "panel":
    case "observabilidad":
      return console.log(panel(cwd).lineas.join(`
`));
    case "checkpoint":
    case "hito":
      return console.log(checkpoint(cwd, url || ""));
    case "volver":
    case "restaurar":
      return console.log(volver(cwd, url || ""));
    case "hitos":
    case "checkpoints":
      return console.log(listarHitos(cwd));
    case "buscar-memoria":
    case "memoria": {
      const r = buscarMemoria(cwd, process.argv.slice(3).join(" "), 8);
      return console.log(r.length ? r.join(`
`) : "sin resultados");
    }
    case "pruebas":
    case "test": {
      const r = await pruebasProfesionales(cwd, url);
      console.log(r.lineas.join(`
`));
      process.exitCode = r.fallas ? 1 : 0;
      return;
    }
    case "capacitar":
    case "video": {
      const r = await capacitar(cwd, url);
      return console.log(r.lineas.join(`
`));
    }
    case "chrome":
    case "navegador":
    case "consola": {
      let base = url, app = null;
      if (!base) {
        app = await iniciarApp(cwd).catch(() => null);
        base = app?.url;
      }
      if (!base) {
        console.log("❌ no pude levantar la app: pásame la url");
        process.exitCode = 1;
        return;
      }
      try {
        const cdp = banderas.includes("--conectar") ? await chromeAbierto() : null;
        if (banderas.includes("--conectar") && !cdp) {
          console.log(`❌ no encontré tu Chrome con depuración. Ábrelo así y repite:
` + comoAbrirChrome());
          process.exitCode = 1;
          return;
        }
        const r = await rastrearSitio(cwd, base, asegurarPlaywright(cwd), 40, { visible: banderas.includes("--visible"), cdp });
        console.log(r.lineas.join(`
`));
        process.exitCode = r.ok ? 0 : 1;
      } finally {
        app?.detener?.();
      }
      return;
    }
    case "revisar": {
      const t = revisarTodo(cwd);
      console.log(t.lineas.join(`
`));
      const h = analizar(cwd);
      if (h.length)
        console.log(`
Hallazgos:
` + h.map((x) => `[${x.prioridad}·${x.tipo}] ${x.texto}
   ${x.donde.slice(0, 4).join(" · ")}`).join(`
`));
      process.exitCode = t.ok ? 0 : 1;
      return;
    }
    default:
      return console.log(AYUDA);
  }
}
main();
