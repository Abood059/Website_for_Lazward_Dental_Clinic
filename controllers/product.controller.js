const productService = require('../services/product.service');

exports.getAllActive = async (req, res, next) => {
  try {
    const products = await productService.getAllActive();
    res.status(200).json({ status: 'success', data: { products } });
  } catch (error) {
    next(error);
  }
};

exports.getById = async (req, res, next) => {
  try {
    const product = await productService.getById(req.params.id);
    res.status(200).json({ status: 'success', data: { product } });
  } catch (error) {
    if (error.message === 'Product not found') {
      return res.status(404).json({ message: error.message });
    }
    next(error);
  }
};

exports.create = async (req, res, next) => {
  try {
    const product = await productService.create(req.body);
    res.status(201).json({ status: 'success', data: { product } });
  } catch (error) {
    next(error);
  }
};

exports.update = async (req, res, next) => {
  try {
    const product = await productService.update(req.params.id, req.body);
    res.status(200).json({ status: 'success', data: { product } });
  } catch (error) {
    if (error.message === 'Product not found') {
      return res.status(404).json({ message: error.message });
    }
    next(error);
  }
};

exports.delete = async (req, res, next) => {
  try {
    await productService.softDelete(req.params.id);
    res.status(200).json({ status: 'success', message: 'Product deleted successfully' });
  } catch (error) {
    if (error.message === 'Product not found') {
      return res.status(404).json({ message: error.message });
    }
    next(error);
  }
};
