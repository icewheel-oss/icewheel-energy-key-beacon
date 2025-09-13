/*
 * IceWheel Energy
 * Copyright (C) 2025 IceWheel LLC
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 *
 */

import { GET } from '../route';
import { tmpdir } from 'node:os';
import { writeFileSync, unlinkSync } from 'node:fs';
import { join } from 'node:path';

describe('GET /.well-known/appspecific/com.tesla.3p.public-key.pem', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules(); // Clear cache
    process.env = { ...originalEnv }; // Restore original env
    delete process.env.TESLA_PUBLIC_KEY;
    delete process.env.TESLA_PUBLIC_KEY_BASE64;
    delete process.env.TESLA_PUBLIC_KEY_FILE;
  });

  afterAll(() => {
    process.env = originalEnv; // Final cleanup
  });

  it('should return the public key when TESLA_PUBLIC_KEY is set (plain)', async () => {
    const mockPublicKey = '-----BEGIN PUBLIC KEY-----\nTEST_KEY\n-----END PUBLIC KEY-----';
    process.env.TESLA_PUBLIC_KEY = mockPublicKey;

    const response = await GET();
    const text = await response.text();

    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toBe('application/x-pem-file');
    expect(text).toBe(mockPublicKey);
  });

  it('should support escaped newlines in TESLA_PUBLIC_KEY', async () => {
    const escaped = '-----BEGIN PUBLIC KEY-----\\nTEST_KEY_ESCAPED\\n-----END PUBLIC KEY-----';
    process.env.TESLA_PUBLIC_KEY = escaped;

    const response = await GET();
    const text = await response.text();

    expect(response.status).toBe(200);
    expect(text).toBe('-----BEGIN PUBLIC KEY-----\nTEST_KEY_ESCAPED\n-----END PUBLIC KEY-----');
  });

  it('should return the public key when TESLA_PUBLIC_KEY_BASE64 is set', async () => {
    const pem = '-----BEGIN PUBLIC KEY-----\nBASE64_KEY\n-----END PUBLIC KEY-----';
    process.env.TESLA_PUBLIC_KEY_BASE64 = Buffer.from(pem, 'utf8').toString('base64');

    const response = await GET();
    const text = await response.text();

    expect(response.status).toBe(200);
    expect(text).toBe(pem);
  });

  it('should return the public key when TESLA_PUBLIC_KEY_FILE is set', async () => {
    const pem = '-----BEGIN PUBLIC KEY-----\nFILE_KEY\n-----END PUBLIC KEY-----';
    const filePath = join(tmpdir(), `test-pubkey-${Date.now()}.pem`);
    writeFileSync(filePath, pem, 'utf8');
    process.env.TESLA_PUBLIC_KEY_FILE = filePath;

    try {
      const response = await GET();
      const text = await response.text();

      expect(response.status).toBe(200);
      expect(text).toBe(pem);
    } finally {
      try { unlinkSync(filePath); } catch {}
    }
  });

  it('should return 404 when no env variants are set', async () => {
    const response = await GET();
    const text = await response.text();

    expect(response.status).toBe(404);
    expect(text).toBe('Public key not found');
  });
});
