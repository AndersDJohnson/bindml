fs = require "promised-io/fs"
bindml = require "../bindml"
http = require "http"
promise = require "promised-io/promise"

data =
	title: "THIS IS TITLE!"
	body:
		page: 'main'
		classy: true
		content: "CONTEENT <strong>bold?</strong>"
		nitems: [
			1, 2, 3
		]
		items: [
			{name: "NAME 1", children: [5,[9,76],7]},
			{name: "NAME 2", children: [8,9,'hi']}
		]


makeHtml = ( done ) ->
	all = promise.allKeys({
		#partial: fs.readFile("tpl/partial.html")
		nested: fs.readFile(__dirname + "/tpl/nested.html")
		test: fs.readFile(__dirname + "/tpl/test.html")
	})
	all.then ((args) ->
		bindml.register "nested", args['nested'].toString("utf8")
		#bindml.register "partial", args['partial'].toString("utf8")
		bindml.register "test", args['test'].toString("utf8")
		rendered = bindml.render "test", data
		done(rendered)
	), (err) ->
		throw err

httpListener = (req, res) ->
	
	switch req.url
		when '/favicon.ico'
			res.end()
			return
	
	console.log "==========================="
	
	makeHtml( res.end )

###
server = http.createServer httpListener

port = 3001
server.listen port, () ->
	console.log "server listening on http://localhost:#{port}"
###

makeHtml( console.log )

