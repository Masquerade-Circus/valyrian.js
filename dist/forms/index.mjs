// lib/forms/index.ts
import { directive } from "valyrian.js";
import { createPulseStore } from "valyrian.js/pulses";
import { deepCloneUnfreeze, isFunction, isString } from "valyrian.js/utils";

// node_modules/schema-shield/dist/index.mjs
var ValidationError = class extends Error {
  message;
  item;
  keyword;
  cause;
  schemaPath = "";
  instancePath = "";
  data;
  schema;
  _getCause(pointer = "#", instancePointer = "#") {
    let schemaPath = `${pointer}/${this.keyword}`;
    let instancePath = `${instancePointer}`;
    if (typeof this.item !== "undefined") {
      if (typeof this.item === "string" && this.item in this.schema) {
        schemaPath += `/${this.item}`;
      }
      instancePath += `/${this.item}`;
    }
    this.instancePath = instancePath;
    this.schemaPath = schemaPath;
    if (!this.cause || !(this.cause instanceof ValidationError)) {
      return this;
    }
    return this.cause._getCause(schemaPath, instancePath);
  }
  getCause() {
    return this._getCause();
  }
  _getTree() {
    const tree = {
      message: this.message,
      keyword: this.keyword,
      item: this.item,
      schemaPath: this.schemaPath,
      instancePath: this.instancePath,
      data: this.data
    };
    if (this.cause) {
      tree.cause = this.cause._getTree();
    }
    return tree;
  }
  getTree() {
    this.getCause();
    return this._getTree();
  }
  getPath() {
    const cause = this.getCause();
    return {
      schemaPath: cause.schemaPath,
      instancePath: cause.instancePath
    };
  }
};
var FAIL_FAST_DEFINE_ERROR = () => true;
function getDefinedErrorFunctionForKey(key, schema, failFast) {
  if (failFast) {
    return FAIL_FAST_DEFINE_ERROR;
  }
  const KeywordError = new ValidationError(`Invalid ${key}`);
  KeywordError.keyword = key;
  KeywordError.schema = schema;
  const defineError = (message, options = {}) => {
    KeywordError.message = message;
    KeywordError.item = options.item;
    KeywordError.cause = options.cause && options.cause !== true ? options.cause : void 0;
    KeywordError.data = options.data;
    return KeywordError;
  };
  return getNamedFunction(
    `defineError_${key}`,
    defineError
  );
}
function hasChanged(prev, current) {
  if (Array.isArray(prev)) {
    if (Array.isArray(current) === false) {
      return true;
    }
    if (prev.length !== current.length) {
      return true;
    }
    for (let i = 0; i < current.length; i++) {
      if (hasChanged(prev[i], current[i])) {
        return true;
      }
    }
    return false;
  }
  if (typeof prev === "object" && prev !== null) {
    if (typeof current !== "object" || current === null) {
      return true;
    }
    for (const key in current) {
      if (hasChanged(prev[key], current[key])) {
        return true;
      }
    }
    for (const key in prev) {
      if (hasChanged(prev[key], current[key])) {
        return true;
      }
    }
    return false;
  }
  return Object.is(prev, current) === false;
}
function isObject(data) {
  return typeof data === "object" && data !== null && !Array.isArray(data);
}
function areCloseEnough(a, b, epsilon = 1e-15) {
  return Math.abs(a - b) <= epsilon * Math.max(Math.abs(a), Math.abs(b));
}
function deepClone(obj, cloneClassInstances = false, seen = /* @__PURE__ */ new WeakMap()) {
  if (typeof obj === "undefined" || obj === null || typeof obj !== "object") {
    return obj;
  }
  if (seen.has(obj)) {
    return seen.get(obj);
  }
  let clone;
  if (typeof structuredClone === "function") {
    clone = structuredClone(obj);
    seen.set(obj, clone);
    return clone;
  }
  switch (true) {
    case Array.isArray(obj): {
      clone = [];
      seen.set(obj, clone);
      for (let i = 0, l = obj.length; i < l; i++) {
        clone[i] = deepClone(obj[i], cloneClassInstances, seen);
      }
      return clone;
    }
    case obj instanceof Date: {
      clone = new Date(obj.getTime());
      seen.set(obj, clone);
      return clone;
    }
    case obj instanceof RegExp: {
      clone = new RegExp(obj.source, obj.flags);
      seen.set(obj, clone);
      return clone;
    }
    case obj instanceof Map: {
      clone = /* @__PURE__ */ new Map();
      seen.set(obj, clone);
      for (const [key, value] of obj.entries()) {
        clone.set(
          deepClone(key, cloneClassInstances, seen),
          deepClone(value, cloneClassInstances, seen)
        );
      }
      return clone;
    }
    case obj instanceof Set: {
      clone = /* @__PURE__ */ new Set();
      seen.set(obj, clone);
      for (const value of obj.values()) {
        clone.add(deepClone(value, cloneClassInstances, seen));
      }
      return clone;
    }
    case obj instanceof ArrayBuffer: {
      clone = obj.slice(0);
      seen.set(obj, clone);
      return clone;
    }
    case ArrayBuffer.isView(obj): {
      clone = new obj.constructor(obj.buffer.slice(0));
      seen.set(obj, clone);
      return clone;
    }
    case (typeof Buffer !== "undefined" && obj instanceof Buffer): {
      clone = Buffer.from(obj);
      seen.set(obj, clone);
      return clone;
    }
    case obj instanceof Error: {
      clone = new obj.constructor(obj.message);
      seen.set(obj, clone);
      break;
    }
    case (obj instanceof Promise || obj instanceof WeakMap || obj instanceof WeakSet): {
      clone = obj;
      seen.set(obj, clone);
      return clone;
    }
    case (obj.constructor && obj.constructor !== Object): {
      if (!cloneClassInstances) {
        clone = obj;
        seen.set(obj, clone);
        return clone;
      }
      clone = Object.create(Object.getPrototypeOf(obj));
      seen.set(obj, clone);
      break;
    }
    default: {
      clone = {};
      seen.set(obj, clone);
      const keys = Reflect.ownKeys(obj);
      for (let i = 0, l = keys.length; i < l; i++) {
        const key = keys[i];
        clone[key] = deepClone(
          obj[key],
          cloneClassInstances,
          seen
        );
      }
      return clone;
    }
  }
  const descriptors = Object.getOwnPropertyDescriptors(obj);
  for (const key of Reflect.ownKeys(descriptors)) {
    const descriptor = descriptors[key];
    if ("value" in descriptor) {
      descriptor.value = deepClone(descriptor.value, cloneClassInstances, seen);
    }
    Object.defineProperty(clone, key, descriptor);
  }
  return clone;
}
function isCompiledSchema(subSchema) {
  return isObject(subSchema) && "$validate" in subSchema;
}
function getNamedFunction(name, fn) {
  return Object.defineProperty(fn, "name", { value: name });
}
function resolvePath(root, path) {
  if (!path || path === "#") {
    return root;
  }
  if (path.startsWith("#/")) {
    const parts = path.split("/").slice(1);
    let current = root;
    for (const part of parts) {
      const decodedUriPart = decodeURIComponent(part);
      const key = decodedUriPart.replace(/~1/g, "/").replace(/~0/g, "~");
      if (current && typeof current === "object" && key in current) {
        current = current[key];
      } else {
        return;
      }
    }
    return current;
  }
  if (!path.includes("#")) {
    if (root.definitions && root.definitions[path]) {
      return root.definitions[path];
    }
    if (root.defs && root.defs[path]) {
      return root.defs[path];
    }
    if (root.$id && typeof root.$id === "string") {
      if (root.$id === path || root.$id.endsWith("/" + path)) {
        return root;
      }
    }
  }
  return;
}
var UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
var DURATION_REGEX = /^P(?!$)((\d+Y)?(\d+M)?(\d+W)?(\d+D)?)(T(?=\d)(\d+H)?(\d+M)?(\d+S)?)?$/;
var DATE_TIME_REGEX = /^(\d{4})-(0[0-9]|1[0-2])-(\d{2})T(0[0-9]|1\d|2[0-3]):([0-5]\d):((?:[0-5]\d|60))(?:.\d+)?(?:([+-])(0[0-9]|1\d|2[0-3]):([0-5]\d)|Z)?$/i;
var URI_REGEX = /^[a-zA-Z][a-zA-Z0-9+\-.]*:[^\s]*$/;
var EMAIL_REGEX = /^(?!\.)(?!.*\.$)[a-z0-9!#$%&'*+/=?^_`{|}~-]{1,20}(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]{1,21}){0,2}@[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,60}[a-z0-9])?){0,3}$/i;
var IPV4_REGEX = /^(?:(?:25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9][0-9]|[0-9])\.){3}(?:25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9][0-9]|[0-9])$/;
var IPV6_REGEX = /(?:\s+|:::+|^\w{5,}|\w{5}$|^:{1}\w|\w:{1}$)/;
var IPV6_SHORT_REGEX = /^[0-9a-fA-F:.]*$/;
var IPV6_FULL_REGEX = /^(?:(?:[0-9a-fA-F]{1,4}:){7}(?:[0-9a-fA-F]{1,4}|:))$/;
var IPV6_INVALID_CHAR_REGEX = /(?:[0-9a-fA-F]{5,}|\D[0-9a-fA-F]{3}:)/;
var IPV6_FAST_FAIL_REGEX = /^(?:(?:(?:[0-9a-fA-F]{1,4}(?::|$)){1,6}))|(?:::(?:[0-9a-fA-F]{1,4})){0,5}$/;
var HOSTNAME_REGEX = /^[a-z0-9][a-z0-9-]{0,62}(?:\.[a-z0-9][a-z0-9-]{0,62})*[a-z0-9]$/i;
var DATE_REGEX = /^(\d{4})-(\d{2})-(\d{2})$/;
var JSON_POINTER_REGEX = /^\/(?:[^~]|~0|~1)*$/;
var RELATIVE_JSON_POINTER_REGEX = /^([0-9]+)(#|\/(?:[^~]|~0|~1)*)?$/;
var TIME_REGEX = /^([01]\d|2[0-3]):([0-5]\d):([0-5]\d)(\.\d+)?(Z|([+-])([01]\d|2[0-3]):([0-5]\d))$/;
var URI_REFERENCE_REGEX = /^(([^:/?#]+):)?(\/\/([^/?#]*))?([^?#]*)(\?([^#]*))?(#((?![^#]*\\)[^#]*))?/i;
var URI_TEMPLATE_REGEX = /^(?:[^{}]|\{[^}]+\})*$/;
var IRI_REGEX = /^[a-zA-Z][a-zA-Z0-9+\-.]*:[^\s]*$/;
var IRI_REFERENCE_REGEX = /^(([^:/?#]+):)?(\/\/([^/?#]*))?([^?#]*)(\?([^#]*))?(#((?![^#]*\\)[^#]*))?/i;
var IDN_EMAIL_REGEX = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
var IDN_HOSTNAME_REGEX = /^[^\s!@#$%^&*()_+\=\[\]{};':"\\|,<>\/?]+$/;
var BACK_SLASH_REGEX = /\\/;
var DAYS_IN_MONTH = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
var Formats = {
  ["date-time"](data) {
    const match = data.match(DATE_TIME_REGEX);
    if (!match) {
      return false;
    }
    const [, yearStr, monthStr, dayStr, hourStr, minuteStr, secondStr] = match;
    const year = Number(yearStr);
    const month = Number(monthStr);
    const day = Number(dayStr);
    const hour = Number(hourStr);
    const minute = Number(minuteStr);
    const second = Number(secondStr);
    if (month < 1 || month > 12) {
      return false;
    }
    if (day < 1) {
      return false;
    }
    const maxDays = month === 2 ? year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0) ? 29 : 28 : DAYS_IN_MONTH[month - 1];
    if (!maxDays || day > maxDays) {
      return false;
    }
    if (second === 60 && (minute !== 59 || hour !== 23)) {
      return false;
    }
    return true;
  },
  uri(data) {
    return URI_REGEX.test(data);
  },
  email(data) {
    return EMAIL_REGEX.test(data);
  },
  ipv4(data) {
    return IPV4_REGEX.test(data);
  },
  // ipv6: isMyIpValid({ version: 6 }),
  ipv6(data) {
    if (data === "::") {
      return true;
    }
    if (data.indexOf(":") === -1 || IPV6_REGEX.test(data)) {
      return false;
    }
    const hasIpv4 = data.indexOf(".") !== -1;
    let addressParts = data;
    if (hasIpv4) {
      addressParts = data.split(":");
      const ipv4Part = addressParts.pop();
      if (!IPV4_REGEX.test(ipv4Part)) {
        return false;
      }
    }
    const isShortened = data.indexOf("::") !== -1;
    const ipv6Part = hasIpv4 ? addressParts.join(":") : data;
    if (isShortened) {
      if (ipv6Part.split("::").length - 1 > 1) {
        return false;
      }
      if (!IPV6_SHORT_REGEX.test(ipv6Part)) {
        return false;
      }
      return IPV6_FAST_FAIL_REGEX.test(ipv6Part);
    }
    const isIpv6Valid = IPV6_FULL_REGEX.test(ipv6Part);
    const hasInvalidChar = IPV6_INVALID_CHAR_REGEX.test(ipv6Part);
    if (hasIpv4) {
      return isIpv6Valid || !hasInvalidChar;
    }
    return isIpv6Valid && !hasInvalidChar;
  },
  hostname(data) {
    return HOSTNAME_REGEX.test(data);
  },
  date(data) {
    const match = DATE_REGEX.exec(data);
    if (!match) {
      return false;
    }
    const [, yearStr, monthStr, dayStr] = match;
    const year = Number(yearStr);
    const month = Number(monthStr);
    const day = Number(dayStr);
    if (month < 1 || month > 12) {
      return false;
    }
    if (day < 1) {
      return false;
    }
    const maxDays = month === 2 ? year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0) ? 29 : 28 : DAYS_IN_MONTH[month - 1];
    return !!maxDays && day <= maxDays;
  },
  regex(data) {
    try {
      new RegExp(data);
      return true;
    } catch (e) {
      return false;
    }
  },
  "json-pointer"(data) {
    if (data === "") {
      return true;
    }
    return JSON_POINTER_REGEX.test(data);
  },
  "relative-json-pointer"(data) {
    if (data === "") {
      return true;
    }
    return RELATIVE_JSON_POINTER_REGEX.test(data);
  },
  time(data) {
    return TIME_REGEX.test(data);
  },
  "uri-reference"(data) {
    if (BACK_SLASH_REGEX.test(data)) {
      return false;
    }
    return URI_REFERENCE_REGEX.test(data);
  },
  "uri-template"(data) {
    return URI_TEMPLATE_REGEX.test(data);
  },
  duration(data) {
    return DURATION_REGEX.test(data);
  },
  uuid(data) {
    return UUID_REGEX.test(data);
  },
  // IRI is like URI but allows Unicode. We reuse a permissive logic.
  iri(data) {
    return IRI_REGEX.test(data);
  },
  "iri-reference"(data) {
    if (BACK_SLASH_REGEX.test(data)) {
      return false;
    }
    return IRI_REFERENCE_REGEX.test(data);
  },
  // Best-effort structural validation for IDN (no punycode/tables)
  "idn-email"(data) {
    return IDN_EMAIL_REGEX.test(data);
  },
  "idn-hostname"(data) {
    return IDN_HOSTNAME_REGEX.test(data);
  }
};
var Types = {
  object(data) {
    return isObject(data);
  },
  array(data) {
    return Array.isArray(data);
  },
  string(data) {
    return typeof data === "string";
  },
  number(data) {
    return typeof data === "number";
  },
  integer(data) {
    return typeof data === "number" && data % 1 === 0;
  },
  boolean(data) {
    return typeof data === "boolean";
  },
  null(data) {
    return data === null;
  },
  // Not implemented yet
  timestamp: false,
  int8: false,
  unit8: false,
  int16: false,
  unit16: false,
  int32: false,
  unit32: false,
  float32: false,
  float64: false
};
var ArrayKeywords = {
  // lib/keywords/array-keywords.ts
  items(schema, data, defineError) {
    if (!Array.isArray(data)) {
      return;
    }
    const schemaItems = schema.items;
    const dataLength = data.length;
    if (typeof schemaItems === "boolean") {
      if (schemaItems === false && dataLength > 0) {
        return defineError("Array items are not allowed", { data });
      }
      return;
    }
    if (Array.isArray(schemaItems)) {
      const schemaItemsLength = schemaItems.length;
      const itemsLength = schemaItemsLength < dataLength ? schemaItemsLength : dataLength;
      for (let i = 0; i < itemsLength; i++) {
        const schemaItem = schemaItems[i];
        if (typeof schemaItem === "boolean") {
          if (schemaItem === false && data[i] !== void 0) {
            return defineError("Array item is not allowed", {
              item: i,
              data: data[i]
            });
          }
          continue;
        }
        const validate2 = schemaItem && schemaItem.$validate;
        if (typeof validate2 === "function") {
          const error = validate2(data[i]);
          if (error) {
            return defineError("Array item is invalid", {
              item: i,
              cause: error,
              data: data[i]
            });
          }
        }
      }
      return;
    }
    const validate = schemaItems && schemaItems.$validate;
    if (typeof validate !== "function") {
      return;
    }
    for (let i = 0; i < dataLength; i++) {
      const error = validate(data[i]);
      if (error) {
        return defineError("Array item is invalid", {
          item: i,
          cause: error,
          data: data[i]
        });
      }
    }
  },
  elements(schema, data, defineError) {
    if (!Array.isArray(data)) {
      return;
    }
    const elementsSchema = schema.elements;
    const validate = elementsSchema && elementsSchema.$validate;
    if (typeof validate !== "function") {
      return;
    }
    for (let i = 0; i < data.length; i++) {
      const error = validate(data[i]);
      if (error) {
        return defineError("Array item is invalid", {
          item: i,
          cause: error,
          data: data[i]
        });
      }
    }
  },
  minItems(schema, data, defineError) {
    if (!Array.isArray(data) || data.length >= schema.minItems) {
      return;
    }
    return defineError("Array is too short", { data });
  },
  maxItems(schema, data, defineError) {
    if (!Array.isArray(data) || data.length <= schema.maxItems) {
      return;
    }
    return defineError("Array is too long", { data });
  },
  additionalItems(schema, data, defineError) {
    if (!schema.items || isObject(schema.items)) {
      return;
    }
    if (schema.additionalItems === false) {
      if (data.length > schema.items.length) {
        return defineError("Array is too long", { data });
      }
      return;
    }
    if (isObject(schema.additionalItems)) {
      if (isCompiledSchema(schema.additionalItems)) {
        for (let i = schema.items.length; i < data.length; i++) {
          const error = schema.additionalItems.$validate(data[i]);
          if (error) {
            return defineError("Array item is invalid", {
              item: i,
              cause: error,
              data: data[i]
            });
          }
        }
        return;
      }
      return;
    }
    return;
  },
  uniqueItems(schema, data, defineError) {
    if (!Array.isArray(data) || !schema.uniqueItems) {
      return;
    }
    const len = data.length;
    if (len <= 1) {
      return;
    }
    const primitiveSeen = /* @__PURE__ */ new Set();
    for (let i = 0; i < len; i++) {
      const item = data[i];
      const type = typeof item;
      if (item === null || type === "string" || type === "number" || type === "boolean") {
        if (primitiveSeen.has(item)) {
          return defineError("Array items are not unique", { data: item });
        }
        primitiveSeen.add(item);
        continue;
      }
      if (item && typeof item === "object") {
        for (let j = 0; j < i; j++) {
          const prev = data[j];
          if (prev && typeof prev === "object" && !hasChanged(prev, item)) {
            return defineError("Array items are not unique", { data: item });
          }
        }
      }
    }
  },
  contains(schema, data, defineError) {
    if (!Array.isArray(data)) {
      return;
    }
    if (typeof schema.contains === "boolean") {
      if (schema.contains) {
        if (data.length === 0) {
          return defineError("Array must contain at least one item", { data });
        }
        return;
      }
      return defineError("Array must not contain any items", { data });
    }
    for (let i = 0; i < data.length; i++) {
      const error = schema.contains.$validate(data[i]);
      if (!error) {
        return;
      }
      continue;
    }
    return defineError("Array must contain at least one item", { data });
  }
};
var NumberKeywords = {
  minimum(schema, data, defineError, instance) {
    if (typeof data !== "number") {
      return;
    }
    let min = schema.minimum;
    if (typeof schema.exclusiveMinimum === "number") {
      min = schema.exclusiveMinimum + 1e-15;
    } else if (schema.exclusiveMinimum === true) {
      min += 1e-15;
    }
    if (data < min) {
      return defineError("Value is less than the minimum", { data });
    }
    return;
  },
  maximum(schema, data, defineError, instance) {
    if (typeof data !== "number") {
      return;
    }
    let max = schema.maximum;
    if (typeof schema.exclusiveMaximum === "number") {
      max = schema.exclusiveMaximum - 1e-15;
    } else if (schema.exclusiveMaximum === true) {
      max -= 1e-15;
    }
    if (data > max) {
      return defineError("Value is greater than the maximum", { data });
    }
    return;
  },
  multipleOf(schema, data, defineError, instance) {
    if (typeof data !== "number") {
      return;
    }
    const quotient = data / schema.multipleOf;
    if (!isFinite(quotient)) {
      return;
    }
    if (!areCloseEnough(quotient, Math.round(quotient))) {
      return defineError("Value is not a multiple of the multipleOf", { data });
    }
    return;
  },
  exclusiveMinimum(schema, data, defineError, instance) {
    if (typeof data !== "number" || typeof schema.exclusiveMinimum !== "number" || "minimum" in schema) {
      return;
    }
    if (data <= schema.exclusiveMinimum + 1e-15) {
      return defineError("Value is less than or equal to the exclusiveMinimum");
    }
    return;
  },
  exclusiveMaximum(schema, data, defineError, instance) {
    if (typeof data !== "number" || typeof schema.exclusiveMaximum !== "number" || "maximum" in schema) {
      return;
    }
    if (data >= schema.exclusiveMaximum) {
      return defineError(
        "Value is greater than or equal to the exclusiveMaximum",
        { data }
      );
    }
    return;
  }
};
var ObjectKeywords = {
  required(schema, data, defineError) {
    if (!isObject(data)) {
      return;
    }
    for (let i = 0; i < schema.required.length; i++) {
      const key = schema.required[i];
      if (!data.hasOwnProperty(key)) {
        return defineError("Required property is missing", {
          item: key,
          data: data[key]
        });
      }
    }
    return;
  },
  properties(schema, data, defineError) {
    if (!isObject(data)) {
      return;
    }
    let propKeys = schema._propKeys;
    if (!propKeys) {
      propKeys = Object.keys(schema.properties || {});
      Object.defineProperty(schema, "_propKeys", {
        value: propKeys,
        enumerable: false,
        configurable: false,
        writable: false
      });
    }
    let requiredKeys = schema._requiredKeys;
    if (requiredKeys === void 0) {
      requiredKeys = Array.isArray(schema.required) ? schema.required : null;
      Object.defineProperty(schema, "_requiredKeys", {
        value: requiredKeys,
        enumerable: false,
        configurable: false,
        writable: false
      });
    }
    const required = requiredKeys || [];
    for (let i = 0; i < propKeys.length; i++) {
      const key = propKeys[i];
      const schemaProp = schema.properties[key];
      if (!Object.prototype.hasOwnProperty.call(data, key)) {
        if (required.length && required.indexOf(key) !== -1 && isObject(schemaProp) && "default" in schemaProp) {
          const error = schemaProp.$validate(schemaProp.default);
          if (error) {
            return defineError("Default property is invalid", {
              item: key,
              cause: error,
              data: schemaProp.default
            });
          }
          data[key] = deepClone(schemaProp.default);
        }
        continue;
      }
      if (typeof schemaProp === "boolean") {
        if (schemaProp === false) {
          return defineError("Property is not allowed", {
            item: key,
            data: data[key]
          });
        }
        continue;
      }
      if (schemaProp && "$validate" in schemaProp) {
        const error = schemaProp.$validate(data[key]);
        if (error) {
          return defineError("Property is invalid", {
            item: key,
            cause: error,
            data: data[key]
          });
        }
      }
    }
    return;
  },
  values(schema, data, defineError) {
    if (!isObject(data)) {
      return;
    }
    const valueSchema = schema.values;
    const validate = valueSchema && valueSchema.$validate;
    if (typeof validate !== "function") {
      return;
    }
    const keys = Object.keys(data);
    for (let i = 0; i < keys.length; i++) {
      const key = keys[i];
      const error = validate(data[key]);
      if (error) {
        return defineError("Property is invalid", {
          item: key,
          cause: error,
          data: data[key]
        });
      }
    }
  },
  maxProperties(schema, data, defineError) {
    if (!isObject(data) || Object.keys(data).length <= schema.maxProperties) {
      return;
    }
    return defineError("Too many properties", { data });
  },
  minProperties(schema, data, defineError) {
    if (!isObject(data) || Object.keys(data).length >= schema.minProperties) {
      return;
    }
    return defineError("Too few properties", { data });
  },
  additionalProperties(schema, data, defineError) {
    if (!isObject(data)) {
      return;
    }
    const keys = Object.keys(data);
    let apIsCompiled = schema._apIsCompiled;
    if (apIsCompiled === void 0) {
      apIsCompiled = isCompiledSchema(schema.additionalProperties);
      Object.defineProperty(schema, "_apIsCompiled", {
        value: apIsCompiled,
        enumerable: false
      });
    }
    let patternList = schema._patternPropertiesList;
    if (schema.patternProperties && !patternList) {
      patternList = [];
      for (const pattern in schema.patternProperties) {
        patternList.push({
          regex: new RegExp(pattern, "u"),
          key: pattern
        });
      }
      Object.defineProperty(schema, "_patternPropertiesList", {
        value: patternList,
        enumerable: false
      });
    }
    for (let i = 0; i < keys.length; i++) {
      const key = keys[i];
      if (schema.properties && schema.properties.hasOwnProperty(key)) {
        continue;
      }
      if (patternList && patternList.length) {
        let match = false;
        for (let j = 0; j < patternList.length; j++) {
          if (patternList[j].regex.test(key)) {
            match = true;
            break;
          }
        }
        if (match) {
          continue;
        }
      }
      if (schema.additionalProperties === false) {
        return defineError("Additional properties are not allowed", {
          item: key,
          data: data[key]
        });
      }
      if (apIsCompiled && isCompiledSchema(schema.additionalProperties)) {
        const error = schema.additionalProperties.$validate(data[key]);
        if (error) {
          return defineError("Additional properties are invalid", {
            item: key,
            cause: error,
            data: data[key]
          });
        }
      }
    }
    return;
  },
  patternProperties(schema, data, defineError) {
    if (!isObject(data)) {
      return;
    }
    let patternList = schema._patternPropertiesList;
    if (!patternList) {
      patternList = [];
      const patterns = Object.keys(schema.patternProperties || {});
      for (let i = 0; i < patterns.length; i++) {
        const pattern = patterns[i];
        patternList.push({
          regex: new RegExp(pattern, "u"),
          key: pattern
        });
      }
      Object.defineProperty(schema, "_patternPropertiesList", {
        value: patternList,
        enumerable: false
      });
    }
    const dataKeys = Object.keys(data);
    for (let p = 0; p < patternList.length; p++) {
      const { regex, key: patternKey } = patternList[p];
      const schemaProp = schema.patternProperties[patternKey];
      if (typeof schemaProp === "boolean") {
        if (schemaProp === false) {
          for (let i = 0; i < dataKeys.length; i++) {
            const key = dataKeys[i];
            if (regex.test(key)) {
              return defineError("Property is not allowed", {
                item: key,
                data: data[key]
              });
            }
          }
        }
        continue;
      }
      if ("$validate" in schemaProp) {
        for (let i = 0; i < dataKeys.length; i++) {
          const key = dataKeys[i];
          if (regex.test(key)) {
            const error = schemaProp.$validate(data[key]);
            if (error) {
              return defineError("Property is invalid", {
                item: key,
                cause: error,
                data: data[key]
              });
            }
          }
        }
      }
    }
    return;
  },
  propertyNames(schema, data, defineError) {
    if (!isObject(data)) {
      return;
    }
    const pn = schema.propertyNames;
    if (typeof pn === "boolean") {
      if (pn === false && Object.keys(data).length > 0) {
        return defineError("Properties are not allowed", { data });
      }
      return;
    }
    const validate = pn && pn.$validate;
    if (typeof validate !== "function") {
      return;
    }
    for (const key in data) {
      if (!Object.prototype.hasOwnProperty.call(data, key)) {
        continue;
      }
      const error = validate(key);
      if (error) {
        return defineError("Property name is invalid", {
          item: key,
          cause: error,
          data: data[key]
        });
      }
    }
  },
  dependencies(schema, data, defineError) {
    if (!isObject(data)) {
      return;
    }
    for (const key in schema.dependencies) {
      if (key in data === false) {
        continue;
      }
      const dependency = schema.dependencies[key];
      if (Array.isArray(dependency)) {
        for (let i = 0; i < dependency.length; i++) {
          if (!(dependency[i] in data)) {
            return defineError("Dependency is not satisfied", {
              item: i,
              data: dependency[i]
            });
          }
        }
        continue;
      }
      if (typeof dependency === "boolean") {
        if (dependency) {
          continue;
        }
        return defineError("Dependency is not satisfied", { data: dependency });
      }
      if (typeof dependency === "string") {
        if (dependency in data) {
          continue;
        }
        return defineError("Dependency is not satisfied", { data: dependency });
      }
      const error = dependency.$validate(data);
      if (error) {
        return defineError("Dependency is not satisfied", {
          cause: error,
          data
        });
      }
    }
    return;
  },
  // Required by other keywords but not used as a function itself
  then: false,
  else: false,
  default: false,
  // Not implemented yet
  definitions: false,
  $id: false,
  $schema: false,
  // Metadata keywords (not used as a function)
  title: false,
  description: false,
  $comment: false,
  examples: false,
  contentMediaType: false,
  contentEncoding: false,
  // Not supported Open API keywords
  discriminator: false,
  nullable: false
};
var OtherKeywords = {
  enum(schema, data, defineError) {
    const list = schema.enum;
    for (let i = 0; i < list.length; i++) {
      const enumItem = list[i];
      if (enumItem === data) {
        return;
      }
      if (enumItem !== null && data !== null && typeof enumItem === "object" && typeof data === "object" && !hasChanged(enumItem, data)) {
        return;
      }
    }
    return defineError("Value is not one of the allowed values", { data });
  },
  allOf(schema, data, defineError) {
    for (let i = 0; i < schema.allOf.length; i++) {
      if (isObject(schema.allOf[i])) {
        if ("$validate" in schema.allOf[i]) {
          const error = schema.allOf[i].$validate(data);
          if (error) {
            return defineError("Value is not valid", { cause: error, data });
          }
        }
        continue;
      }
      if (typeof schema.allOf[i] === "boolean") {
        if (Boolean(data) !== schema.allOf[i]) {
          return defineError("Value is not valid", { data });
        }
        continue;
      }
      if (data !== schema.allOf[i]) {
        return defineError("Value is not valid", { data });
      }
    }
    return;
  },
  anyOf(schema, data, defineError) {
    for (let i = 0; i < schema.anyOf.length; i++) {
      if (isObject(schema.anyOf[i])) {
        if ("$validate" in schema.anyOf[i]) {
          const error = schema.anyOf[i].$validate(data);
          if (!error) {
            return;
          }
          continue;
        }
        return;
      } else {
        if (typeof schema.anyOf[i] === "boolean") {
          if (Boolean(data) === schema.anyOf[i]) {
            return;
          }
        }
        if (data === schema.anyOf[i]) {
          return;
        }
      }
    }
    return defineError("Value is not valid", { data });
  },
  oneOf(schema, data, defineError) {
    const list = schema.oneOf;
    let validCount = 0;
    for (let i = 0; i < list.length; i++) {
      const sub = list[i];
      if (isObject(sub)) {
        if ("$validate" in sub) {
          const error = sub.$validate(data);
          if (!error) {
            validCount++;
            if (validCount > 1) {
              return defineError("Value is not valid", { data });
            }
          }
          continue;
        }
        validCount++;
        if (validCount > 1) {
          return defineError("Value is not valid", { data });
        }
        continue;
      }
      if (typeof sub === "boolean") {
        if (Boolean(data) === sub) {
          validCount++;
          if (validCount > 1) {
            return defineError("Value is not valid", { data });
          }
        }
        continue;
      }
      if (data === sub) {
        validCount++;
        if (validCount > 1) {
          return defineError("Value is not valid", { data });
        }
      }
    }
    if (validCount === 1) {
      return;
    }
    return defineError("Value is not valid", { data });
  },
  const(schema, data, defineError) {
    if (data === schema.const) {
      return;
    }
    if (isObject(data) && isObject(schema.const) && !hasChanged(data, schema.const) || Array.isArray(data) && Array.isArray(schema.const) && !hasChanged(data, schema.const)) {
      return;
    }
    return defineError("Value is not valid", { data });
  },
  if(schema, data) {
    if ("then" in schema === false && "else" in schema === false) {
      return;
    }
    if (typeof schema.if === "boolean") {
      if (schema.if) {
        if (isCompiledSchema(schema.then)) {
          return schema.then.$validate(data);
        }
      } else if (isCompiledSchema(schema.else)) {
        return schema.else.$validate(data);
      }
      return;
    }
    if (!isCompiledSchema(schema.if)) {
      return;
    }
    const error = schema.if.$validate(data);
    if (!error) {
      if (isCompiledSchema(schema.then)) {
        return schema.then.$validate(data);
      }
      return;
    } else {
      if (isCompiledSchema(schema.else)) {
        return schema.else.$validate(data);
      }
      return;
    }
  },
  not(schema, data, defineError) {
    if (typeof schema.not === "boolean") {
      if (schema.not) {
        return defineError("Value is not valid", { data });
      }
      return;
    }
    if (isObject(schema.not)) {
      if ("$validate" in schema.not) {
        const error = schema.not.$validate(data);
        if (!error) {
          return defineError("Value is not valid", { cause: error, data });
        }
        return;
      }
      return defineError("Value is not valid", { data });
    }
    return defineError("Value is not valid", { data });
  },
  $ref(schema, data, defineError, instance) {
    if (schema._resolvedRef) {
      return schema._resolvedRef(data);
    }
    const refPath = schema.$ref;
    let targetSchema = instance.getSchemaRef(refPath);
    if (!targetSchema) {
      targetSchema = instance.getSchemaById(refPath);
    }
    if (!targetSchema) {
      return defineError(`Missing reference: ${refPath}`);
    }
    if (!targetSchema.$validate) {
      return;
    }
    schema._resolvedRef = targetSchema.$validate;
    return schema._resolvedRef(data);
  }
};
var StringKeywords = {
  minLength(schema, data, defineError) {
    if (typeof data !== "string" || data.length >= schema.minLength) {
      return;
    }
    return defineError("Value is shorter than the minimum length", { data });
  },
  maxLength(schema, data, defineError) {
    if (typeof data !== "string" || data.length <= schema.maxLength) {
      return;
    }
    return defineError("Value is longer than the maximum length", { data });
  },
  pattern(schema, data, defineError) {
    if (typeof data !== "string") {
      return;
    }
    let patternRegexp = schema._patternRegexp;
    if (!patternRegexp) {
      try {
        patternRegexp = new RegExp(schema.pattern, "u");
        Object.defineProperty(schema, "_patternRegexp", {
          value: patternRegexp,
          enumerable: false,
          configurable: false,
          writable: false
        });
      } catch (error) {
        return defineError("Invalid regular expression", {
          data,
          cause: error
        });
      }
    }
    if (patternRegexp.test(data)) {
      return;
    }
    return defineError("Value does not match the pattern", { data });
  },
  // Take into account that if we receive a format that is not defined, we
  // will not throw an error, we just ignore it.
  format(schema, data, defineError, instance) {
    if (typeof data !== "string") {
      return;
    }
    let formatValidate = schema._formatValidate;
    if (formatValidate === void 0) {
      formatValidate = instance.getFormat(schema.format);
      Object.defineProperty(schema, "_formatValidate", {
        value: formatValidate,
        enumerable: false,
        configurable: false,
        writable: false
      });
    }
    if (!formatValidate || formatValidate(data)) {
      return;
    }
    return defineError("Value does not match the format", { data });
  }
};
var keywords = {
  ...ObjectKeywords,
  ...ArrayKeywords,
  ...StringKeywords,
  ...NumberKeywords,
  ...OtherKeywords
};
var SchemaShield = class {
  types = {};
  formats = {};
  keywords = {};
  immutable = false;
  rootSchema = null;
  idRegistry = /* @__PURE__ */ new Map();
  failFast = true;
  constructor({
    immutable = false,
    failFast = true
  } = {}) {
    this.immutable = immutable;
    this.failFast = failFast;
    for (const [type, validator] of Object.entries(Types)) {
      if (validator) {
        this.addType(type, validator);
      }
    }
    for (const [keyword, validator] of Object.entries(keywords)) {
      this.addKeyword(keyword, validator);
    }
    for (const [format, validator] of Object.entries(Formats)) {
      if (validator) {
        this.addFormat(format, validator);
      }
    }
  }
  addType(name, validator, overwrite = false) {
    if (this.types[name] && !overwrite) {
      throw new ValidationError(`Type "${name}" already exists`);
    }
    this.types[name] = validator;
  }
  getType(type) {
    return this.types[type];
  }
  addFormat(name, validator, overwrite = false) {
    if (this.formats[name] && !overwrite) {
      throw new ValidationError(`Format "${name}" already exists`);
    }
    this.formats[name] = validator;
  }
  getFormat(format) {
    return this.formats[format];
  }
  addKeyword(name, validator, overwrite = false) {
    if (this.keywords[name] && !overwrite) {
      throw new ValidationError(`Keyword "${name}" already exists`);
    }
    this.keywords[name] = validator;
  }
  getKeyword(keyword) {
    return this.keywords[keyword];
  }
  getSchemaRef(path) {
    if (!this.rootSchema) {
      return;
    }
    return resolvePath(this.rootSchema, path);
  }
  getSchemaById(id) {
    return this.idRegistry.get(id);
  }
  compile(schema) {
    this.idRegistry.clear();
    const compiledSchema = this.compileSchema(schema);
    this.rootSchema = compiledSchema;
    this.linkReferences(compiledSchema);
    if (!compiledSchema.$validate) {
      if (this.isSchemaLike(schema) === false) {
        throw new ValidationError("Invalid schema");
      }
      compiledSchema.$validate = getNamedFunction(
        "Validate_Any",
        () => {
        }
      );
    }
    const validate = (data) => {
      this.rootSchema = compiledSchema;
      const clonedData = this.immutable ? deepClone(data) : data;
      const res = compiledSchema.$validate(clonedData);
      if (res) {
        return { data: clonedData, error: res, valid: false };
      }
      return { data: clonedData, error: null, valid: true };
    };
    validate.compiledSchema = compiledSchema;
    return validate;
  }
  compileSchema(schema) {
    if (!isObject(schema)) {
      if (schema === true) {
        schema = { anyOf: [{}] };
      } else if (schema === false) {
        schema = { oneOf: [] };
      } else {
        schema = { oneOf: [schema] };
      }
    }
    const compiledSchema = deepClone(schema);
    if (typeof schema.$id === "string") {
      this.idRegistry.set(schema.$id, compiledSchema);
    }
    if ("$ref" in schema) {
      const refValidator = this.getKeyword("$ref");
      if (refValidator) {
        const defineError = getDefinedErrorFunctionForKey(
          "$ref",
          schema["$ref"],
          this.failFast
        );
        compiledSchema.$validate = getNamedFunction(
          "Validate_Reference",
          (data) => refValidator(
            compiledSchema,
            data,
            defineError,
            this
          )
        );
      }
      return compiledSchema;
    }
    const validators = [];
    const activeNames = [];
    if ("type" in schema) {
      const defineTypeError = getDefinedErrorFunctionForKey(
        "type",
        schema,
        this.failFast
      );
      const types = Array.isArray(schema.type) ? schema.type : schema.type.split(",").map((t) => t.trim());
      const typeFunctions = [];
      const typeNames = [];
      for (const type2 of types) {
        const validator = this.getType(type2);
        if (validator) {
          typeFunctions.push(validator);
          typeNames.push(validator.name);
        }
      }
      if (typeFunctions.length === 0) {
        throw getDefinedErrorFunctionForKey(
          "type",
          schema,
          this.failFast
        )("Invalid type for schema", { data: schema.type });
      }
      let combinedTypeValidator;
      let typeMethodName = "";
      if (typeFunctions.length === 1) {
        typeMethodName = typeNames[0];
        const singleTypeFn = typeFunctions[0];
        combinedTypeValidator = (data) => {
          if (!singleTypeFn(data)) {
            return defineTypeError("Invalid type", { data });
          }
        };
      } else {
        typeMethodName = typeNames.join("_OR_");
        combinedTypeValidator = (data) => {
          for (let i = 0; i < typeFunctions.length; i++) {
            if (typeFunctions[i](data)) {
              return;
            }
          }
          return defineTypeError("Invalid type", { data });
        };
      }
      const typeAdapter = (_s, data) => combinedTypeValidator(data);
      validators.push({
        fn: getNamedFunction(typeMethodName, typeAdapter),
        defineError: defineTypeError
      });
      activeNames.push(typeMethodName);
    }
    const { type, $id, $ref, $validate, required, ...otherKeys } = schema;
    const keyOrder = required ? [...Object.keys(otherKeys), "required"] : Object.keys(otherKeys);
    for (const key of keyOrder) {
      const keywordFn = this.getKeyword(key);
      if (keywordFn) {
        const defineError = getDefinedErrorFunctionForKey(
          key,
          schema[key],
          this.failFast
        );
        const fnName = keywordFn.name || key;
        validators.push({
          fn: keywordFn,
          defineError
        });
        activeNames.push(fnName);
      }
    }
    const literalKeywords = ["enum", "const", "default", "examples"];
    for (const key of keyOrder) {
      if (literalKeywords.includes(key)) {
        continue;
      }
      if (isObject(schema[key])) {
        if (key === "properties") {
          for (const subKey of Object.keys(schema[key])) {
            compiledSchema[key][subKey] = this.compileSchema(
              schema[key][subKey]
            );
          }
          continue;
        }
        compiledSchema[key] = this.compileSchema(schema[key]);
        continue;
      }
      if (Array.isArray(schema[key])) {
        for (let i = 0; i < schema[key].length; i++) {
          if (this.isSchemaLike(schema[key][i])) {
            compiledSchema[key][i] = this.compileSchema(schema[key][i]);
          }
        }
        continue;
      }
    }
    if (validators.length === 0) {
      return compiledSchema;
    }
    if (validators.length === 1) {
      const v = validators[0];
      compiledSchema.$validate = getNamedFunction(
        activeNames[0],
        (data) => v.fn(compiledSchema, data, v.defineError, this)
      );
    } else {
      const compositeName = "Validate_" + activeNames.join("_AND_");
      const masterValidator = (data) => {
        for (let i = 0; i < validators.length; i++) {
          const v = validators[i];
          const error = v.fn(compiledSchema, data, v.defineError, this);
          if (error) {
            return error;
          }
        }
        return;
      };
      compiledSchema.$validate = getNamedFunction(
        compositeName,
        masterValidator
      );
    }
    return compiledSchema;
  }
  isSchemaLike(subSchema) {
    if (isObject(subSchema)) {
      if ("type" in subSchema) {
        return true;
      }
      for (let subKey in subSchema) {
        if (subKey in this.keywords) {
          return true;
        }
      }
    }
    return false;
  }
  linkReferences(root) {
    const stack = [root];
    while (stack.length > 0) {
      const node = stack.pop();
      if (!node || typeof node !== "object")
        continue;
      if (typeof node.$ref === "string" && typeof node.$validate === "function" && node.$validate.name === "Validate_Reference") {
        const refPath = node.$ref;
        let target = this.getSchemaRef(refPath);
        if (typeof target === "undefined") {
          target = this.getSchemaById(refPath);
        }
        if (typeof target === "boolean") {
          if (target === true) {
            node.$validate = getNamedFunction("Validate_Ref_True", () => {
            });
          } else {
            const defineError = getDefinedErrorFunctionForKey(
              "$ref",
              node,
              this.failFast
            );
            node.$validate = getNamedFunction(
              "Validate_Ref_False",
              (_data) => defineError("Value is not valid")
            );
          }
          continue;
        }
        if (target && typeof target.$validate === "function") {
          node.$validate = target.$validate;
        }
      }
      for (const key in node) {
        const value = node[key];
        if (!value)
          continue;
        if (Array.isArray(value)) {
          for (let i = 0; i < value.length; i++) {
            const v = value[i];
            if (v && typeof v === "object") {
              stack.push(v);
            }
          }
        } else if (typeof value === "object") {
          stack.push(value);
        }
      }
    }
  }
};

// lib/forms/index.ts
var controlBindingKey = /* @__PURE__ */ Symbol("forms-control-binding");
var formBindingKey = /* @__PURE__ */ Symbol("forms-form-binding");
function getTagName(node) {
  return String(node.tagName || "").toUpperCase();
}
function getNodeAttribute(node, attributeName) {
  if (!isFunction(node.getAttribute)) {
    return null;
  }
  return node.getAttribute(attributeName);
}
function getNodeName(node) {
  const vnodeName = node.vnode?.props?.name;
  if (isString(vnodeName)) {
    return vnodeName;
  }
  if (isString(node.name)) {
    return node.name;
  }
  const attributeName = getNodeAttribute(node, "name");
  return isString(attributeName) ? attributeName : "";
}
function getNodeType(node) {
  return String(node.type || getNodeAttribute(node, "type") || "").toLowerCase();
}
function decodeJsonPointerToken(token) {
  return token.replace(/~1/g, "/").replace(/~0/g, "~");
}
function getFieldNameFromError(error) {
  const path = String(error.getPath().instancePath || "");
  if (path.startsWith("#/")) {
    const token = path.slice(2).split("/")[0];
    if (token.length > 0) {
      return decodeJsonPointerToken(token);
    }
  }
  if (isString(error.item)) {
    return error.item;
  }
  return null;
}
function getFieldNameFromChain(error) {
  let current = error;
  while (current) {
    const fieldName = getFieldNameFromError(current);
    if (fieldName) {
      return fieldName;
    }
    current = current.cause;
  }
  return null;
}
function getRootError(error) {
  let current = error;
  while (current.cause) {
    current = current.cause;
  }
  return current;
}
function walkElements(root, visitor) {
  const children = root.childNodes || [];
  for (const child of children) {
    if (!child || child.nodeType !== 1) {
      continue;
    }
    visitor(child);
    walkElements(child, visitor);
  }
}
function getControls(formDom) {
  const controls = [];
  walkElements(formDom, (node) => {
    const tagName = getTagName(node);
    if (tagName !== "INPUT" && tagName !== "SELECT" && tagName !== "TEXTAREA") {
      return;
    }
    const control = node;
    const controlName = getNodeName(control);
    if (controlName.length === 0) {
      return;
    }
    control.name = controlName;
    controls.push(control);
  });
  return controls;
}
function getSubmitters(formDom) {
  const submitters = [];
  walkElements(formDom, (node) => {
    const tagName = getTagName(node);
    const nodeType = String(node.type || getNodeAttribute(node, "type") || "").toLowerCase();
    if ((tagName === "BUTTON" || tagName === "INPUT") && nodeType === "submit") {
      submitters.push(node);
    }
  });
  return submitters;
}
function setControlValue(control, value) {
  control.value = value == null ? "" : value;
}
var FormStore = class _FormStore {
  static #schemaShield = _FormStore.createSchemaShield();
  #validator;
  #onSubmit;
  #clean;
  #format;
  #validationMode;
  #pulseStore;
  static get schemaShield() {
    return this.#schemaShield;
  }
  static createSchemaShield() {
    const schemaShield = new SchemaShield({
      failFast: false,
      immutable: false
    });
    schemaShield.addFormat(
      "url",
      (value) => {
        if (!isString(value)) {
          return false;
        }
        try {
          const parsedUrl = new URL(value);
          return parsedUrl.protocol.length > 0;
        } catch {
          return false;
        }
      },
      true
    );
    return schemaShield;
  }
  constructor(options) {
    this.#validator = _FormStore.#schemaShield.compile(options.schema);
    this.#onSubmit = options.onSubmit || null;
    this.#clean = options.clean || {};
    this.#format = options.format || {};
    this.#validationMode = options.validationMode || "safe";
    const getValidationErrors = (values) => {
      const valuesToValidate = this.#validationMode === "safe" ? deepCloneUnfreeze(values) : values;
      const result = this.#validator(valuesToValidate);
      return result.valid ? {} : this.#mapValidationError(result.error);
    };
    const initialValues = deepCloneUnfreeze(options.state);
    this.#pulseStore = createPulseStore(
      {
        values: deepCloneUnfreeze(initialValues),
        errors: {},
        isInflight: false,
        isDirty: false
      },
      {
        setField(state, name, value) {
          state.values[name] = value;
          state.isDirty = true;
          state.errors = getValidationErrors(state.values);
        },
        validate(state) {
          state.errors = getValidationErrors(state.values);
          return Object.keys(state.errors).length === 0;
        },
        setInflight(state, inflight) {
          state.isInflight = inflight;
        },
        reset(state) {
          state.values = deepCloneUnfreeze(initialValues);
          state.errors = {};
          state.isInflight = false;
          state.isDirty = false;
        }
      }
    );
  }
  get state() {
    return this.#pulseStore.state.values;
  }
  get errors() {
    return this.#pulseStore.state.errors;
  }
  get isInflight() {
    return this.#pulseStore.state.isInflight;
  }
  get isDirty() {
    return this.#pulseStore.state.isDirty;
  }
  #runTransform(map, name, value, control, event) {
    const transform = map[name];
    if (!transform) {
      return value;
    }
    return transform(value, {
      name,
      state: this.state,
      control,
      event
    });
  }
  formatValue(name, value, control = null) {
    return this.#runTransform(this.#format, name, value, control);
  }
  setField(name, rawValue, control = null, event) {
    const cleanedValue = this.#runTransform(this.#clean, name, rawValue, control, event);
    this.#pulseStore.setField(name, cleanedValue);
  }
  #mapValidationError(error) {
    if (!error) {
      return {};
    }
    if (error === true) {
      return { _form: "Invalid form data" };
    }
    const fieldName = getFieldNameFromChain(error);
    const rootError = getRootError(error);
    const message = rootError.message || "Invalid form data";
    if (!fieldName) {
      return { _form: message };
    }
    return { [fieldName]: message };
  }
  validate() {
    return this.#pulseStore.validate();
  }
  async submit(event) {
    event?.preventDefault();
    if (!this.validate()) {
      return false;
    }
    if (this.isInflight) {
      return false;
    }
    this.#pulseStore.setInflight(true);
    try {
      if (this.#onSubmit) {
        await this.#onSubmit(this.state);
      }
      return true;
    } finally {
      this.#pulseStore.setInflight(false);
    }
  }
  reset() {
    this.#pulseStore.reset();
  }
};
var formSchemaShield = FormStore.schemaShield;
function bindControl(formStore, control) {
  const name = getNodeName(control);
  if (name.length === 0) {
    return;
  }
  control.name = name;
  const type = getNodeType(control);
  const tagName = getTagName(control);
  const stateValue = formStore.state[name];
  if (type === "checkbox") {
    control.checked = Boolean(stateValue);
  } else if (type === "radio") {
    control.checked = String(stateValue) === String(control.value || "");
  } else if (tagName === "SELECT" || tagName === "TEXTAREA" || tagName === "INPUT") {
    const formattedValue = formStore.formatValue(name, stateValue, control);
    setControlValue(control, formattedValue);
  }
  const withBinding = control;
  if (!withBinding[controlBindingKey]) {
    const binding = {
      formStore,
      name,
      type,
      onInput: control.oninput || null,
      onChange: control.onchange || null
    };
    withBinding[controlBindingKey] = binding;
    control.oninput = (event) => {
      const currentBinding = withBinding[controlBindingKey];
      if (!currentBinding) {
        return;
      }
      if (currentBinding.type !== "checkbox" && currentBinding.type !== "radio") {
        const target = event.target;
        currentBinding.formStore.setField(currentBinding.name, target.value, target, event);
        const formattedValue = currentBinding.formStore.formatValue(
          currentBinding.name,
          currentBinding.formStore.state[currentBinding.name],
          target
        );
        setControlValue(target, formattedValue);
      }
      if (currentBinding.onInput) {
        currentBinding.onInput(event);
      }
    };
    control.onchange = (event) => {
      const currentBinding = withBinding[controlBindingKey];
      if (!currentBinding) {
        return;
      }
      const target = event.target;
      if (currentBinding.type === "checkbox") {
        currentBinding.formStore.setField(currentBinding.name, Boolean(target.checked), target, event);
      } else if (currentBinding.type === "radio") {
        currentBinding.formStore.setField(currentBinding.name, target.value, target, event);
      }
      if (currentBinding.onChange) {
        currentBinding.onChange(event);
      }
    };
  }
  withBinding[controlBindingKey].formStore = formStore;
  withBinding[controlBindingKey].name = name;
  withBinding[controlBindingKey].type = type;
}
function syncSubmitButtons(formDom, formStore) {
  const submitters = getSubmitters(formDom);
  for (const submitter of submitters) {
    submitter.disabled = formStore.isInflight;
  }
}
directive("form", (formStore, vnode) => {
  const formDom = vnode.dom;
  if (!formDom || getTagName(formDom) !== "FORM") {
    return;
  }
  const withBinding = formDom;
  if (!withBinding[formBindingKey]) {
    const binding = {
      formStore,
      onSubmit: formDom.onsubmit || null
    };
    withBinding[formBindingKey] = binding;
    formDom.onsubmit = async (event) => {
      const currentBinding = withBinding[formBindingKey];
      if (!currentBinding) {
        return;
      }
      const success = await currentBinding.formStore.submit(event);
      if (!success) {
        event.preventDefault();
      }
      if (currentBinding.onSubmit) {
        await currentBinding.onSubmit(event);
      }
    };
  }
  withBinding[formBindingKey].formStore = formStore;
  const controls = getControls(formDom);
  for (const control of controls) {
    bindControl(formStore, control);
  }
  syncSubmitButtons(formDom, formStore);
});
directive("field", (formStore, vnode) => {
  const control = vnode.dom;
  bindControl(formStore, control);
});
export {
  FormStore,
  formSchemaShield
};
