import crypto from "crypto";
import {createHash} from 'node:crypto';

function md5(content, algo = 'md5') {
    const hashFunc = createHash(algo);   // you can also sha256, sha512 etc
    hashFunc.update(content);
    return hashFunc.digest('hex');       // will return hash, formatted to HEX
}

const itoa64 = './0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';

export function phpbb_hash(password) {
    let count = 6;
    let random = crypto.randomBytes(count).toString('hex');
    return _hash_crypt_private(password, _hash_gensalt_private(random));
}

function _hash_crypt_private(password, setting) {
    let output = '*';

    if (setting.substring(0, 3) !== '$H$' && setting.substring(0, 3) !== '$P$') {
        return output;
    }

    let count_log2 = itoa64.indexOf(setting[3]);

    if (count_log2 < 7 || count_log2 > 30) {
        return output;
    }

    let count = 1 << count_log2;
    let salt = setting.substring(4, 12);

    if (salt.length !== 8) {
        return output;
    }

    let hash = crypto.createHash('md5').update(salt + password).digest();

    do {
        hash = crypto.createHash('md5').update(Buffer.concat([hash, Buffer.from(password)])).digest();
    } while (--count);

    output = setting.substring(0, 12) + _hash_encode64(hash, 16);

    return output;
}

function _hash_encode64(input, count) {
    let output = '';
    let i = 0;

    do {
        let value = input[i++];
        output += itoa64[value & 0x3f];

        if (i < count) {
            value |= input[i] << 8;
        }

        output += itoa64[(value >> 6) & 0x3f];

        if (i++ >= count) {
            break;
        }

        if (i < count) {
            value |= input[i] << 16;
        }

        output += itoa64[(value >> 12) & 0x3f];

        if (i++ >= count) {
            break;
        }

        output += itoa64[(value >> 18) & 0x3f];
    } while (i < count);

    return output;
}

function _hash_gensalt_private(input, iteration_count_log2 = 6) {
    let output = "$H$";
    output += itoa64[Math.min(iteration_count_log2 + 5, 30)];
    output += _hash_encode64(input, 6);

    return output;
}

export function phpbb_check_hash(password, hash) {
    if (hash.length === 34) {
        return (_hash_crypt_private(password, hash) === hash);
    }

    return (md5(password) === hash);
}
