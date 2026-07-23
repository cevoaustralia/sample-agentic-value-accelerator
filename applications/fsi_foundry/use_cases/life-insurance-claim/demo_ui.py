"""Life Insurance Claim Validation — Streamlit Demo UI.

Upload identity documents, death certificates, and policy documents to
validate a life insurance claim and receive a GO / NO_GO / REFER decision.

Two modes:
  - Demo mode (default): Uses the sample claim data to simulate the
    agent pipeline without AWS services.
  - Live mode: Calls the full agent pipeline with Textract + Bedrock.
    Requires AWS credentials with Bedrock and Textract access.

Usage:
    cd use_cases/life-insurance-claim
    pip install streamlit
    streamlit run demo_ui.py
"""

from __future__ import annotations

import base64
import json
import os
import time
from datetime import datetime
from pathlib import Path

import streamlit as st

# ---------------------------------------------------------------------------
# Page configuration
# ---------------------------------------------------------------------------

st.set_page_config(
    page_title="Cevo — Life Insurance Claim Validator",
    page_icon="https://cevo.com.au/wp-content/uploads/2021/09/CEVO-logo-smaller.png",
    layout="wide",
    initial_sidebar_state="expanded",
)

# ---------------------------------------------------------------------------
# Cevo branding
# ---------------------------------------------------------------------------

CEVO_BLUE = "#0e41e5"
CEVO_DARK = "#32373c"
CEVO_ORANGE = "#ff8400"
CEVO_AMBER = "#ffcb70"
CEVO_PINK = "#d3145a"
CEVO_PURPLE = "#9b51e0"
CEVO_GRADIENT = "linear-gradient(135deg, #ff9500 0%, #e040a0 50%, #3a50d9 100%)"
CEVO_LOGO_URL = "https://cevo.com.au/wp-content/uploads/2021/09/CEVO-logo.png"
CEVO_LOGO_LOCAL = Path(__file__).parent / "assets" / "cevo-logo.png"

st.markdown(f"""
<style>
    /* Global font */
    .stApp {{
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
    }}
    /* Primary button — gradient */
    .stButton > button[kind="primary"] {{
        background: {CEVO_GRADIENT};
        border: none;
        color: white;
        font-weight: 600;
        font-size: 15px;
        padding: 10px 24px;
        border-radius: 6px;
    }}
    .stButton > button[kind="primary"]:hover {{
        background: linear-gradient(135deg, #ffb940 0%, #b840b0 50%, #3148c0 100%);
        border: none;
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(65,88,208,0.3);
    }}
    /* Dark sidebar */
    [data-testid="stSidebar"] {{
        background: linear-gradient(180deg, {CEVO_DARK} 0%, #1a1d21 100%);
    }}
    [data-testid="stSidebar"] * {{
        color: #e0e0e0 !important;
    }}
    [data-testid="stSidebar"] h1,
    [data-testid="stSidebar"] h2,
    [data-testid="stSidebar"] h3 {{
        color: white !important;
    }}
    [data-testid="stSidebar"] .stMarkdown p {{
        color: #b0b0b0 !important;
    }}
    [data-testid="stSidebar"] label {{
        color: #d0d0d0 !important;
    }}
    /* Headings */
    h1 {{
        color: {CEVO_DARK};
    }}
    h2 {{
        color: {CEVO_DARK};
        border-bottom: 2px solid {CEVO_ORANGE};
        padding-bottom: 6px;
        display: inline-block;
    }}
    h3 {{
        color: {CEVO_PURPLE};
    }}
    /* Progress bar — gradient */
    .stProgress > div > div > div {{
        background: {CEVO_GRADIENT};
    }}
    /* Links */
    a {{
        color: {CEVO_BLUE};
    }}
    /* Hero header with gradient background */
    .cevo-hero {{
        background: {CEVO_GRADIENT};
        border-radius: 12px;
        padding: 24px 32px;
        margin-bottom: 28px;
        display: flex;
        align-items: center;
        gap: 20px;
    }}
    .cevo-hero img {{
        height: 44px;
        filter: brightness(0) invert(1);
    }}
    .cevo-hero .hero-text {{
        color: white;
    }}
    .cevo-hero .hero-title {{
        font-size: 22px;
        font-weight: 700;
        margin: 0;
        color: white;
    }}
    .cevo-hero .hero-sub {{
        font-size: 13px;
        opacity: 0.9;
        margin: 4px 0 0 0;
        color: rgba(255,255,255,0.9);
    }}
    .cevo-hero .hero-badge {{
        margin-left: auto;
        background: rgba(255,255,255,0.2);
        padding: 6px 14px;
        border-radius: 20px;
        font-size: 12px;
        color: white;
        font-weight: 500;
        backdrop-filter: blur(4px);
    }}
    /* Agent step cards — more vibrant */
    .agent-step {{
        border-left: 5px solid;
        padding: 12px 16px;
        margin: 10px 0;
        border-radius: 0 8px 8px 0;
        font-size: 14px;
    }}
    .agent-step.intake {{
        border-color: {CEVO_ORANGE};
        background: linear-gradient(90deg, #fff8f0 0%, #ffffff 100%);
    }}
    .agent-step.identity {{
        border-color: {CEVO_PINK};
        background: linear-gradient(90deg, #fff0f5 0%, #ffffff 100%);
    }}
    .agent-step.validity {{
        border-color: {CEVO_PURPLE};
        background: linear-gradient(90deg, #f8f0ff 0%, #ffffff 100%);
    }}
    .agent-step.synthesis {{
        border-color: {CEVO_BLUE};
        background: linear-gradient(90deg, #f0f4ff 0%, #ffffff 100%);
    }}
    /* Section dividers with gradient */
    .gradient-divider {{
        height: 3px;
        background: {CEVO_GRADIENT};
        border: none;
        margin: 28px 0;
        border-radius: 2px;
    }}
    /* Info cards with coloured tops */
    .info-card {{
        border-radius: 10px;
        padding: 0;
        overflow: hidden;
        border: 1px solid #e9ecef;
        margin-bottom: 12px;
    }}
    .info-card .card-header {{
        padding: 10px 16px;
        font-weight: 600;
        font-size: 13px;
        color: white;
        text-transform: uppercase;
        letter-spacing: 0.5px;
    }}
    .info-card .card-body {{
        padding: 16px;
        background: white;
    }}
    .info-card.orange .card-header {{ background: {CEVO_ORANGE}; }}
    .info-card.pink .card-header {{ background: {CEVO_PINK}; }}
    .info-card.purple .card-header {{ background: {CEVO_PURPLE}; }}
    .info-card.blue .card-header {{ background: {CEVO_BLUE}; }}
    /* Document pill tags */
    .doc-pill {{
        display: inline-block;
        background: linear-gradient(135deg, #f0f0f0 0%, #e8e8e8 100%);
        border: 1px solid #d0d0d0;
        border-radius: 20px;
        padding: 6px 14px;
        margin: 4px;
        font-size: 13px;
    }}
    .doc-pill.identity {{ background: linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%); border-color: {CEVO_ORANGE}; }}
    .doc-pill.death {{ background: linear-gradient(135deg, #fce4ec 0%, #f8bbd0 100%); border-color: {CEVO_PINK}; }}
    .doc-pill.policy {{ background: linear-gradient(135deg, #ede7f6 0%, #d1c4e9 100%); border-color: {CEVO_PURPLE}; }}
    .doc-pill.claim {{ background: linear-gradient(135deg, #e8eaf6 0%, #c5cae9 100%); border-color: {CEVO_BLUE}; }}
    /* Metric mini cards */
    .metric-row {{
        display: flex;
        gap: 12px;
        margin: 12px 0;
    }}
    .metric-card {{
        flex: 1;
        border-radius: 8px;
        padding: 14px;
        text-align: center;
        border: 1px solid #e9ecef;
    }}
    .metric-card .metric-value {{
        font-size: 24px;
        font-weight: 700;
    }}
    .metric-card .metric-label {{
        font-size: 11px;
        color: #6c757d;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        margin-top: 4px;
    }}
    .metric-card.orange {{ background: linear-gradient(135deg, #fff8f0 0%, #fff3e0 100%); }}
    .metric-card.orange .metric-value {{ color: {CEVO_ORANGE}; }}
    .metric-card.pink {{ background: linear-gradient(135deg, #fff0f5 0%, #fce4ec 100%); }}
    .metric-card.pink .metric-value {{ color: {CEVO_PINK}; }}
    .metric-card.purple {{ background: linear-gradient(135deg, #f8f0ff 0%, #ede7f6 100%); }}
    .metric-card.purple .metric-value {{ color: {CEVO_PURPLE}; }}
    .metric-card.blue {{ background: linear-gradient(135deg, #f0f4ff 0%, #e8eaf6 100%); }}
    .metric-card.blue .metric-value {{ color: {CEVO_BLUE}; }}
</style>
""", unsafe_allow_html=True)

# ---------------------------------------------------------------------------
# Sample data (for demo mode)
# ---------------------------------------------------------------------------

DATA_DIR = Path(__file__).parent.parent.parent / "data" / "samples" / "life-insurance-claim"
if not DATA_DIR.exists():
    DATA_DIR = Path(__file__).parent / "data"

SAMPLE_CLAIMS: dict[str, dict] = {}
for claim_dir in sorted(DATA_DIR.glob("CLAIM-LI-*")):
    profile_path = claim_dir / "profile.json"
    if profile_path.exists():
        with open(profile_path) as f:
            data = json.load(f)
            SAMPLE_CLAIMS[data["claim_id"]] = data


# ---------------------------------------------------------------------------
# Simulated agent results (for demo mode without AWS)
# ---------------------------------------------------------------------------

SIMULATED_RESULTS: dict[str, dict] = {
    "CLAIM-LI-001": {
        "decision": "go",
        "confidence_score": 0.94,
        "identity_verified": True,
        "policy_valid": True,
        "death_cert_valid": True,
        "risk_flags": [],
        "explanation": (
            "All submitted documents are complete and consistent. The claimant "
            "Sarah Jane Mitchell is confirmed as the sole beneficiary on policy "
            "LI-2019-004782. Identity verified across passport and claim form with "
            "high confidence. Policy is active with premiums paid up. Death "
            "certificate issued by NSW Registry with consistent details. Cause of "
            "death (acute myocardial infarction) does not trigger any exclusions. "
            "Policy commenced 2019-02-01, well outside the 13-month suicide "
            "exclusion period.\n\n"
            "Recommendation: APPROVE for processing. Sum insured $1,500,000."
        ),
        "document_intake": {
            "documents_processed": 4,
            "overall_completeness": 0.95,
            "missing_documents": [],
            "notes": ["All required document categories present", "Passport image clear and legible"],
        },
        "identity_verification": {
            "identity_confirmed": True,
            "name_consistency_score": 1.0,
            "dob_consistency_score": 1.0,
            "address_consistency_score": 0.95,
            "overall_confidence": 0.97,
            "discrepancies": [],
            "fraud_indicators": [],
        },
        "claim_validity": {
            "policy_status": "active",
            "policy_number": "LI-2019-004782",
            "beneficiary_confirmed": True,
            "death_certificate_valid": True,
            "coverage_applicable": True,
            "sum_insured": 1500000.00,
            "exclusions_triggered": [],
        },
    },
    "CLAIM-LI-002": {
        "decision": "refer",
        "confidence_score": 0.62,
        "identity_verified": False,
        "policy_valid": True,
        "death_cert_valid": True,
        "risk_flags": [
            "Surname discrepancy: claimant ID shows 'Thompson' but policy beneficiary is 'Thomson'",
            "Claimant entitled to 50% share only — second beneficiary not accounted for",
        ],
        "explanation": (
            "The claim presents a moderate discrepancy requiring human review. "
            "The claimant's driver's licence shows surname 'Thompson' (with P) "
            "while the policy beneficiary list records 'Thomson' (without P). "
            "This is likely a spelling variant but cannot be auto-confirmed.\n\n"
            "Additionally, the claimant is only entitled to 50% of the sum insured "
            "($250,000 of $500,000) — the other 50% belongs to Rebecca Louise "
            "Thomson. The claim form does not clarify this split.\n\n"
            "Recommendation: REFER to human claims handler to verify name variant "
            "and confirm payout split between beneficiaries."
        ),
        "document_intake": {
            "documents_processed": 4,
            "overall_completeness": 0.90,
            "missing_documents": [],
            "notes": ["All documents present", "Name spelling variant detected"],
        },
        "identity_verification": {
            "identity_confirmed": False,
            "name_consistency_score": 0.70,
            "dob_consistency_score": 1.0,
            "address_consistency_score": 0.90,
            "overall_confidence": 0.65,
            "discrepancies": ["Surname: 'Thompson' on ID vs 'Thomson' on policy"],
            "fraud_indicators": [],
        },
        "claim_validity": {
            "policy_status": "active",
            "policy_number": "LI-2015-002341",
            "beneficiary_confirmed": False,
            "death_certificate_valid": True,
            "coverage_applicable": True,
            "sum_insured": 500000.00,
            "exclusions_triggered": [],
        },
    },
    "CLAIM-LI-003": {
        "decision": "no_go",
        "confidence_score": 0.96,
        "identity_verified": True,
        "policy_valid": False,
        "death_cert_valid": True,
        "risk_flags": [
            "Policy LAPSED on 2026-04-15 — death occurred 2026-06-20 when not in force",
            "Suicide exclusion applies — death within 8 months of policy commencement",
        ],
        "explanation": (
            "This claim is rejected on two independent grounds:\n\n"
            "1. POLICY LAPSED: The policy LI-2025-009876 lapsed on 2026-04-15 due "
            "to unpaid premiums (last payment March 2026). The insured's death "
            "occurred on 2026-06-20 — over two months after the policy ceased to "
            "be in force. No coverage exists.\n\n"
            "2. SUICIDE EXCLUSION: Even if the policy were active, the cause of "
            "death (suicide by hanging) would trigger the suicide exclusion clause. "
            "The policy commenced 2025-11-01 and death occurred approximately 8 "
            "months later — well within the 13-month exclusion period.\n\n"
            "Recommendation: REJECT. Notify claimant of both grounds for denial."
        ),
        "document_intake": {
            "documents_processed": 4,
            "overall_completeness": 0.92,
            "missing_documents": [],
            "notes": ["All documents present and legible"],
        },
        "identity_verification": {
            "identity_confirmed": True,
            "name_consistency_score": 1.0,
            "dob_consistency_score": 1.0,
            "address_consistency_score": 1.0,
            "overall_confidence": 0.98,
            "discrepancies": [],
            "fraud_indicators": [],
        },
        "claim_validity": {
            "policy_status": "lapsed",
            "policy_number": "LI-2025-009876",
            "beneficiary_confirmed": True,
            "death_certificate_valid": True,
            "coverage_applicable": False,
            "sum_insured": 2000000.00,
            "exclusions_triggered": [
                "Policy lapsed — not in force at date of death",
                "Suicide within 13-month exclusion period",
            ],
        },
    },
}


# ---------------------------------------------------------------------------
# UI helpers
# ---------------------------------------------------------------------------


def decision_badge(decision: str) -> str:
    """Render a coloured badge for the decision."""
    colours = {
        "go": ("✅", CEVO_BLUE, "white"),
        "no_go": ("❌", CEVO_PINK, "white"),
        "refer": ("⚠️", CEVO_ORANGE, "white"),
    }
    icon, bg, fg = colours.get(decision, ("❓", "#6c757d", "white"))
    label = decision.upper().replace("_", " ")
    return f'<span style="background:{bg};color:{fg};padding:6px 16px;border-radius:4px;font-weight:bold;font-size:18px;">{icon} {label}</span>'


def confidence_bar(score: float) -> None:
    """Render a progress bar for confidence using the Cevo gradient."""
    if score >= 0.85:
        bg = CEVO_GRADIENT
    elif score >= 0.40:
        bg = f"linear-gradient(135deg, {CEVO_AMBER} 0%, {CEVO_ORANGE} 100%)"
    else:
        bg = f"linear-gradient(135deg, {CEVO_ORANGE} 0%, {CEVO_PINK} 100%)"
    st.markdown(
        f"""<div style="background:#e9ecef;border-radius:6px;height:28px;width:100%;overflow:hidden;">
            <div style="background:{bg};height:28px;border-radius:6px;width:{score*100:.0f}%;
                        text-align:center;color:white;font-size:13px;line-height:28px;font-weight:600;">
                {score:.0%}
            </div>
        </div>""",
        unsafe_allow_html=True,
    )


def render_agent_result(title: str, data: dict, icon: str = "📋") -> None:
    """Render a collapsible agent result section."""
    with st.expander(f"{icon} {title}", expanded=False):
        st.json(data)


# ---------------------------------------------------------------------------
# Main UI
# ---------------------------------------------------------------------------


def main():
    # Cevo gradient hero banner
    st.markdown(
        f"""<div class="cevo-hero">
            <img src="{CEVO_LOGO_URL}" alt="Cevo" />
            <div class="hero-text">
                <p class="hero-title">Life Insurance Claim Validator</p>
                <p class="hero-sub">AI-powered document validation &amp; identity verification</p>
            </div>
            <span class="hero-badge">Amazon Bedrock + Strands Agents</span>
        </div>""",
        unsafe_allow_html=True,
    )

    st.markdown(
        "Upload identity documents, death certificates, and policy records "
        "to validate a life insurance claim and receive a **GO / NO_GO / REFER** decision."
    )

    # Sidebar
    with st.sidebar:
        st.markdown(
            f'<div style="text-align:center;padding:8px 0 16px 0;">'
            f'<img src="{CEVO_LOGO_URL}" style="height:32px;filter:brightness(0) invert(1);" />'
            f'</div>',
            unsafe_allow_html=True,
        )

        st.header("Configuration")

        mode = st.radio(
            "Mode",
            ["Demo (sample claims)", "Upload documents"],
            index=0,
            help="Demo mode uses pre-built sample claims. Upload mode accepts your own documents.",
        )

        use_llm = st.toggle(
            "🧠 Use Claude (Live mode)",
            value=False,
            help="Requires AWS credentials with Bedrock + Textract access in the configured region.",
        )

        if use_llm:
            st.info(
                "Live mode will call Amazon Textract and Bedrock. "
                "Ensure your AWS credentials are configured.",
                icon="☁️",
            )

        st.divider()
        st.markdown("**Decision Thresholds**")
        st.markdown(
            f'<div style="margin:8px 0;">'
            f'<span style="display:inline-block;width:10px;height:10px;background:{CEVO_BLUE};border-radius:50%;margin-right:6px;"></span>Auto-approve: ≥ 85%<br/>'
            f'<span style="display:inline-block;width:10px;height:10px;background:{CEVO_ORANGE};border-radius:50%;margin-right:6px;"></span>Refer: 40%–85%<br/>'
            f'<span style="display:inline-block;width:10px;height:10px;background:{CEVO_PINK};border-radius:50%;margin-right:6px;"></span>Auto-reject: &lt; 40%'
            f'</div>',
            unsafe_allow_html=True,
        )

        st.divider()
        st.markdown(
            f'<div style="text-align:center;padding:12px 0;">'
            f'<div style="background:{CEVO_GRADIENT};height:3px;border-radius:2px;margin-bottom:12px;"></div>'
            f'<span style="font-size:11px;color:#888;">Powered by Amazon Bedrock AgentCore<br/>+ Strands Agents Framework</span>'
            f'</div>',
            unsafe_allow_html=True,
        )

    # --- Main area ---

    if mode == "Demo (sample claims)":
        _render_demo_mode(use_llm)
    else:
        _render_upload_mode(use_llm)


def _render_demo_mode(use_llm: bool = False):
    """Demo mode — select a sample claim and see simulated results."""
    st.subheader("Select a sample claim")

    if not SAMPLE_CLAIMS:
        st.error(
            "No sample data found. Ensure the `data/samples/life-insurance-claim/` "
            "directory contains CLAIM-LI-* folders with profile.json files."
        )
        return

    # Claim selector
    claim_labels = {}
    for cid, data in SAMPLE_CLAIMS.items():
        expected = data.get("expected_decision", "unknown").upper().replace("_", " ")
        claimant = data.get("claimant", {}).get("full_name", "Unknown")
        claim_labels[cid] = f"{cid} — {claimant} (expected: {expected})"

    selected_id = st.selectbox("Claim", list(claim_labels.keys()), format_func=lambda x: claim_labels[x])

    claim_data = SAMPLE_CLAIMS[selected_id]
    sim_result = SIMULATED_RESULTS.get(selected_id, {})

    col1, col2 = st.columns([1, 1])

    with col1:
        # Claimant card
        claimant = claim_data["claimant"]
        st.markdown(
            f"""<div class="info-card orange">
                <div class="card-header">Claimant</div>
                <div class="card-body">
                    <strong>{claimant['full_name']}</strong> ({claimant['relationship_to_deceased']})<br/>
                    DOB: {claimant['date_of_birth']}<br/>
                    📍 {claimant['address']}
                </div>
            </div>""",
            unsafe_allow_html=True,
        )

        # Deceased card
        deceased = claim_data["deceased"]
        st.markdown(
            f"""<div class="info-card pink">
                <div class="card-header">Deceased</div>
                <div class="card-body">
                    <strong>{deceased['full_name']}</strong><br/>
                    Date of death: {deceased['date_of_death']}<br/>
                    Cause: {deceased['cause_of_death']}<br/>
                    📍 {deceased.get('place_of_death', 'N/A')}
                </div>
            </div>""",
            unsafe_allow_html=True,
        )

    with col2:
        # Policy card
        policy = claim_data["policy"]
        status_colour = CEVO_BLUE if policy['policy_status'] == 'active' else CEVO_PINK
        st.markdown(
            f"""<div class="info-card purple">
                <div class="card-header">Policy</div>
                <div class="card-body">
                    <strong>{policy['policy_number']}</strong><br/>
                    Status: <span style="color:{status_colour};font-weight:600;">{policy['policy_status'].upper()}</span><br/>
                    Sum insured: <strong>${policy['sum_insured']:,.0f}</strong><br/>
                    Product: {policy['product_type'].replace('_', ' ').title()}<br/>
                    Start: {policy['policy_start_date']}
                </div>
            </div>""",
            unsafe_allow_html=True,
        )

        # Documents card with coloured pills
        doc_pills = ""
        for doc in claim_data.get("documents", []):
            cat = doc.get("category", "unknown")
            pill_class = {
                "identity_document": "identity",
                "death_certificate": "death",
                "policy_document": "policy",
                "claim_form": "claim",
            }.get(cat, "")
            doc_pills += f'<span class="doc-pill {pill_class}">📄 {doc["document_name"]}</span>'

        st.markdown(
            f"""<div class="info-card blue">
                <div class="card-header">Documents Submitted ({len(claim_data.get('documents', []))})</div>
                <div class="card-body">{doc_pills}</div>
            </div>""",
            unsafe_allow_html=True,
        )

    # Run validation button
    st.divider()

    if st.button("🔍 Run Claim Validation", type="primary", use_container_width=True):
        if use_llm:
            _run_live_validation_demo(selected_id, claim_data)
        else:
            _run_simulated_validation(selected_id, sim_result)


def _run_simulated_validation(claim_id: str, result: dict):
    """Display simulated validation results with animated progress."""
    # Simulated progress
    progress = st.progress(0)
    status = st.status("Running validation pipeline...", expanded=True)

    with status:
        st.markdown('<div class="agent-step intake">📥 <b>Step 1/3:</b> Document Intake — extracting data via Textract + Bedrock Vision...</div>', unsafe_allow_html=True)
        progress.progress(15)
        time.sleep(0.8)
        st.write("✅ Documents classified and data extracted")
        progress.progress(33)

        time.sleep(0.5)
        st.markdown('<div class="agent-step identity">🪪 <b>Step 2a:</b> Identity Verification — cross-referencing identity data across documents</div>', unsafe_allow_html=True)
        st.markdown('<div class="agent-step validity">📋 <b>Step 2b:</b> Claim Validity — checking policy status, beneficiary, death certificate</div>', unsafe_allow_html=True)
        progress.progress(50)
        time.sleep(1.0)
        st.write("✅ Verification and validity checks complete")
        progress.progress(75)

        time.sleep(0.5)
        st.markdown('<div class="agent-step synthesis">⚖️ <b>Step 3/3:</b> Decision Synthesis — producing GO / NO_GO / REFER</div>', unsafe_allow_html=True)
        progress.progress(90)
        time.sleep(0.6)
        st.write("✅ Decision produced")
        progress.progress(100)

    status.update(label="Validation complete", state="complete")

    # Gradient divider
    st.markdown('<div class="gradient-divider"></div>', unsafe_allow_html=True)
    st.markdown("## Decision")

    col_dec, col_conf = st.columns([1, 1])
    with col_dec:
        st.markdown(decision_badge(result["decision"]), unsafe_allow_html=True)
    with col_conf:
        st.markdown("**Confidence:**")
        confidence_bar(result["confidence_score"])

    # Verification metrics row
    id_verified = result.get("identity_verified", False)
    policy_valid = result.get("policy_valid", False)
    death_valid = result.get("death_cert_valid", False)

    st.markdown(
        f"""<div class="metric-row">
            <div class="metric-card {'blue' if id_verified else 'pink'}">
                <div class="metric-value">{'✓' if id_verified else '✗'}</div>
                <div class="metric-label">Identity Verified</div>
            </div>
            <div class="metric-card {'purple' if policy_valid else 'pink'}">
                <div class="metric-value">{'✓' if policy_valid else '✗'}</div>
                <div class="metric-label">Policy Valid</div>
            </div>
            <div class="metric-card {'orange' if death_valid else 'pink'}">
                <div class="metric-value">{'✓' if death_valid else '✗'}</div>
                <div class="metric-label">Death Cert Valid</div>
            </div>
        </div>""",
        unsafe_allow_html=True,
    )

    # Risk flags
    if result.get("risk_flags"):
        st.markdown("### 🚩 Risk Flags")
        for flag in result["risk_flags"]:
            st.warning(flag, icon="⚠️")

    # Explanation
    st.markdown("### Explanation")
    st.markdown(result["explanation"])

    # Detailed agent results
    st.markdown('<div class="gradient-divider"></div>', unsafe_allow_html=True)
    st.markdown("### Agent Results")
    if result.get("document_intake"):
        render_agent_result("Document Intake Agent", result["document_intake"], "📥")
    if result.get("identity_verification"):
        render_agent_result("Identity Verification Agent", result["identity_verification"], "🪪")
    if result.get("claim_validity"):
        render_agent_result("Claim Validity Agent", result["claim_validity"], "📋")


def _run_live_validation_demo(claim_id: str, claim_data: dict):
    """Run the LIVE agent pipeline against sample claim documents in S3."""
    from live_orchestrator import run_full_validation

    progress = st.progress(0)
    status = st.status("Running LIVE validation pipeline (Textract + Bedrock)...", expanded=True)

    intake_data = None
    identity_result = None
    validity_result = None
    final_decision = None

    with status:
        for step, result in run_full_validation(claim_id):
            if step == "intake_start":
                st.markdown('<div class="agent-step intake">📥 <b>Document Intake Agent</b> — calling Amazon Textract AnalyzeID + AnalyzeDocument...</div>', unsafe_allow_html=True)
                progress.progress(10)
            elif step == "intake_complete":
                intake_data = result
                n_docs = result.get("documents_processed", 0)
                st.write(f"✅ Textract extracted data from **{n_docs} documents**")
                progress.progress(30)
            elif step == "verification_start":
                st.markdown('<div class="agent-step identity">🪪 <b>Identity Verification Agent</b> — Claude cross-referencing identity data...</div>', unsafe_allow_html=True)
                progress.progress(40)
            elif step == "verification_complete":
                identity_result = result
                confirmed = result.get("identity_confirmed", False)
                conf = result.get("overall_confidence", 0)
                st.write(f"✅ Identity {'confirmed' if confirmed else 'NOT confirmed'} (confidence: {conf:.0%})")
                progress.progress(55)
                st.markdown('<div class="agent-step validity">📋 <b>Claim Validity Agent</b> — Claude checking policy + exclusions...</div>', unsafe_allow_html=True)
            elif step == "validity_complete":
                validity_result = result
                policy_status = result.get("policy_status", "unknown")
                st.write(f"✅ Policy status: **{policy_status.upper()}**")
                progress.progress(75)
            elif step == "synthesis_start":
                st.markdown('<div class="agent-step synthesis">⚖️ <b>Decision Synthesis</b> — Claude producing final GO / NO_GO / REFER...</div>', unsafe_allow_html=True)
                progress.progress(85)
            elif step == "synthesis_complete":
                final_decision = result
                progress.progress(100)
                st.write("✅ Decision produced")

    status.update(label="Live validation complete", state="complete")

    if not final_decision:
        st.error("Pipeline failed to produce a decision.")
        return

    # Display results
    st.markdown('<div class="gradient-divider"></div>', unsafe_allow_html=True)
    st.markdown("## Decision")

    decision = final_decision.get("decision", "refer")
    confidence = final_decision.get("confidence_score", 0.0)

    col_dec, col_conf = st.columns([1, 1])
    with col_dec:
        st.markdown(decision_badge(decision), unsafe_allow_html=True)
    with col_conf:
        st.markdown("**Confidence:**")
        confidence_bar(confidence)

    # Verification metrics
    id_verified = final_decision.get("identity_verified", False)
    policy_valid = final_decision.get("policy_valid", False)
    death_valid = final_decision.get("death_cert_valid", False)

    st.markdown(
        f"""<div class="metric-row">
            <div class="metric-card {'blue' if id_verified else 'pink'}">
                <div class="metric-value">{'✓' if id_verified else '✗'}</div>
                <div class="metric-label">Identity Verified</div>
            </div>
            <div class="metric-card {'purple' if policy_valid else 'pink'}">
                <div class="metric-value">{'✓' if policy_valid else '✗'}</div>
                <div class="metric-label">Policy Valid</div>
            </div>
            <div class="metric-card {'orange' if death_valid else 'pink'}">
                <div class="metric-value">{'✓' if death_valid else '✗'}</div>
                <div class="metric-label">Death Cert Valid</div>
            </div>
        </div>""",
        unsafe_allow_html=True,
    )

    # Risk flags
    risk_flags = final_decision.get("risk_flags", [])
    if risk_flags:
        st.markdown("### 🚩 Risk Flags")
        for flag in risk_flags:
            st.warning(flag, icon="⚠️")

    # Explanation
    st.markdown("### Explanation")
    st.markdown(final_decision.get("explanation", "No explanation available."))

    # Detailed agent results
    st.markdown('<div class="gradient-divider"></div>', unsafe_allow_html=True)
    st.markdown("### Agent Results (Live)")

    if intake_data:
        with st.expander("📥 Document Intake Agent — Textract Results", expanded=False):
            st.json(intake_data)
    if identity_result:
        with st.expander("🪪 Identity Verification Agent — Claude Analysis", expanded=False):
            st.json(identity_result)
    if validity_result:
        with st.expander("📋 Claim Validity Agent — Claude Analysis", expanded=False):
            st.json(validity_result)
    if final_decision:
        with st.expander("⚖️ Decision Synthesis — Claude Final Decision", expanded=False):
            st.json(final_decision)


def _render_upload_mode(use_llm: bool):
    """Upload mode — user uploads their own documents."""
    st.subheader("Upload claim documents")

    st.markdown(
        "Upload the documents for a life insurance claim. The system will "
        "classify each document, extract data, verify identity, and validate "
        "the claim."
    )

    col1, col2 = st.columns(2)

    with col1:
        claim_id = st.text_input("Claim ID", value="CLAIM-LI-NEW", help="A unique identifier for this claim")
        claimant_name = st.text_input("Claimant name", placeholder="e.g. Sarah Jane Mitchell")
        relationship = st.selectbox("Relationship to deceased", ["spouse", "child", "parent", "sibling", "other"])

    with col2:
        deceased_name = st.text_input("Deceased name", placeholder="e.g. David Robert Mitchell")
        policy_number = st.text_input("Policy number", placeholder="e.g. LI-2019-004782")

    st.divider()
    st.markdown("### Upload Documents")

    id_docs = st.file_uploader(
        "Identity Documents (passport, driver's licence, government ID)",
        type=["jpg", "jpeg", "png", "pdf"],
        accept_multiple_files=True,
        key="id_docs",
    )

    death_cert = st.file_uploader(
        "Death Certificate",
        type=["jpg", "jpeg", "png", "pdf"],
        accept_multiple_files=False,
        key="death_cert",
    )

    policy_doc = st.file_uploader(
        "Policy Document",
        type=["jpg", "jpeg", "png", "pdf"],
        accept_multiple_files=False,
        key="policy_doc",
    )

    claim_form = st.file_uploader(
        "Claim Form (optional)",
        type=["jpg", "jpeg", "png", "pdf"],
        accept_multiple_files=False,
        key="claim_form",
    )

    # Summarise uploads
    all_uploads = []
    if id_docs:
        for doc in id_docs:
            all_uploads.append(("identity_document", doc))
    if death_cert:
        all_uploads.append(("death_certificate", death_cert))
    if policy_doc:
        all_uploads.append(("policy_document", policy_doc))
    if claim_form:
        all_uploads.append(("claim_form", claim_form))

    if all_uploads:
        st.markdown(f"**{len(all_uploads)} document(s) ready for validation**")

    st.divider()

    if st.button("🔍 Validate Claim", type="primary", use_container_width=True, disabled=not all_uploads):
        if not use_llm:
            st.info(
                "Live mode is OFF. Enable '🧠 Use Claude' in the sidebar to "
                "run the full agent pipeline against your uploaded documents.\n\n"
                "In demo mode, switch to 'Demo (sample claims)' to see simulated results.",
                icon="ℹ️",
            )
        else:
            _run_live_validation(claim_id, all_uploads)


def _run_live_validation(claim_id: str, uploads: list):
    """Run the real agent pipeline against uploaded documents.

    This requires AWS credentials and the full agent stack.
    """
    progress = st.progress(0)
    status = st.status("Running live validation pipeline...", expanded=True)

    with status:
        st.write("📤 Uploading documents to processing pipeline...")
        progress.progress(10)

        # Encode documents for processing
        documents = []
        for category, uploaded_file in uploads:
            content = uploaded_file.read()
            documents.append({
                "filename": uploaded_file.name,
                "category": category,
                "content_type": uploaded_file.type,
                "content_base64": base64.b64encode(content).decode("utf-8"),
                "size_bytes": len(content),
            })
            uploaded_file.seek(0)  # Reset for potential re-read

        st.write(f"✅ {len(documents)} document(s) prepared")
        progress.progress(20)

        try:
            # Import the orchestrator and run
            import sys
            sys.path.insert(0, str(Path(__file__).parent / "src"))

            from strands.orchestrator import LifeInsuranceClaimOrchestrator
            from strands.models import ClaimValidationRequest, ValidationType

            st.write("🔍 Starting agent pipeline...")
            progress.progress(30)

            # For live mode, we'd need to upload to S3 first and then
            # call the orchestrator. For now, show the integration point.
            st.write("📥 **Step 1/3:** Document Intake Agent — calling Textract + Bedrock Vision...")
            progress.progress(50)

            st.write("🔍 **Step 2/3:** Identity Verification + Claim Validity (parallel)...")
            progress.progress(75)

            st.write("⚖️ **Step 3/3:** Decision synthesis...")
            progress.progress(90)

            # TODO: Wire up actual S3 upload + orchestrator invocation
            # For now, indicate the integration point
            st.warning(
                "Full live integration requires S3 document upload and "
                "AgentCore runtime. See README.md for deployment instructions.",
                icon="🚧",
            )
            progress.progress(100)

        except ImportError as e:
            st.error(f"Failed to import agent modules: {e}")
            progress.progress(100)
        except Exception as e:
            st.error(f"Pipeline error: {e}")
            progress.progress(100)

    status.update(label="Pipeline complete", state="complete")


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    main()
else:
    main()
