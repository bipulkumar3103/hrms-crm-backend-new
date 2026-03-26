from datetime import datetime
from app import db
from sqlalchemy.dialects.postgresql import JSONB

# --- Enterprise Metadata Engine Models ---

class UIPage(db.Model):
    """
    Table: pages (GEMINI.md Line 447)
    Represents dynamic page definitions for the multi-tenant CMS.
    """
    __tablename__ = 'pages'
    id = db.Column(db.Integer, primary_key=True)
    company_id = db.Column(db.Integer, db.ForeignKey('companies.id'), nullable=False, index=True)
    name = db.Column(db.String(100), nullable=False)
    slug = db.Column(db.String(100), nullable=True)
    route = db.Column(db.String(100), nullable=True)
    title = db.Column(db.String(150), nullable=True)
    is_active = db.Column(db.Boolean, default=True)

    sections = db.relationship('PageSection', backref='page', lazy='joined', cascade="all, delete-orphan", order_by="PageSection.order")
    
    # Relationship to the permissions
    permissions = db.relationship('PagePermission', back_populates='page', lazy='dynamic', cascade="all, delete-orphan")

    def is_accessible_by(self, user):
        """Checks if a given user has permission to access this page."""
        if not user or self.company_id != user.company_id:
            return False

        # Superadmins have universal access within their scope (though this might need refinement)
        if user.has_role('superadmin'):
            return True

        # Get all role IDs for this page
        allowed_role_ids = {p.role_id for p in self.permissions}

        if not allowed_role_ids:
            # If a page has no specific permissions, deny access by default for security.
            # Alternatively, you could allow access to all authenticated users of the company.
            # Denying by default is the safer option.
            return False

        # Check if the user has any of the allowed roles
        user_role_ids = {role.id for role in user.roles}

        # The `isdisjoint` method returns True if the two sets have no common elements.
        # So, we return the opposite (not isdisjoint) to indicate if there is an overlap.
        return not allowed_role_ids.isdisjoint(user_role_ids)

class PageSection(db.Model):
    """
    Table: page_sections (GEMINI.md Line 448)
    Handles layout segments and auto-flow logic (Grid/Flex).
    """
    __tablename__ = 'page_sections'
    id = db.Column(db.Integer, primary_key=True)
    page_id = db.Column(db.Integer, db.ForeignKey('pages.id'), nullable=False)
    company_id = db.Column(db.Integer, db.ForeignKey('companies.id'), nullable=False, index=True)
    name = db.Column(db.String(100))
    layout_type = db.Column(db.String(50), default='grid') # grid, flex, auto-flow
    order = db.Column(db.Integer, default=0)
    config = db.Column(db.JSON, default=dict) # Grid gap, padding, etc.

    components = db.relationship('UIComponent', backref='section', lazy='dynamic', cascade="all, delete-orphan")

class UIComponent(db.Model):
    """
    Represents dynamic UI elements rendered per role/user/company.
    Aligned with GEMINI.md Line 449.
    """
    __tablename__ = 'ui_components'
    id = db.Column(db.Integer, primary_key=True)
    section_id = db.Column(db.Integer, db.ForeignKey('page_sections.id'), nullable=False)
    company_id = db.Column(db.Integer, db.ForeignKey('companies.id'), nullable=False, index=True)
    type = db.Column(db.String(50), nullable=False) # card_sm, card_lg, table, form
    title = db.Column(db.String(100))
    style_config = db.Column(db.JSON, nullable=False, default=dict) # border_width, color_variant
    data_source_id = db.Column(db.Integer, db.ForeignKey('virtual_entities.id'), nullable=True)
    order = db.Column(db.Integer, default=0)

class FormDefinition(db.Model):
    """
    Table: forms (GEMINI.md Line 452)
    Handles dynamic form builder logic.
    """
    __tablename__ = 'forms'
    id = db.Column(db.Integer, primary_key=True)
    company_id = db.Column(db.Integer, db.ForeignKey('companies.id'), nullable=False, index=True)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    
    fields = db.relationship('FormField', backref='form', lazy='dynamic', cascade="all, delete-orphan")

class FormField(db.Model):
    """
    Table: form_fields (GEMINI.md Line 453)
    Specific fields within a dynamic form.
    """
    __tablename__ = 'form_fields'
    id = db.Column(db.Integer, primary_key=True)
    form_id = db.Column(db.Integer, db.ForeignKey('forms.id'), nullable=False)
    company_id = db.Column(db.Integer, db.ForeignKey('companies.id'), nullable=False, index=True)
    label = db.Column(db.String(100), nullable=False)
    field_type = db.Column(db.String(50), nullable=False)
    is_required = db.Column(db.Boolean, default=False)
    validation_logic = db.Column(db.JSON)
    sort_order = db.Column(db.Integer, default=0)

class FieldVisibilityRule(db.Model):
    """
    Table: field_visibility_rules (GEMINI.md Line 454)
    Conditional logic for UI/Form fields.
    """
    __tablename__ = 'field_visibility_rules'
    id = db.Column(db.Integer, primary_key=True)
    company_id = db.Column(db.Integer, db.ForeignKey('companies.id'), nullable=False, index=True)
    target_field_id = db.Column(db.Integer, db.ForeignKey('form_fields.id'))
    condition_logic = db.Column(db.JSON, nullable=False) # e.g., show if other_field == true

# --- Workflow Domain (GEMINI.md Lines 493-505) ---

class Workflow(db.Model):
    """
    Table: workflows
    Base definition of an automated business process.
    """
    __tablename__ = 'workflows'
    id = db.Column(db.Integer, primary_key=True)
    company_id = db.Column(db.Integer, db.ForeignKey('companies.id'), nullable=False, index=True)
    name = db.Column(db.String(100), nullable=False)
    trigger_event = db.Column(db.String(50)) # on_create, on_update, manual
    is_active = db.Column(db.Boolean, default=True)

    steps = db.relationship('WorkflowStep', backref='workflow', lazy='dynamic', cascade="all, delete-orphan", order_by="WorkflowStep.step_order")

class WorkflowStep(db.Model):
    """
    Table: workflow_steps
    Specific milestone or task within a workflow.
    """
    __tablename__ = 'workflow_steps'
    id = db.Column(db.Integer, primary_key=True)
    workflow_id = db.Column(db.Integer, db.ForeignKey('workflows.id'), nullable=False)
    company_id = db.Column(db.Integer, db.ForeignKey('companies.id'), nullable=False, index=True)
    name = db.Column(db.String(100))
    step_type = db.Column(db.String(50)) # approval, notification, task, branching
    step_order = db.Column(db.Integer, default=0)
    config = db.Column(db.JSON, default=dict) # e.g., assignee_role, due_in_hours

    # Defines the collection of rules that belong to this step.
    rules = db.relationship('WorkflowRule', foreign_keys='WorkflowRule.step_id', back_populates='step', lazy='dynamic', cascade="all, delete-orphan")
    
    # Defines the collection of rules that lead TO this step from a previous step's 'next_step_id'.
    incoming_rules = db.relationship('WorkflowRule', foreign_keys='WorkflowRule.next_step_id', back_populates='next_step', lazy='dynamic')
    
    actions = db.relationship('WorkflowAction', backref='step', lazy='dynamic', cascade="all, delete-orphan")

class WorkflowRule(db.Model):
    """
    Table: workflow_rules
    Handles conditional logic and branching for workflow steps.
    """
    __tablename__ = 'workflow_rules'
    id = db.Column(db.Integer, primary_key=True)
    step_id = db.Column(db.Integer, db.ForeignKey('workflow_steps.id'), nullable=False)
    company_id = db.Column(db.Integer, db.ForeignKey('companies.id'), nullable=False, index=True)
    condition_logic = db.Column(db.JSON, nullable=False) # e.g., if leave_days > 5 go to CFO_Approval
    next_step_id = db.Column(db.Integer, db.ForeignKey('workflow_steps.id'), nullable=True)

    # Links a rule back to its parent WorkflowStep.
    # Populates the 'rules' collection on the WorkflowStep model.
    step = db.relationship('WorkflowStep', foreign_keys=[step_id], back_populates='rules')
    
    # Links a rule to the next WorkflowStep if the condition is met.
    # Populates the 'incoming_rules' collection on the target WorkflowStep.
    next_step = db.relationship('WorkflowStep', foreign_keys=[next_step_id], back_populates='incoming_rules')

class WorkflowAction(db.Model):
    """
    Table: workflow_actions
    The actual task to be performed when a step is reached or executed.
    """
    __tablename__ = 'workflow_actions'
    id = db.Column(db.Integer, primary_key=True)
    step_id = db.Column(db.Integer, db.ForeignKey('workflow_steps.id'), nullable=False)
    company_id = db.Column(db.Integer, db.ForeignKey('companies.id'), nullable=False, index=True)
    action_type = db.Column(db.String(50)) # send_email, update_field, generate_pdf, approve_record
    execution_config = db.Column(db.JSON) # e.g., template_id, target_field, value

# --- Audit Domain ---

class AuditLog(db.Model):
    """
    Table: audit_logs
    Enterprise-grade activity tracking for compliance and security.
    """
    __tablename__ = 'audit_logs'
    id = db.Column(db.Integer, primary_key=True)
    company_id = db.Column(db.Integer, db.ForeignKey('companies.id'), nullable=False, index=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'))
    action = db.Column(db.String(100)) # CREATE, UPDATE, DELETE, LOGIN
    resource_type = db.Column(db.String(100)) # Page, Form, Record, User
    resource_id = db.Column(db.Integer)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)
    ip_address = db.Column(db.String(45))
    user_agent = db.Column(db.String(255))

    user = db.relationship('User', backref=db.backref('audit_logs', lazy='dynamic'))

class DataChangeLog(db.Model):
    """
    Table: data_change_logs
    Granular tracking of specific field-level changes for historical data auditing.
    """
    __tablename__ = 'data_change_logs'
    id = db.Column(db.Integer, primary_key=True)
    company_id = db.Column(db.Integer, db.ForeignKey('companies.id'), nullable=False, index=True)
    resource_type = db.Column(db.String(100))
    resource_id = db.Column(db.Integer)
    column_name = db.Column(db.String(100))
    record_id = db.Column(db.Integer) # Polymorphic reference to VirtualRecord.id
    entity_name = db.Column(db.String(100)) # e.g., Employee_Profile
    field_name = db.Column(db.String(100))
    old_value = db.Column(db.Text)
    new_value = db.Column(db.Text)
    changed_at = db.Column(db.DateTime, default=datetime.utcnow)
    changed_by = db.Column(db.Integer, db.ForeignKey('users.id'))
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'))

# --- Data Domain (Refactored) ---

class VirtualEntity(db.Model):
    __tablename__ = 'virtual_entities'
    id = db.Column(db.Integer, primary_key=True)
    company_id = db.Column(db.Integer, db.ForeignKey('companies.id'), nullable=False, index=True)
    name = db.Column(db.String(100), nullable=False)
    display_name = db.Column(db.String(100))
    is_system_defined = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class VirtualField(db.Model):
    __tablename__ = 'virtual_fields'
    id = db.Column(db.Integer, primary_key=True)
    company_id = db.Column(db.Integer, db.ForeignKey('companies.id'), nullable=False, index=True)
    entity_id = db.Column(db.Integer, db.ForeignKey('virtual_entities.id'), nullable=False)
    name = db.Column(db.String(100), nullable=False)
    data_type = db.Column(db.String(50), nullable=False)
    validation_rules = db.Column(db.JSON)

class VirtualRecord(db.Model):
    __tablename__ = 'virtual_records'
    id = db.Column(db.Integer, primary_key=True)
    entity_id = db.Column(db.Integer, db.ForeignKey('virtual_entities.id'), nullable=False)
    company_id = db.Column(db.Integer, db.ForeignKey('companies.id'), nullable=False, index=True)
    creator_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    creator = db.relationship('User', backref=db.backref('virtual_records', lazy='dynamic'))

class VirtualValue(db.Model):
    __tablename__ = 'virtual_values'
    id = db.Column(db.Integer, primary_key=True)
    company_id = db.Column(db.Integer, db.ForeignKey('companies.id'), nullable=False, index=True)
    record_id = db.Column(db.Integer, db.ForeignKey('virtual_records.id'), nullable=False)
    field_id = db.Column(db.Integer, db.ForeignKey('virtual_fields.id'), nullable=False)
    value = db.Column(db.Text)
    value_json = db.Column(db.JSON)
