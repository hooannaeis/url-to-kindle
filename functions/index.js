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
const Nodepub = require("nodepub");
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
    cors: [
      "https://url-to-kindle.web.app",
      "https://url-to-kindle.hannes.cool",
    ],
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

      const markdown = await getMarkdownFromUrl(url);

      // Extract title from markdown content
      const title = extractTitleFromMarkdown(markdown);
      const author = getHostFromUrl(url);

      const ebookMetaData = {
        id: url,
        title: title,
        author: author,
        cover: '.test-cover.png',
        description: `Converted from ${url}`,
        contents: "Web Capture",
      };

      // Make title filename-safe for the download
      const safeTitle = makeFilenameSafe(title);

      // Convert markdown to HTML
      const ebook = await convertMarkdownToEbookBuffer(markdown, ebookMetaData);

      // Set response headers for HTML file
      response.set("Content-Type", "application/force-download");
      response.set(
        "Content-Disposition",
        `attachment; filename=${safeTitle}.html`
      );
      res.setHeader("Content-Length", ebook.length);
      response.send(ebook);
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
    .toLocaleLowerCase();
}

function extractTitleFromMarkdown(markdown) {
  return extractContentFromMarkdown(markdown, "Title");
}

/**
 * Helper function to extract title from markdown content
 * @param {string} markdown
 * @return {string} title
 */
function extractContentFromMarkdown(markdown, contentIdentifier) {
  // Look for a line starting with "Title: "
  const lines = markdown.split("\n");

  for (const line of lines) {
    if (line.startsWith(contentIdentifier + ": ")) {
      // Extract everything after "Title: "
      return line.substring(contentIdentifier + ": ".length).trim();
    }
  }

  // If no title found, return a default
  return contentIdentifier;
}

/**
 * Fetches a URL via Jina AI and returns an EPUB file as a binary Buffer.
 * @param {string} url - The URL to convert
 * @returns {Promise<Buffer>} - The binary data of the EPUB
 */
async function convertMarkdownToEbookBuffer(markdownContent, metaData) {
  try {
    if (!markdownContent) throw new Error("No content received.");

    // 2. Extract Title
    const title = extractTitleFromMarkdown(markdownContent);

    console.log(`⚙️  Converting "${title}" to HTML...`);

    // 3. Convert Markdown to HTML
    const htmlContent = marked(markdownContent);

    // 5. Create In-Memory EPUB
    const epub = Nodepub.document(metaData);

    // Add the main content as a single section/chapter
    epub.addSection("Main Content", htmlContent);

    // 6. Return the Buffer
    // getOutputBuffer() returns a Promise that resolves to the file buffer
    const buffer = await epub.getOutputBuffer();
    
    return buffer;
  } catch (error) {
    throw new Error(`Generation failed: ${error.message}`);
  }
}

async function getMarkdownFromUrl(url) {
  try {
    console.log(`🔍 Fetching content from: ${url}...`);

    // 1. Fetch Markdown from Jina
    const jinaUrl = `https://r.jina.ai/${url}`;
    const response = await axios.get(jinaUrl, {
      headers: { "x-respond-with": "markdown" },
    });
    const markdownContent = response.data;

    if (!markdownContent) throw new Error("No content received.");

    return markdownContent;
  } catch (error) {
    throw new Error(`Generation failed: ${error.message}`);
  }
}
