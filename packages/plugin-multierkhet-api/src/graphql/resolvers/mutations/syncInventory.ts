import { IContext } from "../../../connectionResolver";
import fetch from "node-fetch";
import { sendCoreMessage } from "../../../messageBroker";
import {
  consumeInventory,
  consumeInventoryCategory
} from "../../../utils/consumeInventory";

const inventoryMutations = {
  async toMultiCheckProducts(
    _root,
    { brandId }: { brandId: string },
    { subdomain, models }: IContext
  ) {
    const configs = await models.Configs.getConfig("erkhetConfig", {});
    const config = configs[brandId || "noBrand"];

    if (!config || !config.apiToken || !config.apiKey || !config.apiSecret) {
      throw new Error("Erkhet config not found.");
    }

    const productQry: any = { status: { $ne: "deleted" } };
    if (brandId && brandId !== "noBrand") {
      productQry.scopeBrandIds = { $in: [brandId] };
    } else {
      productQry.$or = [
        { scopeBrandIds: { $exists: false } },
        { scopeBrandIds: { $size: 0 } }
      ];
    }

    const products = await sendCoreMessage({
      subdomain,
      action: "products.find",
      data: {
        query: productQry,
      },
      isRPC: true
    });

    const productCategories = await sendCoreMessage({
      subdomain,
      action: "categories.find",
      data: { query: {} },
      isRPC: true,
      defaultValue: []
    });

    const categoryOfId = {};
    for (const cat of productCategories) {
      categoryOfId[cat._id] = cat;
    }

    const productCodes = products.map(p => p.code) || [];

    const response = await fetch(
      process.env.ERKHET_URL +
      "/get-api/?" +
      new URLSearchParams({
        kind: "inventory",
        api_key: config.apiKey,
        api_secret: config.apiSecret,
        token: config.apiToken,
        is_gen_fk: "true"
      })
    ).then(res => res.json());

    if (!response && Object.keys(response).length === 0) {
      throw new Error("Erkhet data not found.");
    }

    const updateProducts: any = [];
    const createProducts: any = [];
    const deleteProducts: any = [];
    let matchedCount = 0;

    let result = response.map(r => r.fields);
    const resultCodes = result.map(r => r.code) || [];

    const productByCode = {};
    for (const product of products) {
      productByCode[product.code] = product;

      if (!resultCodes.includes(product.code)) {
        deleteProducts.push(product);
      }
    }

    for (const resProd of result) {
      if (productCodes.includes(resProd.code)) {
        const product = productByCode[resProd.code];

        if (
          resProd.name === product.name &&
          resProd.nickname === product.shortName &&
          resProd.unit_price === product.unitPrice &&
          resProd.barcodes === (product.barcodes || []).join(",") &&
          (resProd.vat_type || "") === (product.taxType || "") &&
          product.uom &&
          resProd.measure_unit_code === product.uom &&
          resProd.category_code ===
          (categoryOfId[product.categoryId] || {}).code
        ) {
          matchedCount = matchedCount + 1;
        } else {
          updateProducts.push(resProd);
        }
      } else {
        createProducts.push(resProd);
      }
    }

    return {
      create: {
        count: createProducts.length,
        items: createProducts
      },
      update: {
        count: updateProducts.length,
        items: updateProducts
      },
      delete: {
        count: deleteProducts.length,
        items: deleteProducts
      },
      matched: {
        count: matchedCount
      }
    };
  },

  async toMultiCheckCategories(
    _root,
    { brandId }: { brandId: string },
    { subdomain, models }: IContext
  ) {
    const configs = await models.Configs.getConfig("erkhetConfig", {});
    const config = configs[brandId || "noBrand"];

    if (!config || !config.apiToken || !config.apiKey || !config.apiSecret) {
      throw new Error("Erkhet config not found.");
    }

    const categories = await sendCoreMessage({
      subdomain,
      action: "categories.find",
      data: {
        query: { status: "active" },
        sort: { order: 1 }
      },
      isRPC: true
    });

    const categoryCodes = categories.map(c => c.code);

    if (!categoryCodes) {
      throw new Error("No category codes found.");
    }

    const response = await fetch(
      process.env.ERKHET_URL +
      "/get-api/?" +
      new URLSearchParams({
        kind: "inv_category",
        api_key: config.apiKey,
        api_secret: config.apiSecret,
        token: config.apiToken,
        is_gen_fk: "true"
      }),
      {}
    ).then(res => res.json());

    if (!response || Object.keys(response).length === 0) {
      throw new Error("Erkhet data not found.");
    }
    let result = response.map(r => r.fields);

    // for update
    const matchedErkhetData = result.filter(r => {
      if (categoryCodes.find(p => p === r.code)) {
        return r;
      }
    });
    // for create
    const otherErkhetData = result.filter(r => !matchedErkhetData.includes(r));
    // for delete
    let otherCategories: any[] = [];
    for (const code of categoryCodes) {
      if (result.every(r => r.code !== code)) {
        const response = await sendCoreMessage({
          subdomain,
          action: "categories.findOne",
          data: { code: code },
          isRPC: true
        });
        otherCategories.push(response);
      }
    }
    return {
      create: {
        count: otherErkhetData.length,
        items: otherErkhetData
      },
      update: {
        count: matchedErkhetData.length,
        items: matchedErkhetData
      },
      delete: {
        count: otherCategories.length,
        items: otherCategories
      }
    };
  },

  async toMultiSyncCategories(
    _root,
    {
      brandId,
      action,
      categories
    }: { brandId: string; action: string; categories: any[] },
    { subdomain, models }: IContext
  ) {
    const configs = await models.Configs.getConfig("erkhetConfig", {});
    const config = configs[brandId || "noBrand"];

    if (!config || !config.apiToken || !config.apiKey || !config.apiSecret) {
      throw new Error("Erkhet config not found.");
    }

    try {
      switch (action) {
        case "CREATE": {
          for (const category of categories) {
            await consumeInventoryCategory(
              subdomain,
              config,
              category,
              category.code,
              "create"
            );
          }
          break;
        }
        case "UPDATE": {
          for (const category of categories) {
            await consumeInventoryCategory(
              subdomain,
              config,
              category,
              category.code,
              "update"
            );
          }
          break;
        }
        case "DELETE": {
          for (const category of categories) {
            await consumeInventoryCategory(
              subdomain,
              config,
              category,
              category.code,
              "delete"
            );
          }
          break;
        }
        default:
          break;
      }
      return {
        status: "success"
      };
    } catch (e) {
      throw new Error("Error while syncing categories. " + e);
    }
  },

  async toMultiSyncProducts(
    _root,
    {
      brandId,
      action,
      products
    }: { brandId: string; action: string; products: any[] },
    { subdomain, models }: IContext
  ) {
    const configs = await models.Configs.getConfig("erkhetConfig", {});
    const config = configs[brandId || "noBrand"];

    if (!config || !config.apiToken || !config.apiKey || !config.apiSecret) {
      throw new Error("Erkhet config not found.");
    }

    try {
      switch (action) {
        case "CREATE": {
          for (const product of products) {
            await consumeInventory(
              subdomain,
              config,
              product,
              product.code,
              "create"
            );
          }
          break;
        }
        case "UPDATE": {
          for (const product of products) {
            await consumeInventory(
              subdomain,
              config,
              product,
              product.code,
              "update"
            );
          }
          break;
        }
        case "DELETE": {
          for (const product of products) {
            await consumeInventory(
              subdomain,
              config,
              product,
              product.code,
              "delete"
            );
          }
          break;
        }
        default:
          break;
      }
      return {
        status: "success"
      };
    } catch (e) {
      throw new Error("Error while syncing products. " + e);
    }
  }
};

export default inventoryMutations;
