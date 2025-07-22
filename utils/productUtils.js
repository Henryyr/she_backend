class ValidationError extends Error {
  constructor (message) {
    super(message);
    this.name = 'ValidationError';
  }
}

const validateStock = (stok) => {
  if (typeof stok !== 'number' || stok < 0) {
    throw new ValidationError('Stok harus berupa angka positif');
  }
  return true;
};

const formatPrice = (price) => {
  return parseInt(price || 0);
};

const validateProductData = (data) => {
  const required = ['nama', 'jenis', 'harga'];
  for (const field of required) {
    if (!data[field]) {
      if (!data[field]) {
        throw new ValidationError(`Field ${field} harus diisi`);
      }
    }
  }
  return true;
};

module.exports = {
  ValidationError,
  validateStock,
  formatPrice,
  validateProductData
};
