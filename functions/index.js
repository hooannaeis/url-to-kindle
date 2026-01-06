/**
 * Import function triggers from their respective submodules:
 *
 * const {onCall} = require("firebase-functions/v2/https");
 * const {onDocumentWritten} = require("firebase-functions/v2/firestore");
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

const { setGlobalOptions } = require("firebase-functions");
const { onRequest } = require("firebase-functions/https");
const logger = require("firebase-functions/logger");
const axios = require("axios");
const { marked } = require("marked");

// For cost control, you can set the maximum number of containers that can be
// running at the same time. This helps mitigate the impact of unexpected
// traffic spikes by instead downgrading performance. This limit is a
// per-function limit. You can override the limit for each function using the
// `maxInstances` option in the function's options, e.g.
// `onRequest({ maxInstances: 5 }, (req, res) => { ... })`.
// NOTE: setGlobalOptions does not apply to functions using the v1 API. V1
// functions should each use functions.runWith({ maxInstances: 10 }) instead.
// In the v1 API, each function can only serve one request per container, so
// this will be the maximum concurrent request count.
setGlobalOptions({ maxInstances: 10 });

// Create and deploy your first functions
// https://firebase.google.com/docs/functions/get-started

exports.convert = onRequest(
  {
    region: "europe-west3", // Region moved inside options object
    cors: ['https://url-to-kindle.web.app'],
    maxInstances: 2, // Optional: limits scaling to control costs
    memory: "256MiB",
    timeoutSeconds: 20,
  },
  async (request, response) => {

    // Handle preflight requests
    if (request.method === "OPTIONS") {
      response.status(204).send("");
      return;
    }

    try {
      // Get and decode the URL parameter
      const url = decodeURIComponent(request.query.url);

      if (!url) {
        response.status(400).send("URL parameter is required");
        return;
      }

      logger.info(`Processing URL: ${url}`);

      // Get markdown from Jina.ai
      const jinaResponse = await axios.get(`https://r.jina.ai/${url}`);
      const markdown = jinaResponse.data;

      logger.info("Successfully retrieved markdown from Jina.ai");

      // Extract title from markdown content
      const title = extractTitleFromMarkdown(markdown);
      const author = getHostFromUrl(url);

      // Make title filename-safe for the download
      const safeTitle = makeFilenameSafe(title);
      
      // Add frontmatter to the markdown
      const frontmatter = `---\ntitle: ${title}\nauthor: ${author}\n---\n\n`;
      const markdownWithFrontmatter = frontmatter + markdown;
      
      logger.info(frontmatter)
      // Convert markdown to HTML
      const html = marked(markdownWithFrontmatter);

      // Set response headers for HTML file
      response.set("Content-Type", "application/force-download");
      response.set(
        "Content-Disposition",
        `attachment; filename=${safeTitle}.html`
      );
      response.send(html);
    } catch (error) {
      logger.error("Error in convert function:", error);
      response.status(500).send("Error processing URL: " + error.message);
    }
  }
);

/**
 *
 * @param {string} url
 * @return {string}
 */
function getHostFromUrl(url) {
  const formattedUrl = new URL(url);
  if (formattedUrl.host) return formattedUrl.host;
  return "invalid URL";
}

/**
 * Helper function to make a string filename-safe
 * @param {string} str
 * @return {string} filename-safe string
 */
function makeFilenameSafe(str) {
  // Remove or replace characters that are not allowed in filenames
  // Replace common problematic characters with underscores or remove them
  return str
    .replace(/['’\(\)<>:"/\\|?*\x00-\x1F]/g, "") // Remove illegal characters
    .replace(/\s+/g, "_") // Replace whitespace with underscores
    .replace(/_+/g, "_") // Replace multiple underscores with single
    .replace(/^_+|_+$/g, "") // Trim underscores from start/end
    .substring(0, 100) // Limit length to prevent overly long filenames
    .toLocaleLowerCase()
}

/**
 * Helper function to extract title from markdown content
 * @param {string} markdown
 * @return {string} title
 */
function extractTitleFromMarkdown(markdown) {
  // Look for a line starting with "Title: "
  const lines = markdown.split("\n");

  for (const line of lines) {
    if (line.startsWith("Title: ")) {
      // Extract everything after "Title: "
      return line.substring("Title: ".length).trim();
    }
  }

  // If no title found, return a default
  return "Article";
}
