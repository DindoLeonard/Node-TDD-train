import sequelize from '../src/config/database';
import Token from '../src/auth/Token';
import TokenService from '../src/auth/TokenService';

beforeAll(async () => {
  await sequelize.sync();
});

beforeEach(async () => {
  await Token.destroy({ truncate: true });
});

describe('Scheduled Token Cleanup', () => {
  //
  it('clears the expired token with scheduled task', async () => {
    //
    jest.useFakeTimers();
    const token = 'test-token';

    const eightDaysAgo = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000);

    await Token.create({
      token,
      lastUsedAt: eightDaysAgo,
    });

    TokenService.scheduleCleanup();

    jest.advanceTimersByTime(60 * 60 * 1000 + 5000);

    const tokenInDB = await Token.findOne({ where: { token } });

    expect(tokenInDB).toBeNull();
  });
});
