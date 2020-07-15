import { getUrlParams } from "/modules/common.js";

$(document).on("click", ".menu__dm-music-icon", () => {
    $.ajax({
        url: `/api/music/${getUrlParams()['campaign']}`,
        dataType: "json",
        success: data => {
            $(".dm-music-modal ul").html(null);
            for (let track of data) {
                let icon = "fa-play";
                if ($(backgroundMusic).attr("src") == track.path) {
                    icon = "fa-pause";
                }
                $(".dm-music-modal ul").append(
                    `<li data-path="${track.path}">
                        ${track.name} 
                        <span class="uk-align-right clickable" uk-tooltip="Play ${track.name}"><i class="fas ${icon}"></i></span>
                    </li>`
                );
            }
        }
    });
    UIkit.modal(".dm-music-modal").show(); 
});

$(document).on("click", ".dm-music-modal i.fa-play", function(){
    let path = $(this).parents("li").attr("data-path");
    if (path != $(backgroundMusic).attr("src")) {
        backgroundMusic.pause();
        backgroundMusic = new Audio(path);
        backgroundMusic.loop = true;
    }
    $(this).parents("ul").find("i.fa-pause").each(function(){
        $(this).addClass("fa-play");
        $(this).removeClass("fa-pause");
    });
    $(this).addClass("fa-pause");
    $(this).removeClass("fa-play");
    backgroundMusic.play();
    backgroundMusicStream = backgroundMusic.captureStream();
    backgroundMusicStream.addEventListener("addtrack", (event) => {
        let newTrack = event.track;
        newTrack.label = "backgroundMusic";
        let tracks = localStream.getAudioTracks();
        for (let track of tracks) {
            if (track.label = "backgroundMusic") {
                localStream.removeTrack(track);
            }
        }
        rtc.addAudioTrack(newTrack);
    });
});

$(document).on("click", ".dm-music-modal i.fa-pause", function(){
    backgroundMusic.pause();
    $(this).removeClass("fa-pause");
    $(this).addClass("fa-play");
});