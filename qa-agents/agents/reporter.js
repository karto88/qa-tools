/**
 * Reporter & Documentation Agent
 * Generates HTML reports and Postman-compatible API documentation
 */

const Logger = require('../utils/logger');
const fs = require('fs').promises;
const path = require('path');

class ReporterAgent {
  constructor() {
    this.logger = new Logger('Reporter');
  }

  /**
   * Main entry point: Generate reports and documentation
   */
  async generateReports(testResults, testDesign, apiSpec) {
    try {
      this.logger.info('Starting report generation...');

      const reportData = {
        ...testResults,
        testDesign,
        generatedAt: new Date().toISOString()
      };

      // Step 1: Generate HTML Report
      this.logger.step(1, 'Generating HTML test report...');
      const htmlReportPath = await this.generateHTMLReport(reportData);

      // Step 2: Generate API Documentation
      this.logger.step(2, 'Generating Postman-compatible API documentation...');
      const docPath = await this.generateAPIDocumentation(apiSpec, testResults);

      this.logger.success('All reports generated successfully');

      return {
        htmlReport: htmlReportPath,
        apiDocumentation: docPath
      };

    } catch (error) {
      this.logger.error(`Report generation failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Generate HTML Test Report (overwrites previous)
   */
  async generateHTMLReport(reportData) {
    const reportPath = path.join(__dirname, '../../postman/reports/test-report.html');

    const html = this.buildHTMLReport(reportData);

    await fs.writeFile(reportPath, html);
    this.logger.success(`HTML report saved: ${reportPath}`);

    return reportPath;
  }

  /**
   * Build HTML content for test report
   */
  buildHTMLReport(data) {
    const summary = data.results?.summary || data.summary;
    const testDesign = data.testDesign;

    const totalTests = summary?.run?.stats?.tests?.total || 0;
    const passedTests = totalTests - (summary?.run?.stats?.tests?.failed || 0);
    const failedTests = summary?.run?.stats?.tests?.failed || 0;
    const passRate = totalTests > 0 ? ((passedTests / totalTests) * 100).toFixed(2) : 0;

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>API Test Report</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            background: #f5f7fa;
            padding: 20px;
            color: #2c3e50;
        }

        .container {
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            border-radius: 12px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            overflow: hidden;
        }

        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            text-align: center;
        }

        .header h1 {
            font-size: 2.5em;
            margin-bottom: 10px;
        }

        .header .timestamp {
            opacity: 0.9;
            font-size: 0.9em;
        }

        .summary {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            padding: 30px;
            background: #f8f9fa;
        }

        .stat-card {
            background: white;
            padding: 20px;
            border-radius: 8px;
            text-align: center;
            border-left: 4px solid #667eea;
            box-shadow: 0 2px 4px rgba(0,0,0,0.05);
        }

        .stat-card.success {
            border-left-color: #10b981;
        }

        .stat-card.failed {
            border-left-color: #ef4444;
        }

        .stat-card.rate {
            border-left-color: #f59e0b;
        }

        .stat-card .value {
            font-size: 3em;
            font-weight: bold;
            margin: 10px 0;
        }

        .stat-card.success .value {
            color: #10b981;
        }

        .stat-card.failed .value {
            color: #ef4444;
        }

        .stat-card.rate .value {
            color: #f59e0b;
        }

        .stat-card .label {
            color: #6b7280;
            text-transform: uppercase;
            font-size: 0.85em;
            letter-spacing: 1px;
        }

        .section {
            padding: 30px;
            border-top: 1px solid #e5e7eb;
        }

        .section h2 {
            color: #1f2937;
            margin-bottom: 20px;
            font-size: 1.5em;
            display: flex;
            align-items: center;
        }

        .section h2::before {
            content: '';
            width: 4px;
            height: 24px;
            background: #667eea;
            margin-right: 12px;
            border-radius: 2px;
        }

        .test-case {
            background: #f9fafb;
            padding: 15px;
            margin-bottom: 10px;
            border-radius: 6px;
            border-left: 4px solid #e5e7eb;
        }

        .test-case.passed {
            border-left-color: #10b981;
            background: #f0fdf4;
        }

        .test-case.failed {
            border-left-color: #ef4444;
            background: #fef2f2;
        }

        .test-case .name {
            font-weight: 600;
            margin-bottom: 5px;
            color: #1f2937;
        }

        .test-case .technique {
            display: inline-block;
            background: #667eea;
            color: white;
            padding: 3px 10px;
            border-radius: 12px;
            font-size: 0.75em;
            margin-right: 8px;
        }

        .badge {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 12px;
            font-size: 0.8em;
            font-weight: 600;
        }

        .badge.success {
            background: #d1fae5;
            color: #065f46;
        }

        .badge.error {
            background: #fee2e2;
            color: #991b1b;
        }

        table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 15px;
        }

        th, td {
            padding: 12px;
            text-align: left;
            border-bottom: 1px solid #e5e7eb;
        }

        th {
            background: #f9fafb;
            font-weight: 600;
            color: #374151;
        }

        tr:hover {
            background: #f9fafb;
        }

        .footer {
            text-align: center;
            padding: 20px;
            background: #f9fafb;
            color: #6b7280;
            font-size: 0.9em;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🧪 API Test Report</h1>
            <div class="timestamp">Generated: ${new Date(data.generatedAt).toLocaleString()}</div>
        </div>

        <div class="summary">
            <div class="stat-card">
                <div class="label">Total Tests</div>
                <div class="value">${totalTests}</div>
            </div>
            <div class="stat-card success">
                <div class="label">Passed</div>
                <div class="value">${passedTests}</div>
            </div>
            <div class="stat-card failed">
                <div class="label">Failed</div>
                <div class="value">${failedTests}</div>
            </div>
            <div class="stat-card rate">
                <div class="label">Pass Rate</div>
                <div class="value">${passRate}%</div>
            </div>
        </div>

        ${this.buildTestDesignSection(testDesign)}

        ${this.buildTestResultsSection(summary)}

        <div class="footer">
            <p>Report generated by QA Agent System | ${new Date().getFullYear()}</p>
        </div>
    </div>
</body>
</html>`;
  }

  /**
   * Build Test Design section
   */
  buildTestDesignSection(testDesign) {
    if (!testDesign || !testDesign.testCases) return '';

    const groupedByTechnique = {};
    testDesign.testCases.forEach(tc => {
      if (!groupedByTechnique[tc.technique]) {
        groupedByTechnique[tc.technique] = [];
      }
      groupedByTechnique[tc.technique].push(tc);
    });

    const techniqueRows = Object.entries(groupedByTechnique)
      .map(([technique, cases]) => `
        <tr>
          <td><strong>${technique}</strong></td>
          <td>${cases.length}</td>
        </tr>
      `).join('');

    return `
      <div class="section">
        <h2>Test Design Summary</h2>
        <table>
          <thead>
            <tr>
              <th>Test Technique</th>
              <th>Test Cases</th>
            </tr>
          </thead>
          <tbody>
            ${techniqueRows}
          </tbody>
        </table>
      </div>
    `;
  }

  /**
   * Build Test Results section
   */
  buildTestResultsSection(summary) {
    if (!summary || !summary.run) return '';

    const failures = summary.run.failures || [];
    const executions = summary.run.executions || [];

    const failuresList = failures.length > 0 ? failures.map(f => `
      <div class="test-case failed">
        <div class="name">❌ ${f.source?.name || 'Unknown Test'}</div>
        <div style="margin-top: 8px; color: #991b1b; font-size: 0.9em;">
          ${f.error?.message || 'Unknown error'}
        </div>
      </div>
    `).join('') : '<p style="color: #10b981;">✅ All tests passed!</p>';

    return `
      <div class="section">
        <h2>Execution Results</h2>
        ${failuresList}
      </div>
    `;
  }

  /**
   * Generate Postman-compatible API Documentation
   */
  async generateAPIDocumentation(apiSpec, testResults) {
    const docPath = path.join(__dirname, '../../postman/reports/api-documentation.json');

    // Read the collection if it exists
    const collectionPath = testResults.collection;
    let collection = null;

    if (collectionPath) {
      try {
        const collectionData = await fs.readFile(collectionPath, 'utf-8');
        collection = JSON.parse(collectionData);
      } catch (error) {
        this.logger.warn('Could not read collection file');
      }
    }

    const documentation = {
      info: {
        name: 'API Documentation',
        description: 'Auto-generated API documentation from OpenAPI spec and test results',
        version: '1.0.0',
        schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json'
      },
      item: collection?.item || [],
      event: [],
      variable: []
    };

    await fs.writeFile(docPath, JSON.stringify(documentation, null, 2));
    this.logger.success(`API documentation saved: ${docPath}`);

    return docPath;
  }

  /**
   * Generate summary JSON report
   */
  async generateSummaryJSON(data) {
    const summaryPath = path.join(__dirname, '../../postman/reports/summary.json');

    const summary = {
      generatedAt: new Date().toISOString(),
      execution: {
        totalTests: data.results?.summary?.run?.stats?.tests?.total || 0,
        passed: (data.results?.summary?.run?.stats?.tests?.total || 0) - (data.results?.summary?.run?.stats?.tests?.failed || 0),
        failed: data.results?.summary?.run?.stats?.tests?.failed || 0,
        passRate: 0
      },
      design: {
        totalTestCases: data.testDesign?.testCases?.length || 0,
        techniques: data.testDesign?.metadata?.techniques || []
      }
    };

    summary.execution.passRate = summary.execution.totalTests > 0
      ? ((summary.execution.passed / summary.execution.totalTests) * 100).toFixed(2)
      : 0;

    await fs.writeFile(summaryPath, JSON.stringify(summary, null, 2));
    this.logger.success(`Summary JSON saved: ${summaryPath}`);

    return summaryPath;
  }
}

module.exports = ReporterAgent;
