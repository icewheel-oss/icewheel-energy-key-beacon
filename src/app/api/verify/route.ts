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

import { NextResponse } from 'next/server';
import { rateLimiter } from '@/utils/rateLimiter'; // Import the rate limiter

const REGION_URLS = {
  na: 'https://fleet-api.prd.na.vn.cloud.tesla.com',
  eu: 'https://fleet-api.prd.eu.vn.cloud.tesla.com',
};

// Define rate limit options: 20 requests per minute (60 * 1000 ms)
const verifyRateLimiter = rateLimiter({ limit: 20, windowMs: 60 * 1000 });

export async function POST(request: Request) {
  try {
    // Get client IP address
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('remote-addr') || 'unknown';

    // Apply rate limit
    if (!verifyRateLimiter(ip)) {
      return new NextResponse(JSON.stringify({ error: 'Too Many Requests' }), { status: 429, headers: { 'Content-Type': 'application/json' } });
    }

    const { domain, token, regions } = await request.json();

    if (!domain || !token || !regions || !Array.isArray(regions) || regions.length === 0) {
      return new NextResponse(JSON.stringify({ error: 'Domain, token, and at least one region are required' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    const promises = regions.map(async (region: keyof typeof REGION_URLS) => {
      if (!REGION_URLS[region]) {
        throw new Error(`Invalid region specified: ${region}`);
      }
      const teslaApiUrl = `${REGION_URLS[region]}/api/1/partner_accounts/public_key?domain=${domain}`;
      
      const apiResponse = await fetch(teslaApiUrl, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await apiResponse.json();
      if (!apiResponse.ok) {
        // Re-throw to be caught by Promise.allSettled
        throw new Error(`API error for region ${region}: ${data.error || 'Unknown API error'}`);
      }
      return { region, data, url: teslaApiUrl };
    });

    const results = await Promise.allSettled(promises);
    
    const formattedResults = results.map(result => {
      if (result.status === 'fulfilled') {
        return { status: 'fulfilled', value: result.value };
      } else {
        const regionMatch = result.reason.message.match(/region (\w+)/);
        const region = regionMatch ? regionMatch[1] : 'unknown';
        return { status: 'rejected', reason: { message: result.reason.message }, value: { region } };
      }
    });

    return new NextResponse(JSON.stringify(formattedResults), { status: 200, headers: { 'Content-Type': 'application/json' } });

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal Server Error';
    return new NextResponse(JSON.stringify({ error: message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}