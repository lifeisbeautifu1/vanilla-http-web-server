import type { IncomingMessage, ServerResponse } from "node:http";
import {
  findAll,
  findById,
  create,
  update,
  remove,
} from "../models/product-model.js";
import type { ProductPayload } from "../types.js";
import { getProductData } from "../utils.js";

export const getProduct = async (
  req: IncomingMessage,
  res: ServerResponse<IncomingMessage>,
  id: string
) => {
  try {
    const product = await findById(id);

    if (product) {
      res.statusCode = 200;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify(product));
    } else {
      res.statusCode = 404;
      res.setHeader("Content-Type", "application/json");
      res.end(
        JSON.stringify({
          message: "Not found",
        })
      );
    }
  } catch (error) {
    console.log("getProduct error:", error);
    res.statusCode = 500;
    res.setHeader("Content-Type", "application/json");
    res.end(
      JSON.stringify({
        message: "Internal Server Error",
      })
    );
  }
};

export const getProducts = async (
  req: IncomingMessage,
  res: ServerResponse<IncomingMessage>
) => {
  try {
    const products = await findAll();

    res.statusCode = 200;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify(products));
  } catch (error) {
    console.log("getProducts error:", error);
    res.statusCode = 500;
    res.setHeader("Content-Type", "application/json");
    res.end(
      JSON.stringify({
        message: "Internal Server Error",
      })
    );
  }
};

export const createProduct = async (
  req: IncomingMessage,
  res: ServerResponse<IncomingMessage>
) => {
  try {
    const data = await getProductData(req);

    const { name, description, price } = JSON.parse(data) as ProductPayload;

    if (!name || !description || !price) {
      res.statusCode = 400;
      res.setHeader("Content-Type", "application/json");
      res.end(
        JSON.stringify({
          message: "Bad request",
        })
      );
    }

    const product = { name, description, price };

    const newProduct = await create(product);

    if (newProduct) {
      res.statusCode = 201;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify(newProduct));
    } else {
      res.statusCode = 400;
      res.setHeader("Content-Type", "application/json");
      res.end(
        JSON.stringify({
          message: "Bad request",
        })
      );
    }
  } catch (error) {
    console.log("createProduct error:", error);
    res.statusCode = 500;
    res.setHeader("Content-Type", "application/json");
    res.end(
      JSON.stringify({
        message: "Internal Server Error",
      })
    );
  }
};

export const updateProduct = async (
  req: IncomingMessage,
  res: ServerResponse<IncomingMessage>,
  id: string
) => {
  try {
    const product = await findById(id);

    if (product) {
      const data = await getProductData(req);

      const { name, description, price } = JSON.parse(data) as ProductPayload;

      const productData = {
        name: name || product.name,
        description: description || product.description,
        price: price || product.price,
      };

      const updatedProduct = await update(id, productData);

      res.statusCode = 200;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify(updatedProduct));
    } else {
      res.statusCode = 404;
      res.setHeader("Content-Type", "application/json");
      res.end(
        JSON.stringify({
          message: "Not found",
        })
      );
    }
  } catch (error) {
    console.log("updateProduct error:", error);
    res.statusCode = 500;
    res.setHeader("Content-Type", "application/json");
    res.end(
      JSON.stringify({
        message: "Internal Server Error",
      })
    );
  }
};

export const deleteProduct = async (
  req: IncomingMessage,
  res: ServerResponse<IncomingMessage>,
  id: string
) => {
  try {
    const product = await findById(id);

    if (product) {
      await remove(id);

      res.statusCode = 200;
      res.setHeader("Content-Type", "application/json");
      res.end(
        JSON.stringify({
          message: `Product with ${id} has been removed`,
        })
      );
    } else {
      res.statusCode = 404;
      res.setHeader("Content-Type", "application/json");
      res.end(
        JSON.stringify({
          message: "Not found",
        })
      );
    }
  } catch (error) {
    console.log("deleteProduct error:", error);
    res.statusCode = 500;
    res.setHeader("Content-Type", "application/json");
    res.end(
      JSON.stringify({
        message: "Internal Server Error",
      })
    );
  }
};
