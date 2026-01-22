# Sample SQL Queries for Dog History

## 1. See all history for a specific dog (by dog_id)
```sql
SELECT * FROM dog_history
WHERE dog_id = 123
ORDER BY event_time DESC;
```

## 2. See all location changes for all dogs
```sql
SELECT * FROM dog_history
WHERE event_type = 'location_change'
ORDER BY event_time DESC;
```

## 3. See the most recent status change for each dog
```sql
SELECT DISTINCT ON (dog_id) *
FROM dog_history
WHERE event_type = 'status_change'
ORDER BY dog_id, event_time DESC;
```

## 4. See all history events for all dogs, most recent first
```sql
SELECT * FROM dog_history
ORDER BY event_time DESC;
```
