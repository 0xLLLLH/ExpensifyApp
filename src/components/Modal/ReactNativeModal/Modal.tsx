import React, {useCallback, useEffect, useRef, useState} from 'react';
import type {EmitterSubscription, PanResponderInstance, StyleProp, ViewStyle} from 'react-native';
import {Animated, BackHandler, DeviceEventEmitter, Dimensions, KeyboardAvoidingView, Modal, PanResponder, Platform, View} from 'react-native';
import {useSharedValue} from 'react-native-reanimated';
import Backdrop from './Backdrop';
import Container from './Container';
import styles from './modal.style';
import type {EnhancedGestureEvent} from './panResponders';
import {onMoveShouldSetPanResponder, onPanResponderMove, onPanResponderRelease, onStartShouldSetPanResponder} from './panResponders';
import type ModalProps from './types';
import type {AnimationEvent, Direction} from './types';
import {defaultProps} from './utils';

function ReactNativeModal(incomingProps: ModalProps) {
    const mergedProps = {...defaultProps, ...incomingProps};

    const {
        animationIn,
        animationOut,
        animationInTiming,
        animationOutTiming,
        backdropTransitionInTiming,
        backdropTransitionOutTiming,
        children,
        coverScreen,
        customBackdrop,
        hasBackdrop,
        backdropColor,
        backdropOpacity,
        useNativeDriver,
        isVisible,
        onBackButtonPress,
        onModalShow,
        testID,
        style,
        avoidKeyboard,
        ...props
    } = mergedProps;

    const [isVisibleState, setIsVisibleState] = useState(isVisible);
    const [isContainerOpen, setIsContainerOpen] = useState(false);
    const [isTransitioning, setIsTransitioning] = useState(false);
    const [deviceWidth, setDeviceWidth] = useState(Dimensions.get('window').width);
    const [deviceHeight, setDeviceHeight] = useState(Dimensions.get('window').height);
    const [pan, setPan] = useState<Animated.ValueXY>(new Animated.ValueXY());
    const [panResponder, setPanResponder] = useState<PanResponderInstance | null>(null);
    const [inSwipeClosingState, setInSwipeClosingState] = useState(false);
    const isSwipeable = !!props.swipeDirection;
    const shouldHideChildren = props.hideModalContentWhileAnimating && isContainerOpen && isTransitioning;
    const currentSwipingDirectionRef = useRef<Direction | null>(null);

    const setCurrentSwipingDirection = (direction: Direction | null) => {
        currentSwipingDirectionRef.current = direction;
    };

    const animEvt = useRef<AnimationEvent | null>(null);

    const setAnimEvt = (currentAnim: AnimationEvent | null): void => {
        animEvt.current = currentAnim;
    };

    const didUpdateDimensionsEmitter = useRef<EmitterSubscription | null>(null);

    const getDeviceHeight = () => props.deviceHeight ?? deviceHeight;
    const getDeviceWidth = () => props.deviceWidth ?? deviceWidth;
    const yOffset = useSharedValue<number>(0);
    const xOffset = useSharedValue<number>(0);

    const buildPanResponder = useCallback(() => {
        setPanResponder(
            PanResponder.create({
                onMoveShouldSetPanResponder: onMoveShouldSetPanResponder(props, setAnimEvt, setCurrentSwipingDirection, pan),
                onStartShouldSetPanResponder: (a, b) => onStartShouldSetPanResponder(props, setCurrentSwipingDirection)(a as EnhancedGestureEvent, b),
                onPanResponderMove: onPanResponderMove(
                    props,
                    currentSwipingDirectionRef,
                    setCurrentSwipingDirection,
                    setAnimEvt,
                    animEvt,
                    pan,
                    deviceHeight,
                    deviceWidth,
                    xOffset,
                    yOffset,
                    props.swipeDirection,
                ),
                onPanResponderRelease: onPanResponderRelease(props, currentSwipingDirectionRef, setInSwipeClosingState, pan, xOffset, yOffset),
            }),
        );
        // eslint-disable-next-line react-compiler/react-compiler, react-hooks/exhaustive-deps
    }, []);

    const handleDimensionsUpdate = () => {
        if (!(!props.deviceHeight && !props.deviceWidth)) {
            return;
        }

        const deviceWidthTemp = Dimensions.get('window').width;
        const deviceHeightTemp = Dimensions.get('window').height;
        if (deviceWidthTemp !== deviceWidth || deviceHeightTemp !== deviceHeight) {
            setDeviceWidth(deviceWidthTemp);
            setDeviceHeight(deviceHeightTemp);
        }
    };

    const onBackButtonPressHandler = () => {
        if (onBackButtonPress && isVisible) {
            onBackButtonPress();
            return true;
        }
        return false;
    };

    const handleTransition = () => {
        const shouldAnimate = isVisible !== isContainerOpen;

        if (shouldAnimate && !isTransitioning) {
            setIsTransitioning(true);
        }
    };

    const open = () => {
        if (isTransitioning) {
            return;
        }

        if (props.onModalWillShow) {
            props.onModalWillShow();
        }
        setIsVisibleState(true);
        handleTransition();
    };

    const close = () => {
        if (isTransitioning) {
            return;
        }

        if (inSwipeClosingState) {
            setInSwipeClosingState(false);
        }

        if (props.onModalWillHide) {
            props.onModalWillHide();
        }

        setIsVisibleState(false);
        handleTransition();
    };

    useEffect(() => {
        if (!isSwipeable) {
            return;
        }

        setPan(new Animated.ValueXY());
        buildPanResponder();
    }, [isSwipeable, buildPanResponder]);

    useEffect(() => {
        didUpdateDimensionsEmitter.current = DeviceEventEmitter.addListener('didUpdateDimensions', handleDimensionsUpdate);
        BackHandler.addEventListener('hardwareBackPress', onBackButtonPressHandler);

        return () => {
            BackHandler.removeEventListener('hardwareBackPress', onBackButtonPressHandler);
            if (didUpdateDimensionsEmitter.current) {
                didUpdateDimensionsEmitter.current.remove();
            }
            if (isVisibleState) {
                props.onModalHide?.();
            }
        };
        // eslint-disable-next-line react-compiler/react-compiler, react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (isVisible && !isContainerOpen && !isTransitioning) {
            open();
        } else if (!isVisible && isContainerOpen && !isTransitioning) {
            close();
        }
        // TODO: verify if this dependency array is OK
        // eslint-disable-next-line react-compiler/react-compiler, react-hooks/exhaustive-deps
    }, [isVisible, isContainerOpen]);

    // eslint-disable-next-line @typescript-eslint/naming-convention
    const {propagateSwipe: _, ...otherProps} = props;

    const computedStyle: Array<StyleProp<ViewStyle>> = [{margin: getDeviceWidth() * 0.05}, styles.content, style];

    const containerView = (
        <Container
            animationIn={animationIn}
            animationOut={animationOut}
            animationInTiming={animationInTiming}
            animationOutTiming={animationOutTiming}
            isVisible={isVisibleState}
            style={[computedStyle]}
            panPosition={isSwipeable ? {translateX: xOffset, translateY: yOffset} : undefined}
            pointerEvents="box-none"
            useNativeDriver={useNativeDriver}
            onOpenCallBack={() => {
                setIsContainerOpen(true);
                setIsTransitioning(false);
            }}
            onCloseCallBack={() => {
                setIsContainerOpen(false);
                setIsTransitioning(false);
            }}
            // eslint-disable-next-line react/jsx-props-no-spreading
            {...(isSwipeable && panResponder ? panResponder.panHandlers : {})}
            // eslint-disable-next-line react/jsx-props-no-spreading
            {...otherProps}
        >
            {shouldHideChildren ? <View /> : children}
        </Container>
    );

    if (!coverScreen && isVisibleState) {
        return (
            <View
                pointerEvents="box-none"
                style={[styles.backdrop, styles.containerBox]}
            >
                {isVisible && (
                    <>
                        <Backdrop
                            getDeviceWidth={getDeviceWidth}
                            getDeviceHeight={getDeviceHeight}
                            backdropColor={backdropColor}
                            customBackdrop={customBackdrop}
                            hasBackdrop={hasBackdrop}
                            backdropOpacity={backdropOpacity}
                            onBackdropPress={props.onBackdropPress}
                        />
                        {containerView}
                    </>
                )}
            </View>
        );
    }

    return (
        <Modal
            transparent
            animationType="none"
            visible={isVisibleState || isTransitioning || isContainerOpen !== isVisibleState}
            onRequestClose={onBackButtonPress}
            testID={testID}
            // eslint-disable-next-line react/jsx-props-no-spreading
            {...otherProps}
        >
            {isVisible && (
                <Backdrop
                    getDeviceWidth={getDeviceWidth}
                    getDeviceHeight={getDeviceHeight}
                    backdropColor={backdropColor}
                    customBackdrop={customBackdrop}
                    hasBackdrop={hasBackdrop}
                    backdropOpacity={backdropOpacity}
                    onBackdropPress={props.onBackdropPress}
                />
            )}

            {avoidKeyboard ? (
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                    pointerEvents="box-none"
                    style={computedStyle.concat([{margin: 0}])}
                >
                    {isVisible && containerView}
                </KeyboardAvoidingView>
            ) : (
                isVisible && containerView
            )}
        </Modal>
    );
}

export default ReactNativeModal;
