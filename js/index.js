
pieceset = 'wikipedia'
files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']
startFEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR"
humanBlack = false;
humanWhite = true; 
chess = new Chess();
var selectedPiece;


$(document).ready(function(){ 
    for (i = 0; i < 64; i++) {
        coords = String(files[((i%8))]) + String(8 - Math.floor(i/8));
        color = ((Math.floor(i/8)%2 == (i%8)%2) ? "white" : "black");
        $('.chessboard').append("<div class='square " + color + "' data-coords='" + coords + "'></div>");
    }


    setUpFEN(startFEN);
    enableDragging();
    enableClicking();
});



function selectPiece(piece) {
    showMoves(piece);
    selectedPiece = piece;
    $('.highlight').remove();
    $('.square[data-coords=' + $(piece).attr('data-coords') + ']').append("<div class='highlight'></div>");
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
        console.log("squareclick");
        
        if (selectedPiece && ($(selectedPiece).attr('data-coords') != $(this).attr('data-coords'))){
            makeMove(selectedPiece, this);
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
    hideMoves();
    moves = chess.moves({verbose:true, square:$(square).attr('data-coords')})
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


function makeMove(piece, square) {
    piece = $(piece);
    square = $(square);
    move = {from:piece.attr("data-coords"), to:$(square).attr("data-coords")};
    // console.log("moving", move);
    if(chess.move(move)) {
        // console.log("destination has ", square.children().length);
        square.empty()
        // console.log("emptied, now has ", square.children().length);
        square.append(piece.detach().css({top: 0,left: 0}));
        // console.log("added, now has ", square.children().length);
        piece.attr("data-coords", square.attr("data-coords"));
        hideMoves();
        $(".pgn").html(chess.pgn({ max_width: 5, newline_char: '<br/>' }));
    } else {
        origin = $(".square[data-coords = " + piece.attr("data-coords") + "]");
        // origin.empty();
        origin.append(piece.detach().css({top: 0,left: 0}));
        piece.click();
    }
}

function enableDragging() {
    $('.square').droppable({
        tolerance: 'intersect',
        drop: function(event, ui) {
            square = $(this);
            piece = ui.draggable;
            pieceToSquare(piece).css({zIndex:99});
            makeMove(piece, square);
        }
    });
    
    $('.piece').draggable({
        start: function (event, ui) {
            pieceToSquare(this).css({zIndex: 100});
        },
        revertDuration: 0,
        revert: 'invalid',
        scroll: false,
    });
}



function setUpFEN(fen) {
    x = 0;
    y = 0;
    fen.split('').forEach(function(letter) {
        color = false;
        if(letter=='/') {
            y++;
            x=0;
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
}