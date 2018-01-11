let Main = {
    view() {
        return m('div', [
            Main.attributes.children,
            m('script', {src: 'lib.js'}),
            m('script', {src: 'index.js'})
        ]);
    }
};

module.exports = Main;
