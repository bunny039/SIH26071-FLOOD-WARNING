import pandas as pd
import matplotlib.pyplot as plt
def load_all_years(start=2019, end=2025):

    dfs = []

    for year in range(start, end + 1):

        df = pd.read_csv(
            f"../data/processed/climate_states_{year}.csv"
        )

        df["year"] = year

        dfs.append(df)

    return pd.concat(
        dfs,
        ignore_index=True
    )
def annual_temperature_trend(df):

    return (
        df.groupby("year")
        ["max_temperature_c"]
        .mean()
        .reset_index()
    )

def annual_rainfall_trend(df):

    return (
        df.groupby("year")
        ["rainfall_mm"]
        .mean()
        .reset_index()
    )

def top_anomaly_locations(
    df,
    n=20
):

    return (
        df.sort_values(
            "anomaly_score",
            ascending=False
        )
        .head(n)
    )

def hottest_locations(
    df,
    n=20
):

    return (
        df.sort_values(
            "max_temperature_c",
            ascending=False
        )
        .head(n)
    )

def top_anomaly_locations(
    df,
    n=20
):

    return (
        df.sort_values(
            "anomaly_score",
            ascending=False
        )
        .head(n)
    )


def climate_summary(df):

    return {
        "avg_temp":
            df["max_temperature_c"].mean(),

        "avg_rain":
            df["rainfall_mm"].mean(),

        "max_temp":
            df["max_temperature_c"].max(),

        "max_rain":
            df["rainfall_mm"].max(),

        "records":
            len(df)
    }

def wettest_locations(
    df,
    n=20
):

    return (
        df.sort_values(
            "rainfall_mm",
            ascending=False
        )
        .head(n)
    )

def annual_climate_summary(df):

    return (
        df.groupby("year")
        .agg({
            "max_temperature_c": "mean",
            "rainfall_mm": "mean",
            "anomaly_score": "mean"
        })
        .reset_index()
    )

def strongest_positive_anomalies(
    df,
    n=20
):

    return (
        df.sort_values(
            "anomaly_score",
            ascending=False
        )
        .head(n)
    )


def strongest_negative_anomalies(
    df,
    n=20
):

    return (
        df.sort_values(
            "anomaly_score"
        )
        .head(n)
    )


def yearly_anomaly_map(df, year):

    subset = df[df["year"] == year]

    plt.figure(figsize=(10,6))

    plt.scatter(
        subset["longitude"],
        subset["latitude"],
        c=subset["anomaly_score"],
        s=5
    )

    plt.colorbar(label="Anomaly")

    plt.title(
        f"{year} Rainfall Anomaly"
    )

    plt.show()

def classify_risk(anomaly):

    if abs(anomaly) >= 10:
        return "EXTREME"

    elif abs(anomaly) >= 5:
        return "HIGH"

    elif abs(anomaly) >= 2:
        return "MODERATE"

    else:
        return "LOW"
    