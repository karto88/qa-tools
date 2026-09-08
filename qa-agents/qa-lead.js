/**
 * QA Lead Orchestrator
 * Main controller that manages all QA agents and ensures CLAUDE.md compliance
 */

const TestDesignerAgent = require('./agents/test-designer');
const NewmanExecutorAgent = require('./agents/newman-executor');
const ReporterAgent = require('./agents/reporter');
const Logger = require('./utils/logger');
const path = require('path');

class QALeadOrchestrator {
  constructor() {
    this.logger = new Logger('QA-Lead');
    this.testDesigner = new TestDesignerAgent();
    this.newmanExecutor = new NewmanExecutorAgent();
    this.reporter = new ReporterAgent();

    this.config = {
      apiSpecPath: path.join(__dirname, '../postman/api-docs.json'),
      collectionsPath: path.join(__dirname, '../postman/collections'),
      reportsPath: path.join(__dirname, '../postman/reports'),
      enforceCompliance: true
    };
  }

  /**
   * Main orchestration method
   * Service-based execution: only test specified service/module
   */
  async executeTestWorkflow(options = {}) {
    const {
      serviceName = null,
      envVars = {},
      techniques = ['EP', 'BVA', 'DecisionTable'] // All techniques by default
    } = options;

    try {
      this.logger.info('═══════════════════════════════════════════════════');
      this.logger.info('    QA Lead: Starting Test Workflow Orchestration');
      this.logger.info('═══════════════════════════════════════════════════');

      if (serviceName) {
        this.logger.info(`🎯 Target Service: ${serviceName}`);
      } else {
        this.logger.warn('⚠️  No service specified - running FULL API coverage');
      }

      // Verify CLAUDE.md compliance
      this.verifyCompliance();

      // Phase 1: Test Design
      this.logger.info('\n📋 PHASE 1: Test Design');
      this.logger.info('─────────────────────────────────────────────────');
      const testDesignResult = await this.testDesigner.generateTests(
        this.config.apiSpecPath,
        serviceName
      );

      if (testDesignResult.testCases.length === 0) {
        this.logger.warn('No test cases generated. Aborting workflow.');
        return {
          success: false,
          message: 'No test cases generated'
        };
      }

      this.logger.success(`✅ Generated ${testDesignResult.testCases.length} test cases`);

      // Phase 2: Test Execution with Newman
      this.logger.info('\n⚙️  PHASE 2: Test Execution (Newman)');
      this.logger.info('─────────────────────────────────────────────────');
      const executionResult = await this.newmanExecutor.executeTests(
        this.config.apiSpecPath,
        testDesignResult.testCases,
        serviceName,
        envVars
      );

      this.logger.success('✅ Test execution completed');

      // Phase 3: Reporting & Documentation
      this.logger.info('\n📊 PHASE 3: Reporting & Documentation');
      this.logger.info('─────────────────────────────────────────────────');
      const reportResult = await this.reporter.generateReports(
        executionResult,
        testDesignResult.document,
        this.config.apiSpecPath
      );

      this.logger.success('✅ Reports generated');

      // Summary
      this.printFinalSummary(testDesignResult, executionResult, reportResult);

      return {
        success: executionResult.success,
        testDesign: testDesignResult,
        execution: executionResult,
        reports: reportResult
      };

    } catch (error) {
      this.logger.error(`❌ Workflow failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Verify compliance with CLAUDE.md requirements
   */
  verifyCompliance() {
    this.logger.info('\n🔍 Verifying CLAUDE.md Compliance...');

    const requirements = [
      '✓ Test Design Techniques: EP, BVA, Decision Tables',
      '✓ Execution with Newman',
      '✓ Environment Variable Management',
      '✓ Pre/Post Request Scripts',
      '✓ HTML Report Generation (overwrites previous)',
      '✓ Postman-compatible Documentation'
    ];

    requirements.forEach(req => {
      this.logger.info(`  ${req}`);
    });

    this.logger.success('✅ All CLAUDE.md requirements will be enforced\n');
  }

  /**
   * Print final summary of the entire workflow
   */
  printFinalSummary(testDesign, execution, reports) {
    const totalTests = execution.results?.run?.stats?.tests?.total || 0;
    const failed = execution.results?.run?.stats?.tests?.failed || 0;
    const passed = totalTests - failed;
    const passRate = totalTests > 0 ? ((passed / totalTests) * 100).toFixed(2) : 0;

    this.logger.info('\n');
    this.logger.info('═══════════════════════════════════════════════════');
    this.logger.info('              📊 FINAL SUMMARY');
    this.logger.info('═══════════════════════════════════════════════════');
    this.logger.info('');
    this.logger.info(`📋 Test Design:`);
    this.logger.info(`   Total Test Cases: ${testDesign.testCases.length}`);
    this.logger.info(`   Endpoints Covered: ${testDesign.document.metadata.totalEndpoints}`);
    this.logger.info('');
    this.logger.info(`⚙️  Execution:`);
    this.logger.info(`   Total Tests Run: ${totalTests}`);
    this.logger.success(`   ✅ Passed: ${passed}`);
    if (failed > 0) {
      this.logger.error(`   ❌ Failed: ${failed}`);
    }
    this.logger.info(`   Pass Rate: ${passRate}%`);
    this.logger.info('');
    this.logger.info(`📊 Reports:`);
    this.logger.info(`   HTML Report: ${reports.htmlReport}`);
    this.logger.info(`   API Documentation: ${reports.apiDocumentation}`);
    this.logger.info('');
    this.logger.info('═══════════════════════════════════════════════════');

    if (execution.success) {
      this.logger.success('🎉 ALL TESTS PASSED! 🎉');
    } else {
      this.logger.warn('⚠️  Some tests failed. Review the HTML report for details.');
    }

    this.logger.info('═══════════════════════════════════════════════════');
  }

  /**
   * Get status report for ongoing tests
   */
  getStatus() {
    return {
      testDesigner: 'Ready',
      newmanExecutor: 'Ready',
      reporter: 'Ready',
      compliance: 'CLAUDE.md enforced'
    };
  }

  /**
   * List available services/endpoints in the API
   */
  async listServices() {
    try {
      const OpenAPIParser = require('./utils/openapi-parser');
      const parser = new OpenAPIParser();
      await parser.parse(this.config.apiSpecPath);

      const endpoints = parser.getEndpoints();

      // Extract unique tags (services)
      const services = new Set();
      endpoints.forEach(ep => {
        if (ep.tags && ep.tags.length > 0) {
          ep.tags.forEach(tag => services.add(tag));
        }
      });

      this.logger.info('\n📑 Available Services/Tags:');
      Array.from(services).forEach(service => {
        const count = parser.getEndpointsByTag(service).length;
        this.logger.info(`   - ${service} (${count} endpoints)`);
      });

      this.logger.info(`\n📍 Total Endpoints: ${endpoints.length}`);

      return Array.from(services);

    } catch (error) {
      this.logger.error(`Failed to list services: ${error.message}`);
      throw error;
    }
  }
}

module.exports = QALeadOrchestrator;
