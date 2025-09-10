// Override Cypress types with Jest types for testing
import '@types/jest';

declare global {
  namespace jest {
    interface Matchers<R> {
      toBe(expected: any): R;
      toEqual(expected: any): R;
      toContain(expected: any): R;
      toBeGreaterThan(expected: number): R;
      toBeGreaterThanOrEqual(expected: number): R;
      toBeLessThan(expected: number): R;
      toBeTruthy(): R;
      toBeFalsy(): R;
    }
  }
}