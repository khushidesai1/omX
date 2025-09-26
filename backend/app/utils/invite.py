import secrets
import string


ALLOWED_CHARS = (string.ascii_uppercase + string.digits).translate({ord(char): None for char in "0O1I"})


def generate_invite_code(length: int = 6) -> str:
  return "".join(secrets.choice(ALLOWED_CHARS) for _ in range(length))
