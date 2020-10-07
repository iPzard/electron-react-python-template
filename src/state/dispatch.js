import * as actionModules from 'state/actions';

export const mapStateToProps = state => ({ state });

export const mapDispatchToProps = (dispatch) => {
  const actions = [ ...Object.values(actionModules) ];

  return actions.reduce((acc, action) => {
    return acc = { ...acc, ...action(dispatch) }
  }, {});
};