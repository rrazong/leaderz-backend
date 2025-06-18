-- Insert Lakehouse Golf Resort
INSERT INTO golf_courses (id, name, location) VALUES 
('550e8400-e29b-41d4-a716-446655440000', 'Lakehouse Golf Resort', 'San Marcos, CA');

-- Insert holes for Lakehouse Golf Resort (18 holes, typical par 72 course)
INSERT INTO golf_course_holes (golf_course_id, hole_number, par) VALUES
-- Front 9
('550e8400-e29b-41d4-a716-446655440000', 1, 4),
('550e8400-e29b-41d4-a716-446655440000', 2, 3),
('550e8400-e29b-41d4-a716-446655440000', 3, 4),
('550e8400-e29b-41d4-a716-446655440000', 4, 5),
('550e8400-e29b-41d4-a716-446655440000', 5, 4),
('550e8400-e29b-41d4-a716-446655440000', 6, 3),
('550e8400-e29b-41d4-a716-446655440000', 7, 4),
('550e8400-e29b-41d4-a716-446655440000', 8, 4),
('550e8400-e29b-41d4-a716-446655440000', 9, 5),
-- Back 9
('550e8400-e29b-41d4-a716-446655440000', 10, 4),
('550e8400-e29b-41d4-a716-446655440000', 11, 3),
('550e8400-e29b-41d4-a716-446655440000', 12, 4),
('550e8400-e29b-41d4-a716-446655440000', 13, 5),
('550e8400-e29b-41d4-a716-446655440000', 14, 4),
('550e8400-e29b-41d4-a716-446655440000', 15, 3),
('550e8400-e29b-41d4-a716-446655440000', 16, 4),
('550e8400-e29b-41d4-a716-446655440000', 17, 4),
('550e8400-e29b-41d4-a716-446655440000', 18, 5);

-- Insert SD Summer Golf Invitational 2025 tournament
INSERT INTO tournaments (id, url_id, name, golf_course_id) VALUES
('660e8400-e29b-41d4-a716-446655440001', 'SD2025', 'SD Summer Golf Invitational 2025', '550e8400-e29b-41d4-a716-446655440000'); 