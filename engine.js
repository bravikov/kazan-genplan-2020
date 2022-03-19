let workspaceContainer = document.createElement("div");
workspaceContainer.id = "workspace";

let pretilesContainer = document.createElement("div");
pretilesContainer.id = "pretiles";
workspaceContainer.appendChild(pretilesContainer);

let tilesContainer = document.createElement("div");
tilesContainer.id = "tiles";
pretilesContainer.appendChild(tilesContainer);

function main() {

// Включает и отключает отладочный вывод.
const isDebug = false;

if (isDebug) {
    var debug = console.log.bind(window.console)
}
else {
    var debug = function(){}
}

// Размер тайла. Тайл квадратный: 256 x 256 пикселей.
const tileSize = 256;

const tilesLevelCount = tilesConfig.levels.length;

let tilesLevel = Math.floor(tilesLevelCount / 2);

class Point {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }
}

class Size {
    constructor(width, height) {
        this.width = width;
        this.height = height;
    }
}

function getTilesCenter() {
    const level = tilesConfig.levels[tilesLevel]
    const width = (level.tileCount.x - 1) * tileSize + level.lastTileSize.width;
    const height = (level.tileCount.y - 1) * tileSize + level.lastTileSize.height;
    return new Point(width / 2, height / 2);
}

function getWorkspaceSize() {
    return new Size(workspaceContainer.offsetWidth, workspaceContainer.offsetHeight);
}

/* Координаты начального тайла.
    * Начальный тайл рисуется в левом верхнем углу тайлового контейнера.
    * Начальная позиция расчитывается так, чтобы центр изображения был в центре видимой области.
    * Координаты меняются при перемещении тайлового контейнера. */

    let startTilePosition = new Point(0, 0);

function setStartTilePosition(position) {
    startTilePosition = position;
    debug("Start tile position:", startTilePosition.x, startTilePosition.y)
}

function setStartTilePositionByXY(x, y) {
    setStartTilePosition(new Point(x, y));
}

// Координаты тайлового контейнера. Меняются при перемещении контейнера.
let tilesContainerX = 0;
let tilesContainerY = 0;

function placeElement(element, xPos, yPos) {
    element.style.transform = "translate3d(" + xPos + "px, " + yPos + "px, 0)";
}

function moveTiles(xPos, yPos) {
    placeElement(tilesContainer, xPos, yPos);
}

function setDefaultStartTilePosition() {
    const tilesCenter = getTilesCenter();
    const workspaceSize = getWorkspaceSize();
    const precisionStartTilePosition = new Point(
        Math.floor(tilesCenter.x - (workspaceSize.width / 2)),
        Math.floor(tilesCenter.y - (workspaceSize.height / 2)),
    );

    tilesContainerX = -(precisionStartTilePosition.x % tileSize);
    tilesContainerY = -(precisionStartTilePosition.y % tileSize);

    setStartTilePosition(precisionStartTilePosition);
    moveTiles(tilesContainerX, tilesContainerY);
}

setDefaultStartTilePosition();

// Флаг показывает, что тайловый контейнера неходится в режиме перемещения.
let tilesMoving = false;

const invalidTileNumber = -1;

function tileNumber(tilesCountX, tileX, tileY) {
    return tilesCountX * tileY + tileX;
}

class Tile {
    element;
}

let tilesMap = new Map();

function loadTiles() {
    // Количество тайлов по горизонтали.
    const tilesCountX = tilesConfig.levels[tilesLevel].tileCount.x;
    // Количество тайлов по вертикали.
    const tilesCountY = tilesConfig.levels[tilesLevel].tileCount.y;

    let startTileX = Math.floor(startTilePosition.x / tileSize);
    let startTileY = Math.floor(startTilePosition.y / tileSize);
    
    const workspaceWidth = workspaceContainer.offsetWidth;
    const workspaceHeight = workspaceContainer.offsetHeight;
    
    // На один тайл больше, чтобы при перемещении карты вправо не было пустого места слева.
    workspaceTilesCountX = Math.ceil(workspaceWidth / tileSize) + 1;
    workspaceTilesCountY = Math.ceil(workspaceHeight / tileSize) + 1;

    let tiles = []

    for (let y = 0; y < workspaceTilesCountY; y++) {
        let xTiles = []
        const tileY = startTileY + y;
        if (tileY >= tilesCountY) {
            break;
        }
        for (let x = 0; x < workspaceTilesCountX; x++) {
            const tileX = startTileX + x;
            if (tileX >= tilesCountX) {
                break;
            }
            let n = invalidTileNumber;
            if (tileX >= 0 && tileY >= 0) {
                n = tileNumber(tilesCountX, tileX, tileY);
            }
            xTiles.push(n);
        }
        tiles.push(xTiles);
    }

    let visibleTilesNumbers = new Set();

    // Отрисовка тайлов.
    for (let y = 0; y < tiles.length; y++) {
        for (let x = 0; x < tiles[y].length; x++) {
            let tileImg = document.createElement("img");
            tileImg.className = "tile";
            const tileNumber = tiles[y][x];
            if (tileNumber === invalidTileNumber) {
                continue;
            }
            visibleTilesNumbers.add(tileNumber);
            if (tilesMap.has(tileNumber)) {
                continue;
            }
            tileImg.src = "tiles/" + tilesLevel + "/tile-" + tileNumber + ".png";

            let offsetX = 0;
            let offsetY = 0;
            if (tilesContainerX !== 0) {
                offsetX = tileSize * (Math.floor(tilesContainerX / tileSize) + 1);
            }
            if (tilesContainerY !== 0) {
                offsetY = tileSize * (Math.floor(tilesContainerY / tileSize) + 1);
            }

            const elementPositionX = x * tileSize - offsetX;
            const elementPositionY = y * tileSize - offsetY;
            placeElement(tileImg, elementPositionX, elementPositionY);
            tilesContainer.appendChild(tileImg);
            let tile = new Tile();
            tile.element = tileImg;
            tilesMap.set(tileNumber, tile);
        }
    }

    // Удаление тайлов, которых не видно.
    tilesMap.forEach((value, key, map) => {
        if (visibleTilesNumbers.has(key)) {
            return;
        }
        else {
            value.element.remove();
            map.delete(key);
        }
    });
}

moveTiles(tilesContainerX, tilesContainerY);
loadTiles();

workspaceContainer.addEventListener('pointerdown', e => {
    tilesMoving = true;
    workspaceContainer.style.cursor = "grabbing";
});

workspaceContainer.addEventListener('pointerup', e => {
    if (tilesMoving === true) {
        tilesMoving = false;
        workspaceContainer.style.cursor = "default";
        loadTiles();
    }
});

workspaceContainer.addEventListener('pointermove', e => {
    if (tilesMoving === true) {
        const newTilesContainerX = tilesContainerX + e.movementX;
        const newTilesContainerY = tilesContainerY + e.movementY;

        setStartTilePositionByXY(
            startTilePosition.x + tilesContainerX - newTilesContainerX,
            startTilePosition.y + tilesContainerY - newTilesContainerY
        );

        tilesContainerX = newTilesContainerX;
        tilesContainerY = newTilesContainerY;

        moveTiles(newTilesContainerX, newTilesContainerY);
    }
});

let mousePositionX = 0;
let mousePositionY = 0;
document.addEventListener('pointermove', event => {
    mousePositionX = event.clientX;
    mousePositionY = event.clientY;
});

workspaceContainer.addEventListener("wheel", event => {
    const zoomIn = Math.sign(event.deltaY) == -1;
    let scale = 0;
    if (zoomIn) {
        debug("Zoom in.");
        if (tilesLevel > 0) {
            tilesLevel -= 1;
            scale = 2;
        }
        else {
            return;
        }
    }
    else {
        debug("Zoom out.");
        if (tilesLevel < tilesLevelCount - 1) {
            tilesLevel += 1;
            scale = 0.5;
        }
        else {
            return;
        }
    }
    const workspaceSize = getWorkspaceSize();

    const center = new Point(
        Math.floor((startTilePosition.x + mousePositionX) * scale),
        Math.floor((startTilePosition.y + mousePositionY) * scale)
    );

    // Удаление всех тайлов.
    tilesMap.forEach((value, key, map) => {
        value.element.remove();
        map.delete(key);
    });

    let precisionStartTilePosition = center;
    precisionStartTilePosition.x -= mousePositionX;
    precisionStartTilePosition.y -= mousePositionY;

    tilesContainerX = -(precisionStartTilePosition.x % tileSize);
    tilesContainerY = -(precisionStartTilePosition.y % tileSize);

    setStartTilePosition(precisionStartTilePosition);
    moveTiles(tilesContainerX, tilesContainerY);
    loadTiles();
});

} // function main()

window.onload = function() {
    document.getElementsByTagName("body")[0].appendChild(workspaceContainer);
    document.getElementsByTagName("title")[0].innerHTML = "test";
    main();
};
