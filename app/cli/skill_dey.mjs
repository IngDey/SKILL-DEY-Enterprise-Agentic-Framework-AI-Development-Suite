// skill_dey-lib/cli.ts
import { resolve } from "node:path";

// skill_dey-lib/documentar.ts
import { spawnSync as spawnSync2 } from "node:child_process";
import { existsSync as existsSync2, readFileSync as readFileSync3, writeFileSync, mkdirSync as mkdirSync2, readdirSync, statSync } from "node:fs";
import { join as join3, relative, basename as basename2 } from "node:path";

// skill_dey-lib/manual.ts
import { readFileSync } from "node:fs";
import { join, basename } from "node:path";
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
  const src = leer(join(cwd, f)), titulo = tituloPantalla(f, src);
  const C = campos(src), B = botones(src), M = mensajes(src), TH = columnas(src);
  const login = (C.some((c) => c.tipo === "contraseña") || /<form/i.test(src)) && /login|ingres|iniciar sesi|acceso|signin/i.test(basename(f) + " " + titulo);
  const graficos = /new Chart\(|chart\.js|apexcharts|echarts|highcharts|recharts|<canvas/i.test(src);
  const exporta = [/xlsx|excel|phpspreadsheet|\.csv/i.test(src) && "Excel/CSV", /pdf|dompdf|tcpdf|fpdf|jspdf|window\.print/i.test(src) && "PDF/impresión"].filter(Boolean);
  const elimina = /eliminar|borrar|delete/i.test(B.join(" ") + src.slice(0, 50000));
  const sesion = /\$_SESSION\[|session_start\(|Auth::|middleware\(['"]auth|useAuth|requireAuth|isAuthenticated/.test(src);
  const rol = src.match(/\$_SESSION\[['"](rol|role|perfil|tipo_usuario)['"]\]\s*[!=]==?\s*['"]([^'"]+)['"]/i)?.[2];
  const nombreArchivo = basename(f);
  const desde = todas.filter((o) => o !== f).map((o) => ({ o, s: leer(join(cwd, o)) })).filter(({ s }) => new RegExp(`href\\s*=\\s*["'][^"']*${nombreArchivo.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`, "i").test(s) || new RegExp(`to\\s*=\\s*["']/${nombreArchivo.replace(/\.[^.]+$/, "")}["']`).test(s)).map(({ o, s }) => {
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
  vistas = vistas.filter((v) => /<(html|body|form|table|div|main|section|h1|h2|template)\b|echo\s|print\s|<\?=|return\s*\(?\s*</i.test(leer(join(cwd, v))));
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

// skill_dey-lib/bd.ts
import { spawnSync } from "node:child_process";
import { readFileSync as readFileSync2, copyFileSync, existsSync, mkdirSync } from "node:fs";
import { join as join2, isAbsolute } from "node:path";
var leer2 = (p) => {
  try {
    return readFileSync2(p, "utf8");
  } catch {
    return "";
  }
};
function conexion(cwd) {
  const env = leer2(join2(cwd, ".env"));
  if (!env)
    return null;
  const v = (...ks) => {
    for (const k of ks) {
      const m = env.match(new RegExp(`^\\s*${k}\\s*=\\s*["']?([^"'\\r\\n#]*)`, "m"));
      if (m && m[1].trim())
        return m[1].trim();
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
  return { motor, host, port, db: motor === "sqlite" && !isAbsolute(db) ? join2(cwd, db) : db, user, pass };
}
function correr(c, cmd, sql = "", otraBd) {
  const db = otraBd ?? c.db;
  const r = c.motor === "sqlite" ? spawnSync("sqlite3", cmd === "dump" ? [db, ".schema"] : ["-noheader", db, sql], { encoding: "utf8", timeout: 25000 }) : c.motor === "pg" ? spawnSync(cmd === "dump" ? "pg_dump" : "psql", cmd === "dump" ? ["--schema-only", "--no-owner", "--no-privileges", "-h", c.host, ...c.port ? ["-p", c.port] : [], ...c.user ? ["-U", c.user] : [], db] : ["-tA", "-h", c.host, ...c.port ? ["-p", c.port] : [], ...c.user ? ["-U", c.user] : [], "-d", db, "-c", sql], { encoding: "utf8", timeout: 25000, env: { ...process.env, PGPASSWORD: c.pass } }) : spawnSync(cmd === "dump" ? "mysqldump" : "mysql", cmd === "dump" ? ["--no-data", "--skip-comments", "--skip-add-drop-table", "--skip-lock-tables", "-h", c.host, ...c.port ? ["-P", c.port] : [], ...c.user ? ["-u", c.user] : [], db] : ["-N", "-B", "-h", c.host, ...c.port ? ["-P", c.port] : [], ...c.user ? ["-u", c.user] : [], db, "-e", sql], { encoding: "utf8", timeout: 25000, env: { ...process.env, MYSQL_PWD: c.pass } });
  return { ok: r.status === 0, out: `${r.stdout ?? ""}`.trim() || `${r.stderr ?? r.error?.message ?? ""}`.trim() };
}
function volcarEsquema(cwd) {
  const c = conexion(cwd);
  if (!c)
    return { sql: "", motor: "" };
  const r = correr(c, "dump");
  return { sql: r.ok ? r.out : "", motor: { mysql: "MySQL/MariaDB", pg: "PostgreSQL", sqlite: "SQLite" }[c.motor] };
}
var consultaSegura = (sql) => /^\s*select\b/i.test(sql) && !/;\s*\S/.test(sql) && !/\b(insert|update|delete|drop|alter|create|truncate|grant|revoke|into\s+outfile|load_file|pg_sleep|sleep\s*\(|copy\s)\b/i.test(sql);
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

// skill_dey-lib/documentar.ts
var IGN = /(^|[\\/])(node_modules|vendor|dist|build|\.git|\.skill_dey|coverage|\.venv|venv|__pycache__)([\\/]|$)/;
function archivos(cwd) {
  const g = spawnSync2("git", ["ls-files", "-co", "--exclude-standard"], { cwd, encoding: "utf8", maxBuffer: 1e8 });
  if (g.status === 0)
    return g.stdout.split(/\r?\n/).filter((f) => f && !IGN.test(f));
  const out = [];
  const walk = (d) => {
    for (const e of readdirSync(d)) {
      const p = join3(d, e);
      if (IGN.test(p))
        continue;
      statSync(p).isDirectory() ? walk(p) : out.push(relative(cwd, p));
    }
  };
  walk(cwd);
  return out;
}
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
        pk[1].split(",").forEach((c2) => {
          const x = cols.find((k) => k.nombre === c2.replace(/[`"\s]/g, ""));
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
  const sqlArchivos = fs.filter((f) => f.endsWith(".sql") && !f.endsWith("database/instalacion.sql")).sort();
  let tablas = [];
  for (const f of sqlArchivos)
    tablas.push(...desdeSQL(leer3(join3(cwd, f)), f));
  for (const f of fs.filter((f2) => f2.endsWith("schema.prisma")))
    tablas.push(...desdePrisma(leer3(join3(cwd, f)), f));
  for (const f of fs.filter((f2) => /migrations?[\\/].*\.php$/.test(f2)).sort())
    tablas.push(...desdeLaravel(leer3(join3(cwd, f)), f));
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
  const env = leer3(join3(cwd, ".env.example")) + leer3(join3(cwd, "prisma", "schema.prisma"));
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
    doc = re.test(doc) ? doc.replace(re, bloque) : doc.trimEnd() + `

` + bloque + `
`;
  }
  mkdirSync2(join3(ruta, ".."), { recursive: true });
  writeFileSync(ruta, doc);
}
function documentar(cwd) {
  const fs = archivos(cwd), hecho = [];
  const pkg = (() => {
    try {
      return JSON.parse(leer3(join3(cwd, "package.json")));
    } catch {
      return null;
    }
  })();
  const comp = (() => {
    try {
      return JSON.parse(leer3(join3(cwd, "composer.json")));
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
    conAuto(join3(cwd, "docs", "DICCIONARIO-DATOS.md"), `Diccionario de datos — ${nombreApp}`, { resumen: `Motor: ${motor} · Tablas: ${tablas.length} · Actualizado: ${fecha}`, tablas: dic }, `Descripción funcional de las tablas (escríbela aquí; lo de abajo se actualiza solo):
`);
    hecho.push(`docs/DICCIONARIO-DATOS.md (${tablas.length} tablas)`);
    let script = "";
    const prisma = fs.find((f) => f.endsWith("schema.prisma"));
    if (prisma && existsSync2(join3(cwd, "node_modules", ".bin", process.platform === "win32" ? "prisma.cmd" : "prisma"))) {
      const r2 = spawnSync2("npx", ["--no-install", "prisma", "migrate", "diff", "--from-empty", "--to-schema-datamodel", prisma, "--script"], { cwd, encoding: "utf8", shell: process.platform === "win32", timeout: 120000 });
      if (r2.status === 0)
        script = r2.stdout;
    }
    const ddl = (ts) => ts.map((t) => `CREATE TABLE IF NOT EXISTS ${t.nombre} (
${t.columnas.map((c) => `  ${c.nombre} ${c.tipo}${c.nulo ? "" : " NOT NULL"}${c.defecto ? " DEFAULT " + c.defecto : ""}${c.clave === "PK" ? " PRIMARY KEY" : c.clave === "UNIQUE" ? " UNIQUE" : ""}`).concat(t.columnas.filter((c) => c.clave?.startsWith("FK → ")).map((c) => `  FOREIGN KEY (${c.nombre}) REFERENCES ${c.clave.slice(5).replace(".", "(")})`)).join(`,
`)}
);`).join(`

`);
    if (!script) {
      const deSQL = sqlArchivos.map((f) => `-- ===== ${f} =====
${leer3(join3(cwd, f)).trim()}
`).join(`
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
    mkdirSync2(join3(cwd, "database"), { recursive: true });
    writeFileSync(join3(cwd, "database", "instalacion.sql"), `-- Script de instalación de la base de datos — ${nombreApp}
-- Motor: ${motor} · Generado por skill_dey el ${fecha} a partir de: ${[...new Set(tablas.map((t) => t.origen))].join(", ")}
-- Uso: crear la BD vacía y ejecutar este archivo. Revisar tipos si se cambia de motor.

${script.trim()}
`);
    hecho.push("database/instalacion.sql");
  }
  const ex = leer3(join3(cwd, ".env.example")).split(/\r?\n/).filter((l) => /^\s*[A-Z_][A-Z0-9_]*\s*=/.test(l)).map((l) => {
    const [k, ...r2] = l.split("=");
    const coment = r2.join("=").split("#").slice(1).join("#").trim();
    return `| ${k.trim()} | ${coment} |`;
  });
  const scripts = [...Object.entries(pkg?.scripts ?? {}).map(([k, v]) => `| npm run ${k} | ${v} |`), ...Object.entries(comp?.scripts ?? {}).map(([k, v]) => `| composer ${k} | ${Array.isArray(v) ? v.join(" && ") : v} |`)];
  const stack = [pkg && "Node.js", comp && "PHP (Composer)", fs.some((f) => f.endsWith(".php")) && !comp && "PHP", fs.some((f) => f.endsWith(".py")) && "Python", fs.some((f) => /\.(tsx?|jsx)$/.test(f)) && "TypeScript/JSX", pkg?.dependencies?.react && "React", pkg?.dependencies?.vue && "Vue", pkg?.dependencies?.express && "Express", comp?.require?.["laravel/framework"] && "Laravel"].filter(Boolean).join(" · ");
  const rutas = [];
  for (const f of fs.filter((f2) => /\.(m?[jt]s|php|py)$/.test(f2)).slice(0, 800)) {
    const t = leer3(join3(cwd, f));
    for (const m of t.matchAll(/(?:app|router|Route)(?:\.|::)(get|post|put|patch|delete)\s*\(\s*['"]([^'"]+)['"]/gi))
      rutas.push(`| ${m[1].toUpperCase()} | ${m[2]} | ${f} |`);
    for (const m of t.matchAll(/@(?:app|bp|router)\.(get|post|put|delete|route)\(\s*['"]([^'"]+)['"]/g))
      rutas.push(`| ${m[1].toUpperCase()} | ${m[2]} | ${f} |`);
  }
  const paginas = fs.filter((f) => f.endsWith(".php") && !/vendor|config|includes?|lib|src[\\/]|app[\\/]|clases?|models?|controllers?|migrations?|tests?/i.test(f));
  const carpetas = [...new Set(fs.map((f) => f.split(/[\\/]/)[0]).filter((d) => !d.includes(".")))].slice(0, 25);
  const deps = Object.keys({ ...pkg?.dependencies ?? {}, ...comp?.require ?? {} }).slice(0, 40);
  conAuto(join3(cwd, "docs", "MANUAL-TECNICO.md"), `Manual técnico — ${nombreApp}`, {
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
  const mu = join3(cwd, "docs", "MANUAL-USUARIO.md");
  let doc = existsSync2(mu) ? readFileSync3(mu, "utf8") : `# Manual de usuario — ${nombreApp}

Cómo usar la aplicación, pantalla por pantalla.
`;
  const r = manualUsuario(cwd, vistas, doc);
  mkdirSync2(join3(cwd, "docs"), { recursive: true });
  writeFileSync(mu, r.doc);
  hecho.push(`docs/MANUAL-USUARIO.md (${r.fichas} pantallas documentadas)`);
  return `Documentación actualizada: ${hecho.join(" · ")}`;
}

// skill_dey-lib/escaneo.ts
import { spawnSync as spawnSync5 } from "node:child_process";
import { existsSync as existsSync3, readFileSync as readFileSync5, statSync as statSync3 } from "node:fs";
import { join as join6 } from "node:path";

// skill_dey-lib/sintaxis.ts
import { spawnSync as spawnSync3 } from "node:child_process";
import { readFileSync as readFileSync4, writeFileSync as writeFileSync2, rmSync } from "node:fs";
import { join as join4, basename as basename3, isAbsolute as isAbsolute2 } from "node:path";
import { tmpdir } from "node:os";
function errorJs(cwd, archivo) {
  const abs = isAbsolute2(archivo) ? archivo : join4(cwd, archivo);
  let src = "";
  try {
    src = readFileSync4(abs, "utf8");
  } catch {
    return "";
  }
  if (/\.js$/i.test(abs) && /<[A-Za-z][\w.]*[\s>\/]/.test(src) && /(\/>|<\/[A-Za-z])/.test(src))
    return "";
  const esm = /\.js$/i.test(abs) && /^\s*(import\s|import\{|export\s|export\{)/m.test(src);
  const tmp = esm ? join4(tmpdir(), `skill_dey-chk-${process.pid}-${Date.now()}-${basename3(abs)}.mjs`) : "";
  if (tmp)
    writeFileSync2(tmp, src);
  const r = spawnSync3("node", ["--check", tmp || abs], { cwd, encoding: "utf8", timeout: 20000 });
  if (tmp)
    try {
      rmSync(tmp);
    } catch {}
  if (r.error || r.status === 0)
    return "";
  return `${r.stdout ?? ""}${r.stderr ?? ""}`.split(tmp || "\x00").join(archivo).split(/\r?\n/).filter((l) => l.trim() && !/^\s*at \S|^Node\.js v/.test(l)).slice(-6).join(`
`);
}

// skill_dey-lib/listar.ts
import { spawnSync as spawnSync4 } from "node:child_process";
import { readdirSync as readdirSync2, statSync as statSync2 } from "node:fs";
import { join as join5, relative as relative2 } from "node:path";
var IGN2 = /(^|[\\/])(node_modules|vendor|dist|build|\.git|\.skill_dey|coverage|\.venv|venv|__pycache__|\.next|\.nuxt|storage[\\/]framework|bootstrap[\\/]cache)([\\/]|$)|\.min\.(js|css)$|\.bundle\.js$/i;
function listarArchivos(cwd, maxFiles = 20000) {
  const g = spawnSync4("git", ["ls-files", "-co", "--exclude-standard"], { cwd, encoding: "utf8", maxBuffer: 1e8 });
  if (g.status === 0 && g.stdout.trim())
    return g.stdout.split(/\r?\n/).filter((f) => f && !IGN2.test(f));
  const out = [];
  const walk = (d, prof) => {
    if (out.length >= maxFiles || prof > 12)
      return;
    let ents = [];
    try {
      ents = readdirSync2(d);
    } catch {
      return;
    }
    for (const e of ents) {
      if (e.startsWith(".") && e !== ".env.example")
        continue;
      const p = join5(d, e);
      const rel = relative2(cwd, p);
      if (IGN2.test(rel) || IGN2.test("/" + rel))
        continue;
      let st;
      try {
        st = statSync2(p);
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

// skill_dey-lib/escaneo.ts
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
  const falla = (titulo, det) => {
    errores += det.length || 1;
    L.push(`❌ ${titulo}`, ...det.slice(0, 10).map((d) => "   " + d.replace(cwd, "").slice(0, 200)), ...det.length > 10 ? [`   … y ${det.length - 10} más`] : []);
  };
  const php = files.filter((f) => f.endsWith(".php"));
  if (php.length && hay("php", cwd)) {
    const malos = [];
    for (let i = 0;i < php.length; i += 40) {
      const lote = php.slice(i, i + 40);
      const r = sh(lote.map((f) => `php -l "${f}"`).join(WIN ? " & " : " ; "), cwd, 120000);
      for (const l of r.out.split(/\r?\n/))
        if (/(Parse error|Fatal error|Errors parsing)/i.test(l) && !/No syntax errors/i.test(l))
          malos.push(l.trim());
    }
    malos.length ? falla(`PHP: ${malos.length} archivo(s) con error de sintaxis (de ${php.length})`, malos) : L.push(`✅ PHP: ${php.length} archivos sin errores de sintaxis`);
  }
  const js = files.filter((f) => /\.(m?js|cjs)$/.test(f));
  if (js.length) {
    const malos = [];
    for (const f of js) {
      const x = errorJs(cwd, f);
      if (x)
        malos.push(`${f}: ${(x.split(/\r?\n/).find((l) => /Error/.test(l)) ?? "error").trim()}`);
    }
    malos.length ? falla(`JavaScript: ${malos.length} archivo(s) con error (de ${js.length})`, malos) : L.push(`✅ JavaScript: ${js.length} archivos sin errores de sintaxis`);
  }
  const py = files.filter((f) => f.endsWith(".py"));
  const pyCmd = ["python3", "python", "py"].find((c) => sh(`${c} --version`, cwd, 1e4).code === 0);
  if (py.length && pyCmd) {
    const r = sh(`${pyCmd} -m py_compile ${py.map((f) => `"${f}"`).join(" ")}`, cwd, 300000);
    r.code !== 0 ? falla("Python: errores de sintaxis", r.out.split(/\r?\n/).filter((l) => /Error|File "/.test(l))) : L.push(`✅ Python: ${py.length} archivos sin errores de sintaxis`);
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

// skill_dey-lib/adopcion.ts
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
function analizar(cwd) {
  const files = listarArchivos(cwd).filter((f) => f && !IGN4.test(f) && /\.(php|m?[jt]sx?|cjs|vue|svelte|py|html|blade\.php|twig|sql)$/.test(f) && existsSync4(join7(cwd, f)) && statSync4(join7(cwd, f)).size < 1500000);
  const H = [];
  const add = (prioridad, tipo, texto, donde) => {
    if (donde.length)
      H.push({ prioridad, tipo, texto, donde: [...new Set(donde)].slice(0, 12) });
  };
  const buscar = (re, filtro = () => true, excluir) => {
    const r = [];
    for (const f of files.filter(filtro))
      leer4(join7(cwd, f)).split(/\r?\n/).forEach((l, i) => {
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
  for (const f of files.filter((f2) => php(f2) || js(f2) || py(f2)))
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
  for (const [k, variantes] of estados)
    if (variantes.size > 1)
      add("MEDIO", "lógica", `Mismo estado/valor escrito distinto (${[...variantes.keys()].map((x) => `"${x}"`).join(" vs ")}): comparaciones que fallan en silencio`, [...variantes.values()].flat());
  const requeridosFront = new Set;
  for (const f of files.filter((f2) => /\.(html|php|vue|[jt]sx|blade\.php|twig)$/.test(f2)))
    for (const m of leer4(join7(cwd, f)).matchAll(/<(?:input|select|textarea)[^>]*\brequired\b[^>]*>/gi)) {
      const n = m[0].match(/name=["']([\w\[\]]+)["']/)?.[1];
      if (n)
        requeridosFront.add(n.replace(/\[\]$/, ""));
    }
  const sinValidarBack = [];
  for (const n of requeridosFront) {
    const usos = buscar(new RegExp(`\\$_(POST|REQUEST)\\[['"]${n}['"]\\]|req\\.body\\.${n}\\b|request\\.(form|json)\\[['"]${n}['"]\\]`), (f) => php(f) || js(f) || py(f));
    const validado = buscar(new RegExp(`(empty|isset|filter_var|validate|trim|required|strlen)\\s*\\(?[^\\n]*${n}|${n}['"]?\\s*=>\\s*['"][^'"]*required|if\\s*\\(\\s*!\\s*(req\\.body\\.)?${n}\\b`), (f) => php(f) || js(f) || py(f));
    if (usos.length && !validado.length)
      sinValidarBack.push(`${n} (${usos[0]})`);
  }
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

// skill_dey-lib/empalme.ts
import { spawnSync as spawnSync8 } from "node:child_process";
import { existsSync as existsSync7, readFileSync as readFileSync10, writeFileSync as writeFileSync6, mkdirSync as mkdirSync6, statSync as statSync5, readdirSync as readdirSync5 } from "node:fs";
import { join as join11, basename as basename5 } from "node:path";

// skill_dey-lib/procesos.ts
import { spawn as spawn2, spawnSync as spawnSync7 } from "node:child_process";
import { existsSync as existsSync6, readFileSync as readFileSync8, mkdirSync as mkdirSync4, writeFileSync as writeFileSync4, readdirSync as readdirSync4 } from "node:fs";
import { join as join9, basename as basename4 } from "node:path";

// skill_dey-lib/app.ts
import { spawn, spawnSync as spawnSync6 } from "node:child_process";
import { existsSync as existsSync5, readFileSync as readFileSync7, mkdirSync as mkdirSync3, writeFileSync as writeFileSync3, readdirSync as readdirSync3 } from "node:fs";
import { join as join8, relative as relative3 } from "node:path";
import { homedir, tmpdir as tmpdir2 } from "node:os";
import { createServer } from "node:net";
var WIN2 = process.platform === "win32";
var PW_DIR = join8(homedir(), ".config", "opencode", "skill_dey", "playwright");
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
    if (WIN2)
      spawnSync6("taskkill", ["/pid", String(p.pid), "/T", "/F"], { timeout: 8000 });
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
  const f = join8(tmpdir2(), "skill_dey-router.php");
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
  return ["public", "public_html", "www", "htdocs", "web"].map((d) => join8(cwd, d)).find(existsSync5) ?? cwd;
}
async function iniciarApp(cwd) {
  const pkg = (() => {
    try {
      return JSON.parse(readFileSync7(join8(cwd, "package.json"), "utf8"));
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
  } else if (existsSync5(join8(cwd, "artisan"))) {
    cmd = `php artisan serve --port=${puerto}`;
    como = "php artisan serve";
  } else if (existsSync5(join8(cwd, "manage.py"))) {
    cmd = `${WIN2 ? "python" : "python3"} manage.py runserver 127.0.0.1:${puerto}`;
    como = "django runserver";
  } else if (existsSync5(join8(cwd, "composer.json")) || existsSync5(join8(cwd, "index.php")) || existsSync5(join8(docrootPhp(cwd), "index.php")) || readdirSync3(docrootPhp(cwd)).some((f) => f.endsWith(".php"))) {
    cmd = `php -d display_errors=1 -d error_reporting=E_ALL -d log_errors=1 -S 127.0.0.1:${puerto} -t "${docrootPhp(cwd)}" "${routerPhp()}"`;
    como = "php -S";
  } else if (existsSync5(join8(cwd, "index.html"))) {
    cmd = `${WIN2 ? "python" : "python3"} -m http.server ${puerto} --bind 127.0.0.1`;
    como = "servidor estático";
  }
  if (!cmd)
    return null;
  const log = [];
  const p = spawn(cmd, { cwd, shell: true, env, detached: !WIN2, stdio: ["ignore", "pipe", "pipe"] });
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
    if (m)
      url = `http://127.0.0.1:${m[2]}`;
    const errores = () => log.join("").split(/\r?\n/).filter((l) => /(PHP )?(Fatal error|Parse error|Warning|Notice|Deprecated)|Traceback|Error:|Exception|UnhandledPromise|ERR!/i.test(l) && !/DeprecationWarning: The `punycode`/.test(l)).map((l) => l.trim().slice(0, 200));
    if (await responde(url, 1500))
      return { url, detener: () => matar(p), como, errores };
    if (p.exitCode !== null)
      break;
  }
  matar(p);
  return null;
}
function asegurarPlaywright(cwdProyecto) {
  const local = join8(cwdProyecto, "node_modules", "playwright");
  if (existsSync5(local))
    return join8(cwdProyecto, "package.json");
  const pj = join8(PW_DIR, "package.json");
  if (!existsSync5(join8(PW_DIR, "node_modules", "playwright"))) {
    mkdirSync3(PW_DIR, { recursive: true });
    if (!existsSync5(pj))
      writeFileSync3(pj, JSON.stringify({ name: "skill-dey-playwright", private: true }));
    const i = spawnSync6("npm", ["i", "playwright", "@axe-core/playwright", "--no-audit", "--no-fund", "--silent"], { cwd: PW_DIR, shell: WIN2, timeout: 300000 });
    if (i.status !== 0)
      return null;
    spawnSync6("npx", ["playwright", "install", "chromium"], { cwd: PW_DIR, shell: WIN2, timeout: 600000 });
  }
  return pj;
}
function rutasAProbar(cwd, archivos2) {
  const root = docrootPhp(cwd);
  const php = archivos2.filter((f) => f.endsWith(".php") && !/vendor|config|includes?|lib|src\/|app\/|clases?|models?|controllers?/i.test(f)).map((f) => "/" + relative3(root, join8(cwd, f)).replace(/\\/g, "/")).filter((r) => !r.startsWith("/.."));
  const html = archivos2.filter((f) => f.endsWith(".html")).map((f) => "/" + relative3(root, join8(cwd, f)).replace(/\\/g, "/")).filter((r) => !r.startsWith("/.."));
  return [...new Set(["/", ...php, ...html])].slice(0, 6);
}

// skill_dey-lib/procesos.ts
var WIN3 = process.platform === "win32";
var DEV = /\b(node|nodemon|tsx|ts-node|vite|next|nuxt|npm|npx|pnpm|yarn|bun|deno|php|php-cgi|artisan|python\d*|uvicorn|gunicorn|flask|java|dotnet|ruby|rails|go|air|webpack|esbuild)\b/i;
var SISTEMA = /\b(systemd|launchd|explorer|svchost|wininit|lsass|csrss|winlogon|services\.exe|kernel|WindowServer|loginwindow|sshd|postgres|mysqld|mariadbd|redis-server|mongod|docker|com\.docker|opencode)\b/i;
function sh2(c, t = 8000) {
  const r = spawnSync7(c, { shell: true, encoding: "utf8", timeout: t });
  return r.status === 0 ? r.stdout : "";
}
function escuchando() {
  const out = [];
  if (WIN3) {
    const tareas = new Map;
    for (const l of sh2("tasklist /fo csv /nh").split(/\r?\n/)) {
      const m = l.match(/^"([^"]+)","(\d+)"/);
      if (m)
        tareas.set(Number(m[2]), m[1]);
    }
    for (const l of sh2("netstat -ano -p tcp").split(/\r?\n/)) {
      const m = l.match(/TCP\s+\S+:(\d+)\s+\S+\s+LISTENING\s+(\d+)/i);
      if (m)
        out.push({ puerto: Number(m[1]), pid: Number(m[2]), cmd: tareas.get(Number(m[2])) ?? "" });
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
var esDeDesarrollo = (p) => p.pid > 1 && p.pid !== process.pid && p.pid !== process.ppid && DEV.test(p.cmd) && !SISTEMA.test(p.cmd);
function matarArbol(pid) {
  try {
    if (WIN3) {
      spawnSync7("taskkill", ["/pid", String(pid), "/T", "/F"], { timeout: 8000 });
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
function liberarPuerto(puerto) {
  const ps = escuchando().filter((p) => p.puerto === puerto);
  if (!ps.length)
    return `puerto ${puerto} libre`;
  const r = [];
  for (const p of ps) {
    if (esDeDesarrollo(p)) {
      matarArbol(p.pid);
      r.push(`detenido PID ${p.pid} (${p.cmd.slice(0, 60)}) que ocupaba ${puerto}`);
    } else
      r.push(`⚠ ${puerto} lo usa "${p.cmd.slice(0, 50)}" (no es de desarrollo o es del sistema/BD): no lo toco, avisa al usuario`);
  }
  const quedan = escuchando().filter((p) => p.puerto === puerto && esDeDesarrollo(p));
  if (quedan.length) {
    for (const p of quedan)
      matarArbol(p.pid);
    if (WIN3) {
      for (const l of sh2(`netstat -ano -p tcp | findstr :${puerto}`, 5000).split(/\r?\n/)) {
        const m = l.match(/LISTENING\s+(\d+)/i);
        if (m)
          spawnSync7("taskkill", ["/pid", m[1], "/T", "/F"], { timeout: 8000 });
      }
    } else
      sh2(`fuser -k ${puerto}/tcp 2>/dev/null; lsof -ti tcp:${puerto} 2>/dev/null | xargs -r kill -9 2>/dev/null`, 5000);
  }
  return r.join(`
`);
}
var leer5 = (p) => {
  try {
    return readFileSync8(p, "utf8");
  } catch {
    return "";
  }
};
function puertoEnv(dir) {
  const env = leer5(join9(dir, ".env")) + `
` + leer5(join9(dir, ".env.example"));
  const m = env.match(/^\s*(?:APP_)?PORT\s*=\s*(\d{2,5})/m) ?? env.match(/^\s*(?:SERVER|API|BACKEND)_PORT\s*=\s*(\d{2,5})/m);
  return m ? Number(m[1]) : undefined;
}
function detectar(dir, nombre) {
  const pkg = (() => {
    try {
      return JSON.parse(leer5(join9(dir, "package.json")));
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
  if (existsSync6(join9(dir, "artisan")))
    return { nombre, dir, tipo: "backend", cmd: "php artisan serve --port=" + (puertoEnv(dir) ?? 8000), puerto: puertoEnv(dir) ?? 8000 };
  if (existsSync6(join9(dir, "manage.py")))
    return { nombre, dir, tipo: "backend", cmd: `${WIN3 ? "python" : "python3"} manage.py runserver ${puertoEnv(dir) ?? 8000}`, puerto: puertoEnv(dir) ?? 8000 };
  const docroot = ["public", "public_html", "www", "htdocs"].map((d) => join9(dir, d)).find(existsSync6) ?? dir;
  const hayPhp = (() => {
    try {
      return readdirSync4(docroot).some((f) => f.endsWith(".php"));
    } catch {
      return false;
    }
  })();
  if (existsSync6(join9(docroot, "index.php")) || existsSync6(join9(dir, "composer.json")) || hayPhp) {
    const p = puertoEnv(dir) ?? 8000;
    return { nombre, dir, tipo: "app", cmd: `php -d display_errors=1 -d error_reporting=E_ALL -S 127.0.0.1:${p} -t "${docroot}" "${routerPhp()}"`, puerto: p };
  }
  return null;
}
function servicios(cwd) {
  const s = [];
  const raizPhp = (() => {
    try {
      return existsSync6(join9(cwd, "composer.json")) || readdirSync4(cwd).some((f) => f.endsWith(".php"));
    } catch {
      return false;
    }
  })();
  for (const d of ["backend", "server", "api", "back", "servidor", "frontend", "client", "web", "front", "cliente", "app"]) {
    const x = existsSync6(join9(cwd, d)) ? detectar(join9(cwd, d), d) : null;
    if (x && !(raizPhp && x.cmd.includes(" -S ") && !existsSync6(join9(cwd, d, "composer.json"))))
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
async function arranqueLimpio(cwd, espera = Number(process.env.SKILL_DEY_ARRANQUE_MS) || 22000) {
  const topeTotal = Date.now() + Math.min(espera * 3 + 1e4, 90000);
  const notas = [], lista = [];
  for (const s of servicios(cwd)) {
    const lib = liberarPuerto(s.puerto);
    if (!/libre/.test(lib))
      notas.push(lib);
    const log = [];
    const p = spawn2(s.cmd, { cwd: s.dir, shell: true, detached: !WIN3, env: { ...process.env, BROWSER: "none", CI: "1", FORCE_COLOR: "0" }, stdio: ["ignore", "pipe", "pipe"] });
    const tomar = (b) => {
      log.push(b.toString());
      if (log.length > 400)
        log.shift();
    };
    p.stdout?.on("data", tomar);
    p.stderr?.on("data", tomar);
    let url = `http://127.0.0.1:${s.puerto}`, ok = false;
    const fin = Math.min(Date.now() + espera, topeTotal);
    while (Date.now() < fin) {
      const m = log.join("").match(/https?:\/\/(?:localhost|127\.0\.0\.1|0\.0\.0\.0|\[::1?\]):(\d+)/);
      if (m)
        url = `http://127.0.0.1:${m[1]}`;
      if (/EADDRINUSE|address already in use|port .* (is )?(already )?in use/i.test(log.join(""))) {
        const pt = Number(log.join("").match(/(?:EADDRINUSE[^\d]*|port\s+)(\d{2,5})/i)?.[1] ?? s.puerto);
        notas.push(liberarPuerto(pt));
        break;
      }
      if (await responde2(url)) {
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
          matarArbol(p.pid);
      } catch {}
      try {
        const q = escuchando().filter((x) => x.puerto === s.puerto && esDeDesarrollo(x));
        for (const x of q)
          matarArbol(x.pid);
      } catch {}
    };
    lista.push({ s, url, ok, pid: p.pid, errores: ok ? errores : [...errores, p.exitCode !== null ? `el proceso terminó (código ${p.exitCode})` : "no respondió a tiempo"].slice(0, 8), detener });
    if (!ok && s.tipo === "backend")
      notas.push(`backend "${s.nombre}" no subió: el frontend dependerá de él`);
  }
  mkdirSync4(join9(cwd, ".skill_dey"), { recursive: true });
  writeFileSync4(join9(cwd, ".skill_dey", "procesos.json"), JSON.stringify(lista.map((a) => ({ servicio: a.s.nombre, tipo: a.s.tipo, url: a.url, ok: a.ok, pid: a.pid, puerto: a.s.puerto })), null, 1));
  return { lista, notas };
}

// skill_dey-lib/reglas.ts
import { readFileSync as readFileSync9, writeFileSync as writeFileSync5, mkdirSync as mkdirSync5 } from "node:fs";
import { join as join10 } from "node:path";
import { homedir as homedir2 } from "node:os";
var GLOBAL = join10(homedir2(), ".config", "opencode", "skill_dey");
var VACUNAS = join10(GLOBAL, "VACUNAS.json");
var leerJ = (p, d) => {
  try {
    return JSON.parse(readFileSync9(p, "utf8"));
  } catch {
    return d;
  }
};
var vacunas = () => leerJ(VACUNAS, []);
var archivoReglas = (cwd) => join10(cwd, ".skill_dey", "REGLAS.json");
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

// skill_dey-lib/empalme.ts
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
      return JSON.parse(leer6(join11(cwd, "package.json")));
    } catch {
      return null;
    }
  })();
  const app = pkg?.name ?? basename5(cwd), fecha = new Date().toISOString().slice(0, 10);
  const negocio = leer6(join11(cwd, ".skill_dey", "NEGOCIO.md")).split(`
`).filter((l) => l.trim() && !l.startsWith("#") && !/…\s*$/.test(l)).slice(0, 15);
  const ejemplo = nombres(leer6(join11(cwd, ".env.example"))), reales = nombres(leer6(join11(cwd, ".env")));
  const faltan = reales.filter((n) => !ejemplo.includes(n));
  const srv = servicios(cwd), c = conexion(cwd);
  const pantallas = (leer6(join11(cwd, "docs", "MANUAL-USUARIO.md")).match(/^## .+$/gm) ?? []).map((h) => h.slice(3));
  const H = (() => {
    try {
      return analizar(cwd).filter((h) => h.prioridad === "CRÍTICO" || h.prioridad === "ALTO");
    } catch {
      return [];
    }
  })();
  const errores = (leer6(join11(cwd, ".skill_dey", "ERRORES-SITIO.md")).match(/^- \[ \] .+$/gm) ?? []).slice(0, 10);
  const pendientes = leer6(join11(cwd, ".skill_dey", "ESTADO.md")).split(`
`).filter((l) => /PAUSAD|PENDIENTE|pendiente|\[ \]/.test(l)).slice(0, 10);
  const log = spawnSync8("git", ["log", "--date=short", "--pretty=format:%ad · %s", "-25"], { cwd, encoding: "utf8" }).stdout?.trim() ?? "";
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
  mkdirSync6(join11(cwd, "docs"), { recursive: true });
  writeFileSync6(join11(cwd, "docs", "EMPALME.md"), doc);
  return `✅ Paquete de empalme listo: docs/EMPALME.md (+ ${docs.replace("Documentación actualizada: ", "")})${faltan.length ? `
⚠ ${faltan.length} variable(s) del .env sin documentar en .env.example` : ""}
Completa a mano solo: "Qué es" (si quedó vacío) y "Contactos".`;
}

// skill_dey-lib/saber.ts
import { existsSync as existsSync8, readFileSync as readFileSync11, writeFileSync as writeFileSync7, mkdirSync as mkdirSync7, appendFileSync } from "node:fs";
import { join as join12 } from "node:path";
import { spawnSync as spawnSync9 } from "node:child_process";
function notasVersion(cwd) {
  const log = spawnSync9("git", ["log", "--date=short", "--pretty=format:%s", "-40"], { cwd, encoding: "utf8" }).stdout?.trim() ?? "";
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
  mkdirSync7(join12(cwd, "docs"), { recursive: true });
  writeFileSync7(join12(cwd, "docs", "NOVEDADES.md"), doc);
  return `✅ Notas de versión en docs/NOVEDADES.md:

` + doc;
}

// skill_dey-lib/extras.ts
import { spawnSync as spawnSync10 } from "node:child_process";
import { existsSync as existsSync9, readFileSync as readFileSync12, writeFileSync as writeFileSync8, statSync as statSync6 } from "node:fs";
import { join as join13, basename as basename6 } from "node:path";
var leer7 = (p) => {
  try {
    return readFileSync12(p, "utf8");
  } catch {
    return "";
  }
};
var sh3 = (c, cwd, t = 120000) => {
  const r = spawnSync10(c, { cwd, shell: true, encoding: "utf8", timeout: t, maxBuffer: 50000000 });
  return { code: r.status ?? 1, out: `${r.stdout ?? ""}${r.stderr ?? ""}` };
};
var hay2 = (c, cwd) => sh3(process.platform === "win32" ? `where ${c}` : `command -v ${c}`, cwd, 8000).code === 0;
var archivos2 = (cwd) => listarArchivos(cwd);
function formatear(cwd, soloCambiados = true) {
  const files = soloCambiados ? spawnSync10("git", ["diff", "--name-only", "HEAD"], { cwd, encoding: "utf8" }).stdout.split(/\r?\n/).filter(Boolean) : [];
  const existe = (...f) => f.some((x) => existsSync9(join13(cwd, x)));
  const r = [];
  const prettier = existe(".prettierrc", ".prettierrc.json", ".prettierrc.js", "prettier.config.js") || /"prettier"/.test(leer7(join13(cwd, "package.json")));
  if (prettier && existsSync9(join13(cwd, "node_modules", ".bin", "prettier"))) {
    const js = files.filter((f) => /\.(m?[jt]sx?|cjs|vue|svelte|css|scss|json|html|md)$/.test(f));
    if (js.length || !soloCambiados) {
      const t = sh3(`npx --no-install prettier --write ${soloCambiados ? js.map((f) => `"${f}"`).join(" ") : "."}`, cwd);
      if (t.code === 0)
        r.push(`prettier: ${js.length || "todos"} archivo(s)`);
    }
  }
  if (existe("vendor/bin/php-cs-fixer", ".php-cs-fixer.php", ".php-cs-fixer.dist.php")) {
    const t = sh3("php vendor/bin/php-cs-fixer fix --quiet 2>/dev/null || vendor/bin/php-cs-fixer fix --quiet", cwd);
    if (t.code === 0)
      r.push("php-cs-fixer");
  } else if (existe(".pint.json") || existsSync9(join13(cwd, "vendor/bin/pint"))) {
    const t = sh3("vendor/bin/pint --quiet", cwd);
    if (t.code === 0)
      r.push("laravel pint");
  }
  const py = files.filter((f) => f.endsWith(".py"));
  if ((py.length || !soloCambiados) && hay2("black", cwd)) {
    const t = sh3(`black -q ${soloCambiados ? py.map((f) => `"${f}"`).join(" ") : "."}`, cwd);
    if (t.code === 0)
      r.push("black");
  } else if ((py.length || !soloCambiados) && hay2("ruff", cwd)) {
    sh3(`ruff format ${soloCambiados ? py.map((f) => `"${f}"`).join(" ") : "."}`, cwd);
    r.push("ruff format");
  }
  return r.length ? `✅ formato aplicado (${r.join(" · ")})` : "⏭ formato: el proyecto no tiene formateador configurado (prettier/php-cs-fixer/pint/black/ruff)";
}
function validacionServidor(cwd) {
  const req = new Set;
  for (const f of archivos2(cwd).filter((f2) => /\.(html|php|vue|[jt]sx|blade\.php|twig)$/.test(f2)))
    for (const m of leer7(join13(cwd, f)).matchAll(/<(?:input|select|textarea)[^>]*\brequired\b[^>]*>/gi)) {
      const n = m[0].match(/name=["']([\w[\]]+)["']/)?.[1];
      if (n)
        req.add(n.replace(/\[\]$/, ""));
    }
  if (!req.size)
    return "No hay campos obligatorios en formularios, o es una SPA (valida en el controlador de la API).";
  const sinValidar = [];
  for (const n of req) {
    const usado = archivos2(cwd).some((f) => new RegExp(`\\$_(POST|REQUEST)\\[['"]${n}['"]\\]|req\\.body\\.${n}\\b|request\\.(form|json)`).test(leer7(join13(cwd, f))));
    const validado = archivos2(cwd).some((f) => new RegExp(`(empty|isset|filter_var|validate|trim|required)\\s*\\(?[^\\n]*${n}|["']${n}["']\\s*=>\\s*['"][^'"]*required|if\\s*\\(\\s*!\\s*(req\\.body\\.)?${n}\\b`).test(leer7(join13(cwd, f))));
    if (usado && !validado)
      sinValidar.push(n);
  }
  if (!sinValidar.length)
    return "✅ validación de servidor: todos los campos obligatorios se validan en el backend.";
  const esLaravel = existsSync9(join13(cwd, "artisan")), esNode = existsSync9(join13(cwd, "package.json"));
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
  const env = leer7(join13(cwd, ".env"));
  const candidatos = [
    env.match(/^\s*LOG_PATH\s*=\s*["']?([^"'\r\n]+)/m)?.[1],
    "storage/logs/laravel.log",
    "logs/error.log",
    "logs/app.log",
    "error_log",
    "php_errors.log",
    "var/log/app.log"
  ].filter(Boolean);
  const f = candidatos.map((c) => c.startsWith("/") ? c : join13(cwd, c)).find((p) => {
    try {
      return statSync6(p).isFile();
    } catch {
      return false;
    }
  });
  if (!f)
    return "No encontré un archivo de log (define LOG_PATH en .env o dime la ruta). En producción con Sentry/Rollbar, pásame el acceso o el export.";
  const txt = leer7(f).split(/\r?\n/).slice(-400);
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

// skill_dey-lib/organizar.ts
import { readFileSync as readFileSync13 } from "node:fs";
import { join as join14, basename as basename7, dirname as dirname2 } from "node:path";
var leer8 = (p) => {
  try {
    return readFileSync13(p, "utf8");
  } catch {
    return "";
  }
};
var IGN5 = /(^|[\\/])(node_modules|vendor|dist|build|\.git|\.skill_dey|coverage|\.venv|venv|__pycache__|\.next|storage|public[\\/]build|migrations?)([\\/]|$)|\.min\.|\.lock$/i;
var archivos3 = (cwd) => listarArchivos(cwd).filter((f) => !IGN5.test(f));
var COD = /\.(m?[jt]sx?|cjs|vue|svelte|php|py|go|java|cs|rb)$/;
function duplicados(cwd, files) {
  const vistos = new Map;
  for (const f of files.filter((f2) => COD.test(f2))) {
    const ls = leer8(join14(cwd, f)).split(/\r?\n/);
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
  const r = [];
  for (const [, locs] of vistos) {
    const arch = [...new Set(locs.map((l) => l.split(":")[0]))];
    if (locs.length >= 2 && arch.length >= 2)
      r.push(`bloque repetido en ${locs.slice(0, 3).join(" ≈ ")} → extrae a una función compartida`);
  }
  return [...new Set(r)].slice(0, 8);
}
function huerfanos(cwd, files) {
  const cod = files.filter((f) => COD.test(f) && !/(index|app|main|server|autoload|bootstrap|routes?|web|api)\.[a-z]+$|(^|[\\/])(pages|views|screens|app)[\\/]/i.test(f));
  const todo = files.filter((f) => /\.(m?[jt]sx?|cjs|vue|svelte|php|py|html|blade\.php|twig)$/.test(f)).map((f) => leer8(join14(cwd, f))).join(`
`);
  return cod.filter((f) => {
    const base = basename7(f).replace(/\.[^.]+$/, "");
    return base.length > 2 && !new RegExp(`['"\\/]${base.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(\\.[a-z]+)?['"\\s)/]`).test(todo);
  }).slice(0, 8);
}
function fueraDeLugar(cwd, files) {
  const r = [];
  for (const f of files.filter((f2) => COD.test(f2))) {
    const d = dirname2(f).toLowerCase(), t = leer8(join14(cwd, f)).slice(0, 4000);
    if (/(controller|controlador)/i.test(basename7(f)) && !/controller|controlador|routes?|app|src/i.test(d))
      r.push(`${f} parece un controlador fuera de controllers/`);
    if (/(SELECT |INSERT |new mysqli|new PDO|->query\()/i.test(t) && /(components?|views?|pages?|ui)[\\/]/.test(d))
      r.push(`${f} tiene SQL dentro de la capa visual → muévelo a un modelo/servicio`);
  }
  return [...new Set(r)].slice(0, 8);
}
function organizar(cwd) {
  const files = archivos3(cwd);
  const fmt = formatear(cwd, false);
  const dup = duplicados(cwd, files), huer = huerfanos(cwd, files), lugar = fueraDeLugar(cwd, files);
  const grandes = files.filter((f) => COD.test(f) && leer8(join14(cwd, f)).split(`
`).length > 400).map((f) => `${f} (${leer8(join14(cwd, f)).split(`
`).length} líneas) → dividir`);
  const L = [
    `SKILL_DEY organizar · ${files.length} archivos`,
    "1) Indentación y estilo: " + fmt.replace(/^[✅⏭]\s*/, ""),
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

// skill_dey-lib/pdf.ts
import { spawnSync as spawnSync11 } from "node:child_process";
import { readFileSync as readFileSync14, writeFileSync as writeFileSync9, existsSync as existsSync10, mkdirSync as mkdirSync9 } from "node:fs";
import { join as join15, basename as basename8 } from "node:path";
import { tmpdir as tmpdir3 } from "node:os";
var leer9 = (p) => {
  try {
    return readFileSync14(p, "utf8");
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
  const mdPath = join15(cwd, mdRel);
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
      return JSON.parse(leer9(join15(cwd, "package.json"))).name;
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
  const htmlPath = join15(tmpdir3(), `skill_dey-doc-${Date.now()}.html`);
  writeFileSync9(htmlPath, html);
  const outDir = join15(cwd, "docs", "pdf");
  mkdirSync9(outDir, { recursive: true });
  const pdfPath = join15(outDir, basename8(mdRel).replace(/\.md$/i, ".pdf"));
  const script = join15(tmpdir3(), `skill_dey-pdf-${Date.now()}.mjs`);
  writeFileSync9(script, `
import { createRequire } from 'node:module'; const require = createRequire(${JSON.stringify(pj)});
const { chromium } = require('playwright'); const b = await chromium.launch(process.env.SKILL_DEY_CHROMIUM ? { executablePath: process.env.SKILL_DEY_CHROMIUM } : {});
const p = await b.newPage(); await p.goto('file://' + ${JSON.stringify(htmlPath)}, { waitUntil: 'load' });
await p.pdf({ path: ${JSON.stringify(pdfPath)}, format: 'A4', printBackground: true, margin: { top: '12mm', bottom: '14mm', left: '12mm', right: '12mm' } });
await b.close();`);
  const r = spawnSync11(`node "${script}"`, { cwd, shell: true, encoding: "utf8", timeout: 120000 });
  return r.status === 0 && existsSync10(pdfPath) ? pdfPath : "";
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
    if (existsSync10(join15(cwd, rel))) {
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

// skill_dey-lib/seguridad.ts
import { existsSync as existsSync11, readFileSync as readFileSync15, statSync as statSync8 } from "node:fs";
import { join as join16 } from "node:path";
var IGN6 = /(^|[\\/])(node_modules|vendor|dist|build|\.git|\.skill_dey|coverage|\.venv|venv|__pycache__|\.next|storage|tests?|__tests__|spec|migrations?)([\\/]|$)|\.min\.js$/i;
var leer10 = (p) => {
  try {
    return readFileSync15(p, "utf8");
  } catch {
    return "";
  }
};
var php = (f) => /\.php$/.test(f);
var js = (f) => /\.(m?[jt]sx?|cjs)$/.test(f);
var web = (f) => /\.(php|m?[jt]sx?|vue|svelte|html|blade\.php|twig)$/.test(f);
function auditarSeguridad(cwd) {
  const files = listarArchivos(cwd).filter((f) => !IGN6.test(f) && web(f) && existsSync11(join16(cwd, f)) && statSync8(join16(cwd, f)).size < 1500000);
  const H = [];
  const add = (prioridad, texto, donde) => {
    if (donde.length)
      H.push({ prioridad, texto, donde: [...new Set(donde)].slice(0, 10) });
  };
  const buscar = (re, filtro, excluir) => {
    const r = [];
    for (const f of files.filter(filtro)) {
      const t = leer10(join16(cwd, f));
      if (re.test(t) && !(excluir && excluir.test(t)))
        r.push(f);
    }
    return r;
  };
  add("CRÍTICO", "Contraseña guardada sin cifrar (usa password_hash/bcrypt/argon2)", [
    ...buscar(/(INSERT|UPDATE)[^;]*\b(password|passwd|clave|contrasena|contraseña)\b[^;]*(VALUES|=)[^;]*(\$_(POST|GET|REQUEST)|\$\w+)/i, php, /password_hash|bcrypt|hash\(/i),
    ...buscar(/\b(md5|sha1)\s*\(\s*\$?_?(POST|GET|REQUEST|password|pass|clave)/i, php),
    ...buscar(/password\s*:\s*(req\.body|input)\.\w+/i, js, /bcrypt|hash|argon/i)
  ]);
  const conSesion = files.filter(php).filter((f) => /\$_SESSION\[|session_start\(|Auth::|->middleware\(['"]auth|require.*auth/i.test(leer10(join16(cwd, f))));
  if (conSesion.length >= 2) {
    const paginas = files.filter((f) => php(f) && !/(^|[\\/])(config|includes?|lib|clases?|class|models?|controllers?|conexion|db|functions?|helpers?|api|vendor)([\\/]|\.|$)/i.test(f));
    add("ALTO", "Página sin verificar sesión mientras otras sí lo hacen (¿acceso sin login?)", paginas.filter((f) => !conSesion.includes(f) && !/login|logout|index|registro|register|recuperar|forgot|public|install/i.test(f) && /(echo|print|<\?=|<html|<form|<table|json_encode)/i.test(leer10(join16(cwd, f)))));
  }
  add("ALTO", "Formulario POST sin token CSRF (añade y valida un token)", buscar(/<form[^>]*method\s*=\s*["']?post/i, web, /csrf|_token|authenticity_token|nonce|csrf_field|@csrf/i));
  add("ALTO", "Consulta por id tomado de la URL sin validar el dueño (otro usuario ve/edita datos ajenos)", [
    ...buscar(/WHERE\s+id\s*=\s*['"]?\s*(\.|\$\{?)?\s*\$_(GET|POST|REQUEST)\[/i, php, /user_id|usuario_id|owner|and\s+\w*user/i),
    ...buscar(/findByPk|findOne\(\s*\{?\s*id\s*:\s*(req\.params|req\.query)/i, js, /user|owner|where.*user/i)
  ]);
  add("ALTO", "Subida de archivos sin validar tipo ni tamaño", [
    ...buscar(/move_uploaded_file|\$_FILES\[/i, php, /mime|getimagesize|pathinfo|finfo|extension|type|size|MAX_FILE/i),
    ...buscar(/multer|formidable|busboy|\.upload\(/i, js, /fileFilter|limits|mimetype|allowed/i)
  ]);
  add("ALTO", "Modo depuración o errores visibles al usuario (expón solo en desarrollo)", [
    ...buscar(/display_errors\s*[,=]\s*['"]?(1|On)|error_reporting\s*\(\s*E_ALL\s*\)/i, php),
    ...buscar(/APP_DEBUG\s*=\s*true/i, (f) => /\.env$/.test(f))
  ]);
  add("MEDIO", "CORS abierto a cualquier origen (*) (limita a los dominios necesarios)", [
    ...buscar(/Access-Control-Allow-Origin["'\s:,]+\*/i, web),
    ...buscar(/cors\(\s*\{\s*origin\s*:\s*["']?\*|cors\(\s*\)/i, js)
  ]);
  add("MEDIO", "Cookie sin HttpOnly/Secure (puede robarse desde el navegador)", buscar(/setcookie\s*\(|session_set_cookie_params\s*\(|res\.cookie\s*\(/i, web, /httponly|secure|samesite/i));
  const login = files.filter((f) => /login|signin|autenticar|authenticate/i.test(f) && /password|contrasena|contraseña|passwd/i.test(leer10(join16(cwd, f))));
  add("MEDIO", "Login sin límite de intentos (permite fuerza bruta)", login.filter((f) => !/intentos|attempts|rate.?limit|throttle|lockout|bloqueo|captcha/i.test(leer10(join16(cwd, f)))));
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

// skill_dey-lib/testpro.ts
import { spawnSync as spawnSync15 } from "node:child_process";
import { writeFileSync as writeFileSync12, readFileSync as readFileSync18, mkdirSync as mkdirSync11, existsSync as existsSync14 } from "node:fs";
import { join as join20, basename as basename9 } from "node:path";
import { tmpdir as tmpdir5 } from "node:os";

// skill_dey-lib/calidad.ts
import { spawnSync as spawnSync12 } from "node:child_process";
import { writeFileSync as writeFileSync10 } from "node:fs";
import { join as join17 } from "node:path";
import { tmpdir as tmpdir4 } from "node:os";
async function calidadWeb(base, pj, rutas) {
  const script = join17(tmpdir4(), `skill_dey-calidad-${Date.now()}.mjs`);
  writeFileSync10(script, `
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
  const r = spawnSync12(`node "${script}"`, { shell: true, encoding: "utf8", timeout: 600000, maxBuffer: 50000000 });
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

// skill_dey-lib/movil.ts
import { spawnSync as spawnSync13 } from "node:child_process";
import { existsSync as existsSync12, readFileSync as readFileSync16 } from "node:fs";
import { join as join18 } from "node:path";
function esMovil(cwd) {
  if (existsSync12(join18(cwd, "pubspec.yaml")))
    return "flutter";
  try {
    const pkg = JSON.parse(readFileSync16(join18(cwd, "package.json"), "utf8"));
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
  const run = (cmd) => spawnSync13(cmd, { cwd, shell: true, encoding: "utf8", timeout: 300000, maxBuffer: 50000000 });
  const L = [];
  let fallas = 0;
  const hay3 = (bin) => {
    try {
      return spawnSync13(bin, ["--version"], { shell: true, timeout: 15000 }).status === 0;
    } catch {
      return false;
    }
  };
  if (tipo === "flutter") {
    L.push("\uD83D\uDCF1 Flutter detectado");
    if (hay3("flutter")) {
      const a = run("flutter analyze");
      const okA = a.status === 0;
      if (!okA)
        fallas++;
      L.push(`${okA ? "✅" : "❌"} flutter analyze${okA ? " sin problemas" : ": " + (a.stdout + a.stderr).split(`
`).filter((x) => /error|warning/i.test(x)).slice(0, 3).join(" · ").slice(0, 160)}`);
      if (existsSync12(join18(cwd, "test"))) {
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
        return JSON.parse(readFileSync16(join18(cwd, "package.json"), "utf8"));
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

// skill_dey-lib/pro.ts
import { spawnSync as spawnSync14 } from "node:child_process";
import { existsSync as existsSync13, readFileSync as readFileSync17, writeFileSync as writeFileSync11, mkdirSync as mkdirSync10 } from "node:fs";
import { join as join19 } from "node:path";
var leer11 = (p) => {
  try {
    return readFileSync17(p, "utf8");
  } catch {
    return "";
  }
};
var tiene = (bin) => {
  try {
    return spawnSync14(bin, ["--version"], { shell: true, timeout: 15000 }).status === 0;
  } catch {
    return false;
  }
};
var run = (cmd, cwd) => spawnSync14(cmd, { cwd, shell: true, encoding: "utf8", timeout: 300000, maxBuffer: 50000000 });
function coberturaCodigo(cwd) {
  const pkg = (() => {
    try {
      return JSON.parse(leer11(join19(cwd, "package.json")));
    } catch {
      return null;
    }
  })();
  if (pkg?.scripts?.test && !/no test specified/.test(pkg.scripts.test)) {
    const s = pkg.scripts.test;
    const cmd = /vitest/.test(s) ? "npx vitest run --coverage 2>&1" : /jest/.test(s) ? "npx jest --coverage 2>&1" : /node\s+--test/.test(s) ? "node --test --experimental-test-coverage 2>&1" : "npm test 2>&1";
    const t = (() => {
      const r = run(cmd, cwd);
      return r.stdout + r.stderr;
    })();
    const m = t.match(/all files\s*\|\s*(\d+(?:\.\d+)?)/i) || t.match(/(\d+(?:\.\d+)?)\s*%\s*(?:Stmts|statements|coverage|Lines)/i);
    return m ? `\uD83D\uDCC8 cobertura de código: ${m[1]}%` : "⏭ cobertura de código: el runner no reportó % (agrega c8/istanbul o la bandera --coverage)";
  }
  if (existsSync13(join19(cwd, "vendor", "bin", "phpunit")) || existsSync13(join19(cwd, "phpunit.xml"))) {
    const r = run('"vendor/bin/phpunit" --coverage-text 2>/dev/null || phpunit --coverage-text 2>/dev/null', cwd);
    const m = r.stdout.match(/Lines:\s*(\d+(?:\.\d+)?)%/);
    return m ? `\uD83D\uDCC8 cobertura de código (PHP): ${m[1]}%` : "⏭ cobertura PHP: instala Xdebug o pcov para medir el %";
  }
  if (listarArchivos(cwd).some((f) => /test_.*\.py$|_test\.py$/.test(f))) {
    const r = run("python -m pytest --cov -q 2>/dev/null", cwd);
    const m = r.stdout.match(/TOTAL\s+\d+\s+\d+\s+(\d+)%/);
    return m ? `\uD83D\uDCC8 cobertura de código (Python): ${m[1]}%` : "⏭ cobertura Python: instala pytest-cov";
  }
  return "⏭ cobertura de código: el proyecto no tiene runner de pruebas";
}
function auditarDependencias(cwd) {
  const L = [];
  if (existsSync13(join19(cwd, "package.json")) && tiene("npm")) {
    const r = run("npm audit --json 2>/dev/null", cwd);
    try {
      const j = JSON.parse(r.stdout);
      const v = j.metadata?.vulnerabilities || {};
      const tot = (v.critical || 0) + (v.high || 0) + (v.moderate || 0) + (v.low || 0);
      L.push(tot ? `${v.critical || v.high ? "❌" : "⚠"} deps npm: ${v.critical || 0} críticas · ${v.high || 0} altas · ${v.moderate || 0} medias (corrige con npm audit fix)` : "✅ deps npm: sin vulnerabilidades conocidas");
    } catch {
      L.push("⏭ npm audit: falta package-lock.json o no hay red");
    }
  }
  if (existsSync13(join19(cwd, "composer.json")) && tiene("composer")) {
    const r = run("composer audit --format=plain 2>/dev/null", cwd);
    L.push(/no\s+security\s+vulnerabilit/i.test(r.stdout + r.stderr) ? "✅ deps PHP: sin vulnerabilidades" : "⚠ deps PHP: revisa `composer audit`");
  }
  if (existsSync13(join19(cwd, "requirements.txt")))
    L.push(tiene("pip-audit") ? /no known/i.test(run("pip-audit 2>/dev/null", cwd).stdout) ? "✅ deps Python: sin vulnerabilidades" : "⚠ deps Python: revisa `pip-audit`" : "⏭ deps Python: instala pip-audit para auditarlas");
  return L;
}
function semgrep(cwd) {
  if (!tiene("semgrep"))
    return "⏭ semgrep no instalado (opcional): `pip install semgrep` para análisis estático estándar";
  const r = run("semgrep --config auto --json --quiet 2>/dev/null", cwd);
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
  const spec = ["openapi.json", "openapi.yaml", "swagger.json", join19("docs", "openapi.json")].map((f) => join19(cwd, f)).find(existsSync13);
  if (spec)
    return `✅ OpenAPI: encontrado ${spec.split(/[\\/]/).pop()} (sirve para probar endpoints y documentar la API)`;
  const esApi = listarArchivos(cwd).some((f) => /(^|[\\/])(api|routes)[\\/]/i.test(f)) || /express|fastify|@nestjs|fastapi|flask|laravel\/framework/.test(leer11(join19(cwd, "package.json")) + leer11(join19(cwd, "composer.json")) + leer11(join19(cwd, "requirements.txt")));
  if (!esApi)
    return "";
  const paths = {};
  for (const r of rutas.length ? rutas : ["/"])
    paths[r] = { get: { summary: "auto (completar)", responses: { "200": { description: "ok" } } } };
  mkdirSync10(join19(cwd, "docs"), { recursive: true });
  writeFileSync11(join19(cwd, "docs", "openapi.json"), JSON.stringify({ openapi: "3.0.0", info: { title: "API", version: "1.0.0" }, paths }, null, 2));
  return "\uD83E\uDDE9 OpenAPI: generé un starter en docs/openapi.json desde tus rutas (complétalo con los cuerpos y respuestas)";
}
function docker(cwd) {
  const df = existsSync13(join19(cwd, "Dockerfile")), comp = existsSync13(join19(cwd, "docker-compose.yml")) || existsSync13(join19(cwd, "compose.yml"));
  if (!df && !comp)
    return "";
  if (!tiene("docker"))
    return "⏭ Docker: hay Dockerfile pero `docker` no está disponible aquí para validar el build";
  const r = comp ? run("docker compose build 2>&1 | tail -6", cwd) : run("docker build -t skill_dey_check . 2>&1 | tail -6", cwd);
  return r.status === 0 ? "✅ Docker: la imagen construye correctamente" : "❌ Docker: el build falla → " + (r.stdout + r.stderr).split(`
`).filter(Boolean).slice(-2).join(" ").slice(0, 160);
}
function sentryCheck(cwd) {
  const dep = /@sentry\/|sentry-sdk|sentry\/sentry|getsentry/.test(leer11(join19(cwd, "package.json")) + leer11(join19(cwd, "composer.json")) + leer11(join19(cwd, "requirements.txt")));
  const dsn = /SENTRY_DSN/.test(leer11(join19(cwd, ".env")) + leer11(join19(cwd, ".env.example")));
  if (dep && dsn)
    return "✅ Sentry: integrado (librería + SENTRY_DSN)";
  if (dep && !dsn)
    return "⚠ Sentry: la librería está pero falta SENTRY_DSN en .env";
  return "";
}
function i18nCheck(cwd) {
  const lib = /i18next|vue-i18n|react-intl|formatjs|next-intl/.test(leer11(join19(cwd, "package.json"))) || ["lang", "locales", join19("resources", "lang"), "i18n"].some((d) => existsSync13(join19(cwd, d)));
  return lib ? "\uD83C\uDF10 i18n: soporte de idiomas detectado (revisa que no queden textos quemados sin traducir en las vistas)" : "";
}
function extrasPro(cwd, rutas) {
  const L = [coberturaCodigo(cwd), ...auditarDependencias(cwd), semgrep(cwd), apiOpenapi(cwd, rutas), docker(cwd), sentryCheck(cwd), i18nCheck(cwd)].filter(Boolean);
  if (L.some((x) => /Sentry|OpenAPI|i18n|Docker/.test(x)))
    L.push("ℹ️ nota: Sentry/OpenAPI/i18n son detección y Docker es validación de build — no auditoría profunda; úsalos como señal, no como garantía.");
  return L;
}

// skill_dey-lib/testpro.ts
var leer12 = (p) => {
  try {
    return readFileSync18(p, "utf8");
  } catch {
    return "";
  }
};
function escenarios(cwd) {
  const root = docrootPhp(cwd);
  const base = rutasAProbar(cwd, listarArchivos(cwd));
  const conForm = listarArchivos(cwd).filter((f) => /\.(php|html)$/i.test(f) && /<form/i.test(leer12(join20(cwd, f))) && !/vendor|config|includes?|conexion|node_modules/i.test(f)).map((f) => {
    const r = "/" + f.replace(root + "/", "").replace(/\\/g, "/");
    return r.startsWith("/..") ? "/" + basename9(f) : r;
  });
  const excluir = /\/docs\/|\/tests?\/|\.skill_dey|node_modules|\/vendor\//i;
  const rutas = [...new Set([...base, ...conForm])].filter((r) => !excluir.test(r)).slice(0, 12);
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
  const script = join20(tmpdir5(), `skill_dey-testpro-${Date.now()}.mjs`);
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
  const r = spawnSync15(`node "${script}"`, { cwd, shell: true, encoding: "utf8", timeout: 600000, maxBuffer: 50000000 });
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
      return JSON.parse(readFileSync18(join20(cwd, "package.json"), "utf8"));
    } catch {
      return null;
    }
  })();
  const L = [];
  const run2 = (cmd) => spawnSync15(cmd, { cwd, shell: true, encoding: "utf8", timeout: 300000, maxBuffer: 50000000 });
  if (pkg?.scripts?.test && !/no test specified/.test(pkg.scripts.test)) {
    const r = run2("npm test --silent");
    const ok = r.status === 0;
    L.push(`${ok ? "PASS" : "FAIL"} · unitarias (npm test): ${(r.stdout + r.stderr).split(`
`).filter((x) => /pass|fail|✓|✗|Tests:|test/i.test(x)).slice(-2).join(" ").slice(0, 120) || (ok ? "ok" : "revisa salida")}`);
  } else if (existsSync14(join20(cwd, "phpunit.xml")) || existsSync14(join20(cwd, "phpunit.xml.dist")) || existsSync14(join20(cwd, "vendor", "bin", "phpunit"))) {
    const r = run2(existsSync14(join20(cwd, "vendor", "bin", "phpunit")) ? '"vendor/bin/phpunit"' : "phpunit");
    L.push(`${r.status === 0 ? "PASS" : "FAIL"} · unitarias PHP (phpunit)`);
  } else if (existsSync14(join20(cwd, "pytest.ini")) || existsSync14(join20(cwd, "tests")) && listarArchivos(cwd).some((f) => /test_.*\.py$|_test\.py$/.test(f))) {
    const r = run2("python -m pytest -q");
    L.push(`${r.status === 0 ? "PASS" : "FAIL"} · unitarias Python (pytest)`);
  } else
    L.push("⏭ unitarias: el proyecto no tiene runner configurado (puedo generar un ejemplo si quieres)");
  return L;
}
function ciWorkflow() {
  return `name: pruebas (SKILL_DEY)
on: [push, pull_request]
jobs:
  e2e:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20 }
      - run: npm ci || npm i
      - run: npm i -D @playwright/test && npx playwright install --with-deps chromium
      - run: npx playwright test
`;
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
      base = (arr?.lista.find((a) => a.ok && a.s.tipo === "frontend") ?? arr?.lista.find((a) => a.ok))?.url;
    }
    if (!base)
      base = (app = await iniciarApp(cwd).catch(() => null))?.url;
    base = base || "http://localhost:3000";
    const esc = escenarios(cwd);
    const dir = join20(cwd, "tests", "e2e");
    mkdirSync11(dir, { recursive: true });
    writeFileSync12(join20(dir, "app.spec.ts"), specEstandar(base, esc));
    if (!existsSync14(join20(cwd, "playwright.config.ts")) && !existsSync14(join20(cwd, "playwright.config.js")))
      writeFileSync12(join20(cwd, "playwright.config.ts"), config(base));
    const ciDir = join20(cwd, ".github", "workflows");
    mkdirSync11(ciDir, { recursive: true });
    if (!existsSync14(join20(ciDir, "skill_dey.yml")))
      writeFileSync12(join20(ciDir, "skill_dey.yml"), ciWorkflow());
    const L = [`\uD83E\uDDEA Suite profesional generada: tests/e2e/app.spec.ts (${esc.length} escenarios) + playwright.config.ts + CI (.github/workflows/skill_dey.yml)`, "   Para CI local: `npm i -D @playwright/test && npx playwright test`"];
    let fallas = 0;
    const viva = pj && (app || arr?.lista?.some((a) => a.ok) || url);
    if (viva) {
      const res = await smokeEnVivo(cwd, base, pj, esc);
      fallas = res.filter((x) => x.startsWith("FAIL")).length;
      const ok = res.filter((x) => x.startsWith("PASS")).length;
      L.push(fallas ? `❌ prueba en vivo: ${fallas} fallo(s) de ${res.length}` : `✅ prueba en vivo: ${res.length} escenario(s) pasaron`, ...res.map((x) => "   " + x));
      L.push(`\uD83D\uDCCA cobertura funcional: ${ok}/${esc.length} rutas descubiertas ejercitadas (${Math.round(ok / Math.max(1, esc.length) * 100)}%)`);
      const cal = await calidadWeb(base, pj, esc.map((e) => e.ruta));
      fallas += cal.fallas;
      L.push(...cal.lineas);
      L.push(...await carga(base, esc.map((e) => e.ruta)));
    } else
      L.push("⏭ prueba en vivo/calidad/carga: no pude levantar la app (pásame la url); la suite igual quedó en el repo");
    L.push(...correrUnitarias(cwd));
    L.push(...extrasPro(cwd, esc.map((e) => e.ruta)));
    mkdirSync11(join20(cwd, ".skill_dey"), { recursive: true });
    writeFileSync12(join20(cwd, ".skill_dey", "PRUEBAS-PROFESIONALES.md"), [`# Testeo profesional · ${new Date().toISOString().slice(0, 16).replace("T", " ")}`, ...L].join(`
`));
    return { ok: fallas === 0, fallas, lineas: L };
  } finally {
    app?.detener?.();
    for (const a of arr?.lista ?? [])
      a.detener?.();
  }
}

// skill_dey-lib/video.ts
import { spawnSync as spawnSync16 } from "node:child_process";
import { writeFileSync as writeFileSync13, readFileSync as readFileSync19, mkdirSync as mkdirSync12, existsSync as existsSync15, unlinkSync } from "node:fs";
import { join as join21, basename as basename10 } from "node:path";
import { tmpdir as tmpdir6 } from "node:os";
var leer13 = (p) => {
  try {
    return readFileSync19(p, "utf8");
  } catch {
    return "";
  }
};
var hayFfmpeg = () => {
  try {
    return spawnSync16("ffmpeg", ["-version"], { encoding: "utf8", timeout: 1e4, shell: true }).status === 0;
  } catch {
    return false;
  }
};
var SEG = 5;
function guion(cwd) {
  const root = docrootPhp(cwd);
  const archivos4 = listarArchivos(cwd).filter((f) => /\.(php|html)$/i.test(f) && !/vendor|config|includes?|conexion|node_modules|\/lib\/|\/docs\/|\/tests?\/|\.skill_dey/i.test(f));
  const pasos = [];
  const vistas = new Set;
  for (const f of archivos4) {
    const src = leer13(join21(cwd, f));
    const ruta0 = "/" + f.replace(root + "/", "").replace(/\\/g, "/");
    const r = ruta0.startsWith("/..") ? "/" + basename10(f) : ruta0;
    if (vistas.has(r))
      continue;
    const h1 = src.match(/<h1[^>]*>([^<]{2,60})</i)?.[1]?.trim() || src.match(/<title[^>]*>([^<]{2,60})</i)?.[1]?.trim();
    const campos2 = [...src.matchAll(/<(?:input|select|textarea)\b[^>]*name\s*=\s*["']([^"']+)/gi)].map((m) => m[1]).filter((v, i, a) => a.indexOf(v) === i).slice(0, 6);
    const tieneForm = /<form/i.test(src);
    const titulo = (h1 || basename10(f).replace(/\.(php|html)$/i, "")).slice(0, 60);
    const texto = tieneForm && campos2.length ? `Completa los campos (${campos2.join(", ")}) y usa el botón para guardar.` : `Pantalla "${titulo}".`;
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
      base = (arr?.lista.find((a) => a.ok && a.s.tipo === "frontend") ?? arr?.lista.find((a) => a.ok))?.url;
    }
    if (!base)
      base = (app = await iniciarApp(cwd).catch(() => null))?.url;
    if (!base)
      return { ok: true, lineas: ["⏭ capacitar: no pude levantar la app; pásame la url o levántala"] };
    const pasos = guion(cwd);
    const out = join21(cwd, "docs", "capacitacion");
    mkdirSync12(out, { recursive: true });
    const script = join21(tmpdir6(), `skill_dey-video-${Date.now()}.mjs`);
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
    const r = spawnSync16(`node "${script}"`, { cwd, shell: true, encoding: "utf8", timeout: 600000, maxBuffer: 50000000 });
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
    writeFileSync13(join21(out, "guion.srt"), srt(hechos));
    writeFileSync13(join21(out, "tutorial.html"), htmlTutorial(hechos, basename10(cwd) || "app"));
    const L = [`✅ capacitación: ${hechos.length} pantalla(s) grabadas → docs/capacitacion/`, "   tutorial.html (se abre en cualquier navegador, con subtítulos) · guion.srt"];
    if (hayFfmpeg()) {
      const lista = join21(out, "_lista.txt");
      writeFileSync13(lista, hechos.map((h) => `file '${h.img}'
duration ${SEG}`).join(`
`) + `
file '${hechos[hechos.length - 1].img}'
`);
      const mp4 = join21(out, "capacitacion.mp4");
      const conSub = spawnSync16(`ffmpeg -y -f concat -safe 0 -i "${lista}" -vf "subtitles=guion.srt:force_style='FontSize=18,PrimaryColour=&H00FFFFFF,BorderStyle=3,Outline=1'" -pix_fmt yuv420p -r 25 "${mp4}"`, { cwd: out, shell: true, encoding: "utf8", timeout: 300000 });
      if (conSub.status === 0 && existsSync15(mp4))
        L.push("   capacitacion.mp4 (video con subtítulos quemados)");
      else {
        const r2 = spawnSync16(`ffmpeg -y -f concat -safe 0 -i "${lista}" -pix_fmt yuv420p -r 25 "${mp4}"`, { cwd: out, shell: true, encoding: "utf8", timeout: 300000 });
        if (r2.status === 0 && existsSync15(mp4))
          L.push("   capacitacion.mp4 (video; subtítulos en guion.srt)");
      }
    } else
      L.push("   (sin ffmpeg: usa tutorial.html; si instalas ffmpeg, genero también el .mp4)");
    try {
      unlinkSync(join21(out, "_lista.txt"));
    } catch {}
    return { ok: true, lineas: L };
  } finally {
    app?.detener?.();
    for (const a of arr?.lista ?? [])
      a.detener?.();
  }
}

// skill_dey-lib/multiia.ts
import { writeFileSync as writeFileSync14, mkdirSync as mkdirSync13, existsSync as existsSync16, readFileSync as readFileSync20 } from "node:fs";
import { join as join22 } from "node:path";
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
  { archivo: join22(".cursor", "rules", "skill_dey.mdc"), pre: `---
description: SKILL_DEY
alwaysApply: true
---

` },
  { archivo: ".windsurfrules" },
  { archivo: join22(".github", "copilot-instructions.md") },
  { archivo: ".clinerules" },
  { archivo: ".rules" },
  { archivo: join22(".idx", "airules.md") }
];
function instalarMultiIA(cwd) {
  const reglas2 = reglasPortables();
  const marca = "<!-- SKILL_DEY:inicio -->";
  const fin = "<!-- SKILL_DEY:fin -->";
  const bloque = `${marca}
${reglas2}
${fin}
`;
  const hechos = [];
  for (const d of DESTINOS) {
    const ruta = join22(cwd, d.archivo);
    try {
      mkdirSync13(join22(ruta, ".."), { recursive: true });
      let contenido = "";
      try {
        contenido = existsSync16(ruta) ? readFileSync20(ruta, "utf8") : "";
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
  mkdirSync13(join22(cwd, ".skill_dey"), { recursive: true });
  writeFileSync14(join22(cwd, ".skill_dey", "MULTI-IA.md"), `# SKILL_DEY multi-IA
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

// skill_dey-lib/robustez.ts
import { existsSync as existsSync17, readFileSync as readFileSync21, statSync as statSync9, writeFileSync as writeFileSync15, chmodSync, mkdirSync as mkdirSync14 } from "node:fs";
import { join as join23 } from "node:path";
import { homedir as homedir3 } from "node:os";
var OC = () => process.env.OPENCODE_CONFIG_DIR || join23(homedir3(), ".config", "opencode");
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
      return readFileSync21(join23(oc, "skill_dey", "VERSION"), "utf8").trim();
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
    chk(existsSync17(join23(oc, f)), f, "falta " + f);
  try {
    const g = readFileSync21(join23(oc, "plugins", "skill_dey-guardian.ts"), "utf8");
    const m = g.match(/VERSION\s*=\s*"([\d.]+)"/);
    chk(!!m && m[1] === ver, `plugin y VERSION coinciden (${m?.[1] ?? "?"})`, `instalación mezclada (plugin ${m?.[1] ?? "?"} vs ${ver}): reinstala`);
  } catch {
    chk(false, "", "no pude leer el plugin");
  }
  for (const b of ["skill_dey/skill_dey.mjs", "skill_dey/skill_dey-mcp.mjs"]) {
    try {
      chk(statSync9(join23(oc, b)).size > 1e4, b + " (bundle OK)", b + " vacío/corrupto");
    } catch {}
  }
  L.push(mal ? `❌ doctor: ${mal} problema(s) → reinstala skill_dey o corre el instalador` : "✅ doctor: instalación sana. Test funcional completo: /skill_dey prueba (o eval)");
  return L;
}
function instalarHook(cwd) {
  const g = join23(cwd, ".git");
  if (!existsSync17(g))
    return "⏭ git hook: esta carpeta no es un repositorio git (haz `git init` primero)";
  const hooks = join23(g, "hooks");
  mkdirSync14(hooks, { recursive: true });
  const mjs = join23(homedir3(), ".config", "opencode", "skill_dey", "skill_dey.mjs");
  const hook = `#!/bin/sh
# SKILL_DEY pre-commit — no deja commitear con errores (salta con: git commit --no-verify)
node "${mjs}" revisar . || { echo "SKILL_DEY: hay errores, corrígelos (o usa --no-verify)"; exit 1; }
`;
  const f = join23(hooks, "pre-commit");
  try {
    writeFileSync15(f, hook);
    chmodSync(f, 493);
    return "✅ git hook instalado: antes de cada commit corre `revisar` y bloquea si hay errores (salta con --no-verify). Funciona en cualquier editor.";
  } catch (e) {
    return "no pude instalar el hook: " + e.message;
  }
}
function reporte(cwd) {
  const d = join23(cwd, ".skill_dey");
  const leer14 = (f) => {
    try {
      return readFileSync21(join23(d, f), "utf8");
    } catch {
      return "";
    }
  };
  const L = ["\uD83D\uDCD1 Reporte de uso de skill_dey en este proyecto:"];
  const cons = leer14("CONSUMO.md").trim().split(`
`).filter((l) => l.includes("|"));
  L.push(cons.length ? `   consultas registradas: ${cons.length} · última: ${cons[cons.length - 1].slice(0, 90)}` : "   (sin CONSUMO.md todavía)");
  const ap = leer14("APRENDIZAJE.md").split(`
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
  const pp = leer14("PRUEBAS-PROFESIONALES.md");
  if (pp)
    L.push("   último testeo: " + (pp.split(`
`).find((l) => /prueba en vivo|cobertura|✅|❌/.test(l)) || "").trim().slice(0, 88));
  const huecos = leer14("HUECOS.md").split(`
`).filter((l) => l.trim().startsWith("-"));
  if (huecos.length)
    L.push(`   skills que faltaron: ${huecos.length}`);
  return L;
}

// skill_dey-lib/cli.ts
var [cmd = "ayuda", carpeta = ".", url] = process.argv.slice(2);
var cwd = resolve(carpeta);
var AYUDA = `skill_dey por Ing. Dey (@IngDey) · terminal, funciona con cualquier IA
  node skill_dey.mjs revisar [carpeta]          Errores de código, arranque y sitio
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
      return console.log([...resumenSeguridad(cwd).lineas, ...auditarDependencias(cwd), semgrep(cwd)].filter(Boolean).join(`
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
