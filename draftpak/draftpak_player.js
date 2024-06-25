
import "./draftpak_cards";

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

    draft() {
        this.ai.draft(this);
    }

    pick(choice) {
        let card = this.hand.splice(choice, choice);
        this.drafted.push(card);
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
    draft(player) { }
};

export class HumanAI extends IDraftingAI {
    constructor(selection_callback) {
        this.selection_callback = selection_callback;
    }

    draft(player) {
        // TODO: This does not handle the SWAP card directly
        let choice = this.selection_callback(player);
        player.pick(choice);
    }

};

export class ComputerAI extends IDraftingAI {
    constructor(selector_callback) {
        this.selector_callback = selector_callback;
    }

    draft(player) {
        let choice = this.selector_callback(player);
        player.pick(choice);
    }

    NAMES = [
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
        return NAMES[random.ranged(NAMES.length)];
    }

};

export class RandomChoiceAI extends ComputerAI {
    constructor() {
        super(RandomChoiceAI.choose);
    }

    static choose(player) {
        // Randomly choose a card from the hand with no particular strategy; this is a bad plan...
        return player.table.random.ranged(player.hand.length);        
    }

};

export class PrioritizedChoiceAI extends ComputerAI {
    constructor() {
        super(PrioritizedChoiceAI.choose);
    }

    static choose(player) {
        const priority = [
            CARD_TWO_FOR_FIVE_PTS,
            CARD_THREE_FOR_TEN_PTS,
            CARD_THREE_POINTS,
            CARD_ESCALATING_PTS,
            CARD_TWO_POINTS,

            CARD_MULTIPLIER_X3,
            CARD_THREE_TICKS,
            CARD_TWO_TICKS,
            CARD_ACCUMULATED,
            CARD_ONE_TICK,
            CARD_ONE_POINT,
            CARD_SWAP_FOR_TWO,
        ];

        for (let card in priority) {
            let choice = PrioritizedChoiceAI.first_index_of(player.hand, card);
            if (choice != -1) {
                return choice;
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
