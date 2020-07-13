import { counterActions } from 'state/actions';

export const mapStateToProps = state => ({ state });

export const mapDispatchToProps = dispatch => {
  const actions = {
    ...counterActions(dispatch)
  };

  return actions;
};