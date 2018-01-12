let Hello = {
    view() {
        return m('div', Store.message());
    }
};

module.exports = Hello;
