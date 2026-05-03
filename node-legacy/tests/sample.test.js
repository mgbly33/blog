const dbHandler = require('./db-handler');

describe('Sample Test', () => {
  beforeAll(async () => await dbHandler.connect());
  afterEach(async () => await dbHandler.clearDatabase());
  afterAll(async () => await dbHandler.closeDatabase());

  it('should be true', () => {
    expect(true).toBe(true);
  });
});
