import md5Raw from "js-md5";

const encoder = new TextEncoder();

function md5Hex(content: string): string {
  return bytesToHex(md5Bytes(encoder.encode(content)));
}

function md5Bytes(input: Uint8Array): Uint8Array {
  const md5 = md5Raw as unknown as {
    array: (data: Uint8Array | string) => number[];
  };
  const bytes = md5.array(input);
  return Uint8Array.from(bytes);
}

function bytesToHex(bytes: Uint8Array): string {
  let result = "";
  for (const b of bytes) {
    result += b.toString(16).padStart(2, "0");
  }
  return result;
}

function concatBytes(a: Uint8Array, b: Uint8Array): Uint8Array {
  const out = new Uint8Array(a.length + b.length);
  out.set(a, 0);
  out.set(b, a.length);
  return out;
}

const itoa64 =
  "./0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";

export function phpbbHash(password: string): string {
  const count = 6;
  const randomBytes = new Uint8Array(count);
  globalThis.crypto.getRandomValues(randomBytes);
  const random = bytesToHex(randomBytes);
  return hashCryptPrivate(password, hashGensaltPrivate(random));
}

function hashCryptPrivate(password: string, setting: string): string {
  let output = "*";

  if (setting.substring(0, 3) !== "$H$" && setting.substring(0, 3) !== "$P$") {
    return output;
  }

  const countLog2 = itoa64.indexOf(setting[3]);
  if (countLog2 < 7 || countLog2 > 30) {
    return output;
  }

  let count = 1 << countLog2;
  const salt = setting.substring(4, 12);
  if (salt.length !== 8) {
    return output;
  }

  let hash = md5Bytes(concatBytes(encoder.encode(salt), encoder.encode(password)));

  do {
    hash = md5Bytes(concatBytes(hash, encoder.encode(password)));
  } while (--count);

  output = setting.substring(0, 12) + hashEncode64(hash, 16);

  return output;
}

function hashEncode64(input: Uint8Array | string, count: number): string {
  let output = "";
  let i = 0;

  const getByte = (idx: number): number => {
    const val = input[idx];
    return typeof val === "string" ? val.charCodeAt(0) : val;
  };

  do {
    let value = getByte(i++);
    output += itoa64[value & 0x3f];

    if (i < count) {
      value |= getByte(i) << 8;
    }

    output += itoa64[(value >> 6) & 0x3f];

    if (i++ >= count) {
      break;
    }

    if (i < count) {
      value |= getByte(i) << 16;
    }

    output += itoa64[(value >> 12) & 0x3f];

    if (i++ >= count) {
      break;
    }

    output += itoa64[(value >> 18) & 0x3f];
  } while (i < count);

  return output;
}

function hashGensaltPrivate(
  input: string,
  iterationCountLog2: number = 6,
): string {
  let output = "$H$";
  output += itoa64[Math.min(iterationCountLog2 + 5, 30)];
  output += hashEncode64(input, 6);

  return output;
}

export function phpbbCheckHash(password: string, hash: string): boolean {
  if (hash.length === 34) {
    return hashCryptPrivate(password, hash) === hash;
  }

  return md5Hex(password) === hash;
}
