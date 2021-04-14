
var result;
var didComplete;
var idtoLabelMap= {};
var ls;
function startIntro(_result, _ls) {
    $(".ant-spin-container").children().first().next().hide();
    result = _result;
    steps = 0;
    ls = _ls;
    q = introJs().setOptions({
        tooltipClass: 'customTooltip',doneLabel: "Next",scrollToElement: true, exitOnOverlayClick: false,exitOnEsc: false,showBullets: false,showStepNumbers: false,overlayOpacity: 0.5,disableInteraction: true,
        steps: [{
                title: 'Welcome',
                intro: 'Label Studio 👋 <br>  Here you will see how to draw a polygon'
            }]
    });
    q.oncomplete(function () {
        didComplete = true;

        setTimeout(function () {
            introJs().setOptions({
                doneLabel: "Next",scrollToElement: true, exitOnOverlayClick: false,exitOnEsc: false,showBullets: false,showStepNumbers: false,overlayOpacity: 0.5,disableInteraction: true,
                steps: [{
                    title: 'Tag',
                    element: $("span:contains('" + result[0].value.rectanglelabels[0] + "')")[0],
                    intro: 'Select Tag',
                    position: 'top'
                }]
            }).oncomplete(function () {
                didComplete = true;
                CreatePath(result, 0);
            }).onexit(function () {
                if (didComplete) {
                    didComplete = false;
                } else {
                    exitCall(ls);
                }
            }).onafterchange(function (el) {
                afterChangeCall(q);
            }).start();
            setTimeout(function () {
                $("span:contains('" + result[0].value.rectanglelabels[0] + "')")[0].click();
            }, (1000));
        }, (600));

    }).onexit(function (targetElement) {
        if (didComplete) {
            didComplete = false;
        }else {
            exitCall(ls);
        }
    }).onafterchange(function (el){
        afterChangeCall(q);
    });
    q.start();
}

function FinishStep(stepNumber, ls){
    // if (stepNumber < result[0].value.points.length ){
    //     CreatePath(result, stepNumber);
    // } else {
        exitCall(ls);
    // }
}


function afterChangeCall(q){
    $(".introjs-tooltipbuttons").prepend("<a role=\"button\" tabindex=\"0\" class=\"introjs-button introjs-prevbutton myexit \">Skip all</a>");
    $(".myexit").on('click',function () {
       q.exit(true);
    });
    $(".introjs-skipbutton").hide();
    $(".introjs-nextbutton").attr("tabindex", 1);
}

function waitCall(){
    $(".myexit").attr("disabled", true);
    $(".introjs-nextbutton").attr("disabled", true);
}

function resumeCall(){
    $(".myexit").attr("disabled", false);
    $(".introjs-nextbutton").attr("disabled", false);
}

function exitCall(ls){
    let cs = ls.completionStore;
    let c = {id: ls.completionStore.completions[1].id, editable: false};
    if (c.id) cs.selectCompletion(c.id);
    var Skipbtn = $('.ls-skip-btn').children().first();
    Skipbtn.html('').append("<span>Show me more</span>");
    $('.ls-update-btn').hide();
    $('.ls-submit-btn').hide();
    Skipbtn.on('click', function () {
        c = ls.completionStore.addCompletion({userGenerate: true});
        cs.selectCompletion(c.id);
    });

    btndiv = $(".Controls_container__LTeAA")[0];
    var btn = $('<button type="button" class="ant-btn ant-btn-primary helpBtn"><span>Next</span></button>');
    btndiv.append(btn[0]);
    $('.helpBtn').on('click', function () {
      c = ls.completionStore.addCompletion({userGenerate: true});
      ls.completionStore.selectCompletion(c.id);
      ls.submitCompletion();
    });

}


function CreatePath(result, stepNumber){
    setTimeout(function () {
        introJs().setOptions({
            doneLabel: "Next",scrollToElement: true, exitOnOverlayClick: false,exitOnEsc: false,showBullets: false,showStepNumbers: false,overlayOpacity: 0.5,disableInteraction: true,
            steps: [{
                title: 'Draw boundary',
                element: $("canvas")[0],
                intro: 'Click on image to start drawing',
                position: 'top'
            }]
        }).oncomplete(function () {
            didComplete = true;
            FinishStep(stepNumber, ls);
        }).onexit(function () {
            if (didComplete) {
                didComplete = false;
            } else {
                exitCall(ls);
            }
        }).onafterchange(function (el) {
            afterChangeCall(q);
        }).start();
        setTimeout(function () {
            waitCall();
            x = result[0].value.x * ($("canvas")[0].clientWidth / 100);
            y = result[0].value.y * ($("canvas")[0].clientHeight / 100);
            shiftX = result[0].value.width * ($("canvas")[0].clientWidth / 100);
            shiftY = result[0].value.height * ($("canvas")[0].clientHeight / 100);
            // dragKonva = async (x, y, shiftX, shiftY, wait) => {
                const stage = window.Konva.stages[0];
                const delay = () => new Promise(resolve => setTimeout(resolve, 10));
                stage.fire("mousedown", {clientX: x, clientY: y, evt: { offsetX: x, offsetY: y } });
                i = 0;
                mx = x;
                my = y;
                myTime = setInterval(function () {
                    i= i + 1;
                    if (mx >= x + shiftX && my >= y + shiftY) {
                      stage.fire("mousemove", {clientX: x + shiftX, clientY: y + shiftY, evt: { offsetX: x + shiftX, offsetY: y + shiftY } });
                      stage.fire("mouseup", {clientX: x + shiftX, clientY: y + shiftY, evt: { offsetX: x + shiftX, offsetY: y + shiftY } });
                      clearTimeout(myTime);
                      resumeCall();
                    }
                    if (mx < x + shiftX) {
                        mx = mx + 5;
                    }
                    if (my < y + shiftY) {
                        my = my + 5 ;
                    }
                    stage.fire("mousemove", {clientX: mx, clientY: my, evt: { offsetX: mx, offsetY: my } });
                }, (30));
            // };
        }, (500));
    }, (600));
}
function doNextPoints(result, stepNumber){
    waitCall();
    myTime = setInterval(function () {
        waitCall();
        if (stepNumber == result[0].value.points.length ){
            const lastPoint = Konva.stages[0].find("Circle").slice(-1)[0];
            const firstPoint = lastPoint.parent.find("Circle")[0];
            firstPoint.fire("mouseover");
            firstPoint.fire("click");
            // resumeCall();
        } else {
            let x = result[0].value.points[stepNumber][0] * ($("canvas")[0].clientWidth / 100);
            let y = result[0].value.points[stepNumber][1] * ($("canvas")[0].clientHeight / 100);
            Konva.stages[0].fire("click", {clientX: x, clientY: y, evt: {offsetX: x, offsetY: y}});
        }
        stepNumber++;
        if (stepNumber > result[0].value.points.length || stepNumber%5 == 0){
            clearTimeout(myTime);
            resumeCall();
        }
    }, (400));
}
function nextStep(result, stepNumber) {

    setTimeout(function () {
        introJs().setOptions({
            doneLabel: "Next",scrollToElement: true, exitOnOverlayClick: false,exitOnEsc: false,showBullets: false,showStepNumbers: false,overlayOpacity: 0.5,disableInteraction: true,
            steps: [{
                title: 'Tag',
                element: $("span:contains('" + result[stepNumber].value.labels[0] + "')")[0],
                intro: 'Select 1st Tag',
                position: 'top'
            }]
        }).oncomplete(function () {
            didComplete = true;
            // Next function call
        }).onexit(function () {
            if (didComplete) {
                didComplete = false;
            } else {
                exitCall(ls);
            }
        }).onafterchange(function (el) {
            afterChangeCall(q);
        }).start();
        setTimeout(function () {
            // LAter Function // click etc
        }, (1000));
    }, (600));
}

                                                        // x = result[0].value.points[0][0]*($("canvas")[0].clientWidth/100);
                                                        // y = result[0].value.points[0][1]*($("canvas")[0].clientHeight/100);
                                                        // const lastPoint = Konva.stages[0].find("Circle").slice(-1)[0];
                                                        // const firstPoint = lastPoint.parent.find("Circle")[0];
                                                        // firstPoint.fire("mouseover");
                                                        // firstPoint.fire("click");

//             $(".introjs-tooltipbuttons").prepend("<a role=\"button\" tabindex=\"0\" class=\"introjs-button introjs-prevbutton myexit \">Exit</a>");
//             $(".introjs-skipbutton").hide();
//             $(".myexit").on('click', function () {
//                 q.exit(true);
//             });

// function click(x,y){
//     var ev = document.createEvent("MouseEvent");
//     var Jel = $("canvas");//document.getElementsByTagName('canvas')[0];
//     var el = document.getElementsByTagName('canvas')[0];
//     var a = 0;
//     var b = 0;
//     var c = Jel.offset().left + x;
//     var d = Jel.offset().top+ y;
//     ev.initMouseEvent(
//         "mouseover",
//         true /* bubble */, true /* cancelable */,
//         window, null,
//         a,b,c,d, /* coordinates */
//         false, false, false, false, /* modifier keys */
//         0 /*left*/, null
//     );
//     el.dispatchEvent(ev);
//
//     ev.initMouseEvent(
//         "mousedown",
//         true /* bubble */, true /* cancelable */,
//         window, null,
//         a,b,c,d, /* coordinates */
//         false, false, false, false, /* modifier keys */
//         0 /*left*/, null
//     );
//     el.dispatchEvent(ev);
//     ev.initMouseEvent(
//         "mouseup",
//         true /* bubble */, true /* cancelable */,
//         window, null,
//         a,b,c,d, /* coordinates */
//         false, false, false, false, /* modifier keys */
//         0 /*left*/, null
//     );
//     el.dispatchEvent(ev);
//     ev.initMouseEvent(
//         "click",
//         true /* bubble */, true /* cancelable */,
//         window, null,
//         a,b,c,d, /* coordinates */
//         false, false, false, false, /* modifier keys */
//         0 /*left*/, null
//     );
//     el.dispatchEvent(ev);
// };
