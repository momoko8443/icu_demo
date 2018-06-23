var uku = new Ukulele();
var appCtrl = new ApplicationController(uku);
uku.registerController('appCtrl', appCtrl);
uku.init();
uku.addListener(Ukulele.INITIALIZED, function () {
    appCtrl.init();
});



function ApplicationController(uku) {
    this.loadCamera = true;
    this.waitingJoin = true;
    this.hasInvite = false;
    this.inMeeting = false;
    this.time = "00:00";
    var isOccupy = false;
    var selfEasyrtcid = "";
    var callerId = "";
    var self = this;
    var acceptorHandler;
    this.init = function(){
        this.clientMode = getClientMode();
        uku.refresh('appCtrl');
        easyrtc.setVideoDims(720,720);
        easyrtc.setRoomOccupantListener(roomOccupantHandler);
        easyrtc.easyApp("easyrtc.audioVideoSimple", "selfVideo", ["callerVideo"], loginSuccess, loginFailure);
        easyrtc.setUsername(this.clientMode);
        easyrtc.setAcceptChecker(function(easyrtcid, acceptor){
            if(self.clientMode === 'passive'){
                console.log('acceptor ',easyrtcid);
                self.hasInvite = true;
                self.callerName = easyrtc.idToName(easyrtcid);
                acceptorHandler = acceptor;
                uku.refresh('appCtrl');
            }      
        });
        easyrtc.setPeerClosedListener(function(){
            console.log('PeerClosed');
            self.hasInvite = false;
            self.inMeeting = false;
            self.canInvite = true;
            uku.refresh('appCtrl');
        });
    };

    this.accept = function(){
        // if(callerId){
        //     performCall(callerId);
        // }
        acceptorHandler(true);  
        this.hasInvite = false;
        this.inMeeting = true;
        //uku.refresh('appCtrl');
    };

    this.call = function(){
        if(callerId){
            performCall(callerId);
        }
    }

    this.hangUp = function(){
        easyrtc.hangupAll();
        this.inMeeting = false;
        self.waitingJoin = true;
    };

    function getClientMode(){
        var url = window.location.href;
        var params = new URL(url).searchParams;
        var mode = params.get('mode');
        if(mode && mode === 'active'){
            return 'active';
        }
        return 'passive';
    }
    

    function roomOccupantHandler (roomName, data, isPrimary) {
        if(self.clientMode === 'active'){
            var keys = Object.keys(data);
            if(keys.length === 0){
                return;
            }
            callerId = keys[0];
            self.canInvite = true;
            self.otherClientName = easyrtc.idToName(callerId);
            uku.refresh('appCtrl');
        }      
    }

    function performCall(otherEasyrtcid) {
        easyrtc.hangupAll();
        var successCB = function() {
            console.log('performCall Success');
            self.waitingJoin = false;
            self.inMeeting = true;
            self.canInvite = false;
            uku.refresh('appCtrl');
        };
        var failureCB = function() {};
        var wasAcceptedCB = function(wasAccepted, easyrtcid){
            if( wasAccepted ){
               console.log("call accepted by " + easyrtc.idToName(easyrtcid));
               if(self.clientMode === 'active'){
                   self.canInvite = false;
                   self.inMeeting = true;
                   uku.refresh('appCtrl');
               }
            }
            else{
                console.log("call rejected" + easyrtc.idToName(easyrtcid));
            }
        };
        easyrtc.call(otherEasyrtcid, successCB, failureCB,wasAcceptedCB);
    }

    function loginSuccess(easyrtcid) {
        console.log('login Success');
        selfEasyrtcid = easyrtcid;
        self.loadCamera = false;
        uku.refresh('appCtrl');
    }

    function loginFailure(errorCode, message) {
        easyrtc.showError(errorCode, message);
    }
}