let 
    calls = [],
    connections = [],
    localStream = new MediaStream(),
    localVideo,
    peer = new RTCPeerConnection();

$( () => {
    $("body").append(
            `<div class="device-select-modal" uk-modal>
                <div class="uk-modal-dialog">
                    <div class="uk-modal-body">
                        <form class="uk-form-stacked">
                            <div class="uk-margin">
                                <label class="uk-form-label">Video</label>
                                <div class="uk-form-controls">
                                    <select class="device-select-modal__video-device uk-select"></select>
                                </div>
                            </div>
                            <div class="uk-margin">
                                <label class="uk-form-label">Audio</label>
                                <div class="uk-form-controls">
                                    <select class="device-select-modal__audio-device uk-select"></select>
                                </div>
                            </div>
                        </form>
                    </div>
                    <div class="uk-modal-footer">
                        <button class="uk-button uk-button-primary uk-align-right">Submit</button>
                    </div>
                </div>
            </div>`
        );
});

export async function devicePrompt() {
        
    return new Promise( (resolve, reject) => {
        
        let promised = false;
        
        navigator.mediaDevices.enumerateDevices().then( (devices) => {
            
            $(".device-select-modal__video-device, .device-select-modal__audio-device").html(null);
            $.each(devices, (index, device) => {
                if (device.kind == "videoinput") {
                    $(".device-select-modal__video-device").append(
                        `<option value="${device.deviceId}">${device.label}</option>`
                    );
                } else if (device.kind == "audioinput") {
                    $(".device-select-modal__audio-device").append(
                        `<option value="${device.deviceId}">${device.label}</option>`
                    );
                }
            });
            $(".device-select-modal__video-device, .device-select-modal__audio-device").append(
                `<option value="null">None</option>`
            );
            UIkit.modal(".device-select-modal").show();
            $(".device-select-modal button").click( () => {
                promised = true;
                Promise.all([
                    setVideoTrack($(".device-select-modal__video-device").val()),
                    addAudioTrack($(".device-select-modal__audio-device").val())
                ]).finally(resolve());
                UIkit.modal(".device-select-modal").hide();
            });
            $(".device-select-modal").on("hide", () => {
                if (!promised) {
                    reject("User canceled");
                }
            });
            
        });
        
    });
}

export async function setVideoTrack(deviceId) {
    console.log(deviceId);
    return new Promise( (resolve) => {
        navigator.mediaDevices.getUserMedia({
            video: { deviceId: { exact: deviceId } }
        }).then( (stream) => {
            let 
                oldVideo = localStream.getVideoTracks()[0],
                newVideo = stream.getVideoTracks()[0];
            if (oldVideo) {
                localStream.removeTrack(oldVideo);
            }
            console.log(newVideo);
            localStream.addTrack(newVideo);
        }).finally( () => {
            resolve();
        });
    });
}

export async function addAudioTrack(deviceId) {
    return new Promise( (resolve) => {
        navigator.mediaDevices.getUserMedia({
            audio: { deviceId: { exact: deviceId } }
        }).then( (stream) => {
            let newAudio = stream.getAudioTracks()[0];
            localStream.addTrack(newAudio);
        }).finally( () => {
            resolve();
        });
    });
}

export function getLocalStream() {
    return localStream;
}

export async function createPeer(peerId) {

        peer = new Peer(peerId, {
            host: "video.heroes.willandbritta.com",
            debug: 2
        });
        
        peer.on("open", () => {
            console.log(`Peer ID: ${peerId}`);
        });
        
        peer.on("connection", (conn) => {
            console.log(conn);
            $.each(connections, (index, peerConn) => {
                if (peerConn.peer == conn.peer) {
                    connections.splice(index, 1);
                }
            });
            connections.push(conn);
            conn.on("open", () => {
            });
            conn.on("data", (data) => {
                handleMessage(data);
            });
            console.log(`Incoming connection from ${ conn.peer }`);
        });
        
        peer.on("call", (call) => {
            call.answer(localStream);
            call.on("stream", (stream) => {
                console.log(`Incoming call from ${call.metadata.from}`);
                if (call.metadata.from == null) {
                    $(".tabletop-area video")[0].srcObject = stream;
                    drawings = [];
                    drawCanvas();
                } else {
                    $(`.video-grid-area__item[data-character-id="${call.metadata.from}"] video`)[0].srcObject = stream;
                }
            });
        });
}

function connectPeers(){
        
    if (characterId != null) {
        $.each(connections, function(i1,d1){
            if (d1.peer == get_url_params()["campaign"]) {
                connections.splice(i1,1);
            }
        });
        connections.push(connectPeer(get_url_params()["campaign"], null));
    }
    
    $(".video-grid-area__item video").each(function(){
        var videoId = $(this).parents(".video-grid-area__item").attr("data-character-id");
        if (videoId != characterId) {
            $.each(connections, function(i1,d1){
                if (d1.peer == `${get_url_params()["campaign"]}-${videoId}`) {
                    connections.splice(i1,1);
                }
            });
            connections.push(connectPeer(`${get_url_params()["campaign"]}-${videoId}`, videoId));
        }
    });
    
}
function connectPeer(id, peerPlayerId){
    var name = player != null ? player.name : "The DM";
    var conn = peer.connect(id);
    conn.on("open", function(){
        console.log(`Connected to ${conn.peer}`); 
        conn.send({
            type: "alert",
            text: `${name} has joined the party!`
        });
        var call = peer.call(conn.peer, localStream, {
            metadata: {
                from: characterId,
                to: peerPlayerId
            }
        });
        call.on("stream", function(stream){
            console.log(`Outbound call to ${call.metadata.to}`);
            if (call.metadata.to == null) {
                $(".tabletop-area video")[0].srcObject = stream;
                setTimeout(function(){
                    drawCanvas();
                }, 1000);
            } else {
                $(`.video-grid-area__item[data-character-id="${call.metadata.to}"] video`)[0].srcObject = stream;
            }
        });
        calls.push(call);
    });
    conn.on("data", function(data){
        handleMessage(data);
    });
    return conn;
}

$(".chat-area__textbox").on("keyup", function(e){
    if (e.which == 13) {
        var text = $(this).val();
        $(this).val(""); 
        var message = {
            type: player == null && $(".chat-area__alias").val() == "" ? "alert" : "broadcast",
            from: player == null ? ($(".chat-area__alias").val() ? $(".chat-area__alias").val() : "DM") : player.name,
            text: text.trim()
        }
        handleMessage(message);
        $.each(connections, function(i1,d1){
            console.log(d1);
            d1.send(message);
        });
    }
});

$(".chat-area i[data-sides]").on("click", function(){
    var name = player == null ? ($(".chat-area__alias").val() ? $(".chat-area__alias").val() : "The DM") : player.name
    var roll = Math.floor(Math.random() * $(this).attr("data-sides")) + 1;
    var message = {
        type: "alert",
        text: `${name} rolled ${roll} (d${$(this).attr("data-sides")})`
    };
    handleMessage(message);
    $.each(connections, function(i1,d1){
        d1.send(message);
    });
});

$(document).on("mouseenter", ".video-grid-area__item", function(){
    $(this).find(".video-grid-area__mute-button").show();
});
$(document).on("mouseleave", ".video-grid-area__item", function(){
    if (!$(this).find(".video-grid-area__mute-button").attr("muted")) {
        $(this).find(".video-grid-area__mute-button").hide();
    }
});
$(document).on("click", ".video-grid-area__mute-button", function(){
    if ($(this).attr("muted")) {
        $(this).removeAttr("muted");
        $(this).parents(".video-grid-area__item").find("video")[0].srcObject.getAudioTracks()[0].enabled = true;
    } else {
        $(this).attr("muted", true);
        $(this).parents(".video-grid-area__item").find("video")[0].srcObject.getAudioTracks()[0].enabled = false;
    }
});