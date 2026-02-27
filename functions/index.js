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
const puppeteer = require("puppeteer-core");
const chromium = require("@sparticuz/chromium");
const path = require("path");
const fs = require("fs");

// Pre-load the font as base64 at cold start
const fontPath = path.join(__dirname, "fonts", "NotoSans-Regular.ttf");
const fontBase64 = fs.readFileSync(fontPath).toString("base64");

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
    memory: "1GiB",
    timeoutSeconds: 120,
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

      logger.info(frontmatter);
      // Convert markdown to HTML with styling for PDF
      const articleHtml = marked(markdown);
      const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    @font-face {
      font-family: 'Noto Sans';
      src: url(data:font/truetype;base64,${fontBase64}) format('truetype');
      font-weight: normal;
      font-style: normal;
    }
    body {
      font-family: 'Noto Sans', sans-serif;
      line-height: 1.6;
      max-width: 700px;
      margin: 0 auto;
      padding: 20px;
      color: #333;
    }
    h1 { font-size: 1.8em; margin-bottom: 0.5em; }
    h2 { font-size: 1.4em; margin-top: 1.5em; }
    h3 { font-size: 1.2em; margin-top: 1.2em; }
    img {
      max-width: 100%;
      height: auto;
      display: block;
      margin: 1em auto;
    }
    pre {
      background: #f4f4f4;
      padding: 12px;
      overflow-x: auto;
      border-radius: 4px;
    }
    code {
      background: #f4f4f4;
      padding: 2px 4px;
      border-radius: 2px;
      font-size: 0.9em;
    }
    blockquote {
      border-left: 3px solid #ccc;
      margin-left: 0;
      padding-left: 16px;
      color: #666;
    }
  </style>
</head>
<body>
  <h1>${title}</h1>
  <p><em>Source: ${author}</em></p>
  <hr>
  ${articleHtml}
</body>
</html>`;

      // Generate PDF with Puppeteer
      let browser;
      try {
        browser = await puppeteer.launch({
          args: chromium.args,
          defaultViewport: chromium.defaultViewport,
          executablePath: await chromium.executablePath(),
          headless: "new",
        });
        const page = await browser.newPage();

        // Log any page errors for debugging
        page.on("pageerror", (err) => logger.error("Page error:", err.message));
        page.on("console", (msg) => logger.info("Page console:", msg.text()));

        await page.setContent(html, { waitUntil: "networkidle0", timeout: 30000 });

        // Verify the page has content
        const bodyText = await page.evaluate(() => document.body.innerText.substring(0, 200));
        logger.info(`Page body preview: "${bodyText}"`);

        logger.info("Page content set, generating PDF...");

        const pdfBuffer = await page.pdf({
          format: "A4",
          printBackground: true,
          margin: { top: "20mm", bottom: "20mm", left: "15mm", right: "15mm" },
        });

        logger.info(`PDF generated, size: ${pdfBuffer.length} bytes`);

        // Set response headers for PDF file
        response.set("Content-Type", "application/pdf");
        response.set(
          "Content-Disposition",
          `attachment; filename=${safeTitle}.pdf`,
        );
        response.send(Buffer.from(pdfBuffer));
      } finally {
        if (browser) {
          await browser.close();
        }
      }
    } catch (error) {
      logger.error("Error in convert function:", error);
      response.status(500).send("Error processing URL: " + error.message);
    }
  },
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
    .replace(/[^\x20-\x7E]/g, "") // Remove all non-ASCII characters
    .replace(/[''\(\)<>:"/\\|?*\x00-\x1F]/g, "") // Remove illegal filename characters
    .replace(/\s+/g, "_") // Replace whitespace with underscores
    .replace(/_+/g, "_") // Replace multiple underscores with single
    .replace(/^_+|_+$/g, "") // Trim underscores from start/end
    .substring(0, 100) // Limit length to prevent overly long filenames
    .toLocaleLowerCase();
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
