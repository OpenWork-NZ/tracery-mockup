d3.xml("tracery.xml", function(err, links) {
  if (err) alert(err)

  var results = links.querySelectorAll("result")
  results = [].slice.call(results)
  results = results.map(function(triplet) {
    function getVar(name) {
      var r = triplet.querySelector("[name=" + name + "] uri")
      if (!r || r.childNodes.length == 0) return undefined
      return r.childNodes[0].nodeValue
    }
    return {
      subject: getVar("subject"),
      predicate: getVar("predicate"),
      object: getVar("object")
    }
  })

  var nodes = {},
    links = results.filter(function(link) {
      return link.subject && link.predicate && link.object
    })
  links.forEach(function(link) {
    link.source = nodes[link.subject] || (
      nodes[link.subject] = {name: link.subject, links: []}
    )
    link.source.links.push(link)
    link.target = nodes[link.object] || (
      nodes[link.object] = {name: link.object, links: []}
    )
    link.target.links.push(link)
  })

  function labelNodeDepth(center, hops) {
    center.depth = 0
    var fringe = [center]
    while (fringe.length > 0) {
      item = fringe.pop()
      item.links.forEach(function(link) {
        var childNode = link.source != item ? link.source : link.target
        if (childNode.depth == undefined || childNode.depth > item.depth)
          childNode.depth = item.depth + 1
        if (childNode.depth > hops) return

        fringe.push(childNode)
      })
    }
  }
  function queryVisible(center, hops) {
    d3.values(nodes).forEach(function(node) {nodes.depth = undefined})
    labelNodeDepth(center, hops)

    var nodes = [], links = []
    d3.values(nodes).forEach(function(node) {
      if (item.depth == undefined) return;
      nodes.push(node)
      node.links.forEach(function(link) {
        if (link.source != item) return
        links.push(link)
      })
    })
    return {nodes: nodes, links: links}
  }

  var size = [960, 500]
  var force = d3.layout.force()
      .nodes(d3.values(nodes))
      .links(links)
      .size(size)
      .linkDistance(60)
      .charge(-300)
      .on("tick", tick)
      .start()

  var svg = d3.select("body").append("svg")
      .attr("width", size[0])
      .attr("height", size[1])
  svg.append("svg:defs").selectAll("marker")
      .data(["end"])
    .enter().append("svg:marker")
      .attr("id", String)
      .attr("viewbox", "0 -5 10 10")
      .attr("refx", 15).attr("refy", -1.5)
      .attr("markerwidth", 6).attr("markerheight", 6)
      .attr("orient", "auto")
    .append("svg:path")
      .attr("d", "M0,-5L10,0L0,5")

  var paths = svg.append("svg:g"), path, node
  function updateVisible(center) {
    var visible = {links: links, nodes: d3.values(nodes)} //queryVisible(center, 3)
    force.links(visible.links)
        .nodes(visible.nodes)

    path = paths.selectAll("path")
        .data(force.links())
      .enter().append("svg:path")
        .attr("class", "link")
        .attr("marker-end", "url(#end)")
    node = svg.selectAll(".node")
        .data(force.nodes())
      .enter().append("g")
        .attr("class", "node")
        .call(force.drag)
    node.append("circle").attr("r", 5)
    node.append("text")
        .attr("x", 12).attr("dy", ".35em")
        .text(function(d) {return d.name})
  }
  updateVisible(d3.values(nodes)[0])

  function tick() {
    path.attr("d", function(d) {
      var dx = d.target.x - d.source.y,
          dy = d.target.y - d.source.y,
          dr = Math.sqrt(dx*dx + dy*dy)
      return "M" + d.source.x + "," + d.source.y +
          "A" + dr + "," + dr + " 0 0,1 " +
          d.target.x + "," + d.target.y
    })
    node.attr("transform", function(d) {
      return "translate(" + d.x + "," + d.y + ")"
    })
  }
})
