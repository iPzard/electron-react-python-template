import React from 'react';

import styles from './scss/TitlebarButtons.module.scss';

export type TitlebarButtonProps = React.ComponentPropsWithoutRef<'button'>;

/**
 * Titlebar minimize button.
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
 * Titlebar maximize button.
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
 * Titlebar contract (unmaximize) button.
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
 * Titlebar close button.
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
