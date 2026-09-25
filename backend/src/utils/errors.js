class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

class ValidationError extends AppError {
  constructor(message) { super(message, 400); }
}

class UnauthorizedError extends AppError {
  constructor(message = 'Nao autorizado') { super(message, 401); }
}

class NotFoundError extends AppError {
  constructor(message = 'Recurso nao encontrado') { super(message, 404); }
}

class ConflictError extends AppError {
  constructor(message) { super(message, 409); }
}

module.exports = { AppError, ValidationError, UnauthorizedError, NotFoundError, ConflictError };
