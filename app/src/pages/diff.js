let Diff = {
    s: 1,
    up: () => Diff.s += 1,
    down: () => Diff.s -= 1,
    view() {
        return v('div', [
            Diff.s > 0 ? v('h1', Diff.s) : v('small', ''),
            v('button', { onclick: Diff.up }, '+'),
            v('button', { onclick: Diff.down }, '-')
        ]);
    }
};

export default Diff;