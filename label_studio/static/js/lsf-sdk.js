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

var TempTaskData;
var tmpLS;

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
                response.data = JSON.stringify(response.data);
                TempTaskData = response;
                tmpLS = ls;
                ls.resetState();
                ls.assignTask(response);
                ls.initializeStore(_convertTask(response));
                ls.updateDescription(response.description);
                let cs = ls.completionStore;
                let c;

                if (ls.completionStore.completions.length > 0 && completionID === 'auto') {
                  c = {id: ls.completionStore.completions[0].id};
                }

                else if (cs.predictions.length > 0) {
                    c = ls.completionStore.addCompletionFromPrediction(cs.predictions[0]);
                }

                // we are on history item, take completion id from history
                else if (ls.completionStore.completions.length > 0 && completionID) {
                    c = {id: 1};
                }

                else if (ls.completionStore.completions.length > 0 && (response.format_type == 1) ) {
                    c = {id: completionID};
                }

                else {
                    c = ls.completionStore.addCompletion({ userGenerate: true });
                }

                if (c.id) cs.selectCompletion(c.id);

                // fix for broken old references in mst
                cs.selected.setupHotKeys();
                ls.setFlags({ isLoading: false });
                ls.onTaskLoad(ls, ls.task);
                MyDOList(ls, ls.task);
              // }
            })
        });
    } catch (err) {
        console.error("Failed to load next task ", err);
    }
};
function MyDOList(ls, task){
      if (task && task.dataObj.format_type == 1 ) {
          if (task.dataObj.completions != null){
              var Skipbtn = $('.ls-skip-btn').children().first();
              Skipbtn.html('').append("<span>Got It </span>");
              // $('.ls-skip-btn').hide();
              Skipbtn.on('click', function () {
                  c = ls.completionStore.addCompletion({userGenerate: true});
                  cs.selectCompletion(c.id);
              });
              $('.ls-update-btn').hide();
              $('.ls-submit-btn').hide();
         }

            // var Updatebtn = $('.ls-update-btn').children().first().next();
            // Updatebtn.html('').append ("<span>Got it </span>");
            // var Submitbtn = $('.ls-submit-btn').children().first().next();
            // Submitbtn.html('').append ("<span>Got it </span>");

        } else if (task && task.dataObj.format_type == 2) {
            setTimeout(function () {
                startIntroForRE(task.dataObj.completions[0].result, tmpLS);
            }, (1 * 1000));
        } else if (task && task.dataObj.format_type == 3) {
            btndiv = $(".Controls_container__LTeAA")[0];
            var btn = $('<button type="button" class="ant-btn ant-btn-ghost helpBtn"><span>Help Me Understand</span></button>');
            btndiv.append(btn[0]);
            $(".helpBtn").on('click', function(){
                tmpLS = ls;
                reRenderTask(tmpLS, TempTaskData);
            });
        }
}
function reRenderTask(ls, response, completionID){
    // ls.resetState();
    // ls.assignTask(response);
    // ls.initializeStore(_convertTask(response));
    // ls.updateDescription(response.description);
    let cs = ls.completionStore;
    let c;

    // if (ls.completionStore.completions.length > 0 && completionID === 'auto') {
      c = {id: ls.completionStore.completions[0].id, editable: false};
    // }
    //
    // else if (cs.predictions.length > 0) {
    //     c = ls.completionStore.addCompletionFromPrediction(cs.predictions[0]);
    // }
    //
    // // we are on history item, take completion id from history
    // else if (ls.completionStore.completions.length > 0 && completionID) {
    //     c = {id: 1};
    // }
    //
    // else {
    //     c = {id: completionID, editable: false};
    // }

    if (c.id) cs.selectCompletion(c.id);

    // fix for broken old references in mst
    cs.selected.setupHotKeys();
    ls.setFlags({ isLoading: false });
    var Skipbtn = $('.ls-skip-btn').children().first();
    Skipbtn.html('').append ("<span>Next </span>");
    Skipbtn.on('click', function(){
        c = ls.completionStore.addCompletion({ userGenerate: true });
        cs.selectCompletion(c.id);
        // ls.onSkipTask(ls);
    });
    $('.ls-update-btn').hide();
    $('.ls-submit-btn').hide();
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


const LSF_SDK = function(elid, config, task, hide_skip, description, reset, response, batchid, numofPanel) {

  const showHistory = task === null;  // show history buttons only if label stream mode, not for task explorer
  const batch_id = batchid;
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
     interfaces.push("completions:menu"); // right menu with completion items
     // interfaces.push("completions:menu"); // right menu with completion items
     // interfaces.push("completions:add-new");
     // interfaces.push("completions:delete");
     interfaces.push("side-column"); // entity
     interfaces.push("skip");
     interfaces.push("leaderboad");
     interfaces.push("messages");
  }

  var LS = new LabelStudio(elid, {
    config: config,
    user: { pk: 1, firstName: "Awesome", lastName: "User" },

    task: _convertTask(task),
    interfaces: interfaces,
    description: description,

    onSubmitCompletion: function(ls, c) {
      ls.setFlags({ isLoading: true });
      const req = Requests.poster(`${API_URL.MAIN}${API_URL.TASKS}/${ls.task.id}${API_URL.COMPLETIONS}/`, _prepData(c));

      req.then(function(httpres) {
        httpres.json().then(function(res) {
          if (res && res.id) {
              c.updatePersonalKey(res.id.toString());
              addHistory(ls, ls.task.id, res.id);
              $('body').toast({
            class: 'success',
            title: 'Answer Response',
            message: '<pre>' + "Your Answer is correct" + '</pre>',
            displayTime: 3000,
            position: 'bottom center'
          });
          }

          if (task) {
            ls.setFlags({ isLoading: false });
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
        // alert(document.querySelector('[class^="ant-tag"]'));
      //   tags = document.getElementsByClassName('ant-tag');
      // bts = document.getElementsByClassName("ant-btn ");
      //   // textArea = document.querySelector('[class^="Text_block"]');
      //   labelbtns = document.getElementsByClassName('ls-entity-buttons')[0];
      //   $($(".ant-tag")[0]).wrap("<div class='myclass1' style='width: 150px; height: 50px; padding: 15px'></div>");
      //   var q = introJs().setOptions({
      //       // showButtons: false,
      //       showBullets: false,
      //       // showStepNumbers: false,
      //       // overlayOpacity: 0.1,
      //       disableInteraction: false,
      //       steps: [
      //           {
      //               title: 'Welcome',
      //               intro: 'Hello World! 👋'
      //           },{
      //               title: 'Select Tag',
      //               element: document.getElementsByClassName('myclass1')[0],
      //               intro: "Select Tag",
      //               position: 'top'
      //           }
      //       ]
      //   });
      //   q.start();

        ///////////////////////    Image Intro ///////////////////
        // setTimeout(function() {
        // tags[0].click();
        // textArea = document.getElementsByTagName("canvas");
        // textArea = document.getElementsByClassName('ImageView_container__AOBmH');
        // const rect = textArea[0].getBoundingClientRect();
        //
        // _left = rect.x + window.scrollX;
        // _top = Math.floor(rect.y) + window.scrollY;
        // //
        // console.log(_left);
        // console.log(_top);
        //
        // qwe = document.elementFromPoint(_left, _top);
        // var evt = document.createEvent("MouseEvents");
        // evt.initEvent("mousedown", true, true, document.defaultView, 0, 0, 0, _left, _top);
        // qwe.dispatchEvent(evt);
        // //
        // var evt = document.createEvent("MouseEvents");
        // evt.initEvent("mouseup", true, true, document.defaultView, 0, 0, 0, _left, _top);
        // qwe.dispatchEvent(evt);
        // //
        // var evt = document.createEvent("MouseEvents");
        // evt.initEvent("click", true, true, document.defaultView, 0, 0, 0, _left, _top);
        // qwe.dispatchEvent(evt);
        //
        // qwe = document.elementFromPoint(468, 448);
        // var evt = document.createEvent("MouseEvents");
        // evt.initEvent("mousedown", true, true);
        // qwe.dispatchEvent(evt);
        //
        // var evt = document.createEvent("MouseEvents");
        // evt.initEvent("mouseup", true, false);
        // qwe.dispatchEvent(evt);
        //
        // var evt = document.createEvent("MouseEvents");
        // evt.initEvent("click", true, false);
        // qwe.dispatchEvent(evt);
        // },(3*1000));


        ///////////////////////////        Automated intro for text labeling and relation      ////////////////////////
        // var waitTime = 1;
        // elemenq = document.querySelector('[class^="Text_line"]');
        // setTimeout(function(){
        //     q.nextStep();
        //     setTimeout(function(){
        //         tags[0].click();
        //         setTimeout(function(){
        //             q.nextStep();
        //             setTimeout(function(){
        //                 let range = new Range();
        //                 range.setStart(elemenq.firstChild, 5);
        //                 range.setEnd(elemenq.firstChild, 10)
        //                 window.getSelection().removeAllRanges();
        //                 window.getSelection().addRange(range);
        //                 var evt = document.createEvent("MouseEvents");
        //                 evt.initEvent("mouseup", true, true);
        //                 elemenq.dispatchEvent(evt);
        //                 setTimeout(function(){
        //                     labelbtns = document.getElementsByClassName('ls-entity-buttons')[0];
        //                     q.addStep({title: 'Action Buttons', element: labelbtns, intro: 'Create Relation, Add meta info, UnSelect or Delete Tag', position: 'top'});
        //                     q.refresh();
        //                     lastElementIndex = q._options.steps.length - 1;
        //                     q._introItems.push(q._options.steps[lastElementIndex]);
        //                     q._introItems[lastElementIndex].step = lastElementIndex + 1;
        //                     q._introItems[lastElementIndex].disableInteraction = true;
        //                     q.nextStep();
        //                     setTimeout(function(){
        //                         b1 = labelbtns.children[2];
        //                         q.addStep({title: 'Unselect', intro: "Unselect for next ", element: b1, position: 'top'});
        //                         lastElementIndex = q._options.steps.length - 1;
        //                         q._introItems.push(q._options.steps[lastElementIndex]);
        //                         q._introItems[lastElementIndex].step = lastElementIndex + 1;
        //                         q._introItems[lastElementIndex].disableInteraction = true;
        //                         q.nextStep();
        //                         setTimeout(function(){
        //                             b1.click();
        //                             q.addStep({title: 'Select Tag', intro: "Select 2nd Tag", element: tags[3], position: 'top'});
        //                             lastElementIndex = q._options.steps.length - 1;
        //                             q._introItems.push(q._options.steps[lastElementIndex]);
        //                             q._introItems[lastElementIndex].step = lastElementIndex + 1;
        //                             q._introItems[lastElementIndex].disableInteraction = true;
        //                             q.nextStep();
        //                             setTimeout(function(){
        //                                 tags[3].click();
        //                                 q.addStep({title: 'Highlight Text!', element: textArea, intro: 'Select Text with mouse!', position: 'top'});
        //                                 lastElementIndex = q._options.steps.length - 1;
        //                                 q._introItems.push(q._options.steps[lastElementIndex]);
        //                                 q._introItems[lastElementIndex].step = lastElementIndex + 1;
        //                                 q._introItems[lastElementIndex].disableInteraction = true;
        //                                 q.nextStep();
        //                                 setTimeout(function(){
        //                                     let range = new Range();
        //                                     range.setStart(elemenq.lastChild, elemenq.lastChild.textContent.indexOf("China"));
        //                                     range.setEnd(elemenq.lastChild, elemenq.lastChild.textContent.indexOf("China") + 2)
        //                                     window.getSelection().removeAllRanges();
        //                                     window.getSelection().addRange(range);
        //                                     var evt = document.createEvent("MouseEvents");
        //                                     evt.initEvent("mouseup", true, true);
        //                                     elemenq.dispatchEvent(evt);
        //                                     setTimeout(function(){
        //                                         // q.exit();
        //                                         labelbtns1 = document.getElementsByClassName('ls-entity-buttons')[0];
        //                                         b2 = labelbtns1.children[0];
        //                                         q.addStep({title: 'Relations', element: b2, intro: 'Click to start relation process', position: 'top'});
        //                                         lastElementIndex = q._options.steps.length - 1;
        //                                         q._introItems.push(q._options.steps[lastElementIndex]);
        //                                         q._introItems[lastElementIndex].step = lastElementIndex + 1;
        //                                         q._introItems[lastElementIndex].disableInteraction = true;
        //                                         q.nextStep();
        //                                         setTimeout(function(){
        //                                             b2.click();
        //                                             rlspan = document.querySelector('[data-labels^="Person"]');
        //                                             q.addStep({title: 'Relations', element: rlspan, intro: 'Click to create Relation!', position: 'top'});
        //                                             lastElementIndex = q._options.steps.length - 1;
        //                                             q._introItems.push(q._options.steps[lastElementIndex]);
        //                                             q._introItems[lastElementIndex].step = lastElementIndex + 1;
        //                                             q._introItems[lastElementIndex].disableInteraction = true;
        //                                             q.nextStep();
        //                                             setTimeout(function(){
        //                                                 q.exit();
        //                                                 var evt = document.createEvent("MouseEvents");
        //                                                 evt.initEvent("mouseover", true, true);
        //                                                 rlspan.dispatchEvent(evt);
        //                                                 var evt = document.createEvent("MouseEvents");
        //                                                 evt.initEvent("mousedown", true, true);
        //                                                 rlspan.dispatchEvent(evt);
        //                                                 var evt = document.createEvent("MouseEvents");
        //                                                 evt.initEvent("click", true, false);
        //                                                 rlspan.dispatchEvent(evt);
        //                                             },(waitTime*1000));
        //                                         },(waitTime*1000));
        //                                     },(waitTime*1000));
        //                                 },(waitTime*1000));
        //                             },(waitTime*1000));
        //                         },(waitTime*1000));
        //                     },(waitTime*1000));
        //                 },(waitTime*1000));
        //             },(waitTime*1000));
        //         },(waitTime*1000));
        //     },(waitTime*1000));
        // },(waitTime*1000));

    },

    onUpdateCompletion: function(ls, c) {
      ls.setFlags({ isLoading: true });

      const req = Requests.patch(
        `${API_URL.MAIN}${API_URL.TASKS}/${ls.task.id}${API_URL.COMPLETIONS}/${c.pk}/`,
        _prepData(c)
      );

      req.then(function(httpres) {
        ls.setFlags({ isLoading: false });
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
      } else {
        response.data = JSON.stringify(response.data);
        ls.setFlags({isLoading: false});
        ls.resetState();
        ls.assignTask(response);
        cTask = _convertTask(response);
        ls.initializeStore(cTask);

        let cs = ls.completionStore;
        let c;
        if (cs.predictions.length > 0) {
            c = ls.completionStore.addCompletionFromPrediction(cs.predictions[0]);
        }

        // we are on history item, take completion id from history
        else if (ls.completionStore.completions.length > 0 && response.completionID) {
            c = {id: response.completionID};
        } else if (ls.completionStore.completions.length > 0 && response.completionID === 'auto') {
            c = {id: ls.completionStore.completions[0].id};
        } else {
            c = ls.completionStore.addCompletion({userGenerate: true});
        }

        if (c.id) cs.selectCompletion(c.id);
           ls.onTaskLoad(ls, ls.task);
      }
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
