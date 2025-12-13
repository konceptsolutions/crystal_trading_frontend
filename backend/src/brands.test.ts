// IMPORTANT:
// Importing `src/server.ts` starts a listener unless we force "serverless" mode.
process.env.NODE_ENV = 'production';
process.env.VERCEL = '1';

import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { prisma } from './utils/prisma';

function unique(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

describe('Brands API (/api/brands)', () => {
  it('creates, lists, updates, blocks delete when used by parts, then deletes after cleanup', async () => {
    const { default: app } = await import('./server');

    const email = `${unique('brand-test')}@test.local`;
    const password = 'TestPass123!';
    const name = 'Test User';

    // Register + get token
    const registerRes = await request(app)
      .post('/api/auth/register')
      .send({ email, password, name })
      .expect(201);

    const token: string = registerRes.body.token;
    expect(token).toBeTruthy();

    const auth = { Authorization: `Bearer ${token}` };

    const brandName = unique('Brand');
    const brandNameUpdated = `${brandName}-Updated`;

    // Create brand
    const createRes = await request(app)
      .post('/api/brands')
      .set(auth)
      .send({ name: brandName, status: 'A' })
      .expect(201);

    const createdBrand = createRes.body.brand;
    expect(createdBrand?.id).toBeTruthy();
    expect(createdBrand?.name).toBe(brandName);

    const brandId: string = createdBrand.id;

    // Duplicate should fail
    await request(app)
      .post('/api/brands')
      .set(auth)
      .send({ name: brandName, status: 'A' })
      .expect(400);

    // List brands should include it
    const listRes = await request(app)
      .get('/api/brands?status=A')
      .set(auth)
      .expect(200);

    expect(Array.isArray(listRes.body.brands)).toBe(true);
    expect(listRes.body.brands.some((b: any) => b.name === brandName)).toBe(true);

    // Update
    const updateRes = await request(app)
      .put(`/api/brands/${brandId}`)
      .set(auth)
      .send({ name: brandNameUpdated })
      .expect(200);

    expect(updateRes.body.brand?.name).toBe(brandNameUpdated);

    // Create a Part that uses this brand (direct prisma is simplest / avoids large payload)
    const partNo = unique('P');
    const createdPart = await prisma.part.create({
      data: {
        partNo,
        brand: brandNameUpdated,
        status: 'A',
      },
    });

    // Delete should be blocked while part references the brand name
    const deleteBlockedRes = await request(app)
      .delete(`/api/brands/${brandId}`)
      .set(auth)
      .expect(400);
    expect(String(deleteBlockedRes.body.error || '')).toContain('Cannot delete brand');

    // Cleanup: delete part then delete brand then delete user
    await prisma.part.delete({ where: { id: createdPart.id } });

    await request(app)
      .delete(`/api/brands/${brandId}`)
      .set(auth)
      .expect(200);

    await prisma.user.delete({ where: { email } });
  });
});


