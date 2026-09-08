---
name: test-api
description: Run automated API tests using the QA Agents multi-agent testing system. Tests OpenAPI endpoints with EP, BVA, and Decision Table techniques.
---

# API Testing Skill

Automated API testing using the multi-agent QA system.

## What This Skill Does

1. **Analyzes OpenAPI specification** (`postman/api-docs.json`)
2. **Generates test cases** using:
   - Equivalence Partitioning (EP)
   - Boundary Value Analysis (BVA)
   - Decision Table Testing
3. **Executes tests** via Newman with full validation
4. **Generates HTML report** with pass/fail statistics
5. **Creates API documentation** (Postman-compatible)

## Usage

```
/test-api [service] [environment]
```

### Examples

```
/test-api                    # Test all services (dev environment)
/test-api payment            # Test payment service only
/test-api payment prod       # Test payment in production
/test-api order dev          # Test order service in dev
```

## Implementation Steps

### 1. Parse User Input

Extract:
- **Service name** (payment, order, user, etc.) - optional, defaults to "all"
- **Environment** (dev, prod, staging) - optional, defaults to "dev"

### 2. Validate Environment File

Check if environment file exists:
```
postman/environments/{environment}.json
```

If missing, list available environments and ask user to choose.

### 3. Execute QA Agents System

Run the test command:

```bash
node qa-agents/index.js test --service {service} --env postman/environments/{environment}.json
```

**OR** use the helper script:

```bash
./scripts/run-tests.sh {service} {environment}
```

### 4. Monitor Execution

- Show agent progress (Test Designer → Newman Executor → Reporter)
- Display test statistics as they're generated
- Report any errors from agents

### 5. Present Results

After completion, show:

1. **Summary Statistics:**
   - Total test cases generated
   - Tests passed / failed
   - Pass rate percentage
   - Execution time

2. **Report Location:**
   ```
   📊 HTML Report: postman/reports/test-report.html
   📖 API Docs: postman/reports/api-documentation.json
   ```

3. **Ask if user wants to:**
   - Open HTML report in browser
   - View failed tests details
   - Re-run failed tests only
   - Generate API documentation

### 6. Error Handling

Handle common errors:

**OpenAPI spec not found:**
- Check `postman/api-docs.json` exists
- Suggest running `/validate-spec` if corrupted

**Service not found:**
- List available services from OpenAPI spec
- Suggest correct service name

**Environment file missing:**
- List available environments from `postman/environments/`
- Show template to create new environment

**Newman execution failed:**
- Display Newman error logs
- Check if dependencies are installed (`cd qa-agents && npm install`)

**No tests generated:**
- Service might not exist in OpenAPI spec
- Suggest checking service name or running all tests

## Output Format

### Success Case

```
🤖 QA Agents - API Testing
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Service: payment
Environment: dev
OpenAPI Spec: postman/api-docs.json

📋 Phase 1: Test Design
  ├─ Analyzing endpoints...
  ├─ Generating EP test cases...
  ├─ Generating BVA test cases...
  └─ Generating Decision Tables...
  
  ✅ Generated 47 test cases for 5 endpoints

⚙️  Phase 2: Test Execution (Newman)
  ├─ Building Postman collection...
  ├─ Loading environment variables...
  └─ Executing tests...
  
  ✅ Executed 47 tests in 23.5s

📊 Phase 3: Reporting
  ├─ Generating HTML report...
  └─ Generating API documentation...
  
  ✅ Reports generated

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 RESULTS

Total Tests: 47
✅ Passed: 45 (95.7%)
❌ Failed: 2 (4.3%)

Execution Time: 23.5s

📁 Reports:
  • HTML: postman/reports/test-report.html
  • API Docs: postman/reports/api-documentation.json

Would you like to open the HTML report?
```

### Failed Tests Case

```
❌ 2 Tests Failed:

1. POST /api/payment/create - Invalid amount boundary
   Expected: 400 Bad Request
   Received: 500 Internal Server Error
   
2. GET /api/payment/{id} - Non-existent ID
   Expected: 404 Not Found
   Received: 200 OK (returned null)

View detailed report: postman/reports/test-report.html
```

## Environment Setup

Ensure environment files contain:

```json
{
  "name": "Development",
  "values": [
    {"key": "baseUrl", "value": "https://api-dev.example.com"},
    {"key": "authToken", "value": ""},
    {"key": "timeout", "value": "5000"}
  ]
}
```

## Pre-requisites Check

Before running tests:

1. ✅ Node.js installed
2. ✅ `qa-agents/node_modules` exists (run `npm install` if missing)
3. ✅ `postman/api-docs.json` exists and is valid
4. ✅ Environment file exists for selected environment

## Integration with Other Skills

- Use `/validate-spec` first if OpenAPI spec might be invalid
- Use `/create-order` to test order creation workflow specifically
- Use `/env` to manage environment configurations

## Notes

- Tests are **non-destructive** by default (read-only operations)
- For write operations (POST/PUT/DELETE), ensure test environment is isolated
- Reports overwrite previous results (only latest execution is kept)
- All test data should use environment variables (no hardcoded values)

## Troubleshooting

**"Command not found: node"**
- Install Node.js 14+ from nodejs.org

**"Cannot find module 'newman'"**
- Run: `cd qa-agents && npm install`

**"OpenAPI spec validation failed"**
- Run: `python -m json.tool postman/api-docs.json`
- Check for JSON syntax errors

**"No endpoints found for service 'X'"**
- List all services: `./scripts/list-endpoints.sh`
- Check service name spelling

## Advanced Usage

### Custom Test Techniques

Test only specific technique:
```
/test-api payment --technique EP     # Equivalence Partitioning only
/test-api payment --technique BVA    # Boundary Value Analysis only
/test-api payment --technique DT     # Decision Tables only
```

### Parallel Execution

Test multiple services in parallel:
```
/test-api "payment,order,user"
```

### CI/CD Integration

Export results for CI/CD:
```
/test-api payment --format junit     # JUnit XML format
/test-api payment --format json      # JSON format
```

---

**This skill orchestrates the entire QA Agents system to provide comprehensive API testing with minimal user input.**
