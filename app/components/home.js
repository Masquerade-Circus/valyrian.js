let Main = {
    view() {
        return v('div', [
            Main.attributes.children,
            // v('script', {src: 'lib.js'}),
            v('script', {src: 'index.js'})
        ]);
    }
};

module.exports = Main;
