import { PluginOptions, PluginOptionsSchemaArgs } from "gatsby";

export interface Options extends PluginOptions {
  apiKey: string;
  draft: boolean;
  pagePrefix: string;
  tablePrefix: string;
  fetchPages: boolean;
  fetchTables: boolean;
}

export function pluginOptionsSchema({ Joi }: PluginOptionsSchemaArgs) {
  return Joi.object({
    apiKey: Joi.string().required().description("Hubspot API key"),
    fetchPages: Joi.boolean().default(false).description("Retrieve pages"),
    fetchTables: Joi.boolean()
      .default(false)
      .description("Retrieve tables from Hubdb"),
    draft: Joi.boolean().default(false).description("Use draft tables"),
    pagePrefix: Joi.string()
      .default("HubspotPage")
      .description("Prefix for pages"),
    tablePrefix: Joi.string()
      .default("HubspotTable")
      .description("Prefix for tables"),
  });
}

export const TableCacheKey = "tables";
