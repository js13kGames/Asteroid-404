let tileRadius = 40;
let perspRatio = 0.4;
let offsets = [{x:1,y:0},{x:0.5,y:0.8660254037844386},{x:-0.5,y:0.8660254037844387},{x:-1,y:0},{x:-0.5,y:-0.8660254037844387},{x:0.5,y:-0.8660254037844387}];
let tileViewRadius = 11;
let tileStepHeight = 5;
var maxStepHeight = 1;


function drawHexTile(context, scrX, scrY){

    var screenPoints = []
    for(var offset = 0; offset < offsets.length;offset++){
        screenPoints.unshift({x:scrX + tileRadius * offsets[offset].x,y:scrY + tileRadius * offsets[offset].y * perspRatio});
    }

    context.beginPath();
    context.moveTo(screenPoints[0].x,screenPoints[0].y);
    for(var points = 1; points < screenPoints.length;points++){
            context.lineTo(screenPoints[points].x,screenPoints[points].y);
    }
    context.closePath();
    context.fill();
    context.stroke();
}

function renderMap(context,tiles){
    var tileWithPlayer = tiles.find(t => t.hasPlayer);
    var visableTiles = tiles.filter(t => Math.abs(t.x - tileWithPlayer.x) <= tileViewRadius).sort((a,b) => a.height - b.height);
    visableTiles.forEach(t => {
        var scrX = t.x * tileRadius * 1.5 + canvas.width/2 - tileWithPlayer.x * tileRadius * 1.5;
        var scrY = t.y * tileRadius * 2 * 0.8660254037844387 * perspRatio + 0.5 * canvas.height - t.height;
    
        if(t.x % 2 != 0){
            scrY += 0.8660254037844387 * tileRadius * perspRatio;
        }

        if(t.highlighted){
            context.strokeStyle = new Colour(255,255,0,255).toHex();
        } else {
            context.strokeStyle = t.colour.darkend(0.2).toHex();
        }
        context.fillStyle = t.colour.toHex();
        context.lineWidth = 3;
        drawHexTile(context,scrX,scrY);
        if(t.resource.type == "IRON"){
            var size = t.resource.value;
            context.strokeStyle = "#000000";
            context.fillStyle = new Colour(170,86,71,255).toHex();
            context.fillRect(scrX - size/2,scrY - size/2,size,size);
        }
        if(t.hasPlayer){
            context.strokeStyle = "#000000";
            context.fillStyle = "#0000FF";
            context.fillRect(scrX - 5,scrY - 10,10,10);
        }
    });
}
function updatePlayerPos(tiles,deltaX,deltaY){
    var playerTile = tiles.find(t => t.hasPlayer);
    if(playerTile == null){
        playerTile = tiles.find(t => t.x == 20 && t.y == 0);
        playerTile.hasPlayer = true;
        getSurroundingTiles(tiles,playerTile).forEach(t2 => t2.highlighted = true);
    } else {
        var newTile = tiles.find(t => t.x == playerTile.x + deltaX && t.y == playerTile.y + deltaY);
        if(Math.abs(newTile.height - playerTile.height) <= maxStepHeight * tileStepHeight){
            playerTile.hasPlayer = false;
            getSurroundingTiles(tiles,playerTile).forEach(t2 => t2.highlighted = false);
            newTile.hasPlayer = true;
            getSurroundingTiles(tiles,newTile).forEach(t2 => t2.highlighted = true);
        } else {
            messages.push({text:"Incline too steep",time:0});
        }
    }
}

function componentToHex(c) {
    var hex = c.toString(16);
    return hex.length == 1 ? "0" + hex : hex;
  }
  
  function rgbToHex(r, g, b, a) {
    return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b) + componentToHex(a);
  }

  function getSurroundingTiles(tiles,tile){
      return tiles.filter(t => {
        var yDelta = Math.abs(t.x - tile.x);
        var xDelta = Math.abs(t.y - tile.y);
        return yDelta <= 1 && xDelta <= 1;
      });
  }