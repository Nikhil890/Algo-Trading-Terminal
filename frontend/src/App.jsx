import { useEffect, useState } from "react";
import Chart from "./components/Chart";
import StrategyCenter from "./components/StrategyCenter";
import "./App.css";

const API =
  "hhttps://algo-trading-terminal-24cs.onrender.com";

export default function App() {

  const [marketData, setMarketData] =
    useState(null);

  const [activeTab, setActiveTab] =
    useState("market");

  // ----------------------------------------
  // FETCH MARKET DATA
  // ----------------------------------------

  useEffect(() => {

    fetchMarketData();

    const interval = setInterval(() => {

      fetchMarketData();

    }, 12000);

    return () => clearInterval(interval);

  }, []);

  const fetchMarketData = async () => {

    try {

      const response = await fetch(
        `${API}/market-data`
      );

      const data = await response.json();

      setMarketData(data);

    } catch (error) {

      console.log(error);

    }

  };

  // ----------------------------------------
  // UI
  // ----------------------------------------

  return (

    <div className="app">

      {/* SIDEBAR */}

      <div className="sidebar">

        <h1>NIFTY TERMINAL</h1>

        <p>Paper Trading Mode</p>

        <div className="menu">

          <button
            className={
              activeTab === "market"
                ? "active"
                : ""
            }
            onClick={() =>
              setActiveTab("market")
            }
          >
            Market Terminal
          </button>

          <button
            className={
              activeTab === "strategy"
                ? "active"
                : ""
            }
            onClick={() =>
              setActiveTab("strategy")
            }
          >
            Strategy Center
          </button>

          <button>
            Positions & PnL
          </button>

          <button>
            Risk Monitor
          </button>

          <button>
            Analytics
          </button>

        </div>

      </div>

      {/* MAIN CONTENT */}

      <div className="main-content">

        {/* TOPBAR */}

        <div className="topbar">

          <div className="top-left">

            <span>NIFTY</span>

            <span
              style={{
                color:
                  marketData?.change_percent >= 0
                    ? "#00ff95"
                    : "#ff4d4d",
              }}
            >

              {marketData?.change_percent}%

              {" "}

              (

              {marketData?.points_change > 0
                ? "+"
                : ""}

              {marketData?.points_change}

              )

            </span>

            <span>
              {marketData?.market_status}
            </span>

          </div>

          <div className="top-right">

            <span>

              VIX:
              {" "}

              <span
                style={{
                  color:
                    marketData?.vix_change >= 0
                      ? "#00ff95"
                      : "#ff4d4d",
                }}
              >

                {marketData?.vix}

                {" "}

                (

                {marketData?.vix_change > 0
                  ? "+"
                  : ""}

                {marketData?.vix_change}%

                )

              </span>

            </span>

            <span>
              {marketData?.time}
            </span>

          </div>

        </div>

        {/* MARKET TAB */}

        {activeTab === "market" && (

          <>

            <div className="cards">

              {/* NIFTY */}

              <div className="card">

                <h3>NIFTY</h3>

                <h1>
                  {marketData?.nifty_price}
                </h1>

                <p
                  style={{
                    color:
                      marketData?.change_percent >= 0
                        ? "#00ff95"
                        : "#ff4d4d",
                  }}
                >

                  {marketData?.change_percent}%

                  {" "}

                  (

                  {marketData?.points_change > 0
                    ? "+"
                    : ""}

                  {marketData?.points_change}

                  )

                </p>

              </div>

              {/* VIX */}

              <div className="card">

                <h3>VIX</h3>

                <h1>
                  {marketData?.vix}
                </h1>

                <p
                  style={{
                    color:
                      marketData?.vix_change >= 0
                        ? "#00ff95"
                        : "#ff4d4d",
                  }}
                >

                  {marketData?.vix_change > 0
                    ? "+"
                    : ""}

                  {marketData?.vix_change}%

                </p>

              </div>

              {/* DAY RANGE */}

              <div className="card">

                <h3>DAY RANGE</h3>

                <h1
                  style={{
                    fontSize: "22px"
                  }}
                >

                  {marketData?.day_low}

                  {" - "}

                  {marketData?.day_high}

                </h1>

              </div>

            </div>

            <Chart />

          </>

        )}

        {/* STRATEGY TAB */}

        {activeTab === "strategy" && (

          <StrategyCenter />

        )}

      </div>

    </div>

  );

}