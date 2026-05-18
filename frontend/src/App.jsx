import {
  useEffect,
  useState
} from 'react'

import Chart from './components/Chart'

export default function App() {

  const [marketData, setMarketData] =
    useState(null)

  useEffect(() => {

    const fetchData = () => {

      fetch(
        "http://127.0.0.1:8000/market-data"
      )

        .then((response) =>
          response.json()
        )

        .then((data) => {

          setMarketData(data)

        })

    }

    fetchData()

    const interval =
      setInterval(
        fetchData,
        5000
      )

    return () =>
      clearInterval(interval)

  }, [])

  return (

    <div className="min-h-screen bg-[#0B1120] text-white flex overflow-hidden">

      {/* SIDEBAR */}
      <div className="w-64 min-w-64 bg-[#111827] border-r border-white/10 p-5 flex flex-col">

        <div>

          <h1 className="text-2xl font-bold">
            NIFTY TERMINAL
          </h1>

          <p className="text-sm text-gray-400 mt-1">
            Paper Trading Mode
          </p>

        </div>

        <div className="mt-10 space-y-3">

          <button className="w-full text-left px-4 py-3 rounded-xl bg-white/10 hover:bg-white/20 transition">
            Market Terminal
          </button>

          <button className="w-full text-left px-4 py-3 rounded-xl hover:bg-white/10 transition">
            Strategy Center
          </button>

          <button className="w-full text-left px-4 py-3 rounded-xl hover:bg-white/10 transition">
            Positions & PnL
          </button>

          <button className="w-full text-left px-4 py-3 rounded-xl hover:bg-white/10 transition">
            Risk Monitor
          </button>

          <button className="w-full text-left px-4 py-3 rounded-xl hover:bg-white/10 transition">
            Analytics
          </button>

        </div>

      </div>

      {/* MAIN AREA */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* TOP NAVBAR */}
        <div className="h-16 border-b border-white/10 bg-[#111827]/70 backdrop-blur flex items-center justify-between px-6">

          <div className="flex items-center gap-6">

            <div>

              <div className="text-sm text-gray-400">
                NIFTY
              </div>

              <div className="font-semibold text-lg">
                {marketData?.price}
              </div>

            </div>

            <div
              className={`font-medium ${
                marketData?.change_percent >= 0
                  ? "text-green-400"
                  : "text-red-400"
              }`}
            >
              {marketData?.change_percent}%
            </div>

            <div
              className={`text-sm ${
                marketData?.market_status === "OPEN"
                  ? "text-green-400"
                  : "text-red-400"
              }`}
            >
              Market {marketData?.market_status}
            </div>

          </div>

          <div className="flex items-center gap-6 text-sm">

            <div>
              VIX:
              {" "}
              {marketData?.vix}
            </div>

            <div
              className={`${
                marketData?.data_status === "LIVE"
                  ? "text-green-400"
                  : "text-red-400"
              }`}
            >
              Data:
              {" "}
              {marketData?.data_status}
            </div>

            <div>
              {marketData?.time}
            </div>

          </div>

        </div>

        {/* CONTENT */}
        <div className="p-6 overflow-auto">

          {/* METRIC CARDS */}
          <div className="grid grid-cols-4 gap-4">

            {/* NIFTY */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-5">

              <div className="text-sm text-gray-400">
                NIFTY
              </div>

              <div className="mt-2 text-2xl font-bold">
                {marketData?.price}
              </div>

              <div
                className={`mt-1 ${
                  marketData?.change_percent >= 0
                    ? "text-green-400"
                    : "text-red-400"
                }`}
              >
                {marketData?.change_percent}%
              </div>

            </div>

            {/* VIX */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-5">

              <div className="text-sm text-gray-400">
                VIX
              </div>

              <div className="mt-2 text-2xl font-bold">
                {marketData?.vix}
              </div>

              <div
                className={`mt-1 ${
                  marketData?.vix_change >= 0
                    ? "text-red-400"
                    : "text-green-400"
                }`}
              >
                {marketData?.vix_change}%
              </div>

            </div>

            {/* PCR */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-5">

              <div className="text-sm text-gray-400">
                PCR
              </div>

              <div className="mt-2 text-2xl font-bold">
                {marketData?.pcr}
              </div>

              <div
                className={`mt-1 ${
                  marketData?.pcr >= 1
                    ? "text-green-400"
                    : "text-red-400"
                }`}
              >
                {marketData?.pcr_signal}
              </div>

            </div>

            {/* DAY RANGE */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-5">

              <div className="text-sm text-gray-400">
                DAY RANGE
              </div>

              <div className="mt-2 text-2xl font-bold">
                {marketData?.day_low}
                {" - "}
                {marketData?.day_high}
              </div>

              <div
                className={`mt-1 ${
                  marketData?.data_status === "LIVE"
                    ? "text-green-400"
                    : "text-red-400"
                }`}
              >
                {marketData?.data_status}
              </div>

            </div>

          </div>

          {/* CHART PANEL */}
          <div className="mt-6 bg-white/5 border border-white/10 rounded-2xl p-6">

            <h2 className="text-2xl font-semibold mb-6">
              Market Terminal
            </h2>

            <Chart />

          </div>

        </div>

      </div>

    </div>

  )
}