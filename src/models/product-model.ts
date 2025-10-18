import products from "../data/products.json" with { type: "json" };
import { v4 } from "uuid";
import type { ProductPayload, Product } from "../types.js";
import { syncProductsToDisk } from "../utils.js";

export const findAll = () => {
  return Promise.resolve(products);
};

export const findById = (id: string) => {
  return Promise.resolve(products.find((product) => product.id === id));
};

export const create = async (productPayload: ProductPayload) => {
  const newProduct: Product = { ...productPayload, id: v4() };

  products.push(newProduct);

  syncProductsToDisk(products);

  return Promise.resolve(newProduct);
};

export const update = async (id: string, productPayload: ProductPayload) => {
  let updatedProduct: Product | null = null;

  products.forEach((product, index) => {
    if (product.id === id) {
      updatedProduct = {
        id,
        name: productPayload.name,
        description: productPayload.description,
        price: productPayload.price,
      };

      products[index] = updatedProduct;
    }
  });

  syncProductsToDisk(products);

  return Promise.resolve(updatedProduct);
};

export const remove = (id: string) => {
  const index = products.findIndex((product) => product.id === id);

  if (index !== -1) {
    products.splice(index, 1);

    syncProductsToDisk(products);
  }
};
