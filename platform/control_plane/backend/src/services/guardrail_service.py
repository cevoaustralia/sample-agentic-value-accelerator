"""Guardrail service for managing guardrail templates via Bedrock SDK + DynamoDB"""

import boto3
import logging
import json
from decimal import Decimal
from typing import Dict, List, Optional
from datetime import datetime, timedelta

from models.guardrail import (
    GuardrailTemplate,
    GuardrailTemplateCreate,
    GuardrailTemplateUpdate,
    GuardrailStatus,
    StatusHistoryEntry,
    GuardrailPreset,
    GuardrailMetrics,
    GuardrailEvent,
    ContentFilterConfig,
    DeniedTopic,
    PiiEntityConfig,
    SensitiveRegexConfig,
    WordFilterConfig,
    ContextualGroundingConfig,
    FilterStrength,
    FilterType,
    PiiAction,
    PiiEntityType,
)

logger = logging.getLogger(__name__)


# --- FSI Presets ---

FSI_PRESETS: List[GuardrailPreset] = [
    GuardrailPreset(
        id="fsi-standard",
        name="FSI Standard",
        description="Comprehensive protection for financial services — content filtering, PII detection for financial data, and profanity filtering.",
        tags=["banking", "insurance", "compliance"],
        config=GuardrailTemplateCreate(
            name="FSI Standard Guardrail",
            description="Standard financial services guardrail with content filtering and PII protection",
            content_filters=[
                ContentFilterConfig(type=FilterType.HATE, input_strength=FilterStrength.HIGH, output_strength=FilterStrength.HIGH),
                ContentFilterConfig(type=FilterType.INSULTS, input_strength=FilterStrength.HIGH, output_strength=FilterStrength.HIGH),
                ContentFilterConfig(type=FilterType.SEXUAL, input_strength=FilterStrength.HIGH, output_strength=FilterStrength.HIGH),
                ContentFilterConfig(type=FilterType.VIOLENCE, input_strength=FilterStrength.MEDIUM, output_strength=FilterStrength.MEDIUM),
                ContentFilterConfig(type=FilterType.MISCONDUCT, input_strength=FilterStrength.HIGH, output_strength=FilterStrength.HIGH),
                ContentFilterConfig(type=FilterType.PROMPT_ATTACK, input_strength=FilterStrength.HIGH, output_strength=FilterStrength.NONE),
            ],
            pii_entities=[
                PiiEntityConfig(type=PiiEntityType.CREDIT_DEBIT_CARD_NUMBER, action=PiiAction.ANONYMIZE),
                PiiEntityConfig(type=PiiEntityType.CREDIT_DEBIT_CARD_CVV, action=PiiAction.BLOCK),
                PiiEntityConfig(type=PiiEntityType.SSN, action=PiiAction.ANONYMIZE),
                PiiEntityConfig(type=PiiEntityType.INTERNATIONAL_BANK_ACCOUNT_NUMBER, action=PiiAction.ANONYMIZE),
                PiiEntityConfig(type=PiiEntityType.SWIFT_CODE, action=PiiAction.ANONYMIZE),
            ],
            word_filter=WordFilterConfig(enable_profanity=True, blocked_words=[]),
        ),
    ),
    GuardrailPreset(
        id="market-surveillance",
        name="Market Surveillance",
        description="Designed for trading and capital markets — blocks insider trading advice and unauthorized financial recommendations.",
        tags=["trading", "capital-markets", "compliance"],
        config=GuardrailTemplateCreate(
            name="Market Surveillance Guardrail",
            description="Guardrail for capital markets with denied topics for trading compliance",
            content_filters=[
                ContentFilterConfig(type=FilterType.HATE, input_strength=FilterStrength.MEDIUM, output_strength=FilterStrength.MEDIUM),
                ContentFilterConfig(type=FilterType.INSULTS, input_strength=FilterStrength.MEDIUM, output_strength=FilterStrength.MEDIUM),
                ContentFilterConfig(type=FilterType.MISCONDUCT, input_strength=FilterStrength.HIGH, output_strength=FilterStrength.HIGH),
                ContentFilterConfig(type=FilterType.PROMPT_ATTACK, input_strength=FilterStrength.HIGH, output_strength=FilterStrength.NONE),
            ],
            denied_topics=[
                DeniedTopic(
                    name="Insider Trading Advice",
                    definition="Any advice or instructions related to trading based on material non-public information",
                    examples=["Buy stock before the earnings announcement", "I heard they're about to merge"],
                ),
                DeniedTopic(
                    name="Market Manipulation",
                    definition="Strategies or techniques for artificially influencing security prices",
                    examples=["How to pump and dump a stock", "Coordinating trades to move the price"],
                ),
                DeniedTopic(
                    name="Unauthorized Financial Advice",
                    definition="Specific investment recommendations without proper licensing or disclaimers",
                    examples=["You should definitely buy this stock", "Put all your money into crypto"],
                ),
            ],
        ),
    ),
    GuardrailPreset(
        id="customer-service",
        name="Customer Service",
        description="Moderate filtering with PII anonymization — ideal for customer-facing AI assistants in banking and insurance.",
        tags=["customer-facing", "banking", "insurance"],
        config=GuardrailTemplateCreate(
            name="Customer Service Guardrail",
            description="Balanced guardrail for customer-facing applications with PII anonymization",
            content_filters=[
                ContentFilterConfig(type=FilterType.HATE, input_strength=FilterStrength.MEDIUM, output_strength=FilterStrength.HIGH),
                ContentFilterConfig(type=FilterType.INSULTS, input_strength=FilterStrength.LOW, output_strength=FilterStrength.HIGH),
                ContentFilterConfig(type=FilterType.SEXUAL, input_strength=FilterStrength.HIGH, output_strength=FilterStrength.HIGH),
                ContentFilterConfig(type=FilterType.VIOLENCE, input_strength=FilterStrength.MEDIUM, output_strength=FilterStrength.HIGH),
                ContentFilterConfig(type=FilterType.MISCONDUCT, input_strength=FilterStrength.MEDIUM, output_strength=FilterStrength.HIGH),
                ContentFilterConfig(type=FilterType.PROMPT_ATTACK, input_strength=FilterStrength.HIGH, output_strength=FilterStrength.NONE),
            ],
            pii_entities=[
                PiiEntityConfig(type=PiiEntityType.EMAIL, action=PiiAction.ANONYMIZE),
                PiiEntityConfig(type=PiiEntityType.PHONE, action=PiiAction.ANONYMIZE),
                PiiEntityConfig(type=PiiEntityType.ADDRESS, action=PiiAction.ANONYMIZE),
                PiiEntityConfig(type=PiiEntityType.SSN, action=PiiAction.BLOCK),
                PiiEntityConfig(type=PiiEntityType.CREDIT_DEBIT_CARD_NUMBER, action=PiiAction.BLOCK),
            ],
            word_filter=WordFilterConfig(enable_profanity=True, blocked_words=[]),
            contextual_grounding=ContextualGroundingConfig(enabled=True, grounding_threshold=0.7, relevance_threshold=0.7),
        ),
    ),
]


class GuardrailService:
    def __init__(self, table_name: str = "fsi-control-plane-guardrails", region: str = "us-east-1"):
        self.table_name = table_name
        self.region = region
        self.dynamodb = boto3.resource("dynamodb", region_name=region)
        self.table = self.dynamodb.Table(table_name)
        self.bedrock_client = boto3.client("bedrock", region_name=region)
        self.cloudwatch_client = boto3.client("cloudwatch", region_name=region)

    # --- DynamoDB helpers ---

    def _to_item(self, template: GuardrailTemplate) -> dict:
        data = template.model_dump()
        data["pk"] = f"GUARDRAIL#{template.template_id}"
        data["sk"] = "META"
        # Convert enums to strings and floats to Decimal for DynamoDB
        return json.loads(json.dumps(data, default=str), parse_float=Decimal)

    def _from_item(self, item: dict) -> GuardrailTemplate:
        item.pop("pk", None)
        item.pop("sk", None)
        return GuardrailTemplate(**item)

    def _add_status(self, template: GuardrailTemplate, status: GuardrailStatus, message: str = ""):
        now = datetime.utcnow().isoformat()
        template.status = status
        template.updated_at = now
        template.status_history.append(
            StatusHistoryEntry(status=status.value, timestamp=now, message=message)
        )

    # --- CRUD ---

    def create_template(self, req: GuardrailTemplateCreate, created_by: str = "system") -> GuardrailTemplate:
        template = GuardrailTemplate(
            name=req.name,
            description=req.description,
            content_filters=req.content_filters,
            denied_topics=req.denied_topics,
            pii_entities=req.pii_entities,
            sensitive_regexes=req.sensitive_regexes,
            word_filter=req.word_filter,
            contextual_grounding=req.contextual_grounding,
            created_by=created_by,
        )
        self._add_status(template, GuardrailStatus.CREATING, "Creating Bedrock guardrail")

        try:
            result = self._create_bedrock_guardrail(template)
            template.guardrail_id = result["guardrailId"]
            template.guardrail_arn = result["guardrailArn"]
            template.guardrail_version = result.get("version", "DRAFT")
            self._add_status(template, GuardrailStatus.ACTIVE, "Guardrail created successfully")
        except Exception as e:
            logger.error(f"Failed to create Bedrock guardrail: {e}")
            self._add_status(template, GuardrailStatus.FAILED, f"Bedrock API error: {str(e)[:200]}")

        self.table.put_item(Item=self._to_item(template))
        logger.info(f"Created guardrail template {template.template_id} (bedrock_id={template.guardrail_id})")
        return template

    def get_template(self, template_id: str) -> Optional[GuardrailTemplate]:
        resp = self.table.get_item(Key={"pk": f"GUARDRAIL#{template_id}", "sk": "META"})
        item = resp.get("Item")
        if not item:
            return None
        return self._from_item(item)

    def list_templates(self, status: Optional[GuardrailStatus] = None) -> List[GuardrailTemplate]:
        # Scan with filter — acceptable for control plane (low cardinality)
        scan_kwargs: Dict = {}
        if status:
            scan_kwargs["FilterExpression"] = boto3.dynamodb.conditions.Attr("status").eq(status.value)

        # Filter to only guardrail items
        from boto3.dynamodb.conditions import Key, Attr
        scan_kwargs["FilterExpression"] = Attr("pk").begins_with("GUARDRAIL#")
        if status:
            scan_kwargs["FilterExpression"] = scan_kwargs["FilterExpression"] & Attr("status").eq(status.value)

        resp = self.table.scan(**scan_kwargs)
        items = resp.get("Items", [])
        templates = [self._from_item(item) for item in items]
        templates.sort(key=lambda t: t.created_at, reverse=True)
        return templates

    def update_template(self, template_id: str, req: GuardrailTemplateUpdate) -> Optional[GuardrailTemplate]:
        template = self.get_template(template_id)
        if not template:
            return None

        # Apply updates
        update_data = req.model_dump(exclude_none=True)
        for field, value in update_data.items():
            setattr(template, field, value)

        if template.guardrail_id and template.status == GuardrailStatus.ACTIVE:
            self._add_status(template, GuardrailStatus.UPDATING, "Updating Bedrock guardrail")
            try:
                self._update_bedrock_guardrail(template)
                self._add_status(template, GuardrailStatus.ACTIVE, "Guardrail updated successfully")
            except Exception as e:
                logger.error(f"Failed to update Bedrock guardrail: {e}")
                self._add_status(template, GuardrailStatus.FAILED, f"Update error: {str(e)[:200]}")

        self.table.put_item(Item=self._to_item(template))
        return template

    def delete_template(self, template_id: str) -> Optional[GuardrailTemplate]:
        template = self.get_template(template_id)
        if not template:
            return None

        if template.guardrail_id:
            self._add_status(template, GuardrailStatus.DELETING, "Deleting Bedrock guardrail")
            try:
                self._delete_bedrock_guardrail(template.guardrail_id)
                self._add_status(template, GuardrailStatus.DELETED, "Guardrail deleted")
            except Exception as e:
                logger.error(f"Failed to delete Bedrock guardrail: {e}")
                self._add_status(template, GuardrailStatus.FAILED, f"Delete error: {str(e)[:200]}")
        else:
            self._add_status(template, GuardrailStatus.DELETED, "Draft deleted")

        self.table.put_item(Item=self._to_item(template))
        return template

    def publish_version(self, template_id: str) -> Optional[GuardrailTemplate]:
        template = self.get_template(template_id)
        if not template or not template.guardrail_id:
            return None

        try:
            resp = self.bedrock_client.create_guardrail_version(
                guardrailIdentifier=template.guardrail_id,
                description=f"Published from AVA control plane at {datetime.utcnow().isoformat()}"
            )
            template.guardrail_version = resp.get("version", template.guardrail_version)
            self._add_status(template, GuardrailStatus.ACTIVE, f"Published version {template.guardrail_version}")
        except Exception as e:
            logger.error(f"Failed to publish guardrail version: {e}")
            self._add_status(template, GuardrailStatus.FAILED, f"Publish error: {str(e)[:200]}")

        self.table.put_item(Item=self._to_item(template))
        return template

    # --- Bedrock SDK integration ---

    def _build_bedrock_params(self, template: GuardrailTemplate) -> dict:
        params: Dict = {
            "name": f"ava-{template.template_id[:8]}-{template.name[:30].replace(' ', '-').lower()}",
            "description": template.description or f"AVA Guardrail: {template.name}",
            "blockedInputMessaging": "Your request was blocked by the guardrail policy. Please rephrase your input.",
            "blockedOutputsMessaging": "The response was blocked by the guardrail policy as it may contain restricted content.",
        }

        # Content policy
        if template.content_filters:
            filters = []
            for cf in template.content_filters:
                f = {
                    "type": cf.type.value,
                    "inputStrength": cf.input_strength.value,
                    "outputStrength": cf.output_strength.value,
                }
                # PROMPT_ATTACK output must be NONE
                if cf.type == FilterType.PROMPT_ATTACK:
                    f["outputStrength"] = "NONE"
                filters.append(f)
            params["contentPolicyConfig"] = {"filtersConfig": filters}

        # Topic policy
        if template.denied_topics:
            topics = []
            for topic in template.denied_topics:
                t = {
                    "name": topic.name,
                    "definition": topic.definition,
                    "type": "DENY",
                }
                if topic.examples:
                    t["examples"] = topic.examples[:5]  # Bedrock allows max 5 examples
                topics.append(t)
            params["topicPolicyConfig"] = {"topicsConfig": topics}

        # Sensitive information policy (PII + regex)
        pii_config = []
        regex_config = []

        # Valid Bedrock PII entity types (filter out legacy/invalid ones)
        VALID_BEDROCK_PII_TYPES = {
            "NAME", "EMAIL", "PHONE", "ADDRESS", "AGE", "USERNAME", "PASSWORD",
            "DRIVER_ID", "LICENSE_PLATE", "US_SOCIAL_SECURITY_NUMBER", "US_PASSPORT_NUMBER",
            "CREDIT_DEBIT_CARD_NUMBER", "CREDIT_DEBIT_CARD_CVV", "CREDIT_DEBIT_CARD_EXPIRY",
            "PIN", "SWIFT_CODE", "INTERNATIONAL_BANK_ACCOUNT_NUMBER",
            "IP_ADDRESS", "MAC_ADDRESS", "URL", "AWS_ACCESS_KEY", "AWS_SECRET_KEY",
            "US_BANK_ACCOUNT_NUMBER", "US_BANK_ROUTING_NUMBER", "CA_HEALTH_NUMBER",
            "CA_SOCIAL_INSURANCE_NUMBER", "UK_NATIONAL_HEALTH_SERVICE_NUMBER",
            "UK_NATIONAL_INSURANCE_NUMBER", "UK_UNIQUE_TAXPAYER_REFERENCE_NUMBER",
            "US_INDIVIDUAL_TAX_IDENTIFICATION_NUMBER", "VEHICLE_IDENTIFICATION_NUMBER",
        }

        if template.pii_entities:
            for entity in template.pii_entities:
                if entity.type.value not in VALID_BEDROCK_PII_TYPES:
                    logger.warning(f"Skipping invalid PII type for Bedrock API: {entity.type.value}")
                    continue
                pii_config.append({
                    "type": entity.type.value,
                    "action": entity.action.value,
                })

        if template.sensitive_regexes:
            for regex in template.sensitive_regexes:
                r = {
                    "name": regex.name,
                    "pattern": regex.pattern,
                    "action": regex.action.value,
                }
                if regex.description:
                    r["description"] = regex.description
                regex_config.append(r)

        if pii_config or regex_config:
            si_config: Dict = {}
            if pii_config:
                si_config["piiEntitiesConfig"] = pii_config
            if regex_config:
                si_config["regexesConfig"] = regex_config
            params["sensitiveInformationPolicyConfig"] = si_config

        # Word policy
        if template.word_filter:
            word_config: Dict = {}
            if template.word_filter.enable_profanity:
                word_config["managedWordListsConfig"] = [{"type": "PROFANITY"}]
            if template.word_filter.blocked_words:
                word_config["wordsConfig"] = [{"text": w} for w in template.word_filter.blocked_words]
            if word_config:
                params["wordPolicyConfig"] = word_config

        # Contextual grounding
        if template.contextual_grounding and template.contextual_grounding.enabled:
            params["contextualGroundingPolicyConfig"] = {
                "filtersConfig": [
                    {"type": "GROUNDING", "threshold": template.contextual_grounding.grounding_threshold},
                    {"type": "RELEVANCE", "threshold": template.contextual_grounding.relevance_threshold},
                ]
            }

        return params

    def _create_bedrock_guardrail(self, template: GuardrailTemplate) -> dict:
        params = self._build_bedrock_params(template)
        resp = self.bedrock_client.create_guardrail(**params)
        return resp

    def _update_bedrock_guardrail(self, template: GuardrailTemplate):
        params = self._build_bedrock_params(template)
        params["guardrailIdentifier"] = template.guardrail_id
        # Remove 'name' from update — cannot change name after creation
        params.pop("name", None)
        self.bedrock_client.update_guardrail(**params)

    def _delete_bedrock_guardrail(self, guardrail_id: str):
        self.bedrock_client.delete_guardrail(guardrailIdentifier=guardrail_id)

    # --- Observability ---

    def get_metrics(self, guardrail_id: str, hours: int = 24) -> GuardrailMetrics:
        """Get guardrail metrics from CloudWatch"""
        end_time = datetime.utcnow()
        start_time = end_time - timedelta(hours=hours)

        metrics = GuardrailMetrics(guardrail_id=guardrail_id)

        try:
            # Get invocation count
            resp = self.cloudwatch_client.get_metric_statistics(
                Namespace="AWS/Bedrock/Guardrails",
                MetricName="Invocations",
                Dimensions=[{"Name": "GuardrailId", "Value": guardrail_id}],
                StartTime=start_time,
                EndTime=end_time,
                Period=3600,
                Statistics=["Sum"],
            )
            for dp in resp.get("Datapoints", []):
                metrics.total_invocations += int(dp.get("Sum", 0))
                metrics.time_series.append({
                    "timestamp": dp["Timestamp"].isoformat(),
                    "invocations": int(dp.get("Sum", 0)),
                })

            # Get blocked count
            resp = self.cloudwatch_client.get_metric_statistics(
                Namespace="AWS/Bedrock/Guardrails",
                MetricName="InvocationsBlocked",
                Dimensions=[{"Name": "GuardrailId", "Value": guardrail_id}],
                StartTime=start_time,
                EndTime=end_time,
                Period=3600,
                Statistics=["Sum"],
            )
            for dp in resp.get("Datapoints", []):
                metrics.blocked_count += int(dp.get("Sum", 0))

            metrics.allowed_count = metrics.total_invocations - metrics.blocked_count
            if metrics.total_invocations > 0:
                metrics.block_rate = round(metrics.blocked_count / metrics.total_invocations * 100, 1)

            # Sort time series
            metrics.time_series.sort(key=lambda x: x["timestamp"])

        except Exception as e:
            logger.warning(f"Failed to fetch CloudWatch metrics for guardrail {guardrail_id}: {e}")

        return metrics

    # --- Presets ---

    def get_presets(self) -> List[GuardrailPreset]:
        return FSI_PRESETS
