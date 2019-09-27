'use strict';

const { DOCUMENT_MODE } = require('parse5/lib/common/html');

const {Element, Text, Document} = require('./dom');

exports.createDocumentFragment = function () {
  return {
    nodeName: '#document-fragment',
    childNodes: []
  };
};

function parseAttributes(attributes) {
  let attrs = [];
  for (let i = 0, l = attributes.length; i < l; i++) {
    attrs.push({
      nodeName: (attributes[i].prefix ? attributes[i].prefix + ':' : '') + attributes[i].name,
      nodeValue: attributes[i].value
    });
  }
  return attrs;
}

exports.createElement = function (tagName, namespaceURI, attributes) {
  let element = new Element(1, tagName);
  element.tagName = tagName;
  element.attributes = parseAttributes(attributes);
  element.namespaceURI = namespaceURI;

  return element;
};

exports.createCommentNode = function (data) {
  return {
    nodeName: '#comment',
    data: data,
    parentNode: null
  };
};

const createTextNode = function (value) {
  let element = new Text(value);
  element.value = value;
  return element;
};

//Tree mutation
const appendChild = (exports.appendChild = function (parentNode, newNode) {
  parentNode.childNodes.push(newNode);
  newNode.parentNode = parentNode;
});

const insertBefore = (exports.insertBefore = function (parentNode, newNode, referenceNode) {
  const insertionIdx = parentNode.childNodes.indexOf(referenceNode);

  parentNode.childNodes.splice(insertionIdx, 0, newNode);
  newNode.parentNode = parentNode;
});

//Node construction
exports.createDocument = function () {
  let document = new Document();
  document.mode = DOCUMENT_MODE.NO_QUIRKS;
  return document;
};

exports.setTemplateContent = function (templateElement, contentElement) {
  templateElement.content = contentElement;
};

exports.getTemplateContent = function (templateElement) {
  return templateElement.content;
};

exports.setDocumentType = function (document, name, publicId, systemId) {
  let doctypeNode = null;

  for (let i = 0; i < document.childNodes.length; i++) {
    if (document.childNodes[i].nodeName === '#documentType') {
      doctypeNode = document.childNodes[i];
      break;
    }
  }

  if (doctypeNode) {
    doctypeNode.name = name;
    doctypeNode.publicId = publicId;
    doctypeNode.systemId = systemId;
  } else {
    let element = new Element(10, '!DOCTYPE');
    element.nodeName = '!DOCTYPE';
    element.publicId = publicId;
    element.systemId = systemId;
    element.name = name;
    element.attributes = [{nodeName: 'html', nodeValue: true}];

    appendChild(document, element);
  }
};

exports.setDocumentMode = function (document, mode) {
  document.mode = mode;
};

exports.getDocumentMode = function (document) {
  return document.mode;
};

exports.detachNode = function (node) {
  if (node.parentNode) {
    const idx = node.parentNode.childNodes.indexOf(node);

    node.parentNode.childNodes.splice(idx, 1);
    node.parentNode = null;
  }
};

exports.insertText = function (parentNode, text) {
  if (parentNode.childNodes.length) {
    const prevNode = parentNode.childNodes[parentNode.childNodes.length - 1];

    if (prevNode.nodeName === '#text') {
      prevNode.value += text;
      prevNode.nodeValue += text;
      return;
    }
  }

  appendChild(parentNode, createTextNode(text));
};

exports.insertTextBefore = function (parentNode, text, referenceNode) {
  const prevNode = parentNode.childNodes[parentNode.childNodes.indexOf(referenceNode) - 1];

  if (prevNode && prevNode.nodeName === '#text') {
    prevNode.value += text;
    prevNode.nodeValue += text;
  } else {
    insertBefore(parentNode, createTextNode(text), referenceNode);
  }
};

exports.adoptAttributes = function (recipient, attributes) {
  const recipientAttrsMap = [];

  for (let i = 0; i < recipient.attributes.length; i++) {
    recipientAttrsMap.push(recipient.attributes[i].name);
  }

  for (let j = 0; j < attributes.length; j++) {
    if (recipientAttrsMap.indexOf(attributes[j].name) === -1) {
      recipient.attributes.push(attributes[j]);
    }
  }
};

//Tree traversing
exports.getFirstChild = function (node) {
  return node.childNodes[0];
};

exports.getChildNodes = function (node) {
  return node.childNodes;
};

exports.getParentNode = function (node) {
  return node.parentNode;
};

exports.getAttrList = function (element) {
  return element.attributes;
};

//Node data
exports.getTagName = function (element) {
  return element.tagName;
};

exports.getNamespaceURI = function (element) {
  return element.namespaceURI;
};

exports.getTextNodeContent = function (textNode) {
  return textNode.value;
};

exports.getCommentNodeContent = function (commentNode) {
  return commentNode.data;
};

exports.getDocumentTypeNodeName = function (doctypeNode) {
  return doctypeNode.name;
};

exports.getDocumentTypeNodePublicId = function (doctypeNode) {
  return doctypeNode.publicId;
};

exports.getDocumentTypeNodeSystemId = function (doctypeNode) {
  return doctypeNode.systemId;
};

//Node types
exports.isTextNode = function (node) {
  return node.nodeName === '#text';
};

exports.isCommentNode = function (node) {
  return node.nodeName === '#comment';
};

exports.isDocumentTypeNode = function (node) {
  return node.nodeName === '#documentType';
};

exports.isElementNode = function (node) {
  return !!node.tagName;
};

// Source code location
exports.setNodeSourceCodeLocation = function (node, location) {
  node.sourceCodeLocation = location;
};

exports.getNodeSourceCodeLocation = function (node) {
  return node.sourceCodeLocation;
};
