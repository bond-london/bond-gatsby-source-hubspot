"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

exports.__esModule = true;
exports.createSchemaCustomization = createSchemaCustomization;

var _axios = _interopRequireDefault(require("axios"));

var _lodash = require("lodash");

var _ = require(".");

async function createSchemaCustomization(args, options) {
  const {
    cache,
    reporter,
    actions: {
      createTypes
    }
  } = args;
  const {
    tablePrefix,
    draft,
    fetchTables,
    apiKey
  } = options;
  const tableType = draft ? "/draft" : "";
  reporter.info(`Fetching tables for "${tableType}" with key "${apiKey}"`);
  const fetchAllTables = await _axios.default.get(`https://api.hubapi.com/cms/v3/hubdb/tables${tableType}?hapikey=${apiKey}`);
  const response = await fetchAllTables.data;
  const tables = response.results;
  reporter.info(`Got ${tables.length} tables`);
  await cache.set(_.TableCacheKey, tables);
  createTypes(`
    type ${tablePrefix}MarkdownNode implements Node {
      id: ID!
    }
    type ${tablePrefix}Image implements Node {
        localFile: File @link
    }
    `);

  for (const table of tables) {
    const internalType = `${tablePrefix}${(0, _lodash.upperFirst)(table.name)}`;

    for (const column of table.columns) {
      switch (column.type) {
        case "RICHTEXT":
          createTypes(`type ${internalType} implements Node {
                    ${column.name}MarkdownBody: ${tablePrefix}MarkdownNode @link
                }`);
          break;

        case "IMAGE":
          createTypes(`type ${internalType} implements Node {
                ${column.name}: ${tablePrefix}Image @link
            }`);
          break;
      }
    }
  }
}