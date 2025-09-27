import re
import secrets
import string


slug_allowed = string.ascii_lowercase + string.digits + '-'


def slugify(value: str) -> str:
  value = value.strip().lower()
  value = re.sub(r"[^a-z0-9-]+", "-", value)
  value = re.sub(r"-+", "-", value)
  return value.strip('-')


def generate_slug(base: str | None = None, length: int = 6) -> str:
  if base:
    base_slug = slugify(base)
    if len(base_slug) >= 3:
      return base_slug
  alphabet = string.ascii_lowercase + string.digits
  return ''.join(secrets.choice(alphabet) for _ in range(length))
