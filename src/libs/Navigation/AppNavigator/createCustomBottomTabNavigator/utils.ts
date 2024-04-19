import type {ParamListBase} from '@react-navigation/native';
import type {PlatformStackNavigationOptions, PlatformStackNavigationState} from '@libs/Navigation/PlatformStackNavigation/types';
import type {NavigationStateRoute} from '@libs/Navigation/types';
import SCREENS from '@src/SCREENS';

const defaultScreenOptions: PlatformStackNavigationOptions = {
    animation: 'none',
};

function getStateToRender(state: PlatformStackNavigationState<ParamListBase>): PlatformStackNavigationState<ParamListBase> {
    const routesToRender = [state.routes.at(-1)] as NavigationStateRoute[];

    // We need to render at least one HOME screen to make sure everything load properly. This may be not necessary after changing how IS_SIDEBAR_LOADED is handled.
    // Currently this value will be switched only after the first HOME screen is rendered.
    if (routesToRender[0].name !== SCREENS.HOME) {
        const routeToRender = state.routes.find((route) => route.name === SCREENS.HOME);
        if (routeToRender) {
            routesToRender.unshift(routeToRender);
        }
    }

    return {...state, routes: routesToRender, index: routesToRender.length - 1};
}

export {defaultScreenOptions, getStateToRender};
