Postmaster = require "../main"

randId = ->
  Math.random().toString(36).substr(2)

scriptContent = ->
  # This function is toString'd to be inserted into the sub-frames.
  fn = ->
    pm = Postmaster
      delegate:
        echo: (value) ->
          return value
        throws: ->
          throw new Error("This always throws")
        promiseFail: ->
          Promise.reject new Error "This is a failed promise"
        invokeRemote: ->
          pm.invokeRemote(arguments...)

  """
    (function() {
    var module = {};
    (function() {
    #{PACKAGE.distribution.main.content};
    })();
    var Postmaster = module.exports;
    (#{fn.toString()})();
    })();
  """

srcUrl = ->
  URL.createObjectURL new Blob ["""
    <html>
    <body>
      <script>#{scriptContent()}<\/script>
    </body>
    </html>
  """],
    type: "text/html; charset=utf-8"

testFrame = (fn) ->
  iframe = document.createElement('iframe')
  iframe.name = "iframe-#{randId()}"
  iframe.src = srcUrl()
  document.body.appendChild(iframe)

  postmaster = Postmaster
    remoteTarget: ->
      iframe.contentWindow

  iframe.addEventListener "load", ->
    fn(postmaster)
    .finally ->
      iframe.remove()
      postmaster.dispose()

  return

describe "Postmaster", ->
  it "should work with openened windows", (done) ->
    childWindow = open(srcUrl(), "child-#{randId()}", "width=200,height=200")

    postmaster = Postmaster
      remoteTarget: -> childWindow

    childWindow.addEventListener "load", ->
      postmaster.invokeRemote "echo", 5
      .then (result) ->
        assert.equal result, 5
      .then ->
        done()
      , (error) ->
        done(error)
      .then ->
        childWindow.close()
        postmaster.dispose()

    return

  it "should work with iframes", (done) ->
    testFrame (postmaster) ->
      postmaster.invokeRemote "echo", 17
      .then (result) ->
        assert.equal result, 17
      .then done, done

    return

  it "should handle the remote call throwing errors", (done) ->
    testFrame (postmaster) ->
      postmaster.invokeRemote "throws"
      .then ->
        done new Error "Expected an error"
      , (error) ->
        done()

    return

  it "should throwing a useful error when the remote doesn't define the function", (done) ->
    testFrame (postmaster) ->
      postmaster.invokeRemote "undefinedFn"
      .then ->
        done new Error "Expected an error"
      , (error) ->
        done()

    return

  it "should handle the remote call returning failed promises", (done) ->
    testFrame (postmaster) ->
      postmaster.invokeRemote "promiseFail"
      .then ->
        done new Error "Expected an error"
      , (error) ->
        done()

    return

  it "should be able to go around the world", (done) ->
    testFrame (postmaster) ->
      postmaster.yolo = (txt) ->
        "heyy #{txt}"
      postmaster.invokeRemote "invokeRemote", "yolo", "cool"
      .then (result) ->
        assert.equal result, "heyy cool"
      .then ->
        done()
      , (error) ->
        done(error)

    return

  it "should work with web workers"
  (done) ->
    blob = new Blob [scriptContent()], type: "application/javascript"
    jsUrl = URL.createObjectURL(blob)

    worker = new Worker(jsUrl)

    postmaster = Postmaster
      remoteTarget: -> worker
      receiver: -> worker

    setTimeout ->
      postmaster.invokeRemote "echo", 17
      .then (result) ->
        assert.equal result, 17
      .then ->
        done()
      , (error) ->
        done(error)
      .finally ->
        worker.terminate()
    , 100

    return

  it "should fail quickly when contacting a window that doesn't support Postmaster", (done) ->
    iframe = document.createElement('iframe')
    document.body.appendChild(iframe)

    childWindow = iframe.contentWindow
    postmaster = Postmaster
      remoteTarget: -> childWindow
      ackTimeout: -> 30

    postmaster.invokeRemote "echo", 5
    .catch (e) ->
      if e.message.match /no ack/i
        done()
      else
        done(1)
    .finally ->
      iframe.remove()
      postmaster.dispose()

    return

  it "should return a rejected promise when unable to send to the target", (done) ->
    postmaster = Postmaster
      remoteTarget: -> null

    postmaster.invokeRemote "yo"
    .then ->
      done throw new Error "Expected an error"
    , (e) ->
      assert.equal e.message, "No remote target"
      done()
    .catch done
    .finally ->
      postmaster.dispose()

    return
