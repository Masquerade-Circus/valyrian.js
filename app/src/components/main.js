let Main = {
    title: '',
    version: '',
    css: '',
    js: '',
    view() {
        return [
            v('head', [
                v('title', Main.title),
                v('style', Main.css)
            ]),
            v('body', [
                Main.attributes.children,
                v('script', Main.js)
            ])
        ];
    }
};

export default Main;
