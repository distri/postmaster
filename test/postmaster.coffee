Postmaster = require "../main"

describe "Postmaster", ->
  it "should allow sending messages to parent", ->
    postmaster = Postmaster()

    assert postmaster.sendToParent
