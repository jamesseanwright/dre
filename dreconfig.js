const homepage = {
  path: '/',
  async actions(page) {
    const carouselPrevious = await page.$('.slick-prev');
    const carouselNext = await page.$('.slick-next');
    const searchField = await page.$('#q');

    await carouselPrevious.click();
    await carouselNext.click();
    await searchField.type('metallica');
    await page.waitForSelector('#search-suggestions');
  },
};

const search = {
  path: '/search?q=metallica&lang=en_US',
  async actions(page) {
    const accordionItem = await page.$('#secondary .js-refinement');
    await accordionItem.click();
    await page.waitForSelector('.js-accordion__header-link.expanded');
  },
};

const productDetails = {
  path: '/metallica-hardwired--long-sleeve-t-shirt-12345_TEST.html',
  async actions(page) {
    const addToCart = await page.$('#add-to-cart');
    await addToCart.click();

    await page.waitForSelector('#mini-cart', {
      visible: true,
    });
  },
};

const cart = {
  path: '/cart',
};

const checkout = {
  path: '/checkout',
};

module.exports = {
  baseUrl: 'https://dev08-fye-twec.demandware.net/s/FYE',
  flow: [
    homepage,
    search,
    productDetails,
    cart,
    checkout,
  ],
  outDir: 'output',
  minifyOutput: true,
  puppeteerOptions:{
    headless: false,
    defaultViewport: null,
  },
};
