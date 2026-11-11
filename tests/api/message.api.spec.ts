import { test, expect } from '../../src/fixtures/fixtures';
import { buildMessage } from '../../src/data/factories';

/** Formulario de contacto = equivalente a "abrir una consulta / siniestro". */
test.describe('API Message @api', () => {
  test('enviar mensaje válido -> 200 @AC8', async ({ api }) => {
    const res = await api.sendMessage(buildMessage());
    expect(res.status()).toBe(200);
  });

  // Tabla de decisión: cada fila rompe UNA regla y comprueba su mensaje
  const invalid = [
    { field: 'subject', value: 'abcd', error: 'Subject must be between 5 and 100 characters.' },
    { field: 'description', value: 'demasiado corto', error: 'Message must be between 20 and 2000 characters.' },
    { field: 'phone', value: '123', error: 'Phone must be between 11 and 21 characters.' },
    { field: 'name', value: '', error: 'Name may not be blank' },
  ] as const;

  for (const c of invalid) {
    test(`${c.field} inválido -> 400 "${c.error}" @AC8`, async ({ api }) => {
      const res = await api.sendMessage(buildMessage({ [c.field]: c.value }));
      expect(res.status()).toBe(400);
      expect(JSON.stringify(await res.json())).toContain(c.error);
    });
  }
});
