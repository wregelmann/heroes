let 
    erase = false,
    canvas;
export let
    drawings = [],
    myColor = "#39f";
const 
    ctx = $(".tabletop-area canvas")[0].getContext("2d");

export function setCanvas(element){
    canvas = element;
}

export function setErase(){
    erase = true;
}

export function setDraw(color = myColor){
    myColor = color;
    erase = false;
}

export function start(position){
    if (erase) {
        ctx.globalCompositeOperation = "destination-out";
        ctx.lineWidth = 15;
    } else {
        ctx.globalCompositeOperation = "source-over";
        ctx.lineWidth = 5;
        ctx.lineCap = "round";
        ctx.strokeStyle = myColor;
    }
    var path = [];
    var coord = {position};
    $(document).on("mousemove", (event) => {
        ctx.beginPath();
        ctx.moveTo(coord.x, coord.y);
        coord = {
            x: event.clientX - canvas.offsetLeft - 20,
            y: event.clientY - canvas.offsetTop - 20
        };
        ctx.lineTo(coord.x, coord.y);
        ctx.stroke();
        path.push({
            x: coord.x / canvas.width,
            y: coord.y / canvas.height
        });
    });
    return new Promise( (resolve) => {
        $(document).one("mouseup", () => {
            $(document).off("mousemove");
            var drawing = {
                color: erase ? null: myColor,
                path: path
            };
            drawings.push(drawing);
            resolve(drawing);
        });
    });
}

export function draw(drawing){
    if (drawing.color == null) {
        ctx.globalCompositeOperation = "destination-out";
        ctx.lineWidth = 15;
    } else {
        ctx.globalCompositeOperation = "source-over";
        ctx.lineWidth = 5;
        ctx.lineCap = "round";
        ctx.strokeStyle = drawing.color;
    }
    $.each(drawing.path, (index, point) => {
        if (index > 0) {
            ctx.lineTo(point.x * canvas.width, point.y * canvas.height);
            ctx.stroke();
        }
        ctx.beginPath();
        ctx.moveTo(point.x * canvas.width, point.y * canvas.height);
    });
}

export function addDrawing(drawing){
    drawings.push(drawing);
}

export function redrawCanvas(){
    $.each(drawings, (index, drawing) => {
        draw(drawing);
    });
}

export function clearCanvas(){
    drawings = [];
}