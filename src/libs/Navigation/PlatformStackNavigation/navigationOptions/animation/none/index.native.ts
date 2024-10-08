import type {NativeStackNavigationOptions} from '@react-navigation/native-stack';
import Animations from '@libs/Navigation/PlatformStackNavigation/navigationOptions/animation/index';

const none: NativeStackNavigationOptions = {animation: Animations.NONE, gestureEnabled: false};

export default none;
