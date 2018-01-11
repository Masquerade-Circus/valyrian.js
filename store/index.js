let Store = {
    hello: m.data('hello'),
    name: m.data('name'),
    count: m.data(2)
};

Store.message = m.data(() => Store.hello + ' ' + Store.name);

module.exports = Store;
