"""
Email service using Resend
"""
import os
from html import escape
from config import PRODUCTION
import asyncio
import logging
from typing import List, Optional
from datetime import datetime, timezone

import resend
from dotenv import load_dotenv
from pathlib import Path

logger = logging.getLogger(__name__)

load_dotenv(Path(__file__).resolve().parent.parent / '.env')


def _configure_resend() -> str:
    """Read the API key at call time so .env load order doesn't matter."""
    key = os.environ.get("RESEND_API_KEY", "")
    if PRODUCTION and (not os.getenv("FROM_EMAIL") or "resend.dev" in os.getenv("FROM_EMAIL", "")):
        return ""
    resend.api_key = key
    return key


FROM_EMAIL = os.environ.get("FROM_EMAIL", "onboarding@resend.dev")
ADMIN_NOTIFY_EMAILS = os.environ.get("ADMIN_NOTIFY_EMAIL", "").split(",")

# Database reference (will be set from server.py)
email_logs_collection = None

def set_email_logs_collection(collection):
    """Set the MongoDB collection for email logs"""
    global email_logs_collection
    email_logs_collection = collection


async def log_email_attempt(
    email_type: str,
    recipient: str,
    subject: str,
    success: bool,
    error: Optional[str] = None,
    email_id: Optional[str] = None,
    lead_id: Optional[str] = None
):
    """Log email send attempt to database for debugging"""
    if email_logs_collection is None:
        logger.warning("Email logs collection not configured")
        return
    
    log_entry = {
        "type": email_type,  # admin_notification, user_confirmation
        "recipient": recipient,
        "subject": subject,
        "success": success,
        "error": error,
        "email_id": email_id,
        "lead_id": lead_id,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }
    
    try:
        await email_logs_collection.insert_one(log_entry)
    except Exception as e:
        logger.error(f"Failed to log email attempt: {str(e)}")


def get_admin_notification_html(lead_data: dict) -> str:
    lead_data = {k: escape(str(v)) for k, v in lead_data.items()}
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
    name = escape(name)
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
                                We have received your construction enquiry. Our team will review your requirements and get back to you within <strong>the next practical step</strong>.
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
                                        <span style="color: #0F5E5B; font-size: 14px;">Reply to this email to follow up</span>
                                    </td>
                                    <td>
                                        <span style="color: #25D366; font-size: 14px;">WhatsApp details will be added in Site Settings</span>
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

We have received your construction enquiry. Our team will review your requirements and contact you about the next practical step.

What happens next?
1. Our team reviews your project details
2. We will call you to discuss your requirements
3. If suitable, we'll schedule a site visit or consultation

For urgent enquiries, you can reach us directly:
- Phone: Please reply to this email
- WhatsApp: configured in Site Settings

---
Septa Group - Kerala's Premium Delivery Studio
Built with Clarity. Delivered with Discipline.
"""


async def send_admin_notification(lead_data: dict, max_retries: int = 3) -> dict:
    """
    Send notification email to admin(s)
    Returns dict with success status and details
    """
    # Build subject line with triage info
    project_type = lead_data.get('project_type', 'General')
    location = lead_data.get('project_location', 'Kerala')
    name = lead_data.get('name', 'Unknown')
    phone = lead_data.get('phone', '')
    lead_id = lead_data.get('id', '')
    
    subject = f"New Septa Lead - {project_type} - {location} - {name} - {phone}"
    recipients = [email.strip() for email in ADMIN_NOTIFY_EMAILS if email.strip()]
    if not recipients:
        return {"success": False, "error": "Notification recipient is not configured"}
    
    if not _configure_resend():
        logger.warning("Resend API key not configured - skipping admin notification")
        await log_email_attempt(
            "admin_notification", ",".join(recipients), subject,
            success=False, error="Email not configured (placeholder key)", lead_id=lead_id
        )
        return {"success": False, "error": "Email not configured", "skipped": True}
    
    params = {
        "from": FROM_EMAIL,
        "to": recipients,
        "subject": subject,
        "html": get_admin_notification_html(lead_data),
        "text": get_admin_notification_text(lead_data),
    }
    
    last_error = None
    for attempt in range(max_retries):
        try:
            email_result = await asyncio.to_thread(resend.Emails.send, params)
            logger.info(f"Admin notification sent successfully: {email_result.get('id')}")
            await log_email_attempt(
                "admin_notification", ",".join(recipients), subject,
                success=True, email_id=email_result.get("id"), lead_id=lead_id
            )
            return {"success": True, "email_id": email_result.get("id")}
        except Exception as e:
            last_error = str(e)
            logger.error(f"Admin notification attempt {attempt + 1} failed: {last_error}")
            if attempt < max_retries - 1:
                await asyncio.sleep(2 ** attempt)  # Exponential backoff
    
    # Log final failure
    await log_email_attempt(
        "admin_notification", ",".join(recipients), subject,
        success=False, error=f"Max retries exceeded: {last_error}", lead_id=lead_id
    )
    return {"success": False, "error": "Max retries exceeded"}


async def send_user_confirmation(email: str, name: str, lead_id: str = "", max_retries: int = 3) -> dict:
    """
    Send confirmation email to user
    Returns dict with success status and details
    """
    subject = "Septa Group - We received your enquiry"
    
    if not email:
        logger.info("No user email provided - skipping confirmation")
        return {"success": False, "error": "No email provided", "skipped": True}
    
    if not _configure_resend():
        logger.warning("Resend API key not configured - skipping user confirmation")
        await log_email_attempt(
            "user_confirmation", email, subject,
            success=False, error="Email not configured (placeholder key)", lead_id=lead_id
        )
        return {"success": False, "error": "Email not configured", "skipped": True}
    
    params = {
        "from": FROM_EMAIL,
        "to": [email],
        "subject": subject,
        "html": get_user_confirmation_html(name),
        "text": get_user_confirmation_text(name),
    }
    
    last_error = None
    for attempt in range(max_retries):
        try:
            email_result = await asyncio.to_thread(resend.Emails.send, params)
            logger.info(f"User confirmation sent successfully to {email}: {email_result.get('id')}")
            await log_email_attempt(
                "user_confirmation", email, subject,
                success=True, email_id=email_result.get("id"), lead_id=lead_id
            )
            return {"success": True, "email_id": email_result.get("id")}
        except Exception as e:
            last_error = str(e)
            logger.error(f"User confirmation attempt {attempt + 1} failed: {last_error}")
            if attempt < max_retries - 1:
                await asyncio.sleep(2 ** attempt)
    
    # Log final failure
    await log_email_attempt(
        "user_confirmation", email, subject,
        success=False, error=f"Max retries exceeded: {last_error}", lead_id=lead_id
    )
    return {"success": False, "error": "Max retries exceeded"}


async def send_password_reset(recipient: str, reset_url: str) -> bool:
    """Account recovery mail; reset URLs are never written to application logs."""
    if not _configure_resend():
        return False
    try:
        await asyncio.to_thread(resend.Emails.send, {
            'from': os.environ['FROM_EMAIL'], 'to': [recipient],
            'subject': 'Reset your Septa admin password',
            'html': '<p>A password reset was requested for your Septa admin account.</p>'
                    f'<p><a href="{escape(reset_url, quote=True)}">Set a new password</a></p>'
                    '<p>This link expires in 20 minutes and can be used once. If you did not request this, you can ignore this email. Your password has not changed.</p>',
            'text': f'Reset your Septa admin password: {reset_url}\nThis link expires in 20 minutes and can be used once. If you did not request this, ignore this email.'
        })
        return True
    except Exception as error:
        logger.error('Recovery email failed: %s', type(error).__name__)
        return False


async def send_password_changed(recipient: str) -> bool:
    if not _configure_resend():
        return False
    try:
        await asyncio.to_thread(resend.Emails.send, {
            'from': os.environ['FROM_EMAIL'], 'to': [recipient],
            'subject': 'Your Septa admin password was changed',
            'text': 'Your Septa admin password has been changed and previous sessions have been signed out. If you did not make this change, contact your site owner immediately and recover your account using the admin login page.'
        })
        return True
    except Exception as error:
        logger.error('Password-change notice failed: %s', type(error).__name__)
        return False
