def rainfall_idx_to_latlon(i, j):
    lat = 38.5 - (i * 0.25)
    lon = 66.5 + (j * 0.25)
    return lat, lon