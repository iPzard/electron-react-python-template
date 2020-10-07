// Actions for counting
export const counterActions = (dispatch) => ({
  add: () => dispatch({ type: 'ADD' }),
  subtract: () => dispatch({ type: 'SUBTRACT' })
});