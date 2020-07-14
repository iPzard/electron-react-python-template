import * as actionModules from 'state/actions';

const list = [];
for(let action in actionModules) {
  list.push(actionModules[action]);
}

export const mapStateToProps = state => ({ state });

export const mapDispatchToProps = function(dispatch) {

  const actions = list.reduce((acc, action) => {
    acc = { ...acc, ...action(dispatch) }
    return acc;
  }, {});

  return actions;
};