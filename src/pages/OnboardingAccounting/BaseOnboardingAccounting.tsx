import React, {useMemo, useState} from 'react';
import {View} from 'react-native';
import {useOnyx} from 'react-native-onyx';
import Button from '@components/Button';
import FormHelpMessage from '@components/FormHelpMessage';
import HeaderWithBackButton from '@components/HeaderWithBackButton';
import Icon from '@components/Icon';
import * as Expensicons from '@components/Icon/Expensicons';
import OfflineIndicator from '@components/OfflineIndicator';
import ScreenWrapper from '@components/ScreenWrapper';
import SelectionList from '@components/SelectionList';
import RadioListItem from '@components/SelectionList/RadioListItem';
import type {ListItem} from '@components/SelectionList/types';
import Text from '@components/Text';
import useLocalize from '@hooks/useLocalize';
import useResponsiveLayout from '@hooks/useResponsiveLayout';
import useStyleUtils from '@hooks/useStyleUtils';
import useTheme from '@hooks/useTheme';
import useThemeStyles from '@hooks/useThemeStyles';
import Navigation from '@libs/Navigation/Navigation';
import variables from '@styles/variables';
import * as Policy from '@userActions/Policy/Policy';
import * as Report from '@userActions/Report';
import * as Welcome from '@userActions/Welcome';
import * as OnboardingFlow from '@userActions/Welcome/OnboardingFlow';
import CONST from '@src/CONST';
import type {OnboardingAccountingType} from '@src/CONST';
import ONYXKEYS from '@src/ONYXKEYS';
import type {} from '@src/types/onyx/Bank';
import type {BaseOnboardingAccountingProps} from './types';

type OnboardingListItem = ListItem & {
    keyForList: OnboardingAccountingType;
};

function BaseOnboardingAccounting({shouldUseNativeStyles, route}: BaseOnboardingAccountingProps) {
    const styles = useThemeStyles();
    const theme = useTheme();
    const StyleUtils = useStyleUtils();
    const {translate} = useLocalize();
    const {onboardingIsMediumOrLargerScreenWidth, shouldUseNarrowLayout} = useResponsiveLayout();
    const [onboardingPurposeSelected] = useOnyx(ONYXKEYS.ONBOARDING_PURPOSE_SELECTED);
    const [onboardingPolicyID] = useOnyx(ONYXKEYS.ONBOARDING_POLICY_ID);
    const [onboardingAdminsChatReportID] = useOnyx(ONYXKEYS.ONBOARDING_ADMINS_CHAT_REPORT_ID);
    const [onboardingCompanySize] = useOnyx(ONYXKEYS.ONBOARDING_COMPANY_SIZE);

    const [userReportedIntegration, setUserReportedIntegration] = useState<OnboardingAccountingType | undefined>(undefined);
    const [error, setError] = useState('');

    const accountingOptions: OnboardingListItem[] = useMemo(() => {
        const policyAccountingOptions = Object.values(CONST.POLICY.CONNECTIONS.NAME).map((connectionName): OnboardingListItem => {
            let text;
            let accountingIcon;
            switch (connectionName) {
                case CONST.POLICY.CONNECTIONS.NAME.QBO: {
                    text = translate('workspace.accounting.qbo');
                    accountingIcon = Expensicons.QBOCircle;
                    break;
                }
                case CONST.POLICY.CONNECTIONS.NAME.XERO: {
                    text = translate('workspace.accounting.xero');
                    accountingIcon = Expensicons.XeroCircle;
                    break;
                }
                case CONST.POLICY.CONNECTIONS.NAME.NETSUITE: {
                    text = translate('workspace.accounting.netsuite');
                    accountingIcon = Expensicons.NetSuiteSquare;
                    break;
                }
                default: {
                    text = translate('workspace.accounting.intacct');
                    accountingIcon = Expensicons.IntacctSquare;
                    break;
                }
            }
            return {
                keyForList: connectionName,
                text,
                leftElement: (
                    <Icon
                        src={accountingIcon}
                        width={variables.iconSizeExtraLarge}
                        height={variables.iconSizeExtraLarge}
                        additionalStyles={[
                            StyleUtils.getAvatarBorderStyle(CONST.AVATAR_SIZE.DEFAULT, CONST.ICON_TYPE_AVATAR),
                            styles.mr3,
                            onboardingIsMediumOrLargerScreenWidth ? styles.ml3 : styles.ml0,
                            styles.onboardingIconWrapper,
                        ]}
                    />
                ),
                rightElement: onboardingIsMediumOrLargerScreenWidth ? <View style={styles.mr3} /> : null,
                isSelected: userReportedIntegration === connectionName,
            };
        });
        const noneAccountingOption: OnboardingListItem = {
            keyForList: null,
            text: translate('onboarding.accounting.noneOfAbove'),
            leftElement: (
                <Icon
                    src={Expensicons.Clear}
                    width={variables.iconSizeNormal}
                    height={variables.iconSizeNormal}
                    fill={theme.success}
                    additionalStyles={[
                        StyleUtils.getAvatarBorderStyle(CONST.AVATAR_SIZE.DEFAULT, CONST.ICON_TYPE_AVATAR),
                        styles.mr3,
                        onboardingIsMediumOrLargerScreenWidth ? styles.ml3 : styles.ml0,
                        styles.onboardingIconWrapper,
                    ]}
                />
            ),
            rightElement: onboardingIsMediumOrLargerScreenWidth ? <View style={styles.mr3} /> : null,
            isSelected: userReportedIntegration === null,
        };
        return [...policyAccountingOptions, noneAccountingOption];
    }, [StyleUtils, onboardingIsMediumOrLargerScreenWidth, styles.ml0, styles.ml3, styles.mr3, styles.onboardingIconWrapper, theme.success, translate, userReportedIntegration]);

    const footerContent = (
        <>
            {!!error && (
                <FormHelpMessage
                    style={[styles.ph1, styles.mb2]}
                    isError
                    message={error}
                />
            )}
            <Button
                success
                large
                text={translate('common.confirm')}
                // eslint-disable-next-line rulesdir/prefer-early-return
                onPress={() => {
                    if (userReportedIntegration === undefined) {
                        setError(translate('onboarding.purpose.errorSelection'));
                        // eslint-disable-next-line no-useless-return
                        return;
                    }

                    if (!onboardingPurposeSelected) {
                        return;
                    }

                    if (onboardingPolicyID) {
                        Policy.enablePolicyConnections(onboardingPolicyID, true);
                    }

                    Report.completeOnboarding(
                        onboardingPurposeSelected,
                        CONST.ONBOARDING_MESSAGES[onboardingPurposeSelected],
                        undefined,
                        undefined,
                        onboardingAdminsChatReportID ?? undefined,
                        onboardingPolicyID,
                        undefined,
                        onboardingCompanySize,
                        userReportedIntegration,
                    );

                    Welcome.setOnboardingAdminsChatReportID();
                    Welcome.setOnboardingPolicyID();

                    Navigation.dismissModal();

                    // Only navigate to concierge chat when central pane is visible
                    // Otherwise stay on the chats screen.
                    if (!shouldUseNarrowLayout && !route.params?.backTo) {
                        Report.navigateToConciergeChat();
                    }
                }}
                pressOnEnter
            />
        </>
    );

    return (
        <ScreenWrapper
            includeSafeAreaPaddingBottom={false}
            shouldEnableMaxHeight
            shouldEnableKeyboardAvoidingView
            testID="BaseOnboardingAccounting"
        >
            <View style={[styles.h100, styles.defaultModalContainer, shouldUseNativeStyles && styles.pt8]}>
                <HeaderWithBackButton
                    shouldShowBackButton
                    progressBarPercentage={75}
                    onBackButtonPress={OnboardingFlow.goBack}
                />
                <View style={[onboardingIsMediumOrLargerScreenWidth && styles.mt5, onboardingIsMediumOrLargerScreenWidth ? styles.mh8 : styles.mh5]}>
                    <View style={[onboardingIsMediumOrLargerScreenWidth ? styles.flexRow : styles.flexColumn, styles.mb3]}>
                        <Text style={[styles.textHeadlineH1]}>{translate('onboarding.accounting.title')}</Text>
                    </View>
                    <View style={[onboardingIsMediumOrLargerScreenWidth ? styles.flexRow : styles.flexColumn, styles.mb5]}>
                        <Text style={[styles.textNormalThemeText, styles.colorMuted]}>{translate('onboarding.accounting.description')}</Text>
                    </View>
                </View>
                <SelectionList
                    sections={[{data: accountingOptions}]}
                    onSelectRow={(item) => {
                        setUserReportedIntegration(item.keyForList);
                        setError('');
                    }}
                    shouldUpdateFocusedIndex
                    ListItem={RadioListItem}
                    footerContent={footerContent}
                    shouldShowTooltips={false}
                />
                {shouldUseNarrowLayout && <OfflineIndicator />}
            </View>
        </ScreenWrapper>
    );
}

BaseOnboardingAccounting.displayName = 'BaseOnboardingAccounting';

export default BaseOnboardingAccounting;
