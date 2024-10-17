import type {StackScreenProps} from '@react-navigation/stack';
import React, {useCallback, useEffect, useRef} from 'react';
import {View} from 'react-native';
import {useOnyx} from 'react-native-onyx';
import HeaderWithBackButton from '@components/HeaderWithBackButton';
import type {AnimatedTextInputRef} from '@components/RNTextInput';
import ScreenWrapper from '@components/ScreenWrapper';
import Text from '@components/Text';
import ValidateCodeForm from '@components/ValidateCodeActionModal/ValidateCodeForm';
import useLocalize from '@hooks/useLocalize';
import useSafePaddingBottomStyle from '@hooks/useSafePaddingBottomStyle';
import useThemeStyles from '@hooks/useThemeStyles';
import * as ErrorUtils from '@libs/ErrorUtils';
import Navigation from '@libs/Navigation/Navigation';
import type {SettingsNavigatorParamList} from '@libs/Navigation/types';
import * as User from '@userActions/User';
import ONYXKEYS from '@src/ONYXKEYS';
import ROUTES from '@src/ROUTES';
import type SCREENS from '@src/SCREENS';

type VerifyAccountPageProps = StackScreenProps<SettingsNavigatorParamList, typeof SCREENS.SETTINGS.PROFILE.NEW_CONTACT_METHOD>;

function VerifyAccountPage({route}: VerifyAccountPageProps) {
    const [account] = useOnyx(ONYXKEYS.ACCOUNT);
    const [user] = useOnyx(ONYXKEYS.USER);
    const [loginList] = useOnyx(ONYXKEYS.LOGIN_LIST);
    const contactMethod = account?.primaryLogin ?? '';
    const themeStyles = useThemeStyles();
    const {translate} = useLocalize();
    const safePaddingBottomStyle = useSafePaddingBottomStyle();
    const loginInputRef = useRef<AnimatedTextInputRef>(null);
    const loginData = loginList?.[contactMethod];
    const styles = useThemeStyles();
    const validateLoginError = ErrorUtils.getEarliestErrorField(loginData, 'validateLogin');
    const [accountID] = useOnyx(ONYXKEYS.SESSION, {selector: (session) => session?.accountID ?? 0});
    const [validateCodeAction] = useOnyx(ONYXKEYS.VALIDATE_ACTION_CODE);

    // We store validated state in two places so this is a bit of a workaround to check both
    const isUserValidated = user?.validated ?? false;
    const isAccountValidated = account?.validated ?? false;
    const isValidated = isUserValidated || isAccountValidated;

    const navigateBackTo = route?.params?.backTo ?? ROUTES.SETTINGS_WALLET;

    useEffect(() => {
        User.requestValidateCodeAction();
        return () => User.clearUnvalidatedNewContactMethodAction();
    }, []);

    const handleSubmitForm = useCallback(
        (validateCode: string) => {
            User.validateLogin(accountID ?? 0, validateCode);
        },
        [accountID],
    );

    const clearError = useCallback(() => {
        User.clearContactMethodErrors(contactMethod, 'validateLogin');
    }, [contactMethod]);

    useEffect(() => {
        if (!isValidated) {
            return;
        }
        Navigation.navigate(navigateBackTo);
    }, [isValidated, navigateBackTo]);

    return (
        <ScreenWrapper
            onEntryTransitionEnd={() => loginInputRef.current?.focus()}
            includeSafeAreaPaddingBottom={false}
            shouldEnableMaxHeight
            testID={VerifyAccountPage.displayName}
        >
            <HeaderWithBackButton
                title={translate('contacts.validateAccount')}
                onBackButtonPress={() => Navigation.goBack(ROUTES.SETTINGS_WALLET)}
            />
            <View style={[themeStyles.ph5, themeStyles.mt3, themeStyles.mb7, styles.flex1]}>
                <Text style={[themeStyles.mb3]}>{translate('contacts.featureRequiresValidate')}</Text>
                <ValidateCodeForm
                    validateCodeAction={validateCodeAction}
                    validateError={validateLoginError}
                    handleSubmitForm={handleSubmitForm}
                    clearError={clearError}
                    buttonStyles={[styles.justifyContentEnd, styles.flex1, safePaddingBottomStyle]}
                />
            </View>
        </ScreenWrapper>
    );
}

VerifyAccountPage.displayName = 'VerifyAccountPage';

export default VerifyAccountPage;
