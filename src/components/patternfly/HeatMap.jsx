import React, { PropTypes } from 'react'
const { string, number, object, shape, arrayOf } = PropTypes
import $ from 'jquery'
import d3 from 'd3'

// Angular reference:
//  https://github.com/patternfly/angular-patternfly/blob/master/src/charts/heatmap/heatmap.directive.js
//  https://github.com/patternfly/angular-patternfly/blob/master/src/charts/heatmap/heatmap.html

// TODO(vs) sync with latest Angular impl.

class HeatMap extends React.Component {

  componentDidMount () {
    this._generateHeatMap(this.props)
  }

  componentWillReceiveProps (newProps) {
    this._updateHeatMap(newProps)
  }

  render () {
    return (
      <div className='heatmap-container' style={this.props.containerStyle} ref={(e) => { this._heatMapContainer = e }}>
        <svg className='pf-heatmap-svg' />
      </div>
    )
  }

  _generateHeatMap ({ data, thresholds, maxBlockSize, blockPadding }) {
    const containerWidth = this._heatMapContainer.clientWidth
    const containerHeight = this._heatMapContainer.clientHeight

    const blockSize = this._determineBlockSize({
      containerWidth,
      containerHeight,
      numberOfBlocks: data.length,
      maxBlockSize
    })

    const numberOfRows = (blockSize === 0) ? 0 : Math.floor(containerHeight / blockSize)
    const color = d3.scale.threshold().domain(thresholds.domain).range(thresholds.colors)

    function highlightBlock (block, active) {
      block.style('fill-opacity', active ? 1 : 0.4)
    }

    const svg = d3.select(this._heatMapContainer).select('svg.pf-heatmap-svg')
    svg.selectAll('*').remove()

    // generate heat map blocks
    const blocks = svg.selectAll('rect').data(data).enter().append('rect')
    blocks
      .attr('x', (d, i) => (Math.floor(i / numberOfRows) * blockSize) + blockPadding)
      .attr('y', (d, i) => (i % numberOfRows * blockSize) + blockPadding)
      .attr('width', blockSize - (2 * blockPadding))
      .attr('height', blockSize - (2 * blockPadding))
      .style('fill', (d) => color(d.value))
      .attr('data-index', (d, i) => i)
      .attr('data-role', 'heat-map-block')

    // attach event listeners
    blocks.on('mouseover', function () {
      blocks.call(highlightBlock, false)
      d3.select(this).call(highlightBlock, true)
    })
    svg.on('mouseleave', () => { blocks.call(highlightBlock, true) })

    // tooltips are done via jQuery
    $('rect[data-role=heat-map-block]', this._heatMapContainer).tooltip({
      animation: false,
      container: 'body',
      title () {
        return data[$(this).attr('data-index')].name
      }
    })
  }

  _updateHeatMap (props) {
    this._generateHeatMap(props)
  }

  _determineBlockSize ({ containerWidth, containerHeight, numberOfBlocks, maxBlockSize }) {
    const x = containerWidth
    const y = containerHeight
    const n = numberOfBlocks
    const px = Math.ceil(Math.sqrt(n * x / y))
    const py = Math.ceil(Math.sqrt(n * y / x))

    let sx
    if (Math.floor(px * y / x) * px < n) {
      sx = y / Math.ceil(px * y / x)
    } else {
      sx = x / px
    }

    let sy
    if (Math.floor(py * x / y) * py < n) {
      sy = x / Math.ceil(x * py / y)
    } else {
      sy = y / py
    }

    sx = Math.min(sx, maxBlockSize)
    sy = Math.min(sy, maxBlockSize)

    return Math.max(sx, sy)
  }

}

HeatMap.propTypes = {
  data: arrayOf(shape({
    value: number, // from range <0, 1>
    name: string
  })).isRequired,
  thresholds: shape({
    domain: arrayOf(number), // threshold scale domain
    colors: arrayOf(string)  // threshold scale color range
  }),
  maxBlockSize: number,
  blockPadding: number,
  containerStyle: object
}

HeatMap.defaultProps = {
  thresholds: {
    domain: [0.7, 0.8, 0.9],
    colors: ['#D4F0FA', '#F9D67A', '#EC7A08', '#CE0000']
  },
  maxBlockSize: 50,
  blockPadding: 1,
  containerStyle: {
    height: 100
  }
}

export default HeatMap
