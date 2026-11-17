const swaggerDocs = {
  openapi: '3.0.3',
  info: {
    title: 'media_Order Foot API',
    version: '1.0.0',
    description: 'API documentation for media_Order Foot .'
  },
  servers: [
    {
      url: '/api/v1',
      description: 'API version 1'
    }
  ],
  tags: [
    { name: 'Health', description: 'Service health check' },
    { name: 'Auth', description: 'Authentication and registration' },
    { name: 'Users', description: 'User management' },
    { name: 'Media', description: 'Media upload and storage management' }
  ],
  paths: {
    '/': {
      get: {
        tags: ['Health'],
        summary: 'Check API health',
        responses: {
          200: {
            description: 'API is running',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: { type: 'string', example: 'OK' },
                    code: { type: 'integer', example: 200000 },
                    description: { type: 'string' },
                    message: { type: 'string', example: 'Server is running' },
                    timestamp: { type: 'string', format: 'date-time' }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/auth/register/user': {
      post: {
        tags: ['Auth'],
        summary: 'Register a user',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/RegisterUserRequest' }
            }
          }
        },
        responses: {
          200: {
            description: 'User registered',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/SuccessResponse' },
                example: {
                  message: 'OK',
                  status: 200,
                  code: 200000,
                  description: 'Request completed successfully',
                  timestamp: '2026-01-01T00:00:00.000Z',
                  metadata: {
                    message: 'User registered successfully',
                    data: {
                      name: 'Demo User',
                      email: 'demo@example.com'
                    }
                  },
                  options: {}
                }
              }
            }
          },
          400: {
            description: 'Invalid registration data',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' }
              }
            }
          }
        }
      }
    },
    '/users': {
      get: {
        tags: ['Users'],
        summary: 'List users',
        description: 'Requires the user:view_all permission.',
        security: [{ BearerAuth: [] }],
        responses: {
          200: {
            description: 'Users returned',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/SuccessResponse' }
              }
            }
          },
          401: {
            description: 'Bearer token is missing or invalid',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' }
              }
            }
          },
          403: {
            description: 'Role does not have user:view_all',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' }
              }
            }
          }
        }
      },
      post: {
        tags: ['Users'],
        summary: 'Create a user',
        description: 'Requires the user:manage permission.',
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/UserInput' }
            }
          }
        },
        responses: {
          201: {
            description: 'User created',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/SuccessResponse' }
              }
            }
          },
          401: {
            description: 'Bearer token is missing or invalid',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' }
              }
            }
          },
          403: {
            description: 'Role does not have user:manage',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' }
              }
            }
          }
        }
      }
    },
    '/users/{id}': {
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          description: 'User identifier',
          schema: { type: 'string' }
        }
      ],
      get: {
        tags: ['Users'],
        summary: 'Get a user by ID',
        description: 'Requires the user:view_all permission.',
        security: [{ BearerAuth: [] }],
        responses: {
          200: {
            description: 'User returned',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/SuccessResponse' }
              }
            }
          },
          401: {
            description: 'Bearer token is missing or invalid',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' }
              }
            }
          },
          403: {
            description: 'Role does not have user:view_all',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' }
              }
            }
          },
          404: {
            description: 'User not found',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' }
              }
            }
          }
        }
      },
      put: {
        tags: ['Users'],
        summary: 'Update a user',
        description: 'Requires the user:manage permission.',
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/UserInput' }
            }
          }
        },
        responses: {
          200: {
            description: 'User updated',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/SuccessResponse' }
              }
            }
          },
          401: {
            description: 'Bearer token is missing or invalid',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' }
              }
            }
          },
          403: {
            description: 'Role does not have user:manage',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' }
              }
            }
          },
          404: {
            description: 'User not found',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' }
              }
            }
          }
        }
      },
      delete: {
        tags: ['Users'],
        summary: 'Delete a user',
        description: 'Requires the user:manage permission.',
        security: [{ BearerAuth: [] }],
        responses: {
          204: { description: 'User deleted' },
          401: {
            description: 'Bearer token is missing or invalid',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' }
              }
            }
          },
          403: {
            description: 'Role does not have user:manage',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' }
              }
            }
          },
          404: {
            description: 'User not found',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' }
              }
            }
          }
        }
      }
    },
    '/media/upload': {
      post: {
        tags: ['Media'],
        summary: 'Upload a single file',
        requestBody: {
          required: true,
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                properties: {
                  file: {
                    type: 'string',
                    format: 'binary'
                  },
                  objectName: {
                    type: 'string',
                    description: 'Optional storage key to use for the uploaded file.',
                    example: 'uploads/image.jpg'
                  }
                },
                required: ['file']
              }
            }
          }
        },
        parameters: [
          { name: 'bucket', in: 'query', required: false, schema: { type: 'string' } },
          { name: 'folder', in: 'query', required: false, schema: { type: 'string' } }
        ],
        responses: {
          201: {
            description: 'File uploaded successfully',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/SuccessResponse' }
              }
            }
          },
          400: {
            description: 'No file or invalid upload',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' }
              }
            }
          }
        }
      }
    },
    '/media/uploads': {
      post: {
        tags: ['Media'],
        summary: 'Upload multiple files',
        requestBody: {
          required: true,
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                properties: {
                  files: {
                    type: 'array',
                    items: { type: 'string', format: 'binary' }
                  },
                  objectNames: {
                    type: 'string',
                    description: 'Optional JSON array of storage keys, in the same order as files.',
                    example: '["uploads/image-1.jpg","uploads/image-2.jpg"]'
                  }
                },
                required: ['files']
              }
            }
          }
        },
        parameters: [
          { name: 'bucket', in: 'query', required: false, schema: { type: 'string' } },
          { name: 'folder', in: 'query', required: false, schema: { type: 'string' } }
        ],
        responses: {
          201: {
            description: 'Files uploaded successfully',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/SuccessResponse' }
              }
            }
          }
        }
      }
    },
    '/media/uploads/{fileName}': {
      parameters: [
        { name: 'fileName', in: 'path', required: true, schema: { type: 'string' } },
        { name: 'bucket', in: 'query', required: false, schema: { type: 'string' } }
      ],
      get: {
        tags: ['Media'],
        summary: 'Get an uploaded file',
        description: 'Redirects to a temporary signed MinIO URL.',
        responses: {
          302: { description: 'Redirect to the signed file URL' },
          404: {
            description: 'Media not found',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' }
              }
            }
          }
        },
        delete: {
          tags: ['Media'],
          summary: 'Delete an uploaded file',
          responses: {
            200: {
              description: 'File deleted successfully',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/SuccessResponse' }
                }
              }
            },
            404: { description: 'Media not found' }
          }
        }
      }
    },
    '/media': {
      get: {
        tags: ['Media'],
        summary: 'List uploaded media objects',
        parameters: [
          { name: 'bucket', in: 'query', required: false, schema: { type: 'string' } },
          { name: 'prefix', in: 'query', required: false, schema: { type: 'string' } }
        ],
        responses: {
          200: {
            description: 'List media objects',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/SuccessResponse' }
              }
            }
          }
        }
      },
      delete: {
        tags: ['Media'],
        summary: 'Delete one or more uploaded files',
        parameters: [
          { name: 'bucket', in: 'query', required: false, schema: { type: 'string' } }
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['objectNames'],
                properties: {
                  objectNames: {
                    type: 'array',
                    minItems: 1,
                    items: { type: 'string' },
                    example: ['uploads/1794876452116-ti-xung.jpg']
                  }
                }
              }
            }
          }
        },
        responses: {
          200: {
            description: 'Per-file deletion results',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/SuccessResponse' }
              }
            }
          },
          400: {
            description: 'Invalid objectNames',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' }
              }
            }
          }
        }
      }
    },
    '/media/object': {
      post: {
        tags: ['Media'],
        summary: 'Upload files using specified object names (singular alias)',
        description: 'Alias for POST /media/objects. Upload files using matching objectNames.',
        parameters: [
          { name: 'bucket', in: 'query', required: false, schema: { type: 'string' } },
          {
            name: 'objectNames',
            in: 'query',
            required: false,
            style: 'form',
            explode: true,
            schema: { type: 'array', items: { type: 'string' } }
          },
          { name: 'id', in: 'query', required: false, schema: { type: 'string' } },
          { name: 'prefix', in: 'query', required: false, schema: { type: 'string' } }
        ],
        requestBody: {
          required: true,
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                required: ['files'],
                properties: {
                  files: {
                    type: 'array',
                    minItems: 1,
                    maxItems: 5,
                    items: { type: 'string', format: 'binary' }
                  },
                  objectNames: {
                    type: 'string',
                    description: 'Optional JSON array of object keys, in the same order as files.'
                  }
                }
              }
            }
          }
        },
        responses: {
          201: {
            description: 'Files uploaded using the specified object names',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/SuccessResponse' }
              }
            }
          },
          400: {
            description: 'Missing or invalid objectNames',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' }
              }
            }
          }
        }
      }
    },
    '/media/objects': {
      delete: {
        tags: ['Media'],
        summary: 'Delete media by object names',
        parameters: [
          {
            name: 'objectNames',
            in: 'query',
            required: false,
            style: 'form',
            explode: true,
            schema: { type: 'array', minItems: 1, items: { type: 'string' } },
            example: ['uploads/image-1.jpg', 'uploads/image-2.jpg']
          },
          { name: 'id', in: 'query', required: false, schema: { type: 'string' } },
          { name: 'prefix', in: 'query', required: false, schema: { type: 'string' } },
          { name: 'bucket', in: 'query', required: false, schema: { type: 'string' } }
        ],
        requestBody: {
          required: false,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  objectNames: {
                    type: 'array',
                    minItems: 1,
                    items: { type: 'string' }
                  }
                }
              }
            }
          }
        },
        responses: {
          200: {
            description: 'Per-object deletion results',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/SuccessResponse' }
              }
            }
          },
          400: {
            description: 'Invalid or missing objectNames',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' }
              }
            }
          }
        }
      },
      post: {
        tags: ['Media'],
        summary: 'Upload files using specified object names',
        description: 'Provide objectNames as a multipart JSON array or query parameters. For a single file, id and prefix query parameters are also accepted.',
        parameters: [
          { name: 'bucket', in: 'query', required: false, schema: { type: 'string' } },
          {
            name: 'objectNames',
            in: 'query',
            required: false,
            style: 'form',
            explode: true,
            schema: { type: 'array', items: { type: 'string' } }
          },
          { name: 'id', in: 'query', required: false, schema: { type: 'string' } },
          { name: 'prefix', in: 'query', required: false, schema: { type: 'string' } }
        ],
        requestBody: {
          required: true,
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                required: ['files'],
                properties: {
                  files: {
                    type: 'array',
                    minItems: 1,
                    maxItems: 5,
                    items: { type: 'string', format: 'binary' }
                  },
                  objectNames: {
                    type: 'string',
                    description: 'Optional JSON array of object keys, in the same order as files.',
                    example: '["uploads/image-1.jpg","uploads/image-2.jpg"]'
                  }
                }
              }
            }
          }
        },
        responses: {
          201: {
            description: 'Files uploaded using the specified object names',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/SuccessResponse' }
              }
            }
          },
          400: {
            description: 'Missing or invalid objectNames',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' }
              }
            }
          }
        }
      },
      get: {
        tags: ['Media'],
        summary: 'Get media metadata and signed URLs by object names',
        parameters: [
          {
            name: 'objectNames',
            in: 'query',
            required: true,
            style: 'form',
            explode: true,
            schema: {
              type: 'array',
              minItems: 1,
              items: { type: 'string' }
            },
            example: ['uploads/image-1.jpg', 'uploads/image-2.jpg']
          },
          { name: 'bucket', in: 'query', required: false, schema: { type: 'string' } }
        ],
        responses: {
          200: {
            description: 'Per-object metadata and signed URLs',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/SuccessResponse' }
              }
            }
          },
          400: {
            description: 'Invalid objectNames',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' }
              }
            }
          }
        }
      }
    },
    '/media/{id}': {
      parameters: [
        { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
        { name: 'bucket', in: 'query', required: false, schema: { type: 'string' } },
        { name: 'prefix', in: 'query', required: false, schema: { type: 'string' } }
      ],
      get: {
        tags: ['Media'],
        summary: 'Get media metadata by object key',
        responses: {
          200: {
            description: 'Media metadata returned',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/SuccessResponse' }
              }
            }
          },
          404: {
            description: 'Media not found',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' }
              }
            }
          }
        }
      },
      delete: {
        tags: ['Media'],
        summary: 'Delete media object',
        responses: {
          200: {
            description: 'Media deleted successfully',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/SuccessResponse' }
              }
            }
          },
          404: {
            description: 'Media was not found',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' }
              }
            }
          }
        }
      }
    }
  },
  components: {
    securitySchemes: {
      BearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT'
      }
    },
    schemas: {
      RegisterUserRequest: {
        type: 'object',
        required: ['name', 'email', 'password'],
        properties: {
          name: { type: 'string', minLength: 1, example: 'Demo User' },
          email: { type: 'string', format: 'email', example: 'demo@example.com' },
          password: { type: 'string', minLength: 8, format: 'password' }
        }
      },
      UserInput: {
        type: 'object',
        properties: {
          name: { type: 'string', example: 'Demo User' },
          email: { type: 'string', format: 'email', example: 'demo@example.com' },
          password: { type: 'string', minLength: 8, format: 'password' }
        },
        additionalProperties: true
      },
      SuccessResponse: {
        type: 'object',
        properties: {
          message: { type: 'string' },
          status: { type: 'integer' },
          code: { type: 'integer' },
          description: { type: 'string', nullable: true },
          timestamp: { type: 'string', format: 'date-time' },
          metadata: { type: 'object', additionalProperties: true },
          options: { type: 'object', additionalProperties: true }
        }
      },
      ErrorResponse: {
        type: 'object',
        properties: {
          status: { type: 'integer', example: 403 },
          code: { type: 'integer', example: 403000 },
          message: { type: 'string' },
          description: { type: 'string' },
          timestamp: { type: 'string', format: 'date-time' }
        }
      }
    }
  }
};

module.exports = swaggerDocs;
