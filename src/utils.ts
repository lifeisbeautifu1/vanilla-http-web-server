import fs from "node:fs";
import path from "node:path";
import type { Product } from "./types.js";
import { IncomingMessage } from "node:http";

export const syncProductsToDisk = (products: Product[]) => {
  fs.writeFile(
    path.resolve("src", "data", "products.json"),
    JSON.stringify(products),
    {
      encoding: "utf-8",
    },
    (error) => {
      if (error) {
        console.log("writeDataToFile: Error writing to disk...", error);
      }
    }
  );
};

export const getProductData = (req: IncomingMessage): Promise<string> => {
  return new Promise((resolve, reject) => {
    try {
      let body = "";

      req.on("data", (chunk) => {
        body += chunk.toString();
      });

      req.on("end", () => {
        resolve(body);
      });
    } catch (error) {
      console.log("getProductData: Error parsing request data", error);
      reject(error);
    }
  });
};
