import React, {memo, useCallback, useEffect, useState} from 'react';
import {View} from 'react-native';
import {useOnyx} from 'react-native-onyx';
import type {ValueOf} from 'type-fest';
import Icon from '@components/Icon';
import * as Expensicons from '@components/Icon/Expensicons';
import {PressableWithFeedback} from '@components/Pressable';
import type {SearchQueryString} from '@components/Search/types';
import Text from '@components/Text';
import useActiveWorkspace from '@hooks/useActiveWorkspace';
import useCurrentReportID from '@hooks/useCurrentReportID';
import useLocalize from '@hooks/useLocalize';
import useResponsiveLayout from '@hooks/useResponsiveLayout';
import useTheme from '@hooks/useTheme';
import useThemeStyles from '@hooks/useThemeStyles';
import interceptAnonymousUser from '@libs/interceptAnonymousUser';
import {getPreservedSplitNavigatorState} from '@libs/Navigation/AppNavigator/createSplitNavigator/usePreserveSplitNavigatorState';
import {isFullScreenName} from '@libs/Navigation/helpers';
import Navigation from '@libs/Navigation/Navigation';
import type {AuthScreensParamList, RootStackParamList, State, WorkspaceSplitNavigatorParamList} from '@libs/Navigation/types';
import * as PolicyUtils from '@libs/PolicyUtils';
import * as SearchQueryUtils from '@libs/SearchQueryUtils';
import type {BrickRoad} from '@libs/WorkspacesSettingsUtils';
import {getChatTabBrickRoad} from '@libs/WorkspacesSettingsUtils';
import navigationRef from '@navigation/navigationRef';
import BottomTabAvatar from '@pages/home/sidebar/BottomTabAvatar';
import BottomTabBarFloatingActionButton from '@pages/home/sidebar/BottomTabBarFloatingActionButton';
import variables from '@styles/variables';
import CONST from '@src/CONST';
import NAVIGATORS from '@src/NAVIGATORS';
import ONYXKEYS from '@src/ONYXKEYS';
import ROUTES from '@src/ROUTES';
import SCREENS from '@src/SCREENS';
import DebugTabView from './DebugTabView';

const BOTTOM_TABS = {
    HOME: 'HOME',
    SEARCH: 'SEARCH',
    SETTINGS: 'SETTINGS',
} as const;

type BottomTabs = ValueOf<typeof BOTTOM_TABS>;

type BottomTabBarProps = {
    selectedTab: BottomTabs;
};

/**
 * Returns SearchQueryString that has policyID correctly set.
 *
 * When we're coming back to Search Screen we might have pre-existing policyID inside SearchQuery.
 * There are 2 cases when we might want to remove this `policyID`:
 *  - if Policy was removed in another screen
 *  - if WorkspaceSwitcher was used to globally unset a policyID
 * Otherwise policyID will be inserted into query
 */
function handleQueryWithPolicyID(query: SearchQueryString, activePolicyID?: string): SearchQueryString {
    const queryJSON = SearchQueryUtils.buildSearchQueryJSON(query);
    if (!queryJSON) {
        return query;
    }

    const policyID = activePolicyID ?? queryJSON.policyID;
    const policy = PolicyUtils.getPolicy(policyID);

    // In case policy is missing or there is no policy currently selected via WorkspaceSwitcher we remove it
    if (!activePolicyID || !policy) {
        delete queryJSON.policyID;
    } else {
        queryJSON.policyID = policyID;
    }

    return SearchQueryUtils.buildSearchQueryString(queryJSON);
}

function BottomTabBar({selectedTab}: BottomTabBarProps) {
    const theme = useTheme();
    const styles = useThemeStyles();
    const {translate} = useLocalize();
    const {activeWorkspaceID} = useActiveWorkspace();
    const {currentReportID} = useCurrentReportID() ?? {currentReportID: null};
    const [user] = useOnyx(ONYXKEYS.USER);
    const [betas] = useOnyx(ONYXKEYS.BETAS);
    const [priorityMode] = useOnyx(ONYXKEYS.NVP_PRIORITY_MODE);
    const [reports] = useOnyx(ONYXKEYS.COLLECTION.REPORT);
    const [policies] = useOnyx(ONYXKEYS.COLLECTION.POLICY);
    const [reportActions] = useOnyx(ONYXKEYS.COLLECTION.REPORT_ACTIONS);
    const [transactionViolations] = useOnyx(ONYXKEYS.COLLECTION.TRANSACTION_VIOLATIONS);
    const {shouldUseNarrowLayout} = useResponsiveLayout();
    const [chatTabBrickRoad, setChatTabBrickRoad] = useState<BrickRoad>(() =>
        getChatTabBrickRoad(activeWorkspaceID, currentReportID, reports, betas, policies, priorityMode, transactionViolations),
    );

    useEffect(() => {
        setChatTabBrickRoad(getChatTabBrickRoad(activeWorkspaceID, currentReportID, reports, betas, policies, priorityMode, transactionViolations));
        // We need to get a new brick road state when report actions are updated, otherwise we'll be showing an outdated brick road.
        // That's why reportActions is added as a dependency here
    }, [activeWorkspaceID, transactionViolations, reports, reportActions, betas, policies, priorityMode, currentReportID]);

    const navigateToChats = useCallback(() => {
        if (selectedTab === BOTTOM_TABS.HOME) {
            return;
        }

        Navigation.navigate(ROUTES.HOME);
    }, [selectedTab]);

    const navigateToSearch = useCallback(() => {
        if (selectedTab === BOTTOM_TABS.SEARCH) {
            return;
        }
        interceptAnonymousUser(() => {
            const rootState = navigationRef.getRootState() as State<RootStackParamList>;
            const lastSearchRoute = rootState.routes.filter((route) => route.name === SCREENS.SEARCH.CENTRAL_PANE).at(-1);

            if (lastSearchRoute) {
                const {q, ...rest} = lastSearchRoute.params as AuthScreensParamList[typeof SCREENS.SEARCH.CENTRAL_PANE];
                const cleanedQuery = handleQueryWithPolicyID(q, activeWorkspaceID);

                Navigation.navigate(
                    ROUTES.SEARCH_CENTRAL_PANE.getRoute({
                        query: cleanedQuery,
                        ...rest,
                    }),
                );
                return;
            }

            const defaultCannedQuery = SearchQueryUtils.buildCannedSearchQuery();
            // when navigating to search we might have an activePolicyID set from workspace switcher
            const query = activeWorkspaceID ? `${defaultCannedQuery} ${CONST.SEARCH.SYNTAX_ROOT_KEYS.POLICY_ID}:${activeWorkspaceID}` : defaultCannedQuery;
            Navigation.navigate(ROUTES.SEARCH_CENTRAL_PANE.getRoute({query}));
        });
    }, [activeWorkspaceID, selectedTab]);

    const showSettingsPage = useCallback(() => {
        const rootState = navigationRef.getRootState();
        const topmostFullScreenRoute = rootState.routes.findLast((route) => isFullScreenName(route.name));

        if (!topmostFullScreenRoute) {
            return;
        }

        const lastRouteOfTopmostFullScreenRoute = 'state' in topmostFullScreenRoute ? topmostFullScreenRoute.state?.routes.at(-1) : undefined;

        if (lastRouteOfTopmostFullScreenRoute && lastRouteOfTopmostFullScreenRoute.name === SCREENS.SETTINGS.WORKSPACES && shouldUseNarrowLayout) {
            Navigation.goBack(ROUTES.SETTINGS);
            return;
        }

        if (topmostFullScreenRoute.name === NAVIGATORS.WORKSPACE_SPLIT_NAVIGATOR) {
            Navigation.goBack(ROUTES.SETTINGS);
            return;
        }

        interceptAnonymousUser(() => {
            const lastSettingsOrWorkspaceNavigatorRoute = rootState.routes.findLast(
                (rootRoute) => rootRoute.name === NAVIGATORS.SETTINGS_SPLIT_NAVIGATOR || rootRoute.name === NAVIGATORS.WORKSPACE_SPLIT_NAVIGATOR,
            );

            // If there is a workspace navigator route, then we should open the workspace initial screen as it should be "remembered".
            if (lastSettingsOrWorkspaceNavigatorRoute?.name === NAVIGATORS.WORKSPACE_SPLIT_NAVIGATOR) {
                const state = lastSettingsOrWorkspaceNavigatorRoute.state ?? getPreservedSplitNavigatorState(lastSettingsOrWorkspaceNavigatorRoute.key);
                const params = state?.routes.at(0)?.params as WorkspaceSplitNavigatorParamList[typeof SCREENS.WORKSPACE.INITIAL];

                // Screens of this navigator should always have policyID
                if (params.policyID) {
                    // This action will put settings split under the workspace split to make sure that we can swipe back to settings split.
                    navigationRef.dispatch({
                        type: CONST.NAVIGATION.ACTION_TYPE.OPEN_WORKSPACE_SPLIT,
                        payload: {
                            policyID: params.policyID,
                        },
                    });
                }
                return;
            }

            // If there is settings workspace screen in the settings navigator, then we should open the settings workspaces as it should be "remembered".
            if (
                lastSettingsOrWorkspaceNavigatorRoute &&
                lastSettingsOrWorkspaceNavigatorRoute.state &&
                lastSettingsOrWorkspaceNavigatorRoute.state.routes.at(-1)?.name === SCREENS.SETTINGS.WORKSPACES
            ) {
                Navigation.navigate(ROUTES.SETTINGS_WORKSPACES);
                return;
            }

            // Otherwise we should simply open the settings navigator.
            // This case also covers if there is no route to remember.
            Navigation.navigate(ROUTES.SETTINGS);
        });
    }, [shouldUseNarrowLayout]);

    return (
        <>
            {!!user?.isDebugModeEnabled && (
                <DebugTabView
                    selectedTab={selectedTab}
                    chatTabBrickRoad={chatTabBrickRoad}
                    activeWorkspaceID={activeWorkspaceID}
                    reports={reports}
                    currentReportID={currentReportID}
                    betas={betas}
                    policies={policies}
                    transactionViolations={transactionViolations}
                    priorityMode={priorityMode}
                />
            )}
            <View style={styles.bottomTabBarContainer}>
                <PressableWithFeedback
                    onPress={navigateToChats}
                    role={CONST.ROLE.BUTTON}
                    accessibilityLabel={translate('common.inbox')}
                    wrapperStyle={styles.flex1}
                    style={styles.bottomTabBarItem}
                >
                    <View>
                        <Icon
                            src={Expensicons.Inbox}
                            fill={selectedTab === BOTTOM_TABS.HOME ? theme.iconMenu : theme.icon}
                            width={variables.iconBottomBar}
                            height={variables.iconBottomBar}
                        />
                        {!!chatTabBrickRoad && (
                            <View style={styles.bottomTabStatusIndicator(chatTabBrickRoad === CONST.BRICK_ROAD_INDICATOR_STATUS.INFO ? theme.iconSuccessFill : theme.danger)} />
                        )}
                    </View>
                    <Text
                        style={[
                            styles.textSmall,
                            styles.textAlignCenter,
                            styles.mt1Half,
                            selectedTab === BOTTOM_TABS.HOME ? styles.textBold : styles.textSupporting,
                            styles.bottomTabBarLabel,
                        ]}
                    >
                        {translate('common.inbox')}
                    </Text>
                </PressableWithFeedback>
                <PressableWithFeedback
                    onPress={navigateToSearch}
                    role={CONST.ROLE.BUTTON}
                    accessibilityLabel={translate('common.search')}
                    wrapperStyle={styles.flex1}
                    style={styles.bottomTabBarItem}
                >
                    <View>
                        <Icon
                            src={Expensicons.MoneySearch}
                            fill={selectedTab === BOTTOM_TABS.SEARCH ? theme.iconMenu : theme.icon}
                            width={variables.iconBottomBar}
                            height={variables.iconBottomBar}
                        />
                    </View>
                    <Text
                        style={[
                            styles.textSmall,
                            styles.textAlignCenter,
                            styles.mt1Half,
                            selectedTab === BOTTOM_TABS.SEARCH ? styles.textBold : styles.textSupporting,
                            styles.bottomTabBarLabel,
                        ]}
                    >
                        {translate('common.search')}
                    </Text>
                </PressableWithFeedback>
                <BottomTabAvatar
                    isSelected={selectedTab === BOTTOM_TABS.SETTINGS}
                    onPress={showSettingsPage}
                />
                <View style={[styles.flex1, styles.bottomTabBarItem]}>
                    <BottomTabBarFloatingActionButton />
                </View>
            </View>
        </>
    );
}

BottomTabBar.displayName = 'BottomTabBar';

export default memo(BottomTabBar);
export {BOTTOM_TABS};
export type {BottomTabs};
