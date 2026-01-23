import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import esbuild from "esbuild";

const DIST_PATH = "dist";
const BUILD_PATH = "build";
const ALLOWED_EXTENSIONS = [".html", ".json", ".png"];
const HASH_LENGTH = 8;
const SEPARATE_SCRIPTS = ["content.js", "background.js"];
const verbose = process.argv.includes("--verbose");

// Função para copiar arquivos permitidos recursivamente
async function copyFiles(src, dest) {
  if (!fs.existsSync(src)) {
    return;
  }

  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      await copyFiles(srcPath, destPath);
    } else if (ALLOWED_EXTENSIONS.some((ext) => entry.name.endsWith(ext))) {
      fs.mkdirSync(path.dirname(destPath), { recursive: true });
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

// Função para buscar todos os arquivos .js recursivamente
function getAllJsFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);

  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      getAllJsFiles(filePath, fileList);
    } else if (file.endsWith(".js")) {
      fileList.push(filePath);
    }
  }

  return fileList;
}

// Função para limpar a pasta dist
function cleanDistFolder() {
  if (!fs.existsSync(DIST_PATH)) {
    return;
  }

  if (!verbose) {
    const fileRegex = /^(bundle|content|background)-[a-f0-9]{8}\.js$/;

    for (const file of fs.readdirSync(DIST_PATH)) {
      if (fileRegex.test(file)) {
        fs.unlinkSync(path.join(DIST_PATH, file));
      }
    }
    return;
  }

  for (const entry of fs.readdirSync(DIST_PATH)) {
    if (entry === ".gitkeep") continue;

    const fullPath = path.join(DIST_PATH, entry);
    fs.rmSync(fullPath, { recursive: true, force: true });
  }
}

// Função para criar arquivo de entrada temporário
function createEntryFile(scripts) {
  const entryContent = scripts
    .map((script) => `import "./${path.relative(BUILD_PATH, script).replace(/\\/g, "/")}";`)
    .join("\n");

  const entryPath = path.join(BUILD_PATH, "entry.js");
  fs.writeFileSync(entryPath, entryContent);

  return entryPath;
}

// Função para gerar hash do arquivo
function generateFileHash(filePath) {
  const content = fs.readFileSync(filePath);
  return crypto.createHash("sha256").update(content).digest("hex").substring(0, HASH_LENGTH);
}

// Função para renomear bundle com hash
function renameFileWithHash(filename, filePath) {
  const hash = generateFileHash(filePath);
  const ext = path.extname(filename);
  const name = path.basename(filename, ext);
  const newFilename = `${name}-${hash}${ext}`;
  const newPath = path.join(DIST_PATH, newFilename);

  fs.renameSync(filePath, newPath);

  return newFilename;
}

// Função para atualizar referências nos arquivos HTML
function updateHtmlReferences(newBundleName) {
  const htmlFiles = fs.readdirSync(DIST_PATH).filter((f) => f.endsWith(".html"));

  for (const htmlFile of htmlFiles) {
    const htmlPath = path.join(DIST_PATH, htmlFile);
    let htmlContent = fs.readFileSync(htmlPath, "utf-8");

    htmlContent = htmlContent.replace(
      /<script\b([^>]*?)\s*\bsrc=["']bundle(-[a-f0-9]{8})?\.js["']([^>]*)>\s*<\/script>/g,
      `<script$1 src="${newBundleName}"$3></script>`
    );

    fs.writeFileSync(htmlPath, htmlContent);
  }
}

// Função para atualizar versão nos arquivos HTML
function updateVersionInHtml() {
  const packageJsonPath = path.join(process.cwd(), "package.json");

  if (!fs.existsSync(packageJsonPath)) {
    console.warn("package.json não encontrado, versão não será atualizada");
    return;
  }

  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));
  const version = packageJson.version;

  if (!version) {
    console.warn("Versão não encontrada no package.json");
    return;
  }

  const htmlFiles = fs.readdirSync(DIST_PATH).filter((f) => f.endsWith(".html"));

  for (const htmlFile of htmlFiles) {
    const htmlPath = path.join(DIST_PATH, htmlFile);
    let htmlContent = fs.readFileSync(htmlPath, "utf-8");

    // Substitui versão no formato v0.0.0 ou v1.0.0 etc
    htmlContent = htmlContent.replace(/v\d+\.\d+\.\d+/g, `v${version}`);

    fs.writeFileSync(htmlPath, htmlContent);
  }

  if (verbose) {
    console.log(`Versão atualizada para v${version} nos arquivos HTML`);
  }
}

// Função para atualizar referências ao content.js e background.js no manifest.json
function updateManifestReferences(fileMap) {
  const manifestPath = path.join(DIST_PATH, "manifest.json");
  if (!fs.existsSync(manifestPath)) {
    return;
  }

  const manifestContent = fs.readFileSync(manifestPath, "utf-8");
  const manifest = JSON.parse(manifestContent);

  // Atualiza content_scripts
  if (manifest.content_scripts && fileMap.content) {
    for (const script of manifest.content_scripts) {
      if (script.js) {
        script.js = script.js.map((file) => (file.match(/^content(-[a-f0-9]{8})?\.js$/) ? fileMap.content : file));
      }
    }
  }

  // Atualiza background
  if (manifest?.background?.scripts && fileMap.background) {
    manifest.background.scripts = manifest.background.scripts.map((file) =>
      file.match(/^background(-[a-f0-9]{8})?\.js$/) ? fileMap.background : file
    );
  }

  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
}

// Função para compilar scripts
async function buildScript(scriptPaths, outputFilename) {
  const entryPath = createEntryFile(scriptPaths);

  try {
    const outputPath = path.join(DIST_PATH, outputFilename);

    await esbuild.build({
      entryPoints: [entryPath],
      bundle: true,
      outfile: outputPath,
      format: "iife",
      platform: "browser",
      minify: true,
      sourcemap: false,
      target: ["es2022"],
      treeShaking: true,
      legalComments: "none"
    });

    // Remove arquivo temporário
    fs.unlinkSync(entryPath);

    // Renomeia arquivo com hash
    const newFilename = renameFileWithHash(outputFilename, outputPath);

    if (verbose) {
      console.log(`Script created: ${newFilename}`);
    }

    return newFilename;
  } catch (error) {
    if (fs.existsSync(entryPath)) {
      fs.unlinkSync(entryPath);
    }
    throw error;
  }
}

// Função principal
async function build() {
  // Verifica se a pasta build existe
  if (!fs.existsSync(BUILD_PATH)) {
    console.error("Pasta build não encontrada");
    process.exit(1);
  }

  // Limpa e cria a pasta dist
  cleanDistFolder();
  fs.mkdirSync(DIST_PATH, { recursive: true });

  // Copia arquivos permitidos
  await copyFiles("src", DIST_PATH);

  // Busca todos os arquivos .js
  const allScripts = getAllJsFiles(BUILD_PATH);

  if (allScripts.length === 0) {
    console.error("Nenhum arquivo .js encontrado na pasta build");
    process.exit(1);
  }

  // Separa scripts especiais dos demais
  const separateScripts = {};
  const bundleScripts = [];

  for (const script of allScripts) {
    const basename = path.basename(script);
    if (SEPARATE_SCRIPTS.includes(basename)) {
      const name = path.basename(basename, ".js");
      separateScripts[name] = script;
    } else {
      bundleScripts.push(script);
    }
  }

  try {
    const fileMap = {};

    // Cria o bundle principal
    if (bundleScripts.length > 0) {
      const newBundleName = await buildScript(bundleScripts, "bundle.js");
      updateHtmlReferences(newBundleName);
    }

    // Compila scripts separados
    for (const [name, scriptPath] of Object.entries(separateScripts)) {
      const filename = `${name}.js`;
      fileMap[name] = await buildScript([scriptPath], filename);
    }

    // Atualiza manifest.json
    if (Object.keys(fileMap).length > 0) {
      updateManifestReferences(fileMap);
    }

    // Atualiza versão nos arquivos HTML
    updateVersionInHtml();
  } catch (error) {
    if (verbose) {
      console.error("Error while building:", error);
    }
    process.exit(1);
  }
}

// Executa o build
build();
