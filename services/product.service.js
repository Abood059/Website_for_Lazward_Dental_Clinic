const Product = require('../models/Product.model');

const getAllActive = async () => {
  return await Product.find({ isActive: true });
};

const getById = async (id) => {
  const product = await Product.findById(id);
  if (!product) {
    throw new Error('Product not found');
  }
  return product;
};

const create = async (productData) => {
  return await Product.create(productData);
};

const update = async (id, productData) => {
  const product = await Product.findByIdAndUpdate(id, productData, { new: true, runValidators: true });
  if (!product) {
    throw new Error('Product not found');
  }
  return product;
};

const softDelete = async (id) => {
  const product = await Product.findByIdAndUpdate(id, { isActive: false }, { new: true });
  if (!product) {
    throw new Error('Product not found');
  }
  return product;
};

module.exports = {
  getAllActive,
  getById,
  create,
  update,
  softDelete
};
