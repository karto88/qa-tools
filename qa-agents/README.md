# QA Agents - Automated API Testing

Multi-agent system for OpenAPI 3.1.0 testing automation.

## Quick Start

```bash
# Run all tests
node index.js test

# Run specific service
node index.js test --service payment

# List available services
node index.js list
```

## Documentation

Full documentation available in `/docs/qa-agents/`:
- [Complete Guide](../docs/qa-agents/README.md)
- [Quick Start Tutorial](../docs/qa-agents/QUICKSTART.md)

## Agents

1. **QA Lead** - Orchestrator (qa-lead.js)
2. **Test Designer** - Test case generator (agents/test-designer.js)
3. **Newman Executor** - Test runner & validator (agents/newman-executor.js)
4. **Reporter** - HTML reports & documentation (agents/reporter.js)

## Output

All test results and reports are saved to `../postman/reports/`:
- `test-report.html` - Main HTML report
- `api-documentation.json` - Postman-compatible docs
- `test-design.json` - Test design breakdown
