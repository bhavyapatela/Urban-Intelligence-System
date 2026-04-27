CREATE DATABASE urban_intelligence;
USE urban_intelligence;
CREATE TABLE urban_data(
    id INT AUTO_INCREMENT PRIMARY KEY,
    timestamp DATETIME,
    temperature FLOAT,
    humidity FLOAT,
    wind_speed FLOAT,
    wind_direction FLOAT,
    precipitation FLOAT,
    visibility FLOAT,
    congestion_index FLOAT,
    pm10 FLOAT,
    pm25 FLOAT,
    no2 FLOAT,
    co FLOAT,
    aqi FLOAT,
    hour INT,
    day_of_week INT,
    is_weekend TINYINT,
    month INT,
    day_type VARCHAR(10)
);

-- Check if data loaded correctly
SELECT * FROM urban_data;

-- 1. Top 5 Peak traffic hours
SELECT hour, ROUND(AVG(congestion_index),3) AS avg_congestion 
FROM urban_data
GROUP BY hour
ORDER BY avg_congestion DESC
LIMIT 5;
-- Insight: Hour 20, 17, 18, 19, 10 are the highest traffic hours.


-- 2. Traffic by day of the week
SELECT day_of_week, ROUND(AVG(congestion_index),3) AS avg_congestion
FROM urban_data
GROUP BY day_of_week
ORDER BY avg_congestion DESC;
-- Insight: Friday was the highest traffic day of the week while Sunday was the lowest.

-- 3. Traffic weekend vs weekday
SELECT day_type, ROUND(AVG(congestion_index),3) AS avg_congestion
FROM urban_data
GROUP BY day_type;
#Insight: Traffic is higher during weekdays and drops significantly on weekends, indicating that work-related travel afftecs traffic majorly.

-- 4. AQI by hour
SELECT hour,ROUND(AVG(aqi),2) AS avg_aqi
FROM urban_data
GROUP BY hour;

-- 5. Congestion vs AQI (Grouped View)
SELECT 
    ROUND(congestion_index,1) AS congestion_level,
    ROUND(AVG(aqi),2) AS avg_aqi
FROM urban_data
GROUP BY congestion_level
ORDER BY congestion_level DESC;
-- Insight: Higher traffic does not always mean high aqi, indicating it depends on other factors too.

-- 6) Visibility vs traffic
SELECT 
    CASE 
        WHEN visibility < 10000 THEN 'Low'
        WHEN visibility < 20000 THEN 'Medium'
        ELSE 'High'
    END AS visibility_level,
    ROUND(AVG(congestion_index),3) AS avg_congestion
FROM urban_data
GROUP BY visibility_level;
-- Insight: Lower Visibility does not always means higher traffic.
 
-- 7. Temperature Impact on AQI
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
-- Insight: Higher temperature level is directly propotional to the Air Quality.

-- 8. Pollutant Contribution
SELECT 
    ROUND(AVG(pm25),2) AS avg_pm25,
    ROUND(AVG(pm10),2) AS avg_pm10,
    ROUND(AVG(no2),2) AS avg_no2,
    ROUND(AVG(co),2) AS avg_co
FROM urban_data;
-- Insight: Carbon Monoxide (CO) contributes the highest in the Air Quality Index and Nitrogen Dioxide (NO2) the lowest.

-- 9. Top 10 Worst Condition Times (High Traffic + High AQI)
SELECT * 
FROM urban_data
ORDER BY congestion_index DESC, aqi DESC
LIMIT 10;
-- Insight: These were the top 10 times where coditions were the worst.

-- 10. Best Time to Travel (Low Traffic + Low AQI)
SELECT *
FROM urban_data
ORDER BY congestion_index ASC, aqi ASC
LIMIT 10;

-- 11. Hourly Combined Insight
SELECT 
    hour,
    ROUND(AVG(congestion_index),3) AS avg_congestion,
    ROUND(AVG(aqi),2) AS avg_aqi
FROM urban_data
GROUP BY hour
ORDER BY hour;








