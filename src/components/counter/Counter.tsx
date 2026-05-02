import React, { useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../state/hooks';
import {
  decrement,
  increment,
  incrementAsync,
  incrementByAmount,
  selectCount
} from './counterSlice';

import styles from './Counter.module.scss';

export function Counter() {
  const count = useAppSelector(selectCount);
  const dispatch = useAppDispatch();
  const [incrementAmount, setIncrementAmount] = useState('2');

  return (
    <div>
      <div className={ styles.row }>
        <button
          type="button"
          className={ styles.button }
          aria-label="Increment value"
          onClick={ () => dispatch(increment()) }
        >
          +
        </button>
        <span className={ styles.value }>{count}</span>
        <button
          type="button"
          className={ styles.button }
          aria-label="Decrement value"
          onClick={ () => dispatch(decrement()) }
        >
          -
        </button>
      </div>
      <div className={ styles.row }>
        <input
          className={ styles.textbox }
          aria-label="Set increment amount"
          value={ incrementAmount }
          onChange={ (e) => setIncrementAmount(e.target.value) }
        />
        <button
          type="button"
          className={ styles.button }
          onClick={ () => dispatch(incrementByAmount(Number(incrementAmount) || 0)) }
        >
          Add Amount
        </button>
        <button
          type="button"
          className={ styles.asyncButton }
          onClick={ () => dispatch(incrementAsync(Number(incrementAmount) || 0)) }
        >
          Add Async
        </button>
      </div>
    </div>
  );
}
