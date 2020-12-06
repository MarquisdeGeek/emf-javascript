/*
* Pacman audio? trigger samples or webaudio complex PeriodicWave example
https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Advanced_techniques

https://developer.mozilla.org/en-US/docs/Web/API/PeriodicWave

https://github.com/GoogleChromeLabs/web-audio-samples/tree/gh-pages/samples/audio/wave-tables

API: Q. polyphony?
xx.playNote(picth, volume, duration)
.noteStart(channel, pitch)
.noteStop(channel, pitch)
.channelSetPatch(channel, std::sine)
.getPatch('sine') ???
.pitchFromMIDI(i)
.pitchFromNote(i)
*/
emf.audio = (function(bus, options) {
  let audioContext;
  let isMuted;
  //
  let soundData;
  let audioNode;
  let startAudioInterval;
  let sampleRate = 44100;
  let oversampleRate = 8;
  let isRealTimeRunning = false;
  //
  let sampleList = [];
  //
  let toneList = [];
  let toneID = 1; // incrementing counter to produce unique IDs

  (function ctor() {
    let AudioContext = window.AudioContext || window.webkitAudioContext;
    audioContext = new AudioContext();
    startAudioInterval = setInterval(function() {
		  if (isAudioSuspended()) {
			  startAudio();
		  }
    }, 100);
    //
    isMuted = false;
    reset();
  })();

  function reset() {
    soundData = new Array();
    sampleStopAll();
    toneStopAll();
  }

  function muteAll() {
    isMuted = true;
    soundData = new Array();
    sampleStopAll();
    toneStopAll();
  }

  function unmuteAll() {
    isMuted = false;
  }

  function isAudioSuspended() {
    return audioContext.state === "suspended";
  }
  //
  function rtStart() {
    isRealTimeRunning = true;
    startAudio();
  }

  function rtApplyDAC1bit(data) {
    if (isAudioSuspended() || isMuted) {
      return;
    }
    //
    for (let i = 0; i < data.length; ++i) {
      let sampleData = data[i] ? 255 : 0; // pure square wav
      for(let j=0;j<oversampleRate;++j) {
        soundData.push(sampleData);  
      }
    }
  }

  function rtApplyDAC8bit(data) {
    if (isAudioSuspended() || isMuted) {
      return;
    }
    //
    for (let i = 0; i < data.length; ++i) {
      for(let j=0;j<oversampleRate;++j) {
        soundData.push(data[i]);  
      }
    }
  }

  function rtFillDurationDAC1bit(duration, value) {
    if (isAudioSuspended() || isMuted) {
      return;
    }
    //
    let sound_size = duration * sampleRate * oversampleRate;
    let sampleData = value ? 255 : 0; // pure square wav

    // If there's more than 1 second of data, prune it.
    // Technically, for a real time stream, there should never
    // be more than 1/60th of second of data coming in. But, to
    // be generous, we allow for more to cover boot-up times.
    if (duration > 1) {
      sound_size = 1000 / 60;
    }

    for (let i = 0; i < sound_size; ++i) {
      soundData.push(sampleData);
    }
  }
  // Internal real-time streaming functions
  function startAudio() {
    if (!isRealTimeRunning) {
      return;
    }
    //
    audioNode = audioContext.createScriptProcessor(8192, 1, 1);

    audioNode.onaudioprocess = function(e) {
      let buffer = e.outputBuffer.getChannelData(0);

      if (isMuted) {
        buffer.map((x) => 0);
      } else {
        fillBuffer(buffer);  
      }
    };

    let source = audioContext.createBufferSource();
    source.connect(audioNode);
    audioNode.connect(audioContext.destination);
    source.start();
  }

  function fillBuffer(buffer) {
    var n = 0;

    for (var i = 0; i < buffer.length; i++) {
      var avg = 0;
      for (var j = 0; j < oversampleRate && n < soundData.length; j++) {
        avg = avg + soundData[n++];
      }
      avg = avg / oversampleRate;
      avg = avg * 0.7;

      buffer[i] = avg;
    }

    if (n >= soundData.Length) {
      soundData = new Array();
    } else {
      soundData.splice(0, n);
    }
  }

  //
  //
  //
  function sampleLoad(url) {
    let sample = {
      name: url,
      id: sgx.audio.Engine.get().registerGlobalSound(url)
    };
    sampleList.push(sample);
    return sample;
  }

  function samplePlay(ref) {
    if (ref && ref.id) {
      sgx.audio.Engine.get().playSound(ref.id);
    }
  }

  function sampleStop(ref) {
    if (ref && ref.id) {
      sgx.audio.Engine.get().stopSound(ref.id);
    }
  }

  function sampleStopAll() {
    sampleList.forEach((s) => {
      sampleStop(s);
    })
  }

  //
  //
  //
  function tonePlay(pitch, duration) {
    let id = toneStart(pitch);
    setTimeout(() => {
      toneStop(id);
    }, duration * 1000);
  }

  function toneStart(pitch) {
    let tone = {
      id: toneID,
      idx: toneList.length,
      oscillator: audioContext.createOscillator()
    };
    toneList.push(tone);
    //
    tone.oscillator.frequency.setValueAtTime(pitch, audioContext.currentTime);
    tone.oscillator.connect(audioContext.destination);
    tone.oscillator.type = "triangle";
    tone.oscillator.start();
    //
    ++toneID;
    //
    return tone.id;
  }

  function toneStop(ref) {
    let tone = toneList.filter((t) => t.id == ref);
    if (tone.length) {
      tone[0].oscillator.stop();
      tone[0].oscillator = undefined;
      delete toneList[tone[0].idx];
    }
  }

  function toneStopAll() {
    toneList.forEach((t) => {
      toneStop(t);
    })
  }


  return {
    // Sample playback
    sampleLoad,
    samplePlay,
    // Pure tones. i.e. individual notes
    tonePlay,
    toneStart,
    toneStop,
    // Generative audio
    rtStart,
    rtApplyDAC1bit,
    rtApplyDAC8bit,
    rtFillDurationDAC1bit,
    //
    reset,
    muteAll,
    unmuteAll,
  }
});

