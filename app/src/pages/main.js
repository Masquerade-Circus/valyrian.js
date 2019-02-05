import links from './links';
import { version } from '../../../package.json';

let Main = {
  title: 'Valyrian.js',
  version: version,
  view(content) {
    return v('html', { lang: 'en' }, [
      v('head', null, [
        v('title', null, Main.title),
        v('style', null, v.inline.uncss()),
        v(links)
        // v('script', {src: '/index.min.js', async: true})
      ]),
      v('body', null, [
        content,
        // v('script', v.inline.js())
        v('script', { src: '/index.min.js', async: true })
      ])
    ]);
  }
};

export default Main;

// function view(content) {
//     return v('html', {lang: 'en'}, [
//         v('head', null, [
//             v('title', null, this.title),
//             v('style', null, v.inline.uncss()),
//             v(links),
//             v('script', {src: '/index.min.js', async: true})
//         ]),
//         v('body', [
//             content
//             // v('script', v.inline.js())
//         ])
//     ]);
// };

// export default v(view, {title: 'Valyrian.js', version});
