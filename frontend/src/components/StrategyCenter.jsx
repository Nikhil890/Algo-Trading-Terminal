import {
  useEffect,
  useState
} from "react"

const API =
  "https://algo-trading-terminal-production.up.railway.app"

export default function StrategyCenter() {

  const [strategyData, setStrategyData] =
    useState(null)

  const [selectedPosition, setSelectedPosition] =
    useState(null)

  // ------------------------------------------------
  // FETCH DATA
  // ------------------------------------------------

  const fetchStrategyData = () => {

    fetch(
      `${API}/strategy-data`
    )

      .then((response) => response.json())

      .then((data) => {

        setStrategyData(data)

        if (
          data.positions.length > 0
          && !selectedPosition
        ) {

          setSelectedPosition(
            data.positions[0]
          )

        }

      })

      .catch((error) => {

        console.error(error)

      })

  }

  // ------------------------------------------------
  // LOAD
  // ------------------------------------------------

  useEffect(() => {

    fetchStrategyData()

    const interval = setInterval(() => {

      fetchStrategyData()

    }, 10000)

    return () => clearInterval(interval)

  }, [])

  // ------------------------------------------------
  // LOADING
  // ------------------------------------------------

  if (!strategyData) {

    return (

      <div className="empty-box">

        Loading Strategy Engine...

      </div>

    )

  }

  // ------------------------------------------------
  // FILTERS
  // ------------------------------------------------

  const openPositions =
    strategyData.positions.filter(
      (p) => p.status === "OPEN"
    )

  const closedPositions =
    strategyData.positions.filter(
      (p) => p.status === "CLOSED"
    )

  // ------------------------------------------------
  // REALIZED PNL
  // ------------------------------------------------

  let realizedPnl = 0

  closedPositions.forEach((p) => {

    try {

      realizedPnl += parseFloat(

        p.mtm.replace("₹", "")

      )

    } catch {

      realizedPnl += 0

    }

  })

  // ------------------------------------------------
  // EMPTY STATE
  // ------------------------------------------------

  if (strategyData.positions.length === 0) {

    return (

      <div className="strategy-page">

        {/* SUMMARY */}

        <div className="strategy-summary">

          <div className="summary-card">

            <h3>Total Invested</h3>

            <h1>

              ₹
              {strategyData.summary.total_invested}

            </h1>

          </div>

          <div className="summary-card">

            <h3>Live MTM</h3>

            <h1>

              ₹
              {strategyData.summary.total_mtm}

            </h1>

          </div>

          <div className="summary-card">

            <h3>Realized PnL</h3>

            <h1>

              ₹0

            </h1>

          </div>

        </div>

        {/* EMPTY */}

        <div className="positions-section">

          <h1>

            Strategy Engine

          </h1>

          <div className="empty-box">

            Waiting for live signals...

          </div>

        </div>

      </div>

    )

  }

  // ------------------------------------------------
  // UI
  // ------------------------------------------------

  return (

    <div className="strategy-page">

      {/* SUMMARY */}

      <div className="strategy-summary">

        <div className="summary-card">

          <h3>Total Invested</h3>

          <h1>

            ₹
            {strategyData.summary.total_invested}

          </h1>

        </div>

        <div className="summary-card">

          <h3>Live MTM</h3>

          <h1>

            ₹
            {strategyData.summary.total_mtm}

          </h1>

        </div>

        <div className="summary-card">

          <h3>Realized PnL</h3>

          <h1>

            ₹
            {realizedPnl.toFixed(2)}

          </h1>

        </div>

      </div>

      {/* OPEN POSITIONS */}

      <div className="positions-section">

        <h1>

          Open Positions

        </h1>

        {

          openPositions.length === 0 ? (

            <div className="empty-box">

              No Active Positions

            </div>

          ) : (

            openPositions.map(
              (position, index) => (

                <div
                  key={index}
                  className="position-card"
                >

                  {/* TOP */}

                  <div className="position-top">

                    <div>

                      <h2>

                        {position.symbol}
                        {" "}
                        {position.strike}
                        {" "}
                        {position.option_type}

                      </h2>

                      <p>

                        Strategy:
                        {" "}
                        {position.strategy}

                      </p>

                    </div>

                    <div>

                      <h3>

                        {position.status}

                      </h3>

                    </div>

                  </div>

                  {/* GRID */}

                  <div className="position-grid">

                    <div>

                      <p>Entry</p>

                      <h3>

                        ₹
                        {position.entry_price}

                      </h3>

                    </div>

                    <div>

                      <p>Current</p>

                      <h3>

                        ₹
                        {position.current_price}

                      </h3>

                    </div>

                    <div>

                      <p>Invested</p>

                      <h3>

                        ₹
                        {position.invested}

                      </h3>

                    </div>

                    <div>

                      <p>Quantity</p>

                      <h3>

                        {position.quantity}

                      </h3>

                    </div>

                    <div>

                      <p>MTM</p>

                      <h3>

                        {position.mtm}

                      </h3>

                    </div>

                    <div>

                      <p>ROI</p>

                      <h3>

                        {position.roi}

                      </h3>

                    </div>

                  </div>

                  {/* RATIONALE */}

                  <div className="rationale-box">

                    <h3>

                      Trade Rationale

                    </h3>

                    <ul>

                      {

                        position.rationale.map(
                          (item, idx) => (

                            <li key={idx}>

                              {item}

                            </li>

                          )
                        )

                      }

                    </ul>

                  </div>

                </div>

              )
            )

          )

        }

      </div>

      {/* CLOSED POSITIONS */}

      <div className="positions-section">

        <h1>

          Closed Positions

        </h1>

        {

          closedPositions.length === 0 ? (

            <div className="empty-box">

              No Closed Trades Yet

            </div>

          ) : (

            closedPositions.map(
              (position, index) => (

                <div
                  key={index}
                  className="position-card"
                >

                  <div className="position-top">

                    <div>

                      <h2>

                        {position.symbol}
                        {" "}
                        {position.strike}
                        {" "}
                        {position.option_type}

                      </h2>

                      <p>

                        Strategy:
                        {" "}
                        {position.strategy}

                      </p>

                    </div>

                    <div>

                      <h3>

                        {position.exit_reason}

                      </h3>

                    </div>

                  </div>

                  <div className="position-grid">

                    <div>

                      <p>Entry</p>

                      <h3>

                        ₹
                        {position.entry_price}

                      </h3>

                    </div>

                    <div>

                      <p>Exit</p>

                      <h3>

                        ₹
                        {position.current_price}

                      </h3>

                    </div>

                    <div>

                      <p>PnL</p>

                      <h3>

                        {position.mtm}

                      </h3>

                    </div>

                    <div>

                      <p>ROI</p>

                      <h3>

                        {position.roi}

                      </h3>

                    </div>

                    <div>

                      <p>Entry Time</p>

                      <h3>

                        {position.entry_time}

                      </h3>

                    </div>

                    <div>

                      <p>Exit Time</p>

                      <h3>

                        {position.exit_time}

                      </h3>

                    </div>

                  </div>

                </div>

              )
            )

          )

        }

      </div>

    </div>

  )

}