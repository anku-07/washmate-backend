# WashMate Backend API Reference

This reference describes the implemented WashMate APIs for frontend integration. The API uses JSON over HTTP and authenticates users with an HTTP-only cookie. All endpoints listed here are implemented and have passed the automated API smoke test.

## Connection details

Local development base URL:

```text
http://localhost:7000/api/v1
```

The deployed frontend should read the API base URL from its own environment configuration rather than hard-coding it.

All request bodies must use:

```http
Content-Type: application/json
```

## Authentication from the frontend

Successful registration and login responses set an HTTP-only cookie named `washmate_token`. JavaScript cannot and should not read this cookie. The browser sends it automatically when the request includes credentials.

The cookie uses these protections:

- `httpOnly: true`
- `sameSite: "lax"`
- `secure: true` in production
- `path: "/"`

The JWT lifetime is controlled by `JWT_EXPIRES_IN`, which defaults to `7d`.

### Fetch example

```ts
const API_BASE_URL = "http://localhost:7000/api/v1";

export async function apiRequest(
  path: string,
  options: RequestInit = {},
) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message ?? "Request failed");
  }

  return result;
}
```

### Axios example

```ts
import axios from "axios";

export const api = axios.create({
  baseURL: "http://localhost:7000/api/v1",
  withCredentials: true,
});
```

Do not store the JWT in `localStorage` or attach an `Authorization` header. Authentication is cookie-based.

## Response conventions

Successful data response:

```json
{
  "success": true,
  "data": {}
}
```

Successful action response:

```json
{
  "success": true,
  "message": "Action completed successfully"
}
```

Error response:

```json
{
  "success": false,
  "message": "Error description"
}
```

Common status codes:

| Status | Meaning |
| --- | --- |
| `200` | Request completed successfully |
| `201` | Resource created successfully |
| `400` | Request body, parameter, or validation error |
| `401` | Authentication is missing or invalid |
| `403` | Authenticated user does not have the required role |
| `404` | Route or owned resource was not found |
| `409` | Email or registration number already exists |
| `500` | Unexpected server error |

## Data types

### User

```ts
type UserRole = "CUSTOMER" | "PROVIDER" | "ADMIN";

interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  isVerified: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
```

Passwords are never included in API responses. Public registration always assigns the `CUSTOMER` role.

### Vehicle

```ts
type VehicleType = "BIKE" | "CAR";

interface Vehicle {
  id: string;
  type: VehicleType;
  brand: string;
  model: string;
  registrationNumber: string;
  color: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}
```

The API does not return a vehicle's internal `userId`. Ownership is derived from the authenticated user.

## Endpoint summary

| Method | Endpoint | Authentication | Role | Purpose |
| --- | --- | --- | --- | --- |
| GET | `/health` | No | Any | Check API health |
| POST | `/auth/register` | No | Any | Register a customer |
| POST | `/auth/login` | No | Any | Log in and set auth cookie |
| POST | `/auth/logout` | No | Any | Clear auth cookie |
| GET | `/auth/me` | Yes | Any | Restore the authenticated user |
| GET | `/users/me` | Yes | Any | Get the current profile |
| PUT | `/users/me` | Yes | Any | Update name or phone |
| PATCH | `/users/me/password` | Yes | Any | Change password |
| POST | `/vehicles` | Yes | Customer | Add a vehicle |
| GET | `/vehicles` | Yes | Customer | List owned vehicles |
| GET | `/vehicles/:vehicleId` | Yes | Customer | Get one owned vehicle |
| PUT | `/vehicles/:vehicleId` | Yes | Customer | Update one owned vehicle |
| DELETE | `/vehicles/:vehicleId` | Yes | Customer | Delete one owned vehicle |
| PATCH | `/vehicles/:vehicleId/default` | Yes | Customer | Set the default vehicle |

## Health endpoint

### Check API health

```http
GET /health
```

Authentication is not required.

Success response: `200 OK`

```json
{
  "success": true,
  "message": "WashMate API is healthy"
}
```

## Authentication endpoints

### Register customer

```http
POST /auth/register
```

Request body:

```json
{
  "name": "Aditya Mondal",
  "email": "aditya@example.com",
  "phone": "9876543210",
  "password": "Password123"
}
```

Validation:

- `name`: 2 to 100 characters after trimming
- `email`: valid email address; normalized to lowercase
- `phone`: 8 to 15 digits with an optional leading `+`
- `password`: 8 to 72 characters
- Unknown fields, including `role`, are rejected

Success response: `201 Created`

```json
{
  "success": true,
  "data": {
    "id": "66f1234567890abcdef1234",
    "name": "Aditya Mondal",
    "email": "aditya@example.com",
    "phone": "9876543210",
    "role": "CUSTOMER",
    "isVerified": false,
    "isActive": true,
    "createdAt": "2026-10-07T10:00:00.000Z",
    "updatedAt": "2026-10-07T10:00:00.000Z"
  }
}
```

The response also sets the `washmate_token` cookie.

Possible errors:

- `400` for invalid or unknown fields
- `409` when the email is already registered

### Login

```http
POST /auth/login
```

Request body:

```json
{
  "email": "aditya@example.com",
  "password": "Password123"
}
```

Success response: `200 OK`

```json
{
  "success": true,
  "data": {
    "id": "66f1234567890abcdef1234",
    "name": "Aditya Mondal",
    "email": "aditya@example.com",
    "phone": "9876543210",
    "role": "CUSTOMER",
    "isVerified": false,
    "isActive": true,
    "createdAt": "2026-10-07T10:00:00.000Z",
    "updatedAt": "2026-10-07T10:00:00.000Z"
  }
}
```

The response sets or replaces the `washmate_token` cookie.

Invalid email and invalid password both return the same response to avoid revealing whether an account exists:

```http
401 Unauthorized
```

```json
{
  "success": false,
  "message": "Invalid email or password"
}
```

An inactive account returns `403 Forbidden` with `"Account is inactive"`.

### Get authenticated user

```http
GET /auth/me
```

Authentication is required. This endpoint is suitable for restoring authentication state when the frontend loads.

Success response: `200 OK`

```json
{
  "success": true,
  "data": {
    "id": "66f1234567890abcdef1234",
    "name": "Aditya Mondal",
    "email": "aditya@example.com",
    "phone": "9876543210",
    "role": "CUSTOMER",
    "isVerified": false,
    "isActive": true,
    "createdAt": "2026-10-07T10:00:00.000Z",
    "updatedAt": "2026-10-07T10:00:00.000Z"
  }
}
```

Missing, invalid, or expired cookies return `401 Unauthorized`.

### Logout

```http
POST /auth/logout
```

The endpoint clears the `washmate_token` cookie.

Success response: `200 OK`

```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

## User profile endpoints

All profile endpoints require the authentication cookie.

### Get current profile

```http
GET /users/me
```

Success response: `200 OK` with the `User` data shape.

This endpoint reads the latest profile from MongoDB. Use `/auth/me` for authentication bootstrap and `/users/me` for the profile feature.

### Update current profile

```http
PUT /users/me
```

Request body:

```json
{
  "name": "Aditya Mondal Updated",
  "phone": "9876543211"
}
```

The request may include `name`, `phone`, or both. At least one must be present. Email, role, active status, verification status, and unknown fields are rejected.

Validation:

- `name`: 2 to 100 characters after trimming
- `phone`: 8 to 15 digits with an optional leading `+`

Success response: `200 OK` with the updated `User` data shape.

### Change password

```http
PATCH /users/me/password
```

Request body:

```json
{
  "currentPassword": "Password123",
  "newPassword": "NewPassword123"
}
```

Validation:

- `currentPassword`: required, maximum 72 characters
- `newPassword`: 8 to 72 characters
- New password must differ from the current password

Success response: `200 OK`

```json
{
  "success": true,
  "message": "Password changed successfully"
}
```

An incorrect current password returns:

```http
401 Unauthorized
```

```json
{
  "success": false,
  "message": "Current password is incorrect"
}
```

Changing the password does not currently invalidate existing JWTs.

## Vehicle endpoints

All vehicle endpoints require an authenticated user with the `CUSTOMER` role. Providers and admins currently receive `403 Forbidden`.

Every vehicle lookup is scoped to the authenticated user. Accessing another customer's vehicle returns `404`, which avoids revealing whether that vehicle exists.

### Add vehicle

```http
POST /vehicles
```

Request body:

```json
{
  "type": "CAR",
  "brand": "Hyundai",
  "model": "Creta",
  "registrationNumber": "WB12AB1234",
  "color": "White"
}
```

Validation:

- `type`: `BIKE` or `CAR`
- `brand`: required, maximum 100 characters
- `model`: required, maximum 100 characters
- `registrationNumber`: 6 to 15 letters or numbers after normalization
- `color`: required, maximum 100 characters
- `userId`, `isDefault`, and other unknown fields are rejected

Registration numbers are converted to uppercase, with spaces and hyphens removed. For example, `wb-12 ab 1234` becomes `WB12AB1234`.

The backend takes ownership from the authenticated user. The first vehicle created by a customer becomes the default vehicle automatically.

Success response: `201 Created`

```json
{
  "success": true,
  "data": {
    "id": "66f2234567890abcdef1234",
    "type": "CAR",
    "brand": "Hyundai",
    "model": "Creta",
    "registrationNumber": "WB12AB1234",
    "color": "White",
    "isDefault": true,
    "createdAt": "2026-10-07T10:10:00.000Z",
    "updatedAt": "2026-10-07T10:10:00.000Z"
  }
}
```

A duplicate registration number returns `409 Conflict`.

### List my vehicles

```http
GET /vehicles
```

Success response: `200 OK`

```json
{
  "success": true,
  "data": [
    {
      "id": "66f2234567890abcdef1234",
      "type": "CAR",
      "brand": "Hyundai",
      "model": "Creta",
      "registrationNumber": "WB12AB1234",
      "color": "White",
      "isDefault": true,
      "createdAt": "2026-10-07T10:10:00.000Z",
      "updatedAt": "2026-10-07T10:10:00.000Z"
    }
  ]
}
```

The default vehicle is listed first. An account with no vehicles receives an empty `data` array.

### Get one vehicle

```http
GET /vehicles/:vehicleId
```

`vehicleId` must be a valid 24-character MongoDB ObjectId.

Success response: `200 OK` with the `Vehicle` data shape.

Possible errors:

- `400` for an invalid vehicle ID format
- `404` when the vehicle does not exist or belongs to another user

### Update vehicle

```http
PUT /vehicles/:vehicleId
```

This is a full update. Send all five editable vehicle fields:

```json
{
  "type": "CAR",
  "brand": "Hyundai",
  "model": "Creta",
  "registrationNumber": "WB12AB9999",
  "color": "Blue"
}
```

Success response: `200 OK` with the updated `Vehicle` data shape.

The request cannot change `userId` or `isDefault`. Use the dedicated default endpoint to change the default vehicle.

### Delete vehicle

```http
DELETE /vehicles/:vehicleId
```

Success response: `200 OK`

```json
{
  "success": true,
  "message": "Vehicle deleted successfully"
}
```

If the deleted vehicle was the default and other vehicles remain, the oldest remaining vehicle becomes the default.

> [!CALLOUT] ⚠️
>
> Active and upcoming booking protection is not enforced yet because the Booking model has not been implemented. The deletion service contains the integration point for this rule.

### Set default vehicle

```http
PATCH /vehicles/:vehicleId/default
```

No request body is required.

Success response: `200 OK` with the selected `Vehicle` data shape and `isDefault: true`.

The operation clears the previous default and guarantees that at most one vehicle is marked as default for the customer.

## Frontend integration flow

Recommended application startup flow:

1. Call `GET /auth/me` with `credentials: "include"`.
2. Store the returned safe user object in frontend state.
3. Treat `401` as signed out and render the unauthenticated experience.
4. After login or registration, update frontend auth state from the returned user.
5. After logout, clear frontend auth and profile state.

Recommended vehicle flow:

1. Load vehicles with `GET /vehicles` after authentication.
2. Keep vehicle IDs only for routing and API operations; never submit a `userId`.
3. Refresh the vehicle list after create, update, default selection, or deletion, or update the client cache from the returned response.
4. Use the vehicle with `isDefault: true` as the initial selection in future booking forms.

## Current scope limitations

The following APIs are not implemented yet:

- Provider registration and approval
- Forgot password and password reset
- Email or phone verification
- Booking management
- Services, availability, reviews, and payments
- Admin management endpoints

The current API includes health, customer authentication, user profile management, and customer vehicle management.
