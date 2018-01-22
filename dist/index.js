!function(e){var t={};function n(r){if(t[r])return t[r].exports;var o=t[r]={i:r,l:!1,exports:{}};return e[r].call(o.exports,o,o.exports,n),o.l=!0,o.exports}n.m=e,n.c=t,n.d=function(e,t,r){n.o(e,t)||Object.defineProperty(e,t,{configurable:!1,enumerable:!0,get:r})},n.n=function(e){var t=e&&e.__esModule?function(){return e.default}:function(){return e};return n.d(t,"a",t),t},n.o=function(e,t){return Object.prototype.hasOwnProperty.call(e,t)},n.p="",n(n.s=0)}([function(e,t,n){!function(){this.Valyrian=function(){let e=n(1),t=n(2),r=n(3),o=n(4),i=n(6),s=function(...e){return s.isComponent(e[0])?s.render.apply(s,e):t.apply(t,e)};s.r=o(),["get","post","put","patch","delete","options"].forEach(e=>s[e]=((t,n,r)=>s.r.request(e,t,n,r))),s.router=e(s),s.isNode="undefined"==typeof window;var a=s.isNode?n(7):window,p=a.document,c=[],u=i(a),d=function(e){if(e)return{name:e.nodeName.toLowerCase(),props:{},children:Array.prototype.map.call(e.childNodes,e=>3===e.nodeType?e.nodeValue:d(e))}};s.clock=function(e){let t,n="undefined"!=typeof performance?performance:process;return void 0!==n&&void 0!==n.hrtime?e?(t=process.hrtime(e),Math.round(1e3*t[0]+t[1]/1e6)):process.hrtime():void 0!==n&&void 0!==n.now?e?(t=performance.now())-e:performance.now():void 0},s.getFixedFrameRateMethod=function(e=5,t){let n,r=s.clock();return function(){n=s.clock(),s.clock(r)>1e3/e&&(r=n,"function"==typeof t&&("function"==typeof requestAnimationFrame?requestAnimationFrame(t.bind(this)):t.call(this)))}};s.container=p.createElement("div");var l=d(),f=void 0,h=void 0;s.assignAttributes=function(e,t={}){e.attributes=t.name&&t.props&&Array.isArray(t.children)?{children:t}:Object.assign({},e.attributes,t)},s.mount=function(e,t,n={}){if(void 0===e)throw Error("A container element is required as first element");if(!s.isComponent(t))throw Error("A component is required as a second argument");return s.assignAttributes(t,n),e&&e.children&&(l=d(e.children[0])),h=t,s.container=e,s.update()},s.render=function(e,t={}){if(s.isComponent(e))return s.assignAttributes(e,t),e.view()},s.update=function(e,t={}){var n;for(s.isComponent(e)&&(s.assignAttributes(e,t),h=e),f=s.render(h),console.log("******************************"),s.container=u(s.container,f,l),console.log("******************************"),l=f;n=c.pop();)n();return s.isNode?s.container.innerHTML:s.container},s.isComponent=function(e){return"object"==typeof e&&null!==e&&"function"==typeof e.view};var m=r(s);return s.data=function(...e){return m.storeData.apply(m,e)},s.onStoreUpdate=function(...e){return m.onStoreUpdate.apply(m,e)},s.onStoreUpdate(function(){s.update()}),s}}()},function(e,t){let n=(e,t=[])=>{if("function"==typeof e)return t.push(e),t;let r=0,o=e.length;for(;r<o;r++)Array.isArray(e[r])&&n(e[r],t),Array.isArray(e[r])||t.push(e[r]);return t},r=(e,t,o)=>{let i,s;if("string"==typeof o[0]&&(i=o.shift()),"function"==typeof o[0]&&void 0!==o[0].paths&&void 0!==o[0].regexpList){let t=o.shift(),n=0,s=t.paths.length;for(;n<s;n++){let o=t.paths[n].middlewares,s=t.paths[n].method,a=t.paths[n].path;void 0!==i&&(a=i+(a||"*")),void 0!==a&&o.unshift(a),e=r(e,s,o)}}if((s=n(o)).length>0){if(void 0!==i&&void 0===e.regexpList[i]){let t=(i=i.replace(/\/(\?.*)?$/gi,"$1")).match(/:(\w+)?/gi)||[];for(let e in t)t[e]=t[e].replace(":","");let n=i.replace(/:(\w+)/gi,"([^\\s\\/]+)").replace(/\*/g,".*").replace(/\/(\?.*)?$/gi,"$1");e.regexpList[i]={regexp:RegExp("^"+n+"/?(\\?.*)?$","gi"),params:t}}e.paths.push({method:t,path:i,middlewares:s})}return e};e.exports=((e,t={})=>{let o=Object.assign({},{acceptedMethods:["get","use"]},t);const i=function(e,t,n={}){return i.container=e,i.attributes=n,i.mainComponent=t,i};return i.default="/",i.params={},i.run=async function(t=i.default,r={}){let o,s=[],a=0,p=i.paths.length;for(i.params={},e.assignAttributes(i,r);a<p;a++){let e=i.paths[a];if("get"!==e.method&&"use"!==e.method)continue;if(("use"===e.method||"get"===e.method)&&void 0===e.path){s=n(e.middlewares,s);continue}let r=i.regexpList[e.path].regexp.exec(t);if(i.regexpList[e.path].regexp.lastIndex=-1,Array.isArray(r)){r.shift();let t=i.regexpList[e.path].params.length;for(;t--;)void 0===i.params[i.regexpList[e.path].params[t]]&&(i.params[i.regexpList[e.path].params[t]]=r[t]);s=n(e.middlewares,s)}}if(s.length>0){let t=0,n=s.length;for(;t<n&&(o=await s[t](),!e.isComponent(o));t++);if(e.isComponent(o))return this.attributes.params=this.params,this.isNode?e.mounted?e.update(this.mainComponent,e(o,this.attributes)):e.mount(this.container,this.mainComponent,e(o,this.attributes)):e.mounted?e.update(o,this.attributes):e.mount(this.container,o,this.attributes)}throw Error(`The url ${t} requested by get, wasn't found`)},i.paths=[],i.regexpList={},o.acceptedMethods.map(e=>{i[e]=((...t)=>r(i,e,t))}),i.isNode="undefined"==typeof window,i.go=function(e,t={}){if(!i.isNode){if("number"==typeof e)return void window.history.go(e);window.history.pushState({},"",e)}return i.run(e,t)},i.isNode||(i.back=(()=>window.history.back()),i.forward=(()=>window.history.forward()),window.addEventListener("popstate",function(e){i.run(document.location.pathname)},!1),window.document.addEventListener(/https?:\/\//.test(window.document.URL)?"DOMContentLoaded":"deviceready",function(){i.run(document.location.pathname)},!1)),i})},function(e,t){e.exports=function(...e){var t,n,r,o={name:"div",props:{},children:[]};if("string"==typeof e[0]&&(o.name=e.shift()),"object"!=typeof e[0]||Array.isArray(e[0])||(o.props=e.shift()),/(\.|\[|#)/gi.test(o.name)&&(r=o.name.match(/([\.|\#]\w+|\[[^\]]+\])/gi),o.name=o.name.replace(/([\.|\#]\w+|\[[^\]]+\])/gi,""),r))for(t=r.length;t--;)"#"!==r[t].charAt(0)?"."!==r[t].charAt(0)?"["===r[t].charAt(0)&&(r[t]=r[t].trim().slice(1,-1).split("="),o.props[r[t][0]]=r[t][1]):o.props.class=((o.props.class||"")+" "+r[t].slice(1)).trim():o.props.id=r[t].slice(1);for(n=0,t=e.length;n<t;n++)"function"!=typeof e[n]?Array.isArray(e[n])?o.children.push.apply(o.children,e[n]):o.children.push(e[n]):o.children.push(e[n]());return o}},function(e,t){e.exports=function(e){let t={storeUpdateMethods:[],onStoreUpdate(e){"function"==typeof e&&t.storeUpdateMethods.push(e)},storeUpdated:e.getFixedFrameRateMethod(60,function(){for(var e=t.storeUpdateMethods.length,n=0,r=[];n<e;n++)r.push(Promise.resolve(t.storeUpdateMethods[n]()));return Promise.all(r)}),storeData(e,n){let r,o=void 0,i=void 0;return(r=function(e){return void 0!==e&&(r.value=e),r.valueOf()}).toString=function(){return""+r.valueOf()},r.valueOf=function(){return"function"==typeof r.value&&(i=r.value()),"function"!=typeof r.value&&(i=r.value),i!==o&&("function"==typeof n&&n.call(r,o,i),t.storeUpdated()),o=i,i},r(e),r}};return t}},function(e,t,n){let r=function(e="",t={}){let o=e.replace(/\/$/gi,"").trim(),i=Object.assign({},t),s=function(e,t){let n=s.baseUrl+"/"+e,o=Object.assign({},s.options,t);return r(n,o)};return s.apiUrl=void 0,s.nodeUrl=void 0,s.isNode="undefined"==typeof window,s.options=i,s.baseUrl=o,s.fetch=s.isNode?n(5):fetch.bind(window),s.serialize=function(e,t){let n=encodeURIComponent;return"?"+Object.keys(e).map(r=>(void 0!==t&&(r=t+"["+r+"]"),"object"==typeof e[r]?s.serlialize(e[r],r):n(r)+"="+n(e[r]))).join("&")},s.request=function(e,t,n,r={}){let o=Object.assign({method:e.toLowerCase(),headers:{Accept:"application/json","Content-Type":"application/json"}},s.options,r),i=o.headers.Accept;return void 0!==n&&("get"===o.method&&"object"==typeof n&&(t+=n=s.serialize(n)),"get"!==o.method&&(o.body=JSON.stringify(n))),s.fetch(s.parseUrl(t),o).then(e=>{if(e.status<200||e.status>300){let t=Error(e.statusText);throw t.response=e,t}return/text/gi.test(i)?e.text():/json/gi.test(i)?e.json():e})},s.parseUrl=function(e){let t=(s.baseUrl+"/"+e).trim().replace(/^\/\//gi,"/").trim();return s.isNode&&"string"==typeof s.nodeUrl&&(s.nodeUrl=s.nodeUrl.replace(/\/$/gi,"").trim(),/^http/gi.test(t)&&"string"==typeof s.apiUrl&&(s.apiUrl=s.apiUrl.replace(/\/$/gi,"").trim(),t=t.replace(s.apiUrl,s.nodeUrl)),/^http/gi.test(t)||(t=s.nodeUrl+t)),t},["get","post","put","patch","delete","options"].forEach(e=>s[e]=((t,n,r)=>s.request(e,t,n,r))),s};e.exports=r},function(e,t){e.exports=nodeFetch},function(e,t){e.exports=function(e){let t=e.document;function n(e,t,n={}){const r=Object.assign({},t,n);for(let p in r)o=e,i=p,a=n[p],(s=t[p])?a&&s===a||function(e,t,n){if("className"!==t){if("function"!=typeof n)return"boolean"==typeof n?(n&&e.setAttribute(t,n),void(e[t]=n)):void e.setAttribute(t,n);e[t]=n.bind(e)}else e.setAttribute("class",n)}(o,i,s):function(e,t,n){if("className"!==t){if("function"!=typeof n)return"boolean"==typeof n?(e.removeAttribute(t),void(e[t]=!1)):void e.removeAttribute(t);e[t]=void 0}else e.removeAttribute("class")}(o,i,a);var o,i,s,a}function r(e){var o=e&&e.name?"svg"===e.name?t.createElementNS("http://www.w3.org/2000/svg",e.name):t.createElement(e.name):t.createTextNode(e);if(e&&e.props&&n(o,e.props),e&&e.children)for(let t=0;t<e.children.length;t++)o.appendChild(r(e.children[t]));return o}return function e(t,o,i,s=0){if(i==o);else if(i)if(o){if(a=o,p=i,typeof a!=typeof p||a!=p||a.name!==p.name)t.replaceChild(r(o),t.childNodes[s]);else if(o.name){n(t.childNodes[s],o.props,i.props);const r=o.children.length,a=i.children.length;for(let n=0;n<r||n<a;n++)e(t.childNodes[s],o.children[n],i.children[n],n)}}else t.removeChild(t.childNodes[s]);else t.appendChild(r(o));var a,p;return t}}},function(e,t){e.exports=htmlElement}]);