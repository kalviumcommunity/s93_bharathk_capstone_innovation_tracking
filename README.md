# Innovation Tracking System

A web application to track university innovation projects, innovators, departments, and their resulting impact outputs (like patents, publications, and tech transfers).

## Mock UX Design

Canva Link:
https://canva.link/emk21s04eg7gk0r

This mock UX demonstrates the application's primary screens, navigation flow, and major user journeys.

### Video Walkthrough
Google Drive Link:
https://drive.google.com/drive/folders/1NS9lBO5Ksw_Z2HoqRt6qzTuV5xSNUwmp?usp=sharing

## Features

- **Project Management**: Track innovation projects and their current status.
- **Impact Outputs**: Log patents, publications, and technology transfers linked to projects.
- **Analytics**: View summarized analytics for departments based on their impact score and output type.
- **Audit Logging**: Maintain a history of state changes and outputs added for accountability.
- **Database**: Uses PostgreSQL to persist data with a normalized relational schema.

## Prerequisites

- [Node.js](https://nodejs.org/) (v14 or higher recommended)
- [PostgreSQL](https://www.postgresql.org/) (Running locally on default port 5432)

## Setup Instructions

1. **Clone the repository** (if you haven't already):
   ```bash
   git clone <your-repository-url>
   cd Innovation-Tracking
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure PostgreSQL**:
   Make sure you have a local PostgreSQL instance running. Update the database credentials in `db.js` if they differ from your local setup:
   - **User**: `postgres`
   - **Password**: `8956` (Change this to your local postgres password)
   - **Database**: `postgres`
   - **Host**: `localhost`
   - **Port**: `5432`

4. **Run the Application**:
   For development with auto-restart:
   ```bash
   npm run dev
   ```
   Or to just start the server:
   ```bash
   npm start
   ```

   The server will start on `http://localhost:3000`. On the first run, the system will automatically create the required database schema and insert initial seed data.

## API Endpoints

- `GET /api/analytics/department-summary` - Get analytics for each department.
- `GET /api/projects` - Get all projects including innovators and outputs.
- `POST /api/projects` - Create a new project.
- `PATCH /api/projects/:id/status` - Update project status.
- `POST /api/projects/:id/outputs` - Add an impact output to a project.
- `GET /api/audit-logs` - View audit logs for all projects.
- `GET /api/departments` - Get a list of all departments.
