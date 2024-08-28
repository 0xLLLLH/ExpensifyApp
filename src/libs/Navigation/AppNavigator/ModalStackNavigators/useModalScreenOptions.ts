import type {StackCardInterpolationProps} from '@react-navigation/stack';
import {CardStyleInterpolators} from '@react-navigation/stack';
import {useMemo} from 'react';
import useStyleUtils from '@hooks/useStyleUtils';
import useThemeStyles from '@hooks/useThemeStyles';
import useWindowDimensions from '@hooks/useWindowDimensions';
import {isSafari} from '@libs/Browser';
import hideKeyboardOnSwipe from '@libs/Navigation/AppNavigator/hideKeyboardOnSwipe';
import type {PlatformStackNavigationOptions} from '@libs/Navigation/PlatformStackNavigation/types';
import createModalCardStyleInterpolator from '@navigation/AppNavigator/createModalCardStyleInterpolator';
import type {ThemeStyles} from '@src/styles';

function useModalScreenOptions(getScreenOptions?: (styles: ThemeStyles) => PlatformStackNavigationOptions) {
    const styles = useThemeStyles();
    const styleUtils = useStyleUtils();
    const {isSmallScreenWidth} = useWindowDimensions();

    let cardStyleInterpolator = CardStyleInterpolators.forHorizontalIOS;

    if (isSafari()) {
        const customInterpolator = createModalCardStyleInterpolator(styleUtils);
        cardStyleInterpolator = (props: StackCardInterpolationProps) => customInterpolator(isSmallScreenWidth, false, false, props);
    }

    const defaultSubRouteOptions = useMemo(
        (): PlatformStackNavigationOptions => ({
            ...hideKeyboardOnSwipe,
            headerShown: false,
            webOnly: {
                cardStyle: styles.navigationScreenCardStyle,
                cardStyleInterpolator,
            },
        }),
        [cardStyleInterpolator, styles.navigationScreenCardStyle],
    );

    return getScreenOptions?.(styles) ?? defaultSubRouteOptions;
}

export default useModalScreenOptions;
