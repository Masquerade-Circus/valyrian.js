# 8.1. Internationalization (`valyrian.js/translate`)

The translate module provides language dictionaries, runtime language switching, and the `v-t` directive.

## Setup

```ts
import { setTranslations, setLang } from "valyrian.js/translate";

setTranslations(
  {
    nav: { home: "Home" },
    welcome: "Welcome {name}"
  },
  {
    es: {
      nav: { home: "Inicio" },
      welcome: "Bienvenido {name}"
    }
  }
);

setLang("es");
```

## Core APIs

* `setTranslations(defaultTranslation, newTranslations?)`
* `setLang(lang)`
* `getLang()`
* `t(path, params?)`
* `getTranslations()`

## Important Semantics

* `setTranslations` clears previous language map before applying new dictionaries.
* `en` is always based on `defaultTranslation`.
* locale input in `setLang` is normalized (`es-MX`, `es_MX` -> `es`).
* unknown languages throw.

## Persisting Selected Language

Use `setStoreStrategy` to integrate with your own language persistence.

```ts
import { setStoreStrategy } from "valyrian.js/translate";

setStoreStrategy({
  get: () => localStorage.getItem("lang") || "en",
  set: (lang) => localStorage.setItem("lang", lang)
});
```

## Missing Key Logs

Enable warnings for missing keys:

```ts
import { setLog } from "valyrian.js/translate";

setLog(true);
```

## Template Directive: `v-t`

`v-t` supports both key-as-prop and key-as-children forms.

```tsx
<span v-t="nav.home" />
<h1 v-t="welcome" v-t-params={{ name: user.name }} />
<p v-t>{"welcome"}</p>
```

`v-t-params` is a reserved prop used for interpolation replacements.
