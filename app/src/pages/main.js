import links from './links';
import {version} from '../../../package.json';

let Main = {
    title: 'Valyrian.js',
    version: version,
    view() {
        return v('html[lang=en]', [
            v('head', [
                v('title', Main.title),
                v('style', v.inline.uncss()),
                v(links),
                v('script', {src: 'http://localhost:3001/index.min.js'})
            ]),
            v('body', [
                Main.attributes.children
                // v('script', v.inline.js())
            ])
        ]);
    }
};

export default Main;
