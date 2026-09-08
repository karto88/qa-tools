# CLAUDE.md

This repository contains OpenAPI 3.1.0 specification for a payment service backend API.

---

## Specification Location

**OpenAPI specification:**

```
postman/api-docs.json
```

---

## API Testing Rules

When a specific service or module is requested, generate tests **ONLY** for that scope.

**Do not** generate full API coverage unless explicitly requested.

---

## Test Design Techniques

For every tested endpoint or service, generate test cases using:

1. **Equivalence Partitioning**
2. **Boundary Value Analysis**
3. **Decision Table Testing**

Each technique must produce a **structured checklist** of test scenarios.

---

## API Validation Requirements

Validate:

- ✅ HTTP status codes
- ✅ Response schema
- ✅ Required response keys
- ✅ Business logic correctness
- ✅ Error handling behavior

---

## Environment Variables

Use Postman environment variables for **all dynamic data**.

**Never hardcode:**

- Access tokens
- Refresh tokens
- IDs
- Session identifiers
- Sensitive values

Store extracted values in environment variables and reuse them throughout the test flow.

---

## Pre-request and Post-response Scripts

### Use Pre-request scripts when setup is required

**Examples:**

- Authentication
- Data preparation
- Test data generation

### Use Post-response scripts for:

- Schema validation
- Response key validation
- Business rule validation
- Environment variable extraction

---

## Newman Execution

Execute collections using **Newman**.

**Requirements:**

- ✅ Fail tests on validation errors
- ✅ Produce deterministic results
- ✅ Validate all assertions

---

## Reporting

Generate HTML reports after execution.

**Requirements:**

- ✅ Overwrite previous report
- ✅ Keep only latest execution result
- ✅ Include passed/failed summary
- ✅ Include execution statistics

---

## Documentation Generation

Generate Postman-compatible API documentation after test execution.

**Documentation should include:**

- Endpoints
- Request examples
- Response examples
- Authentication requirements
- Validation notes

Documentation must be ready for Postman import/export.

---

## OpenAPI Usage Rules

**Always use the OpenAPI specification as the primary source of truth.**

Before generating tests:

1. Inspect endpoint definition
2. Inspect request schema
3. Inspect response schema
4. Inspect validation constraints
5. Generate tests based on specification rules

---

## Service-Specific Workflows

Complex business workflows such as:

- Authentication
- Order processing
- Payment processing
- Customer onboarding

May be implemented through dedicated **Skills**.

Use the appropriate Skill whenever a requested service depends on a multi-step workflow.

---

## Project Structure

```
test/
├── postman/
│   ├── api-docs.json              # OpenAPI 3.1.0 specification
│   ├── collections/               # Generated Postman collections
│   ├── environments/              # Environment configurations
│   │   ├── dev.json
│   │   └── prod.json
│   └── reports/                   # Test reports (gitignored)
│       ├── test-report.html       # Main HTML report
│       ├── test-design.json
│       ├── newman-results.json
│       └── api-documentation.json
│
├── qa-agents/                     # Multi-Agent Testing System
│   ├── index.js                   # CLI entry point
│   ├── qa-lead.js                 # QA Lead Orchestrator
│   ├── agents/                    # 4 Specialized Agents
│   ├── config/                    # Test techniques & validation rules
│   └── utils/
│
├── scripts/                       # Helper automation scripts
│   ├── run-tests.sh               # Main test runner
│   ├── generate-docs.sh
│   └── list-endpoints.sh
│
└── docs/                          # Documentation
    ├── qa-agents/
    └── api-reference/
```

---

## Quick Commands

```bash
# Run all tests
./scripts/run-tests.sh

# Run specific service
./scripts/run-tests.sh payment

# Run with environment
./scripts/run-tests.sh payment prod

# List endpoints
./scripts/list-endpoints.sh

# Generate documentation
./scripts/generate-docs.sh
```

---

## API Configuration

### Base URL

```
https://gateway.dev.keepz.me/common-service/api/v1
```

### Authentication Flow (Required for Order Creation)

**3-Step SMS Authentication:**

#### Step 1: Send SMS
```
POST /auth/send-sms

Body:
{
  "smsType": "LOGIN",
  "phoneNumberDetails": {
    "phoneNumber": "591078180",
    "countryCode": "995"
  },
  "otphash": "string"
}

Response: HTTP 200
```

#### Step 2: Verify SMS
```
POST /auth/verify-sms

Body:
{
  "countryCode": "995",
  "phone": "591078180",
  "code": "111111"
}

Response:
{
  "value": "3c6e3762-05ca-4c9a-824a-bc3a63e4bb4f"
}

Extract: userSMSId from response.value
```

#### Step 3: Login (Get Token)
```
POST /auth/login

Body:
{
  "userSMSId": "{userSMSId from step 2}",
  "deviceToken": "test-device-token",
  "mobileOS": "IOS",
  "mobileName": "Test Device",
  "mobileNumber": "591078180",
  "userType": "BUSINESS"
}

Response:
{
  "value": {
    "access_token": "eyJhbGci...",
    "expires_in": 86400,
    "refresh_token": "...",
    "token_type": "Bearer"
  }
}

Extract: access_token from response.value.access_token
```

### Token Usage

All authenticated API calls must include:

```
Authorization: Bearer {access_token}
```

Token expires in 24 hours (86400 seconds).

### Test Credentials

- **Phone**: 591078180
- **Country Code**: 995
- **SMS Code**: 111111 (static test code)

---

## Documentation References

- **QA Agents Guide**: `docs/qa-agents/README.md`
- **Quick Start**: `docs/qa-agents/QUICKSTART.md`
- **Architecture**: `docs/qa-agents/ARCHITECTURE.md`
- **Scripts Guide**: `scripts/README.md`
- **External API Docs**: https://www.developers.keepz.me/eCommerece%20integration/create-an-order

---

## Playwright Testing Rules

**Location:** `Admin - Playwright/` directory

### Console Output Rules

Keep console.log minimal - show only essential information:

- ✅ Order Created
- ✅ Payment URL
- ✅ Browser opened status
- ❌ NO step-by-step progress logs
- ❌ NO decorative lines (━━━━)
- ❌ NO verbose instructions
- ❌ NO "Waiting..." messages

### Code Style

- Use Page Objects pattern (`pages/` directory)
- Keep authentication logic in `AuthPage.ts`
- Keep payment logic in `PaymentPage.ts`
- Remove all intermediate console logs from Page Objects
- Only log final results in test files

### Test Execution

**Hybrid Mode (API + Real Browser):**
- API requests via Playwright `request` context
- Real Chrome browser for 3DS payment (using `child_process.exec`)
- No waiting for manual payment completion

---

*For detailed system documentation, see: `README.md` and `docs/` directory.*
