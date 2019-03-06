(function(window) {
	var WORKER_PATH = 'static/js/recorderWorker.js';

	var Recorder = function(source, cfg) {
		var config = cfg || {};
		var bufferLen = config.bufferLen || 4096;
		var numChannels = config.numChannels || 2;
		this.context = source.context;
		this.node = (this.context.createScriptProcessor || this.context.createJavaScriptNode).call(this.context, bufferLen, numChannels, numChannels);
		var worker = new Worker(config.workerPath || WORKER_PATH);
		worker.postMessage({
			command : 'init',
			config : {
				sampleRate : this.context.sampleRate,
				numChannels : numChannels
			}
		});
		var recording = false, currCallback;

		this.node.onaudioprocess = function(e) {
		 
			if (!recording)
				return;
			var buffer = [];
			for (var channel = 0; channel < numChannels; channel++) {
				buffer.push(e.inputBuffer.getChannelData(channel));
			}
			worker.postMessage({
				command : 'record',
				buffer : buffer
			});
			
//			var xdata = downsampleBuffer(buffer[0], this.context.sampleRate, 8000);
//			var data = convertFloat32ToInt16(xdata);
//			var data = convertFloat32ToInt16(buffer[0]);
			
//			var audioBlob = new Blob([ data ], {
//				type : 'audio/wav'
//			});
			
//			__log('Send to server: blob: ' +  data.length);
//			ws.send(data);			
		}

		this.configure = function(cfg) {
			for ( var prop in cfg) {
				if (cfg.hasOwnProperty(prop)) {
					config[prop] = cfg[prop];
				}
			}
		}

		this.record = function() {
			recording = true;
		}

		this.stop = function() {
			recording = false;
		}

		this.clear = function() {
			worker.postMessage({
				command : 'clear'
			});
		}

		this.getBuffer = function(cb) {
			currCallback = cb || config.callback;
			worker.postMessage({
				command : 'getBuffer'
			})
		}

		this.exportWAV = function(cb, type) {
			currCallback = cb || config.callback;
			type = type || config.type || 'audio/wav';
			if (!currCallback)
				throw new Error('Callback not set');
			worker.postMessage({
				command : 'exportWAV',
				type : type
			});
		}
		
		this.export8kRaw = function(cb, type) {
			currCallback = cb || config.callback;
			type = type || config.type || 'audio/x-raw';
			if (!currCallback)
				throw new Error('Callback not set');
			worker.postMessage({
				command : 'export8kRaw',
				type : type
			});
		}
		this.export16kRaw = function(cb, type) {
			currCallback = cb || config.callback;
			type = type || config.type || 'audio/x-raw';
			if (!currCallback)
				throw new Error('Callback not set');
			worker.postMessage({
				command : 'export16kRaw',
				type : type
			});
		}

		worker.onmessage = function(e) {
			var blob = e.data;	 
			currCallback(blob);
		}

		function convertFloat32ToInt16(buffer) {
			  l = buffer.length;
			  buf = new Int16Array(l);
			  while (l--) {
			    buf[l] = Math.min(1, buffer[l])*0x7FFF;
			  }
			  return buf;
		}
		

		function downsampleBuffer(buffer, sampleRate ,rate) {
	
			if (rate == sampleRate) {
				return buffer;
			}
			if (rate > sampleRate) {
				throw "downsampling rate should be smaller than original sample rate";
			}
			var sampleRateRatio = sampleRate / rate;
			var newLength = Math.round(buffer.length / sampleRateRatio);
			var result = new Float32Array(newLength);
			var offsetResult = 0;
			var offsetBuffer = 0;
			while (offsetResult < result.length) {
				var nextOffsetBuffer = Math.round((offsetResult + 1) * sampleRateRatio);
				var accum = 0, count = 0;
				for (var i = offsetBuffer; i < nextOffsetBuffer && i < buffer.length; i++) {
					accum += buffer[i];
					count++;
				}
				result[offsetResult] = accum / count;
				offsetResult++;
				offsetBuffer = nextOffsetBuffer;
			}
			return result;
		}

		
		function encode64(buffer) {
			var binary = '', bytes = new Uint8Array(buffer), len = bytes.byteLength;

			for (var i = 0; i < len; i++) {
				binary += String.fromCharCode(bytes[i]);
			}
			return window.btoa(binary);
		}

		function parseWav(wav) {
			function readInt(i, bytes) {
				var ret = 0, shft = 0;

				while (bytes) {
					ret += wav[i] << shft;
					shft += 8;
					i++;
					bytes--;
				}
				return ret;
			}
			if (readInt(20, 2) != 1)
				throw 'Invalid compression code, not PCM';
			if (readInt(22, 2) != 1)
				throw 'Invalid number of channels, not 1';
			return {
				sampleRate : readInt(24, 4),
				bitsPerSample : readInt(34, 2),
				samples : wav.subarray(44)
			};
		}

		function Uint8ArrayToFloat32Array(u8a) {
			var f32Buffer = new Float32Array(u8a.length);
			for (var i = 0; i < u8a.length; i++) {
				var value = u8a[i << 1] + (u8a[(i << 1) + 1] << 8);
				if (value >= 0x8000)
					value |= ~0x7FFF;
				f32Buffer[i] = value / 0x8000;
			}
			return f32Buffer;
		}

		function uploadAudio(mp3Data) {
			var reader = new FileReader();
			reader.onload = function(event) {
				var fd = new FormData();
				var mp3Name = encodeURIComponent('audio_recording_'
						+ new Date().getTime() + '.mp3');
				console.log("mp3name = " + mp3Name);
				fd.append('fname', mp3Name);
				fd.append('data', event.target.result);
				$.ajax({
					type : 'POST',
					url : 'upload.php',
					data : fd,
					processData : false,
					contentType : false
				}).done(function(data) {
					//console.log(data);
					log.innerHTML += "\n" + data;
				});
			};
			reader.readAsDataURL(mp3Data);
		}

		source.connect(this.node);
		this.node.connect(this.context.destination); //this should not be necessary
	};

	Recorder.forceDownload = function(blob, filename) {
		var url = (window.URL || window.webkitURL).createObjectURL(blob);
		var link = window.document.createElement('a');
		link.href = url;
		link.download = filename || 'output.wav';
		var click = document.createEvent("Event");
		click.initEvent("click", true, true);
		link.dispatchEvent(click);
	}

	window.Recorder = Recorder;

})(window);
