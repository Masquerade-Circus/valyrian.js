let Main = {
    title: '',
    version: '',
    css: '',
    script: '',
    view() {
        return [
            v('head', [
                v('title', Main.title),
                v('style', Main.css)
            ]),
            v('body', [
                Main.attributes.children,
                // v('script', { src: 'valyrian.min.js' }),
                v('script', { src: 'index.min.js?v='+Main.version })
                //v('script', Main.script)
            ])
        ];
    }
};

export default Main;
