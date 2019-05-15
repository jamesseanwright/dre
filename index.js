'use strict';

const puppeteer = require('puppeteer');
const css = require('css');
const dreConfig = require(`${process.cwd()}/dreconfig.json`);

const getUnusedCSSSelectors = ({ ranges, text }) => {
  const unusedCSSText = ranges.reduce(
    (css, range) => css.replace(css.slice(range.start, range.end), ''),
    text,
  );

  const ast = css.parse(unusedCSSText);

  return ast.stylesheet.rules
    .map(rule => rule.selectors)
    .flat(Number.Infinity);
}

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  await page.coverage.startCSSCoverage();
  await page.goto(`${dreConfig.baseUrl}${dreConfig.paths[0]}`);
  const reports = await page.coverage.stopCSSCoverage();
  getUnusedCSSSelectors(reports[4]);

  await browser.close();
})();
