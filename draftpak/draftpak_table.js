import { Xoshiro128 } from "./rando.js";
import * as cards from "./draftpak_cards.js";
import "./draftpak_player.js";
import { DraftScorer } from "./draftpak_scorer.js";
import { ComputerAI, HumanAI, Player, PrioritizedChoiceAI, RandomChoiceAI } from "./draftpak_player.js";

import default_deck from "./default_deck.js";



// Various draft passing methods (some of these options are only going to function properly with 4 players at the table)
const PASS_LLL      = 0x00  // ( A <- B <- C <- D )     ( A <- B <- C <- D )        ( A <- B <- C <- D )
const PASS_RRR      = 0x01  // ( A -> B -> C -> D )     ( A -> B -> C -> D )        ( A -> B -> C -> D )
const PASS_LRL      = 0x02  // ( A <- B <- C <- D )     ( A -> B -> C -> D )        ( A <- B <- C <- D )
const PASS_RLR      = 0x03  // ( A -> B -> C -> D )     ( A <- B <- C <- D )        ( A -> B -> C -> D )
const PASS_Z_LLL    = 0x04  // ( A -> C -> D -> B )     ( A -> C -> D -> B )        ( A -> C -> D -> B )
const PASS_Z_RRR    = 0x05  // ( A -> B -> D -> C )     ( A -> B -> D -> C )        ( A -> B -> D -> C )



export class DraftDeck {
    constructor(definition) {
        this.definition = definition;
    }

    num_to_deal(num_players) {
        return this.definition['hand_count'][num_players];
    }

    card_set() {
        let card_set = [ ];
        this.definition['deck'].forEach(item => card_set.push(...new Array(item['count']).fill(cards.string_to_card(item['card']))));
        return card_set;
    }

    static default_deck() {
        return new DraftDeck(default_deck);
    }

};

class DraftTable {
    constructor(seed, players, num_rounds, num_to_deal, alternate_passing) {
        this.players = players;
        this.deck = [ ];
        this.discard_pile = [ ];
        this.alternate_passing = alternate_passing;
        this.num_to_deal = num_to_deal;
        this.num_rounds = num_rounds;
        this.current_round = 0;
        this.scorer = new DraftScorer(this);
        this.random = new Xoshiro128(seed);
    }

    game_over() { return this.current_round === this.num_rounds; }

    start_game(set) {
        this.deck = [...set];
        cards.shuffle(this.deck, this.random);
        // reset the players
        for (let i = 0; i < this.players.length; ++i) {
            this.players[i].reset(this);
        }
        this.current_round = 0;
    }

    deal_round() {
        cards.round_robin_deal(this.deck, this.num_to_deal, this.players.map(p => p.hand));
    }

    score_round() {
        this.current_round += 1;
        this.scorer.score_round(this.current_round === this.num_rounds);
    }

    pass() {
        if (this.alternate_passing) {
            if ((this.current_round % 2) === 0) {
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

    #pass_accorss() {
        // A   B
        //   X
        // C   D
        // 0, 1, 2, 3
        if (this.players.length === 4) {
            let temp0 = this.players[0].hand;
            let temp1 = this.players[1].hand;
            this.players[0].hand = this.players[3].hand;
            this.players[1].hand = this.players[2].hand;
            this.players[3].hand = temp0;
            this.players[2].hand = temp1;
        }
    }

    discard_all() {
        for (let i = 0; i < this.players.length; ++i) {
            const player = this.players[i];
            // Discard the drafted cards
            this.discard_pile.push(...player.drafted);
            // Discard any remaining cards in hand (of which there should be none)
            this.discard_pile.push(...player.hand);
            player.clear_cards();
        }
    }

};

export class DraftGame {

    constructor(show_round_callback, show_draft_callback, show_passing_callback, show_winner_callback, ui_selection_callback) {
        this.show_round_callback = show_round_callback;
        this.show_draft_callback = show_draft_callback;
        this.show_passing_callback = show_passing_callback;
        this.show_winner_callback = show_winner_callback;
        this.ui_selection_callback = ui_selection_callback;
    }

    num_players() { return this.table.players.length; }

    setup(seed, deck, num_players = 4, num_rounds = 3, alternate_passing = true) {
        let random = new Xoshiro128(seed).jump();
        let players = [ ];
        players.push(new Player(null, new HumanAI(this.ui_selection_callback), "You"));
        for (let i = 1; i < num_players; ++i) {
            let name = ComputerAI.random_name(random);
            let count = 0;
            while ((players.filter(p => p != null && p.name === name).length > 0) && (count < 10)) {
                name = ComputerAI.random_name(random);
                ++count;
            }
            let ai = ((i % 2) === 1) ? new PrioritizedChoiceAI() : new RandomChoiceAI();
            players.push(new Player(null, ai, name));
        }

        this.table = new DraftTable(seed, players, num_rounds, deck.num_to_deal(num_players), alternate_passing);
        for (let i = 0; i < players.length; ++i) {
            players[i].table = this.table;
        }


        this.table.start_game(deck.card_set());
    }

    start_round() {
        if (this.table.game_over()) {
            return false;
        }
        if (this.table.players.filter(p => p.hand.length > 0).length <= 0) {
            this.table.deal_round();
            this.show_round_callback(this.table);
            return true;
        }
        return false;
    }

    close_round() {
        if (this.table.players.filter(p => p.hand.length > 0).length === 0) {
            this.table.score_round();
            this.table.discard_all();
            return true;
        }
        return false;
    }

    draft_and_pass() {
        if (this.table.players.filter(p => p.has_selected()).length === this.table.players.length) {
            for (let i = 0; i < this.table.players.length; ++i) {
                this.table.players[i].draft();
            }
            this.show_draft_callback(this.table);
            this.table.pass();
            this.show_passing_callback(this.table);
            return true;
        }
        return false;
    }

    end() {
        this.show_winner_callback(this.table);
    }

};
