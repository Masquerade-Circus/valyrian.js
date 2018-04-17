let Main = {
    view() {
        return [
            v('head'),
            v('body', [
                Main.attributes.children,
                v('script', { src: 'valyrian.min.js' }),
                v('script', { src: 'index.min.js' })
            ])
        ];
    }
};

export default Main;
