# Life Insurance Claim Validator — Architecture

## Overview

A serverless, AI-powered claims validation system that processes identity documents, death certificates, and policy records to produce a **GO / NO_GO / REFER** decision on life insurance claims. The system uses a multi-agent orchestration pattern where each agent is a specialist responsible for one aspect of validation.

## Architecture Diagram

```mermaid
graph TB
    subgraph "Frontend"
        User["Claims Handler"]
        CF["CloudFront<br/><small>Basic Auth (login/password)</small>"]
        S3Site["S3 Static Site<br/><small>HTML / JS / CSS</small>"]
    end

    subgraph "API Layer"
        ProxyFn["Proxy Lambda<br/><small>Signs requests (SigV4)</small>"]
        FnURL["Function URL<br/><small>IAM Auth</small>"]
        InvokeFn["Invoke Lambda<br/><small>Starts Step Function</small>"]
    end

    subgraph "Orchestration"
        SFN["Step Functions<br/><small>Express Workflow</small>"]
    end

    subgraph "Agent Pipeline"
        Intake["Document Intake<br/>Agent"]
        Identity["Identity Verification<br/>Agent"]
        Validity["Claim Validity<br/>Agent"]
        Synthesis["Decision Synthesis<br/>Agent"]
    end

    subgraph "AWS Services"
        Textract["Amazon Textract<br/><small>AnalyzeID / AnalyzeDocument</small>"]
        Bedrock["Amazon Bedrock<br/><small>Claude Sonnet 4.5</small>"]
        DocsBucket["S3 Documents<br/><small>Claim files</small>"]
    end

    User -->|"HTTPS"| CF
    CF -->|"Origin"| S3Site
    CF -.->|"API call"| ProxyFn
    ProxyFn -->|"SigV4 signed"| FnURL
    FnURL --> InvokeFn
    InvokeFn -->|"StartSyncExecution"| SFN

    SFN -->|"Step 1"| Intake
    SFN -->|"Step 2 (parallel)"| Identity
    SFN -->|"Step 2 (parallel)"| Validity
    SFN -->|"Step 3"| Synthesis

    Intake -->|"AnalyzeID"| Textract
    Intake -->|"AnalyzeDocument"| Textract
    Intake -->|"Read docs"| DocsBucket
    Identity -->|"Reasoning"| Bedrock
    Validity -->|"Reasoning"| Bedrock
    Synthesis -->|"Decision"| Bedrock
```

## Agent Flow (Step Function)

```mermaid
stateDiagram-v2
    [*] --> DocumentIntake

    state "Step 1: Document Intake" as DocumentIntake {
        [*] --> ListS3Documents
        ListS3Documents --> ClassifyDocument
        ClassifyDocument --> TextractAnalyzeID: Identity Document
        ClassifyDocument --> TextractAnalyzeDocument: Death Cert / Policy / Claim Form
        TextractAnalyzeID --> ExtractedData
        TextractAnalyzeDocument --> ExtractedData
    }

    DocumentIntake --> ParallelVerification

    state "Step 2: Parallel Verification" as ParallelVerification {
        state "Identity Verification (Claude)" as IdAgent {
            [*] --> CrossRefNames
            CrossRefNames --> CrossRefDOBs
            CrossRefDOBs --> CrossRefAddresses
            CrossRefAddresses --> CheckBeneficiary
            CheckBeneficiary --> FraudIndicators
        }
        state "Claim Validity (Claude)" as ValAgent {
            [*] --> CheckPolicyStatus
            CheckPolicyStatus --> CheckBeneficiaryEntitlement
            CheckBeneficiaryEntitlement --> ValidateDeathCert
            ValidateDeathCert --> CheckExclusions
        }
    }

    ParallelVerification --> Synthesis

    state "Step 3: Decision Synthesis (Claude)" as Synthesis {
        [*] --> AggregateResults
        AggregateResults --> ApplyThresholds
        ApplyThresholds --> ProduceDecision
    }

    Synthesis --> [*]
```

## Decision Logic

```mermaid
flowchart TD
    Start["All Agent Results"] --> ConfCheck{Confidence >= 85%?}

    ConfCheck -->|Yes| AllPass{Identity + Policy + Death Cert all valid?}
    ConfCheck -->|No| MidConf{Confidence >= 40%?}

    AllPass -->|Yes| NoFlags{Zero risk flags?}
    AllPass -->|No| REFER1["REFER"]

    NoFlags -->|Yes| GO["GO ✅"]
    NoFlags -->|No| REFER2["REFER"]

    MidConf -->|Yes| REFER3["REFER ⚠️"]
    MidConf -->|No| NOGO["NO_GO ❌"]

    style GO fill:#0e41e5,color:white
    style NOGO fill:#d3145a,color:white
    style REFER1 fill:#ff8400,color:white
    style REFER2 fill:#ff8400,color:white
    style REFER3 fill:#ff8400,color:white
```

## Components

### Frontend (CloudFront + S3)

| Component | Purpose |
|-----------|---------|
| CloudFront Distribution | HTTPS delivery, caching, basic auth enforcement |
| Lambda@Edge | HTTP Basic Auth check on every viewer request |
| S3 Static Site | Single-page HTML/JS application |

**Access**: Protected by HTTP Basic Auth (`cevo` / `claims-demo-2026`)

### API Layer

| Component | Purpose |
|-----------|---------|
| Proxy Lambda (Function URL, no auth) | Called by the frontend; signs requests to the backend |
| Invoke Lambda (Function URL, IAM auth) | Receives signed requests; starts the Step Function synchronously |

**Security**: The backend Function URL requires IAM SigV4 signatures. The proxy Lambda has an IAM role that permits `lambda:InvokeFunctionUrl`. Direct access to the backend URL without valid AWS credentials returns 403.

### Orchestration (Step Functions Express)

Express Workflow chosen because:
- Synchronous execution (response returned to caller)
- Sub-30-second total execution time for most claims
- Visual execution graph in the console for demos
- Pay-per-execution pricing

### Agent Lambdas

| Lambda | Role | AWS Service | Timeout |
|--------|------|-------------|---------|
| `li-claim-document-intake` | OCR + classification | Amazon Textract | 60s |
| `li-claim-identity-verification` | Cross-document identity check | Amazon Bedrock (Claude) | 60s |
| `li-claim-claim-validity` | Policy + exclusion validation | Amazon Bedrock (Claude) | 60s |
| `li-claim-synthesis` | Final GO/NO_GO/REFER decision | Amazon Bedrock (Claude) | 60s |

## Data Flow

```mermaid
sequenceDiagram
    participant Browser
    participant CloudFront
    participant Proxy as Proxy Lambda
    participant Backend as Invoke Lambda
    participant SFN as Step Functions
    participant Intake as Document Intake
    participant Textract
    participant S3
    participant Identity as Identity Agent
    participant Validity as Validity Agent
    participant Synth as Synthesis Agent
    participant Bedrock as Claude (Bedrock)

    Browser->>CloudFront: POST /api (claim_id, s3_prefix)
    CloudFront->>Proxy: Forward (basic auth verified)
    Proxy->>Backend: POST (SigV4 signed)
    Backend->>SFN: StartSyncExecution

    SFN->>Intake: Step 1
    Intake->>S3: List documents
    S3-->>Intake: 4 files
    Intake->>Textract: AnalyzeID (passport)
    Textract-->>Intake: Name, DOB, passport no.
    Intake->>Textract: AnalyzeDocument (death cert)
    Textract-->>Intake: Key-value pairs, lines
    Intake->>Textract: AnalyzeDocument (policy)
    Textract-->>Intake: Policy fields
    Intake->>Textract: AnalyzeDocument (claim form)
    Textract-->>Intake: Form fields
    Intake-->>SFN: Extracted data (all docs)

    par Step 2 (parallel)
        SFN->>Identity: Extracted data
        Identity->>Bedrock: Cross-reference names/DOBs/addresses
        Bedrock-->>Identity: Consistency scores + discrepancies
        Identity-->>SFN: Identity result
    and
        SFN->>Validity: Extracted data
        Validity->>Bedrock: Check policy + exclusions
        Bedrock-->>Validity: Policy status + validity
        Validity-->>SFN: Validity result
    end

    SFN->>Synth: All results
    Synth->>Bedrock: Synthesize decision
    Bedrock-->>Synth: GO/NO_GO/REFER + explanation
    Synth-->>SFN: Final decision

    SFN-->>Backend: Output JSON
    Backend-->>Proxy: Response
    Proxy-->>CloudFront: Response
    CloudFront-->>Browser: Decision + explanation
```

## Security Model

| Layer | Protection |
|-------|-----------|
| CloudFront | HTTP Basic Auth (Lambda@Edge) |
| Backend Function URL | AWS IAM (SigV4) — only the proxy Lambda can call it |
| S3 Documents Bucket | Private — only Lambda execution role has access |
| Bedrock | IAM policy — only agent Lambdas can invoke models |
| Textract | IAM policy — only Document Intake Lambda can call |

## Cost Estimate (per validation)

| Service | Usage | Approx. Cost |
|---------|-------|--------------|
| Textract AnalyzeID | 1 page | $0.01 |
| Textract AnalyzeDocument | 3 pages | $0.05 |
| Bedrock Claude Sonnet 4.5 | ~12K input + ~3K output tokens x3 calls | ~$0.15 |
| Step Functions Express | 1 execution (~20s) | < $0.01 |
| Lambda | 4 invocations (~60s total) | < $0.01 |
| **Total per validation** | | **~$0.22** |

## Deployment

```bash
cd infra
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt

# Deploy
cdk deploy --profile cevo-dev25 --all

# Destroy when done
cdk destroy --profile cevo-dev25 --all
```

### Outputs

| Output | Description |
|--------|-------------|
| `SiteUrl` | CloudFront URL for the demo (requires basic auth) |
| `ProxyApiUrl` | Proxy Lambda URL (called by frontend) |
| `FunctionUrl` | Backend Lambda URL (IAM auth required) |
| `DocsBucketName` | S3 bucket with claim documents |
| `StateMachineArn` | Step Function ARN (viewable in console) |

## Local Development

The Streamlit app (`demo_ui.py`) provides the same functionality locally:

```bash
cd use_cases/life-insurance-claim
source .venv/bin/activate
export AWS_PROFILE=cevo-dev25 AWS_REGION=ap-southeast-2
streamlit run demo_ui.py
```

Toggle "Use Claude (Live mode)" to switch between simulated results and the real Textract + Bedrock pipeline.

## Test Data

| Claim ID | Documents | Expected Decision | Scenario |
|----------|-----------|-------------------|----------|
| CLAIM-LI-001 | Passport, Death Cert, Policy, Claim Form | **GO** | Valid claim — consistent identity, active policy, natural causes |
| CLAIM-LI-002 | Driver's Licence, Death Cert, Policy, Claim Form | **REFER** | Surname mismatch (Thompson vs Thomson), 50% beneficiary share |
| CLAIM-LI-003 | Driver's Licence, Death Cert, Policy, Claim Form | **NO_GO** | Lapsed policy + suicide within exclusion period |
| CLAIM-LI-DEMO | NSW Licence, 1955 Death Cert, Medical Claim Form | **NO_GO** | Three unrelated people, 70-year temporal impossibility |
