import re

from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError


def normalize_bd_phone(phone_number):

    phone_number = phone_number.strip()

    phone_number = phone_number.replace(" ", "")
    phone_number = phone_number.replace("-", "")

    local_pattern = r"^01[3-9]\d{8}$"
    international_pattern = r"^\+8801[3-9]\d{8}$"

    if re.fullmatch(local_pattern, phone_number):

        return "+880" + phone_number[1:]

    if re.fullmatch(international_pattern, phone_number):

        return phone_number

    raise ValidationError(
        "Enter a valid Bangladesh mobile number, "
        "for example 01572981861 or +8801572981861."
    )


def validate_strong_password(password, user=None):

    errors = []

    if len(password) < 10:
        errors.append(
            "Password must contain at least 10 characters."
        )

    if not re.search(r"[A-Z]", password):
        errors.append(
            "Password must contain at least one uppercase letter."
        )

    if not re.search(r"[a-z]", password):
        errors.append(
            "Password must contain at least one lowercase letter."
        )

    if not re.search(r"\d", password):
        errors.append(
            "Password must contain at least one number."
        )

    if not re.search(r"[^A-Za-z0-9]", password):
        errors.append(
            "Password must contain at least one special character."
        )

    try:
        validate_password(password, user=user)

    except ValidationError as error:
        errors.extend(error.messages)

    if errors:
        raise ValidationError(errors)

    return password