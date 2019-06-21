
pieceset = 'wikipedia'
files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']
startFEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
flip = false;
online = false;
humanBlack = true;
humanWhite = true; 
chess = new Chess(startFEN);
console.log(chess.fen());
const net = require('net');
var selectedPiece;
inPast = false;
var future = [];





var sock; 

function newGame(){
    sock = net.connect({host:'10.0.0.106', port:8080},  () => {
    
        console.log("signing in...");
        user = "alex";
        sock.write(user + "." + user + '\n');
      });
    console.log('requesting a game...');
    sock.write('new game\n');
    $("button").remove();

    sock.on('data', (data) => {
        console.log(data.toString());
        data = JSON.parse(data);
        if (data.Type == "GAME ANNOUNCEMENT") {
            color = data.Val.split(':')[0];
            oppRating = data.Val.split(':')[1];
            oppName = data.Val.split(':')[2];
    
            alert("Game starting: you are " + color + " versus " + oppName + ", a " + oppRating + "-rated player." );
            humanWhite = (color=="white");
            humanBlack = (color=="black");
            flip = (color=="black");
            setUp();
        } else if (data.Type == "MOVE") {
            piece = coordsToPiece(data.Val.substring(0,2));
            square = coordsToSquare(data.Val.substring(2,4));
            makeMove(piece, square, false);
        }
    
      });
      sock.on('end', () => {
        console.log('disconnected from server');
      });
    
}

function playOffline() {
    setUp();
}



function coordsToPiece(coords) {
    return $(".piece[data-coords=" + coords + "]");
}

function coordsToSquare(coords) {
    return $(".square[data-coords=" + coords + "]");
}

function setUp(){ 
    $(".square").remove();
    $(".piece").remove();

    if (!flip) {
        for (i = 0; i < 64; i++) {
            coords = String(files[((i%8))]) + String(8 - Math.floor(i/8));
            color = ((Math.floor(i/8)%2 == (i%8)%2) ? "white" : "black");
            $('.chessboard').append("<div class='square " + color + "' data-coords='" + coords + "'></div>");
        }
    } else {
        for (i = 63; i >= 0; i--) {
            coords = String(files[((i%8))]) + String(8 - Math.floor(i/8));
            color = ((Math.floor(i/8)%2 == (i%8)%2) ? "white" : "black");
            $('.chessboard').append("<div class='square " + color + "' data-coords='" + coords + "'></div>");
        }
    }

    setUpFEN(startFEN);

}



function canPlay(piece) {
    if (inPast) {
        return false;
    }
    if ($(piece).children('img').attr('src').indexOf("b") > 0) {
        return humanBlack;
    } else {
        return humanWhite;
    }
}


function selectPiece(piece) {
    
    if (canPlay(piece)) {
        showMoves(piece);
        selectedPiece = piece;
        $('.highlight').remove();
        $('.square[data-coords=' + $(piece).attr('data-coords') + ']').append("<div class='highlight'></div>");
    }
}

function enableClicking() {
    $(".piece").click(function(){
        if ($(this).siblings('.circle').length > 0){
            $('.square[data-coords=' + $(this).attr('data-coords') + ']').click();
        } else {
            selectPiece(this);
        }
    });

    $(".square").click(function(){        
        if (selectedPiece && ($(selectedPiece).attr('data-coords') != $(this).attr('data-coords'))){
            makeMove(selectedPiece, this, true);
            selectedPiece = 0;
            clearHighlight();
            hideMoves();
        } else {            
            if ($(this).children('.piece').length == 0) {
                hideMoves();
                clearHighlight();
                console.log("cleared");
            } else {
                selectPiece(squareToPiece($(this)));
            }
        }
    });
}

function hideMoves() {
    $(".circle").remove();
}

function clearHighlight() {
    $('.highlight').remove();
}

function showMoves(square) {
    console.log("showing moves", $(square).attr("data-coords"));
    hideMoves();
    moves = chess.moves({verbose:true, square:$(square).attr('data-coords')});
    console.log(chess.fen());
    $.each(moves, function (i, move) { 
        s = $(".square[data-coords=" + move.to + "]");
        if (s.children('.piece').length > 0) {
            s.append("<div class='circle capture'></div>"); 
        } else {
            s.append("<div class='circle'></div>");
        }        
    });
}


function pieceToSquare(piece) {
    return $('.square[data-coords=' + $(piece).attr("data-coords") + ']');
}

function squareToPiece(square) {
    return $('.piece[data-coords=' + $(square).attr("data-coords") + ']');
}


function makeMove(piece, square, player) {
    if(!canPlay(piece) & player) {
        bounceBack(piece);
        return;
    }
    piece = $(piece);
    square = $(square);
    move = {from:piece.attr("data-coords"), to:$(square).attr("data-coords")};
    if ((piece.children('img').attr("src").indexOf('P') != -1) && ($(square).attr('data-coords').indexOf('8') + $(square).attr('data-coords').indexOf('1') != -2)) {
        console.log("PROMOTION");
        move.promotion = 'q';
        
    }
    resp = chess.move(move);
    if(resp) {
        if (player) {
            console.log("sending.....");
            if (online) {
                sock.write(String(move.from) + String(move.to) + "\n");
            }
        }
        square.empty()
        square.append(piece.detach().css({top: 0,left: 0}));
        piece.attr("data-coords", square.attr("data-coords"));
        hideMoves();
        $(".pgn").html(chess.pgn({ max_width: 5, newline_char: '<br/>' }));
        special = resp.flags.indexOf("e") + resp.flags.indexOf("k") + resp.flags.indexOf("q") + resp.flags.indexOf("p");
        if (special != -4) {
            console.log("special", special);
            setUpFEN(chess.fen());
        }
    } else {
        bounceBack(piece);
    }
}


function bounceBack(piece) {
    origin = $(".square[data-coords = " + piece.attr("data-coords") + "]");
    origin.append(piece.detach().css({top: 0,left: 0}));
    piece.click();
}

function enableDragging() {
    $('.square').droppable({
        tolerance: 'intersect',
        drop: function(event, ui) {
            square = $(this);
            piece = ui.draggable;
            pieceToSquare(piece).css({zIndex:99});
            makeMove(piece, square, true);
        }
    });
    
    $('.piece').draggable({
        start: function (event, ui) {
            pieceToSquare(this).css({zIndex: 100});
            if (canPlay(this)) {
                showMoves(this);
            }
        },
        revertDuration: 0,
        revert: 'invalid',
        scroll: false,
    });
}






function setUpFEN(fen) {
    $('.piece').remove();
    x = 0;
    y = 0;
    fen.split('').forEach(function(letter) {
        color = false;
        if(letter=='/') {
            y++;
            x=0;
        } else if (letter == ' ') {
            return;
        } else if ($.isNumeric(letter)) {
            x += parseInt(letter);
        } else if(letter == String(letter).toUpperCase()) {
            color = "w"
        } else {
            color = "b"
        }

        if(color) {
            coords = files[x] + String(8-y);
            $("[data-coords=" + coords + "]").append("<div class='piece 'data-coords='" + coords + "'><img src='img/chesspieces/" + pieceset + "/" + color + String(letter).toUpperCase() + ".png'></img></div>");
            x++;
        }
        });



        enableDragging();
        enableClicking();
}


function back() {
    if (chess.history().length > 0) {
        inPast = true;
        var moves = chess.history();
        chess = new Chess();
        for(var i=0;i<moves.length - 1;i++) {
        chess.move(moves[i]);
        }
        setUpFEN(chess.fen());
        future.push(moves[moves.length - 1]);
    }
}

function next() {
    if (inPast) {
        nextMove = future.pop();
        if (future.length == 0) {
            inPast = false;
        }
        chess.move(nextMove);
        setUpFEN(chess.fen());
    }
}


$(document).keydown(function(e) {
    if(e.keyCode == 37) {
        back();
    } else if (e.keyCode == 39) {
        next();
    }
});
