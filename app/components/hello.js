let Hello = {
    view() {
        return m('div#mundo.hola', Store.message());
    }
};

module.exports = Hello;
