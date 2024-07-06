import * as cards from "./draftpak_cards.js";



class DraftScoreValues {
    constructor() {
        this.escalating_score   = [ 0, 1, 3, 6, 10, 15 ];
        this.triple_scoring     = 10;
        this.pair_scoring       = 5;
        this.small_scoring      = 1;
        this.mid_scoring        = 2;
        this.high_scoring       = 3;
        this.point_multiplier   = 3;
        this.small_ticks        = 1;
        this.mid_ticks          = 2;
        this.large_ticks        = 3;
        this.ticks_points_most  = 6;
        this.ticks_points_next  = 3;
        this.accumulated_most   = 6;
        this.accumulated_least  = -6;
    }
}

export class DraftScorer {

    constructor(table, point_values = new DraftScoreValues()) {
        this.point_values = point_values;
        this.table = table;
    }

    winner() {
        const highest_values = (array) => {
            if (array.length === 0) { return []; }
            let max = array[0].c;
            return [...array].filter(p => p.c === max).map(p => p.p);
        };

        let point_totals = [...this.table.players].map(p => ({ p: p, c: p.score.point_total })).sort((a, b) => (b.c - a.c));
        let highest_points = highest_values(point_totals);
        if (highest_points.length === 1) { return highest_points[0]; }
        let accum_totals = [...this.table.players].map(p => ({ p: p, c: p.score.accumulated_total })).sort((a, b) => (b.c - a.c));
        let highest_accumulated = highest_values(accum_totals);
        if (highest_accumulated.length === 1) { return highest_accumulated[0]; }
        return null;
    }

    score_round(is_last_round) {
        for (let i = 0; i < this.table.players.length; ++i) {
            const player = this.table.players[i];
            let points_this_round = 0;

            player.score.points_last_round = 0;

            console.log(`Scoring ${player.name} :: ${cards.cards_to_string(player.drafted)}`);

            // Calculate points for cards that score when you have a pair of them
            points_this_round += DraftScorer.#num_pairs(player.drafted) * this.point_values.pair_scoring;
            console.log(`With Scoring Pairs: ${points_this_round}`);
            // Calculate points for cards that score when you have a three of them
            points_this_round += DraftScorer.#num_triples(player.drafted) * this.point_values.triple_scoring;
            console.log(`With Scoring Triples: ${points_this_round}`);
            // Calculate points for cards that have an escalating point scale
            let escalating_index = Math.min(DraftScorer.#num_escalating(player.drafted), (this.point_values.escalating_score.length - 1));
            points_this_round += this.point_values.escalating_score[escalating_index];
            console.log(`With Escalating: ${points_this_round}`);
            // Calculate points for cards that directly score points
            points_this_round += this.#num_scoring(player.drafted);
            console.log(`With Scoring Cards: ${points_this_round}`);

            // Add the count of the accumulated cards into the players total
            player.score.accumulated_last_round = DraftScorer.#num_accumulating(player.drafted);
            console.log(`Accumulated Cards: ${player.score.accumulated_last_round}`);
            player.score.accumulated_total += player.score.accumulated_last_round;

            player.score.points_last_round = points_this_round;
            player.score.point_total += player.score.points_last_round;
        }

        const highest_values = (array) => {
            if (array.length === 0) { return []; }
            let max = array[0].c;
            return [...array].filter(p => p.c === max).map(p => p.p);
        };

        // Calculate point values for the tick count cards
        let players_with_ticks = [...this.table.players].map(p => ({ p: p, c: this.#num_ticks(p.drafted) }))
            .filter(p => p.c > 0)
            .sort((a, b) => (b.c - a.c));
        if (players_with_ticks.length > 0) {
            let max = players_with_ticks[0].c;
            let highest_ticks = highest_values(players_with_ticks);
            for (let i = 0; i < highest_ticks.length; ++i) {
                highest_ticks[i].score.points_last_round += ((this.point_values.ticks_points_most / highest_ticks.length) | 0);
                console.log(`Highest Ticks: ${highest_ticks[i].name}: ${highest_ticks[i].score.points_last_round}`);
                highest_ticks[i].score.point_total += ((this.point_values.ticks_points_most / highest_ticks.length) | 0);
            }
            if (highest_ticks.length === 1) {
                let second_highest_ticks = highest_values([...players_with_ticks].filter(p => max > p.c));
                if (second_highest_ticks.length > 0) {
                    for (let i = 0; i < second_highest_ticks.length; ++i) {
                        second_highest_ticks[i].score.points_last_round += ((this.point_values.ticks_points_next / second_highest_ticks.length) | 0);
                        console.log(`Second Highest Ticks: ${second_highest_ticks[i].name}: ${second_highest_ticks[i].score.points_last_round}`);
                        second_highest_ticks[i].score.point_total += ((this.point_values.ticks_points_next / second_highest_ticks.length) | 0);
                    }
                }
            }
        }

        // Caucluate point values for the accumulated cards in the last round
        if (is_last_round) {
            let players_with_accum = [...this.table.players].map(p => ({ p: p, c: p.score.accumulated_total })).sort((a, b) => (b.c - a.c));
            let highest_accum = highest_values(players_with_accum);
            if (highest_accum.length < this.table.players.length) {
                for (let i = 0; i < highest_accum.length; ++i) {
                    highest_accum[i].score.points_last_round += this.point_values.accumulated_most / highest_accum.length;
                    console.log(`Highest Accum: ${highest_accum[i].name}: ${highest_accum[i].score.points_last_round}`);
                    highest_accum[i].score.point_total += this.point_values.accumulated_most / highest_accum.length;
                }
            }
            if (this.table.players.length > 2) {
                let lowest_accum = highest_values(players_with_accum.toReversed());
                for (let i = 0; i < lowest_accum.length; ++i) {
                    lowest_accum[i].score.points_last_round += this.point_values.accumulated_least / lowest_accum.length;
                    console.log(`Least Accum: ${lowest_accum[i].name}: ${lowest_accum[i].score.points_last_round}`);
                    lowest_accum[i].score.point_total += this.point_values.accumulated_least / lowest_accum.length;
                }
            }
        }
    }

    #num_scoring(drafted) {
        let multiplier = 0;
        let sum = 0;
        for (let i = 0; i < drafted.length; ++i) {
            let score = 0;
            switch (drafted[i]) {
            case cards.CARD_POINT_MULTIPLIER: ++multiplier; continue;
            case cards.CARD_SMALL_SCORING:    score = this.point_values.small_scoring; break;
            case cards.CARD_MID_SCORING:      score = this.point_values.mid_scoring; break;
            case cards.CARD_HIGH_SCORING:     score = this.point_values.high_scoring; break;
            default: break;
            }
            if ((score > 0) && (multiplier > 0)) { score *= this.point_values.point_multiplier; --multiplier; }
            sum += score;
        }
        return sum;
    }

    #num_ticks(drafted) {
        return drafted.reduce((count, card) => {
            switch (card) {
            case cards.CARD_SMALL_TICKS:      return count + this.point_values.small_ticks;
            case cards.CARD_MID_TICKS:        return count + this.point_values.mid_ticks;
            case cards.CARD_HIGH_TICKS:       return count + this.point_values.large_ticks;
            default: break;
            }
            return count;
        }, 0);
    }

    static #num_pairs(drafted) { return (drafted.reduce((count, card) => { return count + (card === cards.CARD_PAIR_SCORING) }, 0) / 2) | 0; }

    static #num_triples(drafted) { return (drafted.reduce((count, card) => { return count + (card === cards.CARD_TRIPLE_SCORING) }, 0) / 3) | 0; }

    static #num_escalating(drafted) { return drafted.reduce((count, card) => { return count + (card === cards.CARD_ESCALATING_PTS); }, 0); }

    static #num_accumulating(drafted) { return drafted.reduce((count, card) => { return count + (card === cards.CARD_ACCUMULATING); }, 0); }

};
