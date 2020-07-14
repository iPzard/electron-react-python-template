import { IconButton } from '@fluentui/react/lib/Button';
import React from 'react';

export const MinimizeButton = props => (
  <IconButton
    iconProps={{ iconName: 'ChromeMinimize' }}
    title="Minimize"
    ariaLabel="Minimize"
    { ...props }
  />
);

export const MaximizeButton = props => (
  <IconButton
    iconProps={{ iconName: 'Checkbox' }}
    title="Maximize"
    ariaLabel="Maximize"
    { ...props }
  />
);

export const ContractButton = props => (
  <IconButton
    iconProps={{ iconName: 'MiniContract' }}
    title="Unmaximize"
    ariaLabel="Unmaximize"
    { ...props }
  />
);

export const CloseButton = props => (
  <IconButton
    iconProps={{ iconName: 'ChromeClose' }}
    title="Close"
    ariaLabel="Close"
    { ...props }
  />
);