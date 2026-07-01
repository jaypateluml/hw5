# HW5 - Scrabble Drag and Drop

Jay Patel
COMP 4610 GUI I - Homework 5

GitHub Pages (single line): https://jaypateluml.github.io/hw5/index.html
GitHub Pages (full board): https://jaypateluml.github.io/hw5/full-board.html
GitHub Repo: https://github.com/jaypateluml/hw5

## Working features

- 7 random tiles dealt from the 100 tile bag (right distribution, from pieces.json)
- drag tiles from the rack to the board with jQuery UI
- bad drops bounce back to the rack
- placed tiles lock until submit/clear/restart
- tiles after the first have to touch the word in one line, no gaps
- word + score update live, with the bonus squares
- Submit Word only scores real words, keeps a round history + total
- board clears after each word, rack refills back to 7
- Clear Board, Deal New Tiles, Restart Game all work

## Extra credit

- full board version (full-board.html), single line still included
- word check against words.txt (/usr/share/dict/words)

## Notes

- blank tiles score 0, it asks what letter you want

## Sources

- pieces.json from Ramon Meza and Jason Downing (came with the hw)
- tile images + rack picture came with the hw
- jquery 1.11.0 from the week 5 examples, jquery ui from the cdn
