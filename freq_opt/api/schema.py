from pydantic import BaseModel, Field

class FrequencyPredictRequest(BaseModel):
    route_no: str = Field(..., description="MTC route number, e.g. '21C'")
    hour_of_day: int = Field(..., ge=0, le=23, description="Hour of day (0-23)")
    day_type: int = Field(..., ge=0, le=1, description="0 = weekday, 1 = weekend")
    occupancy_pct: float = Field(..., ge=0.0, description="Route occupancy percent (e.g. 1.2 = 120% capacity)")
    avg_wait_time_min: float = Field(..., ge=0.0, description="Average passenger wait time in minutes")
    traffic_score: float = Field(..., ge=1.0, le=5.0, description="Traffic congestion score (1.0 = clear, 5.0 = gridlock)")
    event_impact_score: float = Field(..., ge=0.0, le=1.0, description="Special event impact factor (0.0 to 1.0)")
    active_buses_on_route: int = Field(..., ge=1, description="Currently active buses on route")
    temp_celsius: float = Field(..., description="Temperature in Celsius")

class FrequencyPredictResponse(BaseModel):
    route_no: str
    recommendation: str
    buses_to_add: int
    confidence: float
    expected_wait_time_before: float
    expected_wait_time_after: float
    wait_time_reduction_pct: float
    priority_level: str
    reasoning: str
