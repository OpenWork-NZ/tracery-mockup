var nodes = [{}, {}, {}, {}, {}, {}]
var width = window.innerWidth,
    height = window.innerHeight

var svg = d3.select("body").append("svg")
    .attr("width", width).attr("height", height)

var simulation = d3.forceSimulation()
    .force('charge', d3.forceManyBody().strength(-20))
    .force('center', d3.forceCenter(width/2, height/2))

var $node = svg.append('g')
    .selectAll('circle')
    .data(nodes)
  .enter().append('circle')
    .attr('r', 10)
    .attr('stroke', 'red')

simulation.nodes(nodes).on("tick", function() {
  $node = $node.attr('cx', function (node) {return node.x})
      .attr('cy', function(node) {return node.y})
})
