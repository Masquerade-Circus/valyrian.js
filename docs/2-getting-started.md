Aquí tienes el contenido completo y detallado para la **Sección 2: Getting Started**, redactado en inglés para la documentación oficial, incorporando tus correcciones de código (montaje en el body) y la estructura del TOC aprobada.

# 2\. Getting Started (The "No-Build" Approach)

Valyrian.js is designed to be consumed directly by the JavaScript runtime. While it integrates seamlessly with modern bundlers like Vite or Webpack, it does not strictly require them to function.

This section guides you through setting up a running application using only standard web technologies and the framework's built-in utilities, proving the "Zero-Overhead" philosophy.

## 2.1. The Browser Method (CDN)

The fastest way to evaluate Valyrian.js is by using ES Modules directly in the browser. This method requires no installation, no Node.js, and no build step.

Create an `index.html` file with the following content:

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Valyrian.js App</title>
</head>
<body>
    <script type="module">
        // 1. Import the library
        // When loaded this way, Valyrian.js exposes a global 'Valyrian' object
        import 'https://unpkg.com/valyrian.js';
        
        // Destructure the core functions
        const { v, mount } = Valyrian;

        // 2. Define a Component
        // Since we are in the browser without a transpiler, we use 'v' directly
        // instead of JSX. This is the raw format of a VNode.
        function HelloWorld() {
            return v("div", { style: "font-family: sans-serif; text-align: center;" }, [
                v("h1", null, "Hello from Valyrian.js"),
                v("p", null, "No build step required. Mounted directly to body.")
            ]);
        }

        // 3. Mount the component
        // Valyrian.js is robust enough to mount directly to the document body
        // replacing its content safely.
        mount("body", HelloWorld);
    </script>
</body>
</html>
```

### What just happened?

1.  **Zero Config:** The browser loaded the framework via CDN as a standard module.
2.  **Virtual DOM in Memory:** The `v` function created a Virtual Node structure (VNode) representing your UI.
3.  **Direct Mount:** The `mount` function took control of the `<body>` tag. Unlike other frameworks that require a specific root `<div>` (like `#app`), Valyrian allows you to use the `body` directly as the application container.

## 2.2. The Node.js Method (Built-in Tooling)

For local development where you want to use **JSX/TSX** syntax without the fatigue of configuring complex bundlers, Valyrian.js includes a powerful built-in utility called **`inline`**.

This utility transpiles and bundles your code using Valyrian's internal tools, eliminating the need for external dependencies like Webpack, Babel, or TypeScript compiler setup for simple projects.

### 1\. Installation

Initialize a new project and install the package:

```bash
mkdir my-valyrian-app
cd my-valyrian-app
npm init -y
npm install valyrian.js
```

### 2\. Create the Application

Create a file named `index.tsx`. You can now use modern **JSX** syntax, which Valyrian understands natively via its transpiler:

```tsx
// index.tsx
import { mount, v } from "valyrian.js";

const App = () => (
    <div style="font-family: sans-serif; padding: 2rem;">
        <h1>Hello World</h1>
        <p>Built with Valyrian internal tools.</p>
        <button onclick={() => alert("It works!")}>Click Me</button>
    </div>
);

// Mount directly to body
mount("body", App);
```

### 3\. Create the Build Script

Instead of a config file, Valyrian uses a simple JavaScript script to handle the build. Create a `build.js` file:

```javascript
// build.js
import { inline } from "valyrian.js/node";
import fs from "fs";

async function build() {
    console.log("Building application...");

    // The inline function transpiles TSX/JSX, resolves imports, 
    // and bundles dependencies into a single string.
    const result = await inline("./index.tsx", {
        compact: true, // Minifies the output for production
        // You can add sourcemaps or other options here
    });

    // Save the bundled result to a file
    fs.writeFileSync("./dist.js", result.raw);
    console.log("Build complete: ./dist.js created successfully.");
}

build();
```

### 4\. Run and Serve

Execute the build script with Node.js:

```bash
node build.js
```

This will generate a `dist.js` file containing your bundled application. You can now include this file in a minimal `index.html` page:

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Valyrian App</title>
</head>
<body>
    <script src="./dist.js"></script>
</body>
</html>
```

Open `index.html` in your browser, and your application is running.

> **Note:** The `inline` utility is designed to bootstrap projects instantly. For complex enterprise requirements (Hot Module Replacement, intricate code splitting), you can still use Vite or Webpack (see Section 9: Recipes), but `inline` covers the vast majority of use cases with **zero configuration**.