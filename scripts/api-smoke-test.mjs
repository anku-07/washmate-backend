import { once } from "node:events";

import mongoose from "mongoose";

import app from "../dist/app.js";
import { connectDatabase } from "../dist/config/database.js";
import { UserRole } from "../dist/constants/roles.js";
import { User } from "../dist/models/user.model.js";
import { Vehicle } from "../dist/models/vehicle.model.js";

const runId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const emailA = `smoke.${runId}.a@example.com`;
const emailB = `smoke.${runId}.b@example.com`;
const oldPassword = "SmokePassword123";
const newPassword = "NewSmokePassword123";
const registrationA = `WM${Date.now().toString().slice(-9)}A`;
const registrationB = `WM${Date.now().toString().slice(-9)}B`;
const registrationUpdated = `WM${Date.now().toString().slice(-9)}C`;

let server;
let baseUrl;

const request = async (method, path, options = {}) => {
  const headers = {};

  if (options.body) {
    headers["content-type"] = "application/json";
  }

  if (options.cookie) {
    headers.cookie = options.cookie;
  }

  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  const text = await response.text();
  const data = text ? JSON.parse(text) : undefined;
  const setCookie = response.headers.get("set-cookie");

  return {
    status: response.status,
    data,
    cookie: setCookie?.split(";", 1)[0],
  };
};

const expectStatus = (label, response, expectedStatus) => {
  if (response.status !== expectedStatus) {
    throw new Error(
      `${label}: expected ${expectedStatus}, received ${response.status} ${JSON.stringify(response.data)}`,
    );
  }

  console.log(`PASS ${label} (${expectedStatus})`);
};

const expect = (condition, message) => {
  if (!condition) {
    throw new Error(message);
  }
};

const cleanup = async () => {
  if (mongoose.connection.readyState === 0) {
    return;
  }

  const users = await User.find({ email: { $in: [emailA, emailB] } }).select(
    "_id",
  );
  const userIds = users.map((user) => user._id);

  if (userIds.length > 0) {
    await Vehicle.deleteMany({ userId: { $in: userIds } });
    await User.deleteMany({ _id: { $in: userIds } });
  }
};

const closeServer = async () => {
  if (!server) {
    return;
  }

  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
};

try {
  await connectDatabase();
  await Vehicle.init();

  server = app.listen(0, "127.0.0.1");
  await once(server, "listening");
  const address = server.address();

  if (!address || typeof address === "string") {
    throw new Error("Could not determine the smoke-test server address");
  }

  baseUrl = `http://127.0.0.1:${address.port}/api/v1`;

  const health = await request("GET", "/health");
  expectStatus("GET /health", health, 200);

  const unauthorizedMe = await request("GET", "/auth/me");
  expectStatus("GET /auth/me without cookie", unauthorizedMe, 401);

  const registerA = await request("POST", "/auth/register", {
    body: {
      name: "Smoke User A",
      email: emailA,
      phone: "9876543210",
      password: oldPassword,
    },
  });
  expectStatus("POST /auth/register", registerA, 201);
  expect(registerA.cookie, "Registration did not set an authentication cookie");
  expect(
    registerA.data?.data?.role === UserRole.CUSTOMER,
    "Registration did not assign the CUSTOMER role",
  );
  expect(
    !("password" in registerA.data.data),
    "Registration exposed a password",
  );
  let cookieA = registerA.cookie;

  const duplicateRegistration = await request("POST", "/auth/register", {
    body: {
      name: "Duplicate User",
      email: emailA,
      phone: "9876543210",
      password: oldPassword,
    },
  });
  expectStatus("duplicate registration", duplicateRegistration, 409);

  const authMe = await request("GET", "/auth/me", { cookie: cookieA });
  expectStatus("GET /auth/me", authMe, 200);

  const profile = await request("GET", "/users/me", { cookie: cookieA });
  expectStatus("GET /users/me", profile, 200);
  expect(!("password" in profile.data.data), "Profile exposed a password");

  const updatedProfile = await request("PUT", "/users/me", {
    cookie: cookieA,
    body: { name: "Updated Smoke User A", phone: "9876543211" },
  });
  expectStatus("PUT /users/me", updatedProfile, 200);
  expect(
    updatedProfile.data?.data?.name === "Updated Smoke User A",
    "Profile name was not updated",
  );

  const forbiddenProfileUpdate = await request("PUT", "/users/me", {
    cookie: cookieA,
    body: { role: UserRole.ADMIN },
  });
  expectStatus("reject profile role escalation", forbiddenProfileUpdate, 400);

  const changedPassword = await request("PATCH", "/users/me/password", {
    cookie: cookieA,
    body: { currentPassword: oldPassword, newPassword },
  });
  expectStatus("PATCH /users/me/password", changedPassword, 200);

  const logout = await request("POST", "/auth/logout", { cookie: cookieA });
  expectStatus("POST /auth/logout", logout, 200);

  const afterLogout = await request("GET", "/auth/me");
  expectStatus("GET /auth/me after logout", afterLogout, 401);

  const oldPasswordLogin = await request("POST", "/auth/login", {
    body: { email: emailA, password: oldPassword },
  });
  expectStatus("reject old password", oldPasswordLogin, 401);

  const login = await request("POST", "/auth/login", {
    body: { email: emailA, password: newPassword },
  });
  expectStatus("POST /auth/login", login, 200);
  expect(login.cookie, "Login did not set an authentication cookie");
  cookieA = login.cookie;

  const addedVehicleA = await request("POST", "/vehicles", {
    cookie: cookieA,
    body: {
      type: "CAR",
      brand: "Hyundai",
      model: "Creta",
      registrationNumber: registrationA,
      color: "White",
    },
  });
  expectStatus("POST /vehicles (first)", addedVehicleA, 201);
  expect(
    addedVehicleA.data?.data?.isDefault === true,
    "The first vehicle was not set as default",
  );
  const vehicleAId = addedVehicleA.data.data.id;

  const injectedVehicle = await request("POST", "/vehicles", {
    cookie: cookieA,
    body: {
      type: "CAR",
      brand: "Injected",
      model: "Vehicle",
      registrationNumber: "WMTEST9999",
      color: "Black",
      userId: "507f1f77bcf86cd799439011",
    },
  });
  expectStatus("reject vehicle userId injection", injectedVehicle, 400);

  const addedVehicleB = await request("POST", "/vehicles", {
    cookie: cookieA,
    body: {
      type: "BIKE",
      brand: "Royal Enfield",
      model: "Classic 350",
      registrationNumber: registrationB,
      color: "Black",
    },
  });
  expectStatus("POST /vehicles (second)", addedVehicleB, 201);
  const vehicleBId = addedVehicleB.data.data.id;

  const vehicles = await request("GET", "/vehicles", { cookie: cookieA });
  expectStatus("GET /vehicles", vehicles, 200);
  expect(vehicles.data?.data?.length === 2, "Vehicle list did not contain two vehicles");

  const vehicle = await request("GET", `/vehicles/${vehicleAId}`, {
    cookie: cookieA,
  });
  expectStatus("GET /vehicles/:vehicleId", vehicle, 200);

  const updatedVehicle = await request("PUT", `/vehicles/${vehicleAId}`, {
    cookie: cookieA,
    body: {
      type: "CAR",
      brand: "Hyundai",
      model: "Creta",
      registrationNumber: registrationUpdated,
      color: "Blue",
    },
  });
  expectStatus("PUT /vehicles/:vehicleId", updatedVehicle, 200);
  expect(
    updatedVehicle.data?.data?.color === "Blue",
    "Vehicle color was not updated",
  );

  const defaultVehicle = await request(
    "PATCH",
    `/vehicles/${vehicleBId}/default`,
    { cookie: cookieA },
  );
  expectStatus("PATCH /vehicles/:vehicleId/default", defaultVehicle, 200);

  const vehiclesAfterDefault = await request("GET", "/vehicles", {
    cookie: cookieA,
  });
  const defaults = vehiclesAfterDefault.data.data.filter(
    (item) => item.isDefault,
  );
  expect(
    defaults.length === 1 && defaults[0].id === vehicleBId,
    "Default vehicle invariant failed",
  );

  const registerB = await request("POST", "/auth/register", {
    body: {
      name: "Smoke User B",
      email: emailB,
      phone: "9876543212",
      password: oldPassword,
    },
  });
  expectStatus("register ownership-test user", registerB, 201);
  const cookieB = registerB.cookie;
  expect(cookieB, "Second registration did not set a cookie");

  const otherUserGet = await request("GET", `/vehicles/${vehicleAId}`, {
    cookie: cookieB,
  });
  expectStatus("reject cross-user vehicle read", otherUserGet, 404);

  const otherUserUpdate = await request("PUT", `/vehicles/${vehicleAId}`, {
    cookie: cookieB,
    body: {
      type: "CAR",
      brand: "Attack",
      model: "Attempt",
      registrationNumber: "WMATTACK99",
      color: "Red",
    },
  });
  expectStatus("reject cross-user vehicle update", otherUserUpdate, 404);

  const otherUserDefault = await request(
    "PATCH",
    `/vehicles/${vehicleAId}/default`,
    { cookie: cookieB },
  );
  expectStatus("reject cross-user default change", otherUserDefault, 404);

  const otherUserDelete = await request("DELETE", `/vehicles/${vehicleAId}`, {
    cookie: cookieB,
  });
  expectStatus("reject cross-user vehicle deletion", otherUserDelete, 404);

  await User.updateOne({ email: emailB }, { $set: { role: UserRole.PROVIDER } });
  const providerVehicles = await request("GET", "/vehicles", {
    cookie: cookieB,
  });
  expectStatus("reject provider vehicle access", providerVehicles, 403);

  const deleteVehicleA = await request("DELETE", `/vehicles/${vehicleAId}`, {
    cookie: cookieA,
  });
  expectStatus("DELETE /vehicles/:vehicleId", deleteVehicleA, 200);

  const deleteDefaultVehicle = await request(
    "DELETE",
    `/vehicles/${vehicleBId}`,
    { cookie: cookieA },
  );
  expectStatus("DELETE default vehicle", deleteDefaultVehicle, 200);

  const emptyVehicles = await request("GET", "/vehicles", { cookie: cookieA });
  expectStatus("GET empty vehicle list", emptyVehicles, 200);
  expect(emptyVehicles.data?.data?.length === 0, "Vehicle list was not empty");

  console.log("All API smoke tests passed");
} finally {
  await cleanup();
  await closeServer();
  await mongoose.disconnect();
}
