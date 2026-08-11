import { runMigrations } from './migrator';
import { sequelize } from '../models';

async function main(): Promise<void> {
  try {
    await sequelize.authenticate();
    const executed = await runMigrations(sequelize);
    console.log(
      executed.length > 0
        ? `Migraciones aplicadas: ${executed.join(', ')}`
        : 'La base de datos ya esta actualizada.'
    );
  } finally {
    await sequelize.close();
  }
}

void main().catch((error: unknown) => {
  console.error('No se pudieron aplicar las migraciones.', error);
  process.exitCode = 1;
});
