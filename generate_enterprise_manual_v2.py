import os
from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml.ns import qn

class RefinedManualGenerator:
    def __init__(self, output_path="NexusOS_Elite_Enterprise_Manual_v3.docx"):
        self.doc = Document()
        self.output_path = output_path
        self.assets_path = "docs/assets"
        self._setup_styles()

    def _setup_styles(self):
        """Configure professional enterprise styles with a premium feel."""
        # Normal Text
        style = self.doc.styles['Normal']
        font = style.font
        font.name = 'Segoe UI'
        font.size = Pt(10.5)
        font.color.rgb = RGBColor(33, 37, 41)

        # Title
        title_style = self.doc.styles['Title']
        title_style.font.name = 'Segoe UI Semibold'
        title_style.font.size = Pt(28)
        title_style.font.color.rgb = RGBColor(26, 54, 104)

        # Heading 1
        h1 = self.doc.styles['Heading 1']
        h1.font.name = 'Segoe UI Semibold'
        h1.font.size = Pt(20)
        h1.font.color.rgb = RGBColor(26, 54, 104)
        h1.paragraph_format.space_before = Pt(24)
        h1.paragraph_format.space_after = Pt(12)

        # Heading 2
        h2 = self.doc.styles['Heading 2']
        h2.font.name = 'Segoe UI Semibold'
        h2.font.size = Pt(15)
        h2.font.color.rgb = RGBColor(52, 73, 94)
        h2.paragraph_format.space_before = Pt(18)
        h2.paragraph_format.space_after = Pt(8)

    def add_title_page(self):
        self.doc.add_paragraph('\n' * 3)
        title = self.doc.add_heading('NexusOS Enterprise HRMS', 0)
        title.alignment = WD_ALIGN_PARAGRAPH.CENTER
        
        subtitle = self.doc.add_paragraph('Unified SaaS Infrastructure & Core Protocol Manual')
        subtitle.alignment = WD_ALIGN_PARAGRAPH.CENTER
        subtitle.runs[0].font.size = Pt(14)
        subtitle.runs[0].font.color.rgb = RGBColor(100, 100, 100)
        
        self.doc.add_paragraph('\n' * 4)
        
        info = self.doc.add_paragraph()
        info.alignment = WD_ALIGN_PARAGRAPH.CENTER
        run = info.add_run('Technical Governance Framework\nVersion 2.5.0-PREMIUM\nInternal Release: April 2026')
        run.font.size = Pt(11)
        
        self.doc.add_page_break()

    def add_section(self, title, description, user_note=None, image_name=None):
        self.doc.add_heading(title, level=2)
        
        # Primary description (Senior tone)
        desc_p = self.doc.add_paragraph(description)
        desc_p.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
        
        # User-specific functional note
        if user_note:
            note_p = self.doc.add_paragraph()
            note_p.paragraph_format.left_indent = Inches(0.3)
            run = note_p.add_run(f"Functional Note: {user_note}")
            run.font.italic = True
            run.font.color.rgb = RGBColor(80, 80, 80)

        if image_name:
            img_path = os.path.join(self.assets_path, image_name)
            if os.path.exists(img_path):
                self.doc.add_paragraph('\n')
                self.doc.add_picture(img_path, width=Inches(5.8))
                last_p = self.doc.paragraphs[-1]
                last_p.alignment = WD_ALIGN_PARAGRAPH.CENTER
                
                caption = self.doc.add_paragraph(f"Capture: {title} Protocol Interface")
                caption.alignment = WD_ALIGN_PARAGRAPH.CENTER
                caption.runs[0].font.size = Pt(8.5)
                caption.runs[0].font.color.rgb = RGBColor(120, 120, 120)
        
        self.doc.add_paragraph('\n')

    def generate(self):
        print("Regenerating Refined Enterprise Manual...")
        self.add_title_page()

        # Chapter 1
        self.doc.add_heading('Chapter 1: Initial Provisioning & Identity', level=1)
        self.add_section("Secure Authentication Gate", 
            "The NexusOS entry point facilitates multi-tenant orchestration, supporting both traditional corporate credentialing and unified Google OAuth integration for enterprise-grade accessibility.",
            "New companies must initialize registration first. This can be executed manually or via Google Auth. If a matching organization domain is not detected, the system prompts for new company creation, designating the primary registrant as the 'Superadmin'.",
            "Screenshot 2026-04-26 040524.png")
            
        self.add_section("Security Hardening Protocol",
            "Upon initial entry via third-party providers, the system enforces a strict security hardening cycle to ensure credential redundancy and maximum data integrity.",
            "If a backup password has not been established, the user is mandated to set one before proceeding to the core workspace.",
            "Screenshot 2026-04-26 040546.png")

        self.add_section("Tenant Identification & Profiling",
            "The foundational workspace identity is established here, capturing critical metadata including corporate addressing and geographic identifiers used in subsequent reporting cycles.",
            "Post-password verification, new users are automatically routed to the Organization Provisioning layer for first-time setup.",
            "Screenshot 2026-04-26 040617.png")

        self.add_section("Dynamic Identity Engine",
            "Administrators define the visual DNA of their workspace. The engine allows for granular control over CSS variables that define the brand presence throughout the application.",
            "The selected theme profile dictates the global UI palette, ensuring that the entire interface reflects the company's established identity.",
            "Screenshot 2026-04-26 040630.png")

        self.add_section("Visual Asset Provisioning",
            "The finalization of the tenant identity involves the injection of corporate visual assets, ensuring high-fidelity brand representation across all system outputs.",
            "Corporate logos uploaded here are dynamically distributed across the administrative panel according to functional requirements.",
            "Screenshot 2026-04-26 040711.png")

        # Chapter 2
        self.doc.add_heading('Chapter 2: Communication Infrastructure', level=1)
        self.add_section("Infrastructure Readiness Audit",
            "Once identity parameters are established, the system provides a comprehensive summary of the administration setup status, clearing the tenant for functional deployment.",
            "Upon successful completion of the setup summary, the administrator is granted full access to the primary Command Dashboard.",
            "Screenshot 2026-04-26 040734.png")

        self.add_section("SMTP Communication Protocol",
            "A prerequisite for organizational scaling. Secure SMTP parameters must be verified to enable automated personnel invitations and system-wide notifications.",
            "The 'Invite Personnel' action triggers a pre-flight check. If SMTP is not configured, the system enforces an immediate configuration intercept.",
            "Screenshot 2026-04-26 040753.png")

        # Chapter 3
        self.doc.add_heading('Chapter 3: Strategic Command & Governance', level=1)
        self.add_section("Corporate Nexus Dashboard",
            "The central Command Dashboard provides the Operational Intelligence Framework. It utilizes high-level data benchmarks to provide instant visibility into organizational health.",
            "The entire dashboard interface dynamically adapts to the company's identity engine, maintaining brand consistency across all metrics.",
            "Screenshot 2026-04-26 040711.png")

        self.add_section("Personnel Invitation Lifecycle",
            "This module manages the secure expansion of the organizational workforce, facilitating role assignment and departmental mapping in a unified workflow.",
            "Successful SMTP provisioning enables the direct distribution of secure invitation tokens to prospective team members.",
            "Screenshot 2026-04-26 041040.png")

        self.add_section("Secure Token Formulation",
            "Generates unique, time-sensitive access strings that allow recipients to bypass manual registration and integrate directly with the corporate tenant.",
            "The system delivers a dynamic email template, themed according to the company's identity engine, providing a premium onboarding experience.",
            "Screenshot 2026-04-26 041142.png")

        # Chapter 4
        self.doc.add_heading('Chapter 4: Structural Hierarchy & Architecture', level=1)
        self.add_section("Personnel Matrix Flow (Live Network)",
            "The Live Network module visualizes the organizational tree in real-time. This interactive graph allows for structural governance through direct node manipulation.",
            "Admins and Superadmins can architect the hierarchy via the UI, connecting or detaching nodes as organizational needs evolve. Standard employees are restricted to 'View Only' mode.",
            "Screenshot 2026-04-26 041949.png")

        self.add_section("Departmental Node Detail",
            "Provides a deep-dive visualization of specific department-level clusters and their respective reporting structures.",
            "This view offers a specialized network perspective tailored to individual departmental governance.",
            "Screenshot 2026-04-26 042019.png")

        # Chapter 5
        self.doc.add_heading('Chapter 5: Operational Governance', level=1)
        self.add_section("Attendance Protocol Control",
            "Enforces operational time-tracking through secure Punch In/Out protocols, providing an audit trail for workforce activity.",
            "Administrators can utilize this module to manage department definitions, designations, and overarching operational clusters.",
            "Screenshot 2026-04-26 042127.png")

        self.add_section("Timesheet Strategic Console",
            "A comprehensive auditing tool for project-based effort tracking. It supports both manual entry and automated bulk uploads via Excel.",
            "Users select assigned projects and submit effort logs for approval. The system supports Excel data payload imports with an integrated template download option for efficiency.",
            "Screenshot 2026-04-26 042558.png")

        self.add_section("Governance Queue: Approvals",
            "The approval module allows reporting managers and HR personnel to audit, approve, or reject submitted timesheets based on project milestones.",
            "Managers execute governance actions directly from their specialized profile consoles.",
            "Screenshot 2026-04-26 042326.png")

        self.add_section("Audit Visibility & Status",
            "Provides employees with full transparency into the status of their submissions, including approval history and rejection justifications for re-submission.",
            "This ensures a closed-loop governance cycle where reasons for rejection can be addressed and remediated for re-approval.",
            "Screenshot 2026-04-26 061203.png")

        # Chapter 6
        self.doc.add_heading('Chapter 6: Advanced Engineering (Elite Builder)', level=1)
        self.add_section("Elite Builder: Architect Mode",
            "The proprietary 'Low-Code' engine for engineering dynamic UI components and complex data orchestration layers.",
            "This builder allows administrators to architect custom employee pages (e.g., /employee/newsample) with native-level performance.",
            "Screenshot 2026-04-26 042828.png")

        self.add_section("UI Render Engine",
            "The core of the SaaS platform. This engine translates architect-defined metadata into live, high-fidelity user interfaces.",
            "Currently in the 'Elite Development' phase, this engine is being optimized to serve as the structural backbone of the entire application ecosystem.",
            "Screenshot 2026-04-26 042848.png")

        self.add_section("Administrative Form Analysis",
            "A real-time monitoring engine that analyzes data flow across the protocol layer, providing insights into form interaction and submission metrics.",
            "Facilitates a deep-dive audit into how organizational data is captured and refined across different protocol levels.",
            "Screenshot 2026-04-26 043010.png")

        # Chapter 7
        self.doc.add_heading('Chapter 7: Operational Status', level=1)
        self.add_section("Final System Health Summary",
            "A concluding view of the fully provisioned enterprise workspace, showing an active, healthy, and audited ecosystem.",
            "This view represents the current employee-level dashboard, showcasing the end-user experience post-provisioning.",
            "Screenshot 2026-04-26 061251.png")

        # Chapter 8
        self.doc.add_heading('Chapter 8: Database Architecture', level=1)
        self.doc.add_heading('Technical Schema Overview', level=2)
        schema_desc = (
            "NexusOS is architected on a high-fidelity relational schema optimized for multi-tenant SaaS operations. "
            "The database ensures strict data isolation between tenants while facilitating complex cross-module governance. "
            "Key data clusters include the Identity Core, Organizational Matrix, and Operational Logic layers."
        )
        self.doc.add_paragraph(schema_desc)

        self.doc.add_heading('Core Entity Relationships', level=2)
        table = self.doc.add_table(rows=1, cols=3)
        table.style = 'Table Grid'
        hdr_cells = table.rows[0].cells
        hdr_cells[0].text = 'Data Cluster'
        hdr_cells[1].text = 'Primary Entities'
        hdr_cells[2].text = 'Operational Significance'

        data = [
            ('Identity Core', 'Company, User, Role', 'Governs global authentication, multi-tenancy, and visual branding.'),
            ('Org Matrix', 'Department, Designation', 'Defines the structural hierarchy and functional workforce clusters.'),
            ('Operation Logic', 'Project, Timesheet, Punch', 'Tracks resource utilization and effort auditing across mission-critical goals.'),
            ('Governance', 'ApprovalLog, Manager Link', 'Enforces the hierarchical approval cycle and operational transparency.'),
            ('Elite Builder', 'UIMetadata, UIPage', 'Stores dynamic JSON configurations and manages low-code interface routing.')
        ]

        for cluster, entities, significance in data:
            row_cells = table.add_row().cells
            row_cells[0].text = cluster
            row_cells[1].text = entities
            row_cells[2].text = significance

        self.doc.save(self.output_path)
        print(f"Refined Manual successfully generated: {self.output_path}")

if __name__ == "__main__":
    generator = RefinedManualGenerator()
    generator.generate()
