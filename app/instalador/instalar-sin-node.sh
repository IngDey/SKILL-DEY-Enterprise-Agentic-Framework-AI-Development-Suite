#!/usr/bin/env bash
# Instalador SKILL_DEY para OpenCode (Linux/macOS)
set -e
SRC="$(cd "$(dirname "$0")/.." && pwd)"; OC="$HOME/.config/opencode"
mkdir -p "$OC"/{skills,agents,commands,tools,plugins,skill_dey}
for v in skills/forja skill/forja skills/skill-dey-old agents/forja.md agents/forja-explorador.md agent/forja.md agent/forja-explorador.md commands/forja.md commands/forja-reanudar.md commands/forja-auditar.md tools/forja.ts tool/forja.ts plugins/forja-guardian.ts plugin/forja-guardian.ts forja-lib; do rm -rf "$OC/$v"; done
cp "$SRC/cli/skill_dey.mjs" "$OC/skill_dey/skill_dey.mjs"
for f in LECCIONES-GLOBALES.md PREFERENCIAS.md; do [ -f "$OC/forja/$f" ] && [ ! -f "$OC/skill_dey/$f" ] && cp "$OC/forja/$f" "$OC/skill_dey/$f"; done
rm -rf "$OC/skill/skill-dey" "$OC/agent/skill_dey.md" "$OC/agent/skill_dey-explorador.md" "$OC/tool/skill_dey.ts" "$OC/plugin/skill_dey-guardian.ts" "$OC/skills/skill-dey"
cp -r "$SRC/skills/skill-dey" "$OC/skills/skill-dey"
rm -rf "$OC/skill_dey-lib"; cp -r "$SRC/skill_dey-lib" "$OC/skill_dey-lib"
cp "$SRC/tools/skill_dey.ts" "$OC/tools/"; cp "$SRC/plugins/skill_dey-guardian.ts" "$OC/plugins/"
cp "$SRC/agents/skill_dey.md" "$OC/agents/"; cp "$SRC/agents/skill_dey-vision.md" "$OC/agents/"; cp "$SRC/agents/skill_dey-revisor.md" "$OC/agents/"; cp "$SRC"/commands/*.md "$OC/commands/"
PROV=$(python3 -c "import json,os;f='$OC/opencode.json';f=f if os.path.exists(f) else f+'c';print(json.load(open(f)).get('model','').split('/')[0])" 2>/dev/null || true)
RAPIDO=$(opencode models 2>/dev/null | grep -E '^[^ ]+/[^ ]+$' | grep -iE 'claude-haiku|haiku-4|gpt-[0-9.]+-mini|gpt-5-mini|o4-mini|gemini-[0-9.]+-flash|grok-code-fast|deepseek-chat' | grep -viE -- '-fin\b|preview|exp|embed|audio|image|tts|flash-lite' | { if [ -n "$PROV" ]; then grep "^$PROV/"; else cat >/dev/null; fi; } | head -1 || true)
if [ -n "$RAPIDO" ]; then awk -v m="$RAPIDO" '{print} /^mode: subagent$/{print "model: " m}' "$SRC/agents/skill_dey-explorador.md" > "$OC/agents/skill_dey-explorador.md"; else cp "$SRC/agents/skill_dey-explorador.md" "$OC/agents/"; fi
echo "32.0.0" > "$OC/skill_dey/VERSION"
for f in LECCIONES-GLOBALES.md PREFERENCIAS.md; do [ -f "$OC/skill_dey/$f" ] || cp "$SRC/global/$f" "$OC/skill_dey/"; done
[ -f "$OC/package.json" ] || cp "$SRC/package.json" "$OC/"
python3 - "$OC" "$SRC" <<'PY'
import json,re,sys,os
oc,src=sys.argv[1:3]
a=os.path.join(oc,'AGENTS.md'); o=open(a).read() if os.path.exists(a) else ''
o=re.sub(r'(?s)<!-- FORJA-INICIO -->.*?<!-- FORJA-FIN -->\n?','',o)
o=re.sub(r'(?s)<!-- SKILL_DEY-INICIO -->.*?<!-- SKILL_DEY-FIN -->\n?','',o)
open(a,'w').write((o.rstrip()+'\n'+open(os.path.join(src,'AGENTS.md')).read()).lstrip())
pf=os.path.join(oc,'skill_dey','PREFERENCIAS.md'); tiene=open(pf,encoding='utf-8').read()
falt=[l for l in open(os.path.join(src,'global','PREFERENCIAS.md'),encoding='utf-8').read().splitlines() if l.startswith('⭐') and l.split(']')[0]+']' not in tiene]
if falt: open(pf,'w',encoding='utf-8').write(tiene.rstrip()+'\n'+'\n'.join(falt)+'\n')
p=os.path.join(oc,'package.json'); d=json.load(open(p)); d.setdefault('dependencies',{}).setdefault('@opencode-ai/plugin','latest'); json.dump(d,open(p,'w'),indent=2)
f=os.path.join(oc,'opencode.json')
if not os.path.exists(f) and os.path.exists(os.path.join(oc,'opencode.jsonc')): f=os.path.join(oc,'opencode.jsonc')
try: c=json.load(open(f)) if os.path.exists(f) else {"$schema":"https://opencode.ai/config.json"}
except Exception: print('opencode.json con comentarios: agrega "default_agent": "skill_dey"'); sys.exit()
c['default_agent']='skill_dey'; c.setdefault('compaction',{}); c['compaction'].setdefault('auto',True); c['compaction'].setdefault('prune',True); json.dump(c,open(f,'w'),indent=2)
PY
echo "LISTO. Explorador: ${RAPIDO:-modelo principal}. Abre OpenCode y escribe normal."
