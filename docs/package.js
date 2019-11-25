(function(pkg) {
  (function() {
  var annotateSourceURL, cacheFor, circularGuard, defaultEntryPoint, fileSeparator, generateRequireFn, global, isPackage, loadModule, loadPackage, loadPath, normalizePath, publicAPI, rootModule, startsWith,
    __slice = [].slice;

  fileSeparator = '/';

  global = self;

  defaultEntryPoint = "main";

  circularGuard = {};

  rootModule = {
    path: ""
  };

  loadPath = function(parentModule, pkg, path) {
    var cache, localPath, module, normalizedPath;
    if (startsWith(path, '/')) {
      localPath = [];
    } else {
      localPath = parentModule.path.split(fileSeparator);
    }
    normalizedPath = normalizePath(path, localPath);
    cache = cacheFor(pkg);
    if (module = cache[normalizedPath]) {
      if (module === circularGuard) {
        throw "Circular dependency detected when requiring " + normalizedPath;
      }
    } else {
      cache[normalizedPath] = circularGuard;
      try {
        cache[normalizedPath] = module = loadModule(pkg, normalizedPath);
      } finally {
        if (cache[normalizedPath] === circularGuard) {
          delete cache[normalizedPath];
        }
      }
    }
    return module.exports;
  };

  normalizePath = function(path, base) {
    var piece, result;
    if (base == null) {
      base = [];
    }
    base = base.concat(path.split(fileSeparator));
    result = [];
    while (base.length) {
      switch (piece = base.shift()) {
        case "..":
          result.pop();
          break;
        case "":
        case ".":
          break;
        default:
          result.push(piece);
      }
    }
    return result.join(fileSeparator);
  };

  loadPackage = function(pkg) {
    var path;
    path = pkg.entryPoint || defaultEntryPoint;
    return loadPath(rootModule, pkg, path);
  };

  loadModule = function(pkg, path) {
    var args, content, context, dirname, file, module, program, values;
    if (!(file = pkg.distribution[path])) {
      throw "Could not find file at " + path + " in " + pkg.name;
    }
    if ((content = file.content) == null) {
      throw "Malformed package. No content for file at " + path + " in " + pkg.name;
    }
    program = annotateSourceURL(content, pkg, path);
    dirname = path.split(fileSeparator).slice(0, -1).join(fileSeparator);
    module = {
      path: dirname,
      exports: {}
    };
    context = {
      require: generateRequireFn(pkg, module),
      global: global,
      module: module,
      exports: module.exports,
      PACKAGE: pkg,
      __filename: path,
      __dirname: dirname
    };
    args = Object.keys(context);
    values = args.map(function(name) {
      return context[name];
    });
    Function.apply(null, __slice.call(args).concat([program])).apply(module, values);
    return module;
  };

  isPackage = function(path) {
    if (!(startsWith(path, fileSeparator) || startsWith(path, "." + fileSeparator) || startsWith(path, ".." + fileSeparator))) {
      return path.split(fileSeparator)[0];
    } else {
      return false;
    }
  };

  generateRequireFn = function(pkg, module) {
    var fn;
    if (module == null) {
      module = rootModule;
    }
    if (pkg.name == null) {
      pkg.name = "ROOT";
    }
    if (pkg.scopedName == null) {
      pkg.scopedName = "ROOT";
    }
    fn = function(path) {
      var otherPackage;
      if (typeof path === "object") {
        return loadPackage(path);
      } else if (isPackage(path)) {
        if (!(otherPackage = pkg.dependencies[path])) {
          throw "Package: " + path + " not found.";
        }
        if (otherPackage.name == null) {
          otherPackage.name = path;
        }
        if (otherPackage.scopedName == null) {
          otherPackage.scopedName = "" + pkg.scopedName + ":" + path;
        }
        return loadPackage(otherPackage);
      } else {
        return loadPath(module, pkg, path);
      }
    };
    fn.packageWrapper = publicAPI.packageWrapper;
    fn.executePackageWrapper = publicAPI.executePackageWrapper;
    return fn;
  };

  publicAPI = {
    generateFor: generateRequireFn,
    packageWrapper: function(pkg, code) {
      return ";(function(PACKAGE) {\n  var src = " + (JSON.stringify(PACKAGE.distribution.main.content)) + ";\n  var Require = new Function(\"PACKAGE\", \"return \" + src)({distribution: {main: {content: src}}});\n  var require = Require.generateFor(PACKAGE);\n  " + code + ";\n})(" + (JSON.stringify(pkg, null, 2)) + ");";
    },
    executePackageWrapper: function(pkg) {
      return publicAPI.packageWrapper(pkg, "require('./" + pkg.entryPoint + "')");
    },
    loadPackage: loadPackage
  };

  if (typeof exports !== "undefined" && exports !== null) {
    module.exports = publicAPI;
  } else {
    global.Require = publicAPI;
  }

  startsWith = function(string, prefix) {
    return string.lastIndexOf(prefix, 0) === 0;
  };

  cacheFor = function(pkg) {
    if (pkg.cache) {
      return pkg.cache;
    }
    Object.defineProperty(pkg, "cache", {
      value: {}
    });
    return pkg.cache;
  };

  annotateSourceURL = function(program, pkg, path) {
    return "" + program + "\n//# sourceURL=" + pkg.scopedName + "/" + path;
  };

  return publicAPI;

}).call(this);

  window.require = Require.generateFor(pkg);
})({
  "source": {
    "main.coffee": {
      "path": "main.coffee",
      "content": "###\n\nPostmaster wraps the `postMessage` API with promises.\n\n###\n\ndefaultReceiver = self\nackTimeout = 1000\npmId = 0\n\nmodule.exports = Postmaster = (self={}) ->\n  name = \"#{defaultReceiver.name}-#{++pmId}\"\n\n  info = ->\n    self.logger.info(name, arguments...)\n\n  debug = ->\n    self.logger.debug(name, arguments...)\n\n  dominant = Postmaster.dominant()\n  self.remoteTarget ?= -> dominant\n  self.receiver ?= -> defaultReceiver\n  self.ackTimeout ?= -> ackTimeout\n  self.delegate ?= self\n  self.logger ?=\n    info: ->\n    debug: ->\n  self.token ?= Math.random()\n\n  send = (data) ->\n    target = self.remoteTarget()\n    if self.token\n      data.token = self.token\n\n    data.from = defaultReceiver.name\n\n    if !target\n      throw new Error \"No remote target\"\n\n    info(\"->\", data)\n\n    if !Worker? or target instanceof Worker\n      target.postMessage data\n    else\n      target.postMessage data, \"*\"\n\n    return\n\n  listener = (event) ->\n    {data, source} = event\n    target = self.remoteTarget()\n\n    # Only listening to messages from `opener`\n    # event.source becomes undefined during the `onunload` event\n    # We can track a token and match to allow the final message in this case\n    if source is target or (source is undefined and data.token is self.token)\n      event.stopImmediatePropagation() # \n      info \"<-\", data\n      {type, method, params, id} = data\n\n      switch type\n        when \"ack\"\n          pendingResponses[id]?.ack = true\n        when \"response\"\n          pendingResponses[id].resolve data.result\n        when \"error\"\n          pendingResponses[id].reject data.error\n        when \"message\"\n          Promise.resolve()\n          .then ->\n            if source\n              send\n                type: \"ack\"\n                id: id\n\n            if typeof self.delegate[method] is \"function\"\n              self.delegate[method](params...)\n            else\n              throw new Error \"`#{method}` is not a function\"\n          .then (result) ->\n            if source\n              send\n                type: \"response\"\n                id: id\n                result: result\n          .catch (error) ->\n            if typeof error is \"string\"\n              message = error\n            else\n              message = error.message\n\n            if source\n              send\n                type: \"error\"\n                id: id\n                error:\n                  message: message\n                  stack: error.stack\n    else\n      debug \"DROP message\", event, \"source #{JSON.stringify(data.from)} does not match target\"\n\n  receiver = self.receiver()\n  receiver.addEventListener \"message\", listener\n  self.dispose = ->\n    receiver.removeEventListener \"message\", listener\n    info \"DISPOSE\"\n\n  pendingResponses = {}\n  msgId = 0\n\n  clear = (id) ->\n    debug \"CLEAR PENDING\", id\n    clearTimeout pendingResponses[id].timeout\n    delete pendingResponses[id]\n\n  self.invokeRemote = (method, params...) ->\n    new Promise (resolve, reject) ->\n      id = ++msgId\n\n      ackWait = self.ackTimeout()\n      timeout = setTimeout ->\n        unless resp.ack\n          info \"TIMEOUT\", resp\n          resp.reject new Error \"No ack received within #{ackWait}\"\n      , ackWait\n\n      debug \"STORE PENDING\", id\n      pendingResponses[id] = resp =\n        timeout: timeout\n        resolve: (result) ->\n          debug \"RESOLVE\", id, result\n          resolve(result)\n          clear(id)\n        reject: (error) ->\n          debug \"REJECT\", id, error\n          reject(error)\n          clear(id)\n\n      try\n        send\n          type: \"message\"\n          method: method\n          params: params\n          id: id\n      catch e\n        reject(e)\n        return\n\n  info \"INITIALIZE\"\n\n  return self\n\nPostmaster.dominant = ->\n  if window? # iframe or child window context\n    opener or ((parent != window) and parent) or undefined\n  else # Web Worker Context\n    self\n",
      "mode": "100644",
      "type": "blob"
    },
    "pixie.cson": {
      "path": "pixie.cson",
      "content": "version: \"0.7.0-pre.12\"\n",
      "mode": "100644",
      "type": "blob"
    },
    "test/postmaster.coffee": {
      "path": "test/postmaster.coffee",
      "content": "Postmaster = require \"../main\"\n\nrandId = ->\n  Math.random().toString(36).substr(2)\n\nscriptContent = ->\n  # This function is toString'd to be inserted into the sub-frames.\n  fn = ->\n    pm = Postmaster\n      delegate:\n        echo: (value) ->\n          return value\n        throws: ->\n          throw new Error(\"This always throws\")\n        promiseFail: ->\n          Promise.reject new Error \"This is a failed promise\"\n        invokeRemote: ->\n          pm.invokeRemote(arguments...)\n\n  \"\"\"\n    (function() {\n    var module = {};\n    (function() {\n    #{PACKAGE.distribution.main.content};\n    })();\n    var Postmaster = module.exports;\n    (#{fn.toString()})();\n    })();\n  \"\"\"\n\nsrcUrl = ->\n  URL.createObjectURL new Blob [\"\"\"\n    <html>\n    <body>\n      <script>#{scriptContent()}<\\/script>\n    </body>\n    </html>\n  \"\"\"],\n    type: \"text/html; charset=utf-8\"\n\ntestFrame = (fn) ->\n  iframe = document.createElement('iframe')\n  iframe.name = \"iframe-#{randId()}\"\n  iframe.src = srcUrl()\n  document.body.appendChild(iframe)\n\n  postmaster = Postmaster\n    remoteTarget: ->\n      iframe.contentWindow\n\n  iframe.addEventListener \"load\", ->\n    fn(postmaster)\n    .finally ->\n      iframe.remove()\n      postmaster.dispose()\n\n  return\n\ndescribe \"Postmaster\", ->\n  it \"should work with openened windows\", (done) ->\n    childWindow = open(srcUrl(), \"child-#{randId()}\", \"width=200,height=200\")\n\n    postmaster = Postmaster\n      remoteTarget: -> childWindow\n\n    childWindow.addEventListener \"load\", ->\n      postmaster.invokeRemote \"echo\", 5\n      .then (result) ->\n        assert.equal result, 5\n      .then ->\n        done()\n      , (error) ->\n        done(error)\n      .then ->\n        childWindow.close()\n        postmaster.dispose()\n\n    return\n\n  it \"should work with iframes\", (done) ->\n    testFrame (postmaster) ->\n      postmaster.invokeRemote \"echo\", 17\n      .then (result) ->\n        assert.equal result, 17\n      .then done, done\n\n    return\n\n  it \"should handle the remote call throwing errors\", (done) ->\n    testFrame (postmaster) ->\n      postmaster.invokeRemote \"throws\"\n      .then ->\n        done new Error \"Expected an error\"\n      , (error) ->\n        done()\n\n    return\n\n  it \"should throwing a useful error when the remote doesn't define the function\", (done) ->\n    testFrame (postmaster) ->\n      postmaster.invokeRemote \"undefinedFn\"\n      .then ->\n        done new Error \"Expected an error\"\n      , (error) ->\n        done()\n\n    return\n\n  it \"should handle the remote call returning failed promises\", (done) ->\n    testFrame (postmaster) ->\n      postmaster.invokeRemote \"promiseFail\"\n      .then ->\n        done new Error \"Expected an error\"\n      , (error) ->\n        done()\n\n    return\n\n  it \"should be able to go around the world\", (done) ->\n    testFrame (postmaster) ->\n      postmaster.yolo = (txt) ->\n        \"heyy #{txt}\"\n      postmaster.invokeRemote \"invokeRemote\", \"yolo\", \"cool\"\n      .then (result) ->\n        assert.equal result, \"heyy cool\"\n      .then ->\n        done()\n      , (error) ->\n        done(error)\n\n    return\n\n  it \"should work with web workers\"\n  (done) ->\n    blob = new Blob [scriptContent()], type: \"application/javascript\"\n    jsUrl = URL.createObjectURL(blob)\n\n    worker = new Worker(jsUrl)\n\n    postmaster = Postmaster\n      remoteTarget: -> worker\n      receiver: -> worker\n\n    setTimeout ->\n      postmaster.invokeRemote \"echo\", 17\n      .then (result) ->\n        assert.equal result, 17\n      .then ->\n        done()\n      , (error) ->\n        done(error)\n      .finally ->\n        worker.terminate()\n    , 100\n\n    return\n\n  it \"should fail quickly when contacting a window that doesn't support Postmaster\", (done) ->\n    iframe = document.createElement('iframe')\n    document.body.appendChild(iframe)\n\n    childWindow = iframe.contentWindow\n    postmaster = Postmaster\n      remoteTarget: -> childWindow\n      ackTimeout: -> 30\n\n    postmaster.invokeRemote \"echo\", 5\n    .catch (e) ->\n      if e.message.match /no ack/i\n        done()\n      else\n        done(1)\n    .finally ->\n      iframe.remove()\n      postmaster.dispose()\n\n    return\n\n  it \"should return a rejected promise when unable to send to the target\", (done) ->\n    postmaster = Postmaster\n      remoteTarget: -> null\n\n    postmaster.invokeRemote \"yo\"\n    .then ->\n      done throw new Error \"Expected an error\"\n    , (e) ->\n      assert.equal e.message, \"No remote target\"\n      done()\n    .catch done\n    .finally ->\n      postmaster.dispose()\n\n    return\n\n  it \"should log\", ->\n    called = false\n\n    Postmaster\n      logger:\n        info: ->\n          called = true\n\n    assert called\n",
      "mode": "100644",
      "type": "blob"
    }
  },
  "distribution": {
    "main": {
      "path": "main",
      "content": "\n/*\n\nPostmaster wraps the `postMessage` API with promises.\n */\n\n(function() {\n  var Postmaster, ackTimeout, defaultReceiver, pmId,\n    __slice = [].slice;\n\n  defaultReceiver = self;\n\n  ackTimeout = 1000;\n\n  pmId = 0;\n\n  module.exports = Postmaster = function(self) {\n    var clear, debug, dominant, info, listener, msgId, name, pendingResponses, receiver, send;\n    if (self == null) {\n      self = {};\n    }\n    name = \"\" + defaultReceiver.name + \"-\" + (++pmId);\n    info = function() {\n      var _ref;\n      return (_ref = self.logger).info.apply(_ref, [name].concat(__slice.call(arguments)));\n    };\n    debug = function() {\n      var _ref;\n      return (_ref = self.logger).debug.apply(_ref, [name].concat(__slice.call(arguments)));\n    };\n    dominant = Postmaster.dominant();\n    if (self.remoteTarget == null) {\n      self.remoteTarget = function() {\n        return dominant;\n      };\n    }\n    if (self.receiver == null) {\n      self.receiver = function() {\n        return defaultReceiver;\n      };\n    }\n    if (self.ackTimeout == null) {\n      self.ackTimeout = function() {\n        return ackTimeout;\n      };\n    }\n    if (self.delegate == null) {\n      self.delegate = self;\n    }\n    if (self.logger == null) {\n      self.logger = {\n        info: function() {},\n        debug: function() {}\n      };\n    }\n    if (self.token == null) {\n      self.token = Math.random();\n    }\n    send = function(data) {\n      var target;\n      target = self.remoteTarget();\n      if (self.token) {\n        data.token = self.token;\n      }\n      data.from = defaultReceiver.name;\n      if (!target) {\n        throw new Error(\"No remote target\");\n      }\n      info(\"->\", data);\n      if ((typeof Worker === \"undefined\" || Worker === null) || target instanceof Worker) {\n        target.postMessage(data);\n      } else {\n        target.postMessage(data, \"*\");\n      }\n    };\n    listener = function(event) {\n      var data, id, method, params, source, target, type, _ref;\n      data = event.data, source = event.source;\n      target = self.remoteTarget();\n      if (source === target || (source === void 0 && data.token === self.token)) {\n        event.stopImmediatePropagation();\n        info(\"<-\", data);\n        type = data.type, method = data.method, params = data.params, id = data.id;\n        switch (type) {\n          case \"ack\":\n            return (_ref = pendingResponses[id]) != null ? _ref.ack = true : void 0;\n          case \"response\":\n            return pendingResponses[id].resolve(data.result);\n          case \"error\":\n            return pendingResponses[id].reject(data.error);\n          case \"message\":\n            return Promise.resolve().then(function() {\n              var _ref1;\n              if (source) {\n                send({\n                  type: \"ack\",\n                  id: id\n                });\n              }\n              if (typeof self.delegate[method] === \"function\") {\n                return (_ref1 = self.delegate)[method].apply(_ref1, params);\n              } else {\n                throw new Error(\"`\" + method + \"` is not a function\");\n              }\n            }).then(function(result) {\n              if (source) {\n                return send({\n                  type: \"response\",\n                  id: id,\n                  result: result\n                });\n              }\n            })[\"catch\"](function(error) {\n              var message;\n              if (typeof error === \"string\") {\n                message = error;\n              } else {\n                message = error.message;\n              }\n              if (source) {\n                return send({\n                  type: \"error\",\n                  id: id,\n                  error: {\n                    message: message,\n                    stack: error.stack\n                  }\n                });\n              }\n            });\n        }\n      } else {\n        return debug(\"DROP message\", event, \"source \" + (JSON.stringify(data.from)) + \" does not match target\");\n      }\n    };\n    receiver = self.receiver();\n    receiver.addEventListener(\"message\", listener);\n    self.dispose = function() {\n      receiver.removeEventListener(\"message\", listener);\n      return info(\"DISPOSE\");\n    };\n    pendingResponses = {};\n    msgId = 0;\n    clear = function(id) {\n      debug(\"CLEAR PENDING\", id);\n      clearTimeout(pendingResponses[id].timeout);\n      return delete pendingResponses[id];\n    };\n    self.invokeRemote = function() {\n      var method, params;\n      method = arguments[0], params = 2 <= arguments.length ? __slice.call(arguments, 1) : [];\n      return new Promise(function(resolve, reject) {\n        var ackWait, e, id, resp, timeout;\n        id = ++msgId;\n        ackWait = self.ackTimeout();\n        timeout = setTimeout(function() {\n          if (!resp.ack) {\n            info(\"TIMEOUT\", resp);\n            return resp.reject(new Error(\"No ack received within \" + ackWait));\n          }\n        }, ackWait);\n        debug(\"STORE PENDING\", id);\n        pendingResponses[id] = resp = {\n          timeout: timeout,\n          resolve: function(result) {\n            debug(\"RESOLVE\", id, result);\n            resolve(result);\n            return clear(id);\n          },\n          reject: function(error) {\n            debug(\"REJECT\", id, error);\n            reject(error);\n            return clear(id);\n          }\n        };\n        try {\n          return send({\n            type: \"message\",\n            method: method,\n            params: params,\n            id: id\n          });\n        } catch (_error) {\n          e = _error;\n          reject(e);\n        }\n      });\n    };\n    info(\"INITIALIZE\");\n    return self;\n  };\n\n  Postmaster.dominant = function() {\n    if (typeof window !== \"undefined\" && window !== null) {\n      return opener || ((parent !== window) && parent) || void 0;\n    } else {\n      return self;\n    }\n  };\n\n}).call(this);\n",
      "type": "blob"
    },
    "pixie": {
      "path": "pixie",
      "content": "module.exports = {\"version\":\"0.7.0-pre.12\"};",
      "type": "blob"
    },
    "test/postmaster": {
      "path": "test/postmaster",
      "content": "(function() {\n  var Postmaster, randId, scriptContent, srcUrl, testFrame;\n\n  Postmaster = require(\"../main\");\n\n  randId = function() {\n    return Math.random().toString(36).substr(2);\n  };\n\n  scriptContent = function() {\n    var fn;\n    fn = function() {\n      var pm;\n      return pm = Postmaster({\n        delegate: {\n          echo: function(value) {\n            return value;\n          },\n          throws: function() {\n            throw new Error(\"This always throws\");\n          },\n          promiseFail: function() {\n            return Promise.reject(new Error(\"This is a failed promise\"));\n          },\n          invokeRemote: function() {\n            return pm.invokeRemote.apply(pm, arguments);\n          }\n        }\n      });\n    };\n    return \"(function() {\\nvar module = {};\\n(function() {\\n\" + PACKAGE.distribution.main.content + \";\\n})();\\nvar Postmaster = module.exports;\\n(\" + (fn.toString()) + \")();\\n})();\";\n  };\n\n  srcUrl = function() {\n    return URL.createObjectURL(new Blob([\"<html>\\n<body>\\n  <script>\" + (scriptContent()) + \"<\\/script>\\n</body>\\n</html>\"], {\n      type: \"text/html; charset=utf-8\"\n    }));\n  };\n\n  testFrame = function(fn) {\n    var iframe, postmaster;\n    iframe = document.createElement('iframe');\n    iframe.name = \"iframe-\" + (randId());\n    iframe.src = srcUrl();\n    document.body.appendChild(iframe);\n    postmaster = Postmaster({\n      remoteTarget: function() {\n        return iframe.contentWindow;\n      }\n    });\n    iframe.addEventListener(\"load\", function() {\n      return fn(postmaster)[\"finally\"](function() {\n        iframe.remove();\n        return postmaster.dispose();\n      });\n    });\n  };\n\n  describe(\"Postmaster\", function() {\n    it(\"should work with openened windows\", function(done) {\n      var childWindow, postmaster;\n      childWindow = open(srcUrl(), \"child-\" + (randId()), \"width=200,height=200\");\n      postmaster = Postmaster({\n        remoteTarget: function() {\n          return childWindow;\n        }\n      });\n      childWindow.addEventListener(\"load\", function() {\n        return postmaster.invokeRemote(\"echo\", 5).then(function(result) {\n          return assert.equal(result, 5);\n        }).then(function() {\n          return done();\n        }, function(error) {\n          return done(error);\n        }).then(function() {\n          childWindow.close();\n          return postmaster.dispose();\n        });\n      });\n    });\n    it(\"should work with iframes\", function(done) {\n      testFrame(function(postmaster) {\n        return postmaster.invokeRemote(\"echo\", 17).then(function(result) {\n          return assert.equal(result, 17);\n        }).then(done, done);\n      });\n    });\n    it(\"should handle the remote call throwing errors\", function(done) {\n      testFrame(function(postmaster) {\n        return postmaster.invokeRemote(\"throws\").then(function() {\n          return done(new Error(\"Expected an error\"));\n        }, function(error) {\n          return done();\n        });\n      });\n    });\n    it(\"should throwing a useful error when the remote doesn't define the function\", function(done) {\n      testFrame(function(postmaster) {\n        return postmaster.invokeRemote(\"undefinedFn\").then(function() {\n          return done(new Error(\"Expected an error\"));\n        }, function(error) {\n          return done();\n        });\n      });\n    });\n    it(\"should handle the remote call returning failed promises\", function(done) {\n      testFrame(function(postmaster) {\n        return postmaster.invokeRemote(\"promiseFail\").then(function() {\n          return done(new Error(\"Expected an error\"));\n        }, function(error) {\n          return done();\n        });\n      });\n    });\n    it(\"should be able to go around the world\", function(done) {\n      testFrame(function(postmaster) {\n        postmaster.yolo = function(txt) {\n          return \"heyy \" + txt;\n        };\n        return postmaster.invokeRemote(\"invokeRemote\", \"yolo\", \"cool\").then(function(result) {\n          return assert.equal(result, \"heyy cool\");\n        }).then(function() {\n          return done();\n        }, function(error) {\n          return done(error);\n        });\n      });\n    });\n    it(\"should work with web workers\");\n    (function(done) {\n      var blob, jsUrl, postmaster, worker;\n      blob = new Blob([scriptContent()], {\n        type: \"application/javascript\"\n      });\n      jsUrl = URL.createObjectURL(blob);\n      worker = new Worker(jsUrl);\n      postmaster = Postmaster({\n        remoteTarget: function() {\n          return worker;\n        },\n        receiver: function() {\n          return worker;\n        }\n      });\n      setTimeout(function() {\n        return postmaster.invokeRemote(\"echo\", 17).then(function(result) {\n          return assert.equal(result, 17);\n        }).then(function() {\n          return done();\n        }, function(error) {\n          return done(error);\n        })[\"finally\"](function() {\n          return worker.terminate();\n        });\n      }, 100);\n    });\n    it(\"should fail quickly when contacting a window that doesn't support Postmaster\", function(done) {\n      var childWindow, iframe, postmaster;\n      iframe = document.createElement('iframe');\n      document.body.appendChild(iframe);\n      childWindow = iframe.contentWindow;\n      postmaster = Postmaster({\n        remoteTarget: function() {\n          return childWindow;\n        },\n        ackTimeout: function() {\n          return 30;\n        }\n      });\n      postmaster.invokeRemote(\"echo\", 5)[\"catch\"](function(e) {\n        if (e.message.match(/no ack/i)) {\n          return done();\n        } else {\n          return done(1);\n        }\n      })[\"finally\"](function() {\n        iframe.remove();\n        return postmaster.dispose();\n      });\n    });\n    it(\"should return a rejected promise when unable to send to the target\", function(done) {\n      var postmaster;\n      postmaster = Postmaster({\n        remoteTarget: function() {\n          return null;\n        }\n      });\n      postmaster.invokeRemote(\"yo\").then(function() {\n        return done((function() {\n          throw new Error(\"Expected an error\");\n        })());\n      }, function(e) {\n        assert.equal(e.message, \"No remote target\");\n        return done();\n      })[\"catch\"](done)[\"finally\"](function() {\n        return postmaster.dispose();\n      });\n    });\n    return it(\"should log\", function() {\n      var called;\n      called = false;\n      Postmaster({\n        logger: {\n          info: function() {\n            return called = true;\n          }\n        }\n      });\n      return assert(called);\n    });\n  });\n\n}).call(this);\n",
      "type": "blob"
    }
  },
  "progenitor": {
    "url": "https://danielx.net/editor/"
  },
  "config": {
    "version": "0.7.0-pre.12"
  },
  "version": "0.7.0-pre.12",
  "entryPoint": "main",
  "repository": {
    "branch": "master",
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