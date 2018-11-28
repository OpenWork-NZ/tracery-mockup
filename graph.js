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
      nodes[link.subject] = {name: link.subject, links: [], depth: 0}
    )
    link.source.links.push(link)
    link.target = nodes[link.object] || (
      nodes[link.object] = {name: link.object, links: [], depth: 0}
    )
    link.depth = 0
    link.target.links.push(link)
  })

  var size = [960, 500]
  var force = d3.layout.force()
      .nodes(d3.values(nodes))
      .links(links)
      .size(size)
      .linkDistance(60)
      .charge(function(d) {return d.depth > 0 ? -300: -50})
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

  var MAX_DEPTH = 3
  var focused = d3.values(nodes)[0],
    toExpand = [focused]
  focused.depth = MAX_DEPTH
  function tick() {
    focused.x = size[0]/2; focused.y = size[1]/2

    path.attr("d", function(d) {
      var dx = d.target.x - d.source.y,
          dy = d.target.y - d.source.y,
          dr = Math.sqrt(dx*dx + dy*dy)
      return "M" + d.source.x + "," + d.source.y +
          "A" + dr + "," + dr + " 0 0,1 " +
          d.target.x + "," + d.target.y
    })
        .style('opacity', function(d) {return d.depth/MAX_DEPTH})
    node.attr("transform", function(d) {
      return "translate(" + d.x + "," + d.y + ")"
    })
        .style('opacity', function(d) {return d.depth/MAX_DEPTH})

    d3.values(nodes).forEach(function(node) {
      if (node.depth <= 0) return // I don't care about you.
      if (node.x < 0) node.x = 10
      if (node.x > size[0]) node.x = size[0] - 10
      if (node.y < 0) node.y = 10
      if (node.y > size[1]) node.y = size[1] - 10
    })
    if (toExpand.length > 0) {
      item = toExpand.shift()
      if (item.depth > 1) item.links.forEach(function(link) {
        link.depth = item.depth
        child = link.source == item ? link.target : link.source
        if (child.depth >= item.depth) return
        child.depth = item.depth - 1
        if (toExpand.indexOf(child) < 0) toExpand.push(child)
      })
    }
  }
})
