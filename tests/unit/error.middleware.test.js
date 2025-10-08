import { jest } from '@jest/globals';
import errorMiddleware from '../../middlewares/error.middleware.js';

describe('Error Middleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = {};
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    next = jest.fn();

    // Mock console.error to avoid noise in test output
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Mongoose Errors', () => {
    it('should handle CastError (invalid ObjectId)', () => {
      const err = {
        name: 'CastError',
        message: 'Cast to ObjectId failed'
      };

      errorMiddleware(err, req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Resource not found'
      });
    });

    it('should handle duplicate key error (code 11000)', () => {
      const err = {
        code: 11000,
        message: 'Duplicate key error'
      };

      errorMiddleware(err, req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Duplicate field value entered'
      });
    });

    it('should handle ValidationError', () => {
      const err = {
        name: 'ValidationError',
        errors: {
          name: { message: 'Name is required' },
          email: { message: 'Email is invalid' }
        }
      };

      errorMiddleware(err, req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Name is required, Email is invalid'
      });
    });
  });

  describe('Custom Errors', () => {
    it('should handle custom error with statusCode', () => {
      const err = new Error('Custom error message');
      err.statusCode = 403;

      errorMiddleware(err, req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Custom error message'
      });
    });

    it('should handle error with statusCode property', () => {
      const err = new Error('Unauthorized access');
      err.statusCode = 401;

      errorMiddleware(err, req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Unauthorized access'
      });
    });
  });

  describe('Generic Errors', () => {
    it('should handle generic error without statusCode', () => {
      const err = new Error('Something went wrong');

      errorMiddleware(err, req, res, next);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Something went wrong'
      });
    });

    it('should handle error without message', () => {
      const err = {};

      errorMiddleware(err, req, res, next);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Server Error'
      });
    });
  });

  describe('Error in Error Handler', () => {
    it('should call next if error occurs in middleware', () => {
      const err = new Error('Original error');
      
      // Mock res.status to throw an error
      res.status.mockImplementation(() => {
        throw new Error('Status error');
      });

      errorMiddleware(err, req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  it('should log errors to console', () => {
    const err = new Error('Test error');

    errorMiddleware(err, req, res, next);

    expect(console.error).toHaveBeenCalledWith(err);
  });
});
