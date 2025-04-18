const KATEGORI_DEFAULT_PRODUK = ['Smoothing', 'Keratin'];
const KATEGORI_WAJIB_PRODUK = {
    'Cat Rambut': ['hair_color']
};

const isProductUnnecessary = (categories, hair_color, smoothing_product, keratin_product) => {
    const productValues = {
        hair_color,
        smoothing_product,
        keratin_product
    };

    for (const category of categories) {
        if (KATEGORI_DEFAULT_PRODUK.includes(category)) {
            continue;
        }
        
        const requiredProducts = KATEGORI_WAJIB_PRODUK[category];
        if (requiredProducts) {
            for (const product of requiredProducts) {
                if (!productValues[product]) {
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
