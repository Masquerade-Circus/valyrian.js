// Require valyrian and main app
require('./dist/valyrian.node.min.js');
require('./dist/valyrian.min.js');

// Require package json to obtain the version
let packageJson = require('./package.json');

console.log('Generating service worker...');
v.sw.generate('./app/public/sw.js', {
    name: 'Test',
    version: packageJson.version,
    urls: ['/', '/hello']
})
.then(() => {
    console.log('Generating service worker finished.');
    console.log('Generating app icons and manifest...');
    let favicons = {
        iconsPath: './app/public/icons/',                 // Path to the generated icons
        linksViewPath: './app/src/components',             // Path to the generated links file
    
        // favicons options
        path: '/icons/',                       // Path for overriding default icons path. `string`
        appName: 'Valyrian.js',                  // Your application's name. `string`
        appDescription: 'Lightwiegth steel to forge PWA\'s',           // Your application's description. `string`
        developerName: 'Christian César Robledo López (Masquerade Circus)',            // Your (or your developer's) name. `string`
        developerURL: 'http://masquerade-circus.net',
        dir: 'auto',
        lang: 'en-US',
        background: '#fff',             // Background colour for flattened icons. `string`
        theme_color: '#fff',
        display: "standalone",          // Android display: "browser" or "standalone". `string`
        orientation: "any",             // Android orientation: "any" "portrait" or "landscape". `string`
        start_url: "/",                 // Android start application's URL. `string`
        version: packageJson.version,                 // Your application's version number. `number`
        logging: false,                 // Print logs to console? `boolean`
        icons: {
            android: true,              // Create Android homescreen icon. `boolean`
            appleIcon: true,            // Create Apple touch icons. `boolean` or `{ offset: offsetInPercentage }`
            appleStartup: true,         // Create Apple startup images. `boolean`
            coast: false,               // Create Opera Coast icon with offset 25%. `boolean` or `{ offset: offsetInPercentage }`
            favicons: true,             // Create regular favicons. `boolean`
            firefox: false,             // Create Firefox OS icons. `boolean` or `{ offset: offsetInPercentage }`
            windows: true,              // Create Windows 8 tile icons. `boolean`
            yandex: false               // Create Yandex browser icon. `boolean`
        }
    };

    return v.icons.generate('./dist/icon.png', favicons);
})
.then(() => console.log('Generating app icons and manifest finished.'));