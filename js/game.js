var game = {
  data: {
    score: 0,
    steps: 0,
    start: false,
    newHiScore: false,
    muted: false,
  },

  resources: [
    // images
    { name: "bg", type: "image", src: "data/img/bg.png" },
    { name: "clumsy", type: "image", src: "data/img/clumsy.png" },
    { name: "pipe", type: "image", src: "data/img/pipe.png" },
    { name: "flipped_pipe", type: "image", src: "data/img/flipped_pipe.png" },
    { name: "logo", type: "image", src: "data/img/logo.png" },
    { name: "ground", type: "image", src: "data/img/ground.png" },
    { name: "gameover", type: "image", src: "data/img/gameover.png" },
    { name: "gameoverbg", type: "image", src: "data/img/gameoverbg.png" },
    { name: "hit", type: "image", src: "data/img/hit.png" },
    { name: "getready", type: "image", src: "data/img/getready.png" },
    { name: "new", type: "image", src: "data/img/new.png" },
    { name: "share", type: "image", src: "data/img/share.png" },
    { name: "tweet", type: "image", src: "data/img/tweet.png" },
    // sounds
    { name: "theme", type: "audio", src: "data/bgm/" },
    { name: "hit", type: "audio", src: "data/sfx/" },
    { name: "lose", type: "audio", src: "data/sfx/" },
    { name: "wing", type: "audio", src: "data/sfx/" },
  ],

  onload: function () {
    if (
      !me.video.init(900, 600, {
        wrapper: "screen",
        scale: "auto",
        scaleMethod: "flex-width",
      })
    ) {
      alert("Your browser does not support HTML5 canvas.");
      return;
    }
    me.audio.init("mp3,ogg");
    me.loader.preload(game.resources, this.loaded.bind(this));
  },

  loaded: function () {
    me.state.set(me.state.MENU, new game.TitleScreen());
    me.state.set(me.state.PLAY, new game.PlayScreen());
    me.state.set(me.state.GAME_OVER, new game.GameOverScreen());

    me.input.bindKey(me.input.KEY.SPACE, "fly", true);
    me.input.bindKey(me.input.KEY.M, "mute", true);
    me.input.bindPointer(me.input.KEY.SPACE);

    me.pool.register("clumsy", game.BirdEntity);
    me.pool.register("pipe", game.PipeEntity, true);
    me.pool.register("hit", game.HitEntity, true);
    me.pool.register("ground", game.Ground, true);

    me.state.change(me.state.MENU);
  },
};

function resizeCanvas() {
  var gameArea = document.getElementById("screen");
  var widthToHeight = 900 / 600; // Game's original aspect ratio
  var newWidth = window.innerWidth;
  var newHeight = window.innerHeight;
  var newWidthToHeight = newWidth / newHeight;

  if (newWidthToHeight > widthToHeight) {
    // Window is wider than game aspect ratio, scale based on height
    newWidth = newHeight * widthToHeight;
    gameArea.style.height = newHeight + "px";
    gameArea.style.width = newWidth + "px";
  } else {
    // Window is taller than game aspect ratio, scale based on width
    newHeight = newWidth / widthToHeight;
    gameArea.style.width = newWidth + "px";
    gameArea.style.height = newHeight + "px";
  }

  // Center the game area
  gameArea.style.marginTop = -newHeight / 2 + "px";
  gameArea.style.marginLeft = -newWidth / 2 + "px";

  // Update the canvas size to match the game area
  var gameCanvas = document.querySelector("canvas");
  gameCanvas.width = newWidth;
  gameCanvas.height = newHeight;

  // Call MelonJS function to update display size
  me.video.updateDisplaySize(newWidth, newHeight);

  // If your game has a method to handle resizing, call it here
  if (typeof game !== "undefined" && typeof game.resize === "function") {
    game.resize(newWidth, newHeight);
  }
}

window.addEventListener("resize", resizeCanvas, false);
window.addEventListener("orientationchange", resizeCanvas, false);
// Initial call to set canvas size
resizeCanvas();
