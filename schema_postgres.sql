-- PostgreSQL DDL Schema for Innovation Tracking System
-- Used for Viva reference

CREATE TABLE departments (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) NOT NULL UNIQUE
);

CREATE TABLE innovators (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    department_id INTEGER NOT NULL REFERENCES departments(id)
);

CREATE TYPE project_status AS ENUM ('DRAFT', 'UNDER_REVIEW', 'ACTIVE', 'COMPLETED');

CREATE TABLE projects (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    department_id INTEGER NOT NULL REFERENCES departments(id),
    status project_status DEFAULT 'DRAFT',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE project_innovators (
    project_id INTEGER NOT NULL REFERENCES projects(id),
    innovator_id INTEGER NOT NULL REFERENCES innovators(id),
    role VARCHAR(100) NOT NULL,
    PRIMARY KEY (project_id, innovator_id)
);

CREATE TYPE output_type AS ENUM ('PATENT', 'PUBLICATION', 'TECH_TRANSFER');
CREATE TYPE output_status AS ENUM ('PENDING', 'VERIFIED');

CREATE TABLE impact_outputs (
    id SERIAL PRIMARY KEY,
    project_id INTEGER NOT NULL REFERENCES projects(id),
    type output_type NOT NULL,
    title TEXT NOT NULL,
    identifier VARCHAR(255),
    impact_score INTEGER DEFAULT 0,
    granted_date DATE,
    status output_status DEFAULT 'PENDING'
);

CREATE TABLE audit_logs (
    id SERIAL PRIMARY KEY,
    project_id INTEGER NOT NULL REFERENCES projects(id),
    action VARCHAR(255) NOT NULL,
    previous_state VARCHAR(50),
    new_state VARCHAR(50),
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
