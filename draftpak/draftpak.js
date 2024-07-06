import * as cards from "./draftpak_cards.js";
import { HumanAI } from "./draftpak_player.js";
import { DraftGame, DraftDeck } from "./draftpak_table.js";
import { Xoshiro128 } from "./rando.js";



//================================================================================
// General element creation functions
//================================================================================
function add_row(parent, style = null, id = null) {
    const row = document.createElement('div');
    if (style !== null && style !== undefined) {
        row.setAttribute('class', `row ${style}`);
    } else {
        row.setAttribute('class', 'row');
    }
    if (id !== null && id !== undefined) {
        row.setAttribute('id', id);
    }
    parent.appendChild(row);
    return row;
}

function add_column(parent, text = null, style = null, id = null) {
    const column = document.createElement('div');
    if (style !== null && style !== undefined) {
        column.setAttribute('class', `col-sm ${style}`);
    } else {
        column.setAttribute('class', 'col-sm');
    }
    if (id !== null && id !== undefined) {
        column.setAttribute('id', id);
    }
    if (text !== null && text !== undefined) {
        column.innerText = text;
    }
    parent.appendChild(column);
    return column;
}

function add_spacer_column(parent) {
    add_column(parent);
}



//================================================================================
// Constants and globals
//================================================================================
const MAX_PLAYERS = 4;

class CardDescriptor {
    constructor(name, image, tooltip) {
        this.name = name;
        this.image = image;
        this.tooltip = tooltip;
    }
};

const CARD_FACES = new Map([
    [cards.CARD_TRIPLE_SCORING,     new CardDescriptor('A/3', '', 'Collect 3 and score 10 pts.'), ],
    [cards.CARD_PAIR_SCORING,       new CardDescriptor('5/2', '', 'Collect 2 and score 5 pts.'), ],
    [cards.CARD_ESCALATING_PTS,     new CardDescriptor('>>>', '', 'Collect more and score: [ 1, 3, 6, 10, 15 ] pts.'), ],

    [cards.CARD_SMALL_SCORING,      new CardDescriptor(' +1', '', 'Score 1 pt. Can be multiplied!'), ],
    [cards.CARD_MID_SCORING,        new CardDescriptor(' +2', '', 'Score 2 pts. Can be multiplied!'), ],
    [cards.CARD_HIGH_SCORING,       new CardDescriptor(' +3', '', 'Score 3 pts. Can be multiplied!'), ],
    [cards.CARD_POINT_MULTIPLIER,   new CardDescriptor(' x3', '', 'Multiply your next scoring card by x3.'), ],

    [cards.CARD_SMALL_TICKS,        new CardDescriptor('_*_', '', '1 star; 6 or 3 pts for the most or second most.'), ],
    [cards.CARD_MID_TICKS,          new CardDescriptor('*_*', '', '2 stars; 6 or 3 pts for the most or second most.'), ],
    [cards.CARD_HIGH_TICKS,         new CardDescriptor('***', '', '3 stars; 6 or 3 pts for the most or second most.'), ],

    [cards.CARD_ACCUMULATING,       new CardDescriptor(' @ ', '', '6 pts for the most at the end of the game, -6 for the least.'), ],
    [cards.CARD_SWAP_FOR_TWO,       new CardDescriptor('<->', '', 'Swap this for 2 cards!'), ],
]);
const CARD_BACKS = [
    new CardDescriptor('Bees', '/draftpak/cards/backs/hexagons.svg'),
    new CardDescriptor('Aztec', '/draftpak/cards/backs/aztec.svg'),
    new CardDescriptor('Circuits', '/draftpak/cards/backs/circuit-board.svg'),
    new CardDescriptor('Gears', '/draftpak/cards/backs/floating-cogs.svg'),
    new CardDescriptor('Moroccan', '/draftpak/cards/backs/moroccan.svg'),
];

const seed = Xoshiro128.generate_seed();
const random = new Xoshiro128(seed);
console.log(`Seed: 0x${seed.toString(16)}`);

let game = null;
let bkgSelection = 0;
let hand_selection = [ ];
let swap_selection = NaN;



//================================================================================
// Callback functions
//================================================================================
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
    };
}

function confirmNewGame() {
    if (game !== null) {
        return confirm("Are you sure?  This will start a new game.");
    }
    return true;
}

function onClickChangePlayersBuilder(index, num_players) {
    return function(event) {
        if (game.num_players() == num_players) { return; }
        if (confirmNewGame()) {
            const selected = document.querySelector('.btn-players.btn-selected');
            if (selected !== null ** selected !== undefined) {
                selected.classList.remove('btn-selected');
            }
            const clicked = document.getElementById(`num-players-${index}`);
            clicked.classList.add('btn-selected');
            new_game(num_players);
        }
    };
}

function onDblClickSelectCard(index) {
    return function(event) {
        // TODO: Handle swap card
        const selected = document.getElementById(`card-${index}`);
        if (selected !== null && selected !== undefined) {
            // If we double clicked on a card select it or remove it from the current selection
            let found = hand_selection.indexOf(index);
            if (found != -1) {
                hand_selection.splice(found, 1);
                selected.classList.remove('card-highlight');
            } else {
                hand_selection.push(index);
                selected.classList.add('card-highlight');
            }

            if (hand_selection.length === 0) {
                return;
            }
            if (Object.is(swap_selection, NaN)) {
                if (hand_selection.length !== 1) {
                    return;
                }
            } else {
                if (hand_selection.length !== 2) {
                    return;
                }
            }

            game.draft_and_pass();
            if (game.close_round()) {
                setTimeout(function() {
                    if (!game.start_round()) {
                        show_round_callback(game.table);
                        setTimeout(function() {
                            game.end();
                        }, 1000);
                    }
                }, 2000);
            }
        }
    };
}

function onClickSelectSwapCard(index) {
    return function(event) {
        const selected = document.getElementById(`swap-card-${index}`);
        if (selected !== null && selected !== undefined) {
            if (!Object.is(swap_selection, NaN)) {
                const previous = document.getElementById(`swap-card-${swap_selection}`);
                previous.classList.remove('card-highlight');
            }
            
            if (swap_selection === index) {
                swap_selection = NaN;
            } else {
                swap_selection = index;
                selected.classList.add('card-highlight');
            }
        }
    };
}



//================================================================================
// UI Generation/Creation Functions
//================================================================================
function add_card_back(parent) {
    /*
    <div class="card-container" >
        <div class="card-border" ></div>
        <div class="card" >
            <div class="card-back bkg-back-xxx" ></div>
        </div>
    </div>
    */
    const card_container = document.createElement('div');
    card_container.setAttribute('class', 'card-container');
    parent.appendChild(card_container);
    // const card_container = add_column(parent, null, 'card-container');
    // Create an empty element that contains the boarder
    const card_border = document.createElement('div');
    card_border.setAttribute('class', 'card-border');
    card_container.appendChild(card_border);
    // Create an emelemt that contains the card back image
    const card = document.createElement('div');
    card.dataset.name = CARD_BACKS[bkgSelection].name;
    card.dataset.index = bkgSelection;
    card.setAttribute('class', 'card');
    card_container.appendChild(card);
    // Create the element for the card back
    const image = document.createElement('div');
    image.setAttribute('class', `card-back bkg-${CARD_BACKS[bkgSelection].name.toLowerCase()}`);
    card.appendChild(image);
}

function add_card_face(index, kind, parent) {
    /*
    <div class="card-container" >
        <div class="card-border" ></div>
        <div class="card" >
            <div class="card-face bkg-face-xxx" >
            <div class="card-text" >[CARD TEXT]</div>
        </div>
    </div>
    */
    const card_container = document.createElement('div');
    card_container.setAttribute('class', 'card-container tooltip');
    parent.appendChild(card_container);
    const tooltip = document.createElement('span');
    tooltip.setAttribute('class', '');
    tooltip.innerText = CARD_FACES.get(kind).tooltip;
    card_container.appendChild(tooltip);
    // const card_container = add_column(parent, null, 'card-container');
    // Create an empty element that contains the boarder
    const card_border = document.createElement('div');
    card_border.setAttribute('class', 'card-border');
    card_container.appendChild(card_border);
    // Create an element that contains the card face
    const card = document.createElement('div');
    card.dataset.kind = `${kind}`;
    card.dataset.index = `${index}`;
    card.setAttribute('class', 'card');
    card_container.appendChild(card);
    // Create an element for the image on the card face
    const image = document.createElement('div');
    image.setAttribute('class', `card-face bkg-${CARD_FACES.get(kind).image}`);
    card.appendChild(image);

    const text = document.createElement('div');
    text.setAttribute('class', 'card-text');
    text.innerText = CARD_FACES.get(kind).name;
    card.appendChild(text);

    return card;
}

function add_player_ui(game, index, player, parent) {
    const player_ui = add_column(parent, null, null, `player-${index}-ui`);
    // Add the area for the players hand display
    add_row(player_ui, 'player-hand', `player-${index}-hand`);
    // Add the area for the players drafted display
    add_row(player_ui, 'player-drafted', `player-${index}-drafted`);
    // Add the players name
    const name = document.createElement('div');
    name.setAttribute('id', `player-${index}-name`);
    name.setAttribute('class', `center-text`);
    name.innerText = `${player.name}`;
    player_ui.appendChild(name);
}

function add_2_player_ui(game, players, playarea) {
    // row0:       [ 2 ]
    // row1:       [ 0 ]

    const row0 = add_row(playarea, 'center');
    add_spacer_column(row0);
    add_player_ui(game, 1, players[1], row0);
    add_spacer_column(row0);
    
    const row1 = add_row(playarea, 'center');
    add_spacer_column(row1);
    add_player_ui(game, 0, players[0], row1);
    add_spacer_column(row1);

}

function add_3_player_ui(game, players, playarea) {
    // row0: [ 2 ]       [ 1 ]
    // row1:       [ 0 ]
    
    const row0 = add_row(playarea, 'center');
    add_player_ui(game, 2, players[2], row0);
    add_spacer_column(row0);
    add_player_ui(game, 1, players[1], row0);
    
    const row1 = add_row(playarea, 'center');
    add_spacer_column(row1);
    add_player_ui(game, 0, players[0], row1);
    add_spacer_column(row1);

}

function add_4_player_ui(game, players, playarea) {
    // row0:       [ 2 ]
    // row1: [ 3 ]       [ 1 ]
    // row2:       [ 0 ]
    
    const row0 = add_row(playarea, 'center');
    add_spacer_column(row0);
    add_player_ui(game, 2, players[2], row0);
    add_spacer_column(row0);
    
    const row1 = add_row(playarea, 'center');
    add_player_ui(game, 3, players[3], row1);
    add_spacer_column(row1);
    add_player_ui(game, 1, players[1], row1);
    
    const row2 = add_row(playarea, 'center');
    add_spacer_column(row2);
    add_player_ui(game, 0, players[0], row2);
    add_spacer_column(row2);
}

function add_playarea() {
    const players = game.table.players;

    const scorearea = document.getElementById('scorearea');
    scorearea.innerHTML = '';
    const score_row = add_row(scorearea);
    for (let i = 0; i < players.length; ++i) {
        // Create a parent element for the player
        const player = add_column(score_row);
        player.dataset.name = players[i].name;
        player.dataset.index = i;

        const row0 = add_row(player);
        // Add a label for the players name
        add_column(row0, `${players[i].name}:`);
        // Add the players point total score
        add_column(row0, ` ${players[i].score.point_total} pts`, null, `player-${i}-score`);
        // Add the players accumulated score
        add_column(row0, ` ${players[i].score.accumulated_total} acc`, null, `player-${i}-accum`);
        
        const row1 = add_row(player);
        add_spacer_column(row1);
        // Add the players point total score
        add_column(row1, ` (+${players[i].score.point_total})`, null, `player-${i}-round-score`);
        // Add the players accumulated score
        add_column(row1, ` (+${players[i].score.accumulated_total})`, null, `player-${i}-round-accum`);
    }
    const round_row = add_row(scorearea);
    add_spacer_column(round_row);
    add_column(round_row, ` Round: ${game.table.current_round+1} of ${game.table.num_rounds}`, 'center-text', 'current-round');
    add_spacer_column(round_row);

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

function add_controls_card_backs(control_panel) {
    const column = add_column(control_panel);
    // Add the card back control label
    const label = document.createElement('span');
    label.setAttribute('class', 'controls-label');
    label.innerText = 'Card Back: ';
    column.appendChild(label);
    // Add the card back control buttons
    for (let i = 0; i < CARD_BACKS.length; ++i) {
        const button = document.createElement('button');
        button.setAttribute('type', 'button');
        button.setAttribute('id', `card-back-${i}`);
        button.setAttribute('class', `btn btn-card btn-card-back bkg-${CARD_BACKS[i].name.toLowerCase()}`);
        if (i === bkgSelection) {
            button.classList.add('btn-selected');
        }
        button.onclick = onClickChangeCardBackBuilder(i, CARD_BACKS[i]);
        column.appendChild(button);
    }
}

function add_controls_num_players(control_panel) {
    const column = add_column(control_panel);
    // Add the num players control label
    const label = document.createElement('span');
    label.setAttribute('class', 'controls-label');
    label.innerText = 'Num Players: ';
    column.appendChild(label);
    // Add the num players control buttons
    for (let i = 1; i < MAX_PLAYERS; ++i) {
        const button = document.createElement('button');
        button.setAttribute('type', 'button');
        button.setAttribute('id', `num-players-${i}`);
        button.setAttribute('class', 'btn btn-secondary btn-players');
        if ((i+1) === game.num_players()) {
            button.classList.add('btn-selected');
        }
        button.innerText = `${i + 1}`;
        button.onclick = onClickChangePlayersBuilder(i, i + 1);
        column.appendChild(button);
    }
}
function add_controls() {
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

    const tooltips = add_column(row1);
    const label = document.createElement('label');
    label.setAttribute('for', 'show-tooltips');
    label.innerText = 'Show Tooltips';
    tooltips.append(label);
    const check = document.createElement('input');
    check.setAttribute('type', 'checkbox');
    check.setAttribute('id', 'show-tooltips');
    check.setAttribute('checked', true);
    label.appendChild(check);
}



//================================================================================
// Gameplay Callback functions
//================================================================================
// Called at the beginning of the round when the hands are delt and after they are passed
function show_round_callback(table) {
    for (let i = 0; i < table.players.length; ++i) {
        const player = table.players[i];
        // Update the players hand
        const playerHand = document.getElementById(`player-${i}-hand`);
        playerHand.innerHTML = '';
        if (i === 0) {
            for (let j = 0; j < player.hand.length; ++j) {
                const card = add_card_face(j, player.hand[j], playerHand);
                card.setAttribute('id', `card-${j}`);
                card.ondblclick = onDblClickSelectCard(j);
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
            if (i === 0) {
                if (player.drafted[j] === cards.CARD_SWAP_FOR_TWO) {
                    const card = add_card_face(null, player.drafted[j], playerDrafted);
                    card.setAttribute('id', `swap-card-${j}`);
                    card.onclick = onClickSelectSwapCard(j);
                } else {
                    add_card_face(null, player.drafted[j], playerDrafted);
                }
            } else {
                add_card_face(null, player.drafted[j], playerDrafted);
            }
        }
        // Update the total score display
        const playerScore = document.getElementById(`player-${i}-score`);
        playerScore.innerText = ` ${player.score.point_total} pts`;
        const playerRoundScore = document.getElementById(`player-${i}-round-score`);
        if (player.score.points_last_round === 0) {
            playerRoundScore.innerHTML = '&nbsp;';
        } else {
            playerRoundScore.innerText = ` (+${player.score.points_last_round})`;
        }
        // Update the accumulated count display
        const playerAccum = document.getElementById(`player-${i}-accum`);
        playerAccum.innerText = ` ${player.score.accumulated_total} acc`;
        const playerRoundAccum = document.getElementById(`player-${i}-round-accum`);
        if (player.score.accumulated_last_round === 0) {
            playerRoundAccum.innerHTML = '&nbsp;';
        } else {
            playerRoundAccum.innerText = ` (+${player.score.accumulated_last_round})`;
        }
    }
    const round = document.getElementById('current-round');
    if (table.current_round >= table.num_rounds) {
        round.innerText = 'Game Over';
    } else {
        round.innerText = ` Round: ${table.current_round+1} of ${table.num_rounds}`;
    }
}

// Called after all players have drafted a card before passing
// function show_draft_callback(table) { /* TODO: */ }

// Called after all players have drafted a card after passing
// function show_passing_callback(table) { /* TODO: */ }

// Called when the game is completed
function show_winner_callback(table) {
    const playarea = document.getElementById('playarea');
    playarea.innerHTML = '';

    const victory = document.createElement('div');
    victory.setAttribute('id', 'victory');
    victory.setAttribute('class', 'victory');
    victory.style.opacity = 0.0;
    playarea.appendChild(victory);

    const victoryText = document.createElement('div');
    victoryText.setAttribute('id', 'victory-text');
    victory.appendChild(victoryText);

    const winner = game.table.scorer.winner();
    if (winner !== null && winner !== undefined) {
        if (winner.name.toLowerCase() == 'you') {
            victoryText.innerText = `${winner.name.toUpperCase()} WIN!`;
        } else {
            victoryText.innerText = `${winner.name.toUpperCase()} WINS!`;
        }
    } else {
        victoryText = 'DRAW';
    }

    const replay = document.createElement('button');
    replay.setAttribute('type', 'button');
    replay.setAttribute('id', 'replay');
    replay.setAttribute('class', 'btn btn-secondary');
    replay.innerText = 'Play Again';
    replay.onclick = function(event) {
        document.getElementById('playarea').innerHTML = '';
        new_game(game.num_players());
    }
    victory.appendChild(replay);

    function unfade(element, delay) {
        var opacity = 0.1;
        element.style.display = 'block';
        var timer = setInterval(function () {
            if (opacity >= 1){
                clearInterval(timer);
            }
            element.style.opacity = opacity;
            element.style.filter = 'alpha(opacity=' + opacity * 100 + ")";
            opacity += opacity * 0.1;
        }, delay);
    }
    unfade(victory, 10);
}

// Called when the HumanAI wants to make a selection or determine if it has a selection (so the operation must be idempotent when not verifying)
function ui_selection_callback(player, verify) {
    if (!(player.ai instanceof HumanAI)) {
        return;
    }

    const choice = { 'hand': hand_selection, 'swap': swap_selection };
    if (!(!!verify)) {
        hand_selection = [ ];
        swap_selection = NaN;
    }
    return choice;
}



//================================================================================
// Initialization routines
//================================================================================
function new_game(num_players = 4) {
    random.jump();

    game = new DraftGame(show_round_callback, show_round_callback, show_round_callback, show_winner_callback, ui_selection_callback);
    const deck = DraftDeck.default_deck();
    game.setup(random, deck, num_players);

    add_playarea();
    add_controls();

    game.start_round();
}

document.addEventListener('DOMContentLoaded', function() {
    new_game();
});
