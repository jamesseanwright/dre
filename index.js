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

const deduplicate = iterable =>
  [...new Set(iterable)];

const mergeResults = resultsByPath => {
  const resources = new Map();

  resultsByPath
    .flat()
    .forEach(({ url, unusedSelectors }) => {
      if (!resources.has(url)) {
        resources.set(url, unusedSelectors);
      } else {
        const existingSelectors = resources.get(url);

        resources.set(
          url,
          deduplicate([...existingSelectors, ...unusedSelectors]),
        );
      }
    });

  return resources;
};

/* Object.fromEntries is not currently
 * available in Node. TODO: refactor
 * to use this once it's landed */
const fromEntries = entries =>
  [...entries].reduce(
    (obj, [key, value]) => ({
      ...obj,
      [key]: value,
    }),
    {},
  );

// TODO: proper report formatting
const printResults = results => {
  const formattedResults = JSON.stringify(
    fromEntries(results.entries()),
    null,
    4,
  );

  console.log(formattedResults);
};

(async () => {
  const browser = await puppeteer.launch();

  const resultsByPath = await Promise.all(
    dreConfig.paths.map(path => getCoverageForUrl(browser, `${dreConfig.baseUrl}${path}`)),
  );

  const mergedResults = mergeResults(resultsByPath);

  printResults(mergedResults);

  await browser.close();
})();
