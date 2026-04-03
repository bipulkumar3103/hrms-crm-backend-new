"""
mail_service.py
~~~~~~~~~~~~~~~~
Sends enterprise-grade HTML emails using the company's own SMTP configuration
stored in the database. Every field from the Company model is leveraged to
produce genuinely branded, SaaS-quality emails.
"""

import smtplib
import ssl
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
import logging
from datetime import datetime

logger = logging.getLogger(__name__)


def _hex_to_rgb(hex_color):
    """Convert #RRGGBB to 'R, G, B' string for rgba() usage."""
    h = hex_color.lstrip('#')
    if len(h) == 3:
        h = ''.join(c * 2 for c in h)
    return f"{int(h[0:2],16)}, {int(h[2:4],16)}, {int(h[4:6],16)}"


def _darken_hex(hex_color, factor=0.25):
    """Mix a hex color towards black by the given factor (0=no change, 1=black)."""
    h = hex_color.lstrip('#')
    if len(h) == 3:
        h = ''.join(c * 2 for c in h)
    r = int(int(h[0:2], 16) * (1 - factor))
    g = int(int(h[2:4], 16) * (1 - factor))
    b = int(int(h[4:6], 16) * (1 - factor))
    return f"#{r:02x}{g:02x}{b:02x}"


def _build_invitation_html(company, recipient_name, recipient_email, invitation_link, role_name):
    """Builds a fully-branded enterprise invitation email — every color comes from the company theme."""

    # ── Theme colors ──────────────────────────────────────────────────────────
    primary      = company.theme_primary_color   or '#3730A3'
    secondary    = company.theme_secondary_color or '#EEF2FF'
    accent       = company.theme_accent_color    or primary   # fallback to primary
    bg_color     = company.theme_bg_color        or '#f0f4f8'
    text_color   = company.theme_text_color      or '#0f172a'

    # Derived shades (all from the company primary — no hardcoding)
    primary_dark  = _darken_hex(primary, 0.55)   # very dark for gradient start
    primary_mid   = _darken_hex(primary, 0.30)   # mid tone for gradient middle
    primary_rgb   = _hex_to_rgb(primary)
    text_muted    = _darken_hex(text_color, -0.5) if text_color != '#0f172a' else '#475569'

    # ── Company info ──────────────────────────────────────────────────────────
    company_name  = company.name
    domain        = company.domain or ''
    website       = company.website or (f'https://{domain}' if domain else '')
    address       = company.address or ''
    phone         = company.phone or ''
    logo_url      = company.logo_large_url or company.logo_medium_url or ''
    year          = datetime.now().year
    role_label    = role_name.replace('_', ' ').title()

    # ── Logo / wordmark ───────────────────────────────────────────────────────
    if logo_url:
        logo_block = f'<img src="{logo_url}" alt="{company_name}" style="max-height:44px;max-width:180px;object-fit:contain;display:block;margin:0 auto;" />'
    else:
        logo_block = (
            f'<table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center">'
            f'<tr>'
            f'<td style="width:38px;height:38px;border-radius:10px;background:rgba(255,255,255,0.18);'
            f'border:1px solid rgba(255,255,255,0.28);text-align:center;vertical-align:middle;'
            f'font-family:Arial,sans-serif;font-size:18px;font-weight:800;color:#ffffff;">'
            f'{company_name[0].upper()}</td>'
            f'<td style="padding-left:10px;font-family:Arial,sans-serif;font-size:19px;font-weight:800;'
            f'color:#ffffff;letter-spacing:-0.5px;">{company_name}</td>'
            f'</tr></table>'
        )

    # ── Footer contact line ────────────────────────────────────────────────────
    contact_parts = []
    if website:
        display = website.replace('https://','').replace('http://','').rstrip('/')
        contact_parts.append(f'<a href="{website}" style="color:{accent};text-decoration:none;">{display}</a>')
    if phone:
        contact_parts.append(f'<span style="color:#94a3b8;">{phone}</span>')
    if address:
        contact_parts.append(f'<span style="color:#94a3b8;">{address}</span>')
    contact_html = ' &nbsp;·&nbsp; '.join(contact_parts) if contact_parts else ''

    return f"""<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <title>You're invited to join {company_name}</title>
  <!--[if mso]>
  <noscript>
    <xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml>
  </noscript>
  <![endif]-->
</head>
<body style="margin:0;padding:0;background-color:{bg_color};-webkit-font-smoothing:antialiased;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
         style="background-color:{bg_color};padding:32px 0 48px;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0"
               style="max-width:600px;width:100%;">

          <!-- HEADER: top accent bar -->
          <tr>
            <td style="border-radius:16px 16px 0 0;background:{primary};padding:4px 0;font-size:0;line-height:0;">&nbsp;</td>
          </tr>
          <!-- HEADER: main dark panel -->
          <tr>
            <td style="background:linear-gradient(160deg, {primary_dark} 0%, {primary_mid} 55%, {primary} 100%);
                       padding:44px 48px 48px;text-align:center;">

              <!-- Logo -->
              <div style="margin-bottom:24px;">{logo_block}</div>

              <!-- Badge pill -->
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center"
                     style="margin-bottom:20px;">
                <tr>
                  <td style="border-radius:100px;padding:5px 16px;
                             background:rgba(255,255,255,0.10);
                             border:1px solid rgba(255,255,255,0.18);
                             font-family:'Segoe UI',Helvetica,Arial,sans-serif;
                             font-size:10.5px;font-weight:700;
                             color:rgba(255,255,255,0.8);
                             letter-spacing:1.4px;text-transform:uppercase;">
                    * &nbsp;Team Workspace Invitation&nbsp; *
                  </td>
                </tr>
              </table>

              <!-- Headline -->
              <h1 style="margin:0 0 12px;font-family:'Segoe UI',Helvetica,Arial,sans-serif;
                          font-size:32px;font-weight:800;color:#ffffff;letter-spacing:-0.8px;
                          line-height:1.15;">
                You've been invited
              </h1>
              <p style="margin:0 auto;font-family:'Segoe UI',Helvetica,Arial,sans-serif;
                         font-size:15px;color:rgba(255,255,255,0.55);line-height:1.6;
                         max-width:360px;">
                Join <strong style="color:rgba(255,255,255,0.9);">{company_name}</strong> and
                start collaborating with your team.
              </p>

              <!-- Decorative divider (table-safe, no position) -->
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center"
                     style="margin-top:28px;">
                <tr>
                  <td style="width:40px;height:1px;background:rgba(255,255,255,0.12);font-size:0;line-height:0;">&nbsp;</td>
                  <td style="width:8px;">&nbsp;</td>
                  <td style="width:24px;height:3px;border-radius:100px;background:{primary};font-size:0;line-height:0;">&nbsp;</td>
                  <td style="width:8px;">&nbsp;</td>
                  <td style="width:40px;height:1px;background:rgba(255,255,255,0.12);font-size:0;line-height:0;">&nbsp;</td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- BODY -->
          <tr>
            <td style="background:#ffffff;padding:40px 48px 32px;">

              <!-- Recipient greeting -->
              <p style="margin:0 0 6px;font-family:'Segoe UI',Helvetica,Arial,sans-serif;
                         font-size:12px;font-weight:700;color:{accent};
                         letter-spacing:1px;text-transform:uppercase;">
                Hi there,
              </p>
              <h2 style="margin:0 0 18px;font-family:'Segoe UI',Helvetica,Arial,sans-serif;
                          font-size:24px;font-weight:700;color:{text_color};letter-spacing:-0.5px;">
                {recipient_name}
              </h2>
              <p style="margin:0 0 28px;font-family:'Segoe UI',Helvetica,Arial,sans-serif;
                         font-size:15px;color:{text_color};line-height:1.75;">
                You've been personally selected to join the
                <strong style="color:{text_color};">{company_name}</strong> workspace on our HR platform.
                As a <strong style="color:{primary};">{role_label}</strong>, you'll have access to
                the tools your team uses every day.
              </p>

              <!-- Role info card -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
                     style="margin-bottom:28px;border-radius:12px;
                            background:linear-gradient(135deg,{secondary} 0%,#f8faff 100%);
                            border:1px solid rgba({primary_rgb},0.15);">
                <tr>
                  <td style="padding:18px 22px;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td>
                          <p style="margin:0 0 3px;font-family:'Segoe UI',Helvetica,Arial,sans-serif;
                                     font-size:11px;font-weight:700;color:#94a3b8;
                                     letter-spacing:0.8px;text-transform:uppercase;">
                            Your Account Details
                          </p>
                        </td>
                      </tr>
                      <tr>
                        <td width="50%" style="padding-top:10px;">
                          <p style="margin:0;font-family:'Segoe UI',Helvetica,Arial,sans-serif;
                                     font-size:12px;color:#64748b;">Email</p>
                          <p style="margin:2px 0 0;font-family:'Segoe UI',Helvetica,Arial,sans-serif;
                                     font-size:14px;font-weight:600;color:#0f172a;">{recipient_email}</p>
                        </td>
                        <td width="50%" style="padding-top:10px;">
                          <p style="margin:0;font-family:'Segoe UI',Helvetica,Arial,sans-serif;
                                     font-size:12px;color:#64748b;">Role</p>
                          <p style="margin:2px 0 0;font-family:'Segoe UI',Helvetica,Arial,sans-serif;
                                     font-size:14px;font-weight:600;color:{primary};">{role_label}</p>
                        </td>
                      </tr>
                      <tr>
                        <td column="2" style="padding-top:12px;">
                          <p style="margin:0;font-family:'Segoe UI',Helvetica,Arial,sans-serif;
                                     font-size:12px;color:#64748b;">Organization</p>
                          <p style="margin:2px 0 0;font-family:'Segoe UI',Helvetica,Arial,sans-serif;
                                     font-size:14px;font-weight:600;color:#0f172a;">{company_name}</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Steps -->
              <p style="margin:0 0 16px;font-family:'Segoe UI',Helvetica,Arial,sans-serif;
                         font-size:13px;font-weight:700;color:#0f172a;">
                Get started in 2 steps:
              </p>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
                     style="margin-bottom:32px;">
                <tr>
                  <td style="padding-bottom:12px;">
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td style="width:28px;height:28px;border-radius:50%;text-align:center;
                                   background:{primary};line-height:28px;font-size:12px;
                                   font-weight:800;color:#fff;vertical-align:top;">1</td>
                        <td style="padding-left:12px;vertical-align:top;">
                          <p style="margin:4px 0 0;font-family:'Segoe UI',Helvetica,Arial,sans-serif;
                                     font-size:14px;color:#334155;">
                            Click the button below and set your secure password
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td>
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td style="width:28px;height:28px;border-radius:50%;text-align:center;
                                   background:{primary};line-height:28px;font-size:12px;
                                   font-weight:800;color:#fff;vertical-align:top;">2</td>
                        <td style="padding-left:12px;vertical-align:top;">
                          <p style="margin:4px 0 0;font-family:'Segoe UI',Helvetica,Arial,sans-serif;
                                     font-size:14px;color:#334155;">
                            Log in and start using your {company_name} workspace
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- CTA Button -->
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center"
                     style="margin:0 auto 32px;">
                <tr>
                  <td align="center" style="border-radius:12px;
                      background:linear-gradient(135deg, #1e1b4b 0%, {primary} 100%);
                      box-shadow:0 6px 24px rgba({primary_rgb},0.4);">
                    <a href="{invitation_link}"
                       style="display:inline-block;padding:16px 44px;
                              font-family:'Segoe UI',Helvetica,Arial,sans-serif;
                              font-size:15px;font-weight:700;color:#ffffff;
                              text-decoration:none;letter-spacing:-0.2px;">
                      Activate My Account &rarr;
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Expiry & security note -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
                     style="background:#fafafa;border:1px solid #f1f5f9;border-radius:10px;margin-bottom:24px;">
                <tr>
                  <td style="padding:14px 18px;">
                    <p style="margin:0;font-family:'Segoe UI',Helvetica,Arial,sans-serif;
                               font-size:12.5px;color:#64748b;line-height:1.6;">
                      🔒 <strong style="color:#475569;">Security note:</strong>
                      This invitation link is unique to you and should not be shared.
                      If you weren't expecting this invitation, you can safely ignore this email.
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Link fallback -->
              <p style="margin:0 0 6px;font-family:'Segoe UI',Helvetica,Arial,sans-serif;
                         font-size:12px;color:#94a3b8;">
                Button not working? Copy and paste this link into your browser:
              </p>
              <p style="margin:0;padding:10px 14px;background:#f8fafc;border:1px solid #e2e8f0;
                         border-radius:8px;word-break:break-all;
                         font-family:'Courier New',monospace;font-size:11.5px;color:#64748b;">
                {invitation_link}
              </p>
            </td>
          </tr>

          <!-- ═══════════════ DIVIDER ═══════════════ -->
          <tr>
            <td style="background:#ffffff;padding:0 48px;">
              <div style="border-top:1px solid #f1f5f9;"></div>
            </td>
          </tr>

          <!-- ═══════════════ FOOTER ═══════════════ -->
          <tr>
            <td style="background:#ffffff;padding:24px 48px 32px;border-radius:0 0 16px 16px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td>
                    <!-- Company info -->
                    <p style="margin:0 0 4px;font-family:'Segoe UI',Helvetica,Arial,sans-serif;
                               font-size:13px;font-weight:700;color:#0f172a;">
                      {company_name}
                    </p>
                    <p style="margin:0;font-family:'Segoe UI',Helvetica,Arial,sans-serif;
                               font-size:12px;color:#94a3b8;line-height:1.6;">
                      {contact_html}
                    </p>
                  </td>
                  <td align="right" style="vertical-align:top;">
                    <p style="margin:0;font-family:'Segoe UI',Helvetica,Arial,sans-serif;
                               font-size:11px;color:#cbd5e1;">
                      &copy; {year} {company_name}. All rights reserved.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- ═══════════════ OUTER FOOTER ═══════════════ -->
          <tr>
            <td style="padding:20px 0 0;text-align:center;">
              <p style="margin:0;font-family:'Segoe UI',Helvetica,Arial,sans-serif;
                         font-size:11.5px;color:#cbd5e1;line-height:1.6;">
                This email was sent to
                <a href="mailto:{recipient_email}" style="color:#94a3b8;text-decoration:none;">{recipient_email}</a>
                because you were invited to join {company_name}.<br/>
                Powered by <strong style="color:#94a3b8;">NexusOS HRMS</strong>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>"""


def _build_invitation_plain(company, recipient_name, recipient_email, invitation_link, role_name):
    """Plain-text fallback for email clients that don't render HTML."""
    role_label = role_name.replace('_', ' ').title()
    lines = [
        f"Hi {recipient_name},",
        "",
        f"You've been invited to join {company.name} as a {role_label}.",
        "",
        "To activate your account, set your password using the link below:",
        invitation_link,
        "",
        "Your account details:",
        f"  Email    : {recipient_email}",
        f"  Role     : {role_label}",
        f"  Company  : {company.name}",
    ]
    if company.website:
        lines.append(f"  Website  : {company.website}")
    if company.address:
        lines.append(f"  Address  : {company.address}")
    lines += [
        "",
        "Security notice: This link is unique to you. Do not share it.",
        "If you weren't expecting this invitation, you can safely ignore this email.",
        "",
        f"— The {company.name} Team",
        f"Powered by NexusOS HRMS",
    ]
    return "\n".join(lines)


def send_invitation_email(company, recipient_email, recipient_name, invitation_link, role_name="employee"):
    """
    Sends an enterprise-grade branded invitation email using the company's stored SMTP settings.

    Args:
        company        : Company model instance (contains SMTP + branding fields)
        recipient_email: Target email address
        recipient_name : First name of the invitee
        invitation_link: Full acceptance URL
        role_name      : Role being assigned (e.g. 'employee', 'admin')

    Returns:
        (bool, str) — (success, human-readable status message)
    """
    if not (company.smtp_host and company.smtp_username and company.smtp_password):
        logger.info(f"Mail not configured for company {company.id}, skipping email send.")
        return False, "Mail not configured"

    smtp_host     = company.smtp_host
    smtp_port     = int(company.smtp_port or 587)
    smtp_username = company.smtp_username
    smtp_password = company.smtp_password
    from_email    = company.smtp_from_email or smtp_username

    # Build message
    msg = MIMEMultipart("alternative")
    msg["Subject"] = f"You've been invited to join {company.name}"
    msg["From"]    = f"{company.name} <{from_email}>"
    msg["To"]      = recipient_email
    msg["X-Mailer"] = "NexusOS HRMS"

    plain = _build_invitation_plain(company, recipient_name, recipient_email, invitation_link, role_name)
    html  = _build_invitation_html(company, recipient_name, recipient_email, invitation_link, role_name)

    msg.attach(MIMEText(plain, "plain", "utf-8"))
    msg.attach(MIMEText(html,  "html",  "utf-8"))

    try:
        context = ssl.create_default_context()
        with smtplib.SMTP(smtp_host, smtp_port, timeout=12) as server:
            server.ehlo()
            server.starttls(context=context)
            server.login(smtp_username, smtp_password)
            server.sendmail(from_email, recipient_email, msg.as_string())
        logger.info(f"Invitation email sent to {recipient_email} via {smtp_host}")
        return True, "Email sent successfully"

    except smtplib.SMTPAuthenticationError:
        logger.error(f"SMTP auth failed for company {company.id}")
        return False, "SMTP authentication failed — check username/app password."
    except smtplib.SMTPConnectError:
        logger.error(f"SMTP connect failed: {smtp_host}:{smtp_port}")
        return False, f"Could not connect to {smtp_host}:{smtp_port}."
    except Exception as e:
        logger.error(f"Mail error for company {company.id}: {e}")
        return False, str(e)
