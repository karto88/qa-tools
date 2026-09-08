#!/usr/bin/env node

/**
 * QA Agent System - Main Entry Point
 * CLI interface for running QA testing workflow
 */

const QALeadOrchestrator = require('./qa-lead');
const Logger = require('./utils/logger');

const logger = new Logger('Main');

// Parse command line arguments
const args = process.argv.slice(2);

function printUsage() {
  console.log(`
╔═══════════════════════════════════════════════════════════════╗
║                   QA Agent System v1.0                        ║
║           Automated API Testing with 4-Agent System           ║
╚═══════════════════════════════════════════════════════════════╝

Usage:
  node index.js [command] [options]

Commands:
  test [service]    Run tests for specified service (or all if not specified)
  list              List all available services/tags in the API
  status            Check system status
  help              Show this help message

Options:
  --service <name>  Specify service/module to test (e.g., "payment", "user")
  --env <file>      Load environment variables from JSON file
  --base-url <url>  Set base URL for API (default: from env or spec)
  --auth <token>    Set authorization token

Examples:
  # Run tests for all endpoints
  node index.js test

  # Run tests for specific service
  node index.js test --service payment

  # Run with custom environment
  node index.js test --service user --base-url https://api.example.com --auth "Bearer token123"

  # List available services
  node index.js list

Agent Architecture:
  1. QA Lead (Orchestrator) - Controls workflow and ensures compliance
  2. Test Designer - Generates test cases (EP, BVA, Decision Tables)
  3. Newman Executor & Validator - Runs tests and validates responses
  4. Reporter & Documentation - Generates HTML reports and API docs

Reports Location:
  postman/reports/
    ├── test-report.html          (Latest test execution report)
    ├── test-design.json          (Test case design document)
    ├── newman-results.json       (Raw Newman results)
    └── api-documentation.json    (Postman-compatible docs)

Collections Location:
  postman/collections/
    ├── [service]-tests.json      (Generated Postman collection)
    └── [service]-env.json        (Environment variables)
  `);
}

async function main() {
  const command = args[0];

  if (!command || command === 'help' || command === '--help' || command === '-h') {
    printUsage();
    return;
  }

  const qaLead = new QALeadOrchestrator();

  try {
    switch (command) {
      case 'test': {
        // Parse options
        const options = parseOptions(args.slice(1));

        logger.info('Starting QA workflow...');
        logger.info(`Service: ${options.serviceName || 'ALL'}`);

        const result = await qaLead.executeTestWorkflow({
          serviceName: options.serviceName,
          envVars: options.envVars
        });

        if (result.success) {
          logger.success('\n✅ All tests passed successfully!');
          process.exit(0);
        } else {
          logger.warn('\n⚠️  Some tests failed. Check reports for details.');
          process.exit(1);
        }
        break;
      }

      case 'list': {
        logger.info('Fetching available services...');
        const services = await qaLead.listServices();
        break;
      }

      case 'status': {
        logger.info('System Status:');
        const status = qaLead.getStatus();
        console.log(JSON.stringify(status, null, 2));
        break;
      }

      default:
        logger.error(`Unknown command: ${command}`);
        printUsage();
        process.exit(1);
    }

  } catch (error) {
    logger.error(`\n❌ Fatal error: ${error.message}`);
    console.error(error);
    process.exit(1);
  }
}

function parseOptions(args) {
  const options = {
    serviceName: null,
    envVars: {}
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    switch (arg) {
      case '--service':
        options.serviceName = args[++i];
        break;

      case '--base-url':
        options.envVars.baseUrl = args[++i];
        break;

      case '--auth':
        options.envVars.authToken = args[++i];
        break;

      case '--env':
        const envFile = args[++i];
        try {
          const envData = require(envFile);
          options.envVars = { ...options.envVars, ...envData };
        } catch (error) {
          logger.error(`Failed to load environment file: ${envFile}`);
        }
        break;
    }
  }

  return options;
}

// Run main function
if (require.main === module) {
  main().catch(error => {
    console.error('Unhandled error:', error);
    process.exit(1);
  });
}

module.exports = QALeadOrchestrator;
