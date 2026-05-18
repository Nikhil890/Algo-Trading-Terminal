import {
  useEffect,
  useState
} from "react"

export default function StrategyCenter() {

  const [strategyData, setStrategyData] =
    useState(null)

  const [selectedPosition, setSelectedPosition] =
    useState(null)

  useEffect(() => {

    fetch(
      "https://glowing-system-gppw4p9x66vcwxqr-8000.app.github.dev/strategy-data"
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

  if (!strategyData) {

    return (

      <div className="flex items-center justify-center h-screen bg-[#0B1120] text-white text-xl">

        Loading Positions...

      </div>

    )

  }

  if (strategyData.positions.length === 0) {

    return (

      <div className="flex items-center justify-center h-screen bg-[#0B1120] text-white">

        <div className="text-center">

          <h2 className="text-3xl font-bold mb-4">
            No Active Positions
          </h2>

          <p className="text-gray-400">
            Waiting for strategy signal...
          </p>

        </div>

      </div>

    )

  }

  return (

    <div className="flex-1 bg-[#0B1120] text-white overflow-auto p-5">

      <div className="flex items-center justify-between mb-6">

        <div>

          <h1 className="text-3xl font-bold">
            Positions Terminal
          </h1>

          <p className="text-gray-400 mt-1 text-sm">
            Intraday options execution monitor
          </p>

        </div>

        <div className="flex items-center gap-4">

          <div className="bg-[#172033] border border-white/10 px-5 py-3 rounded-xl">

            <div className="text-xs text-gray-400 mb-1">
              Total Invested
            </div>

            <div className="text-xl font-bold">
              ₹{strategyData.summary.total_invested}
            </div>

          </div>

          <div className="bg-[#172033] border border-white/10 px-5 py-3 rounded-xl">

            <div className="text-xs text-gray-400 mb-1">
              Today's MTM
            </div>

            <div className="text-xl font-bold text-green-400">
              ₹{strategyData.summary.total_mtm}
            </div>

          </div>

        </div>

      </div>

      <div className="grid grid-cols-12 gap-5">

        <div className="col-span-4 bg-[#172033] border border-white/10 rounded-2xl overflow-hidden">

          <div className="grid grid-cols-5 px-4 py-4 border-b border-white/10 text-xs text-gray-400 font-medium">

            <div>Symbol</div>

            <div>Type</div>

            <div>Expiry</div>

            <div>Qty</div>

            <div>MTM</div>

          </div>

          {strategyData.positions.map((position, index) => (

            <div
              key={index}
              onClick={() =>
                setSelectedPosition(position)
              }
              className={`
                grid grid-cols-5 px-4 py-5 items-center border-b border-white/5 cursor-pointer transition
                ${
                  selectedPosition &&
                  selectedPosition.symbol === position.symbol &&
                  selectedPosition.strike === position.strike
                    ? "bg-blue-500/10"
                    : "hover:bg-white/5"
                }
              `}
            >

              <div>

                <div className="font-semibold">
                  {position.symbol}
                </div>

                <div className="text-gray-400 text-xs mt-1">
                  {position.strike}
                </div>

              </div>

              <div>

                <span
                  className={`
                    px-2 py-1 rounded-lg text-xs font-medium
                    ${
                      position.option_type === "CE"
                        ? "bg-green-500/20 text-green-400"
                        : "bg-red-500/20 text-red-400"
                    }
                  `}
                >
                  {position.option_type}
                </span>

              </div>

              <div className="text-xs text-gray-300">
                {position.expiry}
              </div>

              <div>
                {position.quantity}
              </div>

              <div
                className={`font-medium ${
                  position.mtm.includes("-")
                    ? "text-red-400"
                    : "text-green-400"
                }`}
              >
                {position.mtm}
              </div>

            </div>

          ))}

        </div>

        <div className="col-span-8 bg-[#172033] border border-white/10 rounded-2xl p-6">

          <div className="flex items-center justify-between mb-8">

            <div>

              <h2 className="text-3xl font-bold">

                {selectedPosition.symbol}
                {" "}
                {selectedPosition.strike}
                {" "}
                {selectedPosition.option_type}

              </h2>

              <p className="text-gray-400 mt-1">
                Expiry:
                {" "}
                {selectedPosition.expiry}
              </p>

            </div>

            <div
              className={`px-4 py-2 rounded-xl text-sm font-semibold ${
                selectedPosition.status === "OPEN"
                  ? "bg-green-500/20 text-green-400"
                  : "bg-gray-500/20 text-gray-300"
              }`}
            >
              {selectedPosition.status}
            </div>

          </div>

          <div className="grid grid-cols-3 gap-4 mb-8">

            <div className="bg-[#0B1120] border border-white/10 rounded-xl p-4">

              <div className="text-gray-400 text-xs mb-2">
                Entry Premium
              </div>

              <div className="text-2xl font-bold">
                ₹{selectedPosition.entry_price}
              </div>

            </div>

            <div className="bg-[#0B1120] border border-white/10 rounded-xl p-4">

              <div className="text-gray-400 text-xs mb-2">
                Current Premium
              </div>

              <div className="text-2xl font-bold">
                ₹{selectedPosition.current_price}
              </div>

            </div>

            <div className="bg-[#0B1120] border border-white/10 rounded-xl p-4">

              <div className="text-gray-400 text-xs mb-2">
                Invested Amount
              </div>

              <div className="text-2xl font-bold">
                ₹{selectedPosition.invested}
              </div>

            </div>

            <div className="bg-[#0B1120] border border-white/10 rounded-xl p-4">

              <div className="text-gray-400 text-xs mb-2">
                MTM
              </div>

              <div
                className={`text-2xl font-bold ${
                  selectedPosition.mtm.includes("-")
                    ? "text-red-400"
                    : "text-green-400"
                }`}
              >
                {selectedPosition.mtm}
              </div>

            </div>

            <div className="bg-[#0B1120] border border-white/10 rounded-xl p-4">

              <div className="text-gray-400 text-xs mb-2">
                ROI
              </div>

              <div className="text-2xl font-bold text-green-400">
                {selectedPosition.roi}
              </div>

            </div>

            <div className="bg-[#0B1120] border border-white/10 rounded-xl p-4">

              <div className="text-gray-400 text-xs mb-2">
                Auto Exit
              </div>

              <div className="text-2xl font-bold text-yellow-300">
                3:15 PM
              </div>

            </div>

          </div>

          <div className="bg-[#0B1120] border border-white/10 rounded-xl p-5">

            <h3 className="text-xl font-semibold mb-5">
              Trade Rationale
            </h3>

            <div className="space-y-4 text-sm text-gray-300 leading-7">

              {selectedPosition.rationale.map((item, index) => (

                <div key={index}>
                  • {item}
                </div>

              ))}

            </div>

          </div>

        </div>

      </div>

    </div>

  )

}