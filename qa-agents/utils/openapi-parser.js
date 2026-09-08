/**
 * OpenAPI Parser Utility
 * Parses OpenAPI 3.1.0 specification and extracts endpoints, schemas, parameters
 */

const SwaggerParser = require('@apidevtools/swagger-parser');
const Logger = require('./logger');

class OpenAPIParser {
  constructor() {
    this.logger = new Logger('OpenAPIParser');
    this.api = null;
  }

  async parse(filePath) {
    try {
      this.logger.info(`Parsing OpenAPI spec: ${filePath}`);
      this.api = await SwaggerParser.validate(filePath);
      this.logger.success('OpenAPI spec parsed and validated successfully');
      return this.api;
    } catch (error) {
      this.logger.error(`Failed to parse OpenAPI spec: ${error.message}`);
      throw error;
    }
  }

  getEndpoints() {
    if (!this.api) {
      throw new Error('API not parsed yet. Call parse() first.');
    }

    const endpoints = [];
    const paths = this.api.paths || {};

    for (const [path, pathItem] of Object.entries(paths)) {
      for (const [method, operation] of Object.entries(pathItem)) {
        if (['get', 'post', 'put', 'patch', 'delete'].includes(method.toLowerCase())) {
          endpoints.push({
            path,
            method: method.toUpperCase(),
            operationId: operation.operationId,
            summary: operation.summary,
            description: operation.description,
            parameters: operation.parameters || [],
            requestBody: operation.requestBody,
            responses: operation.responses,
            tags: operation.tags || [],
            security: operation.security
          });
        }
      }
    }

    this.logger.info(`Found ${endpoints.length} endpoints`);
    return endpoints;
  }

  getSchemas() {
    if (!this.api) {
      throw new Error('API not parsed yet. Call parse() first.');
    }

    return this.api.components?.schemas || {};
  }

  getEndpointsByTag(tag) {
    return this.getEndpoints().filter(ep => ep.tags.includes(tag));
  }

  getEndpointsByService(serviceName) {
    // Filter endpoints by path prefix or tag
    const endpoints = this.getEndpoints();
    return endpoints.filter(ep =>
      ep.path.includes(serviceName) ||
      ep.tags.some(tag => tag.toLowerCase().includes(serviceName.toLowerCase()))
    );
  }

  extractPathParameters(endpoint) {
    return (endpoint.parameters || []).filter(p => p.in === 'path');
  }

  extractQueryParameters(endpoint) {
    return (endpoint.parameters || []).filter(p => p.in === 'query');
  }

  extractHeaderParameters(endpoint) {
    return (endpoint.parameters || []).filter(p => p.in === 'header');
  }

  getRequestBodySchema(endpoint) {
    if (!endpoint.requestBody) return null;

    const content = endpoint.requestBody.content;
    if (content && content['application/json']) {
      return content['application/json'].schema;
    }
    return null;
  }

  getResponseSchema(endpoint, statusCode = '200') {
    const response = endpoint.responses[statusCode];
    if (!response) return null;

    const content = response.content;
    if (content && content['application/json']) {
      return content['application/json'].schema;
    }
    return null;
  }
}

module.exports = OpenAPIParser;
