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

import { POST } from '@/app/api/get-token/route';

global.fetch = jest.fn();

describe('POST /api/get-token', () => {
  beforeEach(() => {
    (fetch as jest.Mock).mockClear();
  });

  it('should return a token successfully', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce(
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ access_token: 'test-token' }),
      })
    );

    const request = new Request('http://localhost/api/get-token', {
      method: 'POST',
      body: JSON.stringify({
        clientId: 'test-id',
        clientSecret: 'test-secret',
      }),
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.access_token).toBe('test-token');
  });

  it('should handle API errors gracefully', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce(
      Promise.resolve({
        ok: false,
        json: () => Promise.resolve({ error: 'invalid_client' }),
      })
    );

    const request = new Request('http://localhost/api/get-token', {
      method: 'POST',
      body: JSON.stringify({
        clientId: 'invalid-id',
        clientSecret: 'invalid-secret',
      }),
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.error).toBe('invalid_client');
  });

  it('should return 400 for invalid input', async () => {
    const request = new Request('http://localhost/api/get-token', {
      method: 'POST',
      body: JSON.stringify({ clientId: 'test-id' }), // Missing clientSecret
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toBe('clientId and clientSecret are required');
  });
});
