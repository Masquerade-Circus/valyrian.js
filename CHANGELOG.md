### [5.0.8](https://github.com/Masquerade-Circus/valyrian.js/compare/5.0.7...5.0.8) (2020-12-08)


### Bug Fixes

* **router:** fix bug removing home unique slash ([9ae422f](https://github.com/Masquerade-Circus/valyrian.js/commit/9ae422feb70b0ba3097fcf64596d896638e7675a))
* **router/node:** allow urls ending in slash as a valid route. v.inline.css now only minifies wo map ([3047229](https://github.com/Masquerade-Circus/valyrian.js/commit/3047229871aa615696b9b29998d8301381eb67da))

### [5.0.7](https://github.com/Masquerade-Circus/valyrian.js/compare/5.0.6...5.0.7) (2020-12-07)

### Code Refactoring

*   **register:** update register hook. Update node plugin ([f62505c](https://github.com/Masquerade-Circus/valyrian.js/commit/f62505c6a6bb562e35f01b47ea62c8247cdbfe49))

### [5.0.6](https://github.com/Masquerade-Circus/valyrian.js/compare/5.0.5...5.0.6) (2020-12-04)

### Bug Fixes

*   **register.js:** add register.js to package.json files attribute ([d8f6674](https://github.com/Masquerade-Circus/valyrian.js/commit/d8f66746bfb37820a2fa90799aab0880837518b6))

### [5.0.5](https://github.com/Masquerade-Circus/valyrian.js/compare/5.0.4...5.0.5) (2020-12-04)

### Code Refactoring

*   **lib:** add register and improve node plugin ([b4fce5e](https://github.com/Masquerade-Circus/valyrian.js/commit/b4fce5ecd5a3f0c0ba684d6defd89768272f1ca2))

### [5.0.4](https://github.com/Masquerade-Circus/valyrian.js/compare/5.0.3...5.0.4) (2020-10-03)

### Code Refactoring

*   **request:** improve request plugin. Add more tests for request plugin ([5f9c4ab](https://github.com/Masquerade-Circus/valyrian.js/commit/5f9c4ab4b3ce221b51ed26eff4e95117f371f5c3))

### [5.0.3](https://github.com/Masquerade-Circus/valyrian.js/compare/5.0.3...5.0.4) (2020-10-01)

### Code Refactoring

*   **main:** major format changes. Remove travis. Remove codeclimate ([9635f52](https://github.com/Masquerade-Circus/valyrian.js/commit/9635f52d7ed1daae9e8ca06e56514f1a4c45a4b1))
*   **main:** remove coveralls dependency. Improve service worker ([781c2a1](https://github.com/Masquerade-Circus/valyrian.js/commit/781c2a1d5f938188920125cb85c594f148e75d8f))

### [5.0.2](https://github.com/Masquerade-Circus/valyrian.js/compare/5.0.3...5.0.4) (2020-09-27)

### Code Refactoring

*   **node:** allow require and import on dom.js file ([f7cb19a](https://github.com/Masquerade-Circus/valyrian.js/commit/f7cb19a1377eeda06fa2caa25225eda8351da2df))

### [5.0.1](https://github.com/Masquerade-Circus/valyrian.js/compare/5.0.3...5.0.4) (2020-09-27)

### Bug Fixes

*   **node:** fix icons generator. Improve sw. Improve htmlToHyperscript parser ([b38627b](https://github.com/Masquerade-Circus/valyrian.js/commit/b38627b922d9632f39d916ce97e1e355b7f23861))

## [5.0.0](https://github.com/Masquerade-Circus/valyrian.js/compare/5.0.3...5.0.4) (2020-09-24)

### Code Refactoring

*   **repo:** update dependencies. Changes in plugins ([b8c4f2b](https://github.com/Masquerade-Circus/valyrian.js/commit/b8c4f2ba88367666d25512f6d353d133f5735053))

### [4.3.2](https://github.com/Masquerade-Circus/valyrian.js/compare/5.0.3...5.0.4) (2020-08-05)

### Bug Fixes

*   **lib:** upgrade dependencies ([cc87ccd](https://github.com/Masquerade-Circus/valyrian.js/commit/cc87ccd218f9850de8c4f9f7b9599931d1ce451b))

### [4.3.1](https://github.com/Masquerade-Circus/valyrian.js/compare/5.0.3...5.0.4) (2020-04-10)

### Code Refactoring

*   **directives:** identify create or update event on directives by undefined oldvnode ([594960f](https://github.com/Masquerade-Circus/valyrian.js/commit/594960f0226d494d61a7917b37ff038f94370f06))

## [4.3.0](https://github.com/Masquerade-Circus/valyrian.js/compare/5.0.3...5.0.4) (2020-04-06)

### Features

*   **directives:** add v-model directive as plugin ([9f26926](https://github.com/Masquerade-Circus/valyrian.js/commit/9f269264ddcfba238571daefd5c2a08ed75f7fca))

### [4.2.3](https://github.com/Masquerade-Circus/valyrian.js/compare/5.0.3...5.0.4) (2020-04-04)

### Bug Fixes

*   **router:** fix v-route directive ([1247e9a](https://github.com/Masquerade-Circus/valyrian.js/commit/1247e9ab297f5e1fde8602d5280c8123032385d5))

### [4.2.2](https://github.com/Masquerade-Circus/valyrian.js/compare/5.0.3...5.0.4) (2020-04-04)

### Code Refactoring

*   **directives:** improved directives and attach v- before the name of the directive ([f2f11da](https://github.com/Masquerade-Circus/valyrian.js/commit/f2f11da0f8f2806d3314b1641e0c462982e9a437))

### [4.2.1](https://github.com/Masquerade-Circus/valyrian.js/compare/5.0.3...5.0.4) (2020-03-28)

### Bug Fixes

*   **main:** fix keyed lists not updating children ([56296fc](https://github.com/Masquerade-Circus/valyrian.js/commit/56296fc1365d2c96390f740af0c8942937e6f3e2))

### Code Refactoring

*   **directives:** remove v-text directive does not improve performance ([26c6780](https://github.com/Masquerade-Circus/valyrian.js/commit/26c6780f765d3a31e0cad881ea596cc4a6fc144e))

## [4.2.0](https://github.com/Masquerade-Circus/valyrian.js/compare/5.0.3...5.0.4) (2020-03-27)

### Features

*   **directives:** add v-pre directive to direct raw html render ([dc16e92](https://github.com/Masquerade-Circus/valyrian.js/commit/dc16e922bcefa1f84921b8f3cf6c07fe067d31e3))
*   **directives:** add v-text directive ([b6523ae](https://github.com/Masquerade-Circus/valyrian.js/commit/b6523ae211a3a1ee55ca82999645a19066418a67))

### Code Refactoring

*   **directives:** change model directive to data directive ([f2eaf8b](https://github.com/Masquerade-Circus/valyrian.js/commit/f2eaf8ba346f59a7603927e32c53cc8a905bffb7))
*   **directives:** change v-pre to v-html ([280cf58](https://github.com/Masquerade-Circus/valyrian.js/commit/280cf58f6e591d92549e6aa6655e32a0e0efd234))
*   **directives:** rename v-noop to v-once ([3159099](https://github.com/Masquerade-Circus/valyrian.js/commit/31590990e17d99d863e967e5bbdd89b79a14a5db))

### Tests

*   **directives:** add v-skip directive test ([6d50ecc](https://github.com/Masquerade-Circus/valyrian.js/commit/6d50ecc73bc61810a067e81267af3f85544826da))

## [4.1.0](https://github.com/Masquerade-Circus/valyrian.js/compare/5.0.3...5.0.4) (2020-03-20)

### Features

*   **main lib:** add newInstance method to allow to handle multiple mounts ([d09a2a6](https://github.com/Masquerade-Circus/valyrian.js/commit/d09a2a6ae35926d4010830f46da583d784ddcbc2))

### [4.0.2](https://github.com/Masquerade-Circus/valyrian.js/compare/5.0.3...5.0.4) (2020-03-06)

### Code Refactoring

*   **main lib:** remove v-list directive. Don't show null and undefined as text ([61e24fd](https://github.com/Masquerade-Circus/valyrian.js/commit/61e24fdff7fbeb67f995c9d2b52e55caa00da928))

### [4.0.1](https://github.com/Masquerade-Circus/valyrian.js/compare/5.0.3...5.0.4) (2020-01-26)

### Bug Fixes

*   **main:** fix replace error when the old node has been deleted or moved ([ba7b5c5](https://github.com/Masquerade-Circus/valyrian.js/commit/ba7b5c5d4d6b567f991bc0ac8d3ac237f44bfe8b))

## [4.0.0](https://github.com/Masquerade-Circus/valyrian.js/compare/5.0.3...5.0.4) (2020-01-26)

### ⚠ BREAKING CHANGES

*   **main:** Lifecycle methods renamed.

### Features

*   **main:** add a reserved model property to pass data to the vnodes ([496f3ce](https://github.com/Masquerade-Circus/valyrian.js/commit/496f3ce15d84b187cdaa897d415a77138120ae55))

### Bug Fixes

*   **main:** handle TextVnode as newVnode ([f29cec3](https://github.com/Masquerade-Circus/valyrian.js/commit/f29cec3c47310c2f4aa8719f5fd0659f52f8388d))
*   **main (directives):** fix use of v-if with v-for trigger an error ([dec8522](https://github.com/Masquerade-Circus/valyrian.js/commit/dec8522ec4328c7321d526fa77fb6bd308081541))
*   **main (keyed lists):** fix error replaced vnode with undefined node and updating with defined node ([782dbe7](https://github.com/Masquerade-Circus/valyrian.js/commit/782dbe77856965df3f18602ff4dd713ac622d949))

### Performance Improvements

*   **main:** increase performance for all new changes ([b4b1a0d](https://github.com/Masquerade-Circus/valyrian.js/commit/b4b1a0d440ba8d699827b5a155a2d877c69d6c47))

### improvement

*   **main:** rename lifecycle methods to write more easily in object props ([25b1eba](https://github.com/Masquerade-Circus/valyrian.js/commit/25b1eba52a34a54bcfdbf1e8304c0e7ad0de65b7))

### Tests

*   **signals tests:** fix signals tests, change deprecated v-remove to onremove lifecycle ([3da0f10](https://github.com/Masquerade-Circus/valyrian.js/commit/3da0f100666c6487bc58ca3ee022a15ed8793759))

### [3.3.4](https://github.com/Masquerade-Circus/valyrian.js/compare/5.0.3...5.0.4) (2020-01-24)

### Bug Fixes

*   fix release-it hooks order ([20ef775](https://github.com/Masquerade-Circus/valyrian.js/commit/20ef7754ed7108e5951d7b1981b67a44e2016082))

### Build System

*   add release-it to the repo ([2a75faa](https://github.com/Masquerade-Circus/valyrian.js/commit/2a75faa18565adf680c3f9088073f386ff9e69c6))

### [3.3.3](https://github.com/Masquerade-Circus/valyrian.js/compare/5.0.3...5.0.4) (2020-01-24)

### Bug Fixes

*   make if directives work with truthy and falsy values ([624eae6](https://github.com/Masquerade-Circus/valyrian.js/commit/624eae6f505229431adef59827d2afeb1b09a0fe))

### [3.3.2](https://github.com/Masquerade-Circus/valyrian.js/compare/5.0.3...5.0.4) (2020-01-24)

### Bug Fixes

*   fix v.trust not returning correct text dom ([32a52a8](https://github.com/Masquerade-Circus/valyrian.js/commit/32a52a86d02fb8ea165344d9f566deac9f349d5a))

### [3.3.1](https://github.com/Masquerade-Circus/valyrian.js/compare/5.0.3...5.0.4) (2020-01-22)

### Bug Fixes

*   fix cleanup not working correctly ([ff26b5b](https://github.com/Masquerade-Circus/valyrian.js/commit/ff26b5ba069b3c5a4c42c90a8e91fcec333967b5))

### Code Refactoring

*   improve performance and size. Add commitizen ([6cafa51](https://github.com/Masquerade-Circus/valyrian.js/commit/6cafa513d4db9e2e9f7e51811c7b8906f8b4b73c))

## [3.3.0](https://github.com/Masquerade-Circus/valyrian.js/compare/5.0.3...5.0.4) (2020-01-17)

## [3.2.0](https://github.com/Masquerade-Circus/valyrian.js/compare/5.0.3...5.0.4) (2019-11-21)

### [3.1.1](https://github.com/Masquerade-Circus/valyrian.js/compare/5.0.3...5.0.4) (2019-09-28)

## [3.1.0](https://github.com/Masquerade-Circus/valyrian.js/compare/5.0.3...5.0.4) (2019-09-27)

### [3.0.2](https://github.com/Masquerade-Circus/valyrian.js/compare/5.0.3...5.0.4) (2019-09-09)

### [3.0.1](https://github.com/Masquerade-Circus/valyrian.js/compare/5.0.3...5.0.4) (2019-09-09)

## [3.0.0](https://github.com/Masquerade-Circus/valyrian.js/compare/5.0.3...5.0.4) (2019-09-08)

## [2.7.0](https://github.com/Masquerade-Circus/valyrian.js/compare/5.0.3...5.0.4) (2019-03-09)

## [2.6.0](https://github.com/Masquerade-Circus/valyrian.js/compare/5.0.3...5.0.4) (2019-03-05)

### [2.5.3](https://github.com/Masquerade-Circus/valyrian.js/compare/5.0.3...5.0.4) (2019-03-05)

### [2.5.2](https://github.com/Masquerade-Circus/valyrian.js/compare/5.0.3...5.0.4) (2019-03-04)

### [2.5.1](https://github.com/Masquerade-Circus/valyrian.js/compare/5.0.3...5.0.4) (2019-03-04)

## [2.5.0](https://github.com/Masquerade-Circus/valyrian.js/compare/5.0.3...5.0.4) (2019-03-04)

### [2.4.2](https://github.com/Masquerade-Circus/valyrian.js/compare/5.0.3...5.0.4) (2019-03-01)

### [2.4.1](https://github.com/Masquerade-Circus/valyrian.js/compare/5.0.3...5.0.4) (2019-02-27)

## [2.4.0](https://github.com/Masquerade-Circus/valyrian.js/compare/5.0.3...5.0.4) (2019-02-27)

### [2.3.1](https://github.com/Masquerade-Circus/valyrian.js/compare/5.0.3...5.0.4) (2019-02-19)

## [2.3.0](https://github.com/Masquerade-Circus/valyrian.js/compare/5.0.3...5.0.4) (2019-02-16)

### [2.2.7](https://github.com/Masquerade-Circus/valyrian.js/compare/5.0.3...5.0.4) (2019-02-15)

### [2.2.6](https://github.com/Masquerade-Circus/valyrian.js/compare/5.0.3...5.0.4) (2019-02-15)

### [2.2.5](https://github.com/Masquerade-Circus/valyrian.js/compare/5.0.3...5.0.4) (2019-02-09)

### [2.2.4](https://github.com/Masquerade-Circus/valyrian.js/compare/5.0.3...5.0.4) (2019-02-09)

### [2.2.3](https://github.com/Masquerade-Circus/valyrian.js/compare/5.0.3...5.0.4) (2019-02-09)

### [2.2.2](https://github.com/Masquerade-Circus/valyrian.js/compare/5.0.3...5.0.4) (2019-02-08)

### [2.2.1](https://github.com/Masquerade-Circus/valyrian.js/compare/5.0.3...5.0.4) (2019-02-08)

## [2.2.0](https://github.com/Masquerade-Circus/valyrian.js/compare/5.0.3...5.0.4) (2019-02-07)

## [2.1.0](https://github.com/Masquerade-Circus/valyrian.js/compare/5.0.3...5.0.4) (2019-02-06)

### [2.0.4](https://github.com/Masquerade-Circus/valyrian.js/compare/5.0.3...5.0.4) (2018-09-15)

### [2.0.3](https://github.com/Masquerade-Circus/valyrian.js/compare/5.0.3...5.0.4) (2018-09-08)

### [2.0.2](https://github.com/Masquerade-Circus/valyrian.js/compare/5.0.3...5.0.4) (2018-09-08)

### [2.0.1](https://github.com/Masquerade-Circus/valyrian.js/compare/5.0.3...5.0.4) (2018-09-01)

## [2.0.0](https://github.com/Masquerade-Circus/valyrian.js/compare/5.0.3...5.0.4) (2018-09-01)

### [1.9.1](https://github.com/Masquerade-Circus/valyrian.js/compare/5.0.3...5.0.4) (2018-06-25)

## [1.9.0](https://github.com/Masquerade-Circus/valyrian.js/compare/5.0.3...5.0.4) (2018-06-22)

### [1.8.1](https://github.com/Masquerade-Circus/valyrian.js/compare/5.0.3...5.0.4) (2018-06-21)

## [1.8.0](https://github.com/Masquerade-Circus/valyrian.js/compare/5.0.3...5.0.4) (2018-06-20)

## [1.7.0](https://github.com/Masquerade-Circus/valyrian.js/compare/5.0.3...5.0.4) (2018-06-16)

### [1.6.1](https://github.com/Masquerade-Circus/valyrian.js/compare/5.0.3...5.0.4) (2018-06-16)

## [1.6.0](https://github.com/Masquerade-Circus/valyrian.js/compare/5.0.3...5.0.4) (2018-06-16)

## [1.5.0](https://github.com/Masquerade-Circus/valyrian.js/compare/5.0.3...5.0.4) (2018-06-16)

### [1.4.3](https://github.com/Masquerade-Circus/valyrian.js/compare/5.0.3...5.0.4) (2018-06-15)

### [1.4.2](https://github.com/Masquerade-Circus/valyrian.js/compare/5.0.3...5.0.4) (2018-06-15)

### [1.4.1](https://github.com/Masquerade-Circus/valyrian.js/compare/5.0.3...5.0.4) (2018-06-13)

## [1.4.0](https://github.com/Masquerade-Circus/valyrian.js/compare/5.0.3...5.0.4) (2018-06-13)

## [1.3.0](https://github.com/Masquerade-Circus/valyrian.js/compare/5.0.3...5.0.4) (2018-06-13)

### [1.2.1](https://github.com/Masquerade-Circus/valyrian.js/compare/5.0.3...5.0.4) (2018-06-13)

## [1.2.0](https://github.com/Masquerade-Circus/valyrian.js/compare/5.0.3...5.0.4) (2018-06-13)

### [1.1.3](https://github.com/Masquerade-Circus/valyrian.js/compare/5.0.3...5.0.4) (2018-06-12)

### [1.1.2](https://github.com/Masquerade-Circus/valyrian.js/compare/5.0.3...5.0.4) (2018-06-09)

### [1.1.1](https://github.com/Masquerade-Circus/valyrian.js/compare/5.0.3...5.0.4) (2018-06-08)

## [1.1.0](https://github.com/Masquerade-Circus/valyrian.js/compare/5.0.3...5.0.4) (2018-06-01)

### [1.0.5](https://github.com/Masquerade-Circus/valyrian.js/compare/5.0.3...5.0.4) (2018-05-31)

### [1.0.4](https://github.com/Masquerade-Circus/valyrian.js/compare/5.0.3...5.0.4) (2018-05-31)

### [1.0.3](https://github.com/Masquerade-Circus/valyrian.js/compare/5.0.3...5.0.4) (2018-05-31)

### [1.0.2](https://github.com/Masquerade-Circus/valyrian.js/compare/5.0.3...5.0.4) (2018-05-31)

### [1.0.1](https://github.com/Masquerade-Circus/valyrian.js/compare/5.0.3...5.0.4) (2018-05-31)

## [1.0.0](https://github.com/Masquerade-Circus/valyrian.js/compare/5.0.3...5.0.4) (2018-05-25)

### [0.0.3](https://github.com/Masquerade-Circus/valyrian.js/compare/5.0.3...5.0.4) (2018-04-17)

### [0.0.2](https://github.com/Masquerade-Circus/valyrian.js/compare/5.0.3...5.0.4) (2018-04-17)
