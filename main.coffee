###

Postmaster wraps the `postMessage` API with promises.

###

defaultReceiver = self

module.exports = Postmaster = (I={}, self={}) ->
  send = (data) ->
    target = self.remoteTarget()
    if target instanceof Worker
      target.postMessage data
    else
      target.postMessage data, "*"

  dominant = Postmaster.dominant()
  self.remoteTarget ?= -> dominant
  self.receiver ?= -> defaultReceiver

  # Only listening to messages from `opener`
  self.receiver().addEventListener "message", (event) ->
    if event.source is self.remoteTarget()
      data = event.data
      {type, method, params, id} = data

      switch type
        when "response"
          pendingResponses[id].resolve data.result
        when "error"
          pendingResponses[id].reject data.error
        when "message"
          Promise.resolve()
          .then ->
            self[method](params...)
          .then (result) ->
            send
              type: "response"
              id: id
              result: result
          .catch (error) ->
            if typeof error is "string"
              message = error
            else
              message = error.message

            send
              type: "error"
              id: id
              error:
                message: message
                stack: error.stack

  self.receiver().addEventListener "unload", ->
    send
      status: "unload"

  # Tell our opener that we're ready
  send
    status: "ready"

  pendingResponses = {}
  remoteId = 0

  self.invokeRemote = (method, params...) ->
    id = remoteId++

    send
      type: "message"
      method: method
      params: params
      id: id

    new Promise (resolve, reject) ->
      clear = ->
        delete pendingResponses[id]

      pendingResponses[id] =
        resolve: (result) ->
          clear()
          resolve(result)
        reject: (error) ->
          clear()
          reject(error)

  return self

Postmaster.dominant = ->
  opener or ((parent != window) and parent) or undefined

return Postmaster
