const expect = require('expect');
let isArray = Array.isArray;

function flatten1(list) {
  return list.reduce(function (acc, val) {
    return acc.concat(val.constructor === Array ? flatten1(val) : val);
  }, []);
}

const flatten2 = (function () {
  'use strict';

  // concatMap :: (a -> [b]) -> [a] -> [b]
  function concatMap(f, xs) {
    return [].concat.apply([], xs.map(f));
  }

  // flatten :: Tree a -> [a]
  function flatten(t) {
    return (t instanceof Array ? concatMap(flatten, t) : t);
  }

  return flatten;
}());

function flatten3(a) {
  return a instanceof Array ? [].concat.apply([], a.map(flatten3)) : a;
}

function flatten3dot2(a) {
  return isArray(a) ? [].concat.apply([], a.map(flatten3dot2)) : a;
}

const flatten5 = (t) => {
  const go = x => isArray(x) ? x.flatMap(go) : x;
  return go(t);
};

function flatten6(list) {
  if (!isArray(list)) {
    return [list];
  }
  for (let i = 0; i < list.length; i++) {
    while (true) {
      if (isArray(list[i])) {
        list.splice(i, 1, ...list[i]);
      } else {
        break;
      }
    }
  }
  return list;
}

let tr = true;
function flatten6dot1(list) {
  if (!isArray(list)) {
    return [list];
  }
  for (let i = 0; i < list.length; i++) {
    while (tr) {
      if (isArray(list[i])) {
        list.splice(i, 1, ...list[i]);
      } else {
        break;
      }
    }
  }
  return list;
}

function flatten6dot2(list) {
  if (!isArray(list)) {
    return [list];
  }
  for (let i = 0; i < list.length; i++) {
    while (isArray(list[i])) {
      list.splice(i, 1, ...list[i]);
    }
  }
  return list;
}

const flatten7 = (t) => {
  if (!isArray(t)) {
    return [t];
  }
  let xs = t;
  while (xs.some(isArray)) {
    (
      xs = [].concat(...xs)
    );
  };
  return xs;
};

function flatten8(arr1) {
  return arr1.reduce((acc, val) => isArray(val) ? acc.concat(flatten8(val)) : acc.concat(val), []);
}

function flatten9(input) {
  if (!isArray(input)) {
    return [input];
  }
  const stack = [...input];
  const res = [];
  while (stack.length) {
    // elimina ultimo valor del stack
    const next = stack.pop();
    if (isArray(next)) {
      // agrega de nuevo los items al array, sin modificar la entrada original
      stack.push(...next);
    } else {
      res.push(next);
    }
  }
  //invierte para restaurar el orden de entrada
  return res.reverse();
}

function flatten9dot1(stack) {
  if (!isArray(stack)) {
    return [stack];
  }
  const res = [];
  while (stack.length) {
    // elimina ultimo valor del stack
    const next = stack.pop();
    if (isArray(next)) {
      stack.push(...next);
    } else {
      res.push(next);
    }
  }
  //invierte para restaurar el orden de entrada
  return res.reverse();
}

function flatten9dot2(stack) {
  if (!isArray(stack)) {
    return [stack];
  }
  const res = [];
  stack.reverse();
  while (stack.length) {
    // elimina ultimo valor del stack
    const next = stack.pop();
    if (isArray(next)) {
      next.reverse();
      stack.push(...next);
    } else {
      res.push(next);
    }
  }
  //invierte para restaurar el orden de entrada
  return res;
}

function flatten10(array) {
  if (!isArray(array)) {
    return [array];
  }
  let flattend = [];
  !(function flat(array) {
    array.forEach(function (el) {
      if (isArray(el)) {
        flat(el);
      } else {
        flattend.push(el);
      }
    });
  }(array));
  return flattend;
}

function flatten10dot1(array, flattend = []) {
  if (!isArray(array)) {
    return [array];
  }
  array.forEach(function (el) {
    if (isArray(el)) {
      flatten10dot1(el, flattend);
    } else {
      flattend.push(el);
    }
  });
  return flattend;
}

function flatten10dot2(array, flattend = []) {
  if (!isArray(array)) {
    return [array];
  }
  for (let i = 0, l = array.length; i < l; i++) {
    let el = array[i];
    if (isArray(el)) {
      flatten10dot2(el, flattend);
    } else {
      flattend.push(el);
    }
  }
  return flattend;
}

function flatten11(arr) {
  if (!isArray(arr)) {
    return [arr];
  }

  let array = [];
  for (let i = 0; i < arr.length; i++) {
    array = array.concat(flatten11(arr[i]));
  }
  return array;
}

function flatten12(arr) {
  if (!isArray(arr)) {
    return [arr];
  }
  let array = [];
  while (arr.length) {
    let value = arr.shift();
    if (isArray(value)) {
      // this line preserve the order
      arr = value.concat(arr);
    } else {
      array.push(value);
    }
  }
  return array;
}

function flatten13(array) {
  if (!isArray(array)) {
    return [array];
  }

  for (let i = 0; i < array.length; i++) {
    if (isArray(array[i])) {
      array.splice(i, 1, ...array[i]);
      i--;
      continue;
    }
  }

  return array;
}

function flatten14(array) {
  return isArray(array) ? array.flat(Infinity) : [array];
}

describe('Flatten an array', () => {
  let newList = () => [[1], 2, [[3, 4], 5], [[[]]], [[[6]]], 7, 8, []];
  let result = [1, 2, 3, 4, 5, 6, 7, 8];


  it('1', () => expect(flatten1(newList())).toEqual(result));
  it('2', () => expect(flatten2(newList())).toEqual(result));
  it('3', () => expect(flatten3(newList())).toEqual(result));
  it('4', () => expect(newList().flat(Infinity)).toEqual(result));
  it('5', () => expect(flatten5(newList())).toEqual(result));
  it('6', () => expect(flatten6(newList())).toEqual(result));
  it('7', () => expect(flatten7(newList())).toEqual(result));
  it('8', () => expect(flatten8(newList())).toEqual(result));
  it('9', () => expect(flatten9(newList())).toEqual(result));
  it('10', () => expect(flatten10(newList())).toEqual(result));
  it('11', () => expect(flatten11(newList())).toEqual(result));
  it('12', () => expect(flatten12(newList())).toEqual(result));
  it('10.1', () => expect(flatten10dot1(newList())).toEqual(result));
  it('10.2', () => expect(flatten10dot2(newList())).toEqual(result));
  it('9.1', () => expect(flatten9dot1(newList())).toEqual(result));
  it('9.2', () => expect(flatten9dot2(newList())).toEqual(result));
  it('6.1', () => expect(flatten6dot1(newList())).toEqual(result));
  it('6.2', () => expect(flatten6dot2(newList())).toEqual(result));
  it('13', () => expect(flatten13(newList())).toEqual(result));
  it('3.2', () => expect(flatten3dot2(newList())).toEqual(result));
  it('14', () => expect(flatten14(newList())).toEqual(result));

});

bench('Flatten an array', () => {
  let newList = () => [[1], 2, [[3, 4], 5], [[[]]], [[[6]]], 7, 8, []];

  it('9', () => flatten9(newList()));
  it('9.1', () => flatten9dot1(newList()));
  it('9.2', () => flatten9dot2(newList()));
  it('10', () => flatten10(newList()));
  it('10.1', () => flatten10dot1(newList()));
  it('10.2', () => flatten10dot2(newList()));
  it('1', () => flatten1(newList()));
  it('2', () => flatten2(newList()));
  it('3', () => flatten3(newList()));
  it('4', () => newList().flat(Infinity));
  it('5', () => flatten5(newList()));
  it('6', () => flatten6(newList()));
  it('7', () => flatten7(newList()));
  it('8', () => flatten8(newList()));
  it('11', () => flatten11(newList()));
  it('12', () => flatten12(newList()));
  it('6.1', () => flatten6dot1(newList()));
  it('6.2', () => flatten6dot2(newList()));
  it('13', () => flatten13(newList()));
  it('3.2', () => flatten3dot2(newList()));
  it('14', () => flatten14(newList()));

});
