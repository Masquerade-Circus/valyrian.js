let Main = {
    view() {
        return v('html', [
            v('head'),
            v('body', [
                Main.attributes.children,
                // v('script', {src: 'lib.js'}),
                v('script', {src: 'index.js'})
            ])
        ])
    }
};

module.exports = Main;
