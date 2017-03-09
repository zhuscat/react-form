import React, { Component, PropTypes } from 'react';

const propTypes = {
  value: PropTypes.string,
  onChange: PropTypes.func,
};

export default class Input extends Component {
  constructor(props) {
    super(props);
    this.handleChange = this.handleChange.bind(this);
  }

  componentWillReceiveProps(nextProps) {
    console.log(nextProps);
  }

  handleChange(event) {
    if (this.props.onChange) {
      this.props.onChange(event.target.value);
    }
  }

  render() {
    return <input type="text" value={this.props.value} onChange={this.handleChange} />
  }
}

Input.propTypes = propTypes;