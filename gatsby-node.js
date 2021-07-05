"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

exports.__esModule = true;
exports.sourceNodes = sourceNodes;

var _axios = _interopRequireDefault(require("axios"));

async function sourceNodes(args, configOptions) {
  const {
    actions,
    reporter,
    createContentDigest,
    createNodeId
  } = args;
  const {
    createNode
  } = actions;
  const API_KEY = configOptions.apiKey;

  if (!API_KEY) {
    reporter.panic("No Hubspot API key provided");
  }

  const fetchAllPages = await _axios.default.get(`https://api.hubapi.com/content/api/v2/pages?hapikey=${API_KEY}`);
  const response = await fetchAllPages.data;
  const objects = response.objects;
  objects.forEach((page, index) => {
    const pageNode = {
      id: createNodeId(`hubspot-page-${page.id}`),
      parent: null,
      children: [],
      internal: {
        type: "HubspotPage",
        contentDigest: "",
        owner: ""
      },
      title: page.title,
      modules: page.widgets
    };
    reporter.info(`Creating Hubspot page ${page.title} (${index})`);
    pageNode.internal.contentDigest = createContentDigest(pageNode);
    createNode(pageNode);
  });
}