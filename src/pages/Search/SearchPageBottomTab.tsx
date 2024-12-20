import React, {useCallback} from 'react';
import {View} from 'react-native';
import {useOnyx} from 'react-native-onyx';
import Animated, {clamp, useAnimatedScrollHandler, useAnimatedStyle, useSharedValue, withTiming} from 'react-native-reanimated';
import FullPageNotFoundView from '@components/BlockingViews/FullPageNotFoundView';
import ScreenWrapper from '@components/ScreenWrapper';
import Search from '@components/Search';
import SearchStatusBar from '@components/Search/SearchStatusBar';
import type {SearchQueryJSON} from '@components/Search/types';
import useLocalize from '@hooks/useLocalize';
import useResponsiveLayout from '@hooks/useResponsiveLayout';
import useThemeStyles from '@hooks/useThemeStyles';
import useWindowDimensions from '@hooks/useWindowDimensions';
import BottomTabBar, {BOTTOM_TABS} from '@libs/Navigation/AppNavigator/createCustomBottomTabNavigator/BottomTabBar';
import Navigation from '@libs/Navigation/Navigation';
import * as SearchQueryUtils from '@libs/SearchQueryUtils';
import TopBar from '@navigation/AppNavigator/createCustomBottomTabNavigator/TopBar';
import variables from '@styles/variables';
import ONYXKEYS from '@src/ONYXKEYS';
import ROUTES from '@src/ROUTES';
import SearchSelectionModeHeader from './SearchSelectionModeHeader';
import SearchTypeMenu from './SearchTypeMenu';

const TOO_CLOSE_TO_TOP_DISTANCE = 10;
const TOO_CLOSE_TO_BOTTOM_DISTANCE = 10;
const ANIMATION_DURATION_IN_MS = 300;

type SearchPageBottomTabProps = {
    queryJSON?: SearchQueryJSON;
    policyID?: string;
    searchName?: string;
};

function SearchPageBottomTab({queryJSON, policyID, searchName}: SearchPageBottomTabProps) {
    const {translate} = useLocalize();
    const {shouldUseNarrowLayout} = useResponsiveLayout();
    const {windowHeight} = useWindowDimensions();

    const styles = useThemeStyles();
    const [selectionMode] = useOnyx(ONYXKEYS.MOBILE_SELECTION_MODE);

    const scrollOffset = useSharedValue(0);
    const topBarOffset = useSharedValue<number>(variables.searchHeaderHeight);
    const topBarAnimatedStyle = useAnimatedStyle(() => ({
        top: topBarOffset.get(),
    }));

    const scrollHandler = useAnimatedScrollHandler({
        onScroll: (event) => {
            const {contentOffset, layoutMeasurement, contentSize} = event;
            if (windowHeight > contentSize.height) {
                return;
            }
            const currentOffset = contentOffset.y;
            const isScrollingDown = currentOffset > scrollOffset.get();
            const distanceScrolled = currentOffset - scrollOffset.get();
            if (isScrollingDown && contentOffset.y > TOO_CLOSE_TO_TOP_DISTANCE) {
                topBarOffset.set(clamp(topBarOffset.get() - distanceScrolled, variables.minimalTopBarOffset, variables.searchHeaderHeight));
            } else if (!isScrollingDown && distanceScrolled < 0 && contentOffset.y + layoutMeasurement.height < contentSize.height - TOO_CLOSE_TO_BOTTOM_DISTANCE) {
                topBarOffset.set(withTiming(variables.searchHeaderHeight, {duration: ANIMATION_DURATION_IN_MS}));
            }
            scrollOffset.set(currentOffset);
        },
    });

    const onContentSizeChange = useCallback(
        (w: number, h: number) => {
            if (windowHeight <= h) {
                return;
            }
            topBarOffset.set(withTiming(variables.searchHeaderHeight, {duration: ANIMATION_DURATION_IN_MS}));
        },
        [windowHeight, topBarOffset],
    );

    const handleOnBackButtonPress = () => Navigation.goBack(ROUTES.SEARCH_CENTRAL_PANE.getRoute({query: SearchQueryUtils.buildCannedSearchQuery()}));

    if (!queryJSON) {
        return (
            <ScreenWrapper
                testID={SearchPageBottomTab.displayName}
                style={styles.pv0}
                offlineIndicatorStyle={styles.mtAuto}
            >
                <FullPageNotFoundView
                    shouldShow={!queryJSON}
                    onBackButtonPress={handleOnBackButtonPress}
                    shouldShowLink={false}
                />
            </ScreenWrapper>
        );
    }

    const shouldDisplayCancelSearch = shouldUseNarrowLayout && !SearchQueryUtils.isCannedSearchQuery(queryJSON);

    return (
        <ScreenWrapper
            testID={SearchPageBottomTab.displayName}
            offlineIndicatorStyle={styles.mtAuto}
            bottomContent={<BottomTabBar selectedTab={BOTTOM_TABS.SEARCH} />}
        >
            {!selectionMode?.isEnabled ? (
                <>
                    <View style={[styles.zIndex10, styles.appBG]}>
                        <TopBar
                            activeWorkspaceID={policyID}
                            breadcrumbLabel={translate('common.search')}
                            shouldDisplaySearch={shouldUseNarrowLayout}
                            shouldDisplayCancelSearch={shouldDisplayCancelSearch}
                        />
                    </View>
                    {shouldUseNarrowLayout ? (
                        <Animated.View style={[styles.searchTopBarStyle, topBarAnimatedStyle]}>
                            <SearchTypeMenu
                                queryJSON={queryJSON}
                                searchName={searchName}
                            />
                            <SearchStatusBar
                                queryJSON={queryJSON}
                                onStatusChange={() => {
                                    topBarOffset.set(withTiming(variables.searchHeaderHeight, {duration: ANIMATION_DURATION_IN_MS}));
                                }}
                            />
                        </Animated.View>
                    ) : (
                        <SearchTypeMenu
                            queryJSON={queryJSON}
                            searchName={searchName}
                        />
                    )}
                </>
            ) : (
                <SearchSelectionModeHeader queryJSON={queryJSON} />
            )}
            <Search
                queryJSON={queryJSON}
                onSearchListScroll={scrollHandler}
                onContentSizeChange={onContentSizeChange}
                contentContainerStyle={!selectionMode?.isEnabled ? [styles.searchListContentContainerStyles] : undefined}
            />
        </ScreenWrapper>
    );
}

SearchPageBottomTab.displayName = 'SearchPageBottomTab';

export default SearchPageBottomTab;
