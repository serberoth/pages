
import * as cards from './draftpak_cards';
import DraftGame from "./draftpak_table";

class CardDescriptor {
    constructor(/*type,*/ name, image) {
        // this.type = type;
        this.name = name;
        this.image = image;
    }
};

const CARD_FACES = new Map([
    [cards.CARD_PAIR_SCORING,       new CardDescriptor('5/2', ''), ],
    [cards.CARD_TRIPLE_SCORING,     new CardDescriptor('A/3', ''), ],
    [cards.CARD_ESCALATING_PTS,     new CardDescriptor('>>>', ''), ],
    [cards.CARD_SMALL_TICKS,        new CardDescriptor('__*', ''), ],
    [cards.CARD_MID_TICKS,          new CardDescriptor('_**', ''), ],
    [cards.CARD_HIGH_TICKS,         new CardDescriptor('***', ''), ],

    [cards.CARD_SMALL_SCORING,      new CardDescriptor(' +1', ''), ],
    [cards.CARD_MID_SCORING,        new CardDescriptor(' +2', ''), ],
    [cards.CARD_HIGH_SCORING,       new CardDescriptor(' +3', ''), ],
    [cards.CARD_POINT_MULTIPLIER,   new CardDescriptor(' x3', ''), ],
    [cards.CARD_ACCUMULATING,       new CardDescriptor(' + ', ''), ],
    [cards.CARD_SWAP_FOR_TWO,       new CardDescriptor('<->', ''), ],
]);
const CARD_BACKS = [ 'cards/v2/bkgs/wave.png', 'cards/v2/bkgs/fuji.png' ];


function new_game() {
    
}

$(function() {
    new_game();
});

$('#replay').on('click', function(event) {
    $('#playarea').empty();
    $('#victory').hide();
    new_game();
});
