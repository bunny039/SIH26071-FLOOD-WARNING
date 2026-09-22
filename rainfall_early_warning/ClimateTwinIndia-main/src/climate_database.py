import pandas as pd

def states_to_dataframe(states):
    return pd.DataFrame(
        [vars(state) for state in states]
    )

def save_climate_database(states, path):

    df = states_to_dataframe(states)

    df.to_csv(
        path,
        index=False
    )

    return df