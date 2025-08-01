-- Migration: Remove zones table and insert initial zones into locations_zones for organization 164c2cc5-ffca-4982-a5d5-a0790288b078

-- Remove the zones table and insert zones into locations_zones with explicit UUIDs
DROP TABLE IF EXISTS zones;

-- Insert initial zones for organization 164c2cc5-ffca-4982-a5d5-a0790288b078
INSERT INTO locations_zones (id, organization_id, name) VALUES
    (uuid_generate_v4(), '164c2cc5-ffca-4982-a5d5-a0790288b078', 'Hub'),
    (uuid_generate_v4(), '164c2cc5-ffca-4982-a5d5-a0790288b078', 'Core'),
    (uuid_generate_v4(), '164c2cc5-ffca-4982-a5d5-a0790288b078', 'T Zone'),
    (uuid_generate_v4(), '164c2cc5-ffca-4982-a5d5-a0790288b078', 'U Zone');
