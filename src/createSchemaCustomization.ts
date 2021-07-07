import axios from "axios";
import { CreateSchemaCustomizationArgs } from "gatsby";
import { upperFirst } from "lodash";
import { Options, TableCacheKey } from ".";
import { HubspotResponse, HubspotTable } from "./sourceNodes";

export async function createSchemaCustomization(
  args: CreateSchemaCustomizationArgs,
  options: Options
) {
  const {
    cache,
    reporter,
    actions: { createTypes },
  } = args;
  const { tablePrefix, draft, fetchTables, apiKey } = options;
  const tableType = draft ? "/draft" : "";

  reporter.verbose(`Fetching tables for "${tableType}" with key "${apiKey}"`);
  const fetchAllTables = await axios.get<HubspotResponse<HubspotTable>>(
    `https://api.hubapi.com/cms/v3/hubdb/tables${tableType}?hapikey=${apiKey}`
  );
  const response = await fetchAllTables.data;
  const tables = response.results;
  reporter.verbose(`Got ${tables.length} tables`);

  await cache.set(TableCacheKey, tables);

  createTypes(`
    type ${tablePrefix}MarkdownNode implements Node {
      id: ID!
    }
    type ${tablePrefix}Image implements Node {
        localFile: File @link
    }
    `);

  for (const table of tables) {
    const internalType = `${tablePrefix}${upperFirst(table.name)}`;
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
