
var canvas;
var ctx;
var currentGame;

var Settings = {
    darkColor: "#999",
    lightColor: "#fff",
    crossColor: "#0f0",
    labelColor: "#000",
    scoreColor: "#f00",
    boldFont: "bold 46px Arial",
    lineLength: 26,
    lineWidth: 6,
    width: 0,
    height: 0,
    cardHeight: 311,
    cardWidth: 205,
    faceHeight: 128,
    faceWidth: 128,
    textBoxWidth: 250,
    textBoxHeight: 130,
    rendererHeight: 373,
    rendererWidth: 373,
    _rendererRadius: null,
    _radius: null,
    get rendererRadius(){
        if (this._rendererRadius) return this._rendererRadius;
        return this._rendererRadius = Math.sqrt(2 * this.rendererHeight * this.rendererHeight) / 2;
    },
    get radius(){
        if (this._radius) return this._radius;
        return this._radius = Math.min(this.width, this.height) / 2 - 1;
    },
    get rendererScale(){
        return 0.5;
    },
    get scale(){
        return this.width / 724;
    },
    get centerPoint(){
        return {
            x: this.width / 2,
            y: this.height / 2
        };
    }
};

function main(){

    canvas = document.getElementById("main");
    Settings.width = canvas.width;
    Settings.height = canvas.height;

    ctx = canvas.getContext("2d");
    ctx.translate(Settings.centerPoint.x, Settings.centerPoint.y);

    var scale = Settings.scale;
    Settings.width = 724;
    Settings.height = 724;
    ctx.scale(scale, scale);
    ctx.font = Settings.boldFont;
    ctx.textAlign = "center";
    ctx.textBaseline = "baseline";

    RendererManager.init();
    currentGame = GameManager.pickGame(0);
    run();
}

function autoRun(){
    currentGame = GameManager.pickGame(0);
    do {
        run(true);
        postData();
    } while (currentGame = GameManager.nextGame());

    function postData(){
        var xhr = new XMLHttpRequest();
        xhr.open('POST', 'build.php?name=' + currentGame.getName(), false);
        xhr.send(canvas.toDataURL("image/png"));
    }
}

function runNext(){
    currentGame = GameManager.nextGame();
    run();
}
function runLast(){
    currentGame = GameManager.lastGame();
    run();
}
function runThis(){
    var index = parseInt(document.getElementById("current").value);
    if (isNaN) {
        index -= 1;
        currentGame = GameManager.pickGame(index);
        run();
    } else {
        alert("要输入数字噢！");
    }
}

function run(skipOutput){
    if (!currentGame) {
        return;
    }

    drawBoard();
    drawCards();
    drawTextBox();
    drawText();
    drawFace();
    drawCross();

    if (!skipOutput) exportImage();
}

function drawBoard(){
    if (currentGame.type == Game.TYPE_GENTLE) {
        ctx.fillStyle = Settings.darkColor;
        Utils.drawSector(ctx, Math.PI / 10, Math.PI * 3/2, Settings.radius, true, false);
        ctx.fillStyle = Settings.lightColor;
        Utils.drawSector(ctx, Math.PI / 10, Math.PI * 3/2, Settings.radius, true, true);
    } else {
        ctx.fillStyle = Settings.darkColor;
        Utils.drawSector(ctx, Math.PI * 9/10, Math.PI * 3/2, Settings.radius, true, false);
        ctx.fillStyle = Settings.lightColor;
        Utils.drawSector(ctx, Math.PI * 9/10, Math.PI * 3/2, Settings.radius, true, true);
    }
}

function drawCards(){

    var i = 0;
    do {
        var poker = currentGame.getNextPokerImage();
        if (poker) {
            var renderer = RendererManager.drawImage(i, poker);
            var pos = Utils.calculatePokerPosition(i);
            ctx.drawImage(renderer, pos.x, pos.y);
            i++;
        } else {
            break;
        }
    } while (true);

}

function drawTextBox(){
    ctx.fillStyle = Settings.lightColor;
    ctx.fillRect(
        -Settings.textBoxWidth/2,
        -Settings.textBoxHeight-Settings.faceHeight/2,
        Settings.textBoxWidth,
        Settings.textBoxHeight
    );
}

function drawText(){
    var text = currentGame.getSummaryText();
    ctx.fillStyle = Settings.labelColor;
    ctx.fillText(text.label, 0, - Settings.textBoxHeight / 2 - 10 - Settings.faceHeight / 2, Settings.textBoxWidth);
    ctx.fillStyle = Settings.scoreColor;
    ctx.fillText(text.score, 0, - Settings.faceHeight / 2 - 10, Settings.textBoxWidth);
}

function drawFace(){
    ctx.drawImage(currentGame.getFaceImage(), - Settings.faceHeight / 2, - Settings.faceWidth / 2);
}

function drawCross(){
    var halfLength = Settings.lineLength / 2;
    var halfWidth = Settings.lineWidth / 2;

    ctx.fillStyle = Settings.crossColor;
    ctx.fillRect(-halfWidth, -halfLength, Settings.lineWidth, Settings.lineLength);
    ctx.fillRect(-halfLength, -halfWidth, Settings.lineLength, Settings.lineWidth);
}

function exportImage(){
    var link = document.getElementById("image-link");
    link.style = "display: inline;";
    link.href = canvas.toDataURL("image/png");
    link.innerHTML = "Export image of record #" + (currentGame.id + 1);
}


var GameManager = {
    data: [],
    _current: 0,
    nextGame: function(){
        return this.pickGame(this._current + 1);
    },
    lastGame: function(){
        return this.pickGame(this._current - 1);
    },
    pickGame: function(index){
        var game = this.getGame(index);
        if (game) {
            this._current = parseInt(index);
        }
        return game;
    },
    getGame: function(index){
        index = parseInt(index);
        if (isNaN(index) || index < 0 || index > this.data.length - 1) {
            alert("没有这一局游戏噢！(范围1 ~ " + this.data.length + ")");
            return false;
        }
        var data = this.data[index];
        if (data) {
            return new Game(index, data);
        } else {
            return false;
        }
    },
    setData: function(rows){
        rows.map(function(row){
            GameManager.data.push(row.split(","));
        });
    }
};


function Game(id, pokerDataArr){
    this.id = id;
    this.pokers = pokerDataArr;
    this._pokerIndex = 0;

    this.type = Game.calculateGameType(this.id);
    this.isWinning = Game.calculateIsWinning(this.pokers, this.type);
    this.score = Game.calculateScore(this.type, this.isWinning);
}

Game.images = {};
Game.TYPE_THRILL = "thrill";
Game.TYPE_GENTLE = "gentle";
Game.calculateGameType = function(id){
    return id < 250 ? Game.TYPE_GENTLE : Game.TYPE_THRILL;
};
Game.calculateIsWinning = function(pokers, type){
    if (type == Game.TYPE_GENTLE) {
        return pokers.indexOf("0") < 7;
    } else {
        return pokers.indexOf("0") < 3;
    }
};
Game.calculateScore = function(type, isWinning){
    var absScore = type == Game.TYPE_GENTLE ? 5 : 25;
    return isWinning ? absScore : -absScore;
};

Game.prototype.getNextPokerImage = function(){
    if (this._pokerIndex < this.pokers.length) {
        return Utils.getImage("poker/" + this.pokers[this._pokerIndex++]);
    } else {
        return false;
    }
};
Game.prototype.getFaceImage = function(){
    return Utils.getImage("face/" + this.type + "-" + (this.isWinning ? "1" : "0"));
};
Game.prototype.getSummaryText = function(){
    var ret = {};
    if (this.score > 0) {
        ret.score = "+" + this.score;
    } else {
        ret.score = this.score.toString();
    }
    ret.label = this.isWinning ? "You Win!" : "You Lose!";
    return ret;
};
Game.prototype.getName = function(){
    var name = "";
    name += (this.isWinning ? "W" : "L");
    name += (this.type == Game.TYPE_GENTLE ? "70" : "30");
    name += "S";
    name += (this.id + 1).toString();
    name += "A";
    name += (this.pokers.indexOf("0") + 1).toString();
    return name;
};


var Utils = {

    images: {},
    getImage: function(name) {
        if (Utils.images[name]) return Utils.images[name];
        throw new Error("Unable to get image " + name);
    },
    loadImages: function(nameList){
        var count = nameList.length;
        nameList.map(function(name){
            var imageUrl = "images/" + name + ".jpg";
            var image = new Image();
            image.onload = function(){
                console.debug("Image " + imageUrl + " loaded.");
                if (--count === 0) {
                    console.log("All images are loaded!");
                }
            };
            image.src = imageUrl;
            Utils.images[name] = image;
        });
    },

    drawSector: function(ctx, startAngle, endAngle, radius, fill, anticlockwise){
        ctx.beginPath();
        //画出弧线
        ctx.arc(0, 0, radius, startAngle, endAngle, anticlockwise);
        //画出结束半径
        ctx.lineTo(0, 0);
        //如果需要填充就填充，不需要就算了
        if (fill) {
            ctx.fill();
        } else {
            ctx.closePath();
            ctx.stroke();
        }
    },

    calculatePokerPosition: function(i) {

        var angle = Math.PI * (2 * i + 1)/10;
        var radius = Settings.radius - Settings.rendererHeight / 4;
        var x = -radius * Math.sin(angle);
        var y = -radius * Math.cos(angle);
        return {
            x: x - Settings.rendererWidth / 2,
            y: y - Settings.rendererWidth / 2
        };
    }
};

var RendererManager = {
    records: [],

    init: function(){
        for (var i=0; i<10; i++) {
            this.records.push(this.prepareCanvas(i));
        }
    },
    prepareCanvas: function(i){
        var canvas = document.getElementById("renderer-" + i);
        var ctx = canvas.getContext("2d");
        ctx.translate(186, 186);
        ctx.rotate(-Math.PI * (2 * i + 1) / 10);
        ctx.scale(Settings.rendererScale, Settings.rendererScale);
        return {canvas: canvas, ctx: ctx};
    },
    drawImage: function(id, image){
        var record = this.records[id];
        if (!record) {
            throw new RangeError("Can not find canvas of id " + id);
        }

        record.ctx.drawImage(image, -103, -156);
        return record.canvas;
    }
};
