// Sobe o hub e todas as ferramentas com package.json. Abra tudo por http://localhost:5173
// (o hub repassa /<ferramenta>/ para a porta de cada uma, então todas compartilham o mesmo localStorage).
import { spawn } from 'node:child_process'
import { existsSync, readdirSync } from 'node:fs'

const projetos = ['hub', ...readdirSync('tools').map((t) => `tools/${t}`)].filter((p) => existsSync(`${p}/package.json`))
for (const p of projetos) spawn('npm', ['run', 'dev', '-w', p], { stdio: 'inherit', shell: true })
