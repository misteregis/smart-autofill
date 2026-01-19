import fs from "node:fs";
import path from "node:path";

const verbose = process.argv.includes("--verbose");

// Função para remover exports e uso estrito dos arquivos JS
function cleanJsFiles(dir) {
  if (!fs.existsSync(dir)) {
    return;
  }

  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      cleanJsFiles(fullPath);
    } else if (entry.name.endsWith(".js")) {
      let content = fs.readFileSync(fullPath, "utf8");
      // Remover linhas problemáticas
      content = content.replace(/"use strict";\n/g, "");
      content = content.replace(/Object\.defineProperty\(exports, "__esModule", \{ value: true \}\);\n/g, "");
      content = content.replace(/import.*from.*;\n/g, "");
      content = content.replace(/\nexport default.*/g, "");
      content = content.replace(/\nexport((\s+)?)\{.*\};?/g, "");
      content = content.replace(/\n(?:(\s+)?)\/\/ biome-ignore.*\n/g, "\n");
      content = content.replace(/(?:(\s+)?)\/\/ .*\n/g, "\n"); // remover todos os comentários de linha
      fs.writeFileSync(fullPath, content, "utf8");

      if (verbose) {
        console.log(`Cleaned: ${fullPath}`);
      }
    }
  }
}

cleanJsFiles("dist");

if (verbose) {
  console.log("Post-build cleanup complete!");
}