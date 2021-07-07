"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

exports.__esModule = true;
exports.onCreateNode = onCreateNode;

var _gatsbySourceFilesystem = require("gatsby-source-filesystem");

var _path = require("path");

var _unified = _interopRequireDefault(require("unified"));

var _rehypeParse = _interopRequireDefault(require("rehype-parse"));

var _rehypeRemark = _interopRequireDefault(require("rehype-remark"));

var _remarkStringify = _interopRequireDefault(require("remark-stringify"));

async function htmlToMarkdown(html) {
  const markdown = await (0, _unified.default)().use(_rehypeParse.default, {
    emitParseErrors: true
  }).use(_rehypeRemark.default).use(_remarkStringify.default).process(html);
  return markdown.toString();
}

async function buildImage(image, args) {
  const {
    node,
    actions,
    createNodeId,
    getCache,
    store,
    reporter,
    cache,
    createContentDigest
  } = args;
  const {
    createNode
  } = actions;
  const {
    url,
    type
  } = image;
  const ext = (0, _path.extname)(url);
  const name = createContentDigest((0, _path.basename)(url, ext));
  reporter.verbose(`Downloading remote file ${name} ${ext} of type ${type}`);
  const fileNode = await (0, _gatsbySourceFilesystem.createRemoteFileNode)({
    url,
    parentNodeId: node.id,
    createNode,
    createNodeId,
    getCache,
    cache: undefined,
    store,
    reporter,
    ext,
    name
  });

  if (fileNode) {
    image.localFile = fileNode.id;
  }
}

async function buildMarkdown(columnName, args, options) {
  const {
    node,
    actions,
    createNodeId,
    getCache,
    store,
    reporter,
    cache,
    createContentDigest
  } = args;
  const {
    createNode
  } = actions;
  const {
    tablePrefix
  } = options;
  reporter.verbose(`build markdown for ${columnName}`);
  const html = node[columnName];
  const decoded = await htmlToMarkdown(html); // decode(html);

  const markdownBody = {
    id: `MarkdownBody:${createNodeId(`${node.id}-${columnName}MarkdownBody`)}`,
    parent: node.id,
    internal: {
      type: `${tablePrefix}MarkdownNode`,
      mediaType: "text/markdown",
      content: decoded,
      contentDigest: createContentDigest(decoded)
    }
  };
  createNode(markdownBody);
  node[`${columnName}MarkdownBody`] = markdownBody.id;
}

async function onCreateNode(args, options) {
  const {
    node,
    getNode,
    actions: {
      createNode
    },
    createNodeId,
    getCache,
    store,
    reporter
  } = args;
  const {
    tablePrefix
  } = options;
  const type = node.internal.type;

  if (type === `${tablePrefix}Image`) {
    await buildImage(node, args);
    return;
  }

  if (type.startsWith(tablePrefix) && node.parent) {
    const tableNode = getNode(node.parent);

    if (tableNode && tableNode.table) {
      const table = tableNode.table;

      for (const column of table.columns) {
        switch (column.type) {
          case "RICHTEXT":
            buildMarkdown(column.name, args, options);
            break;
        }
      }
    }
  }
}