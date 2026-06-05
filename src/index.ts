import { createServer } from "node:http";
import { readFile } from "node:fs";
import { dirname, join, normalize, extname } from "node:path";
import { fileURLToPath, parse } from "node:url";
import {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
} from "./controllers/product-controller.js";
import { MIME_TYPES } from "./constants.js";
import logger from "./utils/logger.js";
import {
  register,
  httpRequestDuration,
  httpRequestsTotal,
  httpRequestsInProgress,
} from "./utils/metrics.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const PORT = process.env.PORT ? +process.env.PORT : 5000;
const PUBLIC_DIR = join(__dirname, "..", "public");

// Helper to get path without query params and IDs for labeling
const getPathLabel = (url: string | undefined): string => {
  if (!url) return "unknown";
  const path = url.split("?")[0];
  // Normalize /api/products/:id to /api/products/:id
  // @ts-ignore
  return path.replace(/\/api\/products\/[a-zA-Z0-9]+/g, "/api/products/:id");
};

const server = createServer((req, res) => {
  const startTime = Date.now();
  const pathLabel = getPathLabel(req.url);

  // Track in-progress requests
  httpRequestsInProgress.inc();

  // Log request
  logger.info("Incoming request", {
    method: req.method,
    url: req.url,
    path: pathLabel,
    ip: req.socket.remoteAddress,
    timestamp: new Date().toISOString(),
  });

  // Capture original end to log response
  const originalEnd = res.end;
  res.end = function (...args: any[]) {
    const duration = (Date.now() - startTime) / 1000;
    const status = res.statusCode;

    // Log response
    logger.info("Request completed", {
      method: req.method,
      url: req.url,
      path: pathLabel,
      status,
      duration: `${duration}s`,
      ip: req.socket.remoteAddress,
    });

    // Record metrics
    httpRequestsTotal.inc({ method: req.method, path: pathLabel, status });
    httpRequestDuration.observe(
      { method: req.method, path: pathLabel, status },
      duration,
    );
    httpRequestsInProgress.dec();

    // @ts-ignore
    return originalEnd.apply(res, args);
  };

  if (req.url === "/metrics" && req.method === "GET") {
    res.statusCode = 200;
    res.setHeader("Content-Type", "text/plain");
    register.metrics().then((metrics) => res.end(metrics));
    return;
  }

  if (req.url === "/api/products" && req.method === "GET") {
    getProducts(req, res);
  } else if (
    req.url?.match(/\/api\/products\/([a-zA-Z0-9]+)/) &&
    req.method === "GET"
  ) {
    const id = req.url.split("/")[3];
    getProduct(req, res, id!);
  } else if (
    req.url?.match(/\/api\/products\/([a-zA-Z0-9]+)/) &&
    req.method === "DELETE"
  ) {
    const id = req.url.split("/")[3];
    deleteProduct(req, res, id!);
  } else if (
    req.url?.match(/\/api\/products\/([a-zA-Z0-9]+)/) &&
    req.method === "PUT"
  ) {
    const id = req.url.split("/")[3];
    updateProduct(req, res, id!);
  } else if (req.url === "/api/products" && req.method === "POST") {
    createProduct(req, res);
  } else if (req.url === "/health" && req.method === "GET") {
    res.statusCode = 200;
    res.setHeader("Content-Type", "application/json");
    res.end(
      JSON.stringify({
        status: "ok",
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
      }),
    );
  } else {
    const parsedUrl = parse(req.url!);
    const pathname = parsedUrl.pathname;
    const resolvedPath = normalize(pathname!).replace(/^(\.\.[\/\\])+/, "");
    let filePath = join(PUBLIC_DIR, resolvedPath);

    if (filePath.endsWith("/") || extname(filePath) === "") {
      filePath = join(filePath, "index.html");
    }

    const ext = extname(filePath).toLowerCase();
    const mimeType =
      MIME_TYPES[ext as keyof typeof MIME_TYPES] || "application/octet-stream";

    readFile(filePath, (error, content) => {
      if (error) {
        if (error.code === "ENOENT") {
          res.statusCode = 404;
          res.setHeader("Content-Type", "application/json");
          res.end(
            JSON.stringify({
              message: "Route Not Found",
            }),
          );
        } else {
          res.statusCode = 500;
          res.setHeader("Content-Type", "application/json");
          res.end(
            JSON.stringify({
              message: "Internal Server Error",
            }),
          );
        }
      } else {
        res.statusCode = 200;
        res.setHeader("Content-Type", mimeType);
        res.end(content, "utf-8");
      }
    });
  }
});

server.listen(PORT, () => {
  logger.info("Server started", {
    port: PORT,
    url: `http://localhost:${PORT}`,
    metrics: `http://localhost:${PORT}/metrics`,
  });
});
