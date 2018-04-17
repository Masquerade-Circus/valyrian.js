let SFactory = function (v) {
    let s = {
        storeUpdateMethods: [],
        onStoreUpdate(onupdate) {
            if (typeof onupdate === 'function') {
                s.storeUpdateMethods.push(onupdate);
            }
        },
        update() {
            var l = s.storeUpdateMethods.length,
                i = 0;

            for (; i < l; i++) {
                s.storeUpdateMethods[i]();
            }
        },
        fps: 60,

        storeUpdated() {
            s.t = s.t || Date.now();
            if (Date.now() - s.t > 1000 / s.fps) {
                if (typeof requestAnimationFrame === 'function') {
                    requestAnimationFrame(s.update);
                } else {
                    setTimeout(s.update, 1);
                }
                s.t = Date.now();
            }
        },

        /**
         * Simple Getter Setter
         * Can call a given function when updated
         * @param Any
         * @param function (optional)
         * @return function
         */
        storeData(val, onchange) {
            let previousVal = undefined, newval = undefined, ret;
            /**
             * Returned function
             * If param is provided, sets the current value to this param,
             * call the function if any and return the final value.
             * You can process the value provided in the function by accessing it with this.val
             * If no param is provided, gets the current value
             * @param Any (optional)
             */
            ret = function (val) {
                if (val !== undefined) {
                    ret.value = val;
                }

                return ret.valueOf();
            };

            ret.toString = function () {
                return ret.valueOf().toString();
            };

            ret.valueOf = function () {
                if (typeof ret.value === 'function') {
                    newval = ret.value();
                }

                if (typeof ret.value !== 'function') {
                    newval = ret.value;
                }

                if (newval !== previousVal) {
                    if (typeof onchange === 'function') {
                        onchange.apply(ret, [previousVal, newval]);
                    }
                    s.storeUpdated();
                }

                previousVal = newval;

                return newval;
            };

            ret(val);

            return ret;
        }
    };
    return s;
};


export default SFactory;
