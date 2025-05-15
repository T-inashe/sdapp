// src/setupTests.ts (or jest.setup.js)
beforeAll(() => {
    // Mocking process.env to simulate the VITE_API_URL during tests
    process.env.VITE_API_URL = 'http://localhost:8081';
  });
  