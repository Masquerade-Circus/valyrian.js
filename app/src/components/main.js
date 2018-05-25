let Main = {
    title: '',
    version: '',
    view() {
        return [
            v('head', [
                v('title', Main.title)
            ]),
            v('body', [
                Main.attributes.children,
                v('script', { src: 'valyrian.min.js' }),
                v('script', { src: 'index.min.js?v='+Main.version })
            ])
        ];
    }
};

export default Main;
