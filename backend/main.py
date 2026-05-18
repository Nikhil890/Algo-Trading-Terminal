from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime
import yfinance as yf

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def home():

    return {
        "message": "NIFTY TERMINAL BACKEND RUNNING"
    }


@app.get("/market-data")
def market_data():

    nifty = yf.Ticker("^NSEI")

    data = nifty.history(period="2d")

    latest_close = data["Close"].iloc[-1]

    previous_close = data["Close"].iloc[-2]

    change_percent = (
        (latest_close - previous_close)
        / previous_close
    ) * 100

    day_high = data["High"].iloc[-1]

    day_low = data["Low"].iloc[-1]

    # VIX DATA
    vix = yf.Ticker("^INDIAVIX")

    vix_data = vix.history(period="2d")

    vix_latest = round(
        vix_data["Close"].iloc[-1],
        2
    )

    vix_previous = vix_data["Close"].iloc[-2]

    vix_change = round(
        (
            (vix_latest - vix_previous)
            / vix_previous
        ) * 100,
        2
    )

    # TEMP PCR LOGIC
    # (real PCR requires option chain scraping/API)
    pcr = round(
        abs(change_percent) * 2 + 0.8,
        2
    )

    pcr_signal = (
        "Bullish"
        if pcr >= 1
        else "Bearish"
    )

    now = datetime.now()

    market_open = (
        now.weekday() < 5
        and (
            (now.hour > 9 or (now.hour == 9 and now.minute >= 15))
            and
            (now.hour < 15 or (now.hour == 15 and now.minute <= 30))
        )
    )

    return {

        "price": round(latest_close, 2),

        "change_percent": round(change_percent, 2),

        "day_high": round(day_high, 2),

        "day_low": round(day_low, 2),

        "market_status": (
            "OPEN"
            if market_open
            else "CLOSED"
        ),

        "time": now.strftime("%I:%M:%S %p"),

        "data_status": (
            "LIVE"
            if market_open
            else "CLOSED"
        ),

        "vix": vix_latest,

        "vix_change": vix_change,

        "pcr": pcr,

        "pcr_signal": pcr_signal,
    }


@app.get("/nifty-history")
def nifty_history(
    interval: str = "5m",
    period: str = "5d"
):

    nifty = yf.Ticker("^NSEI")

    data = nifty.history(
        period=period,
        interval=interval
    )

    candles = []

    for index, row in data.iterrows():

        candles.append({

            "time": index.strftime(
                "%Y-%m-%d %H:%M:%S"
            ),

            "open": round(row["Open"], 2),

            "high": round(row["High"], 2),

            "low": round(row["Low"], 2),

            "close": round(row["Close"], 2),
        })

    return candles