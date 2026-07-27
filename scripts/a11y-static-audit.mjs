import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const appRoot = path.join(root, "app");
const failures = [];
const notes = [];

function walk(directory, extension) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) return walk(target, extension);
    return target.endsWith(extension) ? [target] : [];
  });
}

function relative(file) {
  return path.relative(root, file).replaceAll("\\", "/");
}

function lineAt(content, index) {
  return content.slice(0, index).split(/\r?\n/u).length;
}

function fail(file, content, match, message) {
  failures.push(`${relative(file)}:${lineAt(content, match.index)} ${message}`);
}

const tsxFiles = walk(appRoot, ".tsx");
let buttonCount = 0;
let imageCount = 0;
let newTabCount = 0;
let autoFocusCount = 0;

for (const file of tsxFiles) {
  const content = fs.readFileSync(file, "utf8");

  for (const match of content.matchAll(/<button\b[^>]*>/gsu)) {
    buttonCount += 1;
    if (!/\btype\s*=\s*["'{]/u.test(match[0])) {
      fail(file, content, match, "butonun açık bir type değeri yok.");
    }
  }

  for (const match of content.matchAll(/<(?:img|Image)\b[^>]*>/gsu)) {
    imageCount += 1;
    if (!/\balt\s*=\s*["'{]/u.test(match[0])) {
      fail(file, content, match, "görselin alt niteliği yok.");
    }
  }

  for (const match of content.matchAll(/<a\b[^>]*\btarget\s*=\s*["']_blank["'][^>]*>/gsu)) {
    newTabCount += 1;
    if (!/\brel\s*=\s*["'][^"']*(?:noopener|noreferrer)[^"']*["']/u.test(match[0])) {
      fail(file, content, match, "yeni sekme bağlantısında rel güvenlik değeri yok.");
    }
  }

  for (const match of content.matchAll(/tabIndex\s*=\s*(?:\{\s*)?([1-9]\d*)/gu)) {
    fail(file, content, match, `pozitif tabIndex (${match[1]}) klavye sırasını bozuyor.`);
  }

  const fileAutoFocusCount = (content.match(/\bautoFocus\b/gu) || []).length;
  autoFocusCount += fileAutoFocusCount;
  if (fileAutoFocusCount > 0 && relative(file) !== "app/components/ProfileSearch.tsx") {
    failures.push(`${relative(file)} içinde beklenmeyen autoFocus kullanımı var.`);
  }
}

const layout = fs.readFileSync(path.join(appRoot, "layout.tsx"), "utf8");
if (!/<html\b[^>]*\blang=["']tr["']/u.test(layout)) {
  failures.push("app/layout.tsx belge dilini lang=\"tr\" olarak tanımlamıyor.");
}
if (!/href=["']#main-content["']/u.test(layout)) {
  failures.push("app/layout.tsx ana içeriğe geçiş bağlantısı içermiyor.");
}

notes.push(`${buttonCount} butonda açık type değeri doğrulandı.`);
notes.push(`${imageCount} görselde alt niteliği doğrulandı.`);
notes.push(`${newTabCount} yeni sekme bağlantısında rel güvenliği doğrulandı.`);
notes.push(`autoFocus kullanımı: ${autoFocusCount}/1`);

if (failures.length > 0) {
  console.error("\nErişilebilirlik statik denetimi başarısız:\n");
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log("Erişilebilirlik statik denetimi geçti.");
notes.forEach((note) => console.log(`- ${note}`));
