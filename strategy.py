import time

price = 100
breakout_level = 120

trade_active = False

entry_price = 0
stop_loss = 0
target = 0

while True:

    print("-------------------")
    print("Current Price:", price)

    # ENTRY LOGIC
    if trade_active == False:

        if price > breakout_level:

            print("BUY SIGNAL")

            trade_active = True

            entry_price = price

            stop_loss = entry_price - 10
            target = entry_price + 20

            print("Entry Price:", entry_price)
            print("Stop Loss:", stop_loss)
            print("Target:", target)

    # EXIT LOGIC
    else:

        if price <= stop_loss:

            print("STOP LOSS HIT")
            trade_active = False

        elif price >= target:

            print("TARGET HIT")
            trade_active = False

        else:

            print("TRADE RUNNING")

    # FAKE PRICE MOVEMENT
    price = price + 5

    time.sleep(2)