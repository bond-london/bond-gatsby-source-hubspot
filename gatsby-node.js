"use strict";

exports.__esModule = true;
var _exportNames = {
  pluginOptionsSchema: true
};
exports.pluginOptionsSchema = void 0;

var _sourceNodes = require("./sourceNodes");

Object.keys(_sourceNodes).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  if (Object.prototype.hasOwnProperty.call(_exportNames, key)) return;
  if (key in exports && exports[key] === _sourceNodes[key]) return;
  exports[key] = _sourceNodes[key];
});

var _index = require("./index");

exports.pluginOptionsSchema = _index.pluginOptionsSchema;

var _createSchemaCustomization = require("./createSchemaCustomization");

Object.keys(_createSchemaCustomization).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  if (Object.prototype.hasOwnProperty.call(_exportNames, key)) return;
  if (key in exports && exports[key] === _createSchemaCustomization[key]) return;
  exports[key] = _createSchemaCustomization[key];
});

var _onCreateNode = require("./onCreateNode");

Object.keys(_onCreateNode).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  if (Object.prototype.hasOwnProperty.call(_exportNames, key)) return;
  if (key in exports && exports[key] === _onCreateNode[key]) return;
  exports[key] = _onCreateNode[key];
});