**Table of Contents**

1. **Valyrian.js**

   - 1.1. What is Valyrian.js?
   - 1.2. Key Features
   - 1.3. Benefits and Use Cases

2. **Getting Started**

   - 2.1. Installation
     - 2.1.1. Installation via NPM/Yarn
   - 2.2. First Steps
     - 2.2.1. Hello World
     - 2.2.2. Components and Directives
     - 2.2.3. Basic Router
     - 2.2.4. API Requests
     - 2.2.5. Server Integration

3. **Core Concepts**

   - 3.1. Virtual DOM and Vnode
     - 3.1.1. What is a Vnode?
     - 3.1.2. Creating and Using Vnodes
   - 3.2. Components
     - 3.2.1. Functional Components
     - 3.2.2. Object-Based (POJO) and Class-Based Components
     - 3.2.3. Component Lifecycle
   - 3.3. Directives
     - 3.3.1. Using Built-in Directives
     - 3.3.2. Creating Custom Directives
   - 3.4. Events and Handlers
     - 3.4.1. Event Delegation
     - 3.4.2. Handling Custom Events

4. **Additional Modules**

   - 4.1. flux-store
     - 4.1.1. Introduction to flux-store
     - 4.1.2. Creating Stores
     - 4.1.3. Flux Patterns in the Library
   - 4.2. hooks
     - 4.2.1. What are Hooks?
     - 4.2.2. Available Hooks
     - 4.2.3. Creating Custom Hooks
   - 4.3. native-store
     - 4.3.1. Using sessionStorage and localStorage
     - 4.3.2. Client-Side Data Persistence
   - 4.4. request
     - 4.4.1. Making HTTP Requests
     - 4.4.2. Node.js Configuration
     - 4.4.3. Handling Errors and Responses
   - 4.5. router
     - 4.5.1. Defining Routes
     - 4.5.2. Navigation and Links
     - 4.5.3. Server-Side Routing
   - 4.6. signals
     - 4.6.1. Introduction to Signals
     - 4.6.2. Reactivity and Auto-Update
   - 4.7. suspense
     - 4.7.1. Handling Asynchronous Loading
     - 4.7.2. Implementing Suspense in Components
   - 4.8. sw (Service Worker)
     - 4.8.1. Introduction to Service Workers
     - 4.8.2. Generating a Service Worker
     - 4.8.3. Caching and Offline Strategies
   - 4.9. translate
     - 4.9.1. i18n Setup
     - 4.9.2. Translating Content
     - 4.9.3. Number Formatting
   - 4.10. utils
     - 4.10.1. deep-freeze and unfreeze
     - 4.10.2. Dot-Based Getter-Setter
     - 4.10.3. has-changed

5. **Practical Guides**

   - 5.1. Building a Complete Application
     - 5.1.1. Project Setup
     - 5.1.2. Suggested Folder and File Structure
   - 5.2. Complex State Management
     - 5.2.1. Advanced Use of flux-store
     - 5.2.2. Integration with Hooks and Signals
   - 5.3. Performance Optimization
     - 5.3.1. Efficient Patching Techniques
     - 5.3.2. Efficient Use of Directives
   - 5.4. Implementing SSR
     - 5.4.1. Server Setup
     - 5.4.2. Automatic Client-Side DOM Hydration
     - 5.4.3. Best Practices for SSR
   - 5.5. Advanced Internationalization
     - 5.5.1. Managing Multiple Languages
     - 5.5.2. Dynamic Language Switching

6. **API Reference**

   - 6.1. Classes and Types
     - 6.1.1. Vnode
     - 6.1.2. VnodeProperties
     - 6.1.3. Components and Interfaces
   - 6.2. Key Functions and Methods
     - 6.2.1. v()
     - 6.2.2. mount()
     - 6.2.3. update()
     - 6.2.4. setAttribute()
   - 6.3. Available Directives
     - 6.3.1. Complete List of Directives
     - 6.3.2. Description and Examples
   - 6.4. Modules
     - 6.4.1. signals
     - 6.4.2. hooks
     - 6.4.3. flux-store
     - 6.4.4. native-store
     - 6.4.5. router
     - 6.4.6. request
     - 6.4.7. suspense
     - 6.4.8. translate
     - 6.4.9. sw
     - 6.4.10. utils

7. **Troubleshooting**

   - 7.1. Common Errors and Solutions
   - 7.2. Frequently Asked Questions (FAQs)
   - 7.3. Debugging Tools

8. **Additional Resources**

   - 8.4. Contributing to the Project

9. **Appendices**
   - 9.1. Project History and Roadmap
   - 9.2. License and Legal Agreements
