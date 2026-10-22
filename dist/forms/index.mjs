// lib/forms/index.ts
import { directive, setAttribute } from "valyrian.js";
import { createPulseStore } from "valyrian.js/pulses";
import { hasLength, isString } from "valyrian.js/utils";

// node_modules/schema-shield/dist/index.mjs
var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var __publicField = (obj, key, value) => {
  __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
  return value;
};
var __accessCheck = (obj, member, msg) => {
  if (!member.has(obj))
    throw TypeError("Cannot " + msg);
};
var __privateAdd = (obj, member, value) => {
  if (member.has(obj))
    throw TypeError("Cannot add the same private member more than once");
  member instanceof WeakSet ? member.add(obj) : member.set(obj, value);
};
var __privateMethod = (obj, member, method) => {
  __accessCheck(obj, member, "access private method");
  return method;
};
var require_official_meta_schemas = __commonJS({
  "lib/official-meta-schemas.json"(exports, module) {
    module.exports = {
      draft4: {
        id: "http://json-schema.org/draft-04/schema#",
        $schema: "http://json-schema.org/draft-04/schema#",
        description: "Core schema meta-schema",
        definitions: {
          schemaArray: {
            type: "array",
            minItems: 1,
            items: {
              $ref: "#"
            }
          },
          positiveInteger: {
            type: "integer",
            minimum: 0
          },
          positiveIntegerDefault0: {
            allOf: [
              {
                $ref: "#/definitions/positiveInteger"
              },
              {
                default: 0
              }
            ]
          },
          simpleTypes: {
            enum: [
              "array",
              "boolean",
              "integer",
              "null",
              "number",
              "object",
              "string"
            ]
          },
          stringArray: {
            type: "array",
            items: {
              type: "string"
            },
            minItems: 1,
            uniqueItems: true
          }
        },
        type: "object",
        properties: {
          id: {
            type: "string"
          },
          $schema: {
            type: "string"
          },
          title: {
            type: "string"
          },
          description: {
            type: "string"
          },
          default: {},
          multipleOf: {
            type: "number",
            minimum: 0,
            exclusiveMinimum: true
          },
          maximum: {
            type: "number"
          },
          exclusiveMaximum: {
            type: "boolean",
            default: false
          },
          minimum: {
            type: "number"
          },
          exclusiveMinimum: {
            type: "boolean",
            default: false
          },
          maxLength: {
            $ref: "#/definitions/positiveInteger"
          },
          minLength: {
            $ref: "#/definitions/positiveIntegerDefault0"
          },
          pattern: {
            type: "string",
            format: "regex"
          },
          additionalItems: {
            anyOf: [
              {
                type: "boolean"
              },
              {
                $ref: "#"
              }
            ],
            default: {}
          },
          items: {
            anyOf: [
              {
                $ref: "#"
              },
              {
                $ref: "#/definitions/schemaArray"
              }
            ],
            default: {}
          },
          maxItems: {
            $ref: "#/definitions/positiveInteger"
          },
          minItems: {
            $ref: "#/definitions/positiveIntegerDefault0"
          },
          uniqueItems: {
            type: "boolean",
            default: false
          },
          maxProperties: {
            $ref: "#/definitions/positiveInteger"
          },
          minProperties: {
            $ref: "#/definitions/positiveIntegerDefault0"
          },
          required: {
            $ref: "#/definitions/stringArray"
          },
          additionalProperties: {
            anyOf: [
              {
                type: "boolean"
              },
              {
                $ref: "#"
              }
            ],
            default: {}
          },
          definitions: {
            type: "object",
            additionalProperties: {
              $ref: "#"
            },
            default: {}
          },
          properties: {
            type: "object",
            additionalProperties: {
              $ref: "#"
            },
            default: {}
          },
          patternProperties: {
            type: "object",
            additionalProperties: {
              $ref: "#"
            },
            default: {}
          },
          dependencies: {
            type: "object",
            additionalProperties: {
              anyOf: [
                {
                  $ref: "#"
                },
                {
                  $ref: "#/definitions/stringArray"
                }
              ]
            }
          },
          enum: {
            type: "array",
            minItems: 1,
            uniqueItems: true
          },
          type: {
            anyOf: [
              {
                $ref: "#/definitions/simpleTypes"
              },
              {
                type: "array",
                items: {
                  $ref: "#/definitions/simpleTypes"
                },
                minItems: 1,
                uniqueItems: true
              }
            ]
          },
          format: {
            type: "string"
          },
          allOf: {
            $ref: "#/definitions/schemaArray"
          },
          anyOf: {
            $ref: "#/definitions/schemaArray"
          },
          oneOf: {
            $ref: "#/definitions/schemaArray"
          },
          not: {
            $ref: "#"
          }
        },
        dependencies: {
          exclusiveMaximum: [
            "maximum"
          ],
          exclusiveMinimum: [
            "minimum"
          ]
        },
        default: {}
      },
      draft6: {
        $schema: "http://json-schema.org/draft-06/schema#",
        $id: "http://json-schema.org/draft-06/schema#",
        title: "Core schema meta-schema",
        definitions: {
          schemaArray: {
            type: "array",
            minItems: 1,
            items: {
              $ref: "#"
            }
          },
          nonNegativeInteger: {
            type: "integer",
            minimum: 0
          },
          nonNegativeIntegerDefault0: {
            allOf: [
              {
                $ref: "#/definitions/nonNegativeInteger"
              },
              {
                default: 0
              }
            ]
          },
          simpleTypes: {
            enum: [
              "array",
              "boolean",
              "integer",
              "null",
              "number",
              "object",
              "string"
            ]
          },
          stringArray: {
            type: "array",
            items: {
              type: "string"
            },
            uniqueItems: true,
            default: []
          }
        },
        type: [
          "object",
          "boolean"
        ],
        properties: {
          $id: {
            type: "string",
            format: "uri-reference"
          },
          $schema: {
            type: "string",
            format: "uri"
          },
          $ref: {
            type: "string",
            format: "uri-reference"
          },
          title: {
            type: "string"
          },
          description: {
            type: "string"
          },
          default: {},
          examples: {
            type: "array",
            items: {}
          },
          multipleOf: {
            type: "number",
            exclusiveMinimum: 0
          },
          maximum: {
            type: "number"
          },
          exclusiveMaximum: {
            type: "number"
          },
          minimum: {
            type: "number"
          },
          exclusiveMinimum: {
            type: "number"
          },
          maxLength: {
            $ref: "#/definitions/nonNegativeInteger"
          },
          minLength: {
            $ref: "#/definitions/nonNegativeIntegerDefault0"
          },
          pattern: {
            type: "string",
            format: "regex"
          },
          additionalItems: {
            $ref: "#"
          },
          items: {
            anyOf: [
              {
                $ref: "#"
              },
              {
                $ref: "#/definitions/schemaArray"
              }
            ],
            default: {}
          },
          maxItems: {
            $ref: "#/definitions/nonNegativeInteger"
          },
          minItems: {
            $ref: "#/definitions/nonNegativeIntegerDefault0"
          },
          uniqueItems: {
            type: "boolean",
            default: false
          },
          contains: {
            $ref: "#"
          },
          maxProperties: {
            $ref: "#/definitions/nonNegativeInteger"
          },
          minProperties: {
            $ref: "#/definitions/nonNegativeIntegerDefault0"
          },
          required: {
            $ref: "#/definitions/stringArray"
          },
          additionalProperties: {
            $ref: "#"
          },
          definitions: {
            type: "object",
            additionalProperties: {
              $ref: "#"
            },
            default: {}
          },
          properties: {
            type: "object",
            additionalProperties: {
              $ref: "#"
            },
            default: {}
          },
          patternProperties: {
            type: "object",
            additionalProperties: {
              $ref: "#"
            },
            propertyNames: {
              format: "regex"
            },
            default: {}
          },
          dependencies: {
            type: "object",
            additionalProperties: {
              anyOf: [
                {
                  $ref: "#"
                },
                {
                  $ref: "#/definitions/stringArray"
                }
              ]
            }
          },
          propertyNames: {
            $ref: "#"
          },
          const: {},
          enum: {
            type: "array",
            minItems: 1,
            uniqueItems: true
          },
          type: {
            anyOf: [
              {
                $ref: "#/definitions/simpleTypes"
              },
              {
                type: "array",
                items: {
                  $ref: "#/definitions/simpleTypes"
                },
                minItems: 1,
                uniqueItems: true
              }
            ]
          },
          format: {
            type: "string"
          },
          allOf: {
            $ref: "#/definitions/schemaArray"
          },
          anyOf: {
            $ref: "#/definitions/schemaArray"
          },
          oneOf: {
            $ref: "#/definitions/schemaArray"
          },
          not: {
            $ref: "#"
          }
        },
        default: {}
      },
      draft7: {
        $schema: "http://json-schema.org/draft-07/schema#",
        $id: "http://json-schema.org/draft-07/schema#",
        title: "Core schema meta-schema",
        definitions: {
          schemaArray: {
            type: "array",
            minItems: 1,
            items: {
              $ref: "#"
            }
          },
          nonNegativeInteger: {
            type: "integer",
            minimum: 0
          },
          nonNegativeIntegerDefault0: {
            allOf: [
              {
                $ref: "#/definitions/nonNegativeInteger"
              },
              {
                default: 0
              }
            ]
          },
          simpleTypes: {
            enum: [
              "array",
              "boolean",
              "integer",
              "null",
              "number",
              "object",
              "string"
            ]
          },
          stringArray: {
            type: "array",
            items: {
              type: "string"
            },
            uniqueItems: true,
            default: []
          }
        },
        type: [
          "object",
          "boolean"
        ],
        properties: {
          $id: {
            type: "string",
            format: "uri-reference"
          },
          $schema: {
            type: "string",
            format: "uri"
          },
          $ref: {
            type: "string",
            format: "uri-reference"
          },
          $comment: {
            type: "string"
          },
          title: {
            type: "string"
          },
          description: {
            type: "string"
          },
          default: true,
          readOnly: {
            type: "boolean",
            default: false
          },
          writeOnly: {
            type: "boolean",
            default: false
          },
          examples: {
            type: "array",
            items: true
          },
          multipleOf: {
            type: "number",
            exclusiveMinimum: 0
          },
          maximum: {
            type: "number"
          },
          exclusiveMaximum: {
            type: "number"
          },
          minimum: {
            type: "number"
          },
          exclusiveMinimum: {
            type: "number"
          },
          maxLength: {
            $ref: "#/definitions/nonNegativeInteger"
          },
          minLength: {
            $ref: "#/definitions/nonNegativeIntegerDefault0"
          },
          pattern: {
            type: "string",
            format: "regex"
          },
          additionalItems: {
            $ref: "#"
          },
          items: {
            anyOf: [
              {
                $ref: "#"
              },
              {
                $ref: "#/definitions/schemaArray"
              }
            ],
            default: true
          },
          maxItems: {
            $ref: "#/definitions/nonNegativeInteger"
          },
          minItems: {
            $ref: "#/definitions/nonNegativeIntegerDefault0"
          },
          uniqueItems: {
            type: "boolean",
            default: false
          },
          contains: {
            $ref: "#"
          },
          maxProperties: {
            $ref: "#/definitions/nonNegativeInteger"
          },
          minProperties: {
            $ref: "#/definitions/nonNegativeIntegerDefault0"
          },
          required: {
            $ref: "#/definitions/stringArray"
          },
          additionalProperties: {
            $ref: "#"
          },
          definitions: {
            type: "object",
            additionalProperties: {
              $ref: "#"
            },
            default: {}
          },
          properties: {
            type: "object",
            additionalProperties: {
              $ref: "#"
            },
            default: {}
          },
          patternProperties: {
            type: "object",
            additionalProperties: {
              $ref: "#"
            },
            propertyNames: {
              format: "regex"
            },
            default: {}
          },
          dependencies: {
            type: "object",
            additionalProperties: {
              anyOf: [
                {
                  $ref: "#"
                },
                {
                  $ref: "#/definitions/stringArray"
                }
              ]
            }
          },
          propertyNames: {
            $ref: "#"
          },
          const: true,
          enum: {
            type: "array",
            items: true,
            minItems: 1,
            uniqueItems: true
          },
          type: {
            anyOf: [
              {
                $ref: "#/definitions/simpleTypes"
              },
              {
                type: "array",
                items: {
                  $ref: "#/definitions/simpleTypes"
                },
                minItems: 1,
                uniqueItems: true
              }
            ]
          },
          format: {
            type: "string"
          },
          contentMediaType: {
            type: "string"
          },
          contentEncoding: {
            type: "string"
          },
          if: {
            $ref: "#"
          },
          then: {
            $ref: "#"
          },
          else: {
            $ref: "#"
          },
          allOf: {
            $ref: "#/definitions/schemaArray"
          },
          anyOf: {
            $ref: "#/definitions/schemaArray"
          },
          oneOf: {
            $ref: "#/definitions/schemaArray"
          },
          not: {
            $ref: "#"
          }
        },
        default: true
      },
      draft2019: {
        $schema: "https://json-schema.org/draft/2019-09/schema",
        $id: "https://json-schema.org/draft/2019-09/schema",
        $vocabulary: {
          "https://json-schema.org/draft/2019-09/vocab/core": true,
          "https://json-schema.org/draft/2019-09/vocab/applicator": true,
          "https://json-schema.org/draft/2019-09/vocab/validation": true,
          "https://json-schema.org/draft/2019-09/vocab/meta-data": true,
          "https://json-schema.org/draft/2019-09/vocab/format": false,
          "https://json-schema.org/draft/2019-09/vocab/content": true
        },
        $recursiveAnchor: true,
        title: "Core and Validation specifications meta-schema",
        allOf: [
          {
            $ref: "meta/core"
          },
          {
            $ref: "meta/applicator"
          },
          {
            $ref: "meta/validation"
          },
          {
            $ref: "meta/meta-data"
          },
          {
            $ref: "meta/format"
          },
          {
            $ref: "meta/content"
          }
        ],
        type: [
          "object",
          "boolean"
        ],
        properties: {
          definitions: {
            $comment: "While no longer an official keyword as it is replaced by $defs, this keyword is retained in the meta-schema to prevent incompatible extensions as it remains in common use.",
            type: "object",
            additionalProperties: {
              $recursiveRef: "#"
            },
            default: {}
          },
          dependencies: {
            $comment: '"dependencies" is no longer a keyword, but schema authors should avoid redefining it to facilitate a smooth transition to "dependentSchemas" and "dependentRequired"',
            type: "object",
            additionalProperties: {
              anyOf: [
                {
                  $recursiveRef: "#"
                },
                {
                  $ref: "meta/validation#/$defs/stringArray"
                }
              ]
            }
          }
        }
      },
      draft2019Core: {
        $schema: "https://json-schema.org/draft/2019-09/schema",
        $id: "https://json-schema.org/draft/2019-09/meta/core",
        $vocabulary: {
          "https://json-schema.org/draft/2019-09/vocab/core": true
        },
        $recursiveAnchor: true,
        title: "Core vocabulary meta-schema",
        type: [
          "object",
          "boolean"
        ],
        properties: {
          $id: {
            type: "string",
            format: "uri-reference",
            $comment: "Non-empty fragments not allowed.",
            pattern: "^[^#]*#?$"
          },
          $schema: {
            type: "string",
            format: "uri"
          },
          $anchor: {
            type: "string",
            pattern: "^[A-Za-z][-A-Za-z0-9.:_]*$"
          },
          $ref: {
            type: "string",
            format: "uri-reference"
          },
          $recursiveRef: {
            type: "string",
            format: "uri-reference"
          },
          $recursiveAnchor: {
            type: "boolean",
            default: false
          },
          $vocabulary: {
            type: "object",
            propertyNames: {
              type: "string",
              format: "uri"
            },
            additionalProperties: {
              type: "boolean"
            }
          },
          $comment: {
            type: "string"
          },
          $defs: {
            type: "object",
            additionalProperties: {
              $recursiveRef: "#"
            },
            default: {}
          }
        }
      },
      draft2019Applicator: {
        $schema: "https://json-schema.org/draft/2019-09/schema",
        $id: "https://json-schema.org/draft/2019-09/meta/applicator",
        $vocabulary: {
          "https://json-schema.org/draft/2019-09/vocab/applicator": true
        },
        $recursiveAnchor: true,
        title: "Applicator vocabulary meta-schema",
        type: [
          "object",
          "boolean"
        ],
        properties: {
          additionalItems: {
            $recursiveRef: "#"
          },
          unevaluatedItems: {
            $recursiveRef: "#"
          },
          items: {
            anyOf: [
              {
                $recursiveRef: "#"
              },
              {
                $ref: "#/$defs/schemaArray"
              }
            ]
          },
          contains: {
            $recursiveRef: "#"
          },
          additionalProperties: {
            $recursiveRef: "#"
          },
          unevaluatedProperties: {
            $recursiveRef: "#"
          },
          properties: {
            type: "object",
            additionalProperties: {
              $recursiveRef: "#"
            },
            default: {}
          },
          patternProperties: {
            type: "object",
            additionalProperties: {
              $recursiveRef: "#"
            },
            propertyNames: {
              format: "regex"
            },
            default: {}
          },
          dependentSchemas: {
            type: "object",
            additionalProperties: {
              $recursiveRef: "#"
            }
          },
          propertyNames: {
            $recursiveRef: "#"
          },
          if: {
            $recursiveRef: "#"
          },
          then: {
            $recursiveRef: "#"
          },
          else: {
            $recursiveRef: "#"
          },
          allOf: {
            $ref: "#/$defs/schemaArray"
          },
          anyOf: {
            $ref: "#/$defs/schemaArray"
          },
          oneOf: {
            $ref: "#/$defs/schemaArray"
          },
          not: {
            $recursiveRef: "#"
          }
        },
        $defs: {
          schemaArray: {
            type: "array",
            minItems: 1,
            items: {
              $recursiveRef: "#"
            }
          }
        }
      },
      draft2019Validation: {
        $schema: "https://json-schema.org/draft/2019-09/schema",
        $id: "https://json-schema.org/draft/2019-09/meta/validation",
        $vocabulary: {
          "https://json-schema.org/draft/2019-09/vocab/validation": true
        },
        $recursiveAnchor: true,
        title: "Validation vocabulary meta-schema",
        type: [
          "object",
          "boolean"
        ],
        properties: {
          multipleOf: {
            type: "number",
            exclusiveMinimum: 0
          },
          maximum: {
            type: "number"
          },
          exclusiveMaximum: {
            type: "number"
          },
          minimum: {
            type: "number"
          },
          exclusiveMinimum: {
            type: "number"
          },
          maxLength: {
            $ref: "#/$defs/nonNegativeInteger"
          },
          minLength: {
            $ref: "#/$defs/nonNegativeIntegerDefault0"
          },
          pattern: {
            type: "string",
            format: "regex"
          },
          maxItems: {
            $ref: "#/$defs/nonNegativeInteger"
          },
          minItems: {
            $ref: "#/$defs/nonNegativeIntegerDefault0"
          },
          uniqueItems: {
            type: "boolean",
            default: false
          },
          maxContains: {
            $ref: "#/$defs/nonNegativeInteger"
          },
          minContains: {
            $ref: "#/$defs/nonNegativeInteger",
            default: 1
          },
          maxProperties: {
            $ref: "#/$defs/nonNegativeInteger"
          },
          minProperties: {
            $ref: "#/$defs/nonNegativeIntegerDefault0"
          },
          required: {
            $ref: "#/$defs/stringArray"
          },
          dependentRequired: {
            type: "object",
            additionalProperties: {
              $ref: "#/$defs/stringArray"
            }
          },
          const: true,
          enum: {
            type: "array",
            items: true
          },
          type: {
            anyOf: [
              {
                $ref: "#/$defs/simpleTypes"
              },
              {
                type: "array",
                items: {
                  $ref: "#/$defs/simpleTypes"
                },
                minItems: 1,
                uniqueItems: true
              }
            ]
          }
        },
        $defs: {
          nonNegativeInteger: {
            type: "integer",
            minimum: 0
          },
          nonNegativeIntegerDefault0: {
            $ref: "#/$defs/nonNegativeInteger",
            default: 0
          },
          simpleTypes: {
            enum: [
              "array",
              "boolean",
              "integer",
              "null",
              "number",
              "object",
              "string"
            ]
          },
          stringArray: {
            type: "array",
            items: {
              type: "string"
            },
            uniqueItems: true,
            default: []
          }
        }
      },
      draft2019Metadata: {
        $schema: "https://json-schema.org/draft/2019-09/schema",
        $id: "https://json-schema.org/draft/2019-09/meta/meta-data",
        $vocabulary: {
          "https://json-schema.org/draft/2019-09/vocab/meta-data": true
        },
        $recursiveAnchor: true,
        title: "Meta-data vocabulary meta-schema",
        type: [
          "object",
          "boolean"
        ],
        properties: {
          title: {
            type: "string"
          },
          description: {
            type: "string"
          },
          default: true,
          deprecated: {
            type: "boolean",
            default: false
          },
          readOnly: {
            type: "boolean",
            default: false
          },
          writeOnly: {
            type: "boolean",
            default: false
          },
          examples: {
            type: "array",
            items: true
          }
        }
      },
      draft2019Format: {
        $schema: "https://json-schema.org/draft/2019-09/schema",
        $id: "https://json-schema.org/draft/2019-09/meta/format",
        $vocabulary: {
          "https://json-schema.org/draft/2019-09/vocab/format": true
        },
        $recursiveAnchor: true,
        title: "Format vocabulary meta-schema",
        type: [
          "object",
          "boolean"
        ],
        properties: {
          format: {
            type: "string"
          }
        }
      },
      draft2019Content: {
        $schema: "https://json-schema.org/draft/2019-09/schema",
        $id: "https://json-schema.org/draft/2019-09/meta/content",
        $vocabulary: {
          "https://json-schema.org/draft/2019-09/vocab/content": true
        },
        $recursiveAnchor: true,
        title: "Content vocabulary meta-schema",
        type: [
          "object",
          "boolean"
        ],
        properties: {
          contentMediaType: {
            type: "string"
          },
          contentEncoding: {
            type: "string"
          },
          contentSchema: {
            $recursiveRef: "#"
          }
        }
      },
      draft2020: {
        $schema: "https://json-schema.org/draft/2020-12/schema",
        $id: "https://json-schema.org/draft/2020-12/schema",
        $vocabulary: {
          "https://json-schema.org/draft/2020-12/vocab/core": true,
          "https://json-schema.org/draft/2020-12/vocab/applicator": true,
          "https://json-schema.org/draft/2020-12/vocab/unevaluated": true,
          "https://json-schema.org/draft/2020-12/vocab/validation": true,
          "https://json-schema.org/draft/2020-12/vocab/meta-data": true,
          "https://json-schema.org/draft/2020-12/vocab/format-annotation": true,
          "https://json-schema.org/draft/2020-12/vocab/content": true
        },
        $dynamicAnchor: "meta",
        title: "Core and Validation specifications meta-schema",
        allOf: [
          {
            $ref: "meta/core"
          },
          {
            $ref: "meta/applicator"
          },
          {
            $ref: "meta/unevaluated"
          },
          {
            $ref: "meta/validation"
          },
          {
            $ref: "meta/meta-data"
          },
          {
            $ref: "meta/format-annotation"
          },
          {
            $ref: "meta/content"
          }
        ],
        type: [
          "object",
          "boolean"
        ],
        $comment: "This meta-schema also defines keywords that have appeared in previous drafts in order to prevent incompatible extensions as they remain in common use.",
        properties: {
          definitions: {
            $comment: '"definitions" has been replaced by "$defs".',
            type: "object",
            additionalProperties: {
              $dynamicRef: "#meta"
            },
            deprecated: true,
            default: {}
          },
          dependencies: {
            $comment: '"dependencies" has been split and replaced by "dependentSchemas" and "dependentRequired" in order to serve their differing semantics.',
            type: "object",
            additionalProperties: {
              anyOf: [
                {
                  $dynamicRef: "#meta"
                },
                {
                  $ref: "meta/validation#/$defs/stringArray"
                }
              ]
            },
            deprecated: true,
            default: {}
          },
          $recursiveAnchor: {
            $comment: '"$recursiveAnchor" has been replaced by "$dynamicAnchor".',
            $ref: "meta/core#/$defs/anchorString",
            deprecated: true
          },
          $recursiveRef: {
            $comment: '"$recursiveRef" has been replaced by "$dynamicRef".',
            $ref: "meta/core#/$defs/uriReferenceString",
            deprecated: true
          }
        }
      },
      draft2020Core: {
        $schema: "https://json-schema.org/draft/2020-12/schema",
        $id: "https://json-schema.org/draft/2020-12/meta/core",
        $vocabulary: {
          "https://json-schema.org/draft/2020-12/vocab/core": true
        },
        $dynamicAnchor: "meta",
        title: "Core vocabulary meta-schema",
        type: [
          "object",
          "boolean"
        ],
        properties: {
          $id: {
            $ref: "#/$defs/uriReferenceString",
            $comment: "Non-empty fragments not allowed.",
            pattern: "^[^#]*#?$"
          },
          $schema: {
            $ref: "#/$defs/uriString"
          },
          $ref: {
            $ref: "#/$defs/uriReferenceString"
          },
          $anchor: {
            $ref: "#/$defs/anchorString"
          },
          $dynamicRef: {
            $ref: "#/$defs/uriReferenceString"
          },
          $dynamicAnchor: {
            $ref: "#/$defs/anchorString"
          },
          $vocabulary: {
            type: "object",
            propertyNames: {
              $ref: "#/$defs/uriString"
            },
            additionalProperties: {
              type: "boolean"
            }
          },
          $comment: {
            type: "string"
          },
          $defs: {
            type: "object",
            additionalProperties: {
              $dynamicRef: "#meta"
            }
          }
        },
        $defs: {
          anchorString: {
            type: "string",
            pattern: "^[A-Za-z_][-A-Za-z0-9._]*$"
          },
          uriString: {
            type: "string",
            format: "uri"
          },
          uriReferenceString: {
            type: "string",
            format: "uri-reference"
          }
        }
      },
      draft2020Applicator: {
        $schema: "https://json-schema.org/draft/2020-12/schema",
        $id: "https://json-schema.org/draft/2020-12/meta/applicator",
        $vocabulary: {
          "https://json-schema.org/draft/2020-12/vocab/applicator": true
        },
        $dynamicAnchor: "meta",
        title: "Applicator vocabulary meta-schema",
        type: [
          "object",
          "boolean"
        ],
        properties: {
          prefixItems: {
            $ref: "#/$defs/schemaArray"
          },
          items: {
            $dynamicRef: "#meta"
          },
          contains: {
            $dynamicRef: "#meta"
          },
          additionalProperties: {
            $dynamicRef: "#meta"
          },
          properties: {
            type: "object",
            additionalProperties: {
              $dynamicRef: "#meta"
            },
            default: {}
          },
          patternProperties: {
            type: "object",
            additionalProperties: {
              $dynamicRef: "#meta"
            },
            propertyNames: {
              format: "regex"
            },
            default: {}
          },
          dependentSchemas: {
            type: "object",
            additionalProperties: {
              $dynamicRef: "#meta"
            },
            default: {}
          },
          propertyNames: {
            $dynamicRef: "#meta"
          },
          if: {
            $dynamicRef: "#meta"
          },
          then: {
            $dynamicRef: "#meta"
          },
          else: {
            $dynamicRef: "#meta"
          },
          allOf: {
            $ref: "#/$defs/schemaArray"
          },
          anyOf: {
            $ref: "#/$defs/schemaArray"
          },
          oneOf: {
            $ref: "#/$defs/schemaArray"
          },
          not: {
            $dynamicRef: "#meta"
          }
        },
        $defs: {
          schemaArray: {
            type: "array",
            minItems: 1,
            items: {
              $dynamicRef: "#meta"
            }
          }
        }
      },
      draft2020Unevaluated: {
        $schema: "https://json-schema.org/draft/2020-12/schema",
        $id: "https://json-schema.org/draft/2020-12/meta/unevaluated",
        $vocabulary: {
          "https://json-schema.org/draft/2020-12/vocab/unevaluated": true
        },
        $dynamicAnchor: "meta",
        title: "Unevaluated applicator vocabulary meta-schema",
        type: [
          "object",
          "boolean"
        ],
        properties: {
          unevaluatedItems: {
            $dynamicRef: "#meta"
          },
          unevaluatedProperties: {
            $dynamicRef: "#meta"
          }
        }
      },
      draft2020Validation: {
        $schema: "https://json-schema.org/draft/2020-12/schema",
        $id: "https://json-schema.org/draft/2020-12/meta/validation",
        $vocabulary: {
          "https://json-schema.org/draft/2020-12/vocab/validation": true
        },
        $dynamicAnchor: "meta",
        title: "Validation vocabulary meta-schema",
        type: [
          "object",
          "boolean"
        ],
        properties: {
          type: {
            anyOf: [
              {
                $ref: "#/$defs/simpleTypes"
              },
              {
                type: "array",
                items: {
                  $ref: "#/$defs/simpleTypes"
                },
                minItems: 1,
                uniqueItems: true
              }
            ]
          },
          const: true,
          enum: {
            type: "array",
            items: true
          },
          multipleOf: {
            type: "number",
            exclusiveMinimum: 0
          },
          maximum: {
            type: "number"
          },
          exclusiveMaximum: {
            type: "number"
          },
          minimum: {
            type: "number"
          },
          exclusiveMinimum: {
            type: "number"
          },
          maxLength: {
            $ref: "#/$defs/nonNegativeInteger"
          },
          minLength: {
            $ref: "#/$defs/nonNegativeIntegerDefault0"
          },
          pattern: {
            type: "string",
            format: "regex"
          },
          maxItems: {
            $ref: "#/$defs/nonNegativeInteger"
          },
          minItems: {
            $ref: "#/$defs/nonNegativeIntegerDefault0"
          },
          uniqueItems: {
            type: "boolean",
            default: false
          },
          maxContains: {
            $ref: "#/$defs/nonNegativeInteger"
          },
          minContains: {
            $ref: "#/$defs/nonNegativeInteger",
            default: 1
          },
          maxProperties: {
            $ref: "#/$defs/nonNegativeInteger"
          },
          minProperties: {
            $ref: "#/$defs/nonNegativeIntegerDefault0"
          },
          required: {
            $ref: "#/$defs/stringArray"
          },
          dependentRequired: {
            type: "object",
            additionalProperties: {
              $ref: "#/$defs/stringArray"
            }
          }
        },
        $defs: {
          nonNegativeInteger: {
            type: "integer",
            minimum: 0
          },
          nonNegativeIntegerDefault0: {
            $ref: "#/$defs/nonNegativeInteger",
            default: 0
          },
          simpleTypes: {
            enum: [
              "array",
              "boolean",
              "integer",
              "null",
              "number",
              "object",
              "string"
            ]
          },
          stringArray: {
            type: "array",
            items: {
              type: "string"
            },
            uniqueItems: true,
            default: []
          }
        }
      },
      draft2020Metadata: {
        $schema: "https://json-schema.org/draft/2020-12/schema",
        $id: "https://json-schema.org/draft/2020-12/meta/meta-data",
        $vocabulary: {
          "https://json-schema.org/draft/2020-12/vocab/meta-data": true
        },
        $dynamicAnchor: "meta",
        title: "Meta-data vocabulary meta-schema",
        type: [
          "object",
          "boolean"
        ],
        properties: {
          title: {
            type: "string"
          },
          description: {
            type: "string"
          },
          default: true,
          deprecated: {
            type: "boolean",
            default: false
          },
          readOnly: {
            type: "boolean",
            default: false
          },
          writeOnly: {
            type: "boolean",
            default: false
          },
          examples: {
            type: "array",
            items: true
          }
        }
      },
      draft2020Format: {
        $schema: "https://json-schema.org/draft/2020-12/schema",
        $id: "https://json-schema.org/draft/2020-12/meta/format-annotation",
        $vocabulary: {
          "https://json-schema.org/draft/2020-12/vocab/format-annotation": true
        },
        $dynamicAnchor: "meta",
        title: "Format vocabulary meta-schema for annotation results",
        type: [
          "object",
          "boolean"
        ],
        properties: {
          format: {
            type: "string"
          }
        }
      },
      draft2020FormatAssertion: {
        $schema: "https://json-schema.org/draft/2020-12/schema",
        $id: "https://json-schema.org/draft/2020-12/meta/format-assertion",
        $vocabulary: {
          "https://json-schema.org/draft/2020-12/vocab/format-assertion": true
        },
        $dynamicAnchor: "meta",
        title: "Format vocabulary meta-schema for assertion results",
        type: [
          "object",
          "boolean"
        ],
        properties: {
          format: {
            type: "string"
          }
        }
      },
      draft2020Content: {
        $schema: "https://json-schema.org/draft/2020-12/schema",
        $id: "https://json-schema.org/draft/2020-12/meta/content",
        $vocabulary: {
          "https://json-schema.org/draft/2020-12/vocab/content": true
        },
        $dynamicAnchor: "meta",
        title: "Content vocabulary meta-schema",
        type: [
          "object",
          "boolean"
        ],
        properties: {
          contentEncoding: {
            type: "string"
          },
          contentMediaType: {
            type: "string"
          },
          contentSchema: {
            $dynamicRef: "#meta"
          }
        }
      }
    };
  }
});
var hasOwnPropertyIntrinsic = Object.prototype.hasOwnProperty;
var hasOwnPropertyCall = Function.prototype.call.bind(
  hasOwnPropertyIntrinsic
);
function definePropertyOrThrow(target, key, descriptor) {
  if (!Reflect.defineProperty(target, key, descriptor)) {
    throw new TypeError(`Cannot define property "${String(key)}"`);
  }
  return target;
}
function hasOwn(target, key) {
  return hasOwnPropertyCall(target, key);
}
var ValidationError = class extends Error {
  code;
  message;
  item;
  keyword;
  cause;
  schemaPath = "";
  instancePath = "";
  data;
  schema;
  constructor(message) {
    super(message);
    this.message = message;
  }
  getCause() {
    let current = this;
    let schemaPointer = "#";
    let instancePointer = "#";
    const seen = /* @__PURE__ */ new Set();
    while (!seen.has(current)) {
      seen.add(current);
      let schemaPath = `${schemaPointer}/${current.keyword}`;
      let instancePath = instancePointer;
      if (typeof current.item !== "undefined") {
        if (typeof current.item === "string" && current.schema && typeof current.schema === "object" && current.item in current.schema) {
          schemaPath += `/${escapeJsonPointerToken(current.item)}`;
        }
        instancePath += `/${escapeJsonPointerToken(current.item)}`;
      }
      current.schemaPath = schemaPath;
      current.instancePath = instancePath;
      if (!(current.cause instanceof ValidationError) || seen.has(current.cause)) {
        return current;
      }
      schemaPointer = schemaPath;
      instancePointer = instancePath;
      current = current.cause;
    }
    return current;
  }
  getTree() {
    this.getCause();
    let current = this;
    let root;
    let target;
    const seen = /* @__PURE__ */ new Set();
    while (current && !seen.has(current)) {
      seen.add(current);
      const node = {
        message: current.message,
        keyword: current.keyword,
        item: current.item,
        schemaPath: current.schemaPath,
        instancePath: current.instancePath,
        data: current.data
      };
      if (!root) {
        root = node;
      } else if (target) {
        target.cause = node;
      }
      target = node;
      current = current.cause instanceof ValidationError ? current.cause : void 0;
    }
    return root;
  }
  getPath() {
    const cause = this.getCause();
    return {
      schemaPath: cause.schemaPath,
      instancePath: cause.instancePath
    };
  }
};
var FAIL_FAST_DEFINE_ERROR = () => true;
function getDefinedErrorFunctionForKey(key, schema, failFast) {
  if (failFast) {
    return FAIL_FAST_DEFINE_ERROR;
  }
  const KeywordError = new ValidationError(`Invalid ${key}`);
  KeywordError.keyword = key;
  KeywordError.schema = schema;
  const defineError = (message, options = {}) => {
    KeywordError.message = message;
    KeywordError.code = options.code;
    KeywordError.item = options.item;
    if (options.cause !== KeywordError) {
      KeywordError.cause = options.cause && options.cause !== true ? options.cause : void 0;
    }
    KeywordError.data = options.data;
    return KeywordError;
  };
  return getNamedFunction(
    `defineError_${key}`,
    defineError
  );
}
function escapeJsonPointerToken(value) {
  return String(value).replace(/~/g, "~0").replace(/\//g, "~1");
}
function isCompiledSchema(subSchema) {
  return !!subSchema && typeof subSchema === "object" && !Array.isArray(subSchema) && "$validate" in subSchema;
}
function getNamedFunction(name, fn) {
  return definePropertyOrThrow(fn, "name", { value: name });
}
function resolvePath(root, path) {
  if (!path || path === "#") {
    return root;
  }
  if (path.startsWith("#/")) {
    const parts = path.split("/").slice(1);
    let current = root;
    for (const part of parts) {
      const decodedUriPart = decodeURIComponent(part);
      if (/~(?:[^01]|$)/.test(decodedUriPart)) {
        throw new URIError("Invalid JSON Pointer escape");
      }
      const key = decodedUriPart.replace(/~1/g, "/").replace(/~0/g, "~");
      if (current && typeof current === "object" && key in current) {
        current = current[key];
      } else {
        return;
      }
    }
    return current;
  }
  if (!path.includes("#")) {
    if (root.definitions && root.definitions[path]) {
      return root.definitions[path];
    }
    if (root.defs && root.defs[path]) {
      return root.defs[path];
    }
    if (root.$id && typeof root.$id === "string") {
      if (root.$id === path || root.$id.endsWith("/" + path)) {
        return root;
      }
    }
  }
  return;
}
function areCloseEnough(a, b, epsilon = 1e-15) {
  return Math.abs(a - b) <= epsilon * Math.max(Math.abs(a), Math.abs(b));
}
var UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
var DURATION_REGEX = /^P(?!$)((\d+Y)?(\d+M)?(\d+W)?(\d+D)?)(T(?=\d)(\d+H)?(\d+M)?(\d+S)?)?$/;
var URI_REGEX = /^[a-zA-Z][a-zA-Z0-9+\-.]*:[^\s]*$/;
var EMAIL_REGEX = /^(?!\.)(?!.*\.$)[a-z0-9!#$%&'*+/=?^_`{|}~-]{1,20}(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]{1,21}){0,2}@[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,60}[a-z0-9])?){0,3}$/i;
var URI_REFERENCE_REGEX = /^(([^:/?#]+):)?(\/\/([^/?#]*))?([^?#]*)(\?([^#]*))?(#((?![^#]*\\)[^#]*))?/i;
var IRI_REGEX = URI_REGEX;
var IRI_REFERENCE_REGEX = URI_REFERENCE_REGEX;
var DAYS_IN_MONTH = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
var VIRAMA_END_REGEX = /[\u094d\u09cd\u0a4d\u0acd\u0b4d\u0bcd\u0c4d\u0ccd\u0d4d\u0dca\u0e3a\u0f84\u1039\u1714\u1734\u17d2\u1a60\u1b44\ua806\ua8c4\ua953\ua9c0\uaaf6\uabed]$/u;
function isDigitCharCode(code) {
  return code >= 48 && code <= 57;
}
function parseTwoDigits(data, index) {
  const first = data.charCodeAt(index) - 48;
  const second = data.charCodeAt(index + 1) - 48;
  if (first < 0 || first > 9 || second < 0 || second > 9) {
    return -1;
  }
  return first * 10 + second;
}
function parseFourDigits(data, index) {
  const a = data.charCodeAt(index) - 48;
  const b = data.charCodeAt(index + 1) - 48;
  const c = data.charCodeAt(index + 2) - 48;
  const d = data.charCodeAt(index + 3) - 48;
  if (a < 0 || a > 9 || b < 0 || b > 9 || c < 0 || c > 9 || d < 0 || d > 9) {
    return -1;
  }
  return a * 1e3 + b * 100 + c * 10 + d;
}
function isValidIpv4Range(data, start, end) {
  let segmentCount = 0;
  let segmentStart = start;
  for (let i = start; i <= end; i++) {
    if (i !== end && data.charCodeAt(i) !== 46) {
      continue;
    }
    const segmentLength = i - segmentStart;
    if (segmentLength < 1 || segmentLength > 3) {
      return false;
    }
    if (segmentLength > 1 && data.charCodeAt(segmentStart) === 48) {
      return false;
    }
    let value = 0;
    for (let j = segmentStart; j < i; j++) {
      const digit = data.charCodeAt(j) - 48;
      if (digit < 0 || digit > 9) {
        return false;
      }
      value = value * 10 + digit;
    }
    if (value > 255) {
      return false;
    }
    segmentCount++;
    segmentStart = i + 1;
  }
  return segmentCount === 4;
}
function isValidIpv4(data) {
  return isValidIpv4Range(data, 0, data.length);
}
function isHexCharCode(code) {
  return code >= 48 && code <= 57 || code >= 65 && code <= 70 || code >= 97 && code <= 102;
}
function hasOnlyUriCharacters(data, allowUnicode) {
  for (let index = 0; index < data.length; index++) {
    const code = data.charCodeAt(index);
    if (code <= 32 || code === 127 || code === 92) {
      return false;
    }
    if (!allowUnicode && code > 127) {
      return false;
    }
    if (code === 34 || code === 60 || code === 62 || code === 94 || code === 96 || code === 123 || code === 124 || code === 125) {
      return false;
    }
    if (code === 37) {
      if (index + 2 >= data.length || !isHexCharCode(data.charCodeAt(index + 1)) || !isHexCharCode(data.charCodeAt(index + 2))) {
        return false;
      }
      index += 2;
    }
  }
  return true;
}
function hasValidAuthority(data, schemeEnd) {
  if (data.charCodeAt(schemeEnd) !== 47 || data.charCodeAt(schemeEnd + 1) !== 47) {
    return true;
  }
  const authorityStart = schemeEnd + 2;
  let authorityEnd = data.length;
  let at = -1;
  for (let index = authorityStart; index < data.length; index++) {
    const code = data.charCodeAt(index);
    if (code === 47 || code === 63 || code === 35) {
      authorityEnd = index;
      break;
    }
    if (code === 64) {
      at = index;
    }
  }
  if (at !== -1) {
    for (let index = authorityStart; index < at; index++) {
      const code = data.charCodeAt(index);
      if (code === 91 || code === 93) {
        return false;
      }
    }
  }
  const hostStart = at === -1 ? authorityStart : at + 1;
  if (data.charCodeAt(hostStart) === 91) {
    let close = -1;
    for (let index = hostStart + 1; index < authorityEnd; index++) {
      if (data.charCodeAt(index) === 93) {
        close = index;
        break;
      }
    }
    if (close === -1) {
      return false;
    }
    if (close + 1 === authorityEnd) {
      return true;
    }
    if (data.charCodeAt(close + 1) !== 58) {
      return false;
    }
    for (let index = close + 2; index < authorityEnd; index++) {
      if (!isDigitCharCode(data.charCodeAt(index))) {
        return false;
      }
    }
    return true;
  }
  let colon = -1;
  for (let index = hostStart; index < authorityEnd; index++) {
    const code = data.charCodeAt(index);
    if (code === 91 || code === 93) {
      return false;
    }
    if (code === 58) {
      if (colon !== -1) {
        return false;
      }
      colon = index;
    }
  }
  for (let index = colon + 1; colon !== -1 && index < authorityEnd; index++) {
    if (!isDigitCharCode(data.charCodeAt(index))) {
      return false;
    }
  }
  return true;
}
function isValidTime(data) {
  if (data.length < 9 || data.charCodeAt(2) !== 58 || data.charCodeAt(5) !== 58) {
    return false;
  }
  const hour = parseTwoDigits(data, 0);
  const minute = parseTwoDigits(data, 3);
  const second = parseTwoDigits(data, 6);
  if (hour < 0 || hour > 23 || minute < 0 || minute > 59 || second < 0 || second > 60) {
    return false;
  }
  let cursor = 8;
  if (data.charCodeAt(cursor) === 46) {
    cursor++;
    const fractionStart = cursor;
    while (cursor < data.length && isDigitCharCode(data.charCodeAt(cursor))) {
      cursor++;
    }
    if (cursor === fractionStart) {
      return false;
    }
  }
  let offsetMinutes = 0;
  const zone = data.charCodeAt(cursor);
  if (zone === 90 || zone === 122) {
    cursor++;
  } else if (zone === 43 || zone === 45) {
    if (cursor + 6 !== data.length || data.charCodeAt(cursor + 3) !== 58) {
      return false;
    }
    const offsetHour = parseTwoDigits(data, cursor + 1);
    const offsetMinute = parseTwoDigits(data, cursor + 4);
    if (offsetHour < 0 || offsetHour > 23 || offsetMinute < 0 || offsetMinute > 59) {
      return false;
    }
    offsetMinutes = offsetHour * 60 + offsetMinute;
    if (zone === 43) {
      offsetMinutes = -offsetMinutes;
    }
    cursor += 6;
  } else {
    return false;
  }
  if (cursor !== data.length) {
    return false;
  }
  if (second !== 60) {
    return true;
  }
  let utcMinutes = (hour * 60 + minute + offsetMinutes) % (24 * 60);
  if (utcMinutes < 0) {
    utcMinutes += 24 * 60;
  }
  return utcMinutes === 23 * 60 + 59;
}
function isValidIpv6(data) {
  const length = data.length;
  if (length === 0) {
    return false;
  }
  let hasColon = false;
  let hasDoubleColon = false;
  let hextetCount = 0;
  let i = 0;
  while (i < length) {
    if (data.charCodeAt(i) === 58) {
      hasColon = true;
      if (i + 1 < length && data.charCodeAt(i + 1) === 58) {
        if (hasDoubleColon) {
          return false;
        }
        hasDoubleColon = true;
        i += 2;
        if (i === length) {
          break;
        }
        continue;
      }
      return false;
    }
    const segmentStart = i;
    let segmentLength = 0;
    while (i < length && isHexCharCode(data.charCodeAt(i))) {
      segmentLength++;
      if (segmentLength > 4) {
        return false;
      }
      i++;
    }
    if (segmentLength === 0) {
      return false;
    }
    if (i < length && data.charCodeAt(i) === 46) {
      if (!hasColon) {
        return false;
      }
      if (!isValidIpv4Range(data, segmentStart, length)) {
        return false;
      }
      if (hasDoubleColon) {
        return hextetCount < 6;
      }
      return hextetCount === 6;
    }
    hextetCount++;
    if (hextetCount > 8) {
      return false;
    }
    if (i === length) {
      break;
    }
    if (data.charCodeAt(i) !== 58) {
      return false;
    }
    hasColon = true;
    i++;
    if (i === length) {
      return false;
    }
    if (data.charCodeAt(i) === 58) {
      if (hasDoubleColon) {
        return false;
      }
      hasDoubleColon = true;
      i++;
      if (i === length) {
        break;
      }
    }
  }
  if (!hasColon) {
    return false;
  }
  if (hasDoubleColon) {
    return hextetCount < 8;
  }
  return hextetCount === 8;
}
function isValidJsonPointer(data) {
  if (data === "") {
    return true;
  }
  if (data.charCodeAt(0) !== 47) {
    return false;
  }
  for (let i = 1; i < data.length; i++) {
    if (data.charCodeAt(i) !== 126) {
      continue;
    }
    const next = data.charCodeAt(i + 1);
    if (next !== 48 && next !== 49) {
      return false;
    }
    i++;
  }
  return true;
}
function isValidRelativeJsonPointer(data) {
  if (data.length === 0) {
    return false;
  }
  let i = 0;
  while (i < data.length) {
    const code = data.charCodeAt(i);
    if (code < 48 || code > 57) {
      break;
    }
    i++;
  }
  if (i === 0) {
    return false;
  }
  if (i > 1 && data.charCodeAt(0) === 48) {
    return false;
  }
  if (i === data.length) {
    return true;
  }
  if (data.charCodeAt(i) === 35) {
    return i + 1 === data.length;
  }
  if (data.charCodeAt(i) !== 47) {
    return false;
  }
  for (i = i + 1; i < data.length; i++) {
    if (data.charCodeAt(i) !== 126) {
      continue;
    }
    const next = data.charCodeAt(i + 1);
    if (next !== 48 && next !== 49) {
      return false;
    }
    i++;
  }
  return true;
}
function isValidUriTemplate(data) {
  for (let i = 0; i < data.length; i++) {
    const code = data.charCodeAt(i);
    if (code === 125) {
      return false;
    }
    if (code !== 123) {
      continue;
    }
    const closeIndex = data.indexOf("}", i + 1);
    if (closeIndex === -1 || closeIndex === i + 1) {
      return false;
    }
    i = closeIndex;
  }
  return true;
}
function isValidAsciiHostnameSyntax(data) {
  if (data.length === 0 || data.length > 253 || data.endsWith(".")) {
    return false;
  }
  let labelLength = 0;
  for (let index = 0; index < data.length; index++) {
    const code = data.charCodeAt(index);
    if (code === 46) {
      if (labelLength === 0 || labelLength > 63 || data.charCodeAt(index - 1) === 45) {
        return false;
      }
      labelLength = 0;
      continue;
    }
    const alphanumeric = code >= 48 && code <= 57 || code >= 65 && code <= 90 || code >= 97 && code <= 122;
    if (!alphanumeric && code !== 45) {
      return false;
    }
    if (labelLength === 0 && code === 45) {
      return false;
    }
    labelLength++;
  }
  return labelLength > 0 && labelLength <= 63 && data.charCodeAt(data.length - 1) !== 45;
}
function decodePunycodeDigit(code) {
  if (code >= 48 && code <= 57) {
    return code - 22;
  }
  if (code >= 65 && code <= 90) {
    return code - 65;
  }
  if (code >= 97 && code <= 122) {
    return code - 97;
  }
  return -1;
}
function adaptPunycodeBias(delta, points, first) {
  delta = first ? Math.floor(delta / 700) : delta >> 1;
  delta += Math.floor(delta / points);
  let k = 0;
  while (delta > 455) {
    delta = Math.floor(delta / 35);
    k += 36;
  }
  return k + Math.floor(36 * delta / (delta + 38));
}
function decodePunycode(label) {
  const input = label.slice(4).toLowerCase();
  const output = [];
  const delimiter = input.lastIndexOf("-");
  let cursor = 0;
  if (delimiter !== -1) {
    for (let index = 0; index < delimiter; index++) {
      const code = input.charCodeAt(index);
      if (code > 127) {
        return null;
      }
      output.push(code);
    }
    cursor = delimiter + 1;
  }
  let codePoint = 128;
  let insertion = 0;
  let bias = 72;
  while (cursor < input.length) {
    const previousInsertion = insertion;
    let weight = 1;
    for (let k = 36; ; k += 36) {
      if (cursor >= input.length) {
        return null;
      }
      const digit = decodePunycodeDigit(input.charCodeAt(cursor++));
      if (digit < 0 || digit > Math.floor((2147483647 - insertion) / weight)) {
        return null;
      }
      insertion += digit * weight;
      const threshold = k <= bias ? 1 : k >= bias + 26 ? 26 : k - bias;
      if (digit < threshold) {
        break;
      }
      const multiplier = 36 - threshold;
      if (weight > Math.floor(2147483647 / multiplier)) {
        return null;
      }
      weight *= multiplier;
    }
    const pointCount = output.length + 1;
    bias = adaptPunycodeBias(
      insertion - previousInsertion,
      pointCount,
      previousInsertion === 0
    );
    const increment = Math.floor(insertion / pointCount);
    if (increment > 1114111 - codePoint) {
      return null;
    }
    codePoint += increment;
    insertion %= pointCount;
    if (codePoint >= 55296 && codePoint <= 57343) {
      return null;
    }
    output.splice(insertion, 0, codePoint);
    insertion++;
  }
  try {
    return String.fromCodePoint(...output);
  } catch (_error) {
    return null;
  }
}
function hasValidIdnaContext(label) {
  if (/^[\p{M}]/u.test(label)) {
    return false;
  }
  if (/[\u0640\u07fa\u302e\u302f\u3031-\u3035\u303b]/u.test(label)) {
    return false;
  }
  if (!/^[\p{L}\p{M}\p{Nd}\-\u00b7\u0375\u05f3\u05f4\u06fd\u06fe\u0f0b\u200c\u200d\u3007\u30fb]+$/u.test(
    label
  )) {
    return false;
  }
  for (let index = 0; index < label.length; index++) {
    const character = label[index];
    if (character === "\xB7" && (label[index - 1] !== "l" || label[index + 1] !== "l")) {
      return false;
    }
    if (character === "\u0375" && !/^\p{Script=Greek}$/u.test(label[index + 1] || "")) {
      return false;
    }
    if ((character === "\u05F3" || character === "\u05F4") && !/^\p{Script=Hebrew}$/u.test(label[index - 1] || "")) {
      return false;
    }
    if (character === "\u30FB" && !/[\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Han}]/u.test(
      label
    )) {
      return false;
    }
    if (character === "\u200D" && !VIRAMA_END_REGEX.test(label.slice(0, index))) {
      return false;
    }
    if (character === "\u200C" && !VIRAMA_END_REGEX.test(label.slice(0, index)) && !/^\p{Script=Arabic}$/u.test(label[index - 1] || "") && !/^\p{Script=Arabic}$/u.test(label[index + 1] || "")) {
      return false;
    }
  }
  return !(/[\u0660-\u0669]/u.test(label) && /[\u06f0-\u06f9]/u.test(label));
}
function toAsciiHostname(data) {
  try {
    return new URL(`http://${data}/`).hostname.toLowerCase();
  } catch (_error) {
    return null;
  }
}
function decodeIdnaLabel(label) {
  const normalized = label.normalize("NFC");
  if (!/^xn--/i.test(normalized)) {
    return normalized;
  }
  const decoded = decodePunycode(normalized);
  if (decoded === null || !/[^\x00-\x7f]/u.test(decoded) || toAsciiHostname(decoded) !== normalized.toLowerCase()) {
    return null;
  }
  return decoded.normalize("NFC");
}
function hasRtlCharacter(label) {
  return [...label].some(isRtlCharacter);
}
function isRtlCharacter(character) {
  return /^[\p{Script=Arabic}\p{Script=Hebrew}]$/u.test(character) && !/^[\p{Nd}\p{M}]$/u.test(character);
}
function hasValidIdnaBidi(labels) {
  if (!labels.some(hasRtlCharacter)) {
    return true;
  }
  for (const label of labels) {
    const characters = [...label];
    const significant = characters.filter(
      (character) => !/^\p{M}$/u.test(character)
    );
    const first = significant[0] || "";
    const last = significant[significant.length - 1] || "";
    if (hasRtlCharacter(label)) {
      if (!isRtlCharacter(first) || characters.some(
        (character) => /^\p{L}$/u.test(character) && !isRtlCharacter(character)
      ) || !(isRtlCharacter(last) || /^[0-9\u0660-\u06f9]$/u.test(last)) || /[0-9]/u.test(label) && /[\u0660-\u0669]/u.test(label)) {
        return false;
      }
    } else if (!/^\p{L}$/u.test(first) || !(/^\p{L}$/u.test(last) || /^[0-9\u06f0-\u06f9]$/u.test(last))) {
      return false;
    }
  }
  return true;
}
function validatedIdnaLabels(labels) {
  const decoded = [];
  for (const label of labels) {
    const value = decodeIdnaLabel(label);
    if (value === null || value.startsWith("-") || value.endsWith("-") || /[^\x00-\x7f]/u.test(value) && value[2] === "-" && value[3] === "-" || !hasValidIdnaContext(value.toLowerCase())) {
      return null;
    }
    decoded.push(value);
  }
  return hasValidIdnaBidi(decoded) ? decoded : null;
}
function isValidHostname(data) {
  if (!isValidAsciiHostnameSyntax(data)) {
    return false;
  }
  if (!/xn--/i.test(data)) {
    return true;
  }
  return validatedIdnaLabels(data.split(".")) !== null;
}
function isValidIdnHostname(data) {
  if (data.length === 0 || /[.\u3002\uff0e\uff61]$/u.test(data)) {
    return false;
  }
  const labels = data.split(/[.\u3002\uff0e\uff61]/u);
  if (labels.some((label) => label.length === 0)) {
    return false;
  }
  if (validatedIdnaLabels(labels) === null) {
    return false;
  }
  const ascii = toAsciiHostname(data);
  if (ascii === null || !isValidAsciiHostnameSyntax(ascii)) {
    return false;
  }
  const asciiLabels = (ascii.endsWith(".") ? ascii.slice(0, -1) : ascii).split(".");
  for (let index = 0; index < labels.length; index++) {
    if (/^xn--/i.test(labels[index]) && asciiLabels[index] !== labels[index].toLowerCase()) {
      return false;
    }
  }
  return true;
}
function utf8ByteLength(data) {
  let bytes = 0;
  for (let index = 0; index < data.length; index++) {
    const code = data.charCodeAt(index);
    if (code <= 127) {
      bytes++;
    } else if (code <= 2047) {
      bytes += 2;
    } else if (code >= 55296 && code <= 56319) {
      const next = data.charCodeAt(index + 1);
      if (next < 56320 || next > 57343) {
        return -1;
      }
      bytes += 4;
      index++;
    } else if (code >= 56320 && code <= 57343) {
      return -1;
    } else {
      bytes += 3;
    }
  }
  return bytes;
}
function isValidInternationalLocalPart(local) {
  const byteLength = utf8ByteLength(local);
  if (byteLength < 1 || byteLength > 64) {
    return false;
  }
  if (local.startsWith('"') || local.endsWith('"')) {
    if (!(local.startsWith('"') && local.endsWith('"')) || local.length < 2) {
      return false;
    }
    for (let index = 1; index < local.length - 1; index++) {
      const character = local[index];
      const code = local.charCodeAt(index);
      if (character === "\\") {
        index++;
        if (index >= local.length - 1) {
          return false;
        }
        const escapedCode = local.charCodeAt(index);
        if (escapedCode < 32 || escapedCode > 126) {
          return false;
        }
        continue;
      }
      if (character === '"' || code < 32 || code === 127 || code > 127 && /[\p{C}\p{Z}]/u.test(character)) {
        return false;
      }
    }
    return true;
  }
  const atoms = local.split(".");
  if (atoms.some((atom) => atom.length === 0)) {
    return false;
  }
  for (const atom of atoms) {
    for (const character of atom) {
      if (/^[A-Za-z0-9!#$%&'*+/=?^_`{|}~-]$/.test(character)) {
        continue;
      }
      if (character.charCodeAt(0) <= 127 || /[\p{C}\p{Z}]/u.test(character)) {
        return false;
      }
    }
  }
  return true;
}
function isValidIdnEmail(data) {
  if (utf8ByteLength(data) > 254) {
    return false;
  }
  const at = data.lastIndexOf("@");
  if (at < 1 || at === data.length - 1) {
    return false;
  }
  const local = data.slice(0, at);
  const domain = data.slice(at + 1);
  if (!isValidInternationalLocalPart(local)) {
    return false;
  }
  if (!local.startsWith('"') && local.includes("@")) {
    return false;
  }
  if (domain.startsWith("[") && domain.endsWith("]")) {
    const literal = domain.slice(1, -1);
    return literal.startsWith("IPv6:") ? isValidIpv6(literal.slice(5)) : isValidIpv4(literal);
  }
  return isValidIdnHostname(domain);
}
var Formats = {
  ["date-time"](data) {
    const length = data.length;
    if (length < 19) {
      return false;
    }
    if (data.charCodeAt(4) !== 45 || data.charCodeAt(7) !== 45 || data.charCodeAt(13) !== 58 || data.charCodeAt(16) !== 58) {
      return false;
    }
    const tCode = data.charCodeAt(10);
    if (tCode !== 84 && tCode !== 116) {
      return false;
    }
    const year = parseFourDigits(data, 0);
    const month = parseTwoDigits(data, 5);
    const day = parseTwoDigits(data, 8);
    const hour = parseTwoDigits(data, 11);
    const minute = parseTwoDigits(data, 14);
    const second = parseTwoDigits(data, 17);
    if (year < 0 || month < 0 || day < 0 || hour < 0 || minute < 0 || second < 0) {
      return false;
    }
    if (hour > 23 || minute > 59 || second > 60) {
      return false;
    }
    let cursor = 19;
    let offsetSign = null;
    let offsetHour = 0;
    let offsetMinute = 0;
    if (cursor < length && data.charCodeAt(cursor) === 46) {
      cursor++;
      const fracStart = cursor;
      while (cursor < length && isDigitCharCode(data.charCodeAt(cursor))) {
        cursor++;
      }
      if (cursor === fracStart) {
        return false;
      }
    }
    if (cursor < length) {
      const tzCode = data.charCodeAt(cursor);
      if (tzCode === 90 || tzCode === 122) {
        cursor++;
      } else if (tzCode === 43 || tzCode === 45) {
        offsetSign = tzCode === 43 ? "+" : "-";
        if (cursor + 6 > length || data.charCodeAt(cursor + 3) !== 58) {
          return false;
        }
        offsetHour = parseTwoDigits(data, cursor + 1);
        offsetMinute = parseTwoDigits(data, cursor + 4);
        if (offsetHour < 0 || offsetMinute < 0 || offsetHour > 23 || offsetMinute > 59) {
          return false;
        }
        cursor += 6;
      } else {
        return false;
      }
    }
    if (cursor !== length) {
      return false;
    }
    if (month < 1 || month > 12) {
      return false;
    }
    if (day < 1) {
      return false;
    }
    const maxDays = month === 2 ? year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0) ? 29 : 28 : DAYS_IN_MONTH[month - 1];
    if (!maxDays || day > maxDays) {
      return false;
    }
    if (second === 60) {
      let utcTotalMinutes = hour * 60 + minute;
      if (offsetSign) {
        const offsetTotalMinutes = offsetHour * 60 + offsetMinute;
        utcTotalMinutes += offsetSign === "+" ? -offsetTotalMinutes : offsetTotalMinutes;
        utcTotalMinutes %= 24 * 60;
        if (utcTotalMinutes < 0) {
          utcTotalMinutes += 24 * 60;
        }
      }
      if (utcTotalMinutes !== 23 * 60 + 59) {
        return false;
      }
    }
    return true;
  },
  uri(data) {
    const scheme = data.indexOf(":") + 1;
    return URI_REGEX.test(data) && hasOnlyUriCharacters(data, false) && hasValidAuthority(data, scheme);
  },
  email(data) {
    if (EMAIL_REGEX.test(data)) {
      return true;
    }
    const at = data.lastIndexOf("@");
    if (at < 1 || at === data.length - 1) {
      return false;
    }
    const local = data.slice(0, at);
    const domain = data.slice(at + 1);
    const quotedLocal = local.length >= 2 && local.startsWith('"') && local.endsWith('"') && !/[\r\n]/.test(local.slice(1, -1));
    if (!quotedLocal && !EMAIL_REGEX.test(`${local}@example.com`)) {
      return false;
    }
    if (quotedLocal && EMAIL_REGEX.test(`x@${domain}`)) {
      return true;
    }
    if (!domain.startsWith("[") || !domain.endsWith("]")) {
      return false;
    }
    const literal = domain.slice(1, -1);
    return literal.startsWith("IPv6:") ? isValidIpv6(literal.slice(5)) : isValidIpv4(literal);
  },
  ipv4(data) {
    return isValidIpv4(data);
  },
  ipv6(data) {
    return isValidIpv6(data);
  },
  hostname(data) {
    return isValidHostname(data);
  },
  date(data) {
    if (data.length !== 10 || data.charCodeAt(4) !== 45 || data.charCodeAt(7) !== 45) {
      return false;
    }
    const year = parseFourDigits(data, 0);
    const month = parseTwoDigits(data, 5);
    const day = parseTwoDigits(data, 8);
    if (year < 0 || month < 1 || month > 12) {
      return false;
    }
    if (day < 1) {
      return false;
    }
    const maxDays = month === 2 ? year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0) ? 29 : 28 : DAYS_IN_MONTH[month - 1];
    return !!maxDays && day <= maxDays;
  },
  regex(data) {
    try {
      new RegExp(data, "u");
      return true;
    } catch (e) {
      return false;
    }
  },
  "json-pointer"(data) {
    return isValidJsonPointer(data);
  },
  "relative-json-pointer"(data) {
    return isValidRelativeJsonPointer(data);
  },
  time(data) {
    return isValidTime(data);
  },
  "uri-reference"(data) {
    if (!hasOnlyUriCharacters(data, false)) {
      return false;
    }
    const colon = data.indexOf(":");
    const schemeEnd = colon !== -1 && /^[A-Za-z][A-Za-z0-9+.-]*$/.test(data.slice(0, colon)) ? colon + 1 : 0;
    return URI_REFERENCE_REGEX.test(data) && hasValidAuthority(data, schemeEnd);
  },
  "uri-template"(data) {
    return isValidUriTemplate(data);
  },
  duration(data) {
    if (!DURATION_REGEX.test(data)) {
      return false;
    }
    const timeStart = data.indexOf("T");
    const datePart = timeStart === -1 ? data : data.slice(0, timeStart);
    const timePart = timeStart === -1 ? "" : data.slice(timeStart + 1);
    if (data.includes("W")) {
      return /^P\d+W$/.test(data);
    }
    if (datePart.includes("Y") && datePart.includes("D") && !datePart.includes("M")) {
      return false;
    }
    if (timePart.includes("H") && timePart.includes("S") && !timePart.includes("M")) {
      return false;
    }
    return true;
  },
  uuid(data) {
    return UUID_REGEX.test(data);
  },
  // IRI is like URI but allows Unicode. We reuse a permissive logic.
  iri(data) {
    const scheme = data.indexOf(":") + 1;
    return IRI_REGEX.test(data) && hasOnlyUriCharacters(data, true) && hasValidAuthority(data, scheme);
  },
  "iri-reference"(data) {
    if (!hasOnlyUriCharacters(data, true)) {
      return false;
    }
    const colon = data.indexOf(":");
    const schemeEnd = colon !== -1 && /^[A-Za-z][A-Za-z0-9+.-]*$/.test(data.slice(0, colon)) ? colon + 1 : 0;
    return IRI_REFERENCE_REGEX.test(data) && hasValidAuthority(data, schemeEnd);
  },
  "idn-email"(data) {
    return isValidIdnEmail(data);
  },
  "idn-hostname"(data) {
    return isValidIdnHostname(data);
  }
};
var Types = {
  object(data) {
    return data !== null && typeof data === "object" && !Array.isArray(data);
  },
  array(data) {
    return Array.isArray(data);
  },
  string(data) {
    return typeof data === "string";
  },
  number(data) {
    return typeof data === "number" && Number.isFinite(data);
  },
  integer(data) {
    return typeof data === "number" && Number.isFinite(data) && data % 1 === 0;
  },
  boolean(data) {
    return typeof data === "boolean";
  },
  null(data) {
    return data === null;
  },
  undefined(data) {
    return typeof data === "undefined";
  },
  // Not implemented yet
  timestamp: false,
  int8: false,
  uint8: false,
  int16: false,
  uint16: false,
  int32: false,
  uint32: false,
  float32: false,
  float64: false
};
function hasChanged(prev, current) {
  if (Object.is(prev, current)) {
    return false;
  }
  if (Array.isArray(prev)) {
    if (Array.isArray(current) === false) {
      return true;
    }
    if (prev.length !== current.length) {
      return true;
    }
    for (let i = 0; i < current.length; i++) {
      if (hasChanged(prev[i], current[i])) {
        return true;
      }
    }
    return false;
  }
  if (typeof prev === "object" && prev !== null) {
    if (typeof current !== "object" || current === null) {
      return true;
    }
    for (const key in current) {
      if (hasChanged(prev[key], current[key])) {
        return true;
      }
    }
    for (const key in prev) {
      if (key in current) {
        continue;
      }
      if (hasChanged(prev[key], void 0)) {
        return true;
      }
    }
    return false;
  }
  return true;
}
function isUniquePrimitive(value) {
  return value === null || typeof value === "string" || typeof value === "number" || typeof value === "boolean";
}
function getArrayBucketKey(value) {
  const length = value.length;
  if (length === 0) {
    return "0";
  }
  const first = value[0];
  const last = value[length - 1];
  const firstType = first === null ? "null" : typeof first;
  const lastType = last === null ? "null" : typeof last;
  let firstArrayMarker = "";
  if (Array.isArray(first)) {
    const firstSignature = getPrimitiveArraySignature(first);
    firstArrayMarker = firstSignature === null ? `a:${first.length}` : firstSignature;
  }
  let lastArrayMarker = "";
  if (Array.isArray(last)) {
    const lastSignature = getPrimitiveArraySignature(last);
    lastArrayMarker = lastSignature === null ? `a:${last.length}` : lastSignature;
  }
  return `${length}:${firstType}:${firstArrayMarker}:${lastType}:${lastArrayMarker}`;
}
function getObjectShapeKey(value) {
  const keys = Object.keys(value).sort();
  return `${keys.length}:${keys.join("")}`;
}
function getPrimitiveArraySignature(value) {
  const length = value.length;
  if (length === 0) {
    return "a:0";
  }
  if (!isUniquePrimitive(value[0]) || !isUniquePrimitive(value[length - 1])) {
    return null;
  }
  let signature = `a:${length}:`;
  for (let i = 0; i < length; i++) {
    const item = value[i];
    if (item === null) {
      signature += "l;";
      continue;
    }
    if (typeof item === "string") {
      signature += `s${item.length}:${item};`;
      continue;
    }
    if (typeof item === "number") {
      if (Number.isNaN(item)) {
        signature += "n:NaN;";
        continue;
      }
      if (Object.is(item, -0)) {
        signature += "n:-0;";
        continue;
      }
      signature += `n:${item};`;
      continue;
    }
    if (typeof item === "boolean") {
      signature += item ? "b:1;" : "b:0;";
      continue;
    }
    return null;
  }
  return signature;
}
var ArrayKeywords = {
  // lib/keywords/array-keywords.ts
  items(schema, data, defineError, _instance, validateSubschema) {
    if (!Array.isArray(data)) {
      return;
    }
    const schemaItems = schema.items;
    const dataLength = data.length;
    const startIndex = schema._dialect === "2020-12" && Array.isArray(schema.prefixItems) ? schema.prefixItems.length : 0;
    if (typeof schemaItems === "boolean") {
      if (schemaItems === false && dataLength > startIndex) {
        return defineError("Array items are not allowed", { data });
      }
      if (validateSubschema) {
        for (let i = startIndex; i < dataLength; i++) {
          validateSubschema(true, data[i], { item: i });
        }
      }
      return;
    }
    if (Array.isArray(schemaItems)) {
      if (schema._dialect === "2020-12") {
        return;
      }
      const schemaItemsLength = schemaItems.length;
      const itemsLength = schemaItemsLength < dataLength ? schemaItemsLength : dataLength;
      for (let i = 0; i < itemsLength; i++) {
        const schemaItem = schemaItems[i];
        if (validateSubschema) {
          const error = validateSubschema(schemaItem, data[i], { item: i });
          if (error) {
            return defineError("Array item is invalid", {
              item: i,
              cause: error,
              data: data[i]
            });
          }
          continue;
        }
        if (typeof schemaItem === "boolean") {
          if (schemaItem === false && data[i] !== void 0) {
            return defineError("Array item is not allowed", {
              item: i,
              data: data[i]
            });
          }
          continue;
        }
        const validate2 = schemaItem && schemaItem.$validate;
        if (typeof validate2 === "function") {
          const error = validate2(data[i]);
          if (error) {
            return defineError("Array item is invalid", {
              item: i,
              cause: error,
              data: data[i]
            });
          }
        }
      }
      return;
    }
    const validate = schemaItems && schemaItems.$validate;
    if (typeof validate !== "function") {
      return;
    }
    for (let i = startIndex; i < dataLength; i++) {
      const error = validateSubschema ? validateSubschema(schemaItems, data[i], { item: i }) : validate(data[i]);
      if (error) {
        return defineError("Array item is invalid", {
          item: i,
          cause: error,
          data: data[i]
        });
      }
    }
  },
  elements(schema, data, defineError) {
    if (!Array.isArray(data)) {
      return;
    }
    const elementsSchema = schema.elements;
    const validate = elementsSchema && elementsSchema.$validate;
    if (typeof validate !== "function") {
      return;
    }
    for (let i = 0; i < data.length; i++) {
      const error = validate(data[i]);
      if (error) {
        return defineError("Array item is invalid", {
          item: i,
          cause: error,
          data: data[i]
        });
      }
    }
  },
  minItems(schema, data, defineError) {
    if (!Array.isArray(data) || data.length >= schema.minItems) {
      return;
    }
    return defineError("Array is too short", { data });
  },
  maxItems(schema, data, defineError) {
    if (!Array.isArray(data) || data.length <= schema.maxItems) {
      return;
    }
    return defineError("Array is too long", { data });
  },
  additionalItems(schema, data, defineError, _instance, validateSubschema) {
    if (!Array.isArray(data) || !Array.isArray(schema.items)) {
      return;
    }
    let tupleLength = schema._tupleItemsLength;
    if (tupleLength === void 0) {
      tupleLength = schema.items.length;
      definePropertyOrThrow(schema, "_tupleItemsLength", {
        value: tupleLength,
        enumerable: false,
        configurable: false,
        writable: false
      });
    }
    if (data.length <= tupleLength) {
      return;
    }
    if (schema.additionalItems === false) {
      return defineError("Array is too long", { data });
    }
    if (validateSubschema) {
      for (let i = tupleLength; i < data.length; i++) {
        const error = validateSubschema(schema.additionalItems, data[i], {
          item: i
        });
        if (error) {
          return defineError("Array item is invalid", {
            item: i,
            cause: error,
            data: data[i]
          });
        }
      }
      return;
    }
    if (schema.additionalItems && typeof schema.additionalItems === "object" && !Array.isArray(schema.additionalItems)) {
      if (isCompiledSchema(schema.additionalItems)) {
        for (let i = tupleLength; i < data.length; i++) {
          const error = schema.additionalItems.$validate(data[i]);
          if (error) {
            return defineError("Array item is invalid", {
              item: i,
              cause: error,
              data: data[i]
            });
          }
        }
        return;
      }
      return;
    }
    return;
  },
  prefixItems(schema, data, defineError, _instance, validateSubschema) {
    if (!Array.isArray(data) || !Array.isArray(schema.prefixItems)) {
      return;
    }
    const limit = Math.min(data.length, schema.prefixItems.length);
    for (let index = 0; index < limit; index++) {
      const prefixSchema = schema.prefixItems[index];
      if (validateSubschema) {
        const error2 = validateSubschema(prefixSchema, data[index], {
          item: index
        });
        if (error2) {
          return defineError("Array item is invalid", {
            item: index,
            cause: error2,
            data: data[index]
          });
        }
        continue;
      }
      if (prefixSchema === false) {
        return defineError("Array item is not allowed", {
          item: index,
          data: data[index]
        });
      }
      if (!isCompiledSchema(prefixSchema)) {
        continue;
      }
      const error = prefixSchema.$validate(data[index]);
      if (error) {
        return defineError("Array item is invalid", {
          item: index,
          cause: error,
          data: data[index]
        });
      }
    }
  },
  uniqueItems(schema, data, defineError) {
    if (!Array.isArray(data) || !schema.uniqueItems) {
      return;
    }
    const len = data.length;
    if (len <= 1) {
      return;
    }
    if (len <= 8) {
      for (let i = 0; i < len; i++) {
        const left = data[i];
        for (let j = i + 1; j < len; j++) {
          const right = data[j];
          if (left === right) {
            return defineError("Array items are not unique", { data: right });
          }
          if (typeof left === "number" && typeof right === "number" && Number.isNaN(left) && Number.isNaN(right)) {
            return defineError("Array items are not unique", { data: right });
          }
          if (left && right && typeof left === "object" && typeof right === "object" && !hasChanged(left, right)) {
            return defineError("Array items are not unique", { data: right });
          }
        }
      }
      return;
    }
    let hasFirstPrimitive = false;
    let firstPrimitive;
    let primitiveSeen;
    let primitiveArraySignatures;
    let arrayBuckets;
    let objectBuckets;
    for (let i = 0; i < len; i++) {
      const item = data[i];
      if (isUniquePrimitive(item)) {
        if (!hasFirstPrimitive) {
          hasFirstPrimitive = true;
          firstPrimitive = item;
          continue;
        }
        if (!primitiveSeen) {
          primitiveSeen = /* @__PURE__ */ new Set([firstPrimitive]);
        }
        if (primitiveSeen.has(item)) {
          return defineError("Array items are not unique", { data: item });
        }
        primitiveSeen.add(item);
        continue;
      }
      if (!item || typeof item !== "object") {
        continue;
      }
      if (Array.isArray(item)) {
        const signature = getPrimitiveArraySignature(item);
        if (signature !== null) {
          if (!primitiveArraySignatures) {
            primitiveArraySignatures = /* @__PURE__ */ new Set();
          }
          if (primitiveArraySignatures.has(signature)) {
            return defineError("Array items are not unique", { data: item });
          }
          primitiveArraySignatures.add(signature);
          continue;
        }
        if (!arrayBuckets) {
          arrayBuckets = /* @__PURE__ */ new Map();
        }
        const bucketKey2 = getArrayBucketKey(item);
        let candidates2 = arrayBuckets.get(bucketKey2);
        if (!candidates2) {
          candidates2 = [];
          arrayBuckets.set(bucketKey2, candidates2);
        }
        for (let j = 0; j < candidates2.length; j++) {
          if (!hasChanged(candidates2[j], item)) {
            return defineError("Array items are not unique", { data: item });
          }
        }
        candidates2.push(item);
        continue;
      }
      if (!objectBuckets) {
        objectBuckets = /* @__PURE__ */ new Map();
      }
      const bucketKey = getObjectShapeKey(item);
      let candidates = objectBuckets.get(bucketKey);
      if (!candidates) {
        candidates = [];
        objectBuckets.set(bucketKey, candidates);
      }
      for (let j = 0; j < candidates.length; j++) {
        if (!hasChanged(candidates[j], item)) {
          return defineError("Array items are not unique", { data: item });
        }
      }
      candidates.push(item);
    }
  },
  contains(schema, data, defineError, _instance, validateSubschema) {
    if (!Array.isArray(data)) {
      return;
    }
    const modern = schema._dialect === "2019-09" || schema._dialect === "2020-12";
    const configuredMinimum = schema.minContains;
    const configuredMaximum = schema.maxContains;
    const minimum = modern && Number.isInteger(configuredMinimum) && configuredMinimum >= 0 ? configuredMinimum : 1;
    const maximum = modern && Number.isInteger(configuredMaximum) && configuredMaximum >= 0 ? configuredMaximum : Number.POSITIVE_INFINITY;
    let matches = 0;
    const savepoint = validateSubschema?.savepoint?.();
    try {
      if (typeof schema.contains === "boolean") {
        matches = schema.contains ? data.length : 0;
        if (schema.contains && validateSubschema) {
          for (let i = 0; i < data.length; i++) {
            validateSubschema(true, data[i], { item: i });
          }
        }
      } else if (isCompiledSchema(schema.contains)) {
        for (let i = 0; i < data.length; i++) {
          const error = validateSubschema ? validateSubschema(schema.contains, data[i], { item: i }) : schema.contains.$validate(data[i]);
          if (!error) {
            matches++;
            if (matches > maximum) {
              break;
            }
          }
        }
      }
      if (matches >= minimum && matches <= maximum) {
        return;
      }
      if (typeof savepoint === "number") {
        validateSubschema?.rollback?.(savepoint);
      }
      return defineError("Array contains an invalid number of matching items", {
        data
      });
    } catch (error) {
      if (typeof savepoint === "number") {
        validateSubschema?.rollback?.(savepoint);
      }
      throw error;
    }
  },
  minContains() {
    return;
  },
  maxContains() {
    return;
  },
  unevaluatedItems(schema, data, defineError, _instance, validateSubschema) {
    if (!Array.isArray(data) || !validateSubschema) {
      return;
    }
    for (let index = 0; index < data.length; index++) {
      const error = validateSubschema(schema.unevaluatedItems, data[index], {
        item: index,
        unevaluated: true
      });
      if (error) {
        return defineError("Unevaluated array item is invalid", {
          item: index,
          cause: error,
          data: data[index]
        });
      }
    }
  }
};
function deepFreeze(obj, freezeClassInstances = false, seen = /* @__PURE__ */ new WeakSet()) {
  if (obj === null || typeof obj !== "object" || seen.has(obj) || Object.isFrozen(obj)) {
    return obj;
  }
  seen.add(obj);
  if (Array.isArray(obj)) {
    for (let i = 0, l = obj.length; i < l; i++) {
      deepFreeze(obj[i], freezeClassInstances, seen);
    }
  } else {
    const props = Reflect.ownKeys(obj);
    for (let i = 0, l = props.length; i < l; i++) {
      deepFreeze(obj[props[i]], freezeClassInstances, seen);
    }
    if (freezeClassInstances) {
      const proto = Reflect.getPrototypeOf(obj);
      if (proto && proto !== Object.prototype) {
        deepFreeze(proto, freezeClassInstances, seen);
      }
    }
  }
  Object.freeze(obj);
  return obj;
}
function deepCloneUnfreeze(obj) {
  return structuredClone(obj);
}
var NumberKeywords = {
  minimum(schema, data, defineError, instance) {
    if (typeof data !== "number") {
      return;
    }
    if (!Number.isFinite(data)) {
      return defineError("Value must be finite", { data });
    }
    if (schema._dialect !== "draft4" && typeof schema.exclusiveMinimum === "number") {
      if (data <= schema.exclusiveMinimum) {
        return defineError("Value is less than or equal to the exclusiveMinimum", {
          data
        });
      }
    } else if (schema.exclusiveMinimum === true) {
      if (data <= schema.minimum) {
        return defineError("Value is less than or equal to the minimum", { data });
      }
    } else if (data < schema.minimum) {
      return defineError("Value is less than the minimum", { data });
    }
    return;
  },
  maximum(schema, data, defineError, instance) {
    if (typeof data !== "number") {
      return;
    }
    if (!Number.isFinite(data)) {
      return defineError("Value must be finite", { data });
    }
    if (schema._dialect !== "draft4" && typeof schema.exclusiveMaximum === "number") {
      if (data >= schema.exclusiveMaximum) {
        return defineError(
          "Value is greater than or equal to the exclusiveMaximum",
          { data }
        );
      }
    } else if (schema.exclusiveMaximum === true) {
      if (data >= schema.maximum) {
        return defineError("Value is greater than or equal to the maximum", {
          data
        });
      }
    } else if (data > schema.maximum) {
      return defineError("Value is greater than the maximum", { data });
    }
    return;
  },
  multipleOf(schema, data, defineError, instance) {
    if (typeof data !== "number") {
      return;
    }
    if (!Number.isFinite(data) || !Number.isFinite(schema.multipleOf) || schema.multipleOf <= 0) {
      return defineError("Value must use a finite positive multipleOf", {
        data
      });
    }
    const quotient = data / schema.multipleOf;
    const valid = Number.isFinite(quotient) ? areCloseEnough(quotient, Math.round(quotient)) : data % schema.multipleOf === 0;
    if (!valid) {
      return defineError("Value is not a multiple of the multipleOf", { data });
    }
    return;
  },
  exclusiveMinimum(schema, data, defineError, instance) {
    if (typeof data !== "number" || schema._dialect === "draft4" || typeof schema.exclusiveMinimum !== "number" || "minimum" in schema) {
      return;
    }
    if (data <= schema.exclusiveMinimum) {
      return defineError("Value is less than or equal to the exclusiveMinimum");
    }
    return;
  },
  exclusiveMaximum(schema, data, defineError, instance) {
    if (typeof data !== "number" || schema._dialect === "draft4" || typeof schema.exclusiveMaximum !== "number" || "maximum" in schema) {
      return;
    }
    if (data >= schema.exclusiveMaximum) {
      return defineError(
        "Value is greater than or equal to the exclusiveMaximum",
        { data }
      );
    }
    return;
  }
};
var REGEX_META_CHARS = /[\\.^$*+?()[\]{}|]/;
function hasRegexMeta(value) {
  return REGEX_META_CHARS.test(value);
}
var PATTERN_CACHE = /* @__PURE__ */ new Map();
function compilePatternMatcher(pattern) {
  const cached = PATTERN_CACHE.get(pattern);
  if (cached) {
    return cached;
  }
  let compiled;
  if (pattern.length === 0) {
    compiled = (_value) => true;
  } else if (!hasRegexMeta(pattern)) {
    compiled = (value) => value.includes(pattern);
  } else {
    const patternLength = pattern.length;
    if (patternLength >= 2 && pattern[0] === "^" && pattern[patternLength - 1] === "$") {
      const inner = pattern.slice(1, -1);
      if (!hasRegexMeta(inner)) {
        if (inner.length === 0) {
          compiled = (value) => value.length === 0;
        } else {
          compiled = (value) => value === inner;
        }
      } else {
        compiled = new RegExp(pattern, "u");
      }
    } else if (pattern[0] === "^") {
      const inner = pattern.slice(1);
      if (!hasRegexMeta(inner)) {
        if (inner.length === 0) {
          compiled = (_value) => true;
        } else {
          compiled = (value) => value.startsWith(inner);
        }
      } else {
        compiled = new RegExp(pattern, "u");
      }
    } else if (pattern[patternLength - 1] === "$") {
      const inner = pattern.slice(0, -1);
      if (!hasRegexMeta(inner)) {
        if (inner.length === 0) {
          compiled = (_value) => true;
        } else {
          compiled = (value) => value.endsWith(inner);
        }
      } else {
        compiled = new RegExp(pattern, "u");
      }
    } else {
      compiled = new RegExp(pattern, "u");
    }
  }
  PATTERN_CACHE.set(pattern, compiled);
  return compiled;
}
var PATTERN_KEY_CACHE_LIMIT = 512;
function createApplyPropertyDefaults(replaceEmpty) {
  return function applyPropertyDefaults2(schema, data, instance) {
    if (!data || typeof data !== "object" || Array.isArray(data)) {
      return;
    }
    const defaultKeys = schema._defaultKeys;
    for (let i = 0; i < defaultKeys.length; i++) {
      const key = defaultKeys[i];
      const hasOwnValue = hasOwn(data, key);
      const value = hasOwnValue ? data[key] : void 0;
      if (hasOwnValue && value !== void 0 && (!replaceEmpty || value !== null && value !== "")) {
        continue;
      }
      instance.setDefault(
        data,
        key,
        deepCloneUnfreeze(schema.properties[key].default)
      );
    }
  };
}
var applyPropertyDefaults = createApplyPropertyDefaults(false);
var applyEmptyPropertyDefaults = createApplyPropertyDefaults(true);
function getPatternPropertyEntries(schema) {
  let entries = schema._patternPropertyEntries;
  if (entries) {
    return entries;
  }
  if (!schema.patternProperties || typeof schema.patternProperties !== "object" || Array.isArray(schema.patternProperties)) {
    return void 0;
  }
  const patternKeys = Object.keys(schema.patternProperties);
  entries = new Array(patternKeys.length);
  for (let i = 0; i < patternKeys.length; i++) {
    const key = patternKeys[i];
    const compiledMatcher = compilePatternMatcher(key);
    const match = compiledMatcher instanceof RegExp ? (value) => compiledMatcher.test(value) : compiledMatcher;
    entries[i] = {
      schemaProp: schema.patternProperties[key],
      match
    };
  }
  definePropertyOrThrow(schema, "_patternPropertyEntries", {
    value: entries,
    enumerable: false,
    configurable: false,
    writable: false
  });
  return entries;
}
function getPatternKeyMatchIndexes(schema, key, entries) {
  let cache = schema._patternKeyMatchIndexCache;
  if (cache) {
    const cached = cache.get(key);
    if (cached) {
      return cached;
    }
  } else {
    cache = /* @__PURE__ */ new Map();
    definePropertyOrThrow(schema, "_patternKeyMatchIndexCache", {
      value: cache,
      enumerable: false,
      configurable: false,
      writable: false
    });
  }
  const indexes = [];
  for (let i = 0; i < entries.length; i++) {
    if (entries[i].match(key)) {
      indexes.push(i);
    }
  }
  if (cache.size < PATTERN_KEY_CACHE_LIMIT) {
    cache.set(key, indexes);
  }
  return indexes;
}
function decodeBase64(data) {
  if (data.length % 4 !== 0 || !/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(
    data
  )) {
    return null;
  }
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  const bytes = [];
  for (let index = 0; index < data.length; index += 4) {
    const first = alphabet.indexOf(data[index]);
    const second = alphabet.indexOf(data[index + 1]);
    const third = data[index + 2] === "=" ? 0 : alphabet.indexOf(data[index + 2]);
    const fourth = data[index + 3] === "=" ? 0 : alphabet.indexOf(data[index + 3]);
    const value = first << 18 | second << 12 | third << 6 | fourth;
    bytes.push(value >> 16 & 255);
    if (data[index + 2] !== "=") {
      bytes.push(value >> 8 & 255);
    }
    if (data[index + 3] !== "=") {
      bytes.push(value & 255);
    }
  }
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(
      new Uint8Array(bytes)
    );
  } catch {
    return null;
  }
}
var ObjectKeywords = {
  required(schema, data, defineError) {
    if (!data || typeof data !== "object" || Array.isArray(data)) {
      return;
    }
    for (let i = 0; i < schema.required.length; i++) {
      const key = schema.required[i];
      if (!hasOwn(data, key)) {
        return defineError("Required property is missing", {
          item: key,
          data: data[key]
        });
      }
    }
    return;
  },
  properties(schema, data, defineError, _instance, validateSubschema) {
    if (!data || typeof data !== "object" || Array.isArray(data)) {
      return;
    }
    const propKeys = schema._propKeys;
    for (let i = 0; i < propKeys.length; i++) {
      const key = propKeys[i];
      const schemaProp = schema.properties[key];
      if (!hasOwn(data, key)) {
        continue;
      }
      if (validateSubschema) {
        const error = validateSubschema(schemaProp, data[key], { property: key });
        if (error) {
          return defineError("Property is invalid", {
            item: key,
            cause: error,
            data: data[key]
          });
        }
        continue;
      }
      if (typeof schemaProp === "boolean") {
        if (schemaProp === false) {
          return defineError("Property is not allowed", {
            item: key,
            data: data[key]
          });
        }
        continue;
      }
      if (schemaProp && "$validate" in schemaProp) {
        const error = schemaProp.$validate(data[key]);
        if (error) {
          return defineError("Property is invalid", {
            item: key,
            cause: error,
            data: data[key]
          });
        }
      }
    }
    return;
  },
  values(schema, data, defineError) {
    if (!data || typeof data !== "object" || Array.isArray(data)) {
      return;
    }
    const valueSchema = schema.values;
    const validate = valueSchema && valueSchema.$validate;
    if (typeof validate !== "function") {
      return;
    }
    for (const key in data) {
      if (!hasOwn(data, key)) {
        continue;
      }
      const error = validate(data[key]);
      if (error) {
        return defineError("Property is invalid", {
          item: key,
          cause: error,
          data: data[key]
        });
      }
    }
  },
  maxProperties(schema, data, defineError) {
    if (!data || typeof data !== "object" || Array.isArray(data)) {
      return;
    }
    let count = 0;
    for (const key in data) {
      if (!hasOwn(data, key)) {
        continue;
      }
      count++;
      if (count > schema.maxProperties) {
        return defineError("Too many properties", { data });
      }
    }
    return;
  },
  minProperties(schema, data, defineError) {
    if (!data || typeof data !== "object" || Array.isArray(data)) {
      return;
    }
    let count = 0;
    for (const key in data) {
      if (!hasOwn(data, key)) {
        continue;
      }
      count++;
      if (count >= schema.minProperties) {
        return;
      }
    }
    return defineError("Too few properties", { data });
  },
  additionalProperties(schema, data, defineError, _instance, validateSubschema) {
    if (!data || typeof data !== "object" || Array.isArray(data)) {
      return;
    }
    let apValidate = schema._apValidate;
    if (apValidate === void 0) {
      apValidate = isCompiledSchema(schema.additionalProperties) ? schema.additionalProperties.$validate : null;
      definePropertyOrThrow(schema, "_apValidate", {
        value: apValidate,
        enumerable: false,
        configurable: false,
        writable: false
      });
    }
    const patternEntries = getPatternPropertyEntries(schema);
    for (const key in data) {
      if (!hasOwn(data, key)) {
        continue;
      }
      if (schema.properties && hasOwn(schema.properties, key)) {
        continue;
      }
      if (patternEntries && patternEntries.length) {
        if (getPatternKeyMatchIndexes(schema, key, patternEntries).length > 0) {
          continue;
        }
      }
      if (schema.additionalProperties === false) {
        return defineError("Additional properties are not allowed", {
          item: key,
          data: data[key]
        });
      }
      if (validateSubschema) {
        const error = validateSubschema(schema.additionalProperties, data[key], {
          property: key
        });
        if (error) {
          return defineError("Additional properties are invalid", {
            item: key,
            cause: error,
            data: data[key]
          });
        }
        continue;
      }
      if (apValidate) {
        const error = apValidate(data[key]);
        if (error) {
          return defineError("Additional properties are invalid", {
            item: key,
            cause: error,
            data: data[key]
          });
        }
      }
    }
    return;
  },
  patternProperties(schema, data, defineError, _instance, validateSubschema) {
    if (!data || typeof data !== "object" || Array.isArray(data)) {
      return;
    }
    const patternEntries = getPatternPropertyEntries(schema);
    if (!patternEntries || patternEntries.length === 0) {
      return;
    }
    for (const key in data) {
      if (!hasOwn(data, key)) {
        continue;
      }
      const matchingIndexes = getPatternKeyMatchIndexes(schema, key, patternEntries);
      if (matchingIndexes.length === 0) {
        if (schema.additionalProperties === false && !(schema.properties && hasOwn(schema.properties, key))) {
          return defineError("Additional properties are not allowed", {
            item: key,
            data: data[key]
          });
        }
        continue;
      }
      for (let j = 0; j < matchingIndexes.length; j++) {
        const schemaProp = patternEntries[matchingIndexes[j]].schemaProp;
        if (validateSubschema) {
          const error = validateSubschema(schemaProp, data[key], { property: key });
          if (error) {
            return defineError("Property is invalid", {
              item: key,
              cause: error,
              data: data[key]
            });
          }
          continue;
        }
        if (typeof schemaProp === "boolean") {
          if (schemaProp === false) {
            return defineError("Property is not allowed", {
              item: key,
              data: data[key]
            });
          }
          continue;
        }
        if ("$validate" in schemaProp) {
          const error = schemaProp.$validate(data[key]);
          if (error) {
            return defineError("Property is invalid", {
              item: key,
              cause: error,
              data: data[key]
            });
          }
        }
      }
    }
    return;
  },
  propertyNames(schema, data, defineError) {
    if (!data || typeof data !== "object" || Array.isArray(data)) {
      return;
    }
    const pn = schema.propertyNames;
    if (typeof pn === "boolean") {
      if (pn === false) {
        for (const key in data) {
          if (hasOwn(data, key)) {
            return defineError("Properties are not allowed", { data });
          }
        }
      }
      return;
    }
    const validate = pn && pn.$validate;
    if (typeof validate !== "function") {
      return;
    }
    for (const key in data) {
      if (!hasOwn(data, key)) {
        continue;
      }
      const error = validate(key);
      if (error) {
        return defineError("Property name is invalid", {
          item: key,
          cause: error,
          data: data[key]
        });
      }
    }
  },
  dependencies(schema, data, defineError, _instance, validateSubschema) {
    if (!data || typeof data !== "object" || Array.isArray(data)) {
      return;
    }
    for (const key in schema.dependencies) {
      if (key in data === false) {
        continue;
      }
      const dependency = schema.dependencies[key];
      if (Array.isArray(dependency)) {
        for (let i = 0; i < dependency.length; i++) {
          if (!(dependency[i] in data)) {
            return defineError("Dependency is not satisfied", {
              item: i,
              data: dependency[i]
            });
          }
        }
        continue;
      }
      if (typeof dependency === "boolean") {
        if (dependency) {
          continue;
        }
        return defineError("Dependency is not satisfied", { data: dependency });
      }
      if (typeof dependency === "string") {
        if (dependency in data) {
          continue;
        }
        return defineError("Dependency is not satisfied", { data: dependency });
      }
      const error = validateSubschema ? validateSubschema(dependency, data) : dependency.$validate(data);
      if (error) {
        return defineError("Dependency is not satisfied", {
          cause: error,
          data
        });
      }
    }
    return;
  },
  dependentRequired(schema, data, defineError) {
    if (!data || typeof data !== "object" || Array.isArray(data) || !schema.dependentRequired || typeof schema.dependentRequired !== "object" || Array.isArray(schema.dependentRequired)) {
      return;
    }
    for (const key of Object.keys(schema.dependentRequired)) {
      if (!hasOwn(data, key)) {
        continue;
      }
      const required = schema.dependentRequired[key];
      if (!Array.isArray(required)) {
        continue;
      }
      for (let index = 0; index < required.length; index++) {
        if (typeof required[index] !== "string" || hasOwn(data, required[index])) {
          continue;
        }
        return defineError("Dependent property is missing", {
          item: required[index],
          data
        });
      }
    }
  },
  dependentSchemas(schema, data, defineError, _instance, validateSubschema) {
    if (!data || typeof data !== "object" || Array.isArray(data) || !schema.dependentSchemas || typeof schema.dependentSchemas !== "object" || Array.isArray(schema.dependentSchemas)) {
      return;
    }
    for (const key of Object.keys(schema.dependentSchemas)) {
      if (!hasOwn(data, key)) {
        continue;
      }
      const dependentSchema = schema.dependentSchemas[key];
      if (dependentSchema === false) {
        return defineError("Dependent schema is not satisfied", { data });
      }
      if (!isCompiledSchema(dependentSchema)) {
        continue;
      }
      const error = validateSubschema ? validateSubschema(dependentSchema, data) : dependentSchema.$validate(data);
      if (error) {
        return defineError("Dependent schema is not satisfied", {
          cause: error,
          data
        });
      }
    }
  },
  contentEncoding(schema, data, defineError) {
    if (typeof data !== "string" || schema.contentEncoding !== "base64") {
      return;
    }
    if (decodeBase64(data) !== null) {
      return;
    }
    return defineError("String content encoding is invalid", { data });
  },
  contentMediaType(schema, data, defineError) {
    if (typeof data !== "string" || schema.contentMediaType !== "application/json") {
      return;
    }
    const content = schema.contentEncoding === "base64" ? decodeBase64(data) : data;
    if (content === null) {
      return defineError("String content encoding is invalid", { data });
    }
    try {
      JSON.parse(content);
      return;
    } catch {
      return defineError("String content does not match its media type", {
        data
      });
    }
  },
  unevaluatedProperties(schema, data, defineError, _instance, validateSubschema) {
    if (!data || typeof data !== "object" || Array.isArray(data) || !validateSubschema) {
      return;
    }
    for (const key of Object.keys(data)) {
      const error = validateSubschema(schema.unevaluatedProperties, data[key], {
        property: key,
        unevaluated: true
      });
      if (error) {
        return defineError("Unevaluated property is invalid", {
          item: key,
          cause: error,
          data: data[key]
        });
      }
    }
  },
  // Required by other keywords but not used as a function itself
  then: false,
  else: false,
  default: false,
  // Not implemented yet
  definitions: false,
  $id: false,
  $schema: false,
  // Metadata keywords (not used as a function)
  title: false,
  description: false,
  $comment: false,
  examples: false,
  contentSchema: false,
  // Not supported Open API keywords
  discriminator: false,
  nullable: false
};
function toBranchEntry(item) {
  if (item && typeof item === "object" && !Array.isArray(item)) {
    if ("$validate" in item && typeof item.$validate === "function") {
      return { kind: "validate", validate: item.$validate };
    }
    return { kind: "alwaysValid" };
  }
  if (typeof item === "boolean") {
    return { kind: item ? "alwaysValid" : "alwaysInvalid" };
  }
  return { kind: "literal", value: item };
}
function getBranchEntries(schema, key) {
  const cacheKey = `_${key}BranchEntries`;
  let entries = schema[cacheKey];
  if (entries) {
    return entries;
  }
  const source = schema[key] || [];
  entries = [];
  for (let i = 0; i < source.length; i++) {
    entries.push(toBranchEntry(source[i]));
  }
  definePropertyOrThrow(schema, cacheKey, {
    value: entries,
    enumerable: false,
    configurable: false,
    writable: false
  });
  return entries;
}
function evaluateAllOf(branches, data, defineError) {
  for (let i = 0; i < branches.length; i++) {
    const branch = branches[i];
    if (branch.kind === "validate") {
      const error = branch.validate(data);
      if (error) {
        return defineError("Value is not valid", { cause: error, data });
      }
      continue;
    }
    if (branch.kind === "alwaysValid") {
      continue;
    }
    if (branch.kind === "alwaysInvalid" || data !== branch.value) {
      return defineError("Value is not valid", { data });
    }
  }
}
function evaluateAnyOf(branches, data, defineError, collectAll = false) {
  let matched = false;
  for (let i = 0; i < branches.length; i++) {
    const branch = branches[i];
    if (branch.kind === "validate") {
      if (!branch.validate(data)) {
        matched = true;
        if (!collectAll) {
          return;
        }
      }
      continue;
    }
    if (branch.kind === "alwaysValid") {
      matched = true;
      if (!collectAll) {
        return;
      }
      continue;
    }
    if (branch.kind === "literal" && data === branch.value) {
      matched = true;
      if (!collectAll) {
        return;
      }
    }
  }
  if (matched) {
    return;
  }
  return defineError("Value is not valid", { data });
}
function evaluateOneOf(branches, data) {
  let winnerIndex = -1;
  for (let i = 0; i < branches.length; i++) {
    const branch = branches[i];
    let isValid = false;
    if (branch.kind === "validate") {
      isValid = !branch.validate(data);
    } else if (branch.kind === "alwaysValid") {
      isValid = true;
    } else if (branch.kind === "literal") {
      isValid = data === branch.value;
    }
    if (isValid) {
      if (winnerIndex !== -1) {
        return -1;
      }
      winnerIndex = i;
    }
  }
  return winnerIndex;
}
function createCombinatorValidator(key, schema, defineError, validateSubschema, transactions, collectAnnotations = false) {
  const sourceBranches = getBranchEntries(schema, key);
  const branches = validateSubschema ? sourceBranches.map(
    (branch, index) => branch.kind === "validate" ? {
      kind: "validate",
      validate: (data) => validateSubschema(schema[key][index], data)
    } : branch
  ) : sourceBranches;
  if (!transactions) {
    if (key === "allOf") {
      return (data) => evaluateAllOf(branches, data, defineError);
    }
    if (key === "anyOf") {
      return (data) => evaluateAnyOf(branches, data, defineError, collectAnnotations);
    }
    return (data) => {
      if (evaluateOneOf(branches, data) === -1) {
        return defineError("Value is not valid", { data });
      }
    };
  }
  if (key === "allOf") {
    return (data) => {
      const savepoint = transactions.savepoint();
      try {
        const error = evaluateAllOf(branches, data, defineError);
        if (error) {
          transactions.rollback(savepoint);
        }
        return error;
      } catch (error) {
        transactions.rollback(savepoint);
        throw error;
      }
    };
  }
  if (key === "anyOf") {
    return (data) => evaluateAnyOf(branches, data, defineError, collectAnnotations);
  }
  return (data) => {
    const savepoint = transactions.savepoint();
    let winnerIndex = -1;
    let winnerDefaults = [];
    try {
      for (let index = 0; index < branches.length; index++) {
        const branch = branches[index];
        const branchSavepoint = transactions.savepoint();
        let isValid = false;
        if (branch.kind === "validate") {
          isValid = !branch.validate(data);
        } else if (branch.kind === "alwaysValid") {
          isValid = true;
        } else if (branch.kind === "literal") {
          isValid = data === branch.value;
        }
        if (!isValid) {
          continue;
        }
        if (winnerIndex !== -1) {
          transactions.rollback(savepoint);
          return defineError("Value is not valid", { data });
        }
        winnerIndex = index;
        winnerDefaults = transactions.capture(branchSavepoint);
      }
      if (winnerIndex === -1) {
        transactions.rollback(savepoint);
        return defineError("Value is not valid", { data });
      }
      transactions.restore(winnerDefaults);
      return;
    } catch (error) {
      transactions.rollback(savepoint);
      throw error;
    }
  };
}
function prepareCombinatorEntries(schema) {
  if (Array.isArray(schema.allOf)) {
    getBranchEntries(schema, "allOf");
  }
  if (Array.isArray(schema.anyOf)) {
    getBranchEntries(schema, "anyOf");
  }
  if (Array.isArray(schema.oneOf)) {
    getBranchEntries(schema, "oneOf");
  }
}
var OtherKeywords = {
  enum(schema, data, defineError) {
    let enumCache = schema._enumCache;
    if (!enumCache) {
      const primitiveSet = /* @__PURE__ */ new Set();
      const objectValues = [];
      const list = schema.enum;
      for (let i = 0; i < list.length; i++) {
        const enumItem = list[i];
        if (enumItem !== null && typeof enumItem === "object") {
          objectValues.push(enumItem);
        } else {
          primitiveSet.add(enumItem);
        }
      }
      enumCache = { primitiveSet, objectValues };
      definePropertyOrThrow(schema, "_enumCache", {
        value: enumCache,
        enumerable: false,
        configurable: false,
        writable: false
      });
    }
    if (!(typeof data === "number" && Number.isNaN(data)) && enumCache.primitiveSet.has(data)) {
      return;
    }
    if (data !== null && typeof data === "object") {
      for (let i = 0; i < enumCache.objectValues.length; i++) {
        if (!hasChanged(enumCache.objectValues[i], data)) {
          return;
        }
      }
    }
    return defineError("Value is not one of the allowed values", { data });
  },
  allOf(schema, data, defineError) {
    return createCombinatorValidator("allOf", schema, defineError)(data);
  },
  anyOf(schema, data, defineError) {
    return createCombinatorValidator("anyOf", schema, defineError)(data);
  },
  oneOf(schema, data, defineError) {
    return createCombinatorValidator("oneOf", schema, defineError)(data);
  },
  const(schema, data, defineError) {
    if (data === schema.const) {
      return;
    }
    if (data && typeof data === "object" && !Array.isArray(data) && schema.const && typeof schema.const === "object" && !Array.isArray(schema.const) && !hasChanged(data, schema.const) || Array.isArray(data) && Array.isArray(schema.const) && !hasChanged(data, schema.const)) {
      return;
    }
    return defineError("Value is not valid", { data });
  },
  if(schema, data, defineError, _instance, validateSubschema) {
    if ("then" in schema === false && "else" in schema === false && !validateSubschema?.tracksEvaluated) {
      return;
    }
    if (typeof schema.if === "boolean") {
      if (schema.if) {
        if (schema.then === false) {
          return defineError("Value is not valid", { data });
        }
        if (isCompiledSchema(schema.then)) {
          return validateSubschema ? validateSubschema(schema.then, data) : schema.then.$validate(data);
        }
      } else {
        if (schema.else === false) {
          return defineError("Value is not valid", { data });
        }
        if (isCompiledSchema(schema.else)) {
          return validateSubschema ? validateSubschema(schema.else, data) : schema.else.$validate(data);
        }
      }
      return;
    }
    if (!isCompiledSchema(schema.if)) {
      return;
    }
    const error = validateSubschema ? validateSubschema(schema.if, data) : schema.if.$validate(data);
    if (!error) {
      if (schema.then === false) {
        return defineError("Value is not valid", { data });
      }
      if (isCompiledSchema(schema.then)) {
        return validateSubschema ? validateSubschema(schema.then, data) : schema.then.$validate(data);
      }
      return;
    } else {
      if (schema.else === false) {
        return defineError("Value is not valid", { data });
      }
      if (isCompiledSchema(schema.else)) {
        return validateSubschema ? validateSubschema(schema.else, data) : schema.else.$validate(data);
      }
      return;
    }
  },
  not(schema, data, defineError, _instance, validateSubschema) {
    if (typeof schema.not === "boolean") {
      if (schema.not) {
        return defineError("Value is not valid", { data });
      }
      return;
    }
    if (schema.not && typeof schema.not === "object" && !Array.isArray(schema.not)) {
      if ("$validate" in schema.not) {
        const savepoint = validateSubschema?.savepoint?.();
        try {
          const error = validateSubschema ? validateSubschema(schema.not, data, { discardAnnotations: true }) : schema.not.$validate(data);
          if (!error) {
            return defineError("Value is not valid", { data });
          }
          return;
        } finally {
          if (typeof savepoint === "number") {
            validateSubschema?.rollback?.(savepoint);
          }
        }
      }
      return defineError("Value is not valid", { data });
    }
    return defineError("Value is not valid", { data });
  },
  $ref(schema, data, defineError) {
    if (typeof schema._resolvedRef === "function") {
      return schema._resolvedRef(data);
    }
    return defineError(`Missing reference: ${schema.$ref}`);
  }
};
var PATTERN_MATCH_CACHE_LIMIT = 512;
var FORMAT_RESULT_CACHE_LIMIT = 512;
function hasAtLeastCodePoints(value, limit) {
  let count = 0;
  for (let index = 0; index < value.length; index++) {
    const unit = value.charCodeAt(index);
    if (unit >= 55296 && unit <= 56319 && index + 1 < value.length) {
      const nextUnit = value.charCodeAt(index + 1);
      if (nextUnit >= 56320 && nextUnit <= 57343) {
        index++;
      }
    }
    count++;
    if (count >= limit) {
      return true;
    }
  }
  return count >= limit;
}
var StringKeywords = {
  minLength(schema, data, defineError) {
    if (typeof data !== "string") {
      return;
    }
    const units = data.length;
    const limit = schema.minLength;
    if (units < limit) {
      return defineError("Value is shorter than the minimum length", { data });
    }
    if (units - limit >= limit || hasAtLeastCodePoints(data, limit)) {
      return;
    }
    return defineError("Value is shorter than the minimum length", { data });
  },
  maxLength(schema, data, defineError) {
    if (typeof data !== "string") {
      return;
    }
    const units = data.length;
    const limit = schema.maxLength;
    if (units <= limit) {
      return;
    }
    if (units - limit > limit || hasAtLeastCodePoints(data, limit + 1)) {
      return defineError("Value is longer than the maximum length", { data });
    }
    return;
  },
  pattern(schema, data, defineError) {
    if (typeof data !== "string") {
      return;
    }
    let patternMatch = schema._patternMatch;
    let patternMatchCache = schema._patternMatchCache;
    if (!patternMatch) {
      try {
        const compiled = compilePatternMatcher(schema.pattern);
        patternMatch = compiled instanceof RegExp ? (value) => compiled.test(value) : compiled;
        definePropertyOrThrow(schema, "_patternMatch", {
          value: patternMatch,
          enumerable: false,
          configurable: false,
          writable: false
        });
      } catch (error) {
        return defineError("Invalid regular expression", {
          data,
          cause: error
        });
      }
    }
    if (!patternMatchCache) {
      patternMatchCache = /* @__PURE__ */ new Map();
      definePropertyOrThrow(schema, "_patternMatchCache", {
        value: patternMatchCache,
        enumerable: false,
        configurable: false,
        writable: false
      });
    } else if (patternMatchCache.has(data)) {
      if (patternMatchCache.get(data)) {
        return;
      }
      return defineError("Value does not match the pattern", { data });
    }
    const isMatch = patternMatch(data);
    if (patternMatchCache.size < PATTERN_MATCH_CACHE_LIMIT) {
      patternMatchCache.set(data, isMatch);
    }
    if (isMatch) {
      return;
    }
    return defineError("Value does not match the pattern", { data });
  },
  // Take into account that if we receive a format that is not defined, we
  // will not throw an error, we just ignore it.
  format(schema, data, defineError, instance) {
    if (typeof data !== "string") {
      return;
    }
    let formatValidate = schema._formatValidate;
    let formatResultCacheEnabled = schema._formatResultCacheEnabled;
    let formatResultCache = schema._formatResultCache;
    if (formatValidate === void 0) {
      formatValidate = instance.getFormat(schema.format);
      definePropertyOrThrow(schema, "_formatValidate", {
        value: formatValidate,
        enumerable: false,
        configurable: false,
        writable: false
      });
    }
    if (!formatValidate) {
      return;
    }
    if (formatResultCacheEnabled === void 0) {
      formatResultCacheEnabled = instance.isDefaultFormatValidator(
        schema.format,
        formatValidate
      );
      definePropertyOrThrow(schema, "_formatResultCacheEnabled", {
        value: formatResultCacheEnabled,
        enumerable: false,
        configurable: false,
        writable: false
      });
    }
    if (!formatResultCacheEnabled) {
      let definedError = false;
      const result = formatValidate(data, (message, options) => {
        definedError = true;
        return defineError(message, options);
      });
      if (definedError) {
        return result;
      }
      if (result === true || typeof result === "undefined") {
        return;
      }
      return result instanceof ValidationError ? result : defineError("Value does not match the format", { data });
    }
    if (!formatResultCache) {
      formatResultCache = /* @__PURE__ */ new Map();
      definePropertyOrThrow(schema, "_formatResultCache", {
        value: formatResultCache,
        enumerable: false,
        configurable: false,
        writable: false
      });
    } else if (formatResultCache.has(data)) {
      if (formatResultCache.get(data)) {
        return;
      }
      return defineError("Value does not match the format", { data });
    }
    const isValid = formatValidate(data, defineError) === true;
    if (formatResultCache.size < FORMAT_RESULT_CACHE_LIMIT) {
      formatResultCache.set(data, isValid);
    }
    if (isValid) {
      return;
    }
    return defineError("Value does not match the format", { data });
  }
};
var keywords = {
  ...ObjectKeywords,
  ...ArrayKeywords,
  ...StringKeywords,
  ...NumberKeywords,
  ...OtherKeywords
};
var {
  draft4,
  draft6,
  draft7,
  draft2019,
  draft2019Core,
  draft2019Applicator,
  draft2019Validation,
  draft2019Metadata,
  draft2019Format,
  draft2019Content,
  draft2020,
  draft2020Core,
  draft2020Applicator,
  draft2020Unevaluated,
  draft2020Validation,
  draft2020Metadata,
  draft2020Format,
  draft2020FormatAssertion,
  draft2020Content
} = require_official_meta_schemas();
var resources = [
  {
    dialect: "draft4",
    uri: "http://json-schema.org/draft-04/schema#",
    schema: draft4
  },
  {
    dialect: "draft6",
    uri: "http://json-schema.org/draft-06/schema#",
    schema: draft6
  },
  {
    dialect: "draft7",
    uri: "http://json-schema.org/draft-07/schema#",
    schema: draft7
  },
  { dialect: "2019-09", uri: draft2019.$id, schema: draft2019 },
  { dialect: "2019-09", uri: draft2019Core.$id, schema: draft2019Core },
  {
    dialect: "2019-09",
    uri: draft2019Applicator.$id,
    schema: draft2019Applicator
  },
  {
    dialect: "2019-09",
    uri: draft2019Validation.$id,
    schema: draft2019Validation
  },
  { dialect: "2019-09", uri: draft2019Metadata.$id, schema: draft2019Metadata },
  { dialect: "2019-09", uri: draft2019Format.$id, schema: draft2019Format },
  { dialect: "2019-09", uri: draft2019Content.$id, schema: draft2019Content },
  { dialect: "2020-12", uri: draft2020.$id, schema: draft2020 },
  { dialect: "2020-12", uri: draft2020Core.$id, schema: draft2020Core },
  {
    dialect: "2020-12",
    uri: draft2020Applicator.$id,
    schema: draft2020Applicator
  },
  {
    dialect: "2020-12",
    uri: draft2020Unevaluated.$id,
    schema: draft2020Unevaluated
  },
  {
    dialect: "2020-12",
    uri: draft2020Validation.$id,
    schema: draft2020Validation
  },
  { dialect: "2020-12", uri: draft2020Metadata.$id, schema: draft2020Metadata },
  { dialect: "2020-12", uri: draft2020Format.$id, schema: draft2020Format },
  {
    dialect: "2020-12",
    uri: draft2020FormatAssertion.$id,
    schema: draft2020FormatAssertion
  },
  { dialect: "2020-12", uri: draft2020Content.$id, schema: draft2020Content }
];
for (const resource of resources) {
  deepFreeze(resource.schema);
  Object.freeze(resource);
}
var BUILTIN_META_SCHEMAS = Object.freeze(resources);
var BUILTIN_META_SCHEMA_BY_URI = new Map(resources.map((resource) => [resource.uri, resource]));
var BUILTIN_DIALECT_BY_URI = new Map(
  resources.filter(
    (resource) => resource.uri.endsWith("/schema") || resource.uri.endsWith("/schema#")
  ).map((resource) => [resource.uri, resource.dialect])
);
var MAX_COMPILE_DEPTH = 128;
var LOCAL_SCHEMA_BASE = "schema-shield://local/root";
var FORMAT_ASSERTION_2020_VOCABULARY = "https://json-schema.org/draft/2020-12/vocab/format-assertion";
var VOCABULARY_CATEGORIES = /* @__PURE__ */ new Map([
  ["https://json-schema.org/draft/2019-09/vocab/core", "core"],
  ["https://json-schema.org/draft/2019-09/vocab/applicator", "applicator"],
  ["https://json-schema.org/draft/2019-09/vocab/validation", "validation"],
  ["https://json-schema.org/draft/2019-09/vocab/meta-data", "metadata"],
  ["https://json-schema.org/draft/2019-09/vocab/format", "format"],
  ["https://json-schema.org/draft/2019-09/vocab/content", "content"],
  ["https://json-schema.org/draft/2020-12/vocab/core", "core"],
  ["https://json-schema.org/draft/2020-12/vocab/applicator", "applicator"],
  ["https://json-schema.org/draft/2020-12/vocab/validation", "validation"],
  ["https://json-schema.org/draft/2020-12/vocab/unevaluated", "unevaluated"],
  ["https://json-schema.org/draft/2020-12/vocab/meta-data", "metadata"],
  ["https://json-schema.org/draft/2020-12/vocab/format-annotation", "format"],
  ["https://json-schema.org/draft/2020-12/vocab/format-assertion", "format"],
  ["https://json-schema.org/draft/2020-12/vocab/content", "content"]
]);
var BUILTIN_SCHEMA_REGISTRATIONS = Object.freeze(
  BUILTIN_META_SCHEMAS.map((resource) => {
    const hashIndex = resource.uri.indexOf("#");
    const resourceUri = hashIndex === -1 ? resource.uri : resource.uri.slice(0, hashIndex);
    return Object.freeze({
      schema: resource.schema,
      identities: Object.freeze(Array.from(/* @__PURE__ */ new Set([resource.uri, resourceUri]))),
      nestedIdentities: Object.freeze([]),
      baseUri: resourceUri,
      rootIdBesideRef: true,
      metaSchema: true
    });
  })
);
var FAIL_FAST_TYPE_VALIDATORS = {
  object: (data) => data !== null && typeof data === "object" && !Array.isArray(data) ? void 0 : true,
  array: (data) => Array.isArray(data) ? void 0 : true,
  string: (data) => typeof data === "string" ? void 0 : true,
  number: (data) => typeof data === "number" && Number.isFinite(data) ? void 0 : true,
  integer: (data) => typeof data === "number" && Number.isFinite(data) && Number.isInteger(data) ? void 0 : true,
  boolean: (data) => typeof data === "boolean" ? void 0 : true,
  null: (data) => data === null ? void 0 : true,
  undefined: (data) => typeof data === "undefined" ? void 0 : true
};
function createBuiltinTypeValidator(_type, defineError, fallback) {
  return (data) => {
    if (fallback(data, defineError) !== true) {
      return defineError("Invalid type", { data });
    }
  };
}
var _defaultSavepoint;
var defaultSavepoint_fn;
var _rollbackDefaultSavepoint;
var rollbackDefaultSavepoint_fn;
var _captureDefaultSavepoint;
var captureDefaultSavepoint_fn;
var _restoreDefaults;
var restoreDefaults_fn;
var _SchemaShield = class {
  constructor(options = {}) {
    __privateAdd(this, _defaultSavepoint);
    __privateAdd(this, _rollbackDefaultSavepoint);
    __privateAdd(this, _captureDefaultSavepoint);
    __privateAdd(this, _restoreDefaults);
    __publicField(this, "types", {});
    __publicField(this, "formats", {});
    __publicField(this, "keywords", {});
    __publicField(this, "immutable", false);
    __publicField(this, "useDefaults", false);
    __publicField(this, "formatMode", "default");
    __publicField(this, "rootSchema", null);
    __publicField(this, "failFast", true);
    __publicField(this, "maxDepth");
    __publicField(this, "validationContexts", []);
    __publicField(this, "compileCache", /* @__PURE__ */ new WeakMap());
    __publicField(this, "compilingRequiresContext", false);
    __publicField(this, "compilingEvaluatedTracking", false);
    __publicField(this, "compilingValidateSubschema");
    __publicField(this, "compilingMutableSchemas", /* @__PURE__ */ new WeakSet());
    __publicField(this, "compilingDialects", /* @__PURE__ */ new WeakMap());
    __publicField(this, "compilingEnvironments", /* @__PURE__ */ new WeakMap());
    __publicField(this, "compilingSchemaChildren", /* @__PURE__ */ new WeakMap());
    __publicField(this, "registeredSchemas", []);
    __publicField(this, "registeredSchemaIds", /* @__PURE__ */ new Map());
    __publicField(this, "customMetaValidators", /* @__PURE__ */ new Map());
    const {
      immutable = false,
      failFast = true,
      maxDepth = 128,
      useDefaults = false
    } = options;
    let formatMode = "default";
    if (hasOwn(options, "format")) {
      if (options.format !== true && options.format !== false) {
        const error = new ValidationError("format must be true or false");
        error.code = "INVALID_FORMAT";
        error.keyword = "format";
        throw error;
      }
      formatMode = options.format ? "enabled" : "disabled";
    }
    if (!Number.isInteger(maxDepth) || maxDepth < 1 || maxDepth > 256) {
      const error = new ValidationError("maxDepth must be an integer from 1 to 256");
      error.code = "INVALID_MAX_DEPTH";
      error.keyword = "maxDepth";
      throw error;
    }
    if (useDefaults !== false && useDefaults !== true && useDefaults !== "empty") {
      const error = new ValidationError(
        'useDefaults must be false, true, or "empty"'
      );
      error.code = "INVALID_USE_DEFAULTS";
      error.keyword = "useDefaults";
      throw error;
    }
    this.immutable = immutable;
    this.failFast = failFast;
    this.maxDepth = maxDepth;
    this.useDefaults = useDefaults;
    this.formatMode = formatMode;
    for (const [type, validator] of Object.entries(Types)) {
      if (validator) {
        this.addType(type, validator);
      }
    }
    for (const [keyword, validator] of Object.entries(keywords)) {
      this.addKeyword(keyword, validator);
    }
    for (const [format, validator] of Object.entries(Formats)) {
      if (validator) {
        this.addFormat(format, validator);
      }
    }
  }
  setDefault(target, key, value) {
    const context = this.validationContexts[this.validationContexts.length - 1];
    if (context) {
      context.defaults.push({
        target,
        key,
        descriptor: Reflect.getOwnPropertyDescriptor(target, key)
      });
    }
    definePropertyOrThrow(target, key, {
      value,
      enumerable: true,
      configurable: true,
      writable: true
    });
  }
  addType(name, validator, overwrite = false) {
    if (this.types[name] && !overwrite) {
      throw new ValidationError(`Type "${name}" already exists`);
    }
    this.types[name] = validator;
  }
  getType(type) {
    return this.types[type];
  }
  addFormat(name, validator, overwrite = false) {
    if (this.formats[name] && !overwrite) {
      throw new ValidationError(`Format "${name}" already exists`);
    }
    this.formats[name] = validator;
  }
  getFormat(format) {
    return this.formats[format];
  }
  isDefaultFormatValidator(format, validator) {
    return Formats[format] === validator;
  }
  addKeyword(name, validator, overwrite = false) {
    if (this.keywords[name] && !overwrite) {
      throw new ValidationError(`Keyword "${name}" already exists`);
    }
    this.keywords[name] = validator;
  }
  getKeyword(keyword) {
    return this.keywords[keyword];
  }
  addSchema(schema, options = {}) {
    this.registerSchema(schema, options, false);
  }
  addMetaSchema(schema, options = {}) {
    const validation = this.validateSchema(schema);
    if (!validation.valid) {
      throw this.invalidSchemaError(validation.error);
    }
    if (schema === true || schema === false) {
      throw this.schemaRegistrationError(
        "A metaschema must be an object",
        "INVALID_SCHEMA",
        "schema"
      );
    }
    if (typeof schema.$schema !== "string") {
      throw this.schemaRegistrationError(
        "A custom metaschema must declare $schema",
        "INVALID_SCHEMA",
        "$schema"
      );
    }
    this.assertKnownRequiredVocabularies(schema);
    const verifier = new _SchemaShield({ failFast: false });
    verifier.registeredSchemas = [...this.registeredSchemas];
    verifier.registeredSchemaIds = new Map(this.registeredSchemaIds);
    const registrationCount = verifier.registeredSchemas.length;
    verifier.registerSchema(schema, options, true);
    if (verifier.registeredSchemas.length === registrationCount) {
      return;
    }
    const candidate = verifier.registeredSchemas[registrationCount];
    verifier.compile(
      { $ref: candidate.baseUri },
      { validateSchema: false }
    );
    this.registerSchema(schema, options, true);
  }
  registerSchema(schema, options, metaSchema) {
    if (!this.isJsonSchema(schema)) {
      throw this.schemaRegistrationError(
        "Invalid schema",
        "INVALID_SCHEMA",
        "schema"
      );
    }
    if (!this.isJsonObject(options)) {
      throw this.schemaRegistrationError(
        "addSchema options must be an object",
        "INVALID_ADD_SCHEMA_OPTIONS",
        "addSchema"
      );
    }
    const builtin = this.claimedBuiltinMetaSchema(schema, options);
    if (builtin !== null) {
      if (this.schemasEqual(schema, builtin.schema)) {
        return;
      }
      throw this.schemaRegistrationError(
        `Builtin schema identity cannot be replaced: ${builtin.uri}`,
        "BUILTIN_SCHEMA_ID_COLLISION",
        "$id"
      );
    }
    let retrievalUri = null;
    if (hasOwn(options, "uri")) {
      retrievalUri = this.absoluteResourceUri(
        options.uri,
        "INVALID_SCHEMA_URI",
        "uri"
      );
    }
    const rootDialect = schema === true || schema === false ? "legacy" : this.effectiveDialect(schema, "legacy");
    const rootIdIsActive = schema !== true && schema !== false && (rootDialect !== "draft4" && rootDialect !== "draft6" && rootDialect !== "draft7" || !("$ref" in schema));
    const rootIdKeyword = rootDialect === "draft4" ? "id" : "$id";
    let resolvedRootId = null;
    if (rootIdIsActive && hasOwn(schema, rootIdKeyword)) {
      const rootId = schema[rootIdKeyword];
      if (typeof rootId !== "string") {
        throw this.schemaRegistrationError(
          `Root ${rootIdKeyword} must be a string`,
          "INVALID_SCHEMA_ID",
          rootIdKeyword
        );
      }
      resolvedRootId = retrievalUri ? this.resourceIdentityFromReference(rootId, retrievalUri, rootIdKeyword) : this.absoluteResourceUri(rootId, "INVALID_SCHEMA_ID", rootIdKeyword);
    }
    if (retrievalUri === null && resolvedRootId === null) {
      throw this.schemaRegistrationError(
        `Schema requires an absolute root ${rootIdKeyword} or an explicit uri`,
        "INVALID_SCHEMA_ID",
        rootIdKeyword
      );
    }
    const aliases = hasOwn(options, "aliases") ? options.aliases : [];
    if (!Array.isArray(aliases)) {
      throw this.schemaRegistrationError(
        "Schema aliases must be an array",
        "INVALID_SCHEMA_ALIAS",
        "aliases"
      );
    }
    const identities = /* @__PURE__ */ new Set();
    if (retrievalUri !== null) {
      identities.add(retrievalUri);
    }
    if (resolvedRootId !== null) {
      identities.add(resolvedRootId);
    }
    for (const alias of aliases) {
      identities.add(
        this.absoluteResourceUri(alias, "INVALID_SCHEMA_ALIAS", "aliases")
      );
    }
    for (const identity of identities) {
      if (this.registeredSchemaIds.has(identity)) {
        throw this.schemaRegistrationError(
          `Duplicate schema identity: ${identity}`,
          "DUPLICATE_SCHEMA_ID",
          "$id"
        );
      }
    }
    const snapshot = deepCloneUnfreeze(schema);
    const baseUri = retrievalUri || resolvedRootId;
    const nestedIdentities = new Set(
      this.collectRegisteredNestedIdentities(
        snapshot,
        baseUri,
        rootDialect,
        rootIdIsActive
      )
    );
    if (rootDialect === "legacy") {
      for (const dialect of ["2019-09", "2020-12"]) {
        for (const identity of this.collectRegisteredNestedIdentities(
          snapshot,
          baseUri,
          dialect,
          rootIdIsActive
        )) {
          nestedIdentities.add(identity);
        }
      }
    }
    for (const identity of [...identities, ...nestedIdentities]) {
      const builtinIdentity = this.builtinMetaSchemaForIdentity(identity);
      if (builtinIdentity !== null) {
        throw this.schemaRegistrationError(
          `Builtin schema identity cannot be replaced: ${builtinIdentity.uri}`,
          "BUILTIN_SCHEMA_ID_COLLISION",
          "$id"
        );
      }
    }
    const registration = Object.freeze({
      schema: snapshot,
      identities: Object.freeze(Array.from(identities)),
      nestedIdentities: Object.freeze(Array.from(nestedIdentities)),
      baseUri,
      rootIdBesideRef: rootIdIsActive,
      metaSchema
    });
    this.registeredSchemas.push(registration);
    for (const identity of identities) {
      this.registeredSchemaIds.set(identity, registration);
    }
  }
  claimedBuiltinMetaSchema(schema, options) {
    const identities = [options.uri];
    if (Array.isArray(options.aliases)) {
      identities.push(...options.aliases);
    }
    if (schema !== true && schema !== false) {
      identities.push(schema.$id, schema.id);
    }
    for (const identity of identities) {
      const resource = this.builtinMetaSchemaForIdentity(identity);
      if (resource !== null) {
        return resource;
      }
    }
    return null;
  }
  builtinMetaSchemaForIdentity(identity) {
    if (typeof identity !== "string") {
      return null;
    }
    let normalized;
    try {
      normalized = new URL(identity).href;
    } catch {
      return null;
    }
    const normalizedResource = this.resourceUri(normalized);
    for (const resource of BUILTIN_META_SCHEMAS) {
      if (normalized === resource.uri || normalizedResource === this.resourceUri(resource.uri)) {
        return resource;
      }
    }
    return null;
  }
  schemasEqual(left, right) {
    if (left === right) {
      return true;
    }
    if (left === null || right === null || typeof left !== "object" || typeof right !== "object" || Array.isArray(left) !== Array.isArray(right)) {
      return false;
    }
    const leftKeys = Object.keys(left);
    const rightKeys = Object.keys(right);
    if (leftKeys.length !== rightKeys.length) {
      return false;
    }
    for (const key of leftKeys) {
      if (!hasOwn(right, key) || !this.schemasEqual(left[key], right[key])) {
        return false;
      }
    }
    return true;
  }
  assertKnownRequiredVocabularies(schema) {
    if (!this.isJsonObject(schema.$vocabulary)) {
      return;
    }
    for (const [uri, required] of Object.entries(schema.$vocabulary)) {
      if (required === true && this.vocabularyCategory(uri) === null) {
        const error = new ValidationError(`Unknown required vocabulary: ${uri}`);
        error.code = "UNKNOWN_REQUIRED_VOCABULARY";
        error.keyword = "$vocabulary";
        throw error;
      }
    }
  }
  schemaRegistrationError(message, code, keyword) {
    const error = new ValidationError(message);
    error.code = code;
    error.keyword = keyword;
    return error;
  }
  absoluteResourceUri(value, code, keyword) {
    if (typeof value !== "string") {
      throw this.schemaRegistrationError(
        `${keyword} must be an absolute URI without a fragment`,
        code,
        keyword
      );
    }
    try {
      const url = new URL(value);
      if (url.hash !== "" || value.includes("#")) {
        throw new Error("fragment");
      }
      return url.href;
    } catch {
      throw this.schemaRegistrationError(
        `${keyword} must be an absolute URI without a fragment`,
        code,
        keyword
      );
    }
  }
  resourceIdentityFromReference(reference, baseUri, keyword) {
    try {
      const url = new URL(reference, baseUri);
      if (url.hash !== "" || reference.includes("#")) {
        throw new Error("fragment");
      }
      return url.href;
    } catch {
      throw this.schemaRegistrationError(
        `${keyword} must resolve to a URI without a fragment`,
        "INVALID_SCHEMA_ID",
        keyword
      );
    }
  }
  isJsonSchema(schema) {
    if (schema === true || schema === false) {
      return true;
    }
    if (!this.isJsonObject(schema)) {
      return false;
    }
    const seen = /* @__PURE__ */ new WeakSet();
    const stack = [schema];
    while (stack.length > 0) {
      const value = stack.pop();
      if (value === null || typeof value === "string" || typeof value === "boolean") {
        continue;
      }
      if (typeof value === "number") {
        if (!Number.isFinite(value)) {
          return false;
        }
        continue;
      }
      if (typeof value !== "object") {
        return false;
      }
      if (seen.has(value)) {
        return false;
      }
      seen.add(value);
      if (!Array.isArray(value) && !this.isJsonObject(value)) {
        return false;
      }
      for (const key of Object.keys(value)) {
        stack.push(value[key]);
      }
    }
    return true;
  }
  isJsonObject(value) {
    if (!value || typeof value !== "object" || Array.isArray(value)) {
      return false;
    }
    const prototype = Reflect.getPrototypeOf(value);
    return prototype === Object.prototype || prototype === null;
  }
  collectRegisteredNestedIdentities(schema, baseUri, inheritedDialect, rootIdBesideRef) {
    if (schema === true || schema === false) {
      return [];
    }
    const identities = /* @__PURE__ */ new Set();
    const visited = /* @__PURE__ */ new WeakSet();
    const stack = [
      { node: schema, baseUri, dialect: inheritedDialect, root: true }
    ];
    while (stack.length > 0) {
      const entry = stack.pop();
      if (visited.has(entry.node)) {
        continue;
      }
      visited.add(entry.node);
      const dialect = this.effectiveDialect(entry.node, entry.dialect);
      let childBase = entry.baseUri;
      if (typeof entry.node[dialect === "draft4" ? "id" : "$id"] === "string" && (this.isModernDialect(dialect) || !("$ref" in entry.node) || entry.root && rootIdBesideRef)) {
        try {
          childBase = new URL(
            entry.node[dialect === "draft4" ? "id" : "$id"],
            entry.baseUri
          ).href;
          identities.add(childBase);
          if (childBase.indexOf("#") === -1 || childBase.endsWith("#")) {
            identities.add(this.resourceUri(childBase));
          }
        } catch {
          childBase = entry.baseUri;
        }
      }
      const children = this.registrySubschemaEntries(entry.node, dialect);
      for (let index = children.length - 1; index >= 0; index--) {
        const child = children[index];
        if (!Array.isArray(child.value)) {
          stack.push({
            node: child.value,
            baseUri: childBase,
            dialect,
            root: false
          });
        }
      }
    }
    return Array.from(identities);
  }
  getSchemaRef(path) {
    if (!this.rootSchema) {
      return;
    }
    return resolvePath(this.rootSchema, path);
  }
  getSchemaById(id) {
    if (!this.rootSchema) {
      return;
    }
    const stack = [this.rootSchema];
    const seen = /* @__PURE__ */ new WeakSet();
    while (stack.length > 0) {
      const node = stack.pop();
      if (seen.has(node)) {
        continue;
      }
      seen.add(node);
      if (node.$id === id || node.id === id) {
        return node;
      }
      const children = this.schemaChildren(node);
      for (let index = 0; index < children.length; index++) {
        stack.push(children[index]);
      }
    }
    return;
  }
  depthError(message = "Maximum schema depth exceeded") {
    if (this.failFast) {
      return true;
    }
    const error = new ValidationError(message);
    error.code = "MAX_DEPTH_EXCEEDED";
    error.keyword = "maxDepth";
    return error;
  }
  schemaChildEntries(schema, knownDialect, knownEnvironment) {
    const dialect = knownDialect || schema._dialect || this.compilingDialects.get(schema) || "legacy";
    const environment = knownEnvironment || this.compilingEnvironments.get(schema) || this.defaultEnvironment(dialect);
    if ((dialect === "draft4" || dialect === "draft6" || dialect === "draft7") && typeof schema.$ref === "string" && this.getKeyword("$ref") === keywords.$ref) {
      return [];
    }
    const children = this.registrySubschemaEntries(
      schema,
      dialect,
      environment
    );
    for (const key of ["values", "elements"]) {
      const value = schema[key];
      if (value && typeof value === "object" && !Array.isArray(value)) {
        children.push({
          value,
          pointer: `/${key}`
        });
      }
    }
    for (const key of Object.keys(schema)) {
      if (key === "enum" || key === "const" || key === "default" || key === "examples" || children.some((child) => {
        const keyPointer = `/${this.escapePointerToken(key)}`;
        return child.pointer === keyPointer || child.pointer.startsWith(`${keyPointer}/`);
      })) {
        continue;
      }
      const keyword = this.getKeyword(key);
      const value = schema[key];
      if (keyword && keyword !== keywords[key] && value && typeof value === "object") {
        children.push({
          value,
          pointer: `/${this.escapePointerToken(key)}`
        });
      }
    }
    return children;
  }
  schemaChildren(schema, knownDialect, knownEnvironment) {
    const cached = this.compilingSchemaChildren.get(schema);
    if (cached) {
      return cached;
    }
    const entries = this.schemaChildEntries(
      schema,
      knownDialect,
      knownEnvironment
    );
    const children = [];
    for (let index = 0; index < entries.length; index++) {
      children.push(entries[index].value);
    }
    this.compilingSchemaChildren.set(schema, children);
    return children;
  }
  registrySubschemaEntries(schema, dialect, environment = this.defaultEnvironment(dialect)) {
    const children = [];
    if ((dialect === "draft4" || dialect === "draft6" || dialect === "draft7") && typeof schema.$ref === "string" && this.getKeyword("$ref") === keywords.$ref) {
      return children;
    }
    const mapKeys = [];
    if (this.isKeywordActive("definitions", environment)) {
      mapKeys.push("definitions");
    }
    if (this.isKeywordActive("properties", environment)) {
      mapKeys.push("properties", "patternProperties");
    }
    if (this.isModernDialect(dialect)) {
      mapKeys.push("$defs");
      if (this.isKeywordActive("dependentSchemas", environment)) {
        mapKeys.push("dependentSchemas");
      }
      if (this.isKeywordActive("dependencies", environment)) {
        mapKeys.push("dependencies");
      }
    } else if (this.isKeywordActive("dependencies", environment)) {
      mapKeys.push("dependencies");
    }
    const arrayKeys = ["allOf", "anyOf", "oneOf"].filter(
      (key) => this.isKeywordActive(key, environment)
    );
    if (dialect !== "2020-12" && this.isKeywordActive("items", environment)) {
      arrayKeys.push("items");
    }
    if (dialect === "2020-12" && this.isKeywordActive("prefixItems", environment)) {
      arrayKeys.push("prefixItems");
    }
    const singleKeys = [
      "items",
      "additionalItems",
      "additionalProperties",
      "contains",
      "propertyNames",
      "not",
      "if",
      "then",
      "else",
      "unevaluatedItems",
      "unevaluatedProperties",
      "contentSchema"
    ].filter((key) => {
      if (key === "additionalItems" && dialect === "2020-12") {
        return false;
      }
      if ((key === "if" || key === "then" || key === "else") && (dialect === "draft4" || dialect === "draft6")) {
        return false;
      }
      if ((key === "unevaluatedItems" || key === "unevaluatedProperties" || key === "contentSchema") && !this.isModernDialect(dialect)) {
        return false;
      }
      return this.isKeywordActive(key, environment);
    });
    for (const key of mapKeys) {
      const value = schema[key];
      if (!value || typeof value !== "object" || Array.isArray(value)) {
        continue;
      }
      for (const childKey of Object.keys(value)) {
        const child = value[childKey];
        if (child && typeof child === "object" && !Array.isArray(child)) {
          children.push({
            value: child,
            pointer: `/${this.escapePointerToken(key)}/${this.escapePointerToken(
              childKey
            )}`
          });
        }
      }
    }
    for (const key of arrayKeys) {
      const value = schema[key];
      if (!Array.isArray(value)) {
        continue;
      }
      for (let index = 0; index < value.length; index++) {
        const child = value[index];
        if (child && typeof child === "object" && !Array.isArray(child)) {
          children.push({
            value: child,
            pointer: `/${this.escapePointerToken(key)}/${index}`
          });
        }
      }
    }
    for (const key of singleKeys) {
      const value = schema[key];
      if (value && typeof value === "object" && !Array.isArray(value)) {
        children.push({
          value,
          pointer: `/${this.escapePointerToken(key)}`
        });
      }
    }
    return children;
  }
  effectiveDialect(schema, inherited) {
    if (typeof schema.$schema !== "string") {
      return inherited;
    }
    try {
      return BUILTIN_DIALECT_BY_URI.get(new URL(schema.$schema).href) || inherited;
    } catch {
      return inherited;
    }
  }
  defaultEnvironment(dialect) {
    return {
      dialect,
      metaschemaUri: null,
      vocabularies: null,
      formatAssertionRequired: false,
      dependenciesCompatibility: !this.isModernDialect(dialect),
      definitionsCompatibility: !this.isModernDialect(dialect)
    };
  }
  vocabularyCategory(uri) {
    return VOCABULARY_CATEGORIES.get(uri) || null;
  }
  metaschemaDefinesKeyword(schema, keyword) {
    if (schema === true || schema === false) {
      return false;
    }
    const seen = /* @__PURE__ */ new WeakSet();
    const stack = [schema];
    while (stack.length > 0) {
      const current = stack.pop();
      if (seen.has(current)) {
        continue;
      }
      seen.add(current);
      if (this.isJsonObject(current.properties) && hasOwn(current.properties, keyword)) {
        return true;
      }
      for (const value of Object.values(current)) {
        if (this.isJsonObject(value)) {
          stack.push(value);
        } else if (Array.isArray(value)) {
          for (const item of value) {
            if (this.isJsonObject(item)) {
              stack.push(item);
            }
          }
        }
      }
    }
    return false;
  }
  schemaEnvironment(schema, inherited) {
    if (!hasOwn(schema, "$schema")) {
      return inherited;
    }
    if (typeof schema.$schema !== "string") {
      throw this.unknownMetaschemaError(String(schema.$schema));
    }
    let metaschemaUri;
    try {
      metaschemaUri = new URL(schema.$schema).href;
    } catch {
      throw this.unknownMetaschemaError(schema.$schema);
    }
    const builtinDialect = BUILTIN_DIALECT_BY_URI.get(metaschemaUri);
    if (builtinDialect) {
      return {
        ...this.defaultEnvironment(builtinDialect),
        metaschemaUri,
        dependenciesCompatibility: true,
        definitionsCompatibility: !this.isModernDialect(builtinDialect)
      };
    }
    const registration = this.registeredSchemaIds.get(metaschemaUri);
    const metaschema = registration?.schema;
    if (!registration?.metaSchema || !metaschema || metaschema === true) {
      throw this.unknownMetaschemaError(metaschemaUri);
    }
    const metaschemaDialect = this.effectiveDialect(
      metaschema,
      inherited.dialect
    );
    const declared = metaschema.$vocabulary;
    if (!this.isJsonObject(declared)) {
      return {
        ...this.defaultEnvironment(metaschemaDialect),
        metaschemaUri,
        dependenciesCompatibility: this.metaschemaDefinesKeyword(
          metaschema,
          "dependencies"
        ),
        definitionsCompatibility: this.metaschemaDefinesKeyword(
          metaschema,
          "definitions"
        )
      };
    }
    const vocabularies = /* @__PURE__ */ new Set();
    let formatAssertionRequired = false;
    for (const [uri, required] of Object.entries(declared)) {
      const category = this.vocabularyCategory(uri);
      if (category !== null) {
        vocabularies.add(category);
        if (uri === FORMAT_ASSERTION_2020_VOCABULARY) {
          formatAssertionRequired = true;
        }
        continue;
      }
      if (required === true) {
        const error = new ValidationError(
          `Unknown required vocabulary: ${uri}`
        );
        error.code = "UNKNOWN_REQUIRED_VOCABULARY";
        error.keyword = "$vocabulary";
        throw error;
      }
    }
    return {
      dialect: metaschemaDialect,
      metaschemaUri,
      vocabularies,
      formatAssertionRequired,
      dependenciesCompatibility: this.metaschemaDefinesKeyword(
        metaschema,
        "dependencies"
      ),
      definitionsCompatibility: this.metaschemaDefinesKeyword(
        metaschema,
        "definitions"
      )
    };
  }
  isModernDialect(dialect) {
    return dialect === "2019-09" || dialect === "2020-12";
  }
  keywordVocabulary(key) {
    if (key === "type" || key === "enum" || key === "const" || key === "multipleOf" || key === "maximum" || key === "exclusiveMaximum" || key === "minimum" || key === "exclusiveMinimum" || key === "maxLength" || key === "minLength" || key === "pattern" || key === "maxItems" || key === "minItems" || key === "uniqueItems" || key === "maxContains" || key === "minContains" || key === "maxProperties" || key === "minProperties" || key === "required" || key === "dependentRequired") {
      return "validation";
    }
    if (key === "unevaluatedItems" || key === "unevaluatedProperties") {
      return "unevaluated";
    }
    if (key === "format") {
      return "format";
    }
    if (key === "contentEncoding" || key === "contentMediaType" || key === "contentSchema") {
      return "content";
    }
    if (key === "allOf" || key === "anyOf" || key === "oneOf" || key === "not" || key === "if" || key === "then" || key === "else" || key === "dependentSchemas" || key === "prefixItems" || key === "items" || key === "contains" || key === "additionalItems" || key === "properties" || key === "patternProperties" || key === "additionalProperties" || key === "propertyNames") {
      return "applicator";
    }
    return null;
  }
  isKeywordActive(key, environment) {
    const dialect = environment.dialect;
    if (key === "dependencies") {
      return environment.dependenciesCompatibility;
    }
    if (key === "definitions") {
      return environment.definitionsCompatibility;
    }
    if (key === "format") {
      if (this.formatMode === "enabled") {
        return true;
      }
      if (this.formatMode === "disabled") {
        return false;
      }
      return environment.metaschemaUri === null || environment.formatAssertionRequired;
    }
    const vocabulary = this.keywordVocabulary(key);
    if (vocabulary !== null && environment.vocabularies !== null && !environment.vocabularies.has(vocabulary)) {
      return false;
    }
    if (key === "$defs") {
      return this.isModernDialect(dialect);
    }
    if (dialect === "draft4" && (key === "const" || key === "contains" || key === "propertyNames")) {
      return false;
    }
    if (key === "dependentRequired" || key === "dependentSchemas") {
      return this.isModernDialect(dialect);
    }
    if (key === "minContains" || key === "maxContains") {
      return this.isModernDialect(dialect);
    }
    if (key === "prefixItems") {
      return dialect === "2020-12";
    }
    if (key === "unevaluatedItems" || key === "unevaluatedProperties") {
      return this.isModernDialect(dialect);
    }
    if (key === "additionalItems") {
      return dialect !== "2020-12";
    }
    if (key === "if" || key === "then" || key === "else") {
      return dialect !== "draft4" && dialect !== "draft6";
    }
    if (key === "contentMediaType" || key === "contentEncoding") {
      return dialect === "legacy" || dialect === "draft7";
    }
    return true;
  }
  validateAnchor(value, dialect, keyword) {
    const pattern = dialect === "2019-09" ? /^[A-Za-z][-A-Za-z0-9.:_]*$/ : /^[A-Za-z_][-A-Za-z0-9._]*$/;
    if (typeof value !== "string" || !pattern.test(value)) {
      const error = new ValidationError(
        `Invalid ${keyword}: ${String(value)}`
      );
      error.code = "INVALID_ANCHOR";
      error.keyword = keyword;
      throw error;
    }
    return value;
  }
  escapePointerToken(value) {
    return value.replace(/~/g, "~0").replace(/\//g, "~1");
  }
  resolveUri(reference, baseUri, keyword) {
    try {
      return new URL(reference, baseUri).href;
    } catch {
      const error = new ValidationError(`Invalid ${keyword} URI: ${reference}`);
      error.code = keyword === "$ref" ? "REFERENCE_NOT_FOUND" : "INVALID_SCHEMA_ID";
      error.keyword = keyword;
      throw error;
    }
  }
  resourceUri(uri) {
    const hashIndex = uri.indexOf("#");
    return hashIndex === -1 ? uri : uri.slice(0, hashIndex);
  }
  buildReferenceRegistry(schema) {
    const aliases = /* @__PURE__ */ new Map();
    const positions = [];
    const positionsByNode = /* @__PURE__ */ new WeakMap();
    if (!schema || typeof schema !== "object" || Array.isArray(schema)) {
      return Object.freeze({
        aliases,
        positions: Object.freeze(positions),
        positionsByNode,
        ensureIndexed: () => {
        },
        ensurePointerPosition: () => {
        },
        resolveRegisteredIdentity: () => {
        }
      });
    }
    const register = (uri, node, code = "DUPLICATE_SCHEMA_ID", keyword = "$id") => {
      if (aliases.has(uri) && aliases.get(uri) !== node) {
        const error = new ValidationError(`Duplicate schema identity: ${uri}`);
        error.code = code;
        error.keyword = keyword;
        throw error;
      }
      aliases.set(uri, node);
    };
    const registrations = [
      ...BUILTIN_SCHEMA_REGISTRATIONS,
      ...this.registeredSchemas
    ];
    for (const registration of registrations) {
      for (const identity of registration.identities) {
        register(identity, registration.schema);
      }
    }
    register(LOCAL_SCHEMA_BASE, schema);
    const registrationsByRoot = /* @__PURE__ */ new WeakMap();
    const registrationsByNestedIdentity = /* @__PURE__ */ new Map();
    for (const registration of registrations) {
      if (registration.schema !== true && registration.schema !== false) {
        registrationsByRoot.set(registration.schema, registration);
      }
      for (const identity of registration.nestedIdentities) {
        const candidates = registrationsByNestedIdentity.get(identity);
        if (candidates) {
          candidates.push(registration);
        } else {
          registrationsByNestedIdentity.set(identity, [registration]);
        }
      }
    }
    const indexed = /* @__PURE__ */ new WeakSet();
    const indexResource = (root, inheritedBase, inheritedEnvironment, rootIdBesideRef = false, containingResourceRoot = root, rootPointer = "#") => {
      if (indexed.has(root)) {
        return;
      }
      const visited = /* @__PURE__ */ new WeakSet();
      const stack = [
        {
          node: root,
          inheritedBase,
          resourceRoot: containingResourceRoot,
          pointer: rootPointer,
          environment: inheritedEnvironment,
          root: true
        }
      ];
      while (stack.length > 0) {
        const entry = stack.pop();
        if (visited.has(entry.node)) {
          continue;
        }
        visited.add(entry.node);
        const environment = this.schemaEnvironment(
          entry.node,
          entry.environment
        );
        const dialect = environment.dialect;
        let baseUri = entry.inheritedBase;
        let resourceRoot = entry.resourceRoot;
        const idKeyword = dialect === "draft4" ? "id" : "$id";
        const schemaId = entry.node[idKeyword];
        if (typeof schemaId === "string" && (this.isModernDialect(dialect) || !("$ref" in entry.node) || entry.root && rootIdBesideRef)) {
          baseUri = this.resolveUri(schemaId, entry.inheritedBase, idKeyword);
          if (this.isModernDialect(dialect) && schemaId.includes("#")) {
            const error = new ValidationError(
              `Invalid $id URI for ${dialect}: ${schemaId}`
            );
            error.code = "INVALID_SCHEMA_ID";
            error.keyword = idKeyword;
            throw error;
          }
          register(baseUri, entry.node);
          if (baseUri.indexOf("#") === -1 || baseUri.endsWith("#")) {
            resourceRoot = entry.node;
            register(this.resourceUri(baseUri), entry.node);
          }
        }
        const registerAnchor = (anchor, keyword) => {
          const resourceIdentities = /* @__PURE__ */ new Set([this.resourceUri(baseUri)]);
          for (const [identity, target] of aliases) {
            if (target === resourceRoot && !identity.includes("#")) {
              resourceIdentities.add(identity);
            }
          }
          for (const identity of resourceIdentities) {
            register(
              `${identity}#${anchor}`,
              entry.node,
              "DUPLICATE_ANCHOR",
              keyword
            );
          }
        };
        if ((dialect === "2019-09" || dialect === "2020-12") && hasOwn(entry.node, "$anchor")) {
          registerAnchor(
            this.validateAnchor(entry.node.$anchor, dialect, "$anchor"),
            "$anchor"
          );
        }
        if (dialect === "2020-12" && hasOwn(entry.node, "$dynamicAnchor")) {
          registerAnchor(
            this.validateAnchor(
              entry.node.$dynamicAnchor,
              dialect,
              "$dynamicAnchor"
            ),
            "$dynamicAnchor"
          );
        }
        const position = {
          source: entry.node,
          baseUri,
          resourceRoot,
          pointer: entry.pointer,
          dialect,
          environment
        };
        positions.push(position);
        positionsByNode.set(entry.node, position);
        const children = this.registrySubschemaEntries(
          entry.node,
          dialect,
          environment
        );
        for (let index = children.length - 1; index >= 0; index--) {
          const child = children[index];
          if (Array.isArray(child.value)) {
            continue;
          }
          stack.push({
            node: child.value,
            inheritedBase: baseUri,
            resourceRoot,
            pointer: `${entry.pointer}${child.pointer}`,
            environment,
            root: false
          });
        }
      }
      indexed.add(root);
    };
    indexResource(schema, LOCAL_SCHEMA_BASE, this.defaultEnvironment("legacy"));
    const ensureIndexed = (target, environment) => {
      if (target === true || target === false) {
        return;
      }
      const registration = registrationsByRoot.get(target);
      if (registration) {
        indexResource(
          target,
          registration.baseUri,
          environment,
          registration.rootIdBesideRef
        );
      }
    };
    const resolveRegisteredIdentity = (uri, environment) => {
      const candidates = registrationsByNestedIdentity.get(uri) || [];
      for (const registration of candidates) {
        ensureIndexed(registration.schema, environment);
      }
    };
    const ensurePointerPosition = (target, resourceRoot, pointer) => {
      if (target === true || target === false || Array.isArray(target) || positionsByNode.has(target)) {
        return;
      }
      const resourcePosition = positionsByNode.get(resourceRoot);
      if (!resourcePosition) {
        return;
      }
      indexResource(
        target,
        resourcePosition.baseUri,
        resourcePosition.environment,
        false,
        resourceRoot,
        pointer
      );
    };
    return Object.freeze({
      aliases,
      positions,
      positionsByNode,
      ensureIndexed,
      ensurePointerPosition,
      resolveRegisteredIdentity
    });
  }
  resolveReferenceSource(ref, position, registry) {
    const resolvedUri = this.resolveUri(ref, position.baseUri, "$ref");
    if (!registry.aliases.has(resolvedUri)) {
      registry.resolveRegisteredIdentity(resolvedUri, position.environment);
    }
    if (registry.aliases.has(resolvedUri)) {
      const target = registry.aliases.get(resolvedUri);
      registry.ensureIndexed(target, position.environment);
      return target;
    }
    const resourceIdentity = this.resourceUri(resolvedUri);
    if (!registry.aliases.has(resourceIdentity)) {
      registry.resolveRegisteredIdentity(resourceIdentity, position.environment);
    }
    if (!registry.aliases.has(resourceIdentity)) {
      return;
    }
    const resourceRoot = registry.aliases.get(resourceIdentity);
    registry.ensureIndexed(resourceRoot, position.environment);
    if (registry.aliases.has(resolvedUri)) {
      return registry.aliases.get(resolvedUri);
    }
    const hashIndex = resolvedUri.indexOf("#");
    const fragment = hashIndex === -1 ? "" : resolvedUri.slice(hashIndex + 1);
    if (fragment.length === 0) {
      return resourceRoot;
    }
    if (fragment.startsWith("/") && resourceRoot !== true && resourceRoot !== false) {
      try {
        const target = resolvePath(resourceRoot, `#${fragment}`);
        registry.ensurePointerPosition(target, resourceRoot, `#${fragment}`);
        return target;
      } catch {
        const error = new ValidationError(`Reference not found: ${ref}`);
        error.code = "REFERENCE_NOT_FOUND";
        error.keyword = "$ref";
        throw error;
      }
    }
    return;
  }
  builtinReferences(schema, position) {
    const references = [];
    if (typeof schema.$ref === "string" && this.getKeyword("$ref") === keywords.$ref) {
      references.push({ keyword: "$ref", ref: schema.$ref });
    }
    if (position.dialect === "2019-09" && typeof schema.$recursiveRef === "string") {
      references.push({ keyword: "$recursiveRef", ref: schema.$recursiveRef });
    }
    if (position.dialect === "2020-12" && typeof schema.$dynamicRef === "string") {
      references.push({ keyword: "$dynamicRef", ref: schema.$dynamicRef });
    }
    return references;
  }
  analyzeSchema(schema, registry) {
    if (!schema || typeof schema !== "object" || Array.isArray(schema)) {
      return {
        requiresDepthGuard: false,
        requiresMutationJournal: false,
        requiresDynamicScope: false,
        requiresEvaluatedTracking: false,
        mutableSchemas: /* @__PURE__ */ new WeakSet(),
        reachableSchemas: [schema]
      };
    }
    const visiting = /* @__PURE__ */ new WeakSet();
    const visited = /* @__PURE__ */ new WeakSet();
    const queuedRoots = /* @__PURE__ */ new WeakSet();
    const roots = [schema];
    queuedRoots.add(schema);
    const reachableSchemas = [];
    let requiresDepthGuard = false;
    let requiresMutationJournal = false;
    let requiresDynamicScope = false;
    let requiresEvaluatedTracking = false;
    const allNodes = [];
    for (let rootIndex = 0; rootIndex < roots.length; rootIndex++) {
      const root = roots[rootIndex];
      if (root === true || root === false) {
        reachableSchemas.push(root);
        continue;
      }
      if (!root || typeof root !== "object" || visited.has(root)) {
        continue;
      }
      const stack = [{ value: root, depth: 0, exit: false }];
      while (stack.length > 0) {
        const entry = stack.pop();
        if (entry.exit) {
          visiting.delete(entry.value);
          visited.add(entry.value);
          continue;
        }
        if (visited.has(entry.value)) {
          continue;
        }
        if (visiting.has(entry.value)) {
          const error = new ValidationError(
            "Cyclic schema graph is not supported"
          );
          error.code = "CYCLIC_SCHEMA_GRAPH";
          error.keyword = "compile";
          throw error;
        }
        if (entry.depth > MAX_COMPILE_DEPTH) {
          const error = new ValidationError("Maximum compile depth exceeded");
          error.code = "MAX_COMPILE_DEPTH_EXCEEDED";
          error.keyword = "compile";
          throw error;
        }
        if (entry.depth > this.maxDepth) {
          requiresDepthGuard = true;
        }
        visiting.add(entry.value);
        reachableSchemas.push(entry.value);
        allNodes.push(entry.value);
        stack.push({ ...entry, exit: true });
        const position = registry.positionsByNode.get(entry.value);
        const environment = position?.environment || this.defaultEnvironment("legacy");
        if (this.useDefaults !== false && this.isKeywordActive("properties", environment) && this.hasPropertyDefaults(entry.value)) {
          requiresMutationJournal = true;
        }
        if (position && this.isModernDialect(position.dialect) && (hasOwn(entry.value, "unevaluatedItems") && this.isKeywordActive("unevaluatedItems", environment) || hasOwn(entry.value, "unevaluatedProperties") && this.isKeywordActive("unevaluatedProperties", environment))) {
          requiresEvaluatedTracking = true;
        }
        if (position?.dialect === "2019-09" && typeof entry.value.$recursiveRef === "string" || position?.dialect === "2020-12" && typeof entry.value.$dynamicRef === "string") {
          requiresDepthGuard = true;
          requiresDynamicScope = true;
        }
        for (const key of Object.keys(entry.value)) {
          const keyword = this.getKeyword(key);
          if (keyword && keyword !== keywords[key]) {
            requiresDepthGuard = true;
            requiresMutationJournal = true;
          }
        }
        const children = this.schemaChildren(
          entry.value,
          position?.dialect,
          position?.environment
        );
        for (let index = children.length - 1; index >= 0; index--) {
          stack.push({
            value: children[index],
            depth: entry.depth + 1,
            exit: false
          });
        }
        if (position) {
          for (const reference of this.builtinReferences(entry.value, position)) {
            const target = this.resolveReferenceSource(
              reference.ref,
              position,
              registry
            );
            if (typeof target === "undefined") {
              const error = new ValidationError(
                `Reference not found: ${reference.ref}`
              );
              error.code = "REFERENCE_NOT_FOUND";
              error.keyword = reference.keyword;
              throw error;
            }
            if (target === true || target === false) {
              roots.push(target);
            } else if (!queuedRoots.has(target)) {
              queuedRoots.add(target);
              roots.push(target);
            }
          }
        }
      }
    }
    const semanticState = /* @__PURE__ */ new WeakMap();
    const semanticStack = [{ value: schema, exit: false }];
    while (semanticStack.length > 0 && !requiresDepthGuard) {
      const entry = semanticStack.pop();
      if (entry.exit) {
        semanticState.set(entry.value, 2);
        continue;
      }
      const state = semanticState.get(entry.value);
      if (state === 1) {
        requiresDepthGuard = true;
        break;
      }
      if (state === 2) {
        continue;
      }
      semanticState.set(entry.value, 1);
      semanticStack.push({ value: entry.value, exit: true });
      const position = registry.positionsByNode.get(entry.value);
      const children = this.schemaChildren(
        entry.value,
        position?.dialect,
        position?.environment
      );
      if (position) {
        for (const reference of this.builtinReferences(entry.value, position)) {
          const target = this.resolveReferenceSource(
            reference.ref,
            position,
            registry
          );
          if (target && typeof target === "object") {
            children.push(target);
          }
        }
      }
      for (let index = children.length - 1; index >= 0; index--) {
        semanticStack.push({
          value: children[index],
          exit: false
        });
      }
    }
    const mutableSchemas = /* @__PURE__ */ new WeakSet();
    if (requiresMutationJournal) {
      for (const node of allNodes) {
        mutableSchemas.add(node);
      }
    }
    return {
      requiresDepthGuard,
      requiresMutationJournal,
      requiresDynamicScope,
      requiresEvaluatedTracking,
      mutableSchemas,
      reachableSchemas
    };
  }
  validateSchema(schema) {
    if (!this.isJsonSchema(schema)) {
      const error = this.schemaRegistrationError(
        "Invalid schema",
        "INVALID_SCHEMA",
        "schema"
      );
      return { data: schema, error, valid: false };
    }
    if (schema === true || schema === false) {
      return { data: schema, error: null, valid: true };
    }
    if (!hasOwn(schema, "$schema")) {
      if (!this.isSchemaLike(schema)) {
        const error = this.schemaRegistrationError(
          "Invalid schema",
          "INVALID_SCHEMA",
          "schema"
        );
        return { data: schema, error, valid: false };
      }
      return { data: schema, error: null, valid: true };
    }
    if (typeof schema.$schema !== "string") {
      throw this.unknownMetaschemaError(String(schema.$schema));
    }
    let metaschemaUri;
    try {
      metaschemaUri = new URL(schema.$schema).href;
    } catch {
      throw this.unknownMetaschemaError(schema.$schema);
    }
    return this.validateSchemaWithMetaSchema(schema, metaschemaUri);
  }
  validateSchemaWithMetaSchema(schema, metaschemaUri) {
    const validator = this.getMetaSchemaValidator(metaschemaUri);
    if (!validator) {
      throw this.unknownMetaschemaError(metaschemaUri);
    }
    return validator(schema);
  }
  getMetaSchemaValidator(uri) {
    const builtin = BUILTIN_META_SCHEMA_BY_URI.get(uri);
    if (builtin) {
      const cacheKey = `${this.formatMode}:${uri}`;
      const cached2 = _SchemaShield.builtinMetaValidators.get(cacheKey);
      if (cached2) {
        return cached2;
      }
      const ownerOptions = {
        failFast: false
      };
      if (this.formatMode === "enabled") {
        ownerOptions.format = true;
      } else if (this.formatMode === "disabled") {
        ownerOptions.format = false;
      }
      const owner = new _SchemaShield(ownerOptions);
      const validator2 = owner.compile(
        { $ref: builtin.uri },
        { validateSchema: false }
      );
      _SchemaShield.builtinMetaValidators.set(cacheKey, validator2);
      return validator2;
    }
    const registration = this.registeredSchemaIds.get(uri);
    if (!registration?.metaSchema) {
      return null;
    }
    const cached = this.customMetaValidators.get(uri);
    if (cached) {
      return cached;
    }
    const validator = this.compile(
      { $ref: uri },
      { validateSchema: false }
    );
    this.customMetaValidators.set(uri, validator);
    return validator;
  }
  invalidSchemaError(error) {
    if (error instanceof ValidationError) {
      error.code = "INVALID_SCHEMA";
      return error;
    }
    return this.schemaRegistrationError(
      "Invalid schema",
      "INVALID_SCHEMA",
      "schema"
    );
  }
  unknownMetaschemaError(uri) {
    const error = new ValidationError(`Unknown metaschema: ${uri}`);
    error.code = "UNKNOWN_METASCHEMA";
    error.keyword = "$schema";
    return error;
  }
  compile(schema, options = {}) {
    if (!this.isJsonObject(options)) {
      throw this.schemaRegistrationError(
        "compile options must be an object",
        "INVALID_COMPILE_OPTIONS",
        "compile"
      );
    }
    const validateSchema = hasOwn(options, "validateSchema") ? options.validateSchema : true;
    if (validateSchema !== true && validateSchema !== false) {
      throw this.schemaRegistrationError(
        "validateSchema must be a boolean",
        "INVALID_COMPILE_OPTIONS",
        "validateSchema"
      );
    }
    const prepared = this.prepareSchema(schema, validateSchema);
    const compiledSchema = prepared.compiledSchema;
    if (!prepared.requiresDepthGuard && !prepared.requiresMutationJournal && !prepared.requiresEvaluatedTracking) {
      const directValidate = compiledSchema.$validate;
      const validate = this.immutable ? (data) => {
        const clonedData = deepCloneUnfreeze(data);
        const error = directValidate(clonedData);
        return error ? { data: clonedData, error, valid: false } : { data: clonedData, error: null, valid: true };
      } : (data) => {
        const error = directValidate(data);
        return error ? { data, error, valid: false } : { data, error: null, valid: true };
      };
      validate.compiledSchema = compiledSchema;
      return validate;
    }
    return this.createGuardedValidator(compiledSchema, prepared.depthGuardState);
  }
  prepareSchema(schema, validateSchema) {
    this.compilingSchemaChildren = /* @__PURE__ */ new WeakMap();
    const referenceRegistry = this.buildReferenceRegistry(schema);
    const analysis = this.analyzeSchema(schema, referenceRegistry);
    if (validateSchema) {
      if (!schema || typeof schema !== "object" || Array.isArray(schema)) {
        const validation = this.validateSchema(schema);
        if (!validation.valid) {
          throw this.invalidSchemaError(validation.error);
        }
      } else {
        const validatedResources = /* @__PURE__ */ new WeakSet();
        for (const position of referenceRegistry.positions) {
          if (position.source !== position.resourceRoot || validatedResources.has(position.resourceRoot)) {
            continue;
          }
          validatedResources.add(position.resourceRoot);
          const validation = position.environment.metaschemaUri ? this.validateSchemaWithMetaSchema(
            position.resourceRoot,
            position.environment.metaschemaUri
          ) : this.validateSchema(position.resourceRoot);
          if (!validation.valid) {
            throw this.invalidSchemaError(validation.error);
          }
        }
      }
    }
    const reachableSchemas = analysis.reachableSchemas;
    this.compileCache = /* @__PURE__ */ new WeakMap();
    this.compilingRequiresContext = analysis.requiresDepthGuard || analysis.requiresMutationJournal || analysis.requiresDynamicScope || analysis.requiresEvaluatedTracking;
    this.compilingValidateSubschema = this.compilingRequiresContext ? this.validateSubschema.bind(this) : void 0;
    if (this.compilingValidateSubschema) {
      this.compilingValidateSubschema.savepoint = () => __privateMethod(this, _defaultSavepoint, defaultSavepoint_fn).call(this);
      this.compilingValidateSubschema.rollback = (savepoint) => __privateMethod(this, _rollbackDefaultSavepoint, rollbackDefaultSavepoint_fn).call(this, savepoint);
      this.compilingValidateSubschema.tracksEvaluated = analysis.requiresEvaluatedTracking;
    }
    this.compilingMutableSchemas = analysis.mutableSchemas;
    this.compilingEvaluatedTracking = analysis.requiresEvaluatedTracking;
    this.compilingDialects = /* @__PURE__ */ new WeakMap();
    this.compilingEnvironments = /* @__PURE__ */ new WeakMap();
    for (const position of referenceRegistry.positions) {
      this.compilingDialects.set(position.source, position.dialect);
      this.compilingEnvironments.set(position.source, position.environment);
    }
    const compiledSchema = this.compileSchema(schema);
    for (const reachableSchema of reachableSchemas) {
      if (reachableSchema !== schema) {
        this.compileSchema(reachableSchema);
      }
    }
    this.rootSchema = compiledSchema;
    if (!compiledSchema.$validate) {
      if (schema === false) {
        const defineError = getDefinedErrorFunctionForKey(
          "oneOf",
          compiledSchema,
          this.failFast
        );
        compiledSchema.$validate = getNamedFunction(
          "Validate_False",
          (data) => defineError("Value is not valid", { data })
        );
      } else if (schema === true) {
        compiledSchema.$validate = getNamedFunction(
          "Validate_Any",
          () => {
          }
        );
      } else if (this.isSchemaLike(schema) === false) {
        throw new ValidationError("Invalid schema");
      } else {
        compiledSchema.$validate = getNamedFunction(
          "Validate_Any",
          () => {
          }
        );
      }
    }
    const evaluationResources = analysis.requiresDynamicScope ? this.installEvaluationResourceScopes(referenceRegistry) : null;
    const compiledRoots = [compiledSchema];
    if (analysis.requiresDepthGuard || analysis.requiresEvaluatedTracking) {
      for (const reachableSchema of reachableSchemas) {
        if (reachableSchema !== true && reachableSchema !== false && reachableSchema !== schema) {
          const compiledReachable = this.compileCache.get(reachableSchema);
          if (compiledReachable) {
            compiledRoots.push(compiledReachable);
          }
        }
      }
    }
    if (analysis.requiresEvaluatedTracking) {
      this.installEvaluationTracking(compiledRoots);
    }
    let depthGuardState = null;
    if (analysis.requiresDepthGuard) {
      depthGuardState = this.installDepthGuards(compiledRoots);
      definePropertyOrThrow(compiledSchema, "_requiresDepthGuard", {
        value: true,
        enumerable: false,
        configurable: false,
        writable: false
      });
    } else if (analysis.requiresMutationJournal || analysis.requiresEvaluatedTracking) {
      depthGuardState = { context: null };
    }
    if (compiledSchema._hasRef === true) {
      this.linkReferences(referenceRegistry, evaluationResources);
    }
    return {
      compiledSchema,
      requiresDepthGuard: analysis.requiresDepthGuard,
      requiresMutationJournal: analysis.requiresMutationJournal,
      requiresEvaluatedTracking: analysis.requiresEvaluatedTracking,
      depthGuardState
    };
  }
  createGuardedValidator(compiledSchema, depthGuardState) {
    const reusableContext = {
      active: false,
      depth: -1,
      depthExceeded: false,
      defaults: [],
      resources: [],
      evaluations: []
    };
    const validate = (data) => {
      this.rootSchema = compiledSchema;
      const context = reusableContext.active ? {
        active: false,
        depth: -1,
        depthExceeded: false,
        defaults: [],
        resources: [],
        evaluations: []
      } : reusableContext;
      context.active = true;
      context.depth = -1;
      context.depthExceeded = false;
      delete context.depthError;
      context.defaults.length = 0;
      context.resources.length = 0;
      context.evaluations.length = 0;
      delete context.completedEvaluation;
      this.validationContexts.push(context);
      const priorContext = depthGuardState.context;
      depthGuardState.context = context;
      let clonedData = data;
      try {
        clonedData = this.immutable ? deepCloneUnfreeze(data) : data;
        let error = compiledSchema.$validate(clonedData);
        if (this.isDepthError(error)) {
          this.rollbackDefaults(context, 0);
          error = context.depthError || this.depthError();
        }
        return error ? { data: clonedData, error, valid: false } : { data: clonedData, error: null, valid: true };
      } catch (error) {
        this.rollbackDefaults(context, 0);
        throw error;
      } finally {
        depthGuardState.context = priorContext;
        this.validationContexts.pop();
        context.active = false;
      }
    };
    validate.compiledSchema = compiledSchema;
    return validate;
  }
  isPlainObject(value) {
    return !!value && typeof value === "object" && !Array.isArray(value);
  }
  isTrivialAlwaysValidSubschema(value) {
    return value === true || this.isPlainObject(value) && Object.keys(value).length === 0;
  }
  shallowArrayEquals(a, b) {
    if (a === b) {
      return true;
    }
    if (a.length !== b.length) {
      return false;
    }
    for (let i = 0; i < a.length; i++) {
      if (a[i] !== b[i]) {
        return false;
      }
    }
    return true;
  }
  flattenAssociativeBranches(key, branches) {
    const out = [];
    for (let i = 0; i < branches.length; i++) {
      const item = branches[i];
      if (this.isPlainObject(item) && Object.keys(item).length === 1 && Array.isArray(item[key])) {
        const nested = this.flattenAssociativeBranches(key, item[key]);
        for (let j = 0; j < nested.length; j++) {
          out.push(nested[j]);
        }
        continue;
      }
      out.push(item);
    }
    return out;
  }
  flattenSingleWrapperOneOf(branches) {
    let current = branches;
    while (current.length === 1) {
      const item = current[0];
      if (this.isPlainObject(item) && Object.keys(item).length === 1 && Array.isArray(item.oneOf)) {
        current = item.oneOf;
        continue;
      }
      break;
    }
    return current;
  }
  normalizeSchemaForCompile(schema) {
    let normalized = schema;
    const schemaKeys = Object.keys(schema);
    const hasOnlyKey = (key) => schemaKeys.length === 1 && schemaKeys[0] === key;
    const setNormalized = (key, value) => {
      if (normalized === schema) {
        normalized = { ...schema };
      }
      normalized[key] = value;
    };
    if (Array.isArray(schema.allOf)) {
      const flattenedAllOf = this.flattenAssociativeBranches(
        "allOf",
        schema.allOf
      ).filter(
        (item) => !(this.isPlainObject(item) && Object.keys(item).length === 0)
      );
      if (hasOnlyKey("allOf") && flattenedAllOf.length === 1 && this.isPlainObject(flattenedAllOf[0])) {
        return flattenedAllOf[0];
      }
      if (!this.shallowArrayEquals(flattenedAllOf, schema.allOf)) {
        setNormalized("allOf", flattenedAllOf);
      }
    }
    if (Array.isArray(schema.anyOf)) {
      const flattenedAnyOf = this.flattenAssociativeBranches(
        "anyOf",
        schema.anyOf
      );
      if (hasOnlyKey("anyOf") && flattenedAnyOf.length === 1 && this.isPlainObject(flattenedAnyOf[0])) {
        return flattenedAnyOf[0];
      }
      if (!this.shallowArrayEquals(flattenedAnyOf, schema.anyOf)) {
        setNormalized("anyOf", flattenedAnyOf);
      }
    }
    if (Array.isArray(schema.oneOf)) {
      const flattenedOneOf = this.flattenSingleWrapperOneOf(schema.oneOf);
      if (hasOnlyKey("oneOf") && flattenedOneOf.length === 1 && this.isPlainObject(flattenedOneOf[0])) {
        return flattenedOneOf[0];
      }
      if (!this.shallowArrayEquals(flattenedOneOf, schema.oneOf)) {
        setNormalized("oneOf", flattenedOneOf);
      }
    }
    return normalized;
  }
  markSchemaHasRef(schema) {
    if (schema._hasRef === true) {
      return;
    }
    definePropertyOrThrow(schema, "_hasRef", {
      value: true,
      enumerable: false,
      configurable: false,
      writable: false
    });
  }
  shouldSkipKeyword(schema, key) {
    const value = schema[key];
    switch (key) {
      case "required":
        return Array.isArray(value) && value.length === 0;
      case "uniqueItems":
        return value === false;
      case "properties":
      case "patternProperties":
      case "dependencies":
        return this.isPlainObject(value) && Object.keys(value).length === 0;
      case "propertyNames":
        return value === true;
      case "items":
        return value === true && !this.compilingEvaluatedTracking;
      case "additionalProperties":
        if (value === true && !this.compilingEvaluatedTracking) {
          return true;
        }
        return value === false && this.isPlainObject(schema.patternProperties) && Object.keys(schema.patternProperties).length > 0;
      case "additionalItems":
        return value === true && !this.compilingEvaluatedTracking || !Array.isArray(schema.items);
      case "allOf": {
        if (!Array.isArray(value)) {
          return false;
        }
        if (value.length === 0) {
          return true;
        }
        for (let i = 0; i < value.length; i++) {
          if (this.isTrivialAlwaysValidSubschema(value[i])) {
            continue;
          }
          return false;
        }
        return true;
      }
      case "anyOf": {
        if (!Array.isArray(value)) {
          return false;
        }
        if (this.compilingEvaluatedTracking) {
          return false;
        }
        for (let i = 0; i < value.length; i++) {
          if (this.isTrivialAlwaysValidSubschema(value[i])) {
            return true;
          }
        }
        return false;
      }
      default:
        return false;
    }
  }
  hasPropertyDefaults(schema) {
    const properties = schema.properties;
    if (!this.isPlainObject(properties)) {
      return false;
    }
    const propertyKeys = Object.keys(properties);
    for (let i = 0; i < propertyKeys.length; i++) {
      const subSchema = properties[propertyKeys[i]];
      if (this.isPlainObject(subSchema) && hasOwn(subSchema, "default")) {
        return true;
      }
    }
    return false;
  }
  isDefaultTypeValidator(type, validator) {
    return Types[type] === validator;
  }
  rollbackDefaults(context, start) {
    for (let index = context.defaults.length - 1; index >= start; index--) {
      const entry = context.defaults[index];
      if (entry.descriptor) {
        definePropertyOrThrow(entry.target, entry.key, entry.descriptor);
      } else {
        delete entry.target[entry.key];
      }
    }
    context.defaults.length = start;
  }
  isDepthError(error) {
    const context = this.validationContexts[this.validationContexts.length - 1];
    if (context?.depthExceeded) {
      return true;
    }
    if (!(error instanceof ValidationError)) {
      return false;
    }
    return error.getCause().code === "MAX_DEPTH_EXCEEDED";
  }
  validateSubschema(schema, data, evaluated) {
    const context = this.validationContexts[this.validationContexts.length - 1];
    const parentEvaluation = context?.evaluations[context.evaluations.length - 1];
    if (evaluated?.unevaluated === true && (typeof evaluated.property === "string" && parentEvaluation?.properties?.has(evaluated.property) || typeof evaluated.item === "number" && parentEvaluation?.items?.has(evaluated.item))) {
      return;
    }
    if (schema === true) {
      this.markEvaluated(parentEvaluation, evaluated);
      return;
    }
    if (schema === false) {
      return true;
    }
    if (!schema || typeof schema.$validate !== "function") {
      return;
    }
    const savepoint = context?.defaults.length || 0;
    if (context) {
      delete context.completedEvaluation;
    }
    try {
      const error = schema.$validate(data);
      if (error && context) {
        this.rollbackDefaults(context, savepoint);
      }
      if (!error && evaluated?.discardAnnotations !== true) {
        this.markEvaluated(parentEvaluation, evaluated);
        if (typeof evaluated?.property !== "string" && typeof evaluated?.item !== "number") {
          this.mergeCompletedEvaluation(parentEvaluation, data, context);
        }
      }
      if (evaluated?.discardAnnotations === true && context) {
        delete context.completedEvaluation;
      }
      return error;
    } catch (error) {
      if (context) {
        this.rollbackDefaults(context, savepoint);
      }
      throw error;
    }
  }
  markEvaluated(state, evaluated) {
    if (!state || !evaluated) {
      return;
    }
    if (typeof evaluated.property === "string") {
      if (!state.properties) {
        state.properties = /* @__PURE__ */ new Set();
      }
      state.properties.add(evaluated.property);
    }
    if (typeof evaluated.item === "number") {
      if (!state.items) {
        state.items = /* @__PURE__ */ new Set();
      }
      state.items.add(evaluated.item);
    }
  }
  mergeCompletedEvaluation(parent, data, context) {
    const completed = context?.completedEvaluation;
    if (!parent || !completed || completed === parent || completed.data !== data) {
      return;
    }
    if (completed.properties) {
      if (!parent.properties) {
        parent.properties = /* @__PURE__ */ new Set();
      }
      for (const key of completed.properties) {
        parent.properties.add(key);
      }
    }
    if (completed.items) {
      if (!parent.items) {
        parent.items = /* @__PURE__ */ new Set();
      }
      for (const index of completed.items) {
        parent.items.add(index);
      }
    }
  }
  mergeReferenceEvaluation(data) {
    const context = this.validationContexts[this.validationContexts.length - 1];
    const parent = context?.evaluations[context.evaluations.length - 1];
    this.mergeCompletedEvaluation(parent, data, context);
  }
  installEvaluationTracking(roots) {
    const stack = roots.slice();
    const seen = /* @__PURE__ */ new WeakSet();
    while (stack.length > 0) {
      const schema = stack.pop();
      if (!schema || typeof schema !== "object" || seen.has(schema)) {
        continue;
      }
      seen.add(schema);
      if (typeof schema.$validate === "function") {
        const directValidate = schema.$validate;
        schema.$validate = getNamedFunction(directValidate.name, (data) => {
          const context = this.validationContexts[this.validationContexts.length - 1];
          if (!context) {
            return directValidate(data);
          }
          const state = { data };
          context.evaluations.push(state);
          try {
            const error = directValidate(data);
            if (error) {
              delete context.completedEvaluation;
            } else {
              context.completedEvaluation = state;
            }
            return error;
          } catch (error) {
            delete context.completedEvaluation;
            throw error;
          } finally {
            context.evaluations.pop();
          }
        });
      }
      for (const child of this.schemaChildren(schema)) {
        stack.push(child);
      }
    }
  }
  installDepthGuards(roots) {
    const state = { context: null };
    const stack = roots.slice();
    const seen = /* @__PURE__ */ new WeakSet();
    while (stack.length > 0) {
      const schema = stack.pop();
      if (!schema || typeof schema !== "object" || seen.has(schema)) {
        continue;
      }
      seen.add(schema);
      if (typeof schema.$validate === "function") {
        const directValidate = schema.$validate;
        schema.$validate = getNamedFunction(directValidate.name, (data) => {
          const context = state.context;
          if (!context) {
            return directValidate(data);
          }
          const nextDepth = context.depth + 1;
          if (nextDepth > this.maxDepth) {
            context.depthExceeded = true;
            if (!context.depthError) {
              context.depthError = this.depthError();
            }
            return context.depthError;
          }
          context.depth = nextDepth;
          try {
            return directValidate(data);
          } finally {
            context.depth--;
          }
        });
      }
      const children = this.schemaChildren(schema);
      for (const child of children) {
        stack.push(child);
      }
    }
    return state;
  }
  compileSchema(schema) {
    if (schema === true) {
      return {
        $validate: getNamedFunction("Validate_True", () => {
        })
      };
    }
    if (schema === false) {
      const compiledFalse = {};
      const defineError = getDefinedErrorFunctionForKey(
        "oneOf",
        compiledFalse,
        this.failFast
      );
      compiledFalse.$validate = getNamedFunction(
        "Validate_False",
        (data) => defineError("Value is not valid", { data })
      );
      return compiledFalse;
    }
    const sourceSchema = schema && typeof schema === "object" && !Array.isArray(schema) ? schema : null;
    const schemaCanApplyDefaults = sourceSchema !== null && this.compilingMutableSchemas.has(sourceSchema);
    if (sourceSchema) {
      const cached = this.compileCache.get(sourceSchema);
      if (cached) {
        return cached;
      }
    }
    if (!schema || typeof schema !== "object" || Array.isArray(schema)) {
      schema = { oneOf: [schema] };
    }
    schema = this.normalizeSchemaForCompile(schema);
    const compiledSchema = deepCloneUnfreeze(
      schema
    );
    if (sourceSchema) {
      this.compileCache.set(sourceSchema, compiledSchema);
    }
    if (schemaCanApplyDefaults) {
      definePropertyOrThrow(compiledSchema, "_canApplyDefaults", {
        value: true,
        enumerable: false,
        configurable: false,
        writable: false
      });
    }
    const validateSubschema = this.compilingValidateSubschema;
    let schemaHasRef = false;
    const validators = [];
    const activeNames = [];
    const pendingCombinators = [];
    const dialect = sourceSchema ? this.compilingDialects.get(sourceSchema) || "legacy" : "legacy";
    const environment = sourceSchema ? this.compilingEnvironments.get(sourceSchema) || this.defaultEnvironment(dialect) : this.defaultEnvironment("legacy");
    if (environment.formatAssertionRequired && this.formatMode === "disabled") {
      const error = new ValidationError(
        "format cannot be false for a format-assertion dialect"
      );
      error.code = "FORMAT_ASSERTION_REQUIRED";
      error.keyword = "format";
      throw error;
    }
    if (environment.formatAssertionRequired && typeof schema.format === "string" && !this.getFormat(schema.format)) {
      const error = new ValidationError(`Unknown format: ${schema.format}`);
      error.code = "UNKNOWN_FORMAT";
      error.keyword = "format";
      throw error;
    }
    definePropertyOrThrow(compiledSchema, "_dialect", {
      value: dialect,
      enumerable: false,
      configurable: false,
      writable: false
    });
    const dynamicKeywords = [
      {
        keyword: "$recursiveRef",
        active: dialect === "2019-09" && typeof schema.$recursiveRef === "string",
        method: "_resolvedRecursiveRef",
        name: "Validate_Recursive_Reference"
      },
      {
        keyword: "$dynamicRef",
        active: dialect === "2020-12" && typeof schema.$dynamicRef === "string",
        method: "_resolvedDynamicRef",
        name: "Validate_Dynamic_Reference"
      }
    ];
    for (const reference of dynamicKeywords) {
      if (!reference.active) {
        continue;
      }
      schemaHasRef = true;
      const defineError = getDefinedErrorFunctionForKey(
        reference.keyword,
        schema[reference.keyword],
        this.failFast
      );
      validators.push({
        name: reference.name,
        validate: getNamedFunction(reference.name, (data) => {
          const resolved = compiledSchema[reference.method];
          if (typeof resolved !== "function") {
            return defineError(`Missing reference: ${schema[reference.keyword]}`);
          }
          const error = resolved(data);
          if (!error) {
            this.mergeReferenceEvaluation(data);
          }
          return error;
        })
      });
      activeNames.push(reference.name);
    }
    if ("$ref" in schema) {
      schemaHasRef = true;
      const refValidator = this.getKeyword("$ref");
      const ignoresReferenceSiblings = refValidator === keywords.$ref && (dialect === "draft4" || dialect === "draft6" || dialect === "draft7");
      if (refValidator) {
        const defineError = getDefinedErrorFunctionForKey(
          "$ref",
          schema["$ref"],
          this.failFast
        );
        const isBuiltinRef = refValidator === keywords.$ref;
        const refName = isBuiltinRef ? "Validate_Reference" : refValidator.name || "$ref";
        const refValidate = getNamedFunction(
          refName,
          (data) => {
            let definedError = false;
            const trackedDefineError = (message, options) => {
              definedError = true;
              return defineError(message, options);
            };
            const error = refValidator(
              compiledSchema,
              data,
              isBuiltinRef ? defineError : trackedDefineError,
              this,
              validateSubschema
            );
            if (!isBuiltinRef) {
              if (definedError) {
                return error === false ? defineError("Value is not valid", { data }) : error;
              }
              if (error === false) {
                return defineError("Value is not valid", { data });
              }
              return error === true ? void 0 : error;
            }
            if (!error) {
              this.mergeReferenceEvaluation(data);
            }
            return error;
          }
        );
        if (isBuiltinRef && this.isModernDialect(dialect)) {
          validators.push({ name: refName, validate: refValidate });
          activeNames.push(refName);
        } else {
          compiledSchema.$validate = refValidate;
          if (!isBuiltinRef) {
            schemaHasRef = false;
          }
        }
      }
      if (validators.length === 0) {
        if (!ignoresReferenceSiblings) {
          for (const key of ["definitions", "$defs"]) {
            if (!this.isKeywordActive(key, environment)) {
              continue;
            }
            const definitions = schema[key];
            if (!definitions || typeof definitions !== "object") {
              continue;
            }
            const compiledDefinitions = {};
            for (const definitionKey of Object.keys(definitions)) {
              compiledDefinitions[definitionKey] = this.compileSchema(
                definitions[definitionKey]
              );
            }
            compiledSchema[key] = compiledDefinitions;
          }
        }
        if (schemaHasRef) {
          this.markSchemaHasRef(compiledSchema);
        }
        return compiledSchema;
      }
    }
    if (this.useDefaults !== false && this.isKeywordActive("properties", environment) && this.getKeyword("properties") === keywords.properties && this.hasPropertyDefaults(schema)) {
      const applyDefaults = this.useDefaults === "empty" ? applyEmptyPropertyDefaults : applyPropertyDefaults;
      validators.push({
        name: applyDefaults.name,
        validate: getNamedFunction(
          applyDefaults.name,
          (data) => applyDefaults(compiledSchema, data, this)
        )
      });
      activeNames.push(applyDefaults.name);
    }
    if ("type" in schema && this.isKeywordActive("type", environment)) {
      const defineTypeError = getDefinedErrorFunctionForKey(
        "type",
        schema,
        this.failFast
      );
      const types = Array.isArray(schema.type) ? schema.type : schema.type.split(",").map((t) => t.trim());
      const typeFunctions = [];
      const typeNames = [];
      const defaultTypeNames = [];
      let allTypesDefault = true;
      for (const type2 of types) {
        const validator = this.getType(type2);
        if (validator) {
          typeFunctions.push(validator);
          typeNames.push(validator.name);
          if (this.isDefaultTypeValidator(type2, validator)) {
            defaultTypeNames.push(type2);
          } else {
            allTypesDefault = false;
          }
        }
      }
      if (typeFunctions.length === 0) {
        throw getDefinedErrorFunctionForKey(
          "type",
          schema,
          this.failFast
        )("Invalid type for schema", { data: schema.type });
      }
      let combinedTypeValidator;
      let typeMethodName = "";
      if (typeFunctions.length === 1 && allTypesDefault) {
        const singleTypeName = defaultTypeNames[0];
        typeMethodName = singleTypeName;
        combinedTypeValidator = this.failFast && FAIL_FAST_TYPE_VALIDATORS[singleTypeName] ? FAIL_FAST_TYPE_VALIDATORS[singleTypeName] : createBuiltinTypeValidator(
          singleTypeName,
          defineTypeError,
          typeFunctions[0]
        );
      } else if (typeFunctions.length > 1 && allTypesDefault) {
        typeMethodName = defaultTypeNames.join("_OR_");
        const allowsObject = defaultTypeNames.includes("object");
        const allowsArray = defaultTypeNames.includes("array");
        const allowsString = defaultTypeNames.includes("string");
        const allowsNumber = defaultTypeNames.includes("number");
        const allowsInteger = defaultTypeNames.includes("integer");
        const allowsBoolean = defaultTypeNames.includes("boolean");
        const allowsNull = defaultTypeNames.includes("null");
        const allowsUndefined = defaultTypeNames.includes("undefined");
        combinedTypeValidator = (data) => {
          const dataType = typeof data;
          if (dataType === "number") {
            if (!Number.isFinite(data)) {
              return defineTypeError("Invalid type", { data });
            }
            if (allowsNumber || allowsInteger && Number.isInteger(data)) {
              return;
            }
            return defineTypeError("Invalid type", { data });
          }
          if (dataType === "string") {
            if (allowsString) {
              return;
            }
            return defineTypeError("Invalid type", { data });
          }
          if (dataType === "boolean") {
            if (allowsBoolean) {
              return;
            }
            return defineTypeError("Invalid type", { data });
          }
          if (dataType === "undefined" && allowsUndefined) {
            return;
          }
          if (dataType === "object") {
            if (data === null) {
              if (allowsNull) {
                return;
              }
              return defineTypeError("Invalid type", { data });
            }
            if (Array.isArray(data)) {
              if (allowsArray) {
                return;
              }
              return defineTypeError("Invalid type", { data });
            }
            if (allowsObject) {
              return;
            }
            return defineTypeError("Invalid type", { data });
          }
          return defineTypeError("Invalid type", { data });
        };
      } else if (typeFunctions.length === 1) {
        typeMethodName = typeNames[0];
        const singleTypeFn = typeFunctions[0];
        combinedTypeValidator = (data) => {
          let definedError = false;
          const result = singleTypeFn(data, (message, options) => {
            definedError = true;
            return defineTypeError(message, options);
          });
          if (definedError) {
            return result === false ? defineTypeError("Invalid type", { data }) : result;
          }
          if (result === true || typeof result === "undefined") {
            return;
          }
          return result instanceof ValidationError ? result : defineTypeError("Invalid type", { data });
        };
      } else {
        typeMethodName = typeNames.join("_OR_");
        combinedTypeValidator = (data) => {
          let customError = null;
          for (let i = 0; i < typeFunctions.length; i++) {
            let definedError = false;
            const result = typeFunctions[i](data, (message, options) => {
              definedError = true;
              return defineTypeError(message, options);
            });
            if (!definedError && (result === true || typeof result === "undefined")) {
              return;
            }
            if (definedError && result === true) {
              customError = true;
            } else if (result instanceof ValidationError) {
              customError = result;
            }
          }
          return customError || defineTypeError("Invalid type", { data });
        };
      }
      validators.push({
        name: typeMethodName,
        validate: getNamedFunction(typeMethodName, combinedTypeValidator)
      });
      activeNames.push(typeMethodName);
    }
    const {
      type,
      $id,
      $ref,
      $recursiveRef,
      $dynamicRef,
      $validate,
      required,
      ...otherKeys
    } = schema;
    const otherKeyNames = Object.keys(otherKeys);
    const unevaluatedKeys = otherKeyNames.filter(
      (key) => key === "unevaluatedItems" || key === "unevaluatedProperties"
    );
    const siblingKeys = otherKeyNames.filter(
      (key) => key !== "unevaluatedItems" && key !== "unevaluatedProperties"
    );
    const keyOrder = required ? ["required", ...siblingKeys, ...unevaluatedKeys] : [...siblingKeys, ...unevaluatedKeys];
    for (const key of keyOrder) {
      if (!this.isKeywordActive(key, environment)) {
        continue;
      }
      const keywordFn = this.getKeyword(key);
      if (!keywordFn) {
        continue;
      }
      if (this.shouldSkipKeyword(schema, key)) {
        continue;
      }
      const defineError = getDefinedErrorFunctionForKey(
        key,
        schema[key],
        this.failFast
      );
      const fnName = keywordFn.name || key;
      if ((key === "allOf" || key === "anyOf" || key === "oneOf") && keywordFn === keywords[key]) {
        const item = {
          name: fnName,
          validate: () => {
            throw new ValidationError("Combinator validator was not prepared");
          }
        };
        validators.push(item);
        pendingCombinators.push({ item, key, defineError });
        activeNames.push(fnName);
        continue;
      }
      const keywordValidate = validateSubschema ? (data) => keywordFn(
        compiledSchema,
        data,
        defineError,
        this,
        validateSubschema
      ) : (data) => keywordFn(
        compiledSchema,
        data,
        defineError,
        this
      );
      const isCustomKeyword = keywordFn !== keywords[key];
      validators.push({
        name: fnName,
        validate: getNamedFunction(
          fnName,
          isCustomKeyword ? (data) => {
            let definedError = false;
            const trackedDefineError = (message, options) => {
              definedError = true;
              return defineError(message, options);
            };
            const result = validateSubschema ? keywordFn(
              compiledSchema,
              data,
              trackedDefineError,
              this,
              validateSubschema
            ) : keywordFn(compiledSchema, data, trackedDefineError, this);
            if (definedError) {
              return result === false ? defineError("Value is not valid", { data }) : result;
            }
            if (result === false) {
              return defineError("Value is not valid", { data });
            }
            return result === true ? void 0 : result;
          } : keywordValidate
        )
      });
      activeNames.push(fnName);
    }
    const literalKeywords = ["enum", "const", "default", "examples"];
    for (const key of keyOrder) {
      if (!this.isKeywordActive(key, environment)) {
        continue;
      }
      if (literalKeywords.includes(key)) {
        continue;
      }
      if (schema[key] && typeof schema[key] === "object" && !Array.isArray(schema[key])) {
        if (key === "properties" || key === "patternProperties" || key === "definitions" || key === "$defs" || key === "dependentSchemas") {
          for (const subKey of Object.keys(schema[key])) {
            const compiledSubSchema2 = this.compileSchema(
              schema[key][subKey]
            );
            if (compiledSubSchema2._hasRef === true) {
              schemaHasRef = true;
            }
            compiledSchema[key][subKey] = compiledSubSchema2;
          }
          continue;
        }
        const compiledSubSchema = this.compileSchema(schema[key]);
        if (compiledSubSchema._hasRef === true) {
          schemaHasRef = true;
        }
        compiledSchema[key] = compiledSubSchema;
        continue;
      }
      if (Array.isArray(schema[key])) {
        for (let i = 0; i < schema[key].length; i++) {
          if (this.isSchemaLike(schema[key][i])) {
            const compiledSubSchema = this.compileSchema(schema[key][i]);
            if (compiledSubSchema._hasRef === true) {
              schemaHasRef = true;
            }
            compiledSchema[key][i] = compiledSubSchema;
          }
        }
        continue;
      }
    }
    if (this.isKeywordActive("properties", environment) && this.isPlainObject(schema.properties)) {
      definePropertyOrThrow(compiledSchema, "_propKeys", {
        value: Object.keys(schema.properties),
        enumerable: false,
        configurable: false,
        writable: false
      });
    }
    if (this.useDefaults !== false && this.isKeywordActive("properties", environment) && this.isPlainObject(schema.properties) && this.hasPropertyDefaults(schema)) {
      const defaultKeys = Object.keys(schema.properties).filter(
        (key) => {
          const property = schema.properties[key];
          return property && typeof property === "object" && !Array.isArray(property) && hasOwn(property, "default");
        }
      );
      if (defaultKeys.length > 0) {
        definePropertyOrThrow(compiledSchema, "_defaultKeys", {
          value: defaultKeys,
          enumerable: false,
          configurable: false,
          writable: false
        });
      }
    }
    prepareCombinatorEntries(compiledSchema);
    const transactions = compiledSchema._canApplyDefaults === true ? {
      savepoint: () => __privateMethod(this, _defaultSavepoint, defaultSavepoint_fn).call(this),
      rollback: (savepoint) => __privateMethod(this, _rollbackDefaultSavepoint, rollbackDefaultSavepoint_fn).call(this, savepoint),
      capture: (savepoint) => __privateMethod(this, _captureDefaultSavepoint, captureDefaultSavepoint_fn).call(this, savepoint),
      restore: (mutations) => __privateMethod(this, _restoreDefaults, restoreDefaults_fn).call(this, mutations)
    } : void 0;
    for (let index = 0; index < pendingCombinators.length; index++) {
      const pending = pendingCombinators[index];
      pending.item.validate = getNamedFunction(
        pending.item.name,
        createCombinatorValidator(
          pending.key,
          compiledSchema,
          pending.defineError,
          validateSubschema,
          transactions,
          this.compilingEvaluatedTracking
        )
      );
    }
    if (schemaHasRef) {
      this.markSchemaHasRef(compiledSchema);
    }
    if (validators.length === 0) {
      if (this.compilingEvaluatedTracking) {
        compiledSchema.$validate = getNamedFunction(
          "Validate_Any",
          () => {
          }
        );
      }
      return compiledSchema;
    }
    if (validators.length === 1) {
      const v = validators[0];
      compiledSchema.$validate = getNamedFunction(v.name, v.validate);
    } else {
      const compositeName = "Validate_" + activeNames.join("_AND_");
      const masterValidator = (data) => {
        for (let i = 0; i < validators.length; i++) {
          const v = validators[i];
          const error = v.validate(data);
          if (error) {
            return error;
          }
        }
        return;
      };
      compiledSchema.$validate = getNamedFunction(
        compositeName,
        masterValidator
      );
    }
    return compiledSchema;
  }
  isSchemaLike(subSchema) {
    if (subSchema && typeof subSchema === "object" && !Array.isArray(subSchema)) {
      if ("type" in subSchema) {
        return true;
      }
      for (let subKey in subSchema) {
        if (subKey in this.keywords) {
          return true;
        }
      }
    }
    return false;
  }
  getCompiledReferenceTarget(ref, position, registry) {
    const target = this.resolveReferenceSource(ref, position, registry);
    if (target === true || target === false) {
      return target;
    }
    if (target && typeof target === "object") {
      return this.compileCache.get(target);
    }
    return;
  }
  installEvaluationResourceScopes(registry) {
    const resources2 = /* @__PURE__ */ new Map();
    for (const position of registry.positions) {
      if (!this.compileCache.has(position.source)) {
        continue;
      }
      if (!resources2.has(position.resourceRoot)) {
        const rootPosition = registry.positionsByNode.get(position.resourceRoot);
        const compiledRoot = this.compileCache.get(position.resourceRoot);
        if (!compiledRoot) {
          continue;
        }
        resources2.set(position.resourceRoot, {
          compiledRoot,
          dynamicAnchors: /* @__PURE__ */ new Map(),
          recursiveAnchor: rootPosition?.dialect === "2019-09" && position.resourceRoot.$recursiveAnchor === true
        });
      }
    }
    for (const position of registry.positions) {
      const compiled = this.compileCache.get(position.source);
      const resource = resources2.get(position.resourceRoot);
      if (!compiled || !resource) {
        continue;
      }
      if (typeof compiled.$validate !== "function") {
        compiled.$validate = getNamedFunction(
          "Validate_Any",
          () => {
          }
        );
      }
      if (position.dialect === "2020-12" && typeof position.source.$dynamicAnchor === "string") {
        resource.dynamicAnchors.set(position.source.$dynamicAnchor, compiled);
      }
    }
    const resourcesByRoot = /* @__PURE__ */ new WeakMap();
    for (const [root, resource] of resources2) {
      resourcesByRoot.set(root, resource);
    }
    const wrapped = /* @__PURE__ */ new WeakSet();
    for (const position of registry.positions) {
      const compiled = this.compileCache.get(position.source);
      const resource = resources2.get(position.resourceRoot);
      if (!compiled || !resource || wrapped.has(compiled)) {
        continue;
      }
      wrapped.add(compiled);
      const directValidate = compiled.$validate;
      compiled.$validate = getNamedFunction(directValidate.name, (data) => {
        const context = this.validationContexts[this.validationContexts.length - 1];
        if (!context || context.resources[context.resources.length - 1] === resource) {
          return directValidate(data);
        }
        context.resources.push(resource);
        try {
          return directValidate(data);
        } finally {
          context.resources.pop();
        }
      });
    }
    return resourcesByRoot;
  }
  referenceValidator(target, node, keyword) {
    if (target === true) {
      return getNamedFunction("Validate_Ref_True", () => {
      });
    }
    if (target === false) {
      const defineError = getDefinedErrorFunctionForKey(
        keyword,
        node,
        this.failFast
      );
      return getNamedFunction(
        "Validate_Ref_False",
        (data) => defineError("Value is not valid", { data })
      );
    }
    if (typeof target.$validate !== "function") {
      target.$validate = getNamedFunction(
        "Validate_Ref_Any",
        () => {
        }
      );
    }
    return target.$validate;
  }
  linkReferences(registry, resources2) {
    for (let index = 0; index < registry.positions.length; index++) {
      const position = registry.positions[index];
      if (typeof position.source.$ref !== "string" || this.getKeyword("$ref") !== keywords.$ref) {
        continue;
      }
      const node = this.compileCache.get(position.source);
      if (!node) {
        continue;
      }
      const target = this.getCompiledReferenceTarget(
        position.source.$ref,
        position,
        registry
      );
      if (typeof target === "undefined") {
        const error = new ValidationError(
          `Reference not found: ${position.source.$ref}`
        );
        error.code = "REFERENCE_NOT_FOUND";
        error.keyword = "$ref";
        throw error;
      }
      definePropertyOrThrow(node, "_resolvedRef", {
        value: this.referenceValidator(target, node, "$ref"),
        enumerable: false,
        configurable: false,
        writable: false
      });
    }
    if (!resources2) {
      return;
    }
    for (let index = 0; index < registry.positions.length; index++) {
      const position = registry.positions[index];
      const references = this.builtinReferences(position.source, position);
      for (const reference of references) {
        if (reference.keyword === "$ref") {
          continue;
        }
        const node = this.compileCache.get(position.source);
        if (!node) {
          continue;
        }
        const targetSource = this.resolveReferenceSource(
          reference.ref,
          position,
          registry
        );
        if (typeof targetSource === "undefined") {
          const error = new ValidationError(
            `Reference not found: ${reference.ref}`
          );
          error.code = "REFERENCE_NOT_FOUND";
          error.keyword = reference.keyword;
          throw error;
        }
        const staticTarget = this.getCompiledReferenceTarget(
          reference.ref,
          position,
          registry
        );
        if (typeof staticTarget === "undefined") {
          const error = new ValidationError(
            `Reference not found: ${reference.ref}`
          );
          error.code = "REFERENCE_NOT_FOUND";
          error.keyword = reference.keyword;
          throw error;
        }
        const staticValidate = this.referenceValidator(
          staticTarget,
          node,
          reference.keyword
        );
        const targetPosition = targetSource && typeof targetSource === "object" ? registry.positionsByNode.get(targetSource) : void 0;
        let targetValidate = staticValidate;
        if (reference.keyword === "$recursiveRef") {
          const dynamicEligible = targetPosition?.resourceRoot === targetSource && targetPosition.resourceRoot.$recursiveAnchor === true;
          if (dynamicEligible) {
            targetValidate = (data) => {
              const context = this.validationContexts[this.validationContexts.length - 1];
              if (context) {
                for (let scopeIndex = 0; scopeIndex < context.resources.length; scopeIndex++) {
                  const resource = context.resources[scopeIndex];
                  if (!resource.recursiveAnchor) {
                    continue;
                  }
                  if (typeof resource.compiledRoot.$validate === "function") {
                    return resource.compiledRoot.$validate(data);
                  }
                }
              }
              return staticValidate(data);
            };
          }
        } else {
          const resolvedUri = this.resolveUri(
            reference.ref,
            position.baseUri,
            "$ref"
          );
          const hashIndex = resolvedUri.indexOf("#");
          const rawFragment = hashIndex === -1 ? "" : resolvedUri.slice(hashIndex + 1);
          let anchor = "";
          if (rawFragment.length > 0 && !rawFragment.startsWith("/")) {
            try {
              anchor = decodeURIComponent(rawFragment);
            } catch {
              anchor = "";
            }
          }
          const dynamicEligible = anchor.length > 0 && targetPosition?.dialect === "2020-12" && targetSource.$dynamicAnchor === anchor;
          if (dynamicEligible) {
            targetValidate = (data) => {
              const context = this.validationContexts[this.validationContexts.length - 1];
              if (context) {
                for (let scopeIndex = 0; scopeIndex < context.resources.length; scopeIndex++) {
                  const target = context.resources[scopeIndex].dynamicAnchors.get(
                    anchor
                  );
                  if (target && typeof target.$validate === "function") {
                    return target.$validate(data);
                  }
                }
              }
              return staticValidate(data);
            };
          }
        }
        definePropertyOrThrow(
          node,
          reference.keyword === "$recursiveRef" ? "_resolvedRecursiveRef" : "_resolvedDynamicRef",
          {
            value: targetValidate,
            enumerable: false,
            configurable: false,
            writable: false
          }
        );
      }
    }
  }
};
var SchemaShield = _SchemaShield;
_defaultSavepoint = /* @__PURE__ */ new WeakSet();
defaultSavepoint_fn = function() {
  const context = this.validationContexts[this.validationContexts.length - 1];
  return context ? context.defaults.length : 0;
};
_rollbackDefaultSavepoint = /* @__PURE__ */ new WeakSet();
rollbackDefaultSavepoint_fn = function(savepoint) {
  const context = this.validationContexts[this.validationContexts.length - 1];
  if (context) {
    this.rollbackDefaults(context, savepoint);
  }
};
_captureDefaultSavepoint = /* @__PURE__ */ new WeakSet();
captureDefaultSavepoint_fn = function(savepoint) {
  const context = this.validationContexts[this.validationContexts.length - 1];
  if (!context || context.defaults.length === savepoint) {
    return [];
  }
  const mutations = [];
  for (let index = savepoint; index < context.defaults.length; index++) {
    const entry = context.defaults[index];
    mutations.push({
      ...entry,
      value: entry.target[entry.key]
    });
  }
  this.rollbackDefaults(context, savepoint);
  return mutations;
};
_restoreDefaults = /* @__PURE__ */ new WeakSet();
restoreDefaults_fn = function(mutations) {
  for (let index = 0; index < mutations.length; index++) {
    const mutation = mutations[index];
    this.setDefault(mutation.target, mutation.key, mutation.value);
  }
};
__publicField(SchemaShield, "builtinMetaValidators", /* @__PURE__ */ new Map());

// lib/forms/index.ts
function getFieldNameFromError(error) {
  const path = String(error.getPath().instancePath || "");
  if (path.startsWith("#/")) {
    const token = path.slice(2).split("/")[0];
    if (token.length > 0) {
      return token.replace(/~1/g, "/").replace(/~0/g, "~");
    }
  }
  if (isString(error.item)) {
    return error.item;
  }
  return null;
}
function getFieldNameFromChain(error) {
  let current = error;
  while (current) {
    const fieldName = getFieldNameFromError(current);
    if (fieldName) {
      return fieldName;
    }
    current = current.cause;
  }
  return null;
}
function getRootError(error) {
  let current = error;
  while (current.cause) {
    current = current.cause;
  }
  return current;
}
var formSchemaShield = new SchemaShield({
  failFast: false,
  immutable: false,
  format: true
});
function mapValidationError(error) {
  if (!error) {
    return {};
  }
  if (error === true) {
    return { _form: "Invalid form data" };
  }
  const fieldName = getFieldNameFromChain(error);
  const rootError = getRootError(error);
  const message = rootError.message || "Invalid form data";
  if (!fieldName) {
    return { _form: message };
  }
  return { [fieldName]: message };
}
var FormStore = class {
  validator;
  onSubmit;
  clean;
  format;
  pulseStore;
  static get schemaShield() {
    return formSchemaShield;
  }
  constructor(options) {
    this.validator = formSchemaShield.compile(options.schema);
    this.onSubmit = options.onSubmit || null;
    this.clean = options.clean || {};
    this.format = options.format || {};
    const getValidationErrors = (values) => {
      const result = this.validator(values);
      return result.valid ? {} : mapValidationError(result.error);
    };
    const initialValues = options.state;
    this.pulseStore = createPulseStore(
      {
        values: initialValues,
        validationErrors: {},
        submitError: null,
        success: false,
        isInflight: false,
        isDirty: false
      },
      {
        setField(state, name, value) {
          state.values[name] = value;
          state.isDirty = true;
          state.success = false;
        },
        setSubmitError(state, error) {
          state.submitError = error;
        },
        setSuccess(state, success) {
          state.success = success;
        },
        validate(state) {
          state.validationErrors = getValidationErrors(state.values);
          return Object.keys(state.validationErrors).length === 0;
        },
        setInflight(state, inflight) {
          state.isInflight = inflight;
        },
        reset(state) {
          state.values = initialValues;
          state.validationErrors = {};
          state.submitError = null;
          state.success = false;
          state.isInflight = false;
          state.isDirty = false;
        }
      }
    );
  }
  get state() {
    return this.pulseStore.state.values;
  }
  get validationErrors() {
    return this.pulseStore.state.validationErrors;
  }
  get submitError() {
    return this.pulseStore.state.submitError;
  }
  get success() {
    return this.pulseStore.state.success;
  }
  get isInflight() {
    return this.pulseStore.state.isInflight;
  }
  get isDirty() {
    return this.pulseStore.state.isDirty;
  }
  get hasValidationErrors() {
    return Object.keys(this.pulseStore.state.validationErrors).length > 0;
  }
  get hasSubmitError() {
    return this.pulseStore.state.submitError !== null;
  }
  formatValue(name, value) {
    return name in this.format ? this.format[name](value, this.state) : value;
  }
  setField(name, rawValue) {
    const cleanedValue = name in this.clean ? this.clean[name](rawValue, this.state) : rawValue;
    this.pulseStore.setField(name, cleanedValue);
  }
  setSuccess(success) {
    this.pulseStore.setSuccess(success);
  }
  validate() {
    return this.pulseStore.validate();
  }
  async submit(event) {
    event?.preventDefault();
    if (!this.pulseStore.validate()) {
      return false;
    }
    if (this.isInflight) {
      return false;
    }
    this.pulseStore.setInflight(true);
    this.pulseStore.setSuccess(false);
    this.pulseStore.setSubmitError(null);
    try {
      if (this.onSubmit) {
        await this.onSubmit(this.state);
      }
      this.pulseStore.setSuccess(true);
      return true;
    } catch (error) {
      this.pulseStore.setSubmitError(error);
      return false;
    } finally {
      this.pulseStore.setInflight(false);
    }
  }
  reset() {
    this.pulseStore.reset();
  }
};
directive("form", (formStore, vnode) => {
  if (vnode.tag !== "form") {
    return;
  }
  const userOnSubmit = vnode.props.onsubmit;
  const onSubmitHandler = async (event) => {
    event.preventDefault();
    await formStore.submit();
    if (userOnSubmit) {
      userOnSubmit(event);
    }
  };
  setAttribute("onsubmit", onSubmitHandler, vnode);
});
directive("field", (formStore, vnode) => {
  const name = vnode.props.name;
  if (!isString(name) || hasLength(name, 0)) {
    return;
  }
  const type = vnode.props.type ? vnode.props.type : "text";
  const tagName = vnode.tag;
  const stateValue = formStore.state[name];
  const dom = vnode.dom;
  let method = "oninput";
  if (type === "checkbox") {
    const isChecked = Boolean(stateValue);
    if (dom.checked !== isChecked) {
      dom.checked = isChecked;
    }
    method = "onchange";
  } else if (type === "radio") {
    const radioValue = vnode.props.value ?? dom.value;
    const normalizedStateValue = String(stateValue == null ? "" : stateValue);
    const normalizedRadioValue = String(radioValue == null ? "" : radioValue);
    const isChecked = normalizedStateValue === normalizedRadioValue;
    if (dom.checked !== isChecked) {
      dom.checked = isChecked;
    }
    method = "onchange";
  } else if (tagName === "select" || tagName === "textarea" || tagName === "input") {
    const formattedValue = formStore.formatValue(name, stateValue);
    const domValue = formattedValue == null ? "" : String(formattedValue);
    if (dom.value !== domValue) {
      dom.value = domValue;
    }
  }
  if (method === "oninput") {
    const userOnInput = vnode.props.oninput;
    const onInputHandler = (event) => {
      const target = event.target;
      formStore.setField(name, target.value);
      if (userOnInput) {
        userOnInput(event);
      }
    };
    setAttribute("oninput", onInputHandler, vnode);
  }
  if (method === "onchange") {
    const userOnChange = vnode.props.onchange;
    const onChangeHandler = (event) => {
      if (formStore.success) {
        formStore.setSuccess(false);
      }
      const target = event.target;
      if (type === "checkbox") {
        formStore.setField(name, Boolean(target.checked));
      } else if (type === "radio") {
        formStore.setField(name, target.value);
      }
      if (userOnChange) {
        userOnChange(event);
      }
    };
    setAttribute("onchange", onChangeHandler, vnode);
  }
});
export {
  FormStore,
  formSchemaShield
};
