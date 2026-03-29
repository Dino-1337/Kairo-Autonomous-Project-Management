"""Deterministic validation before running the idea → tasks LLM pipeline."""
import re


_MIN_LEN = 16
_MIN_WORDS = 3

_GREETING_ONLY = re.compile(
    r"^\s*(hi+|hello+|hey+|hii+|yo+|sup+|ok+|okay+|thanks?|thx|bye+)\s*[!?.]*\s*$",
    re.IGNORECASE,
)


def validate_idea_text(text: str) -> tuple[bool, str | None]:
    """
    Returns (ok, None) or (False, human-readable reason).
    Does not call the LLM.
    """
    s = (text or "").strip()
    if len(s) < _MIN_LEN:
        return False, "Describe the work in a bit more detail (at least a short sentence)."
    words = [w for w in re.split(r"\s+", s) if w]
    if len(words) < _MIN_WORDS:
        return False, "Add more detail: what should be built or fixed?"
    if _GREETING_ONLY.match(s):
        return False, "That does not look like a work request. Describe a concrete task or feature."
    return True, None


