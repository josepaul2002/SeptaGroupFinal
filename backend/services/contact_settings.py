"""Validate public contact destinations without inventing recipient details."""
import re
from urllib.parse import urlsplit, parse_qs


def validate_contact_settings(contact):
    if not isinstance(contact, dict):
        raise ValueError('Contact settings must be an object.')
    fields = ('phone_link','phone_display','whatsapp_number','whatsapp_link','whatsapp_mode','email','contact_person','contact_person_role','map_link')
    for field in fields:
        if field in contact and not isinstance(contact[field], str):
            raise ValueError(f'{field} must be text.')
    phone = contact.get('phone_link') or contact.get('phone_display') or ''
    phone = re.sub(r'[\s().-]', '', re.sub(r'^tel:', '', phone.strip(), flags=re.I))
    if phone and not re.fullmatch(r'\+?[1-9]\d{6,14}', phone):
        raise ValueError('Enter a call number including its country code.')
    email = contact.get('email', '').strip()
    if email and not re.fullmatch(r'[^\s@]+@[^\s@]+\.[^\s@]+', email):
        raise ValueError('Enter a valid public enquiry email address.')
    mode = contact.get('whatsapp_mode') or ('link' if contact.get('whatsapp_link') else 'number')
    if mode not in ('number','link'):
        raise ValueError('Choose a WhatsApp number or link.')
    if mode == 'number':
        number = contact.get('whatsapp_number', '')
        if number and not re.fullmatch(r'\+?[1-9]\d{6,14}', re.sub(r'[\s().-]', '', number)):
            raise ValueError('Enter a WhatsApp number including its country code.')
    elif contact.get('whatsapp_link'):
        try:
            parsed = urlsplit(contact['whatsapp_link'].strip())
            chat = (parsed.hostname == 'wa.me' and re.fullmatch(r'/(?:[1-9]\d{6,14}|message/[a-zA-Z0-9]+)/?', parsed.path)) or (parsed.hostname in ('api.whatsapp.com','web.whatsapp.com','www.whatsapp.com') and parsed.path == '/send' and re.fullmatch(r'\+?[1-9]\d{6,14}', parse_qs(parsed.query).get('phone',[''])[0]))
            if parsed.scheme != 'https' or parsed.username or parsed.password or not chat:
                raise ValueError()
        except ValueError:
            raise ValueError('Use an official HTTPS WhatsApp chat link (wa.me or WhatsApp /send).')
    return {**contact, 'email':email, 'whatsapp_mode':mode, **({'whatsapp_link':''} if mode == 'number' else {'whatsapp_number':''})}
