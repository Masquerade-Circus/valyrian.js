import expect from 'expect';
import fs from 'fs';
import '../lib';
import nodePlugin from '../plugins/node';
import packageJson from '../package.json';
v.use(nodePlugin);

describe('Node test', () => {


  it('Get hyperscript string from html', async () => {
    let html = '<body><link rel="shortcult icon" href="/icons/favicon.ico"/>Hello world</body>';

    let dom = await v.html2Hyper(html);

    expect(dom).toEqual(`v("body", {}, [
  v("link", {"rel":"shortcult icon","href":"/icons/favicon.ico"}),
  "Hello world"
])`);


  });

  it('Should create a service worker file', async () => {
    let file = '.tmp/sw.js';
    await v.sw(file, {
      name: 'Test',
      version: packageJson.version,
      urls: ['/', '/hello']
    });

    expect(fs.existsSync(file)).toBeTruthy();

  });

  // NOTE: This test will take some time between 30 and 60 seconds
  it('Should generate icons, manifest.json and a links component', async () => {
    let favicons = {
      iconsPath: '.tmp/', // Path to the generated icons
      linksViewPath: '.tmp/', // Path to the generated links file

      // favicons options
      path: '/icons/', // Path for overriding default icons path. `string`
      appName: packageJson.name, // Your application's name. `string`
      appDescription: packageJson.description, // Your application's description. `string`
      developerName: 'Christian César Robledo López (Masquerade Circus)', // Your (or your developer's) name. `string`
      developerURL: 'http://masquerade-circus.net',
      dir: 'auto',
      lang: 'en-US',
      background: '#fff', // Background colour for flattened icons. `string`
      theme_color: '#fff',
      display: 'standalone', // Android display: "browser" or "standalone". `string`
      orientation: 'any', // Android orientation: "any" "portrait" or "landscape". `string`
      start_url: '/', // Android start application's URL. `string`
      version: packageJson.version, // Your application's version number. `number`
      logging: false, // Print logs to console? `boolean`
      icons: {
        android: true, // Create Android homescreen icon. `boolean`
        appleIcon: false, // Create Apple touch icons. `boolean` or `{ offset: offsetInPercentage }`
        appleStartup: false, // Create Apple startup images. `boolean`
        coast: false, // Create Opera Coast icon with offset 25%. `boolean` or `{ offset: offsetInPercentage }`
        favicons: true, // Create regular favicons. `boolean`
        firefox: false, // Create Firefox OS icons. `boolean` or `{ offset: offsetInPercentage }`
        windows: false, // Create Windows 8 tile icons. `boolean`
        yandex: false // Create Yandex browser icon. `boolean`
      }
    };

    await v.icons('./dist/icon.png', favicons);
    expect(fs.existsSync('.tmp/favicon.ico')).toBeTruthy();
    expect(fs.existsSync('.tmp/links.js')).toBeTruthy();
    expect(fs.existsSync('.tmp/manifest.json')).toBeTruthy();

  });

});
