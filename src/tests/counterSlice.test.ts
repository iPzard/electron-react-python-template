import counterReducer, {
  decrement,
  increment,
  incrementByAmount,
  selectCount
} from '../components/counter/counterSlice';
import type { RootState } from '../state/store';

describe('counterSlice', () => {
  test('returns initial state', () => {
    const state = counterReducer(undefined, { type: '@@INIT' });
    expect(state).toEqual({ value: 0 });
  });

  test('increment increases value by 1', () => {
    const state = counterReducer({ value: 4 }, increment());
    expect(state.value).toBe(5);
  });

  test('decrement decreases value by 1', () => {
    const state = counterReducer({ value: 4 }, decrement());
    expect(state.value).toBe(3);
  });

  test('incrementByAmount adds payload to value', () => {
    const state = counterReducer({ value: 10 }, incrementByAmount(7));
    expect(state.value).toBe(17);
  });

  test('selectCount reads counter.value from root state', () => {
    const rootState: RootState = { counter: { value: 42 } };
    expect(selectCount(rootState)).toBe(42);
  });
});
