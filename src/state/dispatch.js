import * as actionModules from 'state/actions';

export const mapStateToProps = state => ({ state });

export const mapDispatchToProps = (dispatch) => {
  const list = [ ...Object.values(actionModules) ];

  return list.reduce((acc, action) => {
    return acc = { ...acc, ...action(dispatch) }
  }, {});
};