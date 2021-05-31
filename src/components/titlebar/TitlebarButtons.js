import React from 'react';

import styles from 'components/titlebar/scss/TitlebarButtons.module.scss';

/**
 * @description Titlebar minimize button.
 * @memberof Titlebar
 */
export const MinimizeButton = (props) => (
  <button
    { ...props }
    aria-label="Minimize"
    className={ styles['minimize-button'] }
    title="Minimize"
    type="button"
  >
    <span />
  </button>
);

/**
 * @description Titlebar maximize button.
 * @memberof Titlebar
 */
export const MaximizeButton = (props) => (
  <button
    { ...props }
    aria-label="Maximize"
    className={ styles['maximize-button'] }
    title="Maximize"
    type="button"
  >
    <span />
  </button>
);

/**
 * @description Titlebar contract (unmaximize) button.
 * @memberof Titlebar
 */
export const ContractButton = (props) => (
  <button
    { ...props }
    aria-label="Contract"
    className={ styles['contract-button'] }
    title="Contract"
    type="button"
  >
    <span />
    <span />
  </button>
);

/**
 * @description Titlebar close button.
 * @memberof Titlebar
 */
export const CloseButton = (props) => (
  <button
    { ...props }
    aria-label="Close"
    className={ styles['close-button'] }
    title="Close"
    type="button"
  >
    <span />
    <span />
  </button>
);