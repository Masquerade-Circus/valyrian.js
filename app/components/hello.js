let Hello = {
    view() {
        return v('div#mundo.hola', Store.message());
    }
};

module.exports = Hello;
