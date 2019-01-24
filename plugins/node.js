(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
    typeof define === 'function' && define.amd ? define(factory) :
    (global = global || self, (global['node-plugin'] = global['node-plugin'] || {}, global['node-plugin'].js = factory()));
}(this, function () { 'use strict';

    var swTpl = "let Log = console.log;\n\nlet config = {\n    version: 'v1::',\n    name: 'Valyrian.js',\n    urls: ['/']\n};\n\n// Function to add the network response to the cache\nlet fetchedFromNetwork = event => response => {\n    Log('WORKER: fetch response from network.', event.request.url);\n    if (!response || response.status !== 200 || response.type !== 'basic') {\n        return;\n    }\n\n    let cacheCopy = response.clone();\n    caches\n        .open(config.version + config.name)\n        .then(cache => cache.put(event.request, cacheCopy))\n        .then(() => Log('WORKER: fetch response stored in cache.', event.request.url));\n    return response;\n};\n\n// If the network or the cache response fail, response with Service Unavailable\nlet unableToResolve = () => {\n    Log('WORKER: fetch request failed in both cache and network.');\n    return new Response('<h1>Service Unavailable</h1>', {\n        status: 503,\n        statusText: 'Service Unavailable',\n        headers: new Headers({\n            'Content-Type': 'text/html'\n        })\n    });\n};\n\n// Fetch listener\nself.addEventListener(\"fetch\", event => {\n    Log('WORKER: fetch event in progress.', event.request.url);\n\n    let url = new URL(event.request.url);\n\n    // We only handle Get requests all others let them pass\n    if (event.request.method !== 'GET') {\n        return;\n    }\n\n    // TODO: Make a callback available here to filter if this request must be catched or let it pass directly\n    // This callback must return true or false\n\n    Log('WORKER: fetchevent for ' + url);\n\n    event.respondWith(\n        caches.match(event.request).then(cached => {\n            Log('WORKER: fetch event', cached ? '(cached)' : '(network)', event.request.url);\n\n            let network = fetch(event.request)\n                .then(fetchedFromNetwork(event), unableToResolve)\n                .catch(error => {\n                    console.log(error);\n                    return caches.match('/');\n                });\n\n            return network || cached;\n        })\n    );\n});\n\nself.addEventListener(\"install\", event => {\n    event.waitUntil(\n        // We can't use cache.add() here, since we want OFFLINE_URL to be the cache key, but\n        // the actual URL we end up requesting might include a cache-busting parameter.\n        caches.open(config.version + config.name)\n            .then(cache => cache.addAll(config.urls))\n            .catch(error => console.error('WORKER: Failed to cache', error))\n    );\n});\n\nself.addEventListener(\"activate\", event => {\n    event.waitUntil(\n        caches.keys()\n            .then(keys => Promise.all(\n                keys.filter(key => !key.startsWith(config.version)) // Filter by keys that don't start with the latest version prefix.\n                    .map(key => caches.delete(key)) // Return a promise that's fulfilled when each outdated cache is deleted.\n            ))\n            .then(() => self.clients.claim())\n    );\n});\n";

    function assign(obj, props) {
    	for (var i in props) { obj[i] = props[i]; }
    }

    function toLower(str) {
    	return String(str).toLowerCase();
    }

    function splice(arr, item, add, byValueOnly) {
    	var i = arr ? findWhere(arr, item, true, byValueOnly) : -1;
    	if (~i) { add ? arr.splice(i, 0, add) : arr.splice(i, 1); }
    	return i;
    }

    function findWhere(arr, fn, returnIndex, byValueOnly) {
    	var i = arr.length;
    	while (i--) { if (typeof fn==='function' && !byValueOnly ? fn(arr[i]) : arr[i]===fn) { break; } }
    	return returnIndex ? i : arr[i];
    }

    function createAttributeFilter(ns, name) {
    	return function (o) { return o.ns===ns && toLower(o.name)===toLower(name); };
    }

    /*
    const NODE_TYPES = {
    	ELEMENT_NODE: 1,
    	ATTRIBUTE_NODE: 2,
    	TEXT_NODE: 3,
    	CDATA_SECTION_NODE: 4,
    	ENTITY_REFERENCE_NODE: 5,
    	COMMENT_NODE: 6,
    	PROCESSING_INSTRUCTION_NODE: 7,
    	DOCUMENT_NODE: 9
    };
    */


    /** Create a minimally viable DOM Document
     *	@returns {Document} document
     */
    function undom() {

    	function isElement(node) {
    		return node.nodeType===1;
    	}

    	var Node = function Node(nodeType, nodeName) {
    		this.nodeType = nodeType;
    		this.nodeName = nodeName;
    		this.childNodes = [];
    	};

    	var prototypeAccessors = { nextSibling: { configurable: true },previousSibling: { configurable: true },firstChild: { configurable: true },lastChild: { configurable: true } };
    	prototypeAccessors.nextSibling.get = function () {
    		var p = this.parentNode;
    		if (p) { return p.childNodes[findWhere(p.childNodes, this, true) + 1]; }
    	};
    	prototypeAccessors.previousSibling.get = function () {
    		var p = this.parentNode;
    		if (p) { return p.childNodes[findWhere(p.childNodes, this, true) - 1]; }
    	};
    	prototypeAccessors.firstChild.get = function () {
    		return this.childNodes[0];
    	};
    	prototypeAccessors.lastChild.get = function () {
    		return this.childNodes[this.childNodes.length-1];
    	};
    	Node.prototype.appendChild = function appendChild (child) {
    		this.insertBefore(child);
    		return child;
    	};
    	Node.prototype.insertBefore = function insertBefore (child, ref) {
    		child.remove();
    		child.parentNode = this;
    		!ref ? this.childNodes.push(child) : splice(this.childNodes, ref, child);
    		return child;
    	};
    	Node.prototype.replaceChild = function replaceChild (child, ref) {
    		if (ref.parentNode===this) {
    			this.insertBefore(child, ref);
    			ref.remove();
    			return ref;
    		}
    	};
    	Node.prototype.removeChild = function removeChild (child) {
    		splice(this.childNodes, child);
    		return child;
    	};
    	Node.prototype.remove = function remove () {
    		if (this.parentNode) { this.parentNode.removeChild(this); }
    	};

    	Object.defineProperties( Node.prototype, prototypeAccessors );


    	var Text = /*@__PURE__*/(function (Node) {
    		function Text(text) {
    			Node.call(this, 3, '#text');					// TEXT_NODE
    			this.nodeValue = text;
    		}

    		if ( Node ) Text.__proto__ = Node;
    		Text.prototype = Object.create( Node && Node.prototype );
    		Text.prototype.constructor = Text;

    		var prototypeAccessors$1 = { textContent: { configurable: true } };
    		prototypeAccessors$1.textContent.set = function (text) {
    			this.nodeValue = text;
    		};
    		prototypeAccessors$1.textContent.get = function () {
    			return this.nodeValue;
    		};

    		Object.defineProperties( Text.prototype, prototypeAccessors$1 );

    		return Text;
    	}(Node));


    	var Element = /*@__PURE__*/(function (Node) {
    		function Element(nodeType, nodeName) {
    			var this$1 = this;

    			Node.call(this, nodeType || 1, nodeName);		// ELEMENT_NODE
    			this.attributes = [];
    			this.__handlers = {};
    			this.style = {};
    			Object.defineProperty(this, 'className', {
    				set: function (val) { this$1.setAttribute('class', val); },
    				get: function () { return this$1.getAttribute('class'); }
    			});
    			Object.defineProperty(this.style, 'cssText', {
    				set: function (val) { this$1.setAttribute('style', val); },
    				get: function () { return this$1.getAttribute('style'); }
    			});
    		}

    		if ( Node ) Element.__proto__ = Node;
    		Element.prototype = Object.create( Node && Node.prototype );
    		Element.prototype.constructor = Element;

    		var prototypeAccessors$2 = { children: { configurable: true } };

    		prototypeAccessors$2.children.get = function () {
    			return this.childNodes.filter(isElement);
    		};

    		Element.prototype.setAttribute = function setAttribute (key, value) {
    			this.setAttributeNS(null, key, value);
    		};
    		Element.prototype.getAttribute = function getAttribute (key) {
    			return this.getAttributeNS(null, key);
    		};
    		Element.prototype.removeAttribute = function removeAttribute (key) {
    			this.removeAttributeNS(null, key);
    		};

    		Element.prototype.setAttributeNS = function setAttributeNS (ns, name, value) {
    			var attr = findWhere(this.attributes, createAttributeFilter(ns, name));
    			if (!attr) { this.attributes.push(attr = { ns: ns, name: name }); }
    			attr.value = String(value);
    		};
    		Element.prototype.getAttributeNS = function getAttributeNS (ns, name) {
    			var attr = findWhere(this.attributes, createAttributeFilter(ns, name));
    			return attr && attr.value;
    		};
    		Element.prototype.removeAttributeNS = function removeAttributeNS (ns, name) {
    			splice(this.attributes, createAttributeFilter(ns, name));
    		};

    		Element.prototype.addEventListener = function addEventListener (type, handler) {
    			(this.__handlers[toLower(type)] || (this.__handlers[toLower(type)] = [])).push(handler);
    		};
    		Element.prototype.removeEventListener = function removeEventListener (type, handler) {
    			splice(this.__handlers[toLower(type)], handler, 0, true);
    		};
    		Element.prototype.dispatchEvent = function dispatchEvent (event) {
    			var t = event.target = this,
    				c = event.cancelable,
    				l, i;
    			do {
    				event.currentTarget = t;
    				l = t.__handlers && t.__handlers[toLower(event.type)];
    				if (l) { for (i=l.length; i--; ) {
    					if ((l[i].call(t, event) === false || event._end) && c) {
    						event.defaultPrevented = true;
    					}
    				} }
    			} while (event.bubbles && !(c && event._stop) && (t=t.parentNode));
    			return l!=null;
    		};

    		Object.defineProperties( Element.prototype, prototypeAccessors$2 );

    		return Element;
    	}(Node));


    	var Document = /*@__PURE__*/(function (Element) {
    		function Document() {
    			Element.call(this, 9, '#document');			// DOCUMENT_NODE
    		}

    		if ( Element ) Document.__proto__ = Element;
    		Document.prototype = Object.create( Element && Element.prototype );
    		Document.prototype.constructor = Document;

    		return Document;
    	}(Element));


    	var Event = function Event(type, opts) {
    		this.type = type;
    		this.bubbles = !!(opts && opts.bubbles);
    		this.cancelable = !!(opts && opts.cancelable);
    	};
    	Event.prototype.stopPropagation = function stopPropagation () {
    		this._stop = true;
    	};
    	Event.prototype.stopImmediatePropagation = function stopImmediatePropagation () {
    		this._end = this._stop = true;
    	};
    	Event.prototype.preventDefault = function preventDefault () {
    		this.defaultPrevented = true;
    	};


    	function createElement(type) {
    		return new Element(null, String(type).toUpperCase());
    	}


    	function createElementNS(ns, type) {
    		var element = createElement(type);
    		element.namespace = ns;
    		return element;
    	}


    	function createTextNode(text) {
    		return new Text(text);
    	}


    	function createDocument() {
    		var document = new Document();
    		assign(document, document.defaultView = { document: document, Document: Document, Node: Node, Text: Text, Element: Element, SVGElement:Element, Event: Event });
    		assign(document, { createElement: createElement, createElementNS: createElementNS, createTextNode: createTextNode });
    		document.appendChild(
    			document.documentElement = createElement('html')
    		);
    		document.documentElement.appendChild(
    			document.head = createElement('head')
    		);
    		document.documentElement.appendChild(
    			document.body = createElement('body')
    		);
    		return document;
    	}


    	return createDocument();
    }

    var cssnano = require('cssnano');
    var CleanCSS = require('clean-css');

    global.fetch = require('node-fetch');
    global.document = undom();

    var fs = require('fs'),
        uncss = require('uncss'),
        errorHandler = function (resolve, reject) { return function (err) {
            if (err) {
                return reject(err);
            }

            resolve();
        }; };

    function fileMethodFactory() {
        var prop = '';
        return function (file) {
            if (!file) {
                return prop;
            }

            if (/^https?:\/\//gi.test(file)) {
                return v.request.get(file, {}, {
                    headers: {
                        'Accept': 'text/plain',
                        'Content-Type': 'text/plain'
                    }
                })
                    .then(function (contents) {
                        prop += contents;
                    });
            }

            return new Promise(function (resolve, reject) {
                fs.readFile(file, 'utf8', function (err, contents) {
                    if (err) {
                        return reject(err);
                    }

                    prop += contents;
                    resolve(prop);
                });
            });
        };
    }
    function inline() {
        var args = [], len = arguments.length;
        while ( len-- ) args[ len ] = arguments[ len ];

        var promises = args.map(function (item) {
            var ext = item.split('.').pop();
            if (!inline[ext]) {
                inline[ext] = fileMethodFactory();
            }
            return inline[ext](item);
        });

        return Promise.all(promises);
    }
    inline.uncss = (function () {
        var prop = '';
        return function (renderedHtml, options) {
            if ( options === void 0 ) options = {};

            if (!renderedHtml) {
                return prop;
            }

            var opt = Object.assign({
                minify: true
            }, options);

            opt.raw = inline.css();
            return Promise.all(renderedHtml)
                .then(function (html) {
                    html.forEach(function (item, index) {
                        html[index] = item.replace(/<script [^>]*><\/script>/gi, '');
                    });

                    return new Promise(function (resolve, reject) {
                        uncss(html, opt, function (err, output) {
                            if (err) {
                                return reject(err);
                            }

                            if (!opt.minify) {
                                prop = output;
                                return resolve(output);
                            }

                            output = new CleanCSS({
                                level: {
                                    1: {
                                        roundingPrecision: 'all=3', // rounds pixel values to `N` decimal places; `false` disables rounding; defaults to `false`
                                        specialComments: 'none' // denotes a number of /*! ... */ comments preserved; defaults to `all`
                                    },
                                    2: {
                                        restructureRules: true // controls rule restructuring; defaults to false
                                    }
                                },
                                compatibility: 'ie11'
                            }).minify(output).styles;

                            cssnano.process(output).then(function (result) {
                                prop = result.css;
                                resolve(prop);
                            });
                        });
                    });
                });
        };
    }());


    function sw(file, options) {
        if ( options === void 0 ) options = {};

        var opt = Object.assign({
                version: 'v1::',
                name: 'Valyrian.js',
                urls: ['/'],
                debug: false
            }, options),
            contents = swTpl
                .replace('v1::', 'v' + opt.version + '::')
                .replace('Valyrian.js', opt.name)
                .replace('[\'/\']', '["' + opt.urls.join('","') + '"]');

        if (!opt.debug) {
            contents = contents.replace('console.log', '() => {}');
        }

        return new Promise(function (resolve, reject) {
            fs.writeFile(file, contents, 'utf8', errorHandler(resolve, reject));
        });
    }

    function icons(source, configuration) {
        if ( configuration === void 0 ) configuration = {};

        var favicons = require('favicons'),
            html2hs = require('html2hs'),
            options = Object.assign({}, icons.options, configuration);

        if (options.iconsPath) {
            options.iconsPath = options.iconsPath.replace(/\/$/gi, '') + '/';
        }

        if (options.iconsPath) {
            options.linksViewPath = options.linksViewPath.replace(/\/$/gi, '') + '/';
        }

        return new Promise(function (resolve, reject) {
            favicons(source, options, function (err, response) {
                if (err) {
                    process.stdout.write(err.status + '\n'); // HTTP error code (e.g. `200`) or `null`
                    process.stdout.write(err.name + '\n'); // Error name e.g. "API Error"
                    process.stdout.write(err.message + '\n'); // Error description e.g. "An unknown error has occurred"

                    return reject(err);
                }

                var promises = [];

                if (options.iconsPath) {
                    var loop = function ( i ) {
                        promises.push(new Promise(function (resolve, reject) {
                            fs.writeFile(options.iconsPath + response.images[i].name, response.images[i].contents, errorHandler(resolve, reject));
                        }));
                    };

                    for (var i in response.images) loop( i );

                    var loop$1 = function ( i ) {
                        promises.push(new Promise(function (resolve, reject) {
                            fs.writeFile(options.iconsPath + response.files[i$1].name, response.files[i$1].contents, errorHandler(resolve, reject));
                        }));
                    };

                    for (var i$1 in response.files) loop$1( i );
                }

                if (options.linksViewPath) {
                    var html = 'export default { \n    view(){ \n        return [';
                    for (var i$2 in response.html) {
                        html += '\n            ' + html2hs(response.html[i$2]) + ',';
                    }
                    html = html.replace(/,$/gi, '').replace(/h\("/gi, 'v("') + '\n        ];\n    }\n};';

                    promises.push(new Promise(function (resolve, reject) {
                        fs.writeFile(((options.linksViewPath) + "/links.js"), html, errorHandler(resolve, reject));
                    }));
                }

                Promise.all(promises)
                    .then(function () {
                        resolve(response);
                    })
                    .catch(reject);
            });
        });
    }
    icons.options = {
        iconsPath: null, // Path to the generated icons
        linksViewPath: null, // Path to the generated links file

        // favicons options
        path: '', // Path for overriding default icons path. `string`
        appName: null, // Your application's name. `string`
        appDescription: null, // Your application's description. `string`
        developerName: null, // Your (or your developer's) name. `string`
        developerURL: null,
        dir: 'auto',
        lang: 'en-US',
        background: '#fff', // Background colour for flattened icons. `string`
        theme_color: '#fff',
        display: "standalone", // Android display: "browser" or "standalone". `string`
        orientation: "any", // Android orientation: "any" "portrait" or "landscape". `string`
        start_url: "/", // Android start application's URL. `string`
        version: '1.0', // Your application's version number. `number`
        logging: false, // Print logs to console? `boolean`
        icons: {
            android: true, // Create Android homescreen icon. `boolean`
            appleIcon: true, // Create Apple touch icons. `boolean` or `{ offset: offsetInPercentage }`
            appleStartup: true, // Create Apple startup images. `boolean`
            coast: false, // Create Opera Coast icon with offset 25%. `boolean` or `{ offset: offsetInPercentage }`
            favicons: true, // Create regular favicons. `boolean`
            firefox: false, // Create Firefox OS icons. `boolean` or `{ offset: offsetInPercentage }`
            windows: true, // Create Windows 8 tile icons. `boolean`
            yandex: false // Create Yandex browser icon. `boolean`
        }
    };

    var plugin = function (v) {
        v.inline = inline;
        v.sw = sw;
        v.icons = icons;
    };

    return plugin;

}));
