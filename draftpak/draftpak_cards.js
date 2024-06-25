
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

export function card_to_string(card) {
    switch (card) {
    case CARD_TRIPLE_SCORING:       return "A/3";
    case CARD_PAIR_SCORING:         return "5/2";
    case CARD_ESCALATING_PTS:       return ">>>";
    case CARD_SMALL_SCORING:        return " +1";
    case CARD_MID_SCORING:          return " +2";
    case CARD_HIGH_SCORING:         return " +3";
    case CARD_POINT_MULTIPLIER:     return " x3";
    case CARD_SMALL_TICKS:          return "__*";
    case CARD_MID_TICKS:            return "_**";
    case CARD_HIGH_TICKS:           return "***";
    case CARD_ACCUMULATING:         return "+++";
    case CARD_SWAP_FOR_TWO:         return "<->";
    }
    return "???";
}

export function cards_to_string(cards) {
    let str = "[ ";
    for (let card in cards) {
        str += card_type_to_string(card) + ", ";
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
        for (let pile in piles) {
            pile.push(deck.shift());
        }
    }
}
