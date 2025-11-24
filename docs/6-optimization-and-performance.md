Aquí tienes la documentación actualizada para los puntos **6 (Introducción)** y **6.1**, incorporando las correcciones sobre el alcance de `v-keep` (solo VNodes) y su sinergia con los Stores, eliminando los detalles internos de implementación.

# 6. Optimization & Performance

Valyrian.js is engineered for raw speed. Unlike frameworks that rely on heavy runtime scheduling or complex compilation steps, Valyrian achieves its performance through **algorithmic efficiency** and **explicit control**.

The core philosophy is simple: **The fastest code is the code that never runs.**

While the framework is fast by default, it provides primitives that allow developers to manually control the rendering cycle, ensuring that even massive applications maintain 60fps performance on low-end devices.

## 6.1. Controlled Rendering (`v-keep`)

The `v-keep` directive is the most powerful optimization tool in the framework. It allows you to **short-circuit** the Virtual DOM reconciliation process for a specific DOM Element and its entire subtree.

### How it Works

When the rendering engine encounters an element with `v-keep`, it compares the current value with the previous value using strict equality (`===`).

* **If the value matches:** The framework completely skips checking the properties and children of that node. The DOM remains untouched, saving CPU cycles.
* **If the value changes:** The node and its children are updated normally.

### Synergy with State Management

This feature is particularly powerful when combined with **FluxStore** or **PulseStore**. Even though a Store update might trigger a general patch of the application, `v-keep` acts as a firewall, protecting static or unchanged parts of your UI from being re-evaluated.

This means you can use a simple global update strategy (like POJO) and achieve performance metrics similar to fine-grained reactivity by simply "locking" the parts of the DOM that shouldn't change.

### Usage Patterns

**1. Static Content (Once):**
If an element never changes after the first render, use `v-keep` without a value (or `true`).

```tsx
// This footer will never be diffed again after mount.
// Zero CPU cost on subsequent updates.
<footer v-keep>
  <p>Copyright 2024</p>
  <ComplexLogo />
</footer>
```

**2. Dependency-Based Updates:**
Pass a value (string, number, or object reference) to `v-keep`. The element will only re-render when that specific value changes.

```tsx
// Only re-render the container if the user ID changes.
// If other parts of the app update, this section is skipped.
<div v-keep={user.id}>
  <UserProfile data={user} />
</div>
```

**3. Compound Keys (The "Super-Optimization"):**
For lists or complex views, you can construct a string key that represents the state of the element. This avoids deep object comparison.

```tsx
// Optimizing a table row
// If the label AND the selected status are the same, 
// Valyrian ignores this row completely.
<tr v-keep={`${item.label}-${isSelected}`}>
  <td>{item.label}</td>
  <td>{isSelected ? 'Yes' : 'No'}</td>
</tr>
```

> **Memory Benefit:** By skipping the render, Valyrian avoids creating new closures (event handlers) and temporary objects for that subtree, significantly reducing Garbage Collector pressure.

## 6.2. Forms & Two-way Binding (`v-model`)

Handling forms manually usually requires verbose event handlers (`oninput`, `onchange`) to sync the DOM state with your JavaScript data. Valyrian.js abstracts this complexity with the `v-model` directive, providing seamless **two-way data binding**.

### The Golden Rule: The `name` Attribute

For `v-model` to function, **the HTML element must have a `name` attribute**.
Valyrian uses the `name` prop to determine which property of the state object should be updated.

```tsx
const state = { username: "" };

// ✅ Correct: Maps state.username to the input
<input type="text" v-model={state} name="username" />

// ❌ Incorrect: Will be ignored by the directive
<input type="text" v-model={state} />
```

### 6.2.1. Text Inputs & Textareas

For standard text-based inputs (`text`, `password`, `email`, `search`, etc.) and `<textarea>`, `v-model` syncs the value on the `input` event.

* **Updates:** Triggers on every keystroke.
* **Binding:** Maps the element's `value` to the state property.

```tsx
const form = { bio: "", email: "" };

const UserForm = () => (
  <form>
    <input type="email" name="email" v-model={form} placeholder="Email" />
    <textarea name="bio" v-model={form} placeholder="Tell us about you" />
    
    <p>Preview: {form.email}</p>
  </form>
);
```

### 6.2.2. Checkboxes

Valyrian's `v-model` is polymorphic for checkboxes, handling three distinct behaviors based on the state structure and element properties.

#### A. Boolean Mode (Toggle)

If the state property is a boolean or the input has no `value` attribute, it behaves as a True/False toggle.

```tsx
const settings = { notifications: false };

<input type="checkbox" name="notifications" v-model={settings} />
// Checked -> settings.notifications = true
// Unchecked -> settings.notifications = false
```

#### B. Array Mode (Multi-Select)

If the state property is an **Array**, `v-model` will append the input's `value` to the array when checked, and remove it when unchecked.

```tsx
const state = { roles: ["admin"] };

<label>
  <input type="checkbox" name="roles" value="editor" v-model={state} /> Editor
</label>
<label>
  <input type="checkbox" name="roles" value="admin" v-model={state} /> Admin
</label>
// State will be: { roles: ["admin", "editor"] }
```

#### C. Value Mode (Nullable)

If the input has a specific `value` attribute but the state is *not* an array, it behaves as a nullable toggle.

* **Checked:** State becomes the input's `value`.
* **Unchecked:** State becomes `null`.

```tsx
const consent = { acceptedVersion: null };

<input type="checkbox" name="acceptedVersion" value="v1.0" v-model={consent} />
// Checked -> consent.acceptedVersion = "v1.0"
// Unchecked -> consent.acceptedVersion = null
```

### 6.2.3. Radio Buttons

For radio groups, `v-model` ensures mutually exclusive selection. It sets the `checked` attribute if the state property matches the radio's `value`.

```tsx
const poll = { choice: "b" };

const Poll = () => (
  <div>
    <label>
      <input type="radio" name="choice" value="a" v-model={poll} /> Option A
    </label>
    <label>
      <input type="radio" name="choice" value="b" v-model={poll} /> Option B
    </label>
  </div>
);
```

### 6.2.4. Select Dropdowns

`v-model` handles both single and multiple selection dropdowns, automatically managing the `selected` attribute of child `<option>` elements.

#### Single Select

Maps the selected option's value (or text content) to the state.

```tsx
const state = { country: "mx" };

<select name="country" v-model={state}>
  <option value="us">USA</option>
  <option value="mx">Mexico</option>
</select>
```

#### Multiple Select (`<select multiple>`)

If the `multiple` attribute is present, Valyrian handles complex selection logic (Ctrl+Click / Cmd+Click) and maps the result to an Array in the state.

```tsx
const team = { members: [] };

<select name="members" v-model={team} multiple>
  <option value="alice">Alice</option>
  <option value="bob">Bob</option>
  <option value="charlie">Charlie</option>
</select>
// Ctrl+Click Alice and Bob -> { members: ["alice", "bob"] }
// Click Charlie (without Ctrl) -> { members: ["charlie"] }
```

### 6.2.5. Event Preservation

Using `v-model` **does not** overwrite your custom event handlers. Valyrian intelligently chains them.

If you define an `oninput` (or `onclick` for selects) alongside `v-model`, the framework executes the data binding logic first, and then calls your handler.

```tsx
<input 
  type="text" 
  name="search" 
  v-model={state} 
  oninput={(e) => console.log("New value saved:", state.search)} 
/>
```

### Performance Note

When using `v-model` with **POJO** state, every input event triggers a global update. This is efficient for standard forms. For extremely high-frequency inputs (like a real-time filter in a dataset of 10,000 rows), consider:

1. Using **PulseStore** (which updates the view surgically).
2. Using `v-keep` on the heavy list to prevent re-rendering while typing.
3. Using `debounce` logic manually instead of direct `v-model` if the update is costly.

## 6.3. Keyed Lists & Node Reuse

When rendering lists or collections of elements, the framework needs a way to distinguish between items to update them efficiently. By default, the Virtual DOM updates sequentially. If you insert an item at the beginning of a list, the framework might needlessly overwrite every single subsequent element's text and attributes to match the new order. Valyrian.js is fast enough to handle thousends of items, but, if the performances is being degraded due to the number of items, you can solve this by providing a unique **`key`** attribute, alonge with other benefits. This tells Valyrian: *"This specific DOM node belongs to this specific data ID, regardless of its position in the list."*

### 6.3.1. Basic Usage

When iterating over data, assign a stable ID to the `key` property of the root element of the iteration.

```tsx
const UserList = ({ users }) => (
  <ul v-for={users}>
    {(user) => (
      // If the list is sorted, the <li> moves visually 
      // instead of being destroyed and recreated.
      <li key={user.id}>
        <img src={user.avatar} />
        <span>{user.name}</span>
      </li>
    )}
  </ul>
);
```

### 6.3.2. The "Heavy Component" Scenario (State Preservation)

The most critical use case for keys is integrating **Third-Party Libraries** that manipulate the DOM directly (e.g., Google Maps, D3 charts, Rich Text Editors). These libraries attach internal listeners and state to a DOM element that the Virtual DOM doesn't know about.

If Valyrian were to destroy and recreate that element just because its position changed, the map would reset, the chart would flicker, or the editor would lose cursor focus.

**With Keys:** Valyrian identifies the node, detaches it from its old position, and re-inserts it in the new position. The DOM node instance remains the same, preserving the third-party instance alive.

```tsx
// A wrapper for a heavy library (e.g., a Map)
const MapWidget = ({ location }) => (
  <div 
    class="map-container"
    // Initialize the map only once when the element is created
    v-create={(dom) => new ThirdPartyMap(dom, location)} 
  />
);

const Dashboard = ({ widgets }) => (
  <div class="grid" v-for={widgets}>
    {(widget) => (
      // The key ensures that if we reorder the dashboard,
      // the map instance is moved intact without re-initializing.
      <div key={widget.id} class="widget-wrapper">
        <h3>{widget.title}</h3>
        <MapWidget location={widget.coords} />
      </div>
    )}
  </div>
);
```

### 6.3.3. Visual Continuity & CSS Animations

One of the most overlooked benefits of Keyed Lists is the preservation of **visual state**.

When Valyrian updates a list *without* keys, it often reuses DOM nodes by overwriting their text content and attributes. While efficient for CPU, this is destructive for CSS state:

* **CSS Animations:** Keyframe animations (like spinners or loaders) might reset to `0%` or jump if the element identity isn't tracked.
* **CSS Transitions:** Moving an item might look like a "teleport" (instant change) rather than a smooth transition.
* **Media Elements:** `<video>` or `<audio>` tags will lose their playback progress.

**With Keys**, Valyrian moves the specific DOM Node to its new position in the document flow. The browser preserves the internal state of that node.

#### Example: Preserving Animations

Imagine a list of uploading files, each with a CSS spinner. If you sort the list by "Progress", you want the spinners to keep rotating smoothly, not restart their rotation from the beginning.

```tsx
const UploadQueue = ({ files }) => (
  <div class="queue-list">
    {/* Without 'key': The spinners would reset every time the list reorders.
       With 'key': The DOM node moves, and the CSS animation loop continues uninterrupted.
    */}
    <div v-for={files} class="file-item">
      {(file) => (
        <div key={file.id} class="file-row">
          <span class="spinner-icon">↻</span>
          <span>{file.name}</span>
        </div>
      )}
    </div>
  </div>
);
```

#### View Transitions API

Keyed lists are also essential when working with the modern **View Transitions API** or animation libraries (like auto-animate). These tools rely on the DOM element having a stable identity across renders to calculate the start and end positions for the animation.

```tsx
// If 'key' is present, the library can track that 'Item A' 
// moved from position 0 to position 5 and animate the translation.
<ul v-for={items} v-create={autoAnimate}>
  {(item) => <li key={item.id}>{item.text}</li>}
</ul>
```

### 6.3.4. The Ultimate Optimization: Keys + `v-keep`

For massive lists (e.g., a data grid with 10,000 rows), moving nodes is fast, but Valyrian still needs to check if the *content* of those nodes changed.

You can combine `key` (for efficient moving) with `v-keep` (for efficient skipping) to achieve near-zero CPU cost during updates.

```tsx
const DataGrid = ({ rows }) => (
  <tbody v-for={rows}>
    {(row) => (
      // 1. Key: If the row moves, move the TR element.
      // 2. v-keep: If the data hasn't changed, don't even check the children.
      <tr key={row.id} v-keep={row.lastUpdatedAt}>
        <td>{row.name}</td>
        <td>{row.status}</td>
        <td>{row.date}</td>
      </tr>
    )}
  </tbody>
);
```

In this scenario:

1. **Reorder:** Hash Map lookup O(1).
2. **Update:** `v-keep` check O(1).
3. **Result:** The framework performs the absolute minimum work required by the browser.

### 6.3.5. Important Rules

#### 1. Do Not Mix Keyed and Non-Keyed Siblings

All siblings in a list should either have keys or not. Mixing them causes unpredictable behavior in the reconciliation algorithm, as the framework cannot reliably determine which nodes to move and which to update in place.

```tsx
// ❌ Avoid: Mixed behavior
<div>
  <span key="a">A</span>
  <span>B</span> {/* Missing key */}
  <span key="c">C</span>
</div>

// ✅ Correct: All siblings have keys
<div>
  <span key="a">A</span>
  <span key="b">B</span>
  <span key="c">C</span>
</div>
```

#### 2. Keys Must Be Stable

Do not use `Math.random()` or array indices (unless the list is static) as keys. Unstable keys force the framework to destroy and recreate nodes constantly, which is worse than having no keys at all.
