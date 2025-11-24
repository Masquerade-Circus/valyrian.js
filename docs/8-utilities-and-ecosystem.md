# 8. Utilities & Ecosystem

Valyrian.js is not just a rendering engine; it is a cohesive ecosystem designed to solve common application problems without "Dependency Hell".

While other frameworks rely on a vast network of third-party libraries for basic needs—often leading to version conflicts and bloated bundles—Valyrian includes optimized, tree-shakeable utilities for Internationalization, Persistence, and Data Manipulation directly in the core.

These utilities are built with the same Zero-Overhead philosophy: they use native browser APIs (like Intl) whenever possible and provide just enough abstraction to be productive without sacrificing performance.

## 8.1. Internationalization (i18n) & Formatting

The `lib/translate` module provides a lightweight but complete solution for managing multi-language applications and formatting data. It is integrated directly with the Valyrian rendering cycle, meaning language changes trigger automatic UI updates.

### 8.1.1. Setup and Configuration

To start, you must define your translation dictionaries. Valyrian supports both **Nested Objects** (dot notation) and **Natural Language Keys** (using the text itself as the key). You also define a "Default Language" that acts as a fallback.

```typescript
import { setTranslations, setLang } from "valyrian.js/translate";

// 1. Define Translations
setTranslations(
  // Default (Fallback) - e.g., 'en'
  {
    // Option A: Nested Keys (Structural)
    nav: {
      home: "Home",
      about: "About Us"
    },
    // Option B: Natural Language Keys (Direct)
    "Hello world": "Hello world",

    // With parameters
    "welcome": "Welcome {name}"
  },
  // Other Languages (e.g., Spanish)
  {
    es: {
      nav: {
        home: "Inicio",
        about: "Nosotros"
      },
      // Mapping natural keys to translations
      "Hello world": "Hola mundo",
      // Mapping parameters
      "welcome": "Bienvenido {name}"
    }
  }
);

// 2. Set Active Language
// This triggers a global update() to refresh the UI
setLang("es");
```

> **Developer Experience:** If a key is not found in the current language or the fallback language, Valyrian will log a **warning** to the console. This makes it easy to spot missing translations during development while returning the key itself as a safe fallback string.

### 8.1.2. Translating Content (`t` function)

The `t` function retrieves the translated string. It supports both dot notation for structure and direct strings for simplicity.

```typescript
import { t } from "valyrian.js/translate";

// Structural Key
console.log(t("nav.home")); // "Inicio"

// Natural Key
console.log(t("Hello world")); // "Hola mundo"

// Parameter Interpolation
console.log(t("welcome", { name: "Valyrian" })); // "Bienvenido Valyrian"
```

### 8.1.3. The `v-t` Directive (Declarative Translation)

For cleaner templates, Valyrian provides the `v-t` directive. This allows you to translate elements without invoking the function manually inside the JSX.

**The "Text-as-Key" Pattern:**
This is the fastest way to build apps. You write your app in your default language, and the text itself serves as the lookup key.

```tsx
// 1. Using Children as Key (Natural Language)
// If no value is passed to v-t, it takes the text content ("Hello world") 
// and looks it up in the translation object.
<span v-t>Hello world</span>

// 2. Using the value
<span v-t="Hello world"/>

// 3. Using Parameters
<h1 v-t="welcome" v-t-params={{ name: user.name }} />

// 4. Using a specific deep key
<button v-t="nav.home"/>
```

### 8.1.4. Number & Currency Formatting (`NumberFormatter`)

Formatting numbers for different locales involves more than just adding commas. Valyrian wraps the native `Intl.NumberFormat` API in a fluent class called `NumberFormatter`, adding utility methods to handle floating-point precision issues common in JavaScript.

```typescript
import { NumberFormatter } from "valyrian.js/translate";

// 1. Basic Formatting
// Uses the current active language (e.g., 'es') automatically
NumberFormatter.create(1234.56).format(); 
// Output: "1.234,56" (Standard Spanish format)

// 2. Currency & Custom Locale
// You can override the global language for specific formats
NumberFormatter.create(5000)
  .format(2, { style: 'currency', currency: 'USD' }, 'en-US'); 
// Output: "$5,000.00"

// 3. Handling API Integers (Cents)
// APIs often send money as integers (e.g., 123456 cents) to avoid math errors.
// .shiftDecimalPlaces() automatically moves the decimal point based on the number logic.
NumberFormatter.create(123456) // Represents 1234.56
  .shiftDecimalPlaces() 
  .format(2, { style: 'currency', currency: 'EUR' });
// Output: "1.234,56 €"

// 4. Advanced Decimal Manipulation
// Convert raw user input (string) to a clean number
const input = "$ 1,234.56";
const cleaner = NumberFormatter.create(input, true); // true = shift decimal
console.log(cleaner.value); // 123456 (Stored as integer/cents internally)

// Convert back to readable
console.log(cleaner.shiftDecimalPlaces().format()); // "1,234.56"
```

This utility allows you to safely perform math on the `value` property (which holds the raw number) and only format it for display at the last moment.

## 8.2. Native Persistence (`lib/native-store`)

The `lib/native-store` module provides a robust wrapper around the browser's `localStorage` and `sessionStorage` APIs. It solves the common pain points of the native API: manual JSON parsing, lack of in-memory caching, and lack of structure.

### 8.2.1. Creating a Store

Use `createNativeStore` to initialize a storage namespace. It automatically loads existing data from the browser or initializes it with defaults if empty.

```typescript
import { createNativeStore, StorageType } from "valyrian.js/native-store";

// 1. Define the interface (Optional, for TypeScript)
interface UserSettings {
  theme: "dark" | "light";
  notifications: boolean;
}

// 2. Create the store
// Usage: createNativeStore(namespace, defaultMethodsAndState, type)
const settings = createNativeStore<UserSettings>(
  "app-settings", 
  {
    // Default state (if storage is empty)
    state: {
      theme: "light",
      notifications: true
    },
    // Custom helper method (mixed into the store)
    toggleTheme() {
      const newTheme = this.state.theme === "light" ? "dark" : "light";
      this.set("theme", newTheme);
    }
  }, 
  StorageType.Local // Persist across browser restarts
);

// 3. Usage
console.log(settings.get("theme")); // "light"
settings.toggleTheme(); // Updates state AND localStorage automatically
```

### 8.2.2. Features & Mechanics

#### Automatic Serialization

You never need to use `JSON.stringify` or `JSON.parse`. The store handles objects, arrays, and primitives automatically.

```typescript
store.set("user", { id: 1, name: "Valyrian" }); // Saved as JSON string
const user = store.get("user"); // Returned as Object
```

#### In-Memory Caching

The store maintains a local `state` object. Calling `get()` reads from memory (fast), not from the disk/storage (slow), unless the state is empty. `set()` updates both memory and storage simultaneously.

#### Cross-Tab Synchronization

When using `StorageType.Local`, Valyrian automatically listens to the browser's `storage` event.

* **Scenario:** User has your app open in Tab A and Tab B.
* **Action:** User changes theme in Tab A.
* **Result:** Tab B automatically updates its internal `store.state` to match Tab A without a page reload.

### 8.2.3. Isomorphic Usage (Server-Side)

This module is designed to work seamlessly with **Server-Side Rendering**.

* **In Browser:** It uses `window.localStorage` or `window.sessionStorage`.
* **In Node.js:** It throws an error *unless* you have imported `valyrian.js/node`.
  * When used with the Node adapter, `createNativeStore` hooks into `ServerStorage` (AsyncLocalStorage).
  * This allows you to write code like `session.get('token')` that works in the component on the client AND keeps user sessions isolated on the server during SSR.

### 8.2.4. Managing Store Instances

The factory ensures that store instances are singletons based on their ID.

```typescript
// Returns the existing instance if already created
const storeA = createNativeStore("my-data", {}, StorageType.Local, true); 

// Throws error if "my-data" exists and reuseIfExist is false (default)
// const storeB = createNativeStore("my-data", ...); 
```

### API Reference

The store object exposes the following methods:

* **`get(key)`**: Retrieves a value.
* **`set(key, value)`**: Saves a value and persists it.
* **`delete(key)`**: Removes a specific key.
* **`clear()`**: Wipes the entire namespace from storage.
* **`load()`**: Force re-load from the underlying storage mechanism (useful if modified externally).

## 8.3. Helpers (`valyrian.js/utils`)

Valyrian.js exposes its internal utility belt. These functions are highly optimized, zero-dependency implementations of common algorithmic problems like deep comparison, cloning, and object traversal. They are tree-shakeable and safe to use in both Client and Server environments.

### 8.3.1. Deep Comparison (`hasChanged`)

The `hasChanged` function determines if two values are structurally different. This is the engine behind `useEffect` dependencies and `Pulse` updates.

It performs a recursive check for Objects and Arrays, and uses **`Object.is`** for primitives. This ensures edge cases that strictly equality (`===`) misses are handled correctly.

```typescript
import { hasChanged } from "valyrian.js/utils";

// 1. Primitives & Types
hasChanged(1, 1);      // false
hasChanged(1, "1");    // true  (Different types)
hasChanged(null, undefined); // true

// 2. The "Object.is" Advantage
// 'NaN === NaN' is false in JS, which causes infinite loops in some frameworks.
// Valyrian handles this correctly:
hasChanged(NaN, NaN);  // false (No change detected)

// 3. Arrays & Objects (Recursive)
hasChanged([1, 2], [1, 2]); // false
const objA = { user: { id: 1 } };
const objB = { user: { id: 1 } };
hasChanged(objA, objB); // false (Content matches, even if references differ)
```

### 8.3.2. Immutability (`deepFreeze` & `deepCloneUnfreeze`)

These utilities are the foundation of the **FluxStore** and **PulseStore** safety mechanisms.

* **`deepFreeze(obj)`**: Recursively calls `Object.freeze` on an object and all its nested properties. Once frozen, the object cannot be modified.
* **`deepCloneUnfreeze(obj)`**: Creates a deep copy of an object, breaking all references to the original. The resulting copy is mutable (unfrozen).

**Features:**

* **Circular References:** Unlike `JSON.parse(JSON.stringify())`, this utility handles circular references correctly using a `WeakMap`.
* **Rich Types:** Supports cloning of `Date`, `RegExp`, `Map`, `Set`, `ArrayBuffer`, and `TypedArray`.

```typescript
import { deepFreeze, deepCloneUnfreeze } from "valyrian.js/utils";

const state = { count: 0, meta: { updated: new Date() } };

// 1. Make it immutable
deepFreeze(state);
// state.count = 1; // Throws Error in strict mode

// 2. Create a mutable draft
const draft = deepCloneUnfreeze(state);
draft.count = 1; // OK
```

### 8.3.3. Object Path Access (`get` / `set`)

Valyrian includes helper functions to access and modify object properties using string dot-notation paths. This logic supports **Arrays** natively, allowing you to traverse complex data structures easily.

```typescript
import { get, set } from "valyrian.js/utils";

const data = { 
  users: [
    { name: "Alice", settings: { theme: "dark" } },
    { name: "Bob" }
  ]
};

// 1. Accessing Arrays via Dot Notation
// "users.0.name" accesses data.users[0].name
const firstUser = get(data, "users.0.name"); // "Alice"

// 2. Safe Getter with Default
const theme = get(data, "users.1.settings.theme", "light"); // "light" (path doesn't exist)

// 3. Deep Setting
// Automatically follows the array index and object keys
set(data, "users.1.settings.theme", "blue");

console.log(data.users[1].settings.theme); // "blue"
```
