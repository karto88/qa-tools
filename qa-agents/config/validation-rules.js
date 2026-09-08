/**
 * Validation Rules Configuration
 * Defines validation rules for API responses
 */

class ValidationRules {
  /**
   * Generate validation script for Postman test
   */
  static generateValidationScript(endpoint, statusCode = '200') {
    const validations = [];

    // Status code validation
    validations.push(`// Validate Status Code`);
    validations.push(`pm.test("Status code is ${statusCode}", function () {`);
    validations.push(`    pm.response.to.have.status(${statusCode});`);
    validations.push(`});`);
    validations.push('');

    // Response time validation
    validations.push(`// Validate Response Time`);
    validations.push(`pm.test("Response time is less than 5000ms", function () {`);
    validations.push(`    pm.expect(pm.response.responseTime).to.be.below(5000);`);
    validations.push(`});`);
    validations.push('');

    // Content-Type validation
    validations.push(`// Validate Content-Type`);
    validations.push(`pm.test("Content-Type is application/json", function () {`);
    validations.push(`    pm.response.to.have.header("Content-Type");`);
    validations.push(`    pm.expect(pm.response.headers.get("Content-Type")).to.include("application/json");`);
    validations.push(`});`);
    validations.push('');

    // Response body exists
    if (statusCode === '200' || statusCode === '201') {
      validations.push(`// Validate Response Body Exists`);
      validations.push(`pm.test("Response has body", function () {`);
      validations.push(`    pm.response.to.have.body();`);
      validations.push(`});`);
      validations.push('');

      validations.push(`// Parse JSON Response`);
      validations.push(`let jsonData;`);
      validations.push(`try {`);
      validations.push(`    jsonData = pm.response.json();`);
      validations.push(`} catch (e) {`);
      validations.push(`    pm.test("Response is valid JSON", function () {`);
      validations.push(`        throw new Error("Response is not valid JSON");`);
      validations.push(`    });`);
      validations.push(`}`);
      validations.push('');
    }

    return validations.join('\n');
  }

  /**
   * Generate schema validation based on OpenAPI schema
   */
  static generateSchemaValidation(schema, fieldPath = 'jsonData') {
    if (!schema) return [];

    const validations = [];

    validations.push(`// Schema Validation`);
    validations.push(`pm.test("Response schema is valid", function () {`);

    // Validate type
    if (schema.type === 'object') {
      validations.push(`    pm.expect(${fieldPath}).to.be.an('object');`);

      // Validate required properties
      if (schema.required && schema.required.length > 0) {
        schema.required.forEach(prop => {
          validations.push(`    pm.expect(${fieldPath}).to.have.property('${prop}');`);
        });
      }

      // Validate property types
      if (schema.properties) {
        Object.entries(schema.properties).forEach(([key, propSchema]) => {
          const propPath = `${fieldPath}.${key}`;
          const jsType = this._mapOpenAPITypeToJS(propSchema.type);

          validations.push(`    if (${fieldPath}.hasOwnProperty('${key}')) {`);
          validations.push(`        pm.expect(${propPath}).to.be.a('${jsType}');`);

          // Additional validations based on type
          if (propSchema.type === 'string' && propSchema.enum) {
            validations.push(`        pm.expect(${propPath}).to.be.oneOf(${JSON.stringify(propSchema.enum)});`);
          }

          if (propSchema.type === 'number' || propSchema.type === 'integer') {
            if (propSchema.minimum !== undefined) {
              validations.push(`        pm.expect(${propPath}).to.be.at.least(${propSchema.minimum});`);
            }
            if (propSchema.maximum !== undefined) {
              validations.push(`        pm.expect(${propPath}).to.be.at.most(${propSchema.maximum});`);
            }
          }

          validations.push(`    }`);
        });
      }
    } else if (schema.type === 'array') {
      validations.push(`    pm.expect(${fieldPath}).to.be.an('array');`);
      if (schema.minItems) {
        validations.push(`    pm.expect(${fieldPath}.length).to.be.at.least(${schema.minItems});`);
      }
      if (schema.maxItems) {
        validations.push(`    pm.expect(${fieldPath}.length).to.be.at.most(${schema.maxItems});`);
      }
    }

    validations.push(`});`);

    return validations;
  }

  static _mapOpenAPITypeToJS(type) {
    const typeMap = {
      'string': 'string',
      'number': 'number',
      'integer': 'number',
      'boolean': 'boolean',
      'array': 'array',
      'object': 'object'
    };
    return typeMap[type] || 'undefined';
  }

  /**
   * Generate business logic validations
   */
  static generateBusinessLogicValidation(endpoint) {
    const validations = [];

    validations.push(`// Business Logic Validation`);

    // Example: For POST/PUT, validate that created/updated resource is returned
    if (endpoint.method === 'POST' || endpoint.method === 'PUT') {
      validations.push(`pm.test("Response contains resource data", function () {`);
      validations.push(`    pm.expect(jsonData).to.have.property('id');`);
      validations.push(`});`);
    }

    // Example: For DELETE, validate success message
    if (endpoint.method === 'DELETE') {
      validations.push(`pm.test("Delete operation confirmed", function () {`);
      validations.push(`    pm.expect(jsonData.success || pm.response.code === 204).to.be.true;`);
      validations.push(`});`);
    }

    return validations;
  }
}

module.exports = ValidationRules;
