// lib/forms/index.ts
import { directive, setAttribute } from "valyrian.js";
import { createPulseStore } from "valyrian.js/pulses";
import { hasLength, isString } from "valyrian.js/utils";

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
  constructor(message) {
    super(message);
    this.message = message;
  }
  _getCause(pointer = "#", instancePointer = "#") {
    let schemaPath = `${pointer}/${this.keyword}`;
    let instancePath = `${instancePointer}`;
    if (typeof this.item !== "undefined") {
      if (typeof this.item === "string" && this.schema && typeof this.schema === "object" && this.item in this.schema) {
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
function isCompiledSchema(subSchema) {
  return !!subSchema && typeof subSchema === "object" && !Array.isArray(subSchema) && "$validate" in subSchema;
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
function areCloseEnough(a, b, epsilon = 1e-15) {
  return Math.abs(a - b) <= epsilon * Math.max(Math.abs(a), Math.abs(b));
}
var UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
var DURATION_REGEX = /^P(?!$)((\d+Y)?(\d+M)?(\d+W)?(\d+D)?)(T(?=\d)(\d+H)?(\d+M)?(\d+S)?)?$/;
var URI_REGEX = /^[a-zA-Z][a-zA-Z0-9+\-.]*:[^\s]*$/;
var EMAIL_REGEX = /^(?!\.)(?!.*\.$)[a-z0-9!#$%&'*+/=?^_`{|}~-]{1,20}(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]{1,21}){0,2}@[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,60}[a-z0-9])?){0,3}$/i;
var HOSTNAME_REGEX = /^[a-z0-9][a-z0-9-]{0,62}(?:\.[a-z0-9][a-z0-9-]{0,62})*[a-z0-9]$/i;
var DATE_REGEX = /^(\d{4})-(\d{2})-(\d{2})$/;
var TIME_REGEX = /^([01]\d|2[0-3]):([0-5]\d):([0-5]\d)(\.\d+)?(Z|([+-])([01]\d|2[0-3]):([0-5]\d))$/;
var URI_REFERENCE_REGEX = /^(([^:/?#]+):)?(\/\/([^/?#]*))?([^?#]*)(\?([^#]*))?(#((?![^#]*\\)[^#]*))?/i;
var IRI_REGEX = /^[a-zA-Z][a-zA-Z0-9+\-.]*:[^\s]*$/;
var IRI_REFERENCE_REGEX = /^(([^:/?#]+):)?(\/\/([^/?#]*))?([^?#]*)(\?([^#]*))?(#((?![^#]*\\)[^#]*))?/i;
var IDN_EMAIL_REGEX = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
var IDN_HOSTNAME_REGEX = /^[^\s!@#$%^&*()_+\=\[\]{};':"\\|,<>\/?]+$/;
var DAYS_IN_MONTH = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
function isDigitCharCode(code) {
  return code >= 48 && code <= 57;
}
function parseTwoDigits(data, index) {
  const first = data.charCodeAt(index) - 48;
  const second = data.charCodeAt(index + 1) - 48;
  if (first < 0 || first > 9 || second < 0 || second > 9) {
    return -1;
  }
  return first * 10 + second;
}
function parseFourDigits(data, index) {
  const a = data.charCodeAt(index) - 48;
  const b = data.charCodeAt(index + 1) - 48;
  const c = data.charCodeAt(index + 2) - 48;
  const d = data.charCodeAt(index + 3) - 48;
  if (a < 0 || a > 9 || b < 0 || b > 9 || c < 0 || c > 9 || d < 0 || d > 9) {
    return -1;
  }
  return a * 1e3 + b * 100 + c * 10 + d;
}
function isValidIpv4Range(data, start, end) {
  let segmentCount = 0;
  let segmentStart = start;
  for (let i = start; i <= end; i++) {
    if (i !== end && data.charCodeAt(i) !== 46) {
      continue;
    }
    const segmentLength = i - segmentStart;
    if (segmentLength < 1 || segmentLength > 3) {
      return false;
    }
    if (segmentLength > 1 && data.charCodeAt(segmentStart) === 48) {
      return false;
    }
    let value = 0;
    for (let j = segmentStart; j < i; j++) {
      const digit = data.charCodeAt(j) - 48;
      if (digit < 0 || digit > 9) {
        return false;
      }
      value = value * 10 + digit;
    }
    if (value > 255) {
      return false;
    }
    segmentCount++;
    segmentStart = i + 1;
  }
  return segmentCount === 4;
}
function isValidIpv4(data) {
  return isValidIpv4Range(data, 0, data.length);
}
function isHexCharCode(code) {
  return code >= 48 && code <= 57 || code >= 65 && code <= 70 || code >= 97 && code <= 102;
}
function isValidIpv6(data) {
  const length = data.length;
  if (length === 0) {
    return false;
  }
  let hasColon = false;
  let hasDoubleColon = false;
  let hextetCount = 0;
  let i = 0;
  while (i < length) {
    if (data.charCodeAt(i) === 58) {
      hasColon = true;
      if (i + 1 < length && data.charCodeAt(i + 1) === 58) {
        if (hasDoubleColon) {
          return false;
        }
        hasDoubleColon = true;
        i += 2;
        if (i === length) {
          break;
        }
        continue;
      }
      return false;
    }
    const segmentStart = i;
    let segmentLength = 0;
    while (i < length && isHexCharCode(data.charCodeAt(i))) {
      segmentLength++;
      if (segmentLength > 4) {
        return false;
      }
      i++;
    }
    if (segmentLength === 0) {
      return false;
    }
    if (i < length && data.charCodeAt(i) === 46) {
      if (!hasColon) {
        return false;
      }
      if (!isValidIpv4Range(data, segmentStart, length)) {
        return false;
      }
      if (hasDoubleColon) {
        return hextetCount < 6;
      }
      return hextetCount === 6;
    }
    hextetCount++;
    if (hextetCount > 8) {
      return false;
    }
    if (i === length) {
      break;
    }
    if (data.charCodeAt(i) !== 58) {
      return false;
    }
    hasColon = true;
    i++;
    if (i === length) {
      return false;
    }
    if (data.charCodeAt(i) === 58) {
      if (hasDoubleColon) {
        return false;
      }
      hasDoubleColon = true;
      i++;
      if (i === length) {
        break;
      }
    }
  }
  if (!hasColon) {
    return false;
  }
  if (hasDoubleColon) {
    return hextetCount < 8;
  }
  return hextetCount === 8;
}
function isValidJsonPointer(data) {
  if (data === "") {
    return true;
  }
  if (data.charCodeAt(0) !== 47) {
    return false;
  }
  for (let i = 1; i < data.length; i++) {
    if (data.charCodeAt(i) !== 126) {
      continue;
    }
    const next = data.charCodeAt(i + 1);
    if (next !== 48 && next !== 49) {
      return false;
    }
    i++;
  }
  return true;
}
function isValidRelativeJsonPointer(data) {
  if (data.length === 0) {
    return true;
  }
  let i = 0;
  while (i < data.length) {
    const code = data.charCodeAt(i);
    if (code < 48 || code > 57) {
      break;
    }
    i++;
  }
  if (i === 0) {
    return false;
  }
  if (i === data.length) {
    return true;
  }
  if (data.charCodeAt(i) === 35) {
    return i + 1 === data.length;
  }
  if (data.charCodeAt(i) !== 47) {
    return false;
  }
  for (i = i + 1; i < data.length; i++) {
    if (data.charCodeAt(i) !== 126) {
      continue;
    }
    const next = data.charCodeAt(i + 1);
    if (next !== 48 && next !== 49) {
      return false;
    }
    i++;
  }
  return true;
}
function isValidUriTemplate(data) {
  for (let i = 0; i < data.length; i++) {
    const code = data.charCodeAt(i);
    if (code === 125) {
      return false;
    }
    if (code !== 123) {
      continue;
    }
    const closeIndex = data.indexOf("}", i + 1);
    if (closeIndex === -1 || closeIndex === i + 1) {
      return false;
    }
    i = closeIndex;
  }
  return true;
}
var Formats = {
  ["date-time"](data) {
    const length = data.length;
    if (length < 19) {
      return false;
    }
    if (data.charCodeAt(4) !== 45 || data.charCodeAt(7) !== 45 || data.charCodeAt(13) !== 58 || data.charCodeAt(16) !== 58) {
      return false;
    }
    const tCode = data.charCodeAt(10);
    if (tCode !== 84 && tCode !== 116) {
      return false;
    }
    const year = parseFourDigits(data, 0);
    const month = parseTwoDigits(data, 5);
    const day = parseTwoDigits(data, 8);
    const hour = parseTwoDigits(data, 11);
    const minute = parseTwoDigits(data, 14);
    const second = parseTwoDigits(data, 17);
    if (year < 0 || month < 0 || day < 0 || hour < 0 || minute < 0 || second < 0) {
      return false;
    }
    if (hour > 23 || minute > 59 || second > 60) {
      return false;
    }
    let cursor = 19;
    let offsetSign = null;
    let offsetHour = 0;
    let offsetMinute = 0;
    if (cursor < length && data.charCodeAt(cursor) === 46) {
      cursor++;
      const fracStart = cursor;
      while (cursor < length && isDigitCharCode(data.charCodeAt(cursor))) {
        cursor++;
      }
      if (cursor === fracStart) {
        return false;
      }
    }
    if (cursor < length) {
      const tzCode = data.charCodeAt(cursor);
      if (tzCode === 90 || tzCode === 122) {
        cursor++;
      } else if (tzCode === 43 || tzCode === 45) {
        offsetSign = tzCode === 43 ? "+" : "-";
        if (cursor + 6 > length || data.charCodeAt(cursor + 3) !== 58) {
          return false;
        }
        offsetHour = parseTwoDigits(data, cursor + 1);
        offsetMinute = parseTwoDigits(data, cursor + 4);
        if (offsetHour < 0 || offsetMinute < 0 || offsetHour > 23 || offsetMinute > 59) {
          return false;
        }
        cursor += 6;
      } else {
        return false;
      }
    }
    if (cursor !== length) {
      return false;
    }
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
    if (second === 60) {
      let utcTotalMinutes = hour * 60 + minute;
      if (offsetSign) {
        const offsetTotalMinutes = offsetHour * 60 + offsetMinute;
        utcTotalMinutes += offsetSign === "+" ? -offsetTotalMinutes : offsetTotalMinutes;
        utcTotalMinutes %= 24 * 60;
        if (utcTotalMinutes < 0) {
          utcTotalMinutes += 24 * 60;
        }
      }
      if (utcTotalMinutes !== 23 * 60 + 59) {
        return false;
      }
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
    return isValidIpv4(data);
  },
  ipv6(data) {
    return isValidIpv6(data);
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
    return isValidJsonPointer(data);
  },
  "relative-json-pointer"(data) {
    return isValidRelativeJsonPointer(data);
  },
  time(data) {
    return TIME_REGEX.test(data);
  },
  "uri-reference"(data) {
    if (data.includes("\\")) {
      return false;
    }
    return URI_REFERENCE_REGEX.test(data);
  },
  "uri-template"(data) {
    return isValidUriTemplate(data);
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
    if (data.includes("\\")) {
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
    return data !== null && typeof data === "object" && !Array.isArray(data);
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
  uint8: false,
  int16: false,
  uint16: false,
  int32: false,
  uint32: false,
  float32: false,
  float64: false
};
function hasChanged(prev, current) {
  if (Object.is(prev, current)) {
    return false;
  }
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
      if (key in current) {
        continue;
      }
      if (hasChanged(prev[key], void 0)) {
        return true;
      }
    }
    return false;
  }
  return true;
}
function isUniquePrimitive(value) {
  return value === null || typeof value === "string" || typeof value === "number" || typeof value === "boolean";
}
function getArrayBucketKey(value) {
  const length = value.length;
  if (length === 0) {
    return "0";
  }
  const first = value[0];
  const last = value[length - 1];
  const firstType = first === null ? "null" : typeof first;
  const lastType = last === null ? "null" : typeof last;
  let firstArrayMarker = "";
  if (Array.isArray(first)) {
    const firstSignature = getPrimitiveArraySignature(first);
    firstArrayMarker = firstSignature === null ? `a:${first.length}` : firstSignature;
  }
  let lastArrayMarker = "";
  if (Array.isArray(last)) {
    const lastSignature = getPrimitiveArraySignature(last);
    lastArrayMarker = lastSignature === null ? `a:${last.length}` : lastSignature;
  }
  return `${length}:${firstType}:${firstArrayMarker}:${lastType}:${lastArrayMarker}`;
}
function getObjectShapeKey(value) {
  const keys = Object.keys(value).sort();
  return `${keys.length}:${keys.join("")}`;
}
function getPrimitiveArraySignature(value) {
  const length = value.length;
  if (length === 0) {
    return "a:0";
  }
  if (!isUniquePrimitive(value[0]) || !isUniquePrimitive(value[length - 1])) {
    return null;
  }
  let signature = `a:${length}:`;
  for (let i = 0; i < length; i++) {
    const item = value[i];
    if (item === null) {
      signature += "l;";
      continue;
    }
    if (typeof item === "string") {
      signature += `s${item.length}:${item};`;
      continue;
    }
    if (typeof item === "number") {
      if (Number.isNaN(item)) {
        signature += "n:NaN;";
        continue;
      }
      if (Object.is(item, -0)) {
        signature += "n:-0;";
        continue;
      }
      signature += `n:${item};`;
      continue;
    }
    if (typeof item === "boolean") {
      signature += item ? "b:1;" : "b:0;";
      continue;
    }
    return null;
  }
  return signature;
}
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
    if (!Array.isArray(data) || !Array.isArray(schema.items)) {
      return;
    }
    let tupleLength = schema._tupleItemsLength;
    if (tupleLength === void 0) {
      tupleLength = schema.items.length;
      Object.defineProperty(schema, "_tupleItemsLength", {
        value: tupleLength,
        enumerable: false,
        configurable: false,
        writable: false
      });
    }
    if (data.length <= tupleLength) {
      return;
    }
    if (schema.additionalItems === false) {
      return defineError("Array is too long", { data });
    }
    if (schema.additionalItems && typeof schema.additionalItems === "object" && !Array.isArray(schema.additionalItems)) {
      if (isCompiledSchema(schema.additionalItems)) {
        for (let i = tupleLength; i < data.length; i++) {
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
    if (len <= 8) {
      for (let i = 0; i < len; i++) {
        const left = data[i];
        for (let j = i + 1; j < len; j++) {
          const right = data[j];
          if (left === right) {
            return defineError("Array items are not unique", { data: right });
          }
          if (typeof left === "number" && typeof right === "number" && Number.isNaN(left) && Number.isNaN(right)) {
            return defineError("Array items are not unique", { data: right });
          }
          if (left && right && typeof left === "object" && typeof right === "object" && !hasChanged(left, right)) {
            return defineError("Array items are not unique", { data: right });
          }
        }
      }
      return;
    }
    const primitiveSeen = /* @__PURE__ */ new Set();
    let primitiveArraySignatures;
    let arrayBuckets;
    let objectBuckets;
    for (let i = 0; i < len; i++) {
      const item = data[i];
      if (isUniquePrimitive(item)) {
        if (primitiveSeen.has(item)) {
          return defineError("Array items are not unique", { data: item });
        }
        primitiveSeen.add(item);
        continue;
      }
      if (!item || typeof item !== "object") {
        continue;
      }
      if (Array.isArray(item)) {
        const signature = getPrimitiveArraySignature(item);
        if (signature !== null) {
          if (!primitiveArraySignatures) {
            primitiveArraySignatures = /* @__PURE__ */ new Set();
          }
          if (primitiveArraySignatures.has(signature)) {
            return defineError("Array items are not unique", { data: item });
          }
          primitiveArraySignatures.add(signature);
          continue;
        }
        if (!arrayBuckets) {
          arrayBuckets = /* @__PURE__ */ new Map();
        }
        const bucketKey2 = getArrayBucketKey(item);
        let candidates2 = arrayBuckets.get(bucketKey2);
        if (!candidates2) {
          candidates2 = [];
          arrayBuckets.set(bucketKey2, candidates2);
        }
        for (let j = 0; j < candidates2.length; j++) {
          if (!hasChanged(candidates2[j], item)) {
            return defineError("Array items are not unique", { data: item });
          }
        }
        candidates2.push(item);
        continue;
      }
      if (!objectBuckets) {
        objectBuckets = /* @__PURE__ */ new Map();
      }
      const bucketKey = getObjectShapeKey(item);
      let candidates = objectBuckets.get(bucketKey);
      if (!candidates) {
        candidates = [];
        objectBuckets.set(bucketKey, candidates);
      }
      for (let j = 0; j < candidates.length; j++) {
        if (!hasChanged(candidates[j], item)) {
          return defineError("Array items are not unique", { data: item });
        }
      }
      candidates.push(item);
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
    const containsValidate = schema.contains.$validate;
    for (let i = 0; i < data.length; i++) {
      const error = containsValidate(data[i]);
      if (!error) {
        return;
      }
      continue;
    }
    return defineError("Array must contain at least one item", { data });
  }
};
function isPlainObject(value) {
  if (!value || typeof value !== "object") {
    return false;
  }
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
}
function canUseStructuredClone(value) {
  if (typeof structuredClone !== "function") {
    return false;
  }
  if (typeof Buffer !== "undefined" && value instanceof Buffer) {
    return false;
  }
  return Array.isArray(value) || isPlainObject(value) || value instanceof Date || value instanceof RegExp || value instanceof Map || value instanceof Set || value instanceof ArrayBuffer || ArrayBuffer.isView(value);
}
function deepCloneUnfreeze(obj, cloneClassInstances = false, seen = /* @__PURE__ */ new WeakMap()) {
  if (typeof obj === "undefined" || obj === null || typeof obj !== "object") {
    return obj;
  }
  const source = obj;
  if (seen.has(source)) {
    return seen.get(source);
  }
  if (canUseStructuredClone(source)) {
    const cloned = structuredClone(source);
    seen.set(source, cloned);
    return cloned;
  }
  let clone;
  switch (true) {
    case Array.isArray(source): {
      clone = [];
      seen.set(source, clone);
      for (let i = 0, l = source.length; i < l; i++) {
        clone[i] = deepCloneUnfreeze(source[i], cloneClassInstances, seen);
      }
      return clone;
    }
    case source instanceof Date: {
      clone = new Date(source.getTime());
      seen.set(source, clone);
      return clone;
    }
    case source instanceof RegExp: {
      clone = new RegExp(source.source, source.flags);
      seen.set(source, clone);
      return clone;
    }
    case source instanceof Map: {
      clone = /* @__PURE__ */ new Map();
      seen.set(source, clone);
      for (const [key, value] of source.entries()) {
        clone.set(
          deepCloneUnfreeze(key, cloneClassInstances, seen),
          deepCloneUnfreeze(value, cloneClassInstances, seen)
        );
      }
      return clone;
    }
    case source instanceof Set: {
      clone = /* @__PURE__ */ new Set();
      seen.set(source, clone);
      for (const value of source.values()) {
        clone.add(deepCloneUnfreeze(value, cloneClassInstances, seen));
      }
      return clone;
    }
    case source instanceof ArrayBuffer: {
      clone = source.slice(0);
      seen.set(source, clone);
      return clone;
    }
    case ArrayBuffer.isView(source): {
      clone = new source.constructor(source.buffer.slice(0));
      seen.set(source, clone);
      return clone;
    }
    case (typeof Buffer !== "undefined" && source instanceof Buffer): {
      clone = Buffer.from(source);
      seen.set(source, clone);
      return clone;
    }
    case source instanceof Error: {
      clone = new source.constructor(source.message);
      seen.set(source, clone);
      break;
    }
    case (source instanceof Promise || source instanceof WeakMap || source instanceof WeakSet): {
      clone = source;
      seen.set(source, clone);
      return clone;
    }
    case (source.constructor && source.constructor !== Object): {
      if (!cloneClassInstances) {
        clone = source;
        seen.set(source, clone);
        return clone;
      }
      clone = Object.create(Object.getPrototypeOf(source));
      seen.set(source, clone);
      break;
    }
    default: {
      clone = {};
      seen.set(source, clone);
      const keys = Reflect.ownKeys(source);
      for (let i = 0, l = keys.length; i < l; i++) {
        const key = keys[i];
        clone[key] = deepCloneUnfreeze(
          source[key],
          cloneClassInstances,
          seen
        );
      }
      return clone;
    }
  }
  const descriptors = Object.getOwnPropertyDescriptors(source);
  for (const key of Reflect.ownKeys(descriptors)) {
    const descriptor = descriptors[key];
    if ("value" in descriptor) {
      descriptor.value = deepCloneUnfreeze(
        descriptor.value,
        cloneClassInstances,
        seen
      );
    }
    Object.defineProperty(clone, key, descriptor);
  }
  return clone;
}
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
var REGEX_META_CHARS = /[\\.^$*+?()[\]{}|]/;
function hasRegexMeta(value) {
  return REGEX_META_CHARS.test(value);
}
var PATTERN_CACHE = /* @__PURE__ */ new Map();
function compilePatternMatcher(pattern) {
  const cached = PATTERN_CACHE.get(pattern);
  if (cached) {
    return cached;
  }
  let compiled;
  if (pattern.length === 0) {
    compiled = (_value) => true;
  } else if (!hasRegexMeta(pattern)) {
    compiled = (value) => value.includes(pattern);
  } else {
    const patternLength = pattern.length;
    if (patternLength >= 2 && pattern[0] === "^" && pattern[patternLength - 1] === "$") {
      const inner = pattern.slice(1, -1);
      if (!hasRegexMeta(inner)) {
        if (inner.length === 0) {
          compiled = (value) => value.length === 0;
        } else {
          compiled = (value) => value === inner;
        }
      } else {
        compiled = new RegExp(pattern, "u");
      }
    } else if (pattern[0] === "^") {
      const inner = pattern.slice(1);
      if (!hasRegexMeta(inner)) {
        if (inner.length === 0) {
          compiled = (_value) => true;
        } else {
          compiled = (value) => value.startsWith(inner);
        }
      } else {
        compiled = new RegExp(pattern, "u");
      }
    } else if (pattern[patternLength - 1] === "$") {
      const inner = pattern.slice(0, -1);
      if (!hasRegexMeta(inner)) {
        if (inner.length === 0) {
          compiled = (_value) => true;
        } else {
          compiled = (value) => value.endsWith(inner);
        }
      } else {
        compiled = new RegExp(pattern, "u");
      }
    } else {
      compiled = new RegExp(pattern, "u");
    }
  }
  PATTERN_CACHE.set(pattern, compiled);
  return compiled;
}
var PATTERN_KEY_CACHE_LIMIT = 512;
function getPatternPropertyEntries(schema) {
  let entries = schema._patternPropertyEntries;
  if (entries) {
    return entries;
  }
  if (!schema.patternProperties || typeof schema.patternProperties !== "object" || Array.isArray(schema.patternProperties)) {
    return void 0;
  }
  const patternKeys = Object.keys(schema.patternProperties);
  entries = new Array(patternKeys.length);
  for (let i = 0; i < patternKeys.length; i++) {
    const key = patternKeys[i];
    const compiledMatcher = compilePatternMatcher(key);
    const match = compiledMatcher instanceof RegExp ? (value) => compiledMatcher.test(value) : compiledMatcher;
    entries[i] = {
      schemaProp: schema.patternProperties[key],
      match
    };
  }
  Object.defineProperty(schema, "_patternPropertyEntries", {
    value: entries,
    enumerable: false,
    configurable: false,
    writable: false
  });
  return entries;
}
function getPatternKeyMatchIndexes(schema, key, entries) {
  let cache = schema._patternKeyMatchIndexCache;
  if (cache) {
    const cached = cache.get(key);
    if (cached) {
      return cached;
    }
  } else {
    cache = /* @__PURE__ */ new Map();
    Object.defineProperty(schema, "_patternKeyMatchIndexCache", {
      value: cache,
      enumerable: false,
      configurable: false,
      writable: false
    });
  }
  const indexes = [];
  for (let i = 0; i < entries.length; i++) {
    if (entries[i].match(key)) {
      indexes.push(i);
    }
  }
  if (cache.size < PATTERN_KEY_CACHE_LIMIT) {
    cache.set(key, indexes);
  }
  return indexes;
}
var ObjectKeywords = {
  required(schema, data, defineError) {
    if (!data || typeof data !== "object" || Array.isArray(data)) {
      return;
    }
    for (let i = 0; i < schema.required.length; i++) {
      const key = schema.required[i];
      if (!Object.prototype.hasOwnProperty.call(data, key)) {
        return defineError("Required property is missing", {
          item: key,
          data: data[key]
        });
      }
    }
    return;
  },
  properties(schema, data, defineError) {
    if (!data || typeof data !== "object" || Array.isArray(data)) {
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
    let requiredSet = schema._requiredSet;
    if (requiredSet === void 0) {
      requiredSet = Array.isArray(schema.required) ? new Set(schema.required) : null;
      Object.defineProperty(schema, "_requiredSet", {
        value: requiredSet,
        enumerable: false,
        configurable: false,
        writable: false
      });
    }
    for (let i = 0; i < propKeys.length; i++) {
      const key = propKeys[i];
      const schemaProp = schema.properties[key];
      if (!Object.prototype.hasOwnProperty.call(data, key)) {
        if (requiredSet && requiredSet.has(key) && schemaProp && typeof schemaProp === "object" && !Array.isArray(schemaProp) && "default" in schemaProp) {
          const error = schemaProp.$validate(schemaProp.default);
          if (error) {
            return defineError("Default property is invalid", {
              item: key,
              cause: error,
              data: schemaProp.default
            });
          }
          data[key] = deepCloneUnfreeze(schemaProp.default);
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
    if (!data || typeof data !== "object" || Array.isArray(data)) {
      return;
    }
    const valueSchema = schema.values;
    const validate = valueSchema && valueSchema.$validate;
    if (typeof validate !== "function") {
      return;
    }
    for (const key in data) {
      if (!Object.prototype.hasOwnProperty.call(data, key)) {
        continue;
      }
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
    if (!data || typeof data !== "object" || Array.isArray(data)) {
      return;
    }
    let count = 0;
    for (const key in data) {
      if (!Object.prototype.hasOwnProperty.call(data, key)) {
        continue;
      }
      count++;
      if (count > schema.maxProperties) {
        return defineError("Too many properties", { data });
      }
    }
    return;
  },
  minProperties(schema, data, defineError) {
    if (!data || typeof data !== "object" || Array.isArray(data)) {
      return;
    }
    let count = 0;
    for (const key in data) {
      if (!Object.prototype.hasOwnProperty.call(data, key)) {
        continue;
      }
      count++;
      if (count >= schema.minProperties) {
        return;
      }
    }
    return defineError("Too few properties", { data });
  },
  additionalProperties(schema, data, defineError) {
    if (!data || typeof data !== "object" || Array.isArray(data)) {
      return;
    }
    let apValidate = schema._apValidate;
    if (apValidate === void 0) {
      apValidate = isCompiledSchema(schema.additionalProperties) ? schema.additionalProperties.$validate : null;
      Object.defineProperty(schema, "_apValidate", {
        value: apValidate,
        enumerable: false,
        configurable: false,
        writable: false
      });
    }
    const patternEntries = getPatternPropertyEntries(schema);
    for (const key in data) {
      if (!Object.prototype.hasOwnProperty.call(data, key)) {
        continue;
      }
      if (schema.properties && Object.prototype.hasOwnProperty.call(schema.properties, key)) {
        continue;
      }
      if (patternEntries && patternEntries.length) {
        if (getPatternKeyMatchIndexes(schema, key, patternEntries).length > 0) {
          continue;
        }
      }
      if (schema.additionalProperties === false) {
        return defineError("Additional properties are not allowed", {
          item: key,
          data: data[key]
        });
      }
      if (apValidate) {
        const error = apValidate(data[key]);
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
    if (!data || typeof data !== "object" || Array.isArray(data)) {
      return;
    }
    const patternEntries = getPatternPropertyEntries(schema);
    if (!patternEntries || patternEntries.length === 0) {
      return;
    }
    for (const key in data) {
      if (!Object.prototype.hasOwnProperty.call(data, key)) {
        continue;
      }
      const matchingIndexes = getPatternKeyMatchIndexes(schema, key, patternEntries);
      if (matchingIndexes.length === 0) {
        if (schema.additionalProperties === false && !(schema.properties && Object.prototype.hasOwnProperty.call(schema.properties, key))) {
          return defineError("Additional properties are not allowed", {
            item: key,
            data: data[key]
          });
        }
        continue;
      }
      for (let j = 0; j < matchingIndexes.length; j++) {
        const schemaProp = patternEntries[matchingIndexes[j]].schemaProp;
        if (typeof schemaProp === "boolean") {
          if (schemaProp === false) {
            return defineError("Property is not allowed", {
              item: key,
              data: data[key]
            });
          }
          continue;
        }
        if ("$validate" in schemaProp) {
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
    return;
  },
  propertyNames(schema, data, defineError) {
    if (!data || typeof data !== "object" || Array.isArray(data)) {
      return;
    }
    const pn = schema.propertyNames;
    if (typeof pn === "boolean") {
      if (pn === false) {
        for (const key in data) {
          if (Object.prototype.hasOwnProperty.call(data, key)) {
            return defineError("Properties are not allowed", { data });
          }
        }
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
    if (!data || typeof data !== "object" || Array.isArray(data)) {
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
function toBranchEntry(item) {
  if (item && typeof item === "object" && !Array.isArray(item)) {
    if ("$validate" in item && typeof item.$validate === "function") {
      return { kind: "validate", validate: item.$validate };
    }
    return { kind: "alwaysValid" };
  }
  if (typeof item === "boolean") {
    return { kind: item ? "alwaysValid" : "alwaysInvalid" };
  }
  return { kind: "literal", value: item };
}
function getBranchEntries(schema, key) {
  const cacheKey = `_${key}BranchEntries`;
  let entries = schema[cacheKey];
  if (entries) {
    return entries;
  }
  const source = schema[key] || [];
  entries = [];
  for (let i = 0; i < source.length; i++) {
    entries.push(toBranchEntry(source[i]));
  }
  Object.defineProperty(schema, cacheKey, {
    value: entries,
    enumerable: false,
    configurable: false,
    writable: false
  });
  return entries;
}
var OtherKeywords = {
  enum(schema, data, defineError) {
    let enumCache = schema._enumCache;
    if (!enumCache) {
      const primitiveSet = /* @__PURE__ */ new Set();
      const objectValues = [];
      const list = schema.enum;
      for (let i = 0; i < list.length; i++) {
        const enumItem = list[i];
        if (enumItem !== null && typeof enumItem === "object") {
          objectValues.push(enumItem);
        } else {
          primitiveSet.add(enumItem);
        }
      }
      enumCache = { primitiveSet, objectValues };
      Object.defineProperty(schema, "_enumCache", {
        value: enumCache,
        enumerable: false,
        configurable: false,
        writable: false
      });
    }
    if (!(typeof data === "number" && Number.isNaN(data)) && enumCache.primitiveSet.has(data)) {
      return;
    }
    if (data !== null && typeof data === "object") {
      for (let i = 0; i < enumCache.objectValues.length; i++) {
        if (!hasChanged(enumCache.objectValues[i], data)) {
          return;
        }
      }
    }
    return defineError("Value is not one of the allowed values", { data });
  },
  allOf(schema, data, defineError) {
    const branches = getBranchEntries(schema, "allOf");
    if (branches.length === 1) {
      const onlyBranch = branches[0];
      if (onlyBranch.kind === "validate") {
        const error = onlyBranch.validate(data);
        if (error) {
          return defineError("Value is not valid", { cause: error, data });
        }
        return;
      }
      if (onlyBranch.kind === "alwaysValid") {
        return;
      }
      if (onlyBranch.kind === "alwaysInvalid") {
        return defineError("Value is not valid", { data });
      }
      if (data !== onlyBranch.value) {
        return defineError("Value is not valid", { data });
      }
      return;
    }
    for (let i = 0; i < branches.length; i++) {
      const branch = branches[i];
      if (branch.kind === "validate") {
        const error = branch.validate(data);
        if (error) {
          return defineError("Value is not valid", { cause: error, data });
        }
        continue;
      }
      if (branch.kind === "alwaysValid") {
        continue;
      }
      if (branch.kind === "alwaysInvalid") {
        return defineError("Value is not valid", { data });
      }
      if (data !== branch.value) {
        return defineError("Value is not valid", { data });
      }
    }
    return;
  },
  anyOf(schema, data, defineError) {
    const branches = getBranchEntries(schema, "anyOf");
    if (branches.length === 1) {
      const onlyBranch = branches[0];
      if (onlyBranch.kind === "validate") {
        const error = onlyBranch.validate(data);
        if (!error) {
          return;
        }
        return defineError("Value is not valid", { data });
      }
      if (onlyBranch.kind === "alwaysValid") {
        return;
      }
      if (onlyBranch.kind === "alwaysInvalid") {
        return defineError("Value is not valid", { data });
      }
      if (data === onlyBranch.value) {
        return;
      }
      return defineError("Value is not valid", { data });
    }
    for (let i = 0; i < branches.length; i++) {
      const branch = branches[i];
      if (branch.kind === "validate") {
        const error = branch.validate(data);
        if (!error) {
          return;
        }
        continue;
      }
      if (branch.kind === "alwaysValid") {
        return;
      }
      if (branch.kind === "alwaysInvalid") {
        continue;
      }
      if (data === branch.value) {
        return;
      }
    }
    return defineError("Value is not valid", { data });
  },
  oneOf(schema, data, defineError) {
    const branches = getBranchEntries(schema, "oneOf");
    if (branches.length === 1) {
      const onlyBranch = branches[0];
      if (onlyBranch.kind === "validate") {
        const error = onlyBranch.validate(data);
        if (!error) {
          return;
        }
        return defineError("Value is not valid", { data });
      }
      if (onlyBranch.kind === "alwaysValid") {
        return;
      }
      if (onlyBranch.kind === "alwaysInvalid") {
        return defineError("Value is not valid", { data });
      }
      if (data === onlyBranch.value) {
        return;
      }
      return defineError("Value is not valid", { data });
    }
    let validCount = 0;
    for (let i = 0; i < branches.length; i++) {
      const branch = branches[i];
      let isValid = false;
      if (branch.kind === "validate") {
        isValid = !branch.validate(data);
      } else if (branch.kind === "alwaysValid") {
        isValid = true;
      } else if (branch.kind === "alwaysInvalid") {
        isValid = false;
      } else {
        isValid = data === branch.value;
      }
      if (isValid) {
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
    if (data && typeof data === "object" && !Array.isArray(data) && schema.const && typeof schema.const === "object" && !Array.isArray(schema.const) && !hasChanged(data, schema.const) || Array.isArray(data) && Array.isArray(schema.const) && !hasChanged(data, schema.const)) {
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
    if (schema.not && typeof schema.not === "object" && !Array.isArray(schema.not)) {
      if ("$validate" in schema.not) {
        const error = schema.not.$validate(data);
        if (!error) {
          return defineError("Value is not valid", { data });
        }
        return;
      }
      return defineError("Value is not valid", { data });
    }
    return defineError("Value is not valid", { data });
  },
  $ref(schema, data, defineError, instance) {
    if (schema._resolvedRef) {
      if (schema.$validate !== schema._resolvedRef) {
        schema.$validate = schema._resolvedRef;
      }
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
    schema.$validate = schema._resolvedRef;
    return schema._resolvedRef(data);
  }
};
var PATTERN_MATCH_CACHE_LIMIT = 512;
var FORMAT_RESULT_CACHE_LIMIT = 512;
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
    let patternMatch = schema._patternMatch;
    let patternMatchCache = schema._patternMatchCache;
    if (!patternMatch) {
      try {
        const compiled = compilePatternMatcher(schema.pattern);
        patternMatch = compiled instanceof RegExp ? (value) => compiled.test(value) : compiled;
        Object.defineProperty(schema, "_patternMatch", {
          value: patternMatch,
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
    if (!patternMatchCache) {
      patternMatchCache = /* @__PURE__ */ new Map();
      Object.defineProperty(schema, "_patternMatchCache", {
        value: patternMatchCache,
        enumerable: false,
        configurable: false,
        writable: false
      });
    } else if (patternMatchCache.has(data)) {
      if (patternMatchCache.get(data)) {
        return;
      }
      return defineError("Value does not match the pattern", { data });
    }
    const isMatch = patternMatch(data);
    if (patternMatchCache.size < PATTERN_MATCH_CACHE_LIMIT) {
      patternMatchCache.set(data, isMatch);
    }
    if (isMatch) {
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
    let formatResultCacheEnabled = schema._formatResultCacheEnabled;
    let formatResultCache = schema._formatResultCache;
    if (formatValidate === void 0) {
      formatValidate = instance.getFormat(schema.format);
      Object.defineProperty(schema, "_formatValidate", {
        value: formatValidate,
        enumerable: false,
        configurable: false,
        writable: false
      });
    }
    if (!formatValidate) {
      return;
    }
    if (formatResultCacheEnabled === void 0) {
      formatResultCacheEnabled = instance.isDefaultFormatValidator(
        schema.format,
        formatValidate
      );
      Object.defineProperty(schema, "_formatResultCacheEnabled", {
        value: formatResultCacheEnabled,
        enumerable: false,
        configurable: false,
        writable: false
      });
    }
    if (!formatResultCacheEnabled) {
      if (formatValidate(data)) {
        return;
      }
      return defineError("Value does not match the format", { data });
    }
    if (!formatResultCache) {
      formatResultCache = /* @__PURE__ */ new Map();
      Object.defineProperty(schema, "_formatResultCache", {
        value: formatResultCache,
        enumerable: false,
        configurable: false,
        writable: false
      });
    } else if (formatResultCache.has(data)) {
      if (formatResultCache.get(data)) {
        return;
      }
      return defineError("Value does not match the format", { data });
    }
    const isValid = formatValidate(data);
    if (formatResultCache.size < FORMAT_RESULT_CACHE_LIMIT) {
      formatResultCache.set(data, isValid);
    }
    if (isValid) {
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
  isDefaultFormatValidator(format, validator) {
    return Formats[format] === validator;
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
    if (compiledSchema._hasRef === true) {
      this.linkReferences(compiledSchema);
    }
    if (!compiledSchema.$validate) {
      if (schema === false) {
        const defineError = getDefinedErrorFunctionForKey(
          "oneOf",
          compiledSchema,
          this.failFast
        );
        compiledSchema.$validate = getNamedFunction(
          "Validate_False",
          (data) => defineError("Value is not valid", { data })
        );
      } else if (schema === true) {
        compiledSchema.$validate = getNamedFunction(
          "Validate_Any",
          () => {
          }
        );
      } else if (this.isSchemaLike(schema) === false) {
        throw new ValidationError("Invalid schema");
      } else {
        compiledSchema.$validate = getNamedFunction(
          "Validate_Any",
          () => {
          }
        );
      }
    }
    const validate = (data) => {
      this.rootSchema = compiledSchema;
      const clonedData = this.immutable ? deepCloneUnfreeze(data) : data;
      const res = compiledSchema.$validate(clonedData);
      if (res) {
        return { data: clonedData, error: res, valid: false };
      }
      return { data: clonedData, error: null, valid: true };
    };
    validate.compiledSchema = compiledSchema;
    return validate;
  }
  isPlainObject(value) {
    return !!value && typeof value === "object" && !Array.isArray(value);
  }
  isTrivialAlwaysValidSubschema(value) {
    return value === true || this.isPlainObject(value) && Object.keys(value).length === 0;
  }
  shallowArrayEquals(a, b) {
    if (a === b) {
      return true;
    }
    if (a.length !== b.length) {
      return false;
    }
    for (let i = 0; i < a.length; i++) {
      if (a[i] !== b[i]) {
        return false;
      }
    }
    return true;
  }
  flattenAssociativeBranches(key, branches) {
    const out = [];
    for (let i = 0; i < branches.length; i++) {
      const item = branches[i];
      if (this.isPlainObject(item) && Object.keys(item).length === 1 && Array.isArray(item[key])) {
        const nested = this.flattenAssociativeBranches(key, item[key]);
        for (let j = 0; j < nested.length; j++) {
          out.push(nested[j]);
        }
        continue;
      }
      out.push(item);
    }
    return out;
  }
  flattenSingleWrapperOneOf(branches) {
    let current = branches;
    while (current.length === 1) {
      const item = current[0];
      if (this.isPlainObject(item) && Object.keys(item).length === 1 && Array.isArray(item.oneOf)) {
        current = item.oneOf;
        continue;
      }
      break;
    }
    return current;
  }
  normalizeSchemaForCompile(schema) {
    let normalized = schema;
    const schemaKeys = Object.keys(schema);
    const hasOnlyKey = (key) => schemaKeys.length === 1 && schemaKeys[0] === key;
    const setNormalized = (key, value) => {
      if (normalized === schema) {
        normalized = { ...schema };
      }
      normalized[key] = value;
    };
    if (Array.isArray(schema.allOf)) {
      const flattenedAllOf = this.flattenAssociativeBranches(
        "allOf",
        schema.allOf
      ).filter(
        (item) => !(this.isPlainObject(item) && Object.keys(item).length === 0)
      );
      if (hasOnlyKey("allOf") && flattenedAllOf.length === 1 && this.isPlainObject(flattenedAllOf[0])) {
        return flattenedAllOf[0];
      }
      if (!this.shallowArrayEquals(flattenedAllOf, schema.allOf)) {
        setNormalized("allOf", flattenedAllOf);
      }
    }
    if (Array.isArray(schema.anyOf)) {
      const flattenedAnyOf = this.flattenAssociativeBranches(
        "anyOf",
        schema.anyOf
      );
      if (hasOnlyKey("anyOf") && flattenedAnyOf.length === 1 && this.isPlainObject(flattenedAnyOf[0])) {
        return flattenedAnyOf[0];
      }
      if (!this.shallowArrayEquals(flattenedAnyOf, schema.anyOf)) {
        setNormalized("anyOf", flattenedAnyOf);
      }
    }
    if (Array.isArray(schema.oneOf)) {
      const flattenedOneOf = this.flattenSingleWrapperOneOf(schema.oneOf);
      if (hasOnlyKey("oneOf") && flattenedOneOf.length === 1 && this.isPlainObject(flattenedOneOf[0])) {
        return flattenedOneOf[0];
      }
      if (!this.shallowArrayEquals(flattenedOneOf, schema.oneOf)) {
        setNormalized("oneOf", flattenedOneOf);
      }
    }
    return normalized;
  }
  markSchemaHasRef(schema) {
    if (schema._hasRef === true) {
      return;
    }
    Object.defineProperty(schema, "_hasRef", {
      value: true,
      enumerable: false,
      configurable: false,
      writable: false
    });
  }
  shouldSkipKeyword(schema, key) {
    const value = schema[key];
    switch (key) {
      case "required":
        return Array.isArray(value) && value.length === 0;
      case "uniqueItems":
        return value === false;
      case "properties":
      case "patternProperties":
      case "dependencies":
        return this.isPlainObject(value) && Object.keys(value).length === 0;
      case "propertyNames":
      case "items":
        return value === true;
      case "additionalProperties":
        if (value === true) {
          return true;
        }
        return value === false && this.isPlainObject(schema.patternProperties) && Object.keys(schema.patternProperties).length > 0;
      case "additionalItems":
        return value === true || !Array.isArray(schema.items);
      case "allOf": {
        if (!Array.isArray(value)) {
          return false;
        }
        if (value.length === 0) {
          return true;
        }
        for (let i = 0; i < value.length; i++) {
          if (this.isTrivialAlwaysValidSubschema(value[i])) {
            continue;
          }
          return false;
        }
        return true;
      }
      case "anyOf": {
        if (!Array.isArray(value)) {
          return false;
        }
        for (let i = 0; i < value.length; i++) {
          if (this.isTrivialAlwaysValidSubschema(value[i])) {
            return true;
          }
        }
        return false;
      }
      default:
        return false;
    }
  }
  hasRequiredDefaults(schema) {
    const properties = schema.properties;
    if (!this.isPlainObject(properties)) {
      return false;
    }
    const keys = Object.keys(properties);
    for (let i = 0; i < keys.length; i++) {
      const subSchema = properties[keys[i]];
      if (this.isPlainObject(subSchema) && "default" in subSchema) {
        return true;
      }
    }
    return false;
  }
  isDefaultTypeValidator(type, validator) {
    return Types[type] === validator;
  }
  compileSchema(schema) {
    if (!schema || typeof schema !== "object" || Array.isArray(schema)) {
      if (schema === true) {
        schema = { anyOf: [{}] };
      } else if (schema === false) {
        schema = { oneOf: [] };
      } else {
        schema = { oneOf: [schema] };
      }
    }
    schema = this.normalizeSchemaForCompile(schema);
    const compiledSchema = deepCloneUnfreeze(
      schema
    );
    let schemaHasRef = false;
    if (typeof schema.$id === "string") {
      this.idRegistry.set(schema.$id, compiledSchema);
    }
    if ("$ref" in schema) {
      schemaHasRef = true;
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
      this.markSchemaHasRef(compiledSchema);
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
      const defaultTypeNames = [];
      let allTypesDefault = true;
      for (const type2 of types) {
        const validator = this.getType(type2);
        if (validator) {
          typeFunctions.push(validator);
          typeNames.push(validator.name);
          if (this.isDefaultTypeValidator(type2, validator)) {
            defaultTypeNames.push(type2);
          } else {
            allTypesDefault = false;
          }
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
      if (typeFunctions.length === 1 && allTypesDefault) {
        const singleTypeName = defaultTypeNames[0];
        typeMethodName = singleTypeName;
        switch (singleTypeName) {
          case "object":
            combinedTypeValidator = (data) => {
              if (data === null || typeof data !== "object" || Array.isArray(data)) {
                return defineTypeError("Invalid type", { data });
              }
            };
            break;
          case "array":
            combinedTypeValidator = (data) => {
              if (!Array.isArray(data)) {
                return defineTypeError("Invalid type", { data });
              }
            };
            break;
          case "string":
            combinedTypeValidator = (data) => {
              if (typeof data !== "string") {
                return defineTypeError("Invalid type", { data });
              }
            };
            break;
          case "number":
            combinedTypeValidator = (data) => {
              if (typeof data !== "number") {
                return defineTypeError("Invalid type", { data });
              }
            };
            break;
          case "integer":
            combinedTypeValidator = (data) => {
              if (typeof data !== "number" || !Number.isInteger(data)) {
                return defineTypeError("Invalid type", { data });
              }
            };
            break;
          case "boolean":
            combinedTypeValidator = (data) => {
              if (typeof data !== "boolean") {
                return defineTypeError("Invalid type", { data });
              }
            };
            break;
          case "null":
            combinedTypeValidator = (data) => {
              if (data !== null) {
                return defineTypeError("Invalid type", { data });
              }
            };
            break;
          default: {
            const singleTypeFn = typeFunctions[0];
            combinedTypeValidator = (data) => {
              if (!singleTypeFn(data)) {
                return defineTypeError("Invalid type", { data });
              }
            };
          }
        }
      } else if (typeFunctions.length > 1 && allTypesDefault) {
        typeMethodName = defaultTypeNames.join("_OR_");
        const allowsObject = defaultTypeNames.includes("object");
        const allowsArray = defaultTypeNames.includes("array");
        const allowsString = defaultTypeNames.includes("string");
        const allowsNumber = defaultTypeNames.includes("number");
        const allowsInteger = defaultTypeNames.includes("integer");
        const allowsBoolean = defaultTypeNames.includes("boolean");
        const allowsNull = defaultTypeNames.includes("null");
        combinedTypeValidator = (data) => {
          const dataType = typeof data;
          if (dataType === "number") {
            if (allowsNumber || allowsInteger && Number.isInteger(data)) {
              return;
            }
            return defineTypeError("Invalid type", { data });
          }
          if (dataType === "string") {
            if (allowsString) {
              return;
            }
            return defineTypeError("Invalid type", { data });
          }
          if (dataType === "boolean") {
            if (allowsBoolean) {
              return;
            }
            return defineTypeError("Invalid type", { data });
          }
          if (dataType === "object") {
            if (data === null) {
              if (allowsNull) {
                return;
              }
              return defineTypeError("Invalid type", { data });
            }
            if (Array.isArray(data)) {
              if (allowsArray) {
                return;
              }
              return defineTypeError("Invalid type", { data });
            }
            if (allowsObject) {
              return;
            }
            return defineTypeError("Invalid type", { data });
          }
          return defineTypeError("Invalid type", { data });
        };
      } else if (typeFunctions.length === 1) {
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
      validators.push({
        name: typeMethodName,
        validate: getNamedFunction(typeMethodName, combinedTypeValidator)
      });
      activeNames.push(typeMethodName);
    }
    const { type, $id, $ref, $validate, required, ...otherKeys } = schema;
    const keyOrder = required ? this.hasRequiredDefaults(schema) ? [...Object.keys(otherKeys), "required"] : ["required", ...Object.keys(otherKeys)] : Object.keys(otherKeys);
    for (const key of keyOrder) {
      const keywordFn = this.getKeyword(key);
      if (!keywordFn) {
        continue;
      }
      if (this.shouldSkipKeyword(schema, key)) {
        continue;
      }
      const defineError = getDefinedErrorFunctionForKey(
        key,
        schema[key],
        this.failFast
      );
      const fnName = keywordFn.name || key;
      validators.push({
        name: fnName,
        validate: getNamedFunction(
          fnName,
          (data) => keywordFn(compiledSchema, data, defineError, this)
        )
      });
      activeNames.push(fnName);
    }
    const literalKeywords = ["enum", "const", "default", "examples"];
    for (const key of keyOrder) {
      if (literalKeywords.includes(key)) {
        continue;
      }
      if (schema[key] && typeof schema[key] === "object" && !Array.isArray(schema[key])) {
        if (key === "properties") {
          for (const subKey of Object.keys(schema[key])) {
            const compiledSubSchema2 = this.compileSchema(
              schema[key][subKey]
            );
            if (compiledSubSchema2._hasRef === true) {
              schemaHasRef = true;
            }
            compiledSchema[key][subKey] = compiledSubSchema2;
          }
          continue;
        }
        const compiledSubSchema = this.compileSchema(schema[key]);
        if (compiledSubSchema._hasRef === true) {
          schemaHasRef = true;
        }
        compiledSchema[key] = compiledSubSchema;
        continue;
      }
      if (Array.isArray(schema[key])) {
        for (let i = 0; i < schema[key].length; i++) {
          if (this.isSchemaLike(schema[key][i])) {
            const compiledSubSchema = this.compileSchema(schema[key][i]);
            if (compiledSubSchema._hasRef === true) {
              schemaHasRef = true;
            }
            compiledSchema[key][i] = compiledSubSchema;
          }
        }
        continue;
      }
    }
    if (schemaHasRef) {
      this.markSchemaHasRef(compiledSchema);
    }
    if (validators.length === 0) {
      return compiledSchema;
    }
    if (validators.length === 1) {
      const v = validators[0];
      compiledSchema.$validate = getNamedFunction(v.name, v.validate);
    } else {
      const compositeName = "Validate_" + activeNames.join("_AND_");
      const masterValidator = (data) => {
        for (let i = 0; i < validators.length; i++) {
          const v = validators[i];
          const error = v.validate(data);
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
    if (subSchema && typeof subSchema === "object" && !Array.isArray(subSchema)) {
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
function getFieldNameFromError(error) {
  const path = String(error.getPath().instancePath || "");
  if (path.startsWith("#/")) {
    const token = path.slice(2).split("/")[0];
    if (token.length > 0) {
      return token.replace(/~1/g, "/").replace(/~0/g, "~");
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
var formSchemaShield = new SchemaShield({
  failFast: false,
  immutable: false
});
function mapValidationError(error) {
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
var FormStore = class {
  validator;
  onSubmit;
  clean;
  format;
  pulseStore;
  static get schemaShield() {
    return formSchemaShield;
  }
  constructor(options) {
    this.validator = formSchemaShield.compile(options.schema);
    this.onSubmit = options.onSubmit || null;
    this.clean = options.clean || {};
    this.format = options.format || {};
    const getValidationErrors = (values) => {
      const result = this.validator(values);
      return result.valid ? {} : mapValidationError(result.error);
    };
    const initialValues = options.state;
    this.pulseStore = createPulseStore(
      {
        values: initialValues,
        validationErrors: {},
        submitError: null,
        success: false,
        isInflight: false,
        isDirty: false
      },
      {
        setField(state, name, value) {
          state.values[name] = value;
          state.isDirty = true;
          state.success = false;
        },
        setSubmitError(state, error) {
          state.submitError = error;
        },
        setSuccess(state, success) {
          state.success = success;
        },
        validate(state) {
          state.validationErrors = getValidationErrors(state.values);
          return Object.keys(state.validationErrors).length === 0;
        },
        setInflight(state, inflight) {
          state.isInflight = inflight;
        },
        reset(state) {
          state.values = initialValues;
          state.validationErrors = {};
          state.submitError = null;
          state.success = false;
          state.isInflight = false;
          state.isDirty = false;
        }
      }
    );
  }
  get state() {
    return this.pulseStore.state.values;
  }
  get validationErrors() {
    return this.pulseStore.state.validationErrors;
  }
  get submitError() {
    return this.pulseStore.state.submitError;
  }
  get success() {
    return this.pulseStore.state.success;
  }
  get isInflight() {
    return this.pulseStore.state.isInflight;
  }
  get isDirty() {
    return this.pulseStore.state.isDirty;
  }
  get hasValidationErrors() {
    return Object.keys(this.pulseStore.state.validationErrors || {}).length > 0;
  }
  get hasSubmitError() {
    return this.pulseStore.state.submitError !== null;
  }
  formatValue(name, value) {
    return name in this.format ? this.format[name](value, this.state) : value;
  }
  setField(name, rawValue) {
    const cleanedValue = name in this.clean ? this.clean[name](rawValue, this.state) : rawValue;
    this.pulseStore.setField(name, cleanedValue);
  }
  setSuccess(success) {
    this.pulseStore.setSuccess(success);
  }
  validate() {
    return this.pulseStore.validate();
  }
  async submit(event) {
    event?.preventDefault();
    if (!this.validate()) {
      return false;
    }
    if (this.isInflight) {
      return false;
    }
    this.pulseStore.setInflight(true);
    this.setSuccess(false);
    this.pulseStore.setSubmitError(null);
    try {
      if (this.onSubmit) {
        await this.onSubmit(this.state);
      }
      this.setSuccess(true);
      return true;
    } catch (error) {
      this.pulseStore.setSubmitError(error);
      return false;
    } finally {
      this.pulseStore.setInflight(false);
    }
  }
  reset() {
    this.pulseStore.reset();
  }
};
directive("form", (formStore, vnode) => {
  if (vnode.tag !== "form") {
    return;
  }
  const userOnSubmit = vnode.props.onsubmit;
  const onSubmitHandler = async (event) => {
    event.preventDefault();
    const success = await formStore.submit(event);
    if (!success) {
      event.preventDefault();
    }
    if (userOnSubmit) {
      userOnSubmit(event);
    }
  };
  setAttribute("onsubmit", onSubmitHandler, vnode);
});
directive("field", (formStore, vnode) => {
  const name = vnode.props.name;
  if (!isString(name) || hasLength(name, 0)) {
    return;
  }
  const type = vnode.props.type ? vnode.props.type : "text";
  const tagName = vnode.tag;
  const stateValue = formStore.state[name];
  const dom = vnode.dom;
  let method = "oninput";
  if (type === "checkbox") {
    setAttribute("checked", Boolean(stateValue), vnode);
    method = "onchange";
  } else if (type === "radio") {
    setAttribute("value", String(stateValue === String(dom.value || "")), vnode);
    method = "onchange";
  } else if (tagName === "select" || tagName === "textarea" || tagName === "input") {
    setAttribute("value", formStore.formatValue(name, stateValue), vnode);
  }
  if (method === "oninput") {
    const userOnInput = vnode.props.oninput;
    const onInputHandler = (event) => {
      const target = event.target;
      formStore.setField(name, target.value);
      if (userOnInput) {
        userOnInput(event);
      }
    };
    setAttribute("oninput", onInputHandler, vnode);
  }
  if (method === "onchange") {
    const userOnChange = vnode.props.onchange;
    const onChangeHandler = (event) => {
      if (formStore.success) {
        formStore.setSuccess(false);
      }
      const target = event.target;
      if (type === "checkbox") {
        formStore.setField(name, Boolean(target.checked));
      } else if (type === "radio") {
        formStore.setField(name, target.value);
      }
      if (userOnChange) {
        userOnChange(event);
      }
    };
    setAttribute("onchange", onChangeHandler, vnode);
  }
});
export {
  FormStore,
  formSchemaShield
};
