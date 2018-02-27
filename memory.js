function shuffle(array) {
  for (var i = array.length; i > 1; --i) {
    var index = Math.floor(Math.random() * i);
    var t = array[i - 1];
    array[i - 1] = array[index];
    array[index] = t;
  }
}

var cards = [ 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17,
  0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17 ];
var flipped = [];
var matches = 18;
var attempts = 0;

function callback() {
}

function victory() {
  $('#victory').show().effect('slide', { 'direction': 'up', 'distance': '200' }, 500, callback);
}

function onClickBuilder(index) {
  return function() {
    if (flipped.length < 2) {
      if (flipped.indexOf('#card-' + index) >= 0) {
        return;
      }
      var elem = $('#card-' + index);
      elem.toggleClass('flipped');
      flipped.push('#card-' + index);
      setTimeout(function() {
        if (flipped.length >= 2) {
          var a = $(flipped[0]);
          var b = $(flipped[1]);
          console.log(cards[a.data('index')] + ' == ' + cards[b.data('index')]);
          if (cards[a.data('index')] == cards[b.data('index')]) {
            a.effect('explode', {}, 500, callback);
            b.effect('explode', {}, 500, callback);
            flipped = [];
            --matches;
            $('#matches').html(18 - matches);
            console.log('matches: ' + $('#matches').html());
            if (matches <= 0) {
              victory();
            }
          } else {
            a.effect('shake', {}, 500, callback);
            b.effect('shake', {}, 500, callback);
            setTimeout(function() {
              a.removeClass('flipped');
              b.removeClass('flipped');
              flipped = [];
              ++attempts;
              $('#attempts').html(attempts);
              console.log('attempts: ' + $('#attempts').html());
            }, 500);
          }
        }
      }, 1000);
    }
  };
}

$(function() {
  var images = [ 1, 2, 3, 6, 28, 34, 46, 47, 48, 49, 50, 52, 54, 55, 56, 57, 58, 59 ];
  shuffle(cards);

  var parent = $('#playarea');
  for (var i = 0; i < 6; ++i) {
    var row = document.createElement('div');
    $(row).addClass('row').appendTo(parent);
    // var col = document.createElement('div');
    // $(col).addClass('col-lg-12').appendTo(row);
    var index = '';
    for (var j = 0; j < 6; ++j) {
      index = '' + i + '-' + j;
      var item = document.createElement('div');
      $(item).addClass('holder').appendTo(row); // col);
      var card = document.createElement('div');
      $(card).addClass('card').appendTo(item).
        attr('id', 'card-' + index).
        data('x', i).data('y', j).
        data('index', (i * 6 + j)).
        click(onClickBuilder(index));
      var face = document.createElement('div');
      $(face).addClass('face').appendTo(card);
      var faceImage = document.createElement('img');
      $(faceImage).addClass('rounded').attr('id', 'card-face-img-' + index);
      // $(faceImage).attr('src', 'http://via.placeholder.com/128x128?text=' + index + '>' + cards[i * 6 + j]);
      $(faceImage).attr('src', 'cards/warning.png');
      $(face).append(faceImage);
      var back = document.createElement('div');
      $(back).addClass('back').appendTo(card);
      var backImage = document.createElement('img');
      $(backImage).addClass('rounded').attr('id', 'card-back-img-' + index);
      $(backImage).attr('src', 'cards/' + images[cards[i * 6 + j]] + '.png');
      $(back).append(backImage);
    }
  }
});

