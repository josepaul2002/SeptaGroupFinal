"""
Email service using Resend
"""
import os
import asyncio
import logging
from typing import List, Optional
from datetime import datetime, timezone

import resend

logger = logging.getLogger(__name__)

# Initialize Resend
resend.api_key = os.environ.get("RESEND_API_KEY", "")

FROM_EMAIL = os.environ.get("FROM_EMAIL", "noreply@septa.group")
ADMIN_NOTIFY_EMAILS = os.environ.get("ADMIN_NOTIFY_EMAIL", "leads@septa.group").split(",")


def get_admin_notification_html(lead_data: dict) -> str:
    """Generate HTML email for admin notification"""
    return f"""
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: 'Inter', Arial, sans-serif; background-color: #F3F0E8;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #F3F0E8; padding: 40px 20px;">
        <tr>
            <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border: 1px solid #E8E6E0;">
                    <!-- Header -->
                    <tr>
                        <td style="background-color: #1F2328; padding: 24px 32px;">
                            <table width="100%">
                                <tr>
                                    <td>
                                        <span style="color: #0F5E5B; font-weight: 600; font-size: 18px;">SEPTA</span>
                                        <span style="color: #F3F0E8; font-weight: 300; font-size: 18px; margin-left: 8px;">GROUP</span>
                                    </td>
                                    <td align="right">
                                        <span style="color: #C6A15B; font-size: 11px; text-transform: uppercase; letter-spacing: 2px;">New Lead</span>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    <!-- Content -->
                    <tr>
                        <td style="padding: 32px;">
                            <h2 style="margin: 0 0 24px 0; color: #1F2328; font-size: 20px; font-weight: 500;">
                                New Enquiry Received
                            </h2>
                            
                            <table width="100%" style="margin-bottom: 24px;">
                                <tr>
                                    <td style="padding: 12px 0; border-bottom: 1px solid #E8E6E0;">
                                        <span style="color: #A7ADB5; font-size: 11px; text-transform: uppercase; letter-spacing: 1px;">Name</span>
                                        <br>
                                        <span style="color: #1F2328; font-size: 15px; font-weight: 500;">{lead_data.get('name', 'N/A')}</span>
                                    </td>
                                </tr>
                                <tr>
                                    <td style="padding: 12px 0; border-bottom: 1px solid #E8E6E0;">
                                        <span style="color: #A7ADB5; font-size: 11px; text-transform: uppercase; letter-spacing: 1px;">Phone</span>
                                        <br>
                                        <span style="color: #0F5E5B; font-size: 15px; font-weight: 600;">{lead_data.get('phone', 'N/A')}</span>
                                    </td>
                                </tr>
                                <tr>
                                    <td style="padding: 12px 0; border-bottom: 1px solid #E8E6E0;">
                                        <span style="color: #A7ADB5; font-size: 11px; text-transform: uppercase; letter-spacing: 1px;">Email</span>
                                        <br>
                                        <span style="color: #1F2328; font-size: 15px;">{lead_data.get('email', 'Not provided')}</span>
                                    </td>
                                </tr>
                                <tr>
                                    <td style="padding: 12px 0; border-bottom: 1px solid #E8E6E0;">
                                        <span style="color: #A7ADB5; font-size: 11px; text-transform: uppercase; letter-spacing: 1px;">Project Type</span>
                                        <br>
                                        <span style="color: #1F2328; font-size: 15px;">{lead_data.get('project_type', 'Not specified')}</span>
                                    </td>
                                </tr>
                                <tr>
                                    <td style="padding: 12px 0; border-bottom: 1px solid #E8E6E0;">
                                        <span style="color: #A7ADB5; font-size: 11px; text-transform: uppercase; letter-spacing: 1px;">Location</span>
                                        <br>
                                        <span style="color: #1F2328; font-size: 15px;">{lead_data.get('project_location', 'Not specified')}</span>
                                    </td>
                                </tr>
                                <tr>
                                    <td style="padding: 12px 0; border-bottom: 1px solid #E8E6E0;">
                                        <span style="color: #A7ADB5; font-size: 11px; text-transform: uppercase; letter-spacing: 1px;">Budget Range</span>
                                        <br>
                                        <span style="color: #1F2328; font-size: 15px;">{lead_data.get('budget_range', 'Not specified')}</span>
                                    </td>
                                </tr>
                                <tr>
                                    <td style="padding: 12px 0; border-bottom: 1px solid #E8E6E0;">
                                        <span style="color: #A7ADB5; font-size: 11px; text-transform: uppercase; letter-spacing: 1px;">Timeline</span>
                                        <br>
                                        <span style="color: #1F2328; font-size: 15px;">{lead_data.get('timeline', 'Not specified')}</span>
                                    </td>
                                </tr>
                                <tr>
                                    <td style="padding: 12px 0; border-bottom: 1px solid #E8E6E0;">
                                        <span style="color: #A7ADB5; font-size: 11px; text-transform: uppercase; letter-spacing: 1px;">Page Source</span>
                                        <br>
                                        <span style="color: #1F2328; font-size: 15px;">{lead_data.get('page_source', 'Contact Page')}</span>
                                    </td>
                                </tr>
                            </table>
                            
                            <div style="background-color: #F8F7F4; padding: 16px; margin-bottom: 24px;">
                                <span style="color: #A7ADB5; font-size: 11px; text-transform: uppercase; letter-spacing: 1px;">Message</span>
                                <p style="color: #1F2328; font-size: 14px; line-height: 1.6; margin: 8px 0 0 0;">
                                    {lead_data.get('message', 'No message provided')}
                                </p>
                            </div>
                            
                            <p style="color: #A7ADB5; font-size: 12px; margin: 0;">
                                Received: {lead_data.get('created_at', datetime.now(timezone.utc).isoformat())}
                            </p>
                        </td>
                    </tr>
                    <!-- Footer -->
                    <tr>
                        <td style="background-color: #F8F7F4; padding: 20px 32px; border-top: 1px solid #E8E6E0;">
                            <p style="color: #A7ADB5; font-size: 11px; margin: 0; text-align: center;">
                                Septa Group Lead Notification System
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
"""


def get_admin_notification_text(lead_data: dict) -> str:
    """Generate plain text email for admin notification"""
    return f"""
SEPTA GROUP - New Lead Notification

New Enquiry Received
=====================

Name: {lead_data.get('name', 'N/A')}
Phone: {lead_data.get('phone', 'N/A')}
Email: {lead_data.get('email', 'Not provided')}

Project Type: {lead_data.get('project_type', 'Not specified')}
Location: {lead_data.get('project_location', 'Not specified')}
Budget Range: {lead_data.get('budget_range', 'Not specified')}
Timeline: {lead_data.get('timeline', 'Not specified')}
Page Source: {lead_data.get('page_source', 'Contact Page')}

Message:
{lead_data.get('message', 'No message provided')}

Received: {lead_data.get('created_at', datetime.now(timezone.utc).isoformat())}

---
Septa Group Lead Notification System
"""


def get_user_confirmation_html(name: str) -> str:
    """Generate HTML confirmation email for user"""
    return f"""
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: 'Inter', Arial, sans-serif; background-color: #F3F0E8;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #F3F0E8; padding: 40px 20px;">
        <tr>
            <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border: 1px solid #E8E6E0;">
                    <!-- Header -->
                    <tr>
                        <td style="background-color: #1F2328; padding: 24px 32px;">
                            <span style="color: #0F5E5B; font-weight: 600; font-size: 18px;">SEPTA</span>
                            <span style="color: #F3F0E8; font-weight: 300; font-size: 18px; margin-left: 8px;">GROUP</span>
                        </td>
                    </tr>
                    <!-- Content -->
                    <tr>
                        <td style="padding: 40px 32px;">
                            <h2 style="margin: 0 0 20px 0; color: #1F2328; font-size: 24px; font-weight: 400;">
                                Thank you, {name}
                            </h2>
                            
                            <p style="color: #1F2328; font-size: 15px; line-height: 1.7; margin: 0 0 24px 0;">
                                We have received your construction enquiry. Our team will review your requirements and get back to you within <strong>24 working hours</strong>.
                            </p>
                            
                            <div style="background-color: #F8F7F4; padding: 20px; margin-bottom: 24px; border-left: 3px solid #0F5E5B;">
                                <p style="color: #1F2328; font-size: 14px; line-height: 1.6; margin: 0;">
                                    <strong>What happens next?</strong><br><br>
                                    1. Our team reviews your project details<br>
                                    2. We will call you to discuss your requirements<br>
                                    3. If suitable, we'll schedule a site visit or consultation
                                </p>
                            </div>
                            
                            <p style="color: #1F2328; font-size: 14px; line-height: 1.6; margin: 0 0 24px 0;">
                                For urgent enquiries, you can reach us directly:
                            </p>
                            
                            <table>
                                <tr>
                                    <td style="padding-right: 20px;">
                                        <a href="tel:+919876543210" style="color: #0F5E5B; text-decoration: none; font-size: 14px;">
                                            Call: +91 XXXXX XXXXX
                                        </a>
                                    </td>
                                    <td>
                                        <a href="https://wa.me/919876543210" style="color: #25D366; text-decoration: none; font-size: 14px;">
                                            WhatsApp Us
                                        </a>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    <!-- Footer -->
                    <tr>
                        <td style="background-color: #1F2328; padding: 24px 32px;">
                            <p style="color: #A7ADB5; font-size: 12px; margin: 0 0 8px 0;">
                                Septa Group - Kerala's Premium Delivery Studio
                            </p>
                            <p style="color: #A7ADB5; font-size: 11px; margin: 0;">
                                Built with Clarity. Delivered with Discipline.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
"""


def get_user_confirmation_text(name: str) -> str:
    """Generate plain text confirmation email for user"""
    return f"""
SEPTA GROUP

Thank you, {name}

We have received your construction enquiry. Our team will review your requirements and get back to you within 24 working hours.

What happens next?
1. Our team reviews your project details
2. We will call you to discuss your requirements
3. If suitable, we'll schedule a site visit or consultation

For urgent enquiries, you can reach us directly:
- Phone: +91 XXXXX XXXXX
- WhatsApp: wa.me/919876543210

---
Septa Group - Kerala's Premium Delivery Studio
Built with Clarity. Delivered with Discipline.
"""


async def send_admin_notification(lead_data: dict, max_retries: int = 3) -> dict:
    """
    Send notification email to admin(s)
    Returns dict with success status and details
    """
    if not resend.api_key or resend.api_key.startswith("re_placeholder"):
        logger.warning("Resend API key not configured - skipping admin notification")
        return {"success": False, "error": "Email not configured", "skipped": True}
    
    # Build subject line with triage info
    project_type = lead_data.get('project_type', 'General')
    location = lead_data.get('project_location', 'Kerala')
    name = lead_data.get('name', 'Unknown')
    phone = lead_data.get('phone', '')
    
    subject = f"New Septa Lead - {project_type} - {location} - {name} - {phone}"
    
    params = {
        "from": FROM_EMAIL,
        "to": [email.strip() for email in ADMIN_NOTIFY_EMAILS],
        "subject": subject,
        "html": get_admin_notification_html(lead_data),
        "text": get_admin_notification_text(lead_data),
    }
    
    for attempt in range(max_retries):
        try:
            email_result = await asyncio.to_thread(resend.Emails.send, params)
            logger.info(f"Admin notification sent successfully: {email_result.get('id')}")
            return {"success": True, "email_id": email_result.get("id")}
        except Exception as e:
            logger.error(f"Admin notification attempt {attempt + 1} failed: {str(e)}")
            if attempt < max_retries - 1:
                await asyncio.sleep(2 ** attempt)  # Exponential backoff
    
    return {"success": False, "error": "Max retries exceeded"}


async def send_user_confirmation(email: str, name: str, max_retries: int = 3) -> dict:
    """
    Send confirmation email to user
    Returns dict with success status and details
    """
    if not email:
        logger.info("No user email provided - skipping confirmation")
        return {"success": False, "error": "No email provided", "skipped": True}
    
    if not resend.api_key or resend.api_key.startswith("re_placeholder"):
        logger.warning("Resend API key not configured - skipping user confirmation")
        return {"success": False, "error": "Email not configured", "skipped": True}
    
    subject = "Septa Group - We received your enquiry"
    
    params = {
        "from": FROM_EMAIL,
        "to": [email],
        "subject": subject,
        "html": get_user_confirmation_html(name),
        "text": get_user_confirmation_text(name),
    }
    
    for attempt in range(max_retries):
        try:
            email_result = await asyncio.to_thread(resend.Emails.send, params)
            logger.info(f"User confirmation sent successfully to {email}: {email_result.get('id')}")
            return {"success": True, "email_id": email_result.get("id")}
        except Exception as e:
            logger.error(f"User confirmation attempt {attempt + 1} failed: {str(e)}")
            if attempt < max_retries - 1:
                await asyncio.sleep(2 ** attempt)
    
    return {"success": False, "error": "Max retries exceeded"}
