import { app } from '../app'; // Assuming the app instance is imported from the main file
import request from 'supertest';
import { executeQuery } from '../db'; // Mock this function to simulate DB behavior
import jest from 'jest-mock';

jest.mock('../db'); // Mock the DB module

describe("GET /UserData", () => {
  afterEach(() => {
    jest.clearAllMocks(); // Ensure mocks are reset after each test
  });

  it("returns user from passport", async () => {
    // Mock passport-style user data
    const mockUser = {
      id: "123",
      name: "John Doe",
      email: "john@example.com",
      institution: "Campus A",
      avatar: "avatar.jpg"
    };

    app.request.isAuthenticated = () => true;
    app.request.user = mockUser;

    const res = await request(app).get("/UserData");

    expect(res.statusCode).toBe(200);
    expect(res.body.loggedIn).toBe(true);
    expect(res.body.user[0].email).toBe("john@example.com");
  });

  it("returns user from session user", async () => {
    // Mock session user data
    app.request.isAuthenticated = () => false;
    app.request.user = null;
    app.request.session = {
      user: [{
        id: "456",
        name: "Jane Smith",
        email: "jane@example.com",
        institution: "Campus B",
        avatar: "pic.png"
      }]
    };

    const res = await request(app).get("/UserData");

    expect(res.statusCode).toBe(200);
    expect(res.body.loggedIn).toBe(true);
    expect(res.body.user[0].email).toBe("jane@example.com");
    expect(res.body.user[0].institution).toBe("Campus B");
  });

  it("returns user from session.passport.user via DB", async () => {
    // Mock passport session and DB query
    app.request.isAuthenticated = () => false;
    app.request.user = null;
    app.request.session = {
      passport: { user: "passportuser@example.com" }
    };

    const fakeUser = [{
      id: "789",
      name: "Passport User",
      email: "passportuser@example.com",
      institution: "Uni X",
      avatar: "avatarx.png"
    }];
    
    // Mock DB query to return the fake user
    executeQuery.mockImplementation((query, params, callback) => {
      callback(null, fakeUser);
    });

    const res = await request(app).get("/UserData");

    expect(res.statusCode).toBe(200);
    expect(res.body.loggedIn).toBe(true);
    expect(res.body.user[0].email).toBe("passportuser@example.com");
  });

  it("returns loggedIn false if no auth data is found", async () => {
    // Mock no session or user data
    app.request.isAuthenticated = () => false;
    app.request.user = null;
    app.request.session = {};

    const res = await request(app).get("/UserData");

    expect(res.statusCode).toBe(200);
    expect(res.body.loggedIn).toBe(false);
  });
});