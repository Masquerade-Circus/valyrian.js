# 8.2. Money and Number Formatting (`valyrian.js/money`)

This module keeps money values precise with cents-based arithmetic and formatting helpers.

## `Money` Value Object

```ts
import { Money } from "valyrian.js/money";

const subtotal = Money.fromDecimal(19.99);
const tax = Money.fromDecimal(1.6);
const total = subtotal.add(tax);
```

Core APIs:

* `Money.fromCents(cents)`
* `Money.fromDecimal(value, decimalPlaces?)`
* `toCents()`
* `toDecimal(decimalPlaces?)`
* `add`, `subtract`, `multiply`, `divide`

`divide(0)` throws.

## `NumberFormatter`

`NumberFormatter` is lower-level numeric cleanup + formatting utility.

```ts
import { NumberFormatter } from "valyrian.js/money";

const formatted = NumberFormatter.create("$1,234.56").format(2, { currency: "USD" }, "en-US");
```

Useful APIs:

* `set(value, shiftDecimal?)`
* `format(digits?, options?, locale?)`
* `fromDecimalPlaces(decimalPlaces)`
* `toDecimalPlaces(decimalPlaces)`
* `shiftDecimalPlaces()`

## Parsing and Formatting Helpers

```ts
import { formatMoney, parseMoneyInput } from "valyrian.js/money";

const parsed = parseMoneyInput("$1,234.56", { decimalPlaces: 2 });
const view = formatMoney(parsed, { currency: "USD", locale: "en-US", digits: 2 });
```

Parsing notes:

* strips spaces and currency symbols
* normalizes decimal separators
* invalid input returns `Money.fromCents(0)`

## `v-money` Directive

`v-money` keeps an input in formatted currency while storing cents in your model.

```tsx
<input
  v-money={{
    model: form.state,
    field: "amountInCents",
    currency: "USD",
    locale: "en-US",
    decimalPlaces: 2
  }}
/>
```

`v-money` preserves any existing `oninput` handler and calls it after updating and reformatting the input value.
