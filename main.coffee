###

Postmaster wraps the `postMessage` API with promises.

###

defaultReceiver = self
ackTimeout = 1000

module.exports = Postmaster = (self={}) ->
  send = (data) ->
    target = self.remoteTarget()

    if !target
      throw new Error "No remote target"
    else if !Worker? or target instanceof Worker
      target.postMessage data
    else
      target.postMessage data, "*"

    return

  dominant = Postmaster.dominant()
  self.remoteTarget ?= -> dominant
  self.receiver ?= -> defaultReceiver
  self.ackTimeout ?= -> ackTimeout
  self.delegate ?= self

  self.receiver().addEventListener "message", (event) ->
    # Only listening to messages from `opener`
    if event.source is self.remoteTarget() or !event.source
      data = event.data
      {type, method, params, id} = data

      switch type
        when "ack"
          pendingResponses[id]?.ack = true
        when "response"
          pendingResponses[id].resolve data.result
        when "error"
          pendingResponses[id].reject data.error
        when "message"
          Promise.resolve()
          .then ->
            send
              type: "ack"
              id: id
          .then ->
            if typeof self.delegate[method] is "function"
              self.delegate[method](params...)
            else
              throw new Error "`#{method}` is not a function"
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

  pendingResponses = {}
  remoteId = 0

  clear = (id) ->
    clearTimeout pendingResponses[id].timeout
    delete pendingResponses[id]

  self.invokeRemote = (method, params...) ->
    new Promise (resolve, reject) ->
      id = remoteId++

      try
        send
          type: "message"
          method: method
          params: params
          id: id
      catch e
        reject(e)
        return

      ackWait = self.ackTimeout()
      timeout = setTimeout ->
        pendingResponse = pendingResponses[id]
        if pendingResponse and !pendingResponse.ack
          clear(id)
          reject new Error "No ack received within #{ackWait}"
      , ackWait

      pendingResponses[id] =
        timeout: timeout
        resolve: (result) ->
          clear(id)
          resolve(result)
        reject: (error) ->
          clear(id)
          reject(error)

  return self

Postmaster.dominant = ->
  if window? # iframe or child window context
    opener or ((parent != window) and parent) or undefined
  else # Web Worker Context
    self

return Postmaster
