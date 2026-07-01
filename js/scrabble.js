// Jay Patel
// COMP 4610 GUI I - Homework 5
// GitHub: https://github.com/jaypateluml/hw5
//
// sources i used:
// - pieces.json is from Ramon Meza and Jason Downing (came with the hw)
// - the tile pictures and the wooden rack image came with the assignment
// - jquery 1.11.0 is the one from the week 5 examples, jquery ui is from the cdn
// - words.txt is just /usr/share/dict/words for the extra credit word check

$(function() {
    var RACK_SIZE = 7;
    var boardMode = $("body").attr("data-board");   // line or full, i put it on the body tag
    var tileData = null;
    var dictionary = {};
    var dictionaryLoaded = false;

    // all the game arrays and the score stuff
    var bag = [];
    var rack = [];
    var board = [];
    var boardLayout = [];
    var totalScore = 0;
    var round = 1;
    var nextTileId = 1;

    // bonus squares for the single line board
    var lineCodes = ["TW", "", "DL", "", "", "TL", "", "DW", "", "TL", "", "", "DL", "", "TW"];
    // the whole 15x15 board bonuses
    var fullCodes = [
        ["TW", "", "", "DL", "", "", "", "TW", "", "", "", "DL", "", "", "TW"],
        ["", "DW", "", "", "", "TL", "", "", "", "TL", "", "", "", "DW", ""],
        ["", "", "DW", "", "", "", "DL", "", "DL", "", "", "", "DW", "", ""],
        ["DL", "", "", "DW", "", "", "", "DL", "", "", "", "DW", "", "", "DL"],
        ["", "", "", "", "DW", "", "", "", "", "", "DW", "", "", "", ""],
        ["", "TL", "", "", "", "TL", "", "", "", "TL", "", "", "", "TL", ""],
        ["", "", "DL", "", "", "", "DL", "", "DL", "", "", "", "DL", "", ""],
        ["TW", "", "", "DL", "", "", "", "ST", "", "", "", "DL", "", "", "TW"],
        ["", "", "DL", "", "", "", "DL", "", "DL", "", "", "", "DL", "", ""],
        ["", "TL", "", "", "", "TL", "", "", "", "TL", "", "", "", "TL", ""],
        ["", "", "", "", "DW", "", "", "", "", "", "DW", "", "", "", ""],
        ["DL", "", "", "DW", "", "", "", "DL", "", "", "", "DW", "", "", "DL"],
        ["", "", "DW", "", "", "", "DL", "", "DL", "", "", "", "DW", "", ""],
        ["", "DW", "", "", "", "TL", "", "", "", "TL", "", "", "", "DW", ""],
        ["TW", "", "", "DL", "", "", "", "TW", "", "", "", "DL", "", "", "TW"]
    ];

    // hook up all the buttons
    $("#submit-word").on("click", submitWord);
    $("#clear-board").on("click", function() {
        clearBoard(true);
    });
    $("#new-tiles").on("click", dealNewRack);
    $("#restart-game").on("click", restartGame);

    // buttons off till the files load, then load everything
    turnButtonsOff();
    loadPieces();
    loadDictionary();

    // get the tile info from the json file (like the week 5 ajax example)
    function loadPieces() {
        var xhr = new XMLHttpRequest();

        xhr.onload = function() {
            // status 0 is for when i just open the file localy
            if (xhr.status === 200 || xhr.status === 0) {
                tileData = JSON.parse(xhr.responseText);
                restartGame();
            } else {
                setMessage("Could not load graphics_data/pieces.json.", true);
            }
        };

        xhr.open("GET", "graphics_data/pieces.json", true);
        xhr.send("");
    }

    // load the big word list so i can check words later
    function loadDictionary() {
        var xhr = new XMLHttpRequest();

        xhr.onload = function() {
            var lines;
            var i;
            var word;

            if (xhr.status === 200 || xhr.status === 0) {
                // one word per line, put them all in lowercase
                lines = xhr.responseText.split(/\r?\n/);
                for (i = 0; i < lines.length; i += 1) {
                    word = lines[i].toLowerCase();
                    if (word.length > 0) {
                        dictionary[word] = true;
                    }
                }
                dictionaryLoaded = true;
                updateDisplay();
            } else {
                $("#word-check").text("Word list did not load");
            }
        };

        xhr.open("GET", "data/words.txt", true);
        xhr.send("");
    }

    // start a fresh game
    function restartGame() {
        if (tileData === null) {
            return;
        }

        bag = buildBag();
        rack = [];
        board = [];
        totalScore = 0;
        round = 1;
        nextTileId = 1;

        $("#history").html("");
        buildBoard();
        refillRack();
        setMessage("New game started. Drag a tile from the rack to the board.", false);
    }

    // build the tile bag from the json
    function buildBag() {
        var newBag = [];
        var pieces = tileData.pieces;
        var foundBlank = false;
        var i;
        var j;
        var piece;
        var letter;

        for (i = 0; i < pieces.length; i += 1) {
            piece = pieces[i];
            letter = piece.letter.toUpperCase();

            if (letter === "_" || letter === "BLANK") {
                foundBlank = true;
                letter = "_";
            }

            // add that letter how ever many times the json says
            for (j = 0; j < Number(piece.amount); j += 1) {
                newBag.push({
                    letter: letter,
                    value: Number(piece.value),
                    image: tileImagePath(letter)
                });
            }
        }

        // the json only has the letters so i add the 2 blanks myself
        if (!foundBlank) {
            for (j = 0; j < 2; j += 1) {
                newBag.push({
                    letter: "_",
                    value: 0,
                    image: tileImagePath("_")
                });
            }
        }

        return newBag;
    }

    // find the right picture for a letter
    function tileImagePath(letter) {
        if (letter === "_") {
            return "graphics_data/Scrabble_Tile_Blank.jpg";
        }
        return "graphics_data/Scrabble_Tile_" + letter + ".jpg";
    }

    // draw the board squares
    function buildBoard() {
        var $board = $("#board");
        var rows;
        var row;
        var col;
        var square;
        var index;
        var $row;
        var $square;
        var label;

        boardLayout = [];
        $board.html("");
        $board.removeClass("full line");

        // pick which layout to use
        if (boardMode === "full") {
            rows = fullCodes;
            $board.addClass("full");
        } else {
            rows = [lineCodes];
            $board.addClass("line");
        }

        // make each square and remember its bonus
        for (row = 0; row < rows.length; row += 1) {
            $row = $("<div class='board-row'></div>");

            for (col = 0; col < rows[row].length; col += 1) {
                index = boardLayout.length;
                square = makeSquare(rows[row][col], row, col, index);
                boardLayout.push(square);
                board.push(null);

                label = square.label;
                if (label === "") {
                    label = "&nbsp;";
                }

                $square = $("<div class='square " + square.type + "'></div>");
                $square.attr("data-index", index);
                $square.attr("title", "row " + (row + 1) + ", column " + (col + 1));
                $square.html("<span>" + label + "</span>");
                $square.appendTo($row);
            }

            $row.appendTo($board);
        }

        // let the tiles be droped on the squares
        $(".square").droppable({
            tolerance: "intersect",
            accept: function($tile) {
                return canPlaceTile($(this).attr("data-index"), $tile.attr("data-tile-id"));
            },
            drop: function(event, ui) {
                placeTile($(this), ui.draggable);
            }
        });
    }

    // turn a code like DL into a square object with its multipliers
    function makeSquare(code, row, col, index) {
        var square = {
            row: row,
            col: col,
            index: index,
            type: "plain",
            label: "",
            letter: 1,
            word: 1
        };

        if (code === "DL") {
            square.type = "double-letter";
            square.label = "DL";
            square.letter = 2;
        } else if (code === "TL") {
            square.type = "triple-letter";
            square.label = "TL";
            square.letter = 3;
        } else if (code === "DW") {
            square.type = "double-word";
            square.label = "DW";
            square.word = 2;
        } else if (code === "TW") {
            square.type = "triple-word";
            square.label = "TW";
            square.word = 3;
        } else if (code === "ST") {
            square.type = "start";
            square.label = "STAR";
            square.word = 2;
        }

        return square;
    }

    // top the rack back up to 7
    function refillRack() {
        dealTiles(RACK_SIZE - rack.length);
        renderRack();
    }

    // pull random tiles out of the bag
    function dealTiles(count) {
        var i;
        var bagIndex;
        var drawnTile;

        for (i = 0; i < count && bag.length > 0; i += 1) {
            bagIndex = Math.floor(Math.random() * bag.length);
            drawnTile = bag.splice(bagIndex, 1)[0];
            drawnTile.id = nextTileId;
            drawnTile.blankLetter = "";
            nextTileId += 1;
            rack.push(drawnTile);
        }
    }

    // show the rack tiles and make them dragable
    function renderRack() {
        var i;
        var tile;
        var altText;
        var $tile;

        $("#rack").html("");

        for (i = 0; i < rack.length; i += 1) {
            tile = rack[i];
            altText = tile.letter + " tile";
            if (tile.letter === "_") {
                altText = "Blank tile";
            }

            $tile = $("<img>");
            $tile.addClass("tile");
            $tile.attr("src", tile.image);
            $tile.attr("alt", altText);
            $tile.attr("title", altText + ", " + tile.value + " points");
            $tile.attr("data-tile-id", tile.id);
            $tile.appendTo("#rack");

            $tile.draggable({
                containment: "document",
                revert: "invalid",
                scroll: false,
                start: function() {
                    // while draging, mark the squares you cant use
                    markBlockedSquares($(this).attr("data-tile-id"));
                },
                stop: function() {
                    $(".square").removeClass("blocked");
                }
            });
        }

        updateDisplay();
    }

    // check if a tile is allowed on this square
    function canPlaceTile(indexText, tileIdText) {
        var index = Number(indexText);
        var tileId = Number(tileIdText);
        var placed;
        var trial;

        if (board[index] !== null) {
            return false;
        }

        if (findRackTile(tileId) === null) {
            return false;
        }

        // first tile can go anywhere
        placed = getPlacedEntries();
        if (placed.length === 0) {
            return true;
        }

        // after that it has to touch and stay in one straight line with no gaps
        if (!touchesAnotherSquare(index, placed)) {
            return false;
        }

        trial = placed.slice(0);
        trial.push({
            index: index,
            square: boardLayout[index],
            tile: null
        });

        return positionsAreInOneLine(trial) && positionsAreContiguous(trial);
    }

    // is this square right next to one thats already down
    function touchesAnotherSquare(index, placed) {
        var square = boardLayout[index];
        var other;
        var i;

        for (i = 0; i < placed.length; i += 1) {
            other = placed[i].square;
            if (square.row === other.row && Math.abs(square.col - other.col) === 1) {
                return true;
            }
            if (square.col === other.col && Math.abs(square.row - other.row) === 1) {
                return true;
            }
        }

        return false;
    }

    // all the tiles have to be in the same row or same colmun
    function positionsAreInOneLine(entries) {
        var sameRow = true;
        var sameCol = true;
        var row = entries[0].square.row;
        var col = entries[0].square.col;
        var i;

        for (i = 1; i < entries.length; i += 1) {
            if (entries[i].square.row !== row) {
                sameRow = false;
            }
            if (entries[i].square.col !== col) {
                sameCol = false;
            }
        }

        return sameRow || sameCol;
    }

    // no gaps between the tiles
    function positionsAreContiguous(entries) {
        var sorted = entries.slice(0);
        var direction = wordDirection(entries);
        var i;

        sortEntries(sorted, direction);

        for (i = 1; i < sorted.length; i += 1) {
            if (direction === "column") {
                if (sorted[i].square.row !== sorted[i - 1].square.row + 1) {
                    return false;
                }
            } else {
                if (sorted[i].square.col !== sorted[i - 1].square.col + 1) {
                    return false;
                }
            }
        }

        return true;
    }

    // figure out if the word goes across or down
    function wordDirection(entries) {
        var sameCol = true;
        var col = entries[0].square.col;
        var i;

        if (entries.length < 2) {
            return "row";
        }

        for (i = 1; i < entries.length; i += 1) {
            if (entries[i].square.col !== col) {
                sameCol = false;
            }
        }

        if (sameCol) {
            return "column";
        }
        return "row";
    }

    // put the tiles in reading order (left to right or top to bottom)
    function sortEntries(entries, direction) {
        entries.sort(function(a, b) {
            if (direction === "column") {
                return a.square.row - b.square.row;
            }
            return a.square.col - b.square.col;
        });
    }

    // red outline the squares you cant drop on right now
    function markBlockedSquares(tileId) {
        $(".square").each(function() {
            if (canPlaceTile($(this).attr("data-index"), tileId)) {
                $(this).removeClass("blocked");
            } else {
                $(this).addClass("blocked");
            }
        });
    }

    // actually drop the tile onto the square
    function placeTile($square, $tile) {
        var tileId = Number($tile.attr("data-tile-id"));
        var index = Number($square.attr("data-index"));
        var tile = findRackTile(tileId);
        var blankChoice;

        if (tile === null || !canPlaceTile(index, tileId)) {
            return;
        }

        // ask what letter a blank tile should be
        if (tile.letter === "_" && tile.blankLetter === "") {
            blankChoice = window.prompt("Enter the letter for this blank tile:", "");
            if (blankChoice !== null && blankChoice.length > 0) {
                tile.blankLetter = blankChoice.charAt(0).toUpperCase();
            }
        }

        board[index] = tile;
        removeRackTile(tileId);

        // lock the tile so you cant drag it again
        $tile.detach();
        $tile.removeAttr("style");
        $tile.addClass("locked");
        $tile.draggable("disable");
        $tile.appendTo($square);

        // the DL/TW label was pushing the tile down and out of the square,
        // so hide it once a tile lands here
        $square.children("span").hide();

        // if its a blank, draw the letter the player picked on top of the tile
        if (tile.letter === "_" && tile.blankLetter !== "") {
            $square.append("<span class='blank-letter'>" + tile.blankLetter + "</span>");
        }

        setMessage("Tile placed. The word and score were updated.", false);
        updateDisplay();
    }

    // find a tile in the rack by its id
    function findRackTile(tileId) {
        var i;

        for (i = 0; i < rack.length; i += 1) {
            if (rack[i].id === tileId) {
                return rack[i];
            }
        }

        return null;
    }

    // take a tile out of the rack
    function removeRackTile(tileId) {
        var newRack = [];
        var i;

        for (i = 0; i < rack.length; i += 1) {
            if (rack[i].id !== tileId) {
                newRack.push(rack[i]);
            }
        }

        rack = newRack;
    }

    // grab everything thats on the board right now
    function getPlacedEntries() {
        var entries = [];
        var i;

        for (i = 0; i < board.length; i += 1) {
            if (board[i] !== null) {
                entries.push({
                    index: i,
                    square: boardLayout[i],
                    tile: board[i]
                });
            }
        }

        return entries;
    }

    // same thing but in reading order
    function currentWordEntries() {
        var entries = getPlacedEntries();

        if (entries.length === 0) {
            return entries;
        }

        sortEntries(entries, wordDirection(entries));
        return entries;
    }

    // build the word string from the tiles on the board
    function currentWord() {
        var entries = currentWordEntries();
        var word = "";
        var i;
        var tile;

        for (i = 0; i < entries.length; i += 1) {
            tile = entries[i].tile;
            // blanks use the letter the player picked
            if (tile.letter === "_" && tile.blankLetter !== "") {
                word += tile.blankLetter;
            } else {
                word += tile.letter;
            }
        }

        if (word === "") {
            return "-";
        }

        return word;
    }

    // add up the score with the bonus squares
    function scoreCurrentWord() {
        var entries = currentWordEntries();
        var subtotal = 0;
        var wordMultiplier = 1;
        var i;
        var square;

        for (i = 0; i < entries.length; i += 1) {
            square = entries[i].square;
            // letter bonus adds to the tile, word bonus multiplys the whole word
            subtotal += entries[i].tile.value * square.letter;
            wordMultiplier = wordMultiplier * square.word;
        }

        return subtotal * wordMultiplier;
    }

    // is the word actually in the dictionary
    function wordIsValid() {
        var word = currentWord().toLowerCase();

        if (word === "-" || word.indexOf("_") !== -1) {
            return false;
        }

        return dictionary[word] === true;
    }

    // refresh all the score boxes and the check message
    function updateDisplay() {
        var word = currentWord();
        var placed = currentWordEntries();

        $("#current-word").text(word);
        $("#current-score").text(scoreCurrentWord());
        $("#total-score").text(totalScore);
        $("#tiles-left").text(bag.length);

        // little message that tells you if the word is good
        if (placed.length === 0) {
            $("#word-check").text("No word yet");
        } else if (!dictionaryLoaded) {
            $("#word-check").text("Loading word list...");
        } else if (word.indexOf("_") !== -1) {
            $("#word-check").text("Blank needs a letter");
        } else if (wordIsValid()) {
            $("#word-check").text("Valid word");
        } else {
            $("#word-check").text("Not in word list");
        }

        // turn the buttons on/off depending on whats on the board
        $("#submit-word").prop("disabled", placed.length === 0);
        $("#clear-board").prop("disabled", placed.length === 0);
        $("#new-tiles").prop("disabled", placed.length > 0 || bag.length === 0);
    }

    // submit the word if its real
    function submitWord() {
        var word = currentWord();
        var score = scoreCurrentWord();

        if (currentWordEntries().length === 0) {
            setMessage("Place at least one tile before submitting.", true);
            return;
        }

        if (!dictionaryLoaded) {
            setMessage("The word list is still loading. Please try again.", true);
            return;
        }

        // dont score it if its not a real word
        if (!wordIsValid()) {
            setMessage(word + " is not in the word list, so it was not scored.", true);
            return;
        }

        // good word, add the score and put it in the history
        totalScore += score;
        $("#history").prepend("<li>Round " + round + ": " + word + " scored " + score + "</li>");
        round += 1;

        clearBoard(false);
        refillRack();
        setMessage(word + " was submitted for " + score + " point(s).", false);
    }

    // take everything off the board
    function clearBoard(returnTiles) {
        var i;

        for (i = 0; i < board.length; i += 1) {
            // put the tiles back on the rack if the player hit clear
            if (board[i] !== null && returnTiles) {
                rack.push(board[i]);
            }
            board[i] = null;
        }

        $(".square .tile").remove();
        // clean up the blank letters and put the bonus labels back
        $(".square .blank-letter").remove();
        $(".square").children("span").show();
        renderRack();

        if (returnTiles) {
            setMessage("Board cleared. The tiles were returned to the rack.", false);
        }
    }

    // swap the whole rack for new tiles
    function dealNewRack() {
        var i;

        if (currentWordEntries().length > 0) {
            setMessage("Clear or submit the board before dealing new tiles.", true);
            return;
        }

        // throw the old tiles back in the bag first
        for (i = 0; i < rack.length; i += 1) {
            bag.push({
                letter: rack[i].letter,
                value: rack[i].value,
                image: rack[i].image
            });
        }

        rack = [];
        refillRack();
        setMessage("A new rack was dealt.", false);
    }

    // all buttons off, used at the very start
    function turnButtonsOff() {
        $("#submit-word").prop("disabled", true);
        $("#clear-board").prop("disabled", true);
        $("#new-tiles").prop("disabled", true);
    }

    // show a message, red if its a warning
    function setMessage(message, warning) {
        $("#message").text(message);
        if (warning) {
            $("#message").addClass("warning");
        } else {
            $("#message").removeClass("warning");
        }
    }
});
