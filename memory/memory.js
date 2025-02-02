function shuffle(array) {
  for (var i = array.length; i > 1; --i) {
    var index = Math.floor(Math.random() * i);
    var t = array[i - 1];
    array[i - 1] = array[index];
    array[index] = t;
  }
}

var cards = [
   0,  1,  2,  3,  4,  5,  6,  7,  8,  9,
  10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20,
   0,  1,  2,  3,  4,  5,  6,  7,  8,  9,
  10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20
];
var width = 7;
var height = 6;

var flipped = [];
var matches = 0;
var attempts = 0;
var players = [ 0, 0 ];
var maxPlayers = 4;
var whoseTurn = 0;
var bkgSelection = 0;
var flipping = null;
var shaking = null;

function callback() { }

function victory() {
  if (players.length > 1) {
    var winner = 0;
    for (var n = 0; n < players.length; ++n) {
      if (players[n] > players[winner]) {
        winner = n;
      }
    }
    $('#victory-text').html('PLAYER ' + (winner + 1) + ' WINS!');
  } else {
    $('#victory-text').html('YOU WIN!');
  }

  $('#victory').show().effect('slide', { 'direction': 'down', 'distance': 500 }, 500, callback);
}

function onClickBuilder(index) {
  return function(event) {
    if (flipping || shaking) {
      return;
    }
    if (flipped.length < 2) {
      if (flipped.indexOf('#card-' + index) >= 0) {
        return;
      }
      var elem = $('#card-' + index);
      elem.toggleClass('flipped');
      flipped.push('#card-' + index);
      flipping = setTimeout(function() {
        if (flipped.length >= 2) {
          var a = $(flipped[0]);
          var b = $(flipped[1]);
          console.log(cards[a.data('index')] + ' === ' + cards[b.data('index')]);
          if (cards[a.data('index')] === cards[b.data('index')]) {
            players[whoseTurn]++;
            a.effect('explode', {}, 500, callback);
            b.effect('explode', {}, 500, callback);
            flipped = [];
            ++matches;
            $('#matches').html(' ' + matches);
            console.log('matches: ' + $('#matches').html());
            ++attempts;
            $('#attempts').html(' ' + attempts);
            console.log('attempts: ' + $('#attempts').html());
            for (var n = 0; n < players.length; ++n) {
              $('#player-' + n).html(' ' + players[n]);
              console.log('player ' + n + $('#player-' + n).html());
            }
            if (matches >= (cards.length / 2)) {
              victory();
            }
          } else {
            whoseTurn = (whoseTurn + 1) % players.length;
            for (var n = 0; n < players.length; ++n) {
              if (n === whoseTurn) {
                $('#player-' + n).parent().addClass('active');
              } else {
                $('#player-' + n).parent().removeClass('active');
              }
            }
            a.effect('shake', {}, 500, callback);
            b.effect('shake', {}, 500, callback);
            shaking = setTimeout(function() {
              a.removeClass('flipped');
              b.removeClass('flipped');
              flipped = [];
              ++attempts;
              $('#attempts').html(' ' + attempts);
              console.log('attempts: ' + $('#attempts').html());
              shaking = null;
            }, 500);
          }
        }
        flipping = null;
      }, 750); // 1000);
    }
  };
}

function onClickPreviewBuilder(index, src) {
  return function(event) {
    $('.preview.selected').removeClass('selected');
    $('#preview-' + index).addClass('selected');
  
    bkgSelection = index;
  
    for (var j = 0; j < height; ++j) {
      for (var i = 0; i < width; ++i) {
        $('#card-face-img-' + j + '-' + i).attr('src', src);
      }
    }
  }
}

function confirmNewGame() {
  if (attempts > 0 || flipped.length > 0) {
    return confirm("Are you sure?  This will begin a new game.");
  }
  return true;
}

function onClickBoardSizeBuilder(index, x, y) {
  return function(event) {
    if (confirmNewGame()) {
      $('.sizes.selected').removeClass('selected');
      $('#board-size-' + index).addClass('selected');

      whoseTurn = 0;
      width = x;
      height = y;
      new_game();
    }
  }
}

function onClickChangePlayersBuilder(numPlayers) {
  return function(event) {
    if (confirmNewGame()) {
      whoseTurn = 0;
      switch (numPlayers) {
        case 1: players = [ 0 ]; break;
        default:
        case 2: players = [ 0, 0 ]; break;
        case 3: players = [ 0, 0, 0 ]; break;
        case 4: players = [ 0, 0, 0, 0 ]; break;
      }
      new_game();
    }
  }
}

function add_players() {
  var scores = $('#players');
  scores.empty();
  for (var i = 0; i < players.length; ++i) {
    var player = document.createElement('div');
    $(player).appendTo(scores);
    if (i === whoseTurn) {
      $(player).addClass('col-sm active');
    } else {
      $(player).addClass('col-sm');
    }
    var label = document.createElement('span');
    $(label).appendTo(player).html('Player ' + (i + 1) + ':');
    var score = document.createElement('span');
    $(score).appendTo(player).
      attr('id', 'player-' + i).
      html(' ' + players[i]);
  }
}

function add_previews(backgrounds) {
  var previews = $('#previews');
  previews.empty();

  var wrapper = document.createElement('div');
  $(wrapper).appendTo(previews).addClass('col-sm');
  /*
  var label = document.createElement('span');
  $(label).appendTo(wrapper).
    attr('id', 'players-label').
    html('Card Back: ');
   */
  for (var i = 0; i < backgrounds.length; ++i) {
    var preview = document.createElement('span');
    if (i === bkgSelection) {
      $(preview).addClass('preview selected');
    } else {
      $(preview).addClass('preview');
    }
    $(preview).appendTo(wrapper).
      attr('id', 'preview-' + i).
      attr('index', i).
      data('img', backgrounds[i]).
      click(onClickPreviewBuilder(i, backgrounds[i]));
    var previewImage = document.createElement('img');
    $(previewImage).appendTo(preview).
      addClass('rounded').
      attr('id', 'preview-img-' + i).
      attr('src', backgrounds[i]);
  }

  wrapper = document.createElement('div');
  $(wrapper).appendTo(previews).addClass('col-sm');
  var label = document.createElement('span');
  $(label).appendTo(wrapper).
    attr('id', 'players-label').
    html('Num Players: ');
  for (var i = 0; i < maxPlayers; ++i) {
    var button = document.createElement('button');
    $(button).appendTo(wrapper).
      attr('type', 'button').
      addClass('btn btn-secondary btn-players').
      html('' + (i + 1)).
      click(onClickChangePlayersBuilder(i + 1));
  }
}

function add_board_sizes(board_sizes) {
  var outer = $('#board-sizes');
  outer.empty();

  var wrapper = document.createElement('div');
  $(wrapper).appendTo(outer).addClass('col-sm');
  for (var i = 0; i < board_sizes.length; ++i) {
    var size = document.createElement('span');
    if ((board_sizes[i].x === width) && (board_sizes[i].y === height)) {
      $(size).addClass('sizes selected');
    } else {
      $(size).addClass('sizes');
    }
    $(size).appendTo(wrapper).
      attr('id', 'board-size-' + i).
      attr('index', i).
      // FIXME: Fix this so it overlays right now the text is in the SVG
      // html('' + board_sizes[i].x + ' x ' + board_sizes[i].y).
      data('img', board_sizes[i].img).
      click(onClickBoardSizeBuilder(i, board_sizes[i].x, board_sizes[i].y));
    var sizeImage = document.createElement('img');
    $(sizeImage).appendTo(size).
      attr('id', 'board-size-img-' + i).
      attr('src', board_sizes[i].img);
  }
}

function add_controls(backgrounds, board_sizes) {
  add_previews(backgrounds);
  add_board_sizes(board_sizes);
}

function new_game() {
  /*
  var images = [
    'v1/1', 'v1/2', 'v1/3', 'v1/6', 'v1/28',
    'v1/34', 'v1/46', 'v1/47', 'v1/48', 'v1/49',
    'v1/50', 'v1/52', 'v1/54', 'v1/55', 'v1/56',
    'v1/57', 'v1/58', 'v1/59'
  ];
  var backgrounds = [ 'cards/v1/warning.png' ];
   */
  var images2 = [
    'v2/faces/acorn',       'v2/faces/broccoli',  'v2/faces/cake',    'v2/faces/cheese',  'v2/faces/corn',
    'v2/faces/eggplant',    'v2/faces/ice-cream', 'v2/faces/lemons',  'v2/faces/onion',   'v2/faces/peaches',
    'v2/faces/tomato',      'v2/faces/avocado',   'v2/faces/cabbage', 'v2/faces/carrot',  'v2/faces/cookie',
    'v2/faces/croissant',   'v2/faces/grapes',    'v2/faces/kiwi',    'v2/faces/olives',  'v2/faces/parfait',
    'v2/faces/strawberry',  'v2/faces/watermelon',  'v2/faces/garlic',  'v2/faces/peppers', 'v2/faces/crepe',
    'v2/faces/burger',      'v2/faces/cola',      'v2/faces/egg',     'v2/faces/fries',   'v2/faces/hot-dog',
    'v2/faces/maki',        'v2/faces/pizza',     'v2/faces/sushi',   'v2/faces/taco',    'v2/faces/tempura',
    'v2/faces/cheesecake'
  ];
  var backgrounds2 = [
    'cards/v2/bkgs/wave.png', 'cards/v2/bkgs/fuji.png', 'cards/v2/bkgs/undersea.png', 'cards/v2/bkgs/warning.png'
  ];
  // board size - tiles - button display
  // 5x6 - 15 tiles (2x3)
  // 6x6 - 18 tiles (3x3)
  // 6x7 - 21 tiles (3x4)
  // 8x7 - 28 tiles (4x4)
  var board_sizes = [
    { 'x': 6, 'y': 5, 'img': 'cards/v2/icons/3x2.svg' },
    { 'x': 6, 'y': 6, 'img': 'cards/v2/icons/3x3.svg' },
    { 'x': 7, 'y': 6, 'img': 'cards/v2/icons/4x3.svg' },
    { 'x': 7, 'y': 8, 'img': 'cards/v2/icons/4x4.svg' },
  ];

  // Build an array of cards with doubled indicies: [0, 1, 2, 3..., 0, 1, 2, 3...]
  cards = function(length) {
    a = Array(length).fill().map((_, index) => index);
    return a.concat(a);
  }((width * height) >> 1);

  shuffle(cards);
  // Shuffle the images since we have more images than cards on the field
  shuffle(images2);

  // reset the global game state
  flipped = [];
  matches = 0;
  attempts = 0;
  whoseTurn = 0;
  for (var i = 0; i < players.length; ++i) {
    players[i] = 0;
  }
  flipping = null;
  shaking = null;
  
  $('#matches').html(' ' + matches);
  $('#attempts').html(' ' + attempts);

  add_players();

  add_controls(backgrounds2, board_sizes);

  var parent = $('#playarea');
  parent.empty();
  for (var i = 0; i < height; ++i) {
    var row = document.createElement('div');
    $(row).addClass('row').appendTo(parent);
    // var col = document.createElement('div');
    // $(col).addClass('col-lg-12').appendTo(row);
    var index = '';
    for (var j = 0; j < width; ++j) {
      index = '' + i + '-' + j;
      var item = document.createElement('div');
      $(item).addClass('holder').appendTo(row); // col);
      var card = document.createElement('div');
      $(card).addClass('card').appendTo(item).
        attr('id', 'card-' + index).
        data('x', i).data('y', j).
        data('index', (i * width + j)).
        click(onClickBuilder(index));
      var face = document.createElement('div');
      $(face).addClass('face').appendTo(card);
      var faceImage = document.createElement('img');
      $(faceImage).addClass('rounded').attr('id', 'card-face-img-' + index);
      // $(faceImage).attr('src', 'cards/' + images2[cards[i * width + j]] + '.png');
      // $(faceImage).attr('src', backgrounds[bkgSelection]);
      $(faceImage).attr('src', backgrounds2[bkgSelection]);
      $(face).append(faceImage);
      var back = document.createElement('div');
      $(back).addClass('back').appendTo(card);
      var backImage = document.createElement('img');
      $(backImage).addClass('rounded').attr('id', 'card-back-img-' + index);
      // $(backImage).attr('src', 'cards/' + images[cards[i * width + j]] + '.png');
      $(backImage).attr('src', 'cards/' + images2[cards[i * width + j]] + '.png');
      $(back).append(backImage);
    }
  }  
}

$(function() {
  new_game();
});

$('#replay').on('click', function(event) {
  $('#playarea').empty();
  $('#victory').hide();
  new_game();
});
