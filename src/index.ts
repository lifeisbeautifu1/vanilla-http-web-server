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

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const PORT = process.env.PORT ? +process.env.PORT : 5000;
const PUBLIC_DIR = join(__dirname, "..", "public");

const server = createServer((req, res) => {
  console.log("LOGGING req.url:", req.url);
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
      })
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
            })
          );
        } else {
          res.statusCode = 500;
          res.setHeader("Content-Type", "application/json");
          res.end(
            JSON.stringify({
              message: "Internal Server Error",
            })
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
  console.log(`Server running at http://localhost:${PORT}/`);
});
