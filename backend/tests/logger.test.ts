describe('logger', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('exporta una instancia de pino con los metodos esperados', () => {
    const { logger } = require('../src/logger');
    expect(typeof logger.info).toBe('function');
    expect(typeof logger.error).toBe('function');
  });

  it('usa nivel silent por defecto en entorno de test', () => {
    process.env.NODE_ENV = 'test';
    delete process.env.LOG_LEVEL;
    const { logger } = require('../src/logger');
    expect(logger.level).toBe('silent');
  });

  it('usa nivel info por defecto fuera de test si no hay LOG_LEVEL', () => {
    process.env.NODE_ENV = 'production';
    delete process.env.LOG_LEVEL;
    const { logger } = require('../src/logger');
    expect(logger.level).toBe('info');
  });

  it('respeta LOG_LEVEL cuando esta definido', () => {
    process.env.NODE_ENV = 'test';
    process.env.LOG_LEVEL = 'debug';
    const { logger } = require('../src/logger');
    expect(logger.level).toBe('debug');
  });
});
