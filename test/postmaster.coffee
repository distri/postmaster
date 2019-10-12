Postmaster = require "../main"

scriptContent = ->
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

initWindow = (targetWindow) ->
  targetWindow.document.write "<script>#{scriptContent()}<\/script>"

describe "Postmaster", ->
  it "should work with openened windows", (done) ->
    childWindow = open(srcUrl(), null, "width=200,height=200")

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

    return

  it "should work with iframes", (done) ->
    iframe = document.createElement('iframe')
    iframe.src = srcUrl()
    document.body.appendChild(iframe)

    postmaster = Postmaster
      remoteTarget: ->
        iframe.contentWindow

    iframe.onload = ->
      postmaster.invokeRemote "echo", 17
      .then (result) ->
        assert.equal result, 17
      .then ->
        done()
      , (error) ->
        done(error)
      .then ->
        iframe.remove()

    return

  it "should handle the remote call throwing errors", (done) ->
    iframe = document.createElement('iframe')
    iframe.src = srcUrl()
    document.body.appendChild(iframe)

    postmaster = Postmaster
      remoteTarget: ->
        iframe.contentWindow

    iframe.onload = ->
      postmaster.invokeRemote "throws"
      .catch (error) ->
        done()
      .then ->
        iframe.remove()

    return

  it "should throwing a useful error when the remote doesn't define the function", (done) ->
    iframe = document.createElement('iframe')
    iframe.src = srcUrl()
    document.body.appendChild(iframe)

    postmaster = Postmaster
      remoteTarget: ->
        iframe.contentWindow

    iframe.onload = ->
      postmaster.invokeRemote "someUndefinedFunction"
      .catch (error) ->
        done()
      .then ->
        iframe.remove()

    return

  it "should handle the remote call returning failed promises", (done) ->
    iframe = document.createElement('iframe')
    iframe.src = srcUrl()
    document.body.appendChild(iframe)

    postmaster = Postmaster
      remoteTarget: ->
        iframe.contentWindow

    iframe.onload = ->
      postmaster.invokeRemote "promiseFail"
      .catch (error) ->
        done()
      .then ->
        iframe.remove()

    return

  it "should be able to go around the world", (done) ->
    iframe = document.createElement('iframe')
    iframe.src = srcUrl()
    document.body.appendChild(iframe)

    postmaster = Postmaster
      remoteTarget: ->
        iframe.contentWindow

    iframe.onload = ->
      postmaster.yolo = (txt) ->
        "heyy #{txt}"
      postmaster.invokeRemote "invokeRemote", "yolo", "cool"
      .then (result) ->
        assert.equal result, "heyy cool"
      .then ->
        done()
      , (error) ->
        done(error)
      .then ->
        iframe.remove()

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
      .then ->
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
    .then ->
      iframe.remove()

    return

  it "should return a rejected promise when unable to send to the target", (done) ->
    postmaster = Postmaster
      remoteTarget: -> null

    postmaster.invokeRemote "yo"
    .catch (e) ->
      assert.equal e.message, "No remote target"
      done()
    .catch done

    return
