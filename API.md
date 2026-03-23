# API Reference

## Base URL

```
http://localhost:3000/api
```

## Authentication

Authentication via Better Auth is configured in the application but not yet integrated into individual endpoints. To implement:

1. Add auth middleware to protected routes
2. Extract user from request context
3. Pass user data to Prisma operations

## Endpoints

### Health Check

Check if the server is running.

```
GET /health
```

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-03-23T10:30:00Z"
}
```

### Root Endpoint

Get API information and available endpoints.

```
GET /
```

**Response:**
```json
{
  "message": "Movie Portal Backend API",
  "version": "1.0.0",
  "endpoints": {
    "health": "/health",
    "users": "/api/users",
    "movies": "/api/movies"
  }
}
```

## Users Endpoints

### List All Users

Retrieve all users from the database.

```
GET /api/users
```

**Response:**
```json
[
  {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "email": "user@example.com",
    "name": "John Doe",
    "image": null,
    "createdAt": "2024-03-23T10:00:00Z",
    "updatedAt": "2024-03-23T10:00:00Z"
  }
]
```

### Get User by ID

Retrieve a specific user.

```
GET /api/users/:id
```

**Parameters:**
- `id` (UUID) - User ID

**Response:**
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "email": "user@example.com",
  "name": "John Doe",
  "image": null,
  "createdAt": "2024-03-23T10:00:00Z",
  "updatedAt": "2024-03-23T10:00:00Z"
}
```

**Error Response:**
```json
{
  "error": "User not found"
}
```

### Create User

Create a new user.

```
POST /api/users
Content-Type: application/json
```

**Request Body:**
```json
{
  "email": "newuser@example.com",
  "name": "Jane Doe",
  "image": "https://example.com/avatar.jpg"
}
```

**Validation Rules:**
- `email` - Required, must be valid email
- `name` - Optional, non-empty string
- `image` - Optional, valid URL

**Response (201 Created):**
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174001",
  "email": "newuser@example.com",
  "name": "Jane Doe",
  "image": "https://example.com/avatar.jpg",
  "createdAt": "2024-03-23T10:30:00Z",
  "updatedAt": "2024-03-23T10:30:00Z"
}
```

**Error Response (400 Bad Request):**
```json
{
  "error": "Validation failed",
  "details": [
    {
      "path": "email",
      "message": "Invalid email address"
    }
  ]
}
```

### Update User

Update an existing user.

```
PUT /api/users/:id
Content-Type: application/json
```

**Parameters:**
- `id` (UUID) - User ID

**Request Body (all optional):**
```json
{
  "email": "updated@example.com",
  "name": "Jane Smith",
  "image": "https://example.com/new-avatar.jpg"
}
```

**Response:**
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174001",
  "email": "updated@example.com",
  "name": "Jane Smith",
  "image": "https://example.com/new-avatar.jpg",
  "createdAt": "2024-03-23T10:30:00Z",
  "updatedAt": "2024-03-23T10:45:00Z"
}
```

### Delete User

Delete a user.

```
DELETE /api/users/:id
```

**Parameters:**
- `id` (UUID) - User ID

**Response:**
- Status: 204 No Content

## Movies Endpoints

### List All Movies

Retrieve all movies.

```
GET /api/movies
```

**Response:**
```json
[
  {
    "id": "223e4567-e89b-12d3-a456-426614174000",
    "title": "Inception",
    "description": "A sci-fi thriller about dreams",
    "releaseDate": "2010-07-16T00:00:00Z",
    "posterUrl": "https://example.com/inception.jpg",
    "createdAt": "2024-03-23T11:00:00Z",
    "updatedAt": "2024-03-23T11:00:00Z"
  }
]
```

### Get Movie by ID

Retrieve a specific movie.

```
GET /api/movies/:id
```

**Parameters:**
- `id` (UUID) - Movie ID

**Response:**
```json
{
  "id": "223e4567-e89b-12d3-a456-426614174000",
  "title": "Inception",
  "description": "A sci-fi thriller about dreams",
  "releaseDate": "2010-07-16T00:00:00Z",
  "posterUrl": "https://example.com/inception.jpg",
  "createdAt": "2024-03-23T11:00:00Z",
  "updatedAt": "2024-03-23T11:00:00Z"
}
```

### Create Movie

Create a new movie.

```
POST /api/movies
Content-Type: application/json
```

**Request Body:**
```json
{
  "title": "The Dark Knight",
  "description": "A crime thriller",
  "releaseDate": "2008-07-18T00:00:00Z",
  "posterUrl": "https://example.com/dark-knight.jpg"
}
```

**Validation Rules:**
- `title` - Required, non-empty string
- `description` - Optional
- `releaseDate` - Optional, valid ISO datetime
- `posterUrl` - Optional, valid URL

**Response (201 Created):**
```json
{
  "id": "223e4567-e89b-12d3-a456-426614174001",
  "title": "The Dark Knight",
  "description": "A crime thriller",
  "releaseDate": "2008-07-18T00:00:00Z",
  "posterUrl": "https://example.com/dark-knight.jpg",
  "createdAt": "2024-03-23T11:15:00Z",
  "updatedAt": "2024-03-23T11:15:00Z"
}
```

### Update Movie

Update an existing movie.

```
PUT /api/movies/:id
Content-Type: application/json
```

**Parameters:**
- `id` (UUID) - Movie ID

**Request Body (all optional):**
```json
{
  "title": "The Dark Knight Rises",
  "description": "Updated description"
}
```

**Response:**
```json
{
  "id": "223e4567-e89b-12d3-a456-426614174001",
  "title": "The Dark Knight Rises",
  "description": "Updated description",
  "releaseDate": "2008-07-18T00:00:00Z",
  "posterUrl": "https://example.com/dark-knight.jpg",
  "createdAt": "2024-03-23T11:15:00Z",
  "updatedAt": "2024-03-23T11:30:00Z"
}
```

### Delete Movie

Delete a movie.

```
DELETE /api/movies/:id
```

**Parameters:**
- `id` (UUID) - Movie ID

**Response:**
- Status: 204 No Content

## Error Codes

| Code | Message | Description |
|------|---------|-------------|
| 200 | OK | Successful GET request |
| 201 | Created | Successful POST request |
| 204 | No Content | Successful DELETE request |
| 400 | Bad Request | Invalid request data or validation error |
| 404 | Not Found | Resource not found |
| 500 | Internal Server Error | Server error |

## Example Requests with cURL

### Create a User

```bash
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "name": "John Doe"
  }'
```

### Get All Users

```bash
curl http://localhost:3000/api/users
```

### Get User by ID

```bash
curl http://localhost:3000/api/users/123e4567-e89b-12d3-a456-426614174000
```

### Update User

```bash
curl -X PUT http://localhost:3000/api/users/123e4567-e89b-12d3-a456-426614174000 \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Smith"
  }'
```

### Delete User

```bash
curl -X DELETE http://localhost:3000/api/users/123e4567-e89b-12d3-a456-426614174000
```

### Create a Movie

```bash
curl -X POST http://localhost:3000/api/movies \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Interstellar",
    "description": "A sci-fi odyssey",
    "releaseDate": "2014-11-07T00:00:00Z",
    "posterUrl": "https://example.com/interstellar.jpg"
  }'
```

## Example Requests with JavaScript Fetch

### Create a User

```javascript
const response = await fetch('http://localhost:3000/api/users', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    email: 'user@example.com',
    name: 'User Name',
  }),
});

const user = await response.json();
console.log(user);
```

### Get All Movies

```javascript
const response = await fetch('http://localhost:3000/api/movies');
const movies = await response.json();
console.log(movies);
```

## Response Format

All successful responses follow this format:

```json
{
  "id": "123...",
  "field1": "value1",
  "field2": "value2",
  ...
}
```

All error responses follow this format:

```json
{
  "error": "Error message",
  "details": [...]  // Optional, for validation errors
}
```
