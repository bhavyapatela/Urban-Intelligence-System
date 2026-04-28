CREATE DATABASE urban_intelligence;
USE urban_intelligence;
CREATE TABLE urban_data(
    id INT AUTO_INCREMENT PRIMARY KEY,
    timestamp DATETIME,
    temperature FLOAT,
    humidity FLOAT,
    wind_speed FLOAT,
    wind_direction FLOAT,
    traffic_index FLOAT,
    pm10 FLOAT,
    pm2_5 FLOAT,
    no2 FLOAT,
    co FLOAT,
    aqi FLOAT,
    hour INT,
	day TINYINT,
    day_of_week INT,
    is_weekend TINYINT,
    month INT,
    day_type VARCHAR(10)
);

-- Check if data loaded correctly
SELECT * FROM urban_data;

-- 1. Top 5 Peak traffic hours
SELECT hour, ROUND(AVG(traffic_index),3) AS avg_traffic 
FROM urban_data
GROUP BY hour
ORDER BY avg_traffic DESC
LIMIT 5;
-- Insight: Hour 20, 17, 18, 19, 10 are the highest traffic hours.


-- 2. Traffic by day of the week
SELECT day_of_week, ROUND(AVG(traffic_index),3) AS avg_traffic
FROM urban_data
GROUP BY day_of_week
ORDER BY avg_traffic DESC;
-- Insight: Monday was the highest traffic day of the week while Sunday was the lowest.

-- 3. Traffic weekend vs weekday
SELECT day_type, ROUND(AVG(traffic_index),3) AS avg_traffic
FROM urban_data
GROUP BY day_type;
#Insight: Traffic is higher during weekdays and drops significantly on weekends, indicating that work-related travel afftecs traffic majorly.

-- 4. AQI by hour
SELECT hour,ROUND(AVG(aqi),2) AS avg_aqi
FROM urban_data
GROUP BY hour;

-- 5. traffic vs AQI (Grouped View)
SELECT 
    ROUND(traffic_index,1) AS traffic_level,
    ROUND(AVG(aqi),2) AS avg_aqi
FROM urban_data
GROUP BY traffic_level
ORDER BY traffic_level DESC;
-- Insight: Higher traffic does not always mean high aqi, indicating it depends on other factors too.

-- 6. Temperature Impact on AQI
SELECT 
    CASE 
        WHEN temperature < 20 THEN 'Low'
        WHEN temperature < 30 THEN 'Medium'
        ELSE 'High'
    END AS temp_level,
    ROUND(AVG(aqi),2) AS avg_aqi
FROM urban_data
GROUP BY temp_level
ORDER BY avg_aqi DESC;
-- Insight: Lower temperature level maybe inversely propotional to the AQI.

-- 7. Pollutant Contribution
SELECT 
    ROUND(AVG(pm2_5),2) AS avg_pm2_5,
    ROUND(AVG(pm10),2) AS avg_pm10,
    ROUND(AVG(no2),2) AS avg_no2,
    ROUND(AVG(co),2) AS avg_co
FROM urban_data;
-- Insight: Carbon Monoxide (CO) contributes the highest in the Air Quality Index and Nitrogen Dioxide (NO2) the lowest.

-- 8. Top 10 Worst Condition Times (High Traffic + High AQI)
SELECT * 
FROM urban_data
ORDER BY traffic_index DESC, aqi DESC
LIMIT 10;
-- Insight: These were the top 10 times where coditions were the worst.

-- 9. Best Time to Travel (Low Traffic + Low AQI)
SELECT hour
FROM urban_data
GROUP BY hour
ORDER BY AVG(traffic_index) ASC, AVG(aqi) ASC
LIMIT 5;
-- Insight: Hour 5, 2, 3, 0, 4 are the best times to travel

-- 10. Hourly Combined Insight
SELECT 
    hour,
    ROUND(AVG(traffic_index),3) AS avg_traffic,
    ROUND(AVG(aqi),2) AS avg_aqi
FROM urban_data
GROUP BY hour
ORDER BY hour;