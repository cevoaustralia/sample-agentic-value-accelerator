"""Document Intake Agent for Life Insurance Claim Validation.

Classifies submitted documents and extracts structured data using Amazon
Textract and Bedrock multimodal vision. Processes identity documents, death
certificates, policy documents, and claim forms.
"""

from base.strands import StrandsAgent
from tools.s3_retriever_strands import s3_retriever_tool
from ..tools import textract_id_tool, textract_document_tool, document_analyzer_tool


class DocumentIntakeAgent(StrandsAgent):
    """Classifies and extracts data from all submitted claim documents."""

    name = "document_intake_agent"

    system_prompt = """You are an expert Document Intake Specialist for life insurance claims processing.

Your role is to process ALL documents submitted with a life insurance claim, classify each one,
and extract structured data from them.

## Document Categories
You must classify each document into one of:
- **identity_document**: Passport, driver's licence, government ID, Medicare card, birth certificate
- **death_certificate**: Official death certificate or medical certificate of cause of death
- **policy_document**: Insurance policy, policy schedule, policy endorsement
- **claim_form**: Completed claim application form
- **supporting_evidence**: Power of attorney, statutory declarations, medical records, etc.

## Extraction Requirements

For IDENTITY DOCUMENTS, extract:
- Full name (given names + surname)
- Date of birth
- Document number (passport number, licence number, etc.)
- Expiry date
- Address (if present)
- Nationality/country of issue
- Photo match notes (if visible)

For DEATH CERTIFICATES, extract:
- Full name of deceased
- Date of death
- Place of death
- Cause of death (primary and secondary)
- Certifying authority / registrar
- Registration number
- Date of registration

For POLICY DOCUMENTS, extract:
- Policy number
- Policy holder name
- Beneficiary name(s) and relationship
- Sum insured / coverage amount
- Policy start date and term
- Premium status (paid up, in arrears)
- Exclusions or special conditions

For CLAIM FORMS, extract:
- Claimant name and relationship to deceased
- Contact details
- Claim amount requested
- Date of claim submission
- Supporting documents listed

## Process
1. Use s3_retriever_tool to list available documents for the claim
2. For identity documents: Use textract_id_tool for structured extraction
3. For other documents: Use textract_document_tool for forms/tables extraction
4. For any document needing visual analysis: Use document_analyzer_tool
5. Compile all extracted data into a structured summary

## Quality Assessment
Rate document quality and note any issues:
- Blurry or illegible sections
- Partial/cropped documents
- Potential alterations or inconsistencies
- Missing required fields

Be thorough and precise. Your extracted data will be used by downstream agents
to verify identity and validate the claim."""

    tools = [s3_retriever_tool, textract_id_tool, textract_document_tool, document_analyzer_tool]
    model_kwargs = {"temperature": 0.1, "max_tokens": 16384}


async def process_document_intake(claim_id: str, context: str | None = None) -> dict:
    """Run document intake processing for a life insurance claim.

    Args:
        claim_id: The claim identifier.
        context: Optional additional context.

    Returns:
        Dict with agent name, claim_id, and extracted analysis.
    """
    agent = DocumentIntakeAgent()

    input_text = f"""Process all documents submitted for life insurance claim: {claim_id}

Steps:
1. Retrieve the claim's document manifest using s3_retriever_tool with customer_id='{claim_id}' and data_type='profile'
2. For each document in the manifest:
   a. If it's an identity document → use textract_id_tool to extract identity fields
   b. If it's a death certificate or policy → use textract_document_tool to extract forms data
   c. If you need visual analysis for authenticity or complex content → use document_analyzer_tool
3. Classify each document by category
4. Compile complete extraction results

{"Additional Context: " + context if context else ""}

Provide your complete document intake assessment as a JSON object with:
- "documents_processed": number of documents
- "documents": list of objects with category, document_subtype, extracted_fields, confidence, quality_issues
- "overall_completeness": 0.0-1.0 score of documentation completeness
- "missing_documents": list of required but missing document types
- "notes": list of observations

Return ONLY the JSON object."""

    result = await agent.ainvoke(input_text)
    return {"agent": "document_intake_agent", "claim_id": claim_id, "analysis": result.output}
