import * as actionTypes from './types';

const contextActions = (dispatch) => {
  return {
    navMenu: {
      open: () => {
        dispatch({ type: actionTypes.OPEN_NAV_MENU });
      },
      close: () => {
        dispatch({ type: actionTypes.CLOSE_NAV_MENU });
      },
      collapse: () => {
        dispatch({ type: actionTypes.COLLAPSE_NAV_MENU });
      },
    },
    mobileMenu: {
      open: () => {
        dispatch({ type: actionTypes.OPEN_MOBILE_MENU });
      },
      close: () => {
        dispatch({ type: actionTypes.CLOSE_MOBILE_MENU });
      },
      toggle: () => {
        dispatch({ type: actionTypes.TOGGLE_MOBILE_MENU });
      },
    },
    app: {
      open: (appName) => {
        dispatch({ type: actionTypes.CHANGE_APP, playload: appName });
      },
      default: () => {
        dispatch({ type: actionTypes.DEFAULT_APP });
      },
    },
  };
};

export default contextActions;
