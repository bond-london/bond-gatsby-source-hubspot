"use strict";

exports.__esModule = true;
exports.pluginOptionsSchema = pluginOptionsSchema;
exports.TableCacheKey = void 0;

function pluginOptionsSchema({
  Joi
}) {
  return Joi.object({
    apiKey: Joi.string().required().description("Hubspot API key"),
    fetchPages: Joi.boolean().default(false).description("Retrieve pages"),
    fetchTables: Joi.boolean().default(false).description("Retrieve tables from Hubdb"),
    draft: Joi.boolean().default(false).description("Use draft tables"),
    pagePrefix: Joi.string().default("HubspotPage").description("Prefix for pages"),
    tablePrefix: Joi.string().default("HubspotTable").description("Prefix for tables")
  });
}

const TableCacheKey = "tables";
exports.TableCacheKey = TableCacheKey;