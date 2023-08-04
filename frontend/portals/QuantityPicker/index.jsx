import React from 'react';
import PropType from 'prop-types';
import { withPageProductId } from '@shopgate-ps/pwa-extension-kit/connectors';
import AddToCartBar from '../../components/AddToCartBar';

/**
 * PDPAddToCartBar component
 * @param {Node} children Children of portal.
 * @return {Node}
 */
const QuantityPicker = ({ children, ...rest }) => {
  return (
    <AddToCartBar {...rest} />
  );
};

QuantityPicker.propTypes = {
  children: PropType.node,
};

QuantityPicker.defaultProps = {
  children: null,
};

export default withPageProductId(QuantityPicker);
