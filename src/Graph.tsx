import React, { Component } from 'react';
import { Table } from '@finos/perspective';
import { ServerRespond } from './DataStreamer';
import './Graph.css';

/**
 * Props declaration for <Graph />
 */
interface IProps {
  data: ServerRespond[],
}

/**
 * Perspective library adds load to HTMLElement prototype.
 * This interface acts as a wrapper for Typescript compiler.
 */
interface PerspectiveViewerElement extends HTMLElement {
  load: (table: Table) => void,
}

/**
 * React component that renders Perspective based on data
 * parsed from its parent through data property.
 */
class Graph extends Component<IProps, {}> {
  // Perspective table
  table: Table | undefined;

  render() {
    return React.createElement('perspective-viewer');
  }

  componentDidMount() {
    const elem = document.getElementsByTagName('perspective-viewer')[0] as unknown as PerspectiveViewerElement;

    const schema = {
      stock: 'string',
      top_ask_price: 'float',
      top_bid_price: 'float',
      timestamp: 'date',
    };

    if (typeof window.perspective !== 'undefined' && window.perspective.worker()) {
      this.table = window.perspective.worker().table(schema);
    }

    if (this.table) {
      elem.load(this.table);
      elem.setAttribute('view', 'y_line');
      elem.setAttribute('column-pivots', '["stock"]');
      elem.setAttribute('row-pivots', '["timestamp"]');
      elem.setAttribute('columns', '["top_ask_price"]');
      elem.setAttribute('aggregates', JSON.stringify({
        stock: "distinct count",
        top_ask_price: "avg",
        top_bid_price: "avg",
        timestamp: "distinct count"
      }));
    } else {
      console.error("Perspective not available");
    }
  }

  componentDidUpdate(prevProps: IProps) {
    if (this.table) {
      const existingTimestamps = new Set(this.props.data.map(el => el.timestamp));
      const newData = this.props.data.filter((el: any) => !existingTimestamps.has(el.timestamp));
      
      console.log("Existing Timestamps: ", existingTimestamps);
      console.log("New Data: ", newData);
      if (newData.length > 0) {
        this.table.update(newData.map((el: any) => ({
          stock: el.stock,
          top_ask_price: el.top_ask?.price || 0,
          top_bid_price: el.top_bid?.price || 0,
          timestamp: el.timestamp,
        })));
      }
    }
  }
}

export default Graph;
