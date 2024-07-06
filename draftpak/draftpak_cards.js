
export const CARD_TRIPLE_SCORING        = 0x00;
export const CARD_PAIR_SCORING          = 0x01;
export const CARD_ESCALATING_PTS        = 0x02;
export const CARD_SMALL_SCORING         = 0x03;
export const CARD_MID_SCORING           = 0x04;
export const CARD_HIGH_SCORING          = 0x05;
export const CARD_POINT_MULTIPLIER      = 0x06;
export const CARD_SMALL_TICKS           = 0x07;
export const CARD_MID_TICKS             = 0x08;
export const CARD_HIGH_TICKS            = 0x09;
export const CARD_ACCUMULATING          = 0x0a;
export const CARD_SWAP_FOR_TWO          = 0x0b;

// NOTE: The order of these strings is in the order of the constants above and the methods below rely on that fact.
const CARD_STRINGS = [
    "N/3", "N/2", ">>>",
    "+S+", "+M+", "+L+", "xMx",
    "_*_", "*_*", "***",
    "+++", "<->",
    "???",
];

export function string_to_card(string) {
    return CARD_STRINGS.findIndex((s) => s === string);
}

export function card_to_string(card) {
    if (card < 0 || card >= CARD_SMALL_SCORING.length) {
        return CARD_STRINGS[CARD_STRINGS.length - 1];
    }
    return CARD_STRINGS[card];
}

export function cards_to_string(cards) {
    let str = "[ ";
    for (let i = 0; i < cards.length; ++i) {
        str += card_to_string(cards[i]) + ", ";
    }
    str += " ]";
    return str;
}

export function shuffle(array, random) {
    for (var i = array.length; i > 1; --i) {
        let index = random.ranged(i);
        var t = array[i - 1];
        array[i - 1] = array[index];
        array[index] = t;
    }
}

export function round_robin_deal(deck, deal_count, piles) {
    for (let deal = 0; deal < deal_count; ++deal) {
        for (let i = 0; i < piles.length; ++i) {
            piles[i].push(deck.shift());
        }
    }
}
