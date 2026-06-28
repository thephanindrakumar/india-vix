from typing import Any

import yfinance as yf

from .transform import normalize_frame


def fetch_interval(symbol: str, interval: str, period: str, data_timezone: str) -> list[dict[str, Any]]:
    frame = yf.download(
        symbol,
        period=period,
        interval=interval,
        auto_adjust=False,
        progress=False,
        threads=False,
    )
    return normalize_frame(frame, data_timezone)
