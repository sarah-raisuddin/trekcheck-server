INSERT INTO trekcheck.Users (email, first_name, last_name, password) VALUES
('john.doe@example.com', 'John', 'ur mom', '2hbhksdd'),
('jane.smith@example.com', 'Jane', 'Smith', '3ubfhdksf');

INSERT INTO trekcheck.SARUsers (email, password) VALUES
('admin@example.com', 'admin');

INSERT INTO trekcheck.Trails (name, address) VALUES
('Appalachian Trail', 'Eastern United States'),
('Pacific Crest Trail', 'Western United States');

INSERT INTO trekcheck.Checkpoints (checkpoint_order, checkpoint_name, trail_id, latitude, longitude, status) VALUES
(1, 'urmombeach', 1, 34.0100, -118.4965, 'Open'),
(2, 'urdadbeach', 1, 35.1234, -117.7890, 'Open'),
(3, 'urmomsmombeach', 1, 32.7157, -117.1611, 'Open'),
(4, 'meow', 1, 33.1234, -116.7890, 'Open');

INSERT INTO trekcheck.TripPlans (user_id, start_date, end_date, trail_id, entry_point, exit_point, emergency_contact_name, emergency_contact_number, emergency_contact_email, rfid_tag_uid, progress_tracking_link) VALUES
(1, '2024-07-01 08:00:00', '2024-07-15 18:00:00', 1, 1, 2, 'Alice Doe', '123-456-7890', 'alice.doe@example.com', 'RFID-001', 'http://tracking.example.com/track/001'),
(2, '2024-07-05 09:00:00', '2024-07-20 19:00:00', 1, 3, 4, 'Bob Smith', '987-654-3210', 'bob.smith@example.com', 'RFID-002', 'http://tracking.example.com/track/002');

INSERT INTO trekcheck.CheckpointEntries (checkpoint_id, time, tag_id) VALUES
(1, '2024-07-01 08:30:00', 1),
(2, '2024-07-15 17:00:00', 1),
(3, '2024-07-05 09:30:00', 2),
(4, '2024-07-20 18:00:00', 2);


