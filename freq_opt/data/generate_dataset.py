import os
import numpy as np
import pandas as pd

# Set random seed for reproducibility
np.random.seed(42)

# Chennai-Specific Routes (20 routes total)
ROUTES = [
    "21C", "47A", "29B", "23C", "5C", "12E", "M70", "27D", "9A", "15G",
    "102", "19C", "11D", "32B", "45A", "29C", "21G", "101", "104", "70"
]

ROUTE_DEMAND_INDEX = {
    "21C": 0.90, "47A": 0.95, "29B": 0.70, "23C": 0.92, "5C": 0.85,
    "12E": 0.88, "M70": 0.60, "27D": 0.75, "9A": 0.93, "15G": 0.72,
    "102": 0.65, "19C": 0.78, "11D": 0.70, "32B": 0.68, "45A": 0.91,
    "29C": 0.88, "21G": 0.92, "101": 0.85, "104": 0.80, "70": 0.86
}

def get_peak_multiplier(hour):
    if 7 <= hour <= 10:    return 1.7   # Morning peak
    elif 17 <= hour <= 21: return 1.65  # Evening peak
    elif 11 <= hour <= 14: return 1.1   # Midday mild surge
    elif 0 <= hour <= 5:   return 0.25  # Night (skeleton service)
    else:                  return 0.75  # Off-peak

TRAFFIC_BY_HOUR = {
    # High congestion windows for Chennai
    7: 3.8, 8: 4.5, 9: 4.2, 10: 3.1,
    17: 4.0, 18: 4.7, 19: 4.3, 20: 3.5,
    12: 2.5, 13: 2.3,
}

def compute_buses_to_add(row):
    """
    Grounded in MTC's average bus capacity of 65 passengers.
    Overcrowding threshold: occupancy > 0.85
    Effective throughput gap determines bus shortfall.
    Strict rule: buses_to_add = 0 if occupancy < 85%
    """
    if row['occupancy_pct'] < 0.85:
        return 0
        
    capacity_per_bus = 65
    peak_mult = get_peak_multiplier(row['hour_of_day'])

    estimated_unserved = (
        (row['occupancy_pct'] - 0.85) * capacity_per_bus * row['active_buses_on_route']
        * peak_mult
        * row['route_demand_index']
        * (1 + row['event_impact_score'] * 0.5)
    )

    buses_needed = max(0, round(estimated_unserved / capacity_per_bus))
    buses_needed = min(buses_needed, 5)  # Hard ceiling: max 5 additional buses

    # Add small noise for realism
    buses_needed = max(0, buses_needed + np.random.randint(-1, 2))
    return int(np.clip(buses_needed, 0, 5))

def generate_data(num_rows=2500):
    data = []
    for _ in range(num_rows):
        route = np.random.choice(ROUTES)
        demand_index = ROUTE_DEMAND_INDEX[route]
        
        hour = np.random.randint(0, 24)
        day_type = np.random.choice([0, 1], p=[0.7, 0.3]) # 70% weekdays, 30% weekends
        
        # Traffic score based on hour of day with some random variance
        base_traffic = TRAFFIC_BY_HOUR.get(hour, 1.5)
        traffic_score = np.clip(base_traffic + np.random.normal(0, 0.4), 1.0, 5.0)
        
        # Event impact score: 85% chance of 0, 15% chance of some event impact
        if np.random.rand() < 0.85:
            event_impact_score = 0.0
        else:
            event_impact_score = np.clip(np.random.beta(2, 5), 0.1, 1.0)
            
        # Active buses: routes with higher demand index generally have more buses
        base_buses = int(5 + 10 * demand_index)
        active_buses = int(np.clip(base_buses + np.random.randint(-3, 4), 2, 18))
        
        # Occupancy depends on demand index, hour (peak), day type, event impact, and active buses
        peak_mult = get_peak_multiplier(hour)
        weekend_mult = 0.7 if day_type == 1 else 1.0
        
        # More buses on route slightly alleviates occupancy, but generally matches high demand
        buses_factor = 1.0 - (active_buses - base_buses) * 0.02
        
        base_occupancy = 0.8 * demand_index * peak_mult * weekend_mult * buses_factor
        base_occupancy += event_impact_score * 0.4
        occupancy_pct = np.clip(base_occupancy + np.random.normal(0, 0.15), 0.2, 1.8)
        
        # Wait time depends on headway (60 / active buses) and traffic delay
        base_headway = 60.0 / active_buses
        traffic_delay = (traffic_score - 1.0) * 4.0
        wait_time = np.clip(base_headway + traffic_delay + np.random.normal(0, 2.0), 2.0, 35.0)
        
        # Temperature (Celsius)
        temp_celsius = np.random.uniform(22.0, 42.0)
        
        row = {
            'route_no': route,
            'hour_of_day': hour,
            'day_type': day_type,
            'occupancy_pct': round(float(occupancy_pct), 3),
            'avg_wait_time_min': round(float(wait_time), 1),
            'traffic_score': round(float(traffic_score), 2),
            'event_impact_score': round(float(event_impact_score), 2),
            'active_buses_on_route': active_buses,
            'route_demand_index': demand_index,
            'temp_celsius': round(float(temp_celsius), 1)
        }
        
        # Compute target variable
        row['buses_to_add'] = compute_buses_to_add(row)
        data.append(row)
        
    df = pd.DataFrame(data)
    
    # Save directory verification
    os.makedirs('freq_opt/data', exist_ok=True)
    df.to_csv('freq_opt/data/mtc_frequency_dataset.csv', index=False)
    print(f"Generated {num_rows} rows and saved to freq_opt/data/mtc_frequency_dataset.csv")

if __name__ == '__main__':
    generate_data()
