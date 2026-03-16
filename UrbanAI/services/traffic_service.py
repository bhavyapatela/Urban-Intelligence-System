def get_traffic():
    
    # Mock traffic data (for now)
    congestion_level = "High"
    area = "City Center"

    traffic_data = f"""
Traffic Status:
Congestion Level: {congestion_level}
Affected Area: {area}
Advice: Consider alternate routes or public transport.
"""

    return traffic_data