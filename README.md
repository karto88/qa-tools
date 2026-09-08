# QA Automation Testing System 🚀

Multi-agent automated API testing framework for OpenAPI 3.1.0 specifications.

## ⚡ Quick Start

```bash
# Run all API tests
./scripts/run-tests.sh

# Test specific service
./scripts/run-tests.sh payment

# Generate API documentation
./scripts/generate-docs.sh

# List all endpoints
./scripts/list-endpoints.sh
```

## 📊 View Results

After running tests, open the HTML report:
```
postman/reports/test-report.html
```

## 🤖 What is This?

A **4-agent system** that automatically:

1. ✅ Analyzes your OpenAPI specification
2. ✅ Generates comprehensive test cases (EP, BVA, Decision Tables)
3. ✅ Executes tests with Newman (Postman CLI)
4. ✅ Validates responses (status, schema, business logic)
5. ✅ Generates HTML reports + Postman documentation

## 📁 Project Structure

```
test/
├── qa-agents/          # 🤖 Multi-agent testing system
├── postman/            # API specs, collections, reports
├── scripts/            # Helper automation scripts
├── docs/               # Documentation
└── CLAUDE.md           # Master instructions for Claude
```

## 🎯 The 4 Agents

1. **QA Lead** - Orchestrates the entire workflow
2. **Test Designer** - Generates test cases (EP, BVA, Decision Tables)
3. **Newman Executor** - Runs tests and validates responses
4. **Reporter** - Creates HTML reports and API documentation

## 📖 Documentation

- **Complete Guide:** [docs/qa-agents/README.md](docs/qa-agents/README.md)
- **Quick Start:** [docs/qa-agents/QUICKSTART.md](docs/qa-agents/QUICKSTART.md)
- **Master Instructions:** [CLAUDE.md](CLAUDE.md)
- **Scripts Guide:** [scripts/README.md](scripts/README.md)

## 🔧 Requirements

- **Node.js** 14+ (for QA agents)
- **Newman** (auto-installed with `npm install`)
- **jq** (optional, for better JSON formatting)

## 📦 Installation

```bash
# Install QA agents dependencies
cd qa-agents
npm install
cd ..

# Make scripts executable (Linux/Mac)
chmod +x scripts/*.sh
```

## 💡 Usage Examples

### Run Tests by Service

```bash
# Payment service tests
./scripts/run-tests.sh payment

# User service tests
./scripts/run-tests.sh user

# Order service tests
./scripts/run-tests.sh order
```

### Run Tests by Environment

```bash
# Development environment (default)
./scripts/run-tests.sh payment dev

# Production environment
./scripts/run-tests.sh payment prod
```

### Direct Node.js Commands

```bash
# List available services
node qa-agents/index.js list

# Run specific service
node qa-agents/index.js test --service payment

# Custom environment
node qa-agents/index.js test --service payment --env postman/environments/dev.json
```

## 📊 Generated Outputs

All outputs are saved in `postman/reports/`:

- **test-report.html** - Main HTML test report ⭐
- **api-documentation.json** - Postman-compatible API docs
- **test-design.json** - Test case breakdown by technique
- **newman-results.json** - Raw Newman execution results

## 🎨 Test Design Techniques

The system automatically applies 3 industry-standard techniques:

1. **Equivalence Partitioning (EP)**
   - Divides inputs into valid/invalid classes
   - Tests representative values from each class

2. **Boundary Value Analysis (BVA)**
   - Tests min, max, and edge values
   - Validates boundary conditions

3. **Decision Table Testing**
   - Creates condition combination matrices
   - Ensures all logical paths are tested

## 🔐 Environment Configuration

Configure environments in `postman/environments/`:

- `dev.json` - Development environment
- `prod.json` - Production environment

**Important:** Never commit sensitive tokens to version control!

## 🎯 What Gets Tested?

For each API endpoint:
- ✅ HTTP status codes (200, 400, 401, 404, 500, etc.)
- ✅ Response schema structure
- ✅ Required vs optional fields
- ✅ Data types and formats
- ✅ Business logic rules
- ✅ Error messages
- ✅ Authentication/authorization

## 🐛 Debugging

### View OpenAPI Spec

```bash
# Pretty print
python -m json.tool postman/api-docs.json

# List endpoints
./scripts/list-endpoints.sh

# Using jq
jq '.paths | keys' postman/api-docs.json
```

### Check Agent Status

```bash
node qa-agents/index.js status
```

## 🚀 CI/CD Integration

Add to your pipeline:

```yaml
# Example GitHub Actions
- name: Run API Tests
  run: |
    cd qa-agents && npm install
    node index.js test --service all --env ../postman/environments/ci.json
```

## 📝 Adding New Tests

The system **automatically generates tests** from your OpenAPI spec.

To add new endpoints:
1. Update `postman/api-docs.json` with new endpoint
2. Run tests - agents will auto-generate test cases
3. Review generated report

No manual test writing needed! 🎉

## 🤝 Contributing

### Add New Agent

1. Create `qa-agents/agents/your-agent.js`
2. Import in `qa-agents/qa-lead.js`
3. Add orchestration logic
4. Update documentation

### Add New Test Technique

1. Add to `qa-agents/config/test-techniques.js`
2. Update Test Designer Agent
3. Document the technique

## 📜 License

MIT

## 🙋 Support

For issues or questions:
1. Check [CLAUDE.md](CLAUDE.md) for detailed instructions
2. Review agent logs in console output
3. Check generated reports for error details

## ✨ Features

- 🤖 **Fully Automated** - No manual test writing
- 📋 **Smart Test Generation** - EP, BVA, Decision Tables
- ⚙️ **Newman Powered** - Industry-standard test execution
- 📊 **Beautiful Reports** - HTML reports with statistics
- 📖 **API Documentation** - Auto-generated Postman docs
- 🔧 **CLI & Scripts** - Multiple ways to run tests
- 🎯 **Service-Based** - Test specific services or all
- 🔐 **Environment Support** - Dev, prod, custom environments

---

**Ready to start testing?**

```bash
./scripts/run-tests.sh
```

View report: `postman/reports/test-report.html` 🎉
