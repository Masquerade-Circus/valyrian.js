import swTpl from './sw.tpl.js';

let NodeFactory = function(v){
    let fs = require('fs');
    let uncss = require('uncss');

    function fileMethodFactory(){
        let prop = '';
        return function(file) {
            if (!file){
                return prop;
            }
    
            prop += fs.readFileSync(file,'utf8');
        }
    };

    v.inline = {
        css: fileMethodFactory(),
        js: fileMethodFactory(),
        uncss(renderedHtml, options = {}){
            options.raw = v.inline.css();
            return Promise.all(renderedHtml)
                .then(html => {
                    return new Promise((resolve, reject) => {
                        uncss(html, options, (err, output) => {
                            if (err){
                                reject(err);
                            }
                            resolve(output);
                        });
                    });
                });
        }
    };

    v.sw = {
        create(file, options = {}){
            let opt = Object.assign({
                version: 'v1::',
                name: 'Valyrian.js',
                urls: ['/'],
                debug: false
            }, options);

            let contents = swTpl
                .replace('v1::', 'v'+opt.version+'::')
                .replace('Valyrian.js', opt.name)
                .replace('[\'/\']', '["'+opt.urls.join('","')+'"]');

            if (!opt.debug){
                contents = contents.replace('console.log', '() => {}');
            }

            fs.writeFileSync(file,contents,'utf8');
        }
    };
};

export default NodeFactory;