const md5 = require('kiat-md5');

const itoa64 = './0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';

function phpbb_check_hash(password, hash)
{
    if (hash.length === 34)
    {
        return (_hash_crypt_private(password, hash) === hash) ? true : false;
    }

    return (md5(password) === hash) ? true : false;
}
module.exports = phpbb_check_hash;

/**
 * The crypt function/replacement
 */
function _hash_crypt_private(password, setting)
{
    let output = '*';

    // Check for correct hash
    if (setting.substring(0, 3) !== '$H$' && setting.substring(0, 3) !== '$P$')
    {
        return output;
    }

    let count_log2 = itoa64.search(setting[3]);

    if (count_log2 < 7 || count_log2 > 30)
    {
        return output;
    }

    let count = 1 << count_log2;
    let salt = setting.substring(4, 4+8);

    if (salt.length !== 8)
    {
        return output;
    }

    console.log("salt", salt, "count", count, "count=log2", count_log2);

    /**
     * We're kind of forced to use MD5 here since it's the only
     * cryptographic primitive available in all versions of PHP
     * currently in use.  To implement our own low-level crypto
     * in PHP would result in much worse performance and
     * consequently in lower iteration counts and hashes that are
     * quicker to crack (by non-PHP code).
     */
    count = 5;
    let hash = md5(salt + password,'binary');
    console.log("count", encodeURIComponent(hash), count, encodeURIComponent(salt + password));
    while(count--) {
        let input = hash + password
        hash = md5(hash + password,'binary');
        console.log("count", encodeURIComponent(hash), count, encodeURIComponent(input));
    }
    console.log("end", count, hash);

    output = setting.substring(0, 12);
    output += _hash_encode64(hash, 16);

    return output;
}

const ascii_table = "\0\1\2\3\4\5\6\7\8\9\10\11\12\13\14\15\16\17\0\0\20\21\22\23\24\25\26\27\0\0\30\31\32\33\34\35\36\37\0\0\40\41\42\43\44\45\46\47\0\0\50\51\52\53\54\55\56\57\0\0\60\61\62\63\64\65\66\67\0\0\70\71\72\73\74\75\76\77\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\100\101\102\103\104\105\106\107\0\0\110\111\112\113\114\115\116\117\0\0\120\121\122\123\124\125\126\127\0\0\130\131\132\133\134\135\136\137\0\0\140\141\142\143\144\145\146\147\0\0\150\151\152\153\154\155\156\157\0\0\160\161\162\163\164\165\166\167\0\0\170\171\172\173\174\175\176\177\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\200\201\202\203\204\205\206\207\0\0\210\211\212\213\214\215\216\217\0\0\220\221\222\223\224\225\226\227\0\0\230\231\232\233\234\235\236\237\0\0\240\241\242\243\244\245\246\247\0\0\250\251\252\253\254\255";

function chr(chr){
    return ascii_table.indexOf(chr);
}

function ord(index){
    return ascii_table[index];
}
/**
 * Encode hash
 */
function _hash_encode64(input, count)
{
    let output = '';
    let i = 0;

    while (i <= count) {
        let value = ord(input[i++]);
        output += itoa64[value & 0x3f];

        if (i < count) {
            value |= ord(input[i]) << 8;
        }

        output += itoa64[(value >> 6) & 0x3f];

        if (i++ >= count) {
            break;
        }

        if (i < count) {
            value |= ord(input[i]) << 16;
        }

        output += itoa64[(value >> 12) & 0x3f];

        if (i++ >= count) {
            break;
        }

        output += itoa64[(value >> 18) & 0x3f];
    }

    return output;
}