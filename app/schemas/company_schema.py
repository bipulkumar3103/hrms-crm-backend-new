
from marshmallow_sqlalchemy import SQLAlchemyAutoSchema
from app.models.company import Company

class CompanySchema(SQLAlchemyAutoSchema):
    class Meta:
        model = Company
        load_instance = True
        # By explicitly listing the fields to include, we prevent any serialization
        # errors from relationships or other non-serializable attributes.
        fields = (
            "id", "name", "domain", "address", "logo_original_url", 
            "logo_medium_url", "logo_small_url", "phone", "website", 
            "profile_complete", "theme_primary_color", "theme_secondary_color",
            "theme_accent_color", "theme_bg_color", "theme_text_color",
            "smtp_host", "smtp_port", "smtp_username", "smtp_from_email"
        )
