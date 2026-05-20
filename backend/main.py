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

daily_trade_count = 0
last_trade_day = None

# ---------------------------------------------------
# MARKET CACHE
# ---------------------------------------------------

cached_market_data = {}
last_market_fetch = 0

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
# FETCH MARKET DATA
# ---------------------------------------------------

def fetch_market_data():

    ticker = yf.Ticker("^NSEI")

    return ticker.history(
        period="5d",
        interval="5m"
    )

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

    return response.json()

# ---------------------------------------------------
# OPTION PRICE
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

                elif option_type == "PE":

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
# MARKET STATUS
# ---------------------------------------------------

def is_market_open():

    now = datetime.now(india)

    current_time = now.strftime("%H:%M")

    return (

        now.weekday() < 5

        and current_time >= "09:15"

        and current_time <= "15:30"

    )

# ---------------------------------------------------
# STRATEGY ENGINE
# ---------------------------------------------------

def strategy_engine():

    global positions
    global trade_history
    global daily_trade_count
    global last_trade_day

    while True:

        try:

            if not is_market_open():

                time.sleep(120)

                continue

            now = datetime.now(india)

            today = now.strftime("%Y-%m-%d")

            # ----------------------------------------
            # RESET DAILY LIMIT
            # ----------------------------------------

            if last_trade_day != today:

                daily_trade_count = 0

                last_trade_day = today

            # ----------------------------------------
            # MAX TRADES
            # ----------------------------------------

            if daily_trade_count >= 5:

                time.sleep(120)

                continue

            # ----------------------------------------
            # FETCH DATA
            # ----------------------------------------

            df = fetch_market_data()

            if len(df) < 30:

                time.sleep(120)

                continue

            # ----------------------------------------
            # INDICATORS
            # ----------------------------------------

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
            strategy_name = ""
            rationale = []

            # ----------------------------------------
            # EMA STRATEGY
            # ----------------------------------------

            if ema9 > ema21 and rsi > 55:

                signal = "CE"

                strategy_name = "EMA"

                rationale = [

                    "EMA9 crossed above EMA21",

                    f"RSI strong at {round(rsi,2)}",

                    "Bullish momentum detected"

                ]

            elif ema9 < ema21 and rsi < 45:

                signal = "PE"

                strategy_name = "EMA"

                rationale = [

                    "EMA9 crossed below EMA21",

                    f"RSI weak at {round(rsi,2)}",

                    "Bearish momentum detected"

                ]

            # ----------------------------------------
            # ORB STRATEGY
            # ----------------------------------------

            today_df = df[
                df.index.date
                == latest.name.date()
            ]

            orb_df = today_df.between_time(
                "09:15",
                "09:30"
            )

            if len(orb_df) > 0:

                orb_high = orb_df["High"].max()

                orb_low = orb_df["Low"].min()

                latest_close = latest["Close"]

                if latest_close > orb_high:

                    signal = "CE"

                    strategy_name = "ORB"

                    rationale = [

                        "ORB breakout above range",

                        f"ORB High: {round(orb_high,2)}",

                        "Bullish breakout detected"

                    ]

                elif latest_close < orb_low:

                    signal = "PE"

                    strategy_name = "ORB"

                    rationale = [

                        "ORB breakdown below range",

                        f"ORB Low: {round(orb_low,2)}",

                        "Bearish breakdown detected"

                    ]

            # ----------------------------------------
            # ACTIVE POSITIONS
            # ----------------------------------------

            active_positions = [

                p for p in positions
                if p["status"] == "OPEN"

            ]

            # ----------------------------------------
            # CREATE POSITION
            # ----------------------------------------

            if signal and len(active_positions) == 0:

                strike = (
                    round(current_price / 50)
                    * 50
                )

                option_price = get_option_price(
                    strike,
                    signal
                )

                if not option_price:

                    time.sleep(120)

                    continue

                MAX_CAPITAL = 50000

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

                max_quantity = int(
                    remaining_capital
                    / option_price
                )

                quantity = (
                    max_quantity
                    // LOT_SIZE
                ) * LOT_SIZE

                if quantity < LOT_SIZE:

                    print("NOT ENOUGH CAPITAL")

                    time.sleep(120)

                    continue

                invested = round(
                    option_price * quantity,
                    2
                )

                stop_loss = round(
                    option_price * 0.90,
                    2
                )

                target = round(
                    option_price * 1.15,
                    2
                )

                position = {

                    "strategy": strategy_name,

                    "symbol": "NIFTY",

                    "strike": strike,

                    "option_type": signal,

                    "expiry": "WEEKLY",

                    "quantity": quantity,

                    "entry_price": option_price,

                    "current_price": option_price,

                    "invested": invested,

                    "mtm": "₹0",

                    "roi": "0%",

                    "stop_loss": stop_loss,

                    "target": target,

                    "status": "OPEN",

                    "entry_time": now.strftime(
                        "%H:%M:%S"
                    ),

                    "rationale": rationale,

                    "history": []

                }

                positions.append(position)

                daily_trade_count += 1

                print(
                    f"NEW {strategy_name} POSITION CREATED"
                )

            # ----------------------------------------
            # UPDATE POSITIONS
            # ----------------------------------------

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

                roi = round(

                    (
                        pnl
                        / position["invested"]
                    ) * 100,

                    2

                )

                position["mtm"] = f"₹{pnl}"

                position["roi"] = f"{roi}%"

                exit_trade = False
                reason = ""

                if live_price <= position["stop_loss"]:

                    exit_trade = True
                    reason = "STOP LOSS HIT"

                elif live_price >= position["target"]:

                    exit_trade = True
                    reason = "TARGET HIT"

                elif not is_market_open():

                    exit_trade = True
                    reason = "AUTO EOD EXIT"

                if exit_trade:

                    position["status"] = "CLOSED"

                    position["exit_reason"] = reason

                    position["exit_time"] = now.strftime(
                        "%H:%M:%S"
                    )

                    trade_history.append(position)

                    print("POSITION CLOSED")

            time.sleep(120)

        except Exception as e:

            print("ENGINE ERROR:", e)

            time.sleep(120)

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

    global cached_market_data
    global last_market_fetch

    current_timestamp = time.time()

    # ----------------------------------------
    # CACHE FOR 60 SECONDS
    # ----------------------------------------

    if (
        cached_market_data
        and current_timestamp - last_market_fetch < 60
    ):

        return cached_market_data

    now = datetime.now(india)

    try:

        # ----------------------------------------
        # NIFTY DATA
        # ----------------------------------------

        nifty = yf.Ticker("^NSEI")

        intraday_data = nifty.history(
            period="2d",
            interval="1m"
        )

        daily_data = nifty.history(
            period="1mo",
            interval="1d"
        )

        latest_close = round(
            daily_data["Close"]
            .dropna()
            .iloc[-1],
            2
        )

        previous_close = round(
            daily_data["Close"]
            .dropna()
            .iloc[-2],
            2
        )

        nifty_price = latest_close

        points_change = round(
            nifty_price - previous_close,
            2
        )

        change_percent = round(
            (
                points_change
                / previous_close
            ) * 100,
            2
        )

        # ----------------------------------------
        # INDIA VIX
        # ----------------------------------------

        try:

            vix_ticker = yf.Ticker("^INDIAVIX")

            vix_data = vix_ticker.history(
                period="1mo",
                interval="1d"
            )

            latest_vix = round(
                vix_data["Close"]
                .dropna()
                .iloc[-1],
                2
            )

            previous_vix = round(
                vix_data["Close"]
                .dropna()
                .iloc[-2],
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

        except Exception as e:

            print("VIX ERROR:", e)

            latest_vix = 0
            vix_change = 0

        cached_market_data = {

            "nifty_price": nifty_price,

            "points_change": points_change,

            "change_percent": change_percent,

            "vix": latest_vix,

            "vix_change": vix_change,

            "day_low": round(
                intraday_data["Low"].min(),
                2
            ),

            "day_high": round(
                intraday_data["High"].max(),
                2
            ),

            "market_status": (
                "OPEN"
                if is_market_open()
                else "CLOSED"
            ),

            "time": now.strftime(
                "%H:%M:%S"
            )

        }

        last_market_fetch = current_timestamp

        return cached_market_data

    except Exception as e:

        print("MARKET DATA ERROR:", e)

        if cached_market_data:

            return cached_market_data

        return {

            "nifty_price": 0,

            "points_change": 0,

            "change_percent": 0,

            "vix": 0,

            "vix_change": 0,

            "day_low": 0,

            "day_high": 0,

            "market_status": "CLOSED",

            "time": now.strftime(
                "%H:%M:%S"
            )

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

                total_mtm += float(
                    p["mtm"]
                    .replace("₹", "")
                )

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