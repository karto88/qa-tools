/**
 * Newman Executor & Validator Agent
 * Runs Postman collections with Newman and validates API responses
 */

const newman = require('newman');
const { Collection, Item, Request } = require('postman-collection');
const Logger = require('../utils/logger');
const ValidationRules = require('../config/validation-rules');
const OpenAPIParser = require('../utils/openapi-parser');
const fs = require('fs').promises;
const path = require('path');

class NewmanExecutorAgent {
  constructor() {
    this.logger = new Logger('NewmanExecutor');
    this.parser = new OpenAPIParser();
    this.results = null;
  }

  /**
   * Main entry point: Execute tests for service endpoints
   */
  async executeTests(apiSpecPath, testCases, serviceName = null, envVars = {}) {
    try {
      this.logger.info('Starting test execution with Newman...');

      // Step 1: Parse OpenAPI spec
      await this.parser.parse(apiSpecPath);

      // Step 2: Get endpoints
      const endpoints = serviceName
        ? this.parser.getEndpointsByService(serviceName)
        : this.parser.getEndpoints();

      if (endpoints.length === 0) {
        this.logger.warn(`No endpoints found${serviceName ? ` for service: ${serviceName}` : ''}`);
        return { success: false, results: [] };
      }

      // Step 3: Generate Postman collection
      this.logger.step(1, 'Generating Postman collection...');
      const collection = await this.generatePostmanCollection(endpoints, testCases);

      // Step 4: Save collection
      const collectionPath = path.join(__dirname, '../../postman/collections', `${serviceName || 'api'}-tests.json`);
      await fs.writeFile(collectionPath, JSON.stringify(collection.toJSON(), null, 2));
      this.logger.success(`Collection saved: ${collectionPath}`);

      // Step 5: Prepare environment
      const environment = this.prepareEnvironment(envVars);
      const envPath = path.join(__dirname, '../../postman/collections', `${serviceName || 'api'}-env.json`);
      await fs.writeFile(envPath, JSON.stringify(environment, null, 2));

      // Step 6: Run Newman
      this.logger.step(2, 'Executing tests with Newman...');
      const results = await this.runNewman(collectionPath, envPath);

      this.results = results;
      return {
        success: results.summary.run.failures.length === 0,
        results: results.summary,
        collection: collectionPath,
        environment: envPath
      };

    } catch (error) {
      this.logger.error(`Test execution failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Generate Postman Collection from endpoints and test cases
   */
  async generatePostmanCollection(endpoints, testCases) {
    const collection = new Collection({
      info: {
        name: 'API Test Collection',
        description: 'Auto-generated from OpenAPI spec with comprehensive test coverage',
        schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json'
      }
    });

    for (const endpoint of endpoints) {
      this.logger.debug(`Creating requests for ${endpoint.method} ${endpoint.path}`);

      // Group test cases by endpoint
      const endpointTestCases = testCases.filter(tc =>
        tc.endpoint === `${endpoint.method} ${endpoint.path}`
      );

      // Create folder for endpoint
      const folder = {
        name: `${endpoint.method} ${endpoint.path}`,
        description: endpoint.summary || endpoint.description,
        item: []
      };

      // Generate requests for each test case
      for (const testCase of endpointTestCases) {
        const request = this.createPostmanRequest(endpoint, testCase);
        folder.item.push(request);
      }

      // Add happy path test if no test cases exist
      if (folder.item.length === 0) {
        const happyPathRequest = this.createPostmanRequest(endpoint, {
          scenario: 'Happy Path - Valid Request',
          expectedResult: 'Valid - 200 OK'
        });
        folder.item.push(happyPathRequest);
      }

      collection.items.add(folder);
    }

    return collection;
  }

  /**
   * Create individual Postman request with validation scripts
   */
  createPostmanRequest(endpoint, testCase) {
    const url = this.buildURL(endpoint, testCase);
    const headers = this.buildHeaders(endpoint);
    const body = this.buildRequestBody(endpoint, testCase);

    // Pre-request script (for auth, setup, etc.)
    const preRequestScript = this.generatePreRequestScript(endpoint);

    // Post-response validation script
    const testScript = this.generateTestScript(endpoint, testCase);

    const item = new Item({
      name: testCase.scenario || `${endpoint.method} ${endpoint.path}`,
      request: {
        method: endpoint.method,
        url: url,
        header: headers,
        body: body ? {
          mode: 'raw',
          raw: JSON.stringify(body, null, 2),
          options: {
            raw: { language: 'json' }
          }
        } : undefined
      },
      event: [
        {
          listen: 'prerequest',
          script: {
            type: 'text/javascript',
            exec: preRequestScript.split('\n')
          }
        },
        {
          listen: 'test',
          script: {
            type: 'text/javascript',
            exec: testScript.split('\n')
          }
        }
      ]
    });

    return item;
  }

  /**
   * Build URL with path and query parameters
   */
  buildURL(endpoint, testCase) {
    let url = `{{baseUrl}}${endpoint.path}`;

    // Replace path parameters
    const pathParams = this.parser.extractPathParameters(endpoint);
    pathParams.forEach(param => {
      const value = testCase.testData || `{{${param.name}}}`;
      url = url.replace(`{${param.name}}`, value);
    });

    // Add query parameters
    const queryParams = this.parser.extractQueryParameters(endpoint);
    if (queryParams.length > 0) {
      const queryString = queryParams
        .map(param => `${param.name}={{${param.name}}}`)
        .join('&');
      url += `?${queryString}`;
    }

    return url;
  }

  /**
   * Build request headers
   */
  buildHeaders(endpoint) {
    const headers = [
      { key: 'Content-Type', value: 'application/json' },
      { key: 'Accept', value: 'application/json' }
    ];

    // Add authorization if required
    if (endpoint.security && endpoint.security.length > 0) {
      headers.push({ key: 'Authorization', value: '{{authToken}}' });
    }

    // Add custom headers from spec
    const headerParams = this.parser.extractHeaderParameters(endpoint);
    headerParams.forEach(param => {
      headers.push({ key: param.name, value: `{{${param.name}}}` });
    });

    return headers;
  }

  /**
   * Build request body
   */
  buildRequestBody(endpoint, testCase) {
    if (!endpoint.requestBody) return null;

    const schema = this.parser.getRequestBodySchema(endpoint);
    if (!schema || !schema.properties) return {};

    const body = {};

    // Build body from schema
    Object.entries(schema.properties).forEach(([key, propSchema]) => {
      if (testCase.parameter === key && testCase.testData !== undefined) {
        body[key] = testCase.testData;
      } else {
        body[key] = this.generateSampleValue(propSchema);
      }
    });

    return body;
  }

  /**
   * Generate sample value based on schema type
   */
  generateSampleValue(schema) {
    if (schema.example) return schema.example;
    if (schema.default) return schema.default;

    switch (schema.type) {
      case 'string':
        return schema.enum ? schema.enum[0] : 'sample-string';
      case 'integer':
        return schema.minimum || 1;
      case 'number':
        return schema.minimum || 1.0;
      case 'boolean':
        return true;
      case 'array':
        return [];
      case 'object':
        return {};
      default:
        return null;
    }
  }

  /**
   * Generate pre-request script for authentication and setup
   */
  generatePreRequestScript(endpoint) {
    const script = [];

    script.push('// Pre-request Script');
    script.push('');
    script.push('// Set dynamic timestamp');
    script.push('pm.environment.set("timestamp", new Date().getTime());');
    script.push('');

    // Authentication setup
    if (endpoint.security && endpoint.security.length > 0) {
      script.push('// Authentication check');
      script.push('if (!pm.environment.get("authToken")) {');
      script.push('    console.warn("No auth token found. Tests may fail.");');
      script.push('}');
      script.push('');
    }

    return script.join('\n');
  }

  /**
   * Generate test/validation script
   */
  generateTestScript(endpoint, testCase) {
    const scripts = [];

    // Basic validations
    const basicValidation = ValidationRules.generateValidationScript(endpoint);
    scripts.push(basicValidation);

    // Schema validation
    const responseSchema = this.parser.getResponseSchema(endpoint);
    if (responseSchema) {
      const schemaValidation = ValidationRules.generateSchemaValidation(responseSchema);
      scripts.push(schemaValidation.join('\n'));
    }

    // Business logic validation
    const businessValidation = ValidationRules.generateBusinessLogicValidation(endpoint);
    scripts.push(businessValidation.join('\n'));

    return scripts.join('\n\n');
  }

  /**
   * Prepare environment variables
   */
  prepareEnvironment(customVars = {}) {
    return {
      name: 'API Test Environment',
      values: [
        { key: 'baseUrl', value: customVars.baseUrl || 'https://api.example.com', enabled: true },
        { key: 'authToken', value: customVars.authToken || '', enabled: true },
        { key: 'timestamp', value: '', enabled: true },
        ...Object.entries(customVars)
          .filter(([key]) => !['baseUrl', 'authToken'].includes(key))
          .map(([key, value]) => ({ key, value, enabled: true }))
      ]
    };
  }

  /**
   * Run Newman with collection and environment
   */
  async runNewman(collectionPath, envPath) {
    return new Promise((resolve, reject) => {
      newman.run({
        collection: collectionPath,
        environment: envPath,
        reporters: ['cli', 'json'],
        reporter: {
          json: {
            export: path.join(__dirname, '../../postman/reports/newman-results.json')
          }
        },
        insecure: true, // Allow self-signed certificates
        timeout: 30000,
        timeoutRequest: 10000
      }, (err, summary) => {
        if (err) {
          this.logger.error(`Newman run failed: ${err.message}`);
          return reject(err);
        }

        const { stats } = summary.run;
        this.logger.success(`Tests completed: ${stats.tests.total} total`);
        this.logger.info(`Passed: ${stats.tests.total - stats.tests.failed}`);
        if (stats.tests.failed > 0) {
          this.logger.warn(`Failed: ${stats.tests.failed}`);
        }

        resolve(summary);
      });
    });
  }
}

module.exports = NewmanExecutorAgent;
