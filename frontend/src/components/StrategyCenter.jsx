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

  useEffect(() => {

    fetch(
      `${API}/strategy-data`
    )

      .then((response) => response.json())

      .then((data) => {

        setStrategyData(data)

        if (data.positions.length > 0) {

          setSelectedPosition(
            data.positions[0]
          )

        }

      })

      .catch((error) => {

        console.error(error)

      })

  }, [])

  // ------------------------------------------------
  // LOADING
  // ------------------------------------------------

  if (!strategyData) {

    return (

      <div className="empty-box">

        Loading Positions...

      </div>

    )

  }

  // ------------------------------------------------
  // EMPTY
  // ------------------------------------------------

  if (strategyData.positions.length === 0) {

    return (

      <div className="strategy-page">

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

        </div>

        <div className="positions-section">

          <h1>Live Positions</h1>

          <div className="empty-box">

            No Active Positions

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

      </div>

      {/* POSITIONS */}

      <div className="positions-section">

        <h1>Live Positions</h1>

        <div className="position-card">

          <div className="position-top">

            <div>

              <h2>

                {selectedPosition.symbol}
                {" "}
                {selectedPosition.strike}
                {" "}
                {selectedPosition.option_type}

              </h2>

              <p>

                Expiry:
                {" "}
                {selectedPosition.expiry}

              </p>

            </div>

            <div>

              <h3>
                {selectedPosition.status}
              </h3>

            </div>

          </div>

          <div className="position-grid">

            <div>

              <p>Entry</p>

              <h3>
                ₹
                {selectedPosition.entry_price}
              </h3>

            </div>

            <div>

              <p>Current</p>

              <h3>
                ₹
                {selectedPosition.current_price}
              </h3>

            </div>

            <div>

              <p>Invested</p>

              <h3>
                ₹
                {selectedPosition.invested}
              </h3>

            </div>

            <div>

              <p>Quantity</p>

              <h3>
                {selectedPosition.quantity}
              </h3>

            </div>

            <div>

              <p>MTM</p>

              <h3>
                {selectedPosition.mtm}
              </h3>

            </div>

            <div>

              <p>ROI</p>

              <h3>
                {selectedPosition.roi}
              </h3>

            </div>

            <div>

              <p>Stop Loss</p>

              <h3>
                ₹
                {selectedPosition.stop_loss}
              </h3>

            </div>

            <div>

              <p>Target</p>

              <h3>
                ₹
                {selectedPosition.target}
              </h3>

            </div>

          </div>

          <div className="rationale-box">

            <h3>
              Trade Rationale
            </h3>

            <ul>

              {selectedPosition.rationale.map(
                (item, index) => (

                  <li key={index}>
                    {item}
                  </li>

                )
              )}

            </ul>

          </div>

        </div>

      </div>

    </div>

  )

}