from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from datetime import datetime
import pytz
import yfinance as yf
import threading
import time
import requests

app = FastAPI()

# ---------------------------------------------------
# CORS
# ---------------------------------------------------

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

india = pytz.timezone("Asia/Kolkata")

# ---------------------------------------------------
# GLOBAL STORAGE
# ---------------------------------------------------

positions = []
trade_history = []

# ---------------------------------------------------
# NSE SESSION
# ---------------------------------------------------

session = requests.Session()

headers = {
    "User-Agent":
    "Mozilla/5.0"
}

session.get(
    "https://www.nseindia.com",
    headers=headers
)

# ---------------------------------------------------
# RSI
# ---------------------------------------------------

def calculate_rsi(data, period=14):

    delta = data.diff()

    gain = delta.where(delta > 0, 0)

    loss = -delta.where(delta < 0, 0)

    avg_gain = gain.rolling(period).mean()

    avg_loss = loss.rolling(period).mean()

    rs = avg_gain / avg_loss

    rsi = 100 - (100 / (1 + rs))

    return rsi

# ---------------------------------------------------
# FETCH NIFTY DATA
# ---------------------------------------------------

def fetch_market_data():

    ticker = yf.Ticker("^NSEI")

    data = ticker.history(
        period="1d",
        interval="5m"
    )

    return data

# ---------------------------------------------------
# OPTION CHAIN
# ---------------------------------------------------

def fetch_option_chain():

    url = (
        "https://www.nseindia.com/api/"
        "option-chain-indices?symbol=NIFTY"
    )

    response = session.get(
        url,
        headers=headers
    )

    data = response.json()

    return data

# ---------------------------------------------------
# GET OPTION PRICE
# ---------------------------------------------------

def get_option_price(
    strike,
    option_type
):

    try:

        data = fetch_option_chain()

        records = data["records"]["data"]

        for item in records:

            if item["strikePrice"] == strike:

                if option_type == "CE":

                    ce = item.get("CE")

                    if ce:

                        return round(
                            ce["lastPrice"],
                            2
                        )

                if option_type == "PE":

                    pe = item.get("PE")

                    if pe:

                        return round(
                            pe["lastPrice"],
                            2
                        )

    except Exception as e:

        print("OPTION ERROR:", e)

    return None

# ---------------------------------------------------
# STRATEGY ENGINE
# ---------------------------------------------------

def strategy_engine():

    global positions
    global trade_history

    while True:

        try:

            now = datetime.now(india)

            market_open = (

                now.weekday() < 5

                and (

                    now.hour > 9

                    or (
                        now.hour == 9
                        and now.minute >= 15
                    )

                )

                and (

                    now.hour < 15

                    or (
                        now.hour == 15
                        and now.minute <= 30
                    )

                )

            )

            if not market_open:

                time.sleep(30)

                continue

            # ---------------------------------------------------
            # FETCH LIVE DATA
            # ---------------------------------------------------

            df = fetch_market_data()

            if len(df) < 30:

                time.sleep(30)

                continue

            # ---------------------------------------------------
            # INDICATORS
            # ---------------------------------------------------

            df["EMA9"] = (
                df["Close"]
                .ewm(span=9)
                .mean()
            )

            df["EMA21"] = (
                df["Close"]
                .ewm(span=21)
                .mean()
            )

            df["RSI"] = calculate_rsi(
                df["Close"]
            )

            latest = df.iloc[-1]

            current_price = round(
                latest["Close"],
                2
            )

            ema9 = latest["EMA9"]

            ema21 = latest["EMA21"]

            rsi = latest["RSI"]

            signal = None
            rationale = []

            # ---------------------------------------------------
            # SIGNALS
            # ---------------------------------------------------

            if (
                ema9 > ema21
                and rsi > 60
            ):

                signal = "CE"

                rationale = [

                    "EMA9 crossed above EMA21",

                    f"RSI strong at {round(rsi,2)}",

                    "Bullish momentum detected",

                    "Trend confirmation achieved"

                ]

            elif (
                ema9 < ema21
                and rsi < 40
            ):

                signal = "PE"

                rationale = [

                    "EMA9 crossed below EMA21",

                    f"RSI weak at {round(rsi,2)}",

                    "Bearish momentum detected",

                    "Trend confirmation achieved"

                ]

            # ---------------------------------------------------
            # ACTIVE POSITIONS
            # ---------------------------------------------------

            active_positions = [

                p for p in positions
                if p["status"] == "OPEN"

            ]

            # ---------------------------------------------------
            # CREATE POSITION
            # ---------------------------------------------------

            if signal and len(active_positions) == 0:

                strike = (
                    round(current_price / 50)
                    * 50
                )

                live_option_price = get_option_price(
                    strike,
                    signal
                )

                if not live_option_price:

                    time.sleep(30)

                    continue

                # ---------------------------------------------------
                # CAPITAL MANAGEMENT
                # ---------------------------------------------------

                MAX_CAPITAL = 10000

                LOT_SIZE = 50

                current_invested = sum([

                    p["invested"]

                    for p in positions

                    if p["status"] == "OPEN"

                ])

                remaining_capital = (

                    MAX_CAPITAL
                    - current_invested

                )

                # ---------------------------------------------------
                # POSITION SIZE
                # ---------------------------------------------------

                max_quantity = int(

                    remaining_capital
                    / live_option_price

                )

                quantity = (

                    max_quantity
                    // LOT_SIZE

                ) * LOT_SIZE

                # ---------------------------------------------------
                # SKIP IF NO CAPITAL
                # ---------------------------------------------------

                if quantity < LOT_SIZE:

                    print(
                        "NOT ENOUGH CAPITAL"
                    )

                    time.sleep(30)

                    continue

                invested = round(

                    live_option_price
                    * quantity,

                    2

                )

                # ---------------------------------------------------
                # CREATE POSITION
                # ---------------------------------------------------

                position = {

                    "symbol": "NIFTY",

                    "strike": strike,

                    "option_type": signal,

                    "expiry": "WEEKLY",

                    "quantity": quantity,

                    "entry_price": live_option_price,

                    "current_price": live_option_price,

                    "invested": invested,

                    "mtm": "₹0",

                    "roi": "0%",

                    "stop_loss": round(
                        live_option_price * 0.80,
                        2
                    ),

                    "target": round(
                        live_option_price * 1.40,
                        2
                    ),

                    "status": "OPEN",

                    "entry_time": now.strftime(
                        "%I:%M:%S %p"
                    ),

                    "rationale": rationale,

                    "history": []

                }

                positions.append(position)

                print(

                    f"NEW POSITION CREATED | "

                    f"Qty: {quantity} | "

                    f"Invested: ₹{invested}"

                )

            # ---------------------------------------------------
            # UPDATE POSITIONS
            # ---------------------------------------------------

            for position in positions:

                if position["status"] != "OPEN":
                    continue

                live_price = get_option_price(

                    position["strike"],

                    position["option_type"]

                )

                if not live_price:
                    continue

                position["current_price"] = live_price

                pnl = round(

                    (
                        live_price
                        - position["entry_price"]
                    )
                    * position["quantity"],

                    2

                )

                position["mtm"] = f"₹{pnl}"

                roi = round(

                    (
                        pnl
                        / position["invested"]
                    ) * 100,

                    2

                )

                position["roi"] = f"{roi}%"

                exit_trade = False
                reason = ""

                # ---------------------------------------------------
                # EXIT RULES
                # ---------------------------------------------------

                if (
                    live_price
                    <= position["stop_loss"]
                ):

                    exit_trade = True
                    reason = "STOP LOSS HIT"

                elif (
                    live_price
                    >= position["target"]
                ):

                    exit_trade = True
                    reason = "TARGET HIT"

                elif (
                    now.hour == 15
                    and now.minute >= 15
                ):

                    exit_trade = True
                    reason = "AUTO EOD EXIT"

                # ---------------------------------------------------
                # CLOSE POSITION
                # ---------------------------------------------------

                if exit_trade:

                    position["status"] = "CLOSED"

                    position["exit_reason"] = reason

                    position["exit_time"] = now.strftime(
                        "%I:%M:%S %p"
                    )

                    position["history"].append({

                        "entry":
                        position["entry_price"],

                        "exit":
                        live_price,

                        "pnl":
                        f"₹{pnl}"

                    })

                    trade_history.append(position)

                    print("POSITION CLOSED")

            time.sleep(30)

        except Exception as e:

            print("ENGINE ERROR:", e)

            time.sleep(30)

# ---------------------------------------------------
# START ENGINE
# ---------------------------------------------------

engine_thread = threading.Thread(
    target=strategy_engine,
    daemon=True
)

engine_thread.start()

# ---------------------------------------------------
# ROOT
# ---------------------------------------------------

@app.get("/")
def root():

    return {
        "message": "Live Trading Engine Running"
    }

# ---------------------------------------------------
# MARKET DATA
# ---------------------------------------------------

@app.get("/market-data")
def market_data():

    now = datetime.now(india)

    ticker = yf.Ticker("^NSEI")

    data = ticker.history(
        period="1d",
        interval="1m"
    )

    latest = data.iloc[-1]

    previous = data.iloc[-2]

    nifty_price = round(
        latest["Close"],
        2
    )

    change_percent = round(

        (
            (
                latest["Close"]
                - previous["Close"]
            )
            / previous["Close"]
        ) * 100,

        2

    )

    # ---------------------------------------------------
    # MARKET STATUS
    # ---------------------------------------------------

    market_open = (

        now.weekday() < 5

        and (

            now.hour > 9

            or (
                now.hour == 9
                and now.minute >= 15
            )

        )

        and (

            now.hour < 15

            or (
                now.hour == 15
                and now.minute <= 30
            )

        )

    )

    market_status = (
        "OPEN"
        if market_open
        else "CLOSED"
    )

    data_status = (
        "LIVE"
        if market_open
        else "EOD"
    )

    # ---------------------------------------------------
    # REAL DAY RANGE
    # ---------------------------------------------------

    day_low = round(
        data["Low"].min(),
        2
    )

    day_high = round(
        data["High"].max(),
        2
    )

    # ---------------------------------------------------
    # LIVE VIX
    # ---------------------------------------------------

    try:

        vix_ticker = yf.Ticker("^INDIAVIX")

        vix_data = vix_ticker.history(
            period="1d",
            interval="1m"
        )

        latest_vix = round(
            vix_data.iloc[-1]["Close"],
            2
        )

        previous_vix = round(
            vix_data.iloc[-2]["Close"],
            2
        )

        vix_change = round(

            (
                (
                    latest_vix
                    - previous_vix
                )
                / previous_vix
            ) * 100,

            2

        )

    except:

        latest_vix = 0
        vix_change = 0

    return {

        "nifty_price": nifty_price,

        "change_percent": change_percent,

        "vix": latest_vix,

        "vix_change": vix_change,

        "pcr": "LIVE",

        "sentiment": (

            "Bullish"
            if change_percent >= 0
            else "Bearish"

        ),

        "day_low": day_low,

        "day_high": day_high,

        "market_status": market_status,

        "data_status": data_status,

        "time": now.strftime(
            "%I:%M:%S %p"
        ),

    }

# ---------------------------------------------------
# STRATEGY DATA
# ---------------------------------------------------

@app.get("/strategy-data")
def strategy_data():

    total_invested = sum([

        p["invested"]

        for p in positions

        if p["status"] == "OPEN"

    ])

    total_mtm = 0

    for p in positions:

        if p["status"] == "OPEN":

            try:

                mtm_value = float(
                    p["mtm"]
                    .replace("₹", "")
                )

                total_mtm += mtm_value

            except:
                pass

    return {

        "positions": positions,

        "summary": {

            "total_invested":
            round(total_invested, 2),

            "total_mtm":
            round(total_mtm, 2)

        }

    }

# ---------------------------------------------------
# TRADE HISTORY
# ---------------------------------------------------

@app.get("/trade-history")
def get_trade_history():

    return trade_history

# ---------------------------------------------------
# NIFTY HISTORY
# ---------------------------------------------------

@app.get("/nifty-history")
def nifty_history(
    interval: str = "5m",
    period: str = "7d"
):

    try:

        ticker = yf.Ticker("^NSEI")

        data = ticker.history(
            period=period,
            interval=interval
        )

        candles = []

        for index, row in data.iterrows():

            candles.append({

                "time": str(index),

                "open": round(
                    float(row["Open"]), 2
                ),

                "high": round(
                    float(row["High"]), 2
                ),

                "low": round(
                    float(row["Low"]), 2
                ),

                "close": round(
                    float(row["Close"]), 2
                ),

            })

        return candles

    except Exception as e:

        return {
            "error": str(e)
        }