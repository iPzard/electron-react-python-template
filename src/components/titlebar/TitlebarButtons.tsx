import React from 'react';

import styles from './scss/TitlebarButtons.module.scss';

type TitlebarButtonProps = React.ComponentPropsWithoutRef<'button'>;

/**
 * @description Titlebar minimize button.
 * @memberof Titlebar
 */
export function MinimizeButton(props: TitlebarButtonProps) {
  return (
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
}

/**
 * @description Titlebar maximize button.
 * @memberof Titlebar
 */
export function MaximizeButton(props: TitlebarButtonProps) {
  return (
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
}

/**
 * @description Titlebar contract (unmaximize) button.
 * @memberof Titlebar
 */
export function ContractButton(props: TitlebarButtonProps) {
  return (
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
}

/**
 * @description Titlebar close button.
 * @memberof Titlebar
 */
export function CloseButton(props: TitlebarButtonProps) {
  return (
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
}
