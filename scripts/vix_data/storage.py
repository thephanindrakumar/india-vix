import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from .schema import empty_data_file

INSTRUMENTS = {
    "india_vix": "India VIX",
    "nifty_50": "NIFTY 50",
}


def load_data_file(path: Path, symbol: str, intervals: list[str], data_timezone: str, nifty_symbol: str | None = None) -> dict[str, Any]:
    if path.exists():
        data = json.loads(path.read_text())
    else:
        data = empty_data_file(symbol, intervals, data_timezone)

    data.setdefault("series", {})
    for interval in intervals:
        data["series"].setdefault(interval, [])

    data.setdefault("instruments", {})
    ensure_instrument(data, "india_vix", INSTRUMENTS["india_vix"], symbol, intervals)
    if nifty_symbol:
        ensure_instrument(data, "nifty_50", INSTRUMENTS["nifty_50"], nifty_symbol, intervals)

    for interval in intervals:
        if not data["instruments"]["india_vix"]["series"][interval] and data["series"][interval]:
            data["instruments"]["india_vix"]["series"][interval] = data["series"][interval]
    return data


def save_data_file(path: Path, data: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, indent=2, sort_keys=False) + "\n")


def update_metadata(data: dict[str, Any], symbol: str, intervals: list[str], data_timezone: str, nifty_symbol: str | None = None) -> None:
    data["metadata"] = {
        **data.get("metadata", {}),
        "symbol": symbol,
        "symbols": {
            "india_vix": symbol,
            **({"nifty_50": nifty_symbol} if nifty_symbol else {}),
        },
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "source": "Yahoo Finance via yfinance",
        "timezone": data_timezone,
        "intervals": intervals,
    }


def upsert_points(existing: list[dict[str, Any]], incoming: list[dict[str, Any]]) -> list[dict[str, Any]]:
    by_timestamp = {point["timestamp"]: point for point in existing}
    for point in incoming:
        by_timestamp[point["timestamp"]] = point
    return [by_timestamp[key] for key in sorted(by_timestamp)]


def ensure_instrument(data: dict[str, Any], key: str, name: str, symbol: str, intervals: list[str]) -> None:
    instruments = data.setdefault("instruments", {})
    instrument = instruments.setdefault(key, {})
    instrument["name"] = name
    instrument["symbol"] = symbol
    instrument.setdefault("series", {})
    for interval in intervals:
        instrument["series"].setdefault(interval, [])
