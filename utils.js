let tileRadius = 60;
let perspRatio = 0.4;
let offsets = [{x:1,y:0},{x:0.5,y:0.8660254037844386},{x:-0.5,y:0.8660254037844387},{x:-1,y:0},{x:-0.5,y:-0.8660254037844387},{x:0.5,y:-0.8660254037844387}];
let tileViewRadius = 11;
let tileStepHeight = 5;
var maxStepHeight = 1;
let roverImgScale = 1;
let radarRange = 5;


function drawHexTile(context, scrX, scrY, tile){

    drawHexagon(context,scrX,scrY);

    if(tile.isVisible && tile.resource.type != "NONE"){
        var resourceColour = null;
        switch(tile.resource.type){
            case "IRON":
                resourceColour = new Colour(165,42,42,255);
                break;
            case "COPPER":
                resourceColour = new Colour(184,115,51,255);
                break;
            case "CARBON":
                resourceColour = new Colour(18,18,18,255);
                break;
            case "LITHIUM":
                resourceColour = new Colour(169,169,169,255);
                break;
            case "SILICON":
                resourceColour = new Colour(0,153,204,255);
                break;
        }
        context.lineWidth = 3;
        context.fillStyle = resourceColour.toHex();
        context.strokeStyle = resourceColour.darkend(0.4).toHex();
        tile.resource.lines.forEach(l => {
            context.beginPath();
            context.moveTo(l[0].x + scrX,l[0].y + scrY);
            for(var ll = 1; ll < l.length;ll++){
                context.lineTo(l[ll].x + scrX,l[ll].y + scrY);
            }
            context.closePath();
            context.fill();
            context.stroke();
        });
    }
}

function renderMap(context,tiles){
    var tileWithPlayer = tiles.find(t => t.hasPlayer);
    var visableTiles = tiles.filter(t => Math.abs(t.x - tileWithPlayer.x) <= tileViewRadius).sort((a,b) => a.height - b.height).sort((a,b) => a.y - b.y).sort((a,b) => a.isVisible - b.isVisible);
    var screenCoords = []
    visableTiles.forEach(t => {
        var scrX = t.x * tileRadius * 1.5 + canvas.width/2 - tileWithPlayer.x * tileRadius * 1.5;
        var scrY = t.y * tileRadius * 2 * 0.8660254037844387 * perspRatio + 0.5 * canvas.height;
    
        if(t.x % 2 != 0){
            scrY += 0.8660254037844387 * tileRadius * perspRatio;
        }

        if(t.isVisible){
            scrY -= t.height;
            screenCoords.push({x:scrX,y:scrY});
            context.strokeStyle = t.colour.darkend(0.2).toHex();
            context.fillStyle = t.colour.toHex();
            if(interactTiles.includes(t)){
                if(buildMode){
                    context.strokeStyle = "#FFFF00";
                } else if(removeMode){
                    context.strokeStyle = "#FF0000";
                }
                if(interactTiles.indexOf(t) == selectedTile){
                    context.strokeStyle = "#00FF00";
                }
            }
            context.lineWidth = 3;
            drawHexTile(context,scrX,scrY,t);
            switch(t.building.type){
                case "RADAR":
                    context.drawImage(towerImg,Math.trunc(scrX - towerImg.width/2),Math.trunc(scrY - towerImg.height*0.9));
                    break;
                case "CONSTRUCTOR":
                    context.drawImage(constructorImg,Math.trunc(scrX - constructorImg.width/2),Math.trunc(scrY - constructorImg.height*0.8));
                    break;
                case "SOLAR":
                    context.drawImage(solarImg,Math.trunc(scrX - solarImg.width/2),Math.trunc(scrY - solarImg.height*0.5));
                    break;
                case "MINER":
                    context.drawImage(minerImg,Math.trunc(scrX - minerImg.width/2),Math.trunc(scrY - minerImg.height*0.8));
                    break;
                case "LAB":
                    context.drawImage(labImg,Math.trunc(scrX - labImg.width/2),Math.trunc(scrY - labImg.height*0.6));
                    break;
                case "BATTERY":
                    context.drawImage(batteryImg,Math.trunc(scrX - batteryImg.width/2),Math.trunc(scrY - batteryImg.height*0.6));
                    break;
                case "RTG":
                        context.drawImage(rtgImg,Math.trunc(scrX - rtgImg.width/2),Math.trunc(scrY - rtgImg.height*0.6));
                        break;
                default:
                    break;
            }
        } else {
            screenCoords.push({x:scrX,y:scrY});
            context.strokeStyle = "#000000";
            context.fillStyle = "#FFFFFF";
            context.lineWidth = 3;
            drawHexTile(context,scrX,scrY,t);
            context.fillStyle = "#000000";
            var fontSize = Math.trunc(tileRadius*perspRatio);
            context.font = fontSize + "px Arial";
            context.textAlign = "center"; 
            context.textBaseline = "middle"; 
            context.fillText("404",scrX ,scrY);
        }
    });
    var playerTile = visableTiles.find(t => t.hasPlayer);
    var playerTileCoords = screenCoords[visableTiles.indexOf(playerTile)];
    context.drawImage(roverImg,playerTileCoords.x - Math.trunc(roverImg.width*roverImgScale/2),Math.trunc(playerTileCoords.y - (roverImg.height*roverImgScale/2) - 10 + Math.sin(180 * time * (Math.PI/180)) * 4),Math.trunc(roverImg.width*roverImgScale),Math.trunc(roverImg.height*roverImgScale));
}
function updatePlayerPos(tiles,deltaX,deltaY){
    var playerTile = tiles.find(t => t.hasPlayer);
        var newTile = tiles.find(t => t.x == playerTile.x + deltaX && t.y == playerTile.y + deltaY);
        if(newTile != null){
            if(newTile.isVisible){
                if(Math.abs(newTile.height - playerTile.height) <= maxStepHeight * tileStepHeight){
                    playerTile.hasPlayer = false;
                    newTile.hasPlayer = true;
                } else {
                    messages.unshift({text:"Incline too steep",time:0});
                }
            } else {
                messages.unshift({text:"Cannot enter unfound tile",time:0});
            }
        }
}
function mineTile(tile){
    if(tile.resource.type != "NONE"){
        var type = tile.resource.type;
        if(tile.resource.value == 1){
            tile.resource = {type:"NONE",value:0};
        } 
        else {
            tile.resource.value -= 1;
            tile.resource.lines = generateResourcePoints(tile.resource.value,tile.resource.type);
        }
        return {type:type,value:1};
    } else {
        return tile.resource;
    }
}
function placeBuilding(tile,building){
    if(tile.building.type == "NONE"){
        tile.building.type = building.type;
        switch(building.type){
            case "RADAR":
                tiles.filter(t => Math.abs(t.x - tile.x) < radarRange).forEach(t => t.isVisible = true);
                break;
            case "CONSTRUCTOR":
                tile.building.storedItems = [];
                tile.building.energy = 0;
                tile.building.maxEnergy = 10;
                tile.building.crafting = false;
                tile.building.craftTimer = 0;
                tile.building.storedProduct = 0;
                break;
            case "MINER":
                tile.building.storedItems = [];
                tile.building.energy = 0;
                tile.building.maxEnergy = 10;
                tile.building.mining = false;
                tile.building.mineTimer = 0;
                break;
            case "BATTERY":
                tile.building.energy = 0;
                tile.building.maxEnergy = 20;
                tile.building.dischargeTimer = 0;
                tile.building.discharging = false;
                break;
            case "LAB":
                tile.building.energy = 0;
                tile.building.maxEnergy = 10;
                tile.building.upgradeTimer = 0;
                tile.building.upgrading = false;
                break;
        }
        building.value -= 1;
        zzfx(...[soundFxVolume,,191,,,.07,1,1.09,-5.4,,,,,.4,-0.4,.3,,.7]).start();
    } else {
        messages.unshift({text:"Cannot place building",time:0});
    }
}
function removeBuilding(tile){
    if(tile.building.type != "NONE"){
        if(tile.building.storedItems != null){
            tile.building.storedItems.forEach(i => addToPlayerResources(i.type,i.value));
        }
        if(tile.building.storedProduct != null && tile.building.storedProduct > 0){
            addToPlayerBuildings(tile.building.recipe.product,tile.building.storedProduct);
        }
        switch(tile.building.type){
            case "RADAR":
                var playerTile = tiles.find(t => t.hasPlayer);
                var tilesInPlayerRange = tiles.filter(t => Math.abs(t.x - playerTile.x) < radarRange);
                var radarsInPlayerRange = tilesInPlayerRange.filter(t => t.building.type == "RADAR" && t != tile);
                if(radarsInPlayerRange.length >= 1){
                    addToPlayerBuildings(tile.building.type,1);
                    tile.building = {type:"NONE"};
                    tiles.filter(t => Math.abs(t.x - tile.x) < radarRange).forEach(t => t.isVisible = false);
                    tiles.filter(t => radarsInPlayerRange.some(t2 => Math.abs(t.x - t2.x) < radarRange)).forEach(t => t.isVisible = true);
                    zzfx(...[soundFxVolume,,400,,,.07,1,1.09,-5.4,,,,,.4,-0.4,.3,,.7]).start();
                } else {
                    messages.unshift({text:"No other radar in range",time:0});
                }
                break;
            default:
                addToPlayerBuildings(tile.building.type,1);
                tile.building = {type:"NONE"};
                zzfx(...[soundFxVolume,,400,,,.07,1,1.09,-5.4,,,,,.4,-0.4,.3,,.7]).start();
                break;
        }
    } else {
        messages.unshift({text:"Tile has no building",time:0});
    }
}

function addToPlayerResources(type,ammount){
    var playerRes = playerResources.find(r => r.type == type);
    if(playerRes != null){
        playerRes.value += ammount;
    } else {
        playerResources.push({type:type,value:ammount});
    }
}
function addToPlayerBuildings(type,ammount){
    var playerBuild = playerBuildings.find(r => r.type == type);
    if(playerBuild != null){
        playerBuild.value += ammount;
    } else {
        playerBuildings.push({type:type,value:ammount});
    }
}
function addToBuildingStorage(buildingStorage,type,ammount){
    var buildRes = buildingStorage.find(r => r.type == type);
    if(buildRes != null){
        buildRes.value += ammount;
    } else {
        buildingStorage.push({type:type,value:ammount});
    }
}

function drawHexagon(context,scrX,scrY){
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

function componentToHex(c) {
    var hex = c.toString(16);
    return hex.length == 1 ? "0" + hex : hex;
  }
  
  function rgbToHex(r, g, b, a) {
    return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b) + componentToHex(a);
  }

  function getSurroundingTiles(tiles,tile){
      return tiles.filter(t => {
        var yDelta = t.y - tile.y;
        var xDelta = t.x - tile.x;
        if(Math.abs(yDelta) == 1 && xDelta == 0){
            return true;
        }
        if(yDelta == 0 && Math.abs(xDelta) == 1){
            return true;
        }
        if(tile.x % 2 == 0) {
            if(yDelta == -1 && Math.abs(xDelta) == 1){
                return true;
            }
        } else {
            if(yDelta == 1 && Math.abs(xDelta) == 1){
                return true;
            }
        }
        return false;
      });
  }

  function generateResourcePoints(value,type){
      var points = 7;
      var number = 1;
      var size = value/20;
    var lines = [];
    for(var n = 0; n < number;n++){
        var xOffset = (Math.random() - 0.5) * (tileRadius*0.2) * size;
        var yOffset = (Math.random() - 0.5) * (tileRadius*0.2) * size;
        lines.unshift(generateBlob(points,size,yOffset,xOffset));
    }
      return lines;
  }

  function generateBlob(points,size,xOffset,yOffset){
    var curLines = []
    var angles = [];
    for(var i = 0; i < points;i++){
        angles.unshift(i * ((Math.PI*2)/points));
    }
    angles.forEach(a => {
        var x = xOffset + (Math.cos(a) * size * tileRadius + (Math.random() * 15 * size));
        var y = yOffset + (Math.sin(a) * size * (tileRadius*perspRatio) + (Math.random() * 15 * size));
        x = Math.min(tileRadius * 0.6 - 5,x);
        x = Math.max(-tileRadius * 0.6 + 5,x);
        y = Math.min(tileRadius * perspRatio - 5,y);
        y = Math.max(-tileRadius * perspRatio + 5,y);
        curLines.unshift({x:x,y:y});
    });
    return curLines;
  }


  function generateMap(width,biomeSeq,colours){

    var tiles = [];
    for(var y = 0; y < 5;y++){
        for(var x = 0; x < width;x++){
                tiles.push(new Tile(x,y,biomeSeq[x]));
        }
    }

    tiles.forEach(t => {

        var heightNumber = 0;
        switch(t.biome){
            case 1:
                //Flatlands
                heightNumber = Math.min(6,Math.max(4,Math.trunc(Math.abs((noise.perlin2(t.x/5, t.y/5)+1)/2 * 10))));
                break;
            case 3:
                //Bumpy
                heightNumber = Math.min(9,Math.trunc(Math.abs((noise.perlin2(t.x/4, t.y/4)+1)/2 * 10)));
                break;
            case 0:
                //Lowlands
                heightNumber = Math.min(5,Math.max(0,Math.trunc(Math.abs((noise.perlin2(t.x/5, t.y/5)+1)/2 * 10))) - 1);
                break;
            case 4:
                //Moutains
                heightNumber = Math.min(9,Math.trunc(Math.abs((noise.perlin2(t.x/3, t.y/3)+1)/2 * 10) + 2));
                break;
            case 2:
                //Ridge
                heightNumber = Math.min(9,Math.trunc(Math.abs((noise.perlin2(t.x/3, t.y/3)+1)/2 * 15) + 2));
                break;
        }
        heightNumber = Math.max(0,heightNumber);
        t.height = tileStepHeight * heightNumber;
        t.colour = colours.find(c => c.levels.includes(heightNumber)).colour;

        if(Math.random() * 100 > 97 && (t.biome == 1 || t.biome == 3) && t.height >= 15){
            var resourceAmmount = Math.random() * 10;
            t.resource = {type:"IRON",value:Math.max(3,Math.trunc(resourceAmmount))};
            getSurroundingTiles(tiles,t).filter(t => 0.5 > Math.random() && t.resource.type == "NONE").forEach(t => t.resource = {type:"IRON",value:Math.max(1,Math.trunc(resourceAmmount * Math.random()))});
        } else if(Math.random() * 100 > 97 && (t.biome == 0 || t.biome == 1)) {
            var resourceAmmount = Math.random() * 10;
            t.resource = {type:"COPPER",value:Math.max(3,Math.trunc(resourceAmmount))};
            getSurroundingTiles(tiles,t).filter(t => 0.5 > Math.random() && t.resource.type == "NONE").forEach(t => t.resource = {type:"COPPER",value:Math.max(1,Math.trunc(resourceAmmount * Math.random()))});
        } else if(Math.random() * 100 > 92 && t.biome == 0 && t.height <= 10) {
            var resourceAmmount = Math.random() * 20;
            t.resource = {type:"CARBON",value:Math.max(5,Math.trunc(resourceAmmount))};
            getSurroundingTiles(tiles,t).filter(t => 0.8 > Math.random() && t.resource.type == "NONE").forEach(t => t.resource = {type:"CARBON",value:Math.max(1,Math.trunc(resourceAmmount * Math.random()))});
        } else if(Math.random() * 100 > 96 && t.biome == 3) {
            var resourceAmmount = Math.random() * 15;
            t.resource = {type:"LITHIUM",value:Math.max(2,Math.trunc(resourceAmmount))};
            getSurroundingTiles(tiles,t).filter(t => 0.9 > Math.random() && t.resource.type == "NONE").forEach(t => t.resource = {type:"LITHIUM",value:Math.max(1,Math.trunc(resourceAmmount * Math.random()))});
        } else if(Math.random() * 100 > 85 && t.biome == 4 && t.height >= 40) {
            var resourceAmmount = Math.random() * 15;
            t.resource = {type:"SILICON",value:Math.max(2,Math.trunc(resourceAmmount))};
            getSurroundingTiles(tiles,t).filter(t => 0.7 > Math.random() && t.resource.type == "NONE").forEach(t => t.resource = {type:"SILICON",value:Math.max(1,Math.trunc(resourceAmmount * Math.random()))});
        }
    });
    tiles.find(t => t.x == 550 && t.y == 0).hasPlayer = true;
    //Generate start area resources
    tiles.filter(t => Math.abs(550 - t.x) < 20).forEach(t => {
        if(Math.random() * 100 > 80 && t.resource.type == "NONE"){
            var resourceAmmount = Math.random() * 15;
            t.resource = {type:"IRON",value:Math.max(5,Math.trunc(resourceAmmount))};
            getSurroundingTiles(tiles,t).filter(t => 0.2 > Math.random() && t.resource.type == "NONE").forEach(t => t.resource = {type:"IRON",value:Math.max(4,Math.trunc(resourceAmmount * Math.random()))});
        } else if(Math.random() * 100 > 85 && t.resource.type == "NONE") {
            var resourceAmmount = Math.random() * 15;
            t.resource = {type:"COPPER",value:Math.max(5,Math.trunc(resourceAmmount))};
            getSurroundingTiles(tiles,t).filter(t => 0.2 > Math.random() && t.resource.type == "NONE").forEach(t => t.resource = {type:"COPPER",value:Math.max(4,Math.trunc(resourceAmmount * Math.random()))});
        }
    });
    tiles.filter(t => t.resource.type != "NONE").forEach(t => t.resource.lines = generateResourcePoints(t.resource.value,t.resource.type));

    return tiles;
  }