'use strict';

const puppeteer = require('puppeteer');
const dreConfig = require(`${process.cwd()}/dreconfig.json`);

const getUnusedCSSSelectors = ({ ranges, text }) => {
  const unusedCSS = ranges.reduce(
    (css, range) => css.replace(css.slice(range.start, range.end), ''),
    text,
  );

  console.log('ALL CSS:');
  console.log(text);
  console.log('\nUNUSED CSS:');
  console.log(unusedCSS);
}

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  await page.coverage.startCSSCoverage();
  await page.goto(`${dreConfig.baseUrl}${dreConfig.paths[0]}`);
  const reports = await page.coverage.stopCSSCoverage();
  getUnusedCSSSelectors(reports[3]);
})();
