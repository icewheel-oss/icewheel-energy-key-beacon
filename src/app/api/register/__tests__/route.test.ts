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

import { POST } from '@/app/api/register/route';

// Mock the global fetch function
global.fetch = jest.fn();

interface Result {
  status: 'fulfilled' | 'rejected';
  value: {
    region: string;
    data?: Record<string, unknown>;
  };
  reason?: {
    message: string;
  };
}

describe('POST /api/register', () => {
  beforeEach(() => {
    (fetch as jest.Mock).mockClear();
  });

  it('should register for multiple regions successfully', async () => {
    (fetch as jest.Mock).mockImplementation((url: string) =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ success: true, region: url.includes('na') ? 'na' : 'eu' }),
      })
    );

    const request = new Request('http://localhost/api/register', {
      method: 'POST',
      body: JSON.stringify({
        domain: 'example.com',
        token: 'test-token',
        regions: ['na', 'eu'],
      }),
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(fetch).toHaveBeenCalledTimes(2);
    expect(fetch).toHaveBeenCalledWith(expect.stringContaining('na'), expect.any(Object));
    expect(fetch).toHaveBeenCalledWith(expect.stringContaining('eu'), expect.any(Object));
    expect(body).toHaveLength(2);
    expect(body[0].status).toBe('fulfilled');
    expect(body[1].status).toBe('fulfilled');
  });

  it('should handle API errors gracefully', async () => {
    (fetch as jest.Mock)
      .mockResolvedValueOnce(
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true, region: 'na' }),
        })
      )
      .mockResolvedValueOnce(
        Promise.resolve({
          ok: false,
          json: () => Promise.resolve({ error: 'EU registration failed' }),
        })
      );

    const request = new Request('http://localhost/api/register', {
      method: 'POST',
      body: JSON.stringify({
        domain: 'example.com',
        token: 'test-token',
        regions: ['na', 'eu'],
      }),
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(fetch).toHaveBeenCalledTimes(2);
    expect(body).toHaveLength(2);
    const naResult = body.find((r: Result) => r.value.region === 'na');
    const euResult = body.find((r: Result) => r.value.region === 'eu');
    expect(naResult.status).toBe('fulfilled');
    expect(euResult.status).toBe('rejected');
  });

  it('should return 400 for invalid input', async () => {
    const request = new Request('http://localhost/api/register', {
      method: 'POST',
      body: JSON.stringify({ domain: 'example.com' }), // Missing token and regions
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toBe('Domain, token, and at least one region are required');
  });
});
