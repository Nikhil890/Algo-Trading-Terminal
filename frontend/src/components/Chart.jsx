import {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  createChart,
  CandlestickSeries,
} from "lightweight-charts";

const API =
  "https://algo-trading-terminal-production.up.railway.app";

export default function Chart() {

  const chartContainerRef =
    useRef();

  const [timeframe, setTimeframe] =
    useState("5m");

  useEffect(() => {

    const chart = createChart(

      chartContainerRef.current,

      {

        width:
          chartContainerRef.current
            .clientWidth,

        height: 600,

        layout: {

          background: {
            color: "#071226",
          },

          textColor: "#ffffff",

        },

        grid: {

          vertLines: {
            color: "#1e293b",
          },

          horzLines: {
            color: "#1e293b",
          },

        },

        crosshair: {

          mode: 1,

        },

        rightPriceScale: {

          borderColor: "#1e293b",

        },

        timeScale: {

          borderColor: "#1e293b",

          timeVisible: true,

        },

      }

    );

    const candleSeries =
      chart.addSeries(
        CandlestickSeries
      );

    fetchChartData(
      candleSeries
    );

    async function fetchChartData(
      series
    ) {

      try {

        // ------------------------------------------------
        // PERIOD LOGIC
        // ------------------------------------------------

        let period = "7d";

        if (
          timeframe === "15m"
        ) {

          period = "1mo";

        }

        if (
          timeframe === "30m"
        ) {

          period = "3mo";

        }

        if (
          timeframe === "1h"
        ) {

          period = "6mo";

        }

        if (
          timeframe === "1d"
        ) {

          period = "1y";

        }

        // ------------------------------------------------
        // FETCH
        // ------------------------------------------------

        const response =
          await fetch(

            `${API}/nifty-history?interval=${timeframe}&period=${period}`

          );

        const data =
          await response.json();

        const formatted =
          data.map((item) => ({

            time: Math.floor(

              new Date(
                item.time
              ).getTime() / 1000

            ),

            open: item.open,

            high: item.high,

            low: item.low,

            close: item.close,

          }));

        series.setData(
          formatted
        );

        chart.timeScale()
          .fitContent();

      } catch (error) {

        console.log(error);

      }

    }

    // ------------------------------------------------
    // RESIZE
    // ------------------------------------------------

    const handleResize = () => {

      chart.applyOptions({

        width:
          chartContainerRef.current
            .clientWidth,

      });

    };

    window.addEventListener(
      "resize",
      handleResize
    );

    return () => {

      window.removeEventListener(
        "resize",
        handleResize
      );

      chart.remove();

    };

  }, [timeframe]);

  return (

    <div className="chart-wrapper">

      <h1>
        Market Terminal
      </h1>

      <div className="timeframes">

        {[
          "1m",
          "5m",
          "15m",
          "30m",
          "1h",
          "1d",
        ].map((tf) => (

          <button

            key={tf}

            className={
              timeframe === tf
                ? "active-tf"
                : ""
            }

            onClick={() =>
              setTimeframe(tf)
            }

          >
            {tf}
          </button>

        ))}

      </div>

      <div
        ref={chartContainerRef}
      />

    </div>

  );

}