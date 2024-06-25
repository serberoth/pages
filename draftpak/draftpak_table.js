
import { Xoshiro256 } from "./rando";
import * as cards from "./draftpak_cards";
import "./draftpak_player";
import { DraftScorer } from "./draftpak_scorer";
import { ComputerAI, HumanAI, Player, PrioritizedChoiceAI, RandomChoiceAI } from "./draftpak_player";



class DraftTable {
    constructor(seed, num_players, num_rounds, num_to_deal, alternate_passing) {
        this.players = [ null ] * num_players;
        this.deck = [ ];
        this.discard_pile = [ ];
        this.alternate_passing = alternate_passing;
        this.num_to_deal = num_to_deal;
        this.num_rounds = num_rounds;
        this.current_round = 0;
        this.scorer = new DraftScorer(this);
        this.random = new Xoshiro256(seed);
    }

    game_over() { return this.current_round == this.num_rounds; }

    start_game(cards) {
        deck = [...cards];
        cards.shuffle(deck, this.random);
        for (let player in this.players) {
            player.reset(this);
        }
        // reset players
        current_round = 0;
    }

    deal_round() {
        round_robin_deal(deck, num_to_deal, players)
    }

    score_round() {
        this.current_round += 1
        this.scorer.score_round(this.current_round == this.num_rounds)
    }

    pass() {
        if (alternate_passing) {
            if ((current_round % 2) == 0) {
                this.#pass_left();
            } else {
                this.#pass_right();
            }
        } else {
            this.#pass_left();
        }
    }

    #pass_left() {
        let temp = this.players[0].hand;
        this.players[0].hand = [ ];
        for (let i = 1; i < this.players.length; ++i) {
            this.players[i - 1].hand = this.players[i].hand;
            this.players[i].hand = [ ];
        }
        this.players[this.players.length - 1].hand = temp;
    }

    #pass_right() {
        let temp = this.players[this.players.length - 1].hand;
        this.players[this.players.length - 1].hand = [ ];
        for (let i = this.players.length - 2; i >= 0; --i) {
            this.players[i + 1].hand = this.players[i].hand;
            this.players[i].hand = [ ];
        }
        this.players[0].hand = temp;
    }

    discard_all() {
        for (let player in players) {
            // Discard the drafted cards
            this.discard_pile.push(...player.drafted);
            // Discard any remaining cards in hand (of which there should be none)
            this.discard_pile.push(...player.hand);
            player.clear_cards();
        }
    }

};

class DraftGame {
    static #CARDS_IN_DECK = new Map([
        [cards.CARD_PAIR_SCORING,       14,],
        [cards.CARD_TRIPLE_SCORING,     14,],
        [cards.CARD_ESCALATING_PTS,     14,],
        [cards.CARD_MID_TICKS,          12,],
        [cards.CARD_HIGH_TICKS,         8,],
        [cards.CARD_SMALL_TICKS,        6,],

        [cards.CARD_MID_SCORING,        10,],
        [cards.CARD_HIGH_SCORING,       5,],
        [cards.CARD_SMALL_SCORING,      5,],
        [cards.CARD_ACCUMULATING,       10,],
        [cards.CARD_POINT_MULTIPLIER,   6,],
        [cards.CARD_SWAP_FOR_TWO,       5,],
    ]);
    static #HAND_COUNT_PER_PLAYER = [ -1, -1, 10, 9, 8, 7 ];

    constructor(show_round_callback, show_draft_callback, show_winner_callback, ui_selection_callback) {
        this.show_round_callback = show_round_callback;        
        this.show_draft_callback = show_draft_callback;
        this.show_winner_callback = show_winner_callback;
        this.ui_selection_callback = ui_selection_callback;
    }

    play(seed, num_players = 4, num_rounds = 3, alternate_passing = true) {
        this.table = new DraftTable(seed, num_players, num_rounds, DraftGame.#HAND_COUNT_PER_PLAYER[num_players], alternate_passing);
        this.table.players[0] = new Player(this.table, new HumanAI(this.ui_selection_callback), "You");
        for (let i = 1; i < this.table.players.length; ++i) {
            let name = ComputerAI.random_name(this.table.random);
            while (this.table.players.filter(p => p != null && p.name === name)) {
                name = ComputerAI.random_name(this.table.random);
            }
            let ai = ((i % 2) == 1) ? new PrioritizedChoiceAI() : new RandomChoiceAI();
            this.table.players[i] = new Player(this.table, ai, name);
        }
        cards.shuffle(this.table.players, this.table.random);

        card_set = [ ];
        DraftGame.#CARDS_IN_DECK.forEach((k, v) => card_set.push(...([k]*v)));
        this.table.start_game(card_set);

        while (!this.table.game_over) {
            this.table.deal_round();
            this.show_round_callback(this.table);

            while (this.table.players.filter(p => p.hand.length > 0).length > 0) {
                for (let p in this.table.players) {
                    p.draft();
                }
                this.show_draft_callback(table);
                this.table.pass();
            }

            this.table.score_round();
            this.table.discard_all();
        }

        this.show_winner_callback(table);
    }

};
