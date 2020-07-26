import { IconButton } from '@fluentui/react/lib/Button';
import React from 'react';
import styles from 'components/titlebar/scss/TitlebarButtons.module.scss';

/**
 * @description Titlebar minimize button.
 * @memberof Titlebar
 */

export const MinimizeButton = props => (
  <IconButton
    className={ styles.button }
    iconProps={{ iconName: 'ChromeMinimize' }}
    title="Minimize"
    ariaLabel="Minimize"
    { ...props }
  />
);

/**
 * @description Titlebar maximize button.
 * @memberof Titlebar
 */
export const MaximizeButton = props => (
  <IconButton
    className={ styles.button }
    iconProps={{ iconName: 'Checkbox' }}
    title="Maximize"
    ariaLabel="Maximize"
    { ...props }
  />
);

/**
 * @description Titlebar contract (unmaximize) button.
 * @memberof Titlebar
 */
export const ContractButton = props => (
  <IconButton
    className={ styles.button }
    iconProps={{ iconName: 'MiniContract' }}
    title="Unmaximize"
    ariaLabel="Unmaximize"
    { ...props }
  />
);

/**
 * @description Titlebar close button.
 * @memberof Titlebar
 */
export const CloseButton = props => (
  <IconButton
    className={ styles.button }
    iconProps={{ iconName: 'ChromeClose' }}
    title="Close"
    ariaLabel="Close"
    { ...props }
  />
);