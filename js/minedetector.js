/**
 * minedetector.js
 * 
 * created 2016/05/04 by macocci7
 * version 1.00
 */


$(function(){

    // Config
    var STR_BOMB = '●';
    var STR_FLAG = 'Ｆ';
    var STR_WRONG_FLAG = '×';
    var STR_IMG_BOMB = 'img/mine.png';
    var STR_IMG_FLAG = 'img/flag.png';
    var STR_PAUSE = "PAUSE";
    var STR_RESTART = "RESTART";
    var iWidth = 30;
    var iHeight = 10;
    var iMines = 50;
    var iSec = 0;
    $("input#iWidth").val(iWidth);
    $("input#iHeight").val(iHeight);
    $("input#iMines").val(iMines);
    var arrReveal = [];
    var arrField = [];
    var iRemain;
    var iFlags;
    var isGameOver = false;
    var intervalID;
    var isStarted = false;
    var tStart;
    var tEnd;
    var tPause;
    var tInterval;
    var COOKIE_NAME_HIGHSCORE = "highscores";
    var objCookieOption = {
        expires: 1000,
        path: getDirName(window.location.pathname),
        domain: document.domain,
        secure: false
    }
    var objHighScores = {};
    var objRanking = {};
    var iHsRankers = 3;
    var iHsNameMaxLength = 16;
    $.cookie.json = true;
    
    init();
    
    // Initialization
    function init() {
        if (loadConfig()===false) { return false; }
        isGameOver = false;
        loadHighScores();
        showHighScores();
        initField();
        setMines();
        countMinesAround();
        drawField();
        setEvents();
    }
    
    function loadConfig() {
        var w = parseInt($("input#iWidth").val(), 10);
        var h = parseInt($("input#iHeight").val(), 10);
        var m = parseInt($("input#iMines").val(), 10);
        if (isNaN(w) || w < 1 || w > 50) { alert("Set a valid number for Width."); return false; }
        if (isNaN(h) || h < 1 || h > 50) { alert("Set a valid number for Height."); return false; }
        if (isNaN(m) || m < 1 || m > w*h-1) { alert("Set a valid number for Mines."); return false; }
        iWidth  = w;
        iHeight = h;
        iMines  = m;
        return true;
    }
    
    function initField() {
        iSec = 0;
        tInterval = 0;
        $("#iSec").text(iSec);
        $("table#MineField tbody").children().remove();
        iRemain = iWidth * iHeight;
        iFlags = 0;
        $("#iRemain").text(iRemain);
        for (i=0; i<=iWidth+1; i++) {
            arrReveal[i] = [];
            arrField[i] = [];
            for (j=0; j<=iHeight+1; j++) {
                arrReveal[i][j] = 0;
                arrField[i][j] = 0;
            }
        }
    }
    
    function setMines() {
        for (var n=1; n<=iMines; n++) {
            while(1) {
                var x = Math.floor( Math.random() * iWidth ) + 1;
                var y = Math.floor( Math.random() * iHeight ) + 1;
                var v = arrField[x][y];
                if (v==-1) { continue; }
                arrField[x][y] = -1;
                break;
            }
        }
    }
    
    function countMinesAround() {
        for (var j=1; j<=iHeight; j++) {
            for (var i=1; i<=iWidth; i++) {
                if (arrField[i][j]==-1) { continue; }
                var iCount = 0;
                if (arrField[i-1][j-1]==-1) { iCount++; }
                if (arrField[i  ][j-1]==-1) { iCount++; }
                if (arrField[i+1][j-1]==-1) { iCount++; }
                if (arrField[i-1][j  ]==-1) { iCount++; }
                if (arrField[i  ][j  ]==-1) { iCount++; }
                if (arrField[i+1][j  ]==-1) { iCount++; }
                if (arrField[i-1][j+1]==-1) { iCount++; }
                if (arrField[i  ][j+1]==-1) { iCount++; }
                if (arrField[i+1][j+1]==-1) { iCount++; }
                arrField[i][j] = iCount;
            }
        }
    }
    
    function drawField() {
        for (var j=1; j<=iHeight; j++) {
            $("table#MineField tbody").append('<tr y="'+j+'"></tr>');
            for (var i=1; i<=iWidth; i++) {
                var v = arrField[i][j];
                var strSelector = "table#MineField tbody tr[y='"+j+"']";
                //var strTag = '<td x="'+i+'" y="'+j+'" class="hide">'+v+'</td>';
                var strTag = '<td x="'+i+'" y="'+j+'" class="hide"></td>';
                $(strSelector).append(strTag);
            }
        }
    }
    
    // On clicking Reset button
    $(".reset").click(function(){
        endGame();
        init();
        return true;
    });
    
    // On clicking Pause button
    $(".pause").click(function(){
        pauseGame();
        return true;
    });
    
    // On clicking Restart button
    $(".restart").click(function(){
        restartGame();
        return true;
    });
    
    function setEvents() {
        // On right click
        $("td.hide").bind('contextmenu', function(){
            if (isGameOver) { return false; }
            if (isStarted===false) { startGame(); }
            setAFlag(this);
            return false;
        });
        
        // On left click
        $("td.hide").click(function(){
            if (isGameOver) { return false; }
            if (isStarted===false) { startGame(); }
            if ($(this).hasClass("flag")) { return false; }
            // when stepping on a mine
            if (isMine(this)) {
                gameOver(this);
                return;
            }
            // when not a mine
            if (isRevealable(this)) {
                revealAPanel(this);
                if (iRemain===iMines) {
                    clearGame();
                }
            }
        });
    }
    
    function startGame() {
        isStarted = true;
        tStart = new Date();
        $(".pause").text(STR_PAUSE).removeClass("invisible");
        $(".restart").text("").addClass("invisible");
        startTimer();
    }
    
    function startTimer() {
        intervalID = setInterval(function(){
                        var tCurrent = new Date();
                        iSec = parseInt((tCurrent.getTime() - tStart.getTime() - tInterval) / 1000, 10);
                        $("#iSec").text(iSec);
                     }, 500);
    }
    
    // Judge whether the panel is mine or not
    function isMine(Target) {
        var x = parseInt($(Target).attr("x"), 10);
        var y = parseInt($(Target).attr("y"), 10);
        var v = arrField[x][y];
        if (v==-1) return true;
        return false;
    }
    
    // Judge wheter the panel is revealable or not
    function isRevealable(Target) {
        var x = parseInt($(Target).attr("x"), 10);
        var y = parseInt($(Target).attr("y"), 10);
        var v = arrReveal[x][y];
        if (v==0) return true;
        return false;
    }
    
    // Judge whether the coordinates is in field range or not
    function isInRange(x,y) {
        if (x>=1 && x<=iWidth && y>=1 && y<=iHeight) return true;
        return false;
    }
    
    // reveal a panel
    function revealAPanel(Target) {
        iRemain--;
        $("#iRemain").text(iRemain);
        var x = parseInt($(Target).attr("x"), 10);
        var y = parseInt($(Target).attr("y"), 10);
        var v = arrField[x][y];
        arrReveal[x][y] = 1;
        $(Target).removeClass("hide").addClass("revealed").attr("v", v).text((v===0)?"":v);
        if (arrField[x][y]==0) {
            revealAround(Target);
        }
    }
    
    // revealing around
    function revealAround(Target) {
        var i,j,x,y,tx,ty
        var x = parseInt($(Target).attr("x"), 10);
        var y = parseInt($(Target).attr("y"), 10);
        for (j=-1;j<=1;j++) {
            ty = y + j;
            for (i=-1;i<=1;i++) {
                tx = x + i;
                if (isInRange(tx,ty)) {
                    // call the function revealAPanel() recursively
                    if (arrReveal[tx][ty]==0) revealAPanel($("td[x="+tx+"][y="+ty+"]"));
                }
            }
        }
    }
    
    // showing all mines
    function showAllMines() {
        $.each($("#MineField td"), function(){
            var x = parseInt($(this).attr("x"), 10);
            var y = parseInt($(this).attr("y"), 10);
            var v = arrField[x][y];
            if (v == -1) {
                //$(this).removeClass("hide").attr("v", v).text(STR_BOMB);
                $(this).removeClass("hide").attr("v", v).html('<img src="'+STR_IMG_BOMB+'" width="16" height="16" alt="'+STR_BOMB+'" />');
            }
        });
        $.each($("td.flag"), function(){
            var x = parseInt($(this).attr("x"), 10);
            var y = parseInt($(this).attr("y"), 10);
            var v = arrField[x][y];
            if (v>-1) {
                $(this).text(STR_WRONG_FLAG);
            }
        });
    }
    
    // set(or remove) a flag on the panel
    function setAFlag(Target) {
        var x = parseInt($(Target).attr("x"), 10);
        var y = parseInt($(Target).attr("y"), 10);
        if (arrReveal[x][y] == 1) { return false; }
        if ($(Target).hasClass("flag")) {
            // remove a flag
            var v = arrField[x][y];
            arrReveal[x][y]=0;
            //$(Target).text("").removeClass("flag");
            $(Target).html("").removeClass("flag");
            iFlags--;
        } else if ($(Target).hasClass("hide")) {
            // set a flag
            arrReveal[x][y]=-1;
            //$(Target).text(STR_FLAG).addClass("flag");
            $(Target).append('<img src="'+STR_IMG_FLAG+'" alt="'+STR_FLAG+'" width="10" height="10" />').addClass("flag");
            iFlags++;
        }
        $("#iFlags").text(iFlags);
    }
    
    // set flags on all mines
    function setFlagsOnAllMines() {
        jQuery.each($("#MineField td"), function(){
            var x = parseInt($(this).attr("x"), 10);
            var y = parseInt($(this).attr("y"), 10);
            var v = arrField[x][y];
            if (v == -1 && !$(this).hasClass("flag")) {
                setAFlag(this);
            }
        });
    }
    
    function pauseGame() {
        isGameOver = true;
        tPause = new Date();
        clearInterval(intervalID);
        $(".pause").text("").addClass("invisible");
        $(".restart").text(STR_RESTART).removeClass("invisible");
    }
    
    function restartGame() {
        isGameOver = false;
        var tCurrent = new Date();
        tInterval += tCurrent.getTime() - tPause.getTime();
        $(".pause").text(STR_PAUSE).removeClass("invisible");
        $(".restart").text("").addClass("invisible");
        startTimer();
    }
    
    function endGame() {
        isStarted = false;
        $(".pause").text("").addClass("invisible");
        clearInterval(intervalID);
        isGameOver = true;
    }
    
    function clearGame() {
        endGame();
        setFlagsOnAllMines();
        if (isHighScore()) {
            alert("You win!\n\nYou've got a new record!");
            inputHighScoreRanker();
        } else {
            alert("You win!");
        }
    }
    
    function gameOver(Target) {
        endGame();
        $(Target).addClass("red");
        showAllMines();
        alert("Game over.\n\nTry again.");
    }
    
    function loadHighScores() {
        var objHs = $.cookie(COOKIE_NAME_HIGHSCORE);
        var stHsClass = getHighScoreClassName();
        objHighScores = (typeof objHs === "undefined") ? {} : objHs;
        if (! objHighScores.hasOwnProperty(stHsClass)) { objHighScores[stHsClass] = {}; }
    }
    
    function showHighScores() {
        var stHsClass = getHighScoreClassName();
        for (var i = 1; i <= iHsRankers; i++) {
            var stText = "---";
            if (i in objHighScores[stHsClass]) {
                var stName = objHighScores[stHsClass][i].name;
                var iTime  = objHighScores[stHsClass][i].time;
                stText = (typeof iTime === "undefined")
                       ? "---"
                       : (
                            (typeof stName === "undefined")
                            ? "nobody " + iTime + "sec."
                            : stName + " " + iTime + "sec."
                         );
            }
            $("#hs"+i).text(stText);
        }
    }
    
    function isHighScore() {
        var stHsClass = getHighScoreClassName();
        if (!objHighScores.hasOwnProperty(stHsClass)) { return true; }
        var objHs = objHighScores[stHsClass];
        for (var i = 1; i <= iHsRankers; i++) {
            if (!objHs.hasOwnProperty(i)) { return true; }
            var iTime = objHs[i].time;
            if (iTime > iSec) { return true; }
        }
    }
    
    function getHighScoreRank() {
        var stHsClass = getHighScoreClassName();
        if (!objHighScores.hasOwnProperty(stHsClass)) { return 1; }
        var objHs = objHighScores[stHsClass];
        for (var i = 1; i<=iHsRankers; i++) {
            if (!objHs.hasOwnProperty(i)) { return 1; }
            var iTime = objHs[i].time;
            if (typeof iTime === "undefined" || iTime > iSec) { return i; }
        }
        return 0;
    }
    
    function getHighScoreClassName() {
        return "w" + iWidth.toString() + "h" + iHeight.toString();
    }
    
    function inputHighScoreRanker() {
        var iRank = getHighScoreRank();
        if (iRank > 0) {
            $("#input-rankers-name").dialog("open");
        }
    }
    
    function registHighScore() {
        var stHsClass = getHighScoreClassName();
        objHighScores[stHsClass] = getNewHighScores(stHsClass);
        saveHighScores();
        showHighScores();
    }

    function getNewHighScores(stHsClass) {
        var stRanker = validateRankerName($("input#ranker").val());
        var isSet = false;
        var i = 0;
        var objTmp = {};
        if (typeof objHighScores[stHsClass] === "undefined") {
            return { 1: { "name": stRanker, "time": iSec } };
        }
        var objHs = objHighScores[stHsClass];
        while (i < iHsRankers) {
            i++;
            if (typeof objHs[i] === "undefined") {
                if (isSet === false) {
                    objTmp[i] = { "name": stRanker, "time": iSec };
                    isSet = true;
                    continue;
                }
                if (typeof objHs[i-1] === "undefined") {
                    break;
                }
                objTmp[i] = objHs[i-1];
                continue;
            }
            if (iSec >= objHs[i].time) {
                objTmp[i] = objHs[i];
            } else if (iSec < objHs[i].time && isSet === false) {
                objTmp[i] = { "name": stRanker, "time": iSec };
                isSet = true;
            } else {
                objTmp[i] = objHs[i-1];
            }
        }
        return objTmp;
    }
    
    function saveHighScores() {
        $.cookie(COOKIE_NAME_HIGHSCORE, objHighScores, objCookieOption);
    }
    
    function validateRankerName(stName) {
        var stResult = stName.substr(0,iHsNameMaxLength);
        return escapeHtml(stResult);
    }
    
    $("#input-rankers-name").dialog({
        autoOpen: false,
        show: false,
        hide: false,
        modal: true,
        buttons: {
            '登録': function() {
                registHighScore();
                $(this).dialog('close');
            }
        }
    });
    
    $("#button-input-rankers-name").click(function(){
        $("#input-rankers-name").dialog("open");
    });
    
    $("input").keypress(function(e){
        if (e.which && e.which === 13 || e.keyCode && e.keyCode === 13) {
            return false;
        } else {
            return true;
        }
    });
});
