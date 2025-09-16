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
 * AddToCartBar component
 * @param {Object} props Component props
 * @returns {JSX}
 */
const AddToCartBar = ({
  handleAddToCart, resetClicked, loading, disabled, conditioner, stockInfo,
}) => {
  const minQuantity = stockInfo?.minOrderQuantity > 0 ? stockInfo.minOrderQuantity : 1;
  const maxQuantity = stockInfo?.maxOrderQuantity > 0 ? stockInfo.maxOrderQuantity : 99;

  const initialQuantity = minQuantity > 1 ? minQuantity : 1;

  const { setQuantity: setContextQuantity } = useCurrentProduct();
  const [inputQuantity, setInputQuantity] = useState(initialQuantity);
  const [blurredInputQuantity, setBlurredInputQuantity] = useState(initialQuantity);
  const buttonRef = useRef(null);

  useEffect(() => {
    setInputQuantity(initialQuantity);
    setBlurredInputQuantity(initialQuantity);
  }, [initialQuantity]);

  const handleButtonClick = useCallback(() => new Promise((resolve) => {
    conditioner.check().then((fulfilled) => {
      // Resolve early to enable button animation while the request runs
      resolve(fulfilled);

      // Update the product context
      setContextQuantity(parseInt(inputQuantity, 10));
      // Trigger addToCart
      handleAddToCart();
    });
  }), [conditioner, handleAddToCart, inputQuantity, setContextQuantity]);

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

      const clamped = Math.min(Math.max(numericValue, minQuantity), maxQuantity);
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
