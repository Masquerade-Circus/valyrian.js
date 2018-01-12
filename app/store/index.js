let Store = {
    hello: v.data('hello'),
    name: v.data('name'),
    count: v.data(2)
};

Store.message = v.data(() => Store.hello + ' ' + Store.name);

module.exports = Store;
