/**
 * Test Designer Agent
 * Analyzes OpenAPI spec and generates test cases using:
 * - Equivalence Partitioning (EP)
 * - Boundary Value Analysis (BVA)
 * - Decision Table Testing
 */

const OpenAPIParser = require('../utils/openapi-parser');
const TestTechniques = require('../config/test-techniques');
const Logger = require('../utils/logger');
const fs = require('fs').promises;
const path = require('path');

class TestDesignerAgent {
  constructor() {
    this.logger = new Logger('TestDesigner');
    this.parser = new OpenAPIParser();
    this.testCases = [];
  }

  /**
   * Main entry point: Generate tests for a specific service
   */
  async generateTests(apiSpecPath, serviceName = null) {
    try {
      this.logger.info('Starting test case generation...');

      // Step 1: Parse OpenAPI spec
      await this.parser.parse(apiSpecPath);

      // Step 2: Get endpoints (filtered by service if specified)
      const endpoints = serviceName
        ? this.parser.getEndpointsByService(serviceName)
        : this.parser.getEndpoints();

      if (endpoints.length === 0) {
        this.logger.warn(`No endpoints found${serviceName ? ` for service: ${serviceName}` : ''}`);
        return { testCases: [], checklist: [] };
      }

      this.logger.info(`Generating tests for ${endpoints.length} endpoints`);

      // Step 3: Generate test cases for each endpoint
      const checklist = [];
      for (const endpoint of endpoints) {
        this.logger.step(endpoints.indexOf(endpoint) + 1, `Processing ${endpoint.method} ${endpoint.path}`);

        const endpointTests = await this.generateEndpointTests(endpoint);
        this.testCases.push(...endpointTests.cases);
        checklist.push(endpointTests.checklist);
      }

      // Step 4: Save test design document
      const testDesignDoc = this.createTestDesignDocument(endpoints, checklist);
      const outputPath = path.join(__dirname, '../../postman/reports/test-design.json');
      await fs.writeFile(outputPath, JSON.stringify(testDesignDoc, null, 2));

      this.logger.success(`Generated ${this.testCases.length} test cases`);
      this.logger.success(`Test design document saved: ${outputPath}`);

      return {
        testCases: this.testCases,
        checklist,
        document: testDesignDoc
      };

    } catch (error) {
      this.logger.error(`Test generation failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Generate test cases for a single endpoint using all techniques
   */
  async generateEndpointTests(endpoint) {
    const cases = [];
    const checklist = {
      endpoint: `${endpoint.method} ${endpoint.path}`,
      operationId: endpoint.operationId,
      techniques: {}
    };

    // Technique 1: Equivalence Partitioning
    this.logger.debug('Applying Equivalence Partitioning...');
    const epTests = this.applyEquivalencePartitioning(endpoint);
    cases.push(...epTests);
    checklist.techniques.equivalencePartitioning = {
      count: epTests.length,
      scenarios: epTests.map(t => t.scenario)
    };

    // Technique 2: Boundary Value Analysis
    this.logger.debug('Applying Boundary Value Analysis...');
    const bvaTests = this.applyBoundaryValueAnalysis(endpoint);
    cases.push(...bvaTests);
    checklist.techniques.boundaryValueAnalysis = {
      count: bvaTests.length,
      scenarios: bvaTests.map(t => t.scenario)
    };

    // Technique 3: Decision Table Testing
    this.logger.debug('Applying Decision Table Testing...');
    const dtTests = this.applyDecisionTableTesting(endpoint);
    cases.push(...dtTests);
    checklist.techniques.decisionTableTesting = {
      count: dtTests.length,
      scenarios: dtTests.map(t => t.scenario)
    };

    return { cases, checklist };
  }

  /**
   * Equivalence Partitioning: Generate test cases for valid/invalid partitions
   */
  applyEquivalencePartitioning(endpoint) {
    const tests = [];
    const allParameters = [
      ...(endpoint.parameters || []),
      ...this.extractBodyParameters(endpoint)
    ];

    allParameters.forEach(param => {
      const partitions = TestTechniques.generateEquivalencePartitions(param);

      // Valid partition tests
      partitions.valid.forEach(partition => {
        tests.push({
          technique: 'Equivalence Partitioning',
          endpoint: `${endpoint.method} ${endpoint.path}`,
          scenario: `${param.name} - ${partition.description}`,
          parameter: param.name,
          partition: partition.partition,
          testData: partition.value,
          expectedResult: 'Valid - 200 OK'
        });
      });

      // Invalid partition tests
      partitions.invalid.forEach(partition => {
        tests.push({
          technique: 'Equivalence Partitioning',
          endpoint: `${endpoint.method} ${endpoint.path}`,
          scenario: `${param.name} - ${partition.description}`,
          parameter: param.name,
          partition: partition.partition,
          testData: partition.value,
          expectedResult: 'Invalid - 400 Bad Request'
        });
      });
    });

    return tests;
  }

  /**
   * Boundary Value Analysis: Generate test cases for boundary values
   */
  applyBoundaryValueAnalysis(endpoint) {
    const tests = [];
    const allParameters = [
      ...(endpoint.parameters || []),
      ...this.extractBodyParameters(endpoint)
    ];

    allParameters.forEach(param => {
      const boundaries = TestTechniques.generateBoundaryValues(param);

      boundaries.forEach(boundary => {
        const isValid = boundary.boundary === 'Min' || boundary.boundary === 'Max';
        tests.push({
          technique: 'Boundary Value Analysis',
          endpoint: `${endpoint.method} ${endpoint.path}`,
          scenario: `${param.name} - ${boundary.description}`,
          parameter: param.name,
          boundary: boundary.boundary,
          testData: boundary.value,
          expectedResult: isValid ? 'Valid - 200 OK' : 'Invalid - 400 Bad Request'
        });
      });
    });

    return tests;
  }

  /**
   * Decision Table Testing: Generate test cases for condition combinations
   */
  applyDecisionTableTesting(endpoint) {
    const tests = [];
    const decisionTable = TestTechniques.generateDecisionTable(endpoint);

    decisionTable.rules.forEach((rule, index) => {
      const conditionStr = Object.entries(rule.conditions)
        .map(([key, value]) => `${key}: ${value}`)
        .join(', ');

      tests.push({
        technique: 'Decision Table Testing',
        endpoint: `${endpoint.method} ${endpoint.path}`,
        scenario: `Rule ${index + 1}: ${conditionStr}`,
        conditions: rule.conditions,
        expectedResult: `${rule.expectedResponse.statusCode} - ${rule.expectedResponse.description}`
      });
    });

    return tests;
  }

  /**
   * Extract parameters from request body schema
   */
  extractBodyParameters(endpoint) {
    const bodySchema = this.parser.getRequestBodySchema(endpoint);
    if (!bodySchema || !bodySchema.properties) return [];

    return Object.entries(bodySchema.properties).map(([name, schema]) => ({
      name,
      in: 'body',
      required: bodySchema.required?.includes(name) || false,
      schema,
      type: schema.type
    }));
  }

  /**
   * Create test design document
   */
  createTestDesignDocument(endpoints, checklists) {
    return {
      metadata: {
        generatedAt: new Date().toISOString(),
        totalEndpoints: endpoints.length,
        totalTestCases: this.testCases.length,
        techniques: ['Equivalence Partitioning', 'Boundary Value Analysis', 'Decision Table Testing']
      },
      endpoints: endpoints.map((ep, idx) => ({
        method: ep.method,
        path: ep.path,
        operationId: ep.operationId,
        summary: ep.summary,
        checklist: checklists[idx]
      })),
      testCases: this.testCases
    };
  }
}

module.exports = TestDesignerAgent;
