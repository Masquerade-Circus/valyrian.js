!function(e){var t={};function n(r){if(t[r])return t[r].exports;var o=t[r]={i:r,l:!1,exports:{}};return e[r].call(o.exports,o,o.exports,n),o.l=!0,o.exports}n.m=e,n.c=t,n.d=function(e,t,r){n.o(e,t)||Object.defineProperty(e,t,{configurable:!1,enumerable:!0,get:r})},n.n=function(e){var t=e&&e.__esModule?function(){return e.default}:function(){return e};return n.d(t,"a",t),t},n.o=function(e,t){return Object.prototype.hasOwnProperty.call(e,t)},n.p="",n(n.s=0)}([function(e,t,n){let r=n(1);!function(){let e=function(...t){return"object"==typeof t[0]&&null!==t[0]&&"function"==typeof t[0].view?e.render.apply(e,t):e.h.apply(e.h,t)};e.router=r(),e.isNode="undefined"==typeof window,e.mounted=!1;var t=(e.isNode?n(2):window).document;e.clock=function(e){let t,n="undefined"!=typeof performance?performance:process;return void 0!==n&&void 0!==n.hrtime?e?(t=process.hrtime(e),Math.round(1e3*t[0]+t[1]/1e6)):process.hrtime():void 0!==n&&void 0!==n.now?e?(t=performance.now())-e:performance.now():void 0},e.getFixedFrameRateMethod=function(e=5,t){let n,r=this,o=r.clock();return function(){n=r.clock(),r.clock(o)>1e3/e&&(o=n,"function"==typeof t&&("function"==typeof requestAnimationFrame?requestAnimationFrame(t.bind(this)):t.call(this)))}},e.lifecycle=[],e.h=function(...e){var t,n,r={name:"div",props:{},children:[]};for("string"==typeof e[0]&&(r.name=e.shift()),"object"!=typeof e[0]||Array.isArray(e[0])||(r.props=e.shift()),n=0,t=e.length;n<t;n++)"function"!=typeof e[n]?Array.isArray(e[n])?r.children.push.apply(r.children,e[n]):r.children.push(e[n]):r.children.push(e[n]());return r},e.vnode=function(e){if(e)return{name:e.nodeName.toLowerCase(),props:{},children:Array.prototype.map.call(e.childNodes,e=>3===e.nodeType?e.nodeValue:this.vnode(e))}},e.copy=function(e,t){var n={};for(var r in e)n[r]=e[r];for(var r in t)n[r]=t[r];return n},e.getKey=function(e){return e&&e.props?e.props.key:null},e.setElementProp=function(e,t,n,r,o){if("key"!==t)if("style"!==t)"function"==typeof n||t in e&&!r?e[t]=null==n?"":n:null==n||!1===n?null!=n&&!1!==n||e.removeAttribute(t):e.setAttribute(t,n);else for(var i in this.copy(o,n))e[t][i]=null==n||null==n[i]?"":n[i]},e.createElement=function(e,n){var r,o=0,i=e&&e.name?!0===n||"svg"===e.name?t.createElementNS("http://www.w3.org/2000/svg",e.name):t.createElement(e.name):t.createTextNode(e);if(e&&e.props){for(e.props.oncreate&&this.lifecycle.push(function(){e.props.oncreate(i)});o<e.children.length;o++)i.appendChild(this.createElement(e.children[o],n));for(r in e.props)this.setElementProp(i,r,e.props[r],n)}return i},e.updateElement=function(e,t,n,r){var o;for(o in this.copy(t,n))n[o]!==("value"===o||"checked"===o?e[o]:t[o])&&this.setElementProp(e,o,n[o],r,t[o]);n&&n.onupdate&&this.lifecycle.push(function(){n.onupdate(e,t,n)})},e.removeChildren=function(e,t,n){if(void 0!==t&&(n=t.props)){for(var r=0;r<t.children.length;r++)this.removeChildren(e.childNodes[r],t.children[r]);n.ondestroy&&n.ondestroy(e)}return e},e.removeElement=function(e,t,n){var r=()=>e.removeChild(this.removeChildren(t,n));n.props&&n.props.onremove?n.props.onremove(t,r):r()},e.patch=function(e,t,n,r,o,i){if(r===n);else if(null==n)t=e.insertBefore(this.createElement(r,o),t);else if(r.name&&r.name===n.name){this.updateElement(t,n.props,r.props,!0===o||"svg"===r.name);for(var s=[],a={},p={},d=0;d<n.children.length;d++){s[d]=t.childNodes[d],null!=(l=this.getKey(m=n.children[d]))&&(a[l]=[s[d],m])}d=0;for(var h=0;h<r.children.length;){var u=r.children[h],l=this.getKey(m=n.children[d]),c=this.getKey(u);if(p[l])d++;else if(null==c)null==l&&(this.patch(t,s[d],m,u,o),h++),d++;else{var f=a[c]||[];l===c?(this.patch(t,f[0],f[1],u,o),d++):f[0]?this.patch(t,t.insertBefore(f[0],s[d]),f[1],u,o):this.patch(t,s[d],null,u,o),h++,p[c]=u}}for(;d<n.children.length;){var m;null==this.getKey(m=n.children[d])&&this.removeElement(t,s[d],m),d++}for(var d in a)p[a[d][1].props.key]||this.removeElement(t,a[d][0],a[d][1])}else r.name===n.name?t.nodeValue=r:(t=e.insertBefore(this.createElement(r,o),i=t),this.removeElement(e,i,n));return t},e.mounted=!1,e.mount=function(e,t,n={}){if(void 0===e)throw Error("A container element is required as first element");if(void 0===t||void 0===t.view)throw Error("A component is required as a second argument");t.attributes=Object.assign({},t.attributes,n),this.root=e&&e.children[0],this.tree=this.vnode(this.root),this.component=t,this.container=e,this.mounted=!0,this.update()},e.render=function(n,r={}){var o;if(void 0!==n&&void 0!==n.view)return n.attributes=Object.assign({},n.attributes,r),o=n.view(),e.isNode?this.patch(t.createElement("div"),void 0,this.vnode(),o).innerHTML:o},e.update=function(e){var t;for("object"==typeof e&&"function"==typeof e.view&&(this.component=e),this.newTree=this.render(this.component),this.root=this.patch(this.container,this.root,this.tree,this.newTree),this.tree=this.newTree;t=this.lifecycle.pop();)t()},e.s={storeUpdateMethods:[],onStoreUpdate(e){"function"==typeof e&&this.storeUpdateMethods.push(e)},storeUpdated:e.getFixedFrameRateMethod(60,function(){for(var e=this.storeUpdateMethods.length,t=0,n=[];t<e;t++)n.push(Promise.resolve(this.storeUpdateMethods[t]()));return Promise.all(n)}),storeRoot(e,t){return this.data.call(this,e,t)},storeData(e,t){let n,r=void 0,o=void 0,i=this;return(n=function(e){return void 0!==e&&(n.value=e),n.valueOf()}).toString=function(){return""+n.valueOf()},n.valueOf=function(){return"function"==typeof n.value&&(o=n.value()),"function"!=typeof n.value&&(o=n.value),o!==r&&("function"==typeof t&&t.call(n,r,o),i.storeUpdated()),r=o,o},n(e),n}},e.data=function(...e){return this.s.storeData.apply(this.s,e)},e.onStoreUpdate=function(...e){return this.s.onStoreUpdate.apply(this.s,e)},e.onStoreUpdate(function(){e.update()}),this.m=e}()},function(e,t){let n=(e,t=[])=>{if("function"==typeof e)return t.push(e),t;let r=0,o=e.length;for(;r<o;r++)Array.isArray(e[r])&&n(e[r],t),Array.isArray(e[r])||t.push(e[r]);return t},r=(e,t,o)=>{let i,s;if("string"==typeof o[0]&&(i=o.shift()),"function"==typeof o[0]&&void 0!==o[0].paths&&void 0!==o[0].regexpList){let t=o.shift(),n=0,s=t.paths.length;for(;n<s;n++){let o=t.paths[n].middlewares,s=t.paths[n].method,a=t.paths[n].path;void 0!==i&&(a=i+(a||"*")),void 0!==a&&o.unshift(a),e=r(e,s,o)}}if((s=n(o)).length>0){if(void 0!==i&&void 0===e.regexpList[i]){let t=(i=i.replace(/\/(\?.*)?$/gi,"$1")).match(/:(\w+)?/gi)||[];for(let e in t)t[e]=t[e].replace(":","");let n=i.replace(/:(\w+)/gi,"([^\\s\\/]+)").replace(/\*/g,".*").replace(/\/(\?.*)?$/gi,"$1");e.regexpList[i]={regexp:RegExp("^"+n+"/?(\\?.*)?$","gi"),params:t}}e.paths.push({method:t,path:i,middlewares:s})}return e};e.exports=((e={})=>{let t=Object.assign({},{acceptedMethods:["get","use"]},e);const o=function(e,t="/",n={}){return o.container=e,o.default=t,o.attributes=n,o};return o.default="/",o.run=async function(e=o.default){let t,r={},i=[],s=0,a=o.paths.length;for(;s<a;s++){let t=o.paths[s];if("get"!==t.method&&"use"!==t.method)continue;if(("use"===t.method||"get"===t.method)&&void 0===t.path){i=n(t.middlewares,i);continue}let a=o.regexpList[t.path].regexp.exec(e);if(o.regexpList[t.path].regexp.lastIndex=-1,Array.isArray(a)){a.shift();let e=o.regexpList[t.path].params.length;for(;e--;)void 0===r[o.regexpList[t.path].params[e]]&&(r[o.regexpList[t.path].params[e]]=a[e]);i=n(t.middlewares,i)}}if(i.length>0){let e=0,n=i.length;for(;e<n&&void 0===(t=await i[e]());e++);if(void 0!==t&&void 0!==t.view)return m.mounted?void m.update(t):void m.mount(this.container,t,this.attributes)}throw Error(`The url ${e} requested by get, wasn't found`)},o.paths=[],o.regexpList={},t.acceptedMethods.map(e=>{o[e]=((...t)=>r(o,e,t))}),o.isNode="undefined"==typeof window,o.go=function(e){if(!o.isNode){if("number"==typeof e)return void window.history.go(e);window.history.pushState({},"",e)}o.run(e)},o.isNode||(o.back=(()=>window.history.back()),o.forward=(()=>window.history.forward()),window.addEventListener("popstate",function(e){o.run(document.location.pathname)},!1),window.document.addEventListener(/https?:\/\//.test(window.document.URL)?"DOMContentLoaded":"deviceready",function(){o.run(document.location.pathname)},!1)),o})},function(e,t){e.exports=htmlelement}]);