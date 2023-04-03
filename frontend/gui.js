var gui = (function () {

	'use strict';

	var publicGui = {};

    publicGui.onLoad = function () {
        gui.showHideSend(false);
        gui.showStatus("");
        gui.showInfo("");
        gui.showTime("");
        gui.showPageGame();
        showGOPprice();
    }; 

    publicGui.showPageGame = function () {
        $('#featPageStat').hide();
        $('#featPageToken').hide();
        $('#featPage1').hide();
        $('#featPage2').hide();
        $('#gamePage').show();
        $('#menuGame').addClass("w3-white");
        $('#menuFeat').removeClass("w3-white");
        $('#menuFeat1').removeClass("w3-white");
        gui.showStatus("");
        gui.showInfo("");
    };  

    publicGui.showPageFeat = function () {
        $('#gamePage').hide();
        $('#featPageStat').show();
        $('#featPageToken').show();
        $('#featPage1').show();
        $('#featPage2').show();
        $('#menuGame').removeClass("w3-white");
        $('#menuFeat').addClass("w3-white");
        $('#menuFeat1').addClass("w3-white");
        gui.showStatus("");
        gui.showInfo("");
    };  


    publicGui.showError = function (msg) {
        gui.showInfo(msg);
    };  
    publicGui.showLog = function (msg) {
        console.log(msg);
    };    
    publicGui.showInfo = function (msg) {
        $("#txGameStatus").text(msg);
    };   
    publicGui.showStatus = function (msg) {
        $("#txStatus").text(msg);
    };  
    publicGui.showAlert = function (msg) {
        alert(msg);
    }; 

    function showGOPprice () {
        if (isBTTC) {  
            $("#gopPrice").text("1 GOP = 1000000 BTT");
        } else {
            $("#gopPrice").text("1 GOP = 0.005 ETH");
        }
    };   

	// A public method
	publicGui.removeOperations = function () {
        console.log("removeOperations");

        $('#gmOps').children().each( (index, element) => {
            element.remove();
        });
        $('#gmOpsW3').children().each( (index, element) => {
            element.remove();
        });
        $("#target").text("target");
        $("#num1").prop("value", 1);
        $("#num2").prop("value", 2);
        $("#num3").prop("value", 3);
        $("#num4").prop("value", 4);
        $("#num5").prop("value", 5);
        $("#num6").prop("value", 6);
        $("#num7").prop("value", 7);
        $("#num8").prop("value", 8);
    
        gui.showHideSend(false);
	};

    publicGui.removeOperation = function (id) {
        $("#lineop_" + id).remove();

        let count = $("#gmOpsW3").children().length;
        if (count == 0) {
            gui.showHideSend(false);
        }
    }

    publicGui.showGameData = function (nums) {
        $("#num1").prop("value", nums[0]);
		$("#num2").prop("value", nums[1]);
		$("#num3").prop("value", nums[2]);
		$("#num4").prop("value", nums[3]);
		$("#num5").prop("value", nums[4]);
		$("#num6").prop("value", nums[5]);
		$("#num7").prop("value", nums[6]);
		$("#num8").prop("value", nums[7]);
    };

    publicGui.showMeritData = function (id, opmeritClaimed, opmeritWon) {
        let divMeritOwid = "#divMeritOw" + id;
        let divMeritCbid = "#divMeritCB" + id;
        let divMerit = "#divMerit" + id;
        if (opmeritClaimed == 1) {
            $(divMeritOwid).show();
            $(divMeritCbid).hide();            
            $(divMerit).removeClass("w3-hover-opacity w3-grayscale");
        }
        else {
            $(divMeritOwid).hide();
            let claimMerit = "#claimMerit" + id;
            let buyMerit = "#buyMerit" + id;
            if (opmeritWon == 1) {
                $(claimMerit).show().prop('disabled', false);;
                $(buyMerit).hide();
            }
            else {
                $(claimMerit).hide();
                $(buyMerit).show().prop('disabled', false);
            }
            $(divMeritCbid).show();
            $(divMerit).addClass("w3-hover-opacity w3-grayscale");
        }       
    }

    publicGui.showMeritDataAll = function (opmeritClaimed, opmeritWon) {
        gui.showMeritData(0, opmeritClaimed[0], opmeritWon[0]);
        gui.showMeritData(1, opmeritClaimed[1], opmeritWon[1]);
        gui.showMeritData(2, opmeritClaimed[2], opmeritWon[2]);
        gui.showMeritData(3, opmeritClaimed[3], opmeritWon[3]);
        gui.showMeritData(4, opmeritClaimed[4], opmeritWon[4]);
        gui.showMeritData(5, opmeritClaimed[5], opmeritWon[5]);
    };

    publicGui.showHideClaimOpToken = function (isshow) {
        if (isshow) {
            $('#claimOpToken').show().prop('disabled', false);
        } else {
            $('#claimOpToken').prop('disabled', true);
        }
    };

    publicGui.showNcPlayed = function (val) {
        $("#ncPlayed").text(val);
    };

    publicGui.showNcWon = function (val) {
        $("#ncWon").html(val);
    };

    publicGui.showPlayer = function (str) {
        $("#gmPlayer").text(str);
        $("#gmPlayer1").text(str);
    };

    publicGui.showHideConnect = function (isshow) {
        if (isshow) {
            $('#btnConnect').show().prop('disabled', false);
            $('#btnConnect1').show().prop('disabled', false);
        } else {
            $('#btnConnect').hide().prop('disabled', true);
            $('#btnConnect1').hide().prop('disabled', true);
        }
    };

    publicGui.showHideSend = function (isshow) {
        if (isshow) {
            $('#btnSend').show().prop('disabled', false);
        } else {
            $('#btnSend').hide().prop('disabled', true);
        }
    };

    publicGui.showTarget = function (str) {
        $("#target").prop('value', str);
    };

    publicGui.hideTarget = function (str) {
        $("#target").prop('value', str);
    };

    publicGui.showTime = function (str) {
        $("#gmTime").text(str);
        $("#gmTime1").text(str);
    };

    publicGui.hideTmpOper = function () {
        $("#gmTempOper").hide();
        $("#gmTempOperVal").prop('value', "");
        $("#gmTempOperOp").prop('value', "");
    };

    publicGui.showTmpOperVal = function (val) {
        $("#gmTempOper").show();
        $("#gmTempOperVal").prop('value', val);
    };

    publicGui.showTmpOperValOp = function (val, op) {
        $("#gmTempOper").show();
        $("#gmTempOperVal").prop('value', val);
        $("#gmTempOperOp").prop('value', op);
    };

    publicGui.showWon = function (isWon, reason) {
        //$("#gmPlayer").text("Player = " + data.player + " id = " + data.gameid + " won = " + data.isWon + " reason: " + data.reason);
        gui.showStatus(isWon ? "WON" : "LOST");
        gui.showInfo(reason);
        gui.showHideSend(false);
        gui.showTime("");
    };

    publicGui.showOperation = function (idlineop, cntres, idopval1, opval1, idopcur, curoptxt, idopval2, opval2, idres, resval) {
        $("#gmOps").prepend(`<div class="linenewop" id = "${idlineop}">
            <ul>
                <div class="newop">
                <input type = "button" onclick = "game.delOp(this.id)" id = "${cntres}" value = "x" />
                <input type="button" id="${idopval1}" value="${opval1}" disabled >
                <input type="button" id="${idopcur}" value="${curoptxt}" disabled>
                <input type="button" id="${idopval2}" value="${opval2}" disabled>
                =
                <input type = "button" onclick = "game.setNum(this.id)" id = "${idres}" value = "${resval}" />	
                </div>
            </ul>
        </div>`);

        $("#gmOpsW3").prepend(`<div class="linenewop" id = "${idlineop}">
            
                <div class="newop w3-bar w3-center w3-padding-small">
                <input type="button" onclick = "game.delOp(this.id)" id = "${cntres}" value = "x" class="w3-button w3-red" style="width:10%"/>
                <input type="button" id="${idopval1}" value="${opval1}" class="w3-button w3-teal" style="width:20%" disabled >
                <input type="button" id="${idopcur}" value="${curoptxt}" class="w3-button w3-white" style="width:5%" >
                <input type="button" id="${idopval2}" value="${opval2}" class="w3-button w3-teal" style="width:20%" disabled>
                <input type="button" value="=" class="w3-button w3-white" style="width:5%">
                <input type = "button" onclick = "game.setNum(this.id)" id = "${idres}" value = "${resval}" class="w3-button w3-teal"style="width:20%"/>	
                </div>
            
        </div>`);
        gui.showHideSend(true);
    };

	return publicGui;

})();