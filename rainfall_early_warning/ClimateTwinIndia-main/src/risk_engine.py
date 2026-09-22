def classify_risk(anomaly):

    anomaly = abs(anomaly)

    if anomaly >= 10:
        return "EXTREME"

    elif anomaly >= 5:
        return "HIGH"

    elif anomaly >= 2:
        return "MODERATE"

    else:
        return "LOW"


def risk_score(anomaly):

    return abs(anomaly)