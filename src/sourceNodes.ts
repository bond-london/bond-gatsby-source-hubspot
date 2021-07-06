import axios from "axios";
import { add, upperFirst } from "lodash";
import { Node, SourceNodesArgs } from "gatsby";
import { Options, TableCacheKey } from ".";
import { basename, extname } from "path";
import { createRemoteFileNode } from "gatsby-source-filesystem";
import { decode } from "he";

async function sourcePages(args: SourceNodesArgs, configOptions: Options) {
  const { actions, reporter, createContentDigest, createNodeId } = args;
  const { createNode } = actions;
  const { apiKey, pagePrefix } = configOptions;

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
        type: pagePrefix,
        contentDigest: "",
        owner: "",
      },
      title: page.title,
      modules: page.widgets,
    };
    reporter.verbose(`Creating Hubspot page ${page.title} (${index})`);

    pageNode.internal.contentDigest = createContentDigest(pageNode);
    createNode(pageNode);
  });
}

export interface HubspotColumn {
  name: string;
  label: string;
  id: string;
  type: string;
}

export interface HubspotTable {
  id: string;
  name: string;
  label: string;
  columns: HubspotColumn[];
}

export interface HubspotForeignInformation {
  id: string;
  type: string;
}

export interface HubspotImage {
  url: string;
  type: string;
  width: number;
  height: number;
}

export type HubspotValue = string | HubspotForeignInformation | HubspotImage;

interface HubspotRow {
  id: string;
  path: string;
  name: string;
  values: { [key: string]: HubspotValue };
}

export interface HubspotResponse<T> {
  total: number;
  results: T[];
}

async function sourceTables(args: SourceNodesArgs, configOptions: Options) {
  const { actions, reporter, createContentDigest, createNodeId, cache } = args;
  const { createNode } = actions;
  const { apiKey, draft, tablePrefix } = configOptions;
  const tableType = draft ? "/draft" : "";

  // reporter.verbose(`Fetching tables for "${tableType}" with key "${apiKey}"`);
  // const fetchAllTables = await axios.get<HubspotResponse<HubspotTable>>(
  //   `https://api.hubapi.com/cms/v3/hubdb/tables${tableType}?hapikey=${apiKey}`
  // );
  // const response = await fetchAllTables.data;
  // const tables = response.results;
  // reporter.verbose(`Got ${tables.length} tables`);

  const tables: HubspotTable[] = await cache.get(TableCacheKey);

  for (const table of tables) {
    reporter.verbose(`Looking at table ${table.name}`);
    const id = createNodeId(`hubspot-table-${table.id}`);

    const tableNode: Node = {
      table,
      id,
      parent: null,
      children: [],
      internal: {
        type: tablePrefix,
        content: JSON.stringify(table),
        contentDigest: createContentDigest(table),
        owner: "",
      },
    };
    createNode(tableNode);

    const internalType = `${tablePrefix}${upperFirst(table.name)}`;

    const fetchTableRows = await axios.get<HubspotResponse<HubspotRow>>(
      `https://api.hubapi.com/cms/v3/hubdb/tables/${table.id}/rows${tableType}?hapikey=${apiKey}`
    );
    const tableRows = await fetchTableRows.data;
    const rows = tableRows.results;
    reporter.verbose(`Got ${rows.length} rows`);
    for (const row of rows) {
      const values = { ...row.values };
      const id = createNodeId(`hubspot-table-${table.id}-${row.id}`);

      for (const column of table.columns) {
        switch (column.type) {
          case "IMAGE":
            const image = values[column.name] as HubspotImage;
            const imageId = createNodeId(
              `hubspot-image-${table.id}-${row.id}-${column.name}`
            );
            const imageNode: Node = {
              ...image,
              id: imageId,
              parent: id,
              children: [],
              internal: {
                type: `${tablePrefix}Image`,
                contentDigest: createContentDigest(image),
                owner: "",
              },
            };
            createNode(imageNode);
            values[column.name] = imageId;
            break;
        }
      }

      const rowNode: Node = {
        ...values,
        id,
        parent: tableNode.id,
        children: [],
        internal: {
          type: internalType,
          contentDigest: createContentDigest(values),
          owner: "",
        },
      };
      reporter.verbose(`Creating Hubspot table row ${table.name} (${row.id})`);
      createNode(rowNode);
    }
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
