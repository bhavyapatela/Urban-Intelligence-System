from datetime import datetime

def get_traffic():
    now = datetime.now()
    hour = now.hour
    is_weekend = now.weekday() >= 5

    if is_weekend:
        congestion_level = "Moderate" if 10 <= hour <= 18 else "Low"
    else:
        if 8 <= hour <= 10 or 17 <= hour <= 20:
            congestion_level = "High"
        else:
            congestion_level = "Moderate"

    area = "City Center"
    advice = "Consider alternate routes" if congestion_level == "High" else "Normal traffic conditions"

    traffic_data = f"""
Traffic Status:
Congestion Level: {congestion_level}
Affected Area: {area}
Advice: {advice}.
"""
    return traffic_data