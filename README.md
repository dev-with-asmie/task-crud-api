# Task API

A simple RESTful CRUD API built with Node.js, Express.js, and SQLite for managing tasks.

## Features

- Create a new task
- Retrieve all tasks
- Retrieve a task by ID
- Update a task
- Delete a task
- Input validation
- Health check endpoint
- Swagger/OpenAPI documentation
- SQLite database storage
- Persistent task data

## Technologies Used

- Node.js
- Express.js
- SQLite
- better-sqlite3
- Swagger UI Express
- OpenAPI 3.0

## Why SQLite?

SQLite was chosen because it is lightweight, simple to use, and does not require a separate database server. The database is stored in a single file, making it suitable for this small CRUD application.

## Database Location

The SQLite database is stored in the project root as:

`tasks.db`

The database and the `tasks` table are automatically created when the application starts if they do not already exist.

Three example tasks are inserted only when the database table is empty.

## How to Run

Clone the repository and open the project folder.

Install the dependencies:

```bash
npm install