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

const rateLimitMap = new Map();

interface RateLimitOptions {
  limit: number;
  windowMs: number;
}

export function rateLimiter(options: RateLimitOptions) {
  return (ip: string) => {
    const now = Date.now();
    const requests = rateLimitMap.get(ip) || [];

    // Filter out expired requests
    const validRequests = requests.filter((timestamp: number) => timestamp > now - options.windowMs);

    if (validRequests.length >= options.limit) {
      return false; // Rate limit exceeded
    }

    validRequests.push(now);
    rateLimitMap.set(ip, validRequests);
    return true; // Request allowed
  };
}
