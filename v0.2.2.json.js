window["distri/postmaster:v0.2.2"]({
  "source": {
    "LICENSE": {
      "path": "LICENSE",
      "mode": "100644",
      "content": "The MIT License (MIT)\n\nCopyright (c) 2013 distri\n\nPermission is hereby granted, free of charge, to any person obtaining a copy of\nthis software and associated documentation files (the \"Software\"), to deal in\nthe Software without restriction, including without limitation the rights to\nuse, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of\nthe Software, and to permit persons to whom the Software is furnished to do so,\nsubject to the following conditions:\n\nThe above copyright notice and this permission notice shall be included in all\ncopies or substantial portions of the Software.\n\nTHE SOFTWARE IS PROVIDED \"AS IS\", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR\nIMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS\nFOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR\nCOPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER\nIN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN\nCONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.\n",
      "type": "blob"
    },
    "README.md": {
      "path": "README.md",
      "mode": "100644",
      "content": "postmaster\n==========\n\nSend and receive postMessage commands.\n",
      "type": "blob"
    },
    "main.coffee.md": {
      "path": "main.coffee.md",
      "mode": "100644",
      "content": "Postmaster\n==========\n\nPostmaster allows a child window that was opened from a parent window to\nreceive method calls from the parent window through the postMessage events.\n\nFigure out who we should be listening to.\n\n    dominant = opener or ((parent != window) and parent) or undefined\n\nBind postMessage events to methods.\n\n    module.exports = (I={}, self={}) ->\n      # Only listening to messages from `opener`\n      addEventListener \"message\", (event) ->\n        if event.source is dominant\n          {method, params, id} = event.data\n\n          try\n            result = self[method](params...)\n\n            send\n              success:\n                id: id\n                result: result\n          catch error\n            send\n              error:\n                id: id\n                message: error.message\n                stack: error.stack\n\n      addEventListener \"unload\", ->\n        send\n          status: \"unload\"\n\n      # Tell our opener that we're ready\n      send\n        status: \"ready\"\n\n      self.sendToParent = send\n\n      return self\n\n    send = (data) ->\n      dominant?.postMessage data, \"*\"\n",
      "type": "blob"
    },
    "pixie.cson": {
      "path": "pixie.cson",
      "mode": "100644",
      "content": "version: \"0.2.2\"\n",
      "type": "blob"
    },
    "test/postmaster.coffee": {
      "path": "test/postmaster.coffee",
      "mode": "100644",
      "content": "Postmaster = require \"../main\"\n\ndescribe \"Postmaster\", ->\n  it \"should allow sending messages to parent\", ->\n    postmaster = Postmaster()\n\n    postmaster.sendToParent\n      radical: \"true\"\n",
      "type": "blob"
    }
  },
  "distribution": {
    "main": {
      "path": "main",
      "content": "(function() {\n  var dominant, send;\n\n  dominant = opener || ((parent !== window) && parent) || void 0;\n\n  module.exports = function(I, self) {\n    if (I == null) {\n      I = {};\n    }\n    if (self == null) {\n      self = {};\n    }\n    addEventListener(\"message\", function(event) {\n      var error, id, method, params, result, _ref;\n      if (event.source === dominant) {\n        _ref = event.data, method = _ref.method, params = _ref.params, id = _ref.id;\n        try {\n          result = self[method].apply(self, params);\n          return send({\n            success: {\n              id: id,\n              result: result\n            }\n          });\n        } catch (_error) {\n          error = _error;\n          return send({\n            error: {\n              id: id,\n              message: error.message,\n              stack: error.stack\n            }\n          });\n        }\n      }\n    });\n    addEventListener(\"unload\", function() {\n      return send({\n        status: \"unload\"\n      });\n    });\n    send({\n      status: \"ready\"\n    });\n    self.sendToParent = send;\n    return self;\n  };\n\n  send = function(data) {\n    return dominant != null ? dominant.postMessage(data, \"*\") : void 0;\n  };\n\n}).call(this);\n",
      "type": "blob"
    },
    "pixie": {
      "path": "pixie",
      "content": "module.exports = {\"version\":\"0.2.2\"};",
      "type": "blob"
    },
    "test/postmaster": {
      "path": "test/postmaster",
      "content": "(function() {\n  var Postmaster;\n\n  Postmaster = require(\"../main\");\n\n  describe(\"Postmaster\", function() {\n    return it(\"should allow sending messages to parent\", function() {\n      var postmaster;\n      postmaster = Postmaster();\n      return postmaster.sendToParent({\n        radical: \"true\"\n      });\n    });\n  });\n\n}).call(this);\n",
      "type": "blob"
    }
  },
  "progenitor": {
    "url": "http://strd6.github.io/editor/"
  },
  "version": "0.2.2",
  "entryPoint": "main",
  "repository": {
    "id": 15326478,
    "name": "postmaster",
    "full_name": "distri/postmaster",
    "owner": {
      "login": "distri",
      "id": 6005125,
      "avatar_url": "https://avatars.githubusercontent.com/u/6005125?",
      "gravatar_id": "192f3f168409e79c42107f081139d9f3",
      "url": "https://api.github.com/users/distri",
      "html_url": "https://github.com/distri",
      "followers_url": "https://api.github.com/users/distri/followers",
      "following_url": "https://api.github.com/users/distri/following{/other_user}",
      "gists_url": "https://api.github.com/users/distri/gists{/gist_id}",
      "starred_url": "https://api.github.com/users/distri/starred{/owner}{/repo}",
      "subscriptions_url": "https://api.github.com/users/distri/subscriptions",
      "organizations_url": "https://api.github.com/users/distri/orgs",
      "repos_url": "https://api.github.com/users/distri/repos",
      "events_url": "https://api.github.com/users/distri/events{/privacy}",
      "received_events_url": "https://api.github.com/users/distri/received_events",
      "type": "Organization",
      "site_admin": false
    },
    "private": false,
    "html_url": "https://github.com/distri/postmaster",
    "description": "Send and receive postMessage commands.",
    "fork": false,
    "url": "https://api.github.com/repos/distri/postmaster",
    "forks_url": "https://api.github.com/repos/distri/postmaster/forks",
    "keys_url": "https://api.github.com/repos/distri/postmaster/keys{/key_id}",
    "collaborators_url": "https://api.github.com/repos/distri/postmaster/collaborators{/collaborator}",
    "teams_url": "https://api.github.com/repos/distri/postmaster/teams",
    "hooks_url": "https://api.github.com/repos/distri/postmaster/hooks",
    "issue_events_url": "https://api.github.com/repos/distri/postmaster/issues/events{/number}",
    "events_url": "https://api.github.com/repos/distri/postmaster/events",
    "assignees_url": "https://api.github.com/repos/distri/postmaster/assignees{/user}",
    "branches_url": "https://api.github.com/repos/distri/postmaster/branches{/branch}",
    "tags_url": "https://api.github.com/repos/distri/postmaster/tags",
    "blobs_url": "https://api.github.com/repos/distri/postmaster/git/blobs{/sha}",
    "git_tags_url": "https://api.github.com/repos/distri/postmaster/git/tags{/sha}",
    "git_refs_url": "https://api.github.com/repos/distri/postmaster/git/refs{/sha}",
    "trees_url": "https://api.github.com/repos/distri/postmaster/git/trees{/sha}",
    "statuses_url": "https://api.github.com/repos/distri/postmaster/statuses/{sha}",
    "languages_url": "https://api.github.com/repos/distri/postmaster/languages",
    "stargazers_url": "https://api.github.com/repos/distri/postmaster/stargazers",
    "contributors_url": "https://api.github.com/repos/distri/postmaster/contributors",
    "subscribers_url": "https://api.github.com/repos/distri/postmaster/subscribers",
    "subscription_url": "https://api.github.com/repos/distri/postmaster/subscription",
    "commits_url": "https://api.github.com/repos/distri/postmaster/commits{/sha}",
    "git_commits_url": "https://api.github.com/repos/distri/postmaster/git/commits{/sha}",
    "comments_url": "https://api.github.com/repos/distri/postmaster/comments{/number}",
    "issue_comment_url": "https://api.github.com/repos/distri/postmaster/issues/comments/{number}",
    "contents_url": "https://api.github.com/repos/distri/postmaster/contents/{+path}",
    "compare_url": "https://api.github.com/repos/distri/postmaster/compare/{base}...{head}",
    "merges_url": "https://api.github.com/repos/distri/postmaster/merges",
    "archive_url": "https://api.github.com/repos/distri/postmaster/{archive_format}{/ref}",
    "downloads_url": "https://api.github.com/repos/distri/postmaster/downloads",
    "issues_url": "https://api.github.com/repos/distri/postmaster/issues{/number}",
    "pulls_url": "https://api.github.com/repos/distri/postmaster/pulls{/number}",
    "milestones_url": "https://api.github.com/repos/distri/postmaster/milestones{/number}",
    "notifications_url": "https://api.github.com/repos/distri/postmaster/notifications{?since,all,participating}",
    "labels_url": "https://api.github.com/repos/distri/postmaster/labels{/name}",
    "releases_url": "https://api.github.com/repos/distri/postmaster/releases{/id}",
    "created_at": "2013-12-20T00:42:15Z",
    "updated_at": "2014-03-06T19:53:51Z",
    "pushed_at": "2014-03-06T19:53:51Z",
    "git_url": "git://github.com/distri/postmaster.git",
    "ssh_url": "git@github.com:distri/postmaster.git",
    "clone_url": "https://github.com/distri/postmaster.git",
    "svn_url": "https://github.com/distri/postmaster",
    "homepage": null,
    "size": 172,
    "stargazers_count": 0,
    "watchers_count": 0,
    "language": "CoffeeScript",
    "has_issues": true,
    "has_downloads": true,
    "has_wiki": true,
    "forks_count": 0,
    "mirror_url": null,
    "open_issues_count": 0,
    "forks": 0,
    "open_issues": 0,
    "watchers": 0,
    "default_branch": "master",
    "master_branch": "master",
    "permissions": {
      "admin": true,
      "push": true,
      "pull": true
    },
    "organization": {
      "login": "distri",
      "id": 6005125,
      "avatar_url": "https://avatars.githubusercontent.com/u/6005125?",
      "gravatar_id": "192f3f168409e79c42107f081139d9f3",
      "url": "https://api.github.com/users/distri",
      "html_url": "https://github.com/distri",
      "followers_url": "https://api.github.com/users/distri/followers",
      "following_url": "https://api.github.com/users/distri/following{/other_user}",
      "gists_url": "https://api.github.com/users/distri/gists{/gist_id}",
      "starred_url": "https://api.github.com/users/distri/starred{/owner}{/repo}",
      "subscriptions_url": "https://api.github.com/users/distri/subscriptions",
      "organizations_url": "https://api.github.com/users/distri/orgs",
      "repos_url": "https://api.github.com/users/distri/repos",
      "events_url": "https://api.github.com/users/distri/events{/privacy}",
      "received_events_url": "https://api.github.com/users/distri/received_events",
      "type": "Organization",
      "site_admin": false
    },
    "network_count": 0,
    "subscribers_count": 2,
    "branch": "v0.2.2",
    "publishBranch": "gh-pages"
  },
  "dependencies": {}
});