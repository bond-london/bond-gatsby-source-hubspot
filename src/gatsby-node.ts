import axios from "axios";
import {
  Node,
  PluginOptions,
  PluginOptionsSchemaArgs,
  SourceNodesArgs,
} from "gatsby";

interface Options extends PluginOptions {
  apiKey: string;
  draft: boolean;
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
  });
}

async function sourcePages(args: SourceNodesArgs, configOptions: Options) {
  const { actions, reporter, createContentDigest, createNodeId } = args;
  const { createNode } = actions;
  const { apiKey } = configOptions;

  const fetchAllPages = await axios.get(
    `https://api.hubapi.com/content/api/v2/pages?hapikey=${apiKey}`
  );
  const response = await fetchAllPages.data;
  const objects = response.objects as any[];
  objects.forEach((page, index) => {
    const pageNode: Node = {
      id: createNodeId(`hubspot-page-${page.id}`),
      parent: null,
      children: [],
      internal: {
        type: "HubspotPage",
        contentDigest: "",
        owner: "",
      },
      title: page.title,
      modules: page.widgets,
    };
    reporter.info(`Creating Hubspot page ${page.title} (${index})`);

    pageNode.internal.contentDigest = createContentDigest(pageNode);
    createNode(pageNode);
  });
}

interface HubspotColumn {
  name: string;
  label: string;
  id: string;
  type: string;
}

interface HubspotTable {
  id: string;
  name: string;
  label: string;
  columns: HubspotColumn[];
}

interface HubspotForeignInformation {
  id: string;
  type: string;
}

interface HubspotImage {
  url: string;
}

type HubspotValue = string | HubspotForeignInformation | HubspotImage;

interface HubspotRow {
  id: string;
  path: string;
  name: string;
  values: { [key: string]: HubspotValue };
}

interface HubspotResponse<T> {
  total: number;
  results: T[];
}

async function sourceTables(args: SourceNodesArgs, configOptions: Options) {
  const { actions, reporter, createContentDigest, createNodeId } = args;
  const { createNode } = actions;
  const { apiKey, draft } = configOptions;
  const tableType = draft ? "/draft" : "";

  const fetchAllTables = await axios.get<HubspotResponse<HubspotTable>>(
    `https://api.hubapi.com/cms/v3/hubdb/tables${tableType}?hapikey=${apiKey}`
  );
  const response = await fetchAllTables.data;
  const tables = response.results;

  for (const table of tables) {
    const fetchTableRows = await axios.get<HubspotResponse<HubspotRow>>(
      `https://api.hubapi.com/cms/v3/hubdb/tables/${table.id}/rows${tableType}?hapikey=${apiKey}`
    );
    const tableRows = await fetchTableRows.data;
    const rows = tableRows.results;
    const internalType = `HubspotTableRow${table.name}`;
    rows.forEach((row) => {
      const rowNode: Node = {
        ...row.values,
        id: createNodeId(`hubspot-table-row-${row.id}`),
        parent: null,
        children: [],
        internal: {
          type: internalType,
          content: JSON.stringify(row.values),
          contentDigest: createContentDigest(row.values),
          owner: "",
        },
      };
      reporter.info(`Creating Hubspot table row ${table.name} (${row.id})`);
      createNode(rowNode);
    });
  }
}

export async function sourceNodes(
  args: SourceNodesArgs,
  configOptions: Options
) {
  const { fetchPages, fetchTables } = configOptions;

  const tasks: Promise<void>[] = [];
  if (fetchPages) {
    tasks.push(sourcePages(args, configOptions));
  }

  if (fetchTables) {
    tasks.push(sourceTables(args, configOptions));
  }

  await Promise.all(tasks);
}
