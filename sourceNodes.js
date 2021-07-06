"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

exports.__esModule = true;
exports.sourceNodes = sourceNodes;

var _axios = _interopRequireDefault(require("axios"));

var _lodash = require("lodash");

var _ = require(".");

async function sourcePages(args, configOptions) {
  const {
    actions,
    reporter,
    createContentDigest,
    createNodeId
  } = args;
  const {
    createNode
  } = actions;
  const {
    apiKey,
    pagePrefix
  } = configOptions;
  const fetchAllPages = await _axios.default.get(`https://api.hubapi.com/content/api/v2/pages?hapikey=${apiKey}`);
  const response = await fetchAllPages.data;
  const objects = response.objects;
  objects.forEach((page, index) => {
    const pageNode = {
      id: createNodeId(`hubspot-page-${page.id}`),
      parent: null,
      children: [],
      internal: {
        type: pagePrefix,
        contentDigest: "",
        owner: ""
      },
      title: page.title,
      modules: page.widgets
    };
    reporter.verbose(`Creating Hubspot page ${page.title} (${index})`);
    pageNode.internal.contentDigest = createContentDigest(pageNode);
    createNode(pageNode);
  });
}

async function sourceTables(args, configOptions) {
  const {
    actions,
    reporter,
    createContentDigest,
    createNodeId,
    cache
  } = args;
  const {
    createNode
  } = actions;
  const {
    apiKey,
    draft,
    tablePrefix
  } = configOptions;
  const tableType = draft ? "/draft" : ""; // reporter.verbose(`Fetching tables for "${tableType}" with key "${apiKey}"`);
  // const fetchAllTables = await axios.get<HubspotResponse<HubspotTable>>(
  //   `https://api.hubapi.com/cms/v3/hubdb/tables${tableType}?hapikey=${apiKey}`
  // );
  // const response = await fetchAllTables.data;
  // const tables = response.results;
  // reporter.verbose(`Got ${tables.length} tables`);

  const tables = await cache.get(_.TableCacheKey);

  for (const table of tables) {
    reporter.verbose(`Looking at table ${table.name}`);
    const id = createNodeId(`hubspot-table-${table.id}`);
    const tableNode = {
      table,
      id,
      parent: null,
      children: [],
      internal: {
        type: tablePrefix,
        content: JSON.stringify(table),
        contentDigest: createContentDigest(table),
        owner: ""
      }
    };
    createNode(tableNode);
    const internalType = `${tablePrefix}${(0, _lodash.upperFirst)(table.name)}`;
    const fetchTableRows = await _axios.default.get(`https://api.hubapi.com/cms/v3/hubdb/tables/${table.id}/rows${tableType}?hapikey=${apiKey}`);
    const tableRows = await fetchTableRows.data;
    const rows = tableRows.results;
    reporter.verbose(`Got ${rows.length} rows`);

    for (const row of rows) {
      const values = { ...row.values
      };
      const id = createNodeId(`hubspot-table-${table.id}-${row.id}`);

      for (const column of table.columns) {
        switch (column.type) {
          case "IMAGE":
            const image = values[column.name];
            const imageId = createNodeId(`hubspot-image-${table.id}-${row.id}-${column.name}`);
            const imageNode = { ...image,
              id: imageId,
              parent: id,
              children: [],
              internal: {
                type: `${tablePrefix}Image`,
                contentDigest: createContentDigest(image),
                owner: ""
              }
            };
            createNode(imageNode);
            values[column.name] = imageId;
            break;
        }
      }

      const rowNode = { ...values,
        id,
        parent: tableNode.id,
        children: [],
        internal: {
          type: internalType,
          contentDigest: createContentDigest(values),
          owner: ""
        }
      };
      reporter.verbose(`Creating Hubspot table row ${table.name} (${row.id})`);
      createNode(rowNode);
    }
  }
}

async function sourceNodes(args, configOptions) {
  const {
    fetchPages,
    fetchTables
  } = configOptions;
  const tasks = [];

  if (fetchPages) {
    tasks.push(sourcePages(args, configOptions));
  }

  if (fetchTables) {
    tasks.push(sourceTables(args, configOptions));
  }

  await Promise.all(tasks);
}