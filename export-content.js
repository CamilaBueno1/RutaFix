const fs = require('fs');
const path = require('path');

// Nombre del archivo final que contiene el codigo exportado.
const OUTPUT_FILE = 'contexto_proyecto.md';
const ROOT_DIR = __dirname;

// Carpetas pesadas o sin codigo fuente util.
const IGNORE_DIRS = ['node_modules', '.expo', '.vscode', '.opencode', '.git', 'assets', '__tests__', '.tamagui'];

// Archivos que no queremos incluir.
const IGNORE_FILES = ['package-lock.json', 'yarn.lock', OUTPUT_FILE, 'export_context.js'];

// Extensiones permitidas.
const ALLOWED_EXTENSIONS = ['.js', '.jsx', '.ts', '.tsx', '.json', '.md'];

function buildContext(currentPath) {
    const items = fs.readdirSync(currentPath);

    for (const item of items) {
        const itemPath = path.join(currentPath, item);
        const stat = fs.statSync(itemPath);

        if (stat.isDirectory()) {
            if (!IGNORE_DIRS.includes(item)) {
                buildContext(itemPath);
            }
        } else {
            const ext = path.extname(item);
            const isAllowedExtension = ALLOWED_EXTENSIONS.includes(ext);
            
            // Incluir archivos de configuracion, como .gitignore y eslint.config.js.
            const isConfigFile = item.startsWith('.') || item.includes('config'); 

            const isEnvFile = /^\.env(?:\.|$)/.test(item);

            if (!isEnvFile && !IGNORE_FILES.includes(item) && (isAllowedExtension || isConfigFile)) {
                try {
                    const content = fs.readFileSync(itemPath, 'utf8');
                    const relativePath = path.relative(ROOT_DIR, itemPath);
                    
                    // Separador para distinguir cada archivo exportado.
                    const separator = `\n\n================================================\n`;
                    const fileHeader = `ARCHIVO: ${relativePath}\n================================================\n\n`;
                    
                    fs.appendFileSync(path.join(ROOT_DIR, OUTPUT_FILE), separator + fileHeader + content);
                } catch (error) {
                    console.error(`Error leyendo ${itemPath}:`, error.message);
                }
            }
        }
    }
}

// 1. Inicializar el archivo de salida.
fs.writeFileSync(path.join(ROOT_DIR, OUTPUT_FILE), '# Contexto completo del proyecto POLIPERRODEX\n');
console.log('Recopilando codigo...');

// 2. Recopilar los archivos.
buildContext(ROOT_DIR);

console.log(`Listo. El contenido se exporto a: ${OUTPUT_FILE}`);