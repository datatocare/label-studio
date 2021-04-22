/*
 * Label Studio Frontend SDK - inter-layer code that connects LSB server
 * implementation with the Frontend part. At the moment it's based on
 * callbacks.
 */

const API_URL = {
  MAIN: "api",
  PROJECT: "/project",
  TASKS: "/tasks",
  COMPLETIONS: "/completions",
  CANCEL: "?was_cancelled=1",
  NEXT: "/next",
    TraingTask: "?traingTask=",
  INSTRUCTION: "/project?fields=instruction"
};

var lastId;
var tmpLS;
var isAdmin;

const Requests = (function(window) {
  const handleResponse = res => {
    if (res.status !== 200 || res.status !== 201) {
      return res;
    } else {
      return res.json();
    }
  };

  const wrapperRequest = (url, method, headers, body) => {
    return window
      .fetch(url, {
        method: method,
        headers: headers,
        credentials: "include",
        body: body,
      })
      .then(response => handleResponse(response));
  };

  const fetcher = url => {
    return wrapperRequest(url, "GET", { Accept: "application/json" });
  };

  const fetcherAuth = async (url, data) => {
    const response = await window.fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: "Basic " + btoa(data.username + ":" + data.password),
      },
      credentials: "same-origin",
    });
    return handleResponse(response);
  };

  const poster = (url, body) => {
    return wrapperRequest(url, "POST", { Accept: "application/json", "Content-Type": "application/json" }, body);
  };

  const patch = (url, body) => {
    return wrapperRequest(
      url,
      "PATCH",
      {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body,
    );
  };

  const remover = (url, body) => {
    return wrapperRequest(
      url,
      "DELETE",
      {
        "Content-Type": "application/json",
      },
      body,
    );
  };

  return {
    fetcher: fetcher,
    poster: poster,
    patch: patch,
    remover: remover,
  };
})(window);

const _loadTask = function(ls, url, completionID, reset) {
    try {
        const req = Requests.fetcher(url);

        req.then(function(loadedTask) {
            if (loadedTask instanceof Response && loadedTask.status === 404) {
                ls.setFlags({ isLoading: false, noTask: true });
                return;
            }

            if (loadedTask instanceof Response && loadedTask.status === 403) {
                ls.setFlags({ isLoading: false, noAccess: true });
                return;
            }

            loadedTask.json().then(response => {
                /**
                 * Convert received data to string for MST support
                 */
                // ls = LSF_SDK("label-studio", response.label_config_line, null);
                // ls.LS.config(response.label_config_line)
                // if (reset == true) {
                //     response.completionID = completionID
                //     ls.resetState();
                //     delete window.LSF_SDK;
                //     window.LSF_SDK = LSF_SDK("label-studio", response.layout, null, false, response.data.description, true, response, response.data.batch_id, 1);
                //     // ls = window.LSF_SDK;
                //    MyDOList(window.LSF_SDK, window.LSF_SDK.task);
                // }
                // else {
                    /**
                     * Add new data from received task
                     */
                // console.log(response);;
                response.data = JSON.stringify(response.data);
                TempTaskData = response;
                tmpLS = ls;
                ls.resetState();
                ls.assignTask(response);
                ls.initializeStore(_convertTask(response));
                ls.updateDescription(response.description);

                let cs = ls.completionStore;
                let c;

                if (ls.completionStore.completions.length > 0 && (completionID === 'auto' || isAdmin)) {
                  c = {id: ls.completionStore.completions[0].id};
                }

                else if (cs.predictions.length > 0) {
                    c = ls.completionStore.addCompletionFromPrediction(cs.predictions[0]);
                }

                // we are on history item, take completion id from history
                else if (ls.completionStore.completions.length > 0 && completionID) {
                    c = {id: 1};
                }

                else if (ls.completionStore.completions.length > 0 && (response.format_type == 1 || response.format_type == 6) ) {
                    c = {id: completionID};
                }

                else {
                    c = ls.completionStore.addCompletion({ userGenerate: true });
                }

                if (c.id) cs.selectCompletion(c.id);

                // fix for broken old references in mst
                cs.selected.setupHotKeys();
                // ls.onTaskLoad(ls, ls.task);
                setTimeout(function () {
                    if (isAdmin){
                        if (response.format_type == 3){
                            btndiv = $(".Controls_container__LTeAA")[0];
                            $('.ls-update-btn').hide()
                            $('.ls-submit-btn').hide();
                            var submitbutton = $('<button type="button" class="ant-btn ant-btn-primary mysubmitbtn"><span role="img" aria-label="check" class="anticon anticon-check"><svg viewBox="64 64 896 896" focusable="false" class="" data-icon="check" width="1em" height="1em" fill="currentColor" aria-hidden="true"><path d="M912 190h-69.9c-9.8 0-19.1 4.5-25.1 12.2L404.7 724.5 207 474a32 32 0 00-25.1-12.2H112c-6.7 0-10.4 7.7-6.3 12.9l273.9 347c12.8 16.2 37.4 16.2 50.3 0l488.4-618.9c4.1-5.1.4-12.8-6.3-12.8z"></path></svg></span><span>Submit </span></button>');
                            btndiv.append(submitbutton[0]);
                            submitbutton.on('click', function(){
                               ls.submitCompletion();
                            });
                        }
                    } else {
                        MyDOList(ls, ls.task);
                    }
                }, (200));
                ls.setFlags({ isLoading: false });
              // }
            })
        });
    } catch (err) {
        console.error("Failed to load next task ", err);
    }
};

function MyDOList(ls, task){
    // if(task.dataObj.layout_id == 2) {
    //     $('.Text_line__2JZG0').css("word-spacing", "50px");
    // }
    if((task.dataObj.layout_id == 8 || task.dataObj.layout_id == 5) && !ls.settings.showLabels) {
        ls.settings.toggleShowLabels();
    }

    if (task && task.dataObj.format_type == 1 ) {
        // $(".Controls_container__LTeAA").empty();
        setTimeout(function () {
            if (task.dataObj.completions != null){
                var Skipbtn = $('.ls-skip-btn');
                Skipbtn.html('').append("<span>Show Me more</span>");
                // $('.ls-skip-btn').hide();
                Skipbtn.on('click', function () {
                    c = ls.completionStore.addCompletion({userGenerate: true});
                    ls.completionStore.selectCompletion(c.id);
                    $(".Controls_container__LTeAA").hide();
                });
                btndiv = $(".Controls_container__LTeAA")[0];
                var btn = $('<button type="button" class="ant-btn ant-btn-primary helpBtn"><span>Next</span></button>');
                btndiv.append(btn[0]);
                $('.helpBtn').on('click', function () {
                  c = ls.completionStore.addCompletion({userGenerate: true});
                  ls.completionStore.selectCompletion(c.id);
                  // tmpLS = ls;
                  // tmpLS.onSubmitCompletion();
                  $(".Controls_container__LTeAA").hide();
                  ls.submitCompletion();
                });
                $('.ls-update-btn').hide();
                $('.ls-submit-btn').hide();
                ls.completionStore.selected.setEdit(false);
                showDemo = Cookies.get("showInro" + task.dataObj.format_type.toString() + task.dataObj.layout_id.toString());
                if (showDemo == undefined) {
                    q = introJs().setOptions({
                        tooltipClass: 'customTooltip',doneLabel: "Let's Start",exitOnOverlayClick: false,exitOnEsc: false,showBullets: false,showStepNumbers: false,overlayOpacity: 0.5,disableInteraction: true,
                        steps: [{
                        title: 'Welcome 👋',
                        intro: 'This shows the final result of task that you are going to do'
                        }]
                    });
                    q.start();
                    Cookies.set("showInro" + task.dataObj.format_type.toString() + task.dataObj.layout_id.toString(), true, { expires: 1 });
                    // Cookies.remove("example");
                }
            }
        }, (250));
    } else if (task && task.dataObj.format_type == 2) {
        setTimeout(function () {
            tmpLS = ls;
            if (task.dataObj.layout_id == 8) {
                // $.getScript('static/js/AutointroPolygon.js');
                startIntroPolygon(task.dataObj.completions[0].result, tmpLS);
            } else if(task.dataObj.layout_id == 2) {
                if (task.dataObj.batch_id == 5) {
                    result = task.dataObj.completions[0].result;
                    $("span:contains('" + result[0].value.labels[0] + "')")[0].click();
                    elemenq = document.querySelector('[class^="Text_line"]');
                    let range = new Range();
                    _text = result[0].value.text;
                    elem = elemenq.firstChild;
                    while(elem != null) {
                        if (elem.textContent.indexOf(_text) != -1) {
                            break
                        } else {
                            elem = elem.nextSibling;
                        }
                    }
                    range.setStart(elem, elem.textContent.indexOf(_text));
                    range.setEnd(elem, elem.textContent.indexOf(_text) + _text.length);
                    window.getSelection().removeAllRanges();
                    window.getSelection().addRange(range);
                    var evt = document.createEvent("MouseEvents");
                    evt.initEvent("mouseup", true, true);
                    elemenq.dispatchEvent(evt);

                    $("span:contains('" + result[1].value.labels[0] + "')")[0].click();
                    elemenq = document.querySelector('[class^="Text_line"]');
                    let range1 = new Range();
                    _text = result[1].value.text;
                    elem1 = elemenq.firstChild;
                    while(elem1 != null) {
                        if (elem1.textContent.indexOf(_text) != -1) {
                            break
                        } else {
                            elem1 = elem1.nextSibling;
                        }
                    }
                    range1.setStart(elem1, elem1.textContent.indexOf(_text));
                    range1.setEnd(elem1, elem1.textContent.indexOf(_text) + _text.length);
                    window.getSelection().removeAllRanges();
                    window.getSelection().addRange(range1);
                    var evt1 = document.createEvent("MouseEvents");
                    evt1.initEvent("mouseup", true, true);
                    elemenq.dispatchEvent(evt1);
                    // $.getScript('static/js/AutointroRE.js');
                    startIntroRE(task.dataObj.completions[0].result, tmpLS);
                } else {
                    $.getScript('static/js/AutointroNE.js');
                    startIntroNE(task.dataObj.completions[0].result, tmpLS);
                }
            } else if(task.dataObj.layout_id == 5) {
                $.getScript('static/js/AutointroRectangle.js');
                startIntroRectangle(task.dataObj.completions[0].result, tmpLS);
            } else if(task.dataObj.layout_id == 9 || task.dataObj.layout_id == 12) {
                $.getScript('static/js/AutointroImageClassification.js');
                startIntroImgCls(task.dataObj.completions[0].result, tmpLS);
            }
        // setTimeout(function () {
        //     tmpLS = ls;
        //     startIntro(task.dataObj.completions[0].result, tmpLS);
        //     // c = {id: ls.completionStore.completions[1].id, editable: false};
        //     // ls.completionStore.selectCompletion(c.id);
        }, (1000));
    } else if (task && task.dataObj.format_type == 3) {
        setTimeout(function () {
            btndiv = $(".Controls_container__LTeAA")[0];
            if ($(".helpBtn")[0] != undefined) {
                $(".helpBtn")[0].remove();
            }
            var btn = $('<button type="button" class="ant-btn ant-btn-ghost helpBtn" style="background: #52c41a; background-color: #52c41a; color: white"><span>See Answer</span></button>');
            // btn[0].appendTo(btndiv);
            btndiv.appendChild(btn[0]);
            $(".helpBtn").on('click', function(){
                tmpLS = ls;
                reRenderTask(tmpLS);
            });
        }, (300));
    } else if (task && (task.dataObj.format_type == 6 )) {
        setTimeout(function () {
            btndiv = $(".Controls_container__LTeAA")[0];
            $('.ls-update-btn').hide()// children().first().next().html('').append ("<span>Submit </span>");
            $('.ls-submit-btn').hide();
            ls.completionStore.selected.setEdit(false);
           var Skipbtn = $('.ls-skip-btn');
            Skipbtn.on('click', function () {
                $(".Controls_container__LTeAA").hide();
            });                                         //green hash #52c41a
            var btn = $('<button type="button" class="ant-btn ant-btn-secondary helpBtn" style="background: #52c41a; background-color: #52c41a; color: white"><span>Edit</span></button>');
            var submitbutton = $('<button type="button" class="ant-btn ant-btn-primary mysubmitbtn"><span role="img" aria-label="check" class="anticon anticon-check"><svg viewBox="64 64 896 896" focusable="false" class="" data-icon="check" width="1em" height="1em" fill="currentColor" aria-hidden="true"><path d="M912 190h-69.9c-9.8 0-19.1 4.5-25.1 12.2L404.7 724.5 207 474a32 32 0 00-25.1-12.2H112c-6.7 0-10.4 7.7-6.3 12.9l273.9 347c12.8 16.2 37.4 16.2 50.3 0l488.4-618.9c4.1-5.1.4-12.8-6.3-12.8z"></path></svg></span><span>Submit </span></button>');
            btndiv.append(submitbutton[0]);
            btndiv.append(btn[0]);
            submitbutton.on('click', function(){
               ls.submitCompletion();
                $(".Controls_container__LTeAA").hide();
            });
            $(".helpBtn").on('click', function(){
                ls.completionStore.selected.setEdit(true);
                $(".helpBtn").hide();
                $('.mysubmitbtn').hide();
                var updatebtn = $('<button type="button" class="ant-btn ant-btn-primary myupdatebtn"><span role="img" aria-label="check-circle" class="anticon anticon-check-circle"><svg viewBox="64 64 896 896" focusable="false" class="" data-icon="check-circle" width="1em" height="1em" fill="currentColor" aria-hidden="true"><path d="M699 353h-46.9c-10.2 0-19.9 4.9-25.9 13.3L469 584.3l-71.2-98.8c-6-8.3-15.6-13.3-25.9-13.3H325c-6.5 0-10.3 7.4-6.5 12.7l124.6 172.8a31.8 31.8 0 0051.7 0l210.6-292c3.9-5.3.1-12.7-6.4-12.7z"></path><path d="M512 64C264.6 64 64 264.6 64 512s200.6 448 448 448 448-200.6 448-448S759.4 64 512 64zm0 820c-205.4 0-372-166.6-372-372s166.6-372 372-372 372 166.6 372 372-166.6 372-372 372z"></path></svg></span><span>Update </span></button>');
                    btndiv.append(updatebtn[0]);
                    updatebtn.on('click', function (){
                        $(".Controls_container__LTeAA").hide();
                         ls.submitCompletion();
                })
            });
            showDemo = Cookies.get("showInro" + task.dataObj.format_type.toString() + task.dataObj.layout_id.toString());
            if (showDemo == undefined) {
                q = introJs().setOptions({
                    tooltipClass: 'customTooltip',doneLabel: "Let's Start",exitOnOverlayClick: false,exitOnEsc: false,showBullets: false,showStepNumbers: false,overlayOpacity: 0.5,disableInteraction: true,
                    steps: [{
                        title: 'Welcome 👋',
                        intro: 'Other User has done this task, Does it look okay to you? You can edit if not!'
                    }]
                });
                Cookies.set("showInro" + task.dataObj.format_type.toString() + task.dataObj.layout_id.toString(), true, { expires: 1 });
                // Cookies.remove("example");
                q.start();
            }
        }, (300));
    }
}

function reRenderTask(ls){
    // ls.resetState();
    // ls.assignTask(response);
    // ls.initializeStore(_convertTask(response));
    // ls.updateDescription(response.description);
    let cs = ls.completionStore;
    let c;
    if (ls.completionStore.selected.id === cs.completions[0].id){
        c = {id: cs.completions[1].id, editable: false};
        cs.selectCompletion(c.id);
        cs.selected.setupHotKeys();
        btndiv = $(".Controls_container__LTeAA")[0];
        $(".helpBtn").children().first().html('').append ("<span>Back to Task </span>");
        parent = $(".ls-skip-btn").parent();
        parent.children().eq(0).before(parent.children().last());
        parent.children().eq(0).before(parent.children().last());
        $('.ls-skip-btn').hide();
        $('.ls-update-btn').hide();
        $('.ls-submit-btn').hide();
        ls.completionStore.selected.setEdit(false);
    } else {
        c = {id: cs.completions[0].id, editable: false};
        cs.selectCompletion(c.id);
        cs.selected.setupHotKeys();
        $(".helpBtn").children().first().html('').append ("<span>See Answer </span>");
        parent = $(".helpBtn").parent();
        parent.children().eq(0).before(parent.children().last());
        parent.children().eq(0).before(parent.children().last());
        $('.ls-skip-btn').show();
        $('.ls-update-btn').show();
        $('.ls-submit-btn').show();
        ls.completionStore.selected.setEdit(true);
    }


    // var Skipbtn = $('.ls-skip-btn').children().first();
    // Skipbtn.html('').append ("<span>Next </span>");
    // Skipbtn.on('click', function(){
    //     c = ls.completionStore.addCompletion({ userGenerate: true });
    //     cs.selectCompletion(c.id);
    //     // ls.onSkipTask(ls);
    // });

}

const loadNext = function(ls, reset, trainingTask, batchid) {
  var url = `${API_URL.MAIN}${API_URL.PROJECT}${API_URL.NEXT}/${batchid}${API_URL.TraingTask}${trainingTask}`;
  return _loadTask(ls, url, "", reset);
};

const loadTask = function(ls, taskID, completionID, reset=false) {
  var url = `${API_URL.MAIN}${API_URL.TASKS}/${taskID}/`;
  return _loadTask(ls, url, completionID, reset);
};

const _convertTask = function(task) {
  // converts the task from the server format to the format
  // supported by the LS frontend
  if (!task) return;

  if (task.completions) {
    for (let tc of task.completions) {
      tc.pk = tc.id;
      tc.createdAgo = tc.created_ago;
      tc.createdBy = tc.created_username;
      tc.leadTime = tc.lead_time;
    }
  }

  if (task.predictions) {
    for (let tp of task.predictions) {
      tp.pk = tp.pk;
      tp.createdAgo = tp.created_ago;
      tp.createdBy = tp.created_by;
      tp.createdDate = tp.created_date;
    }
  }

  return task;
};


const LSF_SDK = function(elid, config, task, hide_skip, description, reset, response, batchid, numofPanel, _isAdmin) {

  const showHistory = task === null;  // show history buttons only if label stream mode, not for task explorer
  const batch_id = batchid;
  isAdmin = _isAdmin;
  const _prepData = function(c, includeId) {
    var completion = {
      lead_time: (new Date() - c.loadedDate) / 1000,  // task execution time
      result: c.serializeCompletion()
    };
    if (includeId) {
        completion.id = parseInt(c.id);
    }
    const body = JSON.stringify(completion);
    return body;
  };

  function initHistory(ls) {
      if (!ls.taskHistoryIds) {
          ls.taskHistoryIds = [];
          ls.taskHistoryCurrent = -1;
      }
  }
  function addHistory(ls, task_id, completion_id) {
      ls.taskHistoryIds.push({task_id: task_id, completion_id: completion_id});
      ls.taskHistoryCurrent = ls.taskHistoryIds.length;
  }

  var interfaces = [
      "basic",
      // "panel", // undo, redo, reset panel
      // "controls", // all control buttons: skip, submit, update
      // "submit", // submit button on controls
      // "update", // update button on controls
      //     "predictions",
      //    "predictions:menu", // right menu with prediction items
      //    "completions:menu", // right menu with completion items
      //    "completions:add-new",
      //    "completions:delete",
      //     "side-column", // entity
      //     "skip",
      //      "leaderboad",
      //      "messages",
  ];
  if (!hide_skip) {
    interfaces.push('skip');
  }

  if (numofPanel == 1) {
     interfaces.push("panel"); // undo, redo, reset panel
     interfaces.push("controls"); // all control buttons: skip, submit, update
     interfaces.push("submit"); // submit button on controls
     interfaces.push("update"); // update button on controls

      // interfaces.push("predictions");
     // interfaces.push("predictions:menu"); // right menu with prediction items
     // interfaces.push("completions:menu"); // right menu with completion items
     // interfaces.push("completions:menu"); // right menu with completion items
     // interfaces.push("completions:add-new");
     // interfaces.push("completions:delete");
     interfaces.push("side-column"); // entity
     interfaces.push("skip");
     // interfaces.push("leaderboad");
     // interfaces.push("messages");
  }

  var LS = new LabelStudio(elid, {
    config: config,
    user: { pk: 1, firstName: "Awesome", lastName: "User" },

    task: _convertTask(task),
    interfaces: interfaces,
    description: description,

    onSubmitCompletion: function(ls, c) {
      ls.setFlags({ isLoading: true });
      $(".Controls_container__LTeAA").hide();
      const req = Requests.poster(`${API_URL.MAIN}${API_URL.TASKS}/${ls.task.id}${API_URL.COMPLETIONS}/`, _prepData(c));

      req.then(function(httpres) {
        httpres.json().then(function(res) {
          if (res && res.id) {
              c.updatePersonalKey(res.id.toString());
              addHistory(ls, ls.task.id, res.id);
          //     $('body').toast({
          //   class: 'success',
          //   title: 'Answer Response',
          //   message: '<pre>' + "Your Answer is correct" + '</pre>',
          //   displayTime: 3000,
          //   position: 'bottom center'
          // });
          }

          if (task) {
            // ls.setFlags({ isLoading: false });
              console.log("task loaded");
                  // alert("Bilal 4");
          } else {
            loadNext(ls, true, 0, batch_id);
          }
        });
      });

      return true;
    },

    onTaskLoad: function(ls, task) {
      // render back & next buttons if there are history

      if (showHistory && ls.taskHistoryIds && ls.taskHistoryIds.length > 0) {
        var firstBlock = $('[class^=Panel_container]').children().first();
        var className = firstBlock.attr('class');
        var block = $('<div class="'+className+'"></div>');
        // prev button
        block.append('<button type="button" class="ant-btn ant-btn-ghost" ' +
                     (ls.taskHistoryCurrent > 0 ? '': 'disabled') +
                     ' onclick="window.LSF_SDK._sdk.prevButtonClick()">' +
                     '<i class="ui icon fa-angle-left"></i> Prev</button>');
        // next button
        block.append('<button type="button" class="ant-btn ant-btn-ghost"' +
                     (ls.taskHistoryCurrent < ls.taskHistoryIds.length ? '': 'disabled') +
                     ' onclick="window.LSF_SDK._sdk.nextButtonClick()">' +
                     'Next <i class="ui icon fa-angle-right"></i></button>');
        firstBlock.after(block);
      }


    },

    onUpdateCompletion: function(ls, c) {
        $(".Controls_container__LTeAA").hide();
      ls.setFlags({ isLoading: true });

      const req = Requests.patch(
        `${API_URL.MAIN}${API_URL.TASKS}/${ls.task.id}${API_URL.COMPLETIONS}/${c.pk}/`,
        _prepData(c)
      );

      req.then(function(httpres) {
        // ls.setFlags({ isLoading: false });
        // refresh task from server
        loadTask(ls, ls.task.id, ls.completionStore.selected.id, false);
      });
    },

    onDeleteCompletion: function(ls, completion) {
      ls.setFlags({ isLoading: true });

      const req = Requests.remover(`${API_URL.MAIN}${API_URL.TASKS}/${ls.task.id}${API_URL.COMPLETIONS}/${completion.pk}/`);
      req.then(function(httpres) {
        ls.setFlags({ isLoading: false });
      });
    },

    onSkipTask: function(ls) {
      ls.setFlags({ loading: true });
      $(".Controls_container__LTeAA").hide();
      var c = ls.completionStore.selected;
      var completion = _prepData(c, false);

      Requests.poster(
        `${API_URL.MAIN}${API_URL.TASKS}/${ls.task.id}${API_URL.COMPLETIONS}${API_URL.CANCEL}`,
        completion
      ).then(function(response) {
        response.json().then(function (res) {
          if (res && res.id) {
            c.updatePersonalKey(res.id.toString());
            addHistory(ls, ls.task.id, res.id);
          }

          // if (task) {
          //   ls.setFlags({ isLoading: false });
            // refresh task from server
            // loadTask(ls, ls.task.id, res.id);
          // } else {
            if (ls.task.dataObj.format_type == 1) {
                loadNext(ls,true, 1, batch_id);
            } else {
                loadNext(ls, true, 0, batch_id);
            }
          // }
        })
      });

      return true;
    },

    onGroundTruth: function(ls, c, value) {
      Requests.patch(
        `${API_URL.MAIN}${API_URL.TASKS}/${ls.task.id}${API_URL.COMPLETIONS}/${c.pk}/`,
        JSON.stringify({ honeypot: value })
      );
    },

    onLabelStudioLoad: function(ls) {
      var self = ls;
      ls.onTaskLoad = this.onTaskLoad;  // FIXME: make it inside of LSF
      ls.onPrevButton = this.onPrevButton; // FIXME: remove it in future
      initHistory(ls);
      if (reset == false) {
          if (!task) {
              ls.setFlags({isLoading: true});
              loadNext(ls, false, 0, batch_id);
          // }
          } else {
            if (!task.completions || task.completions.length === 0) {
                var c = ls.completionStore.addCompletion({userGenerate: true});
                ls.completionStore.selectCompletion(c.id);
            }
            // else {
            //     ls.addUserRanks(task.userranks);
            // }
          }
      }
      // else {
      //   response.data = JSON.stringify(response.data);
      //   // ls.setFlags({isLoading: false});
      //   ls.resetState();
      //   ls.assignTask(response);
      //   cTask = _convertTask(response);
      //   ls.initializeStore(cTask);
      //
      //   let cs = ls.completionStore;
      //   let c;
      //   if (cs.predictions.length > 0) {
      //       c = ls.completionStore.addCompletionFromPrediction(cs.predictions[0]);
      //   }
      //
      //   // we are on history item, take completion id from history
      //   else if (ls.completionStore.completions.length > 0 && response.completionID) {
      //       c = {id: response.completionID};
      //   } else if (ls.completionStore.completions.length > 0 && response.completionID === 'auto') {
      //       c = {id: ls.completionStore.completions[0].id};
      //   } else {
      //       c = ls.completionStore.addCompletion({userGenerate: true});
      //   }
      //
      //   if (c.id) cs.selectCompletion(c.id);
      //   // ls.onTaskLoad(ls, ls.task);
      //     ls.setFlags({isLoading: false});
      // }
      // alert("Bilal 3");
    }
  });

  // TODO WIP here, we will move that code to the SDK
  var sdk = {
      "loadNext": function () { loadNext(LS) },
      "loadTask": function (taskID, completionID) { loadTask(LS, taskID, completionID) },
      'prevButtonClick': function() {
          LS.taskHistoryCurrent--;
          let prev = LS.taskHistoryIds[LS.taskHistoryCurrent];
          loadTask(LS, prev.task_id, prev.completion_id);
      },
      'nextButtonClick': function() {
          LS.taskHistoryCurrent++;
          if (LS.taskHistoryCurrent < LS.taskHistoryIds.length) {
            let prev = LS.taskHistoryIds[LS.taskHistoryCurrent];
            loadTask(LS, prev.task_id, prev.completion_id);
          }
          else {
            loadNext(LS, true, 0, batchid);  // new task
          }
      }
  };

  LS._sdk = sdk;

  return LS;
};
