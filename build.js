import fs from "node:fs";
import path from "node:path";

const distPath = "dist";

// Função para copiar arquivos HTML recursivamente
function copyFiles(src, dest) {
  if (!fs.existsSync(src)) {
    return;
  }

  const allowedExtensions = [".html", ".json", ".png"];
  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyFiles(srcPath, destPath);
    } else if (allowedExtensions.some((ext) => entry.name.endsWith(ext))) {
      fs.mkdirSync(path.dirname(destPath), { recursive: true });
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

// Limpa a pasta dist
if (fs.existsSync(distPath)) {
  for (const entry of fs.readdirSync(distPath)) {
    if (entry === ".gitkeep") continue;

    const fullPath = path.join(distPath, entry);
    fs.rmSync(fullPath, { recursive: true, force: true });
  }
}

// Cria a pasta dist
fs.mkdirSync("dist", { recursive: true });

// Copia apenas arquivos .html
copyFiles("src", "dist");
