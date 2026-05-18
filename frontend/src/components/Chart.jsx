import {
  useEffect,
  useRef,
  useState
} from "react";

import {
  createChart,
  CandlestickSeries
} from "lightweight-charts";

export default function Chart() {

  const chartContainerRef =
    useRef();

  const chartRef =
    useRef();

  const seriesRef =
    useRef();

  const [timeframe, setTimeframe] =
    useState("5m");

  useEffect(() => {

    const chart = createChart(
      chartContainerRef.current,
      {

        width:
          chartContainerRef.current.clientWidth,

        height: 550,

        layout: {

          background: {
            color: "#0B1120",
          },

          textColor: "#d1d5db",
        },

        grid: {

          vertLines: {
            color:
              "rgba(255,255,255,0.05)",
          },

          horzLines: {
            color:
              "rgba(255,255,255,0.05)",
          },
        },

      }
    );

    const candlestickSeries =
      chart.addSeries(
        CandlestickSeries
      );

    chartRef.current = chart;

    seriesRef.current =
      candlestickSeries;

    const handleResize = () => {

      chart.applyOptions({

        width:
          chartContainerRef.current.clientWidth

      })

    }

    window.addEventListener(
      "resize",
      handleResize
    )

    return () => {

      window.removeEventListener(
        "resize",
        handleResize
      )

      chart.remove()

    }

  }, []);

  useEffect(() => {

    let period = "5d";

    if (timeframe === "1d") {

      period = "6mo";

    }

    if (timeframe === "1h") {

      period = "1mo";

    }

    fetch(
      `http://127.0.0.1:8000/nifty-history?interval=${timeframe}&period=${period}`
    )

      .then((response) =>
        response.json()
      )

      .then((data) => {

        const formattedData =
          data.map((candle) => ({

            time: Math.floor(
              new Date(
                candle.time
              ).getTime() / 1000
            ),

            open: candle.open,

            high: candle.high,

            low: candle.low,

            close: candle.close,

          }));

        seriesRef.current.setData(
          formattedData
        );

      });

  }, [timeframe]);

  return (

    <div className="w-full">

      {/* TIMEFRAME BUTTONS */}
      <div className="flex gap-3 mb-5 flex-wrap">

        {[
          "1m",
          "5m",
          "15m",
          "30m",
          "1h",
          "1d"
        ].map((tf) => (

          <button
            key={tf}
            onClick={() =>
              setTimeframe(tf)
            }
            className={`px-4 py-2 rounded-lg text-sm transition ${
              timeframe === tf
                ? "bg-blue-500 text-white"
                : "bg-white/5 hover:bg-white/10"
            }`}
          >
            {tf}
          </button>

        ))}

      </div>

      {/* CHART */}
      <div
        ref={chartContainerRef}
        className="w-full"
      />

    </div>

  );
}