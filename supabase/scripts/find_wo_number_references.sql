-- Find all references to wo_number in functions, triggers, and views
SELECT routine_name, routine_definition
FROM information_schema.routines
WHERE routine_definition ILIKE '%wo_number%';

SELECT trigger_name, event_object_table, action_statement
FROM information_schema.triggers
WHERE action_statement ILIKE '%wo_number%';

SELECT table_name, view_definition
FROM information_schema.views
WHERE view_definition ILIKE '%wo_number%';

-- Find all tables with a column named wo_number
SELECT table_name, column_name
FROM information_schema.columns
WHERE column_name = 'wo_number';
