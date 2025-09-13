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
import { rateLimiter } from '@/utils/rateLimiter';

const getTokenRateLimiter = rateLimiter({ limit: 5, windowMs: 60 * 1000 });

export async function POST(request: Request) {
  try {
    // Get client IP address
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('remote-addr') || 'unknown';

    // Apply rate limit
    if (!getTokenRateLimiter(ip)) {
      return new NextResponse(JSON.stringify({ error: 'Too Many Requests' }), { status: 429, headers: { 'Content-Type': 'application/json' } });
    }

    const { clientId, clientSecret } = await request.json();

    if (!clientId || !clientSecret) {
      return new NextResponse(JSON.stringify({ error: 'clientId and clientSecret are required' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    const teslaAuthUrl = `https://fleet-auth.prd.vn.cloud.tesla.com/oauth2/v3/token`;

    const params = new URLSearchParams();
    params.append('grant_type', 'client_credentials');
    params.append('client_id', clientId);
    params.append('client_secret', clientSecret);
    params.append('scope', 'openid user_data vehicle_device_data vehicle_cmds vehicle_charging_cmds energy_device_data energy_cmds offline_access');
    params.append('audience', `https://fleet-api.prd.na.vn.cloud.tesla.com`);

    const apiResponse = await fetch(teslaAuthUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params,
    });

    const data = await apiResponse.json();

    if (!apiResponse.ok) {
      throw new Error(data.error_description || data.error || 'Failed to fetch token from Tesla API');
    }

    return new NextResponse(JSON.stringify(data), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal Server Error';
    return new NextResponse(JSON.stringify({ error: message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}
