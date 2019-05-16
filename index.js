'use strict';

const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');
const css = require('css');
const dreConfig = require(`${process.cwd()}/dreconfig`);

async function* executeFlow(page, { baseUrl, flow }) {
  for (let { path, actions = () => Promise.resolve() } of flow) {
    await page.goto(`${baseUrl}${path}`);
    yield actions(page);
  }
}

const getTrimmedStylesheet = ({ url, ranges, text }) => {
  const usedStyles = ranges.reduce(
    (used, { start, end }) => used + text.substring(start, end),
    '',
  );

  const ast = css.parse(usedStyles);

  return {
    url,
    contents: css.stringify(ast, {
      compress: true,
    }),
  };
};

const createOutDir = outDir => {
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir);
  }
};

const writeStylesheet = (outDir, { url, contents }) => {
  const [filename] = url.split('/').splice(-1);

  /* For some reason, there is at times a result
   * associated with no filename. TODO: investigate */
  if (!filename) {
    return;
  }

  fs.writeFileSync(
    path.resolve(outDir, filename),
    contents,
  );
};

(async () => {
  const browser = await puppeteer.launch(dreConfig.puppeteerOptions);
  const page = await browser.newPage();

  await page.coverage.startCSSCoverage({
    resetOnNavigation: false,
  });

  try {
    for await (let _ of executeFlow(page, dreConfig)) {
      // TODO: umm...
    }

    const results = await page.coverage.stopCSSCoverage();

    createOutDir(dreConfig.outDir);

    results.map(getTrimmedStylesheet)
      .forEach(stylesheet => writeStylesheet(dreConfig.outDir, stylesheet));
  } catch (e) {
    console.error(e);
  } finally {
    await browser.close();
  }
})();
