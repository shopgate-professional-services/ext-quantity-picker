import React, {
  useCallback,
  useState,
  useRef,
  useEffect,
} from 'react';
import PropTypes from 'prop-types';
import { css } from 'glamor';
import { Input, RippleButton } from '@shopgate/engage/components';
import { Section } from '@shopgate/engage/a11y';
import { useCurrentProduct } from '@shopgate/engage/core';
import { themeConfig } from '@shopgate/pwa-common/helpers/config';
import AddToCartButton from './components/AddToCartButton';
import connect from './connector';

const { colors, shadows } = themeConfig;

const styles = {
  container: css({
    background: colors.light,
    boxShadow: shadows.cart.paymentBar,
    position: 'relative',
    zIndex: 2,
    overflow: 'hidden',
    padding: '8px',
    display: 'flex',
    paddingBottom: 'calc(8px + var(--safe-area-inset-bottom))',
  }),
  innerContainer: css({
    minHeight: 46,
    display: 'flex',
    flex: 1,
  }),
  inputContainer: css({
    border: '1px solid #DCDCDC',
    borderRadius: 5,
    borderLeft: 0,
    borderRight: 0,
    borderTopRightRadius: 0,
    borderTopLeftRadius: 0,
    borderBottomRightRadius: 0,
    borderBottomLeftRadius: 0,
    padding: '0px 20px 0px 20px',
    display: 'flex',
    minWidth: 48,
  }),
  input: css({
    outline: 'none',
    textAlign: 'center',
    fontWeight: 700,
    width: '2em',
    padding: 0,
    '::-webkit-outer-spin-button': {
      appearance: 'none',
      margin: 0,
    },
    '::-webkit-inner-spin-button': {
      appearance: 'none',
      margin: 0,
    },
  }).toString(),
  button: css({
    fontSize: 16,
    fontWeight: 700,
    padding: '11px 9.6px 13px',
    flex: 1,
    marginLeft: 4,
  }).toString(),
  cartInputButtonPlus: css({
    background: '#fff !important',
    color: '#000 !important',
    border: '1px solid #DCDCDC',
    borderRadius: 5,
    borderTopLeftRadius: '0px !important',
    borderBottomLeftRadius: '0px !important',
    fontSize: '1.25rem',
    fontWeight: 500,
    padding: '0px !important',
    minWidth: '14% !important',
  }).toString(),
  cartInputButtonMinus: css({
    background: '#fff !important',
    color: '#000 !important',
    border: '1px solid #DCDCDC',
    borderRadius: 5,
    borderTopRightRadius: '0px !important',
    borderBottomRightRadius: '0px !important',
    fontSize: '1.25rem',
    fontWeight: 500,
    padding: '0px !important',
    minWidth: '14% !important',
  }).toString(),
};

/**
 * Clamp a committed value into the orderable range. `handleSanitizeInput` only
 * caps the top, since typing "12" has to pass through "1".
 * @param {number} value The value to clamp.
 * @param {number} min Minimum order quantity.
 * @param {number} max Maximum order quantity.
 * @returns {number}
 */
const clampQuantity = (value, min, max) => Math.min(Math.max(value, min), max);

/**
 * AddToCartBar component
 * @param {Object} props Component props
 * @returns {JSX}
 */
const AddToCartBar = ({
  handleAddToCart, resetClicked, loading, disabled, conditioner, stockInfo,
}) => {
  const minQuantity = stockInfo?.minOrderQuantity > 0 ? stockInfo.minOrderQuantity : 1;
  const maxQuantity = stockInfo?.maxOrderQuantity > 0
    ? Math.min(stockInfo.maxOrderQuantity, 99)
    : 99;

  const initialQuantity = minQuantity > 1 ? minQuantity : 1;

  const { quantity: contextQuantity, setQuantity: setContextQuantity } = useCurrentProduct();
  const [inputQuantity, setInputQuantity] = useState(initialQuantity);
  const [blurredInputQuantity, setBlurredInputQuantity] = useState(initialQuantity);
  const buttonRef = useRef(null);

  useEffect(() => {
    setInputQuantity(initialQuantity);
    setBlurredInputQuantity(initialQuantity);
  }, [initialQuantity]);

  // The add-to-cart bar builds its payload from `context.quantity`, so the
  // displayed value has to get in there and stay there - the theme resets it to
  // 1 on any props change. Depending on `contextQuantity` re-asserts it; the
  // equality guard stops the effect looping on its own write.
  useEffect(() => {
    const numericValue = parseInt(inputQuantity, 10);

    // Empty while the input is focused - don't push NaN into the context.
    if (Number.isNaN(numericValue)) return;

    const quantity = clampQuantity(numericValue, minQuantity, maxQuantity);
    if (quantity === contextQuantity) return;

    setContextQuantity(quantity);
  }, [inputQuantity, contextQuantity, minQuantity, maxQuantity, setContextQuantity]);

  const handleButtonClick = useCallback(() => new Promise((resolve) => {
    conditioner.check().then((fulfilled) => {
      // Resolve early to enable button animation while the request runs
      resolve(fulfilled);

      const numericValue = parseInt(inputQuantity, 10);
      // Clicking straight out of a focused (emptied) input never went through
      // the blur clamp, so fall back to the last committed value.
      const quantity = Number.isNaN(numericValue)
        ? blurredInputQuantity
        : clampQuantity(numericValue, minQuantity, maxQuantity);

      // Trigger addToCart from `setQuantity`'s completion callback, so the
      // context is guaranteed committed before the bar reads it.
      setContextQuantity(quantity, handleAddToCart);
    });
  }), [
    blurredInputQuantity,
    conditioner,
    handleAddToCart,
    inputQuantity,
    maxQuantity,
    minQuantity,
    setContextQuantity,
  ]);

  const handleSanitizeInput = useCallback((value) => {
    const valid = /^\d{0,2}$/.test(value);

    if (!valid) return inputQuantity;

    if (value === '') return value;

    const numericValue = parseInt(value, 10);
    if (numericValue > maxQuantity) return maxQuantity;

    return value;
  }, [inputQuantity, maxQuantity]);

  const handleFocusChange = useCallback((focused) => {
    if (!focused) {
      const numericValue = parseInt(inputQuantity, 10);

      if (Number.isNaN(numericValue)) {
        setInputQuantity(blurredInputQuantity);
        return;
      }

      const clamped = clampQuantity(numericValue, minQuantity, maxQuantity);
      setInputQuantity(clamped);
      setBlurredInputQuantity(clamped);
    }

    if (focused) {
      setInputQuantity('');
    }
  }, [blurredInputQuantity, inputQuantity, minQuantity, maxQuantity]);

  const handleIncreaseButton = useCallback(() => {
    if (parseInt(inputQuantity, 10) < maxQuantity) {
      setInputQuantity(prev => parseInt(prev, 10) + 1);
    }
  }, [inputQuantity, maxQuantity]);

  const handleDecreaseButton = useCallback(() => {
    if (parseInt(inputQuantity, 10) > minQuantity) {
      setInputQuantity(prev => parseInt(prev, 10) - 1);
    }
  }, [inputQuantity, minQuantity]);

  return (
    <Section title="product.sections.purchase" className="theme__product__add-to-cart-bar">
      <div className={styles.container}>
        <div className={styles.innerContainer}>
          <RippleButton
            className={`${styles.cartInputButtonMinus} quantity-picker__minus`}
            type="secondary"
            onClick={handleDecreaseButton}
          >
            -
          </RippleButton>
          <div className={`${styles.inputContainer} quantity-picker__container`}>
            <Input
              className={`${styles.input} quantity-picker__input`}
              value={inputQuantity.toString()}
              attributes={{
                maxLength: 2,
                size: 2,
                pattern: '[0-9]*',
                type: 'number',
              }}
              validateOnBlur={false}
              onSanitize={handleSanitizeInput}
              onChange={(value) => {
                setInputQuantity(value);
              }}
              onFocusChange={handleFocusChange}
              disabled={disabled}
            />
          </div>
          <RippleButton
            className={`${styles.cartInputButtonPlus} quantity-picker__plus`}
            type="secondary"
            onClick={handleIncreaseButton}
          >
            +
          </RippleButton>
          <AddToCartButton
            onClick={handleButtonClick}
            resetClicked={resetClicked}
            isLoading={loading}
            isDisabled={disabled}
            className={styles.button}
            forwardedRef={buttonRef}
          />
        </div>
      </div>
    </Section>
  );
};

AddToCartBar.defaultProps = {
  stockInfo: {},
};

AddToCartBar.propTypes = {
  conditioner: PropTypes.shape().isRequired,
  disabled: PropTypes.bool.isRequired,
  handleAddToCart: PropTypes.func.isRequired,
  loading: PropTypes.bool.isRequired,
  resetClicked: PropTypes.func.isRequired,
  stockInfo: PropTypes.shape(),
};

export default connect(AddToCartBar);
