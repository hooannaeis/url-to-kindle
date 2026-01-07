# Tracking Documentation

## Overview
This application uses a custom event tracking system implemented via the `trackEvent` function, located in `src/scripts/trackEvent.js`. This function sends event data using `navigator.sendBeacon` to the `transportUrl`: `https://sgtm.case-trace.com/btnt`.

Every tracked event automatically includes the following default parameters:
- `event_name` (string): The name of the event. Defaults to "default_event_name" if not explicitly provided.
- `page_location` (string): The full URL of the current page.
- `page_title` (string): The title of the current page.
- `page_referrer` (string): The URL of the page that navigated to the current page.
- `session_id` (number): A unique identifier generated for the user's session.
- `client_id` (string): A unique identifier for the client, composed of a random number and the session ID.
- `page_load_id` (string): A unique identifier for the current page load.
- `debug_mode` (boolean): Set to `true` if the application is running on `localhost`, otherwise `false`.

## Tracked Events and Custom Parameters Matrix

| Event Name           | `content_url` | `share_type` | `error_message` | `[dynamic_param]` |
| :------------------- | :------------ | :----------- | :-------------- | :---------------- |
| `submission_started` | X             |              |                 |                   |
| `submission_processed` | X             |              |                 |                   |
| `submission_shared`  | X             | X            |                 |                   |
| `error_shown`        |               |              | X               |                   |
| `reload`             |               |              |                 |                   |
| `page_view`          | (via `eventParams`) | (via `eventParams`) | (via `eventParams`) | X                 |
*(Note: `[dynamic_param]` represents any custom parameters passed via the `eventParams` object for `page_view`.)*

## Detailed Event Descriptions

### `submission_started`
**Triggered by:** User initiates the article conversion process by clicking the "Convert Article" button.
**Location:**
- `src/pages/index.astro:66`
**Parameters:**
- `event_name` (**string**): Always `"submission_started"`.
- `content_url` (**string**): The URL of the article entered by the user.

**Example:**
```json
{
  "event_name": "submission_started",
  "page_location": "https://example.com/",
  "page_title": "URL to Kindle",
  "page_referrer": "https://google.com/",
  "session_id": 123456789,
  "client_id": "987654321.123456789",
  "page_load_id": "123.16789012345",
  "debug_mode": false,
  "content_url": "https://www.example.com/my-article"
}
```

**Recommendations:**
- Ensure `content_url` is always a valid and complete URL string.

### `submission_processed`
**Triggered by:** The article conversion process is successfully completed.
**Location:**
- `src/pages/index.astro:108`
**Parameters:**
- `event_name` (**string**): Always `"submission_processed"`.
- `content_url` (**string**): The URL of the article that was successfully processed.

**Example:**
```json
{
  "event_name": "submission_processed",
  "page_location": "https://example.com/",
  "page_title": "URL to Kindle",
  "page_referrer": "https://google.com/",
  "session_id": 123456789,
  "client_id": "987654321.123456789",
  "page_load_id": "123.16789012345",
  "debug_mode": false,
  "content_url": "https://www.example.com/my-processed-article"
}
```

**Recommendations:**
- Consistent naming for `content_url` across `submission_started` and `submission_processed`.

### `submission_shared`
**Triggered by:** User attempts to share the converted article, either via the Web Share API or by falling back to a direct file download.
**Location:**
- `src/pages/index.astro:166` (Web Share API)
- `src/pages/index.astro:178` (File Download Fallback)
**Parameters:**
- `event_name` (**string**): Always `"submission_shared"`.
- `content_url` (**string**): The object URL (`URL.createObjectURL`) of the converted article blob.
- `share_type` (**string**): Indicates the sharing method used: `"navigator_share"` for Web Share API, or `"file_download"` for direct download.

**Example (Web Share API):**
```json
{
  "event_name": "submission_shared",
  "page_location": "https://example.com/",
  "page_title": "URL to Kindle",
  "page_referrer": "https://google.com/",
  "session_id": 123456789,
  "client_id": "987654321.123456789",
  "page_load_id": "123.16789012345",
  "debug_mode": false,
  "content_url": "blob:https://www.example.com/unique-blob-id",
  "share_type": "navigator_share"
}
```

**Example (File Download Fallback):**
```json
{
  "event_name": "submission_shared",
  "page_location": "https://example.com/",
  "page_title": "URL to Kindle",
  "page_referrer": "https://google.com/",
  "session_id": 123456789,
  "client_id": "987654321.123456789",
  "page_load_id": "123.16789012345",
  "debug_mode": false,
  "content_url": "blob:https://www.example.com/another-unique-blob-id",
  "share_type": "file_download"
}
```

**Recommendations:**
- The `content_url` here is a `blob:` URL, not the original article URL. This should be clear in analysis.

### `error_shown`
**Triggered by:** An error message is displayed to the user via the `showError` helper function.
**Location:**
- `src/pages/index.astro:240`
**Parameters:**
- `event_name` (**string**): Always `"error_shown"`.
- `error_message` (**string**): The specific error message being shown to the user.

**Example:**
```json
{
  "event_name": "error_shown",
  "page_location": "https://example.com/",
  "page_title": "URL to Kindle",
  "page_referrer": "https://google.com/",
  "session_id": 123456789,
  "client_id": "987654321.123456789",
  "page_load_id": "123.16789012345",
  "debug_mode": false,
  "error_message": "Please enter a valid URL (e.g., https://example.com)"
}
```

**Recommendations:**
- Consider standardizing error codes or types in addition to the message for easier aggregation.

### `reload`
**Triggered by:** User clicks the "Start Over" button, triggering a page reload.
**Location:**
- `src/pages/index.astro:267`
**Parameters:**
- `event_name` (**string**): Always `"reload"`.

**Example:**
```json
{
  "event_name": "reload",
  "page_location": "https://example.com/",
  "page_title": "URL to Kindle",
  "page_referrer": "https://google.com/",
  "session_id": 123456789,
  "client_id": "987654321.123456789",
  "page_load_id": "123.16789012345",
  "debug_mode": false
}
```

**Recommendations:**
- None. This event is straightforward.

### `page_view` (or custom event name from `AnalyticsPixel`)
**Triggered by:** The `AnalyticsPixel` Astro component being rendered and connected to the DOM, typically on page load.
**Location:**
- `src/components/AnalyticsPixel.astro:31`
**Parameters:**
- `event_name` (**string**): Defaults to `"page_view"`. Can be overridden by the `eventName` prop passed to `AnalyticsPixel`.
- `page_title` (**string**): Defaults to `"default title"`. Can be overridden by the `pageTitle` prop passed to `AnalyticsPixel`.
- `[dynamic_param]` (**any**): Any additional parameters passed as an object to the `eventParams` prop of `AnalyticsPixel`. These parameters are directly merged into the event payload.

**Example (Default `page_view`):**
```json
{
  "event_name": "page_view",
  "page_location": "https://example.com/",
  "page_title": "Default title from pixel",
  "page_referrer": "https://google.com/",
  "session_id": 123456789,
  "client_id": "987654321.123456789",
  "page_load_id": "123.16789012345",
  "debug_mode": false
}
```

**Example (Custom event from `AnalyticsPixel` with additional parameters):**
```astro
<AnalyticsPixel eventName="custom_page_event" pageTitle="My Custom Page" eventParams={{ category: "marketing", campaignId: "xyz123" }} />
```
Resulting payload:
```json
{
  "event_name": "custom_page_event",
  "page_location": "https://example.com/custom-page",
  "page_title": "My Custom Page",
  "page_referrer": "https://google.com/",
  "session_id": 123456789,
  "client_id": "987654321.123456789",
  "page_load_id": "123.16789012345",
  "debug_mode": false,
  "category": "marketing",
  "campaignId": "xyz123"
}
```

**Recommendations:**
- When using `AnalyticsPixel`, ensure `eventName` and `pageTitle` props are descriptive.
- Document any specific `eventParams` objects used with `AnalyticsPixel` in specific Astro pages/layouts for clarity.
