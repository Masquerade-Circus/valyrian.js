let Hello = {
    view() {
        return m('div.hello', Store.message());
    }
};

module.exports = Hello;
