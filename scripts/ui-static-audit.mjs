import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import postcss from "postcss";

const root = process.cwd();
const appRoot = path.join(root, "app");
const failures = [];
const notes = [];

function walk(directory, extensions) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) return walk(target, extensions);
    return extensions.has(path.extname(entry.name)) ? [target] : [];
  });
}

function relative(file) {
  return path.relative(root, file).replaceAll("\\", "/");
}

function countLines(file) {
  return fs.readFileSync(file, "utf8").split(/\r?\n/u).length;
}

function assert(condition, message) {
  if (!condition) failures.push(message);
}

const sourceFiles = walk(appRoot, new Set([".ts", ".tsx", ".css"]));

for (const file of sourceFiles) {
  const content = fs.readFileSync(file, "utf8");
  assert(!/[ÃÄÅÂ][\x80-\xBF]/u.test(content), `${relative(file)} içinde bozuk UTF-8/Türkçe karakter dizisi bulundu.`);
  if (file.endsWith(".css")) {
    try {
      const stylesheet = postcss.parse(content, { from: file });
      stylesheet.walkRules((rule) => {
        if (!/:hover|:focus-visible/u.test(rule.selector)) return;
        rule.walkDecls(/^(?:background|background-color)$/u, (declaration) => {
          assert(
            !/(?:^|\s)(?:white|#fff(?:fff)?|rgb\(255\s*,\s*255\s*,\s*255\))(?:\s|$)/iu.test(declaration.value),
            `${relative(file)}:${rule.source?.start?.line ?? "?"} koyu tema etkileÅŸiminde beyaz yÃ¼zey kullanÄ±yor: ${rule.selector}`
          );
        });
      });
    } catch (error) {
      failures.push(`${relative(file)} CSS sözdizimi geçersiz: ${error.reason || error.message}`);
    }
  }
}

const lineBudgets = {
  "app/globals.css": 1500,
  "app/(social)/page.tsx": 520,
  "app/account/page.tsx": 620,
  "app/admin/page.tsx": 650,
};

for (const [file, maximum] of Object.entries(lineBudgets)) {
  const absolute = path.join(root, file);
  const lines = countLines(absolute);
  assert(lines <= maximum, `${file} ${lines} satır; kalite bütçesi ${maximum} satır.`);
  notes.push(`${file}: ${lines}/${maximum} satır`);
}

const tsxFiles = sourceFiles.filter((file) => file.endsWith(".tsx"));
const inlineColorExceptions = new Set([
  "app/global-error.tsx",
  "app/icon.tsx",
  "app/layout.tsx",
]);
for (const file of tsxFiles) {
  const lines = countLines(file);
  assert(lines <= 1000, `${relative(file)} ${lines} satır; bileşen üst sınırı 1000 satır.`);
  const content = fs.readFileSync(file, "utf8");
  if (!inlineColorExceptions.has(relative(file))) {
    assert(!/#[0-9a-f]{3,8}(?![0-9a-f-])/iu.test(content), `${relative(file)} içinde merkezi token yerine ham HEX rengi kullanılıyor.`);
  }
}

const allTsx = tsxFiles.map((file) => fs.readFileSync(file, "utf8")).join("\n");
const cssFiles = sourceFiles.filter((file) => file.endsWith(".css"));
const allCss = cssFiles.map((file) => fs.readFileSync(file, "utf8")).join("\n");
const tinyTsxCount = (allTsx.match(/text-\[(?:[1-9]|1[01])px\]/gu) || []).length;
const tinyCssCount = (allCss.match(/font-size:\s*(?:[1-9]|1[01])px/gu) || []).length;
assert(tinyTsxCount === 0, `TSX içinde ${tinyTsxCount} adet 12 px altı metin bulundu; yeni bileşenlerde buna izin verilmiyor.`);
assert(tinyCssCount === 0, `CSS içinde ${tinyCssCount} adet 12 px altı metin bulundu; yeni taban boyut 12 px.`);
notes.push(`12 px altı metin bütçesi: TSX ${tinyTsxCount}/0, CSS ${tinyCssCount}/0`);

const semanticTokenDefinitions = new Set(
  [...allCss.matchAll(/(--(?:ui|brand)-[a-z0-9-]+)\s*:/giu)].map((match) => match[1])
);
const semanticTokenReferences = new Set(
  [...`${allCss}\n${allTsx}`.matchAll(/var\((--(?:ui|brand)-[a-z0-9-]+)/giu)].map((match) => match[1])
);
for (const token of semanticTokenReferences) {
  assert(semanticTokenDefinitions.has(token), `Tanımsız tasarım tokenı kullanılıyor: ${token}`);
}
notes.push(`${semanticTokenReferences.size} semantik token referansı tanımlı.`);

const rawColorExceptions = new Set([
  "app/styles/tokens.css",
  "app/styles/primitives.css",
]);
const rawColorBudgets = {
  "app/globals.css": 72,
  "app/styles/feature-surfaces.css": 0,
  "app/styles/forum.css": 0,
  "app/styles/interaction-refinements.css": 0,
  "app/styles/unified-surfaces.css": 0,
};
let rawColorTotal = 0;
for (const file of cssFiles) {
  const fileName = relative(file);
  if (rawColorExceptions.has(fileName)) continue;
  const content = fs.readFileSync(file, "utf8");
  const count = (content.match(/#[0-9a-f]{3,8}(?![0-9a-f-])|rgba?\([^)]*\)/giu) || []).length;
  const budget = rawColorBudgets[fileName] ?? 0;
  rawColorTotal += count;
  assert(count <= budget, `${fileName} içinde ${count} ham renk var; kalite bütçesi ${budget}.`);
}
assert(rawColorTotal <= 72, `Eski CSS katmanlarında ${rawColorTotal} ham renk var; toplam bütçe 72.`);
notes.push(`Eski CSS ham renk bütçesi: ${rawColorTotal}/72`);

const tokensPath = path.join(appRoot, "styles", "tokens.css");
const tokens = fs.readFileSync(tokensPath, "utf8");
for (const token of [
  "--ui-bg",
  "--ui-surface",
  "--ui-text",
  "--ui-primary",
  "--ui-success",
  "--ui-danger",
  "--ui-focus",
  "--ui-control-md",
  "--ui-motion-normal",
  "--brand-spotify",
]) {
  assert(tokens.includes(token), `Tasarım tokenı eksik: ${token}`);
}
assert(tokens.includes('[data-theme="light"]'), "Açık tema token bloğu eksik.");
assert(tokens.includes('[data-theme="dark"]'), "Koyu tema token bloğu eksik.");

if (failures.length > 0) {
  console.error("\nUI kalite denetimi başarısız:\n");
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log("UI kalite denetimi geçti.");
notes.forEach((note) => console.log(`- ${note}`));
