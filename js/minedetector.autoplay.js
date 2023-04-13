/**
 * minedetector.autoplay.js
 *
 * created 2016/05/27 by macocci7
 * version 1.00
 */

$(function(){
    // Config
    var iWidth;
    var iHeight;
    var iMines;
    var iRemain;
    var iFlags;
    var isStalemated = false;
    var isFlagStalemated = false;
    var isRevealingStalemated = false;
    var isAble2ClickRandomPanel = false;
    var COOKIE_NAME_THEORY_LOG = "theorylog";
    var objCookieOption = {
        expires: 1000,
        path: getDirName(window.location.pathname),
        domain: document.domain,
        secure: false
    }
    var objTheoryLog = {};
    $.cookie.json = true;
    
    /**
    var objTheoryLog = {
        "121Upper" : {
                        "matched": 1234,
                        "flags": {
                                    "2": 1234
                                 }
                     },
        "121Lower" : {
                        "matched": 1212,
                        "flags": {
                                    "2": 1212
                                 }
                     },
        "121Right" : {
                        "matched": 1243,
                        "flags": {
                                    "2": 1243
                                 }
                     },
        "121Left" : {
                        "matched": 1223,
                        "flags": {
                                    "2": 1223
                                 }
                     }
    };
    **/
    
    $(".autoplay").click(function(){
        playAutomatically();
    });
    
    function playAutomatically() {
        console.log("getFunctionName():"+getFunctionName());
        isStalemated = false;
        getStatus();
        //showColumnAndRowNumber();
        if (isStarted()===false) { clickRandomPanel(); }
        if (isGameOver()===true) { return false; }
        loadTheoryLog();
        //showTheoryLog();
        var i = 0;
        //while (isStalemated===false) {
            i++;
            console.log("while loop ["+i+"] has started.");
            var bResultSetFlags = setFlagsAutomatically();
            var bResultRevealPanels = revealPanelsAutomatically();
            if (bResultSetFlags===false && bResultRevealPanels===false) {
                isStalemated = true; 
            }
            if (isCleared()) {
                console.log("Cleared!");
                //break;
            }
        //}
        console.log("Autoplay done.");
        if (isStalemated===false) {
            setTimeout(function(){ $(".autoplay").click(); }, 200);
        } else if (isAble2ClickRandomPanel) {
            console.log("Stalemated...going to click random panel");
            clickRandomPanel();
            setTimeout(function(){ $(".autoplay").click(); }, 200);
        }
    }
    
    function loadTheoryLog() {
        var objTL = $.cookie(COOKIE_NAME_THEORY_LOG);
        objTheoryLog = (typeof objTL === "undefined") ? {} : objTL;
        if (typeof objTheoryLog === "undefined") { objTheoryLog = {}; }
    }
    
    function setTheoryLog(c) {
        var selfName = setTheoryLog.caller.name.replace(/^flag/,"");
        var ParentName = selfName.match(/^\d+/);
        if (!objTheoryLog.hasOwnProperty(ParentName)) { objTheoryLog[ParentName] = {}; }
        if (!objTheoryLog[ParentName].hasOwnProperty(selfName)) { objTheoryLog[ParentName][selfName] = {}; }
        if (!objTheoryLog[ParentName][selfName].hasOwnProperty("matched")) {
             objTheoryLog[ParentName][selfName]["matched"] = 0;
        }
        if (!objTheoryLog[ParentName][selfName].hasOwnProperty("flags")) {
             objTheoryLog[ParentName][selfName]["flags"] = {};
        }
        if (!objTheoryLog[ParentName][selfName]["flags"].hasOwnProperty(c)) {
             objTheoryLog[ParentName][selfName]["flags"][c] = 0;
        }
        objTheoryLog[ParentName][selfName]["matched"]++;
        objTheoryLog[ParentName][selfName]["flags"][c]++;
        saveTheoryLog();
    }
    
    function saveTheoryLog() {
        $.cookie(COOKIE_NAME_THEORY_LOG, objTheoryLog, objCookieOption);
    }
    
    function getStatus() {
        iWidth  = parseInt($("#iWidth").val(),   10);
        iHeight = parseInt($("#iHeight").val(),  10);
        iMines  = parseInt($("#iMines").val(),   10);
        iRemain = parseInt($("#iRemain").text(), 10);
        iFlags  = parseInt($("#iFlags").text(),  10);
        isAble2ClickRandomPanel = isNaN(parseInt($("#clickrandom:checked").val(), 10))
                                ? false
                                : true
                                ;
    }
    
    function isStarted() {
        return (iRemain < iWidth * iHeight) ? true : false;
    }
    
    function clickRandomPanel() {
        $(selectRandomPanel()).click();
    }
    
    function selectRandomPanel() {
        while(1) {
            var x = Math.floor( Math.random() * iWidth ) + 1;
            var y = Math.floor( Math.random() * iHeight ) + 1;
            var selector = "td[x="+x+"][y="+y+"]";
            if ($(selector).hasClass("hide") && !$(selector).hasClass("flag")) {
                return $(selector);
            }
        }
    }
    
    function setAFlag(objTarget) {
        // right click (contextmenu)
        $(objTarget).trigger({
            type: 'contextmenu',
            which: 3
        });
    }
    
    function isGameOver() {
        return ($("#MineField td.red[v=-1]").length > 0 || isCleared()) ? true : false;
    }
    
    function setFlagsAutomatically() {
        var bResult = false;
        $.each($("#MineField td[v!=0].revealed").not(".flagged-enough"), function() {
            if (isFlaggable(this)) {
               bResult = true;
               setFlagsAround(this);
            }
            if (flagIfFitInOtherTheory(this)) {
               bResult = true;
            }
            if (isFlaggedEnough(this)) {
                $(this).addClass("flagged-enough");
            }
        });
        return bResult;
    }
    
    function isFlaggable(objTarget) {
        var v = parseInt($(objTarget).attr("v"), 10);
        return (v===countUnRevealedAround(objTarget) && countFlagsAround(objTarget) < v)
               ? true
               : false
               ;
    }
    
    function isFlagged(x,y) {
        if (inRange(x,y)) {
            var selector = "#MineField td[x="+x+"][y="+y+"]";
            return ($(selector).hasClass("flag")) ? true : false;
        }
        return false;
    }
    
    function flagIfFitInOtherTheory(objTarget) {
        var v = parseInt($(objTarget).attr("v"), 10);
        if (v===2) {
            if (flagIfFitInTheory121(objTarget)) { return true; }
            if (flagIfFitInTheory1221(objTarget)) { return true; }
            if (flagIfFitInTheory323(objTarget)) { return true; }
        }
        if (v===3) {
            if (flagIfFitInTheory232(objTarget)) { return true; }
        }
        return false;
    }
    
    function flagIfFitInTheory121(objTarget) {
        if (is121Upper(objTarget)) { return flag121Upper(objTarget); }
        if (is121Lower(objTarget)) { return flag121Lower(objTarget); }
        if (is121Right(objTarget)) { return flag121Right(objTarget); }
        if (is121Left(objTarget))  { return flag121Left(objTarget);  }
        return false;
    }
    
    function flagIfFitInTheory1221(objTarget) {
        if (is1221Upper(objTarget)) { return flag1221Upper(objTarget); }
        if (is1221Lower(objTarget)) { return flag1221Lower(objTarget); }
        if (is1221Right(objTarget)) { return flag1221Right(objTarget); }
        if (is1221Left(objTarget))  { return flag1221Left(objTarget);  }
        return false;
    }
    
    function flagIfFitInTheory323(objTarget) {
        if (is323Upper(objTarget)) { return flag323Upper(objTarget); }
        if (is323Lower(objTarget)) { return flag323Lower(objTarget); }
        if (is323Right(objTarget)) { return flag323Right(objTarget); }
        if (is323Left(objTarget))  { return flag323Left(objTarget);  }
        return false;
    }
    
    function flagIfFitInTheory232(objTarget) {
        if (is232Upper(objTarget)) { return flag232Upper(objTarget); }
        if (is232Lower(objTarget)) { return flag232Lower(objTarget); }
        if (is232Right(objTarget)) { return flag232Right(objTarget); }
        if (is232Left(objTarget))  { return flag232Left(objTarget);  }
        return false;
    }
    
    function is121Upper(objTarget) {
        var x = getX(objTarget);
        var y = getY(objTarget);
        if (y > 1) {
            if (getV(x-1,y)===1 && getV(x,y)===2 && getV(x+1,y)===1) {
                if (
                    y===iHeight
                    || (isRevealed(x-1,y+1) && isRevealed(x,y+1) && isRevealed(x+1,y+1))
                   ) {
                       return (isFlagged(x-1,y-1) && isFlagged(x+1,y-1))
                       ? false
                       : true;
                       ;
                }
            }
        }
        return false;
    }
    
    function flag121Upper(objTarget) {
        var x = getX(objTarget);
        var y = getY(objTarget);
        var bResult = false;
        var c = 0;
        var tx = x-1;
        var ty = y-1;
        if (!isFlagged(tx,ty)) {
            bResult = true;
            setAFlag($("#MineField td[x="+tx+"][y="+ty+"]"));
            c++;
        }
        tx = x+1;
        ty = y-1;
        if (!isFlagged(tx,ty)) {
            bResult = true;
            setAFlag($("#MineField td[x="+tx+"][y="+ty+"]"));
            c++;
        }
        setTheoryLog(c);
        return bResult;
    }
    
    function is121Lower(objTarget) {
        var x = getX(objTarget);
        var y = getY(objTarget);
        if (y < iHeight) {
            if (getV(x-1,y)===1 && getV(x,y)===2 && getV(x+1,y)===1) {
                if (
                    y===1
                    || (isRevealed(x-1,y-1) && isRevealed(x,y-1) && isRevealed(x+1,y-1))
                   ) {
                        return (isFlagged(x-1,y+1) && isFlagged(x+1,y+1))
                        ? false
                        : true;
                        ;
                }
            }
        }
        return false;
    }
    
    function flag121Lower(objTarget) {
        var x = getX(objTarget);
        var y = getY(objTarget);
        var c = 0;
        var bResult = false;
        var tx = x - 1;
        var ty = y + 1;
        if (!isFlagged(tx,ty)) {
            bResult = true;
            setAFlag($("#MineField td[x="+tx+"][y="+ty+"]"));
            c++;
        }
        tx = x + 1;
        ty = y + 1;
        if (!isFlagged(tx,ty)) {
            bResult = true;
            setAFlag($("#MineField td[x="+tx+"][y="+ty+"]"));
            c++;
        }
        setTheoryLog(c);
        return bResult;
    }
    
    function is121Right(objTarget) {
        var x = getX(objTarget);
        var y = getY(objTarget);
        if (x < iWidth) {
            if (getV(x,y-1)===1 && getV(x,y)===2 && getV(x,y+1)===1) {
                if (
                    x===1
                    || (isRevealed(x-1,y-1) && isRevealed(x-1,y) && isRevealed(x-1,y+1))
                   ) {
                       return (isFlagged(x+1,y-1) && isFlagged(x+1,y+1))
                       ? false
                       : true;
                       ;
                }
            }
        }
        return false;
    }
    
    function flag121Right(objTarget) {
        var x = getX(objTarget);
        var y = getY(objTarget);
        var bResult = false;
        var c = 0;
        var tx = x + 1;
        var ty = y - 1;
        if (!isFlagged(tx,ty)) {
            bResult = true;
            setAFlag($("#MineField td[x="+tx+"][y="+ty+"]"));
            c++;
        }
        tx = x + 1;
        ty = y + 1;
        if (!isFlagged(tx,ty)) {
            bResult = true;
            setAFlag($("#MineField td[x="+tx+"][y="+ty+"]"));
            c++;
        }
        setTheoryLog(c);
        return bResult;
    }
    
    function is121Left(objTarget) {
        var x = getX(objTarget);
        var y = getY(objTarget);
        if (x > 1) {
            if (getV(x,y-1)===1 && getV(x,y)===2 && getV(x,y+1)===1) {
                if (
                    x===iWidth
                    || (isRevealed(x+1,y-1) && isRevealed(x+1,y) && isRevealed(x+1,y+1))
                   ) {
                       return (isFlagged(x-1,y-1) && isFlagged(x-1,y+1))
                       ? false
                       : true;
                       ;
                }
            }
        }
        return false;
    }
    
    function flag121Left(objTarget) {
        var x = getX(objTarget);
        var y = getY(objTarget);
        var c = 0;
        var bResult = false;
        var tx = x - 1;
        var ty = y - 1;
        if (!isFlagged(tx,ty)) {
            bResult = true;
            setAFlag($("#MineField td[x="+tx+"][y="+ty+"]"));
            c++;
        }
        tx = x - 1;
        ty = y + 1;
        if (!isFlagged(tx,ty)) {
            bResult = true;
            setAFlag($("#MineField td[x="+tx+"][y="+ty+"]"));
            c++;
        }
        setTheoryLog(c);
        return bResult;
    }
    
    function is1221Upper(objTarget) {
        var x = getX(objTarget);
        var y = getY(objTarget);
        if (y > 1 && x > 1 && x < iWidth - 1) {
            if (getV(x-1,y)===1 && getV(x,y)===2 && getV(x+1,y)===2 && getV(x+2,y)===1) {
                if (
                    y===iHeight
                    || (isRevealed(x-1,y+1) && isRevealed(x,y+1) && isRevealed(x+1,y+1) && isRevealed(x+2,y+1))
                   ) {
                       return (isFlagged(x,y-1) && isFlagged(x+1,y-1))
                       ? false
                       : true;
                       ;
                }
            }
        }
        return false;
    }
    
    function flag1221Upper(objTarget) {
        var x = getX(objTarget);
        var y = getY(objTarget);
        var c = 0;
        var bResult = false;
        var tx = x;
        var ty = y - 1;
        if (!isFlagged(tx,ty)) {
            bResult = true;
            setAFlag($("#MineField td[x="+tx+"][y="+ty+"]"));
            c++;
        }
        tx = x + 1;
        ty = y - 1;
        if (!isFlagged(tx,ty)) {
            bResult = true;
            setAFlag($("#MineField td[x="+tx+"][y="+ty+"]"));
            c++;
        }
        setTheoryLog(c);
        return bResult;
    }
    
    function is1221Lower(objTarget) {
        var x = getX(objTarget);
        var y = getY(objTarget);
        if (y < iHeight && x > 1 && x < iWidth - 1) {
            if (getV(x-1,y)===1 && getV(x,y)===2 && getV(x+1,y)===2 && getV(x+2,y)===1) {
                if (
                    y===1
                    || (isRevealed(x-1,y-1) && isRevealed(x,y-1) && isRevealed(x+1,y-1) && isRevealed(x+2,y-1))
                   ) {
                        return (isFlagged(x,y+1) && isFlagged(x+1,y+1))
                        ? false
                        : true;
                        ;
                }
            }
        }
        return false;
    }
    
    function flag1221Lower(objTarget) {
        var x = getX(objTarget);
        var y = getY(objTarget);
        var c = 0;
        var bResult = false;
        var tx = x;
        var ty = y + 1;
        if (!isFlagged(tx,ty)) {
            bResult = true;
            setAFlag($("#MineField td[x="+tx+"][y="+ty+"]"));
            c++;
        }
        tx = x + 1;
        ty = y + 1;
        if (!isFlagged(tx,ty)) {
            bResult = true;
            setAFlag($("#MineField td[x="+tx+"][y="+ty+"]"));
            c++;
        }
        setTheoryLog(c);
        return bResult;
    }
    
    function is1221Right(objTarget) {
        var x = getX(objTarget);
        var y = getY(objTarget);
        if (x < iWidth && y > 1 && y < iHeight - 1) {
            if (getV(x,y-1)===1 && getV(x,y)===2 && getV(x,y+1)===2 && getV(x,y+2)===1) {
                if (
                    x===1
                    || (isRevealed(x-1,y-1) && isRevealed(x-1,y) && isRevealed(x-1,y+1) && isRevealed(x-1,y+2))
                   ) {
                       return (isFlagged(x+1,y) && isFlagged(x+1,y+1))
                       ? false
                       : true;
                       ;
                }
            }
        }
        return false;
    }
    
    function flag1221Right(objTarget) {
        var x = getX(objTarget);
        var y = getY(objTarget);
        var bResult = false;
        var c = 0;
        var tx = x + 1;
        var ty = y;
        if (!isFlagged(tx,ty)) {
            bResult = true;
            setAFlag($("#MineField td[x="+tx+"][y="+ty+"]"));
            c++;
        }
        tx = x + 1;
        ty = y + 1;
        if (!isFlagged(tx,ty)) {
            bResult = true;
            setAFlag($("#MineField td[x="+tx+"][y="+ty+"]"));
            c++;
        }
        setTheoryLog(c);
        return bResult;
    }
    
    function is1221Left(objTarget) {
        var x = getX(objTarget);
        var y = getY(objTarget);
        if (x > 1 && y > 1 && y < iHeight - 1) {
            if (getV(x,y-1)===1 && getV(x,y)===2 && getV(x,y+1)===2 && getV(x,y+2)===1) {
                if (
                    x===iWidth
                    || (isRevealed(x+1,y-1) && isRevealed(x+1,y) && isRevealed(x+1,y+1) && isRevealed(x+1,y+2))
                   ) {
                       return (isFlagged(x-1,y) && isFlagged(x-1,y+1))
                       ? false
                       : true;
                       ;
                }
            }
        }
        return false;
    }
    
    function flag1221Left(objTarget) {
        var x = getX(objTarget);
        var y = getY(objTarget);
        var bResult = false;
        var c = 0;
        var tx = x - 1;
        var ty = y;
        if (!isFlagged(tx,ty)) {
            bResult = true;
            setAFlag($("#MineField td[x="+tx+"][y="+ty+"]"));
            c++;
        }
        tx = x - 1;
        ty = y + 1;
        if (!isFlagged(tx,ty)) {
            bResult = true;
            setAFlag($("#MineField td[x="+tx+"][y="+ty+"]"));
            c++;
        }
        setTheoryLog(c);
        return bResult;
    }
    
    function is323Upper(objTarget) {
        var x = getX(objTarget);
        var y = getY(objTarget);
        if (y > 1 && y < iHeight && x > 2 && x < iWidth -1) {
            if (getV(x-1,y)===3 && getV(x,y)===2 && getV(x+1,y)===3) {
                if (
                    isRevealed(x-2,y+1) && isRevealed(x-1,y+1) && isUnRevealed(x,y+1)
                    && isRevealed(x+1,y+1) && isRevealed(x+2,y+1)
                    && isRevealed(x-2,y) && isRevealed(x+2,y)
                   ) {
                       return (isFlagged(x-2,y-1) && isFlagged(x,y-1) && isFlagged(x+2,y-1) && isFlagged(x,y+1))
                       ? false
                       : true;
                       ;
                }
            }
        }
        return false;
    }
    
    function flag323Upper(objTarget) {
        var x = getX(objTarget);
        var y = getY(objTarget);
        var bResult = false;
        var c = 0;
        var tx = x-2;
        var ty = y-1;
        if (!isFlagged(tx,ty)) {
            bResult = true;
            setAFlag($("#MineField td[x="+tx+"][y="+ty+"]"));
            c++;
        }
        tx = x;
        ty = y-1;
        if (!isFlagged(tx,ty)) {
            bResult = true;
            setAFlag($("#MineField td[x="+tx+"][y="+ty+"]"));
            c++;
        }
        tx = x+2;
        ty = y-1;
        if (!isFlagged(tx,ty)) {
            bResult = true;
            setAFlag($("#MineField td[x="+tx+"][y="+ty+"]"));
            c++;
        }
        tx = x;
        ty = y+1;
        if (!isFlagged(tx,ty)) {
            bResult = true;
            setAFlag($("#MineField td[x="+tx+"][y="+ty+"]"));
            c++;
        }
        setTheoryLog(c);
        return bResult;
    }
    
    function is323Lower(objTarget) {
        var x = getX(objTarget);
        var y = getY(objTarget);
        if (y > 1 && y < iHeight && x > 2 && x < iWidth - 1) {
            if (getV(x-1,y)===3 && getV(x,y)===2 && getV(x+1,y)===3) {
                if (
                    isRevealed(x-2,y-1) && isRevealed(x-1,y-1)&& isUnRevealed(x,y-1)
                    && isRevealed(x+1,y-1) && isRevealed(x+2,y-1)
                    && isRevealed(x-2,y) && isRevealed(x+2,y)
                   ) {
                        return (isFlagged(x-2,y+1) && isFlagged(x,y+1) && isFlagged(x+2,y+1) && isFlagged(x,y-1))
                        ? false
                        : true;
                        ;
                }
            }
        }
        return false;
    }
    
    function flag323Lower(objTarget) {
        var x = getX(objTarget);
        var y = getY(objTarget);
        var c = 0;
        var bResult = false;
        var tx = x - 2;
        var ty = y + 1;
        if (!isFlagged(tx,ty)) {
            bResult = true;
            setAFlag($("#MineField td[x="+tx+"][y="+ty+"]"));
            c++;
        }
        tx = x;
        ty = y + 1;
        if (!isFlagged(tx,ty)) {
            bResult = true;
            setAFlag($("#MineField td[x="+tx+"][y="+ty+"]"));
            c++;
        }
        tx = x + 2;
        ty = y + 1;
        if (!isFlagged(tx,ty)) {
            bResult = true;
            setAFlag($("#MineField td[x="+tx+"][y="+ty+"]"));
            c++;
        }
        tx = x;
        ty = y - 1;
        if (!isFlagged(tx,ty)) {
            bResult = true;
            setAFlag($("#MineField td[x="+tx+"][y="+ty+"]"));
            c++;
        }
        setTheoryLog(c);
        return bResult;
    }
    
    function is323Right(objTarget) {
        var x = getX(objTarget);
        var y = getY(objTarget);
        if (x > 1 && x < iWidth && y > 2 && y < iHeight - 1) {
            if (getV(x,y-1)===3 && getV(x,y)===2 && getV(x,y+1)===3) {
                if (
                    isRevealed(x-1,y-2) && isRevealed(x-1,y-1) && isUnRevealed(x-1,y)
                    && isRevealed(x-1,y+1) && isRevealed(x-1,y+2)
                    && isRevealed(x,y-2) && isRevealed(x,y+2)
                   ) {
                       return (isFlagged(x+1,y-2) && isFlagged(x+1,y) && isFlagged(x+1,y+2) && isFlagged(x-1,y))
                       ? false
                       : true;
                       ;
                }
            }
        }
        return false;
    }
    
    function flag323Right(objTarget) {
        var x = getX(objTarget);
        var y = getY(objTarget);
        var bResult = false;
        var c = 0;
        var tx = x + 1;
        var ty = y - 2;
        if (!isFlagged(tx,ty)) {
            bResult = true;
            setAFlag($("#MineField td[x="+tx+"][y="+ty+"]"));
            c++;
        }
        tx = x + 1;
        ty = y;
        if (!isFlagged(tx,ty)) {
            bResult = true;
            setAFlag($("#MineField td[x="+tx+"][y="+ty+"]"));
            c++;
        }
        tx = x + 1;
        ty = y + 2;
        if (!isFlagged(tx,ty)) {
            bResult = true;
            setAFlag($("#MineField td[x="+tx+"][y="+ty+"]"));
            c++;
        }
        tx = x - 1;
        ty = y;
        if (!isFlagged(tx,ty)) {
            bResult = true;
            setAFlag($("#MineField td[x="+tx+"][y="+ty+"]"));
            c++;
        }
        setTheoryLog(c);
        return bResult;
    }
    
    function is323Left(objTarget) {
        var x = getX(objTarget);
        var y = getY(objTarget);
        if (x > 1 && x < iWidth && y > 2 && y < iHeight - 1) {
            if (getV(x,y-1)===3 && getV(x,y)===2 && getV(x,y+1)===3) {
                if (
                    isRevealed(x+1,y-2) && isRevealed(x+1,y-1) && isUnRevealed(x+1,y)
                    && isRevealed(x+1,y+1) && isRevealed(x+1,y+2)
                    && isRevealed(x,y-2) && isRevealed(x,y+2)
                   ) {
                       return (isFlagged(x-1,y-2) && isFlagged(x-1,y) && isFlagged(x-1,y+2) && isFlagged(x+1,y))
                       ? false
                       : true;
                       ;
                }
            }
        }
        return false;
    }
    
    function flag323Left(objTarget) {
        var x = getX(objTarget);
        var y = getY(objTarget);
        var bResult = false;
        var c = 0;
        var tx = x - 1;
        var ty = y - 2;
        if (!isFlagged(tx,ty)) {
            bResult = true;
            setAFlag($("#MineField td[x="+tx+"][y="+ty+"]"));
            c++;
        }
        tx = x - 1;
        ty = y;
        if (!isFlagged(tx,ty)) {
            bResult = true;
            setAFlag($("#MineField td[x="+tx+"][y="+ty+"]"));
            c++;
        }
        tx = x - 1;
        ty = y + 2;
        if (!isFlagged(tx,ty)) {
            bResult = true;
            setAFlag($("#MineField td[x="+tx+"][y="+ty+"]"));
            c++;
        }
        tx = x + 1;
        ty = y;
        if (!isFlagged(tx,ty)) {
            bResult = true;
            setAFlag($("#MineField td[x="+tx+"][y="+ty+"]"));
            c++;
        }
        setTheoryLog(c);
        return bResult;
    }
    
    function is232Upper(objTarget) {
        var x = getX(objTarget);
        var y = getY(objTarget);
        if (y > 1 && y < iHeight && x > 2 && x < iWidth -1) {
            if (getV(x-1,y)===2 && getV(x,y)===3 && getV(x+1,y)===2) {
                if (
                    isRevealed(x-2,y+1) && isRevealed(x-1,y+1) && isUnRevealed(x,y+1)
                    && isRevealed(x+1,y+1) && isRevealed(x+2,y+1)
                    && isRevealed(x-2,y) && isRevealed(x+2,y)
                   ) {
                       return (isFlagged(x-1,y-1) && isFlagged(x+1,y-1) && isFlagged(x,y+1))
                       ? false
                       : true;
                       ;
                }
            }
        }
        return false;
    }
    
    function flag232Upper(objTarget) {
        var x = getX(objTarget);
        var y = getY(objTarget);
        var bResult = false;
        var c = 0;
        var tx = x - 1;
        var ty = y - 1;
        if (!isFlagged(tx,ty)) {
            bResult = true;
            setAFlag($("#MineField td[x="+tx+"][y="+ty+"]"));
            c++;
        }
        tx = x + 1;
        ty = y - 1;
        if (!isFlagged(tx,ty)) {
            bResult = true;
            setAFlag($("#MineField td[x="+tx+"][y="+ty+"]"));
            c++;
        }
        tx = x;
        ty = y + 1;
        if (!isFlagged(tx,ty)) {
            bResult = true;
            setAFlag($("#MineField td[x="+tx+"][y="+ty+"]"));
            c++;
        }
        setTheoryLog(c);
        return bResult;
    }
    
    function is232Lower(objTarget) {
        var x = getX(objTarget);
        var y = getY(objTarget);
        if (y > 1 && y < iHeight && x > 2 && x < iWidth - 1) {
            if (getV(x-1,y)===2 && getV(x,y)===3 && getV(x+1,y)===2) {
                if (
                    isRevealed(x-2,y-1) && isRevealed(x-1,y-1)&& isUnRevealed(x,y-1)
                    && isRevealed(x+1,y-1) && isRevealed(x+2,y-1)
                    && isRevealed(x-2,y) && isRevealed(x+2,y)
                   ) {
                        return (isFlagged(x-1,y+1) && isFlagged(x+1,y+1) && isFlagged(x,y-1))
                        ? false
                        : true;
                        ;
                }
            }
        }
        return false;
    }
    
    function flag232Lower(objTarget) {
        var x = getX(objTarget);
        var y = getY(objTarget);
        var bResult = false;
        var c = 0;
        var tx = x - 1;
        var ty = y + 1;
        if (!isFlagged(tx,ty)) {
            bResult = true;
            setAFlag($("#MineField td[x="+tx+"][y="+ty+"]"));
            c++;
        }
        tx = x + 1;
        ty = y + 1;
        if (!isFlagged(tx,ty)) {
            bResult = true;
            setAFlag($("#MineField td[x="+tx+"][y="+ty+"]"));
            c++;
        }
        tx = x;
        ty = y - 1;
        if (!isFlagged(tx,ty)) {
            bResult = true;
            setAFlag($("#MineField td[x="+tx+"][y="+ty+"]"));
            c++;
        }
        setTheoryLog(c);
        return bResult;
    }
    
    function is232Right(objTarget) {
        var x = getX(objTarget);
        var y = getY(objTarget);
        if (x > 1 && x < iWidth && y > 2 && y < iHeight - 1) {
            if (getV(x,y-1)===2 && getV(x,y)===3 && getV(x,y+1)===2) {
                if (
                    isRevealed(x-1,y-2) && isRevealed(x-1,y-1) && isUnRevealed(x-1,y)
                    && isRevealed(x-1,y+1) && isRevealed(x-1,y+2)
                    && isRevealed(x,y-2) && isRevealed(x,y+2)
                   ) {
                       return (isFlagged(x+1,y-1) && isFlagged(x+1,y+1) && isFlagged(x-1,y))
                       ? false
                       : true;
                       ;
                }
            }
        }
        return false;
    }
    
    function flag232Right(objTarget) {
        var x = getX(objTarget);
        var y = getY(objTarget);
        var bResult = false;
        var c = 0;
        var tx = x + 1;
        var ty = y - 1;
        if (!isFlagged(tx,ty)) {
            bResult = true;
            setAFlag($("#MineField td[x="+tx+"][y="+ty+"]"));
            c++;
        }
        tx = x + 1;
        ty = y + 1;
        if (!isFlagged(tx,ty)) {
            bResult = true;
            setAFlag($("#MineField td[x="+tx+"][y="+ty+"]"));
            c++;
        }
        tx = x - 1;
        ty = y;
        if (!isFlagged(tx,ty)) {
            bResult = true;
            setAFlag($("#MineField td[x="+tx+"][y="+ty+"]"));
            c++;
        }
        setTheoryLog(c);
        return bResult;
    }
    
    function is232Left(objTarget) {
        var x = getX(objTarget);
        var y = getY(objTarget);
        if (x > 1 && x < iWidth && y > 2 && y < iHeight - 1) {
            if (getV(x,y-1)===2 && getV(x,y)===3 && getV(x,y+1)===2) {
                if (
                    isRevealed(x+1,y-2) && isRevealed(x+1,y-1) && isUnRevealed(x+1,y)
                    && isRevealed(x+1,y+1) && isRevealed(x+1,y+2)
                    && isRevealed(x,y-2) && isRevealed(x,y+2)
                   ) {
                       return (isFlagged(x-1,y-1) && isFlagged(x-1,y+1) && isFlagged(x+1,y))
                       ? false
                       : true;
                       ;
                }
            }
        }
        return false;
    }
    
    function flag232Left(objTarget) {
        var x = getX(objTarget);
        var y = getY(objTarget);
        var bResult = false;
        var c = 0;
        var tx = x - 1;
        var ty = y - 1;
        if (!isFlagged(tx,ty)) {
            bResult = true;
            setAFlag($("#MineField td[x="+tx+"][y="+ty+"]"));
            c++;
        }
        tx = x - 1;
        ty = y + 1;
        if (!isFlagged(tx,ty)) {
            bResult = true;
            setAFlag($("#MineField td[x="+tx+"][y="+ty+"]"));
            c++;
        }
        tx = x + 1;
        ty = y;
        if (!isFlagged(tx,ty)) {
            bResult = true;
            setAFlag($("#MineField td[x="+tx+"][y="+ty+"]"));
            c++;
        }
        setTheoryLog(c);
        return bResult;
    }
    
    function getV(x,y) {
        if (inRange(x,y)) {
            var selector = "#MineField td[x="+x+"][y="+y+"]";
            return parseInt($(selector).attr("v"), 10);
        }
    }
    
    function getX(objTarget) {
        return parseInt($(objTarget).attr("x"), 10);
    }
    
    function getY(objTarget) {
        return parseInt($(objTarget).attr("y"), 10);
    }
    
    function isRevealed(x,y) {
        if (inRange(x,y)) {
            var selector = "#MineField td[x="+x+"][y="+y+"]";
            return ($(selector).hasClass("revealed")) ? true : false;
        }
        return false;
    }
    
    function isUnRevealed(x,y) {
        if (inRange(x,y)) {
            var selector = "#MineField td[x="+x+"][y="+y+"]";
            return ($(selector).hasClass("hide")) ? true : false;
        }
        return false;
    }
    
    function countUnRevealedAround(objTarget) {
        var c = 0;
        var x = parseInt($(objTarget).attr("x"), 10);
        var y = parseInt($(objTarget).attr("y"), 10);
        for (j=-1; j<=1; j++) {
            var ty = y + j;
            for (i=-1; i<=1; i++) {
                var tx = x + i;
                if (inRange(tx, ty)) {
                    var selector = "#MineField td[x="+tx+"][y="+ty+"]";
                    if ($(selector).hasClass("hide")) { c++; }
                }
            }
        }
        return c;
    }
    
    function countFlagsAround(objTarget) {
        var c = 0;
        var x = parseInt($(objTarget).attr("x"), 10);
        var y = parseInt($(objTarget).attr("y"), 10);
        for (j=-1; j<=1; j++) {
            var ty = y + j;
            for (i=-1; i<=1; i++) {
                var tx = x + i;
                if (inRange(tx, ty)) {
                    var selector = "#MineField td[x="+tx+"][y="+ty+"]";
                    if ($(selector).hasClass("flag")) { c++; }
                }
            }
        }
        return c;
    }
    
    function inRange(x, y) {
        return ( x >= 1 && x <= iWidth && y>= 1 && y <= iHeight ) ? true : false;
    }
    
    function setFlagsAround(objTarget) {
        $.each(getPanels2Flag(objTarget), function() {
            setAFlag(this);
        });
    }
    
    function getPanels2Flag(objTarget) {
        var x = parseInt($(objTarget).attr("x"), 10);
        var y = parseInt($(objTarget).attr("y"), 10);
        var objPanels = $();
        for (j=-1; j<=1; j++) {
            var ty = y + j;
            for (i=-1; i<=1; i++) {
                var tx = x + i;
                if (inRange(tx, ty)) {
                    var selector = "#MineField td[x="+tx+"][y="+ty+"]";
                    if ($(selector).hasClass("hide") && ! $(selector).hasClass("flag")) {
                        objPanels = objPanels.add($(selector));
                    }
                }
            }
        }
        return objPanels;
    }
    
    function revealPanelsAutomatically() {
        var bResult = false;
        $.each($("#MineField td[v!=0].revealed").not(".revealed-enough"), function() {
            if (isRevealableAround(this)) {
                bResult = true;
                revealPanelsAround(this);
            }
            if (isRevealedEnough(this)) {
                $(this).addClass("revealed-enough");
            }
        });
        return bResult;
    }
    
    function isRevealableAround(objTarget) {
        var v = parseInt($(objTarget).attr("v"), 10);
        return (v > 0 && v === countFlagsAround(objTarget) && v < countUnRevealedAround(objTarget))
               ? true 
               : false
               ;
    }
    
    function revealPanelsAround(objTarget) {
        $.each(getPanels2Reveal(objTarget), function() {
            $(this).click();
        });
    }
    
    function getPanels2Reveal(objTarget) {
        var x = parseInt($(objTarget).attr("x"), 10);
        var y = parseInt($(objTarget).attr("y"), 10);
        objPanels = $();
        for (j=-1; j<=1; j++) {
            var ty = y + j;
            for (i=-1; i<=1; i++) {
                var tx = x + i;
                if (inRange(tx,ty)) {
                    var selector = "#MineField td[x="+tx+"][y="+ty+"]"
                    if ($(selector).hasClass("hide") && ! $(selector).hasClass("flag")) {
                        objPanels = objPanels.add($(selector));
                    }
                }
            }
        }
        return objPanels;
    }
    
    function isCleared() {
        getStatus();
        return (iRemain===iMines) ? true : false;
    }
    
    function isFlaggedEnough(objTarget) {
        v = parseInt($(objTarget).attr("v"), 10);
        return ( v === 0 || v === countFlagsAround(objTarget) )
               ? true
               : false
               ;
    }
    
    function isRevealedEnough(objTarget) {
        v = parseInt($(objTarget).attr("v"), 10);
        return ( v === 0 || (isFlaggedEnough(objTarget) && v === countUnRevealedAround(objTarget)))
               ? true
               : false
               ;
    }
    
    function showColumnAndRowNumber() {
        if ($("#ColumnNumber").length===0) {
            $("#MineField tbody").prepend('<tr id="ColumnNumber"><td>&nbsp;</td></tr>');
            for (var i=1; i<=iWidth; i++) {
                $("#ColumnNumber").append("<td>"+i+"</td>");
            }
            $.each($("#MineField td[x=1]"), function () {
                $(this).before('<td class="RowNumber">'+$(this).attr("y")+"</td>");
            });
        }
    }
    
    function showTheoryLog() {
        var dumper = new JKL.Dumper();
        $("#show-theory-log").html("<pre>"+dumper.dump(objTheoryLog)+"</pre>");
    }
    
    $("span.showTheoryLog").click(function() {
        loadTheoryLog();
        showTheoryLog();
        $("#show-theory-log").dialog({
            resizable: false,
            height: 440,
            modal: true,
            buttons: {
                "OK": function () {
                    $(this).dialog("close");
                }
            },
        });
    });
    
    $("span.clearTheoryLog").click(function(){
        objTheoryLog = {};
        saveTheoryLog();
    });
});
