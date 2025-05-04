// src/setupTests.ts

// Extends Jest with custom DOM matchers like `toBeInTheDocument`, `toHaveTextContent`, etc.
import '@testing-library/jest-dom';
process.env.VITE_API_URL = 'http://localhost:8081';  // Mock the environment variable during tests
