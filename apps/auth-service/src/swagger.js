const { writeFileSync } = require('fs');
const { join } = require('path');

const spec = {
  swagger: '2.0',
  info: {
    title: 'Auth Service API',
    description: 'API for the Auth Service',
    version: '1.0.0',
  },
  host: 'localhost:6001',
  basePath: '/api/v1',
  schemes: ['http'],
  consumes: ['application/json'],
  produces: ['application/json'],
  paths: {
    '/register': {
      post: {
        summary: 'Initiate registration',
        description: 'Send OTP to email to start user registration',
        parameters: [
          {
            in: 'body',
            name: 'body',
            required: true,
            schema: {
              type: 'object',
              required: ['name', 'email', 'password'],
              properties: {
                name: { type: 'string', example: 'John Doe' },
                email: { type: 'string', format: 'email', example: 'john@example.com' },
                password: { type: 'string', format: 'password', example: 'SecurePass123' },
              },
            },
          },
        ],
        responses: { 200: { description: 'OTP sent successfully' }, 400: { description: 'Validation error' } },
      },
    },
    '/verify': {
      post: {
        summary: 'Verify OTP and complete registration',
        description: 'Verify OTP and create user account',
        parameters: [
          {
            in: 'body',
            name: 'body',
            required: true,
            schema: {
              type: 'object',
              required: ['email', 'otp', 'password', 'name'],
              properties: {
                email: { type: 'string', format: 'email', example: 'john@example.com' },
                otp: { type: 'string', example: '1234' },
                password: { type: 'string', format: 'password', example: 'SecurePass123' },
                name: { type: 'string', example: 'John Doe' },
              },
            },
          },
        ],
        responses: { 201: { description: 'User registered successfully' }, 400: { description: 'Invalid OTP or validation error' } },
      },
    },
    '/login': {
      post: {
        summary: 'User login',
        description: 'Authenticate user and return tokens (set in cookies)',
        parameters: [
          {
            in: 'body',
            name: 'body',
            required: true,
            schema: {
              type: 'object',
              required: ['email', 'password'],
              properties: {
                email: { type: 'string', format: 'email', example: 'john@example.com' },
                password: { type: 'string', format: 'password', example: 'SecurePass123' },
              },
            },
          },
        ],
        responses: { 200: { description: 'Login successful' }, 401: { description: 'Invalid credentials' } },
      },
    },
    '/forgot-password': {
      post: {
        summary: 'Forgot password',
        description: 'Send OTP to email for password reset',
        parameters: [
          {
            in: 'body',
            name: 'body',
            required: true,
            schema: {
              type: 'object',
              required: ['email'],
              properties: {
                email: { type: 'string', format: 'email', example: 'john@example.com' },
              },
            },
          },
        ],
        responses: { 200: { description: 'OTP sent successfully' }, 400: { description: 'Validation error' } },
      },
    },
    '/reset-password': {
      post: {
        summary: 'Reset password',
        description: 'Reset password with OTP verification',
        parameters: [
          {
            in: 'body',
            name: 'body',
            required: true,
            schema: {
              type: 'object',
              required: ['email', 'otp', 'newPassword'],
              properties: {
                email: { type: 'string', format: 'email', example: 'john@example.com' },
                otp: { type: 'string', example: '1234' },
                newPassword: { type: 'string', format: 'password', example: 'NewSecurePass123' },
              },
            },
          },
        ],
        responses: { 200: { description: 'Password reset successfully' }, 400: { description: 'Invalid OTP or validation error' } },
      },
    },
  },
};

const outputPath = join(__dirname, 'swagger-output.json');
writeFileSync(outputPath, JSON.stringify(spec, null, 2));
console.log('Swagger spec written to', outputPath);
