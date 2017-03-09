import React, { Component, PropTypes } from 'react';

const propTypes = {
  value: PropTypes.string,
};

export default class Input extends Component {
  constructor(props) {
    super(props);
  }

  componentWillReceiveProps(nextProps) {
    console.log(nextProps);
  }

  render() {
    return <input type="text" value={this.props.value} {...this.props} />
  }
}

Input.propTypes = propTypes;