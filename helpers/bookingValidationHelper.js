const { DEFAULT_PRODUCTS } = require('../config/product');

const KATEGORI_TIDAK_PILIH_PRODUK = ['Hair Cut', 'Hair Treatment'];
const KATEGORI_DEFAULT_PRODUK = ['Smoothing', 'Keratin'];
const KATEGORI_WAJIB_PRODUK = {
    'Cat Rambut': ['hair_color']
};

const isProductUnnecessary = (categories, hair_color, smoothing_product, keratin_product) => {
    for (const category of categories) {
        // Skip categories with default products
        if (KATEGORI_DEFAULT_PRODUK.includes(category)) {
            continue;
        }
        
        // Check required products for other categories
        const requiredProducts = KATEGORI_WAJIB_PRODUK[category];
        if (requiredProducts) {
            for (const product of requiredProducts) {
                if (!eval(product)) {
                    throw new Error(`Layanan ${category} membutuhkan pemilihan produk`);
                }
            }
        }
    }
    return false;
};

const isIncompatibleCombo = (categories) => {
    const incompatiblePairs = [
        ['Smoothing', 'Keratin']
    ];

    return incompatiblePairs.some(([cat1, cat2]) => 
        categories.includes(cat1) && categories.includes(cat2)
    );
};

const hasDuplicateCategory = (categories) => {
    const categoryCount = {};
    
    for (const category of categories) {
        categoryCount[category] = (categoryCount[category] || 0) + 1;
        // If any category appears more than once, return true
        if (categoryCount[category] > 1) {
            return true;
        }
    }
    return false;
};

module.exports = {
    isIncompatibleCombo,
    hasDuplicateCategory,
    isProductUnnecessary
};
