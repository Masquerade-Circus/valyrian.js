import links from './links';

let Main = {
    title: '',
    version: '',
    css: '',
    js: '',
    view() {
        return [
            v('head', [
                v('title', Main.title),
                v('style', Main.css),
                v(links)
            ]),
            v('body', [
                Main.attributes.children,
                v('script', Main.js)
            ])
        ];
    }
};

export default Main;
