'use strict';

const puppeteer = require('puppeteer');
const css = require('css');
const dreConfig = require(`${process.cwd()}/dreconfig.json`);

const getSelectors = ({ stylesheet }) =>
  stylesheet.rules.flatMap(({ selectors }) => selectors);

// TODO: combine separate iterations to aid perf
const getUnusedSelectors = (ranges, text) => {
  const allSelectors = getSelectors(css.parse(text));

  const usedSelectors = ranges
    .map(({ start, end }) => css.parse(text.slice(start, end)))
    .flatMap(getSelectors);

  return allSelectors.filter(selector => !usedSelectors.includes(selector));
};

// TODO: abstract into report builder and test!
const buildReport = ({ url, ranges, text }) => `
  Unused selectors in ${url}:
  ${'-'.repeat(url.length)}
  ${getUnusedSelectors(ranges, text).join('\n  *')}

  ----

`;

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  await page.coverage.startCSSCoverage();
  await page.goto(`${dreConfig.baseUrl}${dreConfig.paths[0]}`);

  const coverageResults = await page.coverage.stopCSSCoverage();
  const reports = coverageResults.map(buildReport);

  console.log(reports.join('\n'));

  await browser.close();
})();
