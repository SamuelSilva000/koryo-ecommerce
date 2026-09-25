const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  console.error('Erro:', err.message);
  res.status(statusCode).json({
    success: false,
    error: { message: err.message || 'Erro interno do servidor' },
  });
};

module.exports = errorHandler;
