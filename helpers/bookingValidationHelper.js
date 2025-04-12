const KATEGORI_TIDAK_PILIH_PRODUK = ['Hair Cut', 'Hair Treatment'];

const isProductUnnecessary = (categories, hair_color, smoothing_product, keratin_product) => {
    // Memeriksa apakah kategori tidak memerlukan produk
    const kategoriTanpaProduk = categories.some(category => KATEGORI_TIDAK_PILIH_PRODUK.includes(category));

    if (kategoriTanpaProduk) {
        return false;  // Jika ada kategori yang tidak memerlukan produk, return false (tidak perlu validasi produk)
    }

    if (categories.includes('Hair Color') && !hair_color) {
        return true;
    }
    if (categories.includes('Smoothing') && !smoothing_product) {
        return true;
    }
    if (categories.includes('Keratin') && !keratin_product) {
        return true;
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
    const uniqueCategories = [...new Set(categories)];
    return uniqueCategories.length !== categories.length;
};

module.exports = {
    isIncompatibleCombo,
    hasDuplicateCategory,
    isProductUnnecessary
};
