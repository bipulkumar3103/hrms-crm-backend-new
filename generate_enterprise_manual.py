import os
from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml.ns import qn
from docx.oxml import OxmlElement

class EnterpriseManualGenerator:
    def __init__(self, output_path="NexusOS_Enterprise_Technical_Manual.docx"):
        self.doc = Document()
        self.output_path = output_path
        self.assets_path = "docs/assets"
        self._setup_styles()

    def _setup_styles(self):
        """Configure professional enterprise styles."""
        style = self.doc.styles['Normal']
        font = style.font
        font.name = 'Calibri'
        font.size = Pt(11)
        font.color.rgb = RGBColor(51, 51, 51)

        # Custom Heading 1
        h1 = self.doc.styles['Heading 1']
        h1.font.name = 'Arial'
        h1.font.size = Pt(24)
        h1.font.bold = True
        h1.font.color.rgb = RGBColor(43, 58, 103) # Corporate Blue

        # Custom Heading 2
        h2 = self.doc.styles['Heading 2']
        h2.font.name = 'Arial'
        h2.font.size = Pt(18)
        h2.font.bold = True
        h2.font.color.rgb = RGBColor(70, 70, 70)

    def add_title_page(self):
        """Create a premium title page."""
        self.doc.add_vertical_margin = Inches(2)
        
        title = self.doc.add_heading('NexusOS Enterprise HRMS', 0)
        title.alignment = WD_ALIGN_PARAGRAPH.CENTER
        
        subtitle = self.doc.add_paragraph('Comprehensive Technical Architecture & Operations Manual')
        subtitle.alignment = WD_ALIGN_PARAGRAPH.CENTER
        subtitle.runs[0].font.size = Pt(16)
        subtitle.runs[0].font.italic = True
        
        self.doc.add_paragraph('\n' * 5)
        
        version = self.doc.add_paragraph('Version 2.4.0-ELITE')
        version.alignment = WD_ALIGN_PARAGRAPH.CENTER
        
        date = self.doc.add_paragraph('Published: April 2026')
        date.alignment = WD_ALIGN_PARAGRAPH.CENTER
        
        self.doc.add_page_break()

    def add_preface(self):
        """Add a senior-level architect preface."""
        self.doc.add_heading('Architect\'s Preface', level=1)
        preface = (
            "This document serves as the definitive source of truth for the NexusOS Enterprise HRMS infrastructure. "
            "As we transition into the next phase of operational scaling, it is imperative that the foundational "
            "protocols—ranging from multi-tenant identity engineering to the Elite Builder logic layer—are "
            "understood at a granular level. "
            "\n\n"
            "Every module documented herein has been engineered with a focus on 'Security-by-Design' and "
            "High-Availability. This manual is intended for stakeholders, system administrators, and lead engineers."
        )
        self.doc.add_paragraph(preface)
        self.doc.add_page_break()

    def add_section(self, title, description, image_name=None):
        """Add a section with title, description, and an optional image."""
        self.doc.add_heading(title, level=2)
        p = self.doc.add_paragraph(description)
        p.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY

        if image_name:
            img_path = os.path.join(self.assets_path, image_name)
            if os.path.exists(img_path):
                self.doc.add_paragraph('\n')
                try:
                    self.doc.add_picture(img_path, width=Inches(6))
                    last_paragraph = self.doc.paragraphs[-1]
                    last_paragraph.alignment = WD_ALIGN_PARAGRAPH.CENTER
                    
                    caption = self.doc.add_paragraph(f"Figure: {title} - Interface Capture")
                    caption.alignment = WD_ALIGN_PARAGRAPH.CENTER
                    caption.runs[0].font.size = Pt(9)
                    caption.runs[0].font.italic = True
                except Exception as e:
                    self.doc.add_paragraph(f"[Image Error: Could not render {image_name}]")
            else:
                self.doc.add_paragraph(f"[Technical Note: Resource {image_name} not found in assets]")
        
        self.doc.add_paragraph('\n')

    def generate(self):
        print("Initializing Manual Generation Engine...")
        self.add_title_page()
        self.add_preface()

        # Chapter 1
        self.doc.add_heading('Chapter 1: Initial Provisioning & Identity', level=1)
        self.add_section("Secure Authentication", 
                        "The NexusOS ecosystem begins with a high-fidelity authentication gate. This interface supports multi-tenant login, allowing users to enter via corporate credentials or unified Google OAuth.",
                        "Screenshot 2026-04-26 040524.png")
        self.add_section("Security Hardening",
                        "For accounts registered via third-party OAuth providers, NexusOS enforces an immediate security hardening protocol. Users must establish a 'Backup Password' to ensure account recovery and maximum enterprise security.",
                        "Screenshot 2026-04-26 040546.png")
        self.add_section("Tenant Identification",
                        "The organization data module establishes the foundational identity of the workspace. This includes corporate addressing and contact information used across the system's reporting engines.",
                        "Screenshot 2026-04-26 040617.png")
        self.add_section("Identity Engine (Theming)",
                        "NexusOS utilizes a dynamic Identity Engine that allows administrators to define foundational CSS variables. These variables brand the entire workspace dashboard UI in real-time.",
                        "Screenshot 2026-04-26 040630.png")
        self.add_section("Visual Asset Management",
                        "Administrators can finalize their tenant identity by uploading corporate logos. The system recommends transparent SVG/PNG assets for seamless integration into the UI.",
                        "Screenshot 2026-04-26 040711.png")

        # Chapter 2
        self.doc.add_heading('Chapter 2: Communication Infrastructure', level=1)
        self.add_section("Administration Setup Summary",
                        "Once core identity is established, the system provides a summary of the administration setup, indicating the tenant is ready for infrastructure provisioning.",
                        "Screenshot 2026-04-26 040734.png")
        self.add_section("SMTP Protocol Establishment",
                        "A critical prerequisite for team collaboration. Before invitations can be sent, administrators must securely establish SMTP parameters.",
                        "Screenshot 2026-04-26 040753.png")

        # Chapter 3
        self.doc.add_heading('Chapter 3: Team Governance', level=1)
        self.add_section("Corporate Nexus Dashboard",
                        "The main dashboard serves as the Operational Intelligence Framework. Note that metrics like Total Workforce and Operational Health are currently rendered with Optimized Static Data as industry benchmarks.",
                        "Screenshot 2026-04-26 040711.png")
        self.add_section("Invite Personnel Workflow",
                        "This module handles the secure deployment of new team members, including role mapping and departmental association.",
                        "Screenshot 2026-04-26 041040.png")
        self.add_section("Secure Link Formulation",
                        "Generates a unique, secure invitation token for recipients to bypass standard registration.",
                        "Screenshot 2026-04-26 041142.png")

        # Chapter 4
        self.doc.add_heading('Chapter 4: Structural Architecture', level=1)
        self.add_section("Personnel Matrix Flow",
                        "The Live Network module provides an interactive Personnel Matrix for structural governance at scale.",
                        "Screenshot 2026-04-26 041949.png")
        self.add_section("Node Detail View",
                        "Deep dive into specific organizational nodes and their reporting lines.",
                        "Screenshot 2026-04-26 042019.png")

        # Chapter 5
        self.doc.add_heading('Chapter 5: Operational Monitoring', level=1)
        self.add_section("Attendance Protocol Console",
                        "Enforces strict time tracking with Punch In/Out protocols.",
                        "Screenshot 2026-04-26 042127.png")
        self.add_section("Timesheet Control Console",
                        "Strategic console for resource auditing, tracking total effort and active nodes.",
                        "Screenshot 2026-04-26 042558.png")

        # Chapter 6
        self.doc.add_heading('Chapter 6: Advanced Intelligence (Elite Builder)', level=1)
        self.add_section("Elite Builder: Architect Mode",
                        "The Low-Code heart of the system for engineering UI components and data flows.",
                        "Screenshot 2026-04-26 042828.png")
        self.add_section("Form Analysis Engine",
                        "Monitors real-time administrative data flow and analyzes form submissions across the protocol layer.",
                        "Screenshot 2026-04-26 043010.png")

        # Chapter 7
        self.doc.add_heading('Chapter 7: Final Status', level=1)
        self.add_section("Final Dashboard Status",
                        "Overview of a healthy, fully provisioned enterprise ecosystem.",
                        "Screenshot 2026-04-26 061203.png")

        self.doc.save(self.output_path)
        print(f"Manual successfully generated: {self.output_path}")

if __name__ == "__main__":
    generator = EnterpriseManualGenerator()
    generator.generate()
