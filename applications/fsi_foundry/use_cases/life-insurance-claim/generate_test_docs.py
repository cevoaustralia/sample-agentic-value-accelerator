"""Generate synthetic test documents for CLAIM-LI-001.

Creates realistic-looking PDFs that Textract can process:
  - Passport page (identity document)
  - Death certificate
  - Policy schedule
  - Claim form

These are clearly marked as SAMPLE/SPECIMEN and contain the structured
data from the CLAIM-LI-001 profile.
"""

import os
import os
from pathlib import Path
from fpdf import FPDF

OUTPUT_DIR = Path(__file__).parent / "test_documents" / "CLAIM-LI-001"
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)


def create_passport():
    """Generate a synthetic Australian passport data page."""
    pdf = FPDF()
    pdf.add_page()
    pdf.set_auto_page_break(auto=False)

    # Header
    pdf.set_fill_color(0, 51, 102)  # Navy blue
    pdf.rect(0, 0, 210, 35, "F")
    pdf.set_text_color(255, 255, 255)
    pdf.set_font("Helvetica", "B", 16)
    pdf.set_y(8)
    pdf.cell(0, 10, "AUSTRALIAN PASSPORT", align="C", new_x="LMARGIN", new_y="NEXT")
    pdf.set_font("Helvetica", "", 10)
    pdf.cell(0, 8, "COMMONWEALTH OF AUSTRALIA", align="C", new_x="LMARGIN", new_y="NEXT")

    # SPECIMEN watermark
    pdf.set_text_color(200, 200, 200)
    pdf.set_font("Helvetica", "B", 60)
    pdf.set_y(100)
    pdf.cell(0, 20, "SPECIMEN", align="C", new_x="LMARGIN", new_y="NEXT")

    # Document fields
    pdf.set_text_color(0, 0, 0)
    pdf.set_y(45)

    fields = [
        ("Type", "P"),
        ("Country Code", "AUS"),
        ("Surname", "MITCHELL"),
        ("Given Names", "SARAH JANE"),
        ("Nationality", "AUSTRALIAN"),
        ("Date of Birth", "14 MAR 1982"),
        ("Sex", "F"),
        ("Place of Birth", "SYDNEY, NSW"),
        ("Date of Issue", "15 JUN 2022"),
        ("Date of Expiry", "15 JUN 2032"),
        ("Passport No.", "PA4821937"),
        ("Authority", "AUSTRALIAN PASSPORT OFFICE"),
        ("Address", "47 Harbour View Road, Mosman NSW 2088"),
    ]

    for label, value in fields:
        pdf.set_font("Helvetica", "", 9)
        pdf.set_text_color(80, 80, 80)
        pdf.cell(55, 7, label, new_x="RIGHT")
        pdf.set_font("Helvetica", "B", 11)
        pdf.set_text_color(0, 0, 0)
        pdf.cell(0, 7, value, new_x="LMARGIN", new_y="NEXT")

    # MRZ line (machine readable zone)
    pdf.set_y(250)
    pdf.set_font("Courier", "", 9)
    pdf.set_text_color(0, 0, 0)
    pdf.cell(0, 5, "P<AUSMITCHELL<<SARAH<JANE<<<<<<<<<<<<<<<<<<<<<", new_x="LMARGIN", new_y="NEXT")
    pdf.cell(0, 5, "PA4821937<6AUS8203145F3206151<<<<<<<<<<<<<<02", new_x="LMARGIN", new_y="NEXT")

    output_path = OUTPUT_DIR / "passport_sarah_mitchell.pdf"
    pdf.output(str(output_path))
    print(f"  Created: {output_path}")
    return output_path


def create_death_certificate():
    """Generate a synthetic NSW death certificate."""
    pdf = FPDF()
    pdf.add_page()
    pdf.set_auto_page_break(auto=False)

    # Header with coat of arms simulation
    pdf.set_fill_color(0, 82, 136)
    pdf.rect(0, 0, 210, 40, "F")
    pdf.set_text_color(255, 255, 255)
    pdf.set_font("Helvetica", "B", 14)
    pdf.set_y(8)
    pdf.cell(0, 8, "NEW SOUTH WALES", align="C", new_x="LMARGIN", new_y="NEXT")
    pdf.set_font("Helvetica", "B", 18)
    pdf.cell(0, 10, "CERTIFICATE OF DEATH", align="C", new_x="LMARGIN", new_y="NEXT")
    pdf.set_font("Helvetica", "", 10)
    pdf.cell(0, 8, "Registry of Births, Deaths and Marriages", align="C", new_x="LMARGIN", new_y="NEXT")

    # SPECIMEN watermark
    pdf.set_text_color(220, 220, 220)
    pdf.set_font("Helvetica", "B", 55)
    pdf.set_y(120)
    pdf.cell(0, 20, "SPECIMEN", align="C", new_x="LMARGIN", new_y="NEXT")

    # Registration details
    pdf.set_text_color(0, 0, 0)
    pdf.set_y(48)

    pdf.set_font("Helvetica", "B", 10)
    pdf.cell(0, 8, "Registration Number: 2026/NSW/184729", new_x="LMARGIN", new_y="NEXT")
    pdf.cell(0, 8, "Date of Registration: 2 June 2026", new_x="LMARGIN", new_y="NEXT")

    pdf.ln(8)

    fields = [
        ("Full Name of Deceased", "David Robert MITCHELL"),
        ("Date of Death", "28 May 2026"),
        ("Place of Death", "Royal North Shore Hospital, St Leonards NSW"),
        ("Date of Birth", "22 August 1979"),
        ("Age at Death", "46 years"),
        ("Sex", "Male"),
        ("Usual Residence", "47 Harbour View Road, Mosman NSW 2088"),
        ("Occupation", "Software Engineer"),
        ("Marital Status", "Married"),
        ("Spouse", "Sarah Jane Mitchell"),
        ("", ""),
        ("CAUSE OF DEATH", ""),
        ("1(a) Direct Cause", "Acute Myocardial Infarction"),
        ("1(b) Due to", "Coronary Artery Disease"),
        ("1(c) Due to", "Atherosclerosis"),
        ("", ""),
        ("Manner of Death", "Natural Causes"),
        ("", ""),
        ("Certifying Doctor", "Dr. James H. Worthington, MBBS FRACP"),
        ("Medical Practitioner No.", "MPN0047821"),
        ("Date Certified", "28 May 2026"),
        ("Place of Certification", "Royal North Shore Hospital"),
        ("", ""),
        ("Registrar", "A. Thompson, Deputy Registrar"),
        ("Date of Issue", "5 June 2026"),
    ]

    for label, value in fields:
        if not label and not value:
            pdf.ln(4)
            continue
        if not value:
            pdf.set_font("Helvetica", "B", 11)
            pdf.set_text_color(0, 51, 102)
            pdf.cell(0, 8, label, new_x="LMARGIN", new_y="NEXT")
            continue
        pdf.set_font("Helvetica", "", 9)
        pdf.set_text_color(80, 80, 80)
        pdf.cell(60, 7, label, new_x="RIGHT")
        pdf.set_font("Helvetica", "B", 10)
        pdf.set_text_color(0, 0, 0)
        pdf.cell(0, 7, value, new_x="LMARGIN", new_y="NEXT")

    # Official seal text
    pdf.set_y(255)
    pdf.set_font("Helvetica", "I", 8)
    pdf.set_text_color(100, 100, 100)
    pdf.cell(0, 5, "This certificate is issued under the Births, Deaths and Marriages Registration Act 1995 (NSW)", align="C", new_x="LMARGIN", new_y="NEXT")
    pdf.cell(0, 5, "Official Seal of the NSW Registry of Births, Deaths and Marriages", align="C", new_x="LMARGIN", new_y="NEXT")

    output_path = OUTPUT_DIR / "death_certificate_david_mitchell.pdf"
    pdf.output(str(output_path))
    print(f"  Created: {output_path}")
    return output_path


def create_policy_schedule():
    """Generate a synthetic life insurance policy schedule."""
    pdf = FPDF()
    pdf.add_page()
    pdf.set_auto_page_break(auto=False)

    # Company header
    pdf.set_fill_color(42, 87, 141)
    pdf.rect(0, 0, 210, 30, "F")
    pdf.set_text_color(255, 255, 255)
    pdf.set_font("Helvetica", "B", 18)
    pdf.set_y(8)
    pdf.cell(0, 12, "AUSTRALIAN LIFE INSURANCE CO.", align="C", new_x="LMARGIN", new_y="NEXT")
    pdf.set_font("Helvetica", "", 9)
    pdf.cell(0, 6, "ABN 12 345 678 901 | AFSL 234567", align="C", new_x="LMARGIN", new_y="NEXT")

    # Title
    pdf.set_text_color(0, 0, 0)
    pdf.set_y(38)
    pdf.set_font("Helvetica", "B", 16)
    pdf.cell(0, 10, "POLICY SCHEDULE", align="C", new_x="LMARGIN", new_y="NEXT")
    pdf.set_font("Helvetica", "", 10)
    pdf.cell(0, 8, "Term Life Insurance", align="C", new_x="LMARGIN", new_y="NEXT")

    # SPECIMEN
    pdf.set_text_color(220, 220, 220)
    pdf.set_font("Helvetica", "B", 50)
    pdf.set_y(130)
    pdf.cell(0, 20, "SPECIMEN", align="C", new_x="LMARGIN", new_y="NEXT")

    pdf.set_text_color(0, 0, 0)
    pdf.set_y(62)
    pdf.ln(4)

    # Policy details
    sections = [
        ("POLICY DETAILS", [
            ("Policy Number", "LI-2019-004782"),
            ("Policy Type", "Term Life Insurance"),
            ("Policy Status", "ACTIVE"),
            ("Commencement Date", "1 February 2019"),
            ("Policy Term", "20 years"),
            ("Expiry Date", "1 February 2039"),
            ("Premium Frequency", "Monthly"),
            ("Premium Amount", "$187.50/month"),
            ("Premium Status", "Paid Up - Current"),
            ("Last Premium Received", "1 June 2026"),
        ]),
        ("LIFE INSURED", [
            ("Full Name", "David Robert Mitchell"),
            ("Date of Birth", "22 August 1979"),
            ("Address", "47 Harbour View Road, Mosman NSW 2088"),
            ("Smoker Status", "Non-smoker"),
        ]),
        ("COVERAGE", [
            ("Sum Insured", "$1,500,000.00"),
            ("Cover Type", "Death Only"),
            ("Indexation", "CPI annually"),
        ]),
        ("BENEFICIARY", [
            ("Primary Beneficiary", "Sarah Jane Mitchell"),
            ("Relationship", "Spouse"),
            ("Share", "100%"),
            ("Beneficiary DOB", "14 March 1982"),
            ("Beneficiary Address", "47 Harbour View Road, Mosman NSW 2088"),
        ]),
        ("EXCLUSIONS", [
            ("1.", "Suicide within 13 months of policy commencement"),
            ("2.", "Death resulting from criminal activity by the insured"),
            ("3.", "Death while participating in professional motor racing"),
        ]),
    ]

    for section_title, fields in sections:
        pdf.set_font("Helvetica", "B", 11)
        pdf.set_text_color(42, 87, 141)
        pdf.cell(0, 8, section_title, new_x="LMARGIN", new_y="NEXT")
        pdf.set_draw_color(42, 87, 141)
        pdf.line(10, pdf.get_y(), 200, pdf.get_y())
        pdf.ln(2)

        for label, value in fields:
            pdf.set_font("Helvetica", "", 9)
            pdf.set_text_color(80, 80, 80)
            pdf.cell(55, 6, label, new_x="RIGHT")
            pdf.set_font("Helvetica", "B", 9)
            pdf.set_text_color(0, 0, 0)
            pdf.cell(0, 6, value, new_x="LMARGIN", new_y="NEXT")
        pdf.ln(3)

    # Footer
    pdf.set_y(270)
    pdf.set_font("Helvetica", "I", 8)
    pdf.set_text_color(100, 100, 100)
    pdf.cell(0, 4, "This schedule forms part of your Policy Document. Please retain for your records.", align="C")

    output_path = OUTPUT_DIR / "policy_schedule_LI-2019-004782.pdf"
    pdf.output(str(output_path))
    print(f"  Created: {output_path}")
    return output_path


def create_claim_form():
    """Generate a synthetic life insurance claim form."""
    pdf = FPDF()
    pdf.add_page()
    pdf.set_auto_page_break(auto=False)

    # Header
    pdf.set_fill_color(42, 87, 141)
    pdf.rect(0, 0, 210, 25, "F")
    pdf.set_text_color(255, 255, 255)
    pdf.set_font("Helvetica", "B", 14)
    pdf.set_y(6)
    pdf.cell(0, 10, "LIFE INSURANCE CLAIM FORM", align="C", new_x="LMARGIN", new_y="NEXT")

    pdf.set_text_color(0, 0, 0)
    pdf.set_y(32)

    # Form reference
    pdf.set_font("Helvetica", "B", 9)
    pdf.cell(0, 6, "Form Ref: CLF-2026-0615-001          Date: 15 June 2026", new_x="LMARGIN", new_y="NEXT")
    pdf.cell(0, 6, "Policy Number: LI-2019-004782", new_x="LMARGIN", new_y="NEXT")
    pdf.ln(6)

    sections = [
        ("SECTION A: CLAIMANT DETAILS", [
            ("Full Name", "Sarah Jane Mitchell"),
            ("Date of Birth", "14 March 1982"),
            ("Address", "47 Harbour View Road, Mosman NSW 2088"),
            ("Phone", "+61 412 345 678"),
            ("Email", "sarah.mitchell@email.com.au"),
            ("Relationship to Deceased", "Spouse"),
        ]),
        ("SECTION B: DECEASED DETAILS", [
            ("Full Name of Deceased", "David Robert Mitchell"),
            ("Date of Birth", "22 August 1979"),
            ("Date of Death", "28 May 2026"),
            ("Place of Death", "Royal North Shore Hospital, St Leonards NSW"),
            ("Cause of Death", "Acute Myocardial Infarction"),
        ]),
        ("SECTION C: CLAIM DETAILS", [
            ("Claim Type", "Death Benefit"),
            ("Amount Claimed", "$1,500,000.00 (full sum insured)"),
            ("Bank Account (BSB)", "062-000"),
            ("Bank Account Number", "****4821"),
            ("Account Name", "Sarah Jane Mitchell"),
        ]),
        ("SECTION D: SUPPORTING DOCUMENTS", [
            ("Certified copy of Death Certificate", "YES - Attached"),
            ("Original or certified ID (claimant)", "YES - Australian Passport"),
            ("Policy Schedule or Policy Number", "YES - Attached"),
            ("Probate / Letters of Administration", "N/A - Named beneficiary"),
        ]),
        ("SECTION E: DECLARATION", [
            ("", "I declare that the information provided in this form is true"),
            ("", "and correct to the best of my knowledge."),
            ("", ""),
            ("Signature", "_______Sarah J Mitchell_______"),
            ("Date Signed", "15 June 2026"),
            ("Witnessed By", "Dr. Amanda Chen (JP)"),
        ]),
    ]

    for section_title, fields in sections:
        pdf.set_font("Helvetica", "B", 10)
        pdf.set_text_color(42, 87, 141)
        pdf.cell(0, 7, section_title, new_x="LMARGIN", new_y="NEXT")
        pdf.set_draw_color(180, 180, 180)
        pdf.line(10, pdf.get_y(), 200, pdf.get_y())
        pdf.ln(2)

        for label, value in fields:
            if not label:
                pdf.set_font("Helvetica", "I", 9)
                pdf.set_text_color(60, 60, 60)
                pdf.cell(0, 5, value, new_x="LMARGIN", new_y="NEXT")
                continue
            pdf.set_font("Helvetica", "", 9)
            pdf.set_text_color(80, 80, 80)
            pdf.cell(55, 6, label, new_x="RIGHT")
            pdf.set_font("Helvetica", "B", 9)
            pdf.set_text_color(0, 0, 0)
            pdf.cell(0, 6, value, new_x="LMARGIN", new_y="NEXT")
        pdf.ln(3)

    output_path = OUTPUT_DIR / "claim_form_signed.pdf"
    pdf.output(str(output_path))
    print(f"  Created: {output_path}")
    return output_path


if __name__ == "__main__":
    print("Generating test documents for CLAIM-LI-001...")
    print()
    passport = create_passport()
    death_cert = create_death_certificate()
    policy = create_policy_schedule()
    claim_form = create_claim_form()
    print()
    print(f"All documents created in: {OUTPUT_DIR}")
    print()
    print("To upload to S3:")
    bucket = os.environ.get("S3_BUCKET", "<your-bucket-name>")
    prefix = "samples/life-insurance-claim/CLAIM-LI-001/documents"
    print(f"  aws s3 cp {OUTPUT_DIR}/ s3://{bucket}/{prefix}/ --recursive --profile <your-profile> --region ap-southeast-2")
