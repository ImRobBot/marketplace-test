import { productCatalog, type ProductCatalogItem } from '../data/productCatalog';
import { Product, sequelize } from '../models';

interface SeedResult {
  created: number;
  updated: number;
  total: number;
}

const legacyTitles = new Map<number, string>([
  [1, 'Producto A'],
  [2, 'Producto B']
]);

function assertExpectedExistingProduct(
  product: Product,
  catalogProduct: ProductCatalogItem | undefined
): asserts catalogProduct is ProductCatalogItem {
  if (!catalogProduct) {
    throw new Error(
      `La base contiene el producto ${product.id}, que está fuera del catálogo administrado 1–100.`
    );
  }

  const legacyTitle = legacyTitles.get(product.id);
  const knownTitle = product.title === catalogProduct.title || product.title === legacyTitle;
  if (!knownTitle) {
    throw new Error(
      `El producto ${product.id} tiene el título inesperado “${product.title}”; no se modificó la base.`
    );
  }
}

async function synchronizeProductCatalog(): Promise<SeedResult> {
  await sequelize.sync();

  return sequelize.transaction(async (transaction) => {
    const catalogById = new Map(productCatalog.map((product) => [product.id, product]));
    const existingProducts = await Product.findAll({ transaction });

    for (const existingProduct of existingProducts) {
      assertExpectedExistingProduct(existingProduct, catalogById.get(existingProduct.id));
    }

    const existingById = new Map(existingProducts.map((product) => [product.id, product]));
    let created = 0;
    let updated = 0;

    for (const catalogProduct of productCatalog) {
      const existingProduct = existingById.get(catalogProduct.id);

      if (existingProduct) {
        await existingProduct.update(
          {
            title: catalogProduct.title,
            description: catalogProduct.description,
            price: catalogProduct.price
          },
          { transaction }
        );
        updated += 1;
        continue;
      }

      await Product.create(catalogProduct, { transaction });
      created += 1;
    }

    const finalProducts = await Product.findAll({ attributes: ['id'], transaction });
    const finalIds = new Set(finalProducts.map((product) => product.id));
    const missingIds = productCatalog
      .map((product) => product.id)
      .filter((id) => !finalIds.has(id));

    if (finalProducts.length !== productCatalog.length || missingIds.length > 0) {
      throw new Error(
        `Validación fallida: total=${finalProducts.length}, faltantes=${missingIds.join(', ') || 'ninguno'}.`
      );
    }

    return { created, updated, total: finalProducts.length };
  });
}

async function main(): Promise<void> {
  try {
    const result = await synchronizeProductCatalog();
    console.log(
      `Catálogo sincronizado: ${result.total} productos (${result.created} creados, ${result.updated} actualizados).`
    );
  } finally {
    await sequelize.close();
  }
}

void main().catch((error: unknown) => {
  console.error('No se pudo sincronizar el catálogo.', error);
  process.exitCode = 1;
});
