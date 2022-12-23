import { VnodeWithDom, current, onUnmount, update, updateVnode, v } from "valyrian.js";

export function Signal(initialValue) {
  // Create a copy of the current context object
  const { vnode, oldVnode, component } = { ...current };

  // Check if the context object has a vnode property
  if (vnode) {
    // Is first call
    if (!vnode.components) {
      // Set the components property to an empty array
      vnode.components = [];
    }

    if (vnode.components.indexOf(component) === -1) {
      // Set the subscribers property to the subscribers property of the oldVnode object, or an empty array if that doesn't exist
      vnode.subscribers = oldVnode?.subscribers || [];
      // Set the initialChildren property of the vnode object to a copy of the children array of the vnode object
      vnode.initialChildren = [...vnode.children];

      // Set the calls property to -1
      vnode.signal_calls = -1;
      // Add the component to the components array
      vnode.components.push(component);

      if (!component.signals) {
        // Set the signals property of the component object to an empty array
        component.signals = [];
        // Add a function to the cleanup stack that removes the signals property from the component object
        onUnmount(() => Reflect.deleteProperty(component, "signals"));
      }
    }

    // Assign the signal variable to the signal stored at the index of the vnode object's calls property in the vnode's signals array
    let signal = component.signals[++vnode.signal_calls];

    // If a signal has already been assigned to the signal variable, return it
    if (signal) {
      return signal;
    }
  }

  // Declare a variable to store the current value of the Signal
  let value = initialValue;

  // Create an array to store functions that have subscribed to changes to the Signal's value
  const subscribers = [];

  // Define a function that allows other parts of the code to subscribe to changes to the Signal's value
  const subscribe = (callback) => {
    // Add the callback function to the subscribers array
    if (subscribers.indexOf(callback) === -1) {
      subscribers.push(callback);
    }
  };

  // Define a function that returns the current value of the Signal
  function get() {
    return value;
  }
  // Add value, toJSON, valueOf, and toString properties to the get function
  get.value = value;
  get.toJSON = get.valueOf = get;
  get.toString = () => `${value}`;

  // Define a function that allows the value of the Signal to be updated and notifies any subscribed functions of the change
  const set = (newValue) => {
    // Update the value of the Signal
    value = newValue;
    // Update the value property of the get function
    get.value = value;
    // Call each subscribed function with the new value of the Signal as an argument
    for (let i = 0, l = subscribers.length; i < l; i++) {
      subscribers[i](value);
    }

    // Check if the context object has a vnode property
    if (vnode) {
      // If it does, create a new vnode object based on the original vnode, its children, and its DOM and SVG properties
      let newVnode = v(vnode.tag, vnode.props, ...vnode.initialChildren) as VnodeWithDom;
      newVnode.dom = vnode.dom;
      newVnode.isSVG = vnode.isSVG;

      // Clear the subscribers array by setting the length property to 0
      vnode.subscribers.forEach(
        (subscribers) =>
          // Setting the length property to 0 is faster than clearing the array with a loop
          (subscribers.length = 0)
      );

      // Clear the subscribers array by setting it to an empty array
      vnode.subscribers = [];

      // Return the result of updating the original vnode with the new vnode
      return updateVnode(newVnode, vnode);
    }

    // If the context object doesn't have a vnode property, return the result of calling the update function
    return update();
  };

  // Assign the signal variable an array containing the get, set, and subscribe functions
  let signal = [get, set, subscribe];

  // If the context object has a vnode property, add the signal to the vnode's signals array
  // and add the subscribers array to the vnode's subscribers array
  if (vnode) {
    component.signals.push(signal);
    vnode.subscribers.push(subscribers);
  }

  // Return the signal
  return signal;
}
