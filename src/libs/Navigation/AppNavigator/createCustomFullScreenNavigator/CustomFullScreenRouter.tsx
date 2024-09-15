import type {ParamListBase, PartialState, RouterConfigOptions, StackNavigationState} from '@react-navigation/native';
import {StackRouter} from '@react-navigation/native';
import {useOnyx} from 'react-native-onyx';
import type {OnyxEntry} from 'react-native-onyx';
import getIsNarrowLayout from '@libs/getIsNarrowLayout';
import * as PolicyUtils from '@libs/PolicyUtils';
import ONYXKEYS from '@src/ONYXKEYS';
import SCREENS from '@src/SCREENS';
import type {FullScreenNavigatorRouterOptions} from './types';

type StackState = StackNavigationState<ParamListBase> | PartialState<StackNavigationState<ParamListBase>>;

const isAtLeastOneInState = (state: StackState, screenName: string): boolean => state.routes.some((route) => route.name === screenName);

function adaptStateIfNecessary(state: StackState, isLoadingReportData: OnyxEntry<boolean>) {
    const isNarrowLayout = getIsNarrowLayout();
    const workspaceCentralPane = state.routes.at(-1);
    const policyID =
        workspaceCentralPane?.params && 'policyID' in workspaceCentralPane.params && typeof workspaceCentralPane.params.policyID === 'string'
            ? workspaceCentralPane.params.policyID
            : undefined;

    // There should always be WORKSPACE.INITIAL screen in the state to make sure go back works properly if we deeplinkg to a subpage of settings.
    if (!isAtLeastOneInState(state, SCREENS.WORKSPACE.INITIAL)) {
        const policy = PolicyUtils.getPolicy(policyID ?? '');
        const isPolicyAccessible = PolicyUtils.isPolicyAccessible(policy);
        if (isLoadingReportData && !isPolicyAccessible) {
            return;
        }

        // @ts-expect-error Updating read only property
        // noinspection JSConstantReassignment
        state.stale = true; // eslint-disable-line

        // This is necessary for ts to narrow type down to PartialState.
        if (state.stale === true) {
            // Unshift the root screen to fill left pane.
            state.routes.unshift({
                name: SCREENS.WORKSPACE.INITIAL,
                params: workspaceCentralPane?.params,
            });
        }
    }

    // If the screen is wide, there should be at least two screens inside:
    // - WORKSPACE.INITIAL to cover left pane.
    // - WORKSPACE.PROFILE (first workspace settings screen) to cover central pane.
    if (!isNarrowLayout) {
        if (state.routes.length === 1 && state.routes[0].name === SCREENS.WORKSPACE.INITIAL) {
            // @ts-expect-error Updating read only property
            // noinspection JSConstantReassignment
            state.stale = true; // eslint-disable-line
            // Push the default settings central pane screen.
            if (state.stale === true) {
                state.routes.push({
                    name: SCREENS.WORKSPACE.PROFILE,
                    params: state.routes[0]?.params,
                });
            }
        }
        // eslint-disable-next-line no-param-reassign, @typescript-eslint/non-nullable-type-assertion-style
        (state.index as number) = state.routes.length - 1;
    }
}

function CustomFullScreenRouter(options: FullScreenNavigatorRouterOptions) {
    const stackRouter = StackRouter(options);
    const [isLoadingReportData] = useOnyx(ONYXKEYS.IS_LOADING_REPORT_DATA, {initialValue: true});

    return {
        ...stackRouter,
        getInitialState({routeNames, routeParamList, routeGetIdList}: RouterConfigOptions) {
            const initialState = stackRouter.getInitialState({routeNames, routeParamList, routeGetIdList});
            adaptStateIfNecessary(initialState, isLoadingReportData);

            // If we needed to modify the state we need to rehydrate it to get keys for new routes.
            if (initialState.stale) {
                return stackRouter.getRehydratedState(initialState, {routeNames, routeParamList, routeGetIdList});
            }

            return initialState;
        },
        getRehydratedState(partialState: StackState, {routeNames, routeParamList, routeGetIdList}: RouterConfigOptions): StackNavigationState<ParamListBase> {
            adaptStateIfNecessary(partialState, isLoadingReportData);
            const state = stackRouter.getRehydratedState(partialState, {routeNames, routeParamList, routeGetIdList});
            return state;
        },
    };
}

export default CustomFullScreenRouter;
