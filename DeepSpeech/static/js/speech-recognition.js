/*
 * D2019/01/28. CHENBAOWEN,
 * defined a CoSpeechRecognition class.., connect co-speech project...
 * Below is an example:
 * 
 *  var callback = {}; //business obj... 
 *	var sid="test";
 *	var wsurl = window.location.hostname + ":" + window.location.port + "/co-speech/ws/"+ sid;	
 *		
 *	var ws = new CoSpeechRecognition(callback);	
 *	ws.connect(wsurl);	//connect websocket url..		
 *				
 *	var reqParams = {"appName":testModelName,...};
 *	ws.start(reqParams); //start
 *	
 *  ws.sendBinary(item);//send audio stream
 *		
 * 	var reqParams = {"appName":testModelName};			 
 * 	ws.stop(reqParams);	//stop		
 * 
 * 	
 */
(function() {
	CoSpeechRecognition = function(callback1) {			 
		this.callback = (callback1 || {});
		this.ws = '';
		return this;
	};

	CoSpeechRecognition.prototype.connect = function(wsurl) {
		 if ('WebSocket' in window) {
			 this.ws = new WebSocket(wsurl);
		} else if ('MozWebSocket' in window) {
			this.ws = new MozWebSocket(wsurl);
		} else {
			alert('Error: WebSocket is not supported by this browser.');
			return;
		}		 
		
		var _this = this;
		this.ws.onopen = function() { 
			if ( _this.callback.hasOwnProperty("onOpen")) {
				 _this.callback.onOpen({});
			}
		};
		this.ws.onmessage = function(evt) {
			var received_msg = null; 
			try {
			    //{"sid":"wwwbdc8e2621d714a198749e2d92e34132d","modelid":"google-rpc-async","total_time":"9194","result":["use","use one"], "is_final":"true","recognize_status":"end","filename":"D20190122201443245-3.wav"}
			    //received_msg = JSON.parse(evt.data);
			    //received_msg = eval("(" + evt.data + ")");
			    _this.callback.onMessage(evt.data)
			}
			catch(ex) {
				if (_this.callback.hasOwnProperty("onError")) {				 
					_this.callback.onError(event.data);
				}
				return;
			}
			
//			var is_final_result = ((received_msg && "true" == received_msg.is_final) || false);
//			var is_end = ((received_msg && "true" == received_msg.recognize_status) || false);
//			if ((is_final_result || is_end) && _this.callback.hasOwnProperty("onResponse")) {
//				_this.callback.onResponse(received_msg);
//			} else if ((!is_final_result) && _this.callback.hasOwnProperty("onTranscriptionUpdate")) {
//				_this.callback.onTranscriptionUpdate(received_msg);
//			}
		};
		this.ws.onerror = function(event) {			 
			//alert("connect error...");
			if (_this.callback.hasOwnProperty("onError")) {
				//_this.callback.onerror(JSON.parse(event.data));
				_this.callback.onError(event.data);
			}
		};
		this.ws.onclose = function() {		 
			//alert("connect has close...");
			if (_this.callback.hasOwnProperty("onClose")) {
				_this.callback.onClose({});
			}
		};
	};
	
	/** reqParas is a json object...*/
	CoSpeechRecognition.prototype.start = function(reqParas) {
		if (this.ws== ''){
			return;
		}

		try {			
			var modelName = (reqParas.appName || "google-rpc-async");
			var isUsingVad = (reqParas.isUsingVad || "true");
			var recogNoInputTimeout = (reqParas.recogNoInputTimeout || "5000");
			var enableInterimResult= (reqParas.enableInterimResult || "true");
			var sid = (reqParas.sid || "");
			var qtype = (reqParas.qtype || "");
			var qid = (reqParas.qid || "");
			var startReq = "{'action':'start','config':{'model':'" + modelName + "','recogvad': '" + isUsingVad + "','recogNoInputTimeout': '" + recogNoInputTimeout + "','sid': '" + sid + "','qtype': '" + qtype + "','qid': '" + qid + "', 'enableInterimResult':'" + enableInterimResult + "'}}";
			this.ws.send(startReq);
		} catch (ex) {
			if (this.callback.hasOwnProperty("onError")) {				 
				this.callback.onError(ex);
			}
		}
	};

	CoSpeechRecognition.prototype.sendBinary = function(item) {
		if (this.ws== ''){
			return;
		}

		try {		 
			var state = this.ws.readyState;
			if (state == 1) {
				// If item is an audio blob
				if (item instanceof Blob) {
					this.ws.send(item);
				}		 
			} 			 
		} catch (ex) {
			if (this.callback.hasOwnProperty("onError")) {				 
				this.callback.onError(ex);
			}
		}
	};
	
	CoSpeechRecognition.prototype.stop = function(reqParas) {
		if (this.ws== ''){
			return;
		}

		try {
			var modelName = (reqParas.appName || "google-rpc-async");
			var stopReq = "{'action':'end','config':{'model':'" + modelName + "'}}";		 	
			this.ws.send(stopReq);
		} catch (ex) {
			if (this.callback.hasOwnProperty("onError")) {				 
				this.callback.onError(ex);
			}
		}
	};
	
	
	CoSpeechRecognition.prototype.readyState = function() {
		if (this.ws== ''){
			return -1;
		}
		
		return this.ws.readyState;
	};	

})();