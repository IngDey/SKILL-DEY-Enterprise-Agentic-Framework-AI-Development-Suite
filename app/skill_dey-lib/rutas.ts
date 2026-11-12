// SKILL_DEY — rutas globales en UN solo lugar (respeta OPENCODE_CONFIG_DIR, igual que el instalador).
import { join } from "node:path"
import { homedir } from "node:os"

/** Carpeta de configuración de OpenCode. */
export const ocDir = (...p: string[]) => join(process.env.OPENCODE_CONFIG_DIR || join(homedir(), ".config", "opencode"), ...p)
/** Carpeta global de skill_dey (versión, modelos, estado, navegador de pruebas). */
export const sdDir = (...p: string[]) => ocDir("skill_dey", ...p)
/** Memoria global (lecciones, vacunas): la autoprueba la redirige a una carpeta temporal para no tocar la tuya. */
export const memoriaGlobal = (...p: string[]) => join(process.env.SKILL_DEY_MEMORIA_GLOBAL || sdDir(), ...p)
