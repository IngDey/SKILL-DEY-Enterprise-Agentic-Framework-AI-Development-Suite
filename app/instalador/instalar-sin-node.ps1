# Instalador SKILL_DEY para OpenCode (Windows). Se ejecuta desde INSTALAR.bat
$ErrorActionPreference = 'Stop'
$src = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$oc  = Join-Path $env:USERPROFILE '.config/opencode'
function D($p) { New-Item -ItemType Directory -Force $p | Out-Null }
function Ok($t) { Write-Host "  [OK] $t" -ForegroundColor Green }
function Av($t) { Write-Host "  [!]  $t" -ForegroundColor Yellow }

try {
  if (-not (Test-Path (Join-Path $src 'skills/skill-dey/SKILL.md'))) { throw 'No encuentro los archivos. Descomprime el zip completo y ejecuta INSTALAR.bat desde la carpeta extraida.' }
  Write-Host "`nInstalando SKILL_DEY (creado por Ing. Dey, @IngDey) en $oc`n" -ForegroundColor Cyan
  foreach ($d in 'skills','agents','commands','tools','plugins','skill_dey') { D (Join-Path $oc $d) }

  # Limpiar copias antiguas en carpetas en singular (evita duplicados)
  foreach ($old in 'skill/skill-dey','agent/skill_dey.md','command/skill_dey.md','command/skill_dey-reanudar.md','command/skill_dey-auditar.md') {
    $p = Join-Path $oc $old; if (Test-Path $p) { Remove-Item $p -Recurse -Force }
  }

  # Migracion desde FORJA (nombre anterior)
  foreach ($old in @('skills/forja','skill/forja','skills/skill-dey-old','agents/forja.md','agents/forja-explorador.md','agent/forja.md','agent/forja-explorador.md','commands/forja.md','commands/forja-reanudar.md','commands/forja-auditar.md','tools/forja.ts','tool/forja.ts','plugins/forja-guardian.ts','plugin/forja-guardian.ts','forja-lib')) { $p = Join-Path $oc $old; if (Test-Path $p) { Remove-Item $p -Recurse -Force } }
  D (Join-Path $oc 'skill_dey')
  foreach ($f in 'LECCIONES-GLOBALES.md','PREFERENCIAS.md') { $v = Join-Path $oc "forja/$f"; $n = Join-Path $oc "skill_dey/$f"; if ((Test-Path $v) -and -not (Test-Path $n)) { Copy-Item $v $n } }

  # 1. Skill (se reemplaza completa para no dejar archivos viejos)
  $sk = Join-Path $oc 'skills/skill-dey'; if (Test-Path $sk) { Remove-Item $sk -Recurse -Force }
  Copy-Item -Recurse (Join-Path $src 'skills/skill-dey') $sk; Ok 'Skill skill_dey'

  # 2. Herramientas y plugin guardian
  Copy-Item -Force (Join-Path $src 'tools/skill_dey.ts') (Join-Path $oc 'tools/skill_dey.ts'); Ok 'Herramientas: skill_dey_verificar, skill_dey_impacto, skill_dey_leccion, skill_dey_recordar'
  $fl = Join-Path $oc 'skill_dey-lib'; if (Test-Path $fl) { Remove-Item $fl -Recurse -Force }; Copy-Item -Recurse (Join-Path $src 'skill_dey-lib') $fl
  Copy-Item -Force (Join-Path $src 'plugins/skill_dey-guardian.ts') (Join-Path $oc 'plugins/skill_dey-guardian.ts'); Ok 'Plugin guardian + respaldo automatico (deshacer siempre disponible)'

  # 3. Dependencia de OpenCode para tools/plugins
  $pj = Join-Path $oc 'package.json'
  if (Test-Path $pj) {
    try {
      $p = Get-Content $pj -Raw -Encoding UTF8 | ConvertFrom-Json
      if (-not $p.PSObject.Properties['dependencies']) { $p | Add-Member -NotePropertyName dependencies -NotePropertyValue ([pscustomobject]@{}) }
      if (-not $p.dependencies.PSObject.Properties['@opencode-ai/plugin']) { $p.dependencies | Add-Member -NotePropertyName '@opencode-ai/plugin' -NotePropertyValue 'latest' }
      $p | ConvertTo-Json -Depth 20 | Set-Content $pj -Encoding UTF8
    } catch { Av 'No pude editar package.json de OpenCode; agrega "@opencode-ai/plugin" en dependencies.' }
  } else { Copy-Item (Join-Path $src 'package.json') $pj }
  Ok 'Dependencias (OpenCode las instala solo al abrir)'

  # 4. Agentes + modelo rapido para el explorador
  Copy-Item -Force (Join-Path $src 'agents/skill_dey.md') (Join-Path $oc 'agents/skill_dey.md')
  $exp = Get-Content (Join-Path $src 'agents/skill_dey-explorador.md') -Raw -Encoding UTF8
  $rapido = $null
  try {
    $principal = $null; $fj0 = Join-Path $oc 'opencode.json'; if (-not (Test-Path $fj0)) { $fj0 = Join-Path $oc 'opencode.jsonc' }
    if (Test-Path $fj0) { try { $principal = (Get-Content $fj0 -Raw -Encoding UTF8 | ConvertFrom-Json).model } catch {} }
    $prov = if ($principal) { $principal.Split('/')[0] } else { $null }
    $lista = & opencode models 2>$null
    $cands = $lista | Where-Object { $_ -match '^[\w\.-]+/[\w\.:@-]+$' -and $_ -match '(?i)(claude-haiku|haiku-4|gpt-[\d.]+-mini|gpt-5-mini|o4-mini|gemini-[\d.]+-flash(?!-lite)|grok-code-fast|deepseek-chat)' -and $_ -notmatch '(?i)(-fin\b|preview|exp|embed|audio|image|tts)' }
    if ($prov) { $rapido = $cands | Where-Object { $_.StartsWith("$prov/") } | Select-Object -First 1 } else { $rapido = $null }
  } catch {}
  if ($rapido) { $exp = $exp -replace '(?m)^mode: subagent', "mode: subagent`nmodel: $rapido"; Ok "Explorador usara el modelo rapido: $rapido" }
  else { Ok 'Explorador usa tu modelo principal (no hay uno rapido confiable del mismo proveedor)' }
  [IO.File]::WriteAllText((Join-Path $oc 'agents/skill_dey-explorador.md'), $exp, (New-Object Text.UTF8Encoding $false))
  Copy-Item -Force (Join-Path $src 'agents/skill_dey-vision.md') (Join-Path $oc 'agents/skill_dey-vision.md')
  Copy-Item -Force (Join-Path $src 'agents/skill_dey-revisor.md') (Join-Path $oc 'agents/skill_dey-revisor.md')
  Copy-Item -Force (Join-Path $src 'commands/*.md') (Join-Path $oc 'commands/')
  Ok 'Agentes skill_dey y skill_dey-explorador'

  Copy-Item -Force (Join-Path $src "cli/skill_dey.mjs") (Join-Path $oc "skill_dey/skill_dey.mjs")
  # 5. Memoria global (NUNCA se sobrescribe: conserva lo aprendido)
  foreach ($f in 'LECCIONES-GLOBALES.md','PREFERENCIAS.md') {
    $dst = Join-Path $oc "skill_dey/$f"
    if (-not (Test-Path $dst)) { Copy-Item (Join-Path $src "global/$f") $dst }
  }
  $pf = Join-Path $oc 'skill_dey/PREFERENCIAS.md'; $tiene = Get-Content $pf -Raw -Encoding UTF8
  $falt = (Get-Content (Join-Path $src 'global/PREFERENCIAS.md') -Encoding UTF8) | Where-Object { $_.StartsWith([string][char]0x2B50) -and -not $tiene.Contains(($_.Split(']')[0] + ']')) }
  if ($falt) { [IO.File]::WriteAllText($pf, ($tiene.TrimEnd() + "`n" + ($falt -join "`n") + "`n"), (New-Object Text.UTF8Encoding $false)) }
  [IO.File]::WriteAllText((Join-Path $oc 'skill_dey/VERSION'), '32.0.0')
  Ok 'Memoria global (lo aprendido se conserva)'

  # 6. Reglas globales AGENTS.md (bloque SKILL_DEY reemplazable)
  $a = Join-Path $oc 'AGENTS.md'; $n = Get-Content (Join-Path $src 'AGENTS.md') -Raw -Encoding UTF8; $o = ''
  if (Test-Path $a) { $o = Get-Content $a -Raw -Encoding UTF8; $o = [regex]::Replace($o, '(?s)(<!-- FORJA-INICIO -->.*?<!-- FORJA-FIN -->|<!-- SKILL_DEY-INICIO -->.*?<!-- SKILL_DEY-FIN -->|# Reglas globales \(todas las apps\).*?capturas\)\.)\r?\n?', '') }
  [IO.File]::WriteAllText($a, ($o.TrimEnd() + "`r`n" + $n).TrimStart(), (New-Object Text.UTF8Encoding $false))
  Ok 'Reglas globales'

  # 7. SKILL_DEY como agente por defecto
  $f = Join-Path $oc 'opencode.json'; if (-not (Test-Path $f) -and (Test-Path (Join-Path $oc 'opencode.jsonc'))) { $f = Join-Path $oc 'opencode.jsonc' }
  $c = $null
  if (Test-Path $f) { try { $c = Get-Content $f -Raw -Encoding UTF8 | ConvertFrom-Json; Copy-Item $f "$f.bak" -Force } catch { Av 'opencode.json tiene comentarios: agrega a mano  "default_agent": "skill_dey"' } }
  else { $c = [pscustomobject]@{ '$schema' = 'https://opencode.ai/config.json' } }
  if ($c) { if (-not $c.compaction) { $c | Add-Member -NotePropertyName compaction -NotePropertyValue ([pscustomobject]@{ auto = $true; prune = $true }) -Force }; $c | Add-Member -NotePropertyName default_agent -NotePropertyValue 'skill_dey' -Force; [IO.File]::WriteAllText($f, ($c | ConvertTo-Json -Depth 20), (New-Object Text.UTF8Encoding $false)); Ok 'SKILL_DEY es el agente por defecto' }

  # 8. Herramientas recomendadas en el equipo
  foreach ($t in 'git','node') { if (-not (Get-Command $t -ErrorAction SilentlyContinue)) { Av "Falta $t en este equipo (recomendado). Instalalo para aprovechar todo." } }

  Write-Host "`n  LISTO. Cierra y abre OpenCode y escribe normal.`n  SKILL_DEY - creado por Ing. Dey (@IngDey) - github.com/IngDey`n" -ForegroundColor Cyan
} catch {
  Write-Host "`n  ERROR: $($_.Exception.Message)`n" -ForegroundColor Red
}
