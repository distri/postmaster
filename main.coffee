###

Postmaster wraps the `postMessage` API with promises.

###

defaultReceiver = self
ackTimeout = 1000

module.exports = Postmaster = (self={}) ->
  send = (data) ->
    target = self.remoteTarget()
    if self.token
      data.token = self.token

    if !target
      throw new Error "No remote target"

    self.log(defaultReceiver.name, "->", target.name, data)

    if !Worker? or target instanceof Worker
      target.postMessage data
    else
      target.postMessage data, "*"

    return

  dominant = Postmaster.dominant()
  self.remoteTarget ?= -> dominant
  self.receiver ?= -> defaultReceiver
  self.ackTimeout ?= -> ackTimeout
  self.delegate ?= self
  self.log ?= ->
  self.token ?= Math.random()

  listener = (event) ->
    {data, source} = event
    target = self.remoteTarget()

    self.log defaultReceiver.name, "<-", source?.name, data

    # Only listening to messages from `opener`
    # event.source becomes undefined during the `onunload` event
    # We can track a token and match to allow the final message in this case
    if source is target or (source is undefined and data.token is self.token)
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
            if source
              send
                type: "ack"
                id: id

            if typeof self.delegate[method] is "function"
              self.delegate[method](params...)
            else
              throw new Error "`#{method}` is not a function"
          .then (result) ->
            if source
              send
                type: "response"
                id: id
                result: result
          .catch (error) ->
            if typeof error is "string"
              message = error
            else
              message = error.message

            if source
              send
                type: "error"
                id: id
                error:
                  message: message
                  stack: error.stack
    else
      self.log "DROP message. source", source?.name, "does not match target", target?.name

  self.receiver().addEventListener "message", listener

  self.dispose = ->
    self.receiver().removeEventListener "message", listener
    self.log "DISPOSE", defaultReceiver.name

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
          pendingResponse.reject new Error "No ack received within #{ackWait}"
      , ackWait

      pendingResponses[id] =
        timeout: timeout
        resolve: (result) ->
          clear(id)
          resolve(result)
        reject: (error) ->
          clear(id)
          reject(error)

  self.log "INITIALIZE", defaultReceiver.name

  return self

Postmaster.dominant = ->
  if window? # iframe or child window context
    opener or ((parent != window) and parent) or undefined
  else # Web Worker Context
    self
