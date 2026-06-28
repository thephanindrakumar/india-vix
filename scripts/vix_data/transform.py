from typing import Any

import pandas as pd


def normalize_frame(frame: pd.DataFrame, data_timezone: str) -> list[dict[str, Any]]:
    if frame.empty:
        return []

    if isinstance(frame.columns, pd.MultiIndex):
        frame.columns = frame.columns.get_level_values(0)

    frame = frame.rename(
        columns={
            "Open": "open",
            "High": "high",
            "Low": "low",
            "Close": "close",
            "Adj Close": "adj_close",
            "Volume": "volume",
        }
    )

    if frame.index.tz is None:
        frame.index = frame.index.tz_localize("UTC")
    frame.index = frame.index.tz_convert(data_timezone)

    return [_row_to_point(timestamp, row) for timestamp, row in frame.sort_index().iterrows()]


def _row_to_point(timestamp: pd.Timestamp, row: pd.Series) -> dict[str, Any]:
    return {
        "timestamp": timestamp.isoformat(),
        "open": _finite_float(row.get("open")),
        "high": _finite_float(row.get("high")),
        "low": _finite_float(row.get("low")),
        "close": _finite_float(row.get("close")),
        "adj_close": _finite_float(row.get("adj_close")),
        "volume": _finite_float(row.get("volume")),
    }


def _finite_float(value: Any) -> float | None:
    if pd.isna(value):
        return None
    return round(float(value), 6)
