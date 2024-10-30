CREATE SCHEMA trekcheck;

CREATE TABLE trekcheck.SARUsers (
    id serial PRIMARY KEY,
    email VARCHAR(255) UNIQUE,
    first_name VARCHAR(255),
    last_name VARCHAR(255),
    password VARCHAR(255),
    admin BOOLEAN
);

CREATE TABLE trekcheck.Users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE,
    first_name VARCHAR(255),
    last_name VARCHAR(255),
    password VARCHAR(255),
    rfid_tag_uid VARCHAR(255) UNIQUE
);

CREATE TABLE trekcheck.Trails (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255),
    address VARCHAR(255)
);

CREATE TABLE trekcheck.Checkpoints (
    id SERIAL PRIMARY KEY,
    pole_id INT UNIQUE,
    checkpoint_order INT,
    name VARCHAR(255),
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
    emergency_contact_number VARCHAR(15), 
    emergency_contact_email VARCHAR(255),
    progress_tracking_link VARCHAR(255) UNIQUE,
    archived BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (user_id) REFERENCES trekcheck.Users(id),
    FOREIGN KEY (entry_point) REFERENCES trekcheck.Checkpoints(id),
    FOREIGN KEY (exit_point) REFERENCES trekcheck.Checkpoints(id),
    FOREIGN KEY (trail_id) REFERENCES trekcheck.Trails(id),
    additional_notes VARCHAR(225)
);

CREATE TABLE trekcheck.CheckpointEntries (
    entry_id SERIAL PRIMARY KEY,
    pole_id INT,
    time TIMESTAMP,
    tag_id VARCHAR(255),
    FOREIGN KEY (pole_id) REFERENCES trekcheck.Checkpoints(pole_id)
);

CREATE TABLE trekcheck.Bugs {
    reportID serial PRIMARY KEY,
    submittedDate VARCHAR(225),
    bugDescription VARCHAR(255)
}