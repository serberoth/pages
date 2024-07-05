import * as cards from "./draftpak_cards.js";
import { DraftGame, DraftDeck } from "./draftpak_table.js";
import { Xoshiro128 } from "./rando.js";

let game = null;
let bkgSelection = 0;
const maxPlayers = 4;

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
    [cards.CARD_SMALL_TICKS,        new CardDescriptor('_*_', ''), ],
    [cards.CARD_MID_TICKS,          new CardDescriptor('*_*', ''), ],
    [cards.CARD_HIGH_TICKS,         new CardDescriptor('***', ''), ],

    [cards.CARD_SMALL_SCORING,      new CardDescriptor(' +1', ''), ],
    [cards.CARD_MID_SCORING,        new CardDescriptor(' +2', ''), ],
    [cards.CARD_HIGH_SCORING,       new CardDescriptor(' +3', ''), ],
    [cards.CARD_POINT_MULTIPLIER,   new CardDescriptor(' x3', ''), ],
    [cards.CARD_ACCUMULATING,       new CardDescriptor(' + ', ''), ],
    [cards.CARD_SWAP_FOR_TWO,       new CardDescriptor('<->', ''), ],
]);
const CARD_BACKS = [
    new CardDescriptor('Circuits', '/draftpak/cards/backs/circuit-board.svg'),
    new CardDescriptor('Gears', '/draftpak/cards/backs/floating-cogs.svg'),
    new CardDescriptor('Moroccan', '/draftpak/cards/backs/moroccan.svg'),
    new CardDescriptor('Aztec', '/draftpak/cards/backs/aztec.svg'),
    new CardDescriptor('Bees', '/draftpak/cards/backs/hexagons.svg'),
 ];



function add_card_back(parent) {
    const card = document.createElement('div');
    card.setAttribute('class', 'col-sm card');
    parent.appendChild(card);
    const image = document.createElement('div');
    image.setAttribute('class', `card-back bkg-${CARD_BACKS[bkgSelection].name.toLowerCase()}`);
    // image.setAttribute('src', CARD_BACKS[bkgSelection].image);
    // image.setAttribute('alt', CARD_BACKS[bkgSelection].name);
    card.appendChild(image);
}

function add_card_face(index, kind, parent) {
    /*
    <div class="card" >
        <img src="[CARD_FACE]" alt="CARD_FACE" class="card-face" >
        <div class="card-text" >[CARD TEXT]</div>
    </div>
     */
    const card = document.createElement('div');
    card.setAttribute('id', `card-${index}`);
    card.setAttribute('class', 'col-sm card card-face');
    card.dataset.index = `${index}`;
    parent.appendChild(card);
    const image = document.createElement('img');
    image.setAttribute('class', 'card-face');
    image.setAttribute('src', CARD_FACES.get(kind).image);
    image.setAttribute('alt', CARD_FACES.get(kind).name);
    card.appendChild(image);
    const text = document.createElement('div');
    text.setAttribute('class', 'card-text');
    text.innerText = CARD_FACES.get(kind).name;
    card.appendChild(text);
}

function add_spacer_ui(parent) {
    const spacer = document.createElement('div');
    spacer.setAttribute('class', 'col-sm');
    parent.appendChild(spacer);
}

function add_player_ui(game, index, player, parent) {
    const player_ui = document.createElement('div');
    player_ui.setAttribute('class', 'col-sm');
    player_ui.setAttribute('id', `player-${index}-ui`);
    parent.appendChild(player_ui);
    // Add the area for the players hand display
    const hand = document.createElement('div');
    hand.setAttribute('id', `player-${index}-hand`);
    hand.setAttribute('class', 'row');
    player_ui.appendChild(hand);
    // Add the area for the players drafted display
    const drafted = document.createElement('div');
    drafted.setAttribute('id', `player-${index}-drafted`);
    drafted.setAttribute('class', 'row');
    player_ui.appendChild(drafted);
    const name = document.createElement('div');
    name.setAttribute('id', `player-${index}-name`);
    name.innerText = `${player.name}`;
    player_ui.appendChild(name);
}

function add_2_player_ui(game, players, playarea) {
    const row0 = document.createElement('div');
    row0.setAttribute('class', 'row center');
    playarea.appendChild(row0);
    const row1 = document.createElement('div');
    row1.setAttribute('class', 'row center');
    playarea.appendChild(row1);

    // row0:       [ 2 ]
    // row1:       [ 0 ]
    add_spacer_ui(row0);
    add_player_ui(game, 1, players[1], row0);
    add_spacer_ui(row0);
    
    add_spacer_ui(row1);
    add_player_ui(game, 0, players[0], row1);
    add_spacer_ui(row1);

}

function add_3_player_ui(game, players, playarea) {
    const row0 = document.createElement('div');
    row0.setAttribute('class', 'row center');
    playarea.appendChild(row0);
    const row1 = document.createElement('div');
    row1.setAttribute('class', 'row center');
    playarea.appendChild(row1);

    // row0: [ 2 ]       [ 1 ]
    // row1:       [ 0 ]
    add_player_ui(game, 2, players[2], row0);
    add_spacer_ui(row0);
    add_player_ui(game, 1, players[1], row0);
        
    add_spacer_ui(row1);
    add_player_ui(game, 0, players[0], row1);
    add_spacer_ui(row1);

}

function add_4_player_ui(game, players, playarea) {
    const row0 = document.createElement('div');
    row0.setAttribute('class', 'row center');
    playarea.appendChild(row0);
    const row1 = document.createElement('div');
    row1.setAttribute('class', 'row center');
    playarea.appendChild(row1);
    const row2 = document.createElement('div');
    row2.setAttribute('class', 'row center');
    playarea.appendChild(row2);

    // row0:       [ 2 ]
    // row1: [ 3 ]       [ 1 ]
    // row2:       [ 0 ]
    add_spacer_ui(row0);
    add_player_ui(game, 2, players[2], row0);
    add_spacer_ui(row0);
    
    add_player_ui(game, 3, players[3], row1);
    add_spacer_ui(row1);
    add_player_ui(game, 1, players[1], row1);
        
    add_spacer_ui(row2);
    add_player_ui(game, 0, players[0], row2);
    add_spacer_ui(row2);
}

function add_playarea_ui() {
    const players = game.table.players;

    const scores = document.getElementById('players');
    scores.innerHTML = '';
    for (let i = 0; i < players.length; ++i) {
        // Create a parent element for the player
        const player = document.createElement('div');
        player.setAttribute('class', 'col-sm');
        scores.appendChild(player);
        // Add a label for the players name
        const label = document.createElement('span');
        label.innerText = `${players[i].name}:`;
        player.appendChild(label);
        // Add the players point total score
        const score = document.createElement('span');
        score.setAttribute('id', `player-${i}-score`);
        score.innerText = ` ${players[i].score.point_total}pts`;
        player.appendChild(score);
        // Add the players accumulated score
        const accum = document.createElement('span');
        accum.setAttribute('id', `player-${i}-accum`);
        accum.innerText = ` ${players[i].score.accumulated_total}acc`;
        player.appendChild(accum);
    }

    const playarea = document.getElementById('playarea');
    playarea.innerHTML = '';
    switch (players.length) {
    case 2:
        add_2_player_ui(game, players, playarea);
        break;
    case 3:
        add_3_player_ui(game, players, playarea);
        break;
    case 4:
        add_4_player_ui(game, players, playarea);
        break;
    default:
        const invalid = document.createElement('div');
        invalid.innerText = `Invalid number of players ${players.length}`;
        playarea.appendChild(invalid);
        break;
    }

    // A -> B -> C -> D
    //       XXXX (C)
    // XXXX (B)        XXXX (D)
    //       You- (A)
}

function onClickChangeCardBackBuilder(index, bkg) {
    return function(event) {
        const selected = document.querySelector(`.btn-card-back.btn-selected`);
        if (selected !== null && selected !== undefined) {
            selected.classList.remove('btn-selected');
        }
        const clicked = document.getElementById(`card-back-${index}`);
        clicked.classList.add('btn-selected');

        bkgSelection = index;

        const cardBacks = document.getElementsByClassName('card-back');
        for (let i = 0; i < cardBacks.length; ++i) {
            const classes = Array.from(cardBacks[i].classList);
            for (let j = 0; j < classes.length; ++j) {
                if (classes[j].startsWith('bkg-')) {
                    cardBacks[i].classList.remove(classes[j]);
                }
            }
            cardBacks[i].classList.add(`bkg-${bkg.name.toLowerCase()}`);
        }
    }
}

function confirmNewGame() {
    if (game !== null) {
        return confirm("Are you sure?  This will start a new game.");
    }
    return true;
}

function onClickChangePlayersBuilder(num_players) {
    return function(event) {
        if (confirmNewGame()) {
            new_game(num_players);
        }
    }
}
  

function add_controls_card_backs(control_panel) {
    const column = document.createElement('div');
    column.setAttribute('class', 'col-sm');
    control_panel.appendChild(column);
    const label = document.createElement('span');
    label.setAttribute('class', 'controls-label');
    label.innerText = 'Card Back: ';
    column.appendChild(label);
    for (let i = 0; i < CARD_BACKS.length; ++i) {
        const button = document.createElement('button');
        button.setAttribute('id', `card-back-${i}`);
        button.setAttribute('type', 'button');
        button.setAttribute('class', `btn btn-secondary btn-card-back bkg-${CARD_BACKS[i].name.toLowerCase()}`);
        if (i == bkgSelection) {
            button.classList.add('btn-selected');
        }
        button.onclick = onClickChangeCardBackBuilder(i, CARD_BACKS[i]);
        column.appendChild(button);
    }
}

function add_controls_num_players(control_panel) {
    const wrapper = document.createElement('div');
    wrapper.setAttribute('class', 'col-sm col-to-end');
    control_panel.appendChild(wrapper);
    const label = document.createElement('span');
    label.setAttribute('class', 'controls-label');
    label.innerText = 'Num Players: ';
    wrapper.appendChild(label);
    for (let i = 1; i < maxPlayers; ++i) {
        const button = document.createElement('button');
        button.setAttribute('type', 'button');
        button.setAttribute('class', 'btn btn-secondary btn-players');
        button.innerText = `${i + 1}`;
        button.onclick = onClickChangePlayersBuilder(i + 1);
        wrapper.appendChild(button);
    }
}
function add_controls(seed) {
    const control_panel = document.getElementById('control_panel');
    control_panel.innerHTML = '';

    const row0 = document.createElement('div');
    row0.setAttribute('class', 'row');
    control_panel.appendChild(row0);

    add_controls_card_backs(row0);
    add_controls_num_players(row0);

    const row1 = document.createElement('div');
    row1.setAttribute('class', 'row');
    control_panel.appendChild(row1);

    const seed_div = document.createElement('div');
    seed_div.setAttribute('class', 'col-sm');
    seed_div.innerText = `Seed: ${seed.toString(16)}`;
    row1.appendChild(seed_div);
}

// Called at the beginning of the round when the hands are delt and after they are passed
function show_round_callback(table) {
    console.log('Got Here!!!');
    for (let i = 0; i < table.players.length; ++i) {
        const player = table.players[i];
        // Update the players hand
        const playerHand = document.getElementById(`player-${i}-hand`);
        playerHand.innerHTML = '';
        if (i == 0) {
            for (let j = 0; j < player.hand.length; ++j) {
                // Somehow a players hand is getting an invalid card (-1) on occasion..... this is not possible.
                add_card_face(j, player.hand[j], playerHand);
            }
        } else {
            for (let j = 0; j < player.hand.length; ++j) {
                add_card_back(playerHand);
            }
        }
        // Update the drafted set
        const playerDrafted = document.getElementById(`player-${i}-drafted`);
        playerDrafted.innerHTML = '';
        for (let j = 0; j < player.drafted.length; ++j) {
            add_card_face(null, player.drafted[i], playerDrafted);
        }
        // Update the total score display
        const playerScore = document.getElementById(`player-${i}-score`);
        playerScore.innerText = ` ${player.score.point_total}pts`;
        // Update the accumulated count display
        const playerAccum = document.getElementById(`player-${i}-accum`);
        playerAccum.innerText = ` ${player.score.accumulated_total}acc`;
    }
}
// Called after all players have drafted a card before passing
function show_draft_callback(table) { /* TODO: */ }
// Called after all players have drafted a card after passing
function show_passing_callback(table) { /* TODO: */ }
// Called when the game is completed
function show_winner_callback(table) { /* TODO: */ }
// Called when the HumanAI????
function ui_selection_callback(player) { /* TODO: */ }

function new_game(num_players = 4) {
    game = new DraftGame(show_round_callback, show_draft_callback, show_passing_callback, show_winner_callback, ui_selection_callback);
    const seed = Xoshiro128.generate_seed();
    console.log(`Seed: 0x${seed.toString(16)}`);
    const deck = DraftDeck.default_deck();
    game.setup(seed, deck, num_players);

    add_playarea_ui();
    add_controls(seed);

    game.step();
}

document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('replay').onclick = function(event) {
        document.getElementById('playarea').innerHTML = '';
        document.getElementById('victory').style.display = 'none';
        new_game();
    }
    new_game();
});
