
import os
from app import create_app, db
from app.models.company import Company

# Get the Flask application instance
app = create_app()

def add_company(name, domain, theme_primary_color, logo_original_url, profile_complete):
    """Adds or updates a company in the database."""
    with app.app_context():
        # Check if the company already exists
        company = Company.query.filter_by(domain=domain).first()

        if company:
            # Update existing company
            company.name = name
            company.theme_primary_color = theme_primary_color
            company.logo_original_url = logo_original_url
            company.profile_complete = profile_complete
            print(f"Company with domain '{domain}' updated successfully.")
        else:
            # Create a new company instance
            company = Company(
                name=name,
                domain=domain,
                theme_primary_color=theme_primary_color,
                logo_original_url=logo_original_url,
                profile_complete=profile_complete
            )
            db.session.add(company)
            print(f"Company '{name}' with domain '{domain}' added successfully.")
        
        # Add to the session and commit
        db.session.commit()

if __name__ == '__main__':
    # Example usage:
    # Replace with the actual details of the company you want to add
    company_name = "Bipul's Company"
    company_domain = "gmail.com"
    company_logo_url = ""
    
    add_company(company_name, company_domain, "#FFFFFF", company_logo_url, True)
