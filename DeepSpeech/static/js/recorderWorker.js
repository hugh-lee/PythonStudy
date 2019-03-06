var recLength = 0, recBuffersL = [], recBuffersR = [], bits = 16, sampleRate;

this.onmessage = function(e) {
	switch (e.data.command) {
	case 'init':
		init(e.data.config);
		break;
	case 'record':
		record(e.data.buffer);
		break;
	case 'exportWAV':
		exportWAV(e.data.type);
		break;
	case 'export8kRaw':
		export8kRaw(e.data.type);
		break;
	case 'export16kRaw':
		export16kRaw(e.data.type);
		break;
	case 'getBuffer':
		getBuffer();
		break;
	case 'clear':
		clear();
		break;
	}
};

function init(config) {
	sampleRate = config.sampleRate;
}

function record(inputBuffer) {
	recBuffersL.push(inputBuffer[0]);
	//recBuffersR.push(inputBuffer[1]);
	//console.log(inputBuffer[0]);
	//  console.log(Math.max(inputBuffer[0]));
	//  for ( var i = 0; i < inputBuffer[0].length; i++) {
	//	console.log(inputBuffer[0][i]);
	//  }
	recLength += inputBuffer[0].length;
}

function exportWAV(type) {
	var bufferL = mergeBuffers(recBuffersL, recLength);
	//var bufferR = mergeBuffers(recBuffersR, recLength);
	//var interleaved = interleave(bufferL, bufferR);
	//var dataview = encodeWAV(interleaved);
	var downsampledBuffer = downsampleBuffer(bufferL, 16000);
	/*var dataview = encodeWAV(bufferL);*/
	var dataview = encodeWAV(downsampledBuffer);
	var audioBlob = new Blob([ dataview ], {
		type : type
	});

	this.postMessage(audioBlob);
}


function export8kRaw(type){
  var buffer = mergeBuffers(recBuffersL, recLength);
  var downsampledBuffer = downsampleBuffer(buffer, 8000);
  var dataview = encodeRAW(downsampledBuffer);
  var audioBlob = new Blob([dataview], { type: type });

  this.postMessage(audioBlob);
}
function export16kRaw(type){
  var buffer = mergeBuffers(recBuffersL, recLength);
  var downsampledBuffer = downsampleBuffer(buffer, 16000);
  var dataview = encodeRAW(downsampledBuffer);
  var audioBlob = new Blob([dataview], { type: type });

  this.postMessage(audioBlob);
}
function encodeRAW(samples){
  var buffer = new ArrayBuffer(samples.length * 2);
  var view = new DataView(buffer);
  floatTo16BitPCM(view, 0, samples);
  return view;
}


function getBuffer() {
	var buffers = [];
	buffers.push(mergeBuffers(recBuffersL, recLength));
	buffers.push(mergeBuffers(recBuffersR, recLength));
	this.postMessage(buffers);
}

function clear() {
	recLength = 0;
	recBuffersL = [];
	recBuffersR = [];
}

function mergeBuffers(recBuffers, recLength) {
	var result = new Float32Array(recLength);
	var offset = 0;
	for (var i = 0; i < recBuffers.length; i++) {
		result.set(recBuffers[i], offset);
		offset += recBuffers[i].length;
	}
	return result;
}

function interleave(inputL, inputR) {
	var length = inputL.length + inputR.length;
	var result = new Float32Array(length);

	var index = 0, inputIndex = 0;

	while (index < length) {
		result[index++] = inputL[inputIndex];
		result[index++] = inputR[inputIndex];
		inputIndex++;
	}
	return result;
}

function floatTo16BitPCM(output, offset, input) {
	for (var i = 0; i < input.length; i++, offset += 2) {
		var s = Math.max(-1, Math.min(1, input[i]));
		output.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
	}
}

function writeString(view, offset, string) {
	for (var i = 0; i < string.length; i++) {
		view.setUint8(offset + i, string.charCodeAt(i));
	}
}

/*function encodeLowWAV(samples) {
 var block_align   = (1 * bits) / 8
 ,   byte_rate     = sampleRate * block_align
 ,   data_size     = (samples.length * bits) / 8
 ,   buffer        = new ArrayBuffer(44 + data_size)
 ,   view          = new DataView(buffer);

 writeString( view, 0, 'RIFF' );
 view.setUint32( 4, 32 + data_size, true ); //!!!
 writeString( view, 8, 'WAVE' );
 writeString( view, 12, 'fmt' );
 view.setUint32( 16, 16, true );
 view.setUint16( 20, 1, true );
 view.setUint16( 22, 1, true );
 view.setUint32( 24, sampleRate, true );
 view.setUint32( 28, byte_rate, true );
 view.setUint16( 32, block_align, true );
 view.setUint16( 34, bits, true );
 writeString( view, 36, 'data' );
 view.setUint32( 40, data_size, true ); //!!!
 floatTo16BitPCM( view, 44, samples );

 return view;
 }*/

function downsampleBuffer(buffer, rate) {
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

function encodeWAV(samples) {
	var buffer = new ArrayBuffer(44 + samples.length * 2);
	var view = new DataView(buffer);

	/* RIFF identifier */
	writeString(view, 0, 'RIFF');
	/* file length */
	view.setUint32(4, 32 + samples.length * 2, true);
	/* RIFF type */
	writeString(view, 8, 'WAVE');
	/* format chunk identifier */
	writeString(view, 12, 'fmt ');
	/* format chunk length */
	view.setUint32(16, 16, true);
	/* sample format (raw) */
	view.setUint16(20, 1, true);
	/* channel count */
	//view.setUint16(22, 2, true); /*STEREO*/
	view.setUint16(22, 1, true); /*MONO*/
	/* sample rate */
	view.setUint32(24, 16000, true);
	/* byte rate (sample rate * block align) */
	//view.setUint32(28, sampleRate * 4, true); /*STEREO*/
	view.setUint32(28, 16000 * 2, true); /*MONO*/
	/* block align (channel count * bytes per sample) */
	//view.setUint16(32, 4, true); /*STEREO*/
	view.setUint16(32, 2, true); /*MONO*/
	/* bits per sample */
	view.setUint16(34, 16, true);
	/* data chunk identifier */
	writeString(view, 36, 'data');
	/* data chunk length */
	view.setUint32(40, samples.length * 2, true);

	floatTo16BitPCM(view, 44, samples);

	return view;
}
