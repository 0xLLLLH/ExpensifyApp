import {Str} from 'expensify-common';
import React, {useCallback, useMemo, useState} from 'react';
import {Linking, View} from 'react-native';
import {useOnyx} from 'react-native-onyx';
import DotIndicatorMessage from '@components/DotIndicatorMessage';
import EmptyStateComponent from '@components/EmptyStateComponent';
import type {FeatureListItem} from '@components/FeatureList';
import * as Illustrations from '@components/Icon/Illustrations';
import LottieAnimation from '@components/LottieAnimations';
import MenuItem from '@components/MenuItem';
import SearchRowSkeleton from '@components/Skeletons/SearchRowSkeleton';
import Text from '@components/Text';
import TextLink from '@components/TextLink';
import useLocalize from '@hooks/useLocalize';
import usePolicy from '@hooks/usePolicy';
import useStyleUtils from '@hooks/useStyleUtils';
import useTheme from '@hooks/useTheme';
import useThemeStyles from '@hooks/useThemeStyles';
import Navigation from '@libs/Navigation/Navigation';
import variables from '@styles/variables';
import * as Link from '@userActions/Link';
import CONST from '@src/CONST';
import ONYXKEYS from '@src/ONYXKEYS';
import ROUTES from '@src/ROUTES';
import type {SearchDataTypes} from '@src/types/onyx/SearchResults';
import {isEmptyObject} from '@src/types/utils/EmptyObject';

type EmptySearchViewProps = {
    type: SearchDataTypes;
};

const tripsFeatures: FeatureListItem[] = [
    {
        icon: Illustrations.PiggyBank,
        translationKey: 'travel.features.saveMoney',
    },
    {
        icon: Illustrations.Alert,
        translationKey: 'travel.features.alerts',
    },
];

function EmptySearchView({type}: EmptySearchViewProps) {
    const theme = useTheme();
    const StyleUtils = useStyleUtils();
    const {translate} = useLocalize();
    const styles = useThemeStyles();
    const [travelSettings] = useOnyx(ONYXKEYS.NVP_TRAVEL_SETTINGS);
    const [activePolicyID] = useOnyx(ONYXKEYS.NVP_ACTIVE_POLICY_ID);
    const [primaryLogin = ''] = useOnyx(ONYXKEYS.ACCOUNT, {selector: (account) => account?.primaryLogin});
    const policy = usePolicy(activePolicyID);
    const [ctaErrorMessage, setCtaErrorMessage] = useState('');

    const hasAcceptedTravelTerms = travelSettings?.hasAcceptedTerms;
    const hasPolicyAddress = !isEmptyObject(policy?.address);

    const onBookATripPress = useCallback(() => {
        if (Str.isSMSLogin(primaryLogin)) {
            setCtaErrorMessage(translate('travel.phoneError'));
            return;
        }
        if (!hasPolicyAddress) {
            Navigation.navigate(ROUTES.WORKSPACE_PROFILE_ADDRESS.getRoute(activePolicyID ?? '-1', Navigation.getActiveRoute()));
            return;
        }
        if (!hasAcceptedTravelTerms) {
            Navigation.navigate(ROUTES.TRAVEL_TCS);
            return;
        }
        if (ctaErrorMessage) {
            setCtaErrorMessage('');
        }
        Link.openTravelDotLink(activePolicyID)?.catch(() => {
            setCtaErrorMessage(translate('travel.errorMessage'));
        });
    }, [activePolicyID, primaryLogin, hasPolicyAddress, hasAcceptedTravelTerms, translate, ctaErrorMessage]);

    const subtitleComponent = useMemo(() => {
        return (
            <>
                <Text style={[styles.textSupporting, styles.textNormal]}>
                    {translate('travel.subtitle')}{' '}
                    <TextLink
                        onPress={() => {
                            Linking.openURL(CONST.BOOK_TRAVEL_DEMO_URL);
                        }}
                    >
                        {translate('travel.bookADemo')}
                    </TextLink>
                    {translate('travel.toLearnMore')}
                </Text>
                <View style={[styles.flex1, styles.flexRow, styles.flexWrap, styles.rowGap4, styles.pt4, styles.pl1]}>
                    {tripsFeatures.map((tripsFeature) => (
                        <View
                            key={tripsFeature.translationKey}
                            style={styles.w100}
                        >
                            <MenuItem
                                title={translate(tripsFeature.translationKey)}
                                icon={tripsFeature.icon}
                                iconWidth={variables.menuIconSize}
                                iconHeight={variables.menuIconSize}
                                interactive={false}
                                displayInDefaultIconColor
                                wrapperStyle={[styles.p0, styles.cursorAuto]}
                                containerStyle={[styles.m0, styles.wAuto]}
                                numberOfLinesTitle={0}
                            />
                        </View>
                    ))}
                </View>
                {ctaErrorMessage && (
                    <DotIndicatorMessage
                        style={styles.mt1}
                        messages={{error: ctaErrorMessage}}
                        type="error"
                    />
                )}
            </>
        );
    }, [styles, translate, ctaErrorMessage]);

    const content = useMemo(() => {
        switch (type) {
            case CONST.SEARCH.DATA_TYPES.TRIP:
                return {
                    headerMedia: LottieAnimation.TripsEmptyState,
                    headerMediaType: CONST.EMPTY_STATE_MEDIA.ANIMATION,
                    headerStyles: StyleUtils.getBackgroundColorStyle(theme.travelBG),
                    headerContentStyles: StyleUtils.getWidthAndHeightStyle(335, 220),
                    title: translate('travel.title'),
                    titleStyles: {...styles.textAlignLeft},
                    subtitle: subtitleComponent,
                    buttonText: translate('search.searchResults.emptyTripResults.buttonText'),
                    buttonAction: onBookATripPress,
                    canEmptyViewBeScrolled: true,
                };
            case CONST.SEARCH.DATA_TYPES.CHAT:
            case CONST.SEARCH.DATA_TYPES.EXPENSE:
            case CONST.SEARCH.DATA_TYPES.INVOICE:
            default:
                return {
                    headerMedia: Illustrations.EmptyState,
                    headerMediaType: CONST.EMPTY_STATE_MEDIA.ILLUSTRATION,
                    headerStyles: StyleUtils.getBackgroundColorStyle(theme.emptyFolderBG),
                    headerContentStyles: StyleUtils.getWidthAndHeightStyle(variables.w184, variables.h112),
                    title: translate('search.searchResults.emptyResults.title'),
                    subtitle: translate('search.searchResults.emptyResults.subtitle'),
                    buttonText: undefined,
                    buttonAction: undefined,
                };
        }
    }, [type, StyleUtils, translate, theme, styles, subtitleComponent, onBookATripPress]);

    return (
        <EmptyStateComponent
            // eslint-disable-next-line react/jsx-props-no-spreading
            {...content}
            SkeletonComponent={SearchRowSkeleton}
        />
    );
}

EmptySearchView.displayName = 'EmptySearchView';

export default EmptySearchView;
