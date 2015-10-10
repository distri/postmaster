Postmaster = require "../main"

scriptContent = ->
  fn = ->
    pm = Postmaster()
    pm.echo = (value) ->
      return value
    pm.throws = ->
      throw new Error("This always throws")
    pm.promiseFail = ->
      Promise.reject new Error "This is a failed promise"

  """
    var module = {};
    Postmaster = #{PACKAGE.distribution.main.content};
    (#{fn.toString()})();
  """

initWindow = (targetWindow) ->
  targetWindow.document.write "<script>#{scriptContent()}<\/script>"

describe "Postmaster", ->
  it "should work with openened windows", (done) ->
    childWindow = open("", null, "width=200,height=200")

    initWindow(childWindow)

    postmaster = Postmaster()
    postmaster.remoteTarget = -> childWindow
    postmaster.invokeRemote "echo", 5
    .then (result) ->
      assert.equal result, 5
    .then ->
      done()
    , (error) ->
      done(error)
    .then ->
      childWindow.close()

  it "should work with iframes", (done) ->
    iframe = document.createElement('iframe')
    document.body.appendChild(iframe)

    childWindow = iframe.contentWindow
    initWindow(childWindow)

    postmaster = Postmaster()
    postmaster.remoteTarget = -> childWindow
    postmaster.invokeRemote "echo", 17
    .then (result) ->
      assert.equal result, 17
    .then ->
      done()
    , (error) ->
      done(error)
    .then ->
      iframe.remove()

  it "should handle the remote call throwing errors", (done) ->
    iframe = document.createElement('iframe')
    document.body.appendChild(iframe)

    childWindow = iframe.contentWindow
    initWindow(childWindow)

    postmaster = Postmaster()
    postmaster.remoteTarget = -> childWindow
    postmaster.invokeRemote "throws"
    .catch (error) ->
      done()
    .then ->
      iframe.remove()

  it "should handle the remote call returning failed promises", (done) ->
    iframe = document.createElement('iframe')
    document.body.appendChild(iframe)

    childWindow = iframe.contentWindow
    initWindow(childWindow)

    postmaster = Postmaster()
    postmaster.remoteTarget = -> childWindow
    postmaster.invokeRemote "promiseFail"
    .catch (error) ->
      done()
    .then ->
      iframe.remove()

  it "should be able to go around the world", (done) ->
    iframe = document.createElement('iframe')
    document.body.appendChild(iframe)

    childWindow = iframe.contentWindow
    initWindow(childWindow)

    postmaster = Postmaster()
    postmaster.remoteTarget = -> childWindow
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

  it "should work with web workers", (done) ->
    blob = new Blob [scriptContent()]
    jsUrl = URL.createObjectURL(blob)

    worker = new Worker(jsUrl)

    base =
      remoteTarget: -> worker
      receiver: -> worker

    postmaster = Postmaster({}, base)
    postmaster.invokeRemote "echo", 17
    .then (result) ->
      assert.equal result, 17
    .then ->
      done()
    , (error) ->
      done(error)
    .then ->
      worker.terminate()

  it "should fail quickly when contacting a window that doesn't support Postmaster", (done) ->
    iframe = document.createElement('iframe')
    document.body.appendChild(iframe)

    childWindow = iframe.contentWindow
    postmaster = Postmaster()
    postmaster.remoteTarget = -> childWindow
    postmaster.invokeRemote "echo", 5
    .catch (e) ->
      if e.message.match /no ack/i
        done()
      else
        done(1)
    .then ->
      iframe.remove()
