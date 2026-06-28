from typing import Any


def empty_data_file(symbol: str, intervals: list[str], timezone: str) -> dict[str, Any]:
    instruments = {
        "india_vix": {
            "name": "India VIX",
            "symbol": symbol,
            "series": {interval: [] for interval in intervals},
        }
    }

    return {
        "metadata": {
            "symbol": symbol,
            "generated_at": None,
            "source": "Yahoo Finance via yfinance",
            "timezone": timezone,
            "intervals": intervals,
            "notes": [
                "Yahoo Finance intraday retention is limited, so run the updater regularly."
            ],
        },
        "series": {interval: [] for interval in intervals},
        "instruments": instruments,
    }
