import { CreateNodeArgs } from "gatsby";
import { createRemoteFileNode } from "gatsby-source-filesystem";
import { decode } from "he";
import { basename, extname } from "path";
import unified from "unified";
import parse from "rehype-parse";
import rehype2remark from "rehype-remark";
import stringify from "remark-stringify";
import { Options } from ".";
import { HubspotImage, HubspotTable } from "./sourceNodes";
import sanitize from "sanitize-filename";

async function htmlToMarkdown(html: string) {
  const markdown = await unified()
    .use(parse, { emitParseErrors: true })
    .use(rehype2remark)
    .use(stringify)
    .process(html);

  return markdown.toString();
}

async function buildImage(image: HubspotImage, args: CreateNodeArgs) {
  const {
    node,
    actions,
    createNodeId,
    getCache,
    store,
    reporter,
    cache,
    createContentDigest,
  } = args;
  const { createNode } = actions;
  const { url, type } = image;

  const ext = extname(url);
  const name = createContentDigest(basename(url, ext));
  reporter.info(`Downloading remote file ${name} ${ext} of type ${type}`);
  const fileNode = await createRemoteFileNode({
    url,
    parentNodeId: node.id,
    createNode,
    createNodeId,
    getCache,
    cache: undefined,
    store,
    reporter,
    ext,
    name,
  } as any);
  if (fileNode) {
    (image as any).localFile = fileNode.id;
  }
}

async function buildMarkdown(
  columnName: string,
  args: CreateNodeArgs,
  options: Options
) {
  const {
    node,
    actions,
    createNodeId,
    getCache,
    store,
    reporter,
    cache,
    createContentDigest,
  } = args;
  const { createNode } = actions;
  const { tablePrefix } = options;
  reporter.info(`build markdown for ${columnName}`);
  const html = node[columnName] as string;
  const decoded = await htmlToMarkdown(html); // decode(html);
  const markdownBody = {
    id: `MarkdownBody:${createNodeId(`${node.id}-${columnName}MarkdownBody`)}`,
    parent: node.id,
    internal: {
      type: `${tablePrefix}MarkdownNode`,
      mediaType: "text/markdown",
      content: decoded,
      contentDigest: createContentDigest(decoded),
    },
  };

  createNode(markdownBody);
  node[`${columnName}MarkdownBody`] = markdownBody.id;
}

export async function onCreateNode(args: CreateNodeArgs, options: Options) {
  const {
    node,
    getNode,
    actions: { createNode },
    createNodeId,
    getCache,
    store,
    reporter,
  } = args;
  const { tablePrefix } = options;

  const type = node.internal.type;
  if (type === `${tablePrefix}Image`) {
    await buildImage(node as any as HubspotImage, args);
    return;
  }
  if (type.startsWith(tablePrefix) && node.parent) {
    const tableNode = getNode(node.parent);
    if (tableNode && tableNode.table) {
      const table = tableNode.table as HubspotTable;
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
