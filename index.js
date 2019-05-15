'use strict';

const puppeteer = require('puppeteer');
const css = require('css');
const dreConfig = require(`${process.cwd()}/dreconfig.json`);

const getSelectors = ({ stylesheet }) =>
  stylesheet.rules.flatMap(({ selectors }) => selectors);

// TODO: combine separate iterations to aid perf
const getUnusedSelectors = ({ url, ranges, text }) => {
  const allSelectors = getSelectors(css.parse(text));

  const usedSelectors = ranges
    .map(({ start, end }) => css.parse(text.slice(start, end)))
    .flatMap(getSelectors);

  const unusedSelectors = allSelectors.filter(
    selector => selector && !usedSelectors.includes(selector)
  );

  return {
    url,
    unusedSelectors,
  };
};

// TODO: abstract into report builder and test!
const buildReport = ({ url, ranges, text }) => `
  Unused selectors in ${url}:
  ${'-'.repeat(url.length)}
  ${getUnusedSelectors(ranges, text).join('\n  * ')}

  ----
`;

const getCoverageForUrl = async (browser, url) => {
  const page = await browser.newPage();

  await page.coverage.startCSSCoverage();
  await page.goto(url);

  const results = await page.coverage.stopCSSCoverage();

  return results.map(getUnusedSelectors);
};

(async () => {
  const reports = new Map();
  const browser = await puppeteer.launch();

  const results = await Promise.all(
    dreConfig.paths.map(path => getCoverageForUrl(browser, `${dreConfig.baseUrl}${path}`)),
  );

  console.log(results.length);
  console.log('*******', JSON.stringify(results, null, 2));

  // console.log(results);
  // const reports = coverageResults.map(buildReport);

  // console.log(reports.join('\n'));

  await browser.close();
})();
