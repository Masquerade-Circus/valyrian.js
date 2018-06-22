import links from './links';
import {version} from '../../../package.json';

let Main = {
    title: 'Valyrian.js',
    version: version,
    view(content) {
        return v('html[lang=en]', [
            v('head', [
                v('title', Main.title),
                v('style', v.inline.uncss()),
                v(links),
                v('script', {src: '/index.min.js', async: true})
            ]),
            v('body', [
                content
                // v('script', v.inline.js())
            ])
        ]);
    }
};

export default Main;

// function view(content) {
//     return v('html[lang=en]', [
//         v('head', [
//             v('title', this.title),
//             v('style', v.inline.uncss()),
//             v(links),
//             v('script', {src: '/index.min.js', async: true})
//         ]),
//         v('body', [
//             content
//             // v('script', v.inline.js())
//         ])
//     ]);
// };

// export default v(view, {title: 'Valyrian.js'});


