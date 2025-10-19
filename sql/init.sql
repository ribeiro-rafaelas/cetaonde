CREATE TABLE IF NOT EXISTS trips (
    id SERIAL PRIMARY KEY,
    destination VARCHAR(255) NOT NULL,
    country VARCHAR(255) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
