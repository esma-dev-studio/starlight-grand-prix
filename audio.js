(function () {
  "use strict";

  var root = typeof window !== "undefined" ? window : (typeof globalThis !== "undefined" ? globalThis : {});
  var AudioCtor = root.AudioContext || root.webkitAudioContext;

  var DEFAULTS = {
    masterVolume: 0.72,
    engineVolume: 0.58,
    sfxVolume: 0.82,
    musicVolume: 0.32,
    musicTempo: 136
  };

  function clamp(value, min, max, fallback) {
    value = Number(value);
    if (!isFinite(value)) {
      return fallback;
    }
    return Math.min(max, Math.max(min, value));
  }

  function clamp01(value) {
    return clamp(value, 0, 1, 0);
  }

  function copyOptions(options) {
    options = options || {};
    return {
      masterVolume: clamp(options.masterVolume, 0, 1, DEFAULTS.masterVolume),
      engineVolume: clamp(options.engineVolume, 0, 1, DEFAULTS.engineVolume),
      sfxVolume: clamp(options.sfxVolume, 0, 1, DEFAULTS.sfxVolume),
      musicVolume: clamp(options.musicVolume, 0, 1, DEFAULTS.musicVolume),
      musicTempo: clamp(options.musicTempo, 80, 180, DEFAULTS.musicTempo)
    };
  }

  function setTarget(param, value, time, glide) {
    if (!param) {
      return;
    }
    try {
      param.cancelScheduledValues(time);
      param.setTargetAtTime(value, time, glide || 0.02);
    } catch (error) {
      try {
        param.value = value;
      } catch (ignored) {
      }
    }
  }

  function setValue(param, value, time) {
    if (!param) {
      return;
    }
    try {
      param.setValueAtTime(value, time);
    } catch (error) {
      try {
        param.value = value;
      } catch (ignored) {
      }
    }
  }

  function linear(param, value, time) {
    if (!param) {
      return;
    }
    try {
      param.linearRampToValueAtTime(value, time);
    } catch (error) {
      setValue(param, value, time);
    }
  }

  function exponential(param, value, time) {
    if (!param) {
      return;
    }
    try {
      param.exponentialRampToValueAtTime(Math.max(0.0001, value), time);
    } catch (error) {
      linear(param, value, time);
    }
  }

  function disconnect(node) {
    if (!node) {
      return;
    }
    try {
      node.disconnect();
    } catch (ignored) {
    }
  }

  function stopNode(node, time) {
    if (!node || typeof node.stop !== "function") {
      return;
    }
    try {
      node.stop(time);
    } catch (ignored) {
    }
  }

  class RiftAudio {
    constructor(options) {
      this.options = copyOptions(options);
      this.supported = !!AudioCtor;
      this.lastError = null;
      this.ctx = null;
      this.master = null;
      this.engineBus = null;
      this.sfxBus = null;
      this.musicBus = null;
      this.musicDelay = null;
      this.musicDelayWet = null;
      this.musicFeedback = null;
      this.engineNodes = null;
      this.engineWanted = false;
      this.engineState = { speed: 0, boost: 0 };
      this.musicWanted = false;
      this.musicTimer = null;
      this.musicStep = 0;
      this.musicNextTime = 0;
      this.muted = false;
    }

    resume() {
      return this._guardPromise(function () {
        var self = this;
        if (!this._ensureContext()) {
          return false;
        }

        function afterResume() {
          self._prime();
          self._applyVolumes();
          if (self.engineWanted) {
            self._startEngine();
            self._updateEngine();
          }
          if (self.musicWanted) {
            self._startMusicClock();
          }
          return true;
        }

        if (this.ctx.state === "suspended" && typeof this.ctx.resume === "function") {
          return this.ctx.resume().then(afterResume).catch(function (error) {
            self.lastError = error;
            return false;
          });
        }
        return afterResume();
      }, false);
    }

    suspend() {
      return this._guardPromise(function () {
        if (!this.ctx || typeof this.ctx.suspend !== "function") {
          return false;
        }
        var self = this;
        return this.ctx.suspend().then(function () {
          return true;
        }).catch(function (error) {
          self.lastError = error;
          return false;
        });
      }, false);
    }

    setEngine(speed01, boost01) {
      return this._guard(function () {
        this.engineState.speed = clamp01(speed01);
        this.engineState.boost = clamp01(boost01);
        this.engineWanted = true;
        if (this.ctx) {
          this._startEngine();
          this._updateEngine();
        }
        return this;
      }, this);
    }

    startEngine() {
      return this._guard(function () {
        this.engineWanted = true;
        if (this._ensureContext()) {
          this._startEngine();
          this._updateEngine();
        }
        return this;
      }, this);
    }

    stopEngine() {
      return this._guard(function () {
        this.engineWanted = false;
        this._updateEngine();
        return this;
      }, this);
    }

    startBgm() {
      return this.startMusic();
    }

    stopBgm() {
      return this.stopMusic();
    }

    startMusic() {
      return this._guard(function () {
        this.musicWanted = true;
        if (this._ensureContext()) {
          this._startMusicClock();
        }
        return this;
      }, this);
    }

    stopMusic() {
      return this._guard(function () {
        this.musicWanted = false;
        if (this.musicTimer && root.clearInterval) {
          root.clearInterval(this.musicTimer);
        }
        this.musicTimer = null;
        return this;
      }, this);
    }

    playCountdown(value) {
      return this._guard(function () {
        if (!this._ensureContext()) {
          return this;
        }
        var t = this.ctx.currentTime + 0.015;
        var word = String(value).toLowerCase();
        if (value === 0 || word === "go" || word === "start") {
          this._tone(784, 0.32, { time: t, type: "square", gain: 0.18, bus: "sfx", filterType: "lowpass", filterFreq: 2400 });
          this._tone(1174.66, 0.34, { time: t + 0.035, type: "triangle", gain: 0.15, bus: "sfx", delaySend: true });
          this._tone(1567.98, 0.42, { time: t + 0.07, type: "sine", gain: 0.12, bus: "sfx", delaySend: true });
          return this;
        }

        var step = parseInt(value, 10);
        var freq = 620;
        if (step === 2) {
          freq = 690;
        } else if (step === 1) {
          freq = 760;
        }
        this._tone(freq, 0.18, { time: t, type: "square", gain: 0.18, bus: "sfx", filterType: "lowpass", filterFreq: 1800 });
        this._tone(freq * 2, 0.08, { time: t + 0.1, type: "sine", gain: 0.055, bus: "sfx" });
        return this;
      }, this);
    }

    playBoost(amount01) {
      return this._guard(function () {
        if (!this._ensureContext()) {
          return this;
        }
        var amount = amount01 === undefined ? 1 : clamp01(amount01);
        var t = this.ctx.currentTime + 0.01;
        this._tone(160, 0.62, {
          time: t,
          type: "sawtooth",
          endFreq: 760 + amount * 260,
          gain: 0.09 + amount * 0.08,
          bus: "sfx",
          filterType: "bandpass",
          filterFreq: 900 + amount * 700,
          filterQ: 6,
          delaySend: true
        });
        this._noiseBurst(0.42, {
          time: t,
          gain: 0.11 + amount * 0.12,
          bus: "sfx",
          filterType: "highpass",
          filterFreq: 1200,
          attack: 0.008
        });
        return this;
      }, this);
    }

    playItemPickup() {
      return this._guard(function () {
        if (!this._ensureContext()) {
          return this;
        }
        var t = this.ctx.currentTime + 0.01;
        var notes = [523.25, 659.25, 783.99, 1046.5];
        for (var i = 0; i < notes.length; i += 1) {
          this._tone(notes[i], 0.13, {
            time: t + i * 0.055,
            type: i % 2 ? "triangle" : "sine",
            gain: 0.105,
            bus: "sfx",
            delaySend: true
          });
        }
        return this;
      }, this);
    }

    playItemGet() {
      return this.playItemPickup();
    }

    playItemUse() {
      return this._guard(function () {
        if (!this._ensureContext()) {
          return this;
        }
        var t = this.ctx.currentTime + 0.01;
        this._tone(1046.5, 0.28, {
          time: t,
          type: "square",
          endFreq: 392,
          gain: 0.13,
          bus: "sfx",
          filterType: "bandpass",
          filterFreq: 1250,
          filterQ: 7,
          delaySend: true
        });
        this._tone(1567.98, 0.11, {
          time: t + 0.06,
          type: "sine",
          endFreq: 987.77,
          gain: 0.07,
          bus: "sfx"
        });
        this._noiseBurst(0.16, {
          time: t + 0.02,
          gain: 0.05,
          bus: "sfx",
          filterType: "highpass",
          filterFreq: 2500
        });
        return this;
      }, this);
    }

    playUseItem() {
      return this.playItemUse();
    }

    playCollision(power01) {
      return this._guard(function () {
        if (!this._ensureContext()) {
          return this;
        }
        var power = power01 === undefined ? 0.75 : clamp01(power01);
        var t = this.ctx.currentTime + 0.005;
        this._tone(96, 0.34, {
          time: t,
          type: "triangle",
          endFreq: 38,
          gain: 0.13 + power * 0.16,
          bus: "sfx",
          filterType: "lowpass",
          filterFreq: 520
        });
        this._noiseBurst(0.18 + power * 0.18, {
          time: t,
          gain: 0.11 + power * 0.18,
          bus: "sfx",
          filterType: "lowpass",
          filterFreq: 1300 + power * 900,
          attack: 0.002
        });
        return this;
      }, this);
    }

    playCrash(power01) {
      return this.playCollision(power01);
    }

    playGoal() {
      return this._guard(function () {
        if (!this._ensureContext()) {
          return this;
        }
        var t = this.ctx.currentTime + 0.02;
        var sequence = [
          [523.25, 0.00, 0.16],
          [659.25, 0.15, 0.16],
          [783.99, 0.30, 0.18],
          [1046.5, 0.48, 0.28],
          [783.99, 0.78, 0.14],
          [1046.5, 0.93, 0.14],
          [1318.51, 1.08, 0.42]
        ];
        for (var i = 0; i < sequence.length; i += 1) {
          this._tone(sequence[i][0], sequence[i][2], {
            time: t + sequence[i][1],
            type: i % 2 ? "triangle" : "sine",
            gain: 0.12,
            bus: "sfx",
            delaySend: true
          });
        }
        this._tone(523.25, 0.7, { time: t + 1.08, type: "triangle", gain: 0.07, bus: "sfx", delaySend: true });
        this._tone(659.25, 0.7, { time: t + 1.08, type: "triangle", gain: 0.06, bus: "sfx", delaySend: true });
        this._tone(783.99, 0.7, { time: t + 1.08, type: "triangle", gain: 0.06, bus: "sfx", delaySend: true });
        return this;
      }, this);
    }

    playFinish() {
      return this.playGoal();
    }

    setMasterVolume(value) {
      return this._guard(function () {
        this.options.masterVolume = clamp(value, 0, 1, DEFAULTS.masterVolume);
        this._applyVolumes();
        return this;
      }, this);
    }

    setEngineVolume(value) {
      return this._guard(function () {
        this.options.engineVolume = clamp(value, 0, 1, DEFAULTS.engineVolume);
        this._applyVolumes();
        this._updateEngine();
        return this;
      }, this);
    }

    setSfxVolume(value) {
      return this._guard(function () {
        this.options.sfxVolume = clamp(value, 0, 1, DEFAULTS.sfxVolume);
        this._applyVolumes();
        return this;
      }, this);
    }

    setMusicVolume(value) {
      return this._guard(function () {
        this.options.musicVolume = clamp(value, 0, 1, DEFAULTS.musicVolume);
        this._applyVolumes();
        return this;
      }, this);
    }

    setMuted(muted) {
      return this._guard(function () {
        this.muted = !!muted;
        this._applyVolumes();
        return this;
      }, this);
    }

    mute() {
      return this.setMuted(true);
    }

    unmute() {
      return this.setMuted(false);
    }

    getState() {
      return {
        supported: this.supported,
        active: !!this.ctx,
        contextState: this.ctx ? this.ctx.state : "none",
        muted: this.muted,
        engineWanted: this.engineWanted,
        musicWanted: this.musicWanted,
        speed: this.engineState.speed,
        boost: this.engineState.boost,
        lastError: this.lastError
      };
    }

    destroy() {
      return this._guard(function () {
        this.stopMusic();
        this._disposeEngine();
        if (this.ctx && this.ctx.state !== "closed" && typeof this.ctx.close === "function") {
          this.ctx.close().catch(function () {});
        }
        this.ctx = null;
        this.master = null;
        this.engineBus = null;
        this.sfxBus = null;
        this.musicBus = null;
        this.musicDelay = null;
        this.musicDelayWet = null;
        this.musicFeedback = null;
        return this;
      }, this);
    }

    _guard(action, fallback) {
      try {
        return action.call(this);
      } catch (error) {
        this.lastError = error;
        return fallback;
      }
    }

    _guardPromise(action, fallback) {
      try {
        return Promise.resolve(action.call(this)).catch(function () {
          return fallback;
        });
      } catch (error) {
        this.lastError = error;
        return Promise.resolve(fallback);
      }
    }

    _ensureContext() {
      if (!this.supported) {
        return false;
      }
      if (this.ctx && this.ctx.state !== "closed") {
        return true;
      }
      try {
        try {
          this.ctx = new AudioCtor({ latencyHint: "interactive" });
        } catch (firstError) {
          this.ctx = new AudioCtor();
        }
        this._buildGraph();
        return true;
      } catch (error) {
        this.lastError = error;
        this.supported = false;
        this.ctx = null;
        return false;
      }
    }

    _buildGraph() {
      var ctx = this.ctx;
      this.master = ctx.createGain();
      this.engineBus = ctx.createGain();
      this.sfxBus = ctx.createGain();
      this.musicBus = ctx.createGain();

      this.engineBus.connect(this.master);
      this.sfxBus.connect(this.master);
      this.musicBus.connect(this.master);
      this.master.connect(ctx.destination);

      this.musicDelay = ctx.createDelay(0.8);
      this.musicDelayWet = ctx.createGain();
      this.musicFeedback = ctx.createGain();
      this.musicDelay.delayTime.value = 0.18;
      this.musicDelayWet.gain.value = 0.18;
      this.musicFeedback.gain.value = 0.22;
      this.musicDelay.connect(this.musicFeedback);
      this.musicFeedback.connect(this.musicDelay);
      this.musicDelay.connect(this.musicDelayWet);
      this.musicDelayWet.connect(this.musicBus);

      this._applyVolumes();
    }

    _applyVolumes() {
      if (!this.ctx || !this.master) {
        return;
      }
      var t = this.ctx.currentTime;
      setTarget(this.master.gain, this.muted ? 0 : this.options.masterVolume, t, 0.018);
      setTarget(this.engineBus.gain, this.options.engineVolume, t, 0.018);
      setTarget(this.sfxBus.gain, this.options.sfxVolume, t, 0.018);
      setTarget(this.musicBus.gain, this.options.musicVolume, t, 0.04);
    }

    _prime() {
      if (!this.ctx) {
        return;
      }
      try {
        var buffer = this.ctx.createBuffer(1, 1, this.ctx.sampleRate);
        var source = this.ctx.createBufferSource();
        source.buffer = buffer;
        source.connect(this.master);
        source.start(0);
      } catch (ignored) {
      }
    }

    _startEngine() {
      if (!this.ctx || this.engineNodes) {
        return;
      }
      var ctx = this.ctx;
      var t = ctx.currentTime;
      var low = ctx.createOscillator();
      var mid = ctx.createOscillator();
      var lfo = ctx.createOscillator();
      var noise = ctx.createBufferSource();
      var lowGain = ctx.createGain();
      var midGain = ctx.createGain();
      var lfoGain = ctx.createGain();
      var noiseGain = ctx.createGain();
      var filter = ctx.createBiquadFilter();
      var noiseFilter = ctx.createBiquadFilter();
      var engineGain = ctx.createGain();

      low.type = "sawtooth";
      mid.type = "square";
      lfo.type = "sine";
      noise.buffer = this._makeNoiseBuffer(1.2);
      noise.loop = true;

      lowGain.gain.value = 0.0001;
      midGain.gain.value = 0.0001;
      lfoGain.gain.value = 10;
      noiseGain.gain.value = 0.0001;
      filter.type = "lowpass";
      filter.frequency.value = 480;
      filter.Q.value = 3.4;
      noiseFilter.type = "bandpass";
      noiseFilter.frequency.value = 700;
      noiseFilter.Q.value = 1.2;
      engineGain.gain.value = 0;

      lfo.connect(lfoGain);
      lfoGain.connect(low.detune);
      lfoGain.connect(mid.detune);
      low.connect(lowGain);
      mid.connect(midGain);
      lowGain.connect(filter);
      midGain.connect(filter);
      filter.connect(engineGain);
      noise.connect(noiseFilter);
      noiseFilter.connect(noiseGain);
      noiseGain.connect(engineGain);
      engineGain.connect(this.engineBus);

      low.start(t);
      mid.start(t);
      lfo.start(t);
      noise.start(t);

      this.engineNodes = {
        low: low,
        mid: mid,
        lfo: lfo,
        noise: noise,
        lowGain: lowGain,
        midGain: midGain,
        lfoGain: lfoGain,
        noiseGain: noiseGain,
        filter: filter,
        noiseFilter: noiseFilter,
        engineGain: engineGain
      };
    }

    _updateEngine() {
      if (!this.ctx || !this.engineNodes) {
        return;
      }
      var nodes = this.engineNodes;
      var t = this.ctx.currentTime;
      var speed = this.engineState.speed;
      var boost = this.engineState.boost;
      var base = 54 + speed * 175 + boost * 68;
      var filterFreq = 360 + speed * 1850 + boost * 1050;
      var amount = this.engineWanted ? 0.13 + speed * 0.7 + boost * 0.24 : 0;

      setTarget(nodes.low.frequency, base, t, 0.055);
      setTarget(nodes.mid.frequency, base * 1.51 + boost * 24, t, 0.055);
      setTarget(nodes.lfo.frequency, 4.5 + speed * 9 + boost * 12, t, 0.08);
      setTarget(nodes.lfoGain.gain, 8 + speed * 18 + boost * 22, t, 0.08);
      setTarget(nodes.lowGain.gain, 0.045 + speed * 0.06 + boost * 0.035, t, 0.05);
      setTarget(nodes.midGain.gain, 0.012 + speed * 0.038 + boost * 0.04, t, 0.05);
      setTarget(nodes.noiseGain.gain, 0.006 + speed * 0.038 + boost * 0.07, t, 0.05);
      setTarget(nodes.filter.frequency, filterFreq, t, 0.065);
      setTarget(nodes.noiseFilter.frequency, 520 + speed * 1350 + boost * 1650, t, 0.06);
      setTarget(nodes.engineGain.gain, amount, t, 0.08);
    }

    _disposeEngine() {
      if (!this.engineNodes) {
        return;
      }
      var t = this.ctx ? this.ctx.currentTime : 0;
      stopNode(this.engineNodes.low, t);
      stopNode(this.engineNodes.mid, t);
      stopNode(this.engineNodes.lfo, t);
      stopNode(this.engineNodes.noise, t);
      for (var key in this.engineNodes) {
        if (Object.prototype.hasOwnProperty.call(this.engineNodes, key)) {
          disconnect(this.engineNodes[key]);
        }
      }
      this.engineNodes = null;
    }

    _makeNoiseBuffer(seconds) {
      var ctx = this.ctx;
      var sampleRate = ctx.sampleRate || 44100;
      var length = Math.max(1, Math.floor(sampleRate * Math.max(0.02, seconds || 0.2)));
      var buffer = ctx.createBuffer(1, length, sampleRate);
      var data = buffer.getChannelData(0);
      var last = 0;
      for (var i = 0; i < length; i += 1) {
        last = last * 0.82 + (Math.random() * 2 - 1) * 0.18;
        data[i] = last;
      }
      return buffer;
    }

    _bus(name) {
      if (name === "music") {
        return this.musicBus;
      }
      if (name === "engine") {
        return this.engineBus;
      }
      return this.sfxBus;
    }

    _tone(freq, duration, options) {
      if (!this._ensureContext()) {
        return null;
      }
      options = options || {};
      var ctx = this.ctx;
      var t = typeof options.time === "number" ? options.time : ctx.currentTime;
      var dur = clamp(duration, 0.02, 4, 0.18);
      var attack = clamp(options.attack, 0.001, Math.max(0.001, dur * 0.5), 0.008);
      var release = clamp(options.release, 0.006, dur, Math.min(0.09, dur * 0.5));
      var gainValue = clamp(options.gain, 0, 0.8, 0.1);
      var osc = ctx.createOscillator();
      var gain = ctx.createGain();
      var output = gain;
      var bus = this._bus(options.bus);
      var endTime = t + dur;

      osc.type = options.type || "sine";
      setValue(osc.frequency, Math.max(1, freq || 440), t);
      if (options.endFreq) {
        exponential(osc.frequency, Math.max(1, options.endFreq), endTime);
      }
      if (options.detune) {
        setValue(osc.detune, options.detune, t);
      }

      if (options.filterType) {
        var filter = ctx.createBiquadFilter();
        filter.type = options.filterType;
        filter.frequency.value = clamp(options.filterFreq, 20, 12000, 1800);
        filter.Q.value = clamp(options.filterQ, 0.0001, 20, 1.4);
        osc.connect(filter);
        filter.connect(gain);
        output = gain;
      } else {
        osc.connect(gain);
      }

      gain.gain.cancelScheduledValues(t);
      setValue(gain.gain, 0.0001, t);
      linear(gain.gain, gainValue, t + attack);
      if (release < dur) {
        setValue(gain.gain, gainValue, Math.max(t + attack, endTime - release));
      }
      exponential(gain.gain, 0.0001, endTime);

      output.connect(bus);
      if (options.delaySend && this.musicDelay) {
        output.connect(this.musicDelay);
      }

      osc.start(t);
      osc.stop(endTime + 0.04);
      osc.onended = function () {
        disconnect(osc);
        disconnect(output);
      };
      return osc;
    }

    _noiseBurst(duration, options) {
      if (!this._ensureContext()) {
        return null;
      }
      options = options || {};
      var ctx = this.ctx;
      var t = typeof options.time === "number" ? options.time : ctx.currentTime;
      var dur = clamp(duration, 0.02, 2, 0.18);
      var attack = clamp(options.attack, 0.001, Math.max(0.001, dur * 0.4), 0.004);
      var gainValue = clamp(options.gain, 0, 0.9, 0.12);
      var source = ctx.createBufferSource();
      var gain = ctx.createGain();
      var output = gain;
      var bus = this._bus(options.bus);
      var endTime = t + dur;

      source.buffer = this._makeNoiseBuffer(dur + 0.05);
      if (options.playbackRate) {
        setValue(source.playbackRate, options.playbackRate, t);
      }

      if (options.filterType) {
        var filter = ctx.createBiquadFilter();
        filter.type = options.filterType;
        filter.frequency.value = clamp(options.filterFreq, 20, 12000, 1800);
        filter.Q.value = clamp(options.filterQ, 0.0001, 20, 0.8);
        source.connect(filter);
        filter.connect(gain);
        output = gain;
      } else {
        source.connect(gain);
      }

      gain.gain.cancelScheduledValues(t);
      setValue(gain.gain, 0.0001, t);
      linear(gain.gain, gainValue, t + attack);
      exponential(gain.gain, 0.0001, endTime);

      output.connect(bus);
      if (options.delaySend && this.musicDelay) {
        output.connect(this.musicDelay);
      }

      source.start(t);
      source.stop(endTime + 0.04);
      source.onended = function () {
        disconnect(source);
        disconnect(output);
      };
      return source;
    }

    _startMusicClock() {
      if (!this.ctx || this.musicTimer) {
        return;
      }
      var self = this;
      this.musicNextTime = this.ctx.currentTime + 0.06;
      this._scheduleMusic();
      if (root.setInterval) {
        this.musicTimer = root.setInterval(function () {
          self._guard(function () {
            self._scheduleMusic();
            return null;
          }, null);
        }, 90);
      }
    }

    _scheduleMusic() {
      if (!this.musicWanted || !this.ctx) {
        return;
      }
      var stepDur = 60 / this.options.musicTempo / 2;
      var horizon = this.ctx.currentTime + 0.45;
      if (!this.musicNextTime || this.musicNextTime < this.ctx.currentTime - 0.1) {
        this.musicNextTime = this.ctx.currentTime + 0.04;
      }
      while (this.musicNextTime < horizon) {
        this._musicStep(this.musicStep % 32, this.musicNextTime, stepDur);
        this.musicStep += 1;
        this.musicNextTime += stepDur;
      }
    }

    _musicStep(step, t, stepDur) {
      var chordIndex = Math.floor(step / 8) % 4;
      var roots = [73.42, 87.31, 98.0, 82.41];
      var leads = [
        293.66, 0, 369.99, 440.0, 554.37, 440.0, 369.99, 0,
        329.63, 0, 415.3, 493.88, 659.25, 493.88, 415.3, 0
      ];
      var rootFreq = roots[chordIndex];
      var leadFreq = leads[step % leads.length];

      if (step % 4 === 0) {
        this._tone(rootFreq, stepDur * 2.2, {
          time: t,
          type: "triangle",
          endFreq: rootFreq * 0.98,
          gain: 0.095,
          bus: "music",
          filterType: "lowpass",
          filterFreq: 220
        });
        this._tone(72, stepDur * 0.55, {
          time: t,
          type: "sine",
          endFreq: 44,
          gain: 0.08,
          bus: "music"
        });
      }

      if (leadFreq) {
        this._tone(leadFreq, stepDur * 0.72, {
          time: t,
          type: step % 4 === 2 ? "triangle" : "sine",
          gain: 0.048,
          bus: "music",
          filterType: "lowpass",
          filterFreq: 2800,
          delaySend: true
        });
      }

      if (step % 2 === 1) {
        this._noiseBurst(stepDur * 0.28, {
          time: t,
          gain: 0.026,
          bus: "music",
          filterType: "highpass",
          filterFreq: 5600,
          attack: 0.002
        });
      }
    }
  }

  RiftAudio.create = function (options) {
    return new RiftAudio(options);
  };

  root.RiftAudio = RiftAudio;
}());
