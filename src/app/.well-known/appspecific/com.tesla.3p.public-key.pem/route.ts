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
import { readFileSync } from 'node:fs';

// Force this route to be evaluated at request time in production and avoid any static prerendering
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const runtime = 'nodejs';

function normalizePem(input: string | undefined | null): string | undefined {
  if (!input) return undefined;
  // Convert escaped newlines ("\n") to actual newlines and trim whitespace
  const unescaped = input.replace(/\\n/g, '\n').trim();
  return unescaped.length > 0 ? unescaped : undefined;
}

function tryDecodeBase64(input: string | undefined | null): string | undefined {
  if (!input) return undefined;
  try {
    const decoded = Buffer.from(input, 'base64').toString('utf8');
    const normalized = normalizePem(decoded);
    // Heuristic: expect PEM markers after decoding
    if (normalized && /-----BEGIN [A-Z ]+-----/.test(normalized)) {
      return normalized;
    }
  } catch {
    // ignore
  }
  return undefined;
}

function tryReadFile(path: string | undefined | null): string | undefined {
  if (!path) return undefined;
  try {
    const content = readFileSync(path, 'utf8');
    return normalizePem(content);
  } catch {
    return undefined;
  }
}

function resolvePublicKey(): string | undefined {
  // 1) Plain text env var
  const plain = normalizePem(process.env.TESLA_PUBLIC_KEY);
  if (plain) return plain;

  // 2) Base64-encoded env var
  const b64 = tryDecodeBase64(process.env.TESLA_PUBLIC_KEY_BASE64);
  if (b64) return b64;

  // 3) File path env var
  const fromFile = tryReadFile(process.env.TESLA_PUBLIC_KEY_FILE);
  if (fromFile) return fromFile;

  return undefined;
}

export async function GET() {
  const publicKey = resolvePublicKey();

  if (!publicKey) {
    return new NextResponse('Public key not found', { status: 404 });
  }

  return new NextResponse(publicKey, {
    headers: {
      'Content-Type': 'application/x-pem-file',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
}
