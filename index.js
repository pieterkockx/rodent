(function() {
  "use strict";

  function draw(canvas, map, img) {
    let context;

    context = canvas.getContext("2d");

    context.clearRect(0, 0, canvas.width, canvas.height);
    window.requestAnimationFrame(redraw);

    function redraw() {
      window.requestAnimationFrame(redraw);
      context.clearRect(0, 0, canvas.width, canvas.height);

      for (let col = 0; col < map.cols; col++) {
        for (let row = 0; row < map.rows; row++) {
          let tile = getTile(map, col, row);

          context.drawImage(img, 0, 0, map.side, map.side, col * map.side, row * map.side, map.side, map.side);
          if (tile > 1 && tile <= map.tiles) {
            context.drawImage(img, (tile - 1) * map.side, 0, map.side, map.side, col * map.side, row * map.side, map.side, map.side);
          }
        }
      }
    }
  }

  function move(map, col, row, dir) {
    let newidx, newrow, newcol;
    let curidx, curval;

    if (overBoundary(map.cols, map.rows, col, row)) {
      return false;
    }

    newcol = moveCol(col, dir);
    newrow = moveRow(row, dir);

    curidx = getTileIndex(map.cols, col, row);
    curval = getTile(map, col, row);
    newidx = getTileIndex(map.cols, newcol, newrow);

    switch (curval) {
    case 1:
      return true;
    case 2:
      return false;
    case 4:
    case 5:
    case 3:
      if (move(map, newcol, newrow, dir)) {
        let newval = getTile(map, newcol, newrow);

        moveTo(map, curidx, newidx, newval, curval);

        return true;
      }
    }

    return false;
  }

  function overBoundary(maxcols, maxrows, col, row) {
    if (col < 0 || row < 0) {
      return true;
    }
    if (col === maxcols || row === maxrows) {
      return true;
    }

    return false;
  }

  function moveTo(map, oldidx, newidx, oldval, newval) {
    map.map[oldidx] = oldval;
    map.map[newidx] = newval;
  }

  function moveCol(col, dir) {
    switch (dir) {
    case "UP":
      return col;
    case "DOWN":
      return col;
    case "LEFT":
      return col - 1;
    case "RIGHT":
      return col + 1;
    }
  }

  function moveRow(row, dir) {
    switch (dir) {
    case "UP":
      return row - 1;
    case "DOWN":
      return row + 1;
    case "LEFT":
      return row;
    case "RIGHT":
      return row;
    }
  }

  function getTileIndex(maxcols, col, row) {
    return row * maxcols + col;
  }

  function getTile(map, col, row) {
    return map.map[getTileIndex(map.cols, col, row)];
  }

  function newPlayer(map, model, startCol, startRow, type, setupInput) {
    let player;

    player = Object.create(null);
    player.map = map;
    player.model = model;
    player.col = startCol;
    player.row = startRow;
    player.orient = "RIGHT";
    player.type = type;
    map.map[getTileIndex(map.cols, startCol, startRow)] = model;
    setupInput(player);

    return player;
  }

  window.onload = function() {
    let canvas, map, editor, menu, grid, img, players;

    canvas = document.getElementById("main-canvas");
    editor = document.getElementById("editor-grid");
    menu = document.getElementById("editor-menu");
    map = createMap(16, 16, 32, 5);

    grid = createGrid(map);
    editor.appendChild(grid);

    players = [];
    players.push(newPlayer(map, 3, 1, 0, null, setupPlayer));
    players.push(newPlayer(map, 4, 0, 1, playComputer, setupComputer));

    img = loadImage("assets/tiles.png");
    img.addEventListener("load", function() {
      fillMenu(menu, img, map.side, map.tiles);
      draw(canvas, map, img);
    }, false);

    function createMap(cols, rows, side, tiles) {
      let obj;

      obj = Object.create(null);
      obj.cols = cols;
      obj.rows = rows;
      obj.side = side;
      obj.tiles = tiles;
      obj.map = [];
      for (let i = 0; i < cols * rows; i++) {
        obj.map.push(1);
      }

      return obj;
    }
    function loadImage(src) {
      let img = new Image();

      img.src = src;

      return img;
    }
    function fillMenu(parent, img, side, tiles) {
      for (let tile = 0; tile < tiles; tile++) {
        let canvas, context;

        canvas = newElement("canvas", {
          width: side,
          height: side,
          draggable: "true"
        });
        canvas.addEventListener("dragstart", function(ev) {
          ev.dataTransfer.setData("text/plain", tile + 1);
        });
        context = canvas.getContext("2d");
        context.drawImage(img, tile * side, 0, side, side, 0, 0, side, side);
        parent.appendChild(canvas);
      }
    }
    function createGrid(map) {
      let table, tbody;

      tbody = newElement("tbody", null);
      table = newElement("table", null, tbody);
      for (let r = 0; r < map.cols; r++) {
        let tr = newElement("tr", {class: "editor-tr"});

        for (let c = 0; c < map.rows; c++) {
          let input = newElement("input", {
            type: "text",
            class: "editor-input",
            size: "2",
            maxlength: Math.ceil(Math.log10(map.tiles)),
            style: `width:${map.side - 2}px;height:${map.side - 2}px;border:none;padding:2px;`
          });

          input.addEventListener("change", function(ev) {
            let int = parseInt(ev.target.value);
            let idx = getTileIndex(map.cols, c, r);

            map.map[idx] = int;
            input.value = "";
          });
          input.addEventListener("focusin", function() {
            let idx = getTileIndex(map.cols, c, r);

            input.setAttribute("placeholder", map.map[idx]);
          });
          input.addEventListener("focusout", function() {
            input.setAttribute("placeholder", "");
          });
          tr.appendChild(newElement("td", {class: "editor-td"}, input));
        }
        tbody.appendChild(tr);
      }

      return table;
    }
    function setupComputer(self) {
      window.setInterval(self.type, 500, self.map, self);
    }
    function playComputer(map, self) {
      let n_0;
      const dir = ["RIGHT", "DOWN", "LEFT", "UP"];

      n_0 = dir.indexOf(self.orient);
      for (let n = 0; n < dir.length; n++) {
        let i = (n_0 + n) % dir.length;

        if (move(map, self.col, self.row, dir[i])) {
          self.col = moveCol(self.col, dir[i]);
          self.row = moveRow(self.row, dir[i]);
          if (self.orient !== dir[i]) {
            self.orient = dir[(i - 1 + dir.length) % dir.length];
          } else {
            self.orient = dir[i];
          }

          return true;
        }
      }

      return false;
    }
    function setupPlayer(self) {
      window.addEventListener("keydown", function(ev) {
        switch (ev.keyCode) {
        case 38:

          /* UP */
          handleKey(ev, "UP");
          break;
        case 40:

          /* DOWN */
          handleKey(ev, "DOWN");
          break;
        case 37:

          /* LEFT */
          handleKey(ev, "LEFT");
          break;
        case 39:

          /* RIGHT */
          handleKey(ev, "RIGHT");
          break;
        }
        function handleKey(ev, dir) {
          ev.preventDefault();
          if (move(map, self.col, self.row, dir)) {
            self.col = moveCol(self.col, dir);
            self.row = moveRow(self.row, dir);
          }
        }
      });
    }
  }
  ;

  function newElement(name, attributes) {
    let node = document.createElement(name);

    if (attributes) {
      for (let attr in attributes) {
        if (attributes.hasOwnProperty(attr)) {
          node.setAttribute(attr, attributes[attr]);
        }
      }
    }
    for (let i = 2; i < arguments.length; i++) {
      let child = arguments[i];

      if (typeof child === "string") {
        child = document.createTextNode(child);
      }
      node.appendChild(child);
    }

    return node;
  }

}());
