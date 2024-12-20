import type {ForwardedRef} from 'react';
import React, {forwardRef, useState} from 'react';
import {View} from 'react-native';
import FormHelpMessage from '@components/FormHelpMessage';
import TextInput from '@components/TextInput';
import type {BaseTextInputRef} from '@components/TextInput/BaseTextInput/types';
import useLocalize from '@hooks/useLocalize';
import useNetwork from '@hooks/useNetwork';
import useThemeStyles from '@hooks/useThemeStyles';
import {workletizedParser} from '@libs/SearchAutocompleteUtils';
import shouldDelayFocus from '@libs/shouldDelayFocus';
import variables from '@styles/variables';
import CONST from '@src/CONST';
import type SearchRouterInputProps from './types';

function SearchRouterInput(
    {
        value,
        onSearchQueryChange,
        onSubmit = () => {},
        routerListRef,
        isFullWidth,
        disabled = false,
        shouldShowOfflineMessage = false,
        autoFocus = true,
        onFocus,
        onBlur,
        caretHidden = false,
        wrapperStyle,
        wrapperFocusedStyle,
        outerWrapperStyle,
        rightComponent,
        isSearchingForReports,
        selection,
    }: SearchRouterInputProps,
    ref: ForwardedRef<BaseTextInputRef>,
) {
    const styles = useThemeStyles();
    const {translate} = useLocalize();
    const [isFocused, setIsFocused] = useState<boolean>(false);
    const {isOffline} = useNetwork();
    const offlineMessage: string = isOffline && shouldShowOfflineMessage ? `${translate('common.youAppearToBeOffline')} ${translate('search.resultsAreLimited')}` : '';

    const inputWidth = isFullWidth ? styles.w100 : {width: variables.popoverWidth};

    return (
        <View style={[outerWrapperStyle]}>
            <View style={[styles.flexRow, styles.alignItemsCenter, wrapperStyle ?? styles.searchRouterTextInputContainer, isFocused && wrapperFocusedStyle]}>
                <View style={styles.flex1}>
                    <TextInput
                        testID="search-router-text-input"
                        value={value}
                        onChangeText={onSearchQueryChange}
                        autoFocus={autoFocus}
                        shouldDelayFocus={shouldDelayFocus}
                        caretHidden={caretHidden}
                        loadingSpinnerStyle={[styles.mt0, styles.mr2]}
                        role={CONST.ROLE.PRESENTATION}
                        placeholder={translate('search.searchPlaceholder')}
                        autoCapitalize="none"
                        autoCorrect={false}
                        spellCheck={false}
                        enterKeyHint="search"
                        accessibilityLabel={translate('search.searchPlaceholder')}
                        disabled={disabled}
                        onSubmitEditing={onSubmit}
                        shouldUseDisabledStyles={false}
                        textInputContainerStyles={[styles.borderNone, styles.pb0]}
                        inputStyle={[inputWidth, styles.p3]}
                        onFocus={() => {
                            setIsFocused(true);
                            routerListRef?.current?.updateExternalTextInputFocus(true);
                            onFocus?.();
                        }}
                        onBlur={() => {
                            setIsFocused(false);
                            routerListRef?.current?.updateExternalTextInputFocus(false);
                            onBlur?.();
                        }}
                        isLoading={!!isSearchingForReports}
                        ref={ref}
                        isMarkdownEnabled
                        multiline={false}
                        parser={workletizedParser}
                        selection={selection}
                    />
                </View>
                {!!rightComponent && <View style={styles.pr3}>{rightComponent}</View>}
            </View>
            <FormHelpMessage
                style={styles.ph3}
                isError={false}
                message={offlineMessage}
            />
        </View>
    );
}

SearchRouterInput.displayName = 'SearchRouterInput';

export default forwardRef(SearchRouterInput);
