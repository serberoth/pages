
class SplitMix64 {
    constructor(seed) {
        this.seed = BigInt(seed);
    }

    next() {
        let z = (this.seed += 0x9e37_79b9_7f4a_7c15n);
        z = (z ^ (z >> 30n)) * 0xbf58_476d_1ce4_e5b9n;
        z = (z ^ (z >> 27n)) * 0x94d0_49bb_1331_11ebn;
        return z ^ (z >> 31n);
    }

};

export class Xoshiro128 {
    constructor(seed) {
        const splitmix = new SplitMix64(seed);
        let tmp1 = splitmix.next();
        let tmp2 = splitmix.next();

        this.s = [ Number(tmp1 & 0xffff_ffffn), Number((tmp1 >> 32n) & 0xffff_ffffn), Number(tmp2 & 0xffff_ffffn), Number((tmp2 >> 32n) & 0xffff_ffffn) ];
    }

    #rotl(x, k) { return (x << k) | (x >>> (32 - k)); }
    
    next() {
        let result = this.#rotl(this.s[1] * 5, 7) * 9;
        let t = this.s[1] << 9;
    
        this.s[2] ^= this.s[0];
        this.s[3] ^= this.s[1];
        this.s[1] ^= this.s[2];
        this.s[0] ^= this.s[3];
    
        this.s[2] ^= t;
    
        this.s[3] = this.#rotl(this.s[3], 11);
    
        return result >>> 0;
    }
    
    real() {
        value = this.next();
        return (value >>> 11) * 1.1102230246251565e-16; // 0x1.0p-53;
    }
    
    bool() { return this.real() < 0.5; }

    ranged(min, max) {
        // If only a min parameter is supplied use it as the max instead and set the min to zero (0).
        // We do this/allow this because there is no function overloading in javascript.
        if ((max === null) || (max === undefined)) {
            max = min;
            min = 0;
        }
        // Ensure max > min
        if (max < min) {
            let tmp = max;
            max = min;
            min = tmp;
        }

        let value = this.next();
        let range = max - min;
        return (value % range) + min;
    }
    
    static #STARTERS = [
        1_311_753_223_571_113, 1_311_870_831_664_661, 1_333_333_333_333_333, 1_379_131_521_253_133,
        1_391_098_979_592_919, 1_423_214_346_574_567, 1_483_892_396_791_177, 3_325_997_869_054_417,
        3_391_382_115_599_173, 4_429_978_144_299_823, 5_953_474_341_373_129, 5_999_999_999_899_999,
        6_171_054_912_832_631, 6_241_156_164_232_441, 6_435_616_333_396_997, 6_664_666_366_626_661,
    
        6_735_249_118_018_991, 6_988_699_669_998_001, 7_005_264_275_346_131, 7_190_597_297_273_099,
        7_523_725_352_733_257, 7_753_757_725_325_377, 7_897_466_719_774_591, 7_897_897_897_897_897,
        8_008_808_808_808_813, 8_343_656_381_177_203, 8_690_333_381_690_951, 8_778_405_442_862_239,
        9_007_199_254_740_881, 9_007_199_254_740_847, 9_293_787_934_331_213, 9_436_835_835_813_811,
    ];
    static #UNIQUE = 8_682_522_807_148_012;
    
    static generate_seed() {
        // Use a fixed seed when debugging the application
        // return 0xb45eba11_de4dc0de;

        // Choose a seed from the date time and some other bits from somewhere to seed the generator
        return (this.#UNIQUE ^ Date.now()) ^ this.#STARTERS[Date.now() % this.#STARTERS.length];
    }
    
    static #JUMP = [ 0x8764_000b, 0xf542_d2d3, 0x6fa0_35c3, 0x77f2_db5b ];

    jump() {
        let s0 = 0;
        let s1 = 0;
        let s2 = 0;
        let s3 = 0;
        for(let i = 0; i < Xoshiro128.#JUMP.length; ++i) {
            for(let b = 0; b < 32; ++b) {
                if (Xoshiro128.#JUMP[i] & (1 << b)) {
                    s0 ^= this.s[0];
                    s1 ^= this.s[1];
                    s2 ^= this.s[2];
                    s3 ^= this.s[3];
                }
                this.next();
            }
        }
            
        this.s[0] = s0;
        this.s[1] = s1;
        this.s[2] = s2;
        this.s[3] = s3;
        return this;
    }
    
}
