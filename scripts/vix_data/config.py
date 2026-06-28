from pathlib import Path

DEFAULT_SYMBOL = "^INDIAVIX"
DEFAULT_NIFTY_SYMBOL = "^NSEI"
DEFAULT_OUTPUT = Path("public/data/india-vix.json")
DEFAULT_TIMEZONE = "Asia/Kolkata"
DEFAULT_INTERVAL_PERIODS = {
    "1m": "7d",
    "5m": "60d",
    "15m": "60d",
    "60m": "730d",
}
