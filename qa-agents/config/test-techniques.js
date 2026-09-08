/**
 * Test Design Techniques Configuration
 * Defines templates for EP, BVA, and Decision Table testing
 */

class TestTechniques {
  /**
   * Equivalence Partitioning
   * Divides input data into partitions (valid and invalid)
   */
  static generateEquivalencePartitions(parameter) {
    const partitions = {
      valid: [],
      invalid: []
    };

    const { type, schema, required } = parameter;

    // String type partitions
    if (type === 'string' || schema?.type === 'string') {
      const minLength = schema?.minLength || 1;
      const maxLength = schema?.maxLength || 255;
      const pattern = schema?.pattern;
      const enumValues = schema?.enum;

      if (enumValues) {
        partitions.valid.push({
          description: 'Valid enum value',
          value: enumValues[0],
          partition: 'Valid Enum'
        });
        partitions.invalid.push({
          description: 'Invalid enum value',
          value: 'INVALID_ENUM_VALUE',
          partition: 'Invalid Enum'
        });
      } else {
        partitions.valid.push({
          description: `Valid string (length: ${minLength}-${maxLength})`,
          value: 'A'.repeat(Math.min(10, maxLength)),
          partition: 'Valid String'
        });

        if (minLength > 0) {
          partitions.invalid.push({
            description: 'Empty string',
            value: '',
            partition: 'Empty String'
          });
        }

        if (maxLength) {
          partitions.invalid.push({
            description: `String exceeds max length (${maxLength + 10} chars)`,
            value: 'A'.repeat(maxLength + 10),
            partition: 'Too Long String'
          });
        }
      }
    }

    // Number/Integer type partitions
    if (type === 'integer' || type === 'number' || schema?.type === 'integer' || schema?.type === 'number') {
      const minimum = schema?.minimum || 0;
      const maximum = schema?.maximum || 1000000;

      partitions.valid.push({
        description: `Valid ${type} (${minimum}-${maximum})`,
        value: Math.floor((minimum + maximum) / 2),
        partition: 'Valid Number'
      });

      partitions.invalid.push(
        {
          description: 'Below minimum',
          value: minimum - 1,
          partition: 'Below Range'
        },
        {
          description: 'Above maximum',
          value: maximum + 1,
          partition: 'Above Range'
        }
      );

      if (type === 'integer') {
        partitions.invalid.push({
          description: 'Decimal value for integer',
          value: 12.34,
          partition: 'Invalid Type'
        });
      }
    }

    // Boolean type
    if (type === 'boolean' || schema?.type === 'boolean') {
      partitions.valid.push(
        { description: 'Boolean true', value: true, partition: 'Valid Boolean' },
        { description: 'Boolean false', value: false, partition: 'Valid Boolean' }
      );
      partitions.invalid.push({
        description: 'Non-boolean value',
        value: 'true',
        partition: 'Invalid Type'
      });
    }

    // Required/Optional partitions
    if (!required) {
      partitions.valid.push({
        description: 'Parameter omitted (optional)',
        value: null,
        partition: 'Omitted Optional'
      });
    } else {
      partitions.invalid.push({
        description: 'Required parameter missing',
        value: null,
        partition: 'Missing Required'
      });
    }

    return partitions;
  }

  /**
   * Boundary Value Analysis
   * Tests values at boundaries (min, max, min-1, max+1)
   */
  static generateBoundaryValues(parameter) {
    const boundaries = [];
    const { type, schema } = parameter;

    if (type === 'string' || schema?.type === 'string') {
      const minLength = schema?.minLength || 0;
      const maxLength = schema?.maxLength || 255;

      boundaries.push(
        {
          description: 'Minimum length',
          value: 'A'.repeat(minLength),
          boundary: 'Min'
        },
        {
          description: 'Minimum length - 1',
          value: minLength > 0 ? 'A'.repeat(Math.max(0, minLength - 1)) : '',
          boundary: 'Min-1'
        },
        {
          description: 'Maximum length',
          value: 'A'.repeat(maxLength),
          boundary: 'Max'
        },
        {
          description: 'Maximum length + 1',
          value: 'A'.repeat(maxLength + 1),
          boundary: 'Max+1'
        }
      );
    }

    if (type === 'integer' || type === 'number' || schema?.type === 'integer' || schema?.type === 'number') {
      const minimum = schema?.minimum !== undefined ? schema.minimum : 0;
      const maximum = schema?.maximum !== undefined ? schema.maximum : 1000000;

      boundaries.push(
        {
          description: 'Minimum value',
          value: minimum,
          boundary: 'Min'
        },
        {
          description: 'Minimum value - 1',
          value: minimum - 1,
          boundary: 'Min-1'
        },
        {
          description: 'Maximum value',
          value: maximum,
          boundary: 'Max'
        },
        {
          description: 'Maximum value + 1',
          value: maximum + 1,
          boundary: 'Max+1'
        }
      );
    }

    return boundaries;
  }

  /**
   * Decision Table Testing
   * Creates combinations of conditions and actions
   */
  static generateDecisionTable(endpoint) {
    const conditions = [];
    const rules = [];

    // Authentication condition
    if (endpoint.security && endpoint.security.length > 0) {
      conditions.push({
        name: 'Authentication',
        values: ['Valid Token', 'Invalid Token', 'No Token']
      });
    }

    // Required parameters condition
    const requiredParams = (endpoint.parameters || []).filter(p => p.required);
    if (requiredParams.length > 0) {
      conditions.push({
        name: 'Required Parameters',
        values: ['All Present', 'Some Missing', 'All Missing']
      });
    }

    // Request body condition
    if (endpoint.requestBody && endpoint.requestBody.required) {
      conditions.push({
        name: 'Request Body',
        values: ['Valid', 'Invalid Schema', 'Empty']
      });
    }

    // Generate decision rules (combinations)
    const generateCombinations = (conditions, current = {}, index = 0) => {
      if (index === conditions.length) {
        const expectedResponse = determineExpectedResponse(current, endpoint);
        rules.push({
          conditions: { ...current },
          expectedResponse
        });
        return;
      }

      const condition = conditions[index];
      for (const value of condition.values) {
        current[condition.name] = value;
        generateCombinations(conditions, current, index + 1);
      }
    };

    if (conditions.length > 0) {
      generateCombinations(conditions);
    }

    return { conditions, rules };
  }
}

function determineExpectedResponse(conditions, endpoint) {
  // Logic to determine expected status code based on conditions
  const hasInvalidAuth = conditions.Authentication === 'Invalid Token' || conditions.Authentication === 'No Token';
  const hasMissingParams = conditions['Required Parameters'] === 'Some Missing' || conditions['Required Parameters'] === 'All Missing';
  const hasInvalidBody = conditions['Request Body'] === 'Invalid Schema' || conditions['Request Body'] === 'Empty';

  if (hasInvalidAuth) return { statusCode: 401, description: 'Unauthorized' };
  if (hasMissingParams) return { statusCode: 400, description: 'Bad Request - Missing Parameters' };
  if (hasInvalidBody) return { statusCode: 400, description: 'Bad Request - Invalid Body' };

  return { statusCode: 200, description: 'Success' };
}

module.exports = TestTechniques;
