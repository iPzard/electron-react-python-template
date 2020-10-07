import * as actionModules from 'state/actions';

export const mapStateToProps = state => ({ state });

const actions = [ ...Object.values(actionModules) ];

export const mapDispatchToProps = (dispatch) => (
  actions.reduce((acc, action) => (
    acc = { ...acc, ...action(dispatch) }
  ), {})
);