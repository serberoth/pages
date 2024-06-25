
class SplitMix64 {
    constructor(seed) {
        this.seed = seed;
    }

    next() {
        z = (seed += 0x9e3779b97f4a7c15);
        z = (z ^ (z >> 30)) * 0xbf58476d1ce4e5b9;
        z = (z ^ (z >> 27)) * 0x94d049bb133111eb;
        return z ^ (z >> 31);
    }

};

export class Xoshiro256 {
    constructor(seed) {
        const splitmix = new SplitMix64(seed);
    
        tmp1 = splitmix.next();
        tmp2 = splitmix.next();

        this.s = [ (tmp1 & 0xffff_ffff), ((tmp1 >> 32) & 0xffff_ffff), (tmp2 & 0xffff_ffff), ((tmp2 >> 32) & 0xffff_ffff) ]
    }

    #rotl(x, k) { return (x << k) | (x >> (64 - k)); }
    
    next() {
        result = this.#rotl(s[1] * 5, 7) * 9;
        t = s[1] << 17;
    
        s[2] ^= s[0];
        s[3] ^= s[1];
        s[1] ^= s[2];
        s[0] ^= s[3];

        s[2] ^= t;

        s[3] = this.#rotl(s[3], 45);
    
        return result;
    }
    
    real() {
        value = this.next();
        return (value >> 11) * 1.1102230246251565e-16; // 0x1.0p-53;
    }
    
    bool() { return this.real() < 0.5; }

    ranged(max) { return this.ranged(0, max); }
    ranged(min, max) {
        value = this.next();
        range = (max - min);
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
        return (this.#UNIQUE ^ Date.now()) ^ STARTERS[Date.now() % this.#STARTERS.length];
    }
    
};
