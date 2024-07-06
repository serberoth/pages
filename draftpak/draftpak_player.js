import "./draftpak_cards.js";
import * as cards from "./draftpak_cards.js";



export class PlayerScore {
    constructor() {
        this.points_last_round = 0;
        this.point_total = 0;
        this.accumulated_last_round = 0;
        this.accumulated_total = 0;
    }
};

export class Player {
    constructor(table, ai, name) {
        this.name = name;
        this.table = table;
        this.ai = ai;
        this.hand = [];
        this.drafted = [];
        this.score = new PlayerScore();
    }

    has_selected() {
        return this.ai.has_selected(this);
    }

    draft() {
        this.ai.draft(this);
    }

    pick(choice) {
        // console.log(`Player ${this.name} Hand: ${cards.cards_to_string(this.hand)}`);
        const hand = choice['hand'];
        // Add the cards to the drafted pile in the order they were selected
        for (let i = 0; i < hand.length; ++i) {
            this.drafted.push(this.hand[hand[i]]);
        }
        // Sort the indicies from large to small to remove them from the hand
        hand.sort((a, b) => b - a);
        for (let i = 0; i < hand.length; ++i) {
            this.hand.splice(hand[i], 1);
        }
        const swap = choice['swap'];
        if (!Object.is(swap, NaN)) {
            let card = this.drafted.splice(swap, 1);
            this.hand.push(...card);
        }
        // console.log(`Player ${this.name} has drafted ${cards.card_to_string(card)}`);
        // console.log(`Player Hand: ${cards.cards_to_string(this.hand)}`);
        // console.log(`Drafted Set: ${cards.cards_to_string(this.drafted)}`);
    }

    clear_cards() {
        this.hand = [ ];
        this.drafted = [ ];
    }

    reset(table) {
        this.table = table;
        this.clear_cards();
        this.score = new PlayerScore();
    }

};

export class IDraftingAI {
    has_selected(player) { return false; }
    draft(player) { }
};

export class HumanAI extends IDraftingAI {
    constructor(selection_callback) {
        super();
        this.selection_callback = selection_callback;
    }

    has_selected(player) {
        let choice = this.selection_callback(player, true);
        if ((choice === null) || (choice === undefined)) {
            return false;
        }
        const hand = choice['hand'];
        const swap = choice['swap'];
        if (hand === null || hand === undefined || swap === null || swap === undefined) {
            return false;
        }
        if (Object.is(swap, NaN) && hand.length !== 1) {
            return false;
        }
        if (!Object.is(swap, NaN) && hand.length !== 2) {
            return false;
        }
        if (!Object.is(swap, NaN) && ((swap < 0) || (swap >= player.drafted.length))) {
            return false;
        }
        for (let i = 0; i < hand.length; ++i) {
            if ((choice[i] < 0) || (choice[i] >= player.hand.length)) {
                return false;
            }
        }
        return true;
    }

    draft(player) {
        // TODO: This does not handle the SWAP card directly
        let choice = this.selection_callback(player, false);
        player.pick(choice);
    }    

};

export class ComputerAI extends IDraftingAI {
    constructor(selector_callback) {
        super();
        this.selector_callback = selector_callback;
    }

    has_selected(player) {
        return true;
    }

    draft(player) {
        let choice = this.selector_callback(player);
        player.pick(choice);
    }

    static #NAMES = [
        "Anjali",
        "Chiara",
        "Francisco",
        "Géraud",
        "Hanako",
        "Kaitlyn",
        "Libi",
        "Omari",
        "Regulus",
        "Sashi",
        "Tracy",
        "Xiuying",
    ];

    static random_name(random) {
        let index = random.ranged(ComputerAI.#NAMES.length);
        return ComputerAI.#NAMES[index];
    }

};

export class RandomChoiceAI extends ComputerAI {
    constructor() {
        super(RandomChoiceAI.choose);
    }

    static choose(player) {
        // Randomly choose a card from the hand with no particular strategy; this is a bad plan...
        return { 'hand': [ player.table.random.ranged(player.hand.length) ], 'swap': NaN };
    }

};

export class PrioritizedChoiceAI extends ComputerAI {
    constructor() {
        super(PrioritizedChoiceAI.choose);
    }

    static choose(player) {
        const priority = [
            cards.CARD_PAIR_SCORING,
            cards.CARD_TRIPLE_SCORING,
            cards.CARD_HIGH_SCORING,
            cards.CARD_ESCALATING_PTS,
            cards.CARD_MID_SCORING,

            cards.CARD_POINT_MULTIPLIER,
            cards.CARD_HIGH_TICKS,
            cards.CARD_MID_TICKS,
            cards.CARD_ACCUMULATING,
            cards.CARD_SMALL_SCORING,
            cards.CARD_SMALL_TICKS,
            cards.CARD_SWAP_FOR_TWO,
        ];

        for (let card in priority) {
            let choice = PrioritizedChoiceAI.first_index_of(player.hand, card);
            if (choice != -1) {
                return { 'hand': [ choice ], 'swap': NaN };
            }
        }
        // If somehow our selectors above did not choose a card return a random choice.
        return RandomChoiceAI.choose(player);
    }

    static first_index_of(set, item) {
        for (var i = 0; i < set.length; ++i) {
            if (set[i] != null && set[i] === item) { return i; }
        }
        return -1;
    }

};

export class RankedChoiceAI extends ComputerAI {
    constructor() {
        super(RankedChoiceAI.choose);
    }

    static choose(player) {
        // TODO: Fill this in with a ranked choice based on the hand and what the player has already drafted
        // Ideally this can look at what other players have drafted as well to make choices.
        return RandomChoiceAI.RandomChoice(player, table);
    }

};
