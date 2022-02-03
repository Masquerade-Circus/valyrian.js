/* eslint-disable eqeqeq */
let { compare, benchmark, before } = require("buffalo-test");
let expect = require("expect");

type Set = number[];

type Movement = {
  key: number,
  currentIndex: number,
  indexInNewKeyedListArray: number,
  indexInOldKeyedListArray: number,
  oldKeyedListBeforeMovement: Set,
  oldKeyedListAfterMovement: Set,
  newKeyedList: Set
};

let getCurrentLineInCode = () => {
  let error = new Error();
  let stack = error.stack.split("\n");
  return stack[2];
};

// Para igualar las listas de elementos,
// 1. Se deben mover los elementos de la lista anterior para igualarla a la lista nueva
// 2. Se debe obtener el máximo de longitud de las listas
// 3. Ciclar sobre toda la lista de elementos hasta el máximo de longitud
// 3.1. Si el indice actual es mayor a la longitud de la lista nueva todos los elementos restantes de la lista anterior se deben eliminar
// 3.1.1 Eliminar todos los elementos restantes de la lista anterior
// 3.1.2. Como ya eliminamos todos los elementos restantes entonces ya no necesitamos proseguir más y terminamos el ciclo
// 3.2. Si el indice actual es mayor a la longitud de la lista anterior el nuevo elemento se tiene que agregar
// 3.3. Si el nuevo elemento es diferente al elemento de la lista anterior entonces tenemos una operación de movimiento
// 3.3.1. Debemos tomar el nuevo elemento de la lista nueva en la posición del indice actual
// 3.3.2. Buscar el nuevo elemento en la lista anterior
// 3.3.3. Se debe mover el nuevo elemento a la posición del indice actual
// 3.3.4. Si el nuevo elemento está en la lista nueva, tomarlo (quitarlo) de su posición actual en la lista anterior
// 3.3.5. Buscar el antiguo elemento en la lista nueva para decidir si podemos reemplazarlo o insertar el nuevo elemento antes del antiguo elemento
// 3.3.6. Si el antiguo elemento no está en la lista nueva, eliminarlo de la lista anterior reemplazandolo con el nuevo elemento
// 3.3.7. Si el antiguo elemento está en la lista nueva, se debe mover el nuevo elemento antes del antiguo elemento
// 3.4. Si los elementos son iguales no necesitamos hacer nada

function matchKeyedList(oldKeyedList: Set, newKeyedList: Set): Movement[] {
  // 1. Se deben mover los elementos de la lista anterior para igualarla a la lista nueva
  let movements: Movement[] = [];

  // 2. Se debe obtener el máximo de longitud de las listas
  const oldListLength = oldKeyedList.length;
  const newListLength = newKeyedList.length;
  const maxListLength = Math.max(oldListLength, newListLength);

  // 3. Ciclar sobre toda la lista de elementos hasta el máximo de longitud
  for (let i = 0; i < maxListLength; i++) {
    // 3.1. Si el indice actual es mayor a la longitud de la lista nueva todos los elementos restantes de la lista anterior se deben eliminar
    if (i >= newListLength) {
      // 3.1.1 Eliminar todos los elementos restantes de la lista anterior
      for (let k = oldKeyedList.length - 1; k > newListLength - 1; k--) {
        let movement = {
          key: k,
          currentIndex: k,
          indexInNewKeyedListArray: -1,
          indexInOldKeyedListArray: k,
          oldKeyedListBeforeMovement: [...oldKeyedList],
          newKeyedList: newKeyedList,
          line: getCurrentLineInCode(),
          operation: "remove"
        };

        oldKeyedList.pop();
        movement.oldKeyedListAfterMovement = [...oldKeyedList];
        movements.push(movement);
      }

      // 3.1.2. Como ya eliminamos todos los elementos restantes entonces ya no necesitamos proseguir más y terminamos el ciclo
      break;
    }

    // 3.2. Si el indice actual es mayor a la longitud de la lista anterior el nuevo elemento se tiene que agregar
    if (i >= oldKeyedList.length) {
      let movement = {
        key: newKeyedList[i],
        currentIndex: i,
        indexInNewKeyedListArray: i,
        indexInOldKeyedListArray: -1,
        oldKeyedListBeforeMovement: [...oldKeyedList],
        newKeyedList: newKeyedList,
        operation: "add",
        line: getCurrentLineInCode()
      };

      oldKeyedList.push(newKeyedList[i]);
      movement.oldKeyedListAfterMovement = [...oldKeyedList];
      movements.push(movement);

      continue;
    }

    let newKey = newKeyedList[i];
    let oldKey = oldKeyedList[i];

    // 3.3. Si el nuevo elemento es diferente al elemento de la lista anterior entonces tenemos una operación de movimiento
    if (newKey !== oldKey) {
      // 3.3.1. Debemos tomar el nuevo elemento de la lista nueva en la posición del indice actual
      // 3.3.2. Buscar el nuevo elemento en la lista anterior
      const oldIndex = oldKeyedList.indexOf(newKey);

      let movement = {
        key: newKey,
        currentIndex: i,
        indexInNewKeyedListArray: i,
        indexInOldKeyedListArray: oldIndex,
        oldKeyedListBeforeMovement: [...oldKeyedList],
        newKeyedList: newKeyedList
      };

      // 3.3.3. Si el nuevo elemento está en la lista nueva, tomarlo (quitarlo) de su posición actual en la lista anterior
      oldIndex !== -1 && oldKeyedList.splice(oldIndex, 1);

      // 3.3.4. Buscar el antiguo elemento en la lista nueva para decidir si podemos reemplazarlo o insertar el nuevo elemento antes del antiguo elemento
      const oldKeyIndexInNewKeyedList = newKeyedList.indexOf(oldKeyedList[i]);

      // 3.3.5. Si el antiguo elemento no está en la lista nueva, eliminarlo de la lista anterior reemplazandolo con el nuevo elemento
      if (oldKeyIndexInNewKeyedList === -1) {
        movement.line = getCurrentLineInCode();
        movement.operation = "replace";
        oldKeyedList.splice(i, 1, newKey);
        movement.oldKeyedListAfterMovement = [...oldKeyedList];
        movements.push(movement);
        continue;
      }

      // 3.3.6. Si el antiguo elemento está en la lista nueva, se debe mover el nuevo elemento antes del antiguo elemento
      movement.line = getCurrentLineInCode();
      movement.operation = "move";
      oldKeyedList.splice(i, oldKeyIndexInNewKeyedList !== i + 1 ? 1 : 0, newKey);
      movement.oldKeyedListAfterMovement = [...oldKeyedList];
      movements.push(movement);

      // 3.3.7. if the old element is in the new list then move the old element to the new position
      if (oldKeyIndexInNewKeyedList !== i + 1) {
        movement = {
          key: oldKey,
          currentIndex: i,
          indexInNewKeyedListArray: oldKeyIndexInNewKeyedList,
          indexInOldKeyedListArray: i,
          oldKeyedListBeforeMovement: [...oldKeyedList],
          newKeyedList: newKeyedList,
          line: getCurrentLineInCode(),
          operation: "move"
        };
        oldKeyedList.splice(oldKeyIndexInNewKeyedList, 0, oldKey);
        movement.oldKeyedListAfterMovement = [...oldKeyedList];
        movements.push(movement);
      }
    }

    // 3.4. Si los elementos son iguales no necesitamos hacer nada
  }
  return movements;
}

compare.skip("Matching keyed list", () => {
  let set = [1, 2, 3, 4, 5];
  let tests = [
    { name: "Removed at the end", set: [1, 2, 3, 4], movements: 1 }, // Removed at the end
    { name: "Removed at the start", set: [2, 3, 4, 5], movements: 1 }, // Remmoved at the start
    { name: "Removed at the center", set: [1, 3, 5], movements: 2 }, // Removed at the center
    { name: "Added at the end", set: [1, 2, 3, 4, 5, 6], movements: 1 }, // Added at the end
    { name: "Added at the start", set: [6, 1, 2, 3, 4, 5], movements: 1 }, // Added at the start
    { name: "Added at the center", set: [1, 2, 6, 3, 4, 5], movements: 1 }, // Added at the center
    { name: "Reversed", set: [5, 4, 3, 2, 1], movements: 4 }, // Reversed
    { name: "Switch positions", set: [5, 2, 3, 4, 1], movements: 2 }, // Switch positions,
    { name: "Mixed positions", set: [1, 3, 2, 6, 5, 4], movements: 3 },
    { name: "Replaced with undefined", set: [1, 3, 2, 5, 4], movements: 2 },
    {
      name: "Added, remove and replaced with undefined",
      set: [6, 7, 8, 9, 10],
      movements: 5
    },
    { name: "Removed all at the end", set: [1], movements: 4 } // Removed at the end
  ];

  before(() => {
    for (let test of tests) {
      test.oldSet = [...set];
    }

    // let oldKeyedList = [3, 6, 4, 8];
    // let newKeyedList = [4, 6, 8, 3];
    // console.log(oldKeyedList);
    // console.log(newKeyedList);
    // console.log(equalizeArrays([...oldKeyedList], newKeyedList));
    // console.log(calculateMovements([...oldKeyedList], newKeyedList));
    // console.log("-------------------");

    function logMatchFromTest(test) {
      let movements = matchKeyedList([...set], test.set);
      console.log(test.name, movements, test.set);
      expect(movements[movements.length - 1].oldKeyedListAfterMovement).toEqual(test.set);
      expect(movements.length).toEqual(test.movements);
    }

    // logMatchFromTest(tests[0]);
    for (let test of tests) {
      logMatchFromTest(test);
    }
  });

  benchmark(tests[0].name, () => {
    tests[0].oldSet = set;
  });
});

compare.skip("Matching keyed list -> stress", () => {
  let set = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  let tests = [
    { name: "Removed at the end", set: [1, 2, 3, 4, 5, 6, 7, 8, 9], movements: 1 }, // Removed at the end
    { name: "Removed at the start", set: [2, 3, 4, 5, 6, 7, 8, 9, 10], movements: 1 }, // Remmoved at the start
    { name: "Removed at the center", set: [1, 2, 3, 5, 6, 8, 9, 10], movements: 2 }, // Removed at the center
    { name: "Added at the end", set: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11], movements: 1 }, // Added at the end
    { name: "Added at the start", set: [11, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10], movements: 1 }, // Added at the start
    { name: "Added at the center", set: [1, 2, 3, 4, 5, 11, 6, 7, 8, 9, 10], movements: 1 }, // Added at the center
    { name: "Reversed", set: [10, 9, 8, 7, 6, 5, 4, 3, 2, 1], movements: 9 }, // Reversed
    { name: "Switch positions", set: [10, 2, 3, 4, 5, 6, 7, 8, 9, 1], movements: 2 }, // Switch positions,
    { name: "Switch different positions", set: [10, 6, 3, 4, 2, 5, 7, 8, 9, 1], movements: 4 }, // Switch positions,
    { name: "Mixed positions", set: [1, 3, 2, 6, 5, 4, 7, 8, 9, 10], movements: 3 },
    { name: "Replaced with undefined", set: [1, 3, 2, 5, 4, 6, 7, 8, 9, 10], movements: 2 },
    {
      name: "Added, remove and replaced with undefined",
      set: [11, 12, 13, 14, 15, 16, 17, 18, 19, 20],
      movements: 10
    },
    { name: "Removed all at the end", set: [1], movements: 9 } // Removed at the end
  ];

  before(() => {
    for (let test of tests) {
      test.oldSet = [...set];
    }

    // let oldKeyedList = [3, 6, 4, 8];
    // let newKeyedList = [4, 6, 8, 3];
    // console.log(oldKeyedList);
    // console.log(newKeyedList);
    // console.log(equalizeArrays([...oldKeyedList], newKeyedList));
    // console.log(calculateMovements([...oldKeyedList], newKeyedList));
    // console.log("-------------------");

    function logMatchFromTest(test) {
      let movements = matchKeyedList([...set], test.set);
      console.log(test.name, movements, test.set);
      expect(movements[movements.length - 1].oldKeyedListAfterMovement).toEqual(test.set);
      expect(movements.length).toEqual(test.movements);
    }

    // logMatchFromTest(tests[0]);
    for (let test of tests) {
      logMatchFromTest(test);
    }
  });

  benchmark(tests[0].name, () => {
    tests[0].oldSet = set;
  });
});
