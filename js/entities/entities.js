game.BirdEntity = me.Entity.extend({
  init: function (x, y) {
    var settings = {};
    settings.image = "clumsy";
    settings.width = 89;
    settings.height = 124;

    this._super(me.Entity, "init", [x, y, settings]);
    this.alwaysUpdate = true;
    this.body.gravity = 0.2;
    this.maxAngleRotation = Number.prototype.degToRad(-15);
    this.maxAngleRotationDown = Number.prototype.degToRad(15);
    this.renderable.addAnimation("flying", [0]);
    this.renderable.addAnimation("idle", [0]);
    this.renderable.setCurrentAnimation("flying");
    //this.renderable.anchorPoint = new me.Vector2d(0.1, 0.5);
    this.body.removeShapeAt(0);
    this.body.addShape(new me.Ellipse(5, 5, 79, 114));

    // a tween object for the flying physic effect
    this.flyTween = new me.Tween(this.pos);
    this.flyTween.easing(me.Tween.Easing.Exponential.InOut);

    this.currentAngle = 0;
    this.angleTween = new me.Tween(this);
    this.angleTween.easing(me.Tween.Easing.Exponential.InOut);

    // end animation tween
    this.endTween = null;

    // collision shape
    this.collided = false;

    this.gravityForce = 0.2;
  },

  update: function (dt) {
    var that = this;
    this.pos.x = 60;
    if (!game.data.start) {
      return this._super(me.Entity, "update", [dt]);
    }
    this.renderable.currentTransform.identity();
    if (me.input.isKeyPressed("fly")) {
      me.audio.play("wing");
      this.gravityForce = 0.2;
      var currentPos = this.pos.y;

      this.angleTween.stop();
      this.flyTween.stop();

      this.flyTween.to({ y: currentPos - 50 }, 50);
      this.flyTween.start();

      this.angleTween
        .to({ currentAngle: that.maxAngleRotation }, 50)
        .onComplete(function (angle) {
          that.renderable.currentTransform.rotate(that.maxAngleRotation);
        });
      this.angleTween.start();
    } else {
      this.gravityForce += 0.2;
      this.pos.y += me.timer.tick * this.gravityForce;
      this.currentAngle += Number.prototype.degToRad(1.5);
      if (this.currentAngle >= this.maxAngleRotationDown) {
        this.renderable.currentTransform.identity();
        this.currentAngle = this.maxAngleRotationDown;
      }
    }
    this.renderable.currentTransform.rotate(this.currentAngle);
    me.Rect.prototype.updateBounds.apply(this);

    var hitSky = -80; // bird height + 20px
    if (this.pos.y <= hitSky || this.collided) {
      game.data.start = false;
      me.audio.play("lose");
      this.endAnimation();
      return false;
    }
    me.collision.check(this);
    return true;
  },

  onCollision: function (response) {
    var obj = response.b;
    if (obj.type === "pipe" || obj.type === "ground") {
      me.device.vibrate(500);
      this.collided = true;
    }
    // remove the hit box
    if (obj.type === "hit") {
      me.game.world.removeChildNow(obj);
      game.data.steps++;
      me.audio.play("hit");
    }
  },

  endAnimation: function () {
    me.game.viewport.fadeOut("#fff", 100);
    var currentPos = this.pos.y;
    this.endTween = new me.Tween(this.pos);
    this.endTween.easing(me.Tween.Easing.Exponential.InOut);

    this.flyTween.stop();
    this.renderable.currentTransform.identity();
    this.renderable.currentTransform.rotate(Number.prototype.degToRad(90));
    var finalPos = me.game.viewport.height - this.renderable.width / 2 - 96;
    this.endTween
      .to({ y: currentPos }, 1000)
      .to({ y: finalPos }, 1000)
      .onComplete(function () {
        me.state.change(me.state.GAME_OVER);
      });
    this.endTween.start();
  },
});

game.PipeEntity = me.Entity.extend({
  init: function (x, y, isFlipped) {
    var settings = {};
    settings.image = this.image = me.loader.getImage(
      isFlipped ? "flipped_pipe" : "pipe"
    );
    settings.width = 147;
    settings.height = 221;
    settings.framewidth = 147;
    settings.frameheight = 221;

    this._super(me.Entity, "init", [x, y, settings]);
    this.alwaysUpdate = true;
    this.body.gravity = 0;
    this.body.vel.set(-5, 0);
    this.type = "pipe";
  },

  update: function (dt) {
    // mechanics
    if (!game.data.start) {
      return this._super(me.Entity, "update", [dt]);
    }
    this.pos.add(this.body.vel);
    if (this.pos.x < -this.image.width) {
      me.game.world.removeChild(this);
    }
    me.Rect.prototype.updateBounds.apply(this);
    this._super(me.Entity, "update", [dt]);
    return true;
  },
});

game.PipeGenerator = me.Renderable.extend({
  init: function () {
    this._super(me.Renderable, "init", [
      0,
      me.game.viewport.width,
      me.game.viewport.height,
      92,
    ]);
    this.alwaysUpdate = true;
    this.generate = 0;
    this.pipeFrequency = 92;
    this.pipeHoleSize = 235; // Increased for a bigger gap
    this.posX = me.game.viewport.width;
  },

  update: function (dt) {
    if (this.generate++ % this.pipeFrequency == 0) {
      var groundHeight = me.loader.getImage("ground").height;
      var minGapFromTop = 100; // Minimum distance from the top of the screen to the top pipe
      var maxGapFromBottom =
        me.video.renderer.getHeight() -
        groundHeight -
        this.pipeHoleSize -
        minGapFromTop;

      // Calculate the y-coordinate of the bottom edge of the top pipe
      // This edge should be between minGapFromTop and maxGapFromBottom from the top of the screen
      var bottomOfTopPipeY = Number.prototype.random(
        minGapFromTop,
        maxGapFromBottom
      );

      // The top pipe's top-left corner (posY2) needs to be positioned so its bottom edge is at bottomOfTopPipeY
      // posY2 + pipe_height = bottomOfTopPipeY
      // posY2 = bottomOfTopPipeY - pipe_height
      var pipeHeight = me.loader.getImage("pipe").height; // Get the actual image height (221)
      var posY2 = bottomOfTopPipeY - pipeHeight; // Y position for the top pipe

      // The bottom pipe's top edge (posY) should be pipeHoleSize pixels below the bottom edge of the top pipe
      var posY = bottomOfTopPipeY + this.pipeHoleSize; // Y position for the bottom pipe

      var pipe1 = new me.pool.pull("pipe", this.posX, posY, false); // Bottom pipe
      var pipe2 = new me.pool.pull("pipe", this.posX, posY2, true); // Top pipe

      // The hit entity should be positioned within the gap
      var hitPos = bottomOfTopPipeY; // Start the hit box at the bottom of the top pipe
      var hit = new me.pool.pull("hit", this.posX + 74 - 30, hitPos); // Adjust hit box x position and width
      hit.body.addShape(new me.Rect(0, 0, 60, this.pipeHoleSize)); // Set hit box height to the gap size

      me.game.world.addChild(pipe1, 10);
      me.game.world.addChild(pipe2, 10);
      me.game.world.addChild(hit, 11);
    }
    this._super(me.Entity, "update", [dt]);
  },
});

game.HitEntity = me.Entity.extend({
  init: function (x, y) {
    var settings = {};
    settings.image = this.image = me.loader.getImage("hit");
    settings.width = 148;
    settings.height = 60;
    settings.framewidth = 148;
    settings.frameheight = 60;

    this._super(me.Entity, "init", [x, y, settings]);
    this.alwaysUpdate = true;
    this.body.gravity = 0;
    this.updateTime = false;
    this.renderable.alpha = 0;
    this.body.accel.set(-5, 0);
    this.body.removeShapeAt(0);
    this.body.addShape(
      new me.Rect(0, 0, settings.width - 30, settings.height - 30)
    );
    this.type = "hit";
  },

  update: function (dt) {
    // mechanics
    this.pos.add(this.body.accel);
    if (this.pos.x < -this.image.width) {
      me.game.world.removeChild(this);
    }
    me.Rect.prototype.updateBounds.apply(this);
    this._super(me.Entity, "update", [dt]);
    return true;
  },
});

game.Ground = me.Entity.extend({
  init: function (x, y) {
    var settings = {};
    settings.image = me.loader.getImage("ground");
    settings.width = 900;
    settings.height = 96;
    this._super(me.Entity, "init", [x, y, settings]);
    this.alwaysUpdate = true;
    this.body.gravity = 0;
    this.body.vel.set(-4, 0);
    this.type = "ground";
  },

  update: function (dt) {
    // mechanics
    this.pos.add(this.body.vel);
    if (this.pos.x < -this.renderable.width) {
      this.pos.x = me.video.renderer.getWidth() - 10;
    }
    me.Rect.prototype.updateBounds.apply(this);
    return this._super(me.Entity, "update", [dt]);
  },
});
