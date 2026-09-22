from dataclasses import dataclass


@dataclass
class ClimateState:
    date: str
    latitude: float
    longitude: float

    rainfall_mm: float
    max_temperature_c: float

    completeness_score: float
    anomaly_score: float

    def is_extreme(self):

        return abs(self.anomaly_score) > 2

    def is_trustworthy(self):

        return self.completeness_score > 0.8