CREATE SCHEMA trekcheck;

CREATE TABLE trekcheck.Users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE,
    first_name VARCHAR(255),
    last_name VARCHAR(255),
    password VARCHAR(255)
);

CREATE TABLE trekcheck.Trails (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255),
    address VARCHAR(255)
);

CREATE TABLE trekcheck.Checkpoints (
    id SERIAL PRIMARY KEY,
    checkpoint_order INT,
    trail_id INT,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    status VARCHAR(255),
    FOREIGN KEY (trail_id) REFERENCES trekcheck.Trails(id)
);

CREATE TABLE trekcheck.TripPlans (
    id SERIAL PRIMARY KEY,
    user_id INT,
    start_date TIMESTAMP,
    end_date TIMESTAMP,
    trail_id INT,
    entry_point INT,
    exit_point INT,
    emergency_contact_name VARCHAR(255),
    emergency_contact_number VARCHAR(15), -- Adjusted to VARCHAR for flexibility
    emergency_contact_email VARCHAR(255),
    rfid_tag_uid VARCHAR(255),
    progress_tracking_link VARCHAR(255) UNIQUE,
    FOREIGN KEY (user_id) REFERENCES trekcheck.Users(id),
    FOREIGN KEY (entry_point) REFERENCES trekcheck.Checkpoints(id),
    FOREIGN KEY (exit_point) REFERENCES trekcheck.Checkpoints(id),
    FOREIGN KEY (trail_id) REFERENCES trekcheck.Trails(id)
);

CREATE TABLE trekcheck.CheckpointEntries (
    entry_id SERIAL PRIMARY KEY,
    checkpoint_id INT,
    time TIMESTAMP,
    tag_id VARCHAR(255),
    FOREIGN KEY (checkpoint_id) REFERENCES trekcheck.Checkpoints(id)
);
