from fastapi import FastAPI
import random

app = FastAPI()

price = 100

trade_active = False

entry_price = 0
target = 0
stop_loss = 0

@app.get("/")
def home():

    global price
    global trade_active
    global entry_price
    global target
    global stop_loss

    # FAKE MARKET MOVEMENT
    movement = random.randint(-10, 10)

    price = price + movement

    # ENTRY LOGIC
    if trade_active == False:

        if price > 120:

            trade_active = True

            entry_price = price

            stop_loss = entry_price - 10

            target = entry_price + 20

    # EXIT LOGIC
    else:

        if price <= stop_loss:

            trade_active = False

        elif price >= target:

            trade_active = False

    return {

        "Current Price": price,

        "Trade Active": trade_active,

        "Entry Price": entry_price,

        "Stop Loss": stop_loss,

        "Target": target
    }