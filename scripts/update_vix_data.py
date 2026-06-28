#!/usr/bin/env python3
from __future__ import annotations

import argparse
from pathlib import Path

from vix_data.config import DEFAULT_INTERVAL_PERIODS, DEFAULT_NIFTY_SYMBOL, DEFAULT_OUTPUT, DEFAULT_SYMBOL, DEFAULT_TIMEZONE
from vix_data.storage import load_data_file, save_data_file, update_metadata, upsert_points
from vix_data.yfinance_client import fetch_interval


def main() -> None:
    parser = build_parser()
    args = parser.parse_args()

    periods = {
        "1m": args.one_minute_period,
        "5m": args.five_minute_period,
        "15m": args.fifteen_minute_period,
        "60m": args.hourly_period,
    }
    intervals = list(periods)
    data = load_data_file(args.output, args.symbol, intervals, DEFAULT_TIMEZONE, args.nifty_symbol)

    for interval, period in periods.items():
        incoming = fetch_interval(args.symbol, interval, period, DEFAULT_TIMEZONE)
        vix_series = upsert_points(data["instruments"]["india_vix"]["series"][interval], incoming)
        data["instruments"]["india_vix"]["series"][interval] = vix_series
        data["series"][interval] = vix_series
        print(f"india_vix {interval}: fetched {len(incoming)} rows, stored {len(vix_series)} rows")

        nifty_incoming = fetch_interval(args.nifty_symbol, interval, period, DEFAULT_TIMEZONE)
        nifty_series = upsert_points(data["instruments"]["nifty_50"]["series"][interval], nifty_incoming)
        data["instruments"]["nifty_50"]["series"][interval] = nifty_series
        print(f"nifty_50 {interval}: fetched {len(nifty_incoming)} rows, stored {len(nifty_series)} rows")

    update_metadata(data, args.symbol, intervals, DEFAULT_TIMEZONE, args.nifty_symbol)
    save_data_file(args.output, data)
    print(f"updated {args.output}")


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Fetch India VIX intraday data from yfinance.")
    parser.add_argument("--symbol", default=DEFAULT_SYMBOL, help="Yahoo Finance symbol to fetch.")
    parser.add_argument("--nifty-symbol", default=DEFAULT_NIFTY_SYMBOL, help="Yahoo Finance NIFTY 50 index symbol to fetch.")
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT, help="JSON file to update.")
    parser.add_argument("--one-minute-period", default=DEFAULT_INTERVAL_PERIODS["1m"], help="yfinance period for 1m data.")
    parser.add_argument("--five-minute-period", default=DEFAULT_INTERVAL_PERIODS["5m"], help="yfinance period for 5m data.")
    parser.add_argument("--fifteen-minute-period", default=DEFAULT_INTERVAL_PERIODS["15m"], help="yfinance period for 15m data.")
    parser.add_argument("--hourly-period", default=DEFAULT_INTERVAL_PERIODS["60m"], help="yfinance period for 60m data.")
    return parser


if __name__ == "__main__":
    main()
