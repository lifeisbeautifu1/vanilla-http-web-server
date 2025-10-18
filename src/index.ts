import { createServer } from "node:http";
import {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
} from "./controllers/product-controller.js";

const PORT = process.env.PORT ? +process.env.PORT : 5000;

const server = createServer((req, res) => {
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
  } else {
    res.statusCode = 404;
    res.setHeader("Content-Type", "application/json");
    res.end(
      JSON.stringify({
        message: "Route Not Found",
      })
    );
  }
});

server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}/`);
});
