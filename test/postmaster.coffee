Postmaster = require "../main"

initWindow = (targetWindow) ->
  fn = ->
    pm = Postmaster()
    pm.echo = (value) ->
      return value

  targetWindow.document.write """
    <script>
      var module = {};
      Postmaster = #{PACKAGE.distribution.main.content};
      (#{fn.toString()})();
    <\/script>
  """

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
