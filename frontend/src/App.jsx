import { useEffect, useState } from "react";
import Chart from "./components/Chart";
import StrategyCenter from "./components/StrategyCenter";
import "./App.css";

const API =
  "https://algo-trading-terminal-production.up.railway.app";

export default function App() {

  const [marketData, setMarketData] =
    useState(null);

  const [activeTab, setActiveTab] =
    useState("market");

  useEffect(() => {

    fetchMarketData();

    const interval = setInterval(() => {

      fetchMarketData();

    }, 30000);

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
            </span>

            <span>
              {marketData?.market_status}
            </span>

          </div>

          <div className="top-right">

            <span>
              VIX:
              {" "}
              {marketData?.vix}
            </span>

            <span>
              Data:
              {" "}
              {marketData?.data_status}
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
                </p>

              </div>

              <div className="card">

                <h3>VIX</h3>

                <h1>
                  {marketData?.vix}
                </h1>

                <p
                  style={{
                    color:
                      marketData?.vix_change >= 0
                        ? "#ff4d4d"
                        : "#00ff95",
                  }}
                >
                  {marketData?.vix_change}%
                </p>

              </div>

              <div className="card">

                <h3>PCR</h3>

                <h1>
                  {marketData?.pcr}
                </h1>

                <p>
                  {marketData?.sentiment}
                </p>

              </div>

              <div className="card">

                <h3>DAY RANGE</h3>

                <h1 style={{ fontSize: "22px" }}>

                  {marketData?.day_low}

                  {" - "}

                  {marketData?.day_high}

                </h1>

                <p>LIVE</p>

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