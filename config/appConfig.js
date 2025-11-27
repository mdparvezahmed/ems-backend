// Central server config: change these values to update host/port and allowed client origins

const PORT = process.env.PORT || 7000;

// Comma-separated list of allowed frontend origins for CORS
// e.g. http://localhost:5173,http://127.0.0.1:5173,http://myhost:5173
// IMPORTANT: Origins must NOT include a trailing slash. We'll normalize just in case.
const RAW_CLIENT_URLS = process.env.CLIENT_URLS || 'https://qbytesems.vercel.app';

const CLIENT_URLS = RAW_CLIENT_URLS
  .split(',')
  .map(s => s.trim())
  .filter(Boolean)
  // Normalize by stripping any trailing slashes so CORS exact-match works
  .map(s => s.replace(/\/+$/, ''));

module.exports = { PORT, CLIENT_URLS };
