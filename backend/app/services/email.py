import logging
from typing import Optional

import requests

from app.core.config import settings

logger = logging.getLogger(__name__)

SENDGRID_ENDPOINT = "https://api.sendgrid.com/v3/mail/send"


def send_access_request_email(requestor_email: str) -> None:
  api_key = settings.sendgrid_api_key
  recipient = settings.access_request_recipient
  sender = settings.access_request_sender or recipient

  if not api_key:
    logger.warning("SENDGRID_API_KEY not configured; skipping access request email for %s", requestor_email)
    return

  payload = {
    "personalizations": [
      {
        "to": [{"email": recipient}]
      }
    ],
    "from": {"email": sender},
    "subject": "New omX access request",
    "content": [
      {
        "type": "text/plain",
        "value": (
          f"A new user {requestor_email} is requesting access to your platform. "
          "If this user is recognized you can add them to your allowed list of users otherwise ignore this message."
        ),
      }
    ],
  }

  try:
    response = requests.post(
      SENDGRID_ENDPOINT,
      headers={
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
      },
      json=payload,
      timeout=10,
    )
    if response.status_code >= 300:
      logger.error(
        "Failed to send access request email for %s: status=%s body=%s",
        requestor_email,
        response.status_code,
        response.text,
      )
  except requests.RequestException as error:
    logger.exception("Error sending access request email for %s", requestor_email, exc_info=error)
