window["distri/postmaster:promises"]({
  "source": {
    "LICENSE": {
      "path": "LICENSE",
      "content": "The MIT License (MIT)\n\nCopyright (c) 2013 distri\n\nPermission is hereby granted, free of charge, to any person obtaining a copy of\nthis software and associated documentation files (the \"Software\"), to deal in\nthe Software without restriction, including without limitation the rights to\nuse, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of\nthe Software, and to permit persons to whom the Software is furnished to do so,\nsubject to the following conditions:\n\nThe above copyright notice and this permission notice shall be included in all\ncopies or substantial portions of the Software.\n\nTHE SOFTWARE IS PROVIDED \"AS IS\", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR\nIMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS\nFOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR\nCOPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER\nIN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN\nCONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.\n",
      "mode": "100644",
      "type": "blob"
    },
    "README.md": {
      "path": "README.md",
      "content": "postmaster\n==========\n\nSend and receive `postMessage` commands using promises to handle the results.\n",
      "mode": "100644",
      "type": "blob"
    },
    "pixie.cson": {
      "path": "pixie.cson",
      "content": "version: \"0.3.0-pre.0\"\n",
      "mode": "100644",
      "type": "blob"
    },
    "test/postmaster.coffee": {
      "path": "test/postmaster.coffee",
      "content": "Postmaster = require \"../main\"\n\nscriptContent = ->\n  fn = ->\n    pm = Postmaster()\n    pm.echo = (value) ->\n      return value\n\n  \"\"\"\n    var module = {};\n    Postmaster = #{PACKAGE.distribution.main.content};\n    (#{fn.toString()})();\n  \"\"\"\n\ninitWindow = (targetWindow) ->\n  targetWindow.document.write \"<script>#{scriptContent()}<\\/script>\"\n\ndescribe \"Postmaster\", ->\n  it \"should work with openened windows\", (done) ->\n    childWindow = open(\"\", null, \"width=200,height=200\")\n\n    initWindow(childWindow)\n\n    postmaster = Postmaster()\n    postmaster.remoteTarget = -> childWindow\n    postmaster.invokeRemote \"echo\", 5\n    .then (result) ->\n      assert.equal result, 5\n    .then ->\n      done()\n    , (error) ->\n      done(error)\n    .then ->\n      childWindow.close()\n\n  it \"should work with iframes\", (done) ->\n    iframe = document.createElement('iframe')\n    document.body.appendChild(iframe)\n\n    childWindow = iframe.contentWindow\n    initWindow(childWindow)\n\n    postmaster = Postmaster()\n    postmaster.remoteTarget = -> childWindow\n    postmaster.invokeRemote \"echo\", 17\n    .then (result) ->\n      assert.equal result, 17\n    .then ->\n      done()\n    , (error) ->\n      done(error)\n    .then ->\n      iframe.remove()\n\n  it \"should be able to go around the world\", (done) ->\n    iframe = document.createElement('iframe')\n    document.body.appendChild(iframe)\n\n    childWindow = iframe.contentWindow\n    initWindow(childWindow)\n\n    postmaster = Postmaster()\n    postmaster.remoteTarget = -> childWindow\n    postmaster.yolo = (txt) ->\n      \"heyy #{txt}\"\n    postmaster.invokeRemote \"invokeRemote\", \"yolo\", \"cool\"\n    .then (result) ->\n      assert.equal result, \"heyy cool\"\n    .then ->\n      done()\n    , (error) ->\n      done(error)\n    .then ->\n      iframe.remove()\n\n  it \"should work with web workers\", (done) ->\n    blob = new Blob [scriptContent()]\n    jsUrl = URL.createObjectURL(blob)\n\n    worker = new Worker(jsUrl)\n\n    base =\n      remoteTarget: -> worker\n      receiver: -> worker\n\n    postmaster = Postmaster({}, base)\n    postmaster.invokeRemote \"echo\", 17\n    .then (result) ->\n      assert.equal result, 17\n    .then ->\n      done()\n    , (error) ->\n      done(error)\n    .then ->\n      worker.terminate()\n",
      "mode": "100644",
      "type": "blob"
    },
    "main.coffee": {
      "path": "main.coffee",
      "content": "###\n\nPostmaster wraps the `postMessage` API with promises.\n\n###\n\ndefaultReceiver = self\n\nmodule.exports = Postmaster = (I={}, self={}) ->\n  send = (data) ->\n    target = self.remoteTarget()\n    if !Worker? or target instanceof Worker\n      target.postMessage data\n    else\n      target.postMessage data, \"*\"\n\n  dominant = Postmaster.dominant()\n  self.remoteTarget ?= -> dominant\n  self.receiver ?= -> defaultReceiver\n\n  self.receiver().addEventListener \"message\", (event) ->\n    # Only listening to messages from `opener`\n    if event.source is self.remoteTarget() or !event.source\n      data = event.data\n      {type, method, params, id} = data\n\n      switch type\n        when \"response\"\n          pendingResponses[id].resolve data.result\n        when \"error\"\n          pendingResponses[id].reject data.error\n        when \"message\"\n          Promise.resolve()\n          .then ->\n            self[method](params...)\n          .then (result) ->\n            send\n              type: \"response\"\n              id: id\n              result: result\n          .catch (error) ->\n            if typeof error is \"string\"\n              message = error\n            else\n              message = error.message\n\n            send\n              type: \"error\"\n              id: id\n              error:\n                message: message\n                stack: error.stack\n\n  self.receiver().addEventListener \"unload\", ->\n    send\n      status: \"unload\"\n\n  # Tell our opener that we're ready\n  send\n    status: \"ready\"\n\n  pendingResponses = {}\n  remoteId = 0\n\n  self.invokeRemote = (method, params...) ->\n    id = remoteId++\n\n    send\n      type: \"message\"\n      method: method\n      params: params\n      id: id\n\n    new Promise (resolve, reject) ->\n      clear = ->\n        delete pendingResponses[id]\n\n      pendingResponses[id] =\n        resolve: (result) ->\n          clear()\n          resolve(result)\n        reject: (error) ->\n          clear()\n          reject(error)\n\n  return self\n\nPostmaster.dominant = ->\n  if window? # iframe or child window context\n    opener or ((parent != window) and parent) or undefined\n  else # Web Worker Context\n    self\n\nreturn Postmaster\n",
      "mode": "100644"
    }
  },
  "distribution": {
    "pixie": {
      "path": "pixie",
      "content": "module.exports = {\"version\":\"0.3.0-pre.0\"};",
      "type": "blob"
    },
    "test/postmaster": {
      "path": "test/postmaster",
      "content": "(function() {\n  var Postmaster, initWindow, scriptContent;\n\n  Postmaster = require(\"../main\");\n\n  scriptContent = function() {\n    var fn;\n    fn = function() {\n      var pm;\n      pm = Postmaster();\n      return pm.echo = function(value) {\n        return value;\n      };\n    };\n    return \"var module = {};\\nPostmaster = \" + PACKAGE.distribution.main.content + \";\\n(\" + (fn.toString()) + \")();\";\n  };\n\n  initWindow = function(targetWindow) {\n    return targetWindow.document.write(\"<script>\" + (scriptContent()) + \"<\\/script>\");\n  };\n\n  describe(\"Postmaster\", function() {\n    it(\"should work with openened windows\", function(done) {\n      var childWindow, postmaster;\n      childWindow = open(\"\", null, \"width=200,height=200\");\n      initWindow(childWindow);\n      postmaster = Postmaster();\n      postmaster.remoteTarget = function() {\n        return childWindow;\n      };\n      return postmaster.invokeRemote(\"echo\", 5).then(function(result) {\n        return assert.equal(result, 5);\n      }).then(function() {\n        return done();\n      }, function(error) {\n        return done(error);\n      }).then(function() {\n        return childWindow.close();\n      });\n    });\n    it(\"should work with iframes\", function(done) {\n      var childWindow, iframe, postmaster;\n      iframe = document.createElement('iframe');\n      document.body.appendChild(iframe);\n      childWindow = iframe.contentWindow;\n      initWindow(childWindow);\n      postmaster = Postmaster();\n      postmaster.remoteTarget = function() {\n        return childWindow;\n      };\n      return postmaster.invokeRemote(\"echo\", 17).then(function(result) {\n        return assert.equal(result, 17);\n      }).then(function() {\n        return done();\n      }, function(error) {\n        return done(error);\n      }).then(function() {\n        return iframe.remove();\n      });\n    });\n    it(\"should be able to go around the world\", function(done) {\n      var childWindow, iframe, postmaster;\n      iframe = document.createElement('iframe');\n      document.body.appendChild(iframe);\n      childWindow = iframe.contentWindow;\n      initWindow(childWindow);\n      postmaster = Postmaster();\n      postmaster.remoteTarget = function() {\n        return childWindow;\n      };\n      postmaster.yolo = function(txt) {\n        return \"heyy \" + txt;\n      };\n      return postmaster.invokeRemote(\"invokeRemote\", \"yolo\", \"cool\").then(function(result) {\n        return assert.equal(result, \"heyy cool\");\n      }).then(function() {\n        return done();\n      }, function(error) {\n        return done(error);\n      }).then(function() {\n        return iframe.remove();\n      });\n    });\n    return it(\"should work with web workers\", function(done) {\n      var base, blob, jsUrl, postmaster, worker;\n      blob = new Blob([scriptContent()]);\n      jsUrl = URL.createObjectURL(blob);\n      worker = new Worker(jsUrl);\n      base = {\n        remoteTarget: function() {\n          return worker;\n        },\n        receiver: function() {\n          return worker;\n        }\n      };\n      postmaster = Postmaster({}, base);\n      return postmaster.invokeRemote(\"echo\", 17).then(function(result) {\n        return assert.equal(result, 17);\n      }).then(function() {\n        return done();\n      }, function(error) {\n        return done(error);\n      }).then(function() {\n        return worker.terminate();\n      });\n    });\n  });\n\n}).call(this);\n",
      "type": "blob"
    },
    "main": {
      "path": "main",
      "content": "\n/*\n\nPostmaster wraps the `postMessage` API with promises.\n */\n\n(function() {\n  var Postmaster, defaultReceiver,\n    __slice = [].slice;\n\n  defaultReceiver = self;\n\n  module.exports = Postmaster = function(I, self) {\n    var dominant, pendingResponses, remoteId, send;\n    if (I == null) {\n      I = {};\n    }\n    if (self == null) {\n      self = {};\n    }\n    send = function(data) {\n      var target;\n      target = self.remoteTarget();\n      if ((typeof Worker === \"undefined\" || Worker === null) || target instanceof Worker) {\n        return target.postMessage(data);\n      } else {\n        return target.postMessage(data, \"*\");\n      }\n    };\n    dominant = Postmaster.dominant();\n    if (self.remoteTarget == null) {\n      self.remoteTarget = function() {\n        return dominant;\n      };\n    }\n    if (self.receiver == null) {\n      self.receiver = function() {\n        return defaultReceiver;\n      };\n    }\n    self.receiver().addEventListener(\"message\", function(event) {\n      var data, id, method, params, type;\n      if (event.source === self.remoteTarget() || !event.source) {\n        data = event.data;\n        type = data.type, method = data.method, params = data.params, id = data.id;\n        switch (type) {\n          case \"response\":\n            return pendingResponses[id].resolve(data.result);\n          case \"error\":\n            return pendingResponses[id].reject(data.error);\n          case \"message\":\n            return Promise.resolve().then(function() {\n              return self[method].apply(self, params);\n            }).then(function(result) {\n              return send({\n                type: \"response\",\n                id: id,\n                result: result\n              });\n            })[\"catch\"](function(error) {\n              var message;\n              if (typeof error === \"string\") {\n                message = error;\n              } else {\n                message = error.message;\n              }\n              return send({\n                type: \"error\",\n                id: id,\n                error: {\n                  message: message,\n                  stack: error.stack\n                }\n              });\n            });\n        }\n      }\n    });\n    self.receiver().addEventListener(\"unload\", function() {\n      return send({\n        status: \"unload\"\n      });\n    });\n    send({\n      status: \"ready\"\n    });\n    pendingResponses = {};\n    remoteId = 0;\n    self.invokeRemote = function() {\n      var id, method, params;\n      method = arguments[0], params = 2 <= arguments.length ? __slice.call(arguments, 1) : [];\n      id = remoteId++;\n      send({\n        type: \"message\",\n        method: method,\n        params: params,\n        id: id\n      });\n      return new Promise(function(resolve, reject) {\n        var clear;\n        clear = function() {\n          return delete pendingResponses[id];\n        };\n        return pendingResponses[id] = {\n          resolve: function(result) {\n            clear();\n            return resolve(result);\n          },\n          reject: function(error) {\n            clear();\n            return reject(error);\n          }\n        };\n      });\n    };\n    return self;\n  };\n\n  Postmaster.dominant = function() {\n    if (typeof window !== \"undefined\" && window !== null) {\n      return opener || ((parent !== window) && parent) || void 0;\n    } else {\n      return self;\n    }\n  };\n\n  return Postmaster;\n\n}).call(this);\n",
      "type": "blob"
    }
  },
  "progenitor": {
    "url": "http://www.danielx.net/editor/"
  },
  "version": "0.3.0-pre.0",
  "entryPoint": "main",
  "repository": {
    "branch": "promises",
    "default_branch": "master",
    "full_name": "distri/postmaster",
    "homepage": null,
    "description": "Send and receive postMessage commands.",
    "html_url": "https://github.com/distri/postmaster",
    "url": "https://api.github.com/repos/distri/postmaster",
    "publishBranch": "gh-pages"
  },
  "dependencies": {}
});