const { pool } = require('../../db');
const cacheManager = require('../../utils/cacheManager');

// Cache keys for stock-related data
const STOCK_CACHE_KEYS = {
  ALL_PRODUCTS: 'all_products_with_stock',
  OUT_OF_STOCK: 'out_of_stock_products',
  HAIR_PRODUCTS: 'hair_products',
  SMOOTHING_PRODUCTS: 'smoothing_products_public',
  KERATIN_PRODUCTS: 'keratin_products_public'
};

// Function to invalidate stock-related cache
const invalidateStockCache = () => {
  Object.values(STOCK_CACHE_KEYS).forEach(key => {
    cacheManager.del(key);
  });
  console.log('Stock cache invalidated');
};

// Function to invalidate specific product cache
const invalidateProductCache = (productType, productId = null) => {
  if (productType === 'hair') {
    cacheManager.del(STOCK_CACHE_KEYS.HAIR_PRODUCTS);
    cacheManager.del(STOCK_CACHE_KEYS.ALL_PRODUCTS);
    cacheManager.del(STOCK_CACHE_KEYS.OUT_OF_STOCK);
  } else if (productType === 'smoothing') {
    cacheManager.del(STOCK_CACHE_KEYS.SMOOTHING_PRODUCTS);
    cacheManager.del(STOCK_CACHE_KEYS.ALL_PRODUCTS);
    cacheManager.del(STOCK_CACHE_KEYS.OUT_OF_STOCK);
  } else if (productType === 'keratin') {
    cacheManager.del(STOCK_CACHE_KEYS.KERATIN_PRODUCTS);
    cacheManager.del(STOCK_CACHE_KEYS.ALL_PRODUCTS);
    cacheManager.del(STOCK_CACHE_KEYS.OUT_OF_STOCK);
  }
  console.log(`Cache invalidated for ${productType} products`);
};

const getAllProducts = async () => {
  return await cacheManager.getOrSet(STOCK_CACHE_KEYS.ALL_PRODUCTS, async () => {
    const connection = await pool;
    try {
      // Get hair products with stock status
      const [hairProducts] = await connection.query(`
        SELECT 
          hp.id,
          hp.nama as product_nama,
          hp.jenis,
          hp.deskripsi,
          hp.harga_dasar,
          pb.id as brand_id,
          pb.nama as brand_nama,
          COUNT(hc.id) as total_colors,
          COUNT(CASE WHEN hc.stok > 0 THEN 1 END) as available_colors,
          SUM(hc.stok) as total_stok
        FROM hair_products hp
        JOIN product_brands pb ON hp.brand_id = pb.id
        LEFT JOIN hair_colors hc ON hc.product_id = hp.id
        GROUP BY hp.id
        ORDER BY pb.nama, hp.nama
      `);

      // Get smoothing products with stock status
      const [smoothingProducts] = await connection.query(`
        SELECT 
          sp.id,
          sp.nama as product_nama,
          sp.jenis,
          sp.harga,
          pb.id as brand_id,
          pb.nama as brand_nama,
          sp.stok,
          CASE 
            WHEN sp.stok > 0 THEN 'available'
            ELSE 'out_of_stock'
          END as stock_status
        FROM smoothing_products sp
        JOIN product_brands pb ON sp.brand_id = pb.id
        ORDER BY pb.nama, sp.nama
      `);

      // Get keratin products with stock status
      const [keratinProducts] = await connection.query(`
        SELECT 
          kp.id,
          kp.nama as product_nama,
          kp.jenis,
          kp.harga,
          pb.id as brand_id,
          pb.nama as brand_nama,
          kp.stok,
          CASE 
            WHEN kp.stok > 0 THEN 'available'
            ELSE 'out_of_stock'
          END as stock_status
        FROM keratin_products kp
        JOIN product_brands pb ON kp.brand_id = pb.id
        ORDER BY pb.nama, kp.nama
      `);

      // Format hair products
      const formattedHairProducts = hairProducts.map(product => ({
        id: product.id,
        type: 'hair',
        nama: product.product_nama,
        jenis: product.jenis,
        deskripsi: product.deskripsi,
        harga_dasar: parseInt(product.harga_dasar),
        brand: {
          id: product.brand_id,
          nama: product.brand_nama
        },
        stock_info: {
          total_colors: parseInt(product.total_colors),
          available_colors: parseInt(product.available_colors),
          total_stok: parseInt(product.total_stok || 0),
          stock_status: product.available_colors > 0 ? 'available' : 'out_of_stock'
        }
      }));

      // Format smoothing products
      const formattedSmoothingProducts = smoothingProducts.map(product => ({
        id: product.id,
        type: 'smoothing',
        nama: product.product_nama,
        jenis: product.jenis,
        harga: parseInt(product.harga),
        brand: {
          id: product.brand_id,
          nama: product.brand_nama
        },
        stock_info: {
          stok: parseInt(product.stok),
          stock_status: product.stock_status
        }
      }));

      // Format keratin products
      const formattedKeratinProducts = keratinProducts.map(product => ({
        id: product.id,
        type: 'keratin',
        nama: product.product_nama,
        jenis: product.jenis,
        harga: parseInt(product.harga),
        brand: {
          id: product.brand_id,
          nama: product.brand_nama
        },
        stock_info: {
          stok: parseInt(product.stok),
          stock_status: product.stock_status
        }
      }));

      return {
        hair_products: formattedHairProducts,
        smoothing_products: formattedSmoothingProducts,
        keratin_products: formattedKeratinProducts
      };
    } catch (err) {
      console.error('Service Error:', err);
      throw new Error('Gagal mengambil data produk: ' + err.message);
    }
  }, 300); // Cache 5 menit
};

const getHairProducts = async () => {
  return await cacheManager.getOrSet(STOCK_CACHE_KEYS.HAIR_PRODUCTS, async () => {
    const connection = await pool;
    try {
      // Increase group_concat_max_len to handle large JSON strings
      await connection.query('SET SESSION group_concat_max_len = 1000000');

      const [products] = await connection.query(`
            SELECT 
                hp.id,
                hp.nama as product_nama,
                hp.jenis,
                hp.deskripsi,
                hp.harga_dasar,
                pb.id as brand_id,
                pb.nama as brand_nama,
                GROUP_CONCAT(
                    JSON_OBJECT(
                        'color_id', hc.id,
                        'nama', REPLACE(hc.nama, '"', '\\"'), -- Escape karakter "
                        'kategori', hc.kategori,
                        'level', hc.level,
                        'stok', hc.stok,
                        'tambahan_harga', hc.tambahan_harga
                    )
                ) as colors
            FROM hair_products hp
            JOIN product_brands pb ON hp.brand_id = pb.id
            LEFT JOIN hair_colors hc ON hc.product_id = hp.id AND hc.stok > 0
            GROUP BY hp.id
            ORDER BY pb.nama, hp.nama
        `);

      const formattedProducts = products.map(product => {
        let availableColors = [];
        if (product.colors) {
          try {
            // Langsung parse tanpa validasi JSON helper
            const jsonString = `[${product.colors}]`;
            availableColors = JSON.parse(jsonString).map(color => ({
              ...color,
              harga_total: parseInt(product.harga_dasar) + parseInt(color.tambahan_harga)
            }));
          } catch (error) {
            console.error(`Error parsing colors for product ID ${product.id}:`, error.message);
          }
        }

        return {
          product_id: product.id,
          brand: {
            id: product.brand_id,
            nama: product.brand_nama
          },
          product: {
            nama: product.product_nama,
            jenis: product.jenis,
            deskripsi: product.deskripsi,
            harga_dasar: parseInt(product.harga_dasar)
          },
          available_colors: availableColors
        };
      });

      return formattedProducts;
    } catch (err) {
      console.error('Service Error:', err);
      throw new Error('Gagal mengambil data produk rambut: ' + err.message);
    }
  }, 300); // Cache 5 menit
};

const getProductsByCategory = async (kategoriId) => {
  const connection = await pool;
  try {
    const [products] = await connection.query(
      'SELECT * FROM products WHERE kategori_id = ?',
      [kategoriId]
    );
    return products;
  } catch (err) {
    throw new Error('Gagal mengambil data produk: ' + err.message);
  }
};

const getHairColors = async () => {
  const connection = await pool;
  try {
    const [colors] = await connection.query(`
            SELECT 
                hp.id as product_id,
                pb.id as brand_id,
                pb.nama as brand_nama,
                hc.id as color_id,
                hc.nama as warna,
                hc.kategori,
                hc.level,
                hp.harga_dasar,
                hc.tambahan_harga,
                hc.stok
            FROM hair_products hp
            JOIN product_brands pb ON hp.brand_id = pb.id
            JOIN hair_colors hc ON hc.product_id = hp.id
            WHERE hc.stok > 0
            ORDER BY pb.nama, hc.nama
        `);
    return colors;
  } catch (err) {
    throw new Error('Gagal mengambil data warna: ' + err.message);
  }
};

const getSmoothingProducts = async () => {
  return await cacheManager.getOrSet(STOCK_CACHE_KEYS.SMOOTHING_PRODUCTS, async () => {
    const connection = await pool;
    try {
      const [products] = await connection.query(`
            SELECT sp.*, pb.nama as brand_nama
            FROM smoothing_products sp
            JOIN product_brands pb ON sp.brand_id = pb.id
            WHERE sp.stok > 0
            ORDER BY pb.nama, sp.nama
        `);
      return products;
    } catch (err) {
      throw new Error('Gagal mengambil data smoothing: ' + err.message);
    }
  }, 300); // Cache 5 menit
};

const getKeratinProducts = async () => {
  return await cacheManager.getOrSet(STOCK_CACHE_KEYS.KERATIN_PRODUCTS, async () => {
    const connection = await pool;
    try {
      const [products] = await connection.query(`
            SELECT kp.*, pb.nama as brand_nama
            FROM keratin_products kp
            JOIN product_brands pb ON kp.brand_id = pb.id
            WHERE kp.stok > 0
            ORDER BY pb.nama, kp.nama
        `);
      return products;
    } catch (err) {
      throw new Error('Gagal mengambil data keratin: ' + err.message);
    }
  }, 300); // Cache 5 menit
};

const getHairColorsByProduct = async (productId) => {
  const connection = await pool;
  try {
    const [colors] = await connection.query(`
            SELECT 
                hc.id as color_id,
                hc.nama as warna,
                hc.kategori,
                hc.level,
                hc.stok,
                (hp.harga_dasar + hc.tambahan_harga) as total_harga
            FROM hair_colors hc
            JOIN hair_products hp ON hc.product_id = hp.id
            WHERE hc.product_id = ? AND hc.stok > 0
            ORDER BY hc.nama
        `, [productId]);
    return colors;
  } catch (err) {
    throw new Error('Gagal mengambil data warna: ' + err.message);
  }
};

const getOutOfStockProducts = async () => {
  return await cacheManager.getOrSet(STOCK_CACHE_KEYS.OUT_OF_STOCK, async () => {
    const connection = await pool;
    try {
      // Get hair products that are completely out of stock
      const [hairProductsOutOfStock] = await connection.query(`
        SELECT 
          hp.id,
          hp.nama as product_nama,
          hp.jenis,
          pb.nama as brand_nama,
          'hair' as product_type
        FROM hair_products hp
        JOIN product_brands pb ON hp.brand_id = pb.id
        WHERE NOT EXISTS (
          SELECT 1 FROM hair_colors hc 
          WHERE hc.product_id = hp.id AND hc.stok > 0
        )
        ORDER BY pb.nama, hp.nama
      `);

      // Get smoothing products that are out of stock
      const [smoothingProductsOutOfStock] = await connection.query(`
        SELECT 
          sp.id,
          sp.nama as product_nama,
          sp.jenis,
          pb.nama as brand_nama,
          'smoothing' as product_type
        FROM smoothing_products sp
        JOIN product_brands pb ON sp.brand_id = pb.id
        WHERE sp.stok = 0
        ORDER BY pb.nama, sp.nama
      `);

      // Get keratin products that are out of stock
      const [keratinProductsOutOfStock] = await connection.query(`
        SELECT 
          kp.id,
          kp.nama as product_nama,
          kp.jenis,
          pb.nama as brand_nama,
          'keratin' as product_type
        FROM keratin_products kp
        JOIN product_brands pb ON kp.brand_id = pb.id
        WHERE kp.stok = 0
        ORDER BY pb.nama, kp.nama
      `);

      return {
        hair_products: hairProductsOutOfStock,
        smoothing_products: smoothingProductsOutOfStock,
        keratin_products: keratinProductsOutOfStock,
        total_out_of_stock: hairProductsOutOfStock.length + smoothingProductsOutOfStock.length + keratinProductsOutOfStock.length
      };
    } catch (err) {
      console.error('Service Error:', err);
      throw new Error('Gagal mengambil data produk yang habis: ' + err.message);
    }
  }, 300); // Cache 5 menit
};

const checkProductAvailability = async (productId, productType, colorId = null) => {
  const connection = await pool;
  try {
    let isAvailable = false;
    let stockInfo = {};

    if (productType === 'hair') {
      // For hair products, check if the specific color is available
      if (colorId) {
        const [colorResult] = await connection.query(`
          SELECT hc.stok, hc.nama as color_name, hp.nama as product_name
          FROM hair_colors hc
          JOIN hair_products hp ON hc.product_id = hp.id
          WHERE hc.id = ? AND hc.product_id = ?
        `, [colorId, productId]);

        if (colorResult.length > 0) {
          isAvailable = colorResult[0].stok > 0;
          stockInfo = {
            stok: colorResult[0].stok,
            color_name: colorResult[0].color_name,
            product_name: colorResult[0].product_name
          };
        }
      } else {
        // Check if any color is available for this product
        const [colorResult] = await connection.query(`
          SELECT COUNT(*) as available_colors, SUM(stok) as total_stok
          FROM hair_colors
          WHERE product_id = ? AND stok > 0
        `, [productId]);

        isAvailable = colorResult[0].available_colors > 0;
        stockInfo = {
          available_colors: colorResult[0].available_colors,
          total_stok: colorResult[0].total_stok
        };
      }
    } else if (productType === 'smoothing') {
      const [productResult] = await connection.query(`
        SELECT stok, nama as product_name
        FROM smoothing_products
        WHERE id = ?
      `, [productId]);

      if (productResult.length > 0) {
        isAvailable = productResult[0].stok > 0;
        stockInfo = {
          stok: productResult[0].stok,
          product_name: productResult[0].product_name
        };
      }
    } else if (productType === 'keratin') {
      const [productResult] = await connection.query(`
        SELECT stok, nama as product_name
        FROM keratin_products
        WHERE id = ?
      `, [productId]);

      if (productResult.length > 0) {
        isAvailable = productResult[0].stok > 0;
        stockInfo = {
          stok: productResult[0].stok,
          product_name: productResult[0].product_name
        };
      }
    }

    return {
      is_available: isAvailable,
      product_id: productId,
      product_type: productType,
      color_id: colorId,
      stock_info: stockInfo
    };
  } catch (err) {
    console.error('Service Error:', err);
    throw new Error('Gagal mengecek ketersediaan produk: ' + err.message);
  }
};

module.exports = {
  getAllProducts,
  getProductsByCategory,
  getHairProducts,
  getHairColors,
  getSmoothingProducts,
  getKeratinProducts,
  getHairColorsByProduct,
  getOutOfStockProducts,
  checkProductAvailability,
  invalidateStockCache,
  invalidateProductCache
};
