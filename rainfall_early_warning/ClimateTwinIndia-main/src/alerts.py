def generate_alert(row):

    if row["risk"] == "EXTREME":

        return (
            f"EXTREME CLIMATE ALERT "
            f"({row['latitude']}, "
            f"{row['longitude']})"
        )

    elif row["risk"] == "HIGH":

        return (
            f"HIGH CLIMATE ALERT "
            f"({row['latitude']}, "
            f"{row['longitude']})"
        )

    return None